const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { ah } = require('../middleware/errorHandler');
const groq = require('../services/groqService');
const { checkAndUnlockBadges } = require('../db/badgeService');

const router = express.Router();
router.use(requireAuth);

// ── Stateless AI generation endpoints (no DB writes) ──────────────

router.post('/questions', ah(async (req, res) => {
  const questions = await groq.generateQuestions(req.body?.config || {});
  res.json({ questions });
}));

// Adaptive Difficulty Engine: one question at a time, calibrated to
// the candidate's rolling performance so far. See groqService.js
// generateAdaptiveQuestion() for the actual calibration logic.
router.post('/next-question', ah(async (req, res) => {
  const { config = {}, history = [] } = req.body || {};
  const question = await groq.generateAdaptiveQuestion(config, history);
  res.json({ question });
}));

router.post('/feedback', ah(async (req, res) => {
  const { question, answer, mode, difficulty } = req.body || {};
  const feedback = await groq.generateFeedback(question, answer, mode, difficulty);
  res.json({ feedback });
}));

router.post('/coding-question', ah(async (req, res) => {
  const problem = await groq.generateCodingQuestion(req.body?.config || {});
  res.json({ problem });
}));

router.post('/evaluate-code', ah(async (req, res) => {
  const { code, problem, testResults, language } = req.body || {};
  const result = await groq.evaluateCode(code, problem, testResults || [], language);
  res.json({ result });
}));

// ── Session persistence ───────────────────────────────────────────

router.get('/sessions', ah(async (req, res) => {
  const rows = db.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(req.user.id);
  res.json({
    sessions: rows.map(r => ({
      id: r.id, role: r.role, mode: r.mode, difficulty: r.difficulty, company: r.company,
      questionCount: r.question_count, averageScore: r.average_score, readinessLevel: r.readiness_level,
      focusScore: r.focus_score, tabSwitches: r.tab_switches, pasteEvents: r.paste_events, idleEvents: r.idle_events,
      date: r.created_at,
    })),
  });
}));

router.get('/sessions/:id', ah(async (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!session) return res.status(404).json({ error: 'Session not found.' });
  const answers = db.prepare('SELECT * FROM session_answers WHERE session_id = ? ORDER BY id ASC').all(session.id);
  res.json({
    session: {
      ...session,
      report: session.report_json ? JSON.parse(session.report_json) : null,
      timeline: answers.map(a => ({
        question: a.question, answer: a.answer, score: a.score,
        strengths: JSON.parse(a.strengths_json || '[]'), improvements: JSON.parse(a.improvements_json || '[]'),
        rubric: a.rubric_json ? JSON.parse(a.rubric_json) : null, timeSpent: a.time_spent,
      })),
    },
  });
}));

// Generates the holistic AI report AND persists the whole session
// (session row + one row per answer) in a single transaction, then
// re-runs badge checks. This is the one write-heavy endpoint the
// interview flow calls, right when the candidate finishes.
router.post('/sessions', ah(async (req, res) => {
  const { config = {}, timeline = [], focusStats = {} } = req.body || {};
  if (!timeline.length) return res.status(400).json({ error: 'timeline must have at least one answer.' });

  const scores = timeline.map(t => t.score || 0);
  const avg = parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));

  const report = await groq.generateSystemReport(timeline, config);

  const insertSession = db.prepare(`
    INSERT INTO sessions (user_id, role, mode, difficulty, company, question_count, average_score, readiness_level, adaptive, focus_score, tab_switches, paste_events, idle_events, report_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAnswer = db.prepare(`
    INSERT INTO session_answers (session_id, question, answer, score, strengths_json, improvements_json, rubric_json, time_spent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sessionId = db.transaction(() => {
    const { lastInsertRowid } = insertSession.run(
      req.user.id, config.roleTitle || '', config.mode || 'technical', config.difficulty || 'medium', config.companyName || '',
      timeline.length, avg, report.readinessLevel || null, config.adaptive ? 1 : 0,
      focusStats.focusScore ?? null, focusStats.tabSwitches || 0, focusStats.pasteEvents || 0, focusStats.idleEvents || 0,
      JSON.stringify(report)
    );
    timeline.forEach(t => {
      insertAnswer.run(lastInsertRowid, t.question || '', t.answer || '', t.score || 0,
        JSON.stringify(t.strengths || []), JSON.stringify(t.improvements || []),
        t.rubric ? JSON.stringify(t.rubric) : null, t.timeSpent || 0);
    });
    return lastInsertRowid;
  })();

  const newBadges = checkAndUnlockBadges(req.user.id);

  res.status(201).json({ sessionId, averageScore: avg, report, newBadges });
}));

module.exports = router;
