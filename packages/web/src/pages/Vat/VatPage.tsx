import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Typography, Button, Space, Spin, Alert, Table, Tag, Collapse, Card, Empty, Grid, message,
} from 'antd';
import { LeftOutlined, RightOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useVatReport, useSyncBookamatYear } from '../../hooks/useApi';
import { vatApi } from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/format';
import { apiErrorText } from '../../utils/errors';
import { downloadBlob } from '../../utils/download';
import type { DateBasis, UvaRow, VatLine, VatPeriodReport, VatReport, ZmRow } from './types';

const { Title, Text } = Typography;

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const BASIS: Record<DateBasis, string> = { payment: 'Zahlung', invoice: 'Rechnung', delivery: 'Leistung' };
const ZM_TYPE = { L: 'Lieferung', S: 'sonstige Leistung' };

/** Short label of a period button: "Q3", "Jul", "Jahr". */
const shortLabel = (p: VatPeriodReport) =>
  p.key === 'year' ? 'Jahr' : p.key.startsWith('M') ? dayjs().month(Number(p.key.slice(1)) - 1).format('MMM') : p.key;

/** The latest period that has ended; the whole year for past years. */
function defaultPeriod(report: VatReport | undefined): string {
  if (!report) return '';
  const today = dayjs().format('YYYY-MM-DD');
  if (report.total.to < today) return 'year';
  const ended = report.periods.filter((p) => p.to < today);
  return ended[ended.length - 1]?.key ?? report.periods[0]?.key ?? 'year';
}

/**
 * Umsatzsteuervoranmeldung und Zusammenfassende Meldung, computed from the
 * stored bookings with Bookamat's Kennzahlen; one Excel per period for the
 * Steuerberater.
 */
export default function VatPage() {
  const [params, setParams] = useSearchParams();
  const now = dayjs();
  const year = Number(params.get('y')) || now.year();
  const q = useVatReport(year);
  const report = q.data as VatReport | undefined;
  const periodKey = params.get('p') || defaultPeriod(report);
  const sync = useSyncBookamatYear();
  const [downloading, setDownloading] = useState(false);

  const go = (y: number, p?: string) => setParams(p ? { y: String(y), p } : { y: String(y) });
  const all = report ? [...report.periods, report.total] : [];
  const period = all.find((p) => p.key === periodKey);
  const lines = period ? period.lineIdx.map((i) => report!.lines[i]) : [];
  // The year's list goes by payment date, like the Einnahmen-Ausgaben-Rechnung.
  const listed = period?.key === 'year' ? report!.bookedIdx.map((i) => report!.lines[i]) : lines;

  const reload = async () => {
    try {
      await sync.mutateAsync(year);
      message.success(`Bookamat ${year} synchronisiert`);
    } catch (e) {
      message.error(apiErrorText(e));
    }
  };

  const download = async () => {
    if (!period) return;
    setDownloading(true);
    try {
      const res = await vatApi.export(year, period.key);
      downloadBlob(res.data, period.key === 'year' ? `UVA-ZM-${year}.xlsx` : `UVA-ZM-${year}-${period.key}.xlsx`, XLSX);
    } catch (e) {
      message.error(apiErrorText(e));
    } finally {
      setDownloading(false);
    }
  };

  const settings = report?.settings;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Umsatzsteuer</Title>
          <Text type="secondary">
            UVA und Zusammenfassende Meldung aus den Buchungen
            {settings && (
              <> · {settings.vatMethod === 'cash' ? 'Ist' : 'Soll'}-Besteuerung, UVA {settings.vatPeriod === 'month' ? 'monatlich' : 'vierteljährlich'}
                {settings.source === 'default' ? ' (Standard)' : settings.source === 'earlier' ? ' (wie Vorjahr)' : ''}</>
            )}
          </Text>
        </div>
        <Space>
          <Button icon={<LeftOutlined />} onClick={() => go(year - 1)} />
          <Text strong style={{ fontSize: 18, minWidth: 48, textAlign: 'center', display: 'inline-block' }}>{year}</Text>
          <Button icon={<RightOutlined />} disabled={year >= now.year()} onClick={() => go(year + 1)} />
          <Button icon={<ReloadOutlined />} loading={sync.isPending} onClick={reload}>Aktualisieren</Button>
        </Space>
      </div>

      {q.isError && <Alert type="error" showIcon style={{ margin: '16px 0' }} title="UVA nicht möglich" description={apiErrorText(q.error)} />}
      {q.isLoading && <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>}
      {report?.warnings.map((w) => <Alert key={w} type="warning" showIcon style={{ marginTop: 12 }} title={w} />)}

      {report && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 0 16px' }}>
          {all.map((p) => {
            const selected = p.key === periodKey;
            const z = p.zahllastMitPauschale;
            return (
              <Button
                key={p.key}
                type={selected ? 'primary' : 'default'}
                onClick={() => go(year, p.key)}
                style={{ height: 'auto', padding: '4px 10px', minWidth: 72, flex: '0 0 auto' }}
              >
                <div style={{ lineHeight: 1.3 }}>
                  <div>{shortLabel(p)}</div>
                  <div style={{ fontSize: 12, color: selected ? undefined : p.uva.checks.length ? '#d97706' : undefined }}>
                    {p.lineIdx.length ? formatCurrency(z) : '–'}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      )}

      {report && period && (
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <Card
            title={<CardTitle title={`UVA ${period.label}`} due={period.dueUva} />}
            extra={<Button icon={<DownloadOutlined />} loading={downloading} onClick={download}>Excel</Button>}
          >
            {period.uva.checks.map((c) => (
              <Alert key={c} type="warning" showIcon style={{ marginBottom: 12 }} title="Prüfung wie FinanzOnline" description={c} />
            ))}
            <UvaTable rows={period.uva.rows} lines={lines} />
            <Totals period={period} rate={report.pauschaleRate} />
          </Card>

          <Card title={<CardTitle title={`Zusammenfassende Meldung ${period.label}`} due={period.dueZm} />}>
            {period.zm.length ? <ZmTable rows={period.zm} lines={lines} showPeriod={period.key === 'year' || report.settings.zmPeriod !== report.settings.vatPeriod} />
              : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Keine meldepflichtigen Umsätze" />}
          </Card>

          <Collapse
            items={[{
              key: 'lines',
              label: period.key === 'year'
                ? `Alle Buchungszeilen mit Buchungsdatum ${year} (${listed.length})`
                : `Alle Buchungszeilen ${period.label} (${listed.length})`,
              children: <LineTable lines={listed} />,
            }]}
          />
        </Space>
      )}
    </div>
  );
}

function CardTitle({ title, due }: { title: string; due: string | null }) {
  return (
    <div style={{ whiteSpace: 'normal', padding: '8px 0' }}>
      {title}
      {due && <Text type="secondary" style={{ display: 'block', fontSize: 12, fontWeight: 400 }}>fällig {formatDate(due)}</Text>}
    </div>
  );
}

function UvaTable({ rows, lines }: { rows: UvaRow[]; lines: VatLine[] }) {
  const narrow = !Grid.useBreakpoint().md;
  // On a phone Kennzahl and label share a cell, the tax goes under the amount.
  const columns = narrow
    ? [
      {
        title: 'Kennzahl', dataIndex: 'kz',
        render: (kz: string, r: UvaRow) => <><Text strong>{kz}</Text><Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{r.label}</Text></>,
      },
      {
        title: 'Betrag', dataIndex: 'amount', width: 120, align: 'right' as const,
        render: (v: number, r: UvaRow) => (
          <>{formatCurrency(v)}{r.tax != null && <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>USt {formatCurrency(r.tax)}</Text>}</>
        ),
      },
    ]
    : [
      { title: 'KZ', dataIndex: 'kz', width: 60 },
      { title: 'Bezeichnung', dataIndex: 'label' },
      { title: 'Betrag', dataIndex: 'amount', width: 130, align: 'right' as const, render: (v: number) => formatCurrency(v) },
      { title: 'Steuer', dataIndex: 'tax', width: 120, align: 'right' as const, render: (v: number | null) => (v == null ? '' : formatCurrency(v)) },
    ];
  return (
    <Table
      size="small"
      rowKey="kz"
      pagination={false}
      dataSource={rows}
      expandable={{
        rowExpandable: (r) => r.lines > 0,
        expandedRowRender: (r) => (
          <LineTable compact lines={lines.filter((l) => r.kz in l.kz)} value={(l) => l.kz[r.kz]} />
        ),
      }}
      columns={columns}
    />
  );
}

function Totals({ period, rate }: { period: VatPeriodReport; rate: number }) {
  const row = (label: string, value: number, strong = false, hint?: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 8px' }}>
      <span>
        {strong ? <Text strong>{label}</Text> : label}
        {hint && <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{hint}</Text>}
      </span>
      {strong ? <Text strong>{formatCurrency(value)}</Text> : <span>{formatCurrency(value)}</span>}
    </div>
  );
  return (
    <div style={{ marginTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 8 }}>
      {row('Umsatzsteuer', period.uva.ust)}
      {row('Vorsteuer', -period.uva.vorsteuer)}
      {row('Zahllast laut Buchungen', period.uva.zahllast, true, 'positiv = zahlen, negativ = Gutschrift')}
      {row(`Vorsteuerpauschale ${rate.toLocaleString('de-AT')} % von KZ 000`, -period.pauschale, false,
        'Nur bei Vorsteuerpauschalierung; in den Kennzahlen oben nicht enthalten.')}
      {row('Zahllast mit Vorsteuerpauschale', period.zahllastMitPauschale, true)}
    </div>
  );
}

function ZmTable({ rows, lines, showPeriod }: { rows: ZmRow[]; lines: VatLine[]; showPeriod: boolean }) {
  return (
    <Table
      size="small"
      rowKey={(r) => `${r.period}|${r.vatin}|${r.type}`}
      pagination={false}
      dataSource={rows}
      expandable={{
        expandedRowRender: (r) => (
          <LineTable
            compact
            lines={lines.filter((l) => l.zm && l.zm.vatin === r.vatin && l.zm.type === r.type && inPeriodKey(r.period, l.periodDate))}
          />
        ),
      }}
      columns={[
        ...(showPeriod ? [{ title: 'Zeitraum', dataIndex: 'period', width: 90 }] : []),
        {
          title: 'UID', dataIndex: 'vatin',
          render: (v: string | null, r: ZmRow) => (
            <>{v ?? <Tag color="red">UID fehlt</Tag>}<Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{ZM_TYPE[r.type]}</Text></>
          ),
        },
        { title: 'Betrag', dataIndex: 'amount', width: 130, align: 'right' as const, render: (v: number) => formatCurrency(v) },
      ]}
    />
  );
}

/** Does a date fall into a ZM period key ("Q3", "M07")? */
function inPeriodKey(key: string, date: string): boolean {
  const m = Number(date.slice(5, 7));
  const n = Number(key.slice(1));
  return key.startsWith('Q') ? Math.ceil(m / 3) === n : m === n;
}

/**
 * Booking lines; `value` replaces the net column (e.g. with what a line adds to
 * one Kennzahl). `compact` drops the account columns for an expanded row and
 * keeps the table inside it.
 */
function LineTable({ lines, value, compact }: { lines: VatLine[]; value?: (l: VatLine) => number; compact?: boolean }) {
  const table = (
    <Table
      size="small"
      rowKey={(l) => `${l.bookingId}-${l.line}`}
      pagination={lines.length > 50 ? { pageSize: 50 } : false}
      dataSource={lines}
      scroll={{ x: compact ? 480 : 760 }}
      columns={[
        { title: 'Datum', dataIndex: 'date', width: 100, render: (d: string) => formatDate(d) },
        {
          title: 'Zeitraum nach', dataIndex: 'periodDate', width: 150,
          render: (d: string, l: VatLine) => <>{formatDate(d)} <Tag style={{ marginInlineEnd: 0 }}>{BASIS[l.basis]}</Tag></>,
        },
        { title: 'Titel', dataIndex: 'title', ellipsis: true },
        ...(compact ? [] : [
          { title: 'USt-Konto', dataIndex: 'purchasetaxaccount', width: 170, ellipsis: true },
          { title: 'KZ', dataIndex: 'kz', width: 110, render: (kz: Record<string, number>) => Object.keys(kz).join(', ') },
        ]),
        {
          title: 'Betrag', key: 'value', width: 120, align: 'right' as const,
          render: (_: unknown, l: VatLine) => formatCurrency(value ? value(l) : l.net),
        },
      ]}
    />
  );
  // width 0 + min-width 100 %: the nested table scrolls instead of widening the row it sits in.
  return compact ? <div style={{ width: 0, minWidth: '100%' }}>{table}</div> : table;
}
