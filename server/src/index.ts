import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import aiRouter from './routes/ai';
import economyRouter from './routes/economy';
import adminRouter from './routes/admin';
import bankRouter from './routes/bank';
import adminNewRouter from './routes/adminNew';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:5174',
  process.env.CLIENT_URL ?? '',
  process.env.ADMIN_CLIENT_URL ?? '',
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/ai', aiRouter);
app.use('/api/economy', economyRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin/v2', adminNewRouter);
app.use('/api/bank', bankRouter);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Start (HTTP + Socket.io) ────────────────────────────────────────────────
const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`📡 Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`📡 Socket disconnected: ${socket.id}`);
  });
});

// Emit periodic mock activity events
const activityTemplates = [
  { type: 'expense', message: 'New expense recorded' },
  { type: 'user', message: 'New user signed up' },
  { type: 'ai', message: 'AI conversation started' },
  { type: 'goal', message: 'Goal created' },
  { type: 'budget', message: 'Budget updated' },
  { type: 'alert', message: 'High-value transaction detected' },
];

function emitActivity() {
  const tmpl = activityTemplates[Math.floor(Math.random() * activityTemplates.length)];
  io.emit('activity', {
    id: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: tmpl.type,
    message: tmpl.message,
    timestamp: new Date().toISOString(),
  });
  const next = 8000 + Math.floor(Math.random() * 4000);
  setTimeout(emitActivity, next);
}
setTimeout(emitActivity, 5000);

httpServer.listen(PORT, () => {
  console.log(`🚀 Vexpense server (HTTP + Socket.io) running on http://localhost:${PORT}`);
});

export default app;
