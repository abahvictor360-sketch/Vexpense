import { Router, Request, Response } from 'express';

const router = Router();

interface ErrorEntry {
  id: string;
  message: string;
  level: 'error' | 'warning' | 'info';
  source: string;
  resolved: boolean;
  created_at: string;
}

const errors: ErrorEntry[] = [
  { id: 'e1', message: 'Supabase RLS policy denied request on goals table', level: 'warning', source: 'api/goals', resolved: false, created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: 'e2', message: 'Anthropic API timeout (30s) on stream completion', level: 'error', source: 'lib/anthropic', resolved: false, created_at: new Date(Date.now() - 1000 * 60 * 17).toISOString() },
  { id: 'e3', message: 'Rate limit exceeded for IP 192.168.x.x', level: 'warning', source: 'rate-limit', resolved: false, created_at: new Date(Date.now() - 1000 * 60 * 42).toISOString() },
  { id: 'e4', message: 'JWT decode failed: malformed token in /api/bank', level: 'error', source: 'middleware/auth', resolved: false, created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { id: 'e5', message: 'Slow query detected on expenses table (1.4s)', level: 'info', source: 'db/expenses', resolved: false, created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
];

export function recordError(message: string, level: ErrorEntry['level'] = 'error', source = 'unknown') {
  errors.unshift({
    id: `e${Date.now()}`,
    message,
    level,
    source,
    resolved: false,
    created_at: new Date().toISOString(),
  });
  if (errors.length > 100) errors.length = 100;
}

router.get('/health', (_req: Request, res: Response) => {
  return res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    status: 'healthy',
    timestamp: new Date(),
    node: process.version,
    platform: process.platform,
  });
});

router.get('/errors', (_req: Request, res: Response) => {
  return res.json({ errors, total: errors.length });
});

router.put('/errors/:id/resolve', (req: Request, res: Response) => {
  const { id } = req.params;
  const err = errors.find((e) => e.id === id);
  if (!err) return res.status(404).json({ error: 'Error log not found' });
  err.resolved = true;
  return res.json({ error: err });
});

export default router;
