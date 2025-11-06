import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * TypeORM Entity for the `schedule_history` table.
 *
 * This class stores all historical versions of a Schedule resource.
 * Each update to a Schedule creates a new row in this table.
 *
 * FHIR R4 Specification: https://hl7.org/fhir/R4/schedule.html
 */
@Entity('schedule_history')
@Index('idx_schedule_history_txid', ['txid'])
export class ScheduleHistory {
    @PrimaryColumn('uuid')
    id: string;

    @Column('int', { name: 'version_id', nullable: false })
    versionId: number;

    @Column('timestamptz', { name: 'last_updated', nullable: false })
    lastUpdated: Date;

    @Column('uuid', { name: 'txid', nullable: false })
    txid: string;

    @Column('jsonb', { name: 'resource', nullable: false })
    resource: object;

    @Column('timestamptz', { name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
