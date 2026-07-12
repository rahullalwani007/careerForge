import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Upload, FileText, Sparkles, Target, CheckCircle, Loader, Brain, Zap, Star, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { extractTextFromFile, validateResumeFile } from '../services/pdfParser';
import { TARGET_ROLES, EXPERIENCE_LEVELS } from '../services/mockData';

const COMMON_SKILLS = [
  'Python','JavaScript','Java','C++','React','Node.js','SQL','Machine Learning',
  'Docker','AWS','Git','TypeScript','MongoDB','REST APIs','System Design','DSA',
  'TensorFlow','Kubernetes','PostgreSQL','Redis','GraphQL','Flutter','Swift','Go',
];

const STEPS = ['Target Role', 'Experience', 'Skills', 'Resume'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, careerPath, generateCareerPath, updateProfile, updateConfig } = useApp();

  const [step, setStep] = useState(0);
  const [targetRole, setTargetRole] = useState('');
  const [level, setLevel]           = useState('');
  const [skills, setSkills]         = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [uploading, setUploading]   = useState(false);
  const [uploadErr, setUploadErr]   = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState('');

  const toggleSkill = s => setSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const handleResumeUpload = useCallback(async e => {
    const f = e.target.files?.[0]; if (!f) return;
    const v = validateResumeFile(f);
    if (!v.valid) { setUploadErr(v.error); return; }
    setUploading(true); setUploadErr(''); setResumeFile(f);
    try {
      const text = await extractTextFromFile(f);
      setResumeText(text);
    } catch { setUploadErr('Failed to read file. Try a .txt file.'); setResumeFile(null); }
    finally { setUploading(false); }
  }, []);

  const handleGenerate = async () => {
    if (!targetRole) { setError('Please select a target role first.'); return; }
    if (!level)      { setError('Please select your experience level.'); return; }
    setGenerating(true); setError('');

    const role = TARGET_ROLES.find(r => r.id === targetRole);
    const roleTitle = role?.title || targetRole;
    try {
      await generateCareerPath({ targetRole: roleTitle, roleId: targetRole, currentLevel: level, skills, resumeText });
      updateConfig({ roleId: targetRole, roleTitle });
      await updateProfile({ targetRole: roleTitle, level, skills, resumeText, resumeFileName: resumeFile?.name });
      navigate('/dashboard');
    } catch {
      setError('Something went wrong. Please try again — make sure the backend server is running.');
    } finally { setGenerating(false); }
  };

  const canProceed = [
    () => !!targetRole,
    () => !!level,
    () => true, // skills optional
    () => true, // resume optional
  ];

  const next = () => {
    if (step < 3) setStep(s => s + 1);
    else handleGenerate();
  };
  const back = () => setStep(s => s - 1);

  const groupedRoles = TARGET_ROLES.reduce((acc, r) => {
    (acc[r.category] ||= []).push(r);
    return acc;
  }, {});

  return (
    <div className="min-h-screen pt-16" style={{ background:'var(--bg)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display text-xl font-bold" style={{ color:'var(--text)' }}>
              Set up your career path
            </h1>
            <span className="text-sm font-medium" style={{ color:'var(--t3)' }}>Step {step + 1} of {STEPS.length}</span>
          </div>
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-1.5">
                  <div className={`step-dot ${i < step ? 'done' : i === step ? 'active' : 'pending'}`}>
                    {i < step ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className="text-xs hidden sm:block font-medium" style={{ color: i === step ? 'var(--p)' : 'var(--t4)' }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className="flex-1 h-px" style={{ background: i < step ? 'var(--p)' : 'var(--border)' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 0 — Target Role */}
        {step === 0 && (
          <div className="animate-fade-up">
            <div className="card p-6 mb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:'var(--p-bg)', border:'1px solid var(--border3)' }}>
                  <Target className="w-5 h-5" style={{ color:'var(--p)' }} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg" style={{ color:'var(--text)' }}>What role do you want?</h2>
                  <p className="text-sm" style={{ color:'var(--t3)' }}>We'll tailor your career path and interview questions</p>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 12px', borderRadius:10, background:'var(--surf2)', border:'1px solid var(--border)', marginBottom:16, fontSize:12, color:'var(--t3)' }}>
                💬 Not sure yet? Open the ARIA chat in the bottom-right corner and describe your interests — it can help you narrow this down before you pick.
              </div>
              {Object.entries(groupedRoles).map(([cat, roles]) => (
                <div key={cat} className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:'var(--t3)' }}>{cat}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {roles.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setTargetRole(r.id)}
                        className="flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all duration-150"
                        style={{
                          borderColor: targetRole === r.id ? 'var(--p)' : 'transparent',
                          background: targetRole === r.id ? 'var(--p-bg)' : 'var(--surf2)',
                        }}
                      >
                        <span className="text-lg">{r.icon}</span>
                        <span className="text-xs font-semibold" style={{ color: targetRole === r.id ? 'var(--p)' : 'var(--text)' }}>{r.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1 — Experience Level */}
        {step === 1 && (
          <div className="animate-fade-up">
            <div className="card p-6 mb-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:'var(--p-bg)', border:'1px solid var(--border3)' }}>
                  <Star className="w-5 h-5" style={{ color:'var(--p)' }} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg" style={{ color:'var(--text)' }}>Your current experience level</h2>
                  <p className="text-sm" style={{ color:'var(--t3)' }}>Helps calibrate question difficulty and timeline</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EXPERIENCE_LEVELS.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setLevel(l.id)}
                    className="p-4 rounded-2xl border-2 text-left transition-all duration-150"
                    style={{
                      borderColor: level === l.id ? 'var(--p)' : 'var(--border)',
                      background: level === l.id ? 'var(--p-bg)' : 'var(--surf)',
                    }}
                  >
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-xl">{l.icon}</span>
                      <span className="font-display font-bold text-sm" style={{ color: level === l.id ? 'var(--p)' : 'var(--text)' }}>{l.label}</span>
                    </div>
                    <p className="text-xs" style={{ color:'var(--t3)' }}>{l.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Skills */}
        {step === 2 && (
          <div className="animate-fade-up">
            <div className="card p-6 mb-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:'var(--p-bg)', border:'1px solid var(--border3)' }}>
                  <Zap className="w-5 h-5" style={{ color:'var(--p)' }} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg" style={{ color:'var(--text)' }}>Your current skills</h2>
                  <p className="text-sm" style={{ color:'var(--t3)' }}>Select all that apply — helps identify skill gaps</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {COMMON_SKILLS.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleSkill(s)}
                    className="py-1.5 px-3 rounded-full text-sm font-medium border transition-all duration-150"
                    style={{
                      borderColor: skills.includes(s) ? 'var(--p)' : 'var(--border)',
                      background: skills.includes(s) ? 'var(--p-bg)' : 'var(--surf)',
                      color: skills.includes(s) ? 'var(--p)' : 'var(--t2)',
                    }}
                  >
                    {skills.includes(s) && <span className="mr-1">✓</span>}{s}
                  </button>
                ))}
              </div>
              {skills.length > 0 && (
                <p className="text-xs mt-4 font-medium" style={{ color:'var(--p)' }}>
                  ✓ {skills.length} skill{skills.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>
            <p className="text-xs text-center" style={{ color:'var(--t4)' }}>Optional — skip if you prefer</p>
          </div>
        )}

        {/* Step 3 — Resume */}
        {step === 3 && (
          <div className="animate-fade-up">
            <div className="card p-6 mb-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:'var(--p-bg)', border:'1px solid var(--border3)' }}>
                  <FileText className="w-5 h-5" style={{ color:'var(--p)' }} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg" style={{ color:'var(--text)' }}>Upload your resume</h2>
                  <p className="text-sm" style={{ color:'var(--t3)' }}>Optional — enables personalized AI questions and job matching</p>
                </div>
              </div>

              {!resumeFile ? (
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed rounded-2xl p-8 text-center transition-all hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10" style={{ borderColor:'var(--border2)' }}>
                    <Upload className="w-10 h-10 mx-auto mb-3" style={{ color:'var(--p3)' }} />
                    <p className="font-semibold text-sm mb-1" style={{ color:'var(--text)' }}>Drop your resume here</p>
                    <p className="text-xs" style={{ color:'var(--t3)' }}>PDF or TXT · Max 5 MB</p>
                    <div className="btn btn-primary text-xs py-2 px-4 mt-4 inline-flex">Browse file</div>
                  </div>
                  <input type="file" accept=".pdf,.txt" onChange={handleResumeUpload} className="hidden" />
                </label>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-xl" style={{ background:'var(--green-bg)', border:'1px solid rgba(16,185,129,.25)' }}>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5" style={{ color:'var(--green)' }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color:'var(--text)' }}>{resumeFile.name}</p>
                      <p className="text-xs" style={{ color:'var(--t3)' }}>{resumeText.length > 0 ? 'Text extracted ✓' : 'Uploaded'}</p>
                    </div>
                  </div>
                  <button onClick={() => { setResumeFile(null); setResumeText(''); setUploadErr(''); }} className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100 dark:hover:bg-white/10">
                    <X className="w-4 h-4" style={{ color:'var(--t3)' }} />
                  </button>
                </div>
              )}

              {uploading && <p className="text-xs mt-2 text-center" style={{ color:'var(--t3)' }}>Reading file…</p>}
              {uploadErr && <p className="text-xs mt-2 text-center text-red-500">{uploadErr}</p>}

              <div className="mt-4 p-3 rounded-xl" style={{ background:'var(--amber-bg)', border:'1px solid rgba(245,158,11,.2)' }}>
                <p className="text-xs" style={{ color:'#92400e' }}>💡 With your resume, AI generates questions about <strong>your specific projects</strong> and highlights skill gaps for your target role.</p>
              </div>
            </div>
            <p className="text-xs text-center" style={{ color:'var(--t4)' }}>Optional — skip to generate a general career path</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background:'var(--red-bg)', border:'1px solid rgba(239,68,68,.2)' }}>
            <span className="text-red-500 text-sm">{error}</span>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={step === 0 ? () => navigate(careerPath ? '/dashboard' : '/') : back}
            className="btn btn-ghost py-2.5 px-4 gap-1.5 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />{step === 0 ? 'Back to home' : 'Back'}
          </button>

          <button
            onClick={next}
            disabled={!canProceed[step]() || generating || uploading}
            className="btn btn-primary py-2.5 px-6 gap-2 text-sm"
          >
            {generating ? (
              <><Loader className="w-4 h-4 animate-spin" /> Generating your path…</>
            ) : step === 3 ? (
              <><Sparkles className="w-4 h-4" /> Generate Career Path</>
            ) : (
              <>Continue <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>

        {/* Generating overlay */}
        {generating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background:'rgba(248,249,254,.9)', backdropFilter:'blur(8px)' }}>
            <div className="card p-10 text-center max-w-sm mx-4" style={{ boxShadow:'0 24px 64px rgba(79,70,229,.15)' }}>
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 animate-breathe" style={{ background:'linear-gradient(135deg,#4f46e5,#6366f1)' }}>
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2" style={{ color:'var(--text)' }}>Generating your career path…</h3>
              <p className="text-sm" style={{ color:'var(--t3)' }}>Analyzing your profile and creating a personalized roadmap</p>
              <div className="mt-5 flex justify-center gap-1">
                {[0.1, 0.2, 0.3].map((d, i) => (
                  <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background:'var(--p)', animationDelay:`${d}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
