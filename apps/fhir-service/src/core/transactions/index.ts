// Main transaction service
export { TransactionService } from './transaction.service';

// Validation services
export { TransactionValidationService } from './validators/transaction-validation.service';

// Detection services  
export { TransactionDuplicateDetectionService } from './detectors/transaction-duplicate-detection.service';

// Handler services
export { TransactionOperationHandlerService } from './handlers/transaction-operation-handler.service';

// Merge services
export { TransactionResourceMergeService } from './mergers/transaction-resource-merge.service';

// Registry services
export { FhirResourceServiceRegistry } from './registries/fhir-resource-service-registry.service';

// Error handling
export { FhirTransactionException, TransactionErrorHandler, TransactionErrorType } from './errors/transaction-error-handler';

// Re-export types and interfaces that other modules might need
export type {
    DuplicateCheckResult, IdMap,
    ProcessedResourcesMap, ResourceIdMapping, TransactionResponseEntry
} from './handlers/transaction-operation-handler.service';

