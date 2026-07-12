import React, { useState } from 'react';
import { getActivityData } from '../utils/sessionStats';

export default function ActivityHeatmap({ sessions = [] }) {
  const data = getActivityData(sessions);
  const [tooltip, setTooltip] = useState(null);

  // Split into weeks (52 weeks × 7 days)
  const weeks = [];
  for (let i = 0; i < 52; i++) {
    weeks.push(data.slice(i * 7, i * 7 + 7));
  }

  const getColor = (count) => {
    if (count === 0) return 'var(--border)';
    if (count === 1) return '#c7d2fe';
    if (count === 2) return '#818cf8';
    return 'var(--p)';
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const today = new Date();
  const startDate = new Date(today); startDate.setDate(startDate.getDate() - 363);

  // Build month labels
  const monthLabels = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const d = new Date(startDate); d.setDate(d.getDate() + wi * 7);
    if (d.getMonth() !== lastMonth) {
      monthLabels.push({ idx: wi, label: months[d.getMonth()] });
      lastMonth = d.getMonth();
    }
  });

  const totalSessions = data.reduce((a, b) => a + b.count, 0);
  const activeDays = data.filter(d => d.count > 0).length;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 3, overflowX: 'auto', paddingBottom: 4 }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 16, marginRight: 2 }}>
          {['M','','W','','F','',''].map((d, i) => (
            <div key={i} style={{ fontSize: 9, color: 'var(--t4)', height: 12, lineHeight: '12px' }}>{d}</div>
          ))}
        </div>
        <div>
          {/* Month labels */}
          <div style={{ display: 'flex', marginBottom: 4, position: 'relative', height: 14 }}>
            {monthLabels.map(m => (
              <div key={m.idx} style={{ position: 'absolute', left: m.idx * 14, fontSize: 9, color: 'var(--t3)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {m.label}
              </div>
            ))}
          </div>
          {/* Grid */}
          <div style={{ display: 'flex', gap: 2 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    onMouseEnter={e => setTooltip({ x: e.clientX, y: e.clientY, day })}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      width: 12, height: 12, borderRadius: 3,
                      background: getColor(day.count),
                      cursor: day.count > 0 ? 'pointer' : 'default',
                      transition: 'transform .1s',
                      border: '1px solid rgba(0,0,0,.05)',
                    }}
                    onMouseOver={e => { e.currentTarget.style.transform='scale(1.3)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform='scale(1)'; }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--t3)' }}>{totalSessions} sessions · {activeDays} active days</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: 10, color: 'var(--t4)' }}>Less</span>
          {[0,1,2,3].map(n => (
            <div key={n} style={{ width: 10, height: 10, borderRadius: 2, background: getColor(n), border: '1px solid rgba(0,0,0,.05)' }} />
          ))}
          <span style={{ fontSize: 10, color: 'var(--t4)' }}>More</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{ position: 'fixed', top: tooltip.y - 48, left: tooltip.x - 60, background: 'var(--text)', color: 'var(--surf)', fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 8, pointerEvents: 'none', zIndex: 1000, whiteSpace: 'nowrap' }}>
          {tooltip.day.count} session{tooltip.day.count !== 1 ? 's' : ''} · {tooltip.day.date}
        </div>
      )}
    </div>
  );
}
