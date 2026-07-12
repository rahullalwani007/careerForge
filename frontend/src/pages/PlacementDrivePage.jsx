import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { skillAssessmentApi, interviewApi, gdApi, driveApi } from '../services/api';
import { TARGET_ROLES, COMPANY_MODES } from '../services/mockData';
import CertificateModal from '../components/CertificateModal';
import { useBreakpoint } from '../hooks/useBreakpoint';
import {
  Building2, ChevronRight, CheckCircle2, XCircle, Loader, Send, Award,
  Sparkles, RefreshCw, Lock, Circle, GraduationCap, Users, Code2, MessageCircle,
} from 'lucide-react';

const ROUNDS = [
  { key:'aptitude',  label:'Aptitude',  icon:CheckCircle2 },
  { key:'gd',        label:'Group Discussion', icon:Users },
  { key:'technical', label:'Technical', icon:Code2 },
  { key:'hr',        label:'HR Round',  icon:MessageCircle },
  { key:'result',    label:'Result',    icon:Award },
];

function DriveMap({ current, eliminatedAt }) {
  const currentIdx = ROUNDS.findIndex(r => r.key === current);
  return (
    <div style={{ display:'flex', alignItems:'center', marginBottom:28, overflowX:'auto', padding:'4px 2px' }}>
      {ROUNDS.map((r, i) => {
        const done = i < currentIdx || (eliminatedAt && i < ROUNDS.length - 1 && current === 'result');
        const active = r.key === current;
        const failed = eliminatedAt && ROUNDS[i].label === eliminatedAt;
        const Icon = r.icon;
        return (
          <React.Fragment key={r.key}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0 }}>
              <div style={{
                width:40, height:40, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                background: failed ? 'var(--red)' : active ? 'var(--p)' : done ? 'var(--green)' : 'var(--surf3)',
                color: (active||done||failed) ? '#fff' : 'var(--t3)',
                border: active ? '3px solid var(--p-bg2)' : 'none', transition:'all .3s',
              }}>
                {failed ? <XCircle size={18}/> : done ? <CheckCircle2 size={18}/> : <Icon size={16}/>}
              </div>
              <span style={{ fontSize:10.5, fontWeight:700, color: active ? 'var(--p)' : 'var(--t3)', whiteSpace:'nowrap' }}>{r.label}</span>
            </div>
            {i < ROUNDS.length - 1 && <div style={{ flex:1, height:2, minWidth:20, background: i < currentIdx ? 'var(--green)' : 'var(--border)', margin:'0 4px 18px' }}/>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function PlacementDrivePage() {
  const navigate = useNavigate();
  const { config, addToast, user, refreshBadges, refreshActivity, updateReadiness } = useApp();
  const { isMobile } = useBreakpoint();
  const [phase, setPhase] = useState('setup'); // setup | aptitude | gd | technical | hr | result
  const [company, setCompany] = useState(COMPANY_MODES[0]);
  const [roleId, setRoleId] = useState(config.roleId || 'swe');
  const [loading, setLoading] = useState(false);

  const [roundScores, setRoundScores] = useState({ aptitude: null, gd: null, technical: null, hr: null });
  const [eliminatedAt, setEliminatedAt] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [driveHistory, setDriveHistory] = useState([]);

  useEffect(() => { driveApi.history().then(r => setDriveHistory(r.history)).catch(() => {}); }, []);

  // Aptitude round state
  const [aptQuestions, setAptQuestions] = useState([]);
  const [aptAnswers, setAptAnswers] = useState({});

  // GD round state
  const [gdScenario, setGdScenario] = useState(null);
  const [gdTranscript, setGdTranscript] = useState([]);
  const [gdInput, setGdInput] = useState('');
  const gdScrollRef = useRef(null);

  // Technical / HR round state (shared logic, 2 questions each)
  const [qaQuestions, setQaQuestions] = useState([]);
  const [qaIndex, setQaIndex] = useState(0);
  const [qaAnswer, setQaAnswer] = useState('');
  const [qaScores, setQaScores] = useState([]);
  const [qaFeedback, setQaFeedback] = useState(null);

  const roleTitle = TARGET_ROLES.find(r => r.id === roleId)?.title || 'Software Engineer';

  useEffect(() => { gdScrollRef.current?.scrollIntoView({ behavior:'smooth' }); }, [gdTranscript]);

  async function startDrive() {
    setLoading(true);
    try {
      const { questions } = await skillAssessmentApi.getQuiz(['dsa','general'], 3);
      setAptQuestions(questions);
      setAptAnswers({});
      setPhase('aptitude');
    } catch { addToast('Could not start the drive — is the backend running?', 'error'); }
    finally { setLoading(false); }
  }

  function submitAptitude() {
    const total = aptQuestions.length;
    const correct = aptQuestions.filter((q,i) => aptAnswers[i] === q.correct).length;
    const pct = Math.round((correct/total)*100);
    setRoundScores(s => ({ ...s, aptitude: pct }));
    if (pct < 40) {
      setEliminatedAt('Aptitude');
      finishDrive({ ...roundScores, aptitude: pct }, 'Aptitude');
    } else {
      startGD();
    }
  }

  async function startGD() {
    setLoading(true);
    setPhase('gd');
    try {
      const { scenario } = await gdApi.start(`A hot debate topic relevant to ${roleTitle} candidates, or any general current-affairs GD topic`);
      setGdScenario(scenario);
      setGdTranscript(scenario.transcript);
    } catch { addToast('Could not start GD round', 'error'); }
    finally { setLoading(false); }
  }

  async function gdContribute() {
    if (!gdInput.trim() || loading) return;
    const msg = gdInput.trim();
    setGdInput('');
    setLoading(true);
    setGdTranscript(t => [...t, { speaker:'You', text:msg, isUser:true }]);
    try {
      const { transcript } = await gdApi.respond(gdScenario.topic, gdScenario.personas, gdTranscript, msg);
      setGdTranscript(transcript);
    } catch { addToast('Connection issue — try again', 'error'); }
    finally { setLoading(false); }
  }

  async function finishGD() {
    setLoading(true);
    try {
      const { evaluation } = await gdApi.evaluate(gdScenario.topic, gdTranscript);
      const score = evaluation.score * 10; // 0-10 -> 0-100 scale
      setRoundScores(s => ({ ...s, gd: score }));
      startQARound('technical', score);
    } catch { addToast('Could not score GD round', 'error'); }
    finally { setLoading(false); }
  }

  async function startQARound(mode, gdScoreOverride) {
    setLoading(true);
    setPhase(mode);
    setQaIndex(0); setQaScores([]); setQaAnswer(''); setQaFeedback(null);
    try {
      const cfg = { mode, roleId, roleTitle, difficulty:'medium', questionCount:2, companyId:company.id, companyName:company.name, companyTraits:company.traits };
      const { questions } = await interviewApi.generateQuestions(cfg);
      setQaQuestions(questions);
    } catch { addToast(`Could not start ${mode} round`, 'error'); }
    finally { setLoading(false); }
  }

  async function submitQA() {
    if (!qaAnswer.trim() || loading) return;
    setLoading(true);
    try {
      const q = qaQuestions[qaIndex];
      const { feedback } = await interviewApi.feedback(q.question, qaAnswer, phase, 'medium');
      setQaFeedback(feedback);
      setQaScores(s => [...s, feedback.score]);
    } catch { addToast('Could not score that answer', 'error'); }
    finally { setLoading(false); }
  }

  function nextQA() {
    const next = qaIndex + 1;
    if (next >= qaQuestions.length) {
      const avg = qaScores.length ? (qaScores.reduce((a,b)=>a+b,0)/qaScores.length)*10 : 0;
      setRoundScores(s => {
        const updated = { ...s, [phase]: avg };
        if (phase === 'technical') startQARound('hr');
        else if (phase === 'hr') finishDrive(updated, null);
        return updated;
      });
    } else {
      setQaIndex(next); setQaAnswer(''); setQaFeedback(null);
    }
  }

  async function finishDrive(finalScores, elim) {
    setPhase('result');
    try {
      const { verdict, weightedScore, newBadges } = await driveApi.complete(company.name, roleTitle, finalScores);
      setFinalResult({ verdict, weightedScore, scores: finalScores, eliminatedAt: elim });
      if (verdict === 'Selected') updateReadiness(3);
      else if (verdict === 'Waitlisted') updateReadiness(1);
      await Promise.all([refreshBadges(), refreshActivity()]);
      driveApi.history().then(r => setDriveHistory(r.history)).catch(() => {});
      if (newBadges?.length) newBadges.forEach(id => addToast(`🏅 Badge Unlocked: ${id.replace(/_/g,' ')}!`, 'badge', 5000));
    } catch {
      setFinalResult({ verdict: elim ? 'Not Selected' : 'Completed', weightedScore: null, scores: finalScores, eliminatedAt: elim });
    }
  }

  function resetDrive() {
    setPhase('setup'); setRoundScores({ aptitude:null, gd:null, technical:null, hr:null });
    setEliminatedAt(null); setFinalResult(null);
  }

  const verdictColor = finalResult?.verdict === 'Selected' ? 'var(--green)' : finalResult?.verdict === 'Waitlisted' ? 'var(--amber)' : 'var(--red)';
  const verdictEmoji = finalResult?.verdict === 'Selected' ? '🎉' : finalResult?.verdict === 'Waitlisted' ? '⏳' : '💪';

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', paddingTop:80 }}>
      <div style={{ maxWidth:820, margin:'0 auto', padding:'28px 20px 70px' }}>

        <div style={{ marginBottom:8 }}>
          <h1 style={{ fontSize:26, fontWeight:900, color:'var(--text)', margin:'0 0 6px', fontFamily:"'Plus Jakarta Sans',sans-serif", display:'flex', alignItems:'center', gap:10 }}>
            <Building2 size={24} style={{ color:'var(--p)' }}/> Placement Drive Simulator
          </h1>
          <p style={{ color:'var(--t3)', margin:'0 0 20px', fontSize:14 }}>
            The full drive, end to end — Aptitude (elimination), Group Discussion, Technical, and HR — one continuous simulation with a real Selected / Waitlisted / Not Selected outcome.
          </p>
        </div>

        {phase !== 'setup' && <DriveMap current={phase} eliminatedAt={eliminatedAt} />}

        {phase==='setup' && (
          <div className="card">
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--t3)', marginBottom:10, textTransform:'uppercase' }}>Target Company</label>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:8, marginBottom:20 }}>
              {COMPANY_MODES.map(c=>(
                <button key={c.id} onClick={()=>setCompany(c)}
                  style={{ padding:'10px 8px', borderRadius:11, border:`2px solid ${company.id===c.id?c.color:'var(--border)'}`, background:company.id===c.id?`${c.color}12`:'var(--surf)', cursor:'pointer', textAlign:'center' }}>
                  <div style={{ fontSize:20 }}>{c.emoji}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text)', marginTop:2 }}>{c.name}</div>
                </button>
              ))}
            </div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--t3)', marginBottom:10, textTransform:'uppercase' }}>Target Role</label>
            <select className="input" value={roleId} onChange={e=>setRoleId(e.target.value)} style={{ marginBottom:20 }}>
              {TARGET_ROLES.map(r=><option key={r.id} value={r.id}>{r.icon} {r.title}</option>)}
            </select>
            <div style={{ padding:'10px 14px', borderRadius:11, background:'var(--surf2)', border:'1px solid var(--border)', marginBottom:20, fontSize:12.5, color:'var(--t3)', lineHeight:1.6 }}>
              Score below 40% in Aptitude and the drive ends there — just like a real elimination round. Clear it, and Technical carries the most weight toward your final verdict, then HR, then GD.
            </div>
            <button className="btn-primary" onClick={startDrive} disabled={loading} style={{ width:'100%', padding:'15px', fontSize:16, fontWeight:800, gap:8, borderRadius:14 }}>
              {loading ? <><Loader size={16} className="spin-anim"/>Preparing…</> : <><Sparkles size={16}/>Begin Placement Drive</>}
            </button>
          </div>
        )}

        {phase==='setup' && driveHistory.length > 0 && (
          <div className="card" style={{ marginTop:16 }}>
            <h3 style={{ fontSize:13, fontWeight:800, color:'var(--text)', margin:'0 0 12px', display:'flex', alignItems:'center', gap:7 }}>
              <Building2 size={14} style={{ color:'var(--p)' }}/> Past Drives
            </h3>
            {driveHistory.slice(0,5).map(h=>{
              const color = h.verdict==='Selected'?'var(--green)':h.verdict==='Waitlisted'?'var(--amber)':'var(--red)';
              const bg = h.verdict==='Selected'?'var(--green-bg)':h.verdict==='Waitlisted'?'var(--amber-bg)':'var(--red-bg)';
              return (
                <div key={h.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:800, background:bg, color, flexShrink:0 }}>{h.verdict}</span>
                  <span style={{ flex:1, fontSize:12.5, color:'var(--t2)' }}>{h.company} · {h.roleTitle}</span>
                  <span style={{ fontSize:11, color:'var(--t4)', flexShrink:0 }}>{new Date(h.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
                </div>
              );
            })}
          </div>
        )}

        {phase==='aptitude' && (
          <div className="card">
            <h3 style={{ fontSize:15, fontWeight:800, color:'var(--text)', margin:'0 0 4px' }}>Round 1: Aptitude Screening</h3>
            <p style={{ fontSize:12.5, color:'var(--t3)', margin:'0 0 16px' }}>Need 40%+ to advance — {Object.keys(aptAnswers).length}/{aptQuestions.length} answered</p>
            {aptQuestions.map((q,i)=>(
              <div key={i} style={{ marginBottom:16, paddingBottom:16, borderBottom: i<aptQuestions.length-1 ? '1px solid var(--border)' : 'none' }}>
                <p style={{ fontSize:13.5, fontWeight:600, color:'var(--text)', margin:'0 0 10px' }}>{i+1}. {q.question}</p>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {q.options.map((opt,oi)=>(
                    <button key={oi} onClick={()=>setAptAnswers(a=>({...a,[i]:oi}))}
                      style={{ textAlign:'left', padding:'8px 12px', borderRadius:9, border:`1.5px solid ${aptAnswers[i]===oi?'var(--p)':'var(--border)'}`, background:aptAnswers[i]===oi?'var(--p-bg)':'var(--surf)', cursor:'pointer', fontSize:12.5, color:aptAnswers[i]===oi?'var(--p)':'var(--t2)' }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button className="btn-primary" onClick={submitAptitude} disabled={Object.keys(aptAnswers).length<aptQuestions.length} style={{ width:'100%' }}>
              Submit Aptitude Round <ChevronRight size={14}/>
            </button>
          </div>
        )}

        {phase==='gd' && gdScenario && (
          <div className="card">
            <h3 style={{ fontSize:15, fontWeight:800, color:'var(--text)', margin:'0 0 4px' }}>Round 2: Group Discussion</h3>
            <p style={{ fontSize:12.5, color:'var(--t3)', margin:'0 0 14px' }}>Topic: <strong style={{ color:'var(--text)' }}>{gdScenario.topic}</strong></p>
            <div style={{ maxHeight:340, overflowY:'auto', marginBottom:14, padding:'4px 2px' }}>
              {gdTranscript.map((m,i)=>(
                <div key={i} style={{ display:'flex', justifyContent: m.isUser?'flex-end':'flex-start', marginBottom:10 }}>
                  <div style={{ maxWidth:'78%' }}>
                    {!m.isUser && <div style={{ fontSize:10.5, fontWeight:800, color:'var(--t3)', marginBottom:2 }}>{m.speaker}</div>}
                    <div style={{ padding:'9px 13px', borderRadius: m.isUser?'14px 14px 3px 14px':'3px 14px 14px 14px', background:m.isUser?'linear-gradient(135deg,#4f46e5,#6366f1)':'var(--surf2)', color:m.isUser?'#fff':'var(--text)', border:m.isUser?'none':'1px solid var(--border)', fontSize:12.5, lineHeight:1.55 }}>
                      {m.text}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={gdScrollRef}/>
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:10 }}>
              <input className="input" value={gdInput} onChange={e=>setGdInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();gdContribute();} }}
                placeholder="Contribute to the discussion…" disabled={loading} style={{ flex:1 }}/>
              <button className="btn-primary" onClick={gdContribute} disabled={!gdInput.trim()||loading} style={{ padding:'0 16px' }}><Send size={14}/></button>
            </div>
            <button className="btn-outline" onClick={finishGD} disabled={!gdTranscript.some(t=>t.isUser)||loading} style={{ width:'100%', fontSize:13 }}>
              Move to Technical Round <ChevronRight size={14}/>
            </button>
          </div>
        )}

        {(phase==='technical'||phase==='hr') && (
          <div className="card">
            <h3 style={{ fontSize:15, fontWeight:800, color:'var(--text)', margin:'0 0 4px' }}>
              Round {phase==='technical'?'3':'4'}: {phase==='technical'?'Technical Interview':'HR Round'}
            </h3>
            {qaQuestions.length===0 ? (
              <div style={{ textAlign:'center', padding:'30px 0' }}><Loader size={20} className="spin-anim" style={{ color:'var(--p)' }}/></div>
            ) : (
              <>
                <p style={{ fontSize:12.5, color:'var(--t3)', margin:'0 0 14px' }}>Question {qaIndex+1} of {qaQuestions.length} · {company.name} style</p>
                <p style={{ fontSize:14.5, fontWeight:600, color:'var(--text)', margin:'0 0 12px', lineHeight:1.6 }}>{qaQuestions[qaIndex]?.question}</p>
                {!qaFeedback ? (
                  <>
                    <textarea className="input" style={{ minHeight:120, resize:'vertical', marginBottom:12 }} value={qaAnswer} onChange={e=>setQaAnswer(e.target.value)} placeholder="Type your answer…"/>
                    <button className="btn-primary" onClick={submitQA} disabled={!qaAnswer.trim()||loading} style={{ width:'100%' }}>
                      {loading ? <Loader size={14} className="spin-anim"/> : 'Submit Answer'}
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--p-bg)', borderRadius:10, marginBottom:10 }}>
                      <span style={{ fontSize:22, fontWeight:900, color:'var(--p)' }}>{qaFeedback.score}/10</span>
                      <span style={{ fontSize:12.5, color:'var(--t2)' }}>{qaFeedback.strengths?.[0] || 'Answer recorded'}</span>
                    </div>
                    <button className="btn-primary" onClick={nextQA} style={{ width:'100%', gap:6 }}>
                      {qaIndex+1>=qaQuestions.length ? (phase==='technical'?'Move to HR Round':'Finish Drive') : 'Next Question'} <ChevronRight size={14}/>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {phase==='result' && (
          <div style={{ animation:'fadeUp .5s ease' }}>
            {!finalResult ? (
              <div style={{ textAlign:'center', padding:'60px 0' }}><Loader size={26} className="spin-anim" style={{ color:'var(--p)' }}/><p style={{ color:'var(--t3)', marginTop:12 }}>Computing final verdict…</p></div>
            ) : (
              <>
                <div style={{ background:'linear-gradient(135deg,#0f172a,#1e1b4b)', borderRadius:20, padding:'36px 32px', textAlign:'center', marginBottom:22 }}>
                  <div style={{ fontSize:52, marginBottom:8 }}>{verdictEmoji}</div>
                  <div style={{ fontSize:28, fontWeight:900, color: verdictColor, fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:6 }}>{finalResult.verdict}</div>
                  <p style={{ color:'rgba(255,255,255,.75)', fontSize:14, margin:0 }}>
                    {company.name} · {roleTitle}{finalResult.eliminatedAt ? ` · Eliminated at ${finalResult.eliminatedAt} Round` : finalResult.weightedScore!=null ? ` · Weighted score: ${finalResult.weightedScore}%` : ''}
                  </p>
                </div>

                <div className="card" style={{ marginBottom:20 }}>
                  <h3 style={{ fontSize:14, fontWeight:800, color:'var(--text)', margin:'0 0 14px' }}>Round-by-Round Breakdown</h3>
                  {['aptitude','gd','technical','hr'].map(k=>{
                    const val = finalResult.scores[k];
                    const label = k==='aptitude'?'Aptitude':k==='gd'?'Group Discussion':k==='technical'?'Technical':'HR Round';
                    return (
                      <div key={k} style={{ marginBottom:10, opacity: val==null?0.4:1 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                          <span style={{ fontSize:12.5, fontWeight:600, color:'var(--t2)' }}>{label}</span>
                          <span style={{ fontSize:12.5, fontWeight:800, color:'var(--text)' }}>{val!=null ? `${Math.round(val)}%` : 'Not reached'}</span>
                        </div>
                        <div style={{ height:6, borderRadius:99, background:'var(--border)', overflow:'hidden' }}>
                          <div style={{ width:`${val||0}%`, height:'100%', background:'var(--p)', borderRadius:99, transition:'width 1s ease' }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
                  <button className="btn-outline" onClick={()=>navigate('/dashboard')}>Dashboard</button>
                  {finalResult.verdict==='Selected' && (
                    <button className="btn-outline" onClick={()=>setShowCertificate(true)} style={{ gap:6 }}><GraduationCap size={14}/> Get Offer Letter</button>
                  )}
                  <button className="btn-primary" onClick={resetDrive} style={{ gap:7 }}><RefreshCw size={14}/> New Drive</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showCertificate && finalResult && (
        <CertificateModal
          name={user?.name || 'Candidate'}
          roleTitle={`${roleTitle} @ ${company.name}`}
          score={finalResult.weightedScore ? `${finalResult.weightedScore}%` : 'Selected'}
          kind="Placement Drive — Selected"
          onClose={()=>setShowCertificate(false)}
        />
      )}
    </div>
  );
}
