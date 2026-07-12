import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { validateResumeFile, extractTextFromFile } from '../services/pdfParser';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { TARGET_ROLES, EXPERIENCE_LEVELS, INTERVIEW_MODES, BADGES } from '../services/mockData';
import {
  User, Mail, Briefcase, MapPin, Globe, Github, Linkedin, Upload,
  Edit3, CheckCircle, X, Plus, Award, BarChart2, Target, TrendingUp,
  Calendar, Star, Loader, AlertCircle, Camera, LogOut
} from 'lucide-react';

function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>{label}</div>
      </div>
    </div>
  );
}

function SkillTag({ skill, onRemove, editing }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: 'var(--p-bg)', border: '1px solid #c7d2fe', fontSize: 12, fontWeight: 600, color: 'var(--p)' }}>
      {skill}
      {editing && onRemove && (
        <button onClick={() => onRemove(skill)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--p)', lineHeight: 1 }}>
          <X size={11} />
        </button>
      )}
    </span>
  );
}

export default function ProfilePage() {
  const { user, profile, updateProfile, careerPath, config, logout, updateConfig, sessionHistory, unlockedBadges } = useApp();
  const { isMobile } = useBreakpoint();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [newSkill, setNewSkill] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const sessions = sessionHistory;

  // Initialize form from profile + user
  useEffect(() => {
    setForm({
      name: profile?.name || user?.name || '',
      email: profile?.email || user?.email || '',
      location: profile?.location || '',
      bio: profile?.bio || '',
      targetRole: profile?.targetRole || careerPath?.targetRole || config.roleTitle || '',
      experience: profile?.level || careerPath?.currentLevel || '',
      skills: profile?.skills || [],
      github: profile?.github || '',
      linkedin: profile?.linkedin || '',
      website: profile?.website || '',
      resumeFileName: profile?.resumeFileName || config.resumeFileName || '',
    });
  }, [profile, user, careerPath, config]);

  const displayProfile = { ...form, ...profile };
  const totalSessions = sessions.length;
  const avgScore = sessions.length ? (sessions.reduce((s, r) => s + (r.averageScore || 0), 0) / sessions.length).toFixed(1) : '—';
  const bestScore = sessions.length ? Math.max(...sessions.map(s => s.averageScore || 0)).toFixed(1) : '—';
  const modesAttempted = [...new Set(sessions.map(s => s.mode))].length;

  const experienceLabel = EXPERIENCE_LEVELS.find(l => l.id === displayProfile.experience)?.label || displayProfile.experience || 'Not set';
  const roleInfo = TARGET_ROLES.find(r => r.title === displayProfile.targetRole || r.id === config.roleId);

  async function handleResumeUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validateResumeFile(file);
    if (!check.valid) { setUploadMsg(`❌ ${check.error}`); return; }
    setUploading(true);
    setUploadMsg('Extracting text…');
    try {
      const text = await extractTextFromFile(file);
      updateConfig({ resumeText: text, resumeFileName: file.name });
      setForm(p => ({ ...p, resumeFileName: file.name }));
      await updateProfile({ ...form, resumeText: text, resumeFileName: file.name });
      setUploadMsg(`✅ Resume uploaded: ${file.name}`);
    } catch {
      setUploadMsg('❌ Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  }

  function addSkill() {
    const s = newSkill.trim();
    if (!s || form.skills.includes(s)) return;
    setForm(p => ({ ...p, skills: [...p.skills, s] }));
    setNewSkill('');
  }

  function removeSkill(skill) {
    setForm(p => ({ ...p, skills: p.skills.filter(s => s !== skill) }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile(form);
      updateConfig({ roleTitle: form.targetRole });
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  function handleCancel() {
    setForm({
      name: profile?.name || user?.name || '',
      email: profile?.email || user?.email || '',
      location: profile?.location || '',
      bio: profile?.bio || '',
      targetRole: profile?.targetRole || careerPath?.targetRole || config.roleTitle || '',
      experience: profile?.level || '',
      skills: profile?.skills || [],
      github: profile?.github || '',
      linkedin: profile?.linkedin || '',
      website: profile?.website || '',
      resumeFileName: profile?.resumeFileName || config.resumeFileName || '',
    });
    setEditing(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* Header card */}
        <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', border: 'none', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
          <div style={{ position: 'absolute', bottom: -30, left: -20, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, border: '3px solid rgba(255,255,255,.3)' }}>
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (displayProfile.name?.[0] || 'U').toUpperCase()}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>{displayProfile.name || 'Your Name'}</h1>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,.8)' }}>{displayProfile.email || user?.email}</div>
              {displayProfile.bio && <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginTop: 4, fontStyle: 'italic' }}>{displayProfile.bio}</div>}
              <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                {displayProfile.targetRole && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(255,255,255,.85)', background: 'rgba(255,255,255,.15)', padding: '3px 10px', borderRadius: 99 }}>
                    <Briefcase size={11} /> {displayProfile.targetRole}
                  </span>
                )}
                {displayProfile.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(255,255,255,.85)' }}>
                    <MapPin size={11} /> {displayProfile.location}
                  </span>
                )}
                {displayProfile.experience && (
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,.85)' }}>📊 {experienceLabel}</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {!editing && (
                <button onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, border: '1.5px solid rgba(255,255,255,.4)', background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                  <Edit3 size={13} /> Edit
                </button>
              )}
              <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: '1.5px solid rgba(255,255,255,.3)', background: 'rgba(255,0,0,.2)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
          <StatPill icon={BarChart2} label="Sessions" value={totalSessions} color="#4f46e5" />
          <StatPill icon={Star} label="Avg Score" value={avgScore !== '—' ? `${avgScore}/10` : '—'} color="#10b981" />
          <StatPill icon={Award} label="Best Score" value={bestScore !== '—' ? `${bestScore}/10` : '—'} color="#f59e0b" />
          <StatPill icon={Target} label="Modes Tried" value={`${modesAttempted}/4`} color="#3b82f6" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Basic Info */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}><User size={15} style={{ color: 'var(--p)' }} /> Basic Info</h2>
                {editing && <span style={{ fontSize: 11, color: 'var(--p)', fontWeight: 700 }}>EDITING</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Full Name', key: 'name', icon: User, placeholder: 'Your full name' },
                  { label: 'Email', key: 'email', icon: Mail, placeholder: 'Email address', type: 'email' },
                  { label: 'Location', key: 'location', icon: MapPin, placeholder: 'e.g. Hyderabad, India' },
                  { label: 'Bio', key: 'bio', icon: Edit3, placeholder: 'Short bio…', multi: true },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--t3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                      {field.label}
                    </label>
                    {editing ? (
                      field.multi ? (
                        <textarea value={form[field.key] || ''} onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))} placeholder={field.placeholder} style={{ width: '100%', minHeight: 70, padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg)', fontSize: 13, color: 'var(--text)', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.5 }} onFocus={e => e.target.style.borderColor = 'var(--p)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                      ) : (
                        <input type={field.type || 'text'} className="input" style={{ fontSize: 13 }} value={form[field.key] || ''} onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))} placeholder={field.placeholder} />
                      )
                    ) : (
                      <div style={{ fontSize: 13, color: form[field.key] ? 'var(--text)' : 'var(--t3)', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        {form[field.key] || `—`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Career Settings */}
            <div className="card">
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 7 }}><Briefcase size={15} style={{ color: 'var(--p)' }} /> Career Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--t3)', marginBottom: 4, textTransform: 'uppercase' }}>Target Role</label>
                  {editing ? (
                    <select className="input" style={{ fontSize: 13 }} value={form.targetRole} onChange={e => setForm(p => ({ ...p, targetRole: e.target.value }))}>
                      <option value="">— Select Role —</option>
                      {TARGET_ROLES.map(r => <option key={r.id} value={r.title}>{r.icon} {r.title}</option>)}
                    </select>
                  ) : (
                    <div style={{ fontSize: 13, color: form.targetRole ? 'var(--text)' : 'var(--t3)', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      {roleInfo ? `${roleInfo.icon} ${form.targetRole}` : form.targetRole || '—'}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--t3)', marginBottom: 4, textTransform: 'uppercase' }}>Experience Level</label>
                  {editing ? (
                    <select className="input" style={{ fontSize: 13 }} value={form.experience} onChange={e => setForm(p => ({ ...p, experience: e.target.value }))}>
                      <option value="">— Select —</option>
                      {EXPERIENCE_LEVELS.map(l => <option key={l.id} value={l.id}>{l.icon} {l.label} – {l.desc}</option>)}
                    </select>
                  ) : (
                    <div style={{ fontSize: 13, color: form.experience ? 'var(--text)' : 'var(--t3)', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      {EXPERIENCE_LEVELS.find(l => l.id === form.experience)?.label || form.experience || '—'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="card">
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 7 }}><Globe size={15} style={{ color: 'var(--p)' }} /> Social Links</h2>
              {[
                { key: 'github', icon: Github, label: 'GitHub', placeholder: 'github.com/username' },
                { key: 'linkedin', icon: Linkedin, label: 'LinkedIn', placeholder: 'linkedin.com/in/username' },
                { key: 'website', icon: Globe, label: 'Portfolio', placeholder: 'yourportfolio.dev' },
              ].map(f => (
                <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <f.icon size={15} style={{ color: 'var(--t3)', flexShrink: 0 }} />
                  {editing ? (
                    <input className="input" style={{ fontSize: 12, flex: 1 }} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                  ) : form[f.key] ? (
                    <a href={`https://${form[f.key].replace('https://', '')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--p)', textDecoration: 'none' }}>{form[f.key]}</a>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--t3)' }}>Not set</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Skills */}
            <div className="card">
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 7 }}>⚡ Skills</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: editing ? 12 : 0 }}>
                {(form.skills || []).length > 0 ? (
                  form.skills.map(s => <SkillTag key={s} skill={s} onRemove={removeSkill} editing={editing} />)
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>No skills added yet</p>
                )}
              </div>
              {editing && (
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <input className="input" style={{ fontSize: 13, flex: 1 }} value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Add skill (e.g. React, Python)" onKeyDown={e => e.key === 'Enter' && addSkill()} />
                  <button className="btn-primary" onClick={addSkill} style={{ padding: '0 14px', fontSize: 13 }}><Plus size={14} /></button>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="card">
              <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text)', margin:'0 0 14px', display:'flex', alignItems:'center', gap:7 }}>
                🏅 Achievements
                <span style={{ fontSize:11, color:'var(--t3)', fontWeight:600, marginLeft:'auto' }}>
                  {unlockedBadges.length}/{BADGES.length} unlocked
                </span>
              </h2>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap:8 }}>
                {BADGES.map(b => {
                  const unlocked = unlockedBadges.includes(b.id);
                  return (
                    <div key={b.id} title={`${b.name}: ${b.desc}`}
                      style={{ textAlign:'center', padding:'10px 6px', borderRadius:12, background:unlocked?`${b.color}12`:'var(--surf2)', border:`1px solid ${unlocked?b.color:'var(--border)'}`, opacity:unlocked?1:.5, position:'relative', transition:'all .2s' }}>
                      <div style={{ fontSize:22 }}>{b.emoji}</div>
                      <div style={{ fontSize:10, fontWeight:700, color:unlocked?b.color:'var(--t3)', marginTop:3, lineHeight:1.2 }}>{b.name}</div>
                      {!unlocked && <div style={{ position:'absolute', inset:0, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ fontSize:12 }}>🔒</span></div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resume */}
            <div className="card">
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 7 }}><Upload size={15} style={{ color: 'var(--p)' }} /> Resume</h2>
              {form.resumeFileName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', marginBottom: 12 }}>
                  <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>{form.resumeFileName}</div>
                    <div style={{ fontSize: 11, color: '#15803d' }}>Uploaded and parsed</div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '14px', background: 'var(--bg)', borderRadius: 10, border: '1px dashed var(--border)', marginBottom: 12, textAlign: 'center' }}>
                  <Upload size={20} style={{ color: 'var(--t3)', margin: '0 auto 6px' }} />
                  <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>No resume uploaded</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept=".pdf,.txt" style={{ display: 'none' }} onChange={handleResumeUpload} />
              <button
                className="btn-outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{ width: '100%', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {uploading ? <><Loader size={13} className="spin-anim" /> Processing…</> : <><Upload size={13} /> {form.resumeFileName ? 'Replace Resume' : 'Upload PDF/TXT'}</>}
              </button>
              {uploadMsg && (
                <div style={{ marginTop: 8, fontSize: 12, color: uploadMsg.startsWith('✅') ? '#10b981' : '#ef4444' }}>{uploadMsg}</div>
              )}
            </div>

            {/* Career Path Summary */}
            {careerPath && (
              <div className="card">
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 7 }}><Target size={15} style={{ color: 'var(--p)' }} /> Career Path</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{careerPath.targetRole}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--p)' }}>{careerPath.readinessPercent || 0}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: 'var(--border)', overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ width: `${careerPath.readinessPercent || 0}%`, height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, var(--p), #818cf8)' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--t3)' }}>
                  <span>⏱ {careerPath.estimatedTimeline}</span>
                  <span>•</span>
                  <span>💰 {careerPath.salaryRange}</span>
                </div>
                {careerPath.nextStep && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--p-bg)', borderRadius: 8, fontSize: 12, color: 'var(--p)', fontWeight: 600, border: '1px solid #c7d2fe' }}>
                    📍 Next: {careerPath.nextStep}
                  </div>
                )}
              </div>
            )}

            {/* Session history */}
            {sessions.length > 0 && (
              <div className="card">
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 7 }}><Calendar size={15} style={{ color: 'var(--p)' }} /> Session History</h2>
                {sessions.slice(0, 5).map((s, i) => {
                  const mode = INTERVIEW_MODES.find(m => m.id === s.mode) || INTERVIEW_MODES[0];
                  const sc = s.averageScore || 0;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ fontSize: 16 }}>{mode.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.role || mode.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--t3)' }}>{mode.label}</div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: sc >= 7.5 ? '#10b981' : sc >= 5 ? '#f59e0b' : '#ef4444', flexShrink: 0 }}>{sc.toFixed(1)}/10</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Save / Cancel */}
        {editing && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid var(--border)', padding: '12px 20px', display: 'flex', justifyContent: 'center', gap: 12, zIndex: 100 }}>
            <button className="btn-outline" onClick={handleCancel} style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}><X size={14} /> Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ fontSize: 14, minWidth: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {saving ? <><Loader size={14} className="spin-anim" /> Saving…</> : <><CheckCircle size={14} /> Save Changes</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
