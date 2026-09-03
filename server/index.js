'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const db = require('./db');
const auth = require('./auth');
const { orchestrate } = require('./orchestrator');
const { startWorker, stopWorker } = require('./worker');
const memoryBank = require('../skills/memory-bank/skill');
const { fetchWildfire } = require('../skills/wildfire-monitor/skill');
const { fetchWeather } = require('../skills/weather-monitor/skill');
const { fetchAviation } = require('../skills/aviation-monitor/skill');
const { fetchTelegram, fetchMediaThumbnail } = require('../skills/telegram-monitor/skill');
const { fetchBorders } = require('../skills/border-monitor/skill');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// ── Security Headers via Helmet ──────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      connectSrc: [
        "'self'",
        'https://*.openstreetmap.org',
        'https://demotiles.maplibre.org',
        'https://api.open-meteo.com',
        'https://air-quality-api.open-meteo.com',
        'https://earthquake.usgs.gov',
        'https://firms.modaps.eosdis.nasa.gov',
        'https://eonet.gsfc.nasa.gov',
        'https://opensky-network.org',
        'https://opendata.adsb.fi',
        'https://radmon.org',
        'https://mpb.rks-gov.net',
        'https://nakordoni.eu'
      ],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
      workerSrc: ["'self'", 'blob:'],
      frameSrc: ["'self'", 'https://video.gjirafa.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  xFrameOptions: { action: 'deny' },
  xContentTypeOptions: true,
  referrerPolicy: { policy: 'same-origin' }
}));

// ── Strict Origin & Host Protection (Replacing Insecure Open CORS) ─────────────
const codespaceOrigin = process.env.CODESPACE_NAME
  ? `https://${process.env.CODESPACE_NAME}-${PORT}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || 'app.github.dev'}`
  : null;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || `http://localhost:${PORT},http://127.0.0.1:${PORT}`)
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

if (codespaceOrigin && !allowedOrigins.includes(codespaceOrigin)) {
  allowedOrigins.push(codespaceOrigin);
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) {
    // Direct or same-origin navigation
    return next();
  }

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    return next();
  }

  // Reject unauthorized cross-origin access
  return res.status(403).json({ error: 'Cross-origin request rejected by security policy' });
});

// ── Multi-Tier Rate Limiting ─────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'API rate limit exceeded.' }
});

const forceRefreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Force refresh rate limit reached. Please wait 1 minute.' }
});

/**
 * Express middleware to conditionally apply forceRefreshLimiter only when forceRefresh is requested.
 * If rate-limited, forceRefreshLimiter responds with HTTP 429 and does NOT call next(),
 * preventing subsequent route execution and avoiding ERR_HTTP_HEADERS_SENT crashes.
 */
const conditionalForceRefreshLimiter = (req, res, next) => {
  if (req.body && (req.body.forceRefresh === true || req.body.forceRefresh === 'true')) {
    return forceRefreshLimiter(req, res, next);
  }
  next();
};

app.use(express.json({ limit: '500kb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Apply general API rate limiter to ALL /api/* routes (including /api/auth/*)
app.use('/api', apiLimiter);

// ── SSE clients registry & resource limits ────────────────────────────────────
const sseClients = new Set();
const userSseCounts = new Map(); // userId -> number of active connections
const MAX_SSE_PER_USER = 5;
const MAX_GLOBAL_SSE_CLIENTS = 100;

function broadcastAlert(alert) {
  const payload = `data: ${JSON.stringify(alert)}\n\n`;
  sseClients.forEach(res => {
    try {
      res.write(payload);
    } catch {
      sseClients.delete(res);
    }
  });
}

// ── Authentication Endpoints ─────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Validates credentials, checks brute-force lockout, establishes HttpOnly session
 */
app.post('/api/auth/login', authLimiter, (req, res) => {
  const { username, password } = req.body || {};
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // 1. Check brute force lockout
  const rateStatus = auth.checkAuthRateLimit(clientIp);
  if (!rateStatus.allowed) {
    return res.status(429).json({ error: rateStatus.message });
  }

  // 2. Validate user
  const user = auth.findUserByUsername(username);
  if (!user) {
    auth.recordFailedAttempt(clientIp);
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // 3. Verify password
  const isValid = auth.verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    auth.recordFailedAttempt(clientIp);
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // 4. Successful login
  auth.clearAuthRateLimit(clientIp);
  const session = auth.createSession(user.id, clientIp, req.headers['user-agent'] || '');

  // 5. Set secure HttpOnly cookie
  res.setHeader('Set-Cookie', [
    `sentinel_session=${session.sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${auth.SESSION_TTL_MS / 1000}${isProduction ? '; Secure' : ''}`
  ]);

  return res.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    },
    csrfToken: session.csrfToken
  });
});

/**
 * POST /api/auth/logout
 * Destroys session in database and clears session cookie. Requires auth and CSRF.
 */
app.post('/api/auth/logout', auth.requireAuth, auth.requireCsrf, (req, res) => {
  const token = auth.extractSessionToken(req);
  if (token) {
    auth.destroySession(token);
  }

  res.setHeader('Set-Cookie', [
    `sentinel_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  ]);

  return res.json({ ok: true, message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Returns current authenticated identity and CSRF token
 */
app.get('/api/auth/me', (req, res) => {
  const token = auth.extractSessionToken(req);
  if (!token) {
    return res.json({ authenticated: false });
  }

  const authData = auth.validateSession(token);
  if (!authData) {
    return res.json({ authenticated: false });
  }

  return res.json({
    authenticated: true,
    user: authData.user,
    csrfToken: authData.session.csrfToken
  });
});

/**
 * User Management: GET /api/auth/users (Administrator Only)
 */
app.get('/api/auth/users', auth.requireAuth, auth.requireRole('administrator'), (req, res) => {
  const users = auth.listUsers();
  res.json({ users });
});

/**
 * User Management: POST /api/auth/users (Administrator Only)
 */
app.post('/api/auth/users', auth.requireAuth, auth.requireRole('administrator'), auth.requireCsrf, (req, res) => {
  const { username, password, role } = req.body || {};
  try {
    const created = auth.createUser({ username, password, role });
    res.status(201).json({ ok: true, user: created });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── SSE Endpoint (Protected by Authentication & Connection Caps) ───────────────
app.get('/events', auth.requireAuth, (req, res) => {
  // Check global connection limit
  if (sseClients.size >= MAX_GLOBAL_SSE_CLIENTS) {
    return res.status(503).json({ error: 'Global SSE connection limit reached. Please try again later.' });
  }

  const userId = req.user.id;
  const currentCount = userSseCounts.get(userId) || 0;
  if (currentCount >= MAX_SSE_PER_USER) {
    return res.status(429).json({ error: 'Maximum concurrent SSE connections reached for this user.' });
  }

  userSseCounts.set(userId, currentCount + 1);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sessionToken = auth.extractSessionToken(req);
  let cleanedUp = false;

  function cleanup() {
    if (cleanedUp) return;
    cleanedUp = true;
    clearInterval(heartbeat);
    sseClients.delete(res);
    const count = userSseCounts.get(userId) || 1;
    if (count <= 1) {
      userSseCounts.delete(userId);
    } else {
      userSseCounts.set(userId, count - 1);
    }
  }

  // Periodic heartbeat every 15s with live session re-verification
  const heartbeat = setInterval(() => {
    const authData = auth.validateSession(sessionToken);
    if (!authData) {
      try {
        res.write(`data: ${JSON.stringify({ type: 'session_expired', message: 'Session expired or revoked' })}\n\n`);
        res.end();
      } catch {}
      cleanup();
      return;
    }

    try {
      res.write(': heartbeat\n\n');
    } catch {
      cleanup();
    }
  }, 15000);

  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SENTINEL authenticated live feed connected', user: req.user.username })}\n\n`);
  sseClients.add(res);

  req.on('close', cleanup);
  req.on('error', cleanup);
});

// ── Protected Operational APIs ───────────────────────────────────────────────

/**
 * POST /api/status
 * Fetches status for a location. Reads cached intelligence by default.
 * Force refresh is rate-limited via conditionalForceRefreshLimiter middleware.
 */
app.post('/api/status', auth.requireAuth, auth.requireCsrf, conditionalForceRefreshLimiter, async (req, res) => {
  const { location, lat, lon, timeline = '24h', forceRefresh = false, customKeywords = [] } = req.body;
  if (!location) return res.status(400).json({ error: 'location is required' });

  try {
    const result = await orchestrate({ location, lat, lon, timeline, forceRefresh: forceRefresh === true || forceRefresh === 'true', customKeywords });
    if (result.alerts?.hasNewAlerts) {
      result.alerts.alerts.forEach(alert => broadcastAlert({ type: 'alert', ...alert }));
    }
    if (res.headersSent) return;
    res.json(result);
  } catch (err) {
    console.error('[server] orchestrate error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

/**
 * GET /api/alerts
 */
app.get('/api/alerts', auth.requireAuth, (req, res) => {
  const alerts = memoryBank.get('alerts') || [];
  const unread = memoryBank.getUnreadCount();
  res.json({ alerts, unreadCount: unread });
});

/**
 * POST /api/alerts/read
 */
app.post('/api/alerts/read', auth.requireAuth, auth.requireCsrf, (req, res) => {
  memoryBank.markAlertsRead();
  res.json({ ok: true, unreadCount: 0 });
});

/**
 * GET /api/locations
 */
app.get('/api/locations', auth.requireAuth, (req, res) => {
  const locations = memoryBank.get('locations') || [];
  res.json({ locations });
});

/**
 * GET /api/preferences
 */
app.get('/api/preferences', auth.requireAuth, (req, res) => {
  const preferences = memoryBank.get('preferences') || {};
  res.json({ preferences });
});

/**
 * POST /api/preferences (Administrator Only)
 */
app.post('/api/preferences', auth.requireAuth, auth.requireRole('administrator'), auth.requireCsrf, (req, res) => {
  const { preferences } = req.body;
  if (!preferences || typeof preferences !== 'object') {
    return res.status(400).json({ error: 'Valid preferences object is required' });
  }
  memoryBank.set('preferences', preferences);
  res.json({ ok: true, preferences: memoryBank.get('preferences') });
});

/**
 * GET /api/weather
 */
app.get('/api/weather', auth.requireAuth, async (req, res) => {
  const { location = 'Mitrovica, Kosovo', lat, lon } = req.query;
  try {
    const data = await fetchWeather({
      location,
      lat: lat ? parseFloat(lat) : undefined,
      lon: lon ? parseFloat(lon) : undefined
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/wildfire
 */
app.get('/api/wildfire', auth.requireAuth, async (req, res) => {
  const { period = '24h', lat, lon, forceRefresh = 'false' } = req.query;
  try {
    const data = await fetchWildfire({
      period,
      lat: lat ? parseFloat(lat) : undefined,
      lon: lon ? parseFloat(lon) : undefined,
      forceRefresh: forceRefresh === 'true'
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/aviation
 */
app.get('/api/aviation', auth.requireAuth, async (req, res) => {
  const { forceRefresh = 'false' } = req.query;
  try {
    const data = await fetchAviation({ forceRefresh: forceRefresh === 'true' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/telegram
 */
app.get('/api/telegram', auth.requireAuth, async (req, res) => {
  const { channels, limit, forceRefresh = 'false', demo = 'false' } = req.query;
  try {
    const chList = channels ? channels.split(',').map(c => c.trim()).filter(Boolean) : null;
    const data = await fetchTelegram({
      channels: chList,
      limitPerChannel: limit ? parseInt(limit, 10) : undefined,
      forceRefresh: forceRefresh === 'true',
      useDemo: demo === 'true'
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/telegram/media
 */
app.get('/api/telegram/media', auth.requireAuth, async (req, res) => {
  const { channel, id, demo = 'false' } = req.query;
  if (!channel || !id) {
    return res.status(400).json({ error: 'channel and id parameters are required' });
  }

  try {
    const result = await fetchMediaThumbnail({
      channel,
      messageId: id,
      demo: demo === 'true'
    });

    if (!result || !result.buffer) {
      return res.status(404).json({ error: 'Media preview not available' });
    }

    res.setHeader('Content-Type', result.mimeType || 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(result.buffer);
  } catch (err) {
    console.error('[server] Media thumbnail route error:', err.message);
    return res.status(500).json({ error: 'Internal media processing error' });
  }
});

/**
 * GET /api/borders
 */
app.get('/api/borders', auth.requireAuth, async (req, res) => {
  const { forceRefresh = 'false' } = req.query;
  try {
    const data = await fetchBorders({ forceRefresh: forceRefresh === 'true' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Terminal Error Handler (Prevents stack trace leaks / HTML errors) ─────────
app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  if (statusCode >= 500) {
    console.error('[server] Uncaught request error:', err.message);
  }
  if (res.headersSent) {
    return next(err);
  }
  const isParseError = statusCode === 400 && (err.type === 'entity.parse.failed' || err instanceof SyntaxError);
  res.status(statusCode).json({
    error: isParseError ? 'Malformed JSON request body' : (statusCode < 500 ? err.message : 'Internal server error')
  });
});

// ── Startup & Lifecycle ──────────────────────────────────────────────────────
let server = null;

if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`\n🛰️  SENTINEL Operational Dashboard`);
    console.log(`   Running at: http://localhost:${PORT}`);
    console.log(`   SSE Stream: http://localhost:${PORT}/events (Auth Required)`);
    console.log(`   Security: Helmet CSP enabled, CORS restricted, Session-based Auth active\n`);

    // Start background intelligence ingestion worker
    startWorker({ onNewAlert: broadcastAlert });
  });

  // Graceful Shutdown
  const handleShutdown = (signal) => {
    console.log(`\n[server] Received ${signal}. Initiating graceful shutdown...`);
    stopWorker();
    if (server) {
      server.close(() => {
        console.log('[server] HTTP server closed.');
        try {
          db.close();
          console.log('[database] SQLite connection closed cleanly.');
        } catch (e) {
          console.warn('[database] Error closing database:', e.message);
        }
        process.exit(0);
      });
    }
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

module.exports = { app, broadcastAlert };
