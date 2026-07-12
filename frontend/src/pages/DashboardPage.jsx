import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { INTERVIEW_MODES, TARGET_ROLES, DAILY_INSIGHTS } from '../services/mockData';
import { getTodayGoal, setTodayGoalDone } from '../services/storage';
import { calculateStreak, getLongestStreak, hasDoneSessionToday } from '../utils/sessionStats';
import { leaderboardApi } from '../services/api';
import { BarChart2, BookOpen, Briefcase, User, Zap, Target, TrendingUp,
         Clock, Award, ChevronRight, ArrowRight, Star, CheckCircle, Play, Layers,
         Flame, Calendar, Lightbulb, FileText, ListChecks, Trophy, Building2, Users2 } from 'lucide-react';
import ActivityHeatmap from '../components/ActivityHeatmap';
import { useBreakpoint } from '../hooks/useBreakpoint';

function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <div className="stat-card" style={{ flexDirection:'column', alignItems:'flex-start', gap:10, padding:'20px 22px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', width:'100%' }}>
        <div style={{ width:44, height:44, borderRadius:12, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon size={22} style={{ color }} />
        </div>
        {trend != null && (
          <div style={{ fontSize:11, fontWeight:700, color:trend>0?'var(--green)':trend<0?'var(--red)':'var(--t3)', background:trend>0?'var(--green-bg)':trend<0?'var(--red-bg)':'var(--surf3)', padding:'2px 7px', borderRadius:99 }}>
            {trend>0?`+${trend}`:`${trend}`}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize:28, fontWeight:900, color:'var(--text)', lineHeight:1, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{value}</div>
        <div style={{ fontSize:12, color:'var(--t3)', marginTop:4, fontWeight:500 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:'var(--t4)', marginTop:1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function ModeCard({ mode, bestScore, onStart }) {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onClick={()=>onStart(mode)}
      style={{ background:hover?mode.color:'var(--surf)', border:`1.5px solid ${hover?'transparent':'var(--border)'}`, borderRadius:16, padding:'16px', cursor:'pointer', transition:'all .25s', boxShadow:hover?`0 8px 28px ${mode.color}40`:'var(--shadow-sm)', position:'relative', overflow:'hidden' }}>
      {hover && <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,.1)', pointerEvents:'none' }} />}
      <div style={{ position:'relative' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
          <span style={{ fontSize:24 }}>{mode.icon}</span>
          <span style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:20, background:hover?'rgba(255,255,255,.2)':'var(--surf3)', color:hover?'#fff':'var(--t3)', letterSpacing:'.5px', textTransform:'uppercase' }}>{mode.badge}</span>
        </div>
        <div style={{ fontWeight:800, fontSize:14, color:hover?'#fff':'var(--text)', marginBottom:3 }}>{mode.label}</div>
        <div style={{ fontSize:11, color:hover?'rgba(255,255,255,.8)':'var(--t3)', lineHeight:1.4 }}>{mode.sub}</div>
        <div style={{ marginTop:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          {bestScore!=null?(<div style={{ display:'flex', alignItems:'center', gap:4 }}><Star size={10} style={{ color:hover?'#fff':'#f59e0b', fill:hover?'#fff':'#f59e0b' }}/><span style={{ fontSize:11, fontWeight:700, color:hover?'#fff':'var(--text)' }}>{bestScore}/10</span></div>):(<span style={{ fontSize:10, color:hover?'rgba(255,255,255,.7)':'var(--t4)' }}>Not tried</span>)}
          <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:11, fontWeight:800, color:hover?'#fff':mode.color }}>
            <Play size={9} fill="currentColor"/>Start
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, careerPath, config, updateConfig, sessionHistory, activityLog } = useApp();
  const { isMobile, isTablet } = useBreakpoint();
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [todayGoal, setTodayGoal] = useState(null);
  const [activeTab, setActiveTab] = useState('roadmap');
  const [leaderboard, setLeaderboard] = useState(null);

  const sessions = sessionHistory.slice(0, 20);

  useEffect(() => {
    setStreak(calculateStreak(activityLog));
    setLongestStreak(getLongestStreak(activityLog));
    const g = getTodayGoal();
    if (activityLog.length > 0 && hasDoneSessionToday(activityLog)) { setTodayGoalDone(true); g.done = true; }
    setTodayGoal(g);
  }, [activityLog]);

  useEffect(() => {
    leaderboardApi.get().then(setLeaderboard).catch(() => {});
  }, []);

  const cp = careerPath;
  const displayRole = TARGET_ROLES.find(r=>r.id===cp?.roleId||r.title===cp?.targetRole)?.title || cp?.targetRole || '';
  const totalSessions = sessions.length;
  const avgScore = sessions.length?(sessions.reduce((s,r)=>s+(r.averageScore||0),0)/sessions.length).toFixed(1):'—';
  const bestByMode = {};
  sessions.forEach(s=>{if(!bestByMode[s.mode]||s.averageScore>bestByMode[s.mode])bestByMode[s.mode]=s.averageScore;});

  const displayName = user?.name?.split(' ')[0]||user?.email?.split('@')[0]||'there';
  const hour = new Date().getHours();
  const greeting = hour<12?'morning':hour<17?'afternoon':'evening';
  const todayInsight = DAILY_INSIGHTS[new Date().getDate()%DAILY_INSIGHTS.length];

  function handleStartMode(mode) { updateConfig({mode:mode.id}); navigate('/interview'); }

  const roadmap = (cp?.learningRoadmap||[]).slice(0,5).map((step,i)=>({
    title:typeof step==='string'?step:(step.title||step.phase||`Phase ${i+1}`),
    desc:typeof step==='object'?(step.description||step.desc||''):'',
    skills:typeof step==='object'?(step.topics||step.skills||[]):[],
    done:i<Math.floor((cp?.readinessPercent||0)/25),
    active:i===Math.floor((cp?.readinessPercent||0)/25),
  }));

  const topics = (cp?.recommendedTopics||[]).map(t=>typeof t==='string'?t:(t.topic||t.title||'')).filter(Boolean);
  const readiness = cp?.readinessPercent||0;

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', paddingTop:80 }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding: isMobile ? '20px 14px 40px' : '32px 20px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom:24, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 21 : 28, fontWeight:900, color:'var(--text)', margin:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              Good {greeting}, {displayName} 👋
            </h1>
            <p style={{ color:'var(--t3)', margin:'5px 0 0', fontSize:14 }}>
              {cp?`${displayRole} · ${readiness}% ready`:'Complete onboarding to get your personalized plan'}
            </p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn-outline" onClick={()=>navigate('/profile')} style={{ fontSize:13, padding:'8px 14px', gap:6 }}><User size={14}/>Profile</button>
            <button className="btn-primary" onClick={()=>navigate('/interview')} style={{ fontSize:13, padding:'8px 18px', gap:6 }}><Play size={13} fill="white"/>Start Interview</button>
          </div>
        </div>

        {/* Placement Drive — flagship feature */}
        <div onClick={()=>navigate('/placement-drive')} style={{ marginBottom:22, padding:'22px 26px', borderRadius:18, background:'linear-gradient(120deg,#0f172a 0%,#1e1b4b 50%,#312e81 100%)', position:'relative', overflow:'hidden', cursor:'pointer', transition:'transform .2s' }}
          onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
          <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,.05)' }}/>
          <div style={{ position:'relative', display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
            <div style={{ width:52, height:52, borderRadius:14, background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Building2 size={26} color="#fff"/>
            </div>
            <div style={{ flex:1, minWidth:220 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                <span style={{ fontSize:16, fontWeight:900, color:'#fff', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Placement Drive Simulator</span>
                <span style={{ fontSize:10, fontWeight:800, color:'#1e1b4b', background:'#c99a3a', padding:'2px 8px', borderRadius:99 }}>NEW</span>
              </div>
              <p style={{ fontSize:12.5, color:'rgba(255,255,255,.75)', margin:0 }}>The full journey — Aptitude → Group Discussion → Technical → HR — with a real Selected / Waitlisted / Not Selected outcome. Not just another Q&A round.</p>
            </div>
            <button className="btn-primary" style={{ background:'#fff', color:'#1e1b4b', fontSize:13, padding:'9px 18px', gap:6, flexShrink:0 }}>
              Start a Drive <ArrowRight size={13}/>
            </button>
          </div>
        </div>

        {/* Daily insight */}
        <div style={{ marginBottom:22, padding:'13px 18px', borderRadius:14, background:'linear-gradient(135deg,var(--p-bg),var(--p-bg2))', border:'1px solid var(--border3)', display:'flex', alignItems:'flex-start', gap:12 }}>
          <Lightbulb size={16} style={{ color:'var(--p)', flexShrink:0, marginTop:1 }} />
          <div>
            <span style={{ fontSize:11, fontWeight:800, color:'var(--p)', textTransform:'uppercase', letterSpacing:'.5px' }}>Daily Insight</span>
            <p style={{ fontSize:13, color:'var(--t2)', margin:'3px 0 0', lineHeight:1.6 }}>{todayInsight}</p>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 14, marginBottom:24 }}>
          <StatCard icon={Zap}      label="Sessions"    value={totalSessions}                       color="#4f46e5" />
          <StatCard icon={BarChart2} label="Avg Score"  value={avgScore==='—'?'—':`${avgScore}/10`} color="#10b981" />
          <StatCard icon={Flame}    label="Streak"      value={`${streak}d`} sub={`Best: ${longestStreak}d`} color="#f59e0b" />
          <StatCard icon={Target}   label="Readiness"   value={`${readiness}%`} sub={displayRole||'Set goal'} color="#3b82f6" />
        </div>

        {/* Main grid */}
        <div style={{ display:'grid', gridTemplateColumns: (isMobile || isTablet) ? '1fr' : '1fr 340px', gap: isMobile ? 16 : 22 }}>

          {/* LEFT MAIN */}
          <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

            {/* Activity heatmap + today's goal */}
            <div className="card">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <h2 style={{ fontSize:15, fontWeight:800, color:'var(--text)', margin:0, display:'flex', alignItems:'center', gap:7 }}>
                  <Calendar size={15} style={{ color:'var(--p)' }}/> Activity
                </h2>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:12, color:'var(--t3)' }}>🔥 {streak} day streak</span>
                  {longestStreak>0 && <span style={{ fontSize:11, color:'var(--amber)', fontWeight:700, background:'var(--amber-bg)', padding:'2px 7px', borderRadius:99 }}>Best: {longestStreak}d</span>}
                </div>
              </div>
              <ActivityHeatmap sessions={activityLog} />

              {/* Today's goal */}
              {todayGoal && (
                <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:todayGoal.done?'var(--green-bg)':'var(--surf2)', borderRadius:12, border:`1px solid ${todayGoal.done?'rgba(16,185,129,.2)':'var(--border)'}` }}>
                  <button onClick={()=>{ const done=!todayGoal.done; setTodayGoalDone(done); setTodayGoal(g=>({...g,done})); }}
                    style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', flexShrink:0 }}>
                    {todayGoal.done?<CheckCircle size={20} style={{ color:'var(--green)' }}/>:<div style={{ width:20, height:20, borderRadius:'50%', border:'2px solid var(--border2)', flexShrink:0 }} />}
                  </button>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:todayGoal.done?'var(--green)':'var(--text)' }}>{todayGoal.text}</div>
                    <div style={{ fontSize:11, color:'var(--t3)', marginTop:1 }}>Today's goal · {todayGoal.done?'✅ Completed!':'Not done yet'}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Career Path + Practice modes */}
            {cp && (
              <div className="card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <h2 style={{ fontSize:15, fontWeight:800, color:'var(--text)', margin:0, display:'flex', alignItems:'center', gap:7 }}>
                    <Target size={15} style={{ color:'var(--p)' }}/> Career Path
                  </h2>
                  <div style={{ display:'flex', gap:8 }}>
                    <span className="pill pill-p">{displayRole}</span>
                    <button onClick={()=>navigate('/career-path')} style={{ fontSize:11, fontWeight:700, color:'var(--p)', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>Full View <ArrowRight size={11}/></button>
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.5px' }}>Readiness</span>
                    <span style={{ fontSize:22, fontWeight:900, color:'var(--p)', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{readiness}%</span>
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{ width:`${readiness}%`, background:'linear-gradient(90deg,var(--p),#818cf8)' }}/></div>
                  <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'2px 12px', marginTop:6, fontSize:11, color:'var(--t3)' }}>
                    <span>⏱ {cp.estimatedTimeline}</span><span>💰 {cp.salaryRange}</span>
                  </div>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                  {(cp.skillGaps||[]).slice(0,4).map(s=><span key={s} style={{ padding:'3px 9px', borderRadius:99, fontSize:10, fontWeight:600, background:'var(--red-bg)', color:'var(--red)', border:'1px solid rgba(239,68,68,.15)' }}>{s}</span>)}
                </div>
              </div>
            )}

            {/* Practice modes */}
            <div className="card">
              <h2 style={{ fontSize:15, fontWeight:800, color:'var(--text)', margin:'0 0 14px', display:'flex', alignItems:'center', gap:7 }}>
                <Layers size={15} style={{ color:'var(--p)' }}/> Practice Modes
              </h2>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap:10 }}>
                {INTERVIEW_MODES.map(mode=><ModeCard key={mode.id} mode={mode} bestScore={bestByMode[mode.id]} onStart={handleStartMode}/>)}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

            {/* Tabbed panel */}
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ display:'flex', borderBottom:'1px solid var(--border)' }}>
                {[
                  { id:'roadmap', label:'Roadmap' },
                  { id:'sessions', label:'Recent' },
                  { id:'topics', label:'Topics' },
                ].map(t=>(
                  <button key={t.id} onClick={()=>setActiveTab(t.id)}
                    style={{ flex:1, padding:'11px 8px', border:'none', background:'none', cursor:'pointer', fontSize:12, fontWeight:700, color:activeTab===t.id?'var(--p)':'var(--t3)', borderBottom:`2px solid ${activeTab===t.id?'var(--p)':'transparent'}`, transition:'all .15s' }}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{ padding:'14px' }}>
                {activeTab==='roadmap' && (
                  cp&&roadmap.length>0?roadmap.map((step,i)=>(
                    <div key={i} style={{ display:'flex', gap:10, marginBottom:12 }}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                        <div style={{ width:26, height:26, borderRadius:'50%', background:step.done?'var(--p)':step.active?'var(--p-bg)':'var(--surf3)', border:`2px solid ${step.done?'var(--p)':step.active?'var(--p)':'var(--border)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:step.done?'#fff':step.active?'var(--p)':'var(--t3)', flexShrink:0 }}>
                          {step.done?'✓':i+1}
                        </div>
                        {i<roadmap.length-1&&<div style={{ width:2, height:24, background:step.done?'var(--p)':'var(--border)', margin:'2px 0' }}/>}
                      </div>
                      <div style={{ paddingBottom:4 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:step.active?'var(--p)':step.done?'var(--t2)':'var(--t3)', lineHeight:1.3 }}>{step.title}</div>
                        {step.desc&&<div style={{ fontSize:11, color:'var(--t3)', marginTop:2, lineHeight:1.4 }}>{step.desc.substring(0,60)}{step.desc.length>60?'…':''}</div>}
                      </div>
                    </div>
                  )):<p style={{ fontSize:13, color:'var(--t3)', textAlign:'center', padding:'12px 0' }}>No roadmap yet. Complete onboarding.</p>
                )}

                {activeTab==='sessions' && (
                  sessions.length===0?<p style={{ fontSize:13, color:'var(--t3)', textAlign:'center', padding:'12px 0' }}>No sessions yet.</p>:
                  sessions.slice(0,6).map((s,i)=>{
                    const mode=INTERVIEW_MODES.find(m=>m.id===s.mode)||INTERVIEW_MODES[0];
                    const score=s.averageScore||0;
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:i<5?'1px solid var(--border)':'none' }}>
                        <span style={{ fontSize:18 }}>{mode.icon}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.role||mode.label}</div>
                          <div style={{ fontSize:10, color:'var(--t3)' }}>{mode.label}</div>
                        </div>
                        <div style={{ fontSize:14, fontWeight:900, color:score>=7.5?'var(--green)':score>=5?'var(--amber)':'var(--red)', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{score.toFixed(1)}</div>
                      </div>
                    );
                  })
                )}

                {activeTab==='topics' && (
                  topics.length===0?<p style={{ fontSize:13, color:'var(--t3)', textAlign:'center', padding:'12px 0' }}>No topics. Complete onboarding.</p>:
                  <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                    {topics.slice(0,12).map((topic,i)=>(
                      <button key={i} onClick={()=>navigate('/learn')} className="pill pill-p" style={{ cursor:'pointer', fontSize:11 }}>{topic}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h2 style={{ fontSize:15, fontWeight:800, color:'var(--text)', margin:'0 0 12px', display:'flex', alignItems:'center', gap:7 }}>
                <Zap size={15} style={{ color:'var(--p)' }}/> Quick Actions
              </h2>
              {[
                { icon:ListChecks, label:'Skill Assessment', sub:'Multi-category test + radar', color:'#14b8a6', to:'/skill-assessment' },
                { icon:Users2,  label:'Group Discussion', sub:'4 AI participants, real debate', color:'#8b5cf6', to:'/group-discussion' },
                { icon:FileText,  label:'My Notes',       sub:'Create & organize notes',  color:'#ec4899', to:'/notes' },
                { icon:BookOpen,  label:'Learning Hub',   sub:'YouTube videos by topic',  color:'#10b981', to:'/learn' },
                { icon:Briefcase, label:'Job Board',      sub:'Roles matched to your skills', color:'#3b82f6', to:'/careers' },
                { icon:Target,    label:'Career Path',    sub:'Full roadmap view',        color:'#8b5cf6', to:'/career-path' },
                { icon:FileText,  label:'Resume Analyzer',sub:'ATS score + JD match',      color:'#f59e0b', to:'/resume' },
              ].map(item=>(
                <button key={item.to} onClick={()=>navigate(item.to)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:11, border:'1.5px solid var(--border)', background:'var(--surf2)', cursor:'pointer', textAlign:'left', transition:'all .15s', width:'100%', marginBottom:7 }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=item.color;e.currentTarget.style.background=`${item.color}0d`;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--surf2)';}}>
                  <div style={{ width:36, height:36, borderRadius:9, background:`${item.color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <item.icon size={16} style={{ color:item.color }}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{item.label}</div>
                    <div style={{ fontSize:10, color:'var(--t3)', marginTop:1 }}>{item.sub}</div>
                  </div>
                  <ChevronRight size={13} style={{ color:'var(--t3)', flexShrink:0 }}/>
                </button>
              ))}
            </div>

            {/* Peer Leaderboard */}
            {leaderboard?.leaderboard?.length > 0 && (
              <div className="card">
                <h2 style={{ fontSize:15, fontWeight:800, color:'var(--text)', margin:'0 0 12px', display:'flex', alignItems:'center', gap:7 }}>
                  <Trophy size={15} style={{ color:'#f59e0b' }}/> Peer Leaderboard
                  <span style={{ fontSize:10, color:'var(--t3)', fontWeight:600, marginLeft:'auto', textTransform:'uppercase' }}>All modes</span>
                </h2>
                {leaderboard.leaderboard.slice(0,5).map(row=>(
                  <div key={row.rank} style={{ display:'flex', alignItems:'center', gap:9, padding:'6px 0', background:row.isYou?'var(--p-bg)':'transparent', borderRadius:8, paddingLeft:row.isYou?8:0 }}>
                    <span style={{ width:20, fontSize:12, fontWeight:800, color:row.rank<=3?'#f59e0b':'var(--t3)' }}>{row.rank===1?'🥇':row.rank===2?'🥈':row.rank===3?'🥉':row.rank}</span>
                    <span style={{ flex:1, fontSize:12, fontWeight:row.isYou?800:600, color:row.isYou?'var(--p)':'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.name}{row.isYou?' (You)':''}</span>
                    <span style={{ fontSize:12, fontWeight:800, color:'var(--text)' }}>{row.averageScore}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Streak milestone */}
            {streak>0 && (
              <div style={{ padding:'16px', borderRadius:16, background:'linear-gradient(135deg,#f59e0b,#d97706)', textAlign:'center' }}>
                <div style={{ fontSize:28, marginBottom:6 }}>🔥</div>
                <div style={{ fontSize:16, fontWeight:900, color:'#fff', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{streak}-Day Streak!</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,.8)', marginTop:3 }}>
                  {streak<3?`${3-streak} more day${3-streak!==1?'s':''} to "On Fire" badge`:streak<7?`${7-streak} more days to "Lightning Week"!`:'Keep the fire burning!'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* No career path CTA */}
        {!cp && (
          <div style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius:20, padding:'28px 32px', marginTop:22, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div>
              <div style={{ fontSize:20, fontWeight:900, color:'#fff', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Get Your Personalized Career Path</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,.8)', marginTop:4 }}>AI-powered interview prep tailored to your goals</div>
            </div>
            <button onClick={()=>navigate('/onboarding')} style={{ background:'#fff', color:'#4f46e5', border:'none', borderRadius:12, padding:'13px 26px', fontWeight:800, cursor:'pointer', fontSize:15, boxShadow:'0 4px 16px rgba(0,0,0,.2)' }}>
              Start Onboarding →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
