import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { learningApi } from '../services/api';
import { BookOpen, Search, Play, Bookmark, BookmarkCheck, ExternalLink, Loader, RefreshCw, ChevronRight, Youtube, Star } from 'lucide-react';
import { useBreakpoint } from '../hooks/useBreakpoint';

const DEFAULT_TOPICS = [
  { label: 'Data Structures & Algorithms', icon: '🌳', query: 'data structures algorithms tutorial' },
  { label: 'System Design', icon: '🏗️', query: 'system design interview preparation' },
  { label: 'React.js', icon: '⚛️', query: 'React.js tutorial 2024' },
  { label: 'Node.js Backend', icon: '🔧', query: 'Node.js backend development' },
  { label: 'SQL & Databases', icon: '🗄️', query: 'SQL database interview questions' },
  { label: 'Machine Learning', icon: '🤖', query: 'machine learning tutorial beginner' },
  { label: 'Docker & Kubernetes', icon: '☁️', query: 'Docker Kubernetes DevOps tutorial' },
  { label: 'Python Programming', icon: '🐍', query: 'Python programming full course' },
  { label: 'OS & Networks', icon: '💿', query: 'operating systems computer networks interview' },
  { label: 'AWS Cloud', icon: '🌩️', query: 'AWS cloud computing tutorial' },
  { label: 'JavaScript ES6+', icon: '⚡', query: 'JavaScript ES6 modern features tutorial' },
  { label: 'HR Interview Tips', icon: '🤝', query: 'HR behavioral interview tips STAR method' },
];

function VideoCard({ video, saved, onSave, onRemove }) {
  const [hover, setHover] = useState(false);
  const isYT = video.videoId || video.source === 'youtube';
  const thumb = video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
  const url = video.url || (video.videoId ? `https://www.youtube.com/watch?v=${video.videoId}` : '#');

  return (
    <div
      className="card"
      style={{ padding: 0, overflow: 'hidden', transition: 'transform .2s, box-shadow .2s', transform: hover ? 'translateY(-3px)' : 'none', boxShadow: hover ? '0 12px 32px rgba(79,70,229,.12)' : '0 1px 4px rgba(0,0,0,.04)', cursor: 'pointer' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#1a1a2e', overflow: 'hidden' }}>
        <img
          src={thumb}
          alt={video.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s', transform: hover ? 'scale(1.04)' : 'scale(1)' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hover ? 1 : 0, transition: 'opacity .2s' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Play size={18} fill="#4f46e5" style={{ color: '#4f46e5', marginLeft: 2 }} />
          </div>
        </div>
        {video.duration && (
          <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,.75)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
            {video.duration}
          </div>
        )}
        <div style={{ position: 'absolute', top: 6, left: 6, background: '#ff0000', borderRadius: 4, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 3 }}>
          <Youtube size={10} style={{ color: '#fff' }} />
          <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>YouTube</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 14px' }}>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {video.title}
          </p>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {video.channelTitle || video.channel || 'YouTube'}
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, marginLeft: 8 }}>
            <button
              onClick={e => { e.stopPropagation(); saved ? onRemove(video) : onSave(video); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, display: 'flex', alignItems: 'center' }}
              title={saved ? 'Remove from saved' : 'Save video'}
            >
              {saved ? <BookmarkCheck size={15} style={{ color: 'var(--p)' }} /> : <Bookmark size={15} style={{ color: 'var(--t3)' }} />}
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
              <ExternalLink size={13} style={{ color: 'var(--t3)' }} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LearningPage() {
  const { careerPath, config } = useApp();
  const { isMobile } = useBreakpoint();
  const [activeTopic, setActiveTopic] = useState(null);
  const [customSearch, setCustomSearch] = useState('');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedVideos, setSavedVideos] = useState([]);
  const [activeTab, setActiveTab] = useState('topics'); // topics | saved
  const [error, setError] = useState('');

  // Merge career path topics with defaults
  const cpTopics = careerPath?.recommendedTopics?.slice(0, 6).map(t => ({
    label: t,
    icon: '🎯',
    query: `${t} tutorial interview preparation`,
    fromCareer: true,
  })) || [];

  const allTopics = [...cpTopics, ...DEFAULT_TOPICS].filter((t, i, arr) => arr.findIndex(x => x.label === t.label) === i);

  useEffect(() => {
    learningApi.savedVideos().then(r => setSavedVideos(r.videos)).catch(() => {});
  }, []);

  const fetchVideos = useCallback(async (query) => {
    setLoading(true);
    setError('');
    setVideos([]);
    try {
      const results = (await learningApi.search(query, 12)).videos;
      setVideos(results);
      if (!results.length) setError('No videos found. Try a different topic.');
    } catch (e) {
      setError('Could not load videos. Is the backend server running?');
    } finally {
      setLoading(false);
    }
  }, []);

  function handleTopicClick(topic) {
    setActiveTopic(topic);
    setActiveTab('topics');
    fetchVideos(topic.query);
  }

  function handleCustomSearch(e) {
    e.preventDefault();
    if (!customSearch.trim()) return;
    setActiveTopic({ label: customSearch, query: customSearch });
    fetchVideos(customSearch);
  }

  function handleSave(video) {
    const payload = { videoId: video.videoId || video.id, title: video.title, thumbnail: video.thumbnail, url: video.url, channel: video.channel || video.channelTitle };
    learningApi.saveVideo(payload).then(() => setSavedVideos(v => [payload, ...v])).catch(() => {});
  }

  function handleRemove(video) {
    const id = video.videoId || video.id;
    learningApi.removeVideo(id).then(() => setSavedVideos(v => v.filter(x => (x.videoId || x.id) !== id))).catch(() => {});
  }

  const isSaved = (v) => savedVideos.some(s => (s.videoId || s.id) === (v.videoId || v.id));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 80 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={24} style={{ color: 'var(--p)' }} /> Learning Hub
          </h1>
          <p style={{ color: 'var(--t3)', margin: 0, fontSize: 14 }}>Curated YouTube videos for every topic in your career path</p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleCustomSearch} style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              value={customSearch}
              onChange={e => setCustomSearch(e.target.value)}
              placeholder="Search any topic, e.g. 'Binary Trees', 'React hooks'…"
            />
          </div>
          <button className="btn-primary" type="submit" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <Search size={14} /> Search
          </button>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '260px 1fr', gap: 24 }}>

          {/* Left: topic list */}
          <div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, background: 'var(--surf)', borderRadius: 10, border: '1px solid var(--border)', padding: 4, marginBottom: 14 }}>
              {['topics', 'saved'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: '7px 10px', borderRadius: 7, border: 'none', background: activeTab === t ? 'var(--p)' : 'transparent', color: activeTab === t ? '#fff' : 'var(--t3)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .18s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  {t === 'topics' ? <><BookOpen size={13} /> Topics</> : <><BookmarkCheck size={13} /> Saved {savedVideos.length > 0 && `(${savedVideos.length})`}</>}
                </button>
              ))}
            </div>

            {activeTab === 'topics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {cpTopics.length > 0 && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '.5px' }}>📍 Your Career Path</div>
                )}
                {cpTopics.map(t => (
                  <button key={t.label} onClick={() => handleTopicClick(t)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${activeTopic?.label === t.label ? 'var(--p)' : 'transparent'}`, background: activeTopic?.label === t.label ? 'var(--p-bg)' : 'transparent', cursor: 'pointer', transition: 'all .15s', textAlign: 'left' }}
                    onMouseEnter={e => { if (activeTopic?.label !== t.label) e.currentTarget.style.background = 'var(--surf)'; }}
                    onMouseLeave={e => { if (activeTopic?.label !== t.label) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: 16 }}>{t.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: activeTopic?.label === t.label ? 'var(--p)' : 'var(--t2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
                    {activeTopic?.label === t.label && <ChevronRight size={12} style={{ color: 'var(--p)', flexShrink: 0 }} />}
                  </button>
                ))}

                {cpTopics.length > 0 && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', padding: '8px 8px 4px', textTransform: 'uppercase', letterSpacing: '.5px' }}>📚 All Topics</div>
                )}
                {DEFAULT_TOPICS.map(t => (
                  <button key={t.label} onClick={() => handleTopicClick(t)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${activeTopic?.label === t.label ? 'var(--p)' : 'transparent'}`, background: activeTopic?.label === t.label ? 'var(--p-bg)' : 'transparent', cursor: 'pointer', transition: 'all .15s', textAlign: 'left' }}
                    onMouseEnter={e => { if (activeTopic?.label !== t.label) e.currentTarget.style.background = 'var(--surf)'; }}
                    onMouseLeave={e => { if (activeTopic?.label !== t.label) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: 16 }}>{t.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: activeTopic?.label === t.label ? 'var(--p)' : 'var(--t2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
                    {activeTopic?.label === t.label && <ChevronRight size={12} style={{ color: 'var(--p)', flexShrink: 0 }} />}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'saved' && (
              savedVideos.length === 0 ? (
                <div style={{ padding: '24px 12px', textAlign: 'center' }}>
                  <Bookmark size={32} style={{ color: 'var(--border)', margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>No saved videos yet.<br />Click the bookmark icon on any video.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {savedVideos.map(v => (
                    <div key={v.videoId || v.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: 8, borderRadius: 9, background: 'var(--surf)', border: '1px solid var(--border)' }}>
                      <img src={v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/default.jpg`} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <a href={v.url || `https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', textDecoration: 'none', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.title}</a>
                        <button onClick={() => handleRemove(v)} style={{ background: 'none', border: 'none', fontSize: 10, color: '#ef4444', cursor: 'pointer', padding: '2px 0', marginTop: 2 }}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Right: video grid */}
          <div>
            {!activeTopic && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, textAlign: 'center', gap: 14 }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--p-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Youtube size={28} style={{ color: 'var(--p)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>Choose a Topic</h3>
                  <p style={{ color: 'var(--t3)', margin: 0, fontSize: 14 }}>Select from the sidebar or search above to find videos</p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 480 }}>
                  {allTopics.slice(0, 6).map(t => (
                    <button key={t.label} onClick={() => handleTopicClick(t)} className="pill pill-p" style={{ cursor: 'pointer', fontSize: 12, padding: '6px 14px' }}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, gap: 14 }}>
                <div style={{ width: 44, height: 44, border: '3px solid var(--border)', borderTopColor: 'var(--p)', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                <p style={{ color: 'var(--t3)', fontSize: 14, margin: 0 }}>Searching YouTube…</p>
              </div>
            )}

            {error && !loading && (
              <div style={{ padding: '16px 18px', background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca', color: '#ef4444', fontSize: 14, marginBottom: 16, display: 'flex', gap: 8 }}>
                <span>⚠️</span>{error}
              </div>
            )}

            {activeTopic && !loading && videos.length > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                    {activeTopic.icon && <span style={{ marginRight: 6 }}>{activeTopic.icon}</span>}{activeTopic.label}
                    <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 400, marginLeft: 8 }}>{videos.length} videos</span>
                  </h2>
                  <button onClick={() => fetchVideos(activeTopic.query)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid var(--border)', padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: 'var(--t3)' }}>
                    <RefreshCw size={12} /> Refresh
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                  {videos.map(v => (
                    <VideoCard key={v.videoId || v.id || v.title} video={v} saved={isSaved(v)} onSave={handleSave} onRemove={handleRemove} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
