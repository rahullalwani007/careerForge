import React, { useRef } from 'react';
import { Download, X, Printer } from 'lucide-react';

// Deterministic, non-cryptographic short code so the same
// name+date+score always produces the same-looking certificate
// (purely cosmetic "verification code" — this is a practice
// certificate, not a legal credential, and the component says so).
function verificationCode(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = (h * 31 + seed.charCodeAt(i)) >>> 0; }
  return 'CF-' + h.toString(36).toUpperCase().slice(0, 6);
}

export default function CertificateModal({ name, roleTitle, score, kind = 'Interview Readiness', onClose }) {
  const svgRef = useRef(null);
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const code = verificationCode(`${name}|${roleTitle}|${score}|${dateStr}`);
  const W = 900, H = 620;

  function download() {
    const svgEl = svgRef.current;
    const serialized = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = W * 2; canvas.height = H * 2; // 2x for crisper export
      const ctx = canvas.getContext('2d');
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(url);
      const link = document.createElement('a');
      link.download = `CareerForge-${kind.replace(/\s+/g, '-')}-Certificate.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,15,35,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: 940, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 10 }}>
          <button onClick={download} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: '#fff', color: '#1e1b4b', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            <Download size={14} /> Download PNG
          </button>
          <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.1)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            <Printer size={14} /> Print
          </button>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.1)', color: '#fff', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.45)' }}>
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', background: '#fbf8f1' }}>
            <rect width={W} height={H} fill="#fbf8f1" />
            <rect x={18} y={18} width={W - 36} height={H - 36} fill="none" stroke="#c7bfa3" strokeWidth={2} />
            <rect x={30} y={30} width={W - 60} height={H - 60} fill="none" stroke="#4f46e5" strokeWidth={1.5} />

            {/* Corner flourishes */}
            {[[46, 46], [W - 46, 46], [46, H - 46], [W - 46, H - 46]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={4} fill="#c99a3a" />
            ))}

            {/* Header */}
            <text x={W / 2} y={100} textAnchor="middle" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize={15} fontWeight={800} letterSpacing="3" fill="#4f46e5">CAREERFORGE AI</text>
            <text x={W / 2} y={158} textAnchor="middle" fontFamily="Georgia, serif" fontSize={40} fontWeight={700} fill="#1e1b4b">Certificate of {kind}</text>
            <line x1={W / 2 - 140} y1={182} x2={W / 2 + 140} y2={182} stroke="#c99a3a" strokeWidth={2} />

            <text x={W / 2} y={232} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize={14} fill="#57534e">This certifies that</text>
            <text x={W / 2} y={288} textAnchor="middle" fontFamily="Georgia, serif" fontSize={34} fontWeight={700} fill="#1e1b4b">{name || 'Candidate'}</text>

            <text x={W / 2} y={334} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize={14.5} fill="#57534e">
              has demonstrated {kind.toLowerCase()} for the role of
            </text>
            <text x={W / 2} y={366} textAnchor="middle" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize={20} fontWeight={800} fill="#4f46e5">
              {roleTitle || 'Software Engineer'}
            </text>

            {/* Score badge */}
            <circle cx={W / 2} cy={452} r={54} fill="#fff" stroke="#c99a3a" strokeWidth={3} />
            <text x={W / 2} y={444} textAnchor="middle" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize={34} fontWeight={900} fill="#1e1b4b">{score}</text>
            <text x={W / 2} y={468} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize={11} fill="#78716c">SCORE</text>

            <text x={W / 2} y={534} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize={12} fill="#78716c">Issued {dateStr} · Practice credential, not a professional certification</text>

            <text x={70} y={H - 56} fontFamily="'JetBrains Mono', monospace" fontSize={11} fill="#a8a29e">Verification code</text>
            <text x={70} y={H - 38} fontFamily="'JetBrains Mono', monospace" fontSize={13} fontWeight={700} fill="#57534e">{code}</text>

            <text x={W - 70} y={H - 38} textAnchor="end" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize={13} fontWeight={800} fill="#4f46e5">ARIA · AI Interview Coach</text>
          </svg>
        </div>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.6)', fontSize: 12, marginTop: 12 }}>
          A fun way to mark progress — this is a practice credential from your own sessions, not an accredited certification.
        </p>
      </div>
    </div>
  );
}
