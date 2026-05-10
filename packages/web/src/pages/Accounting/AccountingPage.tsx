import { useMemo, useState } from 'react';
import {
  Typography, Spin, Empty, Button, Space, Dropdown, Drawer, Form,
  InputNumber, message, Alert, Divider,
} from 'antd';
import {
  CloudSyncOutlined, SettingOutlined, DownOutlined, ReloadOutlined,
} from '@ant-design/icons';
import {
  useBookamatOverview, useYearSettings, useUpdateYearSettings,
  useSyncBookamat, useSyncBookamatYear,
} from '../../hooks/useApi';
import { formatCurrency } from '../../utils/format';

const { Title, Text } = Typography;

interface YearOverview {
  year: number;
  income_netto: number;
  income_brutto: number;
  ausgaben: number;
  svs_bezahlt: number;
  ust_bezahlt: number;
  est_bezahlt: number;
  expenses: number;
  netto_gewinn: number;
  netto_gewinn_monatlich: number;
  private_out: number;
  private_out_monatlich: number;
  einnahmen_minus_ausgaben: number;
  konto_saldo_kumuliert: number;
  steuer_diff_kumuliert: number;
  svs_diff_kumuliert: number;
  konto_ueberschuss: number;

  est_vorschreibung: number;
  est_basispauschalierung: number;
  est_gewinnfreibetrag: number;
  est_steuerlicher_gewinn: number;
  est_sonderausgaben: number;
  est_bemessungsgrundlage: number;
  est_ergebnis: number;
  est_differenz: number;

  ust_ergebnis: number;
  ust_pauschalierung: number;
  ust_differenz: number;

  svs_summe: number;
  svs_berechnungsgrundlage: number;
  svs_bemessungsgrundlage: number;
  svs_vorschreibung: number;
  svs_differenz: number;
}

interface YearSettings {
  userId: number;
  year: number;
  activeMonths: number;
  gehalt: number | string;
  umsatzErwartet: number | string;
  ausgabenErwartet: number | string;
  sonstigeEinnahmen: number | string;
  sonderausgaben: number | string;
  gewinnmindernde_ausgaben: number | string;
  absetzbeitrag: number | string;
  kapitalvermoegen: number | string;
  anspruchszinsen: number | string;
  svsVorschreibungPv: number | string;
  svsVorschreibungKv: number | string;
  svsHoechstbeitragsgrundlage: number | string;
  svsPensionsversicherung: number | string;
  svsKrankenversicherung: number | string;
  svsVorsorge: number | string;
  svsUnfallversicherung: number | string;
  svsNachbemessen: number | string | null;
  estVorschreibung: number | string | null;
  estFestgesetzt: number | string | null;
  ustFestgesetzt: number | string | null;
  estLimit1: number;
  estLimit2: number;
  estLimit3: number;
  estLimit4: number;
  estLimit5: number;
  estLimit6: number;
}

const PROFIT_GREEN = '#16a34a';
const LOSS_RED = '#dc2626';
const MUTED = '#64748b';

export default function AccountingPage() {
  const overview = useBookamatOverview();
  const settings = useYearSettings();
  const syncAll = useSyncBookamat();
  const syncYear = useSyncBookamatYear();
  const updateSettings = useUpdateYearSettings();
  const [settingsForYear, setSettingsForYear] = useState<number | null>(null);
  const [settingsForm] = Form.useForm();

  const data: YearOverview[] = overview.data ?? [];
  const allSettings: YearSettings[] = settings.data ?? [];

  // Display newest year first.
  const years = useMemo(() => [...data].reverse(), [data]);

  const handleSyncAll = async () => {
    try {
      await syncAll.mutateAsync();
      message.success('Alle Jahre synchronisiert');
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? 'Fehler beim Synchronisieren');
    }
  };

  const handleSyncYear = async (year: number) => {
    try {
      await syncYear.mutateAsync(year);
      message.success(`Jahr ${year} synchronisiert`);
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? 'Fehler beim Synchronisieren');
    }
  };

  const openSettings = (year: number) => {
    const s = allSettings.find((x) => x.year === year);
    settingsForm.resetFields();
    if (s) {
      settingsForm.setFieldsValue(s);
    } else {
      settingsForm.setFieldsValue({ year });
    }
    setSettingsForYear(year);
  };

  const handleSaveSettings = async (values: any) => {
    if (settingsForYear == null) return;
    try {
      await updateSettings.mutateAsync({ year: settingsForYear, data: values });
      message.success('Einstellungen gespeichert');
      setSettingsForYear(null);
    } catch {
      message.error('Fehler beim Speichern');
    }
  };

  if (overview.isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  if (overview.isError) {
    return (
      <div>
        <Title level={3}>Buchhaltung</Title>
        <Alert
          type="error"
          message="Übersicht konnte nicht geladen werden"
          description={(overview.error as any)?.response?.data?.message ?? 'Unbekannter Fehler'}
        />
      </div>
    );
  }

  if (years.length === 0) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>Buchhaltung</Title>
          <Button type="primary" icon={<CloudSyncOutlined />} loading={syncAll.isPending} onClick={handleSyncAll}>
            Bookamat synchronisieren
          </Button>
        </div>
        <Empty description={'Noch keine Buchungen importiert. Klicke „Bookamat synchronisieren", um Daten aus Bookamat zu laden.'} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Buchhaltung</Title>
        <Button type="primary" icon={<CloudSyncOutlined />} loading={syncAll.isPending} onClick={handleSyncAll}>
          Alle synchronisieren
        </Button>
      </div>

      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Quelle: <a href="https://www.bookamat.com" target="_blank" rel="noreferrer">bookamat.com</a> · Klick auf einen Jahres-Header für Sync &amp; Einstellungen.
      </Text>

      <div style={{
        overflow: 'auto',
        maxHeight: 'calc(100vh - 220px)',
        border: '1px solid #f0f0f0',
        borderRadius: 8,
      }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 14, whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              <th style={{ ...th, ...stickyLeft, ...stickyTop, zIndex: 3, background: '#fafbfc' }}> </th>
              {years.map((y) => (
                <th key={y.year} style={{ ...th, ...stickyTop, background: '#fafbfc', textAlign: 'right' }}>
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'sync',
                          icon: <ReloadOutlined />,
                          label: 'Synchronisieren',
                          onClick: () => handleSyncYear(y.year),
                        },
                        {
                          key: 'settings',
                          icon: <SettingOutlined />,
                          label: 'Einstellungen',
                          onClick: () => openSettings(y.year),
                        },
                      ],
                    }}
                  >
                    <Space size={4} style={{ cursor: 'pointer', fontWeight: 700, fontSize: 18 }}>
                      {y.year} <DownOutlined style={{ fontSize: 12 }} />
                    </Space>
                  </Dropdown>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SectionHeader years={years} title="Einnahmen / Ausgaben" />
            <Row title="Einnahmen netto" years={years} get={(y) => y.income_netto} bold color={PROFIT_GREEN} />
            <Row title="Einnahmen brutto" years={years} get={(y) => y.income_brutto} muted />
            <Row title="Ausgaben gesamt" years={years} get={(y) => y.ausgaben} bold color={LOSS_RED} />
            <Row title="Sozialversicherung" years={years} get={(y) => y.svs_bezahlt} indent muted />
            <Row title="Umsatzsteuer" years={years} get={(y) => y.ust_bezahlt} indent muted />
            <Row title="Einkommenssteuer" years={years} get={(y) => y.est_bezahlt} indent muted />
            <Row title="Sonstige Ausgaben" years={years} get={(y) => y.expenses} indent color={LOSS_RED} />

            <SectionHeader years={years} title="Netto Gewinn" />
            <Row title="jährlich" years={years} get={(y) => y.netto_gewinn} indent bold colorByValue />
            <Row title="monatlich" years={years} get={(y) => y.netto_gewinn_monatlich} indent />

            <SectionHeader years={years} title="Privatentnahmen" />
            <Row title="jährlich" years={years} get={(y) => y.private_out} indent color={LOSS_RED} bold />
            <Row title="monatlich" years={years} get={(y) => y.private_out_monatlich} indent />

            <SectionHeader years={years} title="Konto" />
            <Row title="Einnahmen − Ausgaben" years={years} get={(y) => y.einnahmen_minus_ausgaben} muted />
            <Row title="Liquidität (kumuliert)" years={years} get={(y) => y.konto_saldo_kumuliert} bold />
            <Row title="Steuerkonto" years={years} get={(y) => y.steuer_diff_kumuliert} muted />
            <Row title="SVS-Konto" years={years} get={(y) => y.svs_diff_kumuliert} muted />
            <Row title="Überschuss" years={years} get={(y) => y.konto_ueberschuss} bold />

            <SectionHeader years={years} title="Einkommenssteuer" />
            <Row title="Vorgeschrieben" years={years} get={(y) => y.est_vorschreibung} />
            <Row title="Betriebseinnahmen" years={years} get={(y) => y.income_netto} muted />
            <Row title="− Pflichtversicherungsbeiträge" years={years} get={(y) => y.svs_bezahlt} indent muted />
            <Row title="− Basispauschalierung" years={years} get={(y) => y.est_basispauschalierung} indent muted />
            <Row title="− Gewinnfreibetrag" years={years} get={(y) => y.est_gewinnfreibetrag} indent muted />
            <Row title="Steuerlicher Gewinn" years={years} get={(y) => y.est_steuerlicher_gewinn} />
            <Row title="− Sonderausgaben" years={years} get={(y) => y.est_sonderausgaben} indent muted />
            <Row title="Einkommen" years={years} get={(y) => y.est_bemessungsgrundlage} />
            <Row title="Ergebnis (berechnet)" years={years} get={(y) => y.est_ergebnis} bold />
            <Row title="Differenz" years={years} get={(y) => y.est_differenz} muted />

            <SectionHeader years={years} title="Umsatzsteuer" />
            <Row title="Ergebnis" years={years} get={(y) => y.ust_ergebnis} />
            <Row title="Pauschalierung" years={years} get={(y) => y.ust_pauschalierung} muted />
            <Row title="Differenz" years={years} get={(y) => y.ust_differenz} muted />

            <SectionHeader years={years} title="Sozialversicherung" />
            <Row title="Ergebnis (berechnet)" years={years} get={(y) => y.svs_summe} />
            <Row title="Berechnungsgrundlage" years={years} get={(y) => y.svs_berechnungsgrundlage} muted />
            <Row title="Bemessungsgrundlage" years={years} get={(y) => y.svs_bemessungsgrundlage} muted />
            <Row title="Vorschreibung" years={years} get={(y) => y.svs_vorschreibung} muted />
            <Row title="Differenz" years={years} get={(y) => y.svs_differenz} muted />
          </tbody>
        </table>
      </div>

      {/* Year settings drawer */}
      <Drawer
        title={`Einstellungen ${settingsForYear ?? ''}`}
        open={settingsForYear !== null}
        onClose={() => setSettingsForYear(null)}
        width={520}
        styles={{ body: { padding: '24px' }, footer: { padding: '12px 24px' } }}
        footer={
          <Button
            type="primary" block size="large"
            loading={updateSettings.isPending}
            onClick={() => settingsForm.submit()}
          >
            Speichern
          </Button>
        }
      >
        <Form form={settingsForm} layout="vertical" onFinish={handleSaveSettings} requiredMark={false}>
          <FormSection title="Projektion" />
          <SettingsField name="activeMonths" label="Aktive Monate" unit="months" />
          <SettingsField name="gehalt" label="Privat-Gehalt (monatlich, projiziert)" unit="eur" />
          <SettingsField name="umsatzErwartet" label="Umsatz erwartet" unit="eur" />
          <SettingsField name="ausgabenErwartet" label="Ausgaben erwartet" unit="eur" />

          <FormSection title="Steuerinformation (festgesetzt)" />
          <SettingsField name="estVorschreibung" label="EST Vorschreibung" unit="eur" />
          <SettingsField name="estFestgesetzt" label="EST festgesetzt" unit="eur" />
          <SettingsField name="ustFestgesetzt" label="UST festgesetzt" unit="eur" />
          <SettingsField name="sonderausgaben" label="Sonderausgaben" unit="eur" />
          <SettingsField name="gewinnmindernde_ausgaben" label="Gewinnmindernde Ausgaben" unit="eur" />
          <SettingsField name="kapitalvermoegen" label="Kapitalvermögen" unit="eur" />

          <FormSection title="SVS Vorschreibung & Sätze" />
          <SettingsField name="svsVorschreibungPv" label="SVS Vorschreibung PV (Beitragsgrundlage)" unit="eur" />
          <SettingsField name="svsVorschreibungKv" label="SVS Vorschreibung KV (Beitragsgrundlage)" unit="eur" />
          <SettingsField name="svsHoechstbeitragsgrundlage" label="SVS Höchstbeitragsgrundlage" unit="eur" />
          <SettingsField name="svsUnfallversicherung" label="SVS Unfallversicherung (mtl.)" unit="eur" />
          <SettingsField name="svsPensionsversicherung" label="SVS Pensionsversicherung" unit="rate" />
          <SettingsField name="svsKrankenversicherung" label="SVS Krankenversicherung" unit="rate" />
          <SettingsField name="svsVorsorge" label="SVS Vorsorge" unit="rate" />

          <FormSection title="EST Tarif-Stufen-Grenzen" />
          <SettingsField name="estLimit1" label="Stufe 1 (0% bis)" unit="eur" />
          <SettingsField name="estLimit2" label="Stufe 2 (25% bis)" unit="eur" />
          <SettingsField name="estLimit3" label="Stufe 3 (35/32,5/30% bis)" unit="eur" />
          <SettingsField name="estLimit4" label="Stufe 4 (42/41/40% bis)" unit="eur" />
          <SettingsField name="estLimit5" label="Stufe 5 (48% bis)" unit="eur" />
          <SettingsField name="estLimit6" label="Stufe 6 (50% bis, darüber 55%)" unit="eur" />
        </Form>
      </Drawer>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: '12px 14px',
  textAlign: 'left',
  fontWeight: 600,
};

const td: React.CSSProperties = {
  padding: '8px 14px',
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
};

// Pinned label column: stays put while year columns scroll horizontally.
// boxShadow gives a subtle right edge so the user sees the column stays.
const stickyLeft: React.CSSProperties = {
  position: 'sticky',
  left: 0,
  zIndex: 2,
  boxShadow: '4px 0 8px -6px rgba(0,0,0,0.15)',
};

// Pinned year header row: stays at the top while body scrolls vertically.
// The wrapper provides the scroll container (max-height + overflow:auto).
const stickyTop: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 2,
  boxShadow: '0 4px 8px -6px rgba(0,0,0,0.15)',
};

function SectionHeader({ years, title }: { years: YearOverview[]; title: string }) {
  return (
    <tr style={{ background: '#fff' }}>
      <td style={{
        ...stickyLeft,
        background: '#fff',
        padding: '20px 14px 6px',
        fontWeight: 700,
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#475569',
      }}>
        {title}
      </td>
      {years.map((y) => (
        <td key={y.year} style={{ background: '#fff', padding: '20px 14px 6px' }} />
      ))}
    </tr>
  );
}

interface RowProps {
  title: string;
  years: YearOverview[];
  get: (y: YearOverview) => number | undefined;
  bold?: boolean;
  muted?: boolean;
  indent?: boolean;
  color?: string;
  colorByValue?: boolean;
}

function Row({ title, years, get, bold, muted, indent, color, colorByValue }: RowProps) {
  // borderCollapse:'separate' on the table means row borders need to be on
  // the cells (otherwise they don't follow sticky cells when scrolling).
  const cellBorder = '1px solid #f5f5f5';
  return (
    <tr style={{ background: '#fff' }}>
      <td style={{
        ...td,
        ...stickyLeft,
        background: '#fff',
        borderTop: cellBorder,
        textAlign: 'left',
        paddingLeft: indent ? 30 : 14,
        fontWeight: bold ? 600 : 400,
        color: muted ? MUTED : '#0f172a',
      }}>
        {title}
      </td>
      {years.map((y) => {
        const v = get(y);
        const num = typeof v === 'number' ? v : Number(v);
        const isNum = Number.isFinite(num);
        const c = color
          ? color
          : colorByValue
            ? (isNum && num >= 0 ? PROFIT_GREEN : LOSS_RED)
            : muted ? MUTED : undefined;
        return (
          <td key={y.year} style={{
            ...td,
            borderTop: cellBorder,
            fontWeight: bold ? 600 : 400,
            color: c,
          }}>
            {isNum && num !== 0 ? formatCurrency(num) : '–'}
          </td>
        );
      })}
    </tr>
  );
}

function FormSection({ title }: { title: string }) {
  return (
    <Divider titlePlacement="start" plain style={{ margin: '8px 0 16px', fontSize: 13, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {title}
    </Divider>
  );
}

type FieldUnit = 'eur' | 'rate' | 'months';

/**
 * Three flavours:
 *  - eur:    € prefix, 2 decimals, thousands separator
 *  - rate:   stored 0..1 in DB but shown as percent (0.185 → 18.50 %)
 *  - months: integer with " Mt." suffix, 1..12
 */
function SettingsField({ name, label, unit = 'eur' }: { name: string; label: string; unit?: FieldUnit }) {
  if (unit === 'rate') {
    // DB stores fraction (0.185), UI shows percent. Translate via Form.Item
    // getValueFromEvent / getValueProps so the form value remains a fraction.
    return (
      <Form.Item
        name={name}
        label={label}
        style={{ marginBottom: 12 }}
        getValueProps={(v) => ({ value: v == null || v === '' ? v : Number(v) * 100 })}
        normalize={(v) => (v == null || v === '' ? v : Number(v) / 100)}
      >
        <InputNumber
          variant="filled"
          style={{ width: '100%' }}
          min={0}
          max={100}
          step={0.01}
          precision={4}
          decimalSeparator=","
          addonAfter="%"
        />
      </Form.Item>
    );
  }

  if (unit === 'months') {
    return (
      <Form.Item name={name} label={label} style={{ marginBottom: 12 }}>
        <InputNumber
          variant="filled"
          style={{ width: '100%' }}
          min={1}
          max={12}
          step={1}
          precision={0}
          addonAfter="Monate"
        />
      </Form.Item>
    );
  }

  // eur (default)
  return (
    <Form.Item name={name} label={label} style={{ marginBottom: 12 }}>
      <InputNumber
        variant="filled"
        style={{ width: '100%' }}
        step={1}
        precision={2}
        decimalSeparator=","
        prefix="€"
        formatter={(v) => {
          if (v == null || v === '') return '';
          const n = Number(v);
          if (!Number.isFinite(n)) return String(v);
          return n.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }}
        parser={(v) => {
          if (!v) return '' as unknown as number;
          // Strip thousand separators (.) and convert decimal comma to point.
          const cleaned = v.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
          const n = Number(cleaned);
          return Number.isFinite(n) ? n : ('' as unknown as number);
        }}
      />
    </Form.Item>
  );
}
