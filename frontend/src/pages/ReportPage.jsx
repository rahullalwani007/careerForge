import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { INTERVIEW_MODES, TARGET_ROLES } from '../services/mockData';
import { leaderboardApi } from '../services/api';
import { useBreakpoint } from '../hooks/useBreakpoint';
import SkillRadarChart from '../components/SkillRadarChart';
import CertificateModal from '../components/CertificateModal';
import { Award, TrendingUp, CheckCircle, RefreshCw, Home, BookOpen,
         ChevronDown, ChevronUp, Clock, Target, Star, Zap, BarChart2,
         AlertCircle, ThumbsUp, ArrowRight, Download, ShieldCheck, Users, Trophy, GraduationCap } from 'lucide-react';

/* ── Animated score ring SVG ── */
function ScoreRing({ score, size=120, stroke=10 }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 300);
    return () => clearTimeout(t);
  }, [score]);
  const r = (size-stroke)/2;
  const circ = 2*Math.PI*r;
  const offset = circ - (animated/10)*circ;
  const color = score>=8?'#10b981':score>=6?'#f59e0b':score>=4?'#f97316':'#ef4444';
  const grade = score>=9?'A+':score>=8?'A':score>=7?'B+':score>=6?'B':score>=5?'C+':'C';
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition:'stroke-dashoffset 1.4s cubic-bezier(.34,1.56,.64,1)', strokeLinecap:'round' }} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:0 }}>
        <span style={{ fontSize:32, fontWeight:900, color, lineHeight:1, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{score.toFixed(1)}</span>
        <span style={{ fontSize:12, color:'var(--t3)', fontWeight:600 }}>/10</span>
        <span style={{ fontSize:18, fontWeight:900, color, marginTop:2 }}>{grade}</span>
      </div>
    </div>
  );
}

/* ── Horizontal skill bar ── */
function SkillBar({ label, value, color, delay=0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(()=>setWidth(value), 500+delay); return ()=>clearTimeout(t); }, [value, delay]);
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
        <span style={{ fontSize:13, fontWeight:600, color:'var(--t2)' }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:800, color }}>{value}%</span>
      </div>
      <div style={{ height:8, borderRadius:99, background:'var(--border)', overflow:'hidden' }}>
        <div style={{ width:`${width}%`, height:'100%', background:color, borderRadius:99, transition:'width 1s cubic-bezier(.34,1.56,.64,1)' }} />
      </div>
    </div>
  );
}

/* ── Score mini chart ── */
function ScoreBarChart({ scores }) {
  const [anim, setAnim] = useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setAnim(true),400); return()=>clearTimeout(t); },[]);
  const max = 10;
  return (
    <div style={{ display:'flex', gap:6, alignItems:'flex-end', height:72, padding:'0 4px' }}>
      {scores.map((s,i)=>{
        const color=s>=8?'var(--green)':s>=6?'#f59e0b':s>=4?'var(--amber)':'var(--red)';
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <span style={{ fontSize:9, fontWeight:700, color }}>{s}</span>
            <div style={{ width:'100%', background:color, borderRadius:'4px 4px 0 0', transition:'height 1s cubic-bezier(.34,1.56,.64,1)', height:anim?`${(s/max)*52}px`:'4px', minHeight:4 }} />
            <span style={{ fontSize:9, color:'var(--t4)' }}>Q{i+1}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Question accordion item ── */
function QuestionItem({ item, idx, defaultOpen=false }) {
  const [open, setOpen] = useState(defaultOpen);
  const { isMobile } = useBreakpoint();
  const fb = item.feedback||{};
  const score = fb.score??0;
  const color = score>=8?'var(--green)':score>=6?'#f59e0b':score>=4?'var(--amber)':'var(--red)';
  const bg    = score>=8?'var(--green-bg)':score>=6?'#fffbeb':score>=4?'var(--amber-bg)':'var(--red-bg)';
  const label = score>=8?'Excellent':score>=6?'Good':score>=4?'Fair':'Needs Work';

  return (
    <div style={{ border:'1.5px solid var(--border)', borderRadius:14, overflow:'hidden', marginBottom:10, transition:'border-color .2s' }}
      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border2)'}
      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
      <div onClick={()=>setOpen(o=>!o)}
        style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', cursor:'pointer', background:'var(--surf)', userSelect:'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <span style={{ width:24, height:24, borderRadius:6, background:'var(--p-bg)', color:'var(--p)', fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{idx+1}</span>
          <span style={{ padding:'2px 9px', borderRadius:99, fontSize:11, fontWeight:800, background:bg, color }}>{score}/10</span>
          <span style={{ fontSize:11, fontWeight:600, color, display:'none' }}>{label}</span>
        </div>
        <p style={{ flex:1, margin:0, fontSize:13, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:open?'normal':'nowrap', lineHeight:1.5 }}>
          {item.question}
        </p>
        {item.timeSpent>0&&<span style={{ fontSize:11, color:'var(--t3)', flexShrink:0, display:'flex', alignItems:'center', gap:3 }}><Clock size={10}/>{Math.round(item.timeSpent/60)||1}m</span>}
        {open?<ChevronUp size={15} style={{ color:'var(--t3)', flexShrink:0 }}/>:<ChevronDown size={15} style={{ color:'var(--t3)', flexShrink:0 }}/>}
      </div>

      {open&&(
        <div style={{ padding:'16px 18px', background:'var(--bg2)', borderTop:'1px solid var(--border)' }}>
          {item.answer&&(
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--t3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.4px' }}>Your Answer</div>
              <div style={{ fontSize:13, color:'var(--t2)', lineHeight:1.7, background:'var(--surf)', padding:'12px 14px', borderRadius:10, border:'1px solid var(--border)' }}>{item.answer}</div>
            </div>
          )}

          {/* Score bar */}
          <div style={{ marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <span style={{ fontSize:12, fontWeight:600, color:'var(--t3)' }}>Score</span>
              <span style={{ fontSize:13, fontWeight:800, color }}>{score}/10 — {label}</span>
            </div>
            <div style={{ height:10, borderRadius:99, background:'var(--border)', overflow:'hidden' }}>
              <div style={{ width:`${score*10}%`, height:'100%', background:color, borderRadius:99 }} />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:10, marginBottom:fb.explanation?12:0 }}>
            {fb.strengths?.filter(Boolean).length>0&&(
              <div style={{ padding:'12px 14px', background:'var(--green-bg)', borderRadius:10, border:'1px solid rgba(16,185,129,.2)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#15803d', marginBottom:6, textTransform:'uppercase' }}>✓ Strengths</div>
                {fb.strengths.filter(Boolean).map((s,i)=><div key={i} style={{ fontSize:12, color:'#166534', marginTop:3, lineHeight:1.4 }}>• {s}</div>)}
              </div>
            )}
            {fb.improvements?.filter(Boolean).length>0&&(
              <div style={{ padding:'12px 14px', background:'var(--amber-bg)', borderRadius:10, border:'1px solid rgba(245,158,11,.2)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#92400e', marginBottom:6, textTransform:'uppercase' }}>↑ Improve</div>
                {fb.improvements.filter(Boolean).map((s,i)=><div key={i} style={{ fontSize:12, color:'#78350f', marginTop:3, lineHeight:1.4 }}>• {s}</div>)}
              </div>
            )}
          </div>

          {fb.explanation&&(
            <div style={{ marginTop:10, padding:'12px 14px', background:'var(--surf)', borderRadius:10, border:'1px solid var(--border2)', fontSize:12, color:'var(--t2)', lineHeight:1.7 }}>
              <strong style={{ color:'var(--text)' }}>💡 Ideal: </strong>{fb.explanation}
            </div>
          )}

          {fb.tags?.length>0&&(
            <div style={{ marginTop:10, display:'flex', flexWrap:'wrap', gap:6 }}>
              {fb.tags.map(t=><span key={t} className="pill pill-p">{t}</span>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Comparison with history ── */
function CompareCard({ sessions, currentScore, mode }) {
  const { isMobile } = useBreakpoint();
  const similar = sessions.filter(s=>s.mode===mode).slice(0,5);
  if (!similar.length) return null;
  const avg = (similar.reduce((a,b)=>a+(b.averageScore||0),0)/similar.length).toFixed(1);
  const best = Math.max(...similar.map(s=>s.averageScore||0)).toFixed(1);
  const trend = currentScore > parseFloat(avg) ? 'up' : currentScore < parseFloat(avg) ? 'down' : 'same';
  return (
    <div className="card">
      <h3 style={{ fontSize:15, fontWeight:800, color:'var(--text)', margin:'0 0 14px', display:'flex', alignItems:'center', gap:7 }}>
        <BarChart2 size={15} style={{ color:'var(--p)' }} /> vs Your History
      </h3>
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap:10, marginBottom:14 }}>
        {[
          { label:'This Session', val:`${currentScore.toFixed(1)}/10`, color:'var(--p)' },
          { label:'Your Average', val:`${avg}/10`, color:'var(--t2)' },
          { label:'Your Best', val:`${best}/10`, color:'var(--green)' },
        ].map(s=>(
          <div key={s.label} style={{ textAlign:'center', padding:'10px 6px', background:'var(--surf2)', borderRadius:10, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:18, fontWeight:900, color:s.color, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{s.val}</div>
            <div style={{ fontSize:10, color:'var(--t3)', marginTop:2, fontWeight:600 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ padding:'10px 14px', background:trend==='up'?'var(--green-bg)':trend==='down'?'var(--red-bg)':'var(--surf2)', borderRadius:10, border:`1px solid ${trend==='up'?'rgba(16,185,129,.2)':trend==='down'?'rgba(239,68,68,.2)':'var(--border)'}`, fontSize:13, fontWeight:700, color:trend==='up'?'var(--green)':trend==='down'?'var(--red)':'var(--t3)', display:'flex', alignItems:'center', gap:7 }}>
        <TrendingUp size={14} style={{ transform:trend==='down'?'rotate(180deg)':'none' }} />
        {trend==='up'?`+${(currentScore-parseFloat(avg)).toFixed(1)} above your average!`:trend==='down'?`${(currentScore-parseFloat(avg)).toFixed(1)} below your average`:' Same as your average'}
      </div>
    </div>
  );
}

/* ── Main ── */
export default function ReportPage() {
  const navigate = useNavigate();
  const { session, report, config, resetSession, careerPath, sessionHistory, user } = useApp();
  const { isMobile } = useBreakpoint();
  const [mounted, setMounted] = useState(false);
  const [expandAll, setExpandAll] = useState(false);
  const [percentile, setPercentile] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);
  useEffect(()=>{ setMounted(true); }, []);

  const timeline = session?.timeline||[];
  const hasData = timeline.length>0;
  const lastSession = sessionHistory[0];

  const scores = timeline.map(t=>t.feedback?.score||0);
  const avgScore = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length) : (report?.overallScore || 0);

  useEffect(() => {
    if (!hasData) return;
    leaderboardApi.percentile(config.mode, avgScore.toFixed(1)).then(setPercentile).catch(()=>{});
  }, [hasData]);

  if (!hasData) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', paddingTop:80, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', padding:32 }}>
        <div style={{ fontSize:56, marginBottom:16 }}>📊</div>
        <h2 style={{ fontSize:22, fontWeight:800, color:'var(--text)', margin:'0 0 10px', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>No session data</h2>
        <p style={{ color:'var(--t3)', marginBottom:24, fontSize:14 }}>Complete an interview session to see your report</p>
        <button className="btn-primary" onClick={()=>navigate('/interview')}>Start Interview</button>
      </div>
    </div>
  );

  const currentMode = INTERVIEW_MODES.find(m=>m.id===config.mode)||INTERVIEW_MODES[0];
  const readinessLevel = report?.readinessLevel||(avgScore>=8?'Excellent':avgScore>=6.5?'Strong Candidate':avgScore>=5?'Interview Ready':avgScore>=3.5?'Needs Preparation':'Not Ready');

  // Score distribution
  const dist = { excellent:scores.filter(s=>s>=8).length, good:scores.filter(s=>s>=6&&s<8).length, fair:scores.filter(s=>s>=4&&s<6).length, poor:scores.filter(s=>s<4).length };

  // Best/worst questions
  const sortedByScore = [...timeline].sort((a,b)=>(b.feedback?.score||0)-(a.feedback?.score||0));
  const best3   = sortedByScore.slice(0,3);
  const worst3  = sortedByScore.slice(-3).reverse();

  // Skills analysis — averaged from each answer's real AI rubric
  // (technical/communication/structure/confidence), not a guessed
  // formula. Falls back to a score-derived estimate only for the
  // rare answer that has no rubric attached (e.g. Code Mode).
  const rubricDims = [
    { key:'technical', label:'Technical' }, { key:'communication', label:'Communication' },
    { key:'structure', label:'Structure' }, { key:'confidence', label:'Confidence' },
  ];
  const skills = {};
  rubricDims.forEach(({key})=>{
    const vals = timeline.map(t=>t.feedback?.rubric?.[key]).filter(v=>v!=null);
    skills[key] = vals.length ? Math.round((vals.reduce((a,b)=>a+b,0)/vals.length)*10) : Math.min(100, Math.round(avgScore*10));
  });

  const totalTime = timeline.reduce((a,t)=>a+(t.timeSpent||0),0);
  const focusStats = lastSession?.focusScore!=null ? lastSession : null;

  // Medal
  const medal = avgScore>=9?'🏆':avgScore>=8?'🥇':avgScore>=7?'🥈':avgScore>=5?'🥉':'💪';

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', paddingTop:80 }}>
      <div style={{ maxWidth:920, margin:'0 auto', padding:'28px 20px 80px' }}>

        {/* ── Hero header ── */}
        <div style={{ background:'linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4c1d95 100%)', borderRadius:22, padding:'32px 36px', marginBottom:28, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.04)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-40, left:-20, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,.03)', pointerEvents:'none' }} />
          <div style={{ position:'relative', display:'flex', alignItems:'center', gap:28, flexWrap:'wrap' }}>
            <ScoreRing score={avgScore} size={140} stroke={12} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,.7)', marginBottom:6, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ padding:'3px 10px', borderRadius:99, background:'rgba(255,255,255,.15)', fontSize:11 }}>{currentMode.label}</span>
                <span style={{ padding:'3px 10px', borderRadius:99, background:'rgba(255,255,255,.15)', fontSize:11 }}>{config.difficulty}</span>
                {config.roleTitle&&<span style={{ padding:'3px 10px', borderRadius:99, background:'rgba(255,255,255,.15)', fontSize:11 }}>{config.roleTitle}</span>}
                {config.adaptive&&<span style={{ padding:'3px 10px', borderRadius:99, background:'rgba(139,92,246,.35)', fontSize:11 }}>⚡ Adaptive</span>}
              </div>
              <h1 style={{ fontSize:28, fontWeight:900, color:'#fff', margin:'0 0 4px', fontFamily:"'Plus Jakarta Sans',sans-serif", display:'flex', alignItems:'center', gap:10 }}>
                {medal} {readinessLevel}
              </h1>
              <p style={{ color:'rgba(255,255,255,.75)', margin:'0 0 18px', fontSize:15, lineHeight:1.6 }}>
                {report?.summary||`You completed ${timeline.length} questions with an average score of ${avgScore.toFixed(1)}/10.`}
              </p>
              <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
                {[
                  { label:'Questions', val:timeline.length },
                  { label:'Avg Score', val:`${avgScore.toFixed(1)}/10` },
                  { label:'Total Time', val:totalTime>0?`${Math.round(totalTime/60)}m`:'-' },
                  { label:'Top Score', val:scores.length?`${Math.max(...scores)}/10`:'-' },
                ].map(s=>(
                  <div key={s.label} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:20, fontWeight:900, color:'#fff', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{s.val}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,.65)', marginTop:1 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={()=>setShowCertificate(true)}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 18px', borderRadius:12, border:'1px solid rgba(255,255,255,.3)', background:'rgba(255,255,255,.12)', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', flexShrink:0 }}>
              <GraduationCap size={15}/> Get Certificate
            </button>
          </div>
        </div>

        {/* ── Peer Percentile + Focus Score ── */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : (focusStats ? '1fr 1fr' : '1fr'), gap:20, marginBottom:22 }}>
          <div className="card" style={{ background:'linear-gradient(135deg,var(--p-bg),var(--p-bg2))', border:'1.5px solid var(--border3)' }}>
            <h3 style={{ fontSize:14, fontWeight:800, color:'var(--p)', margin:'0 0 10px', display:'flex', alignItems:'center', gap:7 }}>
              <Users size={14}/> Peer Benchmark
            </h3>
            {percentile?.percentile!=null ? (
              <>
                <div style={{ fontSize:26, fontWeight:900, color:'var(--p)', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Top {100-percentile.percentile}%</div>
                <p style={{ fontSize:13, color:'var(--t2)', margin:'4px 0 0', lineHeight:1.5 }}>
                  You scored better than <strong>{percentile.percentile}%</strong> of everyone who has practiced {currentMode.label} on CareerForge AI ({percentile.sampleSize} sessions).
                </p>
              </>
            ) : percentile ? (
              <p style={{ fontSize:13, color:'var(--t3)', margin:0 }}>{percentile.message||'Not enough historical sessions yet for a reliable percentile.'}</p>
            ) : (
              <p style={{ fontSize:13, color:'var(--t3)', margin:0 }}>Calculating…</p>
            )}
          </div>

          {focusStats && (
            <div className="card">
              <h3 style={{ fontSize:14, fontWeight:800, color:'var(--text)', margin:'0 0 10px', display:'flex', alignItems:'center', gap:7 }}>
                <ShieldCheck size={14} style={{ color: focusStats.focusScore>=85?'var(--green)':focusStats.focusScore>=60?'var(--amber)':'var(--red)' }}/> Focus & Integrity Score
              </h3>
              <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:8 }}>
                <span style={{ fontSize:26, fontWeight:900, color: focusStats.focusScore>=85?'var(--green)':focusStats.focusScore>=60?'var(--amber)':'var(--red)', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{Math.round(focusStats.focusScore)}</span>
                <span style={{ fontSize:13, color:'var(--t3)' }}>/ 100</span>
              </div>
              <div style={{ display:'flex', gap:14, fontSize:12, color:'var(--t3)' }}>
                <span>🔀 {focusStats.tabSwitches} tab switch{focusStats.tabSwitches===1?'':'es'}</span>
                <span>📋 {focusStats.pasteEvents} paste{focusStats.pasteEvents===1?'':'s'}</span>
                <span>💤 {focusStats.idleEvents} idle gap{focusStats.idleEvents===1?'':'s'}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Row 1: Score dist + bar chart ── */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:20, marginBottom:22 }}>
          {/* Distribution */}
          <div className="card">
            <h3 style={{ fontSize:15, fontWeight:800, color:'var(--text)', margin:'0 0 16px', display:'flex', alignItems:'center', gap:7 }}>
              <Award size={15} style={{ color:'var(--p)' }} /> Score Distribution
            </h3>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:10 }}>
              {[
                { label:'Excellent', range:'8-10', count:dist.excellent, color:'var(--green)', bg:'var(--green-bg)' },
                { label:'Good',      range:'6-7',  count:dist.good,      color:'#f59e0b',     bg:'#fffbeb' },
                { label:'Fair',      range:'4-5',  count:dist.fair,      color:'var(--amber)', bg:'var(--amber-bg)' },
                { label:'Needs Work',range:'0-3',  count:dist.poor,      color:'var(--red)',   bg:'var(--red-bg)' },
              ].map(g=>(
                <div key={g.label} style={{ padding:'12px 10px', background:g.bg, borderRadius:12, textAlign:'center' }}>
                  <div style={{ fontSize:28, fontWeight:900, color:g.color, lineHeight:1, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{g.count}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:g.color, marginTop:3 }}>{g.label}</div>
                  <div style={{ fontSize:10, color:'var(--t3)', marginTop:1 }}>{g.range}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Per Q chart */}
          {scores.length>0&&(
            <div className="card">
              <h3 style={{ fontSize:15, fontWeight:800, color:'var(--text)', margin:'0 0 14px', display:'flex', alignItems:'center', gap:7 }}>
                <BarChart2 size={15} style={{ color:'var(--p)' }} /> Question Scores
              </h3>
              <ScoreBarChart scores={scores} />
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:10, fontSize:11, color:'var(--t3)' }}>
                <span>Min: {Math.min(...scores)}/10</span>
                <span>Avg: {avgScore.toFixed(1)}/10</span>
                <span>Max: {Math.max(...scores)}/10</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Row 2: Skills radar + Compare ── */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:20, marginBottom:22 }}>
          <div className="card">
            <h3 style={{ fontSize:15, fontWeight:800, color:'var(--text)', margin:'0 0 6px', display:'flex', alignItems:'center', gap:7 }}>
              <Zap size={15} style={{ color:'var(--p)' }} /> Skill Rubric
            </h3>
            <p style={{ fontSize:11.5, color:'var(--t3)', margin:'0 0 8px' }}>Averaged from ARIA's per-answer scoring across this session</p>
            <SkillRadarChart size={240} color="#4f46e5" data={rubricDims.map(d=>({ label:d.label, value:skills[d.key] }))} />
          </div>

          <CompareCard sessions={sessionHistory} currentScore={avgScore} mode={config.mode} />
        </div>

        {/* ── Top Strengths & Key Improvements ── */}
        {timeline.length>0&&(
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:20, marginBottom:22 }}>
            <div className="card" style={{ background:'var(--green-bg)', border:'1.5px solid rgba(16,185,129,.2)' }}>
              <h3 style={{ fontSize:14, fontWeight:800, color:'#15803d', margin:'0 0 12px', display:'flex', alignItems:'center', gap:7 }}>
                <ThumbsUp size={14}/> Overall Strengths
              </h3>
              {Array.from(new Set(timeline.flatMap(t=>t.feedback?.strengths||[]).filter(Boolean))).slice(0,5).map((s,i)=>(
                <div key={i} style={{ display:'flex', gap:7, fontSize:13, color:'#166534', marginTop:6, lineHeight:1.5 }}>
                  <span style={{ flexShrink:0 }}>✓</span><span>{s}</span>
                </div>
              ))}
            </div>
            <div className="card" style={{ background:'var(--amber-bg)', border:'1.5px solid rgba(245,158,11,.2)' }}>
              <h3 style={{ fontSize:14, fontWeight:800, color:'#92400e', margin:'0 0 12px', display:'flex', alignItems:'center', gap:7 }}>
                <TrendingUp size={14}/> Key Improvements
              </h3>
              {Array.from(new Set(timeline.flatMap(t=>t.feedback?.improvements||[]).filter(Boolean))).slice(0,5).map((s,i)=>(
                <div key={i} style={{ display:'flex', gap:7, fontSize:13, color:'#78350f', marginTop:6, lineHeight:1.5 }}>
                  <span style={{ flexShrink:0 }}>→</span><span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Best & Worst ── */}
        {timeline.length>=3&&(
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:20, marginBottom:22 }}>
            <div className="card">
              <h3 style={{ fontSize:14, fontWeight:800, color:'var(--text)', margin:'0 0 12px', display:'flex', alignItems:'center', gap:7 }}>
                <Star size={14} style={{ color:'var(--green)' }} /> Best Answers
              </h3>
              {best3.map((item,i)=>(
                <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'8px 0', borderBottom:i<2?'1px solid var(--border)':'none' }}>
                  <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:800, background:'var(--green-bg)', color:'var(--green)', flexShrink:0 }}>{item.feedback?.score}/10</span>
                  <p style={{ fontSize:12, color:'var(--t2)', margin:0, lineHeight:1.4, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{item.question}</p>
                </div>
              ))}
            </div>
            <div className="card">
              <h3 style={{ fontSize:14, fontWeight:800, color:'var(--text)', margin:'0 0 12px', display:'flex', alignItems:'center', gap:7 }}>
                <AlertCircle size={14} style={{ color:'var(--amber)' }} /> Needs Practice
              </h3>
              {worst3.map((item,i)=>(
                <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'8px 0', borderBottom:i<2?'1px solid var(--border)':'none' }}>
                  <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:800, background:'var(--amber-bg)', color:'var(--amber)', flexShrink:0 }}>{item.feedback?.score}/10</span>
                  <p style={{ fontSize:12, color:'var(--t2)', margin:0, lineHeight:1.4, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{item.question}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Action Plan ── */}
        {report?.actionPlan?.length>0&&(
          <div className="card" style={{ marginBottom:22, background:'linear-gradient(135deg,var(--p-bg) 0%,var(--p-bg2) 100%)', border:'1.5px solid var(--border3)' }}>
            <h3 style={{ fontSize:15, fontWeight:800, color:'var(--p)', margin:'0 0 14px', display:'flex', alignItems:'center', gap:7 }}>
              <Target size={15}/> Your Action Plan
            </h3>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:8 }}>
              {report.actionPlan.map((a,i)=>(
                <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'8px 10px', background:'var(--surf)', borderRadius:10, border:'1px solid var(--border)' }}>
                  <span style={{ width:22, height:22, borderRadius:6, background:'var(--p)', color:'#fff', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</span>
                  <span style={{ fontSize:13, color:'var(--t2)', lineHeight:1.5 }}>{a}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Full Q breakdown ── */}
        {timeline.length>0&&(
          <div style={{ marginBottom:28 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h3 style={{ fontSize:16, fontWeight:800, color:'var(--text)', margin:0, display:'flex', alignItems:'center', gap:8 }}>
                <CheckCircle size={16} style={{ color:'var(--p)' }} /> Question Breakdown
              </h3>
              <button className="btn-ghost" style={{ fontSize:12, gap:5 }} onClick={()=>setExpandAll(e=>!e)}>
                {expandAll?<><ChevronUp size={13}/>Collapse All</>:<><ChevronDown size={13}/>Expand All</>}
              </button>
            </div>
            {timeline.map((item,i)=>(
              <QuestionItem key={i} item={item} idx={i} defaultOpen={expandAll||(scores.length>0&&scores[i]<5)} />
            ))}
          </div>
        )}

        {/* ── Share / Export ── */}
        <div className="card" style={{ marginBottom:16, background:'var(--surf2)', border:'1px solid var(--border)' }}>
          <h3 style={{ fontSize:14, fontWeight:800, color:'var(--text)', margin:'0 0 12px', display:'flex', alignItems:'center', gap:7 }}>
            📤 Share & Export
          </h3>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button onClick={()=>{
              const text = `🎯 CareerForge AI Interview Report\n\nRole: ${config.roleTitle||'General'} | Mode: ${currentMode.label}\nScore: ${avgScore.toFixed(1)}/10 (${readinessLevel})\nQuestions: ${timeline.length}${percentile?.percentile!=null?`\nPercentile: Top ${100-percentile.percentile}%`:''}\n\nPreparing smarter with CareerForge AI. #CareerForgeAI #InterviewPrep`;
              navigator.clipboard.writeText(text);
            }}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10, border:'1px solid var(--border2)', background:'var(--surf)', cursor:'pointer', fontSize:13, fontWeight:600, color:'var(--t2)', transition:'all .15s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--p3)';e.currentTarget.style.color='var(--p)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.color='var(--t2)';}}>
              📋 Copy Summary
            </button>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=https://anthropic.com&summary=${encodeURIComponent(`I scored ${avgScore.toFixed(1)}/10 in a ${currentMode.label} interview on CareerForge AI! Readiness: ${careerPath?.readinessPercent||0}% for ${config.roleTitle||'tech'} roles. #CareerForgeAI`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10, border:'1px solid #0077b5', background:'#eff8ff', cursor:'pointer', fontSize:13, fontWeight:600, color:'#0077b5', textDecoration:'none', transition:'all .15s' }}>
              🔗 Share on LinkedIn
            </a>
            <button onClick={()=>window.print()}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10, border:'1px solid var(--border2)', background:'var(--surf)', cursor:'pointer', fontSize:13, fontWeight:600, color:'var(--t2)', transition:'all .15s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--p3)';e.currentTarget.style.color='var(--p)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.color='var(--t2)';}}>
              🖨️ Print / PDF
            </button>
            <button onClick={()=>setShowCertificate(true)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10, border:'1px solid rgba(201,154,58,.4)', background:'#fdf9ef', cursor:'pointer', fontSize:13, fontWeight:600, color:'#92710f', transition:'all .15s' }}>
              🎓 Get Certificate
            </button>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="card" style={{ background:'var(--surf2)', border:'1px solid var(--border)' }}>
          <div style={{ textAlign:'center', marginBottom:18 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--t3)' }}>What's next?</div>
          </div>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button className="btn-outline" onClick={()=>navigate('/dashboard')} style={{ gap:7, fontSize:14 }}>
              <Home size={15}/> Dashboard
            </button>
            <button className="btn-outline" onClick={()=>navigate('/learn')} style={{ gap:7, fontSize:14 }}>
              <BookOpen size={15}/> Study Weak Topics
            </button>
            <button className="btn-primary" onClick={()=>{ resetSession(); navigate('/interview'); }} style={{ gap:7, fontSize:14 }}>
              <RefreshCw size={15}/> Practice Again
            </button>
          </div>
        </div>
      </div>

      {showCertificate && (
        <CertificateModal
          name={user?.name || 'Candidate'}
          roleTitle={config.roleTitle || 'Software Engineer'}
          score={`${avgScore.toFixed(1)}/10`}
          kind="Interview Readiness"
          onClose={()=>setShowCertificate(false)}
        />
      )}
    </div>
  );
}
