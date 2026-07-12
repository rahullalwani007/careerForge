import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { TARGET_ROLES, EXPERIENCE_LEVELS, BADGES } from '../services/mockData';
import { careerPathApi } from '../services/api';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { Target, RefreshCw, CheckCircle, Circle, ChevronDown, ChevronUp,
         TrendingUp, Award, Briefcase, Clock, DollarSign, Building2, Loader, Edit3, Star } from 'lucide-react';

function PhaseCard({ phase, idx, phaseKey, onToggle, done }) {
  const [expanded, setExpanded] = useState(idx === 0);
  return (
    <div style={{ marginBottom: 0 }}>
      <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
        {/* Timeline line */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
          <button onClick={()=>onToggle(phaseKey, !done)}
            style={{ width:32, height:32, borderRadius:'50%', background:done?'var(--green)':'var(--surf)', border:`2px solid ${done?'var(--green)':'var(--border2)'}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .2s', flexShrink:0 }}>
            {done?<CheckCircle size={16} style={{color:'#fff'}}/>:<Circle size={16} style={{color:'var(--t3)'}}/>}
          </button>
          <div style={{ width:2, flexGrow:1, minHeight:40, background:done?'var(--green)':'var(--border)', margin:'4px 0' }} />
        </div>
        {/* Content */}
        <div style={{ flex:1, paddingBottom:20 }}>
          <div onClick={()=>setExpanded(e=>!e)}
            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', padding:'6px 0', marginBottom:expanded?8:0 }}>
            <div>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.5px' }}>Phase {idx+1}</span>
              <h3 style={{ fontSize:15, fontWeight:800, color:done?'var(--green)':'var(--text)', margin:'2px 0 0' }}>{phase.title}</h3>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {phase.duration && <span style={{ fontSize:12, color:'var(--t3)', display:'flex', alignItems:'center', gap:4 }}><Clock size={12}/>{phase.duration}</span>}
              <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:800, background:done?'var(--green-bg)':'var(--surf3)', color:done?'var(--green)':'var(--t3)' }}>{done?'Done':'Pending'}</span>
              {expanded?<ChevronUp size={14} style={{color:'var(--t3)'}}/>:<ChevronDown size={14} style={{color:'var(--t3)'}}/>}
            </div>
          </div>
          {expanded && (
            <div style={{ animation:'fadeIn .2s ease' }}>
              {phase.description && <p style={{ fontSize:13, color:'var(--t2)', lineHeight:1.6, margin:'0 0 10px' }}>{phase.description}</p>}
              {(phase.topics||phase.skills||[]).length>0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                  {(phase.topics||phase.skills).map(t=>(
                    <span key={t} className="pill pill-p" style={{ fontSize:11 }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CareerPathPage() {
  const navigate = useNavigate();
  const { careerPath, config, generateCareerPath, updateConfig, addToast, unlockedBadges } = useApp();
  const { isMobile } = useBreakpoint();
  const [regenerating, setRegenerating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newRole, setNewRole] = useState(config.roleId || '');
  const [newLevel, setNewLevel] = useState('');
  const [progress, setProgress] = useState({});
  const [oldReadiness, setOldReadiness] = useState(careerPath?.readinessPercent || 0);

  useEffect(() => {
    careerPathApi.getProgress().then(r => setProgress(r.progress)).catch(() => {});
  }, []);

  if (!careerPath) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', paddingTop:80, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', padding:32 }}>
        <div style={{ fontSize:56, marginBottom:16 }}>🗺️</div>
        <h2 style={{ fontSize:22, fontWeight:800, color:'var(--text)', margin:'0 0 10px' }}>No Career Path Yet</h2>
        <p style={{ color:'var(--t3)', marginBottom:24 }}>Complete onboarding to generate your personalized career path.</p>
        <button className="btn-primary" onClick={()=>navigate('/onboarding')}>Start Onboarding</button>
      </div>
    </div>
  );

  const roadmap = (careerPath.learningRoadmap || []).slice(0, 6).map((step, i) => ({
    title: typeof step==='string'?step:(step.title||step.phase||`Phase ${i+1}`),
    description: typeof step==='object'?(step.description||step.desc||''):'',
    topics: typeof step==='object'?(step.topics||step.skills||[]):[],
    duration: typeof step==='object'?step.duration:'',
  }));

  const doneCount = roadmap.filter((_,i)=>progress[`phase_${i}`]).length;
  const progressPct = roadmap.length ? Math.round((doneCount/roadmap.length)*100) : 0;

  function handleTogglePhase(key, done) {
    setProgress(p=>({...p,[key]:done}));
    careerPathApi.setProgress(key, done).catch(() => {});
  }

  async function handleRegenerate() {
    if (!newRole) { addToast('Select a role first','error'); return; }
    setOldReadiness(careerPath.readinessPercent || 0);
    setRegenerating(true);
    try {
      const role = TARGET_ROLES.find(r=>r.id===newRole);
      const roleTitle = role?.title || newRole;
      const level = newLevel || 'fresher';
      const path = await generateCareerPath({ targetRole:roleTitle, roleId:newRole, currentLevel:level, skills:[] });
      updateConfig({ roleId:newRole, roleTitle });
      setEditMode(false);
      const diff = (path.readinessPercent||0) - oldReadiness;
      addToast(`Career path updated! Readiness: ${path.readinessPercent}% (${diff>=0?'+':''}${diff}%)`, 'success');
    } catch { addToast('Failed to regenerate. Try again.','error'); }
    finally { setRegenerating(false); }
  }

  const cp = careerPath;
  const roleTitleDisplay = TARGET_ROLES.find(r=>r.id===cp.roleId||r.title===cp.targetRole)?.title || cp.targetRole;

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', paddingTop:80 }}>
      <div style={{ maxWidth:1040, margin:'0 auto', padding:'28px 20px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom:28, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
          <div>
            <h1 style={{ fontSize:26, fontWeight:900, color:'var(--text)', margin:'0 0 4px', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              🗺️ Career Path
            </h1>
            <p style={{ color:'var(--t3)', margin:0, fontSize:14 }}>{roleTitleDisplay} · Personalized learning roadmap</p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>setEditMode(e=>!e)} className="btn-outline" style={{ gap:6, fontSize:13 }}>
              <Edit3 size={13} /> {editMode?'Cancel':'Regenerate Path'}
            </button>
            <button onClick={()=>navigate('/interview')} className="btn-primary" style={{ gap:6, fontSize:13 }}>
              <Target size={13} /> Start Interview
            </button>
          </div>
        </div>

        {/* Regenerate panel */}
        {editMode && (
          <div className="card" style={{ marginBottom:24, border:'1.5px solid var(--border3)', background:'var(--p-bg)' }}>
            <h3 style={{ fontSize:15, fontWeight:800, color:'var(--p)', margin:'0 0 14px', display:'flex', alignItems:'center', gap:7 }}>
              <RefreshCw size={15} /> Regenerate Career Path
            </h3>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--t3)', marginBottom:6, textTransform:'uppercase' }}>Target Role</label>
                <select className="input" value={newRole} onChange={e=>setNewRole(e.target.value)}>
                  <option value="">— Select —</option>
                  {TARGET_ROLES.map(r=><option key={r.id} value={r.id}>{r.icon} {r.title}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--t3)', marginBottom:6, textTransform:'uppercase' }}>Experience Level</label>
                <select className="input" value={newLevel} onChange={e=>setNewLevel(e.target.value)}>
                  <option value="">— Select —</option>
                  {EXPERIENCE_LEVELS.map(l=><option key={l.id} value={l.id}>{l.icon} {l.label}</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleRegenerate} disabled={regenerating||!newRole} className="btn-primary" style={{ gap:7 }}>
              {regenerating?<><Loader size={14} className="spin-anim"/>Generating…</>:<><RefreshCw size={14}/>Generate New Path</>}
            </button>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:28 }}>
          {[
            { icon:Target,   label:'Readiness',  val:`${cp.readinessPercent||0}%`,     color:'var(--p)' },
            { icon:Clock,    label:'Timeline',   val:cp.estimatedTimeline||'3-6 mo',   color:'var(--blue)' },
            { icon:DollarSign,label:'Salary',    val:cp.salaryRange||'Market rate',    color:'var(--green)' },
            { icon:TrendingUp,label:'Roadmap',   val:`${doneCount}/${roadmap.length} done`, color:'var(--amber)' },
          ].map(s=>(
            <div key={s.label} className="stat-card">
              <div style={{ width:44, height:44, borderRadius:12, background:`${s.color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <s.icon size={20} style={{ color:s.color }} />
              </div>
              <div>
                <div style={{ fontSize:18, fontWeight:900, color:'var(--text)', lineHeight:1, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{s.val}</div>
                <div style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Readiness bar */}
        <div className="card" style={{ marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>Overall Readiness</span>
            <span style={{ fontSize:24, fontWeight:900, color:'var(--p)', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{cp.readinessPercent||0}%</span>
          </div>
          <div className="progress-track" style={{ height:12 }}>
            <div className="progress-fill" style={{ width:`${cp.readinessPercent||0}%`, background:'linear-gradient(90deg,var(--p),#818cf8)' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'2px 12px', marginTop:8, fontSize:12, color:'var(--t3)' }}>
            <span>Roadmap progress: {progressPct}%</span>
            <span>{cp.nextStep||'Keep practicing!'}</span>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:24, alignItems:'start' }}>

          {/* Roadmap */}
          <div>
            <div className="card">
              <h2 style={{ fontSize:16, fontWeight:800, color:'var(--text)', margin:'0 0 20px', display:'flex', alignItems:'center', gap:8 }}>
                <TrendingUp size={16} style={{ color:'var(--p)' }} /> Learning Roadmap
                <span style={{ fontSize:11, color:'var(--t3)', fontWeight:600, marginLeft:'auto' }}>Click circle to mark done</span>
              </h2>
              {roadmap.length>0 ? roadmap.map((phase, i)=>(
                <PhaseCard key={i} phase={phase} idx={i} phaseKey={`phase_${i}`}
                  onToggle={handleTogglePhase} done={!!progress[`phase_${i}`]} />
              )) : (
                <p style={{ color:'var(--t3)', fontSize:13 }}>No roadmap data. Try regenerating.</p>
              )}
            </div>
          </div>

          {/* Right: Skills + Companies */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* Skill gaps */}
            <div className="card">
              <h3 style={{ fontSize:15, fontWeight:800, color:'var(--text)', margin:'0 0 14px', display:'flex', alignItems:'center', gap:7 }}>
                🎯 Focus Areas
              </h3>
              {(cp.skillGaps||[]).slice(0,5).map((s,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'var(--red)', flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{s}</span>
                      <span style={{ fontSize:11, color:'var(--red)' }}>Gap</span>
                    </div>
                    <div style={{ height:5, background:'var(--border)', borderRadius:99, overflow:'hidden' }}>
                      <div style={{ width:`${30+i*10}%`, height:'100%', background:'var(--red)', borderRadius:99, opacity:.6 }} />
                    </div>
                  </div>
                </div>
              ))}
              {(cp.skillsYouHave||[]).slice(0,4).map((s,i)=>(
                <div key={`have_${i}`} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'var(--green)', flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{s}</span>
                      <span style={{ fontSize:11, color:'var(--green)' }}>Strong</span>
                    </div>
                    <div style={{ height:5, background:'var(--border)', borderRadius:99, overflow:'hidden' }}>
                      <div style={{ width:`${70+i*5}%`, height:'100%', background:'var(--green)', borderRadius:99 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top companies */}
            {(cp.topCompanies||[]).length>0 && (
              <div className="card">
                <h3 style={{ fontSize:15, fontWeight:800, color:'var(--text)', margin:'0 0 14px', display:'flex', alignItems:'center', gap:7 }}>
                  <Building2 size={15} style={{ color:'var(--p)' }} /> Target Companies
                </h3>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {cp.topCompanies.map(c=>(
                    <span key={c} style={{ padding:'6px 12px', borderRadius:10, background:'var(--surf2)', border:'1px solid var(--border)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{c}</span>
                  ))}
                </div>
                <div style={{ marginTop:14, padding:'10px 12px', background:'var(--p-bg)', borderRadius:10, border:'1px solid var(--border3)', fontSize:13, color:'var(--p)', fontWeight:600 }}>
                  💰 Target Salary: {cp.salaryRange}
                </div>
              </div>
            )}

            {/* Badges */}
            <div className="card">
              <h3 style={{ fontSize:15, fontWeight:800, color:'var(--text)', margin:'0 0 14px', display:'flex', alignItems:'center', gap:7 }}>
                <Award size={15} style={{ color:'var(--amber)' }} /> Achievements
              </h3>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:8 }}>
                {BADGES.map(b=>{
                  const isUnlocked = unlockedBadges.includes(b.id);
                  return (
                    <div key={b.id} title={`${b.name}: ${b.desc}`}
                      style={{ textAlign:'center', padding:'10px 4px', borderRadius:12, background:isUnlocked?`${b.color}12`:'var(--surf2)', border:`1px solid ${isUnlocked?b.color:'var(--border)'}`, opacity:isUnlocked?1:.5, transition:'all .2s', cursor:'default', position:'relative' }}>
                      <div style={{ fontSize:22 }}>{b.emoji}</div>
                      <div style={{ fontSize:9, fontWeight:700, color:isUnlocked?b.color:'var(--t3)', marginTop:3, lineHeight:1.2 }}>{b.name}</div>
                      {!isUnlocked && <div style={{ position:'absolute', inset:0, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,.04)' }}><span style={{ fontSize:12 }}>🔒</span></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
