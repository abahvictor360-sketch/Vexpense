import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, TrendingUp, TrendingDown, Wallet, Target,
  RefreshCw, AlertTriangle, ChevronRight, PlusCircle, Sparkles, Info
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useExpenseStore } from '../store/expenseStore';
import { useBudgetStore } from '../store/budgetStore';
import { useGoalStore } from '../store/goalStore';
import { useBudgetWarnings } from '../hooks/useBudgetWarnings';
import { useEconomy } from '../hooks/useEconomy';
import { getInsight } from '../lib/api';
import { formatCurrency, getGreeting, getInitials, getMonthRange, calculateBreakdown } from '../utils';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SkeletonCard } from '../components/ui/SkeletonCard';
import { clsx } from '../utils/clsx';
import { useCategoryStore } from '../store/categoryStore';

type Period = 'week' | 'month' | 'quarter';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const expenses = useExpenseStore(s => s.expenses);
  const goals = useGoalStore(s => s.goals);
  const categories = useCategoryStore(s => s.categories);
  const budgets = useBudgetStore(s => s.budgets);
  const budgetWarnings = useBudgetWarnings(0.75);
  const fetchGoals = useGoalStore(s => s.fetchGoals);
  const { data: economy } = useEconomy(profile?.country_code ?? null);

  const [period, setPeriod] = useState<Period>('month');
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    if (user?.id) fetchGoals(user.id);
  }, [user?.id]);

  useEffect(() => {
    loadInsight();
  }, []);

  const loadInsight = async () => {
    setInsightLoading(true);
    try {
      const { insight } = await getInsight();
      setInsight(insight);
    } catch {
      setInsight('Unable to load AI insight right now. Try again later.');
    } finally {
      setInsightLoading(false);
    }
  };

  // Filter expenses by period
  const now = new Date();
  const getPeriodExpenses = () => {
    let start: string;
    if (period === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split('T')[0];
    } else if (period === 'month') {
      start = getMonthRange().start;
    } else {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      start = d.toISOString().split('T')[0];
    }
    const end = now.toISOString().split('T')[0];
    return expenses.filter(e => e.date >= start && e.date <= end);
  };

  const periodExpenses = getPeriodExpenses();
  const totalSpent = periodExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0);
  const remaining = Math.max(0, totalBudget - totalSpent);

  const { start: mStart, end: mEnd } = getMonthRange();
  const savedThisMonth = expenses
    .filter(e => e.date >= mStart && e.date <= mEnd && e.category?.name === 'Savings')
    .reduce((s, e) => s + Number(e.amount), 0);

  const breakdown = calculateBreakdown(periodExpenses, categories).slice(0, 5);
  const currency = profile?.currency ?? 'USD';

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{getGreeting()},</p>
          <h1 className="text-xl font-bold text-gray-900">{profile?.full_name?.split(' ')[0] ?? 'there'} 👋</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 shadow-card">
            <Bell className="w-4 h-4" />
            {budgetWarnings.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {budgetWarnings.length}
              </span>
            )}
          </button>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-card"
            style={{ backgroundColor: profile?.avatar_color ?? '#534AB7' }}
          >
            {getInitials(profile?.full_name ?? '')}
          </div>
        </div>
      </div>

      {/* ─── Economy Alert ─── */}
      {economy?.inflationRate !== null && economy?.inflationRate !== undefined && economy.inflationRate > 10 && (
        <div className={clsx(
          'flex items-start gap-3 p-4 rounded-2xl border',
          economy.inflationRate > 20
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
        )}>
          <AlertTriangle className={clsx('w-4 h-4 mt-0.5 flex-shrink-0', economy.inflationRate > 20 ? 'text-red-500' : 'text-amber-500')} />
          <div>
            <p className={clsx('text-sm font-semibold', economy.inflationRate > 20 ? 'text-red-700' : 'text-amber-700')}>
              {economy.inflationRate.toFixed(1)}% inflation in {profile?.country_name}
            </p>
            <p className={clsx('text-xs mt-0.5', economy.inflationRate > 20 ? 'text-red-600' : 'text-amber-600')}>
              Consider adjusting your budget to account for rising prices ({economy.year}).
            </p>
          </div>
        </div>
      )}

      {/* ─── Balance Card ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-brand-gradient text-white p-5 shadow-brand">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">
            {period === 'week' ? 'This week' : period === 'month' ? 'This month' : 'Last 3 months'}
          </p>
          <p className="text-3xl font-bold tabular-nums leading-tight mb-4">
            {formatCurrency(totalSpent, currency)}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Budget', value: totalBudget, icon: Wallet },
              { label: 'Remaining', value: remaining, icon: TrendingDown },
              { label: 'Saved', value: savedThisMonth, icon: TrendingUp },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-sm">
                <Icon className="w-3.5 h-3.5 text-white/70 mb-1" />
                <p className="text-[11px] text-white/70 font-medium">{label}</p>
                <p className="text-sm font-bold tabular-nums leading-tight">
                  {formatCurrency(value, currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Period Switcher ─── */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
        {(['week', 'month', 'quarter'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={clsx(
              'flex-1 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
              period === p ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'Quarter'}
          </button>
        ))}
      </div>

      {/* ─── AI Insight ─── */}
      <div className="card border-brand-100 bg-gradient-to-br from-brand-50 to-white">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-100 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">AI Insight</p>
          </div>
          <button
            onClick={loadInsight}
            disabled={insightLoading}
            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', insightLoading && 'animate-spin')} />
          </button>
        </div>
        {insightLoading ? (
          <div className="space-y-2">
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-5/6" />
          </div>
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
        )}
      </div>

      {/* ─── Category Breakdown ─── */}
      {breakdown.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Where it's going</h2>
            <button onClick={() => navigate('/analytics')} className="text-xs text-brand-600 font-medium flex items-center gap-0.5">
              See all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {breakdown.map(({ category, amount, count, percentage }) => (
              <div key={category.id}>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    {category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800 truncate">{category.name}</span>
                      <span className="text-sm font-semibold text-gray-900 tabular-nums ml-2">
                        {formatCurrency(amount, currency)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{count} transaction{count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <ProgressBar value={percentage} color={category.color} height="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Goals Preview ─── */}
      {goals.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Savings Goals</h2>
            <button onClick={() => navigate('/goals')} className="text-xs text-brand-600 font-medium flex items-center gap-0.5">
              All goals <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
            {goals.filter(g => g.status === 'active').slice(0, 4).map(goal => {
              const pct = Math.min((Number(goal.saved_amount) / Number(goal.target_amount)) * 100, 100);
              return (
                <button
                  key={goal.id}
                  onClick={() => navigate('/goals')}
                  className="flex-shrink-0 w-40 bg-gray-50 rounded-2xl p-3 text-left card-press border border-gray-100"
                >
                  <div className="text-2xl mb-2">{goal.icon}</div>
                  <p className="text-xs font-semibold text-gray-800 truncate mb-1">{goal.name}</p>
                  <ProgressBar value={pct} color={goal.color} height="sm" className="mb-1" />
                  <p className="text-xs text-gray-500">{pct.toFixed(0)}% · {formatCurrency(Number(goal.saved_amount), currency)}</p>
                </button>
              );
            })}
            <button
              onClick={() => navigate('/goals')}
              className="flex-shrink-0 w-40 bg-brand-50 border-2 border-dashed border-brand-200 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 card-press"
            >
              <PlusCircle className="w-6 h-6 text-brand-400" />
              <span className="text-xs font-medium text-brand-600">New Goal</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Budget Warnings ─── */}
      {budgetWarnings.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Budget Alerts
          </h2>
          {budgetWarnings.map(w => (
            <div key={w.category.id} className={clsx(
              'flex items-center gap-3 p-3.5 rounded-2xl border',
              w.percentage >= 100 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
            )}>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: `${w.category.color}20` }}
              >
                {w.category.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={clsx('text-sm font-semibold', w.percentage >= 100 ? 'text-red-700' : 'text-amber-700')}>
                  {w.category.name} {w.percentage >= 100 ? 'exceeded!' : `at ${w.percentage.toFixed(0)}%`}
                </p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(w.spent, currency)} of {formatCurrency(w.budget, currency)}
                </p>
              </div>
              <ProgressBar value={w.percentage} height="sm" className="w-16" />
            </div>
          ))}
        </div>
      )}

      {/* ─── Empty state ─── */}
      {expenses.length === 0 && (
        <div className="card text-center py-10">
          <div className="text-4xl mb-3">💸</div>
          <h3 className="font-semibold text-gray-900 mb-1">Start tracking</h3>
          <p className="text-sm text-gray-500 mb-4">Add your first expense to see insights here</p>
          <button
            onClick={() => navigate('/expenses/add')}
            className="inline-flex items-center gap-1.5 bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Add Expense
          </button>
        </div>
      )}
    </div>
  );
}
