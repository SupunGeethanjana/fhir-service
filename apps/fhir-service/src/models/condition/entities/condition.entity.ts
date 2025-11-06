import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
/** TypeORM Entity for the condition table. */
/**
 * TypeORM Entity for the `condition` table.
 *
 * This class maps directly to the database table structure that Liquibase
 * creates. It represents the *current, active version* of a Condition
 * resource. This table is optimized for fast reads and direct lookups of the
 * latest state of a condition.
 */
@Entity('condition')
@Index('idx_condition_txid', ['txid'])
// Functional indexes for common FHIR search parameters - TypeORM approach
// Note: Complex GIN indexes are created via database migration for better control
// See functional_indexes.sql for: idx_condition_evidence_gin
export class Condition {
    /**
     * Unique identifier for the resource (e.g. Condition/12345).
     * This is the primary key for the table.
     */
    @PrimaryColumn('uuid')
    id: string;

    /**
     * The version of the resource (e.g. 1, 2, 3, ...). This is incremented each
     * time the resource is updated.
     */
    @Column('int', { name: 'version_id', nullable: false })
    versionId: number;

    /**
     * Timestamp when the resource was last updated.
     */
    @Column('timestamptz', { name: 'last_updated', nullable: false })
    lastUpdated: Date;

    /**
     * Unique identifier for the transaction that created or updated the resource.
     */
    @Column('uuid', { name: 'txid', nullable: false })
    txid: string;

    /**
     * The Condition resource itself, serialized as JSONB.
     */
    @Column('jsonb', { name: 'resource', nullable: false })
    resource: object;

    /**
     * Timestamp when the resource was deleted (if it has been deleted).
     * If this is null, the resource is still active.
     */
    @Column('timestamptz', { name: 'deleted_at', nullable: true })
    deletedAt: Date;
}



