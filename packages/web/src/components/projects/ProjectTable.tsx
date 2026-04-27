import { useNavigate } from 'react-router-dom';
import { Table, Tag, Space } from 'antd';
import { formatCurrency } from '../../utils/format';
import EntityAvatar from '../EntityAvatar';

export type ProjectColumn =
  | 'name' | 'client' | 'total' | 'unbilled' | 'billed' | 'status';

const ALL_COLUMNS: ProjectColumn[] = ['name', 'client', 'total', 'unbilled', 'billed', 'status'];

export interface ProjectTableProps {
  projects: any[];
  loading?: boolean;
  columns?: ProjectColumn[];
  hideClient?: boolean;
  pagination?: any;
  size?: 'small' | 'middle' | 'large';
  rowKey?: string;
}

export default function ProjectTable({
  projects,
  loading,
  columns,
  hideClient,
  pagination = false,
  size = 'small',
  rowKey = 'id',
}: ProjectTableProps) {
  const navigate = useNavigate();

  const enabled = (columns ?? ALL_COLUMNS).filter((c) => !(hideClient && c === 'client'));

  const colDefs: Record<ProjectColumn, any> = {
    name: {
      title: 'Projekt',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => (a.name || '').localeCompare(b.name || ''),
      render: (name: string, record: any) => (
        <Space>
          <EntityAvatar
            name={name}
            picture={record.picture}
            fallbackPicture={record.client?.picture}
            size={28}
          />
          {name}
        </Space>
      ),
    },
    client: {
      title: 'Kunde',
      dataIndex: 'clientName',
      key: 'clientName',
      sorter: (a: any, b: any) => (a.clientName || '').localeCompare(b.clientName || ''),
    },
    total: {
      title: 'Gesamt',
      dataIndex: 'total',
      key: 'total',
      align: 'right' as const,
      render: (v: number) => formatCurrency(v),
    },
    unbilled: {
      title: 'Nicht verrechnet',
      dataIndex: 'unbilled',
      key: 'unbilled',
      align: 'right' as const,
      render: (v: number) => formatCurrency(v),
    },
    billed: {
      title: 'Verrechnet',
      dataIndex: 'billed',
      key: 'billed',
      align: 'right' as const,
      render: (v: number) => formatCurrency(v),
    },
    status: {
      title: 'Status',
      key: 'status',
      width: 110,
      render: (_: any, r: any) =>
        r.archived
          ? <Tag color="default">Archiviert</Tag>
          : <Tag color="green">Aktiv</Tag>,
    },
  };

  const tableColumns = enabled.map((c) => colDefs[c]);

  return (
    <Table
      dataSource={projects}
      columns={tableColumns}
      rowKey={rowKey}
      loading={loading}
      pagination={pagination}
      size={size}
      onRow={(record: any) => ({
        onClick: () => navigate(`/projects/${record.id}`),
        style: { cursor: 'pointer' },
      })}
    />
  );
}
