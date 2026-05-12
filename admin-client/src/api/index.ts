import type {
  Admin,
  KpiOverview,
  ChartsResponse,
  PagedUsers,
  UserDetail,
  PagedTransactions,
  AiStats,
  AiLog,
  PagedAiLogs,
  AdminNotification,
  SystemHealth,
  ErrorEntry,
  PlatformSettings,
  AdminUser,
  AuditLogEntry,
} from '../types';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001';
const PREFIX = '/api/admin/v2';

function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${PREFIX}${path}`, { ...init, headers });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      msg = data.error ?? msg;
    } catch {
      /* ignore */
    }
    if (res.status === 401) {
      localStorage.removeItem('admin_token');
    }
    throw new ApiError(msg, res.status);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export const adminApi = {
  // auth
  login(email: string, password: string) {
    return request<{ token: string; admin: Admin }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  me() {
    return request<{ admin: Admin }>('/auth/me');
  },

  // stats
  overview() {
    return request<KpiOverview>('/stats/overview');
  },
  charts() {
    return request<ChartsResponse>('/stats/charts');
  },

  // users
  users(params: { search?: string; page?: number; limit?: number } = {}) {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return request<PagedUsers>(`/users${qs ? `?${qs}` : ''}`);
  },
  user(id: string) {
    return request<UserDetail>(`/users/${id}`);
  },
  updateUserStatus(id: string, status: string) {
    return request<{ user: unknown }>(`/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
  deleteUser(id: string) {
    return request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' });
  },
  exportUsers() {
    return request<{ users: unknown[]; exported_at: string }>('/users/export');
  },

  // transactions
  transactions(params: {
    page?: number;
    limit?: number;
    search?: string;
    flagged?: boolean;
    minAmount?: number;
  } = {}) {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.search) q.set('search', params.search);
    if (params.flagged) q.set('flagged', 'true');
    if (params.minAmount) q.set('minAmount', String(params.minAmount));
    const qs = q.toString();
    return request<PagedTransactions>(`/transactions${qs ? `?${qs}` : ''}`);
  },
  flagTransaction(id: string) {
    return request<{ id: string; flagged: boolean }>(`/transactions/${id}/flag`, {
      method: 'PUT',
    });
  },
  transactionCharts() {
    return request<{
      daily: { date: string; count: number; volume: number }[];
      transactionCount: { date: string; value: number }[];
      volume: { date: string; value: number }[];
      distribution: { name: string; value: number }[];
    }>('/transactions/charts');
  },

  // ai
  aiStats() {
    return request<AiStats>('/ai/stats');
  },
  aiLogs(params: { page?: number; limit?: number } = {}) {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return request<PagedAiLogs>(`/ai/logs${qs ? `?${qs}` : ''}`);
  },
  aiCharts() {
    return request<{
      daily: { date: string; value: number }[];
      tokens: { date: string; value: number }[];
      cost: { date: string; value: number }[];
    }>('/ai/charts');
  },

  // notifications
  notifications() {
    return request<{ notifications: AdminNotification[]; total: number }>('/notifications');
  },
  sendNotification(message: string, severity = 'info', type = 'info') {
    return request<{ notification: AdminNotification }>('/notifications/send', {
      method: 'POST',
      body: JSON.stringify({ message, severity, type }),
    });
  },
  markRead(id: string) {
    return request<{ notification: AdminNotification }>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  // system
  health() {
    return request<SystemHealth>('/system/health');
  },
  errors() {
    return request<{ errors: ErrorEntry[]; total: number }>('/system/errors');
  },
  resolveError(id: string) {
    return request<{ error: ErrorEntry }>(`/system/errors/${id}/resolve`, { method: 'PUT' });
  },

  // settings
  settings() {
    return request<{ settings: PlatformSettings }>('/settings');
  },
  updateSettings(patch: Partial<PlatformSettings>) {
    return request<{ settings: PlatformSettings }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
  },
  admins() {
    return request<{ admins: AdminUser[] }>('/settings/admins');
  },
  createAdmin(input: { name: string; email: string; password: string; role: string }) {
    return request<{ admin: AdminUser }>('/settings/admins', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  toggleAdminStatus(id: string) {
    return request<{ admin: AdminUser }>(`/settings/admins/${id}/status`, { method: 'PUT' });
  },
  auditLog(params: { page?: number; limit?: number } = {}) {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return request<{ entries: AuditLogEntry[]; total: number; page: number; pages: number }>(
      `/settings/audit-log${qs ? `?${qs}` : ''}`
    );
  },
};

export { API_BASE };
