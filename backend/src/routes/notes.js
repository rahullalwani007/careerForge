const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { ah } = require('../middleware/errorHandler');
const groq = require('../services/groqService');

const router = express.Router();
router.use(requireAuth);

function rowToNote(r) {
  return {
    id: r.id, title: r.title, content: r.content, tags: JSON.parse(r.tags_json || '[]'),
    color: r.color, linkedSessionId: r.linked_session_id, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

router.get('/', ah(async (req, res) => {
  const rows = db.prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC').all(req.user.id);
  res.json({ notes: rows.map(rowToNote) });
}));

router.post('/', ah(async (req, res) => {
  const { title = 'Untitled Note', content = '', tags = [], color = '#4f46e5', linkedSessionId = null } = req.body || {};
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO notes (user_id, title, content, tags_json, color, linked_session_id) VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.user.id, title, content, JSON.stringify(tags), color, linkedSessionId);
  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(lastInsertRowid);
  res.status(201).json({ note: rowToNote(row) });
}));

router.put('/:id', ah(async (req, res) => {
  const existing = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Note not found.' });
  const { title, content, tags, color } = req.body || {};
  db.prepare(`UPDATE notes SET title = ?, content = ?, tags_json = ?, color = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(title ?? existing.title, content ?? existing.content, JSON.stringify(tags ?? JSON.parse(existing.tags_json || '[]')), color ?? existing.color, existing.id);
  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(existing.id);
  res.json({ note: rowToNote(row) });
}));

router.delete('/:id', ah(async (req, res) => {
  db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
}));

// AI actions on note content: enhance | summarize | flashcard
router.post('/ai/:task', ah(async (req, res) => {
  const { content } = req.body || {};
  if (!content?.trim()) return res.status(400).json({ error: 'content is required.' });
  const result = await groq.enhanceNotes(content, req.params.task);
  res.json({ result });
}));

module.exports = router;
