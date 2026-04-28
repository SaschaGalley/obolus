import { useState } from 'react';
import { Typography, Spin } from 'antd';
import { useInvoices } from '../../hooks/useApi';
import InvoiceTable from '../../components/invoices/InvoiceTable';

const { Title } = Typography;

export default function InvoicesListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useInvoices(page);

  if (isLoading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 100 }} />;

  const invoices = data?.data || [];
  const total = data?.total || 0;

  return (
    <div>
      <Title level={3}>Rechnungen</Title>
      <InvoiceTable
        invoices={invoices}
        pagination={{
          current: page,
          pageSize: 20,
          total,
          showSizeChanger: false,
          showTotal: (t) => `${t} Rechnungen`,
          onChange: (p) => setPage(p),
        }}
        size="middle"
      />
    </div>
  );
}
