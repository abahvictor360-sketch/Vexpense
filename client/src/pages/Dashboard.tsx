import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, PlusCircle, ChevronRight, Sun, Moon, Wallet, Lightbulb } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useExpenseStore } from '../store/expenseStore';
import { useBudgetStore } from '../store/budgetStore';
import { useGoalStore } from '../store/goalStore';
import { useBudgetWarnings } from '../hooks/useBudgetWarnings';
import { useEconomy } from '../hooks/useEconomy';
import { getInsight } from '../lib/api';
import { formatCurrency, getGreeting, getInitials, getMonthRange, calculateBreakdown } from '../utils';
import { clsx } from '../utils/clsx';
import { useCategoryStore } from '../store/categoryStore';
import { useTheme } from '../store/themeStore';
import { CategoryIcon } from '../components/ui/CategoryIcon';

type Period = 'week' | 'month' | 'quarter';

// Compact currency for goal cards: ₦186,000 → ₦186k
function compactCurrency(amount: number, currency: string): string {
  if (amount >= 1_000_000) return `${formatCurrency(amount / 1_000_000, currency).replace(/\.00$/, '')}M`;
  if (amount >= 1_000)     return `${formatCurrency(amount / 1_000, currency).replace(/\.00$/, '')}k`;
  return formatCurrency(amount, currency);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const expenses   = useExpenseStore(s => s.expenses);
  const goals      = useGoalStore(s => s.goals);
  const categories = useCategoryStore(s => s.categories);
  const budgets    = useBudgetStore(s => s.budgets);
  const budgetWarnings = useBudgetWarnings(0.75);
  const fetchGoals = useGoalStore(s => s.fetchGoals);
  const { data: economy } = useEconomy(profile?.country_code ?? null);

  const [theme, setTheme] = useTheme();
  const [period, setPeriod] = useState<Period>('month');
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightTouched, setInsightTouched] = useState(false);

  useEffect(() => { if (user?.id) fetchGoals(user.id); }, [user?.id]);

  const loadInsight = async () => {
    setInsightTouched(true);
    setInsightLoading(true);
    try {
      const { insight } = await getInsight();
      setInsight(insight);
    } catch {
      setInsight('AI insights require the backend server. Coming soon once deployed.');
    } finally {
      setInsightLoading(false);
    }
  };

  const now = new Date();
  const getPeriodExpenses = () => {
    let start: string;
    if (period === 'week') {
      const d = new Date(now); d.setDate(d.getDate() - 7);
      start = d.toISOString().split('T')[0];
    } else if (period === 'month') {
      start = getMonthRange().start;
    } else {
      const d = new Date(now); d.setMonth(d.getMonth() - 3);
      start = d.toISOString().split('T')[0];
    }
    return expenses.filter(e => e.date >= start && e.date <= now.toISOString().split('T')[0]);
  };

  const periodExpenses  = getPeriodExpenses();
  const totalSpent      = periodExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalBudget     = budgets.reduce((s, b) => s + Number(b.amount), 0);
  const remaining       = Math.max(0, totalBudget - totalSpent);
  const { start: mStart, end: mEnd } = getMonthRange();
  const savedThisMonth  = expenses
    .filter(e => e.date >= mStart && e.date <= mEnd && e.category?.name === 'Savings')
    .reduce((s, e) => s + Number(e.amount), 0);

  const breakdown = calculateBreakdown(periodExpenses, categories).slice(0, 5);
  const currency  = profile?.currency ?? 'USD';
  const activeGoals = goals.filter(g => g.status === 'active').slice(0, 4);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">

      {/* ═══════════════════════════════════════
          HEADER — Logo · Notif · Avatar
      ═══════════════════════════════════════ */}
      <div className="flex items-center justify-between pt-1">
        {/* Logo */}
        <span className="text-xl font-bold tracking-tight">
          <span className="text-brand-600">V</span>
          <span className="text-gray-800 dark:text-slate-200">expense</span>
        </span>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-card flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notification bell */}
          <button className="relative w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-card flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            {/* bell icon SVG inline so it matches mockup exactly */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {budgetWarnings.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {budgetWarnings.length}
              </span>
            )}
          </button>

          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm select-none"
            style={{ backgroundColor: profile?.avatar_color ?? '#534AB7' }}
          >
            {getInitials(profile?.full_name ?? '')}
          </div>
        </div>
      </div>

      {/* Greeting */}
      <div className="-mt-1">
        <p className="text-sm text-gray-500">{getGreeting()},</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
          {profile?.full_name?.split(' ')[0] ?? 'there'}
        </h1>
      </div>

      {/* ═══════════════════════════════════════
          ECONOMY ALERT (only if inflation > 10%)
      ═══════════════════════════════════════ */}
      {economy?.inflationRate != null && economy.inflationRate > 10 && (
        <div className={clsx(
          'flex items-start gap-3 px-4 py-3.5 rounded-2xl',
          economy.inflationRate > 20 ? 'bg-red-50' : 'bg-[#FEF0EE]'
        )}>
          {/* icon pill */}
          <div className={clsx(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
            economy.inflationRate > 20 ? 'bg-red-100' : 'bg-[#FBD9D3]'
          )}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={economy.inflationRate > 20 ? '#dc2626' : '#C0392B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <p className={clsx('text-sm leading-snug', economy.inflationRate > 20 ? 'text-red-700' : 'text-[#8B2A1D]')}>
            {profile?.country_name} inflation at{' '}
            <span className="font-bold">{economy.inflationRate.toFixed(1)}%</span>
            {' '}— your food budget may need adjustment.
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════
          BALANCE CARD — purple gradient
      ═══════════════════════════════════════ */}
      <div
        className="relative rounded-3xl overflow-hidden text-white px-5 pt-5 pb-5 shadow-brand"
        style={{ background: 'linear-gradient(145deg, #6B63CC 0%, #534AB7 55%, #3D3690 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/5" />

        <div className="relative">
          <p className="text-white/60 text-xs font-medium mb-1">Total spent this month</p>
          <p className="text-4xl font-extrabold tabular-nums tracking-tight mb-4">
            {formatCurrency(totalSpent, currency)}
          </p>

          {/* 3 sub-stats */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'Budget',    value: totalBudget    },
              { label: 'Remaining', value: remaining      },
              { label: 'Saved',     value: savedThisMonth },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-2xl px-3 py-2.5 backdrop-blur-sm">
                <p className="text-[10px] text-white/60 font-medium mb-0.5">{label}</p>
                <p className="text-sm font-bold tabular-nums leading-tight">
                  {formatCurrency(value, currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SALARY PROMPT (if income not set)
      ═══════════════════════════════════════ */}
      {profile && !profile.monthly_income && (
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-3 px-4 py-3 bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 rounded-2xl text-left w-full"
        >
          <Lightbulb className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-brand-800 dark:text-brand-300">Set your monthly income</p>
            <p className="text-xs text-brand-600 dark:text-brand-400">Get AI-powered budget suggestions tailored to your salary</p>
          </div>
          <ChevronRight className="w-4 h-4 text-brand-400 flex-shrink-0" />
        </button>
      )}

      {/* ═══════════════════════════════════════
          PERIOD SWITCHER
      ═══════════════════════════════════════ */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-2xl p-1">
        {(['week', 'month', 'quarter'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={clsx(
              'flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              period === p
                ? 'bg-gray-900 dark:bg-slate-600 text-white shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            )}
          >
            {p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'Quarter'}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════
          AI INSIGHT CARD
      ═══════════════════════════════════════ */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-card px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 flex-1">
            {/* Blue dot */}
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
            <div className="flex-1">
              {insightLoading ? (
                <div className="space-y-2 pt-0.5">
                  <div className="skeleton h-3 w-full rounded-md" />
                  <div className="skeleton h-3 w-5/6 rounded-md" />
                  <div className="skeleton h-3 w-4/6 rounded-md" />
                </div>
              ) : insightTouched ? (
                <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-gray-900 dark:text-white">AI Insight: </span>
                  {insight}
                </p>
              ) : (
                <button onClick={loadInsight} className="text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline text-left">
                  Tap to load AI insight for your spending
                </button>
              )}
            </div>
          </div>
          <button
            onClick={loadInsight}
            disabled={insightLoading}
            className="p-1.5 rounded-lg text-gray-300 hover:text-brand-600 hover:bg-brand-50 transition-colors flex-shrink-0"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', insightLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          CATEGORY BREAKDOWN
      ═══════════════════════════════════════ */}
      {breakdown.length > 0 && (
        <div>
          {/* Section header */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
              Where your money goes
            </p>
            <button
              onClick={() => navigate('/analytics')}
              className="text-xs text-brand-600 font-semibold flex items-center gap-0.5"
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-card divide-y divide-gray-50 dark:divide-slate-700">
            {breakdown.map(({ category, amount, count, percentage }) => (
              <div key={category.id} className="flex items-center gap-3 px-4 py-3">
                {/* Category icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <CategoryIcon icon={category.icon} size="md" color={category.color} />
                </div>

                {/* Name + count */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{category.name}</p>
                  <p className="text-xs text-gray-400 leading-tight mt-0.5">
                    {count} transaction{count !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Progress bar + amount */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, backgroundColor: category.color }}
                    />
                  </div>
                  <p className="text-sm font-bold text-gray-900 tabular-nums w-20 text-right">
                    {formatCurrency(amount, currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          SAVINGS GOALS
      ═══════════════════════════════════════ */}
      {activeGoals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
              Savings Goals
            </p>
            <button
              onClick={() => navigate('/goals')}
              className="text-xs text-brand-600 font-semibold flex items-center gap-0.5"
            >
              All goals <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {activeGoals.map((goal, idx) => {
              const pct = Math.min((Number(goal.saved_amount) / Number(goal.target_amount)) * 100, 100);
              return (
                <button
                  key={goal.id}
                  onClick={() => navigate('/goals')}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-card p-4 text-left card-press hover:shadow-card-hover"
                >
                  <p className="text-[10px] text-gray-400 font-medium mb-1">Goal {idx + 1}</p>
                  <p className="text-sm font-bold text-gray-900 truncate mb-2.5">{goal.name}</p>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: goal.color }}
                    />
                  </div>

                  <p className="text-[11px] text-gray-400 font-medium tabular-nums">
                    {pct.toFixed(0)}%
                    {' · '}
                    {compactCurrency(Number(goal.saved_amount), currency)}
                    {' of '}
                    {compactCurrency(Number(goal.target_amount), currency)}
                  </p>
                </button>
              );
            })}

            {/* Add new goal card */}
            {activeGoals.length % 2 !== 0 && (
              <button
                onClick={() => navigate('/goals')}
                className="bg-brand-50 border-2 border-dashed border-brand-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 card-press"
              >
                <PlusCircle className="w-6 h-6 text-brand-400" />
                <span className="text-xs font-semibold text-brand-600">New Goal</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          BUDGET WARNINGS
      ═══════════════════════════════════════ */}
      {budgetWarnings.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {budgetWarnings.map(w => (
            <div
              key={w.category.id}
              className={clsx(
                'flex items-start gap-3 px-4 py-3.5 rounded-2xl',
                w.percentage >= 100 ? 'bg-red-50' : 'bg-[#FEF6EE]'
              )}
            >
              {/* Icon */}
              <div className={clsx(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-lg',
                w.percentage >= 100 ? 'bg-red-100' : 'bg-[#FDE8D0]'
              )}>
                {w.category.icon}
              </div>
              <p className={clsx(
                'text-sm leading-snug',
                w.percentage >= 100 ? 'text-red-700' : 'text-[#7C4A0A]'
              )}>
                {w.category.name} budget is at{' '}
                <span className="font-bold">{w.percentage.toFixed(0)}%</span>
                {' '}—{' '}
                {w.percentage >= 100
                  ? 'you\'ve exceeded your limit!'
                  : `${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()} days left this month. Slow down spending.`
                }
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════
          EMPTY STATE
      ═══════════════════════════════════════ */}
      {expenses.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-card text-center py-12 px-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mb-3">
            <Wallet className="w-7 h-7 text-brand-500" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Start tracking</h3>
          <p className="text-sm text-gray-500 mb-5">Add your first expense to see insights here</p>
          <button
            onClick={() => navigate('/expenses/add')}
            className="inline-flex items-center gap-1.5 bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 active:scale-95 transition-all shadow-brand"
          >
            <PlusCircle className="w-4 h-4" /> Add Expense
          </button>
        </div>
      )}

      {/* Bottom padding for safe area */}
      <div className="h-2" />
    </div>
  );
}
