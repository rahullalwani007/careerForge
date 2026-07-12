import React, { useState, useEffect } from 'react';

// A small, dependency-free radar/spider chart. Values are 0-100.
// Used for two different "skill breakdowns" in the app: the
// per-interview rubric (technical/communication/structure/
// confidence) and the Skill Assessment Center's category scores
// (DSA/OOP/DBMS/...) — same visual language, different data.
export default function SkillRadarChart({ data, size = 260, color = '#4f46e5', animated = true }) {
  const [progress, setProgress] = useState(animated ? 0 : 1);

  useEffect(() => {
    if (!animated) { setProgress(1); return; }
    setProgress(0);
    const t = setTimeout(() => setProgress(1), 50);
    return () => clearTimeout(t);
  }, [animated, JSON.stringify(data.map(d => d.value))]);

  const n = data.length;
  if (n < 3) return null;

  const cx = size / 2, cy = size / 2;
  const maxR = size * 0.34;
  const labelR = size * 0.46;
  const angleFor = i => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pointFor = (i, r) => {
    const a = angleFor(i);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  const rings = [0.25, 0.5, 0.75, 1];
  const dataPoints = data.map((d, i) => pointFor(i, maxR * (Math.max(0, Math.min(100, d.value)) / 100) * progress));
  const polygonPath = dataPoints.map(p => p.join(',')).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
      {/* Background grid rings */}
      {rings.map(r => {
        const ringPts = data.map((_, i) => pointFor(i, maxR * r).join(',')).join(' ');
        return <polygon key={r} points={ringPts} fill="none" stroke="var(--border)" strokeWidth={1} />;
      })}
      {/* Axis spokes */}
      {data.map((_, i) => {
        const [x, y] = pointFor(i, maxR);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth={1} />;
      })}
      {/* Data polygon */}
      <polygon points={polygonPath} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={2.5}
        style={{ transition: 'all 1s cubic-bezier(.34,1.56,.64,1)' }} />
      {/* Data vertices */}
      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.5} fill={color} style={{ transition: 'all 1s cubic-bezier(.34,1.56,.64,1)' }} />
      ))}
      {/* Labels */}
      {data.map((d, i) => {
        const [lx, ly] = pointFor(i, labelR);
        const anchor = Math.abs(lx - cx) < 4 ? 'middle' : lx > cx ? 'start' : 'end';
        return (
          <g key={d.label}>
            <text x={lx} y={ly - 4} textAnchor={anchor} fontSize={11} fontWeight={700} fill="var(--t2)" fontFamily="Inter, sans-serif">
              {d.label}
            </text>
            <text x={lx} y={ly + 10} textAnchor={anchor} fontSize={12} fontWeight={900} fill={color} fontFamily="'Plus Jakarta Sans', sans-serif">
              {Math.round(d.value)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}
