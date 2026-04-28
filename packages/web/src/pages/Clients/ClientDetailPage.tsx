import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Typography, Breadcrumb, Descriptions, Button, Tabs, Card, Row, Col,
  Drawer, Form, Input, InputNumber, Switch, Space, Spin, Popconfirm,
  Empty, message,
} from 'antd';
import {
  EditOutlined, InboxOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import {
  useClient, useUpdateClient, useProjects, useInvoices, useClientActivities,
  useUploadClientPicture,
} from '../../hooks/useApi';
import EntityAvatar from '../../components/EntityAvatar';
import { formatCurrency } from '../../utils/format';
import ProjectTable from '../../components/projects/ProjectTable';
import InvoiceTable from '../../components/invoices/InvoiceTable';
import ActivityTable from '../../components/activities/ActivityTable';

const { Title } = Typography;

const PREVIEW_LIMIT = 5;

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const clientId = Number(id);
  const navigate = useNavigate();

  const client = useClient(clientId);
  const updateClient = useUpdateClient();
  const uploadPicture = useUploadClientPicture();
  const projects = useProjects({ clientId, show: 'all', limit: 200 });
  const invoices = useInvoices(1, 200);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const activities = useClientActivities(clientId, activitiesPage, 50);
  const clientOnlyActivities = useClientActivities(clientId, 1, 5, ['Client']);

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [projectFilter, setProjectFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();

  const allActivities = activities.data?.data || [];
  const activitiesTotal = activities.data?.total || 0;
  const clientActivities = clientOnlyActivities.data?.data || [];

  const allProjects = projects.data?.data || [];
  const activeProjects = useMemo(
    () => allProjects.filter((p: any) => !p.archived),
    [allProjects],
  );
  const archivedProjects = useMemo(
    () => allProjects.filter((p: any) => p.archived),
    [allProjects],
  );

  const filteredProjects =
    projectFilter === 'active' ? activeProjects
      : projectFilter === 'archived' ? archivedProjects
        : allProjects;

  const clientInvoices = useMemo(
    () => (invoices.data?.data || [])
      .filter((inv: any) => inv.clientId === clientId)
      .sort((a: any, b: any) => {
        const da = a.sentAt ? new Date(a.sentAt).getTime() : 0;
        const db = b.sentAt ? new Date(b.sentAt).getTime() : 0;
        return db - da;
      }),
    [invoices.data, clientId],
  );

  const handleEdit = () => {
    if (client.data) form.setFieldsValue(client.data);
    setDrawerOpen(true);
  };

  const handleUpdate = async (values: any) => {
    try {
      await updateClient.mutateAsync({ id: clientId, ...values });
      message.success('Kunde aktualisiert');
      setDrawerOpen(false);
    } catch { message.error('Fehler beim Aktualisieren'); }
  };

  const handleArchive = async () => {
    try {
      await updateClient.mutateAsync({ id: clientId, archived: true });
      message.success('Kunde archiviert');
      navigate('/clients');
    } catch { message.error('Fehler beim Archivieren'); }
  };

  if (client.isLoading) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 100 }} />;
  }

  const data = client.data;
  if (!data) return null;

  const goToTab = (tab: string) => () => setActiveTab(tab);

  const projectsCardExtra = (
    <Button type="link" size="small" onClick={goToTab('projects')}>
      Alle ({activeProjects.length}) <ArrowRightOutlined />
    </Button>
  );
  const invoicesCardExtra = (
    <Button type="link" size="small" onClick={goToTab('invoices')}>
      Alle ({clientInvoices.length}) <ArrowRightOutlined />
    </Button>
  );
  const activitiesCardExtra = clientActivities.length > 0 && (
    <Button type="link" size="small" onClick={goToTab('activities')}>
      Alle ({activitiesTotal}) <ArrowRightOutlined />
    </Button>
  );

  const overviewTab = (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={12}>
        <Card title="Aktive Projekte" extra={projectsCardExtra} size="small">
          {activeProjects.length === 0 ? (
            <Empty description="Keine aktiven Projekte" />
          ) : (
            <ProjectTable
              projects={activeProjects.slice(0, PREVIEW_LIMIT)}
              columns={['name', 'total', 'unbilled']}
              hideClient
            />
          )}
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card title="Letzte Rechnungen" extra={invoicesCardExtra} size="small">
          {clientInvoices.length === 0 ? (
            <Empty description="Noch keine Rechnungen" />
          ) : (
            <InvoiceTable
              invoices={clientInvoices.slice(0, PREVIEW_LIMIT)}
              columns={['number', 'sentAt', 'status', 'amount']}
            />
          )}
        </Card>
      </Col>
      <Col xs={24}>
        <Card
          title="Letzte Aktivitäten"
          extra={activitiesCardExtra}
          size="small"
        >
          {activities.isLoading ? (
            <Spin />
          ) : clientActivities.length === 0 ? (
            <Empty description="Keine Aktivitäten" />
          ) : (
            <ActivityTable
              activities={clientActivities.slice(0, PREVIEW_LIMIT)}
              clientName={data.name}
            />
          )}
        </Card>
      </Col>
    </Row>
  );

  const projectsTab = (
    <>
      <Tabs
        activeKey={projectFilter}
        onChange={(k) => setProjectFilter(k as any)}
        size="small"
        style={{ marginBottom: 12 }}
        items={[
          { key: 'active', label: `Aktiv (${activeProjects.length})` },
          { key: 'archived', label: `Archiviert (${archivedProjects.length})` },
          { key: 'all', label: `Alle (${allProjects.length})` },
        ]}
      />
      {filteredProjects.length === 0 ? (
        <Empty description="Keine Projekte" />
      ) : (
        <ProjectTable
          projects={filteredProjects}
          columns={projectFilter === 'archived' || projectFilter === 'all'
            ? ['name', 'total', 'unbilled', 'status']
            : ['name', 'total', 'unbilled']}
          hideClient
          loading={projects.isLoading}
        />
      )}
    </>
  );

  const invoicesTab = clientInvoices.length === 0 ? (
    <Empty description="Noch keine Rechnungen" />
  ) : (
    <InvoiceTable
      invoices={clientInvoices}
      columns={['number', 'sentAt', 'dueDate', 'status', 'amount']}
      loading={invoices.isLoading}
      pagination={{ pageSize: 25, hideOnSinglePage: true }}
    />
  );

  const activitiesTab = (
    <ActivityTable
      activities={allActivities}
      loading={activities.isLoading}
      clientName={data.name}
      pageSize={50}
      total={activitiesTotal}
      page={activitiesPage}
      onPageChange={setActivitiesPage}
    />
  );

  const tabItems = [
    { key: 'overview', label: 'Übersicht', children: overviewTab },
    { key: 'projects', label: `Projekte (${allProjects.length})`, children: projectsTab },
    { key: 'invoices', label: `Rechnungen (${clientInvoices.length})`, children: invoicesTab },
    {
      key: 'activities',
      label: `Aktivitäten${activitiesTotal ? ` (${activitiesTotal})` : ''}`,
      children: activitiesTab,
    },
  ];

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <Link to="/clients">Kunden</Link> },
          { title: data.name },
        ]}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Space align="center">
          <EntityAvatar
            name={data.name}
            picture={data.picture}
            size={48}
            onUpload={(file) => uploadPicture.mutate({ id: clientId, file })}
            uploading={uploadPicture.isPending}
          />
          <Title level={3} style={{ margin: 0 }}>{data.name}</Title>
        </Space>
        <Space>
          <Button icon={<EditOutlined />} onClick={handleEdit}>Bearbeiten</Button>
          <Popconfirm
            title="Kunde archivieren?"
            description="Möchten Sie diesen Kunden wirklich archivieren?"
            onConfirm={handleArchive}
            okText="Ja"
            cancelText="Nein"
          >
            <Button icon={<InboxOutlined />} danger>Archivieren</Button>
          </Popconfirm>
        </Space>
      </div>

      <Descriptions bordered column={{ xs: 1, sm: 2 }} style={{ marginBottom: 24 }} size="small">
        <Descriptions.Item label="Adresse">
          {data.address ? <span style={{ whiteSpace: 'pre-line' }}>{data.address}</span> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="UID-Nummer">{data.vatNumber || '-'}</Descriptions.Item>
        <Descriptions.Item label="Stundensatz">{formatCurrency(data.hourlyRate)}</Descriptions.Item>
        <Descriptions.Item label="Reverse Charge">{data.reverseCharge ? 'Ja' : 'Nein'}</Descriptions.Item>
      </Descriptions>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      <Drawer
        title="Kunde bearbeiten"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={520}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Abbrechen</Button>
            <Button type="primary" loading={updateClient.isPending} onClick={() => form.submit()}>
              Speichern
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item label="Bild">
            <EntityAvatar
              name={data.name}
              picture={data.picture}
              size={64}
              onUpload={(file) => uploadPicture.mutate({ id: clientId, file })}
              uploading={uploadPicture.isPending}
            />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name ist erforderlich' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Adresse">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="vatNumber" label="UID-Nummer">
            <Input />
          </Form.Item>
          <Form.Item name="hourlyRate" label="Stundensatz">
            <InputNumber min={0} step={5} style={{ width: '100%' }} addonAfter="EUR" />
          </Form.Item>
          <Form.Item name="reverseCharge" label="Reverse Charge" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
