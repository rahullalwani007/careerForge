import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { notesApi, interviewApi } from '../services/api';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { Plus, Search, Trash2, Tag, Link2, Save, Sparkles, X, FileText,
         ChevronLeft, Eye, Edit3, Clock, Loader, BookOpen, AlignLeft } from 'lucide-react';

const NOTE_COLORS = ['#4f46e5','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];

function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('# ')) return <h2 key={i} style={{ fontSize:18, fontWeight:800, color:'var(--text)', margin:'16px 0 8px' }}>{line.slice(2)}</h2>;
    if (line.startsWith('## ')) return <h3 key={i} style={{ fontSize:15, fontWeight:700, color:'var(--text)', margin:'14px 0 6px' }}>{line.slice(3)}</h3>;
    if (line.startsWith('• ') || line.startsWith('- ')) return <div key={i} style={{ display:'flex', gap:8, fontSize:14, color:'var(--t2)', marginBottom:4, paddingLeft:4 }}><span style={{color:'var(--p)',flexShrink:0}}>•</span><span>{line.slice(2)}</span></div>;
    if (line.startsWith('Q: ')) return <div key={i} style={{ fontWeight:700, color:'var(--text)', fontSize:13, marginTop:10, marginBottom:2 }}>❓ {line.slice(3)}</div>;
    if (line.startsWith('A: ')) return <div key={i} style={{ color:'var(--t2)', fontSize:13, paddingLeft:16, marginBottom:6 }}>✅ {line.slice(3)}</div>;
    if (line.trim() === '') return <div key={i} style={{ height:8 }} />;
    return <p key={i} style={{ fontSize:14, color:'var(--t2)', lineHeight:1.7, margin:'2px 0' }}>{line}</p>;
  });
}

function NoteCard({ note, active, onClick, onDelete }) {
  const [hover, setHover] = useState(false);
  const preview = note.content?.replace(/[#*]/g, '').trim().substring(0, 80) || 'No content';
  const date = new Date(note.updatedAt || note.createdAt);
  const dateStr = date.toLocaleDateString('en-IN', { day:'numeric', month:'short' });

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding:'13px 14px', borderRadius:12, cursor:'pointer',
        background: active ? 'var(--p-bg)' : hover ? 'var(--surf2)' : 'transparent',
        border: `1.5px solid ${active ? 'var(--border3)' : hover ? 'var(--border2)' : 'transparent'}`,
        transition:'all .15s', marginBottom:4, position:'relative',
      }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:5 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, flex:1, minWidth:0 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:note.color||'var(--p)', flexShrink:0 }} />
          <span style={{ fontSize:13, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {note.title || 'Untitled'}
          </span>
        </div>
        {hover && (
          <button onClick={e=>{e.stopPropagation();onDelete(note.id);}}
            style={{ background:'none', border:'none', cursor:'pointer', padding:3, color:'var(--red)', opacity:.7, flexShrink:0 }}>
            <Trash2 size={12} />
          </button>
        )}
      </div>
      <div style={{ fontSize:12, color:'var(--t3)', lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{preview}</div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:6 }}>
        <div style={{ display:'flex', gap:4 }}>
          {(note.tags||[]).slice(0,3).map(t=>(
            <span key={t} style={{ padding:'1px 6px', borderRadius:99, fontSize:10, fontWeight:600, background:'var(--surf3)', color:'var(--t3)', border:'1px solid var(--border)' }}>{t}</span>
          ))}
        </div>
        <span style={{ fontSize:10, color:'var(--t4)' }}>{dateStr}</span>
      </div>
    </div>
  );
}

export default function NotesPage() {
  const { addToast } = useApp();
  const { isMobile } = useBreakpoint();
  const [notes, setNotes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [view, setView] = useState('edit'); // edit | preview
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPanel, setAiPanel] = useState(null); // null | 'summarize' | 'flashcard'
  const [aiContent, setAiContent] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const saveTimer = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    notesApi.list().then(r => setNotes(r.notes)).catch(() => addToast('Could not load notes — is the backend running?', 'error'));
    interviewApi.listSessions().then(r => setSessions(r.sessions.slice(0, 10))).catch(() => {});
  }, []);

  const activeNote = notes.find(n => n.id === activeId) || null;

  const filteredNotes = notes.filter(n => {
    const q = search.toLowerCase();
    const matchSearch = !q || n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q) || n.tags?.some(t=>t.toLowerCase().includes(q));
    const matchTag = !filterTag || n.tags?.includes(filterTag);
    return matchSearch && matchTag;
  });

  const allTags = [...new Set(notes.flatMap(n=>n.tags||[]))].filter(Boolean);

  // Update local state immediately (snappy UI), sync to backend right after.
  function updateNote(field, value) {
    if (!activeNote) return;
    setNotes(ns => ns.map(n => n.id === activeNote.id ? { ...n, [field]: value, updatedAt: new Date().toISOString() } : n));
    notesApi.update(activeNote.id, { [field]: value }).catch(() => addToast('Could not save that change', 'error'));
    setHasUnsaved(false);
  }

  function handleContentChange(val) {
    if (!activeNote) return;
    setHasUnsaved(true);
    setNotes(ns => ns.map(n => n.id === activeNote.id ? { ...n, content: val } : n));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      notesApi.update(activeNote.id, { content: val }).catch(() => {});
      setHasUnsaved(false);
    }, 1500);
  }

  async function handleNewNote() {
    try {
      const { note } = await notesApi.create({ title:'New Note', content:'', tags:[], color:'#4f46e5' });
      setNotes(ns => [note, ...ns]);
      setActiveId(note.id);
      setTimeout(() => textRef.current?.focus(), 100);
    } catch { addToast('Could not create note — is the backend running?', 'error'); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this note?')) return;
    try {
      await notesApi.remove(id);
      setNotes(ns => ns.filter(n => n.id !== id));
      if (activeId === id) setActiveId(notes.find(n=>n.id!==id)?.id || null);
      addToast('Note deleted', 'info');
    } catch { addToast('Could not delete note', 'error'); }
  }

  async function handleAI(task) {
    if (!activeNote?.content?.trim()) { addToast('Write some content first!','error'); return; }
    setAiLoading(true); setAiPanel(null); setAiContent('');
    try {
      const { result } = await notesApi.ai(task, activeNote.content);
      if (task === 'enhance') {
        updateNote('content', result);
        addToast('✨ Note enhanced by AI!', 'success');
      } else {
        setAiContent(result); setAiPanel(task);
      }
    } catch { addToast('AI enhancement failed. Is the backend running?', 'error'); }
    finally { setAiLoading(false); }
  }

  function addTag() {
    if (!newTag.trim() || !activeNote) return;
    const tags = [...new Set([...(activeNote.tags||[]), newTag.trim().toLowerCase()])];
    updateNote('tags', tags);
    setNewTag('');
  }

  function removeTag(tag) {
    if (!activeNote) return;
    updateNote('tags', (activeNote.tags||[]).filter(t=>t!==tag));
  }

  // Word count
  const wordCount = activeNote?.content?.trim().split(/\s+/).filter(Boolean).length || 0;

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', paddingTop:64, display:'flex' }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: isMobile ? '100%' : 280, flexShrink:0, borderRight: isMobile ? 'none' : '1px solid var(--border)',
        background:'var(--surf)', display: (isMobile && activeId) ? 'none' : 'flex', flexDirection:'column',
        height:'calc(100vh - 64px)', position: isMobile ? 'static' : 'sticky', top:64, overflowY:'auto',
      }}>
        {/* Header */}
        <div style={{ padding:'16px 14px 12px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <h2 style={{ fontSize:16, fontWeight:800, color:'var(--text)', margin:0, display:'flex', alignItems:'center', gap:7 }}>
              <BookOpen size={16} style={{ color:'var(--p)' }} /> Notes
              <span style={{ fontSize:12, fontWeight:600, color:'var(--t3)', marginLeft:2 }}>({notes.length})</span>
            </h2>
            <button onClick={handleNewNote} className="btn-primary" style={{ padding:'6px 10px', fontSize:12, gap:4, borderRadius:9 }}>
              <Plus size={13} /> New
            </button>
          </div>
          <div style={{ position:'relative' }}>
            <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--t3)' }} />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search notes…"
              style={{ width:'100%', padding:'7px 10px 7px 30px', borderRadius:9, border:'1px solid var(--border2)', background:'var(--surf2)', color:'var(--text)', fontSize:12, outline:'none', boxSizing:'border-box' }} />
          </div>
          {allTags.length>0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:8 }}>
              <button onClick={()=>setFilterTag('')}
                style={{ padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:700, background:!filterTag?'var(--p)':'var(--surf3)', color:!filterTag?'#fff':'var(--t3)', border:'1px solid var(--border)', cursor:'pointer' }}>
                All
              </button>
              {allTags.map(t=>(
                <button key={t} onClick={()=>setFilterTag(t===filterTag?'':t)}
                  style={{ padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:700, background:filterTag===t?'var(--p)':'var(--surf3)', color:filterTag===t?'#fff':'var(--t3)', border:'1px solid var(--border)', cursor:'pointer' }}>
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Note list */}
        <div style={{ flex:1, padding:'8px', overflowY:'auto' }}>
          {filteredNotes.length===0 ? (
            <div style={{ textAlign:'center', padding:'32px 16px', color:'var(--t3)' }}>
              <FileText size={32} style={{ margin:'0 auto 10px', opacity:.4 }} />
              <div style={{ fontSize:13, fontWeight:600 }}>No notes yet</div>
              <div style={{ fontSize:12, marginTop:4 }}>Click "+ New" to create one</div>
            </div>
          ) : filteredNotes.map(n=>(
            <NoteCard key={n.id} note={n} active={activeId===n.id}
              onClick={()=>setActiveId(n.id)}
              onDelete={handleDelete} />
          ))}
        </div>
      </div>

      {/* ── Editor ── */}
      <div style={{ flex:1, display: (isMobile && !activeNote) ? 'none' : 'flex', flexDirection:'column', minHeight:'calc(100vh - 64px)', overflow:'hidden' }}>
        {!activeNote ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, color:'var(--t3)', padding:40 }}>
            <div style={{ width:72, height:72, borderRadius:18, background:'var(--p-bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FileText size={32} style={{ color:'var(--p)' }} />
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Select a note or create one</div>
              <div style={{ fontSize:14, color:'var(--t3)', maxWidth:320 }}>Your notes are saved locally. Use AI to enhance, summarize, or create flashcards.</div>
            </div>
            <button onClick={handleNewNote} className="btn-primary" style={{ gap:7, fontSize:14 }}>
              <Plus size={15} /> Create First Note
            </button>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--border)', background:'var(--surf)', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', flexShrink:0 }}>
              {isMobile && (
                <button onClick={()=>setActiveId(null)} style={{ background:'none', border:'none', cursor:'pointer', padding:6, display:'flex', color:'var(--t2)', flexShrink:0 }} aria-label="Back to notes">
                  <ChevronLeft size={20} />
                </button>
              )}
              {/* Title */}
              <input
                value={activeNote.title||''}
                onChange={e=>updateNote('title',e.target.value)}
                placeholder="Note title…"
                style={{ flex:1, minWidth:180, fontSize:16, fontWeight:800, background:'none', border:'none', color:'var(--text)', outline:'none', fontFamily:'inherit' }}
              />

              {/* Color picker */}
              <div style={{ position:'relative' }}>
                <button onClick={()=>setShowColorPicker(p=>!p)}
                  style={{ width:24, height:24, borderRadius:'50%', background:activeNote.color||'#4f46e5', border:'2px solid var(--border)', cursor:'pointer', transition:'transform .15s' }}
                  onMouseEnter={e=>e.currentTarget.style.transform='scale(1.15)'}
                  onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'} />
                {showColorPicker && (
                  <div style={{ position:'absolute', top:32, right:0, background:'var(--surf)', border:'1px solid var(--border)', borderRadius:12, padding:8, display:'flex', flexWrap:'wrap', gap:5, width:120, zIndex:10, boxShadow:'var(--shadow-md)' }}>
                    {NOTE_COLORS.map(c=>(
                      <div key={c} onClick={()=>{updateNote('color',c);setShowColorPicker(false);}}
                        style={{ width:22, height:22, borderRadius:'50%', background:c, cursor:'pointer', border:`2px solid ${activeNote.color===c?'white':'transparent'}`, boxShadow:activeNote.color===c?`0 0 0 2px ${c}`:'none', transition:'transform .15s' }}
                        onMouseEnter={e=>e.currentTarget.style.transform='scale(1.2)'}
                        onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'} />
                    ))}
                  </div>
                )}
              </div>

              {/* View toggle */}
              <div style={{ display:'flex', background:'var(--surf2)', borderRadius:8, border:'1px solid var(--border)', overflow:'hidden' }}>
                <button onClick={()=>setView('edit')} style={{ padding:'5px 10px', border:'none', background:view==='edit'?'var(--p)':'transparent', color:view==='edit'?'#fff':'var(--t3)', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4, transition:'all .15s' }}>
                  <Edit3 size={12} /> Edit
                </button>
                <button onClick={()=>setView('preview')} style={{ padding:'5px 10px', border:'none', background:view==='preview'?'var(--p)':'transparent', color:view==='preview'?'#fff':'var(--t3)', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4, transition:'all .15s' }}>
                  <Eye size={12} /> Preview
                </button>
              </div>

              {/* AI buttons */}
              <div style={{ display:'flex', gap:6 }}>
                {[
                  { task:'enhance',   label:'✨ Enhance',   tip:'AI rewrites and structures your notes' },
                  { task:'summarize', label:'📋 Summary',   tip:'3-5 bullet summary' },
                  { task:'flashcard', label:'🃏 Flashcards', tip:'5 Q&A pairs' },
                ].map(({ task, label, tip }) => (
                  <button key={task} onClick={()=>handleAI(task)} disabled={aiLoading}
                    title={tip}
                    style={{ padding:'5px 10px', borderRadius:8, border:'1px solid var(--border2)', background:'var(--surf)', color:'var(--t2)', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4, transition:'all .15s', opacity:aiLoading?.5:1 }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--p3)';e.currentTarget.style.color='var(--p)';}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.color='var(--t2)';}}>
                    {aiLoading?<Loader size={11} className="spin-anim"/>:null}{label}
                  </button>
                ))}
              </div>

              {/* Save indicator */}
              <div style={{ fontSize:11, color:hasUnsaved?'var(--amber)':'var(--green)', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                {hasUnsaved ? <><Clock size={10}/>Saving…</> : <><Save size={10}/>Saved</>}
              </div>
            </div>

            {/* Tags bar */}
            <div style={{ padding:'8px 20px', borderBottom:'1px solid var(--border)', background:'var(--surf2)', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', flexShrink:0 }}>
              <Tag size={12} style={{ color:'var(--t3)' }} />
              {(activeNote.tags||[]).map(t=>(
                <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:99, background:'var(--p-bg)', border:'1px solid var(--border3)', fontSize:11, fontWeight:700, color:'var(--p)' }}>
                  {t}
                  <button onClick={()=>removeTag(t)} style={{ background:'none', border:'none', cursor:'pointer', padding:0, color:'var(--p)', display:'flex' }}><X size={9}/></button>
                </span>
              ))}
              <input value={newTag} onChange={e=>setNewTag(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addTag();}}
                placeholder="+ add tag" style={{ border:'none', background:'none', fontSize:11, color:'var(--t3)', outline:'none', maxWidth:100 }} />
            </div>

            {/* Editor body */}
            <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
              {view==='edit' ? (
                <textarea
                  key={activeId}
                  ref={textRef}
                  defaultValue={activeNote.content||''}
                  onChange={e=>handleContentChange(e.target.value)}
                  placeholder={`Start writing…\n\nTips:\n# Heading\n## Subheading\n• Bullet point\n**bold text**`}
                  style={{ flex:1, width:'100%', padding:'20px 28px', background:'var(--surf)', color:'var(--text)', fontSize:14, lineHeight:1.8, fontFamily:'inherit', border:'none', outline:'none', resize:'none', boxSizing:'border-box' }}
                />
              ) : (
                <div style={{ flex:1, padding:'20px 28px', overflowY:'auto', background:'var(--surf)' }}>
                  {activeNote.content ? renderMarkdown(activeNote.content) : <p style={{ color:'var(--t4)', fontStyle:'italic' }}>Nothing to preview yet.</p>}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding:'8px 20px', borderTop:'1px solid var(--border)', background:'var(--surf2)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <span style={{ fontSize:11, color:'var(--t3)' }}>
                {wordCount} words · Last updated {new Date(activeNote.updatedAt||activeNote.createdAt).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'})}
              </span>
              {sessions.length>0 && (
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <Link2 size={11} style={{ color:'var(--t3)' }} />
                  <select
                    value={activeNote.linkedSessionId||''}
                    onChange={e=>updateNote('linkedSessionId',e.target.value||null)}
                    style={{ fontSize:11, color:'var(--t3)', background:'none', border:'none', cursor:'pointer', outline:'none' }}>
                    <option value="">Link to session…</option>
                    {sessions.map(s=>(
                      <option key={s.id} value={s.id}>{s.mode} · {s.averageScore}/10 · {new Date(s.date).toLocaleDateString()}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* AI result panel */}
      {aiPanel && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }} onClick={()=>setAiPanel(null)}>
          <div className="card" style={{ maxWidth:600, width:'100%', maxHeight:'80vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ fontSize:16, fontWeight:800, color:'var(--text)', margin:0 }}>
                {aiPanel==='summarize'?'📋 AI Summary':'🃏 Flashcards'}
              </h3>
              <button onClick={()=>setAiPanel(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--t3)' }}><X size={16}/></button>
            </div>
            <div style={{ background:'var(--surf2)', borderRadius:12, padding:16, border:'1px solid var(--border)' }}>
              {renderMarkdown(aiContent)}
            </div>
            <div style={{ display:'flex', gap:10, marginTop:14 }}>
              <button onClick={()=>{ navigator.clipboard.writeText(aiContent); addToast('Copied!','success'); }}
                style={{ flex:1 }} className="btn-outline">Copy</button>
              <button onClick={()=>{ if(activeNote){ updateNote('content', (activeNote.content||'')+'\n\n---\n'+aiContent); addToast('Appended to note','success'); } setAiPanel(null); }}
                className="btn-primary" style={{ flex:1 }}>Append to Note</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
