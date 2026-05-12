import { Router, Request, Response } from 'express';
import { supabase } from '../../lib/supabase';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const search = String(req.query.search ?? '').trim();
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '25'), 10) || 25));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count ?? 0;
    return res.json({
      users: data ?? [],
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error('Users list error:', err);
    return res.status(500).json({ error: 'Failed to load users' });
  }
});

router.get('/export', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50000);
    if (error) throw error;
    res.setHeader('Content-Disposition', 'attachment; filename="users-export.json"');
    return res.json({ users: data ?? [], exported_at: new Date().toISOString() });
  } catch (err) {
    console.error('Users export error:', err);
    return res.status(500).json({ error: 'Failed to export users' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [profileRes, expenseCountRes, goalCountRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase.from('expenses').select('*', { count: 'exact', head: true }).eq('user_id', id),
      supabase.from('goals').select('*', { count: 'exact', head: true }).eq('user_id', id),
    ]);

    if (profileRes.error) throw profileRes.error;
    if (!profileRes.data) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: profileRes.data,
      expenseCount: expenseCountRes.count ?? 0,
      goalCount: goalCountRes.count ?? 0,
    });
  } catch (err) {
    console.error('User detail error:', err);
    return res.status(500).json({ error: 'Failed to load user' });
  }
});

router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body ?? {};
    if (!status || !['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;

    await supabase.from('admin_audit_log').insert({
      admin_id: req.admin?.id,
      admin_email: req.admin?.email,
      action: 'update_user_status',
      target_type: 'profiles',
      target_id: id,
      details: { status },
    });

    return res.json({ user: data });
  } catch (err) {
    console.error('Update user status error:', err);
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw error;

    await supabase.from('admin_audit_log').insert({
      admin_id: req.admin?.id,
      admin_email: req.admin?.email,
      action: 'delete_user',
      target_type: 'profiles',
      target_id: id,
      details: {},
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
