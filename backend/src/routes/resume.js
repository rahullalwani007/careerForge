const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { ah } = require('../middleware/errorHandler');
const groq = require('../services/groqService');

const router = express.Router();
router.use(requireAuth);

router.post('/analyze', ah(async (req, res) => {
  const { resumeText, targetRole, jobDescription } = req.body || {};
  if (!resumeText?.trim()) return res.status(400).json({ error: 'resumeText is required.' });
  const result = await groq.analyzeResume(resumeText, targetRole || 'Software Engineer', jobDescription);
  // Persist the resume text on the profile so other pages (career
  // path regeneration, adaptive questions) can reuse it.
  db.prepare(`
    UPDATE profiles SET resume_text = ?, updated_at = datetime('now') WHERE user_id = ?
  `).run(resumeText.substring(0, 8000), req.user.id);
  res.json({ result });
}));

module.exports = router;
