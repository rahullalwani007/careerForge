const { verifyToken } = require('../utils/jwt');
const db = require('../db');

// Reads "Authorization: Bearer <token>", verifies it, and attaches
// req.user = { id, email, name }. Every route that needs to know
// "which person is asking" uses this.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing Authorization header' });

  try {
    const payload = verifyToken(token);
    const user = db.prepare('SELECT id, name, email, is_guest FROM users WHERE id = ?').get(payload.sub);
    if (!user) return res.status(401).json({ error: 'User no longer exists' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };
