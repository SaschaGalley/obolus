import { useSearchParams } from 'react-router-dom';
import {
  Typography, Button, Space, Spin, Alert, Empty, Table, Tag, Collapse, Popconfirm, Card, message,
} from 'antd';
import { LeftOutlined, RightOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useReconcileYear, useReconcileMonth, useSyncBookamatYear, useRefreshReconcile,
  useResetDecision, useIgnoreMovement,
} from '../../hooks/useApi';
import { formatCurrency, formatDate } from '../../utils/format';
import { apiErrorText } from '../../utils/errors';
import BookingCard from '../../components/reconcile/BookingCard';
import AccountTag from '../../components/reconcile/AccountTag';
import type { MonthCounts, MonthEntry, MonthView } from '../../components/reconcile/types';

const { Title, Text } = Typography;

const VIA: Record<string, { label: string; color: string }> = {
  auto: { label: 'automatisch', color: 'default' },
  manual: { label: 'verknüpft', color: 'blue' },
  transferred: { label: 'übertragen', color: 'green' },
  sum: { label: 'Summe', color: 'cyan' },
};

/**
 * Monatsabgleich: which movements on the business account Bookamat still
 * lacks, each with the booking form filled in, and what is already booked.
 */
export default function ReconcilePage() {
  const [params, setParams] = useSearchParams();
  const now = dayjs();
  const year = Number(params.get('y')) || now.year();
  const yearQ = useReconcileYear(year);
  const months: MonthCounts[] = yearQ.data?.months ?? [];

  // Without a month in the URL: the first one with open movements, else the latest.
  const fallbackMonth = months.find((m) => m.open > 0)?.month ?? months[months.length - 1]?.month ?? (year === now.year() ? now.month() + 1 : 12);
  const month = Number(params.get('m')) || fallbackMonth;
  const monthQ = useReconcileMonth(year, month, !!params.get('m') || yearQ.isSuccess);
  const view = monthQ.data as MonthView | undefined;

  const syncYear = useSyncBookamatYear();
  const refresh = useRefreshReconcile();
  const reset = useResetDecision();
  const ignore = useIgnoreMovement();

  const go = (y: number, m?: number) => setParams(m ? { y: String(y), m: String(m) } : { y: String(y) });

  const reload = async () => {
    try {
      await syncYear.mutateAsync(year);
      await refresh.mutateAsync(undefined);
      message.success(`Bookamat ${year} synchronisiert, Kontobewegungen neu geladen`);
    } catch (e) {
      message.error(apiErrorText(e));
    }
  };

  const entries = view?.entries ?? [];
  const open = entries.filter((e) => e.status === 'open');
  const done = entries.filter((e) => e.status === 'done');
  const ignored = entries.filter((e) => e.status === 'ignored');
  const monthName = dayjs().month(month - 1).format('MMMM');

  const txColumns = [
    { title: 'Datum', dataIndex: ['tx', 'day'], width: 110, render: (d: string) => formatDate(d) },
    {
      title: 'Betrag', dataIndex: ['tx', 'amount'], width: 130, align: 'right' as const,
      render: (a: number) => <span style={{ color: a > 0 ? '#16a34a' : undefined }}>{formatCurrency(a)}</span>,
    },
    {
      title: 'Kontobewegung', dataIndex: ['tx', 'description'], ellipsis: true,
      render: (d: string, e: MonthEntry) => <>{!e.tx.businessAccount && <AccountTag account={e.tx.account} />}{d}</>,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Abgleich</Title>
          <Text type="secondary">Geschäftskonto (Umsatz, dazu dort markierte Kartenzahlungen) ↔ Bookamat: was fehlt noch, und wie wird es gebucht?</Text>
        </div>
        <Space>
          <Button icon={<LeftOutlined />} onClick={() => go(year - 1)} />
          <Text strong style={{ fontSize: 18, minWidth: 48, textAlign: 'center', display: 'inline-block' }}>{year}</Text>
          <Button icon={<RightOutlined />} disabled={year >= now.year()} onClick={() => go(year + 1)} />
          <Button icon={<ReloadOutlined />} loading={syncYear.isPending || refresh.isPending} onClick={reload}>
            Aktualisieren
          </Button>
        </Space>
      </div>

      {yearQ.isError && (
        <Alert type="error" showIcon style={{ margin: '16px 0' }} title="Abgleich nicht möglich" description={apiErrorText(yearQ.error)} />
      )}

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 0 16px' }}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
          const c = months.find((x) => x.month === m);
          const selected = m === month;
          return (
            <Button
              key={m}
              type={selected ? 'primary' : 'default'}
              disabled={!c && !selected}
              onClick={() => go(year, m)}
              style={{ height: 'auto', padding: '4px 10px', minWidth: 64, flex: '0 0 auto' }}
            >
              <div style={{ lineHeight: 1.3 }}>
                <div>{dayjs().month(m - 1).format('MMM')}</div>
                <div style={{ fontSize: 12, color: selected ? undefined : c?.open ? '#d97706' : '#16a34a' }}>
                  {!c ? ' ' : c.open ? `${c.open} offen` : c.done ? '✓' : '–'}
                </div>
              </div>
            </Button>
          );
        })}
      </div>

      {monthQ.isError && (
        <Alert type="error" showIcon style={{ marginBottom: 16 }} title={`${monthName} konnte nicht geladen werden`} description={apiErrorText(monthQ.error)} />
      )}
      {monthQ.isLoading && <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>}

      {view && (
        <Spin spinning={monthQ.isFetching && !monthQ.isLoading}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            {monthName} {year}: <b>{view.counts.open} offen</b> · {view.counts.done} gebucht
            {view.counts.ignored > 0 && <> · {view.counts.ignored} ignoriert</>}
            {view.bankaccount
              ? <> · Zahlungskonto in Bookamat: „{view.bankaccount}“</>
              : <> · Zahlungskonto in Bookamat noch unbekannt (BOOKAMAT_BANKACCOUNT setzen oder erst synchronisieren)</>}
            {!view.accounts.cost.length && <> · Bookamat-Konten für {year} fehlen: „Aktualisieren“ klicken</>}
          </Text>

          {open.length === 0 ? (
            <Card style={{ marginBottom: 16 }}>
              <Empty
                image={<CheckCircleOutlined style={{ fontSize: 48, color: '#16a34a' }} />}
                description={entries.length ? `Alles gebucht im ${monthName}.` : `Keine Kontobewegungen im ${monthName}.`}
              />
            </Card>
          ) : (
            open.map((e) => <BookingCard key={e.tx.id} entry={e} accounts={view.accounts} year={year} month={month} />)
          )}

          {view.bookamatOnly.length > 0 && (
            <Card size="small" style={{ marginBottom: 16 }} title={`Nur in Bookamat (${view.bookamatOnly.length})`}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                Gebucht über „{view.bankaccount}“, aber ohne passende Kontobewegung (Betrag oder Datum weichen ab?).
              </Text>
              <Table
                size="small"
                pagination={false}
                rowKey="bookamatId"
                dataSource={view.bookamatOnly}
                columns={[
                  { title: 'Datum', dataIndex: 'date', width: 110, render: (d: string) => formatDate(d) },
                  { title: 'Betrag', dataIndex: 'signed', width: 130, align: 'right' as const, render: (a: number) => formatCurrency(a) },
                  { title: 'Titel', dataIndex: 'title', ellipsis: true },
                  { title: 'Steuerkonto', dataIndex: 'costaccount', ellipsis: true },
                ]}
              />
            </Card>
          )}

          <Collapse
            items={[
              {
                key: 'done',
                label: `Gebucht (${done.length})`,
                children: (
                  <Table<MonthEntry>
                    size="small"
                    pagination={false}
                    rowKey={(e) => e.tx.id}
                    dataSource={done}
                    columns={[
                      ...txColumns,
                      {
                        title: 'Bookamat',
                        render: (_: unknown, e: MonthEntry) => e.match?.booking
                          ? <span>{e.match.booking.title} <Text type="secondary">{e.match.booking.documentNumber ? `#${e.match.booking.documentNumber}` : ''}</Text></span>
                          : <Text type="secondary">Buchung {e.match?.bookamatId}: offen in Bookamat oder noch nicht synchronisiert</Text>,
                        ellipsis: true,
                      },
                      {
                        title: '', width: 180,
                        render: (_: unknown, e: MonthEntry) => (
                          <Space size={4}>
                            <Tag color={VIA[e.match!.via].color}>
                              {e.match!.via === 'sum' ? `Summe aus ${e.match!.parts}` : VIA[e.match!.via].label}
                            </Tag>
                            {e.match!.via === 'manual' && (
                              <Popconfirm title="Verknüpfung lösen?" onConfirm={() => reset.mutate(e.tx.id)}>
                                <Button type="link" size="small">lösen</Button>
                              </Popconfirm>
                            )}
                          </Space>
                        ),
                      },
                    ]}
                  />
                ),
              },
              ...(ignored.length ? [{
                key: 'ignored',
                label: `Ignoriert (${ignored.length})`,
                children: (
                  <Table<MonthEntry>
                    size="small"
                    pagination={false}
                    rowKey={(e) => e.tx.id}
                    dataSource={ignored}
                    columns={[
                      ...txColumns,
                      {
                        title: '', width: 120,
                        render: (_: unknown, e: MonthEntry) => (
                          <Button type="link" size="small" onClick={() => ignore.mutate({ umsatzId: e.tx.id, ignored: false })}>wieder öffnen</Button>
                        ),
                      },
                    ]}
                  />
                ),
              }] : []),
            ]}
          />
        </Spin>
      )}
    </div>
  );
}
