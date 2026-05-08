import { useNavigate } from 'react-router-dom';
import { Table, Tag, Space } from 'antd';
import dayjs from 'dayjs';
import { formatCurrency, formatDate, getInvoiceStatus } from '../../utils/format';
import EntityAvatar from '../EntityAvatar';

export type InvoiceColumn =
  | 'number' | 'client' | 'sentAt' | 'dueDate' | 'status' | 'amount';

const ALL_COLUMNS: InvoiceColumn[] = ['number', 'client', 'sentAt', 'dueDate', 'status', 'amount'];

export interface InvoiceTableProps {
  invoices: any[];
  loading?: boolean;
  columns?: InvoiceColumn[];
  hideClient?: boolean;
  pagination?: any;
  size?: 'small' | 'middle' | 'large';
  rowKey?: string;
}

export default function InvoiceTable({
  invoices,
  loading,
  columns,
  hideClient,
  pagination = false,
  size = 'small',
  rowKey = 'id',
}: InvoiceTableProps) {
  const navigate = useNavigate();

  const enabled = (columns ?? ALL_COLUMNS).filter((c) => !(hideClient && c === 'client'));

  const colDefs: Record<InvoiceColumn, any> = {
    number: {
      title: 'Nummer', dataIndex: 'number', key: 'number',
    },
    client: {
      title: 'Kunde', dataIndex: 'clientName', key: 'clientName',
      render: (name: string, record: any) => (
        <Space>
          <EntityAvatar name={name || '?'} picture={record.client?.picture} size={28} />
          {name}
        </Space>
      ),
    },
    sentAt: {
      title: 'Datum', dataIndex: 'sentAt', key: 'sentAt', width: 120,
      render: (v: any) => formatDate(v),
    },
    dueDate: {
      title: 'Fällig am', key: 'dueDate', width: 120,
      render: (_: any, r: any) => {
        if (!r.sentAt) return '-';
        const due = dayjs(r.sentAt).add(r.dueDays || 14, 'day');
        const overdue = !r.payedAt && due.isBefore(dayjs());
        const formatted = formatDate(due.format('YYYY-MM-DD'));
        return overdue ? <Tag color="red">{formatted}</Tag> : formatted;
      },
    },
    status: {
      title: 'Status', key: 'status', width: 110,
      render: (_: any, r: any) => {
        const s = getInvoiceStatus(r);
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    amount: {
      title: 'Betrag', key: 'amount', align: 'right' as const, width: 130,
      render: (_: any, r: any) => formatCurrency(r.calculatedCost || 0),
    },
  };

  const tableColumns = enabled.map((c) => colDefs[c]);

  return (
    <Table
      dataSource={invoices}
      columns={tableColumns}
      rowKey={rowKey}
      loading={loading}
      pagination={pagination}
      size={size}
      onRow={(record: any) => ({
        onClick: () => navigate(`/invoices/${record.id}`),
        style: { cursor: 'pointer' },
      })}
    />
  );
}
