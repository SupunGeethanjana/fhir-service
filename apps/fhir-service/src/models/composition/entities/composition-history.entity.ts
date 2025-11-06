

/** TypeORM Entity for the `composition_history` table. */
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * TypeORM Entity for the `composition_history` table.
 * 
 * This class maps directly to the database table that Liquibase creates.
 * This table serves as an append-only, immutable audit log of every version
 * of every Composition resource that has ever existed in the system.
 */
@Entity('composition_history')
@Index('idx_composition_history_id', ['id'])
@Index('idx_composition_history_txid', ['txid'])
export class CompositionHistory {
    /** Unique identifier for each history record */
    @PrimaryGeneratedColumn('uuid', { name: 'history_id' })
    historyId: string;

    /** Identifier for the Composition resource */
    @Column('uuid', { name: 'id', nullable: false })
    id: string;

    /** Version number of the Composition resource */
    @Column('int', { name: 'version_id', nullable: false })
    versionId: number;

    /** Timestamp of when the record was last updated */
    @Column('timestamptz', { name: 'last_updated', nullable: false })
    lastUpdated: Date;

    /** Transaction ID associated with the update */
    @Column('uuid', { name: 'txid', nullable: false })
    txid: string;

    /** JSONB representation of the Composition resource */
    @Column('jsonb', { name: 'resource', nullable: false })
    resource: object;
}

