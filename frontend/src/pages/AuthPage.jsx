import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Zap, AlertCircle, ArrowLeft, Compass, BarChart3, Mic, Shield, CheckCircle, Sparkles, ListChecks } from 'lucide-react';
import { useApp } from '../context/AppContext';

const FEATURES = [
  { icon: Compass,  text: 'Adaptive mock interviews — Technical, HR, Aptitude, System Design', color: '#4f46e5' },
  { icon: ListChecks, text: 'Skill Assessment Center with a category-by-category radar', color: '#14b8a6' },
  { icon: Sparkles, text: 'AI career roadmap tailored to your target role', color: '#7c3aed' },
  { icon: BarChart3,text: 'Real-time, multi-dimension scoring after every answer', color: '#10b981' },
  { icon: Mic,      text: 'Voice mode — ARIA can ask questions out loud (Chrome/Edge)', color: '#f59e0b' },
  { icon: Shield,   text: 'Your practice history is saved to your account', color: '#3b82f6' },
];

export default function AuthPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, login, loginGuest } = useApp();

  const [mode, setMode]   = useState(params.get('mode') === 'register' ? 'register' : 'login');
  const [form, setForm]   = useState({ name:'', email:'', password:'', confirm:'' });
  const [err, setErr]     = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow]   = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const upd = k => e => { setForm(p => ({ ...p, [k]: e.target.value })); setErr(''); };
  const toggle = () => { setMode(m => m === 'login' ? 'register' : 'login'); setErr(''); setForm({ name:'', email:'', password:'', confirm:'' }); };

  const onSubmit = async e => {
    e.preventDefault(); setErr('');
    if (mode === 'register') {
      if (!form.name.trim()) { setErr('Please enter your full name.'); return; }
      if (form.password !== form.confirm) { setErr('Passwords do not match.'); return; }
    }
    if (form.password.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const result = await login({ email: form.email, password: form.password, mode, name: form.name });
      if (result) navigate('/dashboard', { replace: true }); // OnboardingGuard will redirect to /onboarding if needed
    } catch (e) {
      setErr(e?.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const onGuest = async () => {
    setLoading(true); setErr('');
    try {
      const result = await loginGuest();
      if (result) navigate('/dashboard', { replace: true }); // OnboardingGuard will redirect to /onboarding if needed
    } catch (e) {
      setErr(e?.message || 'Could not start a guest session. Is the backend running?');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background:'var(--bg)' }}>

      {/* ── Left Panel ── */}
      <div
        className="hidden lg:flex lg:w-[48%] flex-col justify-between p-10 relative overflow-hidden"
        style={{ background:'linear-gradient(160deg, #3730a3 0%, #4f46e5 45%, #6366f1 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:'radial-gradient(circle at 30% 20%, rgba(255,255,255,.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,.05) 0%, transparent 50%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)', backgroundSize:'40px 40px' }} />

        <div className="absolute top-20 right-8 w-32 h-32 rounded-full pointer-events-none" style={{ background:'rgba(255,255,255,.06)', filter:'blur(16px)' }} />
        <div className="absolute bottom-32 left-12 w-24 h-24 rounded-full pointer-events-none" style={{ background:'rgba(255,255,255,.04)', filter:'blur(12px)' }} />

        <div className="relative">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 mb-12 group">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background:'rgba(255,255,255,.2)', border:'1px solid rgba(255,255,255,.25)' }}>
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-extrabold text-xl text-white">CareerForge AI</span>
          </button>

          <h2 className="font-display text-3xl font-bold text-white leading-tight mb-4">
            Meet ARIA, your AI<br />career coach 🚀
          </h2>
          <p className="text-indigo-100 text-base leading-relaxed mb-8">
            Practice smarter, get assessed honestly, and follow a roadmap built around your target role.
          </p>

          <div className="space-y-3.5">
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.2)' }}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm text-indigo-100">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="rounded-2xl p-4" style={{ background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)', backdropFilter:'blur(8px)' }}>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white mb-1">100% free to run · your own API keys</p>
                <p className="text-xs text-indigo-200 leading-relaxed">
                  Built on Groq's free tier and the YouTube Data API's free quota. No key configured? The app still runs end-to-end on curated fallback content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Form ── */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-10 py-12">
        <div className="w-full max-w-[400px] animate-fade-up">

          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-sm transition-colors"
              style={{ color:'var(--t3)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--t3)'}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#4f46e5,#6366f1)' }}>
                <Compass className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display font-bold text-sm" style={{ color:'var(--text)' }}>CareerForge AI</span>
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold mb-1" style={{ color:'var(--text)' }}>
            {mode === 'login' ? 'Welcome back 👋' : 'Create your account'}
          </h1>
          <p className="text-sm mb-7" style={{ color:'var(--t3)' }}>
            {mode === 'login' ? 'Sign in to continue your practice.' : 'Free forever. Start practicing in 30 seconds.'}
          </p>

          <div className="space-y-2.5 mb-5">
            <button
              onClick={onGuest}
              disabled={loading}
              className="w-full btn btn-outline py-2.5 text-sm gap-2 rounded-xl justify-center"
              style={{ height:44 }}
            >
              <span>👤</span> Continue as guest
              <span className="text-xs" style={{ color:'var(--t4)' }}>(no account needed)</span>
            </button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background:'var(--border)' }} />
            <span className="text-xs font-medium px-1" style={{ color:'var(--t4)' }}>or continue with email</span>
            <div className="flex-1 h-px" style={{ background:'var(--border)' }} />
          </div>

          <form onSubmit={onSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color:'var(--t2)' }}>Full name</label>
                <input className="inp" placeholder="Your full name" value={form.name} onChange={upd('name')} required />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color:'var(--t2)' }}>Email address</label>
              <input type="email" className="inp" placeholder="you@example.com" value={form.email} onChange={upd('email')} required />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color:'var(--t2)' }}>Password</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  className="inp pr-10"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={upd('password')}
                  required minLength={6}
                />
                <button
                  type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color:'var(--t4)' }}
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color:'var(--t2)' }}>Confirm password</label>
                <input
                  type="password" className="inp" placeholder="Repeat password"
                  value={form.confirm} onChange={upd('confirm')} required
                />
              </div>
            )}

            {err && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-sm" style={{ background:'var(--red-bg)', border:'1px solid rgba(239,68,68,.2)' }}>
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span style={{ color:'#dc2626' }}>{err}</span>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full btn btn-primary py-3 text-sm rounded-xl gap-2 mt-1"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {mode === 'register' ? 'Creating account…' : 'Signing in…'}
                  </>
                : <><Zap className="w-4 h-4" />{mode === 'register' ? 'Create account' : 'Sign in'}</>
              }
            </button>
          </form>

          <p className="text-center text-sm mt-5" style={{ color:'var(--t3)' }}>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={toggle}
              className="font-semibold transition-colors"
              style={{ color:'var(--p)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--p2)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--p)'}
            >
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
