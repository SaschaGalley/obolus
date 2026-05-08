import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Typography, Breadcrumb, Descriptions, Button, Tabs, Card, Row, Col,
  Input, InputNumber, Switch, Space, Spin, Popconfirm, Empty, message,
} from 'antd';
import { InboxOutlined, ArrowRightOutlined } from '@ant-design/icons';
import {
  useClient, useUpdateClient, useProjects, useClientInvoices, useClientActivities,
  useUploadClientPicture,
} from '../../hooks/useApi';
import EntityAvatar from '../../components/EntityAvatar';
import { formatCurrency } from '../../utils/format';
import ProjectTable from '../../components/projects/ProjectTable';
import InvoiceTable from '../../components/invoices/InvoiceTable';
import ActivityTable from '../../components/activities/ActivityTable';

const { Title } = Typography;

const PREVIEW_LIMIT = 5;
const VALID_TABS = ['overview', 'projects', 'invoices', 'activities'] as const;
type TabKey = typeof VALID_TABS[number];

export default function ClientDetailPage() {
  const { id, tab } = useParams<{ id: string; tab?: string }>();
  const clientId = Number(id);
  const navigate = useNavigate();

  const activeTab: TabKey = (VALID_TABS.includes(tab as TabKey) ? tab : 'overview') as TabKey;

  const client = useClient(clientId);
  const updateClient = useUpdateClient();
  const uploadPicture = useUploadClientPicture();

  const isOverview = activeTab === 'overview';
  const previewProjects = useProjects(
    { clientId, show: 'active', limit: PREVIEW_LIMIT },
    { enabled: isOverview },
  );
  const previewInvoices = useClientInvoices(clientId, 1, PREVIEW_LIMIT, { enabled: isOverview });
  const previewActivities = useClientActivities(clientId, 1, PREVIEW_LIMIT, ['Client'], { enabled: isOverview });

  const isProjectsTab = activeTab === 'projects';
  const [projectsPage, setProjectsPage] = useState(1);
  const [projectFilter, setProjectFilter] = useState<'active' | 'archived' | 'all'>('active');
  const allProjects = useProjects(
    { clientId, show: 'all', page: projectsPage, limit: 25 },
    { enabled: isProjectsTab },
  );

  const isInvoicesTab = activeTab === 'invoices';
  const [invoicesPage, setInvoicesPage] = useState(1);
  const clientInvoices = useClientInvoices(clientId, invoicesPage, 25, { enabled: isInvoicesTab });

  const isActivitiesTab = activeTab === 'activities';
  const [activitiesPage, setActivitiesPage] = useState(1);
  const activities = useClientActivities(clientId, activitiesPage, 50, undefined, { enabled: isActivitiesTab });

  const goToTab = (key: TabKey) => {
    navigate(key === 'overview' ? `/clients/${clientId}` : `/clients/${clientId}/${key}`);
  };

  const save = (patch: Record<string, any>) => {
    updateClient.mutate({ id: clientId, ...patch });
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

  // Overview previews
  const previewProjectList = previewProjects.data?.data || [];
  const previewInvoiceList = previewInvoices.data?.data || [];
  const previewActivityList = previewActivities.data?.data || [];
  const previewProjectTotal = previewProjects.data?.total ?? 0;
  const previewInvoiceTotal = previewInvoices.data?.total ?? 0;
  const previewActivityTotal = previewActivities.data?.total ?? 0;

  const overviewTab = (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={12}>
        <Card
          title="Aktive Projekte"
          extra={<Button type="link" size="small" onClick={() => goToTab('projects')}>Alle ({previewProjectTotal}) <ArrowRightOutlined /></Button>}
          size="small"
        >
          {previewProjects.isLoading ? <Spin /> : previewProjectList.length === 0 ? (
            <Empty description="Keine aktiven Projekte" />
          ) : (
            <ProjectTable projects={previewProjectList} columns={['name', 'total', 'unbilled']} hideClient />
          )}
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card
          title="Letzte Rechnungen"
          extra={<Button type="link" size="small" onClick={() => goToTab('invoices')}>Alle ({previewInvoiceTotal}) <ArrowRightOutlined /></Button>}
          size="small"
        >
          {previewInvoices.isLoading ? <Spin /> : previewInvoiceList.length === 0 ? (
            <Empty description="Noch keine Rechnungen" />
          ) : (
            <InvoiceTable invoices={previewInvoiceList} columns={['number', 'sentAt', 'status', 'amount']} />
          )}
        </Card>
      </Col>
      <Col xs={24}>
        <Card
          title="Letzte Aktivitäten"
          extra={previewActivityTotal > 0 && <Button type="link" size="small" onClick={() => goToTab('activities')}>Alle ({previewActivityTotal}) <ArrowRightOutlined /></Button>}
          size="small"
        >
          {previewActivities.isLoading ? <Spin /> : previewActivityList.length === 0 ? (
            <Empty description="Keine Aktivitäten" />
          ) : (
            <ActivityTable activities={previewActivityList} clientName={data.name} />
          )}
        </Card>
      </Col>
    </Row>
  );

  // Projects tab
  const allProjectsList = allProjects.data?.data || [];
  const allProjectsTotal = allProjects.data?.total ?? 0;
  const activeProjectsList = allProjectsList.filter((p: any) => !p.archived);
  const archivedProjectsList = allProjectsList.filter((p: any) => p.archived);
  const filteredProjects =
    projectFilter === 'active' ? activeProjectsList
      : projectFilter === 'archived' ? archivedProjectsList
        : allProjectsList;

  const projectsTab = (
    <>
      <Tabs
        activeKey={projectFilter}
        onChange={(k) => { setProjectFilter(k as any); setProjectsPage(1); }}
        size="small"
        style={{ marginBottom: 12 }}
        items={[
          { key: 'active', label: `Aktiv (${activeProjectsList.length})` },
          { key: 'archived', label: `Archiviert (${archivedProjectsList.length})` },
          { key: 'all', label: `Alle (${allProjectsTotal})` },
        ]}
      />
      {filteredProjects.length === 0 && !allProjects.isLoading ? (
        <Empty description="Keine Projekte" />
      ) : (
        <ProjectTable
          projects={filteredProjects}
          columns={projectFilter === 'archived' || projectFilter === 'all'
            ? ['name', 'total', 'unbilled', 'status']
            : ['name', 'total', 'unbilled']}
          hideClient
          loading={allProjects.isLoading}
          pagination={allProjectsTotal > 25 ? {
            current: projectsPage, pageSize: 25, total: allProjectsTotal, onChange: setProjectsPage,
          } : undefined}
        />
      )}
    </>
  );

  // Invoices tab
  const invoicesList = clientInvoices.data?.data || [];
  const invoicesTotal = clientInvoices.data?.total ?? 0;

  const invoicesTab = (
    <InvoiceTable
      invoices={invoicesList}
      columns={['number', 'sentAt', 'dueDate', 'status', 'amount']}
      loading={clientInvoices.isLoading}
      pagination={{ current: invoicesPage, pageSize: 25, total: invoicesTotal, onChange: setInvoicesPage, hideOnSinglePage: true }}
    />
  );

  const activitiesTab = (
    <ActivityTable
      activities={activities.data?.data || []}
      loading={activities.isLoading}
      clientName={data.name}
      pageSize={50}
      total={activities.data?.total ?? 0}
      page={activitiesPage}
      onPageChange={setActivitiesPage}
    />
  );

  const tabItems = [
    { key: 'overview', label: 'Übersicht', children: overviewTab },
    { key: 'projects', label: `Projekte${previewProjectTotal ? ` (${previewProjectTotal})` : ''}`, children: projectsTab },
    { key: 'invoices', label: `Rechnungen${previewInvoiceTotal ? ` (${previewInvoiceTotal})` : ''}`, children: invoicesTab },
    { key: 'activities', label: `Aktivitäten${previewActivityTotal ? ` (${previewActivityTotal})` : ''}`, children: activitiesTab },
  ];

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }} items={[{ title: <Link to="/clients">Kunden</Link> }, { title: data.name }]} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
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
        <Popconfirm
          title="Kunde archivieren?"
          description="Möchten Sie diesen Kunden wirklich archivieren?"
          onConfirm={handleArchive}
          okText="Ja"
          cancelText="Nein"
        >
          <Button icon={<InboxOutlined />} danger>Archivieren</Button>
        </Popconfirm>
      </div>

      <Descriptions bordered column={{ xs: 1, sm: 2 }} style={{ marginBottom: 24 }} size="small">
        <Descriptions.Item label="Name" span={2}>
          <Input
            key={data.name}
            defaultValue={data.name}
            variant="borderless"
            style={{ padding: 0 }}
            onBlur={(e) => { if (e.target.value !== data.name) save({ name: e.target.value }); }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Adresse" span={2}>
          <Input.TextArea
            key={data.address}
            defaultValue={data.address || ''}
            variant="borderless"
            autoSize={{ minRows: 1, maxRows: 5 }}
            style={{ padding: 0 }}
            onBlur={(e) => { if (e.target.value !== (data.address || '')) save({ address: e.target.value }); }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="UID-Nummer">
          <Input
            key={data.vatNumber}
            defaultValue={data.vatNumber || ''}
            variant="borderless"
            style={{ padding: 0 }}
            onBlur={(e) => { if (e.target.value !== (data.vatNumber || '')) save({ vatNumber: e.target.value || null }); }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Stundensatz">
          <InputNumber
            key={data.hourlyRate}
            defaultValue={data.hourlyRate ? Number(data.hourlyRate) : undefined}
            min={0}
            step={5}
            addonAfter="€"
            variant="borderless"
            style={{ width: '100%' }}
            onBlur={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v) && v !== Number(data.hourlyRate)) save({ hourlyRate: v });
            }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Reverse Charge">
          <Switch
            checked={data.reverseCharge}
            onChange={(v) => save({ reverseCharge: v })}
          />
        </Descriptions.Item>
      </Descriptions>

      <Tabs activeKey={activeTab} onChange={(k) => goToTab(k as TabKey)} items={tabItems} />
    </div>
  );
}
