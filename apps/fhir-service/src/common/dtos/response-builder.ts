import {
    ApiErrorResponse,
    ApiSuccessResponse,
    BulkFailureDetail,
    BulkOperationResponse,
    ErrorListItem,
    PaginatedResponse,
    PaginationMeta
} from './api-response.dto';

/**
 * Utility class for creating standardized API responses
 * Provides helper methods for common response patterns
 */
export class ResponseBuilder {
    /**
     * Create a success response with data
     */
    static success<T>(data?: T, message?: string, messageCode?: string, requestId?: string): ApiSuccessResponse<T> {
        return new ApiSuccessResponse(data, message, messageCode, requestId);
    }

    /**
     * Create an error response
     */
    static error(
        message: string,
        statusCode = 400,
        errorList?: ErrorListItem[],
        messageCode?: string,
        requestId?: string
    ): ApiErrorResponse {
        return new ApiErrorResponse(message, statusCode, errorList, messageCode, requestId);
    }

    /**
     * Create a paginated response
     */
    static paginated<T>(
        data: T[],
        page: number,
        limit: number,
        total: number,
        message?: string,
        messageCode?: string,
        requestId?: string
    ): PaginatedResponse<T> {
        const pagination = new PaginationMeta(page, limit, total);
        return new PaginatedResponse(data, pagination, message, messageCode, requestId);
    }

    /**
     * Create a bulk operation response
     */
    static bulk(
        successCount: number,
        failureCount: number,
        failures?: BulkFailureDetail[],
        message?: string,
        messageCode?: string,
        requestId?: string
    ): BulkOperationResponse {
        return new BulkOperationResponse(successCount, failureCount, failures, message, messageCode, requestId);
    }

    /**
     * Create a not found error response
     */
    static notFound(resource: string, id?: string, requestId?: string): ApiErrorResponse {
        const message = id
            ? `${resource} with ID '${id}' not found`
            : `${resource} not found`;
        return ResponseBuilder.error(
            message,
            404,
            [new ErrorListItem('NOT_FOUND', message)],
            'NOT_FOUND',
            requestId
        );
    }

    /**
     * Create a validation error response
     */
    static validationError(errors: string[], requestId?: string): ApiErrorResponse {
        const errorList = errors.map(error => new ErrorListItem('VALIDATION_ERROR', error));
        return ResponseBuilder.error(
            'Validation failed',
            400,
            errorList,
            'VALIDATION_ERROR',
            requestId
        );
    }

    /**
     * Create an unauthorized error response
     */
    static unauthorized(message = 'Unauthorized access', requestId?: string): ApiErrorResponse {
        return ResponseBuilder.error(
            message,
            401,
            [new ErrorListItem('UNAUTHORIZED', message)],
            'UNAUTHORIZED',
            requestId
        );
    }

    /**
     * Create a forbidden error response
     */
    static forbidden(message = 'Access forbidden', requestId?: string): ApiErrorResponse {
        return ResponseBuilder.error(
            message,
            403,
            [new ErrorListItem('FORBIDDEN', message)],
            'FORBIDDEN',
            requestId
        );
    }

    /**
     * Create a conflict error response
     */
    static conflict(message: string, requestId?: string): ApiErrorResponse {
        return ResponseBuilder.error(
            message,
            409,
            [new ErrorListItem('CONFLICT', message)],
            'CONFLICT',
            requestId
        );
    }

    /**
     * Create an internal server error response
     */
    static internalError(message = 'Internal server error', requestId?: string): ApiErrorResponse {
        return ResponseBuilder.error(
            message,
            500,
            [new ErrorListItem('INTERNAL_ERROR', message)],
            'INTERNAL_ERROR',
            requestId
        );
    }

    /**
     * Create a no content success response
     */
    static noContent(message = 'Operation completed successfully', messageCode?: string, requestId?: string): ApiSuccessResponse {
        return new ApiSuccessResponse(null, message, messageCode, requestId);
    }

    /**
     * Create a created success response
     */
    static created<T>(data: T, message = 'Resource created successfully', messageCode?: string, requestId?: string): ApiSuccessResponse<T> {
        return new ApiSuccessResponse(data, message, messageCode, requestId);
    }

    /**
     * Create an updated success response
     */
    static updated<T>(data: T, message = 'Resource updated successfully', messageCode?: string, requestId?: string): ApiSuccessResponse<T> {
        return new ApiSuccessResponse(data, message, messageCode, requestId);
    }

    /**
     * Create a deleted success response
     */
    static deleted(message = 'Resource deleted successfully', messageCode?: string, requestId?: string): ApiSuccessResponse {
        return new ApiSuccessResponse(null, message, messageCode, requestId);
    }
}

/**
 * Common error codes used throughout the application
 */
export const ErrorCodes = {
    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

    // Authentication/Authorization errors
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',

    // Resource errors
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS: 'ALREADY_EXISTS',
    CONFLICT: 'CONFLICT',

    // Server errors
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    DATABASE_ERROR: 'DATABASE_ERROR',

    // FHIR specific errors
    FHIR_VALIDATION_ERROR: 'FHIR_VALIDATION_ERROR',
    INVALID_FHIR_RESOURCE: 'INVALID_FHIR_RESOURCE',
    FHIR_OPERATION_ERROR: 'FHIR_OPERATION_ERROR',

    // Business logic errors
    BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
    PRECONDITION_FAILED: 'PRECONDITION_FAILED',

    // Rate limiting
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

    // External service errors
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
