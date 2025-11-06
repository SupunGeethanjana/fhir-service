import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * TypeORM Entity for the `value_set` table.
 *
 * This class maps directly to the database table structure that Liquibase
 * creates. It represents the *current, active version* of a ValueSet
 * resource. This table is optimized for fast reads and direct lookups of the
 * latest state of a value set.
 */
@Entity('value_set')
@Index('idx_value_set_txid', ['txid'])
// Functional indexes for common FHIR search parameters - TypeORM approach
export class ValueSet {
    /**
     * Unique identifier for the resource (e.g. ValueSet/12345).
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
     * The ValueSet resource itself, serialized as JSONB.
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



