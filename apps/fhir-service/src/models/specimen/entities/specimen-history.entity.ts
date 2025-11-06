import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * TypeORM Entity for the `specimen_history` table.
 *
 * This class maps directly to the database table that Liquibase creates.
 * This table serves as an append-only, immutable audit log of every version
 * of every Specimen resource that has ever existed in the system.
 */
@Entity('specimen_history')
@Index('idx_specimen_history_id', ['id'])
@Index('idx_specimen_history_txid', ['txid'])
export class SpecimenHistory {
    /**
     * The primary key for the history row itself.
     * This is a unique UUID for this specific historical entry and is distinct from the specimen's logical ID.
     */
    @PrimaryGeneratedColumn('uuid', { name: 'history_id' })
    historyId: string;

    /**
     * The logical ID of the Specimen resource this history entry belongs to.
     * This is the value that is shared with the `id` column in the `specimen` table.
     */
    @Column('uuid', { name: 'id', nullable: false })
    id: string;

    /**
     * The version number of this historical state (e.g., 1, 2, 3...).
     * This allows for reconstructing the timeline of changes for a resource.
     */
    @Column('int', { name: 'version_id', nullable: false })
    versionId: number;

    /**
     * The exact timestamp of when this historical version was created.
     */
    @Column('timestamptz', { name: 'last_updated', nullable: false })
    lastUpdated: Date;

    /**
     * The ID of the database transaction that created this historical version.
     */
    @Column('uuid', { name: 'txid', nullable: false })
    txid: string;

    /**
     * The complete FHIR Specimen resource as it existed at this point in time,
     * stored as a JSONB object.
     */
    @Column('jsonb', { name: 'resource', nullable: false })
    resource: object;

    /**
     * Timestamp when this version was marked as deleted (if applicable).
     * If this is null, this version was not a deletion.
     */
    @Column('timestamptz', { name: 'deleted_at', nullable: true })
    deletedAt: Date;
}
