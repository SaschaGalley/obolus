import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

/**
 * Per-user, per-year configuration for tax/insurance calculations.
 *
 * Mirrors the legacy accounting/data-api SettingsEntity 1:1 with `userId`
 * added as part of the composite PK so the obulus single-user model can
 * later scale to multi-user without a schema change.
 *
 * Most fields are projection inputs (`umsatz_erwartet`, `gehalt`, …) or
 * year-specific knobs (`est_limit_*`, SVS rates) that the user maintains
 * via the Year-Settings drawer in the UI.
 *
 * Fields that can be NULL (`est_festgesetzt`, `ust_festgesetzt`,
 * `svs_nachbemessen`) trigger different code paths in OverviewService
 * (NULL → use computed value; set → reconcile against actuals).
 */
@Entity('obulus_year_settings')
export class YearSettings {
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @PrimaryColumn()
  year: number;

  @Column({ name: 'active_months', type: 'int', default: 12 })
  activeMonths: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  gehalt: number;

  @Column({ name: 'umsatz_erwartet', type: 'decimal', precision: 14, scale: 2, default: 0 })
  umsatzErwartet: number;

  @Column({ name: 'ausgaben_erwartet', type: 'decimal', precision: 14, scale: 2, default: 0 })
  ausgabenErwartet: number;

  @Column({ name: 'sonstige_einnahmen', type: 'decimal', precision: 14, scale: 2, default: 0 })
  sonstigeEinnahmen: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  sonderausgaben: number;

  @Column({ name: 'gewinnmindernde_ausgaben', type: 'decimal', precision: 14, scale: 2, default: 0 })
  gewinnmindernde_ausgaben: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  absetzbeitrag: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  kapitalvermoegen: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  anspruchszinsen: number;

  @Column({ name: 'svs_vorschreibung_pv', type: 'decimal', precision: 14, scale: 2, default: 0 })
  svsVorschreibungPv: number;

  @Column({ name: 'svs_vorschreibung_kv', type: 'decimal', precision: 14, scale: 2, default: 0 })
  svsVorschreibungKv: number;

  @Column({ name: 'svs_hoechstbeitragsgrundlage', type: 'decimal', precision: 14, scale: 2, default: 5425.0 })
  svsHoechstbeitragsgrundlage: number;

  @Column({ name: 'svs_pensionsversicherung', type: 'decimal', precision: 8, scale: 4, default: 0.185 })
  svsPensionsversicherung: number;

  @Column({ name: 'svs_krankenversicherung', type: 'decimal', precision: 8, scale: 4, default: 0.0765 })
  svsKrankenversicherung: number;

  @Column({ name: 'svs_vorsorge', type: 'decimal', precision: 8, scale: 4, default: 0.0153 })
  svsVorsorge: number;

  @Column({ name: 'svs_unfallversicherung', type: 'decimal', precision: 14, scale: 2, default: 8.9 })
  svsUnfallversicherung: number;

  @Column({ name: 'svs_nachbemessen', type: 'decimal', precision: 14, scale: 2, nullable: true })
  svsNachbemessen: number | null;

  @Column({ name: 'est_vorschreibung', type: 'decimal', precision: 14, scale: 2, nullable: true })
  estVorschreibung: number | null;

  @Column({ name: 'est_festgesetzt', type: 'decimal', precision: 14, scale: 2, nullable: true })
  estFestgesetzt: number | null;

  @Column({ name: 'ust_festgesetzt', type: 'decimal', precision: 14, scale: 2, nullable: true })
  ustFestgesetzt: number | null;

  @Column({ name: 'est_limit_1', type: 'int', default: 11000 })
  estLimit1: number;

  @Column({ name: 'est_limit_2', type: 'int', default: 18000 })
  estLimit2: number;

  @Column({ name: 'est_limit_3', type: 'int', default: 31000 })
  estLimit3: number;

  @Column({ name: 'est_limit_4', type: 'int', default: 60000 })
  estLimit4: number;

  @Column({ name: 'est_limit_5', type: 'int', default: 90000 })
  estLimit5: number;

  @Column({ name: 'est_limit_6', type: 'int', default: 1000000 })
  estLimit6: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
