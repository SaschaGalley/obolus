import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Typography, Descriptions, Tag, Button, Input, InputNumber,
  Switch, Spin, Empty, Breadcrumb, message, Divider, Space,
} from 'antd';
import SmartDatePicker from '../../components/SmartDatePicker';
import { FilePdfOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useInvoice, useUpdateInvoice, useUpdateTask } from '../../hooks/useApi';
import { invoicesApi } from '../../api/client';
import { formatCurrency, formatDate, formatDuration, getInvoiceStatus } from '../../utils/format';
import { downloadBlob, safeFilename } from '../../utils/download';
import TaskTable from '../../components/tasks/TaskTable';
import { sumTasks } from '../../components/tasks/taskCalculations';

const { Title, Text } = Typography;

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = Number(id);
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const updateInvoice = useUpdateInvoice();
  const updateTask = useUpdateTask();
  const [pdfLoading, setPdfLoading] = useState(false);

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

  const save = (patch: Record<string, any>) => {
    updateInvoice.mutate({ id: invoiceId, ...patch });
  };

  const handleTaskUpdate = async (taskId: number, patch: Record<string, any>) => {
    try {
      await updateTask.mutateAsync({ id: taskId, ...patch });
    } catch { message.error('Fehler beim Speichern'); }
  };

  const handlePdf = async () => {
    if (pdfLoading) return;
    setPdfLoading(true);
    try {
      const { data } = await invoicesApi.downloadPdf(invoiceId);
      downloadBlob(data, `${safeFilename(`Rechnung ${invoice.number}`)}.pdf`);
    } catch {
      message.error('PDF konnte nicht geladen werden');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ title: <Link to="/invoices">Rechnungen</Link> }, { title: `Rechnung ${invoice.number}` }]} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Rechnung {invoice.number}</Title>
          <Text type="secondary">{invoice.clientName}</Text>
        </div>
        <Button icon={<FilePdfOutlined />} type="primary" loading={pdfLoading} onClick={handlePdf}>PDF</Button>
      </div>

      <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Nummer">
          <Input
            key={invoice.number}
            defaultValue={invoice.number}
            variant="borderless"
            style={{ padding: 0 }}
            onBlur={(e) => { if (e.target.value !== invoice.number) save({ number: e.target.value }); }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={status.color}>{status.label}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Rechnungsdatum">
          <SmartDatePicker
            key={invoice.sentAt}
            defaultValue={invoice.sentAt ? dayjs(invoice.sentAt) : null}
            format="DD.MM.YYYY"
            variant="borderless"
            style={{ padding: 0 }}
            onChange={(d) => save({ sentAt: d ? (d as import('dayjs').Dayjs).format('YYYY-MM-DD') : null })}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Zahlungsziel">
          <Space size={8} style={{ width: '100%' }}>
            <Switch
              size="small"
              checked={invoice.dueDays != null}
              onChange={(checked) => save({ dueDays: checked ? 14 : null })}
            />
            {invoice.dueDays != null ? (
              <InputNumber
                key={`dd-${invoice.dueDays}`}
                defaultValue={invoice.dueDays}
                min={0}
                variant="borderless"
                addonAfter="Tage"
                style={{ width: 160, padding: 0 }}
                onBlur={(e) => {
                  const v = parseInt(e.target.value);
                  if (!isNaN(v) && v !== invoice.dueDays) save({ dueDays: v });
                }}
              />
            ) : (
              <Text type="secondary" style={{ fontSize: 13 }}>kein fixes Ziel · Überweisung nach Erhalt</Text>
            )}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Bezahlt am">
          <SmartDatePicker
            key={invoice.payedAt ?? 'null'}
            defaultValue={invoice.payedAt ? dayjs(invoice.payedAt) : null}
            format="DD.MM.YYYY"
            variant="borderless"
            style={{ padding: 0 }}
            onChange={(d) => save({ payedAt: d ? (d as import('dayjs').Dayjs).format('YYYY-MM-DD') : null })}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Fällig am">
          {invoice.sentAt && invoice.dueDays != null
            ? formatDate(dayjs(invoice.sentAt).add(invoice.dueDays, 'day').format('YYYY-MM-DD'))
            : '–'}
        </Descriptions.Item>
        <Descriptions.Item label="Stunden anzeigen">
          <Switch checked={invoice.showHours} onChange={(v) => save({ showHours: v })} />
        </Descriptions.Item>
        <Descriptions.Item label="Datum anzeigen">
          <Switch checked={invoice.showDate} onChange={(v) => save({ showDate: v })} />
        </Descriptions.Item>
        <Descriptions.Item label="Reverse Charge">
          <Switch checked={invoice.reverseCharge} onChange={(v) => save({ reverseCharge: v })} />
        </Descriptions.Item>
        <Descriptions.Item label="Stundensatz">
          <InputNumber
            key={`rate-${invoice.hourlyRate ?? 'none'}`}
            defaultValue={invoice.hourlyRate != null ? Number(invoice.hourlyRate) : undefined}
            min={0}
            step={5}
            addonAfter="€/h"
            placeholder="gemischt"
            variant="borderless"
            style={{ width: '100%' }}
            onBlur={(e) => {
              const v = parseFloat(e.target.value);
              const cur = invoice.hourlyRate != null ? Number(invoice.hourlyRate) : NaN;
              // Setzt den Satz auf alle stundenbasierten Tasks der Rechnung.
              if (!isNaN(v) && v !== cur) save({ hourlyRate: v });
            }}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Notiz" span={invoice.reverseCharge ? 1 : 2}>
          <Input
            key={invoice.note}
            defaultValue={invoice.note || ''}
            variant="borderless"
            style={{ padding: 0 }}
            onBlur={(e) => { if (e.target.value !== (invoice.note || '')) save({ note: e.target.value || null }); }}
          />
        </Descriptions.Item>
      </Descriptions>

      {projectGroups.map((group, i) => (
        <div key={i} style={{ marginBottom: 24 }}>
          <Title level={5}>{group.projectName}</Title>
          <TaskTable
            tasks={group.tasks}
            mode="invoice"
            onUpdate={handleTaskUpdate}
            showSummary={projectGroups.length > 1}
          />
        </div>
      ))}

      <Divider />
      <div style={{ textAlign: 'right', maxWidth: 300, marginLeft: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text strong>Stunden gesamt:</Text><Text>{formatDuration(totals.duration)}</Text>
        </div>
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
    </div>
  );
}
