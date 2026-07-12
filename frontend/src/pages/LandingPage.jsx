import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Brain, Mic, BarChart3, FileText, Award, ChevronRight, Star, Play, Target, Trophy, ArrowRight, CheckCircle, Sparkles, Youtube, Briefcase, TrendingUp, Users, BookOpen, ListChecks, ShieldCheck, Compass, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

// Animated counter hook
function useCountUp(target, duration = 1600, startOnView = true) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (!startOnView) { runCounter(); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) { started.current = true; runCounter(); }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  function runCounter() {
    const steps = Math.floor(duration / 16);
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(current));
    }, 16);
  }

  return [value, ref];
}

// Hero demo card (animated preview)
function DemoCard() {
  const [qi, setQi] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setQi(p => (p + 1) % 4), 3200);
    return () => clearInterval(t);
  }, []);

  const stages = [
    { label: 'Round 1', color: '#4f46e5', mode: 'Aptitude', q: '"6 quick questions across DSA & Quant — clear 40% to advance."' },
    { label: 'Round 2', color: '#8b5cf6', mode: 'Group Discussion', q: '"4 AI participants debate live. Jump in, build on a point, push back."' },
    { label: 'Round 3', color: '#10b981', mode: 'Technical', q: '"Design a rate limiter for a REST API handling 100K req/sec."' },
    { label: 'Round 4', color: '#f59e0b', mode: 'HR', q: '"Tell me about a time you resolved a conflict in your team."' },
  ];
  const s = stages[qi];

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Glow */}
      <div className="absolute inset-0 -z-10" style={{ background:'radial-gradient(ellipse at 50% 50%, rgba(79,70,229,.15) 0%, transparent 70%)', filter:'blur(24px)', transform:'scale(1.3)' }} />

      <div className="card overflow-hidden animate-float" style={{ boxShadow:'0 24px 48px rgba(79,70,229,.14), 0 0 0 1px rgba(79,70,229,.08)' }}>
        {/* Header chrome */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor:'var(--border)', background:'var(--surf2)' }}>
          <div className="flex gap-1.5">
            {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background:c }} />)}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color:s.color }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:s.color }} />
            {s.label}
          </div>
          <div className="pill pill-gray text-xs">{qi+1}/4</div>
        </div>

        {/* AI Orb */}
        <div className="flex flex-col items-center py-6 px-4" style={{ background:'linear-gradient(to bottom, var(--surf), var(--surf2))' }}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 animate-breathe"
            style={{ background:`linear-gradient(135deg, #4f46e5, ${s.color})`, boxShadow:`0 8px 24px ${s.color}40` }}
          >
            <Brain className="w-8 h-8 text-white" />
          </div>
          <p className="text-xs font-bold" style={{ color:'var(--t3)' }}>Placement Drive · {s.mode}</p>
        </div>

        {/* Question */}
        <div className="mx-4 mb-4 p-3 rounded-xl" style={{ background:'var(--p-bg)', border:'1px solid var(--border3)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3" style={{ color:'var(--p)' }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--p)' }}>{s.mode} Round</span>
          </div>
          <p className="text-sm font-medium leading-relaxed" style={{ color:'var(--text)' }}>{s.q}</p>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-4">
          {[['Technical', 88, '#4f46e5'], ['Clarity', 91, '#10b981'], ['Examples', 76, '#f59e0b']].map(([l, v, c]) => (
            <div key={l}>
              <div className="text-xs mb-1 font-medium" style={{ color:'var(--t3)' }}>{l}</div>
              <div className="score-bar mb-1"><div className="score-bar-fill" style={{ width:`${v}%`, background:c }} /></div>
              <div className="text-xs font-bold font-mono" style={{ color:c }}>{v}%</div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mx-4 mb-4 pt-3 border-t flex items-center justify-between" style={{ borderColor:'var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl font-black text-sm text-white flex items-center justify-center" style={{ background:'linear-gradient(135deg,#4f46e5,#6366f1)' }}>9</div>
            <div>
              <div className="text-xs font-bold" style={{ color:'var(--text)' }}>Score 9/10</div>
              <div className="text-xs" style={{ color:'var(--t3)' }}>Exceptional</div>
            </div>
          </div>
          <div className="btn btn-primary text-xs py-1.5 px-3 gap-1">Next <ChevronRight className="w-3 h-3" /></div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, careerPath } = useApp();

  useEffect(() => {
    if (user && careerPath) navigate('/dashboard');
    else if (user) navigate('/onboarding');
  }, [user, careerPath, navigate]);

  const [s1, ref1] = useCountUp(500);
  const [s2, ref2] = useCountUp(12);
  const [s3, ref3] = useCountUp(95);
  const [s4, ref4] = useCountUp(4);

  const features = [
    { icon: Building2, title: 'Placement Drive Simulator', desc: 'The full journey — Aptitude, GD, Technical, HR — chained into one drive with a real Selected/Waitlisted/Not Selected outcome.', color: '#4f46e5' },
    { icon: Users,    title: 'Group Discussion Simulator', desc: '4 AI participants with genuinely different stances debate live. Score on initiative, articulation, listening — even whether you dominated or stayed silent.', color: '#8b5cf6' },
    { icon: Sparkles, title: 'Adaptive Difficulty Engine', desc: 'Every question is generated live, calibrated to your last answer — the same idea behind computerized adaptive tests like the GRE.', color: '#7c3aed' },
    { icon: ListChecks,title:'Skill Assessment Center', desc: 'A properly scored multiple-choice test across DSA, OOP, DBMS, OS, Networks and Aptitude — visualized as a skill radar.', color: '#14b8a6' },
    { icon: Zap,      title: 'Instant Coaching After Every Answer', desc: 'A 4-dimension rubric — technical, communication, structure, confidence — live after each response, not just one score.', color: '#f59e0b' },
    { icon: Trophy,   title: 'Peer Leaderboard & Percentile', desc: 'See exactly how your score compares to everyone else practicing the same mode — powered by a real shared backend.', color: '#f59e0b' },
    { icon: Mic,      title: 'Two-Way Voice Mode', desc: 'ARIA can ask questions out loud and transcribe your spoken answers, using the free Chrome Web Speech API.', color: '#10b981' },
    { icon: ShieldCheck,title:'Focus & Integrity Monitor', desc: 'Tracks tab switches, pasted answers, and idle time, so your score reflects real focus — not just content.', color: '#3b82f6' },
    { icon: FileText, title: 'Resume-Aware AI + JD Match', desc: 'Upload your resume for tailored questions, then paste any job description for a real keyword-match score.', color: '#ec4899' },
  ];

  const modes = [
    { icon:'💻', label:'Technical', desc:'DSA, system design, role-specific concepts', color:'#4f46e5' },
    { icon:'🤝', label:'HR & Behavioral', desc:'STAR method, soft skills, cultural fit', color:'#10b981' },
    { icon:'🧮', label:'Aptitude MCQ', desc:'DSA, OS, DBMS, Networks, Quant', color:'#f59e0b' },
    { icon:'🏗️', label:'System Design', desc:'Architecture, scalability, trade-offs', color:'#3b82f6' },
  ];

  return (
    <div className="min-h-screen" style={{ background:'var(--bg)' }}>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
        <div className="hero-glow" />
        <div className="absolute inset-0 grid-pattern opacity-60 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">

            {/* Left */}
            <div className="flex-1 text-center lg:text-left space-y-6 animate-fade-up">
              <div className="section-badge inline-flex gap-1.5">
                <Sparkles className="w-3 h-3" /> The only prep tool with a real Group Discussion round
              </div>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-[64px] font-black leading-[1.06] tracking-tight">
                <span style={{ color:'var(--text)' }}>Simulate the</span>
                <br />
                <span className="gradient-text">whole placement drive</span>
                <br />
                <span style={{ color:'var(--t2)', fontSize:'70%', fontWeight:700 }}>not just interview questions</span>
              </h1>
              <p className="text-lg leading-relaxed max-w-lg mx-auto lg:mx-0" style={{ color:'var(--t2)' }}>
                Aptitude elimination → <strong style={{ color:'var(--p)' }}>Group Discussion</strong> → Technical → HR — one
                continuous drive with a real Selected / Waitlisted / Not Selected outcome. Then go deeper with adaptive
                mock interviews, a proper Skill Assessment, and a peer leaderboard.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <button onClick={() => navigate('/auth?mode=register')} className="btn btn-primary text-base py-3.5 px-7 rounded-2xl gap-2">
                  <Zap className="w-4.5 h-4.5" /> Start free — takes 30 sec
                </button>
                <button onClick={() => navigate('/auth')} className="btn btn-outline text-base py-3.5 px-7 rounded-2xl gap-2">
                  <Play className="w-4 h-4" /> Sign in
                </button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {['V','A','R','K','S'].map((l, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white font-bold text-xs text-white flex items-center justify-center"
                      style={{ background: ['#4f46e5','#10b981','#ec4899','#f59e0b','#3b82f6'][i] }}>{l}</div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}</div>
                  <p className="text-xs mt-0.5" style={{ color:'var(--t3)' }}>500+ students practice daily</p>
                </div>
              </div>
            </div>

            {/* Right — Demo Card */}
            <div className="flex-1 flex justify-center lg:justify-end w-full max-w-sm lg:max-w-none">
              <DemoCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 border-y" style={{ borderColor:'var(--border)', background:'var(--surf)' }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[[s1, ref1, '+', 'Students Helped'], [s2, ref2, '+', 'Job Roles'], [s3, ref3, '%', 'Satisfaction'], [s4, ref4, '', 'Interview Modes']].map(([v, ref, sfx, l], i) => (
              <div key={i} ref={ref} style={{ animationDelay:`${i*.1}s` }} className="animate-count-in">
                <div style={{ fontSize:48, fontWeight:900, color:'var(--text)', lineHeight:1, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:'-.02em' }}>
  {v}<span style={{ color:'var(--p)', fontSize:'55%', fontWeight:800, marginLeft:1 }}>{sfx}</span>
</div>
                <p className="mt-1 text-sm font-medium" style={{ color:'var(--t3)' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <div className="section-badge inline-flex mb-4">3 Simple Steps</div>
            <h2 className="font-display text-4xl font-bold mb-3" style={{ color:'var(--text)' }}>Up and running in minutes</h2>
            <p style={{ color:'var(--t2)' }}>From signup to your first scored interview session</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n:'01', icon:Target, title:'Generate your career path', desc:'Upload your resume, pick your target role, and let AI create a personalized roadmap with skill gap analysis.', color:'#4f46e5' },
              { n:'02', icon:Building2, title:'Run a full placement drive', desc:'Aptitude, Group Discussion, Technical, HR — one continuous simulation with a real Selected/Waitlisted/Not Selected outcome.', color:'#8b5cf6' },
              { n:'03', icon:Trophy, title:'Get insights & improve',   desc:'Full performance report, skill radar, peer leaderboard, YouTube resources, and job listings matched to your skills.', color:'#f59e0b' },
            ].map((s, i) => (
              <div key={i} className="card card-hover p-6 space-y-4 relative overflow-hidden">
                <div className="absolute top-4 right-4 font-display font-black text-6xl select-none pointer-events-none" style={{ color:`${s.color}08` }}>{s.n}</div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background:`${s.color}12`, border:`1px solid ${s.color}25` }}>
                  <s.icon className="w-6 h-6" style={{ color:s.color }} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg mb-2" style={{ color:'var(--text)' }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color:'var(--t2)' }}>{s.desc}</p>
                </div>
                {i < 2 && <div className="absolute -right-3 top-1/2 -translate-y-1/2 hidden md:block" style={{ color:'var(--border2)' }}><ChevronRight className="w-6 h-6" /></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4 INTERVIEW MODES ── */}
      <section className="py-24 border-t" style={{ borderColor:'var(--border)', background:'var(--surf)' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <div className="section-badge inline-flex mb-4">4 Interview Modes</div>
            <h2 className="font-display text-4xl font-bold mb-3" style={{ color:'var(--text)' }}>Practice every format you'll face</h2>
            <p style={{ color:'var(--t2)' }}>From campus MCQ screening to FAANG-level system design</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {modes.map((m, i) => (
              <div key={i} className="card card-hover p-6 text-center space-y-3">
                <div className="text-4xl">{m.icon}</div>
                <h3 className="font-display font-bold text-base" style={{ color:'var(--text)' }}>{m.label}</h3>
                <p className="text-xs leading-relaxed" style={{ color:'var(--t2)' }}>{m.desc}</p>
                <div className="section-badge inline-flex text-xs py-1" style={{ color:m.color, borderColor:`${m.color}30`, background:`${m.color}0e` }}>
                  {m.label === 'Technical' ? 'All Engineering' : m.label === 'HR & Behavioral' ? 'Every Role' : m.label === 'Aptitude MCQ' ? 'Campus / Screening' : 'SDE-2 / Senior'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <div className="section-badge inline-flex mb-4"><Sparkles className="w-3 h-3" /> Full Feature Set</div>
            <h2 className="font-display text-4xl font-bold mb-3" style={{ color:'var(--text)' }}>Everything to get you hired</h2>
            <p style={{ color:'var(--t2)' }}>Built around what actually moves the needle in real interviews</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={i} className="card card-hover p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background:`${f.color}10`, border:`1px solid ${f.color}20` }}>
                  <f.icon className="w-6 h-6" style={{ color:f.color }} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-base mb-2" style={{ color:'var(--text)' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color:'var(--t2)' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 border-t" style={{ borderColor:'var(--border)', background:'var(--surf)' }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-12">
            <div className="section-badge inline-flex mb-4"><Users className="w-3 h-3" /> Real Stories</div>
            <h2 className="font-display text-3xl font-bold" style={{ color:'var(--text)' }}>Students who landed offers with CareerForge AI</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { n:'Priya S.', r:'SDE @ Infosys', a:'P', c:'#4f46e5', t:'The full Placement Drive simulation was exactly what I needed — going through Aptitude, GD, Technical and HR back to back felt like the real thing, nerves included.' },
              { n:'Arjun K.', r:'Data Analyst @ TCS', a:'A', c:'#10b981', t:'Nobody else prepares you for the Group Discussion round. Practicing against 4 AI personas who actually disagreed with each other made the real one feel easy.' },
              { n:'Sneha R.', r:'PM @ Startup', a:'S', c:'#ec4899', t:'Seeing my percentile against everyone else on the leaderboard pushed me to practice more. The rubric breakdown after each session was a game-changer.' },
            ].map((t, i) => (
              <div key={i} className="card p-6 space-y-4">
                <div className="flex gap-0.5">{[1,2,3,4,5].map(j => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}</div>
                <p className="text-sm leading-relaxed" style={{ color:'var(--t2)' }}>"{t.t}"</p>
                <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor:'var(--border)' }}>
                  <div className="w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center" style={{ background:`${t.c}12`, color:t.c, border:`1px solid ${t.c}25` }}>{t.a}</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color:'var(--text)' }}>{t.n}</p>
                    <p className="text-xs" style={{ color:'var(--t3)' }}>{t.r}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <div className="card p-12 space-y-6 relative overflow-hidden" style={{ boxShadow:'0 24px 64px rgba(79,70,229,.1)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background:'radial-gradient(ellipse at 50% 0%, rgba(79,70,229,.06) 0%, transparent 70%)' }} />
            <div className="relative">
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6" style={{ background:'linear-gradient(135deg,#4f46e5,#6366f1)', boxShadow:'0 8px 24px rgba(79,70,229,.4)' }}>
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-4xl font-bold mb-3" style={{ color:'var(--text)' }}>
                Ready to <span className="gradient-text">ace it?</span>
              </h2>
              <p className="mb-8" style={{ color:'var(--t2)' }}>500+ students · 4 interview modes · Personalized career path · 100% free</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => navigate('/auth?mode=register')} className="btn btn-primary text-base py-3.5 px-8 rounded-2xl gap-2">
                  <Zap className="w-4.5 h-4.5" /> Create free account <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => navigate('/auth')} className="btn btn-outline text-base py-3.5 px-8 rounded-2xl gap-2">
                  Sign in
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8" style={{ borderColor:'var(--border)', background:'var(--surf)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#4f46e5,#6366f1)' }}>
              <Compass className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-sm" style={{ color:'var(--text)' }}>Career<span className="gradient-text">Forge</span> AI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <p className="text-xs" style={{ color:'var(--t3)' }}>AI-Based Career Guidance & Skill Assessment System · Powered by Groq · Free tier · College Mini Project</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
