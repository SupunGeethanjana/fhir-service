import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
    FhirResourceType,
    HttpStatusDescription
} from '../../../common/enums/fhir-enums';
import { FhirResourceService } from '../../../fhir-generics/fhir-resource-service.interface';

/**
 * Interface for tracking duplicate detection within a bundle
 */
export interface DuplicateCheckResult {
    isDuplicate: boolean;
    existingResourceId?: string;
    duplicateKey?: string;
    shouldUpdate?: boolean;
    existingResource?: any;
}

/**
 * Interface for mapping temporary bundle IDs to permanent resource IDs
 */
export interface ResourceIdMapping {
    id: string;
    resourceType: string;
}

/**
 * Type alias for the ID mapping structure
 */
export type IdMap = Map<string, ResourceIdMapping>;

/**
 * Type alias for tracking processed resources to prevent duplicates
 */
export type ProcessedResourcesMap = Map<string, ResourceIdMapping>;

/**
 * Response entry structure for transaction bundle responses
 */
export interface TransactionResponseEntry {
    response: {
        status: string;
        location?: string;
    };
    resource?: any; //actual saved resource
}

/**
 * Constants for the transaction service
 */
export const TRANSACTION_CONSTANTS = {
    BUNDLE_RESOURCE_TYPE: FhirResourceType.BUNDLE,
    TRANSACTION_RESPONSE_TYPE: 'transaction-response',
    URN_UUID_PREFIX: 'urn:uuid:',
    HTTP_STATUS: {
        CREATED: HttpStatusDescription.CREATED,
        OK: HttpStatusDescription.OK,
        NO_CONTENT: HttpStatusDescription.NO_CONTENT,
    },
} as const;

/**
 * Supported HTTP methods for FHIR bundle operations
 */
export enum SupportedHttpMethods {
    POST = 'POST',
    PUT = 'PUT',
    PATCH = 'PATCH',
    DELETE = 'DELETE'
}

/**
 * Service responsible for handling individual transaction operations (CRUD)
 */
@Injectable()
export class TransactionOperationHandlerService {
    private readonly logger = new Logger(TransactionOperationHandlerService.name);

    /**
     * Handles CREATE (POST) operations for transaction entries with duplicate detection and smart updates
     */
    async handleCreateOperation(
        resource: any,
        service: FhirResourceService,
        fullUrl: string,
        idMap: IdMap,
        processedResources: ProcessedResourcesMap,
        txid: string,
        transactionalManager: EntityManager,
        duplicateDetectionCallback: (resource: any, processedResources: ProcessedResourcesMap, service: FhirResourceService, transactionalManager: EntityManager) => Promise<DuplicateCheckResult>,
        mergeResourceCallback: (existingResource: any, newResource: any) => any
        , includeResourceInResponse = false
    ): Promise<TransactionResponseEntry> {
        // Check for duplicates within this bundle and in the database
        const duplicateCheck = await duplicateDetectionCallback(
            resource,
            processedResources,
            service,
            transactionalManager
        );

        if (duplicateCheck.isDuplicate) {
            this.logger.log(`Duplicate ${resource.resourceType} detected for txid ${txid}`, {
                duplicateKey: duplicateCheck.duplicateKey,
                existingResourceId: duplicateCheck.existingResourceId,
                shouldUpdate: duplicateCheck.shouldUpdate
            });

            // Use existing resource ID for mapping
            const existingMapping = {
                id: duplicateCheck.existingResourceId,
                resourceType: resource.resourceType
            };

            // Store the mapping for future reference resolution
            idMap.set(fullUrl, existingMapping);

            // If we should update the existing resource with new information
            if (duplicateCheck.shouldUpdate && duplicateCheck.existingResource) {
                try {
                    // Merge new data with existing resource
                    const mergedResource = mergeResourceCallback(duplicateCheck.existingResource, resource);

                    // Update the existing resource with merged data
                    const updatedResource = await service.update(duplicateCheck.existingResourceId, mergedResource, {
                        txid: txid,
                        manager: transactionalManager,
                    });

                    this.logger.log(`Updated ${resource.resourceType} ${duplicateCheck.existingResourceId} with new information for txid ${txid}`);

                    return {
                        response: {
                            status: TRANSACTION_CONSTANTS.HTTP_STATUS.OK,
                            location: `${resource.resourceType}/${updatedResource.id}/_history/${updatedResource.meta.versionId}`,
                        },
                        ...(includeResourceInResponse ? { resource: updatedResource } : {}),
                    };
                } catch (updateError) {
                    this.logger.warn(`Failed to update existing ${resource.resourceType}, using existing version`, {
                        error: updateError.message,
                        resourceId: duplicateCheck.existingResourceId
                    });

                    // Fall back to returning existing resource without update
                    return {
                        response: {
                            status: TRANSACTION_CONSTANTS.HTTP_STATUS.OK,
                            location: `${resource.resourceType}/${duplicateCheck.existingResourceId}`,
                        },
                        ...(includeResourceInResponse ? { resource: duplicateCheck.existingResource } : {}),
                    };
                }
            } else {
                // Return existing resource without update
                return {
                    response: {
                        status: TRANSACTION_CONSTANTS.HTTP_STATUS.OK,
                        location: `${resource.resourceType}/${duplicateCheck.existingResourceId}`,
                    },
                    ...(includeResourceInResponse ? { resource: duplicateCheck.existingResource } : {}),
                };
            }
        }

        // Create new resource if no duplicate found
        const newId = uuidv4();

        this.logger.debug(`Resource before create (should have all references resolved)`, {
            resourceType: resource.resourceType,
            id: resource.id,
            resource: JSON.stringify(resource)
        });

        const newResource = await service.create(resource, {
            id: newId,
            txid: txid,
            manager: transactionalManager,
        });


        // Store the mapping for future reference resolution
        const newMapping = { id: newId, resourceType: newResource.resourceType };
        idMap.set(fullUrl, newMapping);
        // Always map by resourceType/id and urn:uuid:id if resource.id is present
        if (resource.id) {
            idMap.set(`${resource.resourceType}/${resource.id}`, newMapping);
            idMap.set(`urn:uuid:${resource.id}`, newMapping);
        }

        // Track this resource to prevent duplicates later in the same bundle
        const duplicateKey = this.generateDuplicateKey(resource);
        if (duplicateKey) {
            processedResources.set(duplicateKey, newMapping);
        }

        return {
            response: {
                status: TRANSACTION_CONSTANTS.HTTP_STATUS.CREATED,
                location: `${newResource.resourceType}/${newResource.id}/_history/${newResource.meta.versionId}`,
            },
            ...(includeResourceInResponse ? { resource: newResource } : {}),
        };
    }

    /**
     * Handles UPDATE (PUT) operations for transaction entries
     */
    async handleUpdateOperation(
        resource: any,
        service: FhirResourceService,
        requestUrl: string,
        fullUrl: string,
        idMap: IdMap,
        txid: string,
        transactionalManager: EntityManager,
        extractResourceIdCallback: (requestUrl: string, resourceType: string) => string | null,
        isResourceNotFoundCallback: (error: any) => boolean,
        includeResourceInResponse = false
    ): Promise<TransactionResponseEntry> {
        // Extract resource ID from the request URL
        const resourceId = extractResourceIdCallback(requestUrl, resource.resourceType);

        if (!resourceId) {
            throw new Error(
                `Invalid PUT request URL: ${requestUrl}. Expected format: ${resource.resourceType}/[id]`
            );
        }

        this.logger.log(`Updating ${resource.resourceType} with ID ${resourceId} for txid ${txid}`);

        try {
            // Ensure the resource has the correct ID
            resource.id = resourceId;

            // Update the existing resource
            const updatedResource = await service.update(resourceId, resource, {
                txid: txid,
                manager: transactionalManager,
            });

            // Store the mapping for future reference resolution
            const mapping = { id: resourceId, resourceType: resource.resourceType };
            idMap.set(fullUrl, mapping);

            this.logger.log(`Successfully updated ${resource.resourceType} ${resourceId} for txid ${txid}`);

            return {
                response: {
                    status: TRANSACTION_CONSTANTS.HTTP_STATUS.OK,
                    location: `${resource.resourceType}/${updatedResource.id}/_history/${updatedResource.meta.versionId}`,
                },
                ...(includeResourceInResponse ? { resource: updatedResource } : {}),
            };
        } catch (error) {
            // Check if the error indicates the resource doesn't exist
            if (isResourceNotFoundCallback(error)) {
                this.logger.warn(`Resource ${resource.resourceType}/${resourceId} not found, treating as create operation for txid ${txid}`);

                // Perform an "upsert" - create the resource with the specified ID
                const newResource = await service.create(resource, {
                    id: resourceId,
                    txid: txid,
                    manager: transactionalManager,
                });

                // Store the mapping for future reference resolution
                const mapping = { id: resourceId, resourceType: resource.resourceType };
                idMap.set(fullUrl, mapping);

                return {
                    response: {
                        status: TRANSACTION_CONSTANTS.HTTP_STATUS.CREATED,
                        location: `${newResource.resourceType}/${newResource.id}/_history/${newResource.meta.versionId}`,
                    },
                    ...(includeResourceInResponse ? { resource: newResource } : {}),
                };
            }

            // Re-throw other errors
            throw error;
        }
    }

    /**
     * Handles PATCH operations for transaction entries
     */
    async handlePatchOperation(
        patchData: any,
        service: FhirResourceService,
        requestUrl: string,
        fullUrl: string,
        idMap: IdMap,
        txid: string,
        transactionalManager: EntityManager,
        extractResourceIdCallback: (requestUrl: string, resourceType: string) => string | null,
        getExistingResourceCallback: (service: FhirResourceService, resourceId: string, transactionalManager: EntityManager) => Promise<any>,
        mergePatchDataCallback: (existingResource: any, patchData: any) => any,
        includeResourceInResponse = false
    ): Promise<TransactionResponseEntry> {
        // Extract resource ID from the request URL
        const resourceId = extractResourceIdCallback(requestUrl, patchData.resourceType);

        if (!resourceId) {
            throw new Error(
                `Invalid PATCH request URL: ${requestUrl}. Expected format: ${patchData.resourceType}/[id]`
            );
        }

        this.logger.log(`Patching ${patchData.resourceType} with ID ${resourceId} for txid ${txid}`);

        // First, retrieve the existing resource
        const existingResource = await getExistingResourceCallback(service, resourceId, transactionalManager);

        if (!existingResource) {
            throw new Error(
                `Resource ${patchData.resourceType}/${resourceId} not found for PATCH operation`
            );
        }

        // Ensure the patch data has the correct ID
        patchData.id = resourceId;

        // Perform intelligent merging of patch data with existing resource
        const mergedResource = mergePatchDataCallback(existingResource, patchData);

        // Update the resource with merged data
        const updatedResource = await service.update(resourceId, mergedResource, {
            txid: txid,
            manager: transactionalManager,
        });

        // Store the mapping for future reference resolution
        const mapping = { id: resourceId, resourceType: patchData.resourceType };
        idMap.set(fullUrl, mapping);

        this.logger.log(`Successfully patched ${patchData.resourceType} ${resourceId} for txid ${txid}`);

        return {
            response: {
                status: TRANSACTION_CONSTANTS.HTTP_STATUS.OK,
                location: `${patchData.resourceType}/${updatedResource.id}/_history/${updatedResource.meta.versionId}`,
            },
            ...(includeResourceInResponse ? { resource: updatedResource } : {}),
        };
    }

    /**
     * Handles DELETE operations for transaction entries
     */
    async handleDeleteOperation(
        service: FhirResourceService,
        requestUrl: string,
        resourceType: string,
        txid: string,
        transactionalManager: EntityManager,
        extractResourceIdCallback: (requestUrl: string, resourceType: string) => string | null,
        getExistingResourceCallback: (service: FhirResourceService, resourceId: string, transactionalManager: EntityManager) => Promise<any>,
        includeResourceInResponse = false
    ): Promise<TransactionResponseEntry> {
        // Extract resource ID from the request URL
        const resourceId = extractResourceIdCallback(requestUrl, resourceType);

        if (!resourceId) {
            throw new Error(
                `Invalid DELETE request URL: ${requestUrl}. Expected format: ${resourceType}/[id]`
            );
        }

        this.logger.log(`Deleting ${resourceType} with ID ${resourceId} for txid ${txid}`);

        // First check if the resource exists
        const existingResource = await getExistingResourceCallback(service, resourceId, transactionalManager);

        if (!existingResource) {
            throw new Error(
                `Resource ${resourceType}/${resourceId} not found for DELETE operation`
            );
        }

        // Perform the deletion
        await service.delete(resourceId, {
            txid: txid,
            manager: transactionalManager,
        });

        this.logger.log(`Successfully deleted ${resourceType} ${resourceId} for txid ${txid}`);

        return {
            response: {
                status: TRANSACTION_CONSTANTS.HTTP_STATUS.NO_CONTENT,
            },
            ...(includeResourceInResponse ? { resource: existingResource ?? null } : {}),
        };
    }

    /**
     * Generates a unique key for duplicate detection based on resource content
     */
    private generateDuplicateKey(resource: any): string | null {
        if (resource.resourceType === FhirResourceType.PATIENT) {
            return this.generatePatientDuplicateKey(resource);
        }

        // Add duplicate key generation for other resource types as needed
        return null;
    }

    /**
     * Generates duplicate key for Patient resources based on identifiers
     */
    private generatePatientDuplicateKey(patient: any): string | null {
        if (!patient.identifier || !Array.isArray(patient.identifier)) {
            return null;
        }

        // Use the first identifier with system and value as duplicate key
        const primaryIdentifier = patient.identifier.find(id => id.system && id.value);
        if (primaryIdentifier) {
            return `Patient|${primaryIdentifier.system}|${primaryIdentifier.value}`;
        }

        return null;
    }
}
