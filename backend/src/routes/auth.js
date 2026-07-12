const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken } = require('../utils/jwt');
const { requireAuth } = require('../middleware/auth');
const { ah } = require('../middleware/errorHandler');

const router = express.Router();

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, isGuest: !!u.is_guest };
}

router.post('/register', ah(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) return res.status(409).json({ error: 'An account with this email already exists. Try signing in instead.' });

  const hash = bcrypt.hashSync(password, 10);
  const { lastInsertRowid: userId } = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name.trim(), email.toLowerCase().trim(), hash);
  db.prepare('INSERT INTO profiles (user_id) VALUES (?)').run(userId);

  const user = db.prepare('SELECT id, name, email, is_guest FROM users WHERE id = ?').get(userId);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

router.post('/login', ah(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

// "Continue as guest" — creates a real (if throwaway) account so
// guests still get backend-backed persistence, leaderboard entries,
// etc. Clearly marked is_guest = 1.
router.post('/guest', ah(async (req, res) => {
  const suffix = Math.random().toString(36).slice(2, 9);
  const email = `guest_${suffix}@careerforge.local`;
  const hash = bcrypt.hashSync(suffix + Date.now(), 10);
  const { lastInsertRowid: userId } = db.prepare('INSERT INTO users (name, email, password_hash, is_guest) VALUES (?, ?, ?, 1)')
    .run('Guest', email, hash);
  db.prepare('INSERT INTO profiles (user_id) VALUES (?)').run(userId);
  const user = db.prepare('SELECT id, name, email, is_guest FROM users WHERE id = ?').get(userId);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
