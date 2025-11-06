import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { RESPONSE_STATUS } from '../enums/response-status.enum';

/**
 * Error list item for detailed error reporting
 */
export class ErrorListItem {
    /**
     * Error code for programmatic handling
     */
    @ApiProperty({
        description: 'Error code for programmatic handling',
        example: 'VALIDATION_ERROR',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    code: string;

    /**
     * Human-readable error message
     */
    @ApiProperty({
        description: 'Human-readable error message',
        example: 'Field "name" is required',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    message: string;

    /**
     * Additional error details
     */
    @ApiProperty({
        description: 'Additional error details',
        example: 'ValidationError: name is required',
        required: false,
        type: String
    })
    @IsString()
    @IsOptional()
    error?: string;

    constructor(code: string, message: string, error?: string) {
        this.code = code;
        this.message = message;
        this.error = error;
    }
}

/**
 * Pagination metadata
 */
export class PaginationMeta {
    /**
     * Current page number (1-based)
     */
    @ApiProperty({
        description: 'Current page number (1-based)',
        example: 1,
        type: Number
    })
    page: number;

    /**
     * Number of items per page
     */
    @ApiProperty({
        description: 'Number of items per page',
        example: 20,
        type: Number
    })
    limit: number;

    /**
     * Current offset
     */
    @ApiProperty({
        description: 'Current offset from the beginning',
        example: 0,
        type: Number
    })
    offset: number;

    /**
     * Total number of items across all pages
     */
    @ApiProperty({
        description: 'Total number of items across all pages',
        example: 150,
        type: Number
    })
    total: number;

    /**
     * Total number of pages
     */
    @ApiProperty({
        description: 'Total number of pages',
        example: 8,
        type: Number
    })
    totalPages: number;

    /**
     * Whether there are more pages available
     */
    @ApiProperty({
        description: 'Whether there are more pages available',
        example: true,
        type: Boolean
    })
    hasNext: boolean;

    /**
     * Whether there are previous pages
     */
    @ApiProperty({
        description: 'Whether there are previous pages',
        example: false,
        type: Boolean
    })
    hasPrevious: boolean;

    constructor(page: number, limit: number, total: number, offset?: number) {
        this.page = page;
        this.limit = limit;
        this.offset = offset ?? (page - 1) * limit;
        this.total = total;
        this.totalPages = Math.ceil(total / limit);
        this.hasNext = page < this.totalPages;
        this.hasPrevious = page > 1;
    }
}

/**
 * Details of a failed item in bulk operations
 */
export class BulkFailureDetail {
    /**
     * Identifier of the failed item
     */
    @ApiProperty({
        description: 'Identifier of the failed item',
        example: 'item-123',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    itemId: string;

    /**
     * Reason for failure
     */
    @ApiProperty({
        description: 'Reason why the item failed to process',
        example: 'Invalid email format',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    reason: string;

    /**
     * Error code
     */
    @ApiProperty({
        description: 'Error code for the failure',
        example: 'VALIDATION_ERROR',
        required: false,
        type: String
    })
    @IsString()
    @IsOptional()
    errorCode?: string;

    constructor(itemId: string, reason: string, errorCode?: string) {
        this.itemId = itemId;
        this.reason = reason;
        this.errorCode = errorCode;
    }
}

/**
 * Standard API response wrapper for both REST and GraphQL APIs
 * Provides consistent response structure across all endpoints with validation
 */
export class CommonResponse<T = any> {
    /**
     * Human-readable message describing the result
     */
    @ApiProperty({
        description: 'Human-readable message describing the result',
        example: 'Operation completed successfully',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    message: string;

    /**
     * Message code for programmatic handling
     */
    @ApiProperty({
        description: 'Message code for programmatic handling',
        example: 'SUCCESS_001',
        required: false,
        type: String
    })
    @IsString()
    @IsOptional()
    messageCode?: string;

    /**
     * Response status enumeration
     */
    @ApiProperty({
        description: 'Response status',
        example: RESPONSE_STATUS.SUCCESS,
        enum: RESPONSE_STATUS
    })
    @IsEnum(RESPONSE_STATUS)
    @IsNotEmpty()
    status: RESPONSE_STATUS;

    /**
     * The response data payload
     */
    @ApiProperty({
        description: 'The response data payload',
        required: false
    })
    @IsOptional()
    data?: T;

    /**
     * List of errors or validation issues
     */
    @ApiProperty({
        description: 'List of errors or validation issues',
        type: [ErrorListItem],
        required: false
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ErrorListItem)
    @IsOptional()
    errorList?: ErrorListItem[];

    /**
     * Timestamp when the response was generated
     */
    @ApiProperty({
        description: 'Timestamp when the response was generated',
        example: '2025-07-22T18:30:00.000Z',
        type: Date
    })
    @IsDate()
    timestamp: Date;

    /**
     * Request ID for tracing/debugging
     */
    @ApiProperty({
        description: 'Request ID for tracing/debugging purposes',
        example: 'req_abc123def456',
        required: false,
        type: String
    })
    @IsString()
    @IsOptional()
    requestId?: string;

    constructor(
        message: string,
        messageCode?: string,
        status: RESPONSE_STATUS = RESPONSE_STATUS.SUCCESS,
        data?: T,
        errorList?: ErrorListItem[],
        requestId?: string
    ) {
        this.message = message;
        this.messageCode = messageCode;
        this.status = status;
        this.data = data;
        this.errorList = errorList;
        this.timestamp = new Date();
        this.requestId = requestId;
    }

    /**
     * Convert to response object, filtering out undefined/null values
     */
    toResponse(): Partial<CommonResponse<T>> {
        return Object.fromEntries(
            Object.entries(this).filter(([, value]) => value !== null && value !== undefined)
        );
    }
}

/**
 * Success response with data payload
 */
export class ApiSuccessResponse<T = any> extends CommonResponse<T> {
    constructor(data?: T, message?: string, messageCode?: string, requestId?: string) {
        super(
            message || 'Operation completed successfully',
            messageCode,
            RESPONSE_STATUS.SUCCESS,
            data,
            undefined,
            requestId
        );
    }
}

/**
 * Error response with error details
 */
export class ApiErrorResponse extends CommonResponse {
    /**
     * HTTP status code
     */
    @ApiProperty({
        description: 'HTTP status code',
        example: 400,
        type: Number
    })
    @IsNotEmpty()
    statusCode: number;

    constructor(
        message: string,
        statusCode = 400,
        errorList?: ErrorListItem[],
        messageCode?: string,
        requestId?: string
    ) {
        super(
            message,
            messageCode,
            RESPONSE_STATUS.ERROR,
            undefined,
            errorList,
            requestId
        );
        this.statusCode = statusCode;
    }
}

/**
 * Paginated response for list endpoints
 */
export class PaginatedResponse<T = any> extends CommonResponse<T[]> {
    /**
     * Pagination metadata
     */
    @ApiProperty({
        description: 'Pagination metadata',
        type: PaginationMeta
    })
    @ValidateNested()
    @Type(() => PaginationMeta)
    pagination: PaginationMeta;

    constructor(
        data: T[],
        pagination: PaginationMeta,
        message?: string,
        messageCode?: string,
        requestId?: string
    ) {
        super(
            message || 'Data retrieved successfully',
            messageCode,
            RESPONSE_STATUS.SUCCESS,
            data,
            undefined,
            requestId
        );
        this.pagination = pagination;
    }
}

/**
 * Response for bulk operations
 */
export class BulkOperationResponse extends CommonResponse {
    /**
     * Number of successfully processed items
     */
    @ApiProperty({
        description: 'Number of successfully processed items',
        example: 95,
        type: Number
    })
    @IsNotEmpty()
    successCount: number;

    /**
     * Number of failed items
     */
    @ApiProperty({
        description: 'Number of failed items',
        example: 5,
        type: Number
    })
    @IsNotEmpty()
    failureCount: number;

    /**
     * Total number of items processed
     */
    @ApiProperty({
        description: 'Total number of items processed',
        example: 100,
        type: Number
    })
    @IsNotEmpty()
    totalCount: number;

    /**
     * Details of failed items
     */
    @ApiProperty({
        description: 'Details of items that failed to process',
        required: false,
        type: [BulkFailureDetail]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkFailureDetail)
    @IsOptional()
    failures?: BulkFailureDetail[];

    constructor(
        successCount: number,
        failureCount: number,
        failures?: BulkFailureDetail[],
        message?: string,
        messageCode?: string,
        requestId?: string
    ) {
        const status = failureCount > 0 ?
            (successCount > 0 ? RESPONSE_STATUS.PARTIAL_SUCCESS : RESPONSE_STATUS.ERROR) :
            RESPONSE_STATUS.SUCCESS;

        super(
            message || `Processed ${successCount + failureCount} items: ${successCount} successful, ${failureCount} failed`,
            messageCode,
            status,
            null,
            undefined,
            requestId
        );
        this.successCount = successCount;
        this.failureCount = failureCount;
        this.totalCount = successCount + failureCount;
        this.failures = failures;
    }
}
