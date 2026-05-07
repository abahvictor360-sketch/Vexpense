import { Router, Response } from 'express';
import { supabase } from '../lib/supabase';
import { validateAuth, AuthenticatedRequest } from '../middleware/validateAuth';

const router = Router();
const ADMIN_EMAIL = 'abahvictor760@gmail.com';

// ─── Admin guard middleware ────────────────────────────────────────────────────
async function requireAdmin(req: AuthenticatedRequest, res: Response, next: () => void) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', req.userId!)
    .single();

  if (profile?.email !== ADMIN_EMAIL) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

// ─── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get('/stats', validateAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [
      { count: totalUsers },
      { count: totalExpenses },
      { count: totalGoals },
      { count: totalBudgets },
      { data: spending },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('expenses').select('*', { count: 'exact', head: true }),
      supabase.from('goals').select('*', { count: 'exact', head: true }),
      supabase.from('budgets').select('*', { count: 'exact', head: true }),
      supabase.from('expenses').select('amount'),
    ]);

    const totalAmount = spending?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

    // New users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { count: newUsersThisMonth } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    // Expenses this month
    const { count: expensesThisMonth } = await supabase
      .from('expenses')
      .select('*', { count: 'exact', head: true })
      .gte('date', startOfMonth.toISOString().split('T')[0]);

    res.json({
      totalUsers: totalUsers ?? 0,
      totalExpenses: totalExpenses ?? 0,
      totalGoals: totalGoals ?? 0,
      totalBudgets: totalBudgets ?? 0,
      totalAmountTracked: parseFloat(totalAmount.toFixed(2)),
      newUsersThisMonth: newUsersThisMonth ?? 0,
      expensesThisMonth: expensesThisMonth ?? 0,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── GET /api/admin/users ──────────────────────────────────────────────────────
router.get('/users', validateAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, currency, country_name, monthly_income, created_at')
      .order('created_at', { ascending: false });

    if (!profiles) { res.json([]); return; }

    // Fetch expense stats per user
    const userIds = profiles.map(p => p.id);
    const { data: expenses } = await supabase
      .from('expenses')
      .select('user_id, amount')
      .in('user_id', userIds);

    const { data: goals } = await supabase
      .from('goals')
      .select('user_id, status')
      .in('user_id', userIds);

    // Aggregate
    const expenseMap: Record<string, { count: number; total: number }> = {};
    expenses?.forEach(e => {
      if (!expenseMap[e.user_id]) expenseMap[e.user_id] = { count: 0, total: 0 };
      expenseMap[e.user_id].count++;
      expenseMap[e.user_id].total += Number(e.amount);
    });

    const goalMap: Record<string, number> = {};
    goals?.forEach(g => {
      goalMap[g.user_id] = (goalMap[g.user_id] ?? 0) + 1;
    });

    const users = profiles.map(p => ({
      ...p,
      expenseCount: expenseMap[p.id]?.count ?? 0,
      totalSpent: parseFloat((expenseMap[p.id]?.total ?? 0).toFixed(2)),
      goalCount: goalMap[p.id] ?? 0,
    }));

    res.json(users);
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ─── GET /api/admin/activity ────────────────────────────────────────────────────
router.get('/activity', validateAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data: recentExpenses } = await supabase
      .from('expenses')
      .select('id, amount, description, date, created_at, user_id, profiles(full_name, currency)')
      .order('created_at', { ascending: false })
      .limit(20);

    res.json(recentExpenses ?? []);
  } catch (err) {
    console.error('Admin activity error:', err);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

export default router;
