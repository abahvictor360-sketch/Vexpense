import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Receipt, Target, TrendingUp, ShieldCheck,
  RefreshCw, ArrowLeft, Activity, Globe, Wallet
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { clsx } from '../utils/clsx';

const ADMIN_EMAIL = 'abahvictor760@gmail.com';

interface AdminStats {
  totalUsers: number; totalExpenses: number; totalGoals: number;
  totalBudgets: number; totalAmountTracked: number;
  newUsersThisMonth: number; expensesThisMonth: number;
}

interface AdminUser {
  id: string; full_name: string; email: string; currency: string;
  country_name: string; monthly_income: number; created_at: string;
  expenseCount: number; totalSpent: number; goalCount: number;
}

interface ActivityItem {
  id: string; amount: number; description: string; date: string;
  created_at: string; user_id: string;
  profiles: { full_name: string; currency: string } | null;
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{sub}</p>}
        </div>
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { profile, loading: authLoading } = useAuthStore();
  const navigate    = useNavigate();

  const [stats,     setStats]     = useState<AdminStats | null>(null);
  const [users,     setUsers]     = useState<AdminUser[]>([]);
  const [activity,  setActivity]  = useState<ActivityItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activity'>('overview');

  const isAdmin = profile?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (authLoading) return;                                          // still resolving session
    if (profile && !isAdmin) { navigate('/dashboard', { replace: true }); return; }
    if (isAdmin) loadData();
  }, [isAdmin, profile, authLoading]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, usersRes, activityRes] = await Promise.all([
        supabase.rpc('admin_get_stats'),
        supabase.rpc('admin_get_users'),
        supabase.rpc('admin_get_activity'),
      ]);

      if (statsRes.error)    throw new Error(statsRes.error.message);
      if (usersRes.error)    throw new Error(usersRes.error.message);
      if (activityRes.error) throw new Error(activityRes.error.message);

      setStats(statsRes.data as AdminStats);
      setUsers((usersRes.data as AdminUser[]) ?? []);
      setActivity((activityRes.data as ActivityItem[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    }
    setLoading(false);
  };

  // Still resolving session
  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Profile confirmed missing — no profile row in DB
  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-6">
      <div className="text-center max-w-sm">
        <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
        <h2 className="font-bold text-gray-900 dark:text-white mb-2">Profile not found</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
          Your account has no profile row yet. Run this in the Supabase SQL editor:
        </p>
        <code className="block text-xs bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 p-3 rounded-xl text-left leading-relaxed">
          {"INSERT INTO profiles (id, email, full_name)\nSELECT id, email, email\nFROM auth.users\nWHERE email = 'abahvictor760@gmail.com'\nON CONFLICT (id) DO NOTHING;"}
        </code>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-sm text-brand-600 hover:underline">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );

  if (!isAdmin) return null;

  const fmtAmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000   ? `$${(n / 1_000).toFixed(1)}k`
    : `$${n.toFixed(0)}`;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Top bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-slate-400" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-none">Admin Dashboard</h1>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 leading-tight">Vexpense Control Panel</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
            <button
              onClick={loadData}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
            >
              <RefreshCw className={clsx('w-4 h-4 text-gray-500', loading && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1 w-fit mb-6">
          {(['overview', 'users', 'activity'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
                activeTab === t
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">⚠️ {error}</p>
            <p className="text-xs text-red-500 dark:text-red-500 mt-1">
              Make sure you've run the admin SQL functions in Supabase.
            </p>
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(7)].map((_, i) => <div key={i} className="h-24 rounded-2xl skeleton" />)}
              </div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Users}      label="Total Users"    value={stats.totalUsers}      sub={`+${stats.newUsersThisMonth} this month`} color="bg-brand-600" />
                  <StatCard icon={Receipt}    label="Total Expenses" value={stats.totalExpenses}   sub={`${stats.expensesThisMonth} this month`}  color="bg-blue-500" />
                  <StatCard icon={TrendingUp} label="Amount Tracked" value={fmtAmt(stats.totalAmountTracked)} color="bg-emerald-500" />
                  <StatCard icon={Target}     label="Goals Created"  value={stats.totalGoals}      color="bg-amber-500" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatCard icon={Wallet}   label="Budgets Set"    value={stats.totalBudgets} color="bg-purple-500" />
                  <StatCard icon={Activity} label="New Users / Mo" value={stats.newUsersThisMonth} color="bg-pink-500" />
                  <StatCard icon={Globe}    label="Avg Spend / User"
                    value={stats.totalUsers > 0 ? fmtAmt(stats.totalAmountTracked / stats.totalUsers) : '$0'}
                    color="bg-cyan-500"
                  />
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Platform Summary</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Registered users',      value: stats.totalUsers     },
                      { label: 'Total expenses logged',  value: stats.totalExpenses  },
                      { label: 'Active savings goals',   value: stats.totalGoals     },
                      { label: 'Budget rules set',       value: stats.totalBudgets   },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-700 last:border-0">
                        <span className="text-sm text-gray-600 dark:text-slate-400">{label}</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : !error ? (
              <div className="text-center py-16 text-gray-400">
                <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No data yet</p>
              </div>
            ) : null}
          </div>
        )}

        {/* ── USERS ── */}
        {activeTab === 'users' && (
          <div className="animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">All Users ({users.length})</h3>
              </div>
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No users yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-50 dark:border-slate-700">
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-slate-400 px-5 py-3">User</th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-slate-400 px-3 py-3 hidden sm:table-cell">Country</th>
                        <th className="text-right text-xs font-medium text-gray-500 dark:text-slate-400 px-3 py-3">Expenses</th>
                        <th className="text-right text-xs font-medium text-gray-500 dark:text-slate-400 px-3 py-3 hidden md:table-cell">Total Spent</th>
                        <th className="text-right text-xs font-medium text-gray-500 dark:text-slate-400 px-3 py-3 hidden lg:table-cell">Goals</th>
                        <th className="text-right text-xs font-medium text-gray-500 dark:text-slate-400 px-5 py-3 hidden lg:table-cell">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-300 flex-shrink-0">
                                {(u.full_name || u.email || '?')[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">{u.full_name || '—'}</p>
                                <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{u.email}</p>
                              </div>
                              {u.email === ADMIN_EMAIL && (
                                <span className="flex-shrink-0 px-1.5 py-0.5 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-[10px] font-semibold rounded-full">Admin</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 hidden sm:table-cell">
                            <span className="text-xs text-gray-600 dark:text-slate-400">{u.country_name || '—'}</span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="font-medium text-gray-900 dark:text-white">{u.expenseCount}</span>
                          </td>
                          <td className="px-3 py-3 text-right hidden md:table-cell">
                            <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
                              {u.currency} {Number(u.totalSpent).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right hidden lg:table-cell">
                            <span className="text-gray-600 dark:text-slate-400">{u.goalCount}</span>
                          </td>
                          <td className="px-5 py-3 text-right hidden lg:table-cell">
                            <span className="text-xs text-gray-400 dark:text-slate-500">{fmtDate(u.created_at)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ACTIVITY ── */}
        {activeTab === 'activity' && (
          <div className="animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Expenses (Platform-wide)</h3>
              </div>
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(8)].map((_, i) => <div key={i} className="h-12 skeleton rounded-xl" />)}
                </div>
              ) : activity.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No activity yet</div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-slate-700">
                  {activity.map(item => (
                    <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-slate-700/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                          <Receipt className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.description || 'Unnamed expense'}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500">{item.profiles?.full_name ?? 'Unknown'} · {fmtDate(item.date)}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white flex-shrink-0 ml-3">
                        {item.profiles?.currency ?? ''} {Number(item.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
