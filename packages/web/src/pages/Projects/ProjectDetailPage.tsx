import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Typography, Button, Space, Table, Drawer, Form, Input,
  InputNumber, Switch, Modal, Popconfirm, Spin, Breadcrumb,
  message, Empty, Tabs, Descriptions,
} from 'antd';
import SmartDatePicker from '../../components/SmartDatePicker';
import {
  PlusOutlined, FileTextOutlined, DeleteOutlined,
  InboxOutlined, FilePdfOutlined, SortAscendingOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useProject, useUpdateProject, useTasks, useCreateTask, useUpdateTask,
  useDeleteTask, useReorderTasks, useSessions, useCreateSession,
  useUpdateSession, useDeleteSession, useCreateInvoice, useClientInvoices,
  useUploadProjectPicture, useNextInvoiceNumber,
} from '../../hooks/useApi';
import { getTaskDate } from '../../components/tasks/taskCalculations';
import EntityAvatar from '../../components/EntityAvatar';
import { projectsApi } from '../../api/client';
import { formatDate } from '../../utils/format';
import TaskTable from '../../components/tasks/TaskTable';
import InvoiceTable from '../../components/invoices/InvoiceTable';

const { Title, Text } = Typography;

const VALID_TABS = ['tasks', 'invoices'] as const;
type TabKey = typeof VALID_TABS[number];

export default function ProjectDetailPage() {
  const { id, tab } = useParams<{ id: string; tab?: string }>();
  const navigate = useNavigate();
  const projectId = Number(id);
  const activeTab: TabKey = (VALID_TABS.includes(tab as TabKey) ? tab : 'tasks') as TabKey;

  const { data: project, isLoading } = useProject(projectId);
  const { data: tasks = [] } = useTasks({ projectId, open: true });

  const isInvoicesTab = activeTab === 'invoices';
  const [invoicesPage, setInvoicesPage] = useState(1);
  const clientInvoices = useClientInvoices(
    project?.clientId ?? 0,
    invoicesPage,
    25,
    { enabled: isInvoicesTab && !!project?.clientId, projectId },
  );

  const [taskDrawer, setTaskDrawer] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [invoiceDrawer, setInvoiceDrawer] = useState(false);
  const [quoteDrawer, setQuoteDrawer] = useState(false);
  const [sessionsTaskId, setSessionsTaskId] = useState<number | null>(null);

  const [taskForm] = Form.useForm();
  const [invoiceForm] = Form.useForm();
  const [quoteForm] = Form.useForm();

  const { data: nextNumberData } = useNextInvoiceNumber();

  const updateProject = useUpdateProject();
  const uploadPicture = useUploadProjectPicture();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const reorderTasks = useReorderTasks();
  const createInvoice = useCreateInvoice();

  const projectInvoices = clientInvoices.data?.data || [];
  const projectInvoicesTotal = clientInvoices.data?.total ?? 0;

  if (isLoading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 100 }} />;
  if (!project) return <Empty description="Projekt nicht gefunden" />;

  const openTaskForm = (task?: any) => {
    setEditingTask(task || null);
    if (task) {
      taskForm.setFieldsValue({
        name: task.name,
        note: task.note,
        hourlyRate: task.hourlyRate,
        fixedCost: task.fixedCost,
        fixedDuration: task.fixedDuration,
        fixedDate: task.fixedDate ? dayjs(task.fixedDate) : null,
      });
    } else {
      taskForm.resetFields();
    }
    setTaskDrawer(true);
  };

  const handleTaskSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        fixedDate: values.fixedDate?.format('YYYY-MM-DD') || null,
        projectId,
      };
      if (editingTask) {
        await updateTask.mutateAsync({ id: editingTask.id, ...data });
        message.success('Task aktualisiert');
      } else {
        await createTask.mutateAsync(data);
        message.success('Task erstellt');
      }
      setTaskDrawer(false);
    } catch { message.error('Fehler beim Speichern'); }
  };

  const openInvoiceDrawer = () => {
    invoiceForm.resetFields();
    invoiceForm.setFieldsValue({
      number: nextNumberData?.number ?? '',
      sentAt: dayjs(),
      dueDays: 14,
      showHours: true,
      showDate: true,
    });
    setInvoiceDrawer(true);
  };

  const handleInvoiceSubmit = async (values: any) => {
    try {
      await createInvoice.mutateAsync({
        ...values,
        clientId: project.clientId,
        projectId: project.id,
        sentAt: values.sentAt?.format('YYYY-MM-DD') || null,
        clientName: project.client?.name,
        clientAddress: project.client?.address,
        clientVatNumber: project.client?.vatNumber,
        reverseCharge: project.client?.reverseCharge || false,
      });
      message.success('Rechnung erstellt');
      setInvoiceDrawer(false);
    } catch { message.error('Fehler beim Erstellen der Rechnung'); }
  };

  const handleQuoteSubmit = async (values: any) => {
    try {
      const { data } = await projectsApi.downloadQuote(projectId, values);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      window.open(url, '_blank');
      setQuoteDrawer(false);
    } catch { message.error('Fehler beim Erstellen des Angebots'); }
  };

  const saveProject = (patch: Record<string, any>) => {
    updateProject.mutate({ id: projectId, ...patch });
  };

  const handleArchive = async () => {
    try {
      await updateProject.mutateAsync({ id: projectId, archived: true });
      message.success('Projekt archiviert');
      navigate('/projects');
    } catch { message.error('Fehler beim Archivieren'); }
  };

  const handleSortByDate = () => {
    if (!tasks.length) return;
    const sorted = [...tasks].sort((a, b) => {
      const da = getTaskDate(a) ?? '';
      const db = getTaskDate(b) ?? '';
      return da < db ? -1 : da > db ? 1 : 0;
    });
    reorderTasks.mutate(sorted.map((t, i) => ({ id: t.id, order: i })));
  };

  const goToTab = (key: TabKey) => {
    navigate(key === 'tasks' ? `/projects/${projectId}` : `/projects/${projectId}/${key}`);
  };

  const tabItems = [
    {
      key: 'tasks',
      label: `Tasks${tasks.length ? ` (${tasks.length})` : ''}`,
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <Button
              size="small"
              icon={<SortAscendingOutlined />}
              onClick={handleSortByDate}
              loading={reorderTasks.isPending}
              disabled={tasks.length === 0}
            >
              Nach Datum sortieren
            </Button>
          </div>
          <TaskTable
            tasks={tasks}
            project={project}
            mode="project"
            onToggleUse={(t) => updateTask.mutate({ id: t.id, isActive: !t.isActive })}
            onUpdate={(taskId, patch) => updateTask.mutate({ id: taskId, ...patch })}
            onEdit={openTaskForm}
            onDelete={(t) => deleteTask.mutate(t.id)}
            onShowSessions={(t) => setSessionsTaskId(t.id)}
            onReorder={(items) => reorderTasks.mutate(items)}
            onAdd={async (data) => {
              await createTask.mutateAsync({ ...data, projectId });
              message.success('Task erstellt');
            }}
          />
        </>
      ),
    },
    {
      key: 'invoices',
      label: `Rechnungen${projectInvoicesTotal ? ` (${projectInvoicesTotal})` : ''}`,
      children: clientInvoices.isLoading ? (
        <Spin />
      ) : projectInvoices.length === 0 ? (
        <Empty description="Noch keine Rechnungen" />
      ) : (
        <InvoiceTable
          invoices={projectInvoices}
          columns={['number', 'sentAt', 'dueDate', 'status', 'amount']}
          loading={clientInvoices.isLoading}
          pagination={{ pageSize: 25, hideOnSinglePage: true, total: projectInvoicesTotal, onChange: setInvoicesPage }}
        />
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb items={[
        { title: <Link to="/projects">Projekte</Link> },
        { title: project.name },
      ]} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0' }}>
        <Space align="center">
          <EntityAvatar
            name={project.name}
            picture={project.picture}
            fallbackPicture={project.client?.picture}
            size={48}
            onUpload={(file) => uploadPicture.mutate({ id: projectId, file })}
            uploading={uploadPicture.isPending}
          />
          <div>
            <Title level={3} style={{ margin: 0 }}>{project.name}</Title>
            {project.client && <Link to={`/clients/${project.client.id}`}><Text type="secondary">{project.client.name}</Text></Link>}
          </div>
        </Space>
        <Space>
          <Button icon={<FilePdfOutlined />} onClick={() => { quoteForm.resetFields(); setQuoteDrawer(true); }}>
            Angebot
          </Button>
          <Button icon={<FileTextOutlined />} type="primary" onClick={openInvoiceDrawer}>
            Rechnung erstellen
          </Button>
          <Popconfirm title="Projekt archivieren?" onConfirm={handleArchive} okText="Ja" cancelText="Nein">
            <Button danger icon={<InboxOutlined />}>Archivieren</Button>
          </Popconfirm>
        </Space>
      </div>

      <Descriptions bordered column={{ xs: 1, sm: 2 }} style={{ marginBottom: 24 }} size="small">
        <Descriptions.Item label="Name">
          <Input
            key={project.name}
            defaultValue={project.name}
            variant="borderless"
            style={{ padding: 0 }}
            onBlur={(e) => { if (e.target.value !== project.name) saveProject({ name: e.target.value }); }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Stundensatz">
          <InputNumber
            key={project.hourlyRate}
            defaultValue={project.hourlyRate ? Number(project.hourlyRate) : undefined}
            min={0}
            step={5}
            addonAfter="€"
            variant="borderless"
            style={{ width: '100%' }}
            onBlur={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v) && v !== Number(project.hourlyRate)) saveProject({ hourlyRate: v });
            }}
          />
        </Descriptions.Item>
      </Descriptions>

      <Tabs activeKey={activeTab} onChange={(k) => goToTab(k as TabKey)} items={tabItems} />

      {/* Task Edit Drawer */}
      <Drawer
        title="Task bearbeiten"
        open={taskDrawer}
        onClose={() => setTaskDrawer(false)}
        width={480}
        styles={{ body: { padding: '24px' }, footer: { padding: '12px 24px' } }}
        footer={
          <Button type="primary" block size="large" loading={updateTask.isPending} onClick={() => taskForm.submit()}>
            Speichern
          </Button>
        }
      >
        <Form form={taskForm} layout="vertical" onFinish={handleTaskSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input.TextArea variant="filled" autoSize={{ minRows: 2 }} />
          </Form.Item>
          <Form.Item name="note" label="Notiz">
            <Input.TextArea variant="filled" rows={3} />
          </Form.Item>
          <Form.Item name="hourlyRate" label="Stundensatz">
            <InputNumber variant="filled" addonBefore="€" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="fixedCost" label="Fixkosten">
            <InputNumber variant="filled" addonBefore="€" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="fixedDuration" label="Fixe Stunden">
            <InputNumber variant="filled" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="fixedDate" label="Fixes Datum">
            <SmartDatePicker variant="filled" style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Invoice Create Drawer */}
      <Drawer
        title="Rechnung erstellen"
        open={invoiceDrawer}
        onClose={() => setInvoiceDrawer(false)}
        width={480}
        styles={{ body: { padding: '24px' }, footer: { padding: '12px 24px' } }}
        footer={
          <Button type="primary" block size="large" loading={createInvoice.isPending} onClick={() => invoiceForm.submit()}>
            Rechnung erstellen
          </Button>
        }
      >
        <Form form={invoiceForm} layout="vertical" onFinish={handleInvoiceSubmit}>
          <Form.Item name="number" label="Rechnungsnummer" rules={[{ required: true }]}>
            <Input variant="filled" />
          </Form.Item>
          <Form.Item name="sentAt" label="Rechnungsdatum">
            <SmartDatePicker variant="filled" style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <Form.Item name="dueDays" label="Zahlungsziel (Tage)">
            <InputNumber variant="filled" style={{ width: '100%' }} addonAfter="Tage" />
          </Form.Item>
          <Form.Item name="note" label="Notiz">
            <Input.TextArea variant="filled" rows={3} />
          </Form.Item>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Optionen
            </div>
            <div style={{ borderRadius: 8, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
              {([
                { name: 'showHours', label: 'Stunden anzeigen' },
                { name: 'showDate', label: 'Datum anzeigen' },
                { name: 'reverseCharge', label: 'Reverse Charge' },
              ] as const).map(({ name, label }, i, arr) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid #f0f0f0' : undefined }}>
                  <span style={{ fontSize: 14 }}>{label}</span>
                  <Form.Item name={name} valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
              ))}
            </div>
          </div>
        </Form>
      </Drawer>

      {/* Quote Drawer */}
      <Drawer
        title="Angebot erstellen"
        open={quoteDrawer}
        onClose={() => setQuoteDrawer(false)}
        width={480}
        styles={{ body: { padding: '24px' }, footer: { padding: '12px 24px' } }}
        footer={
          <Button type="primary" block size="large" icon={<FilePdfOutlined />} onClick={() => quoteForm.submit()}>
            PDF erzeugen
          </Button>
        }
      >
        <Form form={quoteForm} layout="vertical" onFinish={handleQuoteSubmit} initialValues={{ showHours: true }}>
          <Form.Item name="title" label="Titel" tooltip={`Standard: "Angebot ${project.name}"`}>
            <Input variant="filled" placeholder={`Angebot ${project.name}`} />
          </Form.Item>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Optionen
            </div>
            <div style={{ borderRadius: 8, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                <span style={{ fontSize: 14 }}>Stunden anzeigen</span>
                <Form.Item name="showHours" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </div>
            </div>
          </div>
        </Form>
      </Drawer>


      <SessionsModal taskId={sessionsTaskId} onClose={() => setSessionsTaskId(null)} />
    </div>
  );
}

function SessionsModal({ taskId, onClose }: { taskId: number | null; onClose: () => void }) {
  const { data: sessions = [], isLoading } = useSessions(taskId || undefined);
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();

  const columns = [
    {
      title: 'Datum', dataIndex: 'startedAt', key: 'startedAt', width: 120,
      render: (v: any) => formatDate(v),
    },
    {
      title: 'Stunden', dataIndex: 'duration', key: 'duration', width: 100,
      render: (v: any, record: any) => (
        <InputNumber
          size="small" value={Number(v)} min={0} step={0.25} style={{ width: 80 }}
          onBlur={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && val !== Number(v)) {
              updateSession.mutate({ id: record.id, duration: val });
            }
          }}
        />
      ),
    },
    {
      title: 'Notiz', dataIndex: 'note', key: 'note',
      render: (v: any, record: any) => (
        <Input
          size="small" defaultValue={v || ''}
          onBlur={(e) => {
            if (e.target.value !== (v || '')) {
              updateSession.mutate({ id: record.id, note: e.target.value });
            }
          }}
        />
      ),
    },
    {
      title: '', key: 'actions', width: 50,
      render: (_: any, record: any) => (
        <Popconfirm title="Löschen?" onConfirm={() => deleteSession.mutate(record.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal title="Sessions" open={!!taskId} onCancel={onClose} footer={null} width={700}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button
          icon={<PlusOutlined />}
          onClick={() => createSession.mutate({ taskId, startedAt: new Date(), duration: 0 })}
          loading={createSession.isPending}
        >
          Session hinzufügen
        </Button>
        <Table dataSource={sessions} columns={columns} rowKey="id" pagination={false} size="small" loading={isLoading} />
      </Space>
    </Modal>
  );
}
