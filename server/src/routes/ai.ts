import { Router, Response } from 'express';
import { anthropic, CLAUDE_MODEL } from '../lib/anthropic';
import { supabase } from '../lib/supabase';
import { validateAuth, AuthenticatedRequest } from '../middleware/validateAuth';

const router = Router();

// ─── Shared context builder ──────────────────────────────────────────────────
async function buildUserContext(userId: string): Promise<string> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, currency, country_name, monthly_income')
    .eq('id', userId)
    .single();

  // Fetch this month's expenses with category info
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, description, date, category_id, categories(name)')
    .eq('user_id', userId)
    .gte('date', startOfMonth)
    .lte('date', endOfMonth)
    .order('date', { ascending: false });

  // Fetch budgets
  const { data: budgets } = await supabase
    .from('budgets')
    .select('amount, category_id, categories(name)')
    .eq('user_id', userId)
    .eq('month', now.getMonth() + 1)
    .eq('year', now.getFullYear());

  // Fetch active goals
  const { data: goals } = await supabase
    .from('goals')
    .select('name, target_amount, saved_amount, target_date, status')
    .eq('user_id', userId)
    .eq('status', 'active');

  // Build category breakdown
  const categoryTotals: Record<string, number> = {};
  let totalSpent = 0;

  expenses?.forEach(e => {
    const catName = ((e.categories as unknown) as { name: string } | null)?.name ?? 'Other';
    categoryTotals[catName] = (categoryTotals[catName] ?? 0) + Number(e.amount);
    totalSpent += Number(e.amount);
  });

  const currency = profile?.currency ?? 'USD';
  const income = profile?.monthly_income ?? 0;
  const country = profile?.country_name ?? 'Unknown';

  const breakdown = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => `  - ${cat}: ${currency} ${amt.toFixed(2)} (${income > 0 ? ((amt / income) * 100).toFixed(1) : '?'}% of income)`)
    .join('\n');

  const budgetSummary = budgets?.map(b => {
    const catName = ((b.categories as unknown) as { name: string } | null)?.name ?? 'Unknown';
    const spent = categoryTotals[catName] ?? 0;
    const pct = b.amount > 0 ? ((spent / b.amount) * 100).toFixed(0) : '?';
    return `  - ${catName}: budgeted ${currency} ${b.amount}, spent ${currency} ${spent.toFixed(2)} (${pct}% used)`;
  }).join('\n') ?? '  No budgets set';

  const goalsSummary = goals?.map(g =>
    `  - ${g.name}: ${currency} ${g.saved_amount} of ${currency} ${g.target_amount} saved (${((Number(g.saved_amount) / Number(g.target_amount)) * 100).toFixed(0)}%)${g.target_date ? `, target: ${g.target_date}` : ''}`
  ).join('\n') ?? '  No active goals';

  return `
USER FINANCIAL CONTEXT (${now.toDateString()}):
Country: ${country}
Currency: ${currency}
Monthly income: ${currency} ${Number(income).toFixed(2)}
Total spent this month: ${currency} ${totalSpent.toFixed(2)}
${income > 0 ? `Remaining from income: ${currency} ${(income - totalSpent).toFixed(2)}` : ''}

SPENDING BY CATEGORY THIS MONTH:
${breakdown || '  No expenses recorded this month'}

BUDGET STATUS:
${budgetSummary}

ACTIVE SAVINGS GOALS:
${goalsSummary}
`.trim();
}

// ─── POST /api/ai/insight ─────────────────────────────────────────────────────
router.post('/insight', validateAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const context = await buildUserContext(req.userId!);

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 150,
      system: `You are Vexpense, a smart personal finance advisor. Given a user's spending data, return ONE sharp, specific, actionable insight in 2 sentences maximum. Be direct, use their actual numbers, and make it feel personal. No fluff. No bullet points. No markdown.`,
      messages: [{ role: 'user', content: context }],
    });

    const insight = (message.content[0] as { text: string }).text;
    res.json({ insight });
  } catch (err) {
    console.error('Insight error:', err);
    res.status(500).json({ error: 'Failed to generate insight' });
  }
});

// ─── POST /api/ai/report ──────────────────────────────────────────────────────
router.post('/report', validateAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const context = await buildUserContext(req.userId!);

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 600,
      system: `You are a financial analyst writing a personal spending report. Use the user's real data. Structure your response in exactly 3 short paragraphs:
1. "What's going well" — highlight positive patterns
2. "What needs attention" — be honest about problem areas
3. "3 actions to take" — specific, numbered, actionable steps

Use plain text, no markdown headers or bullet symbols. Be direct and empathetic. Use their actual currency and numbers.`,
      messages: [{ role: 'user', content: context }],
    });

    const report = (message.content[0] as { text: string }).text;
    res.json({ report });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ─── POST /api/ai/chat (SSE streaming) ───────────────────────────────────────
router.post('/chat', validateAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { message } = req.body as { message: string };

  if (!message?.trim()) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const [context, { data: history }] = await Promise.all([
      buildUserContext(req.userId!),
      supabase
        .from('ai_conversations')
        .select('role, content')
        .eq('user_id', req.userId!)
        .order('created_at', { ascending: true })
        .limit(20),
    ]);

    const historyMessages: { role: 'user' | 'assistant'; content: string }[] =
      history?.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })) ?? [];

    historyMessages.push({ role: 'user', content: message });

    let fullResponse = '';

    const stream = anthropic.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: `You are Vexpense AI, a friendly and knowledgeable personal finance advisor. You have real-time access to the user's financial data shown below. Give warm, practical, specific advice. Use their actual numbers. When relevant, refer to their spending categories, goals, or budget status. Keep responses concise but complete.

${context}`,
      messages: historyMessages,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        fullResponse += event.delta.text;
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    // Persist both messages to Supabase
    await supabase.from('ai_conversations').insert([
      { user_id: req.userId!, role: 'user', content: message },
      { user_id: req.userId!, role: 'assistant', content: fullResponse },
    ]);

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Chat error:', err);
    res.write(`data: ${JSON.stringify({ error: 'AI unavailable' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

export default router;
