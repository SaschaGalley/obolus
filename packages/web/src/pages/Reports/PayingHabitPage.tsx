import { Link } from 'react-router-dom';
import { Typography, Table, Breadcrumb, Spin } from 'antd';
import { usePayingHabit } from '../../hooks/useApi';

const { Title } = Typography;

export default function PayingHabitPage() {
  const { data: habits = [], isLoading } = usePayingHabit();

  if (isLoading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 100 }} />;

  const columns = [
    {
      title: 'Kunde', dataIndex: 'clientName', key: 'clientName',
      sorter: (a: any, b: any) => a.clientName.localeCompare(b.clientName, 'de'),
      defaultSortOrder: 'ascend' as const,
    },
    {
      title: 'Pünktlich', dataIndex: 'inTime', key: 'inTime', width: 110, align: 'center' as const,
      sorter: (a: any, b: any) => a.inTime - b.inTime,
    },
    {
      title: 'Überfällig', dataIndex: 'overdue', key: 'overdue', width: 110, align: 'center' as const,
      sorter: (a: any, b: any) => a.overdue - b.overdue,
    },
    {
      title: 'Ø Tage', dataIndex: 'avg', key: 'avg', width: 100, align: 'center' as const,
      sorter: (a: any, b: any) => a.avg - b.avg,
      render: (v: number) => (
        <span style={{ color: v < 14 ? '#52c41a' : v < 30 ? '#faad14' : '#ff4d4f', fontWeight: 600 }}>
          {v}
        </span>
      ),
    },
    {
      title: 'Median Tage', dataIndex: 'median', key: 'median', width: 120, align: 'center' as const,
      sorter: (a: any, b: any) => a.median - b.median,
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ title: <Link to="/reports">Reports</Link> }, { title: 'Zahlungsverhalten' }]} />
      <Title level={3} style={{ marginTop: 16 }}>Zahlungsverhalten</Title>
      <Table dataSource={habits} columns={columns} rowKey="clientId" pagination={false} />
    </div>
  );
}
