import { Router, Request, Response } from 'express';
import { supabase } from '../../lib/supabase';

const router = Router();

function anon(id: string | null | undefined): string {
  if (!id) return 'unknown';
  return String(id).slice(0, 8);
}

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const { count } = await supabase
      .from('ai_conversations')
      .select('*', { count: 'exact', head: true });

    const total = count ?? 0;
    const tokens = total * 500;
    const cost = total * 0.0015;

    // Today's conversations
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const { count: todayCount } = await supabase
      .from('ai_conversations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfToday.toISOString());

    return res.json({
      totalConversations: total,
      todayConversations: todayCount ?? 0,
      estimatedTokens: tokens,
      estimatedCost: cost.toFixed(2),
      avgCostPerMessage: 0.0015,
    });
  } catch (err) {
    console.error('AI stats error:', err);
    return res.status(500).json({ error: 'Failed to load AI stats' });
  }
});

router.get('/logs', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '25'), 10) || 25));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('ai_conversations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;

    const logs = (data ?? []).map((row: any) => ({
      id: row.id,
      user_id_anon: anon(row.user_id),
      message: row.message ?? row.user_message ?? null,
      response_preview: (row.response ?? row.ai_response ?? '').toString().slice(0, 140),
      created_at: row.created_at,
    }));

    const total = count ?? 0;
    return res.json({
      logs,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error('AI logs error:', err);
    return res.status(500).json({ error: 'Failed to load AI logs' });
  }
});

router.get('/charts', async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const since = new Date(today);
    since.setDate(since.getDate() - 29);

    const { data } = await supabase
      .from('ai_conversations')
      .select('created_at')
      .gte('created_at', since.toISOString())
      .limit(10000);

    const days: { date: string; value: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({ date: d.toISOString().slice(0, 10), value: 0 });
    }
    const dayMap = new Map(days.map((d) => [d.date, d]));
    for (const row of data ?? []) {
      const key = new Date((row as { created_at: string }).created_at).toISOString().slice(0, 10);
      const bucket = dayMap.get(key);
      if (bucket) bucket.value += 1;
    }

    return res.json({
      daily: days,
      tokens: days.map((d) => ({ date: d.date, value: d.value * 500 })),
      cost: days.map((d) => ({ date: d.date, value: +(d.value * 0.0015).toFixed(4) })),
    });
  } catch (err) {
    console.error('AI charts error:', err);
    return res.status(500).json({ error: 'Failed to load chart data' });
  }
});

export default router;
