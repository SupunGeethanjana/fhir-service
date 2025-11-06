import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
@Entity('procedure_history')
@Index('idx_procedure_history_id', ['id'])
@Index('idx_procedure_history_txid', ['txid'])
export class ProcedureHistory {

  /**
* The primary key for this row, a UUID.
*/
  @PrimaryGeneratedColumn('uuid', { name: 'history_id' })
  historyId: string;
  /**
   * The ID of the Procedure resource that this row represents.
   */
  @Column('uuid', { name: 'id', nullable: false })
  id: string;
  /**
   * The version ID of the Procedure resource that this row represents.
   */
  @Column('int', { name: 'version_id', nullable: false })
  versionId: number;
  /**
   * The timestamp when this row was created.
   */
  @Column('timestamptz', { name: 'last_updated', nullable: false })
  lastUpdated: Date;
  /**
   * The transaction ID of the transaction that created this row.
   */
  @Column('uuid', { name: 'txid', nullable: false })
  txid: string;
  /**
   * The JSON representation of the Procedure resource that this row represents.
   */
  @Column('jsonb', { name: 'resource', nullable: false })
  resource: object;
}
