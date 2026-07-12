import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { notesApi } from '../services/api';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { X, Save, ExternalLink, FileText } from 'lucide-react';

export default function QuickNote({ onClose }) {
  const { addToast } = useApp();
  const { isMobile } = useBreakpoint();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const textRef = useRef(null);

  useEffect(() => { textRef.current?.focus(); }, []);

  async function handleSave() {
    if (!content.trim() && !title.trim()) return null;
    setSaving(true);
    try {
      const { note } = await notesApi.create({ title: title || 'Quick Note', content, tags: ['quick'], color: '#4f46e5' });
      setSaved(true);
      addToast('📝 Note saved!', 'success');
      setTimeout(onClose, 1200);
      return note;
    } catch {
      addToast('Could not save note — is the backend running?', 'error');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndOpen() {
    await handleSave();
    navigate('/notes');
  }

  return (
    <div style={{
      position:'fixed', zIndex:998, borderRadius:18,
      background:'var(--surf)', border:'1.5px solid var(--border)',
      boxShadow:'0 16px 48px rgba(0,0,0,.2)',
      animation:'slideIn .3s cubic-bezier(.34,1.56,.64,1)',
      overflow:'hidden',
      ...(isMobile
        ? { bottom:80, right:12, left:12, width:'auto' }
        : { bottom:90, right:24, width:340 }),
    }}>
      {/* Header */}
      <div style={{ padding:'12px 16px', background:'var(--p-bg)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <FileText size={15} style={{ color:'var(--p)' }} />
          <span style={{ fontSize:13, fontWeight:800, color:'var(--p)' }}>Quick Note</span>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', padding:3, borderRadius:6, color:'var(--t3)', display:'flex' }}>
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding:'14px 16px' }}>
        <input
          value={title}
          onChange={e=>setTitle(e.target.value)}
          placeholder="Note title (optional)"
          style={{ width:'100%', padding:'7px 10px', marginBottom:8, borderRadius:8, border:'1px solid var(--border2)', background:'var(--surf2)', color:'var(--text)', fontSize:12, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
          onFocus={e=>e.target.style.borderColor='var(--p3)'}
          onBlur={e=>e.target.style.borderColor='var(--border2)'}
        />
        <textarea
          ref={textRef}
          value={content}
          onChange={e=>setContent(e.target.value)}
          placeholder="Jot down anything… interview tips, concepts, questions to revisit…"
          style={{ width:'100%', minHeight:120, padding:'9px 10px', borderRadius:8, border:'1px solid var(--border2)', background:'var(--surf2)', color:'var(--text)', fontSize:13, fontFamily:'inherit', outline:'none', resize:'vertical', lineHeight:1.6, boxSizing:'border-box', transition:'border .15s' }}
          onFocus={e=>e.target.style.borderColor='var(--p3)'}
          onBlur={e=>e.target.style.borderColor='var(--border2)'}
          onKeyDown={e=>{ if(e.key==='Enter'&&e.ctrlKey) handleSave(); }}
        />
        <div style={{ fontSize:11, color:'var(--t4)', marginTop:4 }}>Ctrl+Enter to save</div>
      </div>

      {/* Footer */}
      <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)', display:'flex', gap:8 }}>
        <button onClick={handleSaveAndOpen}
          style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'1px solid var(--border2)', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12, color:'var(--t2)', fontWeight:600, transition:'all .15s' }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--p3)';e.currentTarget.style.color='var(--p)';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.color='var(--t2)';}}>
          <ExternalLink size={12} /> Open in Notes
        </button>
        <button onClick={handleSave} disabled={(!content.trim()&&!title.trim())||saving||saved}
          className="btn-primary" style={{ flex:1, fontSize:13, padding:'8px', gap:6 }}>
          {saved ? '✓ Saved!' : <><Save size={13}/> Save Note</>}
        </button>
      </div>
    </div>
  );
}
