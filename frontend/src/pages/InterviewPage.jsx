import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { INTERVIEW_MODES, ROLES, DIFFICULTIES, QUESTION_COUNTS, APTITUDE_TOPICS, COMPANY_MODES } from '../services/mockData';
import { interviewApi } from '../services/api';
import { useFocusMonitor } from '../hooks/useFocusMonitor';
import { useBreakpoint } from '../hooks/useBreakpoint';
import ScoreRing from '../components/ScoreRing';
import { Mic, MicOff, ChevronRight, BarChart2, CheckCircle, XCircle, Clock, Send, RefreshCw,
  Loader, Info, AlertTriangle, Play, Volume2, Timer, Code, Building2, ChevronDown,
  Zap, Terminal, Eye, EyeOff, RotateCcw, CheckSquare, Sparkles, ShieldCheck } from 'lucide-react';

const fmtTime = s => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
const TIME_LIMITS = { technical:180, hr:300, 'system-design':420, aptitude:45 };
const ADAPTIVE_MODES = ['technical', 'hr', 'system-design'];

/* ─── Code Execution Engine ─────────────────────────────────────────── */
function smartEqual(a, b) {
  if (a === b) return true;
  const sa = JSON.stringify(a), sb = JSON.stringify(b);
  if (sa === sb) return true;
  // Sort arrays for problems where order doesn't matter
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    const sortFn = (x,y) => JSON.stringify(x) > JSON.stringify(y) ? 1 : -1;
    return JSON.stringify([...a].sort(sortFn)) === JSON.stringify([...b].sort(sortFn));
  }
  return false;
}

function runJS(userCode, callCode) {
  try {
    const fn = new Function(`
      'use strict';
      ${userCode}
      return (${callCode});
    `);
    const start = performance.now();
    const result = fn();
    const ms = (performance.now() - start).toFixed(1);
    return { success:true, result, ms };
  } catch(e) {
    return { success:false, result:null, error:e.message, ms:null };
  }
}

function runTestCases(code, language, testCases) {
  return testCases.map(tc => {
    if (language !== 'javascript') {
      return { passed:null, actual:'Run JS to test', expected:JSON.stringify(tc.expected), error:null, pending:true, ms:null };
    }
    const { success, result, error, ms } = runJS(code, tc.callCode);
    if (!success) return { passed:false, actual:null, expected:JSON.stringify(tc.expected), error, ms };
    const passed = smartEqual(result, tc.expected);
    return { passed, actual:JSON.stringify(result), expected:JSON.stringify(tc.expected), error:null, ms };
  });
}

/* ─── Setup Page ─────────────────────────────────────────────────────── */
function SetupPage({ config, updateConfig, onStart, loading }) {
  const { isMobile } = useBreakpoint();
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', paddingTop:80 }}>
      <div style={{ maxWidth:680, margin:'0 auto', padding: isMobile ? '20px 14px 40px' : '32px 20px 60px' }}>
        <h1 style={{ fontSize:26,fontWeight:900,color:'var(--text)',margin:'0 0 4px',fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Configure Interview</h1>
        <p style={{ color:'var(--t3)',margin:'0 0 28px',fontSize:14 }}>Choose mode, focus, and difficulty</p>

        {/* Mode */}
        <div style={{ marginBottom:24 }}>
          <label style={{ display:'block',fontSize:11,fontWeight:700,color:'var(--t3)',marginBottom:10,textTransform:'uppercase',letterSpacing:'.6px' }}>Interview Mode</label>
          <div style={{ display:'grid',gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',gap:10 }}>
            {INTERVIEW_MODES.map(m=>(
              <button key={m.id} onClick={()=>updateConfig({mode:m.id,codeMode:m.id==='technical'?config.codeMode:false})}
                style={{ padding:'16px',borderRadius:14,border:`2px solid ${config.mode===m.id?m.color:'var(--border)'}`,background:config.mode===m.id?`${m.color}0e`:'var(--surf)',cursor:'pointer',textAlign:'left',transition:'all .2s',boxShadow:config.mode===m.id?`0 0 0 4px ${m.color}15`:'none' }}>
                <div style={{ fontSize:22,marginBottom:7 }}>{m.icon}</div>
                <div style={{ fontSize:13,fontWeight:700,color:config.mode===m.id?m.color:'var(--text)',marginBottom:2 }}>{m.label}</div>
                <div style={{ fontSize:11,color:'var(--t3)' }}>{m.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Company */}
        <div style={{ marginBottom:20 }}>
          <label style={{ display:'block',fontSize:11,fontWeight:700,color:'var(--t3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.6px' }}>Company Focus <span style={{ fontWeight:400,textTransform:'none' }}>(optional)</span></label>
          <div style={{ display:'flex',flexWrap:'wrap',gap:7 }}>
            <button onClick={()=>updateConfig({companyId:'',companyName:'',companyTraits:''})}
              style={{ padding:'7px 14px',borderRadius:99,border:`1.5px solid ${!config.companyId?'var(--p)':'var(--border)'}`,background:!config.companyId?'var(--p-bg)':'var(--surf)',color:!config.companyId?'var(--p)':'var(--t3)',fontSize:12,fontWeight:700,cursor:'pointer',transition:'all .18s' }}>
              🌐 General
            </button>
            {COMPANY_MODES.slice(0,7).map(c=>(
              <button key={c.id} onClick={()=>updateConfig({companyId:c.id,companyName:c.name,companyTraits:c.traits})}
                style={{ padding:'7px 14px',borderRadius:99,border:`1.5px solid ${config.companyId===c.id?c.color:'var(--border)'}`,background:config.companyId===c.id?`${c.color}12`:'var(--surf)',color:config.companyId===c.id?c.color:'var(--t3)',fontSize:12,fontWeight:700,cursor:'pointer',transition:'all .18s' }}>
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Role + Difficulty */}
        <div style={{ display:'grid',gridTemplateColumns: isMobile ? '1fr' : '1fr auto',gap:16,marginBottom:18 }}>
          <div>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:'var(--t3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.6px' }}>Target Role</label>
            <select className="input" value={config.roleId} onChange={e=>{ const r=ROLES.find(r=>r.id===e.target.value); updateConfig({roleId:e.target.value,roleTitle:r?.title||''}); }}>
              <option value="">— Select —</option>
              {ROLES.map(r=><option key={r.id} value={r.id}>{r.icon} {r.title}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:'var(--t3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.6px' }}>Questions</label>
            <div style={{ display:'flex',gap:7 }}>
              {QUESTION_COUNTS.map(n=>(
                <button key={n} onClick={()=>updateConfig({questionCount:n})}
                  style={{ width:48,height:44,borderRadius:11,border:`2px solid ${config.questionCount===n?'var(--p)':'var(--border)'}`,background:config.questionCount===n?'var(--p-bg)':'var(--surf)',color:config.questionCount===n?'var(--p)':'var(--t2)',fontSize:15,fontWeight:900,cursor:'pointer',transition:'all .18s' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Aptitude topic */}
        {config.mode==='aptitude'&&(
          <div style={{ marginBottom:18 }}>
            <label style={{ display:'block',fontSize:11,fontWeight:700,color:'var(--t3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.6px' }}>Topic</label>
            <div style={{ display:'flex',flexWrap:'wrap',gap:7 }}>
              {APTITUDE_TOPICS.map(t=>(
                <button key={t.id} onClick={()=>updateConfig({aptitudeTopic:t.id,aptitudeTopicLabel:t.label})}
                  style={{ padding:'7px 14px',borderRadius:99,border:`1.5px solid ${config.aptitudeTopic===t.id?'var(--p)':'var(--border)'}`,background:config.aptitudeTopic===t.id?'var(--p-bg)':'var(--surf)',color:config.aptitudeTopic===t.id?'var(--p)':'var(--t3)',fontSize:12,fontWeight:600,cursor:'pointer',transition:'all .18s' }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty */}
        <div style={{ marginBottom:20 }}>
          <label style={{ display:'block',fontSize:11,fontWeight:700,color:'var(--t3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.6px' }}>Difficulty</label>
          <div style={{ display:'flex',gap:9 }}>
            {DIFFICULTIES.map(d=>(
              <button key={d.id} onClick={()=>updateConfig({difficulty:d.id})}
                style={{ flex:1,padding:'11px 6px',borderRadius:12,border:`2px solid ${config.difficulty===d.id?d.color:'var(--border)'}`,background:config.difficulty===d.id?`${d.color}0e`:'var(--surf)',cursor:'pointer',textAlign:'center',transition:'all .18s' }}>
                <div style={{ fontSize:18 }}>{d.icon}</div>
                <div style={{ fontSize:12,fontWeight:700,color:config.difficulty===d.id?d.color:'var(--text)',marginTop:3 }}>{d.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div style={{ display:'flex',gap:12,marginBottom:14,flexWrap:'wrap' }}>
          {config.mode==='technical'&&(
            <div onClick={()=>updateConfig({codeMode:!config.codeMode})}
              style={{ flex:1,minWidth:220,display:'flex',alignItems:'center',gap:12,padding:'14px 16px',borderRadius:13,border:`2px solid ${config.codeMode?'var(--p)':'var(--border)'}`,background:config.codeMode?'var(--p-bg)':'var(--surf)',cursor:'pointer',transition:'all .2s',boxShadow:config.codeMode?'0 0 0 4px rgba(79,70,229,.1)':'none' }}>
              <div style={{ width:40,height:40,borderRadius:11,background:config.codeMode?'var(--p)':'var(--surf3)',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s' }}>
                <Code size={18} style={{ color:config.codeMode?'#fff':'var(--t3)' }}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13,fontWeight:800,color:config.codeMode?'var(--p)':'var(--text)' }}>Code Mode</div>
                <div style={{ fontSize:11,color:'var(--t3)',marginTop:1 }}>Real problems · Run & test your code</div>
              </div>
              <div style={{ width:36,height:20,borderRadius:99,background:config.codeMode?'var(--p)':'var(--border2)',position:'relative',transition:'all .2s',flexShrink:0 }}>
                <div style={{ width:14,height:14,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:config.codeMode?19:3,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.2)' }}/>
              </div>
            </div>
          )}
          <div onClick={()=>updateConfig({timedMode:!config.timedMode})}
            style={{ flex:1,minWidth:220,display:'flex',alignItems:'center',gap:12,padding:'14px 16px',borderRadius:13,border:`2px solid ${config.timedMode?'#f59e0b':'var(--border)'}`,background:config.timedMode?'#fffbeb':'var(--surf)',cursor:'pointer',transition:'all .2s' }}>
            <div style={{ width:40,height:40,borderRadius:11,background:config.timedMode?'#f59e0b':'var(--surf3)',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s' }}>
              <Timer size={18} style={{ color:config.timedMode?'#fff':'var(--t3)' }}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13,fontWeight:800,color:config.timedMode?'#b45309':'var(--text)' }}>Timed Mode</div>
              <div style={{ fontSize:11,color:'var(--t3)',marginTop:1 }}>Countdown per question</div>
            </div>
            <div style={{ width:36,height:20,borderRadius:99,background:config.timedMode?'#f59e0b':'var(--border2)',position:'relative',transition:'all .2s',flexShrink:0 }}>
              <div style={{ width:14,height:14,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:config.timedMode?19:3,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.2)' }}/>
            </div>
          </div>
        </div>

        <div style={{ display:'flex',gap:12,marginBottom:20,flexWrap:'wrap' }}>
          {ADAPTIVE_MODES.includes(config.mode) && !(config.mode==='technical'&&config.codeMode) && (
            <div onClick={()=>updateConfig({adaptive:!config.adaptive})}
              style={{ flex:1,minWidth:220,display:'flex',alignItems:'center',gap:12,padding:'14px 16px',borderRadius:13,border:`2px solid ${config.adaptive?'#8b5cf6':'var(--border)'}`,background:config.adaptive?'#f5f3ff':'var(--surf)',cursor:'pointer',transition:'all .2s' }}>
              <div style={{ width:40,height:40,borderRadius:11,background:config.adaptive?'#8b5cf6':'var(--surf3)',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s' }}>
                <Sparkles size={18} style={{ color:config.adaptive?'#fff':'var(--t3)' }}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13,fontWeight:800,color:config.adaptive?'#6d28d9':'var(--text)' }}>Adaptive Difficulty</div>
                <div style={{ fontSize:11,color:'var(--t3)',marginTop:1 }}>ARIA calibrates each question to your last answer</div>
              </div>
              <div style={{ width:36,height:20,borderRadius:99,background:config.adaptive?'#8b5cf6':'var(--border2)',position:'relative',transition:'all .2s',flexShrink:0 }}>
                <div style={{ width:14,height:14,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:config.adaptive?19:3,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.2)' }}/>
              </div>
            </div>
          )}
          {!config.codeMode && (
            <div onClick={()=>updateConfig({voiceMode:!config.voiceMode})}
              style={{ flex:1,minWidth:220,display:'flex',alignItems:'center',gap:12,padding:'14px 16px',borderRadius:13,border:`2px solid ${config.voiceMode?'#10b981':'var(--border)'}`,background:config.voiceMode?'var(--green-bg)':'var(--surf)',cursor:'pointer',transition:'all .2s' }}>
              <div style={{ width:40,height:40,borderRadius:11,background:config.voiceMode?'#10b981':'var(--surf3)',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s' }}>
                <Volume2 size={18} style={{ color:config.voiceMode?'#fff':'var(--t3)' }}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13,fontWeight:800,color:config.voiceMode?'#047857':'var(--text)' }}>Voice Mode</div>
                <div style={{ fontSize:11,color:'var(--t3)',marginTop:1 }}>ARIA reads each question out loud</div>
              </div>
              <div style={{ width:36,height:20,borderRadius:99,background:config.voiceMode?'#10b981':'var(--border2)',position:'relative',transition:'all .2s',flexShrink:0 }}>
                <div style={{ width:14,height:14,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:config.voiceMode?19:3,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.2)' }}/>
              </div>
            </div>
          )}
        </div>

        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:22,padding:'10px 14px',borderRadius:11,background:'var(--surf2)',border:'1px solid var(--border)' }}>
          <ShieldCheck size={14} style={{ color:'var(--t3)', flexShrink:0 }} />
          <span style={{ fontSize:11.5, color:'var(--t3)', lineHeight:1.5 }}>This session tracks tab switches, pasted answers, and idle time to give you an honest <strong>Focus Score</strong> alongside your marks — practice like it's the real thing.</span>
        </div>

        <button className="btn-primary" onClick={onStart} disabled={loading}
          style={{ width:'100%',padding:'15px',fontSize:16,fontWeight:800,gap:8,borderRadius:14 }}>
          {loading?<><Loader size={16} className="spin-anim"/>Generating…</>:<><Play size={15} fill="white"/>Start Interview</>}
        </button>
      </div>
    </div>
  );
}

/* ─── Code Interview (with test runner) ──────────────────────────────── */
function CodeInterview({ problem, config, feedback, feedbackLoading, qTimer, totalTimer, timeWarning,
  scores, currentQ, totalQ, codeLang, setCodeLang, answer, setAnswer, onRun, onSubmit, onNext, onRetry,
  testResults, setTestResults, runLoading, sessionAvg, onFinish, onPasteAnswer, onInputActivity }) {
  const mode = INTERVIEW_MODES.find(m=>m.id==='technical')||INTERVIEW_MODES[0];
  const { isMobile } = useBreakpoint();
  const [showHints, setShowHints] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const visibleTC = problem.testCases.filter(tc => !tc.hidden);
  const hiddenTC  = problem.testCases.filter(tc => tc.hidden);
  const passedCount = testResults.filter(r=>r.passed===true).length;
  const allCount = testResults.length;

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', paddingTop:64, display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ background:'var(--surf)', borderBottom:'1px solid var(--border)', padding:'10px 20px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:30,height:30,borderRadius:8,background:`${mode.color}18`,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <Code size={15} style={{ color:mode.color }}/>
          </div>
          <div>
            <div style={{ fontSize:13,fontWeight:800,color:'var(--text)' }}>Code Mode</div>
            <div style={{ fontSize:10,color:'var(--t3)' }}>{config.roleTitle||'General'} · {config.difficulty}</div>
          </div>
          {config.companyName&&<span style={{ padding:'2px 8px',borderRadius:99,fontSize:10,fontWeight:800,background:'var(--amber-bg)',color:'var(--amber)' }}>{config.companyName}</span>}
        </div>

        <div style={{ flex:1, display:'flex', gap:5, justifyContent:'center', flexWrap:'wrap' }}>
          {Array.from({length:totalQ}).map((_,i)=>{
            const s=scores[i]; const isActive=i===currentQ;
            const bg=s!=null?(s>=8?'var(--green)':s>=6?'#f59e0b':'var(--red)'):isActive?mode.color:'var(--border)';
            return <div key={i} style={{ width:28,height:6,borderRadius:99,background:bg,transition:'background .3s' }}/>;
          })}
        </div>

        <div style={{ display:'flex',gap:8 }}>
          <div style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:8,background:'var(--bg)',border:'1px solid var(--border)',fontSize:12,fontWeight:700,color:'var(--t2)' }}>
            <Clock size={12} style={{ color:'var(--t3)' }}/>{fmtTime(qTimer)}
          </div>
          <span style={{ fontSize:12,fontWeight:700,color:'var(--t3)',padding:'5px 10px',borderRadius:8,background:'var(--bg)',border:'1px solid var(--border)' }}>Q{currentQ+1}/{totalQ}</span>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', minHeight:0 }}>

        {/* LEFT: Problem + Editor */}
        <div style={{ overflowY:'auto', display:'flex', flexDirection:'column' }}>
          {!feedback ? (
            <>
              {/* Timed bar */}
              {config.timedMode&&(
                <div style={{ padding:'8px 20px', background:timeWarning?'var(--red-bg)':'var(--surf2)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
                  <Timer size={13} style={{ color:timeWarning?'var(--red)':'var(--t3)' }}/>
                  <div style={{ flex:1,height:4,borderRadius:99,background:'var(--border)',overflow:'hidden' }}>
                    <div style={{ height:'100%',borderRadius:99,background:timeWarning?'var(--red)':'var(--p)',width:`${Math.max(0,(1-qTimer/(TIME_LIMITS.technical))*100)}%`,transition:'width .5s' }}/>
                  </div>
                  <span style={{ fontSize:12,fontWeight:900,color:timeWarning?'var(--red)':'var(--text)' }}>
                    {fmtTime(Math.max(0,TIME_LIMITS.technical-qTimer))}{timeWarning?' ⚠️':''}
                  </span>
                </div>
              )}

              {/* Problem statement */}
              <div style={{ padding:'20px 24px 0' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:14 }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <span style={{ fontSize:16, fontWeight:900, color:'var(--text)', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{problem.title}</span>
                      <span style={{ padding:'2px 9px', borderRadius:99, fontSize:11, fontWeight:700, background: problem.difficulty==='Easy'?'var(--green-bg)':problem.difficulty==='Medium'?'var(--amber-bg)':'var(--red-bg)', color: problem.difficulty==='Easy'?'var(--green)':problem.difficulty==='Medium'?'var(--amber)':'var(--red)' }}>{problem.difficulty}</span>
                      {(problem.tags||[]).map(t=><span key={t} className="pill pill-gray" style={{ fontSize:10 }}>{t}</span>)}
                    </div>
                    <div style={{ fontSize:13, color:'var(--t2)', lineHeight:1.75, whiteSpace:'pre-wrap' }}>
                      {(problem.description||'').replace(/`([^`]+)`/g, (_,m)=>m).replace(/\*\*([^*]+)\*\*/g,(_,m)=>m)}
                    </div>
                  </div>
                </div>

                {/* Examples */}
                {problem.examples?.slice(0,2).map((ex,i)=>(
                  <div key={i} style={{ marginBottom:10, padding:'10px 14px', background:'var(--surf)', border:'1px solid var(--border)', borderRadius:10 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--t3)', marginBottom:4, textTransform:'uppercase' }}>Example {i+1}</div>
                    <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, color:'var(--text)' }}>
                      <div><span style={{ color:'var(--t3)' }}>Input: </span>{ex.input}</div>
                      <div><span style={{ color:'var(--t3)' }}>Output: </span>{ex.output}</div>
                      {ex.explanation&&<div style={{ color:'var(--t3)', marginTop:3 }}>// {ex.explanation}</div>}
                    </div>
                  </div>
                ))}

                {/* Constraints + hints */}
                <div style={{ display:'flex', gap:12, marginBottom:14, flexWrap:'wrap' }}>
                  {problem.constraints?.length>0&&(
                    <div style={{ flex:1, padding:'8px 12px', background:'var(--surf2)', border:'1px solid var(--border)', borderRadius:9 }}>
                      <div style={{ fontSize:10, fontWeight:800, color:'var(--t3)', marginBottom:5, textTransform:'uppercase' }}>Constraints</div>
                      {problem.constraints.map((c,i)=><div key={i} style={{ fontSize:11, color:'var(--t3)', fontFamily:'JetBrains Mono,monospace', marginTop:2 }}>• {c}</div>)}
                    </div>
                  )}
                  {problem.hints?.length>0&&(
                    <div style={{ flex:1 }}>
                      <button onClick={()=>setShowHints(h=>!h)}
                        style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 12px',borderRadius:9,border:'1px solid var(--border)',background:'var(--surf)',cursor:'pointer',fontSize:11,fontWeight:700,color:'var(--t3)',width:'100%' }}>
                        <Info size={11}/> {showHints?'Hide Hints':'Show Hints'} ({problem.hints.length})
                      </button>
                      {showHints&&problem.hints.map((h,i)=>(
                        <div key={i} style={{ marginTop:5,padding:'8px 12px',background:'var(--p-bg)',border:'1px solid var(--border3)',borderRadius:9,fontSize:12,color:'var(--p)' }}>💡 {h}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Code editor */}
              <div style={{ padding:'0 24px 16px', flex:1 }}>
                <div style={{ border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                  {/* Editor toolbar */}
                  <div style={{ padding:'9px 14px', background:'#1a1a2e', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid #2d2d5e' }}>
                    <div style={{ display:'flex', gap:5 }}>
                      {[{id:'javascript',label:'JS'},{id:'python',label:'PY'},{id:'java',label:'Java'},{id:'cpp',label:'C++'}].map(l=>(
                        <button key={l.id} onClick={()=>{
                          setCodeLang(l.id);
                          if (!answer.trim()||(problem.startCode[codeLang]&&answer.trim()===problem.startCode[codeLang]?.trim())) {
                            setAnswer(problem.startCode[l.id]||'');
                          }
                        }}
                          style={{ padding:'3px 10px',borderRadius:6,border:'none',background:codeLang===l.id?'var(--p)':'#2d2d5e',color:codeLang===l.id?'#fff':'#888',fontSize:11,fontWeight:700,cursor:'pointer',transition:'all .15s' }}>
                          {l.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ flex:1 }}/>
                    <button onClick={()=>setAnswer(problem.startCode[codeLang]||'')} title="Reset to template"
                      style={{ display:'flex',alignItems:'center',gap:4,padding:'4px 8px',borderRadius:6,border:'none',background:'#2d2d5e',color:'#888',fontSize:10,fontWeight:600,cursor:'pointer',transition:'all .15s' }}
                      onMouseEnter={e=>{e.currentTarget.style.color='#fff';}} onMouseLeave={e=>{e.currentTarget.style.color='#888';}}>
                      <RotateCcw size={11}/> Reset
                    </button>
                  </div>

                  {/* Editor with line numbers */}
                  <div style={{ display:'flex', background:'#1e1e2e', position:'relative' }}>
                    <div style={{ padding:'14px 0 14px 14px', background:'#16162a', color:'#4e4e7a', fontSize:13, fontFamily:'JetBrains Mono,monospace', lineHeight:'1.7', userSelect:'none', minWidth:42, textAlign:'right', paddingRight:10, borderRight:'1px solid #2d2d5e', flexShrink:0 }}>
                      {(answer||'').split('\n').map((_,i)=><div key={i}>{i+1}</div>)}
                    </div>
                    <textarea value={answer} onChange={e=>{ setAnswer(e.target.value); onInputActivity?.(); }}
                      onPaste={onPasteAnswer}
                      onKeyDown={e=>{ if(e.key==='Tab'){e.preventDefault();const s=e.target.selectionStart,en=e.target.selectionEnd;const v=answer;setAnswer(v.substring(0,s)+'  '+v.substring(en));setTimeout(()=>{e.target.selectionStart=e.target.selectionEnd=s+2;},0);} }}
                      style={{ flex:1,padding:'14px 16px',background:'#1e1e2e',color:'#cdd6f4',fontSize:13,fontFamily:'JetBrains Mono,monospace',border:'none',outline:'none',resize:'none',lineHeight:'1.7',minHeight:220,boxSizing:'border-box',tabSize:2 }}
                      placeholder={`// Write your ${codeLang} solution here…\n// Tab = 2 spaces`}
                      spellCheck={false}
                    />
                  </div>

                  {/* Run + Submit bar */}
                  <div style={{ padding:'10px 14px', background:'#13132a', borderTop:'1px solid #2d2d5e', display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:11, color:'#4e4e7a' }}>{(answer||'').split('\n').length} lines</span>
                    <div style={{ flex:1 }}/>
                    {codeLang!=='javascript'&&<span style={{ fontSize:11, color:'#666', marginRight:4 }}>JS only for live tests</span>}
                    <button onClick={()=>{ const r=runTestCases(answer,codeLang,visibleTC); setTestResults(r); }}
                      disabled={!answer.trim()||runLoading}
                      style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:9,border:'1px solid #3d3d7a',background:'#1e1e2e',color:'#a59cff',fontSize:13,fontWeight:700,cursor:'pointer',transition:'all .15s' }}
                      onMouseEnter={e=>{e.currentTarget.style.background='#2d2d5e';}} onMouseLeave={e=>{e.currentTarget.style.background='#1e1e2e';}}>
                      <Terminal size={13}/> Run Tests
                    </button>
                    <button onClick={onSubmit} disabled={!answer.trim()||feedbackLoading}
                      className="btn-primary" style={{ fontSize:13,gap:6,padding:'8px 20px',borderRadius:9 }}>
                      {feedbackLoading?<><Loader size={13} className="spin-anim"/>Evaluating…</>:<><Send size={13}/>Submit</>}
                    </button>
                  </div>
                </div>

                {/* Test case results */}
                {testResults.length>0&&(
                  <div style={{ marginTop:14 }}>
                    <div style={{ fontSize:12,fontWeight:800,color:'var(--t3)',marginBottom:8,display:'flex',alignItems:'center',gap:8,textTransform:'uppercase',letterSpacing:'.5px' }}>
                      <Terminal size={12}/> Test Results
                      <span style={{ fontWeight:700, color:passedCount===allCount?'var(--green)':passedCount>0?'var(--amber)':'var(--red)', background:passedCount===allCount?'var(--green-bg)':passedCount>0?'var(--amber-bg)':'var(--red-bg)', padding:'1px 8px', borderRadius:99, fontSize:11 }}>
                        {passedCount}/{allCount} passed
                      </span>
                    </div>
                    {testResults.map((r,i)=>(
                      <div key={i} style={{ marginBottom:7, padding:'10px 14px', borderRadius:10, border:`1px solid ${r.pending?'var(--border)':r.passed?'rgba(16,185,129,.3)':'rgba(239,68,68,.3)'}`, background:r.pending?'var(--surf2)':r.passed?'var(--green-bg)':'var(--red-bg)', display:'flex', alignItems:'flex-start', gap:10 }}>
                        <div style={{ marginTop:1, flexShrink:0 }}>
                          {r.pending?<div style={{ width:14,height:14,borderRadius:'50%',border:'2px solid var(--border)',marginTop:1 }}/>:
                           r.passed?<CheckCircle size={16} style={{ color:'var(--green)' }}/>:
                           <XCircle size={16} style={{ color:'var(--red)' }}/>}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:11,fontWeight:700,color:'var(--t3)',marginBottom:2 }}>Test {i+1}</div>
                          <div style={{ fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--text)' }}>{visibleTC[i]?.callCode}</div>
                          {!r.pending&&(
                            <div style={{ display:'flex',gap:12,marginTop:5,fontSize:11,fontFamily:'JetBrains Mono,monospace' }}>
                              <span><span style={{ color:'var(--t3)' }}>Expected: </span><span style={{ color:r.passed?'var(--green)':'var(--text)' }}>{r.expected}</span></span>
                              {!r.passed&&<span><span style={{ color:'var(--t3)' }}>Got: </span><span style={{ color:'var(--red)' }}>{r.error||r.actual}</span></span>}
                              {r.ms&&<span style={{ color:'var(--t4)' }}>{r.ms}ms</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Feedback for code mode */
            <div style={{ padding:'24px', animation:'fadeUp .5s ease' }}>
              <div style={{ marginBottom:18, padding:'20px 22px', background:'var(--surf)', border:'1px solid var(--border)', borderRadius:16, textAlign:'center' }}>
                <div style={{ fontSize:13, color:'var(--t3)', marginBottom:8, fontWeight:600 }}>
                  {feedback.testsPassed}/{feedback.testsTotal} test cases passed
                </div>
                {/* Test result pills */}
                <div style={{ display:'flex', justifyContent:'center', gap:6, flexWrap:'wrap', marginBottom:14 }}>
                  {problem.testCases.map((tc,i)=>{
                    const r = i < feedback.testsPassed;  // simplified
                    return (
                      <div key={i} style={{ display:'flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:99,background:r?'var(--green-bg)':'var(--red-bg)',border:`1px solid ${r?'rgba(16,185,129,.3)':'rgba(239,68,68,.3)'}`,fontSize:11,fontWeight:700,color:r?'var(--green)':'var(--red)' }}>
                        {r?<CheckCircle size={11}/>:<XCircle size={11}/>} TC{i+1}{tc.hidden?' 🔒':''}
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize:14,color:'var(--t3)' }}>
                  {feedback.score>=9?'🏆 Excellent solution!':feedback.score>=7?'🎯 Great job!':feedback.score>=5?'📈 Good attempt':feedback.score>0?'💪 Keep practicing':'🔄 Try again'}
                </div>
              </div>

              {feedback.timeComplexity&&(
                <div style={{ display:'flex',gap:10,marginBottom:14 }}>
                  {[{label:'Time Complexity',val:feedback.timeComplexity},{label:'Space Complexity',val:feedback.spaceComplexity}].filter(x=>x.val).map(x=>(
                    <div key={x.label} style={{ flex:1,padding:'10px 14px',background:'var(--p-bg)',border:'1px solid var(--border3)',borderRadius:10 }}>
                      <div style={{ fontSize:10,color:'var(--p)',fontWeight:800,textTransform:'uppercase',marginBottom:2 }}>{x.label}</div>
                      <div style={{ fontSize:15,fontWeight:900,color:'var(--p)',fontFamily:'JetBrains Mono,monospace' }}>{x.val}</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display:'grid',gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',gap:12,marginBottom:14 }}>
                {feedback.strengths?.filter(Boolean).length>0&&(
                  <div style={{ padding:'12px 14px',background:'var(--green-bg)',borderRadius:12,border:'1px solid rgba(16,185,129,.2)' }}>
                    <div style={{ fontSize:11,fontWeight:800,color:'#15803d',marginBottom:6,textTransform:'uppercase' }}>✓ Strengths</div>
                    {feedback.strengths.map((s,i)=><div key={i} style={{ fontSize:12,color:'#166534',marginTop:4,lineHeight:1.5 }}>• {s}</div>)}
                  </div>
                )}
                {feedback.improvements?.filter(Boolean).length>0&&(
                  <div style={{ padding:'12px 14px',background:'var(--amber-bg)',borderRadius:12,border:'1px solid rgba(245,158,11,.2)' }}>
                    <div style={{ fontSize:11,fontWeight:800,color:'#92400e',marginBottom:6,textTransform:'uppercase' }}>↑ Improve</div>
                    {feedback.improvements.map((s,i)=><div key={i} style={{ fontSize:12,color:'#78350f',marginTop:4,lineHeight:1.5 }}>• {s}</div>)}
                  </div>
                )}
              </div>
              {feedback.explanation&&<div style={{ padding:'12px 14px',background:'var(--surf)',border:'1px solid var(--border2)',borderRadius:12,fontSize:13,color:'var(--t2)',lineHeight:1.7,marginBottom:14 }}><strong>💡 </strong>{feedback.explanation}</div>}
              <div style={{ display:'flex',gap:10 }}>
                <button className="btn-outline" onClick={onRetry} style={{ flex:1,gap:6,borderRadius:11 }}><RefreshCw size={13}/>Retry</button>
                <button className="btn-primary" onClick={onNext} style={{ flex:2,gap:7,borderRadius:11 }}>
                  {currentQ+1>=totalQ?<>📊 View Report</>:<>Next Question <ChevronRight size={14}/></>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Score + stats */}
        <div style={{ overflowY:'auto', padding:'20px 18px', background:'var(--surf2)', borderLeft:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'var(--surf)',borderRadius:16,padding:'18px',border:'1px solid var(--border)',textAlign:'center' }}>
            <div style={{ fontSize:11,fontWeight:800,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:10 }}>
              {feedback?'Score':'Session Avg'}
            </div>
            <div style={{ display:'flex', justifyContent:'center' }}>
              <ScoreRing score={feedback?feedback.score:sessionAvg} size={160} animated label={feedback?"THIS Q":"AVG"} />
            </div>
          </div>

          {/* Score history */}
          {scores.filter(s=>s!=null).length>0&&(
            <div style={{ background:'var(--surf)',borderRadius:14,padding:'14px 16px',border:'1px solid var(--border)' }}>
              <div style={{ fontSize:11,fontWeight:800,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10 }}>Score History</div>
              <div style={{ display:'flex',gap:5,alignItems:'flex-end' }}>
                {Array.from({length:totalQ}).map((_,i)=>{
                  const s=scores[i]; const isActive=i===currentQ;
                  const color=s!=null?(s>=8?'var(--green)':s>=6?'#f59e0b':'var(--red)'):isActive?'var(--p)':'var(--border)';
                  return (
                    <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}>
                      {s!=null&&<span style={{ fontSize:9,fontWeight:800,color }}>{s.toFixed(1)}</span>}
                      <div style={{ width:'100%',height:s!=null?`${Math.max(4,s*5.5)}px`:'4px',background:color,borderRadius:'4px 4px 0 0',minHeight:4,transition:'height .6s cubic-bezier(.34,1.56,.64,1)' }}/>
                      <span style={{ fontSize:9,color:'var(--t4)' }}>Q{i+1}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={{ background:'var(--surf)',borderRadius:14,padding:'14px 16px',border:'1px solid var(--border)' }}>
            <div style={{ fontSize:11,fontWeight:800,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10 }}>Session</div>
            {[
              {label:'Progress', val:`${scores.filter(s=>s!=null).length}/${totalQ} done`},
              {label:'Average',  val:sessionAvg>0?`${sessionAvg.toFixed(1)}/10`:'—', color:sessionAvg>=7?'var(--green)':sessionAvg>=5?'var(--amber)':'var(--red)'},
              {label:'Time',     val:fmtTime(totalTimer)},
            ].map(s=>(
              <div key={s.label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:12,color:'var(--t3)',fontWeight:600 }}>{s.label}</span>
                <span style={{ fontSize:13,fontWeight:900,color:s.color||'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{s.val}</span>
              </div>
            ))}
          </div>

          <button onClick={onFinish} className="btn-outline" style={{ width:'100%',gap:7,fontSize:13,borderRadius:11 }}>
            <BarChart2 size={14}/> End & View Report
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Text Answer Interview ───────────────────────────────────────────── */
function speak(text) {
  if (!text || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

function TextInterview({ session, config, currentQ, totalQ, scores, qTimer, totalTimer, timeWarning, answer, setAnswer,
  feedback, feedbackLoading, recording, fetchingNext, onSubmit, onNext, onRetry, onToggleRecording, onFinish,
  onPasteAnswer, onInputActivity }) {
  const mode = INTERVIEW_MODES.find(m=>m.id===config.mode)||INTERVIEW_MODES[0];
  const { isMobile } = useBreakpoint();
  const q = session.questions[currentQ];
  const answered = scores.filter(s=>s!=null).length;
  const sessionAvg = answered ? scores.filter(s=>s!=null).reduce((a,b)=>a+b,0)/answered : 0;

  // ARIA speaks the question automatically in Voice Mode. Runs once
  // per new question (not on every re-render, and not while the
  // feedback card is showing) so it never talks over itself.
  useEffect(() => {
    if (config.voiceMode && q?.question && !feedback) speak(q.question);
  }, [q?.question, config.voiceMode]);

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', paddingTop:64, display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ background:'var(--surf)', borderBottom:'1px solid var(--border)', padding:'10px 20px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', flexShrink:0 }}>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <div style={{ width:30,height:30,borderRadius:8,background:`${mode.color}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>{mode.icon}</div>
          <div>
            <div style={{ fontSize:13,fontWeight:800,color:'var(--text)' }}>{mode.label}</div>
            <div style={{ fontSize:10,color:'var(--t3)' }}>{config.roleTitle||'General'} · {config.difficulty}</div>
          </div>
          {config.companyName&&<span style={{ padding:'2px 8px',borderRadius:99,fontSize:10,fontWeight:800,background:'var(--amber-bg)',color:'var(--amber)' }}>{config.companyName}</span>}
        </div>
        <div style={{ flex:1,display:'flex',gap:5,justifyContent:'center',flexWrap:'wrap' }}>
          {Array.from({length:totalQ}).map((_,i)=>{
            const s=scores[i]; const isActive=i===currentQ;
            const bg=s!=null?(s>=8?'var(--green)':s>=6?'#f59e0b':'var(--red)'):isActive?mode.color:'var(--border)';
            return <div key={i} style={{ width:28,height:6,borderRadius:99,background:bg,transition:'background .3s' }}/>;
          })}
        </div>
        <div style={{ display:'flex',gap:8 }}>
          <div style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:8,background:'var(--bg)',border:'1px solid var(--border)',fontSize:12,fontWeight:700,color:'var(--t2)' }}>
            <Clock size={12} style={{ color:'var(--t3)' }}/>{fmtTime(qTimer)}
          </div>
          <span style={{ fontSize:12,fontWeight:700,color:'var(--t3)',padding:'5px 10px',borderRadius:8,background:'var(--bg)',border:'1px solid var(--border)' }}>Q{currentQ+1}/{totalQ}</span>
        </div>
      </div>

      <div style={{ flex:1,display:'grid',gridTemplateColumns: isMobile ? '1fr' : '1fr 340px',minHeight:0 }}>
        {/* LEFT */}
        <div style={{ padding:'20px 24px', overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>
          {config.timedMode&&(
            <div style={{ padding:'10px 14px',borderRadius:11,background:timeWarning?'var(--red-bg)':'var(--surf2)',border:`1px solid ${timeWarning?'rgba(239,68,68,.3)':'var(--border)'}`,display:'flex',alignItems:'center',gap:10,transition:'all .3s' }}>
              <Timer size={13} style={{ color:timeWarning?'var(--red)':'var(--t3)' }}/>
              <div style={{ flex:1,height:4,borderRadius:99,background:'var(--border)',overflow:'hidden' }}>
                <div style={{ height:'100%',borderRadius:99,background:timeWarning?'var(--red)':'var(--p)',width:`${Math.max(0,(1-qTimer/(TIME_LIMITS[config.mode]||180))*100)}%`,transition:'width .5s' }}/>
              </div>
              <span style={{ fontSize:12,fontWeight:900,color:timeWarning?'var(--red)':'var(--text)' }}>{fmtTime(Math.max(0,(TIME_LIMITS[config.mode]||180)-qTimer))}{timeWarning?' ⚠️':''}</span>
            </div>
          )}

          {!feedback ? (
            <>
              <div style={{ background:'var(--surf)',borderRadius:16,padding:'20px 22px',border:'1px solid var(--border)',borderLeft:`5px solid ${mode.color}` }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
                  <span style={{ padding:'3px 10px',borderRadius:99,fontSize:11,fontWeight:700,background:`${mode.color}18`,color:mode.color }}>Question {currentQ+1} of {totalQ}</span>
                  <button onClick={()=>speak(q?.question||'')}
                    style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:8,border:'1px solid var(--border2)',background:'var(--bg)',color:'var(--t3)',fontSize:11,fontWeight:600,cursor:'pointer' }}>
                    <Volume2 size={11}/> Listen
                  </button>
                </div>
                <p style={{ fontSize:16,fontWeight:600,color:'var(--text)',margin:0,lineHeight:1.75 }}>{q?.question||'Loading…'}</p>
                {q?.hints?.length>0&&(
                  <details style={{ marginTop:12 }}>
                    <summary style={{ fontSize:12,fontWeight:700,color:'var(--t3)',cursor:'pointer',userSelect:'none',listStyle:'none',display:'flex',alignItems:'center',gap:5 }}>
                      <Info size={12} style={{ color:'var(--t3)' }}/> Show hints ({q.hints.length})
                    </summary>
                    <div style={{ marginTop:8,padding:'10px 12px',background:'var(--bg)',borderRadius:9,border:'1px dashed var(--border2)' }}>
                      {q.hints.filter(Boolean).map((h,i)=><div key={i} style={{ fontSize:12,color:'var(--t3)',marginTop:i>0?3:0 }}>• {h}</div>)}
                    </div>
                  </details>
                )}
              </div>

              <div style={{ background:'var(--surf)',borderRadius:16,border:'1px solid var(--border)',overflow:'hidden',flex:1 }}>
                <div style={{ padding:'11px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10,background:'var(--surf2)' }}>
                  <span style={{ fontSize:12,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px' }}>Your Answer</span>
                  <button onClick={onToggleRecording}
                    style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:6,padding:'5px 12px',borderRadius:99,border:`1.5px solid ${recording?'var(--red)':'var(--border2)'}`,background:recording?'var(--red-bg)':'var(--surf)',color:recording?'var(--red)':'var(--t3)',fontSize:11,fontWeight:700,cursor:'pointer' }}>
                    {recording?<><MicOff size={12}/> Stop</>:<><Mic size={12}/> Dictate</>}
                  </button>
                </div>
                {recording&&<div style={{ padding:'8px 16px',background:'rgba(239,68,68,.05)',borderBottom:'1px solid var(--border)',fontSize:12,color:'var(--red)',fontWeight:600,display:'flex',alignItems:'center',gap:7 }}><div style={{ width:8,height:8,borderRadius:'50%',background:'var(--red)' }} className="pulse-dot"/> Recording…</div>}
                <textarea value={answer} onChange={e=>{ setAnswer(e.target.value); onInputActivity?.(); }}
                  onPaste={onPasteAnswer}
                  placeholder={config.mode==='hr'?'Use STAR: Situation → Task → Action → Result…':config.mode==='system-design'?'Describe architecture, components, trade-offs, scalability…':'Explain your approach, write pseudocode, walk through your thinking…'}
                  style={{ width:'100%',minHeight:220,padding:'16px 18px',background:'var(--surf)',color:'var(--text)',fontSize:14,lineHeight:1.75,fontFamily:'inherit',border:'none',outline:'none',resize:'vertical',boxSizing:'border-box' }}
                  autoFocus
                />
                <div style={{ padding:'10px 16px',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--surf2)' }}>
                  <span style={{ fontSize:11,color:'var(--t4)' }}>{answer.split(/\s+/).filter(Boolean).length} words</span>
                  <button className="btn-primary" onClick={onSubmit} disabled={!answer.trim()||feedbackLoading} style={{ fontSize:14,gap:7,padding:'9px 22px',borderRadius:11 }}>
                    {feedbackLoading?<><Loader size={14} className="spin-anim"/>Evaluating…</>:<><Send size={14}/>Submit</>}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:14,animation:'fadeUp .5s ease' }}>
              <div style={{ background:'var(--surf)',borderRadius:16,padding:'20px',border:'1px solid var(--border)',textAlign:'center' }}>
                <div style={{ display:'flex',justifyContent:'center',marginBottom:10 }}>
                  <ScoreRing score={feedback.score} size={160} animated label="YOUR SCORE"/>
                </div>
                <div style={{ fontSize:13,color:'var(--t3)' }}>{feedback.score>=8?'🌟 Excellent!':feedback.score>=6?'👍 Good answer!':feedback.score>=4?'📈 Fair attempt':'💪 Keep practicing'}</div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',gap:12 }}>
                {feedback.strengths?.filter(Boolean).length>0&&<div style={{ padding:'12px 14px',background:'var(--green-bg)',borderRadius:12,border:'1px solid rgba(16,185,129,.2)' }}><div style={{ fontSize:11,fontWeight:800,color:'#15803d',marginBottom:6,textTransform:'uppercase' }}>✓ Strengths</div>{feedback.strengths.filter(Boolean).map((s,i)=><div key={i} style={{ fontSize:12,color:'#166534',marginTop:4,lineHeight:1.5 }}>• {s}</div>)}</div>}
                {feedback.improvements?.filter(Boolean).length>0&&<div style={{ padding:'12px 14px',background:'var(--amber-bg)',borderRadius:12,border:'1px solid rgba(245,158,11,.2)' }}><div style={{ fontSize:11,fontWeight:800,color:'#92400e',marginBottom:6,textTransform:'uppercase' }}>↑ Improve</div>{feedback.improvements.filter(Boolean).map((s,i)=><div key={i} style={{ fontSize:12,color:'#78350f',marginTop:4,lineHeight:1.5 }}>• {s}</div>)}</div>}
              </div>
              {feedback.explanation&&<div style={{ padding:'12px 14px',background:'var(--surf)',border:'1px solid var(--border2)',borderRadius:12,fontSize:13,color:'var(--t2)',lineHeight:1.7 }}><strong>💡 Ideal: </strong>{feedback.explanation}</div>}
              {feedback.rubric&&(
                <div style={{ background:'var(--surf)',borderRadius:12,border:'1px solid var(--border)',padding:'14px 16px' }}>
                  <div style={{ fontSize:11,fontWeight:800,color:'var(--t3)',marginBottom:10,textTransform:'uppercase',letterSpacing:'.5px' }}>Skill Rubric</div>
                  <div style={{ display:'grid',gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',gap:10 }}>
                    {[['Technical','technical','#4f46e5'],['Communication','communication','#10b981'],['Structure','structure','#f59e0b'],['Confidence','confidence','#ec4899']].map(([label,key,color])=>(
                      <div key={key}>
                        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:3 }}>
                          <span style={{ fontSize:11,color:'var(--t3)',fontWeight:600 }}>{label}</span>
                          <span style={{ fontSize:11,fontWeight:800,color }}>{feedback.rubric[key]}/10</span>
                        </div>
                        <div style={{ height:5,borderRadius:99,background:'var(--border)',overflow:'hidden' }}>
                          <div style={{ width:`${(feedback.rubric[key]||0)*10}%`,height:'100%',background:color,borderRadius:99 }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {feedback.tags?.length>0&&<div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>{feedback.tags.map(t=><span key={t} className="pill pill-p">{t}</span>)}</div>}
              <div style={{ display:'flex',gap:10 }}>
                <button className="btn-outline" onClick={onRetry} style={{ flex:1,gap:6,borderRadius:11 }}><RefreshCw size={13}/>Retry</button>
                <button className="btn-primary" onClick={onNext} disabled={fetchingNext} style={{ flex:2,gap:7,borderRadius:11,fontSize:14 }}>
                  {fetchingNext?<><Loader size={14} className="spin-anim"/>ARIA is preparing your next question…</>:currentQ+1>=totalQ?<>📊 View Report</>:<>Next Question <ChevronRight size={14}/></>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div style={{ overflowY:'auto',padding:'20px 18px',background:'var(--surf2)',borderLeft:'1px solid var(--border)',display:'flex',flexDirection:'column',gap:16 }}>
          <div style={{ background:'var(--surf)',borderRadius:16,padding:'18px',border:'1px solid var(--border)',textAlign:'center' }}>
            <div style={{ fontSize:11,fontWeight:800,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:10 }}>{feedback?'Score':'Session Avg'}</div>
            <div style={{ display:'flex',justifyContent:'center' }}>
              <ScoreRing score={feedback?feedback.score:sessionAvg} size={160} animated label={feedback?"THIS Q":"AVG"}/>
            </div>
          </div>
          {answered>0&&(
            <div style={{ background:'var(--surf)',borderRadius:14,padding:'14px 16px',border:'1px solid var(--border)' }}>
              <div style={{ fontSize:11,fontWeight:800,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10 }}>Score History</div>
              <div style={{ display:'flex',gap:5,alignItems:'flex-end' }}>
                {Array.from({length:totalQ}).map((_,i)=>{
                  const s=scores[i]; const isActive=i===currentQ;
                  const color=s!=null?(s>=8?'var(--green)':s>=6?'#f59e0b':'var(--red)'):isActive?mode.color:'var(--border)';
                  return <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}>
                    {s!=null&&<span style={{ fontSize:9,fontWeight:800,color }}>{s.toFixed(1)}</span>}
                    <div style={{ width:'100%',height:s!=null?`${Math.max(4,s*5.5)}px`:'4px',background:color,borderRadius:'4px 4px 0 0',minHeight:4,transition:'height .6s cubic-bezier(.34,1.56,.64,1)' }}/>
                    <span style={{ fontSize:9,color:'var(--t4)' }}>Q{i+1}</span>
                  </div>;
                })}
              </div>
            </div>
          )}
          <div style={{ background:'var(--surf)',borderRadius:14,padding:'14px 16px',border:'1px solid var(--border)' }}>
            <div style={{ fontSize:11,fontWeight:800,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10 }}>Session</div>
            {[{label:'Progress',val:`${answered}/${totalQ}`},{label:'Average',val:sessionAvg>0?`${sessionAvg.toFixed(1)}/10`:'—',color:sessionAvg>=7?'var(--green)':sessionAvg>=5?'var(--amber)':'var(--red)'},{label:'Time',val:fmtTime(totalTimer)}].map(s=>(
              <div key={s.label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:12,color:'var(--t3)',fontWeight:600 }}>{s.label}</span>
                <span style={{ fontSize:13,fontWeight:900,color:s.color||'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{s.val}</span>
              </div>
            ))}
          </div>
          <button onClick={onFinish} className="btn-outline" style={{ width:'100%',gap:7,fontSize:13,borderRadius:11 }}>
            <BarChart2 size={14}/> End & View Report
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function InterviewPage() {
  const navigate = useNavigate();
  const { config, updateConfig, session, startSession, appendQuestion, addAnswer, completeSession } = useApp();

  const [phase, setPhase]         = useState('setup');
  const [currentQ, setCurrentQ]   = useState(0);
  const [answer, setAnswer]       = useState('');
  const [feedback, setFeedback]   = useState(null);
  const [fbLoading, setFbLoading] = useState(false);
  const [fetchingNext, setFetchingNext] = useState(false);
  const [scores, setScores]       = useState([]);
  const [qTimer, setQTimer]       = useState(0);
  const [totalTimer, setTotal]    = useState(0);
  const [recording, setRec]       = useState(false);
  const [timeWarning, setTW]      = useState(false);
  const [codeLang, setCodeLang]   = useState('javascript');
  const [testResults, setTestResults] = useState([]);
  const [problem, setProblem]     = useState(null);
  const [problems, setProblems]   = useState([]);

  const qRef    = useRef(null);
  const totRef  = useRef(null);
  const recRef  = useRef(null);
  const autoRef = useRef(false);

  const isAdaptive = config.adaptive && !config.codeMode && ADAPTIVE_MODES.includes(config.mode);
  const focus = useFocusMonitor(phase === 'active');

  // Total timer
  useEffect(() => {
    if (phase==='active') { totRef.current=setInterval(()=>setTotal(t=>t+1),1000); }
    else clearInterval(totRef.current);
    return ()=>clearInterval(totRef.current);
  }, [phase]);

  // Per-Q timer
  useEffect(() => {
    if (phase!=='active') return;
    setQTimer(0); autoRef.current=false; setTW(false);
    clearInterval(qRef.current);
    if (!feedback) qRef.current=setInterval(()=>setQTimer(t=>t+1),1000);
    return ()=>clearInterval(qRef.current);
  }, [currentQ, phase, feedback]);

  // Timed mode
  useEffect(() => {
    if (!config.timedMode||phase!=='active'||feedback||autoRef.current) return;
    const limit = TIME_LIMITS[config.mode]||180;
    const rem = limit - qTimer;
    setTW(rem<=30&&rem>0);
    if (rem<=0) {
      autoRef.current=true; clearInterval(qRef.current);
      setAnswer(prev=>{ const a=prev.trim()||'[No answer — time ran out]'; setTimeout(()=>doSubmit(a),50); return a; });
    }
  }, [qTimer]);

  // Init code template when problem loads
  useEffect(() => {
    if (problem && !answer) setAnswer(problem.startCode?.[codeLang]||'');
  }, [problem, codeLang]);

  async function handleStart() {
    setPhase('loading');
    focus.reset();
    try {
      if (config.codeMode && config.mode==='technical') {
        // Generate multiple coding problems
        const count = config.questionCount;
        const generated = [];
        for (let i=0;i<count;i++) {
          const p = await interviewApi.codingQuestion({...config, index:i}).then(r=>r.problem);
          generated.push(p);
        }
        setProblems(generated);
        setProblem(generated[0]);
        setAnswer(generated[0]?.startCode?.[codeLang]||'');
        startSession(generated.map(p=>({question:p.title, hints:p.hints||[]})));
        setCurrentQ(0); setScores([]); setFeedback(null); setTestResults([]);
        setPhase('active');
      } else {
        // Adaptive mode only pre-generates the FIRST question — the
        // rest are requested one at a time as the candidate answers
        // (see handleNext), calibrated to their rolling performance.
        const initialCount = isAdaptive ? 1 : config.questionCount;
        const qs = await interviewApi.generateQuestions({...config, questionCount:initialCount}).then(r=>r.questions);
        startSession(qs);
        setCurrentQ(0); setScores([]); setFeedback(null); setAnswer('');
        setPhase('active');
      }
    } catch {
      setPhase('setup');
    }
  }

  async function doSubmit(ans) {
    const finalAns = ans ?? answer;
    if (!finalAns.trim()||fbLoading) return;
    clearInterval(qRef.current);
    setFbLoading(true);
    try {
      let fb;
      if (config.codeMode && problem) {
        const allTC = problem.testCases;
        const results = runTestCases(finalAns, codeLang, allTC);
        setTestResults(results.filter((_,i)=>!allTC[i].hidden));
        fb = await interviewApi.evaluateCode(finalAns, problem, results, codeLang).then(r=>r.result);
      } else {
        const q = session.questions[currentQ];
        fb = await interviewApi.feedback(q?.question||'', finalAns, config.mode, config.difficulty).then(r=>r.feedback);
      }
      setFeedback(fb);
      setScores(p=>{ const n=[...p]; n[currentQ]=fb.score; return n; });
      addAnswer({question:config.codeMode?problem?.title:session.questions[currentQ]?.question||'', answer:finalAns, feedback:fb, timeSpent:qTimer});
    } catch {
      const fb={score:5,strengths:['Attempted'],improvements:['Check your solution'],explanation:'',tags:[],testsPassed:0,testsTotal:0};
      setFeedback(fb);
      setScores(p=>{ const n=[...p]; n[currentQ]=5; return n; });
    } finally { setFbLoading(false); }
  }

  async function handleNext() {
    const next = currentQ+1;
    if (next>=config.questionCount) { handleFinish(); return; }

    if (isAdaptive && next>=session.questions.length) {
      setFetchingNext(true);
      try {
        const history = session.timeline.map(t=>({question:t.question, score:t.feedback?.score||0}));
        const q = await interviewApi.nextQuestion(config, history).then(r=>r.question);
        appendQuestion(q);
      } catch {
        appendQuestion({ question:'Tell me about a technical challenge you solved recently and how you approached it.', hints:[] });
      } finally { setFetchingNext(false); }
    } else if (next>=session.questions.length) {
      handleFinish(); return;
    }

    setCurrentQ(next);
    if (config.codeMode && problems[next]) {
      setProblem(problems[next]);
      setAnswer(problems[next].startCode?.[codeLang]||'');
    } else { setAnswer(''); }
    setFeedback(null); setTestResults([]); setQTimer(0); autoRef.current=false;
  }

  async function handleFinish() {
    clearInterval(qRef.current); clearInterval(totRef.current);
    setPhase('finishing');
    const focusStats = { focusScore: focus.focusScore, tabSwitches: focus.tabSwitches, pasteEvents: focus.pasteEvents, idleEvents: focus.idleEvents };
    try {
      await completeSession(session.timeline, focusStats);
    } catch {
      // completeSession already has its own fallback path server-side;
      // if the request itself fails (backend unreachable) there's
      // nothing meaningful to show, so just head to the report page,
      // which handles a missing report gracefully.
    }
    navigate('/report');
  }

  function toggleRec() {
    if (recording) { recRef.current?.stop(); setRec(false); return; }
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if (!SR) { alert('Voice dictation is not supported in this browser — try Chrome or Edge.'); return; }
    const r=new SR(); r.continuous=true; r.interimResults=false;
    r.onresult=e=>{ let t=''; for(let i=e.resultIndex;i<e.results.length;i++) if(e.results[i].isFinal) t+=e.results[i][0].transcript+' '; setAnswer(p=>p+t); focus.registerInput(); };
    r.onerror=()=>setRec(false); r.onend=()=>setRec(false);
    recRef.current=r; r.start(); setRec(true);
  }

  const sessionAvg = scores.filter(s=>s!=null).length
    ? scores.filter(s=>s!=null).reduce((a,b)=>a+b,0)/scores.filter(s=>s!=null).length
    : 0;

  if (phase==='setup') return <SetupPage config={config} updateConfig={updateConfig} onStart={handleStart} loading={false}/>;
  if (phase==='loading'||phase==='finishing') return (
    <div style={{ minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:60,height:60,border:'3px solid var(--border)',borderTopColor:'var(--p)',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 20px' }}/>
        <div style={{ fontSize:18,fontWeight:800,color:'var(--text)',fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          {phase==='loading'?'ARIA is preparing your questions…':'Analyzing your performance…'}
        </div>
        <div style={{ fontSize:13,color:'var(--t3)',marginTop:6 }}>Powered by Groq</div>
      </div>
    </div>
  );

  if (config.codeMode && problem && phase==='active') {
    return <CodeInterview problem={problem} config={config} feedback={feedback} feedbackLoading={fbLoading}
      qTimer={qTimer} totalTimer={totalTimer} timeWarning={timeWarning}
      scores={scores} currentQ={currentQ} totalQ={config.questionCount}
      codeLang={codeLang} setCodeLang={setCodeLang}
      answer={answer} setAnswer={setAnswer}
      onRun={()=>{ const r=runTestCases(answer,codeLang,problem.testCases.filter(tc=>!tc.hidden)); setTestResults(r); }}
      onSubmit={()=>doSubmit()}
      onNext={handleNext} onRetry={()=>{setFeedback(null);setTestResults([]);setQTimer(0);autoRef.current=false;clearInterval(qRef.current);qRef.current=setInterval(()=>setQTimer(t=>t+1),1000);}}
      testResults={testResults} setTestResults={setTestResults}
      runLoading={fbLoading} sessionAvg={sessionAvg} onFinish={handleFinish}
      onPasteAnswer={focus.registerPaste} onInputActivity={focus.registerInput}
    />;
  }

  return <TextInterview session={session} config={config} currentQ={currentQ} totalQ={config.questionCount}
    scores={scores} qTimer={qTimer} totalTimer={totalTimer} timeWarning={timeWarning}
    answer={answer} setAnswer={setAnswer}
    feedback={feedback} feedbackLoading={fbLoading} fetchingNext={fetchingNext}
    recording={recording} onSubmit={()=>doSubmit()} onNext={handleNext}
    onRetry={()=>{setFeedback(null);setAnswer('');setQTimer(0);autoRef.current=false;clearInterval(qRef.current);qRef.current=setInterval(()=>setQTimer(t=>t+1),1000);}}
    onToggleRecording={toggleRec} onFinish={handleFinish}
    onPasteAnswer={focus.registerPaste} onInputActivity={focus.registerInput}
  />;
}
