import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Receipt, Target, TrendingUp, ShieldCheck,
  RefreshCw, ArrowLeft, Activity, Globe, Wallet
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getAdminStats, getAdminUsers, getAdminActivity } from '../lib/api';
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activity'>('overview');

  const isAdmin = profile?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!isAdmin) { navigate('/dashboard', { replace: true }); return; }
    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, u, a] = await Promise.all([
        getAdminStats(), getAdminUsers(), getAdminActivity()
      ]);
      setStats(s); setUsers(u); setActivity(a);
    } catch { /* silently fail if server not available */ }
    setLoading(false);
  };

  if (!isAdmin) return null;

  const formatAmount = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `$${(n / 1_000).toFixed(1)}k`
    : `$${n.toFixed(0)}`;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 leading-none">Admin Dashboard</h1>
                <p className="text-[10px] text-gray-400 leading-tight">Vexpense Control Panel</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
            <button
              onClick={loadData}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <RefreshCw className={clsx('w-4 h-4 text-gray-500', loading && 'animate-spin')} />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
              <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white">A</div>
              <span className="hidden sm:block text-xs font-medium text-gray-700">Admin</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
          {(['overview', 'users', 'activity'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
                activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl skeleton" />
                ))}
              </div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Users}      label="Total Users"     value={stats.totalUsers}      sub={`+${stats.newUsersThisMonth} this month`} color="bg-brand-600" />
                  <StatCard icon={Receipt}    label="Total Expenses"  value={stats.totalExpenses}   sub={`${stats.expensesThisMonth} this month`}  color="bg-blue-500" />
                  <StatCard icon={TrendingUp} label="Amount Tracked"  value={formatAmount(stats.totalAmountTracked)} color="bg-emerald-500" />
                  <StatCard icon={Target}     label="Goals Created"   value={stats.totalGoals}      color="bg-amber-500" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatCard icon={Wallet}    label="Budgets Set"     value={stats.totalBudgets}    color="bg-purple-500" />
                  <StatCard icon={Activity}  label="New Users / Mo"  value={stats.newUsersThisMonth} color="bg-pink-500" />
                  <StatCard icon={Globe}     label="Avg Spend / User"
                    value={stats.totalUsers > 0 ? formatAmount(stats.totalAmountTracked / stats.totalUsers) : '$0'}
                    color="bg-cyan-500"
                  />
                </div>

                {/* Summary */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Platform Summary</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Registered users', value: stats.totalUsers },
                      { label: 'Total expenses logged', value: stats.totalExpenses },
                      { label: 'Active savings goals', value: stats.totalGoals },
                      { label: 'Budget rules set', value: stats.totalBudgets },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-600">{label}</span>
                        <span className="text-sm font-semibold text-gray-900">{value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Could not load stats — is the server running?</p>
              </div>
            )}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === 'users' && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">All Users ({users.length})</h3>
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
                      <tr className="border-b border-gray-50">
                        <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">User</th>
                        <th className="text-left text-xs font-medium text-gray-500 px-3 py-3 hidden sm:table-cell">Country</th>
                        <th className="text-right text-xs font-medium text-gray-500 px-3 py-3">Expenses</th>
                        <th className="text-right text-xs font-medium text-gray-500 px-3 py-3 hidden md:table-cell">Total Spent</th>
                        <th className="text-right text-xs font-medium text-gray-500 px-3 py-3 hidden lg:table-cell">Goals</th>
                        <th className="text-right text-xs font-medium text-gray-500 px-5 py-3 hidden lg:table-cell">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700 flex-shrink-0">
                                {(u.full_name || u.email || '?')[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate">{u.full_name || '—'}</p>
                                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                              </div>
                              {u.email === ADMIN_EMAIL && (
                                <span className="flex-shrink-0 px-1.5 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-semibold rounded-full">Admin</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 hidden sm:table-cell">
                            <span className="text-xs text-gray-600">{u.country_name || '—'}</span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="font-medium text-gray-900">{u.expenseCount}</span>
                          </td>
                          <td className="px-3 py-3 text-right hidden md:table-cell">
                            <span className="text-xs font-medium text-gray-700">
                              {u.currency} {u.totalSpent.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right hidden lg:table-cell">
                            <span className="text-gray-600">{u.goalCount}</span>
                          </td>
                          <td className="px-5 py-3 text-right hidden lg:table-cell">
                            <span className="text-xs text-gray-400">{formatDate(u.created_at)}</span>
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

        {/* ── ACTIVITY TAB ── */}
        {activeTab === 'activity' && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h3 className="text-sm font-semibold text-gray-900">Recent Expenses (Platform-wide)</h3>
              </div>
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(8)].map((_, i) => <div key={i} className="h-12 skeleton rounded-xl" />)}
                </div>
              ) : activity.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No activity yet</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {activity.map(item => (
                    <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Receipt className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.description || 'Unnamed expense'}</p>
                          <p className="text-xs text-gray-400">{item.profiles?.full_name ?? 'Unknown user'} · {formatDate(item.date)}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 flex-shrink-0 ml-3">
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
