import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * TypeORM Entity for the `value_set_history` table.
 * 
 * This class maps directly to the database table that Liquibase creates.
 * This table serves as an append-only, immutable audit log of every version
 * of every ValueSet resource that has ever existed in the system.
 * 
 * Unlike the main `value_set` table, this history table:
 * - Never updates existing rows (append-only)
 * - Preserves every version of every ValueSet resource
 * - Enables FHIR version history queries (_history endpoints)
 * - Provides complete audit trail capabilities
 */
@Entity('value_set_history')
@Index('idx_value_set_history_id', ['id'])
@Index('idx_value_set_history_txid', ['txid'])
export class ValueSetHistory {
    /**
     * Auto-incrementing primary key for the history table.
     * This ensures that each historical version has a unique database-level identifier.
     * Different from the FHIR logical ID, which stays the same across versions.
     */
    @PrimaryGeneratedColumn('uuid', { name: 'history_id' })
    historyId: string;

    /**
     * The FHIR logical ID of the ValueSet resource (e.g., the "12345" in "ValueSet/12345").
     * This remains constant across all versions of the same logical resource.
     * Multiple history entries will share the same ID but have different versionIds.
     */
    @Column('uuid', { name: 'id', nullable: false })
    id: string;

    /**
     * The specific version number of this historical entry (1, 2, 3, ...).
     * Combined with the ID, this uniquely identifies this specific version
     * of the resource at this point in time.
     */
    @Column('int', { name: 'version_id', nullable: false })
    versionId: number;

    /**
     * Timestamp when this version of the resource was created.
     * This represents when this particular version became the "current" version,
     * before being superseded by a newer version.
     */
    @Column('timestamptz', { name: 'last_updated', nullable: false })
    lastUpdated: Date;

    /**
     * The ID of the database transaction that created this historical version.
     * This provides a complete audit trail, linking this change to any other
     * resource changes that happened in the same atomic API call.
     * 
     * For example, if a Bundle transaction creates multiple resources,
     * they will all share the same txid.
     */
    @Column('uuid', { name: 'txid', nullable: false })
    txid: string;

    /**
     * The complete FHIR ValueSet resource as it existed at this point in time,
     * stored as a JSONB object. This contains all the clinical data including:
     * - Value set definition and metadata
     * - Compose rules and filters
     * - Include/exclude specifications
     * - Expansion details (if expanded)
     * - Publication status and versioning information
     * - All other FHIR ValueSet fields
     */
    @Column('jsonb', { name: 'resource', nullable: false })
    resource: object;
}
