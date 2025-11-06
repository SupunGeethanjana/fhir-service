import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { FhirResourceType } from '../../../common/enums/fhir-enums';
import { FhirResourceService } from '../../../fhir-generics/fhir-resource-service.interface';
import { DuplicateCheckResult, ProcessedResourcesMap } from '../handlers/transaction-operation-handler.service';

/**
 * Service responsible for resource merging and duplicate detection logic
 */
@Injectable()
export class TransactionResourceMergeService {
    private readonly logger = new Logger(TransactionResourceMergeService.name);

    /**
     * Checks for duplicate resources within the bundle and in the database
     */
    async checkForDuplicates(
        resource: any,
        processedResources: ProcessedResourcesMap,
        service: FhirResourceService,
        transactionalManager: EntityManager
    ): Promise<DuplicateCheckResult> {
        const duplicateKey = this.generateDuplicateKey(resource);

        if (!duplicateKey) {
            return { isDuplicate: false };
        }

        // Check if already processed in this bundle
        if (processedResources.has(duplicateKey)) {
            const existingMapping = processedResources.get(duplicateKey);
            return {
                isDuplicate: true,
                existingResourceId: existingMapping.id,
                duplicateKey
            };
        }

        // Check for duplicates in database (only for Patient resources currently)
        if (resource.resourceType === FhirResourceType.PATIENT) {
            const existingPatient = await this.findExistingPatient(resource, transactionalManager);
            if (existingPatient) {
                // Check if the new resource has additional information worth updating
                const shouldUpdate = this.shouldUpdateExistingPatient(existingPatient, resource);

                return {
                    isDuplicate: true,
                    existingResourceId: existingPatient.id,
                    duplicateKey,
                    shouldUpdate,
                    existingResource: existingPatient
                };
            }
        }

        return { isDuplicate: false };
    }

    /**
     * Merges new patient data with existing patient data intelligently
     */
    mergePatientData(existingPatient: any, newPatient: any): any {
        const merged = { ...existingPatient };

        // Merge identifiers (add new ones, keep existing)
        if (newPatient.identifier) {
            merged.identifier = this.mergeIdentifiers(existingPatient.identifier || [], newPatient.identifier);
        }

        // Merge names (add new ones, keep existing)
        if (newPatient.name) {
            merged.name = this.mergeNames(existingPatient.name || [], newPatient.name);
        }

        // Merge contact information
        if (newPatient.telecom) {
            merged.telecom = this.mergeTelecom(existingPatient.telecom || [], newPatient.telecom);
        }

        // Merge addresses
        if (newPatient.address) {
            merged.address = this.mergeAddresses(existingPatient.address || [], newPatient.address);
        }

        // Update demographics if missing in existing patient
        if (!existingPatient.birthDate && newPatient.birthDate) {
            merged.birthDate = newPatient.birthDate;
        }

        if (!existingPatient.gender && newPatient.gender) {
            merged.gender = newPatient.gender;
        }

        // Update other missing fields
        ['maritalStatus', 'communication', 'generalPractitioner', 'managingOrganization'].forEach(field => {
            if (!existingPatient[field] && newPatient[field]) {
                merged[field] = newPatient[field];
            }
        });

        return merged;
    }

    /**
     * Merges patch data with existing resource data intelligently
     */
    mergePatchData(existingResource: any, patchData: any): any {
        // Start with existing resource as base
        const merged = { ...existingResource };

        // Iterate through patch data and apply changes
        for (const key in patchData) {
            if (!Object.prototype.hasOwnProperty.call(patchData, key)) {
                continue;
            }

            const patchValue = patchData[key];
            const existingValue = merged[key];

            // Skip resourceType and meta fields in patch
            if (key === 'resourceType') {
                continue;
            }

            // Handle special FHIR fields
            if (key === 'id') {
                merged.id = patchValue;
                continue;
            }

            // Handle arrays with intelligent merging
            if (Array.isArray(patchValue)) {
                merged[key] = this.mergePatchArrayField(existingValue, patchValue, key);
            }
            // Handle objects with deep merge
            else if (typeof patchValue === 'object' && patchValue !== null) {
                if (typeof existingValue === 'object' && existingValue !== null) {
                    merged[key] = this.mergePatchObjectField(existingValue, patchValue);
                } else {
                    merged[key] = patchValue;
                }
            }
            // Handle primitive values (replace)
            else {
                merged[key] = patchValue;
            }
        }

        // Preserve FHIR meta information and update it
        if (merged.meta) {
            merged.meta = {
                ...merged.meta,
                lastUpdated: new Date().toISOString()
            };
        }

        return merged;
    }

    /**
     * Retrieves an existing resource by ID using the appropriate service
     */
    async getExistingResource(
        service: FhirResourceService,
        resourceId: string,
        transactionalManager: EntityManager
    ): Promise<any> {
        try {
            return await service.findById(resourceId, {
                manager: transactionalManager,
            });
        } catch (error) {
            if (this.isResourceNotFoundError(error)) {
                return null;
            }
            throw error;
        }
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

    /**
     * Finds existing patient in database based on identifiers and returns full resource data
     */
    private async findExistingPatient(patient: any, transactionalManager: EntityManager): Promise<any> {
        if (!patient.identifier || !Array.isArray(patient.identifier)) {
            return null;
        }

        try {
            // Query the patient repository directly using the transaction manager
            for (const identifier of patient.identifier) {
                if (identifier.system && identifier.value) {
                    // Use raw query to find existing patient by identifier with full data
                    const existingPatients = await transactionalManager.query(`
                        SELECT id, resource FROM fhir.patient 
                        WHERE resource @> $1
                        LIMIT 1
                    `, [JSON.stringify({
                        identifier: [{ system: identifier.system, value: identifier.value }]
                    })]);

                    if (existingPatients && existingPatients.length > 0) {
                        return {
                            id: existingPatients[0].id,
                            ...existingPatients[0].resource
                        };
                    }
                }
            }

            return null;
        } catch (error) {
            this.logger.warn('Error checking for existing patient', { error: error.message });
            return null;
        }
    }

    /**
     * Determines if an existing patient should be updated with new information
     */
    private shouldUpdateExistingPatient(existingPatient: any, newPatient: any): boolean {
        // Check if new patient has additional information not present in existing patient

        // Check for new or updated contact information
        if (this.hasNewContactInfo(existingPatient, newPatient)) {
            return true;
        }

        // Check for new or updated addresses
        if (this.hasNewAddressInfo(existingPatient, newPatient)) {
            return true;
        }

        // Check for new identifiers
        if (this.hasNewIdentifiers(existingPatient, newPatient)) {
            return true;
        }

        // Check for new or updated names
        if (this.hasNewNameInfo(existingPatient, newPatient)) {
            return true;
        }

        // Check for missing demographic information
        if (this.hasMissingDemographics(existingPatient, newPatient)) {
            return true;
        }

        return false;
    }

    /**
     * Helper methods for checking new information
     */
    private hasNewContactInfo(existing: any, newPatient: any): boolean {
        if (!newPatient.telecom || !Array.isArray(newPatient.telecom)) return false;
        if (!existing.telecom || !Array.isArray(existing.telecom)) return true;

        return newPatient.telecom.some(newTelecom =>
            !existing.telecom.some(existingTelecom =>
                existingTelecom.system === newTelecom.system &&
                existingTelecom.value === newTelecom.value
            )
        );
    }

    private hasNewAddressInfo(existing: any, newPatient: any): boolean {
        if (!newPatient.address || !Array.isArray(newPatient.address)) return false;
        if (!existing.address || !Array.isArray(existing.address)) return true;

        return newPatient.address.some(newAddr =>
            !existing.address.some(existingAddr =>
                JSON.stringify(existingAddr) === JSON.stringify(newAddr)
            )
        );
    }

    private hasNewIdentifiers(existing: any, newPatient: any): boolean {
        if (!newPatient.identifier || !Array.isArray(newPatient.identifier)) return false;
        if (!existing.identifier || !Array.isArray(existing.identifier)) return true;

        return newPatient.identifier.some(newId =>
            !existing.identifier.some(existingId =>
                existingId.system === newId.system && existingId.value === newId.value
            )
        );
    }

    private hasNewNameInfo(existing: any, newPatient: any): boolean {
        if (!newPatient.name || !Array.isArray(newPatient.name)) return false;
        if (!existing.name || !Array.isArray(existing.name)) return true;

        return newPatient.name.some(newName =>
            !existing.name.some(existingName =>
                JSON.stringify(existingName) === JSON.stringify(newName)
            )
        );
    }

    private hasMissingDemographics(existing: any, newPatient: any): boolean {
        return (!existing.birthDate && newPatient.birthDate) ||
            (!existing.gender && newPatient.gender) ||
            (!existing.maritalStatus && newPatient.maritalStatus);
    }

    /**
     * Helper methods for merging arrays
     */
    private mergeIdentifiers(existing: any[], newItems: any[]): any[] {
        const merged = [...existing];
        newItems.forEach(newItem => {
            if (!existing.some(existing =>
                existing.system === newItem.system && existing.value === newItem.value
            )) {
                merged.push(newItem);
            }
        });
        return merged;
    }

    private mergeNames(existing: any[], newItems: any[]): any[] {
        const merged = [...existing];
        newItems.forEach(newItem => {
            if (!existing.some(existing =>
                JSON.stringify(existing) === JSON.stringify(newItem)
            )) {
                merged.push(newItem);
            }
        });
        return merged;
    }

    private mergeTelecom(existing: any[], newItems: any[]): any[] {
        const merged = [...existing];
        newItems.forEach(newItem => {
            if (!existing.some(existing =>
                existing.system === newItem.system && existing.value === newItem.value
            )) {
                merged.push(newItem);
            }
        });
        return merged;
    }

    private mergeAddresses(existing: any[], newItems: any[]): any[] {
        const merged = [...existing];
        newItems.forEach(newItem => {
            if (!existing.some(existing =>
                JSON.stringify(existing) === JSON.stringify(newItem)
            )) {
                merged.push(newItem);
            }
        });
        return merged;
    }

    /**
     * Merges array fields in patch operations with intelligent logic
     */
    private mergePatchArrayField(existingArray: any[], patchArray: any[], fieldName: string): any[] {
        if (!Array.isArray(existingArray)) {
            return patchArray;
        }

        // For specific FHIR fields, use intelligent merging
        switch (fieldName) {
            case 'identifier':
                return this.mergeIdentifiers(existingArray, patchArray);
            case 'name':
                return this.mergeNames(existingArray, patchArray);
            case 'telecom':
                return this.mergeTelecom(existingArray, patchArray);
            case 'address':
                return this.mergeAddresses(existingArray, patchArray);
            case 'contact':
            case 'communication':
                // For contact and communication, merge intelligently
                return this.mergeComplexArrays(existingArray, patchArray);
            default:
                // For other arrays, replace completely or merge based on context
                return this.mergeGenericArrays(existingArray, patchArray);
        }
    }

    /**
     * Merges object fields in patch operations
     */
    private mergePatchObjectField(existingObject: any, patchObject: any): any {
        const merged = { ...existingObject };

        for (const key in patchObject) {
            if (Object.prototype.hasOwnProperty.call(patchObject, key)) {
                const patchValue = patchObject[key];
                const existingValue = merged[key];

                if (typeof patchValue === 'object' && patchValue !== null && !Array.isArray(patchValue)) {
                    if (typeof existingValue === 'object' && existingValue !== null && !Array.isArray(existingValue)) {
                        merged[key] = this.mergePatchObjectField(existingValue, patchValue);
                    } else {
                        merged[key] = patchValue;
                    }
                } else {
                    merged[key] = patchValue;
                }
            }
        }

        return merged;
    }

    /**
     * Merges complex arrays by comparing key fields
     */
    private mergeComplexArrays(existingArray: any[], patchArray: any[]): any[] {
        const merged = [...existingArray];

        patchArray.forEach(patchItem => {
            const existingIndex = merged.findIndex(existing => {
                // Try to match by common identifying fields
                if (patchItem.id && existing.id) {
                    return patchItem.id === existing.id;
                }
                // For complex objects, use JSON comparison as fallback
                return JSON.stringify(existing) === JSON.stringify(patchItem);
            });

            if (existingIndex >= 0) {
                // Update existing item
                merged[existingIndex] = this.mergePatchObjectField(merged[existingIndex], patchItem);
            } else {
                // Add new item
                merged.push(patchItem);
            }
        });

        return merged;
    }

    /**
     * Merges generic arrays (default behavior is to replace)
     */
    private mergeGenericArrays(existingArray: any[], patchArray: any[]): any[] {
        // For most arrays in PATCH operations, we replace the entire array
        // This is the standard FHIR PATCH behavior for most fields
        return patchArray;
    }

    /**
     * Determines if an error indicates that a resource was not found
     */
    private isResourceNotFoundError(error: any): boolean {
        // Check for common "not found" error patterns
        if (error.status === 404 || error.statusCode === 404) {
            return true;
        }

        // Check error message patterns
        const errorMessage = error.message?.toLowerCase() || '';
        const notFoundPatterns = [
            'not found',
            'does not exist',
            'resource not found',
            'entity not found',
            'no entity found'
        ];

        return notFoundPatterns.some(pattern => errorMessage.includes(pattern));
    }
}
