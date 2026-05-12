import { Router, Request, Response } from 'express';
import { supabase } from '../../lib/supabase';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10) || 50));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;

    return res.json({
      notifications: data ?? [],
      total: count ?? 0,
      page,
      pages: Math.max(1, Math.ceil((count ?? 0) / limit)),
    });
  } catch (err) {
    console.error('Notifications list error:', err);
    return res.status(500).json({ error: 'Failed to load notifications' });
  }
});

router.post('/send', async (req: Request, res: Response) => {
  try {
    const { message, severity, type } = req.body ?? {};
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const { data, error } = await supabase
      .from('admin_notifications')
      .insert({
        admin_id: req.admin?.id,
        message,
        severity: severity ?? 'info',
        type: type ?? 'info',
        is_read: false,
      })
      .select()
      .maybeSingle();
    if (error) throw error;

    await supabase.from('admin_audit_log').insert({
      admin_id: req.admin?.id,
      admin_email: req.admin?.email,
      action: 'send_notification',
      target_type: 'admin_notifications',
      target_id: data?.id ?? null,
      details: { message, severity },
    });

    return res.json({ notification: data });
  } catch (err) {
    console.error('Send notification error:', err);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
});

router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return res.json({ notification: data });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

export default router;
