import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Typography, Button, Space, Table, Drawer, Form, Input,
  InputNumber, DatePicker, Switch, Modal, Popconfirm, Spin, Breadcrumb,
  message, Empty, Tabs,
} from 'antd';
import {
  PlusOutlined, FileTextOutlined, EditOutlined, DeleteOutlined,
  InboxOutlined, FilePdfOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useProject, useUpdateProject, useTasks, useCreateTask, useUpdateTask,
  useDeleteTask, useReorderTasks, useSessions, useCreateSession,
  useUpdateSession, useDeleteSession, useCreateInvoice, useInvoices,
  useUploadProjectPicture,
} from '../../hooks/useApi';
import EntityAvatar from '../../components/EntityAvatar';
import { projectsApi } from '../../api/client';
import { formatDate } from '../../utils/format';
import TaskTable from '../../components/tasks/TaskTable';
import InvoiceTable from '../../components/invoices/InvoiceTable';

const { Title, Text } = Typography;

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = Number(id);
  const { data: project, isLoading } = useProject(projectId);
  const { data: tasks = [] } = useTasks({ projectId, open: true });
  const allInvoices = useInvoices(1, 200);

  const [taskDrawer, setTaskDrawer] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [invoiceDrawer, setInvoiceDrawer] = useState(false);
  const [quoteDrawer, setQuoteDrawer] = useState(false);
  const [sessionsTaskId, setSessionsTaskId] = useState<number | null>(null);
  const [editDrawer, setEditDrawer] = useState(false);

  const [taskForm] = Form.useForm();
  const [invoiceForm] = Form.useForm();
  const [quoteForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const updateProject = useUpdateProject();
  const uploadPicture = useUploadProjectPicture();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const reorderTasks = useReorderTasks();
  const createInvoice = useCreateInvoice();

  if (isLoading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 100 }} />;
  if (!project) return <Empty description="Projekt nicht gefunden" />;

  const projectInvoices = (allInvoices.data?.data || []).filter(
    (inv: any) => (inv.tasks || []).some((t: any) => t.projectId === projectId),
  );

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

  const handleEdit = () => {
    if (project) {
      editForm.setFieldsValue({ name: project.name, hourlyRate: project.hourlyRate });
    }
    setEditDrawer(true);
  };

  const handleEditSubmit = async (values: any) => {
    try {
      await updateProject.mutateAsync({ id: projectId, ...values });
      message.success('Projekt aktualisiert');
      setEditDrawer(false);
    } catch { message.error('Fehler beim Aktualisieren'); }
  };

  const handleArchive = async () => {
    try {
      await updateProject.mutateAsync({ id: projectId, archived: true });
      message.success('Projekt archiviert');
      navigate('/projects');
    } catch { message.error('Fehler beim Archivieren'); }
  };

  const tabItems = [
    {
      key: 'tasks',
      label: `Tasks${tasks.length ? ` (${tasks.length})` : ''}`,
      children: (
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
        />
      ),
    },
    {
      key: 'invoices',
      label: `Rechnungen${projectInvoices.length ? ` (${projectInvoices.length})` : ''}`,
      children: projectInvoices.length === 0 ? (
        <Empty description="Noch keine Rechnungen" />
      ) : (
        <InvoiceTable
          invoices={projectInvoices}
          columns={['number', 'sentAt', 'dueDate', 'status', 'amount']}
          loading={allInvoices.isLoading}
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
          <Button icon={<PlusOutlined />} onClick={() => openTaskForm()}>Task hinzufügen</Button>
          <Button icon={<FilePdfOutlined />} onClick={() => { quoteForm.resetFields(); setQuoteDrawer(true); }}>
            Angebot
          </Button>
          <Button icon={<FileTextOutlined />} type="primary" onClick={() => { invoiceForm.resetFields(); setInvoiceDrawer(true); }}>
            Rechnung erstellen
          </Button>
          <Button icon={<EditOutlined />} onClick={handleEdit}>Bearbeiten</Button>
          <Popconfirm title="Projekt archivieren?" onConfirm={handleArchive} okText="Ja" cancelText="Nein">
            <Button danger icon={<InboxOutlined />}>Archivieren</Button>
          </Popconfirm>
        </Space>
      </div>

      <Tabs items={tabItems} />

      {/* Task Form Drawer */}
      <Drawer title={editingTask ? 'Task bearbeiten' : 'Neuer Task'} open={taskDrawer} onClose={() => setTaskDrawer(false)} width={520}>
        <Form form={taskForm} layout="vertical" onFinish={handleTaskSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="note" label="Notiz"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="hourlyRate" label="Stundensatz"><InputNumber addonBefore="€" style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="fixedCost" label="Fixkosten"><InputNumber addonBefore="€" style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="fixedDuration" label="Fixe Stunden"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="fixedDate" label="Fixes Datum"><DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" /></Form.Item>
          <Button type="primary" htmlType="submit" loading={createTask.isPending || updateTask.isPending}>Speichern</Button>
        </Form>
      </Drawer>

      {/* Invoice Create Drawer */}
      <Drawer title="Rechnung erstellen" open={invoiceDrawer} onClose={() => setInvoiceDrawer(false)} width={520}>
        <Form form={invoiceForm} layout="vertical" onFinish={handleInvoiceSubmit} initialValues={{ dueDays: 14, showHours: true, showDate: true }}>
          <Form.Item name="number" label="Rechnungsnummer" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="sentAt" label="Rechnungsdatum"><DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" /></Form.Item>
          <Form.Item name="dueDays" label="Zahlungsziel (Tage)"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="note" label="Notiz"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="showHours" label="Stunden anzeigen" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="showDate" label="Datum anzeigen" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="reverseCharge" label="Reverse Charge" valuePropName="checked"><Switch /></Form.Item>
          <Button type="primary" htmlType="submit" loading={createInvoice.isPending}>Rechnung erstellen</Button>
        </Form>
      </Drawer>

      {/* Quote Drawer */}
      <Drawer title="Angebot erstellen" open={quoteDrawer} onClose={() => setQuoteDrawer(false)} width={520}>
        <Form form={quoteForm} layout="vertical" onFinish={handleQuoteSubmit} initialValues={{ showHours: true }}>
          <Form.Item name="title" label="Titel" tooltip={`Standard: "Angebot ${project.name}"`}>
            <Input placeholder={`Angebot ${project.name}`} />
          </Form.Item>
          <Form.Item name="showHours" label="Stunden anzeigen" valuePropName="checked"><Switch /></Form.Item>
          <Button type="primary" htmlType="submit" icon={<FilePdfOutlined />}>PDF erzeugen</Button>
        </Form>
      </Drawer>

      {/* Edit Project Drawer */}
      <Drawer title="Projekt bearbeiten" open={editDrawer} onClose={() => setEditDrawer(false)} width={520}
        extra={
          <Space>
            <Button onClick={() => setEditDrawer(false)}>Abbrechen</Button>
            <Button type="primary" loading={updateProject.isPending} onClick={() => editForm.submit()}>Speichern</Button>
          </Space>
        }
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item label="Bild">
            <EntityAvatar
              name={project.name}
              picture={project.picture}
              fallbackPicture={project.client?.picture}
              size={64}
              onUpload={(file) => uploadPicture.mutate({ id: projectId, file })}
              uploading={uploadPicture.isPending}
            />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="hourlyRate" label="Stundensatz">
            <InputNumber min={0} step={5} style={{ width: '100%' }} addonAfter="EUR" />
          </Form.Item>
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
