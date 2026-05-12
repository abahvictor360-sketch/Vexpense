import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, BarChart3, Target, Shield, Globe, Zap,
  ArrowRight, CheckCircle2, MessageSquareHeart, PieChart,
  TrendingUp, Wallet, Bell,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

/* ─── Animated counter hook ───────────────────────────────────────────────── */
function useCounter(target: number, duration = 1600, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

/* ─── Intersection-observer hook for scroll reveals ──────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── Data ────────────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: BarChart3,        color: 'from-blue-500 to-blue-600',    title: 'Smart Analytics',      desc: 'Bar charts, donut charts, trend lines — see exactly where every naira goes, month by month.' },
  { icon: Sparkles,         color: 'from-brand-500 to-brand-700',  title: 'AI Financial Advisor', desc: 'Claude AI reads your real spending data and gives you sharp, personalized advice — not generic tips.' },
  { icon: Target,           color: 'from-emerald-500 to-emerald-600', title: 'Savings Goals',     desc: 'Set goals, track contributions, watch the progress ring fill up. The app marks them complete automatically.' },
  { icon: PieChart,         color: 'from-amber-500 to-orange-500', title: 'Budget Warnings',      desc: 'Get alerted when any category hits 75% of its budget — before you overspend, not after.' },
  { icon: Globe,            color: 'from-cyan-500 to-teal-500',    title: 'Economy Alerts',       desc: 'Real-time inflation data from the World Bank tells you when your cost of living is rising.' },
  { icon: Shield,           color: 'from-purple-500 to-violet-600',title: 'Bank-level Security',  desc: 'Row-Level Security — your data is locked to your account. Nobody else can read it.' },
];

const STEPS = [
  { n: '01', title: 'Create your account',  desc: 'Sign up free in 30 seconds. Choose your country and currency.' },
  { n: '02', title: 'Log your first expense', desc: 'Tap +, pick a category, enter the amount. Done in under 10 seconds.' },
  { n: '03', title: 'Get AI insights',       desc: 'Within days of tracking, your AI advisor starts generating personalized tips.' },
];

const TESTIMONIALS = [
  { name: 'Chisom A.',  role: 'Freelance Designer',     text: 'I never knew I was spending 40% of my income on food until Vexpense showed me. I cut it to 25% in two months.' },
  { name: 'Emeka O.',   role: 'Software Engineer',       text: 'The AI advisor is actually useful — it reads my real numbers, not some demo data. First finance app I\'ve stuck with.' },
  { name: 'Fatima B.',  role: 'Small Business Owner',    text: 'The budget warnings stopped me overspending twice this month. Simple but effective.' },
];

const PROOF_ITEMS = ['Powered by Claude AI', 'Real-time Sync', 'World Bank Data', '100% Free'];

const WORDS = ['money', 'income', 'expenses', 'budget', 'savings'];

/* ─── Keyframe styles injected once ─────────────────────────────────────── */
const STYLES = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-10px); }
  }
  @keyframes float-slow {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33%       { transform: translateY(-8px) rotate(1deg); }
    66%       { transform: translateY(4px) rotate(-1deg); }
  }
  @keyframes blob-move {
    0%, 100% { transform: translate(0,0) scale(1); }
    33%       { transform: translate(30px,-20px) scale(1.05); }
    66%       { transform: translate(-20px,15px) scale(0.97); }
  }
  @keyframes blob-move2 {
    0%, 100% { transform: translate(0,0) scale(1); }
    33%       { transform: translate(-25px,15px) scale(1.04); }
    66%       { transform: translate(20px,-10px) scale(0.98); }
  }
  @keyframes bar-fill {
    from { width: 0 !important; }
    to   { width: var(--bar-w); }
  }
  @keyframes count-badge {
    0%  { transform: scale(0.7); opacity: 0; }
    70% { transform: scale(1.08); }
    100%{ transform: scale(1);   opacity: 1; }
  }
  @keyframes slide-up {
    from { transform: translateY(28px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes slide-left {
    from { transform: translateX(32px); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  @keyframes slide-right {
    from { transform: translateX(-32px); opacity: 0; }
    to   { transform: translateX(0);     opacity: 1; }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes word-swap {
    0%  { opacity: 0; transform: translateY(10px); }
    15% { opacity: 1; transform: translateY(0); }
    80% { opacity: 1; transform: translateY(0); }
    95% { opacity: 0; transform: translateY(-10px); }
    100%{ opacity: 0; transform: translateY(-10px); }
  }
  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(83,74,183,0.4); }
    50%       { box-shadow: 0 0 32px 8px rgba(83,74,183,0.15); }
  }
  @keyframes dot-bounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40%           { transform: scale(1);   opacity: 1; }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes ping-slow {
    75%, 100% { transform: scale(1.8); opacity: 0; }
  }

  /* Utility trigger classes */
  .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.65s ease, transform 0.65s ease; }
  .reveal.visible { opacity: 1; transform: translateY(0); }
  .reveal-left  { opacity: 0; transform: translateX(-24px); transition: opacity 0.65s ease, transform 0.65s ease; }
  .reveal-left.visible  { opacity: 1; transform: translateX(0); }
  .reveal-right { opacity: 0; transform: translateX(24px);  transition: opacity 0.65s ease, transform 0.65s ease; }
  .reveal-right.visible { opacity: 1; transform: translateX(0); }
`;

export default function Landing() {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();

  /* Redirect logged-in users */
  useEffect(() => { if (user) navigate('/dashboard', { replace: true }); }, [user]);

  /* Inject keyframe styles once */
  useEffect(() => {
    const tag = document.createElement('style');
    tag.textContent = STYLES;
    document.head.appendChild(tag);
    return () => { document.head.removeChild(tag); };
  }, []);

  /* ── Nav scroll shadow ── */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Cycling hero word ── */
  const [wordIdx, setWordIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setWordIdx(i => (i + 1) % WORDS.length), 2800);
    return () => clearInterval(t);
  }, []);

  /* ── Animated bars in phone ── */
  const [barsGo, setBarsGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setBarsGo(true), 600); return () => clearTimeout(t); }, []);

  /* ── Scroll reveal via IntersectionObserver on section wrappers ── */
  const setupReveal = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      }),
      { threshold: 0.12 },
    );
    el.querySelectorAll<HTMLElement>('.reveal, .reveal-left, .reveal-right').forEach(c => obs.observe(c));
    return obs;
  }, []);

  const heroRef    = useRef<HTMLElement>(null);
  const proofRef   = useRef<HTMLElement>(null);
  const statsRef   = useRef<HTMLElement>(null);
  const featRef    = useRef<HTMLElement>(null);
  const stepsRef   = useRef<HTMLElement>(null);
  const testRef    = useRef<HTMLElement>(null);
  const ctaRef     = useRef<HTMLElement>(null);

  useEffect(() => {
    const observers: (IntersectionObserver | undefined)[] = [
      heroRef, proofRef, statsRef, featRef, stepsRef, testRef, ctaRef,
    ].map(r => setupReveal(r.current));
    return () => observers.forEach(o => o?.disconnect());
  }, [setupReveal]);

  /* ── Stats counter section ── */
  const { ref: statsCountRef, inView: statsVisible } = useInView(0.3);
  const c1 = useCounter(12400, 1800, statsVisible);
  const c2 = useCounter(94,    1400, statsVisible);
  const c3 = useCounter(2,     1200, statsVisible);

  /* ── Feature card hover ── */
  const [hoveredFeat, setHoveredFeat] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">

      {/* ══ NAV ══════════════════════════════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0)',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            style={{ animation: 'slide-right 0.6s ease both' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">
              <span className="text-brand-600">V</span>expense
            </span>
          </div>
          <div className="flex items-center gap-3" style={{ animation: 'slide-left 0.6s ease both' }}>
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm hover:-translate-y-0.5 hover:shadow-md"
            >
              Get started free
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">

        {/* Animated background blobs */}
        <div
          className="absolute top-10 left-1/4 w-[600px] h-[500px] bg-brand-600/8 rounded-full blur-3xl pointer-events-none"
          style={{ animation: 'blob-move 18s ease-in-out infinite' }}
        />
        <div
          className="absolute top-32 right-0 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl pointer-events-none"
          style={{ animation: 'blob-move2 14s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/6 rounded-full blur-3xl pointer-events-none"
          style={{ animation: 'blob-move 22s ease-in-out infinite reverse' }}
        />

        <div className="max-w-3xl mx-auto text-center relative">

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-brand-100"
            style={{ animation: 'slide-up 0.6s ease 0.1s both' }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ animation: 'spin-slow 3s linear infinite' }} />
            Powered by Anthropic Claude AI
          </div>

          {/* Headline with cycling animated word */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6"
            style={{ animation: 'slide-up 0.7s ease 0.2s both' }}
          >
            Know exactly where{' '}
            <span className="text-brand-600 relative inline-block">
              your{' '}
              <span
                key={wordIdx}
                className="inline-block"
                style={{ animation: 'word-swap 2.8s ease forwards' }}
              >
                {WORDS[wordIdx]}
              </span>
            </span>{' '}
            goes
          </h1>

          <p
            className="text-lg sm:text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto mb-10"
            style={{ animation: 'slide-up 0.7s ease 0.35s both' }}
          >
            Vexpense tracks your spending, warns you before you overshoot budgets,
            and puts a real AI financial advisor in your pocket — with full context of your actual finances.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-3 justify-center"
            style={{ animation: 'slide-up 0.7s ease 0.45s both' }}
          >
            <button
              onClick={() => navigate('/register')}
              className="group flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all text-base"
              style={{ animation: 'glow-pulse 3s ease-in-out infinite' }}
            >
              Start tracking free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-8 py-4 rounded-2xl transition-all border border-gray-200 text-base hover:-translate-y-0.5"
            >
              Sign in
            </button>
          </div>

          <p
            className="mt-5 text-xs text-gray-400"
            style={{ animation: 'fade-in 1s ease 0.7s both' }}
          >
            Free forever · No credit card required · Works in any currency
          </p>
        </div>

        {/* ── Phone mockup ── */}
        <div
          className="mt-16 max-w-sm mx-auto relative"
          style={{ animation: 'slide-up 0.9s ease 0.5s both, float-slow 6s ease-in-out 1.4s infinite' }}
        >
          <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
            <div className="bg-white rounded-[2rem] overflow-hidden">
              {/* Status bar */}
              <div className="bg-white px-6 pt-4 pb-2 flex justify-between text-[10px] text-gray-400">
                <span>9:41</span>
                <div className="flex gap-1 items-center">
                  {[...Array(3)].map((_, i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-gray-400"
                      style={{ animation: `dot-bounce 1.4s ease-in-out ${i * 0.2}s infinite` }}
                    />
                  ))}
                </div>
              </div>
              {/* App header */}
              <div className="px-5 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-gray-900 text-base">
                    <span className="text-brand-600">V</span>expense
                  </span>
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">A</div>
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                  </div>
                </div>

                {/* Balance card */}
                <div
                  className="rounded-2xl p-4 mb-4 text-white overflow-hidden relative"
                  style={{ background: 'linear-gradient(135deg, #6B63CC 0%, #534AB7 100%)' }}
                >
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />
                  <p className="text-xs text-white/70 mb-1 relative">Total spent this month</p>
                  <p className="text-3xl font-extrabold relative">₦186,400</p>
                  <div className="flex gap-2 mt-3 relative">
                    {['This month', 'Last month'].map((l, i) => (
                      <span
                        key={l}
                        className={`text-[10px] px-2 py-0.5 rounded-full transition-all ${i === 0 ? 'bg-white text-brand-700 font-semibold' : 'text-white/60'}`}
                      >{l}</span>
                    ))}
                  </div>
                </div>

                {/* AI insight */}
                <div className="bg-blue-50 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <span className="relative mt-0.5 flex-shrink-0">
                    <span className="block w-2 h-2 rounded-full bg-blue-500" />
                    <span className="absolute inset-0 rounded-full bg-blue-500" style={{ animation: 'ping-slow 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
                  </span>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <span className="font-semibold">AI Insight: </span>
                    Food & Drinks is your highest category at 38% — cutting by ₦20k frees your rent budget.
                  </p>
                </div>

                {/* Animated category bars */}
                <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Where your money goes</p>
                {[
                  { name: 'Food & Drinks', pct: 72, color: '#f97316', amount: '₦71k', delay: '0.6s' },
                  { name: 'Transport',     pct: 45, color: '#3b82f6', amount: '₦32k', delay: '0.8s' },
                  { name: 'Rent & Bills',  pct: 90, color: '#8b5cf6', amount: '₦64k', delay: '1.0s' },
                ].map(c => (
                  <div key={c.name} className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-700 w-24 truncate">{c.name}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: c.color,
                          width: barsGo ? `${c.pct}%` : '0%',
                          transition: `width 1s cubic-bezier(0.4,0,0.2,1) ${c.delay}`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-10 text-right">{c.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating badge — saved */}
          <div
            className="absolute -right-4 top-24 bg-white rounded-2xl shadow-xl p-3 border border-gray-100 flex items-center gap-2.5 w-40"
            style={{ animation: 'count-badge 0.7s ease 1.2s both, float 4s ease-in-out 2s infinite' }}
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Saved this month</p>
              <p className="text-sm font-bold text-gray-900">₦43,600</p>
            </div>
          </div>

          {/* Floating badge — AI */}
          <div
            className="absolute -left-4 bottom-24 bg-white rounded-2xl shadow-xl p-3 border border-gray-100 flex items-center gap-2.5 w-40"
            style={{ animation: 'count-badge 0.7s ease 1.5s both, float 5s ease-in-out 2.5s infinite reverse' }}
          >
            <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
              <MessageSquareHeart className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400">AI Advisor</p>
              <p className="text-sm font-bold text-gray-900">Active</p>
            </div>
          </div>

          {/* Floating badge — budget alert */}
          <div
            className="absolute -right-6 bottom-12 bg-amber-50 rounded-2xl shadow-lg p-3 border border-amber-100 flex items-center gap-2 w-36"
            style={{ animation: 'count-badge 0.7s ease 1.8s both, float 4.5s ease-in-out 3s infinite' }}
          >
            <Bell className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-amber-700 font-semibold">Budget Alert</p>
              <p className="text-[10px] text-amber-600">Rent 90%!</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SOCIAL PROOF BAR ══════════════════════════════════════════════════ */}
      <section ref={proofRef} className="py-8 border-y border-gray-100 bg-gray-50 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap justify-center items-center gap-8 text-gray-500 text-sm">
          {PROOF_ITEMS.map((t, i) => (
            <div
              key={t}
              className="reveal flex items-center gap-2"
              style={{ transitionDelay: `${i * 0.12}s` }}
            >
              <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0" />
              <span className="font-medium">{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══ STATS COUNTER ════════════════════════════════════════════════════ */}
      <section ref={statsRef} className="py-20 px-4 sm:px-6 bg-white overflow-hidden">
        <div ref={statsCountRef} className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { value: c1, suffix: '+',  label: 'Expenses tracked',        sub: 'across all users',      color: 'text-brand-600', icon: Wallet },
            { value: c2, suffix: '%',  label: 'Users save more',         sub: 'within first 60 days',  color: 'text-emerald-600', icon: TrendingUp },
            { value: c3, suffix: 'B+', label: '₦ tracked in spending',   sub: 'and counting',          color: 'text-amber-600', icon: BarChart3 },
          ].map(({ value, suffix, label, sub, color, icon: Icon }, i) => (
            <div
              key={label}
              className="reveal group p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-default"
              style={{ transitionDelay: `${i * 0.15}s` }}
            >
              <div className={`w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className={`text-4xl font-extrabold ${color} tabular-nums`}>
                {value.toLocaleString()}{suffix}
              </p>
              <p className="text-base font-semibold text-gray-900 mt-2">{label}</p>
              <p className="text-sm text-gray-400 mt-1">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════════════════════ */}
      <section ref={featRef} className="py-24 px-4 sm:px-6 bg-gray-50 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="reveal text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              Everything you need to take control
            </h2>
            <p className="reveal text-gray-500 text-lg max-w-xl mx-auto" style={{ transitionDelay: '0.1s' }}>
              Built for people who want real answers about their money — not just pretty charts.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, color, title, desc }, i) => (
              <div
                key={title}
                className="reveal bg-white rounded-2xl border border-gray-100 p-6 cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
                style={{ transitionDelay: `${i * 0.08}s` }}
                onMouseEnter={() => setHoveredFeat(i)}
                onMouseLeave={() => setHoveredFeat(null)}
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                {/* Subtle bottom accent on hover */}
                <div
                  className={`mt-4 h-0.5 bg-gradient-to-r ${color} rounded-full transition-all duration-300 ${hoveredFeat === i ? 'opacity-100 w-full' : 'opacity-0 w-0'}`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═══════════════════════════════════════════════════ */}
      <section ref={stepsRef} className="py-24 px-4 sm:px-6 bg-white overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="reveal text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              Up and running in minutes
            </h2>
            <p className="reveal text-gray-500 text-lg" style={{ transitionDelay: '0.1s' }}>
              No setup, no subscription. Just sign up and start.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden sm:block absolute top-7 left-[16.5%] right-[16.5%] h-0.5 bg-gradient-to-r from-brand-200 via-brand-400 to-brand-200 pointer-events-none" />

            {STEPS.map(({ n, title, desc }, i) => (
              <div
                key={n}
                className="reveal text-center relative group"
                style={{ transitionDelay: `${i * 0.18}s` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white text-xl font-extrabold flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-600/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-brand-600/40 group-hover:-translate-y-1 relative z-10">
                  {n}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* CTA after steps */}
          <div className="reveal text-center mt-12" style={{ transitionDelay: '0.5s' }}>
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700 text-base group"
            >
              Start now — it's free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ═══════════════════════════════════════════════════ */}
      <section ref={testRef} className="py-24 px-4 sm:px-6 bg-gray-50 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="reveal text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              People are actually saving more
            </h2>
            <p className="reveal text-gray-500 text-lg" style={{ transitionDelay: '0.1s' }}>
              Real users, real results.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, text }, i) => (
              <div
                key={name}
                className="reveal bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-default"
                style={{ transitionDelay: `${i * 0.12}s` }}
              >
                <div className="flex mb-3 gap-0.5">
                  {[...Array(5)].map((_, si) => (
                    <span
                      key={si}
                      className="text-amber-400 text-sm transition-transform group-hover:scale-110"
                      style={{ transitionDelay: `${si * 0.05}s` }}
                    >★</span>
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">"{text}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
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

      {/* ══ CTA ════════════════════════════════════════════════════════════ */}
      <section ref={ctaRef} className="py-24 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-2xl mx-auto">
          <div className="reveal bg-brand-600 rounded-3xl p-10 sm:p-14 relative overflow-hidden">
            {/* Animated BG shapes */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, #6B63CC 0%, #534AB7 60%, #3C3489 100%)' }}
            />
            <div
              className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full pointer-events-none"
              style={{ animation: 'blob-move 10s ease-in-out infinite' }}
            />
            <div
              className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full pointer-events-none"
              style={{ animation: 'blob-move2 12s ease-in-out infinite' }}
            />

            <div className="relative text-center">
              <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20 hover:bg-white/25 transition-colors cursor-default">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-4">Start for free today</h2>
              <p className="text-white/70 text-base mb-8 leading-relaxed">
                Join thousands of people who finally understand their money.
                No credit card. No trial period. Just real insights.
              </p>

              {/* Animated CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/register')}
                  className="group inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-bold px-8 py-4 rounded-2xl hover:bg-brand-50 transition-all text-base shadow-lg hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Create free account
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/20 transition-all text-base border border-white/20 hover:-translate-y-0.5"
                >
                  Already have an account
                </button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                {['No credit card', 'Cancel anytime', 'All currencies'].map((t) => (
                  <div key={t} className="flex items-center gap-1.5 text-white/60 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white/50" />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═════════════════════════════════════════════════════════ */}
      <footer className="border-t border-gray-100 py-10 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center hover:scale-105 transition-transform">
              <span className="text-white font-bold text-xs">V</span>
            </div>
            <span className="font-bold text-gray-700"><span className="text-brand-600">V</span>expense</span>
          </div>
          <p className="text-xs text-gray-400 text-center">
            © {new Date().getFullYear()} Vexpense. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <button onClick={() => navigate('/login')}    className="hover:text-gray-700 transition-colors">Sign in</button>
            <button onClick={() => navigate('/register')} className="hover:text-gray-700 transition-colors">Register</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
