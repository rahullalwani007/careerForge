import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { gdApi } from '../services/api';
import { useBreakpoint } from '../hooks/useBreakpoint';
import {
  Users, Send, Loader, Sparkles, RefreshCw, MessageSquare,
  TrendingUp, Award, ArrowRight, Mic2,
} from 'lucide-react';

const SUGGESTED_TOPICS = [
  'Should coding be mandatory in schools?',
  'Is work-from-home better than office work?',
  'Should social media verify user age?',
  '', // "Surprise me" — empty means let the AI pick
];

function Bubble({ msg, personas }) {
  if (msg.isUser) {
    return (
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
        <div style={{ maxWidth:'75%', padding:'11px 15px', borderRadius:'16px 16px 4px 16px', background:'linear-gradient(135deg,#4f46e5,#6366f1)', color:'#fff', fontSize:13.5, lineHeight:1.6 }}>
          {msg.text}
        </div>
      </div>
    );
  }
  const persona = personas.find(p => p.name === msg.speaker);
  return (
    <div style={{ display:'flex', gap:9, marginBottom:12, alignItems:'flex-start' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--surf3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
        {persona?.avatar || '🗣️'}
      </div>
      <div>
        <div style={{ fontSize:11, fontWeight:800, color:'var(--t3)', marginBottom:3 }}>{msg.speaker}</div>
        <div style={{ maxWidth:340, padding:'11px 15px', borderRadius:'4px 16px 16px 16px', background:'var(--surf2)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13.5, lineHeight:1.6 }}>
          {msg.text}
        </div>
      </div>
    </div>
  );
}

export default function GroupDiscussionPage() {
  const navigate = useNavigate();
  const { addToast, refreshBadges, refreshActivity, updateReadiness } = useApp();
  const { isMobile } = useBreakpoint();
  const [phase, setPhase] = useState('setup'); // setup | live | evaluating | results
  const [topicInput, setTopicInput] = useState('');
  const [scenario, setScenario] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior:'smooth' }); }, [transcript]);
  useEffect(() => { gdApi.history().then(r => setHistory(r.history)).catch(() => {}); }, []);

  const userTurns = transcript.filter(t => t.isUser).length;

  async function handleStart(topic) {
    setLoading(true);
    try {
      const { scenario: sc } = await gdApi.start(topic);
      setScenario(sc);
      setTranscript(sc.transcript);
      setPhase('live');
    } catch {
      addToast('Could not start the discussion — is the backend running?', 'error');
    } finally { setLoading(false); }
  }

  async function handleContribute() {
    if (!input.trim() || loading) return;
    const myMsg = input.trim();
    setInput('');
    setLoading(true);
    setTranscript(t => [...t, { speaker:'You', text:myMsg, isUser:true }]);
    try {
      const { transcript: updated } = await gdApi.respond(scenario.topic, scenario.personas, transcript, myMsg);
      setTranscript(updated);
    } catch {
      addToast('Could not reach ARIA — try again.', 'error');
    } finally { setLoading(false); }
  }

  async function handleEvaluate() {
    setPhase('evaluating');
    try {
      const { evaluation, newBadges } = await gdApi.evaluate(scenario.topic, transcript);
      setResult(evaluation);
      if (evaluation.score >= 7) updateReadiness(1);
      await Promise.all([refreshBadges(), refreshActivity()]);
      gdApi.history().then(r => setHistory(r.history)).catch(() => {});
      if (newBadges?.length) newBadges.forEach(id => addToast(`🏅 Badge Unlocked: ${id.replace(/_/g,' ')}!`, 'badge', 5000));
      setPhase('results');
    } catch {
      addToast('Could not evaluate — is the backend running?', 'error');
      setPhase('live');
    }
  }

  function reset() {
    setPhase('setup'); setScenario(null); setTranscript([]); setResult(null); setTopicInput('');
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', paddingTop:80 }}>
      <div style={{ maxWidth:820, margin:'0 auto', padding:'28px 20px 70px' }}>

        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:26, fontWeight:900, color:'var(--text)', margin:'0 0 6px', fontFamily:"'Plus Jakarta Sans',sans-serif", display:'flex', alignItems:'center', gap:10 }}>
            <Users size={24} style={{ color:'var(--p)' }}/> Group Discussion Simulator
          </h1>
          <p style={{ color:'var(--t3)', margin:0, fontSize:14 }}>
            Practice the round most interview-prep tools skip entirely. 4 AI participants, real disagreement, and a scorecard on initiative, articulation, listening — and whether you dominated or stayed silent.
          </p>
        </div>

        {phase==='setup' && (
          <div className="card">
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--t3)', marginBottom:10, textTransform:'uppercase', letterSpacing:'.5px' }}>Pick a topic, or let ARIA choose one</label>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:18 }}>
              {SUGGESTED_TOPICS.map((t,i)=>(
                <button key={i} onClick={()=>handleStart(t)} disabled={loading}
                  style={{ textAlign:'left', padding:'12px 16px', borderRadius:12, border:'1.5px solid var(--border)', background:'var(--surf)', cursor:'pointer', fontSize:13.5, color: t ? 'var(--text)' : 'var(--p)', fontWeight: t ? 500 : 700, transition:'all .15s' }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='var(--p3)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                  {t || '🎲 Surprise me with a topic'}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input className="input" value={topicInput} onChange={e=>setTopicInput(e.target.value)} placeholder="Or type your own topic…" style={{ flex:1 }}/>
              <button className="btn-primary" disabled={!topicInput.trim()||loading} onClick={()=>handleStart(topicInput)} style={{ gap:6, fontSize:13, padding:'0 16px' }}>
                {loading ? <Loader size={14} className="spin-anim"/> : <Sparkles size={14}/>} Start
              </button>
            </div>
          </div>
        )}

        {phase==='setup' && history.length > 0 && (
          <div className="card" style={{ marginTop:16 }}>
            <h3 style={{ fontSize:13, fontWeight:800, color:'var(--text)', margin:'0 0 12px', display:'flex', alignItems:'center', gap:7 }}>
              <MessageSquare size={14} style={{ color:'var(--p)' }}/> Recent Discussions
            </h3>
            {history.slice(0,5).map(h=>(
              <div key={h.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:800, background:h.score>=7?'var(--green-bg)':'var(--amber-bg)', color:h.score>=7?'var(--green)':'var(--amber)', flexShrink:0 }}>{h.score}/10</span>
                <span style={{ flex:1, fontSize:12.5, color:'var(--t2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.topic}</span>
                <span style={{ fontSize:11, color:'var(--t4)', flexShrink:0 }}>{new Date(h.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
              </div>
            ))}
          </div>
        )}

        {phase!=='setup' && scenario && (
          <>
            <div className="card" style={{ marginBottom:16, background:'var(--p-bg)', border:'1px solid var(--border3)' }}>
              <div style={{ fontSize:11, fontWeight:800, color:'var(--p)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Topic</div>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>{scenario.topic}</div>
              <div style={{ display:'flex', gap:10, marginTop:10, flexWrap:'wrap' }}>
                {scenario.personas.map(p=>(
                  <span key={p.name} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11.5, color:'var(--t3)', background:'var(--surf)', padding:'3px 9px', borderRadius:99, border:'1px solid var(--border)' }}>
                    {p.avatar} {p.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding:'20px', marginBottom:16, maxHeight:440, overflowY:'auto' }}>
              {transcript.map((m,i)=><Bubble key={i} msg={m} personas={scenario.personas}/>)}
              {loading && phase==='live' && (
                <div style={{ display:'flex', gap:6, padding:'8px 0' }}>
                  {[0,1,2].map(i=><div key={i} style={{ width:6,height:6,borderRadius:'50%',background:'var(--p3)',animation:`pulse-dot 1.4s ${i*0.2}s ease-in-out infinite` }}/>)}
                </div>
              )}
              <div ref={scrollRef}/>
            </div>

            {phase==='live' && (
              <>
                <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                  <input className="input" value={input} onChange={e=>setInput(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleContribute();} }}
                    placeholder="Jump into the discussion — build on, or push back on, someone's point…" disabled={loading} style={{ flex:1 }}/>
                  <button className="btn-primary" onClick={handleContribute} disabled={!input.trim()||loading} style={{ gap:6, padding:'0 16px' }}>
                    <Send size={14}/>
                  </button>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'var(--t3)' }}>{userTurns} contribution{userTurns===1?'':'s'} so far</span>
                  <button className="btn-outline" onClick={handleEvaluate} disabled={userTurns<1} style={{ fontSize:13, gap:6 }}>
                    <Award size={13}/> End Discussion & Get Scored
                  </button>
                </div>
              </>
            )}

            {phase==='evaluating' && (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <Loader size={22} className="spin-anim" style={{ color:'var(--p)' }}/>
                <p style={{ color:'var(--t3)', marginTop:10, fontSize:13 }}>ARIA is scoring your contributions…</p>
              </div>
            )}

            {phase==='results' && result && (
              <div style={{ animation:'fadeUp .5s ease' }}>
                <div style={{ background:'linear-gradient(135deg,#1e1b4b,#312e81)', borderRadius:18, padding:'26px 28px', marginBottom:18, display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:38, fontWeight:900, color:'#fff', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{result.score}/10</div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'inline-flex', padding:'4px 12px', borderRadius:99, background:'rgba(255,255,255,.15)', color:'#fff', fontSize:12.5, fontWeight:700, marginBottom:8 }}>
                      {result.verdict}
                    </div>
                    <p style={{ color:'rgba(255,255,255,.8)', fontSize:13, margin:0, lineHeight:1.6 }}>
                      Initiative {result.initiative}/10 · Articulation {result.articulation}/10 · Listening {result.listening}/10 · Assertiveness {result.assertiveness}/10
                    </p>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16, marginBottom:20 }}>
                  <div className="card" style={{ background:'var(--green-bg)' }}>
                    <div style={{ fontSize:12, fontWeight:800, color:'#15803d', marginBottom:8, textTransform:'uppercase' }}>✓ Strengths</div>
                    {result.strengths.map((s,i)=><div key={i} style={{ fontSize:12.5, color:'#166534', marginTop:4 }}>• {s}</div>)}
                  </div>
                  <div className="card" style={{ background:'var(--amber-bg)' }}>
                    <div style={{ fontSize:12, fontWeight:800, color:'#92400e', marginBottom:8, textTransform:'uppercase' }}>↑ Improve</div>
                    {result.improvements.map((s,i)=><div key={i} style={{ fontSize:12.5, color:'#78350f', marginTop:4 }}>• {s}</div>)}
                  </div>
                </div>

                <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                  <button className="btn-outline" onClick={()=>navigate('/dashboard')}>Dashboard</button>
                  <button className="btn-primary" onClick={reset} style={{ gap:7 }}><RefreshCw size={14}/> New Discussion</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
