import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

/**
 * A decision about one movement on the business account (kept in Umsatz, here
 * only its ID): linked by hand to a Bookamat booking, ignored because it needs
 * none, or transferred from obolus. Automatic matches are not stored; the
 * reconciliation recomputes them on every request.
 */
@Entity('obulus_bank_matches')
@Unique('uk_bank_matches_user_umsatz', ['userId', 'umsatzId'])
export class BankMatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'umsatz_id' })
  umsatzId: string;

  @Column({ name: 'bookamat_id', type: 'int', nullable: true })
  bookamatId: number | null;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  ignored: boolean;

  @Column({ name: 'transferred_at', type: 'datetime', nullable: true })
  transferredAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
