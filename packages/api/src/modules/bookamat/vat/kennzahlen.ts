/**
 * Kennzahlen of the Austrian Umsatzsteuervoranmeldung (U30, ab 07/2026).
 *
 * `base` Kennzahlen take the net amount (Bemessungsgrundlage), `tax` ones the
 * tax amount. A Kennzahl with a `rate` only takes lines of that rate: Bookamat
 * lists every rate's Kennzahl on an account (e.g. "Umsatzsteuer Inland" →
 * 000, 022, 124, 029, 006) and the line's rate picks one.
 */
export type KzKind = 'base' | 'tax';
export type KzSection = 'umsatz' | 'erwerb' | 'vorsteuer';

export interface KzDef {
  kz: string;
  label: string;
  kind: KzKind;
  section: KzSection;
  rate?: number;
}

const base = (kz: string, label: string, section: KzSection, rate?: number): KzDef => ({ kz, label, kind: 'base', section, rate });
const tax = (kz: string, label: string, section: KzSection): KzDef => ({ kz, label, kind: 'tax', section });

export const KENNZAHLEN: KzDef[] = [
  base('000', 'Lieferungen, sonstige Leistungen und Anzahlungen', 'umsatz'),
  base('001', 'zuzüglich Eigenverbrauch', 'umsatz'),
  base('021', 'abzüglich Umsätze mit Übergang der Steuerschuld auf den Empfänger', 'umsatz'),
  base('011', 'steuerfrei: Ausfuhrlieferungen', 'umsatz'),
  base('012', 'steuerfrei: Lohnveredelungen', 'umsatz'),
  base('015', 'steuerfrei: § 6 Abs. 1 Z 2 bis 6, § 23 Abs. 5', 'umsatz'),
  base('017', 'steuerfrei: innergemeinschaftliche Lieferungen', 'umsatz'),
  base('018', 'steuerfrei: ig Lieferungen neuer Fahrzeuge ohne UID', 'umsatz'),
  base('019', 'steuerfrei: Grundstücksumsätze', 'umsatz'),
  base('016', 'steuerfrei: Kleinunternehmer', 'umsatz'),
  base('020', 'steuerfrei: übrige Umsätze ohne Vorsteuerabzug', 'umsatz'),
  base('022', '20 % Normalsteuersatz', 'umsatz', 20),
  base('029', '10 % ermäßigter Steuersatz', 'umsatz', 10),
  base('006', '13 % ermäßigter Steuersatz', 'umsatz', 13),
  base('124', '4,9 % ermäßigter Steuersatz', 'umsatz', 4.9),
  base('037', '19 % Jungholz und Mittelberg', 'umsatz', 19),
  base('052', '10 % Zusatzsteuer pauschalierte Land- und Forstwirtschaft', 'umsatz', 10),
  base('007', '7 % Zusatzsteuer pauschalierte Land- und Forstwirtschaft', 'umsatz', 7),
  tax('056', 'Steuerschuld § 11 Abs. 12 und 14, § 16 Abs. 2, Art. 7 Abs. 4', 'umsatz'),
  tax('057', 'Steuerschuld § 19 Abs. 1, 1c, 1e, Art. 25 Abs. 5 (Reverse Charge)', 'umsatz'),
  tax('048', 'Steuerschuld § 19 Abs. 1a (Bauleistungen)', 'umsatz'),
  tax('044', 'Steuerschuld § 19 Abs. 1b', 'umsatz'),
  tax('032', 'Steuerschuld § 19 Abs. 1d (Schrott, Abfall)', 'umsatz'),
  base('070', 'Innergemeinschaftliche Erwerbe', 'erwerb'),
  base('071', 'davon steuerfrei (Art. 6 Abs. 2)', 'erwerb'),
  base('072', 'Erwerbe zu 20 %', 'erwerb', 20),
  base('073', 'Erwerbe zu 10 %', 'erwerb', 10),
  base('008', 'Erwerbe zu 13 %', 'erwerb', 13),
  base('125', 'Erwerbe zu 4,9 %', 'erwerb', 4.9),
  base('088', 'Erwerbe zu 19 % (Jungholz, Mittelberg)', 'erwerb', 19),
  base('076', 'nicht zu versteuernde Erwerbe (Art. 3 Abs. 8 zweiter Satz)', 'erwerb'),
  base('077', 'nicht zu versteuernde Erwerbe (Art. 3 Abs. 8, Art. 25 Abs. 2)', 'erwerb'),
  tax('060', 'Vorsteuern', 'vorsteuer'),
  tax('061', 'Einfuhrumsatzsteuer (entrichtet)', 'vorsteuer'),
  tax('083', 'Einfuhrumsatzsteuer (Abgabenkonto)', 'vorsteuer'),
  tax('065', 'Vorsteuern aus ig Erwerben', 'vorsteuer'),
  tax('066', 'Vorsteuern zur Steuerschuld § 19 Abs. 1, 1c, 1e, Art. 25 Abs. 5', 'vorsteuer'),
  tax('082', 'Vorsteuern zu § 19 Abs. 1a (Bauleistungen)', 'vorsteuer'),
  tax('087', 'Vorsteuern zu § 19 Abs. 1b', 'vorsteuer'),
  tax('089', 'Vorsteuern zu § 19 Abs. 1d', 'vorsteuer'),
  tax('064', 'Vorsteuern ig Lieferung neuer Fahrzeuge', 'vorsteuer'),
  tax('062', 'davon nicht abzugsfähig (§ 12 Abs. 3)', 'vorsteuer'),
  tax('063', 'Berichtigung § 12 Abs. 10 und 11', 'vorsteuer'),
  tax('067', 'Berichtigung § 16', 'vorsteuer'),
  tax('090', 'sonstige Berichtigungen', 'vorsteuer'),
];

export const KZ_BY_CODE = new Map(KENNZAHLEN.map((k) => [k.kz, k]));

/** Kennzahlen subtracted from the Vorsteuern; 063, 067 and 090 count with their sign. */
export const VORSTEUER_MINUS = new Set(['062']);

/**
 * Vorsteuerpauschalierung (§ 14 Abs. 1 Z 1 UStG): 1,8 % des Umsatzes, capped
 * per year. Caps raised by the 1. Budgetbegleitgesetz 2025.
 */
export const PAUSCHALE_RATE = 1.8;
export function pauschaleCap(year: number): number {
  if (year <= 2024) return 3960;
  if (year === 2025) return 5760;
  return 7560;
}
