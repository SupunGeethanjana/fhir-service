import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Interface for index usage statistics from PostgreSQL.
 */
export interface IndexUsageStats {
    schemaname: string;
    tablename: string;
    indexname: string;
    idx_tup_read: number;
    idx_tup_fetch: number;
    idx_scan: number;
    size_bytes: number;
    size_pretty: string;
}

/**
 * Interface for query performance metrics.
 */
export interface QueryPerformanceMetric {
    resourceType: string;
    searchParameters: string[];
    optimizedParams: number;
    fallbackParams: number;
    resultCount: number;
    duration: number;
    timestamp: Date;
    indexesUsed?: string[];
}

/**
 * Interface for slow query detection.
 */
export interface SlowQueryAlert {
    resourceType: string;
    searchParameters: Record<string, string>;
    duration: number;
    resultCount: number;
    queryPlan?: string;
    timestamp: Date;
}

/**
 * Service for monitoring FHIR search performance and database index usage.
 * 
 * This service provides:
 * - Real-time query performance tracking
 * - Index usage statistics and analytics
 * - Slow query detection and alerting
 * - Performance trend analysis
 * - Index optimization recommendations
 * 
 * @example
 * ```typescript
 * // Track a search operation
 * const metric = await performanceService.trackSearchPerformance({
 *   resourceType: 'Patient',
 *   searchParameters: ['name', 'birthdate'],
 *   duration: 250,
 *   resultCount: 15
 * });
 * 
 * // Get index usage statistics
 * const stats = await performanceService.getIndexUsageStats();
 * ```
 */
@Injectable()
export class SearchPerformanceService {
    private readonly logger = new Logger(SearchPerformanceService.name);

    // In-memory storage for performance metrics (consider Redis for production)
    private readonly performanceMetrics: QueryPerformanceMetric[] = [];
    private readonly slowQueryAlerts: SlowQueryAlert[] = [];

    // Configuration
    private readonly SLOW_QUERY_THRESHOLD_MS = 1000; // 1 second
    private readonly MAX_STORED_METRICS = 10000;
    private readonly MAX_STORED_ALERTS = 1000;

    constructor(private readonly dataSource: DataSource) {
        this.logger.log('SearchPerformanceService initialized');
    }

    /**
     * Records performance metrics for a FHIR search operation.
     * 
     * @param metric - Performance metric to record
     * @returns Promise resolving to the recorded metric with additional analysis
     */
    async trackSearchPerformance(metric: QueryPerformanceMetric): Promise<QueryPerformanceMetric> {
        // Add timestamp if not provided
        if (!metric.timestamp) {
            metric.timestamp = new Date();
        }

        // Store the metric
        this.performanceMetrics.push(metric);

        // Maintain size limit
        if (this.performanceMetrics.length > this.MAX_STORED_METRICS) {
            this.performanceMetrics.shift();
        }

        // Check for slow query
        if (metric.duration > this.SLOW_QUERY_THRESHOLD_MS) {
            await this.handleSlowQuery(metric);
        }

        // Log performance summary
        this.logger.log('Search performance tracked', {
            resourceType: metric.resourceType,
            duration: `${metric.duration}ms`,
            resultCount: metric.resultCount,
            optimizationRatio: metric.optimizedParams / (metric.optimizedParams + metric.fallbackParams) || 0,
            isSlowQuery: metric.duration > this.SLOW_QUERY_THRESHOLD_MS
        });

        return metric;
    }

    /**
     * Handles slow query detection and alerting.
     * 
     * @param metric - Performance metric that triggered slow query detection
     */
    private async handleSlowQuery(metric: QueryPerformanceMetric): Promise<void> {
        const alert: SlowQueryAlert = {
            resourceType: metric.resourceType,
            searchParameters: metric.searchParameters.reduce((acc, param, index) => {
                acc[param] = `param_${index}`;
                return acc;
            }, {} as Record<string, string>),
            duration: metric.duration,
            resultCount: metric.resultCount,
            timestamp: metric.timestamp
        };

        // Store the alert
        this.slowQueryAlerts.push(alert);

        // Maintain size limit
        if (this.slowQueryAlerts.length > this.MAX_STORED_ALERTS) {
            this.slowQueryAlerts.shift();
        }

        // Log slow query warning
        this.logger.warn('Slow query detected', {
            resourceType: alert.resourceType,
            duration: `${alert.duration}ms`,
            searchParameters: alert.searchParameters,
            resultCount: alert.resultCount,
            threshold: `${this.SLOW_QUERY_THRESHOLD_MS}ms`
        });

        // Analyze for optimization opportunities
        await this.analyzeSlowQuery(alert);
    }

    /**
     * Analyzes slow queries for optimization opportunities.
     * 
     * @param alert - Slow query alert to analyze
     */
    private async analyzeSlowQuery(alert: SlowQueryAlert): Promise<void> {
        const recommendations: string[] = [];

        // Check if functional indexes exist for the search parameters
        const paramNames = Object.keys(alert.searchParameters);
        for (const param of paramNames) {
            const hasIndex = await this.checkFunctionalIndexExists(alert.resourceType, param);
            if (!hasIndex) {
                recommendations.push(`Consider adding functional index for ${alert.resourceType}.${param}`);
            }
        }

        // Check for missing subject reference indexes (common pattern)
        if (paramNames.includes('subject') || paramNames.includes('patient')) {
            recommendations.push('Verify subject/patient reference indexes are being used');
        }

        // Check for date range queries without proper casting
        const dateParams = paramNames.filter(p => p.includes('date') || p.includes('time'));
        if (dateParams.length > 0) {
            recommendations.push('Ensure date parameters use proper type casting for index usage');
        }

        if (recommendations.length > 0) {
            this.logger.warn('Query optimization recommendations', {
                resourceType: alert.resourceType,
                searchParameters: paramNames,
                recommendations
            });
        }
    }

    /**
     * Checks if a functional index exists for a specific resource type and parameter.
     * 
     * @param resourceType - FHIR resource type
     * @param paramName - Search parameter name
     * @returns Promise resolving to true if index exists
     */
    private async checkFunctionalIndexExists(resourceType: string, paramName: string): Promise<boolean> {
        const tableName = resourceType.toLowerCase();
        const expectedIndexName = `idx_${tableName}_${paramName.replace('-', '_')}`;

        try {
            const query = `
                SELECT indexname 
                FROM pg_indexes 
                WHERE schemaname = 'fhir' 
                  AND tablename = $1 
                  AND indexname = $2
            `;

            const result = await this.dataSource.query(query, [tableName, expectedIndexName]);
            return result.length > 0;
        } catch (error) {
            this.logger.error('Error checking functional index existence', {
                resourceType,
                paramName,
                error: error.message
            });
            return false;
        }
    }

    /**
     * Retrieves comprehensive index usage statistics from PostgreSQL.
     * 
     * @returns Promise resolving to array of index usage statistics
     */
    async getIndexUsageStats(): Promise<IndexUsageStats[]> {
        try {
            const query = `
                SELECT 
                    pui.schemaname,
                    pui.relname as tablename,
                    pui.indexrelname as indexname,
                    pui.idx_tup_read,
                    pui.idx_tup_fetch,
                    pui.idx_scan,
                    pg_relation_size(pui.indexrelid) as size_bytes,
                    pg_size_pretty(pg_relation_size(pui.indexrelid)) as size_pretty
                FROM pg_stat_user_indexes pui
                WHERE pui.schemaname = 'fhir'
                  AND pui.indexrelname LIKE 'idx_%'
                ORDER BY pui.idx_scan DESC, size_bytes DESC
            `;

            const results = await this.dataSource.query(query);

            this.logger.log('Retrieved index usage statistics', {
                indexCount: results.length,
                totalScans: results.reduce((sum: number, stat: any) => sum + parseInt(stat.idx_scan), 0)
            });

            return results;
        } catch (error) {
            this.logger.error('Error retrieving index usage statistics', {
                error: error.message
            });
            return [];
        }
    }

    /**
     * Gets performance analytics for a specific time period.
     * 
     * @param hours - Number of hours to analyze (default: 24)
     * @returns Performance analytics summary
     */
    getPerformanceAnalytics(hours = 24) {
        const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
        const recentMetrics = this.performanceMetrics.filter(m => m.timestamp >= cutoffTime);

        this.logger.log(`Performance analytics requested for ${hours} hours`, {
            totalStoredMetrics: this.performanceMetrics.length,
            recentMetrics: recentMetrics.length,
            cutoffTime: cutoffTime.toISOString()
        });

        if (recentMetrics.length === 0) {
            const emptyAnalytics = {
                period: `${hours} hours`,
                totalSearches: 0,
                avgDuration: 0,
                slowQueries: 0,
                avgOptimizationRatio: 0,
                resourceTypeStats: {},
                message: 'No search performance data available for the specified period. Data is collected when FHIR searches are performed.',
                totalStoredMetrics: this.performanceMetrics.length,
                oldestMetric: this.performanceMetrics.length > 0 ? this.performanceMetrics[0].timestamp : null,
                newestMetric: this.performanceMetrics.length > 0 ? this.performanceMetrics[this.performanceMetrics.length - 1].timestamp : null
            };

            this.logger.warn('No performance metrics found for requested period', emptyAnalytics);
            return emptyAnalytics;
        }

        const analytics = {
            period: `${hours} hours`,
            totalSearches: recentMetrics.length,
            avgDuration: recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length,
            slowQueries: recentMetrics.filter(m => m.duration > this.SLOW_QUERY_THRESHOLD_MS).length,
            avgOptimizationRatio: recentMetrics.reduce((sum, m) => {
                const total = m.optimizedParams + m.fallbackParams;
                return sum + (total > 0 ? m.optimizedParams / total : 0);
            }, 0) / recentMetrics.length,
            resourceTypeStats: this.analyzeResourceTypePerformance(recentMetrics)
        };

        this.logger.log('Performance analytics generated', {
            period: analytics.period,
            totalSearches: analytics.totalSearches,
            avgDuration: `${Math.round(analytics.avgDuration)}ms`,
            slowQueryPercentage: `${((analytics.slowQueries / analytics.totalSearches) * 100).toFixed(1)}%`,
            avgOptimizationRatio: `${(analytics.avgOptimizationRatio * 100).toFixed(1)}%`
        });

        return analytics;
    }

    /**
     * Analyzes performance by resource type.
     * 
     * @param metrics - Array of performance metrics to analyze
     * @returns Resource type performance statistics
     */
    private analyzeResourceTypePerformance(metrics: QueryPerformanceMetric[]) {
        const stats: Record<string, any> = {};

        for (const metric of metrics) {
            if (!stats[metric.resourceType]) {
                stats[metric.resourceType] = {
                    searches: 0,
                    totalDuration: 0,
                    totalResults: 0,
                    slowQueries: 0,
                    totalOptimized: 0,
                    totalFallback: 0
                };
            }

            const stat = stats[metric.resourceType];
            stat.searches++;
            stat.totalDuration += metric.duration;
            stat.totalResults += metric.resultCount;
            stat.totalOptimized += metric.optimizedParams;
            stat.totalFallback += metric.fallbackParams;

            if (metric.duration > this.SLOW_QUERY_THRESHOLD_MS) {
                stat.slowQueries++;
            }
        }

        // Calculate averages and ratios
        for (const resourceType in stats) {
            const stat = stats[resourceType];
            stat.avgDuration = Math.round(stat.totalDuration / stat.searches);
            stat.avgResults = Math.round(stat.totalResults / stat.searches);
            stat.slowQueryRatio = stat.slowQueries / stat.searches;
            stat.optimizationRatio = stat.totalOptimized / (stat.totalOptimized + stat.totalFallback) || 0;
        }

        return stats;
    }

    /**
     * Gets recent slow query alerts.
     * 
     * @param limit - Maximum number of alerts to return (default: 50)
     * @returns Array of recent slow query alerts
     */
    getSlowQueryAlerts(limit = 50): SlowQueryAlert[] {
        return this.slowQueryAlerts
            .slice(-limit)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    /**
     * Generates index optimization recommendations based on performance data.
     * 
     * @returns Array of optimization recommendations
     */
    async generateOptimizationRecommendations(): Promise<string[]> {
        const recommendations: string[] = [];
        const analytics = this.getPerformanceAnalytics(24);
        const indexStats = await this.getIndexUsageStats();

        // Check for unused indexes
        const unusedIndexes = indexStats.filter(stat => stat.idx_scan === 0);
        if (unusedIndexes.length > 0) {
            recommendations.push(`Consider removing ${unusedIndexes.length} unused indexes to improve write performance`);
        }

        // Check for high-cost, low-usage indexes
        const inefficientIndexes = indexStats.filter(stat =>
            stat.size_bytes > 100 * 1024 * 1024 && // > 100MB
            stat.idx_scan < 100 // < 100 scans
        );
        if (inefficientIndexes.length > 0) {
            recommendations.push(`Review ${inefficientIndexes.length} large, infrequently used indexes`);
        }

        // Check optimization ratio
        if (analytics.avgOptimizationRatio < 0.5) {
            recommendations.push('Low optimization ratio detected - consider adding more functional indexes');
        }

        // Check slow query percentage
        const slowQueryPercentage = analytics.slowQueries / analytics.totalSearches;
        if (slowQueryPercentage > 0.1) { // > 10%
            recommendations.push('High slow query rate - review search patterns and indexing strategy');
        }

        this.logger.log('Generated optimization recommendations', {
            recommendationCount: recommendations.length,
            recommendations
        });

        return recommendations;
    }

    /**
     * Analyzes and reports performance metrics.
     * Can be called manually or scheduled via external task scheduler.
     */
    async performanceAnalysisTask(): Promise<void> {
        try {
            const analytics = this.getPerformanceAnalytics(1); // Last hour
            const indexStats = await this.getIndexUsageStats();
            const recommendations = await this.generateOptimizationRecommendations();

            this.logger.log('Hourly performance analysis', {
                period: analytics.period,
                searches: analytics.totalSearches,
                avgDuration: `${Math.round(analytics.avgDuration)}ms`,
                slowQueries: analytics.slowQueries,
                indexCount: indexStats.length,
                recommendations: recommendations.length
            });

            // Log recommendations if any
            if (recommendations.length > 0) {
                this.logger.warn('Performance optimization recommendations', {
                    recommendations
                });
            }

        } catch (error) {
            this.logger.error('Error in performance analysis task', {
                error: error.message
            });
        }
    }

    /**
     * Resets all performance metrics and alerts.
     * Useful for testing or clearing historical data.
     */
    resetMetrics(): void {
        this.performanceMetrics.length = 0;
        this.slowQueryAlerts.length = 0;
        this.logger.log('Performance metrics reset');
    }

    /**
     * Generates sample performance data for testing and demonstration purposes.
     * This method should only be used in development/testing environments.
     */
    generateSamplePerformanceData(): void {
        this.logger.log('Generating sample performance data for testing');

        const resourceTypes = ['Patient', 'Practitioner', 'Encounter', 'Observation', 'Condition'];
        const sampleData: QueryPerformanceMetric[] = [];

        // Generate sample data for the last 24 hours
        for (let i = 0; i < 50; i++) {
            const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
            const searchParamCount = Math.floor(Math.random() * 4) + 1;
            const optimizedParams = Math.floor(Math.random() * searchParamCount);
            const duration = Math.floor(Math.random() * 2000) + 50; // 50ms to 2050ms
            const resultCount = Math.floor(Math.random() * 100);

            // Create timestamp within last 24 hours
            const timestamp = new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000));

            sampleData.push({
                resourceType,
                searchParameters: [`param${i % 3}`, `param${i % 4}`].slice(0, searchParamCount),
                optimizedParams,
                fallbackParams: searchParamCount - optimizedParams,
                resultCount,
                duration,
                timestamp,
                indexesUsed: [`idx_${resourceType.toLowerCase()}_param1`, `idx_${resourceType.toLowerCase()}_param2`]
            });
        }

        // Add the sample data to the metrics array
        this.performanceMetrics.push(...sampleData);

        // Maintain size limit
        while (this.performanceMetrics.length > this.MAX_STORED_METRICS) {
            this.performanceMetrics.shift();
        }

        this.logger.log(`Generated ${sampleData.length} sample performance metrics`, {
            totalMetrics: this.performanceMetrics.length,
            resourceTypes: resourceTypes
        });
    }

    /**
     * Clears all performance metrics data.
     * This method should only be used in development/testing environments.
     */
    clearPerformanceData(): void {
        const previousCount = this.performanceMetrics.length;
        this.performanceMetrics.length = 0;
        this.logger.log(`Cleared ${previousCount} performance metrics`);
    }

    /**
     * Gets detailed information about all indexes in the fhir schema for debugging.
     */
    async getDetailedIndexInfo(): Promise<any[]> {

        try {
            const query = `
                SELECT 
                    i.schemaname,
                    i.tablename,
                    i.indexname,
                    i.indexdef,
                    COALESCE(s.idx_scan, 0) as idx_scan,
                    COALESCE(s.idx_tup_read, 0) as idx_tup_read,
                    COALESCE(s.idx_tup_fetch, 0) as idx_tup_fetch,
                    pg_size_pretty(pg_relation_size(c.oid)) as index_size,
                    pg_relation_size(c.oid) as size_bytes
                FROM pg_indexes i
                LEFT JOIN pg_stat_user_indexes s ON s.indexrelname = i.indexname AND s.schemaname = i.schemaname
                LEFT JOIN pg_class c ON c.relname = i.indexname
                WHERE i.schemaname = 'fhir'
                ORDER BY i.tablename, i.indexname
            `;

            const results = await this.dataSource.query(query);

            this.logger.log('Retrieved detailed index information', {
                totalIndexes: results.length,
                usedIndexes: results.filter((r: any) => r.idx_scan > 0).length
            });

            return results;
        } catch (error) {
            this.logger.error('Error retrieving detailed index information', {
                error: error.message
            });
            return [];
        }
    }

    /**
     * Executes an EXPLAIN ANALYZE on a sample query to see if indexes are being used.
     */
    async analyzeQueryPlan(resourceType = 'Patient'): Promise<any> {
        try {
            const tableName = resourceType.toLowerCase();
            const query = `
                EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
                SELECT id, resource FROM fhir.${tableName} 
                WHERE deleted_at IS NULL 
                LIMIT 10
            `;

            const results = await this.dataSource.query(query);

            this.logger.log(`Query plan analysis for ${resourceType}`, {
                query: query,
                planExists: results.length > 0
            });

            return results;
        } catch (error) {
            this.logger.error(`Error analyzing query plan for ${resourceType}`, {
                error: error.message
            });
            return [];
        }
    }
}
