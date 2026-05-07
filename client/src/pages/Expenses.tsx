import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, PlusCircle, Trash2, Edit2, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useExpenseStore } from '../store/expenseStore';
import { useCategoryStore } from '../store/categoryStore';
import { useFilteredExpenses } from '../hooks/useFilteredExpenses';
import { formatCurrency, formatDateHeader, groupByDate } from '../utils';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Button } from '../components/ui/Button';
import { clsx } from '../utils/clsx';
import type { Expense, PaymentMethod } from '../types';
import toast from 'react-hot-toast';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: '💵', card: '💳', transfer: '📲',
};

export default function Expenses() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { filter, setFilter, updateExpense, deleteExpense } = useExpenseStore();
  const categories = useCategoryStore(s => s.categories);
  const filtered = useFilteredExpenses();
  const currency = profile?.currency ?? 'USD';

  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');
  const [saving, setSaving] = useState(false);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const openEdit = (exp: Expense) => {
    setEditExpense(exp);
    setEditAmount(String(exp.amount));
    setEditDesc(exp.description);
    setEditCategory(exp.category_id ?? '');
    setEditDate(exp.date);
  };

  const handleSaveEdit = async () => {
    if (!editExpense) return;
    setSaving(true);
    await updateExpense(editExpense.id, {
      amount: parseFloat(editAmount),
      description: editDesc,
      category_id: editCategory || null,
      date: editDate,
    });
    setSaving(false);
    setEditExpense(null);
    toast.success('Expense updated');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await deleteExpense(deleteId);
    setDeleting(false);
    setDeleteId(null);
    toast.success('Expense deleted');
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Expenses</h1>
          {filtered.length > 0 && (
            <p className="text-sm text-gray-500">{filtered.length} transactions · {formatCurrency(total, currency)}</p>
          )}
        </div>
        <button
          onClick={() => navigate('/expenses/add')}
          className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-brand hover:bg-brand-700 transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={filter.search}
            onChange={e => setFilter({ search: e.target.value })}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={clsx(
            'w-10 h-10 rounded-xl border flex items-center justify-center transition-colors',
            showFilters ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
          )}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card animate-slide-up flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Filters</p>
            <button onClick={() => { setFilter({ categoryId: null, paymentMethod: null, startDate: null, endDate: null }); setShowFilters(false); }} className="text-xs text-brand-600 font-medium">Clear all</button>
          </div>
          <div className="flex flex-col gap-2">
            <select
              value={filter.categoryId ?? ''}
              onChange={e => setFilter({ categoryId: e.target.value || null })}
              className="h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-brand-500"
            >
              <option value="">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            <select
              value={filter.paymentMethod ?? ''}
              onChange={e => setFilter({ paymentMethod: e.target.value || null })}
              className="h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-brand-500"
            >
              <option value="">All payment methods</option>
              <option value="cash">💵 Cash</option>
              <option value="card">💳 Card</option>
              <option value="transfer">📲 Transfer</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={filter.startDate ?? ''} onChange={e => setFilter({ startDate: e.target.value || null })}
                className="h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-brand-500" />
              <input type="date" value={filter.endDate ?? ''} onChange={e => setFilter({ endDate: e.target.value || null })}
                className="h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-brand-500" />
            </div>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {(filter.categoryId || filter.paymentMethod) && (
        <div className="flex flex-wrap gap-1.5">
          {filter.categoryId && (() => {
            const cat = categories.find(c => c.id === filter.categoryId);
            return cat ? (
              <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-1 rounded-full border border-brand-200">
                {cat.icon} {cat.name}
                <button onClick={() => setFilter({ categoryId: null })}><X className="w-3 h-3" /></button>
              </span>
            ) : null;
          })()}
          {filter.paymentMethod && (
            <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-1 rounded-full border border-brand-200">
              {PAYMENT_LABELS[filter.paymentMethod as PaymentMethod]} {filter.paymentMethod}
              <button onClick={() => setFilter({ paymentMethod: null })}><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* Expense List */}
      {filtered.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title={filter.search || filter.categoryId ? 'No matching expenses' : 'No expenses yet'}
          description={filter.search || filter.categoryId ? 'Try adjusting your search or filters' : 'Add your first expense to start tracking'}
          action={!filter.search && !filter.categoryId ? { label: '+ Add Expense', onClick: () => navigate('/expenses/add') } : undefined}
        />
      ) : (
        <div className="flex flex-col gap-5">
          {sortedDates.map(date => (
            <div key={date}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{formatDateHeader(date)}</p>
                <p className="text-xs font-medium text-gray-400">
                  {formatCurrency(grouped[date].reduce((s, e) => s + Number(e.amount), 0), currency)}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                {grouped[date].map(expense => (
                  <div
                    key={expense.id}
                    className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-3 shadow-card group hover:shadow-card-hover transition-shadow"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: `${expense.category?.color ?? '#9ca3af'}20` }}
                    >
                      {expense.category?.icon ?? '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{expense.description}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400 truncate">{expense.category?.name ?? 'Uncategorized'}</span>
                        <span className="text-gray-300 text-xs">·</span>
                        <span className="text-xs text-gray-400">{PAYMENT_LABELS[expense.payment_method]}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-bold text-gray-900 tabular-nums">
                        {formatCurrency(Number(expense.amount), currency)}
                      </p>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                        <button onClick={() => openEdit(expense)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(expense.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal isOpen={!!editExpense} onClose={() => setEditExpense(null)} title="Edit Expense">
        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Amount</label>
            <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)}
              className="h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)}
              className="h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select value={editCategory} onChange={e => setEditCategory(e.target.value)}
              className="h-11 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500">
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Date</label>
            <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
              className="h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="md" fullWidth onClick={() => setEditExpense(null)}>Cancel</Button>
            <Button variant="primary" size="md" fullWidth onClick={handleSaveEdit} loading={saving}>Save</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="This expense will be permanently removed."
        loading={deleting}
      />
    </div>
  );
}
