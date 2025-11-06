import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('claim_history')
@Index('idx_claim_history_id', ['id'])
@Index('idx_claim_history_txid', ['txid'])
export class ClaimHistory {
    @PrimaryGeneratedColumn('uuid', { name: 'history_id' })
    historyId: string;

    @Column('uuid', { name: 'id', nullable: false })
    id: string;

    @Column('int', { name: 'version_id', nullable: false })
    versionId: number;

    @Column('timestamptz', { name: 'last_updated', nullable: false })
    lastUpdated: Date;

    @Column('jsonb', { name: 'resource', nullable: false })
    resource: any;

    @Column('uuid', { name: 'txid', nullable: true })
    txid: string;
}
