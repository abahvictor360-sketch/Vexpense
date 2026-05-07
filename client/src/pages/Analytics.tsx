import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import { useExpenseStore } from '../store/expenseStore';
import { useBudgetStore } from '../store/budgetStore';
import { useCategoryStore } from '../store/categoryStore';
import { formatCurrency, calculateBreakdown } from '../utils';
import { getReport } from '../lib/api';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SkeletonCard } from '../components/ui/SkeletonCard';
import { Sparkles, TrendingUp, TrendingDown, Flame } from 'lucide-react';
import { clsx } from '../utils/clsx';

type PeriodKey = 'this_month' | 'last_month' | '3_months' | '6_months';

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: 'this_month',  label: 'This Month'   },
  { key: 'last_month',  label: 'Last Month'   },
  { key: '3_months',    label: '3 Months'     },
  { key: '6_months',    label: '6 Months'     },
];

const BUDGET_STATUS = (pct: number) =>
  pct >= 85 ? { bg: 'bg-red-50', text: 'text-red-600', dot: '#ef4444' }
  : pct >= 60 ? { bg: 'bg-amber-50', text: 'text-amber-600', dot: '#f59e0b' }
  : { bg: 'bg-green-50', text: 'text-green-600', dot: '#10b981' };

export default function Analytics() {
  const { profile } = useAuthStore();
  const expenses = useExpenseStore(s => s.expenses);
  const budgets = useBudgetStore(s => s.budgets);
  const categories = useCategoryStore(s => s.categories);
  const currency = profile?.currency ?? 'USD';

  const [period, setPeriod] = useState<PeriodKey>('this_month');
  const [report, setReport] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Date range for selected period
  const { start, end } = useMemo(() => {
    const now = new Date();
    if (period === 'this_month') return { start: startOfMonth(now).toISOString().split('T')[0], end: endOfMonth(now).toISOString().split('T')[0] };
    if (period === 'last_month') {
      const last = subMonths(now, 1);
      return { start: startOfMonth(last).toISOString().split('T')[0], end: endOfMonth(last).toISOString().split('T')[0] };
    }
    const months = period === '3_months' ? 3 : 6;
    return { start: subMonths(now, months).toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
  }, [period]);

  const periodExpenses = useMemo(() => expenses.filter(e => e.date >= start && e.date <= end), [expenses, start, end]);

  // Daily bar chart data
  const dailyData = useMemo(() => {
    if (period === 'this_month' || period === 'last_month') {
      const startDate = parseISO(start);
      const endDate = parseISO(end);
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      return days.map(d => {
        const ds = d.toISOString().split('T')[0];
        const amt = periodExpenses.filter(e => e.date === ds).reduce((s, e) => s + Number(e.amount), 0);
        return { day: format(d, 'd'), amount: amt };
      });
    }
    // Group by month for wider ranges
    const monthMap: Record<string, number> = {};
    periodExpenses.forEach(e => {
      const m = format(parseISO(e.date), 'MMM');
      monthMap[m] = (monthMap[m] ?? 0) + Number(e.amount);
    });
    return Object.entries(monthMap).map(([day, amount]) => ({ day, amount }));
  }, [periodExpenses, start, end, period]);

  // Category donut data
  const breakdown = useMemo(() => calculateBreakdown(periodExpenses, categories), [periodExpenses, categories]);

  // Monthly trend (last 6 months)
  const trendData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const m = subMonths(new Date(), 5 - i);
      const ms = startOfMonth(m).toISOString().split('T')[0];
      const me = endOfMonth(m).toISOString().split('T')[0];
      const spent = expenses.filter(e => e.date >= ms && e.date <= me).reduce((s, e) => s + Number(e.amount), 0);
      const budget = budgets.reduce((s, b) => s + Number(b.amount), 0);
      return { month: format(m, 'MMM'), spent, budget };
    });
  }, [expenses, budgets]);

  // Top 3 highlights
  const highlights = useMemo(() => {
    const sorted = [...breakdown];
    const biggest = sorted[0];
    const mostTxn = [...breakdown].sort((a, b) => b.count - a.count)[0];
    const lastPeriod = (() => {
      const prevStart = period === 'this_month'
        ? startOfMonth(subMonths(new Date(), 1)).toISOString().split('T')[0]
        : subMonths(parseISO(start), 1).toISOString().split('T')[0];
      const prevEnd = period === 'this_month'
        ? endOfMonth(subMonths(new Date(), 1)).toISOString().split('T')[0]
        : start;
      return expenses.filter(e => e.date >= prevStart && e.date <= prevEnd);
    })();
    const fastestGrowing = breakdown.map(b => {
      const prevAmt = lastPeriod.filter(e => e.category_id === b.category.id).reduce((s, e) => s + Number(e.amount), 0);
      const growth = prevAmt > 0 ? ((b.amount - prevAmt) / prevAmt) * 100 : 0;
      return { ...b, growth };
    }).sort((a, b) => b.growth - a.growth)[0];
    return { biggest, mostTxn, fastestGrowing };
  }, [breakdown, expenses]);

  const loadReport = async () => {
    setReportLoading(true);
    try {
      const { report } = await getReport();
      setReport(report);
    } catch {
      setReport('AI report is unavailable right now. Try again in a moment.');
    } finally {
      setReportLoading(false);
    }
  };

  const totalSpent = periodExpenses.reduce((s, e) => s + Number(e.amount), 0);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (!active || !payload?.[0]) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-card text-xs">
        <p className="text-gray-500 mb-0.5">{label}</p>
        <p className="font-bold text-gray-900">{formatCurrency(payload[0].value, currency)}</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Total: {formatCurrency(totalSpent, currency)}</p>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {PERIOD_OPTIONS.map(o => (
          <button
            key={o.key}
            onClick={() => setPeriod(o.key)}
            className={clsx(
              'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              period === o.key ? 'bg-brand-600 text-white shadow-brand' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Daily Bar Chart */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Spending Over Time</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={dailyData.length > 15 ? 4 : 0} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6', radius: 6 }} />
            <Bar dataKey="amount" fill="#534AB7" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Donut + Legend */}
      {breakdown.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">By Category</h2>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={breakdown} dataKey="amount" cx="50%" cy="50%" innerRadius={45} outerRadius={70} strokeWidth={0}>
                    {breakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.category.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(totalSpent, currency)}</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2 w-full">
              {breakdown.slice(0, 6).map(b => (
                <div key={b.category.id} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: b.category.color }} />
                  <span className="text-xs text-gray-600 flex-1 truncate">{b.category.name}</span>
                  <span className="text-xs font-semibold text-gray-900 tabular-nums">{formatCurrency(b.amount, currency)}</span>
                  <span className="text-xs text-gray-400 w-9 text-right">{b.percentage.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Highlights */}
      {highlights.biggest && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Biggest Spend', icon: <Flame className="w-4 h-4" />, cat: highlights.biggest, color: 'bg-red-50 text-red-700 border-red-100' },
            { label: 'Most Transactions', icon: <TrendingDown className="w-4 h-4" />, cat: highlights.mostTxn, color: 'bg-amber-50 text-amber-700 border-amber-100' },
            { label: 'Fastest Growing', icon: <TrendingUp className="w-4 h-4" />, cat: highlights.fastestGrowing, color: 'bg-purple-50 text-purple-700 border-purple-100' },
          ].map(h => h.cat && (
            <div key={h.label} className={clsx('rounded-2xl border p-4', h.color)}>
              <div className="flex items-center gap-1.5 mb-2 opacity-80 text-xs font-medium">{h.icon} {h.label}</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{h.cat.category.icon}</span>
                <div>
                  <p className="text-sm font-bold">{h.cat.category.name}</p>
                  <p className="text-xs opacity-70">{formatCurrency(h.cat.amount, currency)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Budget Performance Table */}
      {budgets.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Budget Performance</h2>
          <div className="flex flex-col gap-2">
            {budgets.map(b => {
              const cat = categories.find(c => c.id === b.category_id);
              if (!cat) return null;
              const spent = periodExpenses.filter(e => e.category_id === b.category_id).reduce((s, e) => s + Number(e.amount), 0);
              const pct = (spent / Number(b.amount)) * 100;
              const status = BUDGET_STATUS(pct);
              return (
                <div key={b.id} className={clsx('flex items-center gap-3 p-3 rounded-xl border', status.bg, 'border-gray-100')}>
                  <span className="text-xl">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                      <span className={clsx('text-xs font-bold', status.text)}>{pct.toFixed(0)}%</span>
                    </div>
                    <ProgressBar value={pct} color={status.dot} height="sm" />
                    <div className="flex justify-between mt-0.5">
                      <span className="text-xs text-gray-400">Spent: {formatCurrency(spent, currency)}</span>
                      <span className="text-xs text-gray-400">Budget: {formatCurrency(b.amount, currency)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trend Line */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">6-Month Trend</h2>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#534AB7" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#534AB7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="spent" stroke="#534AB7" strokeWidth={2} fill="url(#spendGrad)" dot={false} />
            <Line type="monotone" dataKey="budget" stroke="#e5e7eb" strokeWidth={2} strokeDasharray="4 4" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 justify-center">
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-0.5 bg-brand-600 inline-block rounded" /> Spent</div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-0.5 bg-gray-300 inline-block rounded border-dashed" /> Budget</div>
        </div>
      </div>

      {/* AI Report */}
      <div className="card border-brand-100 bg-gradient-to-br from-brand-50/50 to-white">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-xl bg-brand-100 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">AI Financial Report</h2>
        </div>
        {!report && !reportLoading && (
          <div>
            <p className="text-sm text-gray-500 mb-3">Get a personalized AI analysis of your spending patterns and recommendations.</p>
            <Button variant="primary" size="sm" onClick={loadReport} icon={<Sparkles className="w-3.5 h-3.5" />}>
              Generate Report
            </Button>
          </div>
        )}
        {reportLoading && <SkeletonCard lines={4} />}
        {report && !reportLoading && (
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{report}</div>
        )}
        {report && (
          <Button variant="ghost" size="sm" onClick={loadReport} loading={reportLoading} className="mt-3">
            Regenerate
          </Button>
        )}
      </div>
    </div>
  );
}
