const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { ah } = require('../middleware/errorHandler');
const groq = require('../services/groqService');

const router = express.Router();
router.use(requireAuth);

const PAGE_LABELS = {
  '/dashboard': 'Dashboard', '/interview': 'Interview', '/notes': 'Notes', '/careers': 'Careers',
  '/learn': 'Learning', '/report': 'Report', '/profile': 'Profile', '/career-path': 'Career Path',
  '/resume': 'Resume', '/onboarding': 'Onboarding', '/skill-assessment': 'Skill Assessment',
  '/placement-drive': 'Placement Drive', '/group-discussion': 'Group Discussion',
};

router.post('/', ah(async (req, res) => {
  const { messages = [], page = '' } = req.body || {};

  const careerPathRow = db.prepare('SELECT data_json FROM career_paths WHERE user_id = ?').get(req.user.id);
  const careerPath = careerPathRow ? JSON.parse(careerPathRow.data_json) : null;
  const lastSession = db.prepare('SELECT mode, average_score FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.user.id);

  const systemPrompt = `You are ARIA, the AI career coach inside CareerForge AI. Be concise (under 80 words), warm, specific.
User: ${req.user.name} | Current page: ${PAGE_LABELS[page] || page || 'unknown'}
Goal: ${careerPath?.targetRole || 'not set'} | Readiness: ${careerPath?.readinessPercent || 0}%
Last session: ${lastSession ? `${lastSession.mode}, score ${lastSession.average_score}/10` : 'none'}
Skill gaps: ${(careerPath?.skillGaps || []).slice(0, 3).join(', ') || 'complete onboarding first'}
End with ONE concrete next action the user can take in the app right now.`;

  const reply = await groq.chatWithHistory(messages.map(m => ({ role: m.role, content: m.content })), systemPrompt);

  db.prepare('INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)').run(req.user.id, 'user', messages[messages.length - 1]?.content || '');
  db.prepare('INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)').run(req.user.id, 'assistant', reply);

  res.json({ reply });
}));

router.get('/history', ah(async (req, res) => {
  const rows = db.prepare('SELECT role, content, created_at FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC LIMIT 50').all(req.user.id);
  res.json({ messages: rows.map(r => ({ role: r.role, content: r.content, ts: new Date(r.created_at).getTime() })) });
}));

router.delete('/history', ah(async (req, res) => {
  db.prepare('DELETE FROM chat_messages WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
}));

module.exports = router;
