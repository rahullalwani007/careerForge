const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { ah } = require('../middleware/errorHandler');

const router = express.Router();
router.use(requireAuth);

function rowToProfile(row, user) {
  if (!row) return { name: user.name, email: user.email, skills: [] };
  return {
    name: user.name,
    email: user.email,
    targetRole: row.target_role || '',
    level: row.level || '',
    skills: JSON.parse(row.skills_json || '[]'),
    bio: row.bio || '',
    location: row.location || '',
    github: row.github || '',
    linkedin: row.linkedin || '',
    website: row.website || '',
    resumeText: row.resume_text || '',
    resumeFileName: row.resume_filename || '',
  };
}

router.get('/', ah(async (req, res) => {
  const row = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  res.json({ profile: rowToProfile(row, req.user) });
}));

router.put('/', ah(async (req, res) => {
  const p = req.body || {};
  const existing = db.prepare('SELECT user_id FROM profiles WHERE user_id = ?').get(req.user.id);
  const fields = {
    target_role: p.targetRole ?? '',
    level: p.level ?? p.experience ?? '',
    skills_json: JSON.stringify(p.skills || []),
    bio: p.bio ?? '',
    location: p.location ?? '',
    github: p.github ?? '',
    linkedin: p.linkedin ?? '',
    website: p.website ?? '',
    resume_text: p.resumeText ?? undefined,
    resume_filename: p.resumeFileName ?? undefined,
  };
  if (existing) {
    const sets = [];
    const values = [];
    Object.entries(fields).forEach(([k, v]) => { if (v !== undefined) { sets.push(`${k} = ?`); values.push(v); } });
    sets.push("updated_at = datetime('now')");
    db.prepare(`UPDATE profiles SET ${sets.join(', ')} WHERE user_id = ?`).run(...values, req.user.id);
  } else {
    db.prepare(`INSERT INTO profiles (user_id, target_role, level, skills_json, bio, location, github, linkedin, website, resume_text, resume_filename)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(req.user.id, fields.target_role, fields.level, fields.skills_json, fields.bio, fields.location, fields.github, fields.linkedin, fields.website, fields.resume_text || '', fields.resume_filename || '');
  }
  if (p.name && p.name.trim() && p.name !== req.user.name) {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(p.name.trim(), req.user.id);
  }
  const row = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.user.id);
  res.json({ profile: rowToProfile(row, user) });
}));

module.exports = router;
