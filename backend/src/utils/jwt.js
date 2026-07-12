const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';
const EXPIRES_IN = '30d';

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, SECRET, { expiresIn: EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken };
