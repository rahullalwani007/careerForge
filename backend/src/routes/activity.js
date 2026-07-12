const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { ah } = require('../middleware/errorHandler');

const router = express.Router();
router.use(requireAuth);

// Merges every kind of practice activity (interview sessions, group
// discussions, skill assessments, placement drives) into one list of
// {date, type, label} events. This is what streaks, the activity
// heatmap, and "did you practice today" should be computed from —
// doing a Skill Assessment or a Group Discussion is just as much
// "practice today" as a mock interview is, and treating only one
// table as the source of truth was the bug that made streaks feel
// out of sync with what a user actually did.
router.get('/', ah(async (req, res) => {
  const uid = req.user.id;
  const sessions = db.prepare(`SELECT created_at AS date, 'interview' AS type, mode AS label FROM sessions WHERE user_id = ?`).all(uid);
  const gds = db.prepare(`SELECT created_at AS date, 'gd' AS type, topic AS label FROM gd_sessions WHERE user_id = ?`).all(uid);
  const skills = db.prepare(`SELECT created_at AS date, 'skill_assessment' AS type, 'Skill Assessment' AS label FROM skill_assessments WHERE user_id = ?`).all(uid);
  const drives = db.prepare(`SELECT created_at AS date, 'drive' AS type, company AS label FROM placement_drives WHERE user_id = ?`).all(uid);

  const activity = [...sessions, ...gds, ...skills, ...drives]
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({ activity });
}));

module.exports = router;
