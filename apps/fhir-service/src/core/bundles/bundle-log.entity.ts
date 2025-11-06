import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * BundleLog Entity
 * 
 * Tracks FHIR bundle transaction submissions for audit, monitoring, and analytics purposes.
 * This entity provides lightweight tracking without storing full bundle content,
 * enabling efficient audit trails while maintaining optimal storage usage.
 * 
 * @author FHIR Service Team
 * @version 1.0.0
 */
@Entity('bundle_log')
@Index('idx_bundle_log_txid', ['txid'])
@Index('idx_bundle_log_status', ['status'])
@Index('idx_bundle_log_submitted_at', ['submittedAt'])
@Index('idx_bundle_log_bundle_type', ['bundleType'])
@Index('idx_bundle_log_submitted_by', ['submittedBy'])
@Index('idx_bundle_log_source_system', ['sourceSystem'])
@Index('idx_bundle_log_summary_gin', ['bundleSummary'])
export class BundleLog {
    /**
     * Primary key - Auto-generated UUID
     */
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /**
     * Transaction ID - Links to all resources created in this bundle transaction
     * This should match the txid used in all resource tables
     */
    @Column('uuid', { name: 'txid', unique: true, nullable: false })
    txid: string;

    /**
     * Type of bundle being processed
     * Values: 'transaction', 'batch', 'document', 'collection'
     */
    @Column('varchar', { name: 'bundle_type', length: 50, nullable: false })
    bundleType: string;

    /**
     * Number of resources contained in the bundle
     */
    @Column('int', { name: 'resource_count', default: 0, nullable: false })
    resourceCount: number;

    /**
     * Timestamp when the bundle was submitted for processing
     */
    @Column('timestamptz', { name: 'submitted_at', nullable: false })
    submittedAt: Date;

    /**
     * Timestamp when bundle processing was completed
     * Null if still processing or failed
     */
    @Column('timestamptz', { name: 'completed_at', nullable: true })
    completedAt: Date;

    /**
     * Processing duration in milliseconds
     * Calculated as: completedAt - submittedAt
     */
    @Column('int', { name: 'processing_duration_ms', nullable: true })
    processingDurationMs: number;

    /**
     * Current processing status
     * Values: 'processing', 'success', 'failed', 'partial'
     */
    @Column('varchar', { name: 'status', length: 20, default: 'processing', nullable: false })
    status: string;

    /**
     * Identifier of the user or system that submitted the bundle
     */
    @Column('varchar', { name: 'submitted_by', length: 255, nullable: true })
    submittedBy: string;

    /**
     * Identifier of the originating system
     */
    @Column('varchar', { name: 'source_system', length: 255, nullable: true })
    sourceSystem: string;

    /**
     * Error details if processing failed
     * Stores error messages, stack traces, and failure reasons
     */
    @Column('jsonb', { name: 'error_details', nullable: true })
    errorDetails: any;

    /**
     * Lightweight summary of bundle contents
     * Example: { "resourceTypes": ["Patient", "Observation"], "totalSize": 1024, "operations": ["POST", "PUT"] }
     */
    @Column('jsonb', { name: 'bundle_summary', nullable: false })
    bundleSummary: any;

    /**
     * Full FHIR bundle content as received
     */
    @Column('jsonb', { name: 'bundle_content', nullable: false })
    bundleContent: any;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    /**
     * Record last update timestamp
     */
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
