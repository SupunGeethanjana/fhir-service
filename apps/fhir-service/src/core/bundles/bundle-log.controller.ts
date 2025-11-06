import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponse, ApiSuccessResponse, PaginatedResponse } from '../../common/dtos/api-response.dto';
import { ResponseBuilder } from '../../common/dtos/response-builder';
import { BundleLog } from './bundle-log.entity';
import { BundleLogQueryOptions, BundleLogService } from './bundle-log.service';

/**
 * Controller for Bundle Log monitoring and reporting endpoints
 * 
 * Provides read-only access to bundle transaction logs for monitoring,
 * troubleshooting, and analytics purposes.
 * 
 * @author FHIR Service Team
 * @version 1.0.0
 */
@ApiTags('Bundle Logs')
@Controller('bundle-logs')
export class BundleLogController {
    private readonly logger = new Logger(BundleLogController.name);

    constructor(private readonly bundleLogService: BundleLogService) { }

    /**
     * Retrieves bundle logs with optional filtering
     * 
     * Returns a list of bundle transaction logs filtered by the provided criteria.
     * Useful for monitoring, troubleshooting, and analytics.
     * 
     * @param status - Filter by bundle processing status
     * @param bundleType - Filter by bundle type (e.g., transaction, batch)
     * @param submittedBy - Filter by who submitted the bundle
     * @param sourceSystem - Filter by source system identifier
     * @param startDate - Filter by minimum creation date (ISO 8601)
     * @param endDate - Filter by maximum creation date (ISO 8601)
     * @param limit - Maximum number of results to return
     * @param offset - Number of results to skip for pagination
     * @returns Array of bundle log entries
     */
    @Get()
    @ApiOperation({
        summary: 'Get bundle logs',
        description: 'Retrieve bundle transaction logs with optional filtering. Useful for monitoring bundle processing, troubleshooting failures, and analytics.',
        operationId: 'getBundleLogs'
    })
    @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by processing status (success, failed, processing)', example: 'failed' })
    @ApiQuery({ name: 'bundleType', required: false, type: String, description: 'Filter by bundle type', example: 'transaction' })
    @ApiQuery({ name: 'submittedBy', required: false, type: String, description: 'Filter by submitter identifier', example: 'user123' })
    @ApiQuery({ name: 'sourceSystem', required: false, type: String, description: 'Filter by source system', example: 'EMR-SYSTEM-1' })
    @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Filter by minimum creation date (ISO 8601)', example: '2025-07-01T00:00:00Z' })
    @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Filter by maximum creation date (ISO 8601)', example: '2025-07-22T23:59:59Z' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of results (1-1000, default: 100)', example: 100 })
    @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of results to skip for pagination', example: 0 })
    @ApiResponse({
        status: 200,
        description: 'Successfully retrieved bundle logs',
        type: PaginatedResponse
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid query parameters',
        type: ApiErrorResponse
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
        type: ApiErrorResponse
    })
    async getBundleLogs(
        @Query('status') status?: string,
        @Query('bundleType') bundleType?: string,
        @Query('submittedBy') submittedBy?: string,
        @Query('sourceSystem') sourceSystem?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ): Promise<ApiSuccessResponse<BundleLog[]> | ApiErrorResponse> {
        try {
            this.logger.log('Retrieving bundle logs with filters');

            const options: BundleLogQueryOptions = {};

            if (status) options.status = status;
            if (bundleType) options.bundleType = bundleType;
            if (submittedBy) options.submittedBy = submittedBy;
            if (sourceSystem) options.sourceSystem = sourceSystem;
            if (startDate) options.startDate = new Date(startDate);
            if (endDate) options.endDate = new Date(endDate);
            if (limit) options.limit = parseInt(limit, 10);
            if (offset) options.offset = parseInt(offset, 10);

            const logs = await this.bundleLogService.findBundleLogs(options);

            return ResponseBuilder.success(logs, 'Bundle logs retrieved successfully', 'BUNDLE_LOGS_RETRIEVED');
        } catch (error) {
            this.logger.error('Failed to retrieve bundle logs', error);
            return ResponseBuilder.error('Failed to retrieve bundle logs', 500, undefined, 'BUNDLE_LOGS_ERROR');
        }
    }

    /**
     * Retrieves a specific bundle log by transaction ID
     * 
     * Returns the bundle log entry for a specific transaction ID.
     * Useful for tracking the status of a specific bundle submission.
     * 
     * @param txid - The transaction ID to search for
     * @returns Bundle log entry or null if not found
     */
    @Get('txid/:txid')
    @ApiOperation({
        summary: 'Get bundle log by transaction ID',
        description: 'Retrieve a specific bundle log entry by transaction ID. Returns null if not found.',
        operationId: 'getBundleLogByTxid'
    })
    @ApiParam({
        name: 'txid',
        description: 'Transaction ID to search for',
        type: 'string',
        example: 'txn-123e4567-e89b-12d3-a456-426614174000'
    })
    @ApiResponse({
        status: 200,
        description: 'Bundle log found or null if not found',
        type: ApiSuccessResponse
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid transaction ID format',
        type: ApiErrorResponse
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
        type: ApiErrorResponse
    })
    async getBundleLogByTxid(@Param('txid') txid: string): Promise<ApiSuccessResponse<BundleLog | null> | ApiErrorResponse> {
        try {
            this.logger.log(`Retrieving bundle log for txid: ${txid}`);
            const log = await this.bundleLogService.findByTxid(txid);

            return ResponseBuilder.success(log, 'Bundle log retrieved successfully', 'BUNDLE_LOG_BY_TXID_RETRIEVED');
        } catch (error) {
            this.logger.error(`Failed to retrieve bundle log for txid: ${txid}`, error);
            return ResponseBuilder.error('Failed to retrieve bundle log', 500, undefined, 'BUNDLE_LOG_TXID_ERROR');
        }
    }

    /**
     * Retrieves bundle processing statistics
     * 
     * Returns aggregate statistics about bundle processing including success rates,
     * average processing times, and error summaries for a given date range.
     * 
     * @param startDate - Start date for statistics (ISO 8601 format)
     * @param endDate - End date for statistics (ISO 8601 format)
     * @returns Bundle processing statistics
     */
    @Get('stats')
    @ApiOperation({
        summary: 'Get bundle processing statistics',
        description: 'Retrieve aggregate statistics about bundle processing including success rates, processing times, and error summaries.',
        operationId: 'getBundleStats'
    })
    @ApiQuery({
        name: 'startDate',
        required: false,
        type: String,
        description: 'Start date for statistics (ISO 8601 format)',
        example: '2025-07-01T00:00:00Z'
    })
    @ApiQuery({
        name: 'endDate',
        required: false,
        type: String,
        description: 'End date for statistics (ISO 8601 format)',
        example: '2025-07-22T23:59:59Z'
    })
    @ApiResponse({
        status: 200,
        description: 'Successfully retrieved bundle statistics',
        type: ApiSuccessResponse
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid date parameters',
        type: ApiErrorResponse
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
        type: ApiErrorResponse
    })
    async getBundleStats(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ): Promise<ApiSuccessResponse<any> | ApiErrorResponse> {
        try {
            this.logger.log('Retrieving bundle processing statistics');

            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;

            const stats = await this.bundleLogService.getBundleStats(start, end);

            return ResponseBuilder.success(stats, 'Bundle statistics retrieved successfully', 'BUNDLE_STATS_RETRIEVED');
        } catch (error) {
            this.logger.error('Failed to retrieve bundle statistics', error);
            return ResponseBuilder.error('Failed to retrieve bundle statistics', 500, undefined, 'BUNDLE_STATS_ERROR');
        }
    }

    /**
     * Retrieves recent failed bundles for troubleshooting
     * 
     * Returns the most recent bundle failures for quick troubleshooting.
     * Useful for identifying patterns in recent errors.
     * 
     * @param limit - Maximum number of failed bundles to return
     * @returns Array of recent failed bundle logs
     */
    @Get('failures')
    @ApiOperation({
        summary: 'Get recent failed bundles',
        description: 'Retrieve the most recent bundle failures for troubleshooting. Useful for quick identification of error patterns.',
        operationId: 'getRecentFailures'
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Maximum number of failed bundles to return (1-100, default: 10)',
        example: 20
    })
    @ApiResponse({
        status: 200,
        description: 'Successfully retrieved recent failures',
        type: ApiSuccessResponse
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid limit parameter',
        type: ApiErrorResponse
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
        type: ApiErrorResponse
    })
    async getRecentFailures(@Query('limit') limit?: string): Promise<ApiSuccessResponse<BundleLog[]> | ApiErrorResponse> {
        try {
            const limitNum = limit ? parseInt(limit, 10) : 10;
            this.logger.log(`Retrieving ${limitNum} most recent failed bundles`);

            const failures = await this.bundleLogService.getRecentFailures(limitNum);

            return ResponseBuilder.success(failures, 'Recent failures retrieved successfully', 'RECENT_FAILURES_RETRIEVED');
        } catch (error) {
            this.logger.error('Failed to retrieve recent failures', error);
            return ResponseBuilder.error('Failed to retrieve recent failures', 500, undefined, 'RECENT_FAILURES_ERROR');
        }
    }

    /**
     * Retrieves bundles that appear to be stuck in processing
     * 
     * Returns bundles that have been in "processing" status for longer than expected.
     * Useful for identifying system issues or hung processes.
     * 
     * @param olderThanMinutes - Consider bundles stuck if processing longer than this many minutes
     * @returns Array of bundle logs that appear to be stuck
     */
    @Get('stuck')
    @ApiOperation({
        summary: 'Get bundles stuck in processing',
        description: 'Retrieve bundles that have been in processing status longer than expected. Useful for identifying system issues.',
        operationId: 'getStuckBundles'
    })
    @ApiQuery({
        name: 'olderThanMinutes',
        required: false,
        type: Number,
        description: 'Consider bundles stuck if processing longer than this many minutes (default: 30)',
        example: 60
    })
    @ApiResponse({
        status: 200,
        description: 'Successfully retrieved stuck bundles',
        type: ApiSuccessResponse
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid olderThanMinutes parameter',
        type: ApiErrorResponse
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
        type: ApiErrorResponse
    })
    async getStuckBundles(@Query('olderThanMinutes') olderThanMinutes?: string): Promise<ApiSuccessResponse<BundleLog[]> | ApiErrorResponse> {
        try {
            const minutes = olderThanMinutes ? parseInt(olderThanMinutes, 10) : 30;
            this.logger.log(`Searching for bundles stuck in processing for more than ${minutes} minutes`);

            const stuckBundles = await this.bundleLogService.getStuckBundles(minutes);

            return ResponseBuilder.success(stuckBundles, 'Stuck bundles retrieved successfully', 'STUCK_BUNDLES_RETRIEVED');
        } catch (error) {
            this.logger.error('Failed to retrieve stuck bundles', error);
            return ResponseBuilder.error('Failed to retrieve stuck bundles', 500, undefined, 'STUCK_BUNDLES_ERROR');
        }
    }
}
