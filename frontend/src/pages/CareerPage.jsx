import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { jobsApi } from '../services/api';
import { Briefcase, MapPin, Clock, DollarSign, Bookmark, BookmarkCheck, ExternalLink, Search, Filter, X, CheckCircle, Building2, ChevronDown, Star, Zap, Target } from 'lucide-react';

const TYPE_COLORS = {
  'Full-time': '#4f46e5',
  'Remote': '#10b981',
  'Hybrid': '#3b82f6',
  'Contract': '#f59e0b',
  'Internship': '#8b5cf6',
};

function JobCard({ job, saved, onSave, onRemove, onApply }) {
  const [hover, setHover] = useState(false);
  const typeColor = TYPE_COLORS[job.type] || '#4f46e5';

  return (
    <div
      className="card"
      style={{ cursor: 'pointer', transition: 'all .2s', transform: hover ? 'translateY(-2px)' : 'none', boxShadow: hover ? '0 10px 28px rgba(79,70,229,.1)' : '0 1px 4px rgba(0,0,0,.04)', border: hover ? '1.5px solid var(--border-active)' : '1.5px solid var(--border)' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: job.logoColor || '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
            {job.logo}
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>{job.company}</div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '2px 0 0', lineHeight: 1.3 }}>{job.title}</h3>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
          {job.matchPercent!=null && (
            <span title="How many of this role's listed skills are on your profile" style={{ display:'flex', alignItems:'center', gap:3, padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:800, background: job.matchPercent>=60?'var(--green-bg)':job.matchPercent>=30?'var(--amber-bg)':'var(--surf3)', color: job.matchPercent>=60?'var(--green)':job.matchPercent>=30?'var(--amber)':'var(--t3)' }}>
              <Target size={9}/> {job.matchPercent}% match
            </span>
          )}
          <button
            onClick={e => { e.stopPropagation(); saved ? onRemove(job) : onSave(job); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}
          >
            {saved ? <BookmarkCheck size={18} style={{ color: 'var(--p)' }} /> : <Bookmark size={18} style={{ color: 'var(--t3)' }} />}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--t3)' }}><MapPin size={11} />{job.location}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--t3)' }}><Clock size={11} />{job.experience}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--t3)' }}><DollarSign size={11} />{job.salary}</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
        <span style={{ padding: '2px 9px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: `${typeColor}15`, color: typeColor }}>{job.type}</span>
        {job.tags?.slice(0, 3).map(tag => (
          <span key={tag} style={{ padding: '2px 9px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: 'var(--bg)', color: 'var(--t3)', border: '1px solid var(--border)' }}>{tag}</span>
        ))}
        {job.featured && (
          <span style={{ padding: '2px 9px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: 'var(--amber-bg)', color: 'var(--amber)', marginLeft: 'auto' }}>⭐ Featured</span>
        )}
      </div>

      <p style={{ fontSize: 12, color: 'var(--t3)', margin: '0 0 14px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {job.description}
      </p>

      <button
        onClick={() => onApply(job)}
        className="btn-primary"
        style={{ width: '100%', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px' }}
      >
        <Zap size={13} /> Apply Now
      </button>
    </div>
  );
}

function ApplyModal({ job, onClose }) {
  const { user, profile } = useApp();
  const [step, setStep] = useState(1);
  const [applied, setApplied] = useState(false);

  function handleApply() {
    setStep(2);
    setTimeout(() => setApplied(true), 1000);
  }

  if (!job) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={onClose}>
      <div className="card" style={{ maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 9, background: job.logoColor || '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{job.logo}</div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>{job.company}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{job.title}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} style={{ color: 'var(--t3)' }} /></button>
        </div>

        {!applied ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, padding: '10px 12px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 3 }}>📍 Location</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{job.location}</div>
                </div>
                <div style={{ flex: 1, padding: '10px 12px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 3 }}>💰 Salary</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{job.salary}</div>
                </div>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 12 }}>
                {job.description}
              </div>
              {job.requirements && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', marginBottom: 6, textTransform: 'uppercase' }}>Requirements</div>
                  {job.requirements.map((r, i) => <div key={i} style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>• {r}</div>)}
                </div>
              )}
            </div>

            <div style={{ padding: '12px 14px', background: 'var(--p-bg)', borderRadius: 10, border: '1px solid #c7d2fe', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--p)', marginBottom: 6 }}>📄 Your Profile (Auto-filled)</div>
              <div style={{ fontSize: 13, color: 'var(--t2)' }}>
                <strong>Name:</strong> {user?.name || 'Your Name'}<br />
                <strong>Email:</strong> {user?.email || 'Your Email'}<br />
                {profile?.skills?.length > 0 && <><strong>Skills:</strong> {profile.skills.slice(0, 5).join(', ')}</>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-outline" onClick={onClose} style={{ flex: 1, fontSize: 14 }}>Cancel</button>
              <button className="btn-primary" onClick={handleApply} style={{ flex: 2, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <Zap size={14} /> Submit Application
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px' }}>Application Submitted!</h3>
            <p style={{ color: 'var(--t3)', margin: '0 0 20px', fontSize: 14 }}>
              Your application to <strong>{job.company}</strong> for <strong>{job.title}</strong> has been submitted.
              They'll reach out to <strong>{user?.email}</strong>.
            </p>
            <div style={{ padding: '12px 16px', background: 'var(--green-bg)', borderRadius: 10, border: '1px solid #bbf7d0', marginBottom: 20, fontSize: 13, color: '#166534' }}>
              💡 <strong>Tip:</strong> Practice the {job.company}-style interview on CareerForge AI to boost your chances!
            </div>
            <button className="btn-primary" onClick={onClose} style={{ fontSize: 14 }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CareerPage() {
  const { careerPath, profile, config } = useApp();
  const [jobListings, setJobListings] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [activeTab, setActiveTab] = useState('all'); // all | saved | recommended
  const [selectedJob, setSelectedJob] = useState(null);
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    jobsApi.list().then(r => setJobListings(r.jobs)).catch(() => {});
    jobsApi.savedIds().then(r => setSavedJobIds(r.jobIds)).catch(() => {});
  }, []);

  const savedJobs = jobListings.filter(j => savedJobIds.includes(j.id));
  const jobTypes = ['All', 'Full-time', 'Remote', 'Hybrid', 'Internship', 'Contract'];

  const filteredJobs = useMemo(() => {
    let jobs = jobListings;

    if (activeTab === 'saved') {
      jobs = savedJobs;
    } else if (activeTab === 'recommended') {
      // Filter by career path target role or config role
      const targetRole = careerPath?.targetRole || config.roleTitle || '';
      jobs = jobListings.filter(j =>
        j.tags?.some(t => targetRole.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes('sde') || t.toLowerCase().includes('developer'))
        || j.category === config.roleId
      );
      if (!jobs.length) jobs = jobListings.filter(j => j.featured);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.tags?.some(t => t.toLowerCase().includes(q)) ||
        j.location.toLowerCase().includes(q)
      );
    }

    if (filterType !== 'All') {
      jobs = jobs.filter(j => j.type === filterType);
    }

    if (sortBy === 'featured') jobs = [...jobs].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    else if (sortBy === 'newest') jobs = [...jobs].reverse();

    return jobs;
  }, [activeTab, savedJobs, search, filterType, sortBy, careerPath, config, jobListings]);

  function handleSave(job) {
    jobsApi.save(job.id).then(() => setSavedJobIds(ids => [...ids, job.id])).catch(() => {});
  }

  function handleRemove(job) {
    jobsApi.remove(job.id).then(() => setSavedJobIds(ids => ids.filter(id => id !== job.id))).catch(() => {});
  }

  const isSaved = (job) => savedJobIds.includes(job.id);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Briefcase size={24} style={{ color: 'var(--p)' }} /> Job Board
          </h1>
          <p style={{ color: 'var(--t3)', margin: 0, fontSize: 14 }}>
            {careerPath ? `Jobs matching your ${careerPath.targetRole} career path` : 'Explore opportunities at top companies'}
          </p>
        </div>

        {/* Career path banner */}
        {careerPath && (
          <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.8)', marginBottom: 2 }}>Your Target Role</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{careerPath.targetRole}</div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { label: 'Readiness', val: `${careerPath.readinessPercent || 0}%` },
                { label: 'Salary', val: careerPath.salaryRange || 'Market' },
                { label: 'Timeline', val: careerPath.estimatedTimeline || '3-6 mo' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search + filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, position: 'relative', minWidth: 220 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
            <input className="input" style={{ paddingLeft: 36 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs, companies, skills…" />
          </div>
          <select className="input" style={{ width: 'auto', minWidth: 140 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
            {jobTypes.map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="input" style={{ width: 'auto', minWidth: 130 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="featured">Featured First</option>
            <option value="newest">Newest First</option>
          </select>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, background: 'var(--surf)', borderRadius: 10, border: '1px solid var(--border)', padding: 4, marginBottom: 24, width: 'fit-content' }}>
          {[
            { id: 'all', label: `All Jobs (${jobListings.length})` },
            { id: 'recommended', label: '🎯 Recommended' },
            { id: 'saved', label: `🔖 Saved (${savedJobs.length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '7px 16px', borderRadius: 7, border: 'none', background: activeTab === t.id ? 'var(--p)' : 'transparent', color: activeTab === t.id ? '#fff' : 'var(--t3)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .18s', whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { icon: Building2, label: 'Companies', val: [...new Set(filteredJobs.map(j => j.company))].length },
            { icon: Briefcase, label: 'Open Roles', val: filteredJobs.length },
            { icon: MapPin, label: 'Locations', val: [...new Set(filteredJobs.map(j => j.location))].length },
            { icon: Star, label: 'Featured', val: filteredJobs.filter(j => j.featured).length },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 99, fontSize: 12 }}>
              <s.icon size={13} style={{ color: 'var(--p)' }} />
              <strong style={{ color: 'var(--text)' }}>{s.val}</strong>
              <span style={{ color: 'var(--t3)' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>No jobs found</h3>
            <p style={{ color: 'var(--t3)', margin: 0, fontSize: 14 }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filteredJobs.map(job => (
              <JobCard key={job.id} job={job} saved={isSaved(job)} onSave={handleSave} onRemove={handleRemove} onApply={setSelectedJob} />
            ))}
          </div>
        )}
      </div>

      {selectedJob && <ApplyModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
}
