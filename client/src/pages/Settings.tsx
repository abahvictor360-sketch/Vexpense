import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Wallet, PieChart, Tag, Database,
  LogOut, Download, Trash2, Save, Check, Sun, Moon, Monitor, Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { ICON_MAP } from '../components/ui/CategoryIcon';
import { useAuthStore } from '../store/authStore';
import { useExpenseStore } from '../store/expenseStore';
import { useCategoryStore } from '../store/categoryStore';
import { useBudgetStore } from '../store/budgetStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { COUNTRIES, exportToCSV, formatCurrency } from '../utils';
import { clsx } from '../utils/clsx';
import { useTheme, type Theme } from '../store/themeStore';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'financial' | 'budgets' | 'categories' | 'appearance' | 'data';

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'profile',    label: 'Profile',    icon: User     },
  { key: 'financial',  label: 'Financial',  icon: Wallet   },
  { key: 'budgets',    label: 'Budgets',    icon: PieChart },
  { key: 'categories', label: 'Categories', icon: Tag      },
  { key: 'appearance', label: 'Appearance', icon: Sun      },
  { key: 'data',       label: 'Data',       icon: Database },
];

const AVATAR_COLORS = ['#534AB7','#ef4444','#f59e0b','#10b981','#3b82f6','#ec4899','#8b5cf6','#f97316'];

// Smart budget distribution (% of monthly income)
const BUDGET_DISTRIBUTION: { name: string; pct: number; iconKey: string }[] = [
  { name: 'Rent & Bills',    pct: 0.25, iconKey: '🏠' },
  { name: 'Food & Drinks',   pct: 0.20, iconKey: '🍔' },
  { name: 'Savings',         pct: 0.15, iconKey: '💰' },
  { name: 'Transport',       pct: 0.10, iconKey: '🚗' },
  { name: 'Shopping',        pct: 0.08, iconKey: '🛍️' },
  { name: 'Health',          pct: 0.05, iconKey: '❤️' },
  { name: 'Entertainment',   pct: 0.05, iconKey: '🎬' },
  { name: 'Education',       pct: 0.04, iconKey: '📚' },
  { name: 'Subscriptions',   pct: 0.03, iconKey: '📱' },
  { name: 'Other',           pct: 0.05, iconKey: '📦' },
];

export default function Settings() {
  const navigate      = useNavigate();
  const { profile, updateProfile, signOut } = useAuthStore();
  const expenses      = useExpenseStore(s => s.expenses);
  const { categories, addCategory, deleteCategory } = useCategoryStore();
  const { budgets, upsertBudget } = useBudgetStore();
  const [theme, setTheme] = useTheme();

  const [tab, setTab]         = useState<Tab>('profile');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [deleteAccount, setDeleteAccount] = useState(false);

  // Profile form
  const [name, setName]             = useState(profile?.full_name ?? '');
  const [avatarColor, setAvatarColor] = useState(profile?.avatar_color ?? '#534AB7');

  // Financial form
  const [income, setIncome]         = useState(String(profile?.monthly_income ?? ''));
  const [currency, setCurrency]     = useState(profile?.currency ?? 'NGN');
  const [countryCode, setCountryCode] = useState(profile?.country_code ?? 'NG');
  const [generatingBudgets, setGeneratingBudgets] = useState(false);

  // New category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📦');
  const [addingCat, setAddingCat]   = useState(false);

  const parsedIncome = parseFloat(income) || 0;

  const saveProfile = async () => {
    setSaving(true);
    await updateProfile({ full_name: name, avatar_color: avatarColor });
    setSaving(false); setSaved(true); toast.success('Profile saved!');
    setTimeout(() => setSaved(false), 2000);
  };

  const saveFinancial = async () => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    setSaving(true);
    await updateProfile({
      monthly_income: parsedIncome,
      currency,
      country_code: countryCode,
      country_name: country?.name ?? countryCode,
    });
    setSaving(false); setSaved(true); toast.success('Financial info saved!');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAutoGenerateBudgets = async () => {
    if (!profile || parsedIncome <= 0) return;
    setGeneratingBudgets(true);
    const now = new Date();
    let applied = 0;
    for (const { name: catName, pct } of BUDGET_DISTRIBUTION) {
      const cat = categories.find(c => c.name === catName);
      if (!cat) continue;
      await upsertBudget({
        user_id:     profile.id,
        category_id: cat.id,
        amount:      Math.round(parsedIncome * pct),
        month:       now.getMonth() + 1,
        year:        now.getFullYear(),
      });
      applied++;
    }
    setGeneratingBudgets(false);
    toast.success(`✨ ${applied} smart budgets applied!`);
    setTab('budgets');
  };

  const handleBudgetChange = async (categoryId: string, amount: string) => {
    if (!profile) return;
    const now = new Date();
    await upsertBudget({
      user_id:     profile.id,
      category_id: categoryId,
      amount:      parseFloat(amount) || 0,
      month:       now.getMonth() + 1,
      year:        now.getFullYear(),
    });
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim() || !profile) return;
    setAddingCat(true);
    await addCategory({ user_id: profile.id, name: newCatName, icon: newCatIcon, color: '#534AB7', is_default: false });
    setAddingCat(false);
    setNewCatName(''); setNewCatIcon('📦');
    toast.success('Category added!');
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/login');
  };

  const THEME_OPTIONS: { value: Theme; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'light',  label: 'Light',  Icon: Sun     },
    { value: 'dark',   label: 'Dark',   Icon: Moon    },
    { value: 'system', label: 'System', Icon: Monitor },
  ];

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0',
              tab === t.key
                ? 'bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Profile ─── */}
      {tab === 'profile' && (
        <div className="card flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Profile</h2>
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-card"
              style={{ backgroundColor: avatarColor }}
            >
              {name.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AVATAR_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setAvatarColor(c)}
                  className={clsx('w-7 h-7 rounded-lg transition-all', avatarColor === c ? 'scale-125 ring-2 ring-white dark:ring-slate-700 ring-offset-1 shadow-md' : '')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <Input label="Full name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          <Button
            variant="primary" size="md" onClick={saveProfile} loading={saving}
            icon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          >
            {saved ? 'Saved!' : 'Save Profile'}
          </Button>
        </div>
      )}

      {/* ─── Financial ─── */}
      {tab === 'financial' && (
        <div className="flex flex-col gap-4">
          <div className="card flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Financial Info</h2>
            <Input
              label="Monthly income"
              type="number"
              value={income}
              onChange={e => setIncome(e.target.value)}
              placeholder="0.00"
              hint="Used to generate smart budgets and AI insights"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Country</label>
              <select
                value={countryCode}
                onChange={e => {
                  const country = COUNTRIES.find(c => c.code === e.target.value);
                  setCountryCode(e.target.value);
                  if (country) setCurrency(country.currency);
                }}
                className="h-11 px-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
              </select>
            </div>
            <Input label="Currency code" value={currency} onChange={e => setCurrency(e.target.value)} placeholder="NGN" hint="e.g. NGN, USD, GBP" />
            <Button
              variant="primary" size="md" onClick={saveFinancial} loading={saving}
              icon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            >
              {saved ? 'Saved!' : 'Save Changes'}
            </Button>
          </div>

          {/* Smart Budget Generator */}
          {parsedIncome > 0 && (
            <div className="card flex flex-col gap-4">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Smart Budget Generator</h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    Based on your {formatCurrency(parsedIncome, currency)} income, here's a recommended monthly budget:
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                {BUDGET_DISTRIBUTION.map(({ name: catName, pct, iconKey }) => {
                  const BudgetIcon = (ICON_MAP[iconKey] ?? ICON_MAP['📦']) as LucideIcon;
                  return (
                  <div key={catName} className="flex items-center gap-3 py-1.5">
                    <BudgetIcon className="w-4 h-4 text-gray-500 dark:text-slate-400 flex-shrink-0" />
                    <span className="flex-1 text-sm text-gray-700 dark:text-slate-300">{catName}</span>
                    <span className="text-xs text-gray-400 dark:text-slate-500 w-8 text-right">{Math.round(pct * 100)}%</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums w-28 text-right">
                      {formatCurrency(Math.round(parsedIncome * pct), currency)}
                    </span>
                  </div>
                  );
                })}
              </div>

              <Button
                variant="primary"
                size="md"
                fullWidth
                loading={generatingBudgets}
                icon={<Sparkles className="w-4 h-4" />}
                onClick={handleAutoGenerateBudgets}
              >
                Apply Smart Budgets
              </Button>
              <p className="text-xs text-gray-400 dark:text-slate-500 text-center -mt-2">
                You can adjust individual budgets in the Budgets tab
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── Budgets ─── */}
      {tab === 'budgets' && (
        <div className="card flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Monthly Budgets</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Set spending limits per category. Changes save automatically.</p>
          </div>
          {categories.map(cat => {
            const budget = budgets.find(b => b.category_id === cat.id);
            return (
              <div key={cat.id} className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  {cat.icon}
                </div>
                <span className="flex-1 text-sm font-medium text-gray-700 dark:text-slate-300 truncate">{cat.name}</span>
                <input
                  type="number"
                  defaultValue={budget?.amount ?? ''}
                  placeholder="No limit"
                  onBlur={e => handleBudgetChange(cat.id, e.target.value)}
                  className="w-28 h-9 px-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-sm text-right focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Categories ─── */}
      {tab === 'categories' && (
        <div className="flex flex-col gap-4">
          <div className="card flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Add Custom Category</h2>
            <div className="flex gap-2">
              <input
                value={newCatIcon}
                onChange={e => setNewCatIcon(e.target.value)}
                className="w-14 h-10 text-center text-xl rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-brand-500"
                placeholder="📦"
              />
              <input
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="Category name"
                className="flex-1 h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
              <Button variant="primary" size="sm" onClick={handleAddCategory} loading={addingCat} disabled={!newCatName.trim()}>
                Add
              </Button>
            </div>
          </div>

          <div className="card flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">All Categories</h2>
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-slate-700 last:border-0">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: `${cat.color}20` }}>
                  {cat.icon}
                </div>
                <span className="flex-1 text-sm text-gray-700 dark:text-slate-300">{cat.name}</span>
                {cat.is_default ? (
                  <span className="text-xs text-gray-400 dark:text-slate-500 px-2">Default</span>
                ) : (
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="p-1.5 rounded-lg text-gray-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Appearance ─── */}
      {tab === 'appearance' && (
        <div className="card flex flex-col gap-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Appearance</h2>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Theme</p>
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={clsx(
                    'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                    theme === value
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30'
                      : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-600'
                  )}
                >
                  <div className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    theme === value ? 'bg-brand-100 dark:bg-brand-900/50' : 'bg-white dark:bg-slate-700'
                  )}>
                    <Icon className={clsx('w-5 h-5', theme === value ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-slate-500')} />
                  </div>
                  <span className={clsx(
                    'text-xs font-semibold',
                    theme === value ? 'text-brand-700 dark:text-brand-300' : 'text-gray-600 dark:text-slate-400'
                  )}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Notification Preferences</p>
            {[
              { label: 'Budget warnings',  desc: 'When a category exceeds 80% of budget'  },
              { label: 'Weekly summary',   desc: 'A weekly overview of your spending'      },
              { label: 'Goal milestones',  desc: 'At 25%, 50%, 75%, 100% of each goal'    },
              { label: 'Large expenses',   desc: 'When a single expense exceeds your average' },
            ].map(n => (
              <div key={n.label} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-slate-700 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{n.label}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{n.desc}</p>
                </div>
                <div className="w-10 h-6 bg-brand-600 rounded-full relative cursor-pointer flex-shrink-0">
                  <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-400 dark:text-slate-500">Push notifications coming soon.</p>
          </div>
        </div>
      )}

      {/* ─── Data ─── */}
      {tab === 'data' && (
        <div className="flex flex-col gap-4">
          <div className="card flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Export Data</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">Download all your expense data as a CSV file.</p>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{expenses.length} transactions</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">All time spending data</p>
              </div>
              <Button
                variant="outline" size="sm"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={() => { exportToCSV(expenses); toast.success('CSV downloaded!'); }}
              >
                Export CSV
              </Button>
            </div>
          </div>

          <div className="card flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Account</h2>
            <Button variant="outline" size="md" icon={<LogOut className="w-4 h-4" />} onClick={handleSignOut} fullWidth>
              Sign Out
            </Button>
            <Button variant="danger" size="md" icon={<Trash2 className="w-4 h-4" />} onClick={() => setDeleteAccount(true)} fullWidth>
              Delete Account
            </Button>
          </div>

          <div className="card text-center text-xs text-gray-400 dark:text-slate-500">
            <p className="font-semibold text-gray-500 dark:text-slate-400 mb-0.5">Vexpense v1.0.0</p>
            <p>Made with ❤️ for smart finance tracking</p>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteAccount}
        onClose={() => setDeleteAccount(false)}
        onConfirm={() => { toast.error('Contact support to delete your account.'); setDeleteAccount(false); }}
        title="Delete Account?"
        message="This action cannot be undone. All your data including expenses, goals, and settings will be permanently deleted."
        confirmLabel="Delete Account"
      />
    </div>
  );
}
