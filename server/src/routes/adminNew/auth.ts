import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../../lib/supabase';
import { adminAuth } from '../../middleware/adminAuth';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const secret = process.env.ADMIN_JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'ADMIN_JWT_SECRET not configured' });
    }

    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Admin login query error:', error);
      return res.status(500).json({ error: 'Login failed' });
    }
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (admin.is_active === false) {
      return res.status(403).json({ error: 'Account disabled' });
    }

    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        name: admin.name,
      },
      secret,
      { expiresIn: '2h' }
    );

    await supabase.from('admin_users').update({ last_login: new Date().toISOString() }).eq('id', admin.id);

    await supabase.from('admin_audit_log').insert({
      admin_id: admin.id,
      admin_email: admin.email,
      action: 'login',
      target_type: 'admin_users',
      target_id: admin.id,
      ip_address: req.ip ?? null,
      details: { user_agent: req.headers['user-agent'] ?? null },
    });

    return res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', adminAuth, (req: Request, res: Response) => {
  return res.json({ admin: req.admin });
});

export default router;
