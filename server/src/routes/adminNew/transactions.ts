import { Router, Request, Response } from 'express';
import { supabase } from '../../lib/supabase';

const router = Router();

// In-memory flag store
const flaggedIds = new Set<string>();

function anon(id: string | null | undefined): string {
  if (!id) return 'unknown';
  return String(id).slice(0, 8);
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '25'), 10) || 25));
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const search = String(req.query.search ?? '').trim();
    const flaggedOnly = String(req.query.flagged ?? '') === 'true';
    const minAmount = parseFloat(String(req.query.minAmount ?? '0')) || 0;

    let query = supabase
      .from('expenses')
      .select('*, categories(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.ilike('description', `%${search}%`);
    }
    if (minAmount > 0) {
      query = query.gte('amount', minAmount);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    let items = (data ?? []).map((row: any) => ({
      id: row.id,
      user_id_anon: anon(row.user_id),
      amount: row.amount,
      description: row.description,
      category: row.categories?.name ?? 'Uncategorized',
      created_at: row.created_at,
      flagged: flaggedIds.has(row.id),
    }));

    if (flaggedOnly) {
      items = items.filter((i) => i.flagged);
    }

    const total = count ?? 0;
    return res.json({
      transactions: items,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error('Transactions list error:', err);
    return res.status(500).json({ error: 'Failed to load transactions' });
  }
});

router.put('/:id/flag', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  let flagged: boolean;
  if (flaggedIds.has(id)) {
    flaggedIds.delete(id);
    flagged = false;
  } else {
    flaggedIds.add(id);
    flagged = true;
  }

  await supabase.from('admin_audit_log').insert({
    admin_id: req.admin?.id,
    admin_email: req.admin?.email,
    action: flagged ? 'flag_transaction' : 'unflag_transaction',
    target_type: 'expenses',
    target_id: id,
    details: { flagged },
  });

  return res.json({ id, flagged });
});

router.get('/charts', async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const since = new Date(today);
    since.setDate(since.getDate() - 29);

    const { data } = await supabase
      .from('expenses')
      .select('created_at, amount, category_id')
      .gte('created_at', since.toISOString())
      .limit(20000);

    const days: { date: string; count: number; volume: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({ date: isoDate(d), count: 0, volume: 0 });
    }
    const dayMap = new Map(days.map((d) => [d.date, d]));

    for (const row of data ?? []) {
      const r = row as { created_at: string; amount: number | null };
      const key = isoDate(new Date(r.created_at));
      const bucket = dayMap.get(key);
      if (bucket) {
        bucket.count += 1;
        bucket.volume += Number(r.amount) || 0;
      }
    }

    // Amount distribution buckets
    const buckets = [
      { range: '0-1k', min: 0, max: 1000, count: 0 },
      { range: '1k-10k', min: 1000, max: 10000, count: 0 },
      { range: '10k-100k', min: 10000, max: 100000, count: 0 },
      { range: '100k-1M', min: 100000, max: 1000000, count: 0 },
      { range: '1M+', min: 1000000, max: Infinity, count: 0 },
    ];
    for (const row of data ?? []) {
      const amt = Number((row as { amount: number | null }).amount) || 0;
      for (const b of buckets) {
        if (amt >= b.min && amt < b.max) {
          b.count += 1;
          break;
        }
      }
    }

    return res.json({
      daily: days,
      transactionCount: days.map((d) => ({ date: d.date, value: d.count })),
      volume: days.map((d) => ({ date: d.date, value: d.volume })),
      distribution: buckets.map((b) => ({ name: b.range, value: b.count })),
    });
  } catch (err) {
    console.error('Transaction charts error:', err);
    return res.status(500).json({ error: 'Failed to load chart data' });
  }
});

export default router;
