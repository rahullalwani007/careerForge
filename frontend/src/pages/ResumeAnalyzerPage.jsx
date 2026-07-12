import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { validateResumeFile, extractTextFromFile } from '../services/pdfParser';
import { resumeApi } from '../services/api';
import { TARGET_ROLES } from '../services/mockData';
import { Upload, FileText, Loader, CheckCircle, AlertTriangle, Target, Star, Zap, RefreshCw, ClipboardList } from 'lucide-react';
import { useBreakpoint } from '../hooks/useBreakpoint';

function AnimatedBar({ value, color, delay=0 }) {
  const [w, setW] = React.useState(0);
  React.useEffect(() => { const t=setTimeout(()=>setW(value),200+delay); return()=>clearTimeout(t); },[value,delay]);
  return (
    <div style={{ height:10, borderRadius:99, background:'var(--border)', overflow:'hidden' }}>
      <div style={{ width:`${w}%`, height:'100%', background:color, borderRadius:99, transition:'width 1.2s cubic-bezier(.34,1.56,.64,1)' }} />
    </div>
  );
}

export default function ResumeAnalyzerPage() {
  const { config } = useApp();
  const { isMobile } = useBreakpoint();
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState(config.roleId || '');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadStep, setUploadStep] = useState(false);
  const fileRef = useRef(null);

  async function handleFile(f) {
    const v = validateResumeFile(f);
    if (!v.valid) { setError(v.error); return; }
    setFile(f); setError('');
    const text = await extractTextFromFile(f);
    setResumeText(text);
    setUploadStep(true);
  }

  async function handleAnalyze() {
    if (!resumeText) { setError('Please upload a resume first'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const role = TARGET_ROLES.find(r=>r.id===targetRole)?.title || targetRole || 'Software Engineer';
      const { result: r } = await resumeApi.analyze(resumeText, role, jobDescription.trim() || undefined);
      if (!r) throw new Error('Failed to parse response');
      setResult(r);
    } catch(e) { setError(e.message || 'Analysis failed. Is the backend server running?'); }
    finally { setLoading(false); }
  }

  const atsColor = result ? (result.atsScore>=80?'var(--green)':result.atsScore>=60?'#f59e0b':'var(--red)') : 'var(--p)';
  const atsGrade = result ? (result.atsScore>=90?'A+':result.atsScore>=80?'A':result.atsScore>=70?'B+':result.atsScore>=60?'B':'C') : '';

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', paddingTop:80 }}>
      <div style={{ maxWidth:860, margin:'0 auto', padding:'28px 20px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:26, fontWeight:900, color:'var(--text)', margin:'0 0 6px', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            📄 Resume Analyzer
          </h1>
          <p style={{ color:'var(--t3)', margin:0, fontSize:14 }}>AI-powered ATS scoring and improvement suggestions</p>
        </div>

        {/* Upload + config */}
        <div className="card" style={{ marginBottom:24 }}>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16, marginBottom:16 }}>
            {/* Upload */}
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--t3)', marginBottom:8, textTransform:'uppercase' }}>Resume (PDF or TXT)</label>
              <div
                onClick={()=>fileRef.current?.click()}
                onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}}
                onDragOver={e=>e.preventDefault()}
                style={{ border:`2px dashed ${file?'var(--green)':'var(--border2)'}`, borderRadius:14, padding:'20px', textAlign:'center', cursor:'pointer', background:file?'var(--green-bg)':'var(--surf2)', transition:'all .2s' }}>
                {file ? (
                  <div>
                    <CheckCircle size={24} style={{ color:'var(--green)', margin:'0 auto 6px' }} />
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--green)' }}>{file.name}</div>
                    <div style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>Click to replace</div>
                  </div>
                ) : (
                  <div>
                    <Upload size={28} style={{ color:'var(--t3)', margin:'0 auto 8px' }} />
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--t2)' }}>Drop PDF here or click to upload</div>
                    <div style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>Max 5MB · PDF or TXT</div>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.txt" style={{ display:'none' }} onChange={e=>e.target.files[0]&&handleFile(e.target.files[0])} />
            </div>

            {/* Role selector */}
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--t3)', marginBottom:8, textTransform:'uppercase' }}>Target Role</label>
              <select className="input" value={targetRole} onChange={e=>setTargetRole(e.target.value)}>
                <option value="">— Select role —</option>
                {TARGET_ROLES.map(r=><option key={r.id} value={r.id}>{r.icon} {r.title}</option>)}
              </select>
              <div style={{ marginTop:10, padding:'10px 12px', background:'var(--p-bg)', borderRadius:10, border:'1px solid var(--border3)', fontSize:12, color:'var(--p)', lineHeight:1.5 }}>
                💡 The analyzer will check if your resume matches keywords and expectations for this role.
              </div>
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700, color:'var(--t3)', marginBottom:8, textTransform:'uppercase' }}>
              <ClipboardList size={12}/> Job Description <span style={{ fontWeight:400, textTransform:'none' }}>(optional — for a JD match score)</span>
            </label>
            <textarea className="input" style={{ minHeight:90, resize:'vertical', fontFamily:'inherit', lineHeight:1.5, paddingTop:10 }}
              value={jobDescription} onChange={e=>setJobDescription(e.target.value)}
              placeholder="Paste a real job posting here and CareerForge AI will check which of its required keywords are missing from your resume…" />
          </div>

          {error && <div style={{ padding:'10px 14px', borderRadius:10, background:'var(--red-bg)', border:'1px solid rgba(239,68,68,.2)', fontSize:13, color:'var(--red)', marginBottom:12 }}>{error}</div>}

          <button className="btn-primary" onClick={handleAnalyze} disabled={loading||!file}
            style={{ width:'100%', fontSize:15, padding:'14px', gap:8 }}>
            {loading?<><Loader size={16} className="spin-anim"/>Analyzing Resume…</>:<><Zap size={15}/>Analyze Resume</>}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div style={{ animation:'fadeUp .6s ease' }}>
            {/* ATS Score hero */}
            <div style={{ background:'linear-gradient(135deg,#1e1b4b,#312e81)', borderRadius:20, padding:'28px 32px', marginBottom:22, display:'flex', alignItems:'center', gap:32, flexWrap:'wrap' }}>
              <div style={{ textAlign:'center', flexShrink:0 }}>
                <div style={{ position:'relative', width:100, height:100, margin:'0 auto' }}>
                  <svg width={100} height={100} style={{ transform:'rotate(-90deg)' }}>
                    <circle cx={50} cy={50} r={42} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth={10} />
                    <circle cx={50} cy={50} r={42} fill="none" stroke={atsColor} strokeWidth={10}
                      strokeDasharray={264} strokeDashoffset={264-(result.atsScore/100)*264}
                      style={{ transition:'stroke-dashoffset 1.5s ease', strokeLinecap:'round' }} />
                  </svg>
                  <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ fontSize:28, fontWeight:900, color:'#fff', lineHeight:1 }}>{result.atsScore}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,.7)' }}>ATS Score</div>
                    <div style={{ fontSize:20, fontWeight:900, color:atsColor }}>{atsGrade}</div>
                  </div>
                </div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,.8)', marginBottom:8 }}>Overall Assessment</div>
                <p style={{ color:'rgba(255,255,255,.9)', fontSize:15, lineHeight:1.7, margin:'0 0 16px' }}>{result.summary}</p>
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:10 }}>
                  {Object.entries(result.sections||{}).map(([k,v])=>(
                    <div key={k} style={{ textAlign:'center' }}>
                      <div style={{ fontSize:18, fontWeight:900, color:'#fff' }}>{v}%</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,.65)', textTransform:'capitalize' }}>{k}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Job Description Match */}
            {result.jdMatch && (
              <div className="card" style={{ marginBottom:20, border:'1.5px solid var(--border3)', background:'var(--p-bg)' }}>
                <h3 style={{ fontSize:15, fontWeight:800, color:'var(--p)', margin:'0 0 12px', display:'flex', alignItems:'center', gap:7 }}>
                  <Target size={15}/> Job Description Match
                  <span style={{ marginLeft:'auto', fontSize:22, fontWeight:900, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{result.jdMatch.matchPercent}%</span>
                </h3>
                <div style={{ height:8, borderRadius:99, background:'var(--border)', overflow:'hidden', marginBottom:12 }}>
                  <div style={{ width:`${result.jdMatch.matchPercent}%`, height:'100%', background:'linear-gradient(90deg,var(--p),#818cf8)', borderRadius:99, transition:'width 1s cubic-bezier(.34,1.56,.64,1)' }}/>
                </div>
                <p style={{ fontSize:12.5, color:'var(--t2)', margin:'0 0 10px' }}>
                  Matched <strong>{result.jdMatch.matchedCount}</strong> of <strong>{result.jdMatch.totalKeywords}</strong> distinct keywords from the posting. Missing keywords, ranked by how often they appear in the JD:
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {(result.jdMatch.missingKeywords||[]).map(k=>(
                    <span key={k} style={{ padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700, background:'var(--red-bg)', color:'var(--red)', border:'1px solid rgba(239,68,68,.15)' }}>{k}</span>
                  ))}
                  {(!result.jdMatch.missingKeywords||!result.jdMatch.missingKeywords.length)&&<span style={{ fontSize:12, color:'var(--green)', fontWeight:700 }}>✓ Great coverage — no major gaps found!</span>}
                </div>
              </div>
            )}

            {/* Section scores */}
            <div className="card" style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:15, fontWeight:800, color:'var(--text)', margin:'0 0 16px' }}>📊 Section Breakdown</h3>
              {Object.entries(result.sections||{}).map(([k,v],i)=>{
                const color = v>=80?'var(--green)':v>=60?'#f59e0b':'var(--red)';
                return (
                  <div key={k} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--text)', textTransform:'capitalize' }}>{k}</span>
                      <span style={{ fontSize:13, fontWeight:800, color }}>{v}%</span>
                    </div>
                    <AnimatedBar value={v} color={color} delay={i*100} />
                  </div>
                );
              })}
            </div>

            {/* Strengths & Missing */}
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:20, marginBottom:20 }}>
              <div className="card" style={{ background:'var(--green-bg)', border:'1.5px solid rgba(16,185,129,.2)' }}>
                <h3 style={{ fontSize:14, fontWeight:800, color:'#15803d', margin:'0 0 12px', display:'flex', alignItems:'center', gap:7 }}>
                  <CheckCircle size={14}/> Strengths
                </h3>
                {(result.strengths||[]).map((s,i)=>(
                  <div key={i} style={{ display:'flex', gap:7, fontSize:13, color:'#166534', marginTop:6 }}>
                    <span>✓</span><span>{s}</span>
                  </div>
                ))}
              </div>
              <div className="card" style={{ background:'var(--red-bg)', border:'1.5px solid rgba(239,68,68,.2)' }}>
                <h3 style={{ fontSize:14, fontWeight:800, color:'#dc2626', margin:'0 0 12px', display:'flex', alignItems:'center', gap:7 }}>
                  <AlertTriangle size={14}/> Missing
                </h3>
                {(result.missing||[]).map((s,i)=>(
                  <div key={i} style={{ display:'flex', gap:7, fontSize:13, color:'#991b1b', marginTop:6 }}>
                    <span>→</span><span>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bullet improvements */}
            {(result.improvements||[]).length>0 && (
              <div className="card">
                <h3 style={{ fontSize:15, fontWeight:800, color:'var(--text)', margin:'0 0 16px', display:'flex', alignItems:'center', gap:7 }}>
                  <Star size={15} style={{ color:'var(--amber)' }}/> Bullet Point Improvements
                </h3>
                {result.improvements.map((item,i)=>(
                  <div key={i} style={{ marginBottom:16, padding:'14px 16px', borderRadius:12, border:'1px solid var(--border)', background:'var(--surf2)' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--red)', textTransform:'uppercase', marginBottom:5 }}>Before</div>
                    <div style={{ fontSize:13, color:'var(--t2)', lineHeight:1.5, marginBottom:10, padding:'8px 12px', background:'var(--red-bg)', borderRadius:8, borderLeft:'3px solid var(--red)' }}>{item.original}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--green)', textTransform:'uppercase', marginBottom:5 }}>After ✨</div>
                    <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.5, padding:'8px 12px', background:'var(--green-bg)', borderRadius:8, borderLeft:'3px solid var(--green)' }}>{item.improved}</div>
                    <button onClick={()=>{navigator.clipboard.writeText(item.improved);}}
                      style={{ marginTop:8, fontSize:11, color:'var(--p)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
                      📋 Copy improved version
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop:20, textAlign:'center' }}>
              <button onClick={()=>setResult(null)} className="btn-outline" style={{ gap:7, fontSize:14 }}>
                <RefreshCw size={14} /> Analyze Another Resume
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
