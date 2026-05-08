import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Space } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { authApi } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { data } = await authApi.login(values.email, values.password);
      setAuth(data.token, data.user);
      navigate('/dashboard');
    } catch {
      message.error('Login fehlgeschlagen. Bitte Zugangsdaten prüfen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0ea5e9 0%, #1e293b 100%)',
    }}>
      <Card style={{ width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', borderRadius: 16, border: 'none' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ margin: 0, letterSpacing: '0.05em' }}>Obulus</Title>
            <Text type="secondary">Zeit & Rechnungen</Text>
          </div>
          <Form layout="vertical" onFinish={onFinish} autoComplete="off">
            <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Bitte E-Mail eingeben' }]}>
              <Input prefix={<MailOutlined />} placeholder="E-Mail" size="large" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: 'Bitte Passwort eingeben' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Passwort" size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                Anmelden
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
