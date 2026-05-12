import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../../lib/supabase';
import { requireSuperAdmin } from '../../middleware/roleCheck';

const router = Router();

interface PlatformSettings {
  maintenance_mode: boolean;
  default_currency: string;
  ai_rate_limit: number;
  flag_threshold: number;
}

const settings: PlatformSettings = {
  maintenance_mode: false,
  default_currency: 'NGN',
  ai_rate_limit: 50,
  flag_threshold: 1000000,
};

router.get('/', (_req: Request, res: Response) => {
  return res.json({ settings });
});

router.put('/', requireSuperAdmin, async (req: Request, res: Response) => {
  const { maintenance_mode, default_currency, ai_rate_limit, flag_threshold } = req.body ?? {};
  if (typeof maintenance_mode === 'boolean') settings.maintenance_mode = maintenance_mode;
  if (typeof default_currency === 'string') settings.default_currency = default_currency;
  if (typeof ai_rate_limit === 'number') settings.ai_rate_limit = ai_rate_limit;
  if (typeof flag_threshold === 'number') settings.flag_threshold = flag_threshold;

  await supabase.from('admin_audit_log').insert({
    admin_id: req.admin?.id,
    admin_email: req.admin?.email,
    action: 'update_settings',
    target_type: 'settings',
    target_id: null,
    details: { ...settings },
  });

  return res.json({ settings });
});

router.get('/admins', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, name, email, role, is_active, last_login, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ admins: data ?? [] });
  } catch (err) {
    console.error('Admin list error:', err);
    return res.status(500).json({ error: 'Failed to load admins' });
  }
});

router.post('/admins', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body ?? {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }
    const hash = await bcrypt.hash(password, 12);
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        name,
        email,
        password_hash: hash,
        role: role === 'super_admin' ? 'super_admin' : 'moderator',
      })
      .select('id, name, email, role, is_active, created_at')
      .maybeSingle();
    if (error) throw error;

    await supabase.from('admin_audit_log').insert({
      admin_id: req.admin?.id,
      admin_email: req.admin?.email,
      action: 'create_admin',
      target_type: 'admin_users',
      target_id: data?.id ?? null,
      details: { email, role },
    });

    return res.json({ admin: data });
  } catch (err) {
    console.error('Create admin error:', err);
    return res.status(500).json({ error: 'Failed to create admin' });
  }
});

router.put('/admins/:id/status', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data: current, error: getErr } = await supabase
      .from('admin_users')
      .select('is_active')
      .eq('id', id)
      .maybeSingle();
    if (getErr) throw getErr;
    if (!current) return res.status(404).json({ error: 'Admin not found' });

    const newStatus = !current.is_active;
    const { data, error } = await supabase
      .from('admin_users')
      .update({ is_active: newStatus })
      .eq('id', id)
      .select('id, name, email, role, is_active, last_login, created_at')
      .maybeSingle();
    if (error) throw error;

    await supabase.from('admin_audit_log').insert({
      admin_id: req.admin?.id,
      admin_email: req.admin?.email,
      action: 'toggle_admin_status',
      target_type: 'admin_users',
      target_id: id,
      details: { is_active: newStatus },
    });

    return res.json({ admin: data });
  } catch (err) {
    console.error('Toggle admin status error:', err);
    return res.status(500).json({ error: 'Failed to toggle admin status' });
  }
});

router.get('/audit-log', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10) || 50));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('admin_audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;

    return res.json({
      entries: data ?? [],
      total: count ?? 0,
      page,
      pages: Math.max(1, Math.ceil((count ?? 0) / limit)),
    });
  } catch (err) {
    console.error('Audit log error:', err);
    return res.status(500).json({ error: 'Failed to load audit log' });
  }
});

export default router;
