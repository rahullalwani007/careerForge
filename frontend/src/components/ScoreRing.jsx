import React, { useState, useEffect, useRef } from 'react';

export default function ScoreRing({ score = 0, max = 10, size = 160, animated = true, label = 'SCORE', showGrade = true }) {
  const [displayed, setDisplayed] = useState(animated ? 0 : score);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!animated) { setDisplayed(score); return; }
    const from = displayed;
    const to = score;
    const dur = 900;
    let start = null;
    function tick(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const ease = p >= 1 ? 1 : 1 - Math.pow(2, -10 * p) * Math.cos((p * 10 - 0.75) * (2 * Math.PI) / 3) * -1;
      setDisplayed(from + (to - from) * ease);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [score]);

  const stroke  = size * 0.09;
  const r       = (size - stroke) / 2;
  const circ    = 2 * Math.PI * r;
  const offset  = circ - (displayed / max) * circ;
  const color   = displayed >= 8 ? '#10b981' : displayed >= 6 ? '#f59e0b' : displayed >= 4 ? '#f97316' : '#ef4444';
  const grade   = score >= 9 ? 'A+' : score >= 8 ? 'A' : score >= 7 ? 'B+' : score >= 6 ? 'B' : score >= 5 ? 'C+' : score >= 3 ? 'C' : 'F';
  const cx = size / 2;

  return (
    <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', gap:6 }}>
      <div style={{ position:'relative', width:size, height:size }}>
        <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
          {/* Filled arc */}
          <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition:'stroke-dashoffset .9s cubic-bezier(.4,0,.2,1), stroke .4s ease' }}
          />
        </svg>
        {/* Center content */}
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:0 }}>
          <span style={{ fontSize:size*0.22, fontWeight:900, color, lineHeight:1, fontFamily:"'Plus Jakarta Sans',sans-serif", transition:'color .4s' }}>
            {displayed.toFixed(1)}
          </span>
          <span style={{ fontSize:size*0.07, color:'var(--t3)', fontWeight:600, marginTop:2 }}>/ {max}</span>
          {showGrade && score > 0 && (
            <span style={{ fontSize:size*0.14, fontWeight:900, color, marginTop:2, fontFamily:"'Plus Jakarta Sans',sans-serif", transition:'color .4s' }}>
              {grade}
            </span>
          )}
        </div>
      </div>
      {label && (
        <span style={{ fontSize:11, fontWeight:800, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em' }}>{label}</span>
      )}
    </div>
  );
}
