import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('care_team')
@Index('idx_care_team_txid', ['txid'])
export class CareTeam {
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
