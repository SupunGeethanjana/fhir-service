import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * TypeORM Entity for the `medication_history` table.
 *
 * This class maps directly to the database table that Liquibase creates.
 * This table serves as an append-only, immutable audit log of every version
 * of every Medication resource that has ever existed in the system.
 */
@Entity('medication_history')
@Index('idx_medication_history_id', ['id'])
@Index('idx_medication_history_txid', ['txid'])
export class MedicationHistory {
    /**
     * The primary key for the history row itself.
     * This is a unique UUID for this specific historical entry and is distinct from the medication's logical ID.
     */
    @PrimaryGeneratedColumn('uuid', { name: 'history_id' })
    historyId: string;

    /**
     * The logical ID of the Medication resource this history entry belongs to.
     * This is the value that is shared with the `id` column in the `medication` table.
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
     * The complete FHIR Medication resource as it existed at this point in time,
     * stored as a JSONB object.
     */
    @Column('jsonb', { name: 'resource', nullable: false })
    resource: object;
}
