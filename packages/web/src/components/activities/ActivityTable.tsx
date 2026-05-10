import { useNavigate } from 'react-router-dom';
import { Table, Tag } from 'antd';
import dayjs from 'dayjs';

const ACTIVITY_LABELS: Record<string, string> = {
  created: 'Erstellt',
  updated: 'Bearbeitet',
  deleted: 'Gelöscht',
};

const ACTIVITY_COLORS: Record<string, string> = {
  created: 'green',
  updated: 'blue',
  deleted: 'red',
};

const TYPE_LABELS: Record<string, string> = {
  Client: 'Kunde',
  Project: 'Projekt',
  Invoice: 'Rechnung',
  Task: 'Task',
  Session: 'Session',
};

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  note: 'Notiz',
  address: 'Adresse',
  vatNumber: 'UID',
  hourlyRate: 'Stundensatz',
  reverseCharge: 'Reverse Charge',
  archived: 'Archiviert',
  imageId: 'Bild',
  number: 'Nummer',
  sentAt: 'Rechnungsdatum',
  payedAt: 'Bezahlt am',
  dueDays: 'Zahlungsziel',
  showHours: 'Stunden anzeigen',
  showDate: 'Datum anzeigen',
  clientName: 'Kunde (Name)',
  clientAddress: 'Kunde (Adresse)',
  clientVatNumber: 'Kunde (UID)',
  fixedCost: 'Fixkosten',
  fixedDuration: 'Fixe Stunden',
  fixed_cost: 'Fixkosten',
  fixed_duration: 'Fixe Stunden',
  fixed_date: 'Fixes Datum',
  fixedDate: 'Fixes Datum',
  isActive: 'Aktiv',
  order: 'Reihenfolge',
  projectId: 'Projekt',
  duration: 'Dauer',
  startedAt: 'Beginn',
  started_at: 'Beginn',
};

const labelField = (k: string) => FIELD_LABELS[k] || k;

const BOOL_FIELDS = new Set(['reverseCharge', 'showHours', 'showDate', 'isActive', 'archived']);

function formatValue(v: any, field?: string): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Ja' : 'Nein';
  if (field && BOOL_FIELDS.has(field) && (v === 0 || v === 1)) return v === 1 ? 'Ja' : 'Nein';
  const s = String(v);
  return s.length > 60 ? s.slice(0, 57) + '…' : s;
}

export interface ActivityTableProps {
  activities: any[];
  loading?: boolean;
  clientName?: string;
  pageSize?: number;
  total?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  size?: 'small' | 'middle' | 'large';
  showFooterLink?: React.ReactNode;
  hideTasks?: boolean;
}

export default function ActivityTable({
  activities,
  loading,
  clientName,
  pageSize,
  total,
  page,
  onPageChange,
  size = 'small',
  hideTasks = true,
}: ActivityTableProps) {
  const filtered = hideTasks
    ? activities.filter((a) => a.logableType !== 'Task' && a.logableType !== 'Session')
    : activities;
  const navigate = useNavigate();

  const onRowClick = (a: any) => {
    if (a.logableType === 'Project') navigate(`/projects/${a.logableId}`);
    else if (a.logableType === 'Invoice') navigate(`/invoices/${a.logableId}`);
  };

  const columns = [
    {
      title: 'Datum', dataIndex: 'createdAt', key: 'createdAt', width: 150,
      render: (v: string) => v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—',
    },
    {
      title: 'Typ', key: 'logableType', width: 100,
      filters: Object.entries(TYPE_LABELS).map(([k, v]) => ({ text: v, value: k })),
      onFilter: (value: any, r: any) => r.logableType === value,
      render: (_: any, r: any) => TYPE_LABELS[r.logableType] || r.logableType,
    },
    {
      title: 'Bezug', key: 'subjectName',
      render: (_: any, r: any) => {
        if (r.logableType === 'Client' && clientName) return clientName;
        return r.subjectName || `#${r.logableId}`;
      },
    },
    {
      title: 'Aktion', dataIndex: 'activityType', key: 'activityType', width: 110,
      filters: Object.entries(ACTIVITY_LABELS).map(([k, v]) => ({ text: v, value: k })),
      onFilter: (value: any, r: any) => r.activityType === value,
      render: (v: string) => (
        <Tag color={ACTIVITY_COLORS[v] || 'default'}>
          {ACTIVITY_LABELS[v] || v}
        </Tag>
      ),
    },
    {
      title: 'Änderungen', dataIndex: 'values', key: 'values',
      render: (v: any) => {
        if (!v || typeof v !== 'object') return null;
        const keys = Object.keys(v);
        if (keys.length === 0) return null;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {keys.map((k) => {
              const entry = v[k];
              const label = labelField(k);
              if (entry && typeof entry === 'object' && 'from' in entry && 'to' in entry) {
                return (
                  <span key={k} style={{ fontSize: 12 }}>
                    <span style={{ color: '#888' }}>{label}: </span>
                    <span style={{ color: '#cf1322' }}>{formatValue(entry.from, k)}</span>
                    <span style={{ color: '#888' }}> → </span>
                    <span style={{ color: '#389e0d' }}>{formatValue(entry.to, k)}</span>
                  </span>
                );
              }
              return (
                <span key={k} style={{ fontSize: 12, color: '#888' }}>
                  {label}: {formatValue(entry, k)}
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      title: 'Benutzer', key: 'user', width: 130,
      render: (_: any, r: any) => r.user?.name || '-',
    },
  ];

  return (
    <Table
      dataSource={filtered}
      columns={columns}
      rowKey="id"
      loading={loading}
      size={size}
      pagination={
        total !== undefined && onPageChange
          ? { current: page, pageSize: pageSize || 50, total, onChange: onPageChange, showTotal: (t) => `${t} Einträge` }
          : pageSize ? { pageSize, hideOnSinglePage: true } : false
      }
      onRow={(record: any) => ({
        onClick: () => onRowClick(record),
        style: {
          cursor: ['Project', 'Invoice'].includes(record.logableType) ? 'pointer' : 'default',
        },
      })}
    />
  );
}
