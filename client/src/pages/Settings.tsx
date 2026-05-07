import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Wallet, PieChart, Tag, Bell, Database, LogOut, Download, Trash2, ChevronRight, Save, Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useExpenseStore } from '../store/expenseStore';
import { useCategoryStore } from '../store/categoryStore';
import { useBudgetStore } from '../store/budgetStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { COUNTRIES, exportToCSV, formatCurrency } from '../utils';
import { supabase } from '../lib/supabase';
import { clsx } from '../utils/clsx';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'financial' | 'budgets' | 'categories' | 'notifications' | 'data';

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'profile',       label: 'Profile',       icon: User      },
  { key: 'financial',     label: 'Financial',     icon: Wallet    },
  { key: 'budgets',       label: 'Budgets',       icon: PieChart  },
  { key: 'categories',    label: 'Categories',    icon: Tag       },
  { key: 'notifications', label: 'Alerts',        icon: Bell      },
  { key: 'data',          label: 'Data',          icon: Database  },
];

const AVATAR_COLORS = ['#534AB7','#ef4444','#f59e0b','#10b981','#3b82f6','#ec4899','#8b5cf6','#f97316'];

export default function Settings() {
  const navigate = useNavigate();
  const { profile, updateProfile, signOut } = useAuthStore();
  const expenses = useExpenseStore(s => s.expenses);
  const { categories, addCategory, deleteCategory } = useCategoryStore();
  const { budgets, upsertBudget } = useBudgetStore();

  const [tab, setTab] = useState<Tab>('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteAccount, setDeleteAccount] = useState(false);

  // Profile form
  const [name, setName] = useState(profile?.full_name ?? '');
  const [avatarColor, setAvatarColor] = useState(profile?.avatar_color ?? '#534AB7');

  // Financial form
  const [income, setIncome] = useState(String(profile?.monthly_income ?? ''));
  const [currency, setCurrency] = useState(profile?.currency ?? 'USD');
  const [countryCode, setCountryCode] = useState(profile?.country_code ?? 'US');

  // New category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📦');
  const [newCatColor, setNewCatColor] = useState('#534AB7');
  const [addingCat, setAddingCat] = useState(false);

  const currency_display = profile?.currency ?? 'USD';

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
      monthly_income: parseFloat(income) || 0,
      currency,
      country_code: countryCode,
      country_name: country?.name ?? countryCode,
    });
    setSaving(false); setSaved(true); toast.success('Financial info saved!');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleBudgetChange = async (categoryId: string, amount: string) => {
    if (!profile) return;
    const now = new Date();
    await upsertBudget({
      user_id: profile.id,
      category_id: categoryId,
      amount: parseFloat(amount) || 0,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim() || !profile) return;
    setAddingCat(true);
    await addCategory({ user_id: profile.id, name: newCatName, icon: newCatIcon, color: newCatColor, is_default: false });
    setAddingCat(false);
    setNewCatName(''); setNewCatIcon('📦');
    toast.success('Category added!');
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    toast.error('Please contact support to delete your account.');
    setDeleteAccount(false);
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>

      {/* Tab bar (horizontal scroll) */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar bg-gray-100 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0',
              tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'profile' && (
        <div className="card flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-900">Profile</h2>
          {/* Avatar preview */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-card"
              style={{ backgroundColor: avatarColor }}>
              {name.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AVATAR_COLORS.map(c => (
                <button key={c} onClick={() => setAvatarColor(c)}
                  className={clsx('w-7 h-7 rounded-lg transition-all', avatarColor === c ? 'scale-125 ring-2 ring-white ring-offset-1 shadow-md' : '')}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <Input label="Full name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          <Button variant="primary" size="md" onClick={saveProfile} loading={saving} icon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}>
            {saved ? 'Saved!' : 'Save Profile'}
          </Button>
        </div>
      )}

      {tab === 'financial' && (
        <div className="card flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-900">Financial Info</h2>
          <Input label="Monthly income" type="number" value={income} onChange={e => setIncome(e.target.value)} placeholder="0.00" hint="Used for budget recommendations and AI insights" />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Country</label>
            <select value={countryCode} onChange={e => {
              const country = COUNTRIES.find(c => c.code === e.target.value);
              setCountryCode(e.target.value);
              if (country) setCurrency(country.currency);
            }} className="h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20">
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
            </select>
          </div>
          <Input label="Currency code" value={currency} onChange={e => setCurrency(e.target.value)} placeholder="USD" hint="e.g. USD, NGN, GBP" />
          <Button variant="primary" size="md" onClick={saveFinancial} loading={saving} icon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}>
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      )}

      {tab === 'budgets' && (
        <div className="card flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-900">Monthly Budgets</h2>
          <p className="text-xs text-gray-500">Set spending limits per category for this month. Changes save automatically.</p>
          {categories.filter(c => !c.is_default || true).map(cat => {
            const budget = budgets.find(b => b.category_id === cat.id);
            return (
              <div key={cat.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: `${cat.color}20` }}>
                  {cat.icon}
                </div>
                <span className="flex-1 text-sm font-medium text-gray-700 truncate">{cat.name}</span>
                <input
                  type="number"
                  defaultValue={budget?.amount ?? ''}
                  placeholder="No limit"
                  onBlur={e => handleBudgetChange(cat.id, e.target.value)}
                  className="w-28 h-9 px-3 rounded-xl border border-gray-200 text-sm text-right focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            );
          })}
        </div>
      )}

      {tab === 'categories' && (
        <div className="flex flex-col gap-4">
          <div className="card flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-900">Add Custom Category</h2>
            <div className="flex gap-2">
              <input value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} className="w-14 h-10 text-center text-xl rounded-xl border border-gray-200 focus:outline-none focus:border-brand-500" placeholder="📦" />
              <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Category name" className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
              <Button variant="primary" size="sm" onClick={handleAddCategory} loading={addingCat} disabled={!newCatName.trim()}>Add</Button>
            </div>
          </div>

          <div className="card flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">All Categories</h2>
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: `${cat.color}20` }}>{cat.icon}</div>
                <span className="flex-1 text-sm text-gray-700">{cat.name}</span>
                {cat.is_default ? (
                  <span className="text-xs text-gray-400 px-2">Default</span>
                ) : (
                  <button onClick={() => deleteCategory(cat.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="card flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-900">Notification Preferences</h2>
          <p className="text-xs text-gray-400">Push notifications coming soon. These are your preferences for when they're enabled.</p>
          {[
            { label: 'Budget warnings', desc: 'When a category exceeds 80% of budget' },
            { label: 'Weekly summary', desc: 'A weekly overview of your spending' },
            { label: 'Goal milestones', desc: 'When you reach 25%, 50%, 75%, 100% of a goal' },
            { label: 'Large expenses', desc: 'When a single expense exceeds your average' },
          ].map(n => (
            <div key={n.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{n.label}</p>
                <p className="text-xs text-gray-400">{n.desc}</p>
              </div>
              <div className="w-10 h-6 bg-brand-600 rounded-full relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'data' && (
        <div className="flex flex-col gap-4">
          <div className="card flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-900">Export Data</h2>
            <p className="text-sm text-gray-500">Download all your expense data as a CSV file.</p>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-800">{expenses.length} transactions</p>
                <p className="text-xs text-gray-400">All time spending data</p>
              </div>
              <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={() => { exportToCSV(expenses); toast.success('CSV downloaded!'); }}>
                Export CSV
              </Button>
            </div>
          </div>

          <div className="card flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-700">Account</h2>
            <Button variant="outline" size="md" icon={<LogOut className="w-4 h-4" />} onClick={handleSignOut} fullWidth>
              Sign Out
            </Button>
            <Button variant="danger" size="md" icon={<Trash2 className="w-4 h-4" />} onClick={() => setDeleteAccount(true)} fullWidth>
              Delete Account
            </Button>
          </div>

          <div className="card text-center text-xs text-gray-400">
            <p className="font-semibold text-gray-500 mb-0.5">Vexpense v1.0.0</p>
            <p>Made with ❤️ for smart finance tracking</p>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteAccount}
        onClose={() => setDeleteAccount(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account?"
        message="This action cannot be undone. All your data including expenses, goals, and settings will be permanently deleted."
        confirmLabel="Delete Account"
      />
    </div>
  );
}
