import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

export type BookamatAccountKind = 'cost' | 'tax' | 'bank' | 'costcentre';

/**
 * What Bookamat tells about an activated account beyond its name. Only the
 * keys of the account's kind are set.
 */
export interface BookamatAccountData {
  group?: string;                        // "1" = Einnahme, "2" = Ausgabe (cost, tax)
  section?: string;
  /** cost: names of the VAT accounts allowed with it. */
  purchasetaxaccounts?: string[];
  /** cost: fixed business shares, when Bookamat allows no other value. */
  deductibilityTaxPercent?: number | null;
  deductibilityAmountPercent?: number | null;
  /** tax: Übergang der Steuerschuld, Zusammenfassende Meldung (Lieferung/Leistung). */
  reverseCharge?: boolean;
  icReport?: boolean;
  icDelivery?: boolean;
  icService?: boolean;
  /** tax: allowed VAT rates. */
  taxValues?: number[];
  /** tax: UVA-Kennzahlen; rate-specific ones (022, 029 …) apply to lines of that rate only. */
  indexPurchasetax?: string[];
  /** cost: Kennzahlen of the income tax return (E1a). */
  indexIncometax?: string[];
  active?: boolean;
}

const dataTransformer = {
  to: (value: BookamatAccountData | null | undefined) => (value == null ? null : JSON.stringify(value)),
  from: (value: string | null): BookamatAccountData => (value ? JSON.parse(value) : {}),
};

/**
 * An activated Bookamat account of one year: Steuerkonto (`cost`),
 * Umsatzsteuerkonto (`tax`), Zahlungskonto (`bank`) or Kostenstelle
 * (`costcentre`). Synced with the year's bookings; Bookamat assigns the IDs per
 * year, so a booking is transferred by resolving names in its year.
 */
@Entity('obulus_bookamat_accounts')
@Unique('uk_bookamat_accounts', ['userId', 'year', 'kind', 'bookamatId'])
export class BookamatAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column()
  year: number;

  @Column({ type: 'varchar' })
  kind: BookamatAccountKind;

  @Column({ name: 'bookamat_id' })
  bookamatId: number;

  @Column()
  name: string;

  @Column({ type: 'longtext', nullable: true, transformer: dataTransformer })
  data: BookamatAccountData;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
