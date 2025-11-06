import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * TypeORM Entity for the `care_plan` table.
 *
 * This class maps directly to the database table structure that Liquibase
 * creates. It represents the *current, active version* of a CarePlan
 * resource. This table is optimized for fast reads and direct lookups of the
 * latest state of a care plan.
 *
 * The CarePlan resource describes the intention of how one or more practitioners
 * intend to deliver care for a particular patient, group, or community for a
 * period of time, possibly limited to care for a specific condition or set of conditions.
 */
@Entity('care_plan')
@Index('idx_care_plan_txid', ['txid'])
export class CarePlan {
    /**
     * Unique identifier for the resource (e.g. CarePlan/12345).
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
     * The CarePlan resource itself, serialized as JSONB.
     * Contains all the FHIR CarePlan data including status, intent, category,
     * subject, activities, goals, and other care planning information.
     */
    @Column('jsonb', { name: 'resource', nullable: false })
    resource: object;

    /**
     * Timestamp when the resource was deleted (if it has been deleted).
     * This supports logical deletion of resources.
     */
    @Column('timestamptz', { name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
