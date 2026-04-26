'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createSession, validateSession, hashPassword, CONFIG } = require('../src/auth');

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------
describe('CONFIG', () => {
  it('has a default TTL of 3600 seconds', () => {
    assert.equal(CONFIG.ttl, 3600);
  });

  it('uses the default secret when SESSION_SECRET is not set', () => {
    // This test runs in the default environment where the env var is absent.
    // If SESSION_SECRET happens to be set in CI, the default branch is still
    // tested via the || fallback; the value must be a non-empty string either way.
    assert.equal(typeof CONFIG.secret, 'string');
    assert.ok(CONFIG.secret.length > 0);
  });

  it('picks up SESSION_SECRET from the environment', () => {
    // Simulate by re-requiring with the env var set.
    const originalSecret = process.env.SESSION_SECRET;
    try {
      process.env.SESSION_SECRET = 'my-custom-secret';
      // Bust the require cache so the module re-evaluates CONFIG.
      delete require.cache[require.resolve('../src/auth')];
      const { CONFIG: freshConfig } = require('../src/auth');
      assert.equal(freshConfig.secret, 'my-custom-secret');
    } finally {
      // Restore original state.
      if (originalSecret === undefined) {
        delete process.env.SESSION_SECRET;
      } else {
        process.env.SESSION_SECRET = originalSecret;
      }
      delete require.cache[require.resolve('../src/auth')];
    }
  });

  it('falls back to default-dev-secret when SESSION_SECRET is unset', () => {
    const originalSecret = process.env.SESSION_SECRET;
    try {
      delete process.env.SESSION_SECRET;
      delete require.cache[require.resolve('../src/auth')];
      const { CONFIG: freshConfig } = require('../src/auth');
      assert.equal(freshConfig.secret, 'default-dev-secret');
    } finally {
      if (originalSecret !== undefined) {
        process.env.SESSION_SECRET = originalSecret;
      }
      delete require.cache[require.resolve('../src/auth')];
    }
  });
});

// ---------------------------------------------------------------------------
// createSession
// ---------------------------------------------------------------------------
describe('createSession', () => {
  it('returns an object with the expected shape', () => {
    const session = createSession('user-1', 'admin');
    assert.ok(session !== null && typeof session === 'object');
    assert.ok('token' in session);
    assert.ok('userId' in session);
    assert.ok('role' in session);
    assert.ok('expiresAt' in session);
  });

  it('stores the provided userId', () => {
    const session = createSession('user-42', 'viewer');
    assert.equal(session.userId, 'user-42');
  });

  it('stores the provided role', () => {
    const session = createSession('user-1', 'moderator');
    assert.equal(session.role, 'moderator');
  });

  it('generates a 64-character hexadecimal token', () => {
    const session = createSession('user-1', 'user');
    assert.equal(typeof session.token, 'string');
    assert.equal(session.token.length, 64);
    assert.match(session.token, /^[0-9a-f]{64}$/);
  });

  it('generates a unique token on each call', () => {
    const tokens = new Set();
    for (let i = 0; i < 20; i++) {
      tokens.add(createSession(`user-${i}`, 'user').token);
    }
    assert.equal(tokens.size, 20, 'Expected all 20 tokens to be unique');
  });

  it('sets expiresAt approximately CONFIG.ttl seconds in the future', () => {
    const before = Date.now();
    const session = createSession('user-1', 'user');
    const after = Date.now();

    const expectedMin = before + CONFIG.ttl * 1000;
    const expectedMax = after + CONFIG.ttl * 1000;

    assert.ok(
      session.expiresAt >= expectedMin && session.expiresAt <= expectedMax,
      `expiresAt ${session.expiresAt} should be between ${expectedMin} and ${expectedMax}`
    );
  });

  it('expiresAt is in the future', () => {
    const session = createSession('user-1', 'user');
    assert.ok(session.expiresAt > Date.now());
  });

  it('works with numeric userId', () => {
    const session = createSession(99, 'user');
    assert.equal(session.userId, 99);
  });

  it('works with an empty string role', () => {
    const session = createSession('user-1', '');
    assert.equal(session.role, '');
  });

  it('two sessions for the same user have different tokens', () => {
    const s1 = createSession('user-same', 'user');
    const s2 = createSession('user-same', 'user');
    assert.notEqual(s1.token, s2.token);
  });
});

// ---------------------------------------------------------------------------
// validateSession
// ---------------------------------------------------------------------------
describe('validateSession', () => {
  it('returns null for a well-formed token (stub behaviour)', () => {
    const session = createSession('user-1', 'user');
    assert.equal(validateSession(session.token), null);
  });

  it('returns null for an arbitrary hex string', () => {
    assert.equal(validateSession('a'.repeat(64)), null);
  });

  it('returns null for an empty string', () => {
    assert.equal(validateSession(''), null);
  });

  it('returns null for null input', () => {
    assert.equal(validateSession(null), null);
  });

  it('returns null for undefined input', () => {
    assert.equal(validateSession(undefined), null);
  });

  it('returns null for a numeric input', () => {
    assert.equal(validateSession(12345), null);
  });
});

// ---------------------------------------------------------------------------
// hashPassword
// ---------------------------------------------------------------------------
describe('hashPassword', () => {
  it('returns a string', () => {
    assert.equal(typeof hashPassword('secret'), 'string');
  });

  it('returns a 64-character hexadecimal string (SHA-256 output)', () => {
    const hash = hashPassword('password123');
    assert.equal(hash.length, 64);
    assert.match(hash, /^[0-9a-f]{64}$/);
  });

  it('is deterministic: same password always produces the same hash', () => {
    const hash1 = hashPassword('same-password');
    const hash2 = hashPassword('same-password');
    assert.equal(hash1, hash2);
  });

  it('produces different hashes for different passwords', () => {
    assert.notEqual(hashPassword('password-a'), hashPassword('password-b'));
  });

  it('produces the correct SHA-256 digest for the empty string', () => {
    // Known SHA-256 of empty string.
    const expected = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    assert.equal(hashPassword(''), expected);
  });

  it('produces the correct SHA-256 digest for a known input', () => {
    // Cross-check using Node's own crypto directly to confirm the function
    // delegates to the same algorithm without modification.
    const crypto = require('node:crypto');
    const expected = crypto.createHash('sha256').update('abc').digest('hex');
    assert.equal(hashPassword('abc'), expected);
    assert.equal(expected.length, 64);
    assert.match(expected, /^[0-9a-f]{64}$/);
  });

  it('is sensitive to case: "Password" and "password" hash differently', () => {
    assert.notEqual(hashPassword('Password'), hashPassword('password'));
  });

  it('handles unicode input without throwing', () => {
    assert.doesNotThrow(() => hashPassword('pässwörd'));
    const hash = hashPassword('pässwörd');
    assert.equal(hash.length, 64);
  });

  it('handles a very long password without throwing', () => {
    const longPassword = 'x'.repeat(10000);
    assert.doesNotThrow(() => hashPassword(longPassword));
    const hash = hashPassword(longPassword);
    assert.equal(hash.length, 64);
  });
});