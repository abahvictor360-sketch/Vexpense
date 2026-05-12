import { Router, Request, Response } from 'express';
import { supabase } from '../../lib/supabase';

const router = Router();

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

router.get('/overview', async (_req: Request, res: Response) => {
  try {
    const [usersRes, expensesRes, aiRes, goalsRes, budgetsRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('expenses').select('*', { count: 'exact', head: true }),
      supabase.from('ai_conversations').select('*', { count: 'exact', head: true }),
      supabase.from('goals').select('*', { count: 'exact', head: true }),
      supabase.from('budgets').select('*', { count: 'exact', head: true }),
    ]);

    // Active users: profiles created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Sum of expense amounts
    const { data: expensesSum } = await supabase
      .from('expenses')
      .select('amount')
      .limit(10000);
    const totalVolume = (expensesSum ?? []).reduce(
      (sum: number, r: { amount: number | null }) => sum + (Number(r.amount) || 0),
      0
    );

    // Flagged transactions count (in-memory set; managed in transactions.ts)
    return res.json({
      totalUsers: usersRes.count ?? 0,
      activeUsers: activeUsers ?? 0,
      totalExpenses: expensesRes.count ?? 0,
      totalVolume,
      totalAiConversations: aiRes.count ?? 0,
      totalGoals: goalsRes.count ?? 0,
      totalBudgets: budgetsRes.count ?? 0,
      aiCostEstimate: ((aiRes.count ?? 0) * 0.0015).toFixed(2),
      systemStatus: 'healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Stats overview error:', err);
    return res.status(500).json({ error: 'Failed to load stats' });
  }
});

router.get('/charts', async (_req: Request, res: Response) => {
  try {
    // Build last 30 days of data
    const today = startOfDay(new Date());
    const days: { date: string; users: number; expenses: number; volume: number; ai: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({ date: isoDate(d), users: 0, expenses: 0, volume: 0, ai: 0 });
    }
    const map = new Map(days.map((d) => [d.date, d]));

    const since = new Date(today);
    since.setDate(since.getDate() - 29);

    const [users, expenses, ai] = await Promise.all([
      supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', since.toISOString())
        .limit(10000),
      supabase
        .from('expenses')
        .select('created_at, amount')
        .gte('created_at', since.toISOString())
        .limit(10000),
      supabase
        .from('ai_conversations')
        .select('created_at')
        .gte('created_at', since.toISOString())
        .limit(10000),
    ]);

    for (const row of users.data ?? []) {
      const key = isoDate(new Date((row as { created_at: string }).created_at));
      const bucket = map.get(key);
      if (bucket) bucket.users += 1;
    }
    for (const row of expenses.data ?? []) {
      const r = row as { created_at: string; amount: number | null };
      const key = isoDate(new Date(r.created_at));
      const bucket = map.get(key);
      if (bucket) {
        bucket.expenses += 1;
        bucket.volume += Number(r.amount) || 0;
      }
    }
    for (const row of ai.data ?? []) {
      const key = isoDate(new Date((row as { created_at: string }).created_at));
      const bucket = map.get(key);
      if (bucket) bucket.ai += 1;
    }

    // Category breakdown
    const { data: categoryRows } = await supabase
      .from('expenses')
      .select('category_id, amount')
      .limit(10000);

    const { data: categories } = await supabase.from('categories').select('id, name').limit(1000);
    const catMap = new Map((categories ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));
    const catTotals = new Map<string, number>();
    for (const row of categoryRows ?? []) {
      const r = row as { category_id: string | null; amount: number | null };
      const name = (r.category_id && catMap.get(r.category_id)) || 'Uncategorized';
      catTotals.set(name, (catTotals.get(name) || 0) + (Number(r.amount) || 0));
    }
    const categoryData = Array.from(catTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return res.json({
      timeseries: days,
      userGrowth: days.map((d) => ({ date: d.date, value: d.users })),
      expenseVolume: days.map((d) => ({ date: d.date, value: d.volume })),
      aiUsage: days.map((d) => ({ date: d.date, value: d.ai })),
      transactionCount: days.map((d) => ({ date: d.date, value: d.expenses })),
      categoryBreakdown: categoryData,
    });
  } catch (err) {
    console.error('Stats charts error:', err);
    return res.status(500).json({ error: 'Failed to load chart data' });
  }
});

export default router;
