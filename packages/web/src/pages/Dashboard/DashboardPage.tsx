import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Dropdown, Empty, Row, Space, Spin, Statistic, Table, Tag, Typography } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useDashboard } from '../../hooks/useApi';
import { formatCurrency, formatDate } from '../../utils/format';
import EntityAvatar from '../../components/EntityAvatar';

const { Title } = Typography;

const FIRST_YEAR = 2016;
const currentYear = new Date().getFullYear();
const yearMenuItems = Array.from({ length: currentYear - FIRST_YEAR + 1 }, (_, i) => {
  const y = String(currentYear - i);
  return { key: y, label: y };
});

export default function DashboardPage() {
  const [year, setYear] = useState(currentYear);
  const dashboard = useDashboard(year);
  const navigate = useNavigate();

  if (dashboard.isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }}/>;
  }

  const stats = dashboard.data;
  // Unbilled work can only be invoiced from now on, so it only counts for the current year.
  const showUnbilled = year === currentYear;

  const clientColumns = [
    {
      title: 'Kunde', dataIndex: 'clientName', key: 'clientName',
      render: (name: string, r: any) => (
        <Space><EntityAvatar name={name} picture={r.clientPicture} size={24} />{name}</Space>
      ),
    },
    ...(showUnbilled
      ? [{ title: 'Nicht verrechnet', dataIndex: 'unbilled', key: 'unbilled', align: 'right' as const, render: (v: number) => formatCurrency(v) }]
      : []),
    { title: 'Verrechnet', dataIndex: 'billed', key: 'billed', align: 'right' as const, render: (v: number) => formatCurrency(v) },
    { title: 'Bezahlt', dataIndex: 'paid', key: 'paid', align: 'right' as const, render: (v: number) => formatCurrency(v) },
    { title: 'Offen', dataIndex: 'outstanding', key: 'outstanding', align: 'right' as const, render: (v: number) => formatCurrency(v) },
    { title: 'Gesamt', dataIndex: 'total', key: 'total', align: 'right' as const, render: (v: number) => formatCurrency(v) },
  ];

  const clients = stats?.clients || [];
  const unpaidInvoices = stats?.unpaidInvoices || [];
  const openProjects = stats?.openProjects || [];

  const totals = clients.reduce(
    (acc: any, c: any) => ({
      total: acc.total + (c.total || 0),
      unbilled: acc.unbilled + (c.unbilled || 0),
      billed: acc.billed + (c.billed || 0),
      paid: acc.paid + (c.paid || 0),
      outstanding: acc.outstanding + (c.outstanding || 0),
    }),
    { total: 0, unbilled: 0, billed: 0, paid: 0, outstanding: 0 },
  );

  const unpaidColumns = [
    {
      title: 'Kunde', dataIndex: 'clientName', key: 'clientName',
      render: (name: string, r: any) => (
        <Space><EntityAvatar name={name} picture={r.clientPicture} size={24} />{name}</Space>
      ),
    },
    { title: 'Nummer', dataIndex: 'number', key: 'number' },
    { title: 'Datum', dataIndex: 'sentAt', key: 'sentAt', render: (v: string) => formatDate(v) },
    {
      title: 'Fällig',
      key: 'dueDate',
      render: (_: any, r: any) =>
        r.overdue
          ? <Tag color="red">{formatDate(r.dueDate)}</Tag>
          : formatDate(r.dueDate),
    },
    { title: 'Betrag', dataIndex: 'amount', key: 'amount', align: 'right' as const, render: (v: number) => formatCurrency(v) },
  ];

  const openProjectColumns = [
    {
      title: 'Kunde', dataIndex: 'clientName', key: 'clientName',
      render: (name: string, r: any) => (
        <Space><EntityAvatar name={name} picture={r.clientPicture} size={24} />{name}</Space>
      ),
    },
    {
      title: 'Projekt', dataIndex: 'name', key: 'name',
    },
    { title: 'Nicht verrechnet', dataIndex: 'unbilled', key: 'unbilled', align: 'right' as const, render: (v: number) => formatCurrency(v) },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Dashboard</Title>
        <Space.Compact>
          <Button
            icon={<LeftOutlined />}
            aria-label="Vorheriges Jahr"
            disabled={year <= FIRST_YEAR}
            onClick={() => setYear(year - 1)}
          />
          <Dropdown
            trigger={['click']}
            menu={{
              items: yearMenuItems,
              selectable: true,
              selectedKeys: [String(year)],
              onClick: ({ key }) => setYear(Number(key)),
              style: { maxHeight: 320, overflowY: 'auto' },
            }}
          >
            <Button style={{ width: 72, fontWeight: 600 }} aria-label="Jahr auswählen">
              {year}
            </Button>
          </Dropdown>
          <Button
            icon={<RightOutlined />}
            aria-label="Nächstes Jahr"
            disabled={year >= currentYear}
            onClick={() => setYear(year + 1)}
          />
        </Space.Compact>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Unbezahlte Rechnungen"
              value={stats?.unpaidInvoicesTotal || 0}
              formatter={(v) => formatCurrency(v as number)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Offene Projekte"
              value={stats?.openProjectsCount || 0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={`Einnahmen ${year}`}
              value={stats?.revenue || 0}
              formatter={(v) => formatCurrency(v as number)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={`Netto ${year}`}
              value={stats?.net || 0}
              formatter={(v) => formatCurrency(v as number)}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} xxl={12}>
          <Card title="Unbezahlte Rechnungen" size="small">
            {unpaidInvoices.length === 0 ? (
              <Empty description="Keine offenen Rechnungen"/>
            ) : (
              <Table
                dataSource={unpaidInvoices}
                columns={unpaidColumns}
                rowKey="id"
                pagination={false}
                size="small"
                onRow={(record: any) => ({
                  onClick: () => navigate(`/invoices/${record.id}`),
                  style: { cursor: 'pointer' },
                })}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} xxl={12}>
          <Card title="Unverrechnete Projekte" size="small">
            {openProjects.length === 0 ? (
              <Empty description="Keine offenen Projekte"/>
            ) : (
              <Table
                dataSource={openProjects}
                columns={openProjectColumns}
                rowKey="id"
                pagination={false}
                size="small"
                onRow={(record: any) => ({
                  onClick: () => navigate(`/projects/${record.id}`),
                  style: { cursor: 'pointer' },
                })}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title={`Kunden-Übersicht ${year}`}>
            {clients.length === 0 ? (
              <Empty description="Keine Daten vorhanden"/>
            ) : (
              <Table
                dataSource={clients}
                columns={clientColumns}
                rowKey="clientId"
                pagination={false}
                size="small"
                onRow={(record: any) => ({
                  onClick: () => navigate(`/clients/${record.clientId}`),
                  style: { cursor: 'pointer' },
                })}
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}><strong>Gesamt</strong></Table.Summary.Cell>
                      {[
                        ...(showUnbilled ? [totals.unbilled] : []),
                        totals.billed,
                        totals.paid,
                        totals.outstanding,
                        totals.total,
                      ].map((v, i) => (
                        <Table.Summary.Cell key={i} index={i + 1} align="right"><strong>{formatCurrency(v)}</strong></Table.Summary.Cell>
                      ))}
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
