import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Brain, X, Send, Loader, Sparkles, ArrowRight, Trash2 } from 'lucide-react';
import { chatApi } from '../services/api';
import { shouldShowTip } from '../services/storage';
import { calculateStreak } from '../utils/sessionStats';
import { useBreakpoint } from '../hooks/useBreakpoint';

const NAV_MAP = [
  { keywords:['placement drive', 'drive simulator', 'full drive'], to:'/placement-drive', label:'Placement Drive' },
  { keywords:['group discussion', 'gd round', 'gd simulator'],     to:'/group-discussion', label:'Group Discussion' },
  { keywords:['job','career','hiring','apply'],         to:'/careers',     label:'Browse Jobs' },
  { keywords:['practice','interview','start practice'], to:'/interview',   label:'Start Practice' },
  { keywords:['skill assessment','skill test','assessment'], to:'/skill-assessment', label:'Skill Assessment' },
  { keywords:['note','notes','write'],                  to:'/notes',       label:'Open Notes' },
  { keywords:['report','score','result'],               to:'/report',      label:'View Report' },
  { keywords:['learn','video','youtube','study'],       to:'/learn',       label:'Learning Hub' },
  { keywords:['dashboard','home','overview'],           to:'/dashboard',   label:'Dashboard' },
  { keywords:['profile','settings','account'],          to:'/profile',     label:'My Profile' },
  { keywords:['career path','roadmap'],                 to:'/career-path', label:'Career Path' },
  { keywords:['resume','ats','cv'],                     to:'/resume',      label:'Resume Analyzer' },
];

const CHIPS = [
  "How's my progress?",
  "Start a placement drive",
  "Tips for next interview",
  "Show me job openings",
];

function detectNav(text) {
  const lower = text.toLowerCase();
  return NAV_MAP.find(n => n.keywords.some(k => lower.includes(k)));
}

export default function AIAssistant() {
  /* ── ALL HOOKS MUST COME FIRST — NO EARLY RETURNS BEFORE THIS ── */
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user, careerPath, sessionHistory } = useApp();
  const { isMobile } = useBreakpoint();

  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [badge,    setBadge]    = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  // Auto-scroll — MUST be before any conditional return
  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

  // Load prior chat history from the backend, then show a proactive
  // tip if this is a fresh conversation — MUST be before any
  // conditional return (rules of hooks).
  useEffect(() => {
    if (!user) return;
    chatApi.history().then(({ messages: hist }) => {
      setHistoryLoaded(true);
      if (hist?.length) { setMessages(hist); return; }
      if (!shouldShowTip()) return;
      const streak = calculateStreak(sessionHistory);
      const lastScore = sessionHistory[0]?.averageScore;
      const name = user.name?.split(' ')[0] || 'there';
      let tip = `Hey ${name}! 👋 `;
      if (streak > 1) tip += `You're on a ${streak}-day streak 🔥 `;
      if (careerPath) {
        tip += `Readiness for **${careerPath.targetRole}**: ${careerPath.readinessPercent || 0}%. `;
        if (lastScore) tip += `Last score: ${lastScore}/10. `;
        const gap = (careerPath.skillGaps || [])[0];
        if (gap) tip += `Focus on: **${gap}**.`;
      } else {
        tip += `Complete onboarding to get your personalized career path!`;
      }
      tip += `\n\nWhat would you like to work on today?`;
      setMessages([{ role:'assistant', content:tip, ts:Date.now() }]);
      setBadge(true);
    }).catch(() => setHistoryLoaded(true));
  }, [user]); // re-runs when user becomes available

  /* ── NOW conditional returns are safe (all hooks already called) ── */
  if (location.pathname === '/auth') return null;
  if (!user) return null;

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    const userMsg = { role:'user', content:text, ts:Date.now() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);
    setBadge(false);
    try {
      const { reply } = await chatApi.send(newMsgs.map(m=>({role:m.role,content:m.content})), location.pathname);
      setMessages([...newMsgs, { role:'assistant', content:reply, ts:Date.now() }]);
    } catch {
      setMessages([...newMsgs, { role:'assistant', content:"Connection issue reaching ARIA — is the backend server running?", ts:Date.now() }]);
    } finally { setLoading(false); }
  }

  function clearChat() {
    chatApi.clear().catch(() => {});
    setMessages([]);
  }

  function fmt(text) {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j}>{p.slice(2,-2)}</strong>
            : p
        )}
        {i < text.split('\n').length - 1 && <br/>}
      </span>
    ));
  }

  /* ── Render ── */
  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setBadge(false); setTimeout(()=>inputRef.current?.focus(),150); }}
          title="ARIA — AI Career Coach"
          style={{ position:'fixed', bottom:24, right:24, zIndex:999, width:56, height:56, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(79,70,229,.55)', transition:'transform .2s,box-shadow .2s' }}
          onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.1)';e.currentTarget.style.boxShadow='0 6px 28px rgba(79,70,229,.7)';}}
          onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 4px 20px rgba(79,70,229,.55)';}}
        >
          <Brain size={23} color="#fff" />
          {badge && (
            <div style={{ position:'absolute', top:-2, right:-2, width:18, height:18, borderRadius:'50%', background:'#ef4444', border:'2.5px solid white', fontSize:9, fontWeight:900, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>1</div>
          )}
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{
          position:'fixed', zIndex:999, borderRadius: isMobile ? 16 : 20, background:'var(--surf)',
          border:'1px solid var(--border)', boxShadow:'0 20px 60px rgba(0,0,0,.25)', display:'flex',
          flexDirection:'column', overflow:'hidden', animation:'slideIn .35s cubic-bezier(.34,1.56,.64,1)',
          ...(isMobile
            ? { bottom:12, right:12, left:12, top:12, width:'auto', height:'auto' }
            : { bottom:24, right:24, width:385, height:550 }),
        }}>
          
          {/* Header */}
          <div style={{ padding:'13px 16px', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34,height:34,borderRadius:'50%',background:'rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Brain size={17} color="#fff"/>
              </div>
              <div>
                <div style={{ fontSize:14,fontWeight:800,color:'#fff' }}>ARIA</div>
                <div style={{ display:'flex',alignItems:'center',gap:4,fontSize:11,color:'rgba(255,255,255,.8)' }}>
                  <div style={{ width:6,height:6,borderRadius:'50%',background:'#34d399' }} className="pulse-dot"/>
                  Always ready to help
                </div>
              </div>
            </div>
            <div style={{ display:'flex',gap:6 }}>
              {messages.length>0 && (
                <button onClick={clearChat} title="Clear chat"
                  style={{ background:'rgba(255,255,255,.15)',border:'none',borderRadius:7,width:28,height:28,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <Trash2 size={13} color="#fff"/>
                </button>
              )}
              <button onClick={()=>setOpen(false)}
                style={{ background:'rgba(255,255,255,.15)',border:'none',borderRadius:7,width:28,height:28,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <X size={14} color="#fff"/>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex:1,overflowY:'auto',padding:'14px 14px 8px',display:'flex',flexDirection:'column',gap:12 }}>
            {messages.length === 0 && (
              <div style={{ textAlign:'center',paddingTop:28 }}>
                <div style={{ fontSize:36,marginBottom:10 }}>🤖</div>
                <div style={{ fontSize:14,fontWeight:800,color:'var(--text)',marginBottom:6 }}>Hi! I'm ARIA</div>
                <div style={{ fontSize:13,color:'var(--t3)',lineHeight:1.6 }}>Ask me anything about interview prep, your scores, or say "go to notes" to navigate!</div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ display:'flex', flexDirection:msg.role==='user'?'row-reverse':'row', gap:8, alignItems:'flex-end' }}>
                {msg.role==='assistant' && (
                  <div style={{ width:26,height:26,borderRadius:'50%',background:'var(--p-bg)',border:'1.5px solid var(--border3)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <Sparkles size={12} style={{ color:'var(--p)' }}/>
                  </div>
                )}
                <div>
                  <div style={{ maxWidth:'85%', padding:'10px 13px', borderRadius:msg.role==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px', background:msg.role==='user'?'linear-gradient(135deg,#4f46e5,#6366f1)':'var(--surf2)', color:msg.role==='user'?'#fff':'var(--text)', border:msg.role==='user'?'none':'1px solid var(--border)', fontSize:13, lineHeight:1.6 }}>
                    {fmt(msg.content)}
                  </div>
                  {msg.role === 'assistant' && (() => {
                    const nav = detectNav(msg.content);
                    return nav ? (
                      <button onClick={() => { navigate(nav.to); setOpen(false); }}
                        style={{ marginTop:5, display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:99, background:'var(--p-bg)', border:'1px solid var(--border3)', color:'var(--p)', fontSize:11, fontWeight:700, cursor:'pointer', transition:'all .15s' }}
                        onMouseEnter={e=>{e.currentTarget.style.background='var(--p-bg2)';}}
                        onMouseLeave={e=>{e.currentTarget.style.background='var(--p-bg)';}}>
                        <ArrowRight size={10}/> {nav.label}
                      </button>
                    ) : null;
                  })()}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display:'flex',gap:8,alignItems:'flex-end' }}>
                <div style={{ width:26,height:26,borderRadius:'50%',background:'var(--p-bg)',border:'1.5px solid var(--border3)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <Sparkles size={12} style={{ color:'var(--p)' }}/>
                </div>
                <div style={{ padding:'10px 14px',borderRadius:'16px 16px 16px 4px',background:'var(--surf2)',border:'1px solid var(--border)' }}>
                  <div style={{ display:'flex',gap:4 }}>
                    {[0,1,2].map(i=><div key={i} style={{ width:6,height:6,borderRadius:'50%',background:'var(--p3)',animation:`pulse-dot 1.4s ${i*0.2}s ease-in-out infinite` }}/>)}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>

          {/* Quick chips */}
          {messages.filter(m=>m.role==='user').length === 0 && (
            <div style={{ padding:'4px 12px 8px',display:'flex',gap:5,flexWrap:'wrap',flexShrink:0 }}>
              {CHIPS.map(c => (
                <button key={c} onClick={()=>sendMessage(c)}
                  style={{ padding:'4px 10px',borderRadius:99,background:'var(--p-bg)',border:'1px solid var(--border3)',color:'var(--p)',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',transition:'all .15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='var(--p-bg2)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='var(--p-bg)';}}>
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding:'10px 12px',borderTop:'1px solid var(--border)',display:'flex',gap:8,flexShrink:0 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage(input);} }}
              placeholder="Ask anything or say 'go to notes'…"
              style={{ flex:1,padding:'9px 14px',borderRadius:99,border:'1.5px solid var(--border2)',background:'var(--surf2)',color:'var(--text)',fontSize:13,outline:'none',fontFamily:'inherit',transition:'border .15s' }}
              onFocus={e=>e.target.style.borderColor='var(--p3)'}
              onBlur={e=>e.target.style.borderColor='var(--border2)'}
            />
            <button onClick={()=>sendMessage(input)} disabled={!input.trim()||loading}
              style={{ width:38,height:38,borderRadius:'50%',background:input.trim()?'linear-gradient(135deg,#4f46e5,#6366f1)':'var(--surf3)',border:'none',cursor:input.trim()?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .2s' }}>
              {loading ? <Loader size={14} className="spin-anim" style={{color:'#fff'}}/> : <Send size={14} color={input.trim()?'#fff':'var(--t3)'}/>}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
