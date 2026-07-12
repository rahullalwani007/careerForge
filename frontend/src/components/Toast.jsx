import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, CheckCircle, AlertTriangle, Info, Award } from 'lucide-react';

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 10); }, []);

  const configs = {
    success: { bg:'var(--green-bg)', border:'rgba(16,185,129,.3)', icon:CheckCircle, color:'var(--green)' },
    error:   { bg:'var(--red-bg)',   border:'rgba(239,68,68,.3)',  icon:AlertTriangle, color:'var(--red)' },
    badge:   { bg:'var(--p-bg)',     border:'var(--border3)',      icon:Award,        color:'var(--p)' },
    info:    { bg:'var(--surf)',     border:'var(--border2)',      icon:Info,         color:'var(--t2)' },
  };
  const cfg = configs[toast.type] || configs.info;
  const Icon = cfg.icon;

  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:10,
      padding:'12px 16px', borderRadius:14,
      background:cfg.bg, border:`1.5px solid ${cfg.border}`,
      boxShadow:'0 8px 32px rgba(0,0,0,.15)',
      minWidth:280, maxWidth:360,
      transform:visible?'translateX(0)':'translateX(120%)',
      opacity:visible?1:0,
      transition:'all .4s cubic-bezier(.34,1.56,.64,1)',
    }}>
      <Icon size={16} style={{ color:cfg.color, flexShrink:0, marginTop:1 }} />
      <span style={{ fontSize:13, fontWeight:600, color:'var(--text)', flex:1, lineHeight:1.5 }}>{toast.msg}</span>
      <button onClick={()=>onRemove(toast.id)} style={{ background:'none', border:'none', cursor:'pointer', padding:2, color:'var(--t3)', flexShrink:0 }}>
        <X size={13} />
      </button>
    </div>
  );
}

export default function ToastManager() {
  const { toasts, removeToast } = useApp();
  if (!toasts.length) return null;
  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, display:'flex', flexDirection:'column', gap:8 }}>
      {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={removeToast} />)}
    </div>
  );
}
