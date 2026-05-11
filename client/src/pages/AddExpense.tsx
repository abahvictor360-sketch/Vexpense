import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useExpenseStore } from '../store/expenseStore';
import { useBudgetStore } from '../store/budgetStore';
import { useCategoryStore } from '../store/categoryStore';
import { formatCurrency, getMonthRange } from '../utils';
import { Button } from '../components/ui/Button';
import { clsx } from '../utils/clsx';
import type { PaymentMethod, Category } from '../types';
import toast from 'react-hot-toast';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; emoji: string }[] = [
  { value: 'cash',     label: 'Cash',     emoji: '💵' },
  { value: 'card',     label: 'Card',     emoji: '💳' },
  { value: 'transfer', label: 'Transfer', emoji: '📲' },
];

const KEYWORD_MAP: Record<string, string> = {
  uber: 'Transport', lyft: 'Transport', bolt: 'Transport', taxi: 'Transport', bus: 'Transport', fuel: 'Transport', petrol: 'Transport',
  food: 'Food & Drinks', lunch: 'Food & Drinks', dinner: 'Food & Drinks', breakfast: 'Food & Drinks', restaurant: 'Food & Drinks', kfc: 'Food & Drinks', pizza: 'Food & Drinks',
  rent: 'Rent & Bills', electricity: 'Rent & Bills', water: 'Rent & Bills', internet: 'Rent & Bills', wifi: 'Rent & Bills',
  netflix: 'Subscriptions', spotify: 'Subscriptions', youtube: 'Subscriptions', subscription: 'Subscriptions',
  gym: 'Health', hospital: 'Health', doctor: 'Health', pharmacy: 'Health', medicine: 'Health',
  school: 'Education', tuition: 'Education', book: 'Education', course: 'Education',
  shopping: 'Shopping', clothes: 'Shopping', amazon: 'Shopping',
  movie: 'Entertainment', game: 'Entertainment', concert: 'Entertainment',
};

export default function AddExpense() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const addExpense = useExpenseStore(s => s.addExpense);
  const expenses = useExpenseStore(s => s.expenses);
  const budgets = useBudgetStore(s => s.budgets);
  const categories = useCategoryStore(s => s.categories);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);
  useEffect(() => { amountRef.current?.focus(); }, []);

  const currency = profile?.currency ?? 'USD';

  // Smart category suggestion from description
  useEffect(() => {
    if (!description || selectedCategory) return;
    const lower = description.toLowerCase();
    for (const [kw, catName] of Object.entries(KEYWORD_MAP)) {
      if (lower.includes(kw)) {
        const match = categories.find(c => c.name === catName);
        if (match) { setSelectedCategory(match); break; }
      }
    }
  }, [description]);

  // Budget warning check
  useEffect(() => {
    if (!selectedCategory || !amount) { setBudgetWarning(null); return; }
    const budget = budgets.find(b => b.category_id === selectedCategory.id);
    if (!budget) { setBudgetWarning(null); return; }

    const { start, end } = getMonthRange();
    const spent = expenses
      .filter(e => e.category_id === selectedCategory.id && e.date >= start && e.date <= end)
      .reduce((s, e) => s + Number(e.amount), 0);

    const newTotal = spent + parseFloat(amount || '0');
    if (newTotal > Number(budget.amount)) {
      setBudgetWarning(`This will exceed your ${selectedCategory.name} budget (${formatCurrency(budget.amount, currency)})`);
    } else if (newTotal / Number(budget.amount) > 0.8) {
      setBudgetWarning(`This brings ${selectedCategory.name} to ${((newTotal / Number(budget.amount)) * 100).toFixed(0)}% of budget`);
    } else {
      setBudgetWarning(null);
    }
  }, [selectedCategory, amount]);

  // This month's spend in selected category
  const categorySpentThisMonth = (() => {
    if (!selectedCategory) return 0;
    const { start, end } = getMonthRange();
    return expenses
      .filter(e => e.category_id === selectedCategory.id && e.date >= start && e.date <= end)
      .reduce((s, e) => s + Number(e.amount), 0);
  })();

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!selectedCategory) {
      toast.error('Select a category');
      return;
    }
    if (!user) return;

    setLoading(true);
    const result = await addExpense({
      user_id: user.id,
      category_id: selectedCategory.id,
      amount: parseFloat(amount),
      description: description || selectedCategory.name,
      notes: notes || null,
      date,
      payment_method: paymentMethod,
      receipt_url: null,
    });
    setLoading(false);

    if (result) {
      setSuccess(true);
      toast.success(`${formatCurrency(parseFloat(amount), currency)} added to ${selectedCategory.name}`);
      setTimeout(() => {
        setSuccess(false);
        setAmount('');
        setDescription('');
        setSelectedCategory(null);
        setNotes('');
        setShowNotes(false);
      }, 1200);
    } else {
      toast.error('Failed to save — check browser console for details');
    }
  };

  return (
    <div className="flex flex-col gap-0 animate-fade-in max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center shadow-card text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Add Expense</h1>
      </div>

      {/* Amount Input */}
      <div className="card mb-4 text-center">
        <p className="text-xs text-gray-400 dark:text-slate-500 font-medium uppercase tracking-wide mb-2">Amount</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl text-gray-400 dark:text-slate-500 font-light">{currency}</span>
          <input
            ref={amountRef}
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className={clsx(
              'text-4xl font-bold bg-transparent border-none outline-none text-center tabular-nums w-48',
              amount ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-slate-600'
            )}
          />
        </div>
      </div>

      {/* Category Grid */}
      <div className="card mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Category</p>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory?.id ? null : cat)}
              className={clsx(
                'flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2 transition-all duration-150 active:scale-95',
                selectedCategory?.id === cat.id
                  ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 shadow-brand'
                  : 'border-transparent bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600'
              )}
            >
              <span className="text-2xl leading-none">{cat.icon}</span>
              <span className={clsx(
                'text-[10px] font-medium leading-tight text-center line-clamp-1',
                selectedCategory?.id === cat.id ? 'text-brand-700' : 'text-gray-600'
              )}>
                {cat.name.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
        {selectedCategory && categorySpentThisMonth > 0 && (
          <p className="mt-3 text-xs text-gray-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 inline-block" />
            You've spent {formatCurrency(categorySpentThisMonth, currency)} in {selectedCategory.name} this month
          </p>
        )}
      </div>

      {/* Details */}
      <div className="card mb-4 flex flex-col gap-3">
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-sm placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />

        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />

        {/* Payment Method */}
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map(m => (
            <button
              key={m.value}
              onClick={() => setPaymentMethod(m.value)}
              className={clsx(
                'flex items-center justify-center gap-1.5 h-11 rounded-xl border-2 text-sm font-medium transition-all',
                paymentMethod === m.value
                  ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
              )}
            >
              <span>{m.emoji}</span> {m.label}
            </button>
          ))}
        </div>

        {/* Notes toggle */}
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {showNotes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showNotes ? 'Hide note' : 'Add note (optional)'}
        </button>
        {showNotes && (
          <textarea
            placeholder="Any additional notes..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-sm placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"
          />
        )}
      </div>

      {/* Budget Warning */}
      {budgetWarning && (
        <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl mb-4 animate-slide-up">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-700">{budgetWarning}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/expenses')}
          className="flex-1"
        >
          View All
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          loading={loading}
          className="flex-1"
          icon={success ? <CheckCircle2 className="w-4 h-4" /> : undefined}
        >
          {success ? 'Saved!' : 'Save Expense'}
        </Button>
      </div>
    </div>
  );
}
