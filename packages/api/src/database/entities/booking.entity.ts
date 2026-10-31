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
 * One amount line of a Bookamat booking, as stored in `obulus_bookings.amounts`.
 * Accounts are kept by name: Bookamat assigns new IDs per year, the names stay.
 */
export interface BookingAmountLine {
  group: string;                         // "1" = Einnahme, "2" = Ausgabe
  bankaccount: string | null;
  costaccount: string | null;
  purchasetaxaccount: string | null;
  amount: number;                        // brutto
  amountAfterTax: number;
  taxPercent: number;
  taxValue: number;
  deductibilityTaxPercent: number;
  deductibilityAmountPercent: number;
  foreignBusinessBase: string | null;    // UID der Betriebsstätte
  countryDep: string | null;
  countryRec: string | null;
}

/** JSON column ↔ array; tolerates the NULL of rows synced before the column existed. */
const amountsTransformer = {
  to: (value: BookingAmountLine[] | null | undefined) => (value == null ? null : JSON.stringify(value)),
  from: (value: string | null): BookingAmountLine[] | null => (value ? JSON.parse(value) : null),
};

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

  @Column({ name: 'document_number', type: 'varchar', nullable: true })
  documentNumber: string | null;

  @Column()
  type: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'date_invoice', type: 'date', nullable: true })
  dateInvoice: string | null;

  @Column({ name: 'date_delivery', type: 'date', nullable: true })
  dateDelivery: string | null;

  @Column({ name: 'date_order', type: 'date', nullable: true })
  dateOrder: string | null;

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

  @Column({ type: 'varchar', nullable: true })
  vatin: string | null;

  @Column({ type: 'varchar', nullable: true })
  country: string | null;

  @Column({ type: 'varchar', nullable: true })
  costcentre: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** All amount lines with their accounts; NULL for rows not re-synced since migration 015. */
  @Column({ type: 'longtext', nullable: true, transformer: amountsTransformer })
  amounts: BookingAmountLine[] | null;

  @Column({ name: 'attachment_count', type: 'int', default: 0 })
  attachmentCount: number;

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
