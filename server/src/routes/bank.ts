import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { validateAuth } from '../middleware/validateAuth';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

const MONO_SECRET = process.env.MONO_SECRET_KEY ?? '';
const MONO_BASE   = 'https://api.withmono.com/v2';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function monoFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${MONO_BASE}${path}`, {
    ...options,
    headers: {
      'mono-sec-key': MONO_SECRET,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });
  return res.json();
}

// ─── POST /api/bank/link ──────────────────────────────────────────────────────
// Exchange Mono auth code for account_id, store in DB
router.post('/link', validateAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.body as { code: string };
    const user = (req as any).user;

    if (!code) { res.status(400).json({ error: 'code is required' }); return; }
    if (!MONO_SECRET) { res.status(503).json({ error: 'MONO_SECRET_KEY not configured' }); return; }

    // 1. Exchange code → account_id
    const initData = await monoFetch('/accounts/initiate', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    const monoAccountId: string = initData.id;
    if (!monoAccountId) {
      res.status(400).json({ error: initData.message ?? 'Mono link failed' }); return;
    }

    // 2. Fetch account details
    const accountData = await monoFetch(`/accounts/${monoAccountId}`);

    // 3. Upsert into linked_accounts
    const { data, error } = await supabase
      .from('linked_accounts')
      .upsert({
        user_id:          user.id,
        mono_account_id:  monoAccountId,
        institution_name: accountData.institution?.name ?? 'Unknown Bank',
        account_name:     accountData.name ?? '',
        account_number:   accountData.accountNumber ?? '',
        currency:         accountData.currency ?? 'NGN',
        balance:          (accountData.balance ?? 0) / 100,
      }, { onConflict: 'user_id,mono_account_id' })
      .select()
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Unexpected error linking account' });
  }
});

// ─── GET /api/bank/accounts ───────────────────────────────────────────────────
router.get('/accounts', validateAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;
  const { data } = await supabase
    .from('linked_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  res.json(data ?? []);
});

// ─── POST /api/bank/sync/:id ──────────────────────────────────────────────────
// Fetch latest transactions from Mono and store in bank_transactions
router.post('/sync/:id', validateAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Verify ownership
    const { data: account } = await supabase
      .from('linked_accounts')
      .select('mono_account_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!account) { res.status(404).json({ error: 'Account not found' }); return; }

    // Fetch from Mono
    const txData = await monoFetch(
      `/accounts/${account.mono_account_id}/transactions?paginate=false&limit=100`
    );

    const rows = (txData.data ?? []).map((tx: any) => ({
      user_id:           user.id,
      linked_account_id: id,
      mono_id:           tx._id ?? tx.id,
      amount:            Math.abs((tx.amount ?? 0) / 100),
      type:              tx.type ?? 'debit',
      narration:         tx.narration ?? tx.description ?? '',
      date:              (tx.date ?? '').split('T')[0] || null,
      balance:           (tx.balance ?? 0) / 100,
      category:          tx.category ?? null,
    }));

    if (rows.length) {
      await supabase
        .from('bank_transactions')
        .upsert(rows, { onConflict: 'mono_id', ignoreDuplicates: true });
    }

    // Refresh balance from latest transaction
    const newBalance = rows[0]?.balance;
    await supabase
      .from('linked_accounts')
      .update({
        last_synced: new Date().toISOString(),
        ...(newBalance != null && { balance: newBalance }),
      })
      .eq('id', id);

    res.json({ synced: rows.length });
  } catch {
    res.status(500).json({ error: 'Sync failed' });
  }
});

// ─── GET /api/bank/transactions ───────────────────────────────────────────────
router.get('/transactions', validateAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;
  const limit  = Math.min(parseInt(String(req.query.limit ?? '50')), 200);
  const offset = parseInt(String(req.query.offset ?? '0'));

  const { data } = await supabase
    .from('bank_transactions')
    .select('*, account:linked_accounts(institution_name, account_name, currency)')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  res.json(data ?? []);
});

// ─── POST /api/bank/analyze ───────────────────────────────────────────────────
// Claude AI analysis of real bank transaction history
router.post('/analyze', validateAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    // Get last 100 transactions + account info
    const { data: txs } = await supabase
      .from('bank_transactions')
      .select('*, account:linked_accounts(institution_name, currency)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(100);

    if (!txs?.length) {
      res.json({ analysis: 'No bank transactions found. Sync your account first.' }); return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, currency, monthly_income')
      .eq('id', user.id)
      .single();

    const currency = profile?.currency ?? 'NGN';
    const income   = profile?.monthly_income ?? 0;

    // Build transaction summary for Claude
    const lines = txs.slice(0, 60).map(tx =>
      `${tx.date}: [${tx.type?.toUpperCase()}] ${currency} ${Number(tx.amount).toLocaleString()} — ${tx.narration}`
    );

    const debitTotal  = txs.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0);
    const creditTotal = txs.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0);

    const prompt = `You are a personal finance advisor analyzing real bank account transactions.

User: ${profile?.full_name ?? 'User'}
Monthly income set in app: ${income > 0 ? `${currency} ${income.toLocaleString()}` : 'Not set'}
Total debits (last ${txs.length} txns): ${currency} ${debitTotal.toLocaleString()}
Total credits (last ${txs.length} txns): ${currency} ${creditTotal.toLocaleString()}

Recent transactions:
${lines.join('\n')}

Provide a concise analysis with:
1. **Top spending patterns** — what categories appear most (based on narrations)
2. **Recurring charges** — subscriptions or regular payments detected
3. **Cash flow summary** — income vs spending ratio
4. **3 specific actionable tips** — based on the actual transaction data

Keep it practical, specific, and under 350 words.`;

    const message = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages:   [{ role: 'user', content: prompt }],
    });

    const analysis = message.content[0].type === 'text' ? message.content[0].text : '';
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// ─── DELETE /api/bank/accounts/:id ───────────────────────────────────────────
router.delete('/accounts/:id', validateAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;
  await supabase.from('linked_accounts').delete().eq('id', req.params.id).eq('user_id', user.id);
  res.json({ ok: true });
});

export default router;
