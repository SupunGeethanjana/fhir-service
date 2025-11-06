import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { BundleDto } from '../../common/dtos/budle.dto';
import { TransactionDuplicateDetectionService } from '../transactions/detectors/transaction-duplicate-detection.service';
import { BundleLog } from './bundle-log.entity';

/**
 * Interface for bundle log query filters
 */
export interface BundleLogQueryOptions {
    status?: string;
    bundleType?: string;
    submittedBy?: string;
    sourceSystem?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}

/**
 * Interface for bundle log statistics
 */
export interface BundleLogStats {
    totalBundles: number;
    successfulBundles: number;
    failedBundles: number;
    averageProcessingTimeMs: number;
    bundlesByType: Record<string, number>;
    bundlesByStatus: Record<string, number>;
}

/**
 * Interface for creating a new bundle log entry
 */
export interface CreateBundleLogOptions {
    submittedBy?: string;
    sourceSystem?: string;
}

/**
 * Service for managing bundle transaction logs
 * 
 * Provides comprehensive logging, querying, and analysis capabilities
 * for FHIR bundle transactions.
 * 
 * @author FHIR Service Team
 * @version 1.0.0
 */
@Injectable()
export class BundleLogService {
    private readonly logger = new Logger(BundleLogService.name);

    constructor(
        @InjectRepository(BundleLog)
        private readonly bundleLogRepository: Repository<BundleLog>,
        @Inject(forwardRef(() => TransactionDuplicateDetectionService))
        private readonly duplicateDetectionService: TransactionDuplicateDetectionService,
    ) { }

    /**
     * Creates an initial bundle log entry when transaction processing starts
     */
    async createBundleLog(
        bundle: BundleDto,
        txid: string,
        startTime: Date = new Date(),
        options: CreateBundleLogOptions = {}
    ): Promise<BundleLog> {
        // Generate content hash for duplicate detection
        const contentHash = this.duplicateDetectionService.generateBundleContentHash(bundle);
        const bundleSummary = this.createBundleSummary(bundle, contentHash);

        const bundleLog = this.bundleLogRepository.create({
            txid,
            bundleType: bundle.type || 'transaction',
            resourceCount: bundle.entry?.length || 0,
            submittedAt: startTime,
            status: 'processing',
            bundleSummary,
            bundleContent: bundle, // Store the full bundle
            submittedBy: options.submittedBy,
            sourceSystem: options.sourceSystem,
        });

        const savedLog = await this.bundleLogRepository.save(bundleLog);
        this.logger.debug(`Created bundle log entry with txid: ${txid}`);
        return savedLog;
    }

    /**
     * Updates bundle log entry upon successful completion
     */
    async markBundleSuccess(bundleLogId: string, startTime: Date): Promise<void> {
        const completedAt = new Date();
        const processingDurationMs = completedAt.getTime() - startTime.getTime();

        await this.bundleLogRepository.update(bundleLogId, {
            status: 'success',
            completedAt,
            processingDurationMs,
        });

        this.logger.debug(`Marked bundle log ${bundleLogId} as successful (${processingDurationMs}ms)`);
    }

    /**
     * Updates bundle log entry upon failure
     */
    async markBundleFailure(bundleLogId: string, error: any, startTime: Date): Promise<void> {
        const completedAt = new Date();
        const processingDurationMs = completedAt.getTime() - startTime.getTime();

        const errorDetails = {
            message: error.message || 'Unknown error',
            stack: error.stack || 'No stack trace available',
            errorType: error.constructor?.name || 'Error',
            occurredAt: completedAt.toISOString(),
        };

        await this.bundleLogRepository.update(bundleLogId, {
            status: 'failed',
            completedAt,
            processingDurationMs,
            errorDetails: errorDetails,
        } as any);

        this.logger.error(`Marked bundle log ${bundleLogId} as failed: ${error.message}`);
    }

    /**
     * Creates a lightweight summary of bundle contents for efficient storage and querying
     */
    private createBundleSummary(bundle: BundleDto, contentHash?: string): any {
        const resourceTypes = new Map<string, number>();
        const operations = new Set<string>();
        let totalSizeEstimate = 0;

        bundle.entry?.forEach(entry => {
            if (entry.resource?.resourceType) {
                const type = entry.resource.resourceType;
                resourceTypes.set(type, (resourceTypes.get(type) || 0) + 1);
            }

            if (entry.request?.method) {
                operations.add(entry.request.method);
            }

            // Rough size estimate
            totalSizeEstimate += JSON.stringify(entry).length;
        });

        return {
            resourceTypes: Object.fromEntries(resourceTypes),
            operations: Array.from(operations),
            totalSizeEstimate,
            bundle_id: bundle.id || 'unknown',
            content_hash: contentHash,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Retrieves bundle logs with optional filtering and pagination
     */
    async findBundleLogs(options: BundleLogQueryOptions = {}): Promise<BundleLog[]> {
        const query = this.bundleLogRepository.createQueryBuilder('bl');

        // Apply filters
        if (options.status) {
            query.andWhere('bl.status = :status', { status: options.status });
        }

        if (options.bundleType) {
            query.andWhere('bl.bundleType = :bundleType', { bundleType: options.bundleType });
        }

        if (options.submittedBy) {
            query.andWhere('bl.submittedBy = :submittedBy', { submittedBy: options.submittedBy });
        }

        if (options.sourceSystem) {
            query.andWhere('bl.sourceSystem = :sourceSystem', { sourceSystem: options.sourceSystem });
        }

        if (options.startDate && options.endDate) {
            query.andWhere('bl.submittedAt BETWEEN :startDate AND :endDate', {
                startDate: options.startDate,
                endDate: options.endDate,
            });
        } else if (options.startDate) {
            query.andWhere('bl.submittedAt >= :startDate', { startDate: options.startDate });
        } else if (options.endDate) {
            query.andWhere('bl.submittedAt <= :endDate', { endDate: options.endDate });
        }

        // Apply pagination
        if (options.limit) {
            query.take(options.limit);
        }

        if (options.offset) {
            query.skip(options.offset);
        }

        // Order by most recent first
        query.orderBy('bl.submittedAt', 'DESC');

        const results = await query.getMany();
        this.logger.debug(`Retrieved ${results.length} bundle logs with filters: ${JSON.stringify(options)}`);

        return results;
    }

    /**
     * Retrieves a specific bundle log by transaction ID
     */
    async findByTxid(txid: string): Promise<BundleLog | null> {
        this.logger.debug(`Searching for bundle log with txid: ${txid}`);

        const bundleLog = await this.bundleLogRepository.findOne({
            where: { txid },
        });

        if (bundleLog) {
            this.logger.debug(`Found bundle log for txid: ${txid}`);
        } else {
            this.logger.warn(`No bundle log found for txid: ${txid}`);
        }

        return bundleLog;
    }

    /**
     * Generates statistics for bundle processing
     */
    async getBundleStats(startDate?: Date, endDate?: Date): Promise<BundleLogStats> {
        const query = this.bundleLogRepository.createQueryBuilder('bl');

        if (startDate && endDate) {
            query.where('bl.submittedAt BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            });
        }

        const bundles = await query.getMany();

        const stats: BundleLogStats = {
            totalBundles: bundles.length,
            successfulBundles: bundles.filter(b => b.status === 'success').length,
            failedBundles: bundles.filter(b => b.status === 'failed').length,
            averageProcessingTimeMs: 0,
            bundlesByType: {},
            bundlesByStatus: {},
        };

        // Calculate average processing time
        const completedBundles = bundles.filter(b => b.processingDurationMs !== null);
        if (completedBundles.length > 0) {
            const totalProcessingTime = completedBundles.reduce(
                (sum, bundle) => sum + (bundle.processingDurationMs || 0),
                0
            );
            stats.averageProcessingTimeMs = Math.round(totalProcessingTime / completedBundles.length);
        }

        // Group by bundle type
        bundles.forEach(bundle => {
            stats.bundlesByType[bundle.bundleType] = (stats.bundlesByType[bundle.bundleType] || 0) + 1;
            stats.bundlesByStatus[bundle.status] = (stats.bundlesByStatus[bundle.status] || 0) + 1;
        });

        this.logger.debug(`Generated bundle statistics: ${JSON.stringify(stats)}`);
        return stats;
    }

    /**
     * Retrieves recent failed bundles for troubleshooting
     */
    async getRecentFailures(limit = 10): Promise<BundleLog[]> {
        this.logger.debug(`Retrieving ${limit} most recent failed bundles`);

        return await this.bundleLogRepository.find({
            where: { status: 'failed' },
            order: { submittedAt: 'DESC' },
            take: limit,
        });
    }

    /**
     * Retrieves bundles that are still in processing state (potentially stuck)
     */
    async getStuckBundles(olderThanMinutes = 30): Promise<BundleLog[]> {
        const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);

        this.logger.debug(`Searching for bundles stuck in processing since before ${cutoffTime.toISOString()}`);

        return await this.bundleLogRepository.find({
            where: {
                status: 'processing',
                submittedAt: Between(new Date('2000-01-01'), cutoffTime),
            },
            order: { submittedAt: 'ASC' },
        });
    }
}
