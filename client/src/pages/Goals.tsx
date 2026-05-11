import { useEffect, useState } from 'react';
import { PlusCircle, Calendar, Trash2, PauseCircle, CheckCircle2, PlayCircle, PiggyBank, Target, Flame } from 'lucide-react';
import { CategoryIcon, GOAL_ICON_OPTIONS } from '../components/ui/CategoryIcon';
import { useAuthStore } from '../store/authStore';
import { useGoalStore } from '../store/goalStore';
import { formatCurrency, formatDate } from '../utils';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { clsx } from '../utils/clsx';
import type { Goal } from '../types';
import toast from 'react-hot-toast';

// GOAL_ICONS replaced by GOAL_ICON_OPTIONS from CategoryIcon.tsx
const GOAL_COLORS = ['#534AB7','#ef4444','#f59e0b','#10b981','#3b82f6','#ec4899','#8b5cf6','#14b8a6','#f97316','#6366f1'];

export default function Goals() {
  const { user, profile } = useAuthStore();
  const { goals, contributions, fetchGoals, addGoal, updateGoal, deleteGoal, addContribution, fetchContributions } = useGoalStore();
  const currency = profile?.currency ?? 'USD';

  const [showCreate, setShowCreate] = useState(false);
  const [detailGoal, setDetailGoal] = useState<Goal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [addFundsNote, setAddFundsNote] = useState('');
  const [addingFunds, setAddingFunds] = useState(false);

  // Create form
  const [form, setForm] = useState({ name: '', target_amount: '', target_date: '', icon: 'target', color: '#534AB7' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { if (user?.id) fetchGoals(user.id); }, [user?.id]);

  useEffect(() => {
    if (detailGoal && !contributions[detailGoal.id]) {
      fetchContributions(detailGoal.id);
    }
  }, [detailGoal?.id]);

  const handleCreate = async () => {
    if (!form.name || !form.target_amount || !user) return;
    setCreating(true);
    await addGoal({
      user_id: user.id,
      name: form.name,
      target_amount: parseFloat(form.target_amount),
      target_date: form.target_date || null,
      icon: form.icon,
      color: form.color,
      status: 'active',
    });
    setCreating(false);
    setShowCreate(false);
    setForm({ name: '', target_amount: '', target_date: '', icon: 'target', color: '#534AB7' });
    toast.success('Goal created! 🎯');
  };

  const handleAddFunds = async () => {
    if (!detailGoal || !user || !addFundsAmount) return;
    setAddingFunds(true);
    await addContribution(detailGoal.id, user.id, parseFloat(addFundsAmount), addFundsNote || undefined);
    setAddingFunds(false);
    setAddFundsAmount('');
    setAddFundsNote('');
    toast.success(`${formatCurrency(parseFloat(addFundsAmount), currency)} added!`);
    // Refresh detail
    const updated = goals.find(g => g.id === detailGoal.id);
    if (updated) setDetailGoal(updated);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await deleteGoal(deleteId);
    setDeleting(false);
    setDeleteId(null);
    setDetailGoal(null);
    toast.success('Goal deleted');
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const totalSaved = goals.reduce((s, g) => s + Number(g.saved_amount), 0);
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Goals</h1>
          <p className="text-sm text-gray-500">{goals.length} goal{goals.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="primary" size="sm" icon={<PlusCircle className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
          New Goal
        </Button>
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Saved',  value: formatCurrency(totalSaved,  currency), Icon: PiggyBank, color: 'text-emerald-500' },
            { label: 'Total Target', value: formatCurrency(totalTarget, currency),  Icon: Target,    color: 'text-brand-600'  },
            { label: 'In Progress',  value: `${activeGoals.length}`,               Icon: Flame,     color: 'text-orange-500' },
          ].map(s => (
            <div key={s.label} className="card text-center py-3">
              <s.Icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
              <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{s.value}</p>
              <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Active Goals Grid */}
      {activeGoals.length === 0 && completedGoals.length === 0 ? (
        <EmptyState
          icon={<Target className="w-8 h-8" />}
          title="Set your first goal"
          description="Whether it's a phone, a trip, or an emergency fund — track it here"
          action={{ label: '+ Create Goal', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <>
          {activeGoals.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeGoals.map(goal => {
                const pct = Math.min((Number(goal.saved_amount) / Number(goal.target_amount)) * 100, 100);
                const remaining = Number(goal.target_amount) - Number(goal.saved_amount);
                return (
                  <button
                    key={goal.id}
                    onClick={() => setDetailGoal(goal)}
                    className="card text-left card-press hover:shadow-card-hover"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: `${goal.color}20` }}
                      >
                        <CategoryIcon icon={goal.icon} size="lg" color={goal.color} />
                      </div>
                      <Badge color={goal.color} variant="soft">Active</Badge>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{goal.name}</h3>
                    <p className="text-xs text-gray-400 mb-2">
                      {formatCurrency(Number(goal.saved_amount), currency)} of {formatCurrency(Number(goal.target_amount), currency)}
                    </p>
                    <ProgressBar value={pct} color={goal.color} height="md" className="mb-2" />
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{pct.toFixed(0)}% saved</span>
                      {goal.target_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(goal.target_date)}
                        </span>
                      )}
                    </div>
                    {remaining > 0 && (
                      <p className="text-xs text-gray-400 mt-1">{formatCurrency(remaining, currency)} to go</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Completed */}
          {completedGoals.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Completed
              </h2>
              <div className="flex flex-col gap-2">
                {completedGoals.map(goal => (
                  <div key={goal.id} className="flex items-center gap-3 p-3.5 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${goal.color}20` }}>
                      <CategoryIcon icon={goal.icon} size="sm" color={goal.color} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-800">{goal.name}</p>
                      <p className="text-xs text-green-600">{formatCurrency(Number(goal.target_amount), currency)} reached!</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Goal Detail Modal */}
      <Modal isOpen={!!detailGoal} onClose={() => setDetailGoal(null)} title={detailGoal?.name ?? ''} size="lg">
        {detailGoal && (() => {
          const latestGoal = goals.find(g => g.id === detailGoal.id) ?? detailGoal;
          const latestPct = Math.min((Number(latestGoal.saved_amount) / Number(latestGoal.target_amount)) * 100, 100);
          const goalContribs = contributions[detailGoal.id] ?? [];

          return (
            <div className="p-5 flex flex-col gap-4">
              {/* Progress ring */}
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                    <circle cx="40" cy="40" r="32" fill="none" stroke={latestGoal.color} strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${2 * Math.PI * 32 * (1 - latestPct / 100)}`}
                      strokeLinecap="round" className="transition-all duration-500" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-gray-900">{latestPct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">{formatCurrency(Number(latestGoal.saved_amount), currency)}</p>
                  <p className="text-sm text-gray-500">of {formatCurrency(Number(latestGoal.target_amount), currency)}</p>
                  {latestGoal.target_date && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Target: {formatDate(latestGoal.target_date)}
                    </p>
                  )}
                </div>
              </div>

              {/* Add Funds */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Add Funds</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    placeholder="Amount"
                    value={addFundsAmount}
                    onChange={e => setAddFundsAmount(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                  <Button variant="primary" size="sm" onClick={handleAddFunds} loading={addingFunds} disabled={!addFundsAmount}>
                    + Add
                  </Button>
                </div>
                <input
                  type="text"
                  placeholder="Note (optional)"
                  value={addFundsNote}
                  onChange={e => setAddFundsNote(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Contribution History */}
              {goalContribs.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Contribution History</p>
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                    {goalContribs.map(c => (
                      <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-xs font-medium text-gray-700">{formatCurrency(Number(c.amount), currency)}</p>
                          {c.note && <p className="text-[10px] text-gray-400">{c.note}</p>}
                        </div>
                        <p className="text-[10px] text-gray-400">{formatDate(c.date)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  icon={latestGoal.status === 'paused' ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                  onClick={() => updateGoal(latestGoal.id, { status: latestGoal.status === 'paused' ? 'active' : 'paused' })}
                  className="flex-1"
                >
                  {latestGoal.status === 'paused' ? 'Resume' : 'Pause'}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => { setDeleteId(detailGoal.id); }}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Create Goal Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Goal">
        <div className="p-5 flex flex-col gap-4">
          {/* Icon picker */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Icon</p>
            <div className="flex flex-wrap gap-2">
              {GOAL_ICON_OPTIONS.map(({ key, Icon }) => (
                <button
                  key={key}
                  onClick={() => setForm(f => ({ ...f, icon: key }))}
                  className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                    form.icon === key
                      ? 'bg-brand-100 dark:bg-brand-900/40 scale-110 shadow-sm text-brand-600 dark:text-brand-400'
                      : 'bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-500 dark:text-slate-400'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Color</p>
            <div className="flex flex-wrap gap-2">
              {GOAL_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setForm(f => ({ ...f, color }))}
                  className={clsx('w-8 h-8 rounded-xl transition-all', form.color === color ? 'scale-125 shadow-md ring-2 ring-white ring-offset-1' : '')}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <input
            placeholder="Goal name (e.g. New iPhone)"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
          <input
            type="number"
            placeholder={`Target amount (${currency})`}
            value={form.target_amount}
            onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))}
            className="h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Target date (optional)</label>
            <input
              type="date"
              value={form.target_date}
              onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))}
              className="h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <Button variant="primary" size="lg" fullWidth onClick={handleCreate} loading={creating}
            disabled={!form.name || !form.target_amount}>
            Create Goal
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="This goal and all its contribution history will be permanently deleted."
        loading={deleting}
      />
    </div>
  );
}
