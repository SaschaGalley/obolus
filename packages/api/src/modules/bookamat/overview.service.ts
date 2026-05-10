import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThanOrEqual, Repository } from 'typeorm';
import { Booking, YearSettings } from '../../database/entities';

/**
 * Per-year overview row. Field names mirror the legacy Postgres `overview`
 * view – keeping the names lets us cross-check old vs. new dashboard cell
 * by cell during verification (see plan §Verification step 5).
 */
export interface YearOverview {
  year: number;
  active_months: number;

  // settings echo
  est_vorschreibung: number;

  // booking_year aggregates (raw)
  income_netto: number;
  income_brutto: number;
  expenses: number;          // sum(brutto) of outgoing - private_out - est - ust - svs
  private_in: number;
  private_out: number;
  ust_bezahlt: number;
  est_bezahlt: number;
  svs_bezahlt: number;

  // ust
  ust_pauschalierung: number;
  ust_berechnet: number;          // computed: einnahmen - pauschalierung
  ust_festgesetzt: number | null; // null when not yet assessed by FA
  ust_ergebnis: number;           // value actually used: festgesetzt ?? berechnet
  ust_differenz: number;

  // est
  est_summe_aufwendungen: number;
  est_basispauschalierung: number;
  est_gewinnfreibetrag: number;
  est_steuerlicher_gewinn: number;
  est_sonderausgaben: number;
  est_bemessungsgrundlage: number;
  est_vorergebnis: number;        // pure tariff math (no kapitalvermögen, no festgesetzt)
  est_festgesetzt: number | null; // null when not yet assessed by FA
  est_ergebnis: number;           // value actually used: festgesetzt ?? (vorergebnis + kapitalvermögen)
  est_differenz: number;

  // svs
  svs_berechnungsgrundlage: number;
  svs_bemessungsgrundlage: number;
  svs_vorschreibung: number;
  svs_summe: number;
  svs_differenz: number;

  // overview / cumulative
  ausgaben: number;
  netto_gewinn: number;
  netto_gewinn_monatlich: number;
  private_out_monatlich: number;
  einnahmen_minus_ausgaben: number;
  konto_saldo: number;
  konto_saldo_kumuliert: number;
  ust_diff_kumuliert: number;
  est_diff_kumuliert: number;
  steuer_diff_kumuliert: number;
  svs_diff_kumuliert: number;
  konto_ueberschuss: number;
}

interface BookingYearAgg {
  year: number;
  income_netto: number;
  income_brutto: number;
  est: number;
  ust: number;
  svs: number;
  private_in: number;
  private_out: number;
  total_out: number;
}

interface YearHelpers {
  year: number;
  income_netto: number;
  income_brutto: number;
  expenses: number;       // expenses BEFORE est/ust/svs subtraction (booking_year.expenses)
  private_out: number;
  active_months: number;
}

/**
 * Computes the multi-year accounting overview from imported bookings + per-year
 * settings. Replaces the chain of Postgres views in the legacy accounting project
 * (booking_year → year_helpers → vorschreibung → est/ust/svs → overview) with
 * pure TypeScript so the logic is testable and works on MariaDB.
 *
 * Each calculation step references the corresponding view entity in
 * /Volumes/storage/workspace/troop/accounting/data-api/src/bookamat/entities
 * so the formulas can be cross-checked.
 */
@Injectable()
export class OverviewService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(YearSettings)
    private readonly settingsRepo: Repository<YearSettings>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Build the overview for every year the user has settings for, up to and
   * including the current year. Future years (the seed pre-creates rows up
   * to currentYear+5 so users can configure projections in advance) are
   * intentionally excluded from the overview – they have no actuals and
   * would just clutter the table with empty columns.
   */
  public async build(userId: number): Promise<YearOverview[]> {
    const currentYear = new Date().getFullYear();
    const allSettings = await this.settingsRepo.find({
      where: { userId, year: LessThanOrEqual(currentYear) },
      order: { year: 'ASC' },
    });
    if (allSettings.length === 0) return [];

    const aggregates = await this.aggregateBookingYear(userId);
    const aggMap = new Map(aggregates.map((a) => [a.year, a]));

    // First pass: per-year calculations, no cumulatives yet.
    const partialRows: Omit<
      YearOverview,
      | 'ust_diff_kumuliert' | 'est_diff_kumuliert' | 'steuer_diff_kumuliert'
      | 'svs_diff_kumuliert' | 'konto_saldo_kumuliert' | 'konto_ueberschuss'
    >[] = [];

    for (const settings of allSettings) {
      const agg = aggMap.get(settings.year);
      const helpers = this.computeYearHelpers(settings, agg, currentYear);
      const ust = this.computeUst(helpers, settings, agg);
      const est = this.computeEst(helpers, settings, agg, currentYear);
      const svs = this.computeSvs(settings, est.est_steuerlicher_gewinn, agg, currentYear);
      const vorschreibungBase = this.computeVorschreibung(settings);

      const private_out = helpers.private_out;
      const private_in = num(agg?.private_in);
      const expensesRaw = this.computeBookingYearExpenses(agg);
      const ausgaben = svs.svs_bezahlt + est.est_bezahlt + ust.ust_bezahlt + expensesRaw;
      const netto_gewinn =
        helpers.income_netto - est.est_ergebnis - expensesRaw - svs.svs_summe + ust.ust_pauschalierung;
      const konto_saldo =
        helpers.income_brutto - svs.svs_bezahlt - est.est_bezahlt - ust.ust_bezahlt
        - expensesRaw - private_out + private_in;
      const einnahmen_minus_ausgaben = helpers.income_brutto - ausgaben;
      const months = settings.activeMonths || 12;

      partialRows.push({
        year: settings.year,
        active_months: settings.activeMonths,

        est_vorschreibung: num(settings.estVorschreibung),

        income_netto: helpers.income_netto,
        income_brutto: helpers.income_brutto,
        expenses: expensesRaw,
        private_in,
        private_out,
        ust_bezahlt: ust.ust_bezahlt,
        est_bezahlt: est.est_bezahlt,
        svs_bezahlt: svs.svs_bezahlt,

        ust_pauschalierung: ust.ust_pauschalierung,
        ust_berechnet: ust.ust_berechnet,
        ust_festgesetzt: settings.ustFestgesetzt == null ? null : num(settings.ustFestgesetzt),
        ust_ergebnis: ust.ust_ergebnis,
        ust_differenz: ust.ust_differenz,

        est_summe_aufwendungen: est.est_summe_aufwendungen,
        est_basispauschalierung: est.est_basispauschalierung,
        est_gewinnfreibetrag: est.est_gewinnfreibetrag,
        est_steuerlicher_gewinn: est.est_steuerlicher_gewinn,
        est_sonderausgaben: num(settings.sonderausgaben),
        est_bemessungsgrundlage: est.est_bemessungsgrundlage,
        est_vorergebnis: est.est_vorergebnis,
        est_festgesetzt: settings.estFestgesetzt == null ? null : num(settings.estFestgesetzt),
        est_ergebnis: est.est_ergebnis,
        est_differenz: est.est_differenz,

        svs_berechnungsgrundlage: svs.svs_berechnungsgrundlage,
        svs_bemessungsgrundlage: svs.svs_bemessungsgrundlage,
        svs_vorschreibung: vorschreibungBase.svs_vorschreibung,
        svs_summe: svs.svs_summe,
        svs_differenz: svs.svs_differenz,

        ausgaben,
        netto_gewinn,
        netto_gewinn_monatlich: months ? netto_gewinn / months : 0,
        private_out_monatlich: months ? private_out / months : 0,
        einnahmen_minus_ausgaben,
        konto_saldo,
      });
    }

    // Second pass: running totals across years (window function in legacy SQL).
    let ust_diff_kum = 0;
    let est_diff_kum = 0;
    let svs_diff_kum = 0;
    let konto_kum = 0;
    return partialRows.map((row) => {
      ust_diff_kum += row.ust_differenz;
      est_diff_kum += row.est_differenz;
      svs_diff_kum += row.svs_differenz;
      konto_kum += row.konto_saldo;
      const steuer_diff_kumuliert = ust_diff_kum + est_diff_kum;
      return {
        ...row,
        ust_diff_kumuliert: ust_diff_kum,
        est_diff_kumuliert: est_diff_kum,
        steuer_diff_kumuliert,
        svs_diff_kumuliert: svs_diff_kum,
        konto_saldo_kumuliert: konto_kum,
        konto_ueberschuss: konto_kum + steuer_diff_kumuliert + svs_diff_kum,
      };
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // booking_year aggregation (replaces booking_year.view.entity.ts).
  // One SQL roundtrip per user, all years.
  // ──────────────────────────────────────────────────────────────────────────

  private async aggregateBookingYear(userId: number): Promise<BookingYearAgg[]> {
    const rows = await this.dataSource.query<Array<Record<string, string | number>>>(
      `SELECT
         year,
         COALESCE(SUM(CASE WHEN is_incoming = 1 AND is_private = 0 THEN netto END), 0)  AS income_netto,
         COALESCE(SUM(CASE WHEN is_incoming = 1 AND is_private = 0 THEN brutto END), 0) AS income_brutto,
         COALESCE(SUM(CASE WHEN is_est = 1 THEN netto END), 0)                          AS est,
         COALESCE(SUM(CASE WHEN is_ust = 1 THEN netto END), 0)                          AS ust,
         COALESCE(SUM(CASE WHEN is_svs = 1 THEN netto END), 0)                          AS svs,
         COALESCE(SUM(CASE WHEN is_private = 1 AND is_incoming = 1 THEN netto END), 0)  AS private_in,
         COALESCE(SUM(CASE WHEN is_private = 1 AND is_incoming = 0 THEN netto END), 0)  AS private_out,
         COALESCE(SUM(CASE WHEN is_incoming = 0 THEN brutto END), 0)                    AS total_out
       FROM obulus_bookings
       WHERE user_id = ?
       GROUP BY year
       ORDER BY year ASC`,
      [userId],
    );
    return rows.map((r) => ({
      year: Number(r.year),
      income_netto: num(r.income_netto),
      income_brutto: num(r.income_brutto),
      est: num(r.est),
      ust: num(r.ust),
      svs: num(r.svs),
      private_in: num(r.private_in),
      private_out: num(r.private_out),
      total_out: num(r.total_out),
    }));
  }

  /**
   * Replaces the inline `expenses` calculation in booking_year.view.entity.ts:
   *   total_out - private_out - est - ust - svs
   */
  private computeBookingYearExpenses(agg: BookingYearAgg | undefined): number {
    if (!agg) return 0;
    return agg.total_out - agg.private_out - agg.est - agg.ust - agg.svs;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // year_helpers (replaces year-helpers.view.entity.ts).
  // Past years use actuals; current year uses GREATEST(actual, projection).
  // ──────────────────────────────────────────────────────────────────────────

  private computeYearHelpers(
    settings: YearSettings,
    agg: BookingYearAgg | undefined,
    currentYear: number,
  ): YearHelpers {
    const isPast = settings.year < currentYear;
    const incomeNettoActual = num(agg?.income_netto);
    const incomeBruttoActual = num(agg?.income_brutto);
    const expensesActual = this.computeBookingYearExpenses(agg);
    const privateOutActual = num(agg?.private_out);

    if (isPast) {
      return {
        year: settings.year,
        income_netto: incomeNettoActual,
        income_brutto: incomeBruttoActual,
        expenses: expensesActual,
        private_out: privateOutActual,
        active_months: settings.activeMonths,
      };
    }

    // Current/future year: blend actuals with projection (legacy used
    // GREATEST(actual, projection) so that early in the year the projection
    // dominates, late in the year actuals do).
    const incomeNetto = Math.max(incomeNettoActual, num(settings.umsatzErwartet));
    // Brutto projection: keep tax differential of whatever has been booked.
    const taxDelta = incomeBruttoActual - incomeNettoActual;
    const incomeBrutto = Math.max(
      incomeBruttoActual,
      num(settings.umsatzErwartet) + Math.max(taxDelta, 0),
    );
    const expenses = Math.max(expensesActual, num(settings.ausgabenErwartet));
    const monthsLeft = settings.year === currentYear
      ? 12 - new Date().getMonth() // getMonth is 0-indexed; legacy used (month-1)
      : 0;
    const private_out = privateOutActual + num(settings.gehalt) * monthsLeft;
    return {
      year: settings.year,
      income_netto: incomeNetto,
      income_brutto: incomeBrutto,
      expenses,
      private_out,
      active_months: settings.activeMonths,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ust (replaces ust.view.entity.ts).
  // ──────────────────────────────────────────────────────────────────────────

  private computeUst(
    helpers: YearHelpers,
    settings: YearSettings,
    agg: BookingYearAgg | undefined,
  ) {
    const ust_einnahmen = helpers.income_brutto - helpers.income_netto;
    const ust_pauschalierung = Math.min(0.018 * helpers.income_netto, 3960);
    const ust_berechnet = ust_einnahmen - ust_pauschalierung;
    const ust_bezahlt = num(agg?.ust);
    const ust_festgesetzt = settings.ustFestgesetzt;
    const ust_ergebnis = ust_festgesetzt !== null && ust_festgesetzt !== undefined
      ? num(ust_festgesetzt)
      : ust_berechnet;
    // Bugfix gegenüber Original-View: Differenz vergleicht gegen ust_ergebnis
    // (= festgesetzt falls vorhanden, sonst berechnet) – nicht gegen den
    // berechneten Wert, der einfach ignoriert wurde wenn festgesetzt da ist.
    const ust_differenz = ust_bezahlt - ust_ergebnis;
    return { ust_pauschalierung, ust_berechnet, ust_bezahlt, ust_ergebnis, ust_differenz };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // est (replaces est.view.entity.ts). Year-specific progressive tariff.
  // ──────────────────────────────────────────────────────────────────────────

  private computeEst(
    helpers: YearHelpers,
    settings: YearSettings,
    agg: BookingYearAgg | undefined,
    currentYear: number,
  ) {
    const isPast = settings.year < currentYear;
    const vorschreibung = this.computeVorschreibung(settings);

    // est_bezahlt: past years → actual EST bookings; current/future → SVS+EST projection.
    const est_bezahlt = isPast ? num(agg?.est) : num(settings.estVorschreibung);

    // est_summe_aufwendungen: gewinnmindernde + (past: actual SVS, current: SVS-projection).
    const est_summe_aufwendungen = isPast
      ? num(settings.gewinnmindernde_ausgaben) + num(agg?.svs)
      : num(settings.gewinnmindernde_ausgaben) + vorschreibung.svs_vorschreibung;

    const est_basispauschalierung = Math.min(
      0.12 * (helpers.income_netto - num(settings.gewinnmindernde_ausgaben)),
      26400,
    );
    // Grundfreibetrag (§10 EStG):
    //   bis 2023: 13% bis €30.000  → max €3.900
    //   ab 2024:  15% bis €33.000  → max €4.950 (Konjunkturpaket 2024).
    // Investitionsbedingter GFB ist nicht abgebildet – nur der pauschale
    // Grundfreibetrag, den jeder Selbständige automatisch bekommt.
    const gfbRate = settings.year < 2024 ? 0.13 : 0.15;
    const gfbCap = settings.year < 2024 ? 3900 : 4950;
    const est_gewinnfreibetrag = Math.min(
      gfbRate * (helpers.income_netto - num(settings.gewinnmindernde_ausgaben)),
      gfbCap,
    );
    const est_steuerlicher_gewinn =
      helpers.income_netto - est_summe_aufwendungen - est_basispauschalierung - est_gewinnfreibetrag;
    const est_bemessungsgrundlage = est_steuerlicher_gewinn - num(settings.sonderausgaben);

    const est_vorergebnis = this.estProgressiveTariff(settings.year, est_bemessungsgrundlage, settings);

    // est_ergebnis: festgesetzt overrides; otherwise vorergebnis + kapitalvermögen.
    const est_festgesetzt = settings.estFestgesetzt;
    const est_ergebnis = Math.round(
      est_festgesetzt !== null && est_festgesetzt !== undefined
        ? num(est_festgesetzt)
        : est_vorergebnis + num(settings.kapitalvermoegen),
    );

    // est_differenz: past → bezahlt vs (festgesetzt or vorergebnis); current → bezahlt vs vorergebnis.
    const est_differenz = isPast
      ? est_bezahlt - (est_festgesetzt !== null && est_festgesetzt !== undefined
          ? num(est_festgesetzt)
          : est_vorergebnis)
      : est_bezahlt - est_vorergebnis;

    return {
      est_bezahlt,
      est_summe_aufwendungen,
      est_basispauschalierung,
      est_gewinnfreibetrag,
      est_steuerlicher_gewinn,
      est_bemessungsgrundlage,
      est_vorergebnis,
      est_ergebnis,
      est_differenz,
    };
  }

  /**
   * Progressive Austrian income tax tariff (§33 EStG). Brackets are
   * configured per year via `est_limit_1..6` in YearSettings; rates are
   * coded here because they're set by federal law, not user-tunable.
   *
   * 2015: special transitional brackets (25k/60k cliffs at 36.5/43.2/50%)
   *
   * 2016+: 6 brackets above the tax-free zone. Rate evolution per
   * "Ökosoziale Steuerreform 2022" + "Konjunkturpaket 2024":
   *
   *   Stufe (über limit_1):
   *     ≤2021: 25%      (legacy)
   *     2022:  22,5%    (Mischsatz 25%/20% 1.7.2022 wirksam)
   *     ≥2023: 20%      (volle ÖSR-Senkung)
   *
   *   Stufe (über limit_2):
   *     ≤2021: 35%      (legacy)
   *     2022:  32,5%    (ÖSR Schritt 1)
   *     ≥2023: 30%      (ÖSR Schritt 2)
   *
   *   Stufe (über limit_3):
   *     ≤2022: 42%      (legacy)
   *     2023:  41%      (ÖSR Schritt 1)
   *     ≥2024: 40%      (ÖSR Schritt 2)
   *
   *   Stufe (über limit_4): 48%   (stabil)
   *   Stufe (über limit_5): 50%   (stabil)
   *   Stufe (über limit_6): 55%   (stabil, Spitzensteuer)
   */
  private estProgressiveTariff(year: number, base: number, s: YearSettings): number {
    if (base <= 0) return 0;

    if (year === 2015) {
      const tier1 = Math.max(Math.min(base - num(s.estLimit1), 25000 - num(s.estLimit1)), 0) * 0.365;
      const tier2 = Math.max(Math.min(base - 25000, 60000 - 25000), 0) * 0.432143;
      const tier3 = Math.max(base - 60000, 0) * 0.5;
      return tier1 + tier2 + tier3;
    }

    if (year >= 2016) {
      const rate1 = year <= 2021 ? 0.25 : year === 2022 ? 0.225 : 0.20;
      const rate2 = year <= 2021 ? 0.35 : year === 2022 ? 0.325 : 0.30;
      const rate3 = year <= 2022 ? 0.42 : year === 2023 ? 0.41 : 0.40;
      const tier1 = Math.max(Math.min(base - num(s.estLimit1), num(s.estLimit2) - num(s.estLimit1)), 0) * rate1;
      const tier2 = Math.max(Math.min(base - num(s.estLimit2), num(s.estLimit3) - num(s.estLimit2)), 0) * rate2;
      const tier3 = Math.max(Math.min(base - num(s.estLimit3), num(s.estLimit4) - num(s.estLimit3)), 0) * rate3;
      const tier4 = Math.max(Math.min(base - num(s.estLimit4), num(s.estLimit5) - num(s.estLimit4)), 0) * 0.48;
      const tier5 = Math.max(Math.min(base - num(s.estLimit5), num(s.estLimit6) - num(s.estLimit5)), 0) * 0.50;
      const tier6 = Math.max(base - num(s.estLimit6), 0) * 0.55;
      return tier1 + tier2 + tier3 + tier4 + tier5 + tier6;
    }

    return 0;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // svs (replaces svs.view.entity.ts + vorschreibung.view.entity.ts).
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Per-year SVS pre-assessment ("Vorschreibung"). Mirrors
   * vorschreibung.view.entity.ts. Note the legacy formula multiplies the
   * monthly base from settings (e.g. svs_vorschreibung_pv = 6615) by
   * active_months × rate – this is suspicious for whole-year settings but
   * preserved for parity with the legacy values the user already verified.
   */
  private computeVorschreibung(s: YearSettings) {
    const months = s.activeMonths || 12;
    const svs_vorschreibung_pv = num(s.svsVorschreibungPv) * months * num(s.svsPensionsversicherung);
    const svs_vorschreibung_kv = num(s.svsVorschreibungKv) * months * num(s.svsKrankenversicherung);
    const svs_vorschreibung_vorsorge = num(s.svsVorschreibungKv) * months * num(s.svsVorsorge);
    const svs_vorschreibung_unfall = months * num(s.svsUnfallversicherung);
    const svs_vorschreibung_gsvg = svs_vorschreibung_pv + svs_vorschreibung_kv;
    const svs_vorschreibung =
      svs_vorschreibung_pv + svs_vorschreibung_kv + svs_vorschreibung_vorsorge + svs_vorschreibung_unfall;
    return {
      svs_vorschreibung_pv,
      svs_vorschreibung_kv,
      svs_vorschreibung_vorsorge,
      svs_vorschreibung_unfall,
      svs_vorschreibung_gsvg,
      svs_vorschreibung,
    };
  }

  private computeSvs(
    settings: YearSettings,
    estSteuerlicherGewinn: number,
    agg: BookingYearAgg | undefined,
    currentYear: number,
  ) {
    const isPast = settings.year < currentYear;
    const months = settings.activeMonths || 12;
    const v = this.computeVorschreibung(settings);

    const svs_berechnungsgrundlage = estSteuerlicherGewinn;
    const svs_bemessungsgrundlage = Math.min(
      (svs_berechnungsgrundlage + v.svs_vorschreibung_gsvg) / months,
      num(settings.svsHoechstbeitragsgrundlage),
    );

    const svs_ergebnis_pv = svs_bemessungsgrundlage * months * num(settings.svsPensionsversicherung);
    const svs_ergebnis_kv = svs_bemessungsgrundlage * months * num(settings.svsKrankenversicherung);
    // Bugfix: Selbständigenvorsorge §6 BMSVG ist 1,53% der **tatsächlichen
    // Bemessungsgrundlage**, nicht der Vorschreibungs-Basis. Der Original-
    // Code in svs.view.entity.ts hat hier `v.svs_vorschreibung_vorsorge`
    // verwendet – das skaliert nicht mit echtem Einkommen.
    const svs_ergebnis_vorsorge = svs_bemessungsgrundlage * months * num(settings.svsVorsorge);
    // Unfallversicherung ist ein fixer Monatsbetrag (kein Prozentsatz),
    // also identisch mit der Vorschreibung – hier korrekt übernommen.
    const svs_ergebnis_unfall = v.svs_vorschreibung_unfall;
    const svs_summe = svs_ergebnis_pv + svs_ergebnis_kv + svs_ergebnis_vorsorge + svs_ergebnis_unfall;

    const svs_bezahlt = isPast ? num(agg?.svs) : v.svs_vorschreibung;
    const svs_differenz = svs_bezahlt - svs_summe;

    return {
      svs_berechnungsgrundlage,
      svs_bemessungsgrundlage,
      svs_summe,
      svs_bezahlt,
      svs_differenz,
    };
  }
}

/** Coerce DB decimals (returned as string by mysql2/typeorm) to JS number. */
function num(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === 'string' ? parseFloat(v) : v;
}
