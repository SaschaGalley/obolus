import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Input, Dropdown, Avatar, theme } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  ProjectOutlined,
  FileTextOutlined,
  WalletOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useSearch } from '../../hooks/useApi';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/clients', icon: <TeamOutlined />, label: 'Kunden' },
  { key: '/projects', icon: <ProjectOutlined />, label: 'Projekte' },
  { key: '/invoices', icon: <FileTextOutlined />, label: 'Rechnungen' },
  { key: '/expenses', icon: <WalletOutlined />, label: 'Ausgaben' },
  { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  const selectedKey = '/' + location.pathname.split('/')[1];

  const userMenu = {
    items: [
      { key: 'logout', icon: <LogoutOutlined />, label: 'Abmelden', danger: true },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') {
        logout();
        navigate('/login');
      }
    },
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        style={{ borderRight: '1px solid #f0f0f0' }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: collapsed ? 18 : 22,
          letterSpacing: '0.05em',
          color: '#1677ff',
        }}>
          {collapsed ? 'O' : 'Obulus'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 24px',
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <Input
            placeholder="Suche..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: 400 }}
            allowClear
          />
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} size="small" />
              <span>{user?.name}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24 }}>
          <div style={{
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 360,
          }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
