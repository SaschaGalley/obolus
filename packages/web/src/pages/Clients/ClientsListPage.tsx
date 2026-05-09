import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Switch,
  Typography,
  Tabs,
  Space,
  Spin,
  Empty,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useClients, useCreateClient } from '../../hooks/useApi';
import { formatCurrency } from '../../utils/format';
import EntityAvatar from '../../components/EntityAvatar';

const { Title } = Typography;

export default function ClientsListPage() {
  const [show, setShow] = useState('active');
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const clients = useClients(show, page);
  const createClient = useCreateClient();

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
      render: (name: string, record: any) => (
        <Space>
          <EntityAvatar name={name} picture={record.picture} size={28} />
          {name}
        </Space>
      ),
    },
    {
      title: 'Nicht verrechnet',
      dataIndex: 'unbilled',
      key: 'unbilled',
      align: 'right' as const,
      render: (v: number) => formatCurrency(v),
    },
    {
      title: 'Verrechnet',
      dataIndex: 'billed',
      key: 'billed',
      align: 'right' as const,
      render: (v: number) => formatCurrency(v),
    },
    {
      title: 'Gesamt',
      dataIndex: 'total',
      key: 'total',
      align: 'right' as const,
      render: (v: number) => formatCurrency(v),
    },
  ];

  const handleCreate = async (values: any) => {
    try {
      await createClient.mutateAsync(values);
      message.success('Kunde erstellt');
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

  if (clients.isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  const data = clients.data?.data || [];
  const total = clients.data?.total || 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Kunden</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setDrawerOpen(true); }}>
          Neuer Kunde
        </Button>
      </div>

      <Tabs activeKey={show} onChange={setShow} items={tabItems} style={{ marginBottom: 16 }} />

      {data.length === 0 ? (
        <Empty description="Keine Kunden vorhanden" />
      ) : (
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          onRow={(record: any) => ({
            onClick: () => navigate(`/clients/${record.id}`),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: page,
            pageSize: 20,
            total,
            showSizeChanger: false,
            showTotal: (t) => `${t} Kunden`,
            onChange: (p) => setPage(p),
          }}
        />
      )}

      <Drawer
        title="Neuer Kunde"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        styles={{ body: { padding: '24px' }, footer: { padding: '12px 24px' } }}
        footer={
          <Button type="primary" block size="large" loading={createClient.isPending} onClick={() => form.submit()}>
            Kunde erstellen
          </Button>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name ist erforderlich' }]}>
            <Input variant="filled" />
          </Form.Item>
          <Form.Item name="address" label="Adresse">
            <Input.TextArea variant="filled" rows={3} />
          </Form.Item>
          <Form.Item name="vatNumber" label="UID-Nummer">
            <Input variant="filled" />
          </Form.Item>
          <Form.Item name="hourlyRate" label="Stundensatz">
            <InputNumber variant="filled" min={0} step={5} style={{ width: '100%' }} addonAfter="€/h" />
          </Form.Item>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Optionen
            </div>
            <div style={{ borderRadius: 8, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                <span style={{ fontSize: 14 }}>Reverse Charge</span>
                <Form.Item name="reverseCharge" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </div>
            </div>
          </div>
        </Form>
      </Drawer>
    </div>
  );
}
