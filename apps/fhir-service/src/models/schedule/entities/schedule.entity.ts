import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * TypeORM Entity for the `schedule` table.
 *
 * This class maps directly to the database table structure for FHIR Schedule resources.
 * It represents the *current, active version* of a Schedule resource.
 *
 * FHIR R4 Specification: https://hl7.org/fhir/R4/schedule.html
 */
@Entity('schedule')
@Index('idx_schedule_txid', ['txid'])
export class Schedule {
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
