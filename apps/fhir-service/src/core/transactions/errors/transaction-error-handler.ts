import {
    HttpException,
    NotFoundException
} from '@nestjs/common';
import {
    BundleIdentificationMethod,
    BundleLogExtension,
    BundleLogField,
    BundleResourceType,
    BundleType,
    CacheStatus,
    ConstraintErrorMessage,
    DatabaseErrorCode,
    DuplicateBundleMessage,
    DuplicateDetectionTag,
    DuplicateValidationType,
    ErrorMessagePattern,
    FhirBundleType,
    FhirIssueCode,
    FhirResourceType,
    HttpStatusCode,
    HttpStatusDescription,
    IdempotencyHeader,
    SystemErrorMessage,
    ValidationErrorMessage,
    ValidationSeverity
} from '../../../common/enums/fhir-enums';

/**
 * Custom exception for FHIR transaction processing errors.
 * Provides structured error information with appropriate HTTP status codes.
 */
export class FhirTransactionException extends HttpException {
    constructor(
        public readonly errorType: string,
        public readonly details: string,
        public readonly statusCode: number = HttpStatusCode.BAD_REQUEST,
        public readonly operationIndex?: number,
        public readonly resourceType?: string,
        public readonly resourceId?: string,
        public readonly originalError?: Error
    ) {
        super(
            {
                error: errorType,
                message: details,
                statusCode,
                operationIndex,
                resourceType,
                resourceId,
                timestamp: new Date().toISOString()
            },
            statusCode
        );
    }
}

/**
 * Transaction bundle processing error types
 */
export enum TransactionErrorType {
    INVALID_BUNDLE = 'INVALID_BUNDLE',
    UNSUPPORTED_OPERATION = 'UNSUPPORTED_OPERATION',
    RESOURCE_VALIDATION_ERROR = 'RESOURCE_VALIDATION_ERROR',
    RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
    REFERENCE_RESOLUTION_ERROR = 'REFERENCE_RESOLUTION_ERROR',
    CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
    BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
    DATABASE_ERROR = 'DATABASE_ERROR',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
    TIMEOUT_ERROR = 'TIMEOUT_ERROR',
    AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
    DUPLICATE_BUNDLE = 'DUPLICATE_BUNDLE',
    IDEMPOTENCY_VIOLATION = 'IDEMPOTENCY_VIOLATION',
    TRANSACTION_ABORTED = 'TRANSACTION_ABORTED'
}

/**
 * Error categorization utility for proper HTTP status code mapping
 */
export class TransactionErrorHandler {

    /**
     * Categorizes and transforms errors into appropriate HTTP exceptions
     */
    static categorizeError(
        error: Error,
        operationIndex?: number,
        resourceType?: string,
        resourceId?: string
    ): FhirTransactionException {

        // Handle already categorized FHIR transaction exceptions
        if (error instanceof FhirTransactionException) {
            return error;
        }

        // Handle known NestJS HTTP exceptions
        if (error instanceof HttpException) {
            return new FhirTransactionException(
                TransactionErrorType.BUSINESS_RULE_VIOLATION,
                error.message,
                error.getStatus(),
                operationIndex,
                resourceType,
                resourceId,
                error
            );
        }

        // Handle database constraint violations
        if (this.isDatabaseConstraintError(error)) {
            return new FhirTransactionException(
                TransactionErrorType.CONSTRAINT_VIOLATION,
                this.extractConstraintErrorMessage(error),
                HttpStatusCode.CONFLICT,
                operationIndex,
                resourceType,
                resourceId,
                error
            );
        }

        // Handle database connection errors
        if (this.isDatabaseConnectionError(error)) {
            return new FhirTransactionException(
                TransactionErrorType.SERVICE_UNAVAILABLE,
                SystemErrorMessage.DATABASE_UNAVAILABLE,
                HttpStatusCode.SERVICE_UNAVAILABLE,
                operationIndex,
                resourceType,
                resourceId,
                error
            );
        }

        // Handle transaction abortion errors
        if (this.isTransactionAbortedError(error)) {
            return new FhirTransactionException(
                TransactionErrorType.TRANSACTION_ABORTED,
                'Transaction has been aborted due to a previous error - all subsequent operations are ignored',
                HttpStatusCode.INTERNAL_SERVER_ERROR,
                operationIndex,
                resourceType,
                resourceId,
                error
            );
        }

        // Handle timeout errors
        if (this.isTimeoutError(error)) {
            return new FhirTransactionException(
                TransactionErrorType.TIMEOUT_ERROR,
                SystemErrorMessage.OPERATION_TIMEOUT,
                HttpStatusCode.REQUEST_TIMEOUT,
                operationIndex,
                resourceType,
                resourceId,
                error
            );
        }

        // Handle validation errors
        if (this.isValidationError(error)) {
            return new FhirTransactionException(
                TransactionErrorType.RESOURCE_VALIDATION_ERROR,
                this.extractValidationErrorMessage(error),
                HttpStatusCode.UNPROCESSABLE_ENTITY,
                operationIndex,
                resourceType,
                resourceId,
                error
            );
        }

        // Handle resource not found errors
        if (this.isNotFoundError(error)) {
            return new FhirTransactionException(
                TransactionErrorType.RESOURCE_NOT_FOUND,
                error.message || SystemErrorMessage.RESOURCE_NOT_FOUND_DEFAULT,
                HttpStatusCode.NOT_FOUND,
                operationIndex,
                resourceType,
                resourceId,
                error
            );
        }

        // Default to internal server error for unhandled exceptions
        return new FhirTransactionException(
            TransactionErrorType.DATABASE_ERROR,
            SystemErrorMessage.UNEXPECTED_ERROR,
            HttpStatusCode.INTERNAL_SERVER_ERROR,
            operationIndex,
            resourceType,
            resourceId,
            error
        );
    }

    /**
     * Creates a structured transaction response for errors
     */
    static createErrorResponse(
        error: FhirTransactionException,
        txid: string,
        totalOperations: number
    ) {
        return {
            resourceType: FhirResourceType.BUNDLE,
            type: FhirBundleType.TRANSACTION_RESPONSE_LEGACY,
            id: txid,
            meta: {
                lastUpdated: new Date().toISOString()
            },
            entry: this.createErrorEntries(error, totalOperations),
            error: {
                errorType: error.errorType,
                message: error.details,
                statusCode: error.statusCode,
                operationIndex: error.operationIndex,
                resourceType: error.resourceType,
                resourceId: error.resourceId,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Creates error entries for the transaction response
     */
    private static createErrorEntries(
        error: FhirTransactionException,
        totalOperations: number
    ) {
        const entries = [];

        for (let i = 0; i < totalOperations; i++) {
            if (error.operationIndex !== undefined && i < error.operationIndex) {
                // Operations before the failed one were rolled back
                entries.push({
                    response: {
                        status: HttpStatusDescription.PRECONDITION_FAILED,
                        outcome: {
                            resourceType: FhirResourceType.OPERATION_OUTCOME,
                            issue: [{
                                severity: ValidationSeverity.ERROR,
                                code: FhirIssueCode.PROCESSING,
                                details: {
                                    text: SystemErrorMessage.TRANSACTION_ROLLBACK
                                }
                            }]
                        }
                    }
                });
            } else if (error.operationIndex !== undefined && i === error.operationIndex) {
                // The failed operation
                entries.push({
                    response: {
                        status: `${error.statusCode} ${this.getStatusText(error.statusCode)}`,
                        outcome: {
                            resourceType: FhirResourceType.OPERATION_OUTCOME,
                            issue: [{
                                severity: ValidationSeverity.ERROR,
                                code: this.mapErrorTypeToIssueCode(error.errorType),
                                details: {
                                    text: error.details
                                }
                            }]
                        }
                    }
                });
            } else {
                // Operations after the failed one were not processed
                entries.push({
                    response: {
                        status: HttpStatusDescription.PRECONDITION_FAILED,
                        outcome: {
                            resourceType: FhirResourceType.OPERATION_OUTCOME,
                            issue: [{
                                severity: ValidationSeverity.ERROR,
                                code: FhirIssueCode.PROCESSING,
                                details: {
                                    text: SystemErrorMessage.NOT_PROCESSED
                                }
                            }]
                        }
                    }
                });
            }
        }

        return entries;
    }

    /**
     * Maps error types to FHIR issue codes
     */
    private static mapErrorTypeToIssueCode(errorType: string): string {
        const mapping: Record<string, string> = {
            [TransactionErrorType.INVALID_BUNDLE]: FhirIssueCode.STRUCTURE,
            [TransactionErrorType.UNSUPPORTED_OPERATION]: FhirIssueCode.NOT_SUPPORTED,
            [TransactionErrorType.RESOURCE_VALIDATION_ERROR]: FhirIssueCode.INVALID,
            [TransactionErrorType.RESOURCE_NOT_FOUND]: FhirIssueCode.NOT_FOUND,
            [TransactionErrorType.REFERENCE_RESOLUTION_ERROR]: FhirIssueCode.NOT_FOUND,
            [TransactionErrorType.CONSTRAINT_VIOLATION]: FhirIssueCode.DUPLICATE,
            [TransactionErrorType.BUSINESS_RULE_VIOLATION]: FhirIssueCode.BUSINESS_RULE,
            [TransactionErrorType.DATABASE_ERROR]: FhirIssueCode.TRANSIENT,
            [TransactionErrorType.SERVICE_UNAVAILABLE]: FhirIssueCode.TRANSIENT,
            [TransactionErrorType.TIMEOUT_ERROR]: FhirIssueCode.TIMEOUT,
            [TransactionErrorType.AUTHORIZATION_ERROR]: FhirIssueCode.SECURITY,
            [TransactionErrorType.DUPLICATE_BUNDLE]: FhirIssueCode.DUPLICATE,
            [TransactionErrorType.IDEMPOTENCY_VIOLATION]: FhirIssueCode.BUSINESS_RULE,
            [TransactionErrorType.TRANSACTION_ABORTED]: FhirIssueCode.TRANSIENT
        };

        return mapping[errorType] || FhirIssueCode.EXCEPTION;
    }

    /**
     * Gets HTTP status text for status codes
     */
    private static getStatusText(statusCode: number): string {
        const statusTexts: Record<number, string> = {
            [HttpStatusCode.BAD_REQUEST]: 'Bad Request',
            [HttpStatusCode.UNAUTHORIZED]: 'Unauthorized',
            [HttpStatusCode.FORBIDDEN]: 'Forbidden',
            [HttpStatusCode.NOT_FOUND]: 'Not Found',
            [HttpStatusCode.REQUEST_TIMEOUT]: 'Request Timeout',
            [HttpStatusCode.CONFLICT]: 'Conflict',
            [HttpStatusCode.PRECONDITION_FAILED]: 'Precondition Failed',
            [HttpStatusCode.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
            [HttpStatusCode.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
            [HttpStatusCode.SERVICE_UNAVAILABLE]: 'Service Unavailable'
        };

        return statusTexts[statusCode] || SystemErrorMessage.UNKNOWN_STATUS;
    }

    /**
     * Checks if error is a database constraint violation
     */
    private static isDatabaseConstraintError(error: Error): boolean {
        const message = error.message?.toLowerCase() || '';
        return message.includes(ErrorMessagePattern.CONSTRAINT) ||
            message.includes(ErrorMessagePattern.UNIQUE) ||
            message.includes(ErrorMessagePattern.FOREIGN_KEY) ||
            message.includes(ErrorMessagePattern.DUPLICATE_KEY) ||
            (error as any).code === DatabaseErrorCode.UNIQUE_VIOLATION ||
            (error as any).code === DatabaseErrorCode.FOREIGN_KEY_VIOLATION;
    }

    /**
     * Checks if error is a database connection error
     */
    private static isDatabaseConnectionError(error: Error): boolean {
        const message = error.message?.toLowerCase() || '';
        return message.includes(ErrorMessagePattern.CONNECTION) ||
            message.includes(ErrorMessagePattern.CONNECT_ECONNREFUSED) ||
            message.includes(ErrorMessagePattern.TIMEOUT) ||
            (error as any).code === DatabaseErrorCode.CONNECTION_REFUSED ||
            (error as any).code === DatabaseErrorCode.CONNECTION_TIMEOUT;
    }

    /**
     * Checks if error is a timeout error
     */
    private static isTimeoutError(error: Error): boolean {
        const message = error.message?.toLowerCase() || '';
        return message.includes(ErrorMessagePattern.TIMEOUT) ||
            message.includes(ErrorMessagePattern.TIMED_OUT) ||
            (error as any).code === DatabaseErrorCode.CONNECTION_TIMEOUT;
    }

    /**
     * Checks if error is a validation error
     */
    private static isValidationError(error: Error): boolean {
        const message = error.message?.toLowerCase() || '';
        return message.includes(ErrorMessagePattern.VALIDATION) ||
            message.includes(ErrorMessagePattern.INVALID) ||
            message.includes(ErrorMessagePattern.REQUIRED) ||
            message.includes(ErrorMessagePattern.MUST_BE) ||
            error.name === 'ValidationError';
    }

    /**
     * Checks if error is a not found error
     */
    private static isNotFoundError(error: Error): boolean {
        const message = error.message?.toLowerCase() || '';
        return message.includes(ErrorMessagePattern.NOT_FOUND) ||
            message.includes(ErrorMessagePattern.DOES_NOT_EXIST) ||
            error instanceof NotFoundException;
    }

    /**
     * Checks if error is a transaction aborted error
     */
    private static isTransactionAbortedError(error: Error): boolean {
        const message = error.message?.toLowerCase() || '';
        return message.includes('current transaction is aborted') ||
            message.includes('transaction is aborted') ||
            message.includes('commands ignored until end of transaction block');
    }

    /**
     * Extracts user-friendly message from constraint errors
     */
    private static extractConstraintErrorMessage(error: Error): string {
        const message = error.message || '';

        if (message.includes(ErrorMessagePattern.UNIQUE)) {
            return ConstraintErrorMessage.UNIQUE_VIOLATION;
        }

        if (message.includes(ErrorMessagePattern.FOREIGN_KEY)) {
            return ConstraintErrorMessage.FOREIGN_KEY_VIOLATION;
        }

        if (message.includes(ErrorMessagePattern.CONSTRAINT)) {
            return ConstraintErrorMessage.GENERAL_CONSTRAINT;
        }

        return ConstraintErrorMessage.DEFAULT;
    }

    /**
     * Extracts user-friendly message from validation errors
     */
    private static extractValidationErrorMessage(error: Error): string {
        const message = error.message || '';

        // Clean up common validation error patterns
        if (message.includes(ErrorMessagePattern.REQUIRED)) {
            return message.replace(/^.*?required/i, ValidationErrorMessage.REQUIRED_FIELD);
        }

        if (message.includes(ErrorMessagePattern.INVALID)) {
            return message.replace(/^.*?invalid/i, ValidationErrorMessage.INVALID_VALUE);
        }

        return message || ValidationErrorMessage.VALIDATION_FAILED;
    }

    /**
     * Creates a duplicate bundle error with bundle_log context
     */
    static createDuplicateBundleError(
        bundleId: string,
        existingLogEntry: any,
        duplicateType: DuplicateValidationType,
        operationIndex?: number
    ): FhirTransactionException {
        const errorType = duplicateType === DuplicateValidationType.EXACT_MATCH
            ? TransactionErrorType.DUPLICATE_BUNDLE
            : TransactionErrorType.IDEMPOTENCY_VIOLATION;

        const message = this.getDuplicateErrorMessage(duplicateType, bundleId, existingLogEntry);

        const exception = new FhirTransactionException(
            errorType,
            message,
            HttpStatusCode.CONFLICT,
            operationIndex,
            FhirResourceType.BUNDLE,
            bundleId
        );

        // Add bundle log context
        (exception as any).bundleLogContext = {
            originalTxid: existingLogEntry?.txid,
            originalTimestamp: existingLogEntry?.created_at,
            bundleStatus: existingLogEntry?.status,
            detectionMethod: BundleIdentificationMethod.TRANSACTION_ID
        };

        return exception;
    }

    /**
     * Gets appropriate error message based on duplicate type and bundle log data
     */
    private static getDuplicateErrorMessage(
        duplicateType: DuplicateValidationType,
        bundleId: string,
        existingLogEntry: any
    ): string {
        const originalTxid = existingLogEntry?.txid || 'unknown';
        const bundleStatus = existingLogEntry?.status || 'unknown';

        switch (duplicateType) {
            case DuplicateValidationType.EXACT_MATCH:
                return `${DuplicateBundleMessage.EXACT_DUPLICATE} Original transaction: ${originalTxid}, Status: ${bundleStatus}`;
            case DuplicateValidationType.CONTENT_MISMATCH:
                return `${DuplicateBundleMessage.CONTENT_MODIFIED} Original transaction: ${originalTxid}`;
            case DuplicateValidationType.ID_COLLISION:
                return `${DuplicateBundleMessage.ID_COLLISION} Original transaction: ${originalTxid}`;
            case DuplicateValidationType.PARTIAL_DUPLICATE:
                return `${DuplicateBundleMessage.PARTIAL_DUPLICATE} Check bundle log entry: ${originalTxid}`;
            default:
                return `${DuplicateBundleMessage.PROCESSING_PREVENTED} Bundle log entry: ${originalTxid}`;
        }
    }

    /**
     * Creates a cached response using bundle_log data for duplicate submissions
     */
    static createCachedResponse(
        existingLogEntry: any,
        bundleId: string
    ) {
        const bundleSummary = existingLogEntry.bundle_summary || {};
        const responseEntries = bundleSummary.response_entries || [];

        return {
            resourceType: BundleResourceType.BUNDLE,
            id: bundleId,
            type: BundleType.TRANSACTION_RESPONSE,
            meta: {
                lastUpdated: existingLogEntry.updated_at?.toISOString() || new Date().toISOString(),
                tag: [
                    {
                        system: DuplicateDetectionTag.SYSTEM,
                        code: DuplicateDetectionTag.CACHED_RESPONSE,
                        display: DuplicateBundleMessage.CACHED_RESPONSE_RETURNED
                    }
                ],
                extension: [
                    {
                        url: BundleLogExtension.ORIGINAL_TXID,
                        valueString: existingLogEntry.txid
                    },
                    {
                        url: BundleLogExtension.ORIGINAL_TIMESTAMP,
                        valueDateTime: existingLogEntry.created_at?.toISOString()
                    },
                    {
                        url: BundleLogExtension.BUNDLE_STATUS,
                        valueString: existingLogEntry.status
                    }
                ]
            },
            entry: responseEntries,
            // Add headers to indicate this is a cached response from bundle_log
            headers: {
                [IdempotencyHeader.DUPLICATE_DETECTED]: 'true',
                [IdempotencyHeader.ORIGINAL_TRANSACTION_ID]: existingLogEntry.txid,
                [IdempotencyHeader.CACHE_STATUS]: CacheStatus.HIT,
                [BundleLogField.STATUS]: existingLogEntry.status
            }
        };
    }
}
