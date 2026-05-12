export interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'moderator';
}

export interface KpiOverview {
  totalUsers: number;
  activeUsers: number;
  totalExpenses: number;
  totalVolume: number;
  totalAiConversations: number;
  totalGoals: number;
  totalBudgets: number;
  aiCostEstimate: string;
  systemStatus: string;
  timestamp: string;
}

export interface SeriesPoint {
  date: string;
  value: number;
}

export interface NamedValue {
  name: string;
  value: number;
}

export interface ChartsResponse {
  timeseries: { date: string; users: number; expenses: number; volume: number; ai: number }[];
  userGrowth: SeriesPoint[];
  expenseVolume: SeriesPoint[];
  aiUsage: SeriesPoint[];
  transactionCount: SeriesPoint[];
  categoryBreakdown: NamedValue[];
}

export interface User {
  id: string;
  email: string | null;
  full_name: string | null;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

export interface PagedUsers {
  users: User[];
  total: number;
  page: number;
  pages: number;
}

export interface UserDetail {
  user: User;
  expenseCount: number;
  goalCount: number;
}

export interface Transaction {
  id: string;
  user_id_anon: string;
  amount: number;
  description: string | null;
  category: string;
  created_at: string;
  flagged: boolean;
}

export interface PagedTransactions {
  transactions: Transaction[];
  total: number;
  page: number;
  pages: number;
}

export interface AiStats {
  totalConversations: number;
  todayConversations: number;
  estimatedTokens: number;
  estimatedCost: string;
  avgCostPerMessage: number;
}

export interface AiLog {
  id: string;
  user_id_anon: string;
  message: string | null;
  response_preview: string;
  created_at: string;
}

export interface PagedAiLogs {
  logs: AiLog[];
  total: number;
  page: number;
  pages: number;
}

export interface AdminNotification {
  id: string;
  admin_id: string | null;
  type: string;
  message: string;
  is_read: boolean;
  severity: string;
  created_at: string;
}

export interface SystemHealth {
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers?: number;
  };
  status: string;
  timestamp: string;
  node: string;
  platform: string;
}

export interface ErrorEntry {
  id: string;
  message: string;
  level: 'error' | 'warning' | 'info';
  source: string;
  resolved: boolean;
  created_at: string;
}

export interface PlatformSettings {
  maintenance_mode: boolean;
  default_currency: string;
  ai_rate_limit: number;
  flag_threshold: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'moderator';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string | null;
  admin_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  ip_address: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}
