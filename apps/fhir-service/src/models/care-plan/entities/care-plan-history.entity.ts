import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * TypeORM Entity for the `care_plan_history` table.
 *
 * This table stores the historical versions of CarePlan resources.
 * Every time a CarePlan is updated, the previous version is moved to this table
 * to maintain a complete audit trail of all changes.
 *
 * The history table allows for:
 * - Version tracking and retrieval
 * - Audit trail for compliance
 * - Rollback capabilities
 * - Change analysis over time
 */
@Entity('care_plan_history')
@Index('idx_care_plan_history_id', ['id'])
@Index('idx_care_plan_history_txid', ['txid'])
export class CarePlanHistory {
    /**
     * Auto-generated primary key for the history table.
     * This is different from the CarePlan ID to allow multiple versions.
     */
    @PrimaryGeneratedColumn('uuid', { name: 'history_id' })
    historyId: string;

    /**
     * The original CarePlan resource ID.
     * This links back to the current version in the care_plan table.
     */
    @Column('uuid', { name: 'id', nullable: false })
    id: string;

    /**
     * The version number of this historical record.
     */
    @Column('int', { name: 'version_id', nullable: false })
    versionId: number;

    /**
     * Timestamp when this version was current.
     */
    @Column('timestamptz', { name: 'last_updated', nullable: false })
    lastUpdated: Date;

    /**
     * Transaction ID that created this version.
     */
    @Column('uuid', { name: 'txid', nullable: false })
    txid: string;

    /**
     * The complete CarePlan resource as it existed in this version.
     */
    @Column('jsonb', { name: 'resource', nullable: false })
    resource: object;
}
