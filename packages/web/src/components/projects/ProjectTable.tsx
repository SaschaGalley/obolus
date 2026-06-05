import { useNavigate } from 'react-router-dom';
import { Table, Space } from 'antd';
import { formatCurrency } from '../../utils/format';
import EntityAvatar from '../EntityAvatar';
import ProjectStatusTag from './ProjectStatusTag';

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
    client: {
      title: 'Kunde',
      dataIndex: 'clientName',
      key: 'clientName',
      sorter: (a: any, b: any) => (a.clientName || '').localeCompare(b.clientName || ''),
      render: (clientName: string, record: any) => (
        <Space>
          <EntityAvatar
            name={clientName}
            picture={record.picture}
            fallbackPicture={record.client?.picture}
            size={28}
          />
          {clientName}
        </Space>
      ),
    },
    name: {
      title: 'Projekt',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => (a.name || '').localeCompare(b.name || ''),
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
      width: 120,
      render: (_: any, r: any) => <ProjectStatusTag status={r.status} />,
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
