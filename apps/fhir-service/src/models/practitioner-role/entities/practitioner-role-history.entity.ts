import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * TypeORM Entity for the `practitioner_role_history` table.
 *
 * This class maps directly to the database table that Liquibase creates.
 * This table serves as an append-only, immutable audit log of every version
 * of every PractitionerRole resource that has ever existed in the system.
 */
@Entity('practitioner_role_history')
@Index('idx_practitioner_role_history_id', ['id'])
@Index('idx_practitioner_role_history_txid', ['txid'])
export class PractitionerRoleHistory {

    /**
     * The primary key for the history row itself.
     * This is a unique UUID for this specific historical entry and is distinct from the practitioner role's logical ID.
     */
    @PrimaryGeneratedColumn('uuid', { name: 'history_id' })
    historyId: string;

    /**
     * The logical ID of the PractitionerRole resource this history entry belongs to.
     * This is the value that is shared with the `id` column in the `practitioner_role` table.
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
     * The complete FHIR PractitionerRole resource as it existed at this point in time,
     * stored as a JSONB object.
     */
    @Column('jsonb', { name: 'resource', nullable: false })
    resource: object;
}
