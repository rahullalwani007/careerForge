// ================================================================
// YouTube Data API v3 proxy, with a server-side cache.
//
// Why cache: search.list costs 100 quota units per call, and the
// free tier gives 10,000 units/day — about 100 searches/day total,
// shared across every person using the app. Caching identical
// queries for a while means a popular topic (e.g. "system design
// interview") only ever costs one real API call, no matter how
// many students click it.
// ================================================================
const db = require('../db');

const YT_KEY = process.env.YOUTUBE_API_KEY;
const CACHE_TTL_HOURS = Number(process.env.YOUTUBE_CACHE_TTL_HOURS || 12);

function isConfigured() {
  return !!YT_KEY && YT_KEY !== 'your_youtube_api_key_here';
}

function normalizeQuery(q) { return q.trim().toLowerCase(); }

function getCached(query) {
  const row = db.prepare('SELECT results_json, cached_at FROM youtube_cache WHERE query = ?').get(normalizeQuery(query));
  if (!row) return null;
  const ageHours = (Date.now() - new Date(row.cached_at).getTime()) / 36e5;
  if (ageHours > CACHE_TTL_HOURS) return null;
  try { return JSON.parse(row.results_json); } catch { return null; }
}

function setCached(query, results) {
  db.prepare(`
    INSERT INTO youtube_cache (query, results_json, cached_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(query) DO UPDATE SET results_json = excluded.results_json, cached_at = excluded.cached_at
  `).run(normalizeQuery(query), JSON.stringify(results));
}

function parseDuration(iso) {
  if (!iso) return '';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '';
  const h = parseInt(m[1] || 0, 10), min = parseInt(m[2] || 0, 10), s = parseInt(m[3] || 0, 10);
  if (h) return `${h}:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${min}:${String(s).padStart(2, '0')}`;
}

function formatViews(n) {
  const num = parseInt(n || 0, 10);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K views`;
  return `${num} views`;
}

const MOCK_VIDEOS = [
  { title: 'Complete Interview Preparation Guide', channel: 'CodeWithHarry', duration: '45:22', viewCount: '2.3M views' },
  { title: 'Top 50 Interview Questions & Answers', channel: 'TechWithTim', duration: '1:12:05', viewCount: '1.8M views' },
  { title: 'Data Structures & Algorithms - Full Course', channel: 'freeCodeCamp', duration: '3:48:10', viewCount: '5.2M views' },
  { title: 'System Design Interview Guide', channel: 'Gaurav Sen', duration: '28:45', viewCount: '987K views' },
  { title: 'Behavioral Interview Questions & Answers', channel: 'Self Made Millennial', duration: '35:10', viewCount: '1.1M views' },
  { title: 'Resume Building for Tech Jobs', channel: 'CS Dojo', duration: '22:30', viewCount: '756K views' },
];

function getMockVideos(query) {
  return MOCK_VIDEOS.map((v, i) => ({
    id: `mock_${i}_${Date.now()}`,
    title: `${query}: ${v.title}`,
    channel: v.channel,
    thumbnail: null,
    description: 'Sample result — add a free YouTube Data API v3 key to see real videos.',
    duration: v.duration,
    viewCount: v.viewCount,
    url: 'https://youtube.com',
  }));
}

async function searchVideos(query, maxResults = 6) {
  if (!isConfigured()) return getMockVideos(query);

  const cached = getCached(`${query}::${maxResults}`);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({ part: 'snippet', q: query, type: 'video', maxResults: String(maxResults), relevanceLanguage: 'en', key: YT_KEY });
    const r = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    if (!r.ok) return getMockVideos(query);
    const data = await r.json();
    if (!data.items?.length) return getMockVideos(query);

    const ids = data.items.map(i => i.id.videoId).join(',');
    const detailParams = new URLSearchParams({ part: 'contentDetails,statistics', id: ids, key: YT_KEY });
    const detailRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?${detailParams}`);
    const details = detailRes.ok ? await detailRes.json() : null;
    const detailMap = {};
    details?.items?.forEach(d => { detailMap[d.id] = d; });

    const results = data.items.map(item => {
      const vid = item.id.videoId;
      const detail = detailMap[vid];
      return {
        id: vid,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        description: (item.snippet.description || '').substring(0, 120) + '...',
        publishedAt: item.snippet.publishedAt,
        duration: parseDuration(detail?.contentDetails?.duration),
        viewCount: formatViews(detail?.statistics?.viewCount),
        url: `https://www.youtube.com/watch?v=${vid}`,
      };
    });
    setCached(`${query}::${maxResults}`, results);
    return results;
  } catch {
    return getMockVideos(query);
  }
}

module.exports = { searchVideos, isConfigured };
