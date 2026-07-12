const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { ah } = require('../middleware/errorHandler');
const groq = require('../services/groqService');
const { checkAndUnlockBadges } = require('../db/badgeService');

const router = express.Router();
router.use(requireAuth);

// Start a new GD scenario: topic + 4 personas + opening remarks from 3 of them.
router.post('/start', ah(async (req, res) => {
  const { topic } = req.body || {};
  const scenario = await groq.generateGDScenario(topic);
  res.json({ scenario });
}));

// Candidate contributes → get back 1-2 participant reactions.
router.post('/respond', ah(async (req, res) => {
  const { topic, personas, transcript = [], userMessage } = req.body || {};
  if (!userMessage?.trim()) return res.status(400).json({ error: 'userMessage is required.' });

  const withUser = [...transcript, { speaker: 'You', text: userMessage, isUser: true }];
  const reactions = await groq.generateGDReactions(topic, personas || [], withUser);
  res.json({ transcript: [...withUser, ...reactions] });
}));

// Final evaluation + persistence.
router.post('/evaluate', ah(async (req, res) => {
  const { topic, transcript = [] } = req.body || {};
  if (!transcript.some(t => t.isUser)) return res.status(400).json({ error: 'You need to contribute at least once before evaluating.' });

  const evaluation = await groq.evaluateGD(topic, transcript);

  const { lastInsertRowid } = db.prepare(`
    INSERT INTO gd_sessions (user_id, topic, transcript_json, score, verdict, strengths_json, improvements_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, topic, JSON.stringify(transcript), evaluation.score, evaluation.verdict,
    JSON.stringify(evaluation.strengths || []), JSON.stringify(evaluation.improvements || []));

  const newBadges = checkAndUnlockBadges(req.user.id);
  res.status(201).json({ id: lastInsertRowid, evaluation, newBadges });
}));

router.get('/history', ah(async (req, res) => {
  const rows = db.prepare('SELECT id, topic, score, verdict, created_at FROM gd_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.id);
  res.json({ history: rows.map(r => ({ id: r.id, topic: r.topic, score: r.score, verdict: r.verdict, date: r.created_at })) });
}));

module.exports = router;
