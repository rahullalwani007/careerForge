const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { ah } = require('../middleware/errorHandler');
const { JOB_LISTINGS } = require('../services/fallbackData');

const router = express.Router();
router.use(requireAuth);

// Deterministic skill-match %: how many of the job's listed skills
// show up in the candidate's own skill list (case-insensitive).
// This is what powers the "Match" badge on each job card — a small,
// honest algorithm rather than another AI call for something this
// simple.
function matchPercent(jobSkills, userSkills) {
  if (!jobSkills?.length) return null;
  const have = new Set((userSkills || []).map(s => s.toLowerCase()));
  const hit = jobSkills.filter(s => have.has(s.toLowerCase())).length;
  return Math.round((hit / jobSkills.length) * 100);
}

router.get('/', ah(async (req, res) => {
  const profile = db.prepare('SELECT skills_json FROM profiles WHERE user_id = ?').get(req.user.id);
  const userSkills = profile ? JSON.parse(profile.skills_json || '[]') : [];
  const jobs = JOB_LISTINGS.map(j => ({ ...j, matchPercent: matchPercent(j.skills, userSkills) }));
  res.json({ jobs });
}));

router.get('/saved', ah(async (req, res) => {
  const rows = db.prepare('SELECT job_id FROM saved_jobs WHERE user_id = ?').all(req.user.id);
  const ids = new Set(rows.map(r => r.job_id));
  res.json({ jobIds: [...ids] });
}));

router.post('/saved', ah(async (req, res) => {
  const { jobId } = req.body || {};
  if (!jobId) return res.status(400).json({ error: 'jobId is required.' });
  db.prepare('INSERT INTO saved_jobs (user_id, job_id) VALUES (?, ?) ON CONFLICT(user_id, job_id) DO NOTHING').run(req.user.id, jobId);
  res.status(201).json({ ok: true });
}));

router.delete('/saved/:jobId', ah(async (req, res) => {
  db.prepare('DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?').run(req.user.id, req.params.jobId);
  res.json({ ok: true });
}));

module.exports = router;
