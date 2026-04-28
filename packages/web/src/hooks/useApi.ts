import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  clientsApi,
  projectsApi,
  tasksApi,
  sessionsApi,
  invoicesApi,
  expensesApi,
  dashboardApi,
  accountingApi,
  searchApi,
  reportsApi,
  activitiesApi,
} from '../api/client';

// Clients
export function useClients(show = 'active', page = 1, limit = 20) {
  return useQuery({
    queryKey: ['clients', show, page, limit],
    queryFn: () => clientsApi.findAll(show, page, limit).then((r) => r.data),
  });
}

export function useClient(id: number) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientsApi.findOne(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => clientsApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => clientsApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => clientsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useUploadClientPicture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      clientsApi.uploadPicture(id, file).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

// Projects
export function useProjects(params?: { show?: string; clientId?: number; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => projectsApi.findAll(params).then((r) => r.data),
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectsApi.findOne(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => projectsApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => projectsApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUploadProjectPicture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      projectsApi.uploadPicture(id, file).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

// Tasks
export function useTasks(params?: { projectId?: number; invoiceId?: number; open?: boolean }) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => tasksApi.findAll(params).then((r) => r.data),
    enabled: !!(params?.projectId || params?.invoiceId),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => tasksApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => tasksApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tasksApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useReorderTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tasks: { id: number; order: number }[]) => tasksApi.reorder(tasks),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

// Sessions
export function useSessions(taskId?: number) {
  return useQuery({
    queryKey: ['sessions', taskId],
    queryFn: () => sessionsApi.findAll(taskId).then((r) => r.data),
    enabled: !!taskId,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => sessionsApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => sessionsApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => sessionsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

// Invoices
export function useInvoices(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['invoices', page, limit],
    queryFn: () => invoicesApi.findAll(page, limit).then((r) => r.data),
  });
}

export function useInvoice(id: number) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoicesApi.findOne(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => invoicesApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => invoicesApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => invoicesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// Expenses
export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesApi.findAll().then((r) => r.data),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => expensesApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => expensesApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => expensesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

// Dashboard & Accounting
export function useDashboard(year?: number) {
  return useQuery({
    queryKey: ['dashboard', year],
    queryFn: () => dashboardApi.getStats(year).then((r) => r.data),
  });
}

export function useAccounting(year?: number) {
  return useQuery({
    queryKey: ['accounting', year],
    queryFn: () => accountingApi.getOverview(year).then((r) => r.data),
  });
}

// Search
export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => searchApi.search(query).then((r) => r.data),
    enabled: query.length >= 3,
  });
}

// Activities
export function useClientActivities(clientId: number, page = 1, limit = 50, types?: string[]) {
  return useQuery({
    queryKey: ['activities', 'clients', clientId, page, limit, types],
    queryFn: () => activitiesApi.forClient(clientId, page, limit, types).then((r) => r.data),
    enabled: !!clientId,
  });
}

// Reports
export function usePayingHabit() {
  return useQuery({
    queryKey: ['reports', 'paying-habit'],
    queryFn: () => reportsApi.getPayingHabit().then((r) => r.data),
  });
}
