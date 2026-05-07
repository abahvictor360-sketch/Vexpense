# Vexpense — AI-Powered Personal Finance Tracker

<div align="center">
  <img src="https://img.shields.io/badge/React-18-61dafb?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript" />
  <img src="https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase" />
  <img src="https://img.shields.io/badge/Claude-AI-blueviolet?logo=anthropic" />
</div>

---

> **Vexpense** is a smart, AI-powered personal expense tracker that helps you understand where your money goes, budget intelligently, plan savings goals, and get real-time financial advice tailored to your country's economic conditions.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Smart Dashboard** | Balance card, AI insights, category breakdown, goals preview |
| ➕ **Fast Expense Entry** | Add expenses in under 10 seconds with smart category suggestions |
| 📈 **Rich Analytics** | Bar charts, donut charts, trend lines, budget performance tables |
| 🎯 **Savings Goals** | Track goals with progress rings, contribution history, and AI projections |
| 🤖 **AI Advisor** | Claude-powered streaming chat with full financial context |
| 🌍 **Economy Alerts** | Real-time inflation warnings via World Bank API |
| 📱 **Mobile-First** | Responsive design with native-feeling bottom navigation |
| 🔒 **Row-Level Security** | Every table protected by Supabase RLS |
| 📤 **CSV Export** | One-click export of all your expense data |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS v3, Custom design tokens |
| Charts | Recharts |
| Icons | Lucide React |
| Routing | React Router v6 |
| State | Zustand |
| Auth + DB | Supabase (PostgreSQL + RLS) |
| AI | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Backend | Node.js + Express (TypeScript) |
| Economy Data | World Bank Inflation API (free) |

---

## 📁 Project Structure

```
vexpense/
├── client/          # React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── ui/       # Button, Input, Modal, Badge, etc.
│       │   ├── layout/   # AppLayout, Sidebar, BottomNav, AuthGuard
│       │   └── ...
│       ├── pages/        # Dashboard, Expenses, Analytics, Goals, Advisor, Settings
│       ├── store/        # Zustand stores (auth, expenses, goals, budgets, advisor)
│       ├── hooks/        # useAuth, useEconomy, useBudgetWarnings
│       ├── lib/          # Supabase client, API helpers
│       ├── types/        # TypeScript interfaces
│       └── utils/        # formatCurrency, groupByDate, COUNTRIES list
├── server/          # Express backend
│   └── src/
│       ├── routes/   # ai.ts (insight, report, chat SSE), economy.ts
│       ├── lib/      # supabase, anthropic, cache
│       └── middleware/ # validateAuth (JWT)
└── supabase/
    └── migrations/  # 7 SQL migration files
```

---

## 🚀 Local Development Setup

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- An [Anthropic API key](https://console.anthropic.com)

### 1. Clone the repository

```bash
git clone https://github.com/abahvictor360-sketch/Vexpense.git
cd Vexpense
```

### 2. Install all dependencies

```bash
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

### 3. Set up environment variables

**Client** (`client/.env`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:3001
```

**Server** (`server/.env`):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=sk-ant-your_key
PORT=3001
```

### 4. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run each migration file in order:
   - `supabase/migrations/001_extensions.sql`
   - `supabase/migrations/002_profiles.sql`
   - `supabase/migrations/003_categories.sql`
   - `supabase/migrations/004_expenses.sql`
   - `supabase/migrations/005_budgets.sql`
   - `supabase/migrations/006_goals.sql`
   - `supabase/migrations/007_ai_conversations.sql`
3. Copy your `URL` and `anon key` from **Settings → API**
4. Copy your `service_role key` for the server

### 5. Run the development servers

```bash
# From root (runs both client + server)
npm run dev

# Or separately:
cd client && npm run dev   # http://localhost:5173
cd server && npm run dev   # http://localhost:3001
```

---

## 🔑 Environment Variables Reference

### Client (`client/.env`)

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key (safe for client) |
| `VITE_API_BASE_URL` | Backend server URL |

### Server (`server/.env`)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — **never expose to client** |
| `ANTHROPIC_API_KEY` | Your Anthropic API key for Claude |
| `PORT` | Server port (default: 3001) |

---

## 📦 Deployment

### Frontend → Vercel

1. Push to GitHub (already done)
2. Go to [vercel.com](https://vercel.com) → Import project
3. Set root directory to `client`
4. Add all `VITE_*` environment variables
5. Deploy

### Backend → Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Set root directory to `server`
3. Add environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, PORT)
4. Deploy

### Update CORS

After deploying, add your Vercel URL to the `cors` origin list in `server/src/index.ts` and set `CLIENT_URL` in Railway env.

---

## 🗄 Database Schema

7 tables, all with Row Level Security:
- **profiles** — Extended user profiles (extends `auth.users`)
- **categories** — Default + custom expense categories
- **expenses** — Individual expense records
- **budgets** — Monthly category budgets
- **goals** — Savings goals
- **goal_contributions** — Goal funding history
- **ai_conversations** — Chat history with AI advisor

---

## 📸 Screenshots

> _Coming soon — add screenshots to `/screenshots` directory_

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT © Vexpense

---

<div align="center">Built with ❤️ · Powered by <a href="https://anthropic.com">Anthropic Claude</a> + <a href="https://supabase.com">Supabase</a></div>
