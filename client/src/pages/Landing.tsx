import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, BarChart3, Target, Shield, Globe, Zap,
  ArrowRight, CheckCircle2, MessageSquareHeart, PieChart, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const FEATURES = [
  {
    icon: BarChart3, color: 'bg-blue-500',
    title: 'Smart Analytics',
    desc: 'Bar charts, donut charts, trend lines — see exactly where every naira goes, month by month.',
  },
  {
    icon: Sparkles, color: 'bg-brand-600',
    title: 'AI Financial Advisor',
    desc: 'Claude AI reads your real spending data and gives you sharp, personalized advice — not generic tips.',
  },
  {
    icon: Target, color: 'bg-emerald-500',
    title: 'Savings Goals',
    desc: 'Set goals, track contributions, watch the progress ring fill up. The app marks them complete automatically.',
  },
  {
    icon: PieChart, color: 'bg-amber-500',
    title: 'Budget Warnings',
    desc: 'Get alerted when any category hits 75% of its budget — before you overspend, not after.',
  },
  {
    icon: Globe, color: 'bg-cyan-500',
    title: 'Economy Alerts',
    desc: 'Real-time inflation data from the World Bank tells you when your cost of living is rising.',
  },
  {
    icon: Shield, color: 'bg-purple-500',
    title: 'Bank-level Security',
    desc: 'Supabase Row Level Security — your data is locked to your account. Nobody else can read it.',
  },
];

const STEPS = [
  { n: '01', title: 'Create your account', desc: 'Sign up free in 30 seconds. Choose your country and currency.' },
  { n: '02', title: 'Log your first expense', desc: 'Tap +, pick a category, enter the amount. Done in under 10 seconds.' },
  { n: '03', title: 'Get AI insights', desc: 'Within days of tracking, your AI advisor starts generating personalized tips.' },
];

const TESTIMONIALS = [
  { name: 'Chisom A.', role: 'Freelance Designer', text: 'I never knew I was spending 40% of my income on food until Vexpense showed me. I cut it to 25% in two months.' },
  { name: 'Emeka O.', role: 'Software Engineer', text: 'The AI advisor is actually useful — it reads my real numbers, not some demo data. First finance app I\'ve stuck with.' },
  { name: 'Fatima B.', role: 'Small Business Owner', text: 'The budget warnings stopped me overspending twice this month. Simple but effective.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Already logged in → skip landing page
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user]);

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">
              <span className="text-brand-600">V</span>expense
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              Get started free
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
        {/* BG blobs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-32 right-0 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-brand-100">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by Anthropic Claude AI
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6">
            Know exactly where{' '}
            <span className="text-brand-600">your money</span>{' '}
            goes — and what to do about it
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto mb-10">
            Vexpense tracks your spending, warns you before you overshoot budgets,
            and puts a real AI financial advisor in your pocket — with full context of your actual finances.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-brand-600/25 hover:shadow-brand-600/40 hover:-translate-y-0.5 text-base"
            >
              Start tracking free
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-8 py-4 rounded-2xl transition-all border border-gray-200 text-base"
            >
              Sign in
            </button>
          </div>

          <p className="mt-5 text-xs text-gray-400">Free forever · No credit card required · Works in any currency</p>
        </div>

        {/* Mock phone UI */}
        <div className="mt-16 max-w-sm mx-auto relative">
          <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
            <div className="bg-white rounded-[2rem] overflow-hidden">
              {/* Status bar */}
              <div className="bg-white px-6 pt-4 pb-2 flex justify-between text-[10px] text-gray-400">
                <span>9:41</span><span>●●●</span>
              </div>
              {/* App header */}
              <div className="px-5 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-gray-900 text-base"><span className="text-brand-600">V</span>expense</span>
                  <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">A</div>
                </div>
                {/* Balance card */}
                <div className="rounded-2xl p-4 mb-4 text-white" style={{ background: 'linear-gradient(135deg, #6B63CC 0%, #534AB7 100%)' }}>
                  <p className="text-xs text-white/70 mb-1">Total spent this month</p>
                  <p className="text-3xl font-extrabold">₦186,400</p>
                  <div className="flex gap-2 mt-3">
                    {['This month', 'Last month'].map((l, i) => (
                      <span key={l} className={`text-[10px] px-2 py-0.5 rounded-full ${i === 0 ? 'bg-white text-brand-700 font-semibold' : 'text-white/60'}`}>{l}</span>
                    ))}
                  </div>
                </div>
                {/* AI insight */}
                <div className="bg-blue-50 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800 leading-relaxed"><span className="font-semibold">AI Insight: </span>Food & Drinks is your highest category at 38% of income — cutting it by ₦20k would free your rent budget.</p>
                </div>
                {/* Category rows */}
                <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Where your money goes</p>
                {[
                  { name: 'Food & Drinks', pct: 72, color: '#f97316', amount: '₦71k' },
                  { name: 'Transport',     pct: 45, color: '#3b82f6', amount: '₦32k' },
                  { name: 'Rent & Bills',  pct: 90, color: '#8b5cf6', amount: '₦64k' },
                ].map(c => (
                  <div key={c.name} className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-700 w-24 truncate">{c.name}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-10 text-right">{c.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Floating card */}
          <div className="absolute -right-4 top-24 bg-white rounded-2xl shadow-xl p-3 border border-gray-100 flex items-center gap-2.5 w-40">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Saved this month</p>
              <p className="text-sm font-bold text-gray-900">₦43,600</p>
            </div>
          </div>
          <div className="absolute -left-4 bottom-24 bg-white rounded-2xl shadow-xl p-3 border border-gray-100 flex items-center gap-2.5 w-40">
            <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
              <MessageSquareHeart className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400">AI Advisor</p>
              <p className="text-sm font-bold text-gray-900">Active</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="py-8 border-y border-gray-100 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap justify-center items-center gap-8 text-gray-400 text-sm">
          {['Powered by Claude AI', 'Supabase Database', 'World Bank Data', '100% Free'].map(t => (
            <div key={t} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-500" />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              Everything you need to take control
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Built for people who want real answers about their money — not just pretty charts.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-4 shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Up and running in minutes</h2>
            <p className="text-gray-500 text-lg">No setup, no subscription. Just sign up and start.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white text-xl font-extrabold flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-600/20">
                  {n}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              People are actually saving more
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, text }) => (
              <div key={name} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">"{text}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{name}</p>
                    <p className="text-xs text-gray-400">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-brand-600 rounded-3xl p-10 sm:p-14 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-800 pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
            <div className="relative">
              <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-4">Start for free today</h2>
              <p className="text-white/70 text-base mb-8 leading-relaxed">
                Join thousands of people who finally understand their money.
                No credit card. No trial period. Just real insights.
              </p>
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-8 py-4 rounded-2xl hover:bg-brand-50 transition-colors text-base shadow-lg"
              >
                Create free account
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">V</span>
            </div>
            <span className="font-bold text-gray-700"><span className="text-brand-600">V</span>expense</span>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Built with Claude AI + Supabase · © {new Date().getFullYear()} Vexpense
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <button onClick={() => navigate('/login')}  className="hover:text-gray-700 transition-colors">Sign in</button>
            <button onClick={() => navigate('/register')} className="hover:text-gray-700 transition-colors">Register</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
