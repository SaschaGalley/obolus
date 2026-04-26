import { useNavigate } from 'react-router-dom';
import { Typography, Card, Row, Col } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function ReportsPage() {
  const navigate = useNavigate();

  return (
    <div>
      <Title level={3}>Reports</Title>
      <Row gutter={16}>
        <Col span={8}>
          <Card
            hoverable
            onClick={() => navigate('/reports/paying-habit')}
            style={{ textAlign: 'center' }}
          >
            <BarChartOutlined style={{ fontSize: 48, color: '#1677ff', marginBottom: 16 }} />
            <Title level={4}>Zahlungsverhalten</Title>
            <Text type="secondary">Analyse des Zahlungsverhaltens Ihrer Kunden</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
