import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponse, ApiSuccessResponse } from '../../common/dtos/api-response.dto';
import { ResponseBuilder } from '../../common/dtos/response-builder';
import { SearchPerformanceService } from './search-performance.service';

/**
 * Controller for exposing FHIR search performance metrics and analytics.
 * 
 * Provides REST endpoints for:
 * - Real-time performance monitoring
 * - Index usage statistics
 * - Slow query alerts
 * - Optimization recommendations
 * 
 * These endpoints are intended for administrators and monitoring systems
 * to track and optimize FHIR search performance.
 */
@ApiTags('Performance Monitoring')
@Controller('performance')
export class SearchPerformanceController {
    private readonly logger = new Logger(SearchPerformanceController.name);

    constructor(
        private readonly performanceService: SearchPerformanceService
    ) { }

    /**
     * Get performance analytics for a specified time period.
     * 
     * @param hours - Number of hours to analyze (default: 24)
     * @returns Performance analytics summary
     */
    @Get('analytics')
    @ApiOperation({
        summary: 'Get search performance analytics',
        description: 'Returns comprehensive performance metrics including average duration, optimization ratios, and resource-specific statistics for the specified time period.'
    })
    @ApiQuery({
        name: 'hours',
        required: false,
        type: Number,
        description: 'Number of hours to analyze (default: 24)',
        example: 24
    })
    @ApiResponse({
        status: 200,
        description: 'Performance analytics retrieved successfully',
        type: ApiSuccessResponse
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
        type: ApiErrorResponse
    })
    async getPerformanceAnalytics(
        @Query('hours') hours?: number
    ): Promise<ApiSuccessResponse<any> | ApiErrorResponse> {
        try {
            const analysisHours = hours || 24;

            this.logger.log('Performance analytics requested', {
                hours: analysisHours
            });

            const analytics = this.performanceService.getPerformanceAnalytics(analysisHours);

            return ResponseBuilder.success(
                analytics,
                `Performance analytics retrieved for ${analysisHours} hours`,
                'ANALYTICS_SUCCESS'
            );
        } catch (error) {
            this.logger.error('Failed to get performance analytics', error);
            return ResponseBuilder.internalError('Failed to retrieve performance analytics');
        }
    }

    /**
     * Get database index usage statistics.
     * 
     * @returns Array of index usage statistics from PostgreSQL
     */
    @Get('indexes')
    @ApiOperation({
        summary: 'Get database index usage statistics',
        description: 'Returns comprehensive index usage metrics from PostgreSQL including scan counts, tuple reads, and index sizes.'
    })
    @ApiResponse({
        status: 200,
        description: 'Index statistics retrieved successfully',
        type: ApiSuccessResponse
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
        type: ApiErrorResponse
    })
    async getIndexUsageStats(): Promise<ApiSuccessResponse<any> | ApiErrorResponse> {
        try {
            this.logger.log('Index usage statistics requested');

            const stats = await this.performanceService.getIndexUsageStats();

            this.logger.log('Index usage statistics retrieved', {
                indexCount: stats.length
            });

            const result = {
                indexes: stats,
                summary: {
                    totalIndexes: stats.length,
                    totalScans: stats.reduce((sum, stat) => sum + stat.idx_scan, 0),
                    totalSize: stats.reduce((sum, stat) => sum + stat.size_bytes, 0)
                },
                timestamp: new Date().toISOString()
            };

            return ResponseBuilder.success(result, 'Index usage statistics retrieved successfully', 'INDEX_STATS_SUCCESS');
        } catch (error) {
            this.logger.error('Error retrieving index usage statistics', error);
            return ResponseBuilder.error('Failed to retrieve index usage statistics', 500, undefined, 'INDEX_STATS_ERROR');
        }
    }

    /**
     * Get recent slow query alerts.
     * 
     * @param limit - Maximum number of alerts to return (default: 50)
     * @returns Array of recent slow query alerts
     */
    @Get('slow-queries')
    @ApiOperation({
        summary: 'Get recent slow query alerts',
        description: 'Returns recent queries that exceeded the performance threshold, including execution details and optimization suggestions.'
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Maximum number of alerts to return (default: 50)',
        example: 50
    })
    @ApiResponse({
        status: 200,
        description: 'Slow query alerts retrieved successfully',
        type: ApiSuccessResponse
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
        type: ApiErrorResponse
    })
    async getSlowQueryAlerts(
        @Query('limit') limit?: number
    ): Promise<ApiSuccessResponse<any> | ApiErrorResponse> {
        try {
            const alertLimit = limit || 50;

            this.logger.log('Slow query alerts requested', {
                limit: alertLimit
            });

            const alerts = this.performanceService.getSlowQueryAlerts(alertLimit);

            const result = {
                alerts: alerts,
                summary: {
                    totalAlerts: alerts.length,
                    avgDuration: alerts.length > 0
                        ? alerts.reduce((sum, alert) => sum + alert.duration, 0) / alerts.length
                        : 0
                },
                timestamp: new Date().toISOString()
            };

            return ResponseBuilder.success(result, 'Slow query alerts retrieved successfully', 'SLOW_QUERY_ALERTS_SUCCESS');
        } catch (error) {
            this.logger.error('Failed to retrieve slow query alerts', error);
            return ResponseBuilder.error('Failed to retrieve slow query alerts', 500, undefined, 'SLOW_QUERY_ALERTS_ERROR');
        }
    }

    /**
     * Get optimization recommendations based on performance analysis.
     * 
     * @returns Array of optimization recommendations
     */
    @Get('recommendations')
    @ApiOperation({
        summary: 'Get performance optimization recommendations',
        description: 'Returns AI-generated recommendations for improving FHIR search performance based on recent usage patterns and index statistics.'
    })
    @ApiResponse({
        status: 200,
        description: 'Optimization recommendations generated successfully',
        type: ApiSuccessResponse
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
        type: ApiErrorResponse
    })
    async getOptimizationRecommendations(): Promise<ApiSuccessResponse<any> | ApiErrorResponse> {
        try {
            this.logger.log('Optimization recommendations requested');

            const recommendations = await this.performanceService.generateOptimizationRecommendations();

            // Categorize recommendations by priority
            const categorized = this.categorizeRecommendations(recommendations);

            this.logger.log('Optimization recommendations generated', {
                totalRecommendations: recommendations.length,
                highPriority: categorized.high.length,
                mediumPriority: categorized.medium.length,
                lowPriority: categorized.low.length
            });

            const result = {
                recommendations: recommendations,
                priority: categorized,
                summary: {
                    totalRecommendations: recommendations.length,
                    highPriorityCount: categorized.high.length,
                    mediumPriorityCount: categorized.medium.length,
                    lowPriorityCount: categorized.low.length
                },
                timestamp: new Date().toISOString()
            };

            return ResponseBuilder.success(result, 'Optimization recommendations generated successfully', 'OPTIMIZATION_RECOMMENDATIONS_SUCCESS');
        } catch (error) {
            this.logger.error('Error generating optimization recommendations', error);
            return ResponseBuilder.error('Failed to generate optimization recommendations', 500, undefined, 'OPTIMIZATION_RECOMMENDATIONS_ERROR');
        }
    }

    /**
     * Get a health check of the search performance system.
     * 
     * @returns System health status and key metrics
     */
    @Get('health')
    @ApiOperation({
        summary: 'Get search performance system health',
        description: 'Returns a quick health check of the search performance monitoring system with key indicators.'
    })
    @ApiResponse({
        status: 200,
        description: 'Health check completed successfully',
        type: ApiSuccessResponse
    })
    @ApiResponse({
        status: 500,
        description: 'Health check failed',
        type: ApiErrorResponse
    })
    async getHealthCheck(): Promise<ApiSuccessResponse<any> | ApiErrorResponse> {
        try {
            this.logger.log('Health check requested');

            const analytics = this.performanceService.getPerformanceAnalytics(1); // Last hour
            const indexStats = await this.performanceService.getIndexUsageStats();

            // Calculate health indicators
            const avgResponseTime = analytics.avgDuration;
            const slowQueryRate = analytics.totalSearches > 0
                ? analytics.slowQueries / analytics.totalSearches
                : 0;
            const indexUtilization = indexStats.length > 0
                ? indexStats.filter(stat => stat.idx_scan > 0).length / indexStats.length
                : 0;

            // Determine overall health status
            let status = 'healthy';
            const checks = {
                database: 'ok',
                indexes: 'ok',
                performance: 'ok'
            };

            if (avgResponseTime > 500) {
                checks.performance = 'warning';
                status = 'warning';
            }
            if (avgResponseTime > 1000) {
                checks.performance = 'critical';
                status = 'critical';
            }

            if (slowQueryRate > 0.1) {
                checks.performance = 'warning';
                if (status !== 'critical') status = 'warning';
            }
            if (slowQueryRate > 0.2) {
                checks.performance = 'critical';
                status = 'critical';
            }

            if (indexUtilization < 0.5) {
                checks.indexes = 'warning';
                if (status !== 'critical') status = 'warning';
            }

            const result = {
                status,
                checks,
                metrics: {
                    avgResponseTime: Math.round(avgResponseTime),
                    slowQueryRate: Math.round(slowQueryRate * 100) / 100,
                    indexUtilization: Math.round(indexUtilization * 100) / 100
                },
                timestamp: new Date().toISOString()
            };

            return ResponseBuilder.success(result, 'Health check completed successfully', 'HEALTH_CHECK_SUCCESS');
        } catch (error) {
            this.logger.error('Error during health check', error);
            return ResponseBuilder.error('Health check failed', 500, undefined, 'HEALTH_CHECK_ERROR');
        }
    }

    /**
     * Categorizes optimization recommendations by priority.
     * 
     * @param recommendations - Array of recommendation strings
     * @returns Categorized recommendations
     */
    private categorizeRecommendations(recommendations: string[]) {
        const categorized = {
            high: [] as string[],
            medium: [] as string[],
            low: [] as string[]
        };

        for (const rec of recommendations) {
            const lowerRec = rec.toLowerCase();

            if (lowerRec.includes('critical') || lowerRec.includes('slow query') || lowerRec.includes('unused index')) {
                categorized.high.push(rec);
            } else if (lowerRec.includes('consider') || lowerRec.includes('review') || lowerRec.includes('optimization')) {
                categorized.medium.push(rec);
            } else {
                categorized.low.push(rec);
            }
        }

        return categorized;
    }

    /**
     * Generate sample performance data for testing.
     * This endpoint should only be used in development/testing environments.
     */
    @Get('sample-data/generate')
    @ApiOperation({
        summary: 'Generate sample performance data',
        description: 'Creates sample performance metrics for testing analytics endpoints. Should only be used in development.'
    })
    @ApiResponse({
        status: 200,
        description: 'Sample data generated successfully',
        type: ApiSuccessResponse
    })
    async generateSampleData(): Promise<ApiSuccessResponse<any> | ApiErrorResponse> {
        try {
            this.logger.log('Generating sample performance data');
            this.performanceService.generateSamplePerformanceData();

            return ResponseBuilder.success(
                { message: 'Sample performance data generated successfully' },
                'Sample data created for testing analytics',
                'SAMPLE_DATA_GENERATED'
            );
        } catch (error) {
            this.logger.error('Failed to generate sample data', error);
            return ResponseBuilder.internalError('Failed to generate sample performance data');
        }
    }

    /**
     * Clear all performance data.
     * This endpoint should only be used in development/testing environments.
     */
    @Get('sample-data/clear')
    @ApiOperation({
        summary: 'Clear all performance data',
        description: 'Removes all stored performance metrics. Should only be used in development.'
    })
    @ApiResponse({
        status: 200,
        description: 'Performance data cleared successfully',
        type: ApiSuccessResponse
    })
    async clearPerformanceData(): Promise<ApiSuccessResponse<any> | ApiErrorResponse> {
        try {
            this.logger.log('Clearing performance data');
            this.performanceService.clearPerformanceData();

            return ResponseBuilder.success(
                { message: 'Performance data cleared successfully' },
                'All performance metrics have been removed',
                'PERFORMANCE_DATA_CLEARED'
            );
        } catch (error) {
            this.logger.error('Failed to clear performance data', error);
            return ResponseBuilder.internalError('Failed to clear performance data');
        }
    }

    /**
     * Get detailed index information for debugging.
     */
    @Get('indexes/detailed')
    @ApiOperation({
        summary: 'Get detailed index information',
        description: 'Returns comprehensive index information including definitions and usage statistics for debugging.'
    })
    @ApiResponse({
        status: 200,
        description: 'Detailed index information retrieved successfully',
        type: ApiSuccessResponse
    })
    async getDetailedIndexInfo(): Promise<ApiSuccessResponse<any> | ApiErrorResponse> {
        try {
            this.logger.log('Detailed index information requested');
            const indexInfo = await this.performanceService.getDetailedIndexInfo();

            return ResponseBuilder.success(
                {
                    indexes: indexInfo,
                    summary: {
                        totalIndexes: indexInfo.length,
                        usedIndexes: indexInfo.filter((idx: any) => idx.idx_scan > 0).length,
                        unusedIndexes: indexInfo.filter((idx: any) => idx.idx_scan === 0).length
                    }
                },
                'Detailed index information retrieved successfully',
                'DETAILED_INDEX_INFO_SUCCESS'
            );
        } catch (error) {
            this.logger.error('Failed to get detailed index information', error);
            return ResponseBuilder.internalError('Failed to retrieve detailed index information');
        }
    }

    /**
     * Analyze query execution plan for a specific resource type.
     */
    @Get('query-plan')
    @ApiOperation({
        summary: 'Analyze query execution plan',
        description: 'Returns EXPLAIN ANALYZE output to see if indexes are being used in queries.'
    })
    @ApiQuery({
        name: 'resourceType',
        required: false,
        type: String,
        description: 'Resource type to analyze (default: Patient)',
        example: 'Patient'
    })
    @ApiResponse({
        status: 200,
        description: 'Query plan analysis completed successfully',
        type: ApiSuccessResponse
    })
    async analyzeQueryPlan(
        @Query('resourceType') resourceType = 'Patient'
    ): Promise<ApiSuccessResponse<any> | ApiErrorResponse> {
        try {
            this.logger.log(`Query plan analysis requested for ${resourceType}`);
            const queryPlan = await this.performanceService.analyzeQueryPlan(resourceType);

            return ResponseBuilder.success(
                { queryPlan },
                `Query plan analysis completed for ${resourceType}`,
                'QUERY_PLAN_ANALYSIS_SUCCESS'
            );
        } catch (error) {
            this.logger.error(`Failed to analyze query plan for ${resourceType}`, error);
            return ResponseBuilder.internalError('Failed to analyze query execution plan');
        }
    }
}
