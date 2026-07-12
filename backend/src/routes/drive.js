const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { ah } = require('../middleware/errorHandler');
const { checkAndUnlockBadges } = require('../db/badgeService');

const router = express.Router();
router.use(requireAuth);

// Deterministic, disclosed verdict formula — worth being able to
// explain exactly, not another AI judgment call:
//   - Aptitude is a hard gate, like a real elimination round.
//   - Past that, Technical carries the most weight, then HR, then GD,
//     roughly matching how most Indian campus drives are actually weighted.
const APTITUDE_CUTOFF = 40;
const WEIGHTS = { gd: 0.25, technical: 0.45, hr: 0.30 };

function computeVerdict(roundScores) {
  const { aptitude = 0, gd = 0, technical = 0, hr = 0 } = roundScores;
  if (aptitude < APTITUDE_CUTOFF) {
    return { verdict: 'Not Selected', eliminatedAt: 'Aptitude Round', weightedScore: null };
  }
  const weighted = gd * WEIGHTS.gd + technical * WEIGHTS.technical + hr * WEIGHTS.hr;
  const verdict = weighted >= 75 ? 'Selected' : weighted >= 55 ? 'Waitlisted' : 'Not Selected';
  return { verdict, eliminatedAt: null, weightedScore: Math.round(weighted) };
}

router.post('/complete', ah(async (req, res) => {
  const { company = '', roleTitle = '', roundScores } = req.body || {};
  if (!roundScores || typeof roundScores !== 'object') return res.status(400).json({ error: 'roundScores is required.' });

  const { verdict, eliminatedAt, weightedScore } = computeVerdict(roundScores);

  const { lastInsertRowid } = db.prepare(`
    INSERT INTO placement_drives (user_id, company, role_title, round_scores_json, verdict, eliminated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.user.id, company, roleTitle, JSON.stringify(roundScores), verdict, eliminatedAt);

  const newBadges = checkAndUnlockBadges(req.user.id);
  res.status(201).json({ id: lastInsertRowid, verdict, eliminatedAt, weightedScore, roundScores, newBadges });
}));

router.get('/history', ah(async (req, res) => {
  const rows = db.prepare('SELECT * FROM placement_drives WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.id);
  res.json({
    history: rows.map(r => ({
      id: r.id, company: r.company, roleTitle: r.role_title,
      roundScores: JSON.parse(r.round_scores_json), verdict: r.verdict,
      eliminatedAt: r.eliminated_at, date: r.created_at,
    })),
  });
}));

module.exports = router;
