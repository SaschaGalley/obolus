import { useState } from 'react';
import {
  Typography, Table, Button, Tag, Drawer, Form, Input, InputNumber,
  Select, DatePicker, Space, Popconfirm, Spin, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '../../hooks/useApi';
import { formatCurrency, formatDate } from '../../utils/format';

const { Title } = Typography;

const expenseTypes = [
  { value: 'other', label: 'Sonstiges', color: 'default' },
  { value: 'sva', label: 'SVA', color: 'blue' },
  { value: 'ust', label: 'USt', color: 'orange' },
  { value: 'est', label: 'ESt', color: 'red' },
];

export default function ExpensesListPage() {
  const { data: expenses = [], isLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [form] = Form.useForm();
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2015 }, (_, i) => currentYear - i);

  const filtered = yearFilter
    ? expenses.filter((e: any) => e.payedAt && dayjs(e.payedAt).year() === yearFilter)
    : expenses;

  const sorted = [...filtered].sort((a: any, b: any) => {
    const da = a.payedAt ? dayjs(a.payedAt).unix() : 0;
    const db = b.payedAt ? dayjs(b.payedAt).unix() : 0;
    return db - da;
  });

  const openForm = (expense?: any) => {
    setEditingExpense(expense || null);
    if (expense) {
      form.setFieldsValue({
        cost: Number(expense.cost),
        tax: expense.tax ? Number(expense.tax) : null,
        type: expense.type,
        note: expense.note,
        payedAt: expense.payedAt ? dayjs(expense.payedAt) : null,
      });
    } else {
      form.resetFields();
    }
    setDrawerOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const data = { ...values, payedAt: values.payedAt?.format('YYYY-MM-DD') || null };
      if (editingExpense) {
        await updateExpense.mutateAsync({ id: editingExpense.id, ...data });
        message.success('Ausgabe aktualisiert');
      } else {
        await createExpense.mutateAsync(data);
        message.success('Ausgabe erstellt');
      }
      setDrawerOpen(false);
    } catch { message.error('Fehler beim Speichern'); }
  };

  if (isLoading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 100 }} />;

  const columns = [
    { title: 'Datum', dataIndex: 'payedAt', key: 'payedAt', render: (v: any) => formatDate(v), width: 120 },
    { title: 'Betrag', dataIndex: 'cost', key: 'cost', render: (v: any) => formatCurrency(v), align: 'right' as const, width: 120 },
    { title: 'Steuer', dataIndex: 'tax', key: 'tax', render: (v: any) => v ? formatCurrency(v) : '-', align: 'right' as const, width: 100 },
    {
      title: 'Typ', dataIndex: 'type', key: 'type', width: 100,
      render: (v: string) => {
        const t = expenseTypes.find((e) => e.value === v);
        return <Tag color={t?.color || 'default'}>{t?.label || v}</Tag>;
      },
    },
    { title: 'Notiz', dataIndex: 'note', key: 'note', ellipsis: true },
    {
      title: '', key: 'actions', width: 90,
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openForm(record)} />
          <Popconfirm title="Löschen?" onConfirm={() => deleteExpense.mutate(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Ausgaben</Title>
        <Space>
          <Select
            placeholder="Jahr"
            allowClear
            value={yearFilter}
            onChange={setYearFilter}
            style={{ width: 120 }}
            options={years.map((y) => ({ value: y, label: String(y) }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>Neue Ausgabe</Button>
        </Space>
      </div>
      <Table dataSource={sorted} columns={columns} rowKey="id" />

      <Drawer title={editingExpense ? 'Ausgabe bearbeiten' : 'Neue Ausgabe'} open={drawerOpen} onClose={() => setDrawerOpen(false)} width={520}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ type: 'other' }}>
          <Form.Item name="cost" label="Betrag" rules={[{ required: true }]}>
            <InputNumber addonBefore="€" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="tax" label="Steuer">
            <InputNumber addonBefore="€" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="payedAt" label="Datum">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="type" label="Typ">
            <Select options={expenseTypes.map(({ value, label }) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="note" label="Notiz">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={createExpense.isPending || updateExpense.isPending}>Speichern</Button>
        </Form>
      </Drawer>
    </div>
  );
}
