import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Typography, Descriptions, Tag, Button, Space, Drawer, Form,
  Input, InputNumber, DatePicker, Switch, Spin, Empty, Breadcrumb, message, Divider,
} from 'antd';
import { EditOutlined, FilePdfOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useInvoice, useUpdateInvoice } from '../../hooks/useApi';
import { invoicesApi } from '../../api/client';
import { formatCurrency, formatDate, getInvoiceStatus } from '../../utils/format';
import TaskTable from '../../components/tasks/TaskTable';
import { sumTasks } from '../../components/tasks/taskCalculations';

const { Title, Text } = Typography;

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = Number(id);
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const updateInvoice = useUpdateInvoice();
  const [editDrawer, setEditDrawer] = useState(false);
  const [form] = Form.useForm();

  const projectGroups = useMemo(() => {
    if (!invoice?.tasks) return [];
    const groups: Record<number, { projectName: string; tasks: any[] }> = {};
    for (const task of invoice.tasks.filter((t: any) => t.isActive)) {
      const pid = task.projectId;
      if (!groups[pid]) groups[pid] = { projectName: task.project?.name || 'Projekt', tasks: [] };
      groups[pid].tasks.push(task);
    }
    return Object.values(groups);
  }, [invoice]);

  const totals = useMemo(() => {
    if (!invoice?.tasks) return { cost: 0, duration: 0, tax: 0, total: 0 };
    const usable = invoice.tasks.filter((t: any) => t.isActive);
    const { cost, duration } = sumTasks(usable);
    const tax = invoice.reverseCharge ? 0 : cost * 0.2;
    return { cost, duration, tax, total: cost + tax };
  }, [invoice]);

  if (isLoading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 100 }} />;
  if (!invoice) return <Empty description="Rechnung nicht gefunden" />;

  const status = getInvoiceStatus(invoice);

  const openEdit = () => {
    form.setFieldsValue({
      number: invoice.number,
      sentAt: invoice.sentAt ? dayjs(invoice.sentAt) : null,
      dueDays: invoice.dueDays,
      payedAt: invoice.payedAt ? dayjs(invoice.payedAt) : null,
      showHours: invoice.showHours,
      showDate: invoice.showDate,
      reverseCharge: invoice.reverseCharge,
      note: invoice.note,
    });
    setEditDrawer(true);
  };

  const handleUpdate = async (values: any) => {
    try {
      await updateInvoice.mutateAsync({
        id: invoiceId,
        ...values,
        sentAt: values.sentAt?.format('YYYY-MM-DD') || null,
        payedAt: values.payedAt?.format('YYYY-MM-DD') || null,
      });
      message.success('Rechnung aktualisiert');
      setEditDrawer(false);
    } catch { message.error('Fehler beim Speichern'); }
  };

  const handlePdf = async () => {
    try {
      const { data } = await invoicesApi.downloadPdf(invoiceId);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch { message.error('PDF konnte nicht geladen werden'); }
  };

  return (
    <div>
      <Breadcrumb items={[{ title: <Link to="/invoices">Rechnungen</Link> }, { title: `Rechnung ${invoice.number}` }]} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Rechnung {invoice.number}</Title>
          <Text type="secondary">{invoice.clientName}</Text>
        </div>
        <Space>
          <Button icon={<EditOutlined />} onClick={openEdit}>Bearbeiten</Button>
          <Button icon={<FilePdfOutlined />} type="primary" onClick={handlePdf}>PDF</Button>
        </Space>
      </div>

      <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Datum">{formatDate(invoice.sentAt)}</Descriptions.Item>
        <Descriptions.Item label="Fällig am">{invoice.sentAt ? formatDate(dayjs(invoice.sentAt).add(invoice.dueDays || 14, 'day').format('YYYY-MM-DD')) : '-'}</Descriptions.Item>
        <Descriptions.Item label="Bezahlt am">{formatDate(invoice.payedAt)}</Descriptions.Item>
        <Descriptions.Item label="Status"><Tag color={status.color}>{status.label}</Tag></Descriptions.Item>
        {invoice.reverseCharge && <Descriptions.Item label="Reverse Charge" span={2}>Ja</Descriptions.Item>}
        {invoice.note && <Descriptions.Item label="Notiz" span={2}>{invoice.note}</Descriptions.Item>}
      </Descriptions>

      {projectGroups.map((group, i) => (
        <div key={i} style={{ marginBottom: 24 }}>
          <Title level={5}>{group.projectName}</Title>
          <TaskTable
            tasks={group.tasks}
            mode="invoice"
            showSummary={projectGroups.length > 1}
          />
        </div>
      ))}

      <Divider />
      <div style={{ textAlign: 'right', maxWidth: 300, marginLeft: 'auto' }}>
        {!invoice.reverseCharge && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong>Netto:</Text><Text>{formatCurrency(totals.cost)}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong>20% USt:</Text><Text>{formatCurrency(totals.tax)}</Text>
            </div>
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 'bold' }}>
          <Text strong>Gesamt:</Text><Text strong>{formatCurrency(totals.total)}</Text>
        </div>
      </div>

      {/* Edit Drawer */}
      <Drawer title="Rechnung bearbeiten" open={editDrawer} onClose={() => setEditDrawer(false)} width={520}>
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item name="number" label="Nummer"><Input /></Form.Item>
          <Form.Item name="sentAt" label="Rechnungsdatum"><DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" /></Form.Item>
          <Form.Item name="dueDays" label="Zahlungsziel (Tage)"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="payedAt" label="Bezahlt am"><DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" /></Form.Item>
          <Form.Item name="showHours" label="Stunden anzeigen" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="showDate" label="Datum anzeigen" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="reverseCharge" label="Reverse Charge" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="note" label="Notiz"><Input.TextArea rows={3} /></Form.Item>
          <Button type="primary" htmlType="submit" loading={updateInvoice.isPending}>Speichern</Button>
        </Form>
      </Drawer>
    </div>
  );
}
