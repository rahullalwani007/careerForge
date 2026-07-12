const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { ah } = require('../middleware/errorHandler');
const groq = require('../services/groqService');

const router = express.Router();
router.use(requireAuth);

router.get('/', ah(async (req, res) => {
  const row = db.prepare('SELECT * FROM career_paths WHERE user_id = ?').get(req.user.id);
  if (!row) return res.json({ careerPath: null });
  const data = JSON.parse(row.data_json);
  res.json({ careerPath: { ...data, roleId: row.role_id, generatedAt: row.generated_at } });
}));

router.post('/generate', ah(async (req, res) => {
  const { targetRole, roleId, currentLevel, skills, resumeText } = req.body || {};
  if (!targetRole || !currentLevel) return res.status(400).json({ error: 'targetRole and currentLevel are required.' });

  const path = await groq.generateCareerPath({ targetRole, currentLevel, skills, resumeText });
  const normalized = { ...path, targetRole: path.targetRole || targetRole };
  const dataJson = JSON.stringify(normalized);

  const existing = db.prepare('SELECT user_id FROM career_paths WHERE user_id = ?').get(req.user.id);
  if (existing) {
    db.prepare(`UPDATE career_paths SET role_id = ?, data_json = ?, updated_at = datetime('now') WHERE user_id = ?`)
      .run(roleId || '', dataJson, req.user.id);
  } else {
    db.prepare('INSERT INTO career_paths (user_id, role_id, data_json) VALUES (?, ?, ?)').run(req.user.id, roleId || '', dataJson);
  }
  // Also mirror the target role into the profile, since most pages read it from there.
  const hasProfile = db.prepare('SELECT user_id FROM profiles WHERE user_id = ?').get(req.user.id);
  if (hasProfile) db.prepare("UPDATE profiles SET target_role = ?, level = ?, updated_at = datetime('now') WHERE user_id = ?").run(normalized.targetRole, currentLevel, req.user.id);

  res.json({ careerPath: { ...normalized, roleId: roleId || '' } });
}));

router.put('/readiness', ah(async (req, res) => {
  const { delta } = req.body || {};
  const row = db.prepare('SELECT * FROM career_paths WHERE user_id = ?').get(req.user.id);
  if (!row) return res.status(404).json({ error: 'No career path yet.' });
  const data = JSON.parse(row.data_json);
  data.readinessPercent = Math.min(95, Math.max(0, (data.readinessPercent || 0) + (delta || 0)));
  db.prepare(`UPDATE career_paths SET data_json = ? WHERE user_id = ?`).run(JSON.stringify(data), req.user.id);
  res.json({ readinessPercent: data.readinessPercent });
}));

router.get('/progress', ah(async (req, res) => {
  const rows = db.prepare('SELECT phase_key, done FROM roadmap_progress WHERE user_id = ?').all(req.user.id);
  const progress = {};
  rows.forEach(r => { progress[r.phase_key] = !!r.done; });
  res.json({ progress });
}));

router.put('/progress', ah(async (req, res) => {
  const { phaseKey, done } = req.body || {};
  if (!phaseKey) return res.status(400).json({ error: 'phaseKey is required.' });
  db.prepare(`
    INSERT INTO roadmap_progress (user_id, phase_key, done) VALUES (?, ?, ?)
    ON CONFLICT(user_id, phase_key) DO UPDATE SET done = excluded.done
  `).run(req.user.id, phaseKey, done ? 1 : 0);
  res.json({ ok: true });
}));

module.exports = router;
