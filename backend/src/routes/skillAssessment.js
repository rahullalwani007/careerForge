const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { ah } = require('../middleware/errorHandler');
const groq = require('../services/groqService');
const { checkAndUnlockBadges } = require('../db/badgeService');

const router = express.Router();
router.use(requireAuth);

router.post('/quiz', ah(async (req, res) => {
  const { categories, perCategory } = req.body || {};
  if (!Array.isArray(categories) || !categories.length) return res.status(400).json({ error: 'Select at least one category.' });
  const questions = await groq.generateSkillQuiz(categories, perCategory || 4);
  res.json({ questions });
}));

// The quiz itself is scored client-side (it's a practice tool, not a
// secure exam) — this endpoint just persists the resulting scores so
// the Skill Radar Chart and "improvement over time" line can read
// them back later, and re-checks badges.
router.post('/submit', ah(async (req, res) => {
  const { categoryScores, totalQuestions, correctAnswers } = req.body || {};
  if (!categoryScores || typeof categoryScores !== 'object') return res.status(400).json({ error: 'categoryScores is required.' });

  const values = Object.values(categoryScores);
  const overallScore = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

  const { lastInsertRowid } = db.prepare(`
    INSERT INTO skill_assessments (user_id, categories_json, overall_score, total_questions, correct_answers)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, JSON.stringify(categoryScores), overallScore, totalQuestions || 0, correctAnswers || 0);

  const newBadges = checkAndUnlockBadges(req.user.id);
  res.status(201).json({ id: lastInsertRowid, overallScore, newBadges });
}));

router.get('/history', ah(async (req, res) => {
  const rows = db.prepare('SELECT id, categories_json, overall_score, total_questions, correct_answers, created_at FROM skill_assessments WHERE user_id = ? ORDER BY created_at ASC').all(req.user.id);
  res.json({
    history: rows.map(r => ({
      id: r.id, categories: JSON.parse(r.categories_json), overallScore: r.overall_score,
      totalQuestions: r.total_questions, correctAnswers: r.correct_answers, date: r.created_at,
    })),
  });
}));

router.get('/latest', ah(async (req, res) => {
  const row = db.prepare('SELECT * FROM skill_assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.user.id);
  if (!row) return res.json({ latest: null });
  res.json({ latest: { categories: JSON.parse(row.categories_json), overallScore: row.overall_score, date: row.created_at } });
}));

module.exports = router;
