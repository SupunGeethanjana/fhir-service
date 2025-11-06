import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * TypeORM Entity for the `slot` table.
 *
 * This class maps directly to the database table structure that Liquibase
 * creates. It represents the *current, active version* of a Slot
 * resource. This table is optimized for fast reads and direct lookups of the
 * latest state of a slot.
 * 
 * The Slot resource provides a time-slot that can be booked using an appointment.
 * It defines when a service or resource is available for booking.
 * 
 * FHIR R4 Specification: https://hl7.org/fhir/R4/slot.html
 */
@Entity('slot')
@Index('idx_slot_txid', ['txid'])
export class Slot {

    /**
     * Unique identifier for the resource (e.g. Slot/12345).
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
     * The Slot resource itself, serialized as JSONB.
     * Contains all scheduling and availability data.
     */
    @Column('jsonb', { name: 'resource', nullable: false })
    resource: object;

    /**
     * Timestamp when the resource was deleted (if it has been deleted).
     */
    @Column('timestamptz', { name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
