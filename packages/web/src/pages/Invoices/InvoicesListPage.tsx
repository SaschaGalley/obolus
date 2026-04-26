import { Typography, Spin } from 'antd';
import dayjs from 'dayjs';
import { useInvoices } from '../../hooks/useApi';
import InvoiceTable from '../../components/invoices/InvoiceTable';

const { Title } = Typography;

export default function InvoicesListPage() {
  const { data: invoices = [], isLoading } = useInvoices();

  if (isLoading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 100 }} />;

  const sorted = [...invoices].sort((a: any, b: any) => {
    const da = a.sentAt ? dayjs(a.sentAt).unix() : 0;
    const db = b.sentAt ? dayjs(b.sentAt).unix() : 0;
    return db - da;
  });

  return (
    <div>
      <Title level={3}>Rechnungen</Title>
      <InvoiceTable
        invoices={sorted}
        pagination={{ pageSize: 25, showSizeChanger: true }}
        size="middle"
      />
    </div>
  );
}
