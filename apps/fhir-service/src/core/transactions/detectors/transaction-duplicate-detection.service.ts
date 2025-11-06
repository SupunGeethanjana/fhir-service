import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { BundleDto } from '../../../common/dtos/budle.dto';
import {
    BundleIdentificationMethod,
    DuplicateValidationType
} from '../../../common/enums/fhir-enums';
import { BundleLogService } from '../../bundles/bundle-log.service';

/**
 * Interface for bundle-level duplicate detection results
 */
export interface BundleDuplicateResult {
    isDuplicate: boolean;
    duplicateType?: DuplicateValidationType;
    existingLogEntry?: any;
    detectionMethod?: BundleIdentificationMethod;
}

/**
 * Service responsible for detecting duplicate bundles using the bundle_log table
 */
@Injectable()
export class TransactionDuplicateDetectionService {
    private readonly logger = new Logger(TransactionDuplicateDetectionService.name);

    constructor(
        @Inject(forwardRef(() => BundleLogService))
        private readonly bundleLogService: BundleLogService
    ) { }

    /**
     * Checks for bundle-level duplicates using the bundle_log table
     * This prevents entire bundle reprocessing and enables cached responses
     */
    async checkBundleDuplicate(bundle: BundleDto, txid: string): Promise<BundleDuplicateResult> {
        try {
            // Generate bundle content hash for duplicate detection
            const bundleContentHash = this.generateBundleContentHash(bundle);

            // Check for existing bundle logs
            let existingLogEntry = null;
            let detectionMethod = BundleIdentificationMethod.CONTENT_HASH;

            // Method 1: Search recent bundle logs and check for duplicates
            // Since we don't have specific methods, we'll check recent logs
            const recentLogs = await this.bundleLogService.findBundleLogs({
                bundleType: bundle.type,
                limit: 50 // Check recent bundles for efficiency
            });

            // Check for bundle ID match first
            if (bundle.id) {
                for (const log of recentLogs) {
                    const bundleSummary = log.bundleSummary || {};
                    if (bundleSummary.bundle_id === bundle.id) {
                        existingLogEntry = log;
                        detectionMethod = BundleIdentificationMethod.BUNDLE_ID;
                        break;
                    }
                }
            }

            // Method 2: Check by content hash if no bundle ID match
            if (!existingLogEntry && bundleContentHash) {
                for (const log of recentLogs) {
                    const bundleSummary = log.bundleSummary || {};
                    if (bundleSummary.content_hash === bundleContentHash) {
                        existingLogEntry = log;
                        detectionMethod = BundleIdentificationMethod.CONTENT_HASH;
                        break;
                    }
                }
            }

            if (existingLogEntry) {
                // Determine duplicate type based on comparison
                const duplicateType = await this.determineDuplicateType(
                    bundle,
                    existingLogEntry,
                    bundleContentHash,
                    detectionMethod
                );

                return {
                    isDuplicate: true,
                    duplicateType,
                    existingLogEntry,
                    detectionMethod
                };
            }

            return { isDuplicate: false };

        } catch (error) {
            this.logger.warn(`Error during bundle duplicate check for txid ${txid}`, {
                error: error.message
            });
            return { isDuplicate: false };
        }
    }

    /**
     * Generates a content hash for bundle duplicate detection
     */
    generateBundleContentHash(bundle: BundleDto): string {
        try {
            // Create a normalized representation of the bundle for hashing
            const normalizedBundle = {
                type: bundle.type,
                entry: bundle.entry?.map(entry => ({
                    request: entry.request,
                    resource: {
                        resourceType: entry.resource?.resourceType,
                        // Include key identifying fields but not metadata
                        ...this.normalizeResourceForHashing(entry.resource)
                    }
                }))
            };

            // Generate SHA-256 hash of the normalized bundle
            const crypto = require('crypto');
            const bundleString = JSON.stringify(normalizedBundle);
            return crypto.createHash('sha256').update(bundleString).digest('hex');

        } catch (error) {
            this.logger.warn('Failed to generate bundle content hash', { error: error.message });
            return null;
        }
    }

    /**
     * Normalizes resource data for consistent hashing
     */
    private normalizeResourceForHashing(resource: any): any {
        if (!resource) return {};

        const normalized = { ...resource };

        // Remove metadata that shouldn't affect duplicate detection
        delete normalized.id;
        delete normalized.meta;
        delete normalized.text;

        // Sort arrays and objects for consistent hashing
        this.sortObjectForHashing(normalized);

        return normalized;
    }

    /**
     * Recursively sorts object properties and arrays for consistent hashing
     */
    private sortObjectForHashing(obj: any): void {
        if (Array.isArray(obj)) {
            obj.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
            obj.forEach(item => this.sortObjectForHashing(item));
        } else if (obj && typeof obj === 'object') {
            Object.keys(obj).sort().forEach(key => {
                this.sortObjectForHashing(obj[key]);
            });
        }
    }

    /**
     * Determines the type of duplicate based on comparison
     */
    private async determineDuplicateType(
        currentBundle: BundleDto,
        existingLogEntry: any,
        currentContentHash: string,
        detectionMethod: BundleIdentificationMethod
    ): Promise<DuplicateValidationType> {
        try {
            const existingBundleSummary = existingLogEntry.bundle_summary || {};
            const existingContentHash = existingBundleSummary.content_hash;

            // If content hashes match exactly, it's an exact duplicate
            if (currentContentHash && existingContentHash && currentContentHash === existingContentHash) {
                return DuplicateValidationType.EXACT_MATCH;
            }

            // If bundle IDs match but content differs, it's content mismatch
            if (detectionMethod === BundleIdentificationMethod.BUNDLE_ID && currentContentHash !== existingContentHash) {
                return DuplicateValidationType.CONTENT_MISMATCH;
            }

            // If detected by content hash but other metadata differs, could be ID collision
            if (detectionMethod === BundleIdentificationMethod.CONTENT_HASH) {
                return DuplicateValidationType.ID_COLLISION;
            }

            // Check for partial duplicates by analyzing individual resources
            const hasPartialDuplicates = await this.checkPartialBundleDuplicates(currentBundle, existingLogEntry);
            if (hasPartialDuplicates) {
                return DuplicateValidationType.PARTIAL_DUPLICATE;
            }

            // Default to idempotency violation
            return DuplicateValidationType.IDEMPOTENCY_VIOLATION;

        } catch (error) {
            this.logger.warn('Error determining duplicate type', { error: error.message });
            return DuplicateValidationType.CONTENT_MISMATCH;
        }
    }

    /**
     * Checks if current bundle has partial duplicates with existing bundle
     */
    private async checkPartialBundleDuplicates(
        currentBundle: BundleDto,
        existingLogEntry: any
    ): Promise<boolean> {
        try {
            // This would involve more complex logic to compare individual resources
            // For now, return false - can be enhanced later
            return false;
        } catch (error) {
            this.logger.warn('Error checking partial bundle duplicates', { error: error.message });
            return false;
        }
    }
}
