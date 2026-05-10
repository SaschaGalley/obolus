import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Input, Dropdown, Avatar, Drawer, Button, Grid } from 'antd';
import {
  DashboardOutlined, TeamOutlined, ProjectOutlined, FileTextOutlined,
  WalletOutlined, BarChartOutlined, LogoutOutlined, UserOutlined,
  SearchOutlined, MenuOutlined, BankOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const SIDEBAR_BG = '#1e293b';

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/clients', icon: <TeamOutlined />, label: 'Kunden' },
  { key: '/projects', icon: <ProjectOutlined />, label: 'Projekte' },
  { key: '/invoices', icon: <FileTextOutlined />, label: 'Rechnungen' },
  { key: '/expenses', icon: <WalletOutlined />, label: 'Ausgaben' },
  { key: '/accounting', icon: <BankOutlined />, label: 'Buchhaltung' },
  { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

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

  const handleNav = (key: string) => {
    navigate(key);
    setMobileOpen(false);
  };

  const isCollapsedDesktop = collapsed && !isMobile;

  const sidebarLogo = (
    <div style={{
      height: 64,
      display: 'flex',
      alignItems: 'center',
      padding: isCollapsedDesktop ? 0 : '0 20px',
      justifyContent: isCollapsedDesktop ? 'center' : 'flex-start',
      fontWeight: 800,
      fontSize: isCollapsedDesktop ? 20 : 22,
      letterSpacing: '0.07em',
      color: '#fff',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      userSelect: 'none' as const,
      flexShrink: 0,
    }}>
      {isCollapsedDesktop ? 'O' : 'Obulus'}
    </div>
  );

  const sidebarMenu = (
    <Menu
      mode="inline"
      theme="dark"
      selectedKeys={[selectedKey]}
      items={menuItems}
      onClick={({ key }) => handleNav(key)}
      style={{ background: 'transparent', border: 'none', marginTop: 8 }}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={220}
          className="app-sider"
          style={{
            background: SIDEBAR_BG,
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'hidden auto',
            alignSelf: 'flex-start',
          }}
        >
          {sidebarLogo}
          {sidebarMenu}
        </Sider>
      )}

      {/* Mobile navigation drawer */}
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        placement="left"
        width={240}
        styles={{
          body: { padding: 0, background: SIDEBAR_BG, display: 'flex', flexDirection: 'column' },
          header: { display: 'none' },
        }}
        maskClosable
      >
        {sidebarLogo}
        {sidebarMenu}
      </Drawer>

      <Layout>
        <Header style={{
          padding: '0 20px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
          boxShadow: '0 1px 0 #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 99,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: 18 }} />}
                onClick={() => setMobileOpen(true)}
                style={{ color: '#64748b' }}
              />
            )}
            <Input
              placeholder="Suche..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="filled"
              allowClear
              style={{ maxWidth: 340 }}
            />
          </div>

          <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar
                size={34}
                style={{ background: '#0ea5e9', fontSize: 14, fontWeight: 700, flexShrink: 0 }}
              >
                {user?.name?.[0]?.toUpperCase() ?? <UserOutlined />}
              </Avatar>
              {!isMobile && (
                <span style={{
                  fontWeight: 500,
                  color: '#374151',
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {user?.name}
                </span>
              )}
            </div>
          </Dropdown>
        </Header>

        <Content style={{ padding: isMobile ? 12 : 24, background: '#f8fafc' }}>
          <div style={{
            padding: isMobile ? 16 : 24,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            minHeight: 'calc(100vh - 112px)',
          }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
