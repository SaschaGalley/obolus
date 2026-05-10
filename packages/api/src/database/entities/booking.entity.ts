import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

/**
 * Raw booking imported from bookamat.com.
 *
 * One row per Bookamat booking; classification flags (`isEst`, `isUst`,
 * `isSvs`, `isPrivate`) are derived from the costaccount name during sync.
 *
 * The `(user_id, bookamat_id)` unique key makes re-sync idempotent –
 * the sync service uses `INSERT … ON DUPLICATE KEY UPDATE` (TypeORM `upsert`).
 */
@Entity('obulus_bookings')
@Unique('uk_bookings_user_bookamat', ['userId', 'bookamatId'])
@Index('idx_bookings_user_year', ['userId', 'year'])
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'bookamat_id' })
  bookamatId: number;

  @Column()
  title: string;

  @Column()
  type: string;

  @Column({ type: 'date' })
  date: string;

  @Column()
  year: number;

  @Column()
  month: number;

  @Column({ name: 'year_month' })
  yearMonth: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  brutto: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  netto: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  tax: number;

  @Column({ name: 'is_incoming', type: 'tinyint', width: 1 })
  isIncoming: boolean;

  @Column({ name: 'is_private', type: 'tinyint', width: 1 })
  isPrivate: boolean;

  @Column({ name: 'is_est', type: 'tinyint', width: 1 })
  isEst: boolean;

  @Column({ name: 'is_ust', type: 'tinyint', width: 1 })
  isUst: boolean;

  @Column({ name: 'is_svs', type: 'tinyint', width: 1 })
  isSvs: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
