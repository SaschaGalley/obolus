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
  use: 'Aktiv',
  order: 'Reihenfolge',
  projectId: 'Projekt',
  duration: 'Dauer',
  startedAt: 'Beginn',
  started_at: 'Beginn',
};

const labelField = (k: string) => FIELD_LABELS[k] || k;

export interface ActivityTableProps {
  activities: any[];
  loading?: boolean;
  clientName?: string;
  pageSize?: number;
  size?: 'small' | 'middle' | 'large';
  showFooterLink?: React.ReactNode;
}

export default function ActivityTable({
  activities,
  loading,
  clientName,
  pageSize,
  size = 'small',
}: ActivityTableProps) {
  const navigate = useNavigate();

  const onRowClick = (a: any) => {
    if (a.logableType === 'Project') navigate(`/projects/${a.logableId}`);
    else if (a.logableType === 'Invoice') navigate(`/invoices/${a.logableId}`);
  };

  const columns = [
    {
      title: 'Datum', dataIndex: 'createdAt', key: 'createdAt', width: 150,
      render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Typ', key: 'logableType', width: 100,
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
      render: (v: string) => (
        <Tag color={ACTIVITY_COLORS[v] || 'default'}>
          {ACTIVITY_LABELS[v] || v}
        </Tag>
      ),
    },
    {
      title: 'Felder', dataIndex: 'values', key: 'values',
      render: (v: any) => {
        if (!v || typeof v !== 'object') return null;
        const keys = Object.keys(v);
        if (keys.length === 0) return null;
        return (
          <span style={{ fontSize: 12, color: '#888' }}>
            {keys.map(labelField).join(', ')}
          </span>
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
      dataSource={activities}
      columns={columns}
      rowKey="id"
      loading={loading}
      size={size}
      pagination={pageSize ? { pageSize, hideOnSinglePage: true } : false}
      onRow={(record: any) => ({
        onClick: () => onRowClick(record),
        style: {
          cursor: ['Project', 'Invoice'].includes(record.logableType) ? 'pointer' : 'default',
        },
      })}
    />
  );
}
