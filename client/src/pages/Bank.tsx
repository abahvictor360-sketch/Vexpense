import { useEffect, useState, useCallback } from 'react';
import {
  Building2, RefreshCw, Trash2, TrendingDown, TrendingUp,
  Sparkles, Link2, Unlink, AlertCircle, CreditCard, ArrowDownLeft, ArrowUpRight,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { clsx } from '../utils/clsx';
import { formatCurrency } from '../utils';
import toast from 'react-hot-toast';

// ── Mono Connect global type ──────────────────────────────────────────────────
declare global {
  interface Window {
    MonoConnect: new (options: {
      key: string;
      scope?: string;
      data?: { customer: { name: string; email: string } };
      onSuccess: (data: { code: string }) => void;
      onClose?: () => void;
    }) => { setup: () => void; open: () => void };
  }
}

const BASE_URL     = (import.meta.env.VITE_API_BASE_URL as string) ?? 'http://localhost:3001';
const MONO_PUB_KEY = (import.meta.env.VITE_MONO_PUBLIC_KEY as string) ?? '';

interface LinkedAccount {
  id: string;
  institution_name: string;
  account_name: string;
  account_number: string;
  currency: string;
  balance: number;
  last_synced: string | null;
  created_at: string;
}

interface BankTransaction {
  id: string;
  amount: number;
  type: 'debit' | 'credit';
  narration: string;
  date: string;
  balance: number;
  category: string | null;
  account: { institution_name: string; account_name: string; currency: string } | null;
}

async function apiFetch<T>(path: string, options?: RequestInit, token?: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function AccountCard({ account, onSync, onDelete, syncing }: {
  account: LinkedAccount;
  onSync: (id: string) => void;
  onDelete: (id: string) => void;
  syncing: boolean;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{account.institution_name}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">{account.account_name}</p>
            {account.account_number && (
              <p className="text-xs text-gray-400 dark:text-slate-500 font-mono">
                ···{account.account_number.slice(-4)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSync(account.id)}
            disabled={syncing}
            className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
            title="Sync transactions"
          >
            <RefreshCw className={clsx('w-4 h-4', syncing && 'animate-spin')} />
          </button>
          <button
            onClick={() => onDelete(account.id)}
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Unlink account"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl p-4 text-white">
        <p className="text-xs text-white/60 font-medium mb-1">Current Balance</p>
        <p className="text-2xl font-bold tabular-nums">
          {formatCurrency(account.balance, account.currency)}
        </p>
      </div>

      {account.last_synced && (
        <p className="text-[10px] text-gray-400 dark:text-slate-600 mt-2 text-right">
          Last synced: {new Date(account.last_synced).toLocaleString()}
        </p>
      )}
    </div>
  );
}

export default function Bank() {
  const { profile } = useAuthStore();
  const [accounts,     setAccounts]     = useState<LinkedAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [analysis,     setAnalysis]     = useState<string | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [syncing,      setSyncing]      = useState<string | null>(null);
  const [linking,      setLinking]      = useState(false);
  const [analyzing,    setAnalyzing]    = useState(false);
  const [tab,          setTab]          = useState<'accounts' | 'transactions' | 'analysis'>('accounts');

  const getToken = useCallback(async () => {
    const { supabase } = await import('../lib/supabase');
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? '';
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      const token = await getToken();
      const data = await apiFetch<LinkedAccount[]>('/api/bank/accounts', {}, token);
      setAccounts(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      const token = await getToken();
      const data  = await apiFetch<BankTransaction[]>('/api/bank/transactions?limit=100', {}, token);
      setTransactions(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadAccounts(), loadTransactions()]);
      setLoading(false);
    })();
  }, []);

  // ── Link new account via Mono Connect ────────────────────────────────────────
  const handleLink = () => {
    if (!MONO_PUB_KEY) {
      toast.error('VITE_MONO_PUBLIC_KEY not set. Add it to Vercel env vars.');
      return;
    }
    if (!window.MonoConnect) {
      toast.error('Mono Connect failed to load. Check your internet connection.');
      return;
    }
    setLinking(true);
    const connect = new window.MonoConnect({
      key: MONO_PUB_KEY,
      ...(profile && {
        scope: 'accounts',
        data: { customer: { name: profile.full_name ?? '', email: profile.email ?? '' } },
      }),
      onSuccess: async ({ code }) => {
        setLinking(false);
        try {
          const token = await getToken();
          await apiFetch('/api/bank/link', { method: 'POST', body: JSON.stringify({ code }) }, token);
          toast.success('Bank account linked!');
          await loadAccounts();
        } catch (e: any) {
          toast.error(e.message ?? 'Failed to link account');
        }
      },
      onClose: () => setLinking(false),
    });
    connect.setup();
    connect.open();
  };

  // ── Sync transactions for one account ────────────────────────────────────────
  const handleSync = async (accountId: string) => {
    setSyncing(accountId);
    try {
      const token  = await getToken();
      const result = await apiFetch<{ synced: number }>(
        `/api/bank/sync/${accountId}`, { method: 'POST' }, token
      );
      toast.success(`Synced ${result.synced} transactions`);
      await Promise.all([loadAccounts(), loadTransactions()]);
    } catch (e: any) {
      toast.error(e.message ?? 'Sync failed');
    }
    setSyncing(null);
  };

  // ── Unlink account ────────────────────────────────────────────────────────────
  const handleDelete = async (accountId: string) => {
    try {
      const token = await getToken();
      await apiFetch(`/api/bank/accounts/${accountId}`, { method: 'DELETE' }, token);
      toast.success('Account unlinked');
      setAccounts(prev => prev.filter(a => a.id !== accountId));
      setTransactions(prev => prev.filter(t => t.account !== null));
    } catch {
      toast.error('Failed to unlink');
    }
  };

  // ── AI Analysis ───────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    setAnalyzing(true);
    setTab('analysis');
    try {
      const token = await getToken();
      const { analysis: text } = await apiFetch<{ analysis: string }>(
        '/api/bank/analyze', { method: 'POST' }, token
      );
      setAnalysis(text);
    } catch (e: any) {
      setAnalysis(`Could not load analysis: ${e.message}`);
    }
    setAnalyzing(false);
  };

  const noBackend = !BASE_URL || BASE_URL === 'http://localhost:3001';

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-brand-600" /> Bank Accounts
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Link your bank to import real transactions
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Link2 className="w-4 h-4" />}
          onClick={handleLink}
          loading={linking}
        >
          Link Bank
        </Button>
      </div>

      {/* Backend not deployed warning */}
      {noBackend && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Backend not deployed yet</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Bank features require the Express server. Deploy to Railway and set{' '}
              <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">VITE_API_BASE_URL</code> in Vercel.
              Also add <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">MONO_SECRET_KEY</code> and{' '}
              <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">VITE_MONO_PUBLIC_KEY</code>.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
        {(['accounts', 'transactions', 'analysis'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all',
              tab === t
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            )}
          >
            {t}
            {t === 'transactions' && transactions.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-brand-600 text-white text-[9px] font-bold rounded-full">
                {transactions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── ACCOUNTS TAB ──────────────────────────────────────────────────────── */}
      {tab === 'accounts' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {loading ? (
            <div className="space-y-3">
              {[0, 1].map(i => <div key={i} className="h-44 rounded-2xl skeleton" />)}
            </div>
          ) : accounts.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-7 h-7 text-brand-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No bank linked yet</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-5 max-w-xs mx-auto">
                Connect your Nigerian bank account to automatically import and analyze your spending
              </p>
              <Button variant="primary" size="md" icon={<Link2 className="w-4 h-4" />} onClick={handleLink} loading={linking}>
                Link Your Bank
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {accounts.map(account => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onSync={handleSync}
                    onDelete={handleDelete}
                    syncing={syncing === account.id}
                  />
                ))}
                {/* Add another account */}
                <button
                  onClick={handleLink}
                  className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 p-5 flex flex-col items-center justify-center gap-2 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all group"
                >
                  <Link2 className="w-6 h-6 text-gray-300 dark:text-slate-600 group-hover:text-brand-500 transition-colors" />
                  <span className="text-sm font-medium text-gray-400 dark:text-slate-500 group-hover:text-brand-600 transition-colors">
                    Link another bank
                  </span>
                </button>
              </div>
              {transactions.length > 0 && (
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  icon={<Sparkles className="w-4 h-4" />}
                  onClick={handleAnalyze}
                  loading={analyzing}
                >
                  Analyze with AI
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TRANSACTIONS TAB ────────────────────────────────────────────────────── */}
      {tab === 'transactions' && (
        <div className="animate-fade-in">
          {loading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => <div key={i} className="h-16 rounded-2xl skeleton" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-10 text-center">
              <CreditCard className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No transactions yet</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Link a bank account and sync to see your transaction history
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {transactions.length} Transactions
                </h3>
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1 text-red-500">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {formatCurrency(
                      transactions.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0),
                      transactions[0]?.account?.currency ?? 'NGN'
                    )}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-500">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {formatCurrency(
                      transactions.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0),
                      transactions[0]?.account?.currency ?? 'NGN'
                    )}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-[60vh] overflow-y-auto">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className={clsx(
                      'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                      tx.type === 'debit'
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : 'bg-emerald-50 dark:bg-emerald-900/20'
                    )}>
                      {tx.type === 'debit'
                        ? <ArrowUpRight className="w-4 h-4 text-red-500" />
                        : <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{tx.narration}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500">
                        <span>{tx.date}</span>
                        {tx.account && (
                          <>
                            <span>·</span>
                            <span>{tx.account.institution_name}</span>
                          </>
                        )}
                        {tx.category && (
                          <>
                            <span>·</span>
                            <span className="capitalize">{tx.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <p className={clsx(
                      'text-sm font-bold tabular-nums flex-shrink-0',
                      tx.type === 'debit' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                    )}>
                      {tx.type === 'debit' ? '−' : '+'}
                      {formatCurrency(Number(tx.amount), tx.account?.currency ?? 'NGN')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {transactions.length > 0 && (
            <div className="mt-4">
              <Button
                variant="primary"
                size="md"
                fullWidth
                icon={<Sparkles className="w-4 h-4" />}
                onClick={handleAnalyze}
                loading={analyzing}
              >
                Analyze Spending with AI
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── ANALYSIS TAB ──────────────────────────────────────────────────────── */}
      {tab === 'analysis' && (
        <div className="animate-fade-in">
          {analyzing ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-8 text-center shadow-card">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-brand-600 animate-pulse" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">Analyzing your transactions…</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">Claude is reading your spending patterns</p>
              <div className="mt-4 space-y-2 text-left max-w-sm mx-auto">
                {['skeleton h-3 w-full rounded-md', 'skeleton h-3 w-5/6 rounded-md', 'skeleton h-3 w-4/6 rounded-md'].map((c, i) => (
                  <div key={i} className={c} />
                ))}
              </div>
            </div>
          ) : analysis ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-card overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 dark:border-slate-700 bg-brand-50 dark:bg-brand-900/20">
                <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-900 dark:text-brand-200">AI Bank Analysis</p>
                  <p className="text-xs text-brand-600 dark:text-brand-400">
                    Based on {transactions.length} real bank transactions
                  </p>
                </div>
                <button
                  onClick={handleAnalyze}
                  className="ml-auto p-1.5 rounded-lg text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
                  title="Refresh analysis"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="px-5 py-5">
                <div className="prose prose-sm max-w-none text-gray-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {analysis}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-10 text-center">
              <Sparkles className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No analysis yet</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
                Sync your transactions first, then let Claude analyze your spending
              </p>
              {transactions.length > 0 ? (
                <Button variant="primary" size="md" icon={<Sparkles className="w-4 h-4" />} onClick={handleAnalyze}>
                  Analyze Now
                </Button>
              ) : (
                <Button variant="outline" size="md" onClick={() => setTab('accounts')}>
                  Link a bank first
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Unlink info footer */}
      {accounts.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-600 mt-1">
          <Unlink className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Powered by Mono Open Banking. Vexpense only reads data — we never initiate transactions.
          </span>
        </div>
      )}
    </div>
  );
}
