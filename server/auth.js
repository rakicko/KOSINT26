'use strict';

const crypto = require('crypto');
const db = require('./db');

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Prepared Statements for Auth & Users
const stmtFindUserByUsername = db.prepare('SELECT id, username, password_hash as passwordHash, salt, role, created_at as createdAt, updated_at as updatedAt FROM users WHERE username = ? COLLATE NOCASE');
const stmtFindUserById = db.prepare('SELECT id, username, role, created_at as createdAt, updated_at as updatedAt FROM users WHERE id = ?');
const stmtInsertUser = db.prepare('INSERT INTO users (id, username, password_hash, salt, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
const stmtListUsers = db.prepare('SELECT id, username, role, created_at as createdAt, updated_at as updatedAt FROM users ORDER BY created_at ASC');
const stmtCountUsers = db.prepare('SELECT COUNT(*) as count FROM users');

// Prepared Statements for Sessions
const stmtInsertSession = db.prepare('INSERT INTO sessions (id, user_id, csrf_token, expires_at, created_at, last_seen_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
const stmtFindSession = db.prepare(`
  SELECT s.id, s.user_id as userId, s.csrf_token as csrfToken, s.expires_at as expiresAt, s.created_at as createdAt, s.last_seen_at as lastSeenAt,
         u.id as user_id, u.username, u.role
  FROM sessions s
  JOIN users u ON s.user_id = u.id
  WHERE s.id = ?
`);
const stmtUpdateSessionActivity = db.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?');
const stmtDeleteSession = db.prepare('DELETE FROM sessions WHERE id = ?');
const stmtDeleteExpiredSessions = db.prepare('DELETE FROM sessions WHERE expires_at < ?');

// Prepared Statements for Rate Limiting / Brute-Force Protection
const stmtGetRateLimit = db.prepare('SELECT attempts, first_attempt as firstAttempt, locked_until as lockedUntil FROM auth_rate_limits WHERE key = ?');
const stmtSetRateLimit = db.prepare('INSERT OR REPLACE INTO auth_rate_limits (key, attempts, first_attempt, locked_until) VALUES (?, ?, ?, ?)');
const stmtClearRateLimit = db.prepare('DELETE FROM auth_rate_limits WHERE key = ?');

/**
 * Hash password with scrypt and 32-byte cryptographically secure salt
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

/**
 * Timing-safe password verification
 */
function verifyPassword(password, storedHash, salt) {
  try {
    const derivedHash = crypto.scryptSync(password, salt, 64).toString('hex');
    const bufA = Buffer.from(derivedHash, 'hex');
    const bufB = Buffer.from(storedHash, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Create a new user account with role-based access
 */
function createUser({ username, password, role = 'operator' }) {
  if (!username || typeof username !== 'string' || !/^[a-zA-Z0-9_-]{3,32}$/.test(username.trim())) {
    throw new Error('Username must be 3-32 alphanumeric characters, dashes or underscores.');
  }

  if (!password || typeof password !== 'string' || password.length < 10) {
    throw new Error('Password must be at least 10 characters long.');
  }

  if (!['operator', 'administrator'].includes(role)) {
    throw new Error('Role must be either "operator" or "administrator".');
  }

  const cleanUser = username.trim();
  const existing = stmtFindUserByUsername.get(cleanUser);
  if (existing) {
    throw new Error('A user with that username already exists.');
  }

  const { hash, salt } = hashPassword(password);
  const id = `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const now = new Date().toISOString();

  stmtInsertUser.run(id, cleanUser, hash, salt, role, now, now);
  return { id, username: cleanUser, role, createdAt: now };
}

/**
 * Find user by username
 */
function findUserByUsername(username) {
  if (!username || typeof username !== 'string') return null;
  return stmtFindUserByUsername.get(username.trim());
}

/**
 * Count total users in database
 */
function getUserCount() {
  return stmtCountUsers.get().count || 0;
}

/**
 * List all users without sensitive hash/salt
 */
function listUsers() {
  return stmtListUsers.all();
}

/**
 * Brute-force protection: check rate limit for key (e.g. IP address or IP+username)
 */
function checkAuthRateLimit(key) {
  const row = stmtGetRateLimit.get(key);
  const now = Date.now();

  if (!row) return { allowed: true };

  if (row.lockedUntil > now) {
    const remainingSec = Math.ceil((row.lockedUntil - now) / 1000);
    return {
      allowed: false,
      message: `Too many failed login attempts. Account locked for ${remainingSec} seconds.`
    };
  }

  // Reset if lockout window has expired
  if (now - row.firstAttempt > LOCKOUT_DURATION_MS) {
    stmtClearRateLimit.run(key);
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Record a failed authentication attempt
 */
function recordFailedAttempt(key) {
  const row = stmtGetRateLimit.get(key);
  const now = Date.now();

  if (!row) {
    stmtSetRateLimit.run(key, 1, now, 0);
  } else {
    const attempts = row.attempts + 1;
    const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? now + LOCKOUT_DURATION_MS : 0;
    stmtSetRateLimit.run(key, attempts, row.firstAttempt, lockedUntil);
  }
}

/**
 * Reset rate limit after successful login
 */
function clearAuthRateLimit(key) {
  stmtClearRateLimit.run(key);
}

/**
 * Create a new cryptographically secure session
 */
function createSession(userId, ip = '', userAgent = '') {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const now = new Date().toISOString();
  const expiresAt = Date.now() + SESSION_TTL_MS;

  stmtInsertSession.run(sessionId, userId, csrfToken, expiresAt, now, now, ip, userAgent);
  return { sessionId, csrfToken, expiresAt };
}

/**
 * Validate session token and return user metadata
 */
function validateSession(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') return null;

  const session = stmtFindSession.get(sessionId);
  if (!session) return null;

  if (session.expiresAt < Date.now()) {
    stmtDeleteSession.run(sessionId);
    return null;
  }

  // Update last seen
  stmtUpdateSessionActivity.run(new Date().toISOString(), sessionId);

  return {
    session: {
      id: session.id,
      csrfToken: session.csrfToken,
      expiresAt: session.expiresAt
    },
    user: {
      id: session.userId,
      username: session.username,
      role: session.role
    }
  };
}

/**
 * Terminate/destroy session
 */
function destroySession(sessionId) {
  if (sessionId) {
    stmtDeleteSession.run(sessionId);
  }
}

/**
 * Purge expired sessions
 */
function cleanupExpiredSessions() {
  stmtDeleteExpiredSessions.run(Date.now());
}

// ─────────────────────────────────────
// EXPRESS MIDDLEWARES
// ─────────────────────────────────────

/**
 * Extract session token from HttpOnly cookie or Authorization: Bearer
 */
function extractSessionToken(req) {
  // 1. From Cookie header
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, c) => {
      const [k, v] = c.trim().split('=');
      if (k && v) acc[k] = decodeURIComponent(v);
      return acc;
    }, {});
    if (cookies.sentinel_session) {
      return cookies.sentinel_session;
    }
  }

  // 2. From Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return null;
}

/**
 * Require valid authenticated session
 */
function requireAuth(req, res, next) {
  const token = extractSessionToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const authData = validateSession(token);
  if (!authData) {
    return res.status(401).json({ error: 'Session invalid or expired' });
  }

  req.user = authData.user;
  req.session = authData.session;
  next();
}

/**
 * Require specific role (administrator or specified role)
 */
function requireRole(allowedRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role === 'administrator') {
      return next(); // Administrators have superuser access
    }

    if (req.user.role === allowedRole) {
      return next();
    }

    return res.status(403).json({ error: 'Insufficient administrative privileges' });
  };
}

/**
 * Require CSRF token for mutating HTTP requests
 */
function requireCsrf(req, res, next) {
  // Safe methods do not require CSRF token
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const headerCsrf = req.headers['x-csrf-token'];
  if (!req.session || !req.session.csrfToken || !headerCsrf || headerCsrf !== req.session.csrfToken) {
    return res.status(403).json({ error: 'Invalid or missing CSRF token' });
  }

  next();
}

module.exports = {
  hashPassword,
  verifyPassword,
  createUser,
  findUserByUsername,
  getUserCount,
  listUsers,
  checkAuthRateLimit,
  recordFailedAttempt,
  clearAuthRateLimit,
  createSession,
  validateSession,
  destroySession,
  cleanupExpiredSessions,
  extractSessionToken,
  requireAuth,
  requireRole,
  requireCsrf,
  SESSION_TTL_MS
};
