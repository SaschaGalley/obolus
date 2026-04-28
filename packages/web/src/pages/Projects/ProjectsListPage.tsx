import { useState } from 'react';
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
  Tabs,
  Space,
  Spin,
  Empty,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useProjects, useCreateProject, useClients } from '../../hooks/useApi';
import ProjectTable from '../../components/projects/ProjectTable';

const { Title } = Typography;

export default function ProjectsListPage() {
  const [show, setShow] = useState('active');
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();

  const projects = useProjects({ show, page });
  const createProject = useCreateProject();
  const clients = useClients('active');

  const handleCreate = async (values: any) => {
    try {
      await createProject.mutateAsync(values);
      message.success('Projekt erstellt');
      setDrawerOpen(false);
      form.resetFields();
    } catch {
      message.error('Fehler beim Erstellen');
    }
  };

  const tabItems = [
    { key: 'active', label: 'Aktiv' },
    { key: 'archived', label: 'Archiviert' },
    { key: 'all', label: 'Alle' },
  ];

  const clientOptions = (clients.data || []).map((c: any) => ({
    value: c.id,
    label: c.name,
  }));

  if (projects.isLoading) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 100 }} />;
  }

  const data = projects.data?.data || [];
  const total = projects.data?.total || 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Projekte</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
          Neues Projekt
        </Button>
      </div>

      <Tabs
        activeKey={show}
        onChange={setShow}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      {data.length === 0 ? (
        <Empty description="Keine Projekte vorhanden" />
      ) : (
        <ProjectTable
          projects={data}
          columns={['name', 'client', 'total', 'unbilled', 'status']}
          pagination={{
            current: page,
            pageSize: 20,
            total,
            showSizeChanger: false,
            showTotal: (t) => `${t} Projekte`,
            onChange: (p) => setPage(p),
          }}
          size="middle"
        />
      )}

      <Drawer
        title="Neues Projekt"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={520}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Abbrechen</Button>
            <Button type="primary" loading={createProject.isPending} onClick={() => form.submit()}>
              Speichern
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name ist erforderlich' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="clientId" label="Kunde" rules={[{ required: true, message: 'Kunde ist erforderlich' }]}>
            <Select
              options={clientOptions}
              placeholder="Kunde auswählen"
              showSearch
              filterOption={(input, option) =>
                (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item name="hourlyRate" label="Stundensatz">
            <InputNumber min={0} step={5} style={{ width: '100%' }} addonAfter="EUR" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
