import { Tag, Tooltip } from 'antd';
import { CreditCardOutlined } from '@ant-design/icons';

/** Marks a movement that is not on the business account but was switched to obolus in Umsatz. */
export default function AccountTag({ account }: { account: string }) {
  return (
    <Tooltip title="Nicht über das Geschäftskonto bezahlt, in Umsatz für Obolus markiert">
      <Tag color="gold" icon={<CreditCardOutlined />}>{account || 'anderes Konto'}</Tag>
    </Tooltip>
  );
}
