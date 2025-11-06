import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('provenance')
@Index('idx_provenance_txid', ['txid'])
export class Provenance {
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
    deletedAt: Date;
}
