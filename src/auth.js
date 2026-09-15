const bcrypt = require('bcrypt');
const crypto = require('crypto');

/**
 * Authentication module for handling user sessions.
 */

const CONFIG = {
  secret: (() => {
    if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
      throw new Error('SESSION_SECRET environment variable must be set in production');
    }
    return process.env.SESSION_SECRET || 'default-dev-secret';
  })(),
  ttl: 3600
};

function createSession(userId, role) {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    userId,
    role,
    expiresAt: Date.now() + CONFIG.ttl * 1000
  };
}

function validateSession(_token) {
  // TODO: implement token lookup
  return null;
}

async function hashPassword(password, saltRounds = 12) {
  return bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = { createSession, validateSession, hashPassword, verifyPassword, CONFIG };