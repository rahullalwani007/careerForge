const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { ah } = require('../middleware/errorHandler');
const youtube = require('../services/youtubeService');

const router = express.Router();
router.use(requireAuth);

router.get('/search', ah(async (req, res) => {
  const q = req.query.q;
  if (!q?.trim()) return res.status(400).json({ error: 'q query param is required.' });
  const maxResults = Math.min(Number(req.query.maxResults) || 12, 20);
  const videos = await youtube.searchVideos(q, maxResults);
  res.json({ videos });
}));

router.get('/saved', ah(async (req, res) => {
  const rows = db.prepare('SELECT * FROM saved_videos WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ videos: rows.map(r => ({ videoId: r.video_id, title: r.title, thumbnail: r.thumbnail, url: r.url, channel: r.channel })) });
}));

router.post('/saved', ah(async (req, res) => {
  const { videoId, title, thumbnail, url, channel } = req.body || {};
  if (!videoId) return res.status(400).json({ error: 'videoId is required.' });
  db.prepare(`
    INSERT INTO saved_videos (user_id, video_id, title, thumbnail, url, channel) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, video_id) DO NOTHING
  `).run(req.user.id, videoId, title || '', thumbnail || '', url || '', channel || '');
  res.status(201).json({ ok: true });
}));

router.delete('/saved/:videoId', ah(async (req, res) => {
  db.prepare('DELETE FROM saved_videos WHERE user_id = ? AND video_id = ?').run(req.user.id, req.params.videoId);
  res.json({ ok: true });
}));

module.exports = router;
