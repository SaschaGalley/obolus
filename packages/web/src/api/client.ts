import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8551';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ---- API functions ----

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ token: string; user: { id: number; name: string; email: string } }>('/auth/login', { email, password }),
  refresh: () =>
    apiClient.get<{ token: string; user: { id: number; name: string; email: string } }>('/auth/refresh'),
};

// Clients
export const clientsApi = {
  findAll: (show = 'active', page = 1, limit = 20) =>
    apiClient.get('/clients', { params: { show, page, limit } }),
  findOne: (id: number) =>
    apiClient.get(`/clients/${id}`),
  create: (data: any) =>
    apiClient.post('/clients', data),
  update: (id: number, data: any) =>
    apiClient.patch(`/clients/${id}`, data),
  remove: (id: number) =>
    apiClient.delete(`/clients/${id}`),
  uploadPicture: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post(`/clients/${id}/picture`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Projects
export const projectsApi = {
  findAll: (params?: { show?: string; clientId?: number; page?: number; limit?: number }) =>
    apiClient.get('/projects', { params }),
  findOne: (id: number) =>
    apiClient.get(`/projects/${id}`),
  create: (data: any) =>
    apiClient.post('/projects', data),
  update: (id: number, data: any) =>
    apiClient.patch(`/projects/${id}`, data),
  remove: (id: number) =>
    apiClient.delete(`/projects/${id}`),
  downloadQuote: (id: number, params?: { title?: string; showHours?: boolean }) =>
    apiClient.get(`/projects/${id}/quote`, { params, responseType: 'blob' }),
  uploadPicture: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post(`/projects/${id}/picture`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Tasks
export const tasksApi = {
  findAll: (params?: { projectId?: number; invoiceId?: number; open?: boolean }) =>
    apiClient.get('/tasks', { params }),
  findOne: (id: number) =>
    apiClient.get(`/tasks/${id}`),
  create: (data: any) =>
    apiClient.post('/tasks', data),
  update: (id: number, data: any) =>
    apiClient.patch(`/tasks/${id}`, data),
  remove: (id: number) =>
    apiClient.delete(`/tasks/${id}`),
  reorder: (tasks: { id: number; order: number }[]) =>
    apiClient.post('/tasks/reorder', { tasks }),
};

// Sessions
export const sessionsApi = {
  findAll: (taskId?: number) =>
    apiClient.get('/sessions', { params: { taskId } }),
  create: (data: any) =>
    apiClient.post('/sessions', data),
  update: (id: number, data: any) =>
    apiClient.patch(`/sessions/${id}`, data),
  remove: (id: number) =>
    apiClient.delete(`/sessions/${id}`),
};

// Invoices
export const invoicesApi = {
  findAll: (page = 1, limit = 20, clientId?: number, projectId?: number) =>
    apiClient.get('/invoices', { params: { page, limit, ...(clientId ? { clientId } : {}), ...(projectId ? { projectId } : {}) } }),
  nextNumber: () =>
    apiClient.get<{ number: string }>('/invoices/next-number'),
  findOne: (id: number) =>
    apiClient.get(`/invoices/${id}`),
  create: (data: any) =>
    apiClient.post('/invoices', data),
  update: (id: number, data: any) =>
    apiClient.patch(`/invoices/${id}`, data),
  remove: (id: number) =>
    apiClient.delete(`/invoices/${id}`),
  downloadPdf: (id: number) =>
    apiClient.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
};

// Expenses
export const expensesApi = {
  findAll: () =>
    apiClient.get('/expenses'),
  create: (data: any) =>
    apiClient.post('/expenses', data),
  update: (id: number, data: any) =>
    apiClient.patch(`/expenses/${id}`, data),
  remove: (id: number) =>
    apiClient.delete(`/expenses/${id}`),
};

// Dashboard
export const dashboardApi = {
  getStats: (year?: number) =>
    apiClient.get('/dashboard', { params: { year } }),
};

// Accounting
export const accountingApi = {
  getOverview: (year?: number) =>
    apiClient.get('/accounting', { params: { year } }),
};

// Search
export const searchApi = {
  search: (query: string) =>
    apiClient.get('/search', { params: { query } }),
};

// Reports
export const reportsApi = {
  getPayingHabit: () =>
    apiClient.get('/reports/paying-habit'),
};

// Activities
export const activitiesApi = {
  forClient: (clientId: number, page = 1, limit = 50, types?: string[]) =>
    apiClient.get(`/activities/clients/${clientId}`, {
      params: { page, limit, ...(types ? { types: types.join(',') } : {}) },
    }),
};

// Images
export const imagesApi = {
  findAll: () =>
    apiClient.get('/images'),
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  remove: (id: number) =>
    apiClient.delete(`/images/${id}`),
};
