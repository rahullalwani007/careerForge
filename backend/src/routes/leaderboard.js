const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { ah } = require('../middleware/errorHandler');

const router = express.Router();
router.use(requireAuth);

// Shows "First L." instead of a full name — a small, deliberate
// privacy choice for a leaderboard that mixes real accounts with
// seeded demo accounts.
function toDisplayName(fullName) {
  const parts = (fullName || 'Someone').trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

// Top candidates ranked by their average score, optionally scoped to
// one interview mode. Ties the multi-user database directly to
// something visible in the UI — this is the feature that simply
// isn't possible with the original localStorage-only version.
router.get('/', ah(async (req, res) => {
  const { mode } = req.query;
  const where = mode ? 'WHERE mode = ?' : '';
  const params = mode ? [mode] : [];

  const rows = db.prepare(`
    SELECT u.id AS user_id, u.name, AVG(s.average_score) AS avg_score, COUNT(*) AS session_count
    FROM sessions s JOIN users u ON u.id = s.user_id
    ${where}
    GROUP BY u.id
    HAVING session_count >= 1
    ORDER BY avg_score DESC
    LIMIT 20
  `).all(...params);

  const leaderboard = rows.map((r, i) => ({
    rank: i + 1,
    name: toDisplayName(r.name),
    isYou: r.user_id === req.user.id,
    averageScore: Math.round(r.avg_score * 10) / 10,
    sessionCount: r.session_count,
  }));

  res.json({ leaderboard, mode: mode || 'all' });
}));

// "You scored better than X% of everyone who has practiced this
// mode." Computed with a single SQL COUNT comparison — cheap and
// easy to reason about, unlike re-deriving it in JS from every row.
router.get('/percentile', ah(async (req, res) => {
  const { mode, score } = req.query;
  const numericScore = parseFloat(score);
  if (Number.isNaN(numericScore)) return res.status(400).json({ error: 'score query param must be a number.' });

  const where = mode ? 'WHERE mode = ?' : '';
  const params = mode ? [mode] : [];

  const total = db.prepare(`SELECT COUNT(*) AS c FROM sessions ${where}`).get(...params).c;
  if (total < 5) {
    return res.json({ percentile: null, sampleSize: total, message: 'Not enough historical sessions yet for a reliable percentile.' });
  }
  const below = db.prepare(`SELECT COUNT(*) AS c FROM sessions ${where ? where + ' AND' : 'WHERE'} average_score <= ?`).get(...params, numericScore).c;
  const percentile = Math.round((below / total) * 100);
  res.json({ percentile, sampleSize: total });
}));

module.exports = router;
