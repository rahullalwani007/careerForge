import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SKILL_CATEGORIES } from '../services/mockData';
import { skillAssessmentApi } from '../services/api';
import SkillRadarChart from '../components/SkillRadarChart';
import {
  ListChecks, Loader, CheckCircle, XCircle, RefreshCw, TrendingUp,
  BookOpen, ChevronRight, Award, Clock, Sparkles, ArrowRight,
} from 'lucide-react';
import { useBreakpoint } from '../hooks/useBreakpoint';

const PER_CATEGORY_OPTIONS = [3, 4, 5];

function CategoryPicker({ selected, onToggle }) {
  const { isMobile } = useBreakpoint();
  return (
    <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap:10 }}>
      {SKILL_CATEGORIES.map(c => {
        const active = selected.includes(c.id);
        return (
          <button key={c.id} onClick={()=>onToggle(c.id)}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderRadius:13, border:`2px solid ${active?c.color:'var(--border)'}`, background:active?`${c.color}12`:'var(--surf)', cursor:'pointer', transition:'all .18s', textAlign:'left' }}>
            <span style={{ fontSize:22 }}>{c.icon}</span>
            <span style={{ fontSize:13, fontWeight:700, color:active?c.color:'var(--text)' }}>{c.label}</span>
            {active && <CheckCircle size={15} style={{ color:c.color, marginLeft:'auto', flexShrink:0 }} />}
          </button>
        );
      })}
    </div>
  );
}

function ResultsView({ result, history, onRetake }) {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const categories = Object.entries(result.categoryScores).map(([id, value]) => {
    const meta = SKILL_CATEGORIES.find(c=>c.id===id) || { label:id, color:'#4f46e5' };
    return { key:id, label: meta.label.split(' ')[0] === 'Data' ? 'DSA' : meta.label, value, color: meta.color };
  });
  const weakest = [...categories].sort((a,b)=>a.value-b.value).slice(0,2);
  const grade = result.overallScore>=85?'A+':result.overallScore>=70?'A':result.overallScore>=55?'B':result.overallScore>=40?'C':'D';

  return (
    <div style={{ animation:'fadeUp .5s ease' }}>
      <div style={{ background:'linear-gradient(135deg,#0f172a,#1e1b4b)', borderRadius:20, padding:'30px 32px', marginBottom:24, display:'flex', alignItems:'center', gap:28, flexWrap:'wrap' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:44, fontWeight:900, color:'#fff', fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1 }}>{result.overallScore}%</div>
          <div style={{ fontSize:22, fontWeight:900, color:'#c99a3a', marginTop:4 }}>{grade}</div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,.7)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.5px' }}>Skill Assessment Complete</div>
          <p style={{ color:'rgba(255,255,255,.85)', fontSize:14, lineHeight:1.6, margin:0 }}>
            You answered <strong>{result.correctAnswers}</strong> of <strong>{result.totalQuestions}</strong> questions correctly across {categories.length} categor{categories.length===1?'y':'ies'}.
            {weakest.length>0 && <> Your biggest opportunity right now is <strong>{weakest[0].label}</strong>.</>}
          </p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:20, marginBottom:24 }}>
        <div className="card">
          <h3 style={{ fontSize:15, fontWeight:800, color:'var(--text)', margin:'0 0 4px', display:'flex', alignItems:'center', gap:7 }}>
            <ListChecks size={15} style={{ color:'var(--p)' }}/> Skill Radar
          </h3>
          <SkillRadarChart size={260} color="#14b8a6" data={categories.map(c=>({ label:c.label, value:c.value }))} />
        </div>

        <div className="card">
          <h3 style={{ fontSize:15, fontWeight:800, color:'var(--text)', margin:'0 0 14px', display:'flex', alignItems:'center', gap:7 }}>
            <TrendingUp size={15} style={{ color:'var(--p)' }}/> Category Breakdown
          </h3>
          {categories.map(c=>(
            <div key={c.key} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:12.5, fontWeight:600, color:'var(--t2)' }}>{c.label}</span>
                <span style={{ fontSize:12.5, fontWeight:800, color:c.color }}>{c.value}%</span>
              </div>
              <div style={{ height:7, borderRadius:99, background:'var(--border)', overflow:'hidden' }}>
                <div style={{ width:`${c.value}%`, height:'100%', background:c.color, borderRadius:99, transition:'width 1s cubic-bezier(.34,1.56,.64,1)' }}/>
              </div>
            </div>
          ))}
          <button onClick={()=>navigate('/learn')} className="btn-outline" style={{ width:'100%', fontSize:12.5, gap:6, marginTop:6 }}>
            <BookOpen size={13}/> Study weak areas in Learning Hub
          </button>
        </div>
      </div>

      {history.length>1 && (
        <div className="card" style={{ marginBottom:24 }}>
          <h3 style={{ fontSize:15, fontWeight:800, color:'var(--text)', margin:'0 0 14px', display:'flex', alignItems:'center', gap:7 }}>
            <Clock size={15} style={{ color:'var(--p)' }}/> Progress Over Time
          </h3>
          <div style={{ display:'flex', gap:8, alignItems:'flex-end', height:90, padding:'0 4px' }}>
            {history.map((h,i)=>{
              const isLast = i===history.length-1;
              return (
                <div key={h.id} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <span style={{ fontSize:10, fontWeight:800, color: isLast?'var(--p)':'var(--t3)' }}>{h.overallScore}%</span>
                  <div style={{ width:'100%', maxWidth:36, height:`${Math.max(6,h.overallScore*0.6)}px`, background: isLast?'var(--p)':'var(--border2)', borderRadius:'6px 6px 0 0', transition:'height .6s ease' }}/>
                  <span style={{ fontSize:9, color:'var(--t4)' }}>{new Date(h.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
        <button className="btn-outline" onClick={()=>navigate('/dashboard')} style={{ gap:7, fontSize:14 }}>Dashboard</button>
        <button className="btn-primary" onClick={onRetake} style={{ gap:7, fontSize:14 }}><RefreshCw size={14}/> Take Another Assessment</button>
      </div>
    </div>
  );
}

export default function SkillAssessmentPage() {
  const { addToast, refreshBadges, refreshActivity, updateReadiness } = useApp();
  const [phase, setPhase] = useState('setup'); // setup | quiz | grading | results
  const [selected, setSelected] = useState(['dsa', 'dbms']);
  const [perCategory, setPerCategory] = useState(4);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [reviewMode, setReviewMode] = useState(false);

  useEffect(() => {
    skillAssessmentApi.history().then(r => setHistory(r.history)).catch(() => {});
  }, []);

  function toggleCategory(id) {
    setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id]);
  }

  async function handleStart() {
    if (!selected.length) { addToast('Pick at least one category first', 'error'); return; }
    setPhase('quiz'); setAnswers({}); setReviewMode(false);
    try {
      const { questions: qs } = await skillAssessmentApi.getQuiz(selected, perCategory);
      setQuestions(qs);
    } catch {
      addToast('Could not load the quiz — is the backend running?', 'error');
      setPhase('setup');
    }
  }

  async function handleSubmit() {
    setPhase('grading');
    const categoryTotals = {};
    const categoryCorrect = {};
    let correctAnswers = 0;
    questions.forEach((q, i) => {
      const cat = q.category || selected[0];
      categoryTotals[cat] = (categoryTotals[cat]||0) + 1;
      if (answers[i] === q.correct) { categoryCorrect[cat] = (categoryCorrect[cat]||0) + 1; correctAnswers++; }
    });
    const categoryScores = {};
    Object.keys(categoryTotals).forEach(cat => {
      categoryScores[cat] = Math.round(((categoryCorrect[cat]||0) / categoryTotals[cat]) * 100);
    });

    try {
      const res = await skillAssessmentApi.submit(categoryScores, questions.length, correctAnswers);
      setResult({ categoryScores, totalQuestions: questions.length, correctAnswers, overallScore: res.overallScore });
      setHistory(h => [...h, { id: res.id, categories: categoryScores, overallScore: res.overallScore, date: new Date().toISOString() }]);
      if (res.overallScore >= 70) updateReadiness(1);
      await Promise.all([refreshBadges(), refreshActivity()]);
      if (res.newBadges?.length) res.newBadges.forEach(id => addToast(`🏅 Badge Unlocked: ${id.replace(/_/g,' ')}!`, 'badge', 5000));
    } catch {
      const overallScore = Math.round((correctAnswers/questions.length)*100);
      setResult({ categoryScores, totalQuestions: questions.length, correctAnswers, overallScore });
      addToast('Saved locally only — could not reach the backend to store history.', 'info');
    }
    setPhase('results');
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', paddingTop:80 }}>
      <div style={{ maxWidth:900, margin:'0 auto', padding:'28px 20px 70px' }}>

        <div style={{ marginBottom:26 }}>
          <h1 style={{ fontSize:26, fontWeight:900, color:'var(--text)', margin:'0 0 6px', fontFamily:"'Plus Jakarta Sans',sans-serif", display:'flex', alignItems:'center', gap:10 }}>
            <ListChecks size={24} style={{ color:'var(--p)' }}/> Skill Assessment Center
          </h1>
          <p style={{ color:'var(--t3)', margin:0, fontSize:14 }}>A proper, scored multiple-choice test across core CS categories — separate from mock interview practice, with a radar chart of where you stand.</p>
        </div>

        {phase==='setup' && (
          <div className="card">
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--t3)', marginBottom:10, textTransform:'uppercase', letterSpacing:'.5px' }}>Choose Categories</label>
            <CategoryPicker selected={selected} onToggle={toggleCategory} />

            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--t3)', margin:'22px 0 10px', textTransform:'uppercase', letterSpacing:'.5px' }}>Questions per Category</label>
            <div style={{ display:'flex', gap:9, marginBottom:24 }}>
              {PER_CATEGORY_OPTIONS.map(n=>(
                <button key={n} onClick={()=>setPerCategory(n)}
                  style={{ width:48, height:44, borderRadius:11, border:`2px solid ${perCategory===n?'var(--p)':'var(--border)'}`, background:perCategory===n?'var(--p-bg)':'var(--surf)', color:perCategory===n?'var(--p)':'var(--t2)', fontSize:15, fontWeight:900, cursor:'pointer', transition:'all .18s' }}>
                  {n}
                </button>
              ))}
            </div>

            <div style={{ padding:'10px 14px', borderRadius:11, background:'var(--surf2)', border:'1px solid var(--border)', marginBottom:20, fontSize:12.5, color:'var(--t3)' }}>
              Total: <strong style={{ color:'var(--text)' }}>{selected.length * perCategory} questions</strong> across <strong style={{ color:'var(--text)' }}>{selected.length}</strong> categor{selected.length===1?'y':'ies'}
            </div>

            <button className="btn-primary" onClick={handleStart} style={{ width:'100%', padding:'15px', fontSize:16, fontWeight:800, gap:8, borderRadius:14 }}>
              <Sparkles size={16}/> Start Assessment
            </button>
          </div>
        )}

        {phase==='quiz' && (
          <>
            <div style={{ position:'sticky', top:70, zIndex:10, background:'var(--bg)', paddingBottom:12, marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', background:'var(--surf)', borderRadius:12, border:'1px solid var(--border)' }}>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{answeredCount} / {questions.length} answered</span>
                <div style={{ flex:1, margin:'0 16px', height:6, borderRadius:99, background:'var(--border)', overflow:'hidden' }}>
                  <div style={{ width:`${(answeredCount/Math.max(1,questions.length))*100}%`, height:'100%', background:'var(--p)', borderRadius:99, transition:'width .3s' }}/>
                </div>
                <button className="btn-primary" onClick={handleSubmit} disabled={answeredCount<questions.length} style={{ fontSize:13, padding:'8px 18px' }}>
                  Submit
                </button>
              </div>
            </div>

            {questions.length===0 ? (
              <div style={{ textAlign:'center', padding:'60px 0' }}>
                <Loader size={28} className="spin-anim" style={{ color:'var(--p)' }}/>
                <p style={{ color:'var(--t3)', marginTop:14 }}>ARIA is building your quiz…</p>
              </div>
            ) : questions.map((q, i) => {
              const meta = SKILL_CATEGORIES.find(c=>c.id===q.category);
              return (
                <div key={i} className="card" style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <span style={{ width:24, height:24, borderRadius:6, background:'var(--p-bg)', color:'var(--p)', fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</span>
                    {meta && <span style={{ padding:'2px 9px', borderRadius:99, fontSize:10.5, fontWeight:700, background:`${meta.color}15`, color:meta.color }}>{meta.icon} {meta.label}</span>}
                  </div>
                  <p style={{ fontSize:14.5, fontWeight:600, color:'var(--text)', margin:'0 0 12px', lineHeight:1.6 }}>{q.question}</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {q.options.map((opt, oi) => {
                      const active = answers[i]===oi;
                      return (
                        <button key={oi} onClick={()=>setAnswers(a=>({...a,[i]:oi}))}
                          style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, border:`1.5px solid ${active?'var(--p)':'var(--border)'}`, background:active?'var(--p-bg)':'var(--surf)', cursor:'pointer', textAlign:'left', transition:'all .15s' }}>
                          <span style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${active?'var(--p)':'var(--border2)'}`, background:active?'var(--p)':'transparent', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            {active && <span style={{ width:7, height:7, borderRadius:'50%', background:'#fff' }}/>}
                          </span>
                          <span style={{ fontSize:13, color:active?'var(--p)':'var(--t2)', fontWeight:active?700:500 }}>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {phase==='grading' && (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <div style={{ width:56,height:56,border:'3px solid var(--border)',borderTopColor:'var(--p)',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 20px' }}/>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Scoring your assessment…</div>
          </div>
        )}

        {phase==='results' && result && (
          <ResultsView result={result} history={history} onRetake={()=>setPhase('setup')} />
        )}
      </div>
    </div>
  );
}
