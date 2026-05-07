import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Globe, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { COUNTRIES } from '../utils';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const { user, setUser, setSession, fetchProfile } = useAuthStore();

  // Already logged in → skip register page
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user]);
  const [step, setStep] = useState<'form' | 'check-email'>('form');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    country_code: 'NG',
  });

  const selectedCountry = COUNTRIES.find(c => c.code === form.country_code) ?? COUNTRIES[0];

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          country_code: selectedCountry.code,
          country_name: selectedCountry.name,
          currency: selectedCountry.currency,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      // Use session from signUp directly; fall back to getSession (timing edge case)
      const session = signUpData?.session ?? (await supabase.auth.getSession()).data.session;

      if (session?.user) {
        // Update profile with country/currency (non-blocking if tables not ready yet)
        try {
          await supabase.from('profiles').update({
            full_name: form.full_name,
            country_code: selectedCountry.code,
            country_name: selectedCountry.name,
            currency: selectedCountry.currency,
          }).eq('id', session.user.id);
        } catch { /* non-blocking */ }
        setUser(session.user);
        setSession(session);
        try { await fetchProfile(session.user.id); } catch { /* non-blocking */ }
        navigate('/dashboard', { replace: true });
      } else {
        // Email confirmation required — show check-email screen
        setStep('check-email');
      }
    }
  };

  if (step === 'check-email') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-slide-up">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-sm text-gray-500 mb-2">
            We sent a confirmation link to <strong>{form.email}</strong>.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Click the link in the email to activate your account — you'll be redirected to your dashboard automatically.
          </p>
          <Button variant="primary" size="md" fullWidth onClick={() => navigate('/login')}>
            Back to Login
          </Button>
          <p className="text-xs text-gray-400 mt-4">
            Didn't receive it? Check your spam folder or{' '}
            <button
              className="text-brand-600 font-medium hover:underline"
              onClick={async () => {
                await supabase.auth.resend({ type: 'signup', email: form.email });
                toast.success('Confirmation email resent!');
              }}
            >
              resend
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 flex items-center justify-center p-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative animate-slide-up">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-white/15 backdrop-blur items-center justify-center mb-3 border border-white/20">
            <span className="text-white font-bold text-2xl">V</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
          <p className="text-white/60 text-sm">Start tracking smarter today</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Full name"
              type="text"
              placeholder="Your full name"
              value={form.full_name}
              onChange={set('full_name')}
              icon={<User className="w-4 h-4" />}
              error={errors.full_name}
              autoComplete="name"
            />
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              icon={<Mail className="w-4 h-4" />}
              error={errors.email}
              autoComplete="email"
            />
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={set('password')}
              icon={<Lock className="w-4 h-4" />}
              iconRight={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.password}
              autoComplete="new-password"
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="Repeat your password"
              value={form.confirm_password}
              onChange={set('confirm_password')}
              icon={<Lock className="w-4 h-4" />}
              error={errors.confirm_password}
              autoComplete="new-password"
            />

            {/* Country selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Country</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={form.country_code}
                  onChange={set('country_code')}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 appearance-none"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.currency})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} iconRight={<ArrowRight className="w-4 h-4" />}>
              Create Account
            </Button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
