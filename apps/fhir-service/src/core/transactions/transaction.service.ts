import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { BundleDto } from '../../common/dtos/budle.dto';
import { HttpMethod } from '../../common/enums/fhir-enums';
import { BundleLogService } from '../bundles/bundle-log.service';
import { TransactionDuplicateDetectionService } from './detectors/transaction-duplicate-detection.service';
import { TransactionErrorHandler } from './errors/transaction-error-handler';
import { TransactionOperationHandlerService } from './handlers/transaction-operation-handler.service';
import { TransactionResourceMergeService } from './mergers/transaction-resource-merge.service';
import { FhirResourceServiceRegistry } from './registries/fhir-resource-service-registry.service';
import { TransactionValidationService } from './validators/transaction-validation.service';

interface IdMapping {
    id: string;
    resourceType: string;
}

type IdMap = Map<string, IdMapping>;
type ProcessedResourcesMap = Map<string, IdMapping>;

interface TransactionResponseEntry {
    response: {
        status: string;
        location?: string;
        lastModified?: string;
    };
    resource?: any;
}

interface TransactionResponse {
    resourceType: 'Bundle';
    id: string;
    type: 'transaction-response';
    timestamp: string;
    entry: TransactionResponseEntry[];
}

/**
 * Service responsible for processing FHIR transaction bundles with comprehensive
 * duplicate detection, resource merging, and operation handling.
 * 
 * Architecture:
 * - TransactionValidationService: Bundle structure and entry validation
 * - TransactionDuplicateDetectionService: Bundle-level duplicate detection
 * - TransactionOperationHandlerService: CRUD operation handling  
 * - TransactionResourceMergeService: Resource merging and conflict resolution
 * - FhirResourceServiceRegistry: Centralized service management
 */
@Injectable()
export class TransactionService {
    private readonly logger = new Logger(TransactionService.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly bundleLogService: BundleLogService,
        private readonly validationService: TransactionValidationService,
        private readonly duplicateDetectionService: TransactionDuplicateDetectionService,
        private readonly operationHandlerService: TransactionOperationHandlerService,
        private readonly resourceMergeService: TransactionResourceMergeService,
        private readonly serviceRegistry: FhirResourceServiceRegistry
    ) { }

    /**
     * Processes a FHIR transaction bundle with comprehensive validation,
     * duplicate detection, and resource management
     */
    async processTransactionBundle(bundle: BundleDto, includeResourceInResponse = false): Promise<TransactionResponse> {
        // Step 0: Validate all external references exist in DB
        if (Array.isArray(bundle.entry)) {
            for (const entry of bundle.entry) {
                if (entry.resource) {
                    await this.validateExternalReferences(entry.resource);
                }
            }
        }
        // Generate transaction ID and log start
        const startTime = Date.now();
        const txid = uuidv4();
        this.logger.log('Starting transaction bundle processing', {
            txid,
            bundleId: bundle.id,
            entryCount: bundle.entry?.length || 0,
            bundleType: bundle.type
        });

        const bundleLog = await this.bundleLogService.createBundleLog(
            bundle,
            txid,
            new Date(startTime),
            {
                submittedBy: 'transaction-service',
                sourceSystem: 'fhir-service'
            }
        );
        try {
            this.validationService.validateBundleStructure(bundle, this.serviceRegistry.getServiceMap());
            const duplicateResult = await this.duplicateDetectionService.checkBundleDuplicate(bundle, bundleLog.id);
            if (duplicateResult.isDuplicate) {
                this.logger.error(`[DuplicateDetection] Duplicate bundle detected, rejecting request`, {
                    txid,
                    duplicateType: duplicateResult.duplicateType,
                    detectionMethod: duplicateResult.detectionMethod
                });
                //throw new BadRequestException('Duplicate bundle detected: this bundle has already been processed.');
            }
            const idMap: IdMap = new Map();
            if (Array.isArray(bundle.entry)) {
                for (const entry of bundle.entry) {
                    if (entry.fullUrl && entry.resource && entry.resource.resourceType) {
                        if (!idMap.has(entry.fullUrl)) {
                            const newId = uuidv4();
                            entry.resource.id = newId;
                            idMap.set(entry.fullUrl, {
                                id: newId,
                                resourceType: entry.resource.resourceType
                            });
                        } else {
                            const mapping = idMap.get(entry.fullUrl);
                            entry.resource.id = mapping.id;
                        }
                    }
                }
            }
            const result = await this.dataSource.transaction(async (transactionalManager) => {
                const processedResources: ProcessedResourcesMap = new Map();
                const responseEntries: TransactionResponseEntry[] = [];
                for (let i = 0; i < bundle.entry.length; i++) {
                    const entry = bundle.entry[i];
                    this.logger.debug(`Processing entry ${i + 1}/${bundle.entry.length}`, {
                        txid,
                        resourceType: entry.resource?.resourceType,
                        method: entry.request?.method
                    });
                    try {
                        // Substitute all urn:uuid references before processing
                        this.substituteReferences(entry.resource, idMap);

                        // Process the transaction entry and get the response
                        const responseEntry = await this.processTransactionEntry(
                            entry,
                            idMap,
                            processedResources,
                            txid,
                            transactionalManager,
                            i,
                            includeResourceInResponse
                        );

                        // Add the response entry to the list
                        responseEntries.push(responseEntry);
                    } catch (error) {
                        // Categorize the error with entry context
                        const categorizedError = TransactionErrorHandler.categorizeError(
                            error,
                            i,
                            entry.resource?.resourceType,
                            entry.resource?.id || entry.fullUrl
                        );
                        this.logger.error(`Transaction entry ${i} failed`, {
                            txid,
                            resourceType: entry.resource?.resourceType,
                            method: entry.request?.method,
                            error: categorizedError.details,
                            errorType: categorizedError.errorType
                        });
                        throw categorizedError;
                    }
                }
                const transactionResponse = this.createTransactionResponse(responseEntries);
                return transactionResponse;
            });
            await this.bundleLogService.markBundleSuccess(bundleLog.id, new Date(startTime));
            const processingTime = Date.now() - startTime;
            this.logger.log(`Transaction bundle processing completed successfully`, {
                txid,
                processingTimeMs: processingTime,
                entriesProcessed: bundle.entry.length
            });
            return result;
        } catch (error) {
            await this.bundleLogService.markBundleFailure(bundleLog.id, error, new Date(startTime));
            const processingTime = Date.now() - startTime;
            this.logger.error(`Transaction bundle processing failed`, {
                txid,
                error: error.message,
                processingTimeMs: processingTime,
                stack: error.stack
            });
            const categorizedError = TransactionErrorHandler.categorizeError(
                error,
                undefined, // Bundle-level error, no specific operation index
                'Bundle',
                txid
            );
            throw categorizedError;
        }
    }

    /**
     * Recursively checks all references in a resource for external references (e.g., Patient/uuid)
     * and verifies they exist in the database. Throws if any are missing.
     */
    private async validateExternalReferences(resource: any) {
        const checkReference = async (ref: string) => {
            // Log every reference value received
            this.logger.debug(`[ReferenceCheck] Received reference value: ${JSON.stringify(ref)}`);
            if (typeof ref === 'string') {
                // Skip urn:uuid:* references (internal bundle references)
                if (ref.startsWith('urn:uuid:')) {
                    this.logger.debug(`[ReferenceCheck] Skipping internal bundle reference: ${ref}`);
                    return;
                }
                const regex = /^[A-Za-z]+\/[0-9a-fA-F-]{36}$/;
                if (regex.test(ref)) {
                    const [resourceType, id] = ref.split('/');
                    const service = this.serviceRegistry.getServiceForResourceType(resourceType);
                    this.logger.debug(`[ReferenceCheck] Checking reference: ${ref} (type: ${resourceType}, id: ${id})`);
                    if (service) {
                        const found = await service.findById(id);
                        this.logger.debug(`[ReferenceCheck] DB lookup for ${ref}: ${found ? 'FOUND' : 'NOT FOUND'} (typeof found: ${typeof found})`);
                        if (!found) {
                            this.logger.error(`[ReferenceCheck] Reference not found in DB: ${ref}`);
                            throw new BadRequestException(`Referenced resource not found: ${ref}`);
                        }
                    } else {
                        this.logger.warn(`[ReferenceCheck] No service found for resourceType: ${resourceType}`);
                    }
                } else {
                    this.logger.error(`[ReferenceCheck] Reference value did not match expected format and is not an internal reference: ${ref}`);
                    throw new BadRequestException(`Malformed reference: ${ref}`);
                }
            } else {
                this.logger.debug(`[ReferenceCheck] Reference value is not a string and was skipped: ${JSON.stringify(ref)}`);
            }
        };
        const recurse = async (obj: any) => {
            if (Array.isArray(obj)) {
                for (const item of obj) {
                    await recurse(item);
                }
            } else if (obj && typeof obj === 'object') {
                for (const key of Object.keys(obj)) {
                    if (key === 'reference') {
                        this.logger.debug(`[ReferenceCheck] Recursing into reference key: ${key} value: ${obj[key]}`);
                        await checkReference(obj[key]);
                    } else {
                        await recurse(obj[key]);
                    }
                }
            }
        };
        this.logger.debug(`[ReferenceCheck] Starting recursive reference validation`);
        await recurse(resource);
        this.logger.debug(`[ReferenceCheck] Finished recursive reference validation`);
    }

    /**
     * Processes a single transaction entry using the operation handler service
     */
    private async processTransactionEntry(
        entry: any,
        idMap: IdMap,
        processedResources: ProcessedResourcesMap,
        txid: string,
        transactionalManager: EntityManager,
        index: number,
        includeResourceInResponse = false
    ): Promise<TransactionResponseEntry> {
        const { resource, request, fullUrl } = entry;

        const service = this.serviceRegistry.getServiceForResourceType(resource.resourceType);

        switch (request.method) {
            case HttpMethod.POST:
                return await this.operationHandlerService.handleCreateOperation(
                    resource,
                    service,
                    fullUrl,
                    idMap,
                    processedResources,
                    txid,
                    transactionalManager,
                    // Pass callbacks for dependencies
                    (res, procRes, svc, mgr) => this.resourceMergeService.checkForDuplicates(res, procRes, svc, mgr),
                    (existing, newRes) => this.resourceMergeService.mergePatientData(existing, newRes),
                    includeResourceInResponse
                );
            case HttpMethod.PUT:
                return await this.operationHandlerService.handleUpdateOperation(
                    resource,
                    service,
                    request.url,
                    fullUrl,
                    idMap,
                    txid,
                    transactionalManager,
                    (url, type) => this.validationService.extractResourceIdFromUrl(url, type),
                    (error) => this.validationService.isResourceNotFoundError(error),
                    includeResourceInResponse
                );
            case HttpMethod.PATCH:
                return await this.operationHandlerService.handlePatchOperation(
                    resource,
                    service,
                    request.url,
                    fullUrl,
                    idMap,
                    txid,
                    transactionalManager,
                    (url, type) => this.validationService.extractResourceIdFromUrl(url, type),
                    (svc, id, mgr) => this.resourceMergeService.getExistingResource(svc, id, mgr),
                    (existing, patch) => this.resourceMergeService.mergePatchData(existing, patch),
                    includeResourceInResponse
                );
            case HttpMethod.DELETE:
                return await this.operationHandlerService.handleDeleteOperation(
                    service,
                    request.url,
                    resource.resourceType,
                    txid,
                    transactionalManager,
                    (url, type) => this.validationService.extractResourceIdFromUrl(url, type),
                    (svc, id, mgr) => this.resourceMergeService.getExistingResource(svc, id, mgr),
                    includeResourceInResponse
                );
            default:
                throw new BadRequestException(
                    `Unsupported HTTP method in transaction: ${request.method}`
                );
        }
    }

    /**
     * Creates a transaction response with the appropriate structure
     */
    private createTransactionResponse(entries: TransactionResponseEntry[]): TransactionResponse {
        return {
            resourceType: 'Bundle',
            id: uuidv4(),
            type: 'transaction-response',
            timestamp: new Date().toISOString(),
            entry: entries
        };
    }

    /**
     * Substitutes all urn:uuid:* references in any property (deep, bulletproof)
     */
    private substituteReferences(obj: any, idMap: IdMap): void {
        if (Array.isArray(obj)) {
            for (const item of obj) {
                this.substituteReferences(item, idMap);
            }
            return;
        }
        if (!obj || typeof obj !== 'object') return;

        for (const key of Object.keys(obj)) {
            const value = obj[key];
            // Substitute if value is a string urn:uuid:*
            if (typeof value === 'string' && value.startsWith('urn:uuid:')) {
                const mapping = idMap.get(value);
                if (mapping) {
                    obj[key] = `${mapping.resourceType}/${mapping.id}`;
                }
            } else if (typeof value === 'object' && value !== null) {
                // Recursively substitute in nested objects/arrays
                this.substituteReferences(value, idMap);
            }
        }
    }

    /**
     * Checks if a field is a FHIR reference
     */
    private isReferenceField(key: string, value: any): boolean {
        return key === 'reference' ||
            (typeof value === 'object' && value !== null && 'reference' in value);
    }

    /**
     * Logs all urn:uuid references in a resource that are missing from the idMap
     */
    private logMissingUrnReferences(resource: any, idMap: IdMap, path: string = ''): void {
        if (!resource || typeof resource !== 'object') return;

        if (Array.isArray(resource)) {
            resource.forEach((item, idx) => this.logMissingUrnReferences(item, idMap, `${path}[${idx}]`));
            return;
        }

        for (const [key, value] of Object.entries(resource)) {
            if (this.isReferenceField(key, value)) {
                const reference = value as any;
                if (reference.reference && reference.reference.startsWith('urn:uuid:')) {
                    if (!idMap.has(reference.reference)) {
                        // eslint-disable-next-line no-console
                        console.warn(`[Missing urn:uuid reference] ${path ? path + '.' : ''}${key}: ${reference.reference}`);
                    }
                }
            }
            // Recurse into arrays and objects
            if (Array.isArray(value)) {
                value.forEach((item, idx) => this.logMissingUrnReferences(item, idMap, `${path ? path + '.' : ''}${key}[${idx}]`));
            } else if (typeof value === 'object' && value !== null) {
                this.logMissingUrnReferences(value, idMap, `${path ? path + '.' : ''}${key}`);
            }
        }
    }
}