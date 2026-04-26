import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App as AntApp } from 'antd';
import deDE from 'antd/locale/de_DE';
import dayjs from 'dayjs';
import 'dayjs/locale/de';

import { useAuthStore } from './stores/authStore';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/Auth/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ClientsListPage from './pages/Clients/ClientsListPage';
import ClientDetailPage from './pages/Clients/ClientDetailPage';
import ProjectsListPage from './pages/Projects/ProjectsListPage';
import ProjectDetailPage from './pages/Projects/ProjectDetailPage';
import InvoicesListPage from './pages/Invoices/InvoicesListPage';
import InvoiceDetailPage from './pages/Invoices/InvoiceDetailPage';
import ExpensesListPage from './pages/Expenses/ExpensesListPage';
import ReportsPage from './pages/Reports/ReportsPage';
import PayingHabitPage from './pages/Reports/PayingHabitPage';

dayjs.locale('de');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ConfigProvider locale={deDE} theme={{
      token: {
        colorPrimary: '#1677ff',
        borderRadius: 6,
      },
    }}>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="clients" element={<ClientsListPage />} />
                <Route path="clients/:id" element={<ClientDetailPage />} />
                <Route path="projects" element={<ProjectsListPage />} />
                <Route path="projects/:id" element={<ProjectDetailPage />} />
                <Route path="invoices" element={<InvoicesListPage />} />
                <Route path="invoices/:id" element={<InvoiceDetailPage />} />
                <Route path="expenses" element={<ExpensesListPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="reports/paying-habit" element={<PayingHabitPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  );
}
