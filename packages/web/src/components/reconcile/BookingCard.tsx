import { useMemo, useState } from 'react';
import {
  Card, Form, Input, InputNumber, Select, Button, Space, Tag, Typography, Alert, Checkbox, Upload,
  Dropdown, Modal, Popconfirm, Row, Col, message,
} from 'antd';
import {
  CopyOutlined, SendOutlined, DownOutlined, EyeOutlined, LinkOutlined, StopOutlined,
  PaperClipOutlined, WarningOutlined, FileDoneOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import SmartDatePicker from '../SmartDatePicker';
import { useTransferBooking, useIgnoreMovement, useLinkBooking, useUnmatchedBookings } from '../../hooks/useApi';
import { formatCurrency, formatDate } from '../../utils/format';
import { apiErrorText } from '../../utils/errors';
import type { Accounts, CostAccount, Field, FieldKey, MonthEntry, TaxAccount } from './types';

const { Text } = Typography;

/** Form values: the suggestion's fields, dates as Dayjs. */
interface Values {
  title: string;
  date: Dayjs | null;
  dateInvoice: Dayjs | null;
  dateDelivery: Dayjs | null;
  bankaccount: string | null;
  costaccount: string | null;
  purchasetaxaccount: string | null;
  amount: number | null;
  taxPercent: number | null;
  deductibilityTaxPercent: number | null;
  deductibilityAmountPercent: number | null;
  vatin: string | null;
  country: string | null;
  countryDep: string | null;
  countryRec: string | null;
  costcentre: string | null;
  description: string | null;
}

interface TransferPreview {
  year: number;
  request: unknown;
  attachments?: string[];
}

interface UnmatchedBooking {
  bookamatId: number;
  title: string;
  date: string;
  signed: number;
  /** Not yet covered by linked movements (a booking of several movements). */
  rest: number;
}

type Option = { value: string; label: string };
type Options = (Option | { label: string; options: Option[] })[];
const option = (value: string, label = value): Option => ({ value, label });
/** Select groups, empty ones left out. */
const groups = (list: [string, Option[]][]): Options =>
  list.filter(([, options]) => options.length).map(([label, options]) => ({ label, options }));

const DATE_FIELDS: FieldKey[] = ['date', 'dateInvoice', 'dateDelivery'];

const LABELS: Record<FieldKey, string> = {
  title: 'Titel',
  date: 'Zahlungsdatum',
  dateInvoice: 'Rechnungsdatum',
  dateDelivery: 'Lieferdatum',
  bankaccount: 'Zahlungskonto',
  costaccount: 'Steuerkonto',
  purchasetaxaccount: 'USt-Konto',
  amount: 'Betrag brutto',
  taxPercent: 'USt-Satz %',
  deductibilityTaxPercent: 'Abzugsf. USt %',
  deductibilityAmountPercent: 'Abzugsf. Betrag %',
  vatin: 'UID',
  country: 'Land',
  countryDep: 'Abgangsland',
  countryRec: 'Verbrauchsland',
  costcentre: 'Kostenstelle',
  description: 'Beschreibung',
};

const MORE_FIELDS: FieldKey[] = ['countryDep', 'countryRec', 'costcentre', 'description'];

/** A value as one types it into Bookamat: 21,60 · 14.10.2026. */
function forBookamat(key: FieldKey, value: unknown): string {
  if (value == null || value === '') return '';
  if (DATE_FIELDS.includes(key)) return dayjs(value as Dayjs | string).format('DD.MM.YYYY');
  if (typeof value === 'number') {
    return key === 'amount'
      ? value.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : value.toLocaleString('de-AT');
  }
  return String(value);
}

const readBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/** Bookamat refuses a booking on a reverse-charge or ZM account without Rechnungsdatum. */
const needsInvoiceDate = (tax?: { reverseCharge: boolean; icReport: boolean }) => !!(tax?.reverseCharge || tax?.icReport);

/** Same checks as the API's `validate`, on the edited values. */
function liveWarnings(v: Partial<Values>, accounts: Accounts): string[] {
  const out: string[] = [];
  const cost = accounts.cost.find((c) => c.name === v.costaccount);
  const tax = accounts.tax.find((t) => t.name === v.purchasetaxaccount);
  if (v.costaccount && accounts.cost.length && !cost) out.push(`Steuerkonto „${v.costaccount}“ ist in Bookamat nicht aktiviert.`);
  if (v.purchasetaxaccount && accounts.tax.length && !tax) out.push(`USt-Konto „${v.purchasetaxaccount}“ ist in Bookamat nicht aktiviert.`);
  if (cost && v.purchasetaxaccount && cost.purchasetaxaccounts.length && !cost.purchasetaxaccounts.includes(v.purchasetaxaccount)) {
    const fits = accounts.cost.filter((c) => c.group === cost.group && c.purchasetaxaccounts.includes(v.purchasetaxaccount!)).map((c) => c.name);
    out.push(`USt-Konto „${v.purchasetaxaccount}“ ist beim Steuerkonto „${cost.name}“ nicht erlaubt`
      + `${fits.length ? ` – erlaubt z. B. bei ${fits.slice(0, 4).join(', ')}` : ''}.`);
  }
  if (tax?.taxValues.length && v.taxPercent != null && !tax.taxValues.some((r) => Math.abs(r - v.taxPercent) < 0.001)) {
    out.push(`USt-Satz ${v.taxPercent} % passt nicht zu „${tax.name}“ (erlaubt: ${tax.taxValues.join(', ')} %).`);
  }
  if (tax?.icReport && !v.vatin) out.push(`„${tax.name}“ braucht eine UID.`);
  if (needsInvoiceDate(tax) && !v.dateInvoice) out.push(`„${tax!.name}“ verlangt ein Rechnungsdatum.`);
  return out;
}

interface Props {
  entry: MonthEntry;
  accounts: Accounts;
  year: number;
  month: number;
}

/**
 * One movement Bookamat still lacks, with the booking form filled in. Each
 * field says where its value comes from; guessed ones are marked. The form can
 * be copied field by field into Bookamat or transferred in one go.
 */
export default function BookingCard({ entry, accounts, year, month }: Props) {
  const { tx } = entry;
  const s = entry.suggestion!;
  const [form] = Form.useForm<Values>();
  const transfer = useTransferBooking();
  const ignore = useIgnoreMovement();
  const link = useLinkBooking();

  const [attachInvoice, setAttachInvoice] = useState(true);
  const [markPaid, setMarkPaid] = useState(!s.invoice?.payedAt);
  const [attachment, setAttachment] = useState<{ name: string; data: string } | null>(null);
  const [showMore, setShowMore] = useState(MORE_FIELDS.some((k) => s.fields[k].value != null && s.fields[k].value !== ''));
  const [preview, setPreview] = useState<TransferPreview | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkTo, setLinkTo] = useState<number | null>(null);
  const unmatched = useUnmatchedBookings(year, month, linkOpen);

  const initialValues = useMemo(() => {
    const v: Record<string, unknown> = {};
    for (const [key, f] of Object.entries(s.fields) as [FieldKey, Field][]) {
      v[key] = DATE_FIELDS.includes(key) ? (f.value ? dayjs(f.value as string) : null) : f.value;
    }
    return v as unknown as Values;
  }, [s]);

  const watched = Form.useWatch((v: Values) => v, form);
  const values = watched ?? initialValues;
  const warnings = useMemo(() => {
    const live = liveWarnings(values, accounts);
    // Server warnings that are not account checks (amount ≠ invoice, booked differently before) stay.
    const other = s.warnings.filter((w) => !/nicht aktiviert|nicht erlaubt|passt nicht|braucht eine UID|verlangt ein Rechnungsdatum/.test(w));
    return [...other, ...live];
  }, [values, accounts, s.warnings]);

  const incoming = tx.amount > 0;
  const ofSide = (a: { group: string | null }) => !a.group || a.group === (incoming ? '1' : '2');
  const cost = accounts.cost.find((c) => c.name === values.costaccount);
  const taxOption = (t: TaxAccount) => option(t.name, t.reverseCharge ? `${t.name} (Reverse Charge)` : t.name);

  // Every USt-Konto of the side; the ones Bookamat does not allow with the chosen Steuerkonto apart.
  const allowedTax = cost?.purchasetaxaccounts ?? [];
  const taxOptions: Options = allowedTax.length
    ? groups([
      [`Bei „${cost!.name}“ erlaubt`, accounts.tax.filter((t) => allowedTax.includes(t.name)).map(taxOption)],
      ['Nur mit anderem Steuerkonto', accounts.tax.filter((t) => ofSide(t) && !allowedTax.includes(t.name)).map(taxOption)],
    ])
    : accounts.tax.filter(ofSide).map(taxOption);

  // A USt-Konto the chosen Steuerkonto does not allow: the Steuerkonten that do, first.
  const tax = values.purchasetaxaccount;
  const allows = (c: CostAccount) => !tax || !c.purchasetaxaccounts.length || c.purchasetaxaccounts.includes(tax);
  const sideCost = accounts.cost.filter(ofSide);
  const costOptions: Options = cost && !allows(cost)
    ? groups([
      [`Mit „${tax}“ erlaubt`, sideCost.filter(allows).map((c) => option(c.name))],
      ['Andere', sideCost.filter((c) => !allows(c)).map((c) => option(c.name))],
    ])
    : sideCost.map((c) => option(c.name));

  const invoiceDateRequired = needsInvoiceDate(accounts.tax.find((t) => t.name === values.purchasetaxaccount));
  const withCurrent = (opts: Options, current: string | null | undefined) => {
    const flat = opts.flatMap((o) => ('options' in o ? o.options : [o]));
    return current && !flat.some((o) => o.value === current) ? [option(current, `${current} (nicht aktiviert)`), ...opts] : opts;
  };

  /** Steuerkonto chosen: keep a matching USt-Konto, take Bookamat's fixed shares. */
  const onCostChange = (name: string) => {
    const cost = accounts.cost.find((c) => c.name === name);
    if (!cost) return;
    const patch: Partial<Values> = {};
    const tax = form.getFieldValue('purchasetaxaccount');
    if (cost.purchasetaxaccounts.length && !cost.purchasetaxaccounts.includes(tax)) {
      patch.purchasetaxaccount = cost.purchasetaxaccounts.length === 1 ? cost.purchasetaxaccounts[0] : null;
    }
    if (cost.deductibilityTaxPercent != null) patch.deductibilityTaxPercent = cost.deductibilityTaxPercent;
    if (cost.deductibilityAmountPercent != null) patch.deductibilityAmountPercent = cost.deductibilityAmountPercent;
    form.setFieldsValue(patch);
  };

  /** USt-Konto chosen: a rate it allows. */
  const onTaxChange = (name: string) => {
    const tax = accounts.tax.find((t) => t.name === name);
    const rate = form.getFieldValue('taxPercent');
    if (tax?.taxValues.length && !tax.taxValues.some((r) => Math.abs(r - rate) < 0.001)) {
      form.setFieldsValue({ taxPercent: tax.taxValues[0] });
    }
  };

  const copy = async (key: FieldKey) => {
    const text = forBookamat(key, form.getFieldValue(key));
    await navigator.clipboard.writeText(text);
    message.success(`${LABELS[key]} kopiert`);
  };

  const payload = async (mode: 'book' | 'open', dryRun: boolean) => {
    const v = await form.validateFields();
    const day = (d: Dayjs | null) => (d ? d.format('YYYY-MM-DD') : null);
    return {
      umsatzId: tx.id,
      mode,
      dryRun,
      invoiceId: s.invoice?.id,
      attachInvoice: !!s.invoice && attachInvoice,
      markInvoicePaid: !!s.invoice && markPaid,
      ...(attachment ? { attachment } : {}),
      booking: {
        title: v.title,
        date: day(v.date),
        dateInvoice: day(v.dateInvoice),
        dateDelivery: day(v.dateDelivery),
        vatin: v.vatin || null,
        country: v.country || null,
        costcentre: v.costcentre || null,
        description: v.description || null,
        amounts: [{
          bankaccount: v.bankaccount,
          costaccount: v.costaccount,
          purchasetaxaccount: v.purchasetaxaccount,
          amount: Number(v.amount),
          taxPercent: Number(v.taxPercent),
          deductibilityTaxPercent: Number(v.deductibilityTaxPercent),
          deductibilityAmountPercent: Number(v.deductibilityAmountPercent),
          countryDep: v.countryDep || null,
          countryRec: v.countryRec || null,
        }],
      },
    };
  };

  const send = async (mode: 'book' | 'open', dryRun = false) => {
    let body;
    try {
      body = await payload(mode, dryRun);
    } catch {
      message.warning('Bitte die markierten Felder ausfüllen.');
      return;
    }
    try {
      const res = await transfer.mutateAsync(body);
      if (dryRun) {
        setPreview(res);
        return;
      }
      message.success(mode === 'open'
        ? 'Als offene Buchung in Bookamat angelegt'
        : `In Bookamat gebucht${res.documentNumber ? ` (Beleg ${res.documentNumber})` : ''}`);
      (res.warnings ?? []).forEach((w: string) => message.warning(w, 8));
    } catch (e) {
      message.error(apiErrorText(e), 8);
    }
  };

  const field = (key: FieldKey, input: React.ReactNode, span: { xs?: number; sm?: number; lg?: number } = {}, required = false) => {
    const f = s.fields[key];
    return (
      <Col xs={24} sm={span.sm ?? 12} lg={span.lg ?? 6} key={key}>
        <Form.Item
          name={key}
          label={LABELS[key]}
          rules={required ? [{ required: true, message: 'Pflichtfeld' }] : undefined}
          validateStatus={f.estimated ? 'warning' : undefined}
          style={{ marginBottom: 8 }}
          extra={(
            <Space size={4} style={{ fontSize: 12 }}>
              {f.estimated && <WarningOutlined style={{ color: '#d97706' }} />}
              <span style={{ color: f.estimated ? '#b45309' : undefined }}>{f.source}</span>
              <Button type="link" size="small" icon={<CopyOutlined />} style={{ padding: 0, height: 'auto' }} onClick={() => copy(key)} />
            </Space>
          )}
        >
          {input}
        </Form.Item>
      </Col>
    );
  };

  const basisTag = s.invoice
    ? <Tag color="blue">Rechnung {s.invoice.number}</Tag>
    : s.basis === 'history'
      ? <Tag color="green">{s.profile && s.profile.count > 1 ? `wie ${s.profile.count}× zuvor` : 'wie zuletzt'}</Tag>
      : s.basis === 'category'
        ? <Tag color="gold">nach Kategorie</Tag>
        : <Tag>neu</Tag>;

  const percent = <InputNumber min={0} max={100} step={1} style={{ width: '100%' }} decimalSeparator="," />;

  return (
    <Card
      size="small"
      style={{ marginBottom: 16 }}
      title={(
        <Space wrap size={8} style={{ fontWeight: 400 }}>
          <Text strong>{formatDate(tx.day)}</Text>
          <Text strong style={{ color: incoming ? '#16a34a' : '#dc2626' }}>{formatCurrency(tx.amount)}</Text>
          <Text type="secondary" ellipsis={{ tooltip: tx.description }} style={{ maxWidth: 380 }}>{tx.description}</Text>
          {tx.merchant && <Tag>{tx.merchant}</Tag>}
          {tx.category && <Tag color="purple">{tx.category}</Tag>}
        </Space>
      )}
      extra={basisTag}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
        {s.profile ? <>Buchungsart <Text strong>{s.profile.label}</Text> · </> : null}
        {s.basisLabel}
        {s.similar[0] && <> · zuletzt „{s.similar[0].title}“ am {formatDate(s.similar[0].date)}</>}
      </Text>

      {s.invoice && (
        <Alert
          type="info"
          showIcon
          icon={<FileDoneOutlined />}
          style={{ marginBottom: 12 }}
          title={(
            <Space wrap size={16}>
              <span>
                Rechnung <b>{s.invoice.number}</b> · {s.invoice.clientName} · {formatCurrency(s.invoice.gross)} · vom {formatDate(s.invoice.sentAt)}
                {s.invoice.payedAt && <> · bezahlt am {formatDate(s.invoice.payedAt)}</>}
              </span>
              <Checkbox checked={attachInvoice} onChange={(e) => setAttachInvoice(e.target.checked)}>PDF anhängen</Checkbox>
              {!s.invoice.payedAt && (
                <Checkbox checked={markPaid} onChange={(e) => setMarkPaid(e.target.checked)}>als bezahlt markieren</Checkbox>
              )}
            </Space>
          )}
        />
      )}

      <Form form={form} layout="vertical" initialValues={initialValues} size="middle">
        <Row gutter={12}>
          {field('title', <Input maxLength={50} showCount />, { sm: 24, lg: 12 }, true)}
          {field('date', <SmartDatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />, { lg: 4 }, true)}
          {field('dateInvoice', <SmartDatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />, { lg: 4 }, invoiceDateRequired)}
          {field('dateDelivery', <SmartDatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />, { lg: 4 })}

          {field('bankaccount', accounts.bank.length
            ? <Select options={withCurrent(accounts.bank.map((b) => ({ value: b, label: b })), values.bankaccount)} />
            : <Input />, {}, true)}
          {field('costaccount', costOptions.length
            ? <Select showSearch optionFilterProp="label" options={withCurrent(costOptions, values.costaccount)} onChange={onCostChange} placeholder="Steuerkonto wählen" />
            : <Input />, { lg: 9 }, true)}
          {field('purchasetaxaccount', taxOptions.length
            ? <Select showSearch optionFilterProp="label" options={withCurrent(taxOptions, values.purchasetaxaccount)} onChange={onTaxChange} placeholder="USt-Konto wählen" />
            : <Input />, { lg: 9 }, true)}

          {field('amount', <InputNumber min={0.01} step={0.01} precision={2} decimalSeparator="," style={{ width: '100%' }} addonAfter="€" />, { lg: 4 }, true)}
          {field('taxPercent', percent, { lg: 4 }, true)}
          {field('deductibilityTaxPercent', percent, { lg: 4 }, true)}
          {field('deductibilityAmountPercent', percent, { lg: 4 }, true)}
          {field('vatin', <Input maxLength={20} placeholder="z. B. DE123456789" />, { lg: 4 })}
          {field('country', <Input maxLength={2} style={{ textTransform: 'uppercase' }} />, { lg: 4 })}

          {showMore && (
            <>
              {field('countryDep', <Input maxLength={2} />, { lg: 4 })}
              {field('countryRec', <Input maxLength={2} />, { lg: 4 })}
              {field('costcentre', accounts.costcentre.length
                ? <Select allowClear options={withCurrent(accounts.costcentre.map((c) => ({ value: c, label: c })), values.costcentre)} />
                : <Input />, { lg: 4 })}
              {field('description', <Input maxLength={500} />, { sm: 24, lg: 12 })}
            </>
          )}
        </Row>
      </Form>
      {!showMore && (
        <Button type="link" size="small" style={{ padding: 0, marginBottom: 8, whiteSpace: 'normal', height: 'auto', textAlign: 'left' }} onClick={() => setShowMore(true)}>
          weitere Felder (Abgangs-/Verbrauchsland, Kostenstelle, Beschreibung)
        </Button>
      )}

      {warnings.length > 0 && (
        <Alert type="warning" showIcon style={{ marginBottom: 12 }} title={warnings.length === 1 ? warnings[0] : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        )} />
      )}

      <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
        <Upload
          maxCount={1}
          accept=".pdf,.png,.jpg,.jpeg"
          beforeUpload={async (file) => {
            setAttachment({ name: file.name, data: await readBase64(file) });
            return false;
          }}
          onRemove={() => setAttachment(null)}
        >
          <Button icon={<PaperClipOutlined />}>Beleg anhängen</Button>
        </Upload>
        <Space wrap>
          <Dropdown
            menu={{
              items: [
                { key: 'open', icon: <SendOutlined />, label: 'Als offene Buchung (Entwurf) übertragen' },
                { key: 'preview', icon: <EyeOutlined />, label: 'Vorschau: was gesendet würde' },
                { type: 'divider' },
                { key: 'link', icon: <LinkOutlined />, label: 'Mit vorhandener Buchung verknüpfen…' },
                { key: 'ignore', icon: <StopOutlined />, label: 'Ignorieren (braucht keine Buchung)' },
              ],
              onClick: ({ key }) => {
                if (key === 'open') send('open');
                if (key === 'preview') send('book', true);
                if (key === 'link') setLinkOpen(true);
                if (key === 'ignore') ignore.mutate({ umsatzId: tx.id, ignored: true });
              },
            }}
          >
            <Button>Mehr <DownOutlined /></Button>
          </Dropdown>
          <Popconfirm
            title="In Bookamat buchen?"
            description={`${forBookamat('date', values.date)} · ${formatCurrency(values.amount)} · ${values.costaccount ?? '–'}`}
            okText="Buchen"
            cancelText="Abbrechen"
            onConfirm={() => send('book')}
          >
            <Button type="primary" icon={<SendOutlined />} loading={transfer.isPending}>Übertragen</Button>
          </Popconfirm>
        </Space>
      </Space>

      <Modal
        open={!!preview}
        title="Vorschau: so ginge die Buchung an Bookamat"
        onCancel={() => setPreview(null)}
        footer={<Button onClick={() => setPreview(null)}>Schließen</Button>}
        width={640}
      >
        {preview && (
          <>
            <Text type="secondary">POST …/api/v1/at/{preview.year}/bookings/ (Konten als IDs des Jahres {preview.year})</Text>
            <pre style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 12, maxHeight: 400, overflow: 'auto' }}>
              {JSON.stringify(preview.request, null, 2)}
            </pre>
            {preview.attachments?.length > 0 && <Text>Anhänge: {preview.attachments.join(', ')}</Text>}
          </>
        )}
      </Modal>

      <Modal
        open={linkOpen}
        title="Mit vorhandener Bookamat-Buchung verknüpfen"
        okText="Verknüpfen"
        okButtonProps={{ disabled: !linkTo, loading: link.isPending }}
        onCancel={() => setLinkOpen(false)}
        onOk={async () => {
          try {
            await link.mutateAsync({ umsatzId: tx.id, bookamatId: linkTo! });
            setLinkOpen(false);
          } catch (e) {
            message.error(apiErrorText(e));
          }
        }}
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          Buchungen rund um den Monat, die noch keiner Kontobewegung zugeordnet sind, und Sammelbuchungen mit
          offenem Rest. Passender Betrag zuerst.
        </Text>
        <Select
          style={{ width: '100%' }}
          showSearch
          optionFilterProp="label"
          loading={unmatched.isLoading}
          value={linkTo ?? undefined}
          onChange={setLinkTo}
          options={[...((unmatched.data ?? []) as UnmatchedBooking[])]
            .sort((a, b) => Math.abs(a.rest - tx.amount) - Math.abs(b.rest - tx.amount))
            .map((b) => ({
              value: b.bookamatId,
              label: `${formatDate(b.date)} · ${formatCurrency(b.signed)}${b.rest !== b.signed ? ` (noch offen ${formatCurrency(b.rest)})` : ''} · ${b.title}`,
            }))}
        />
      </Modal>
    </Card>
  );
}
