'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const { orchestrate } = require('./orchestrator');
const memoryBank = require('../skills/memory-bank/skill');
const { fetchWildfire } = require('../skills/wildfire-monitor/skill');
const { fetchWeather } = require('../skills/weather-monitor/skill');
const { fetchAviation } = require('../skills/aviation-monitor/skill');
const { fetchTelegram, fetchMediaThumbnail } = require('../skills/telegram-monitor/skill');
const { fetchBorders } = require('../skills/border-monitor/skill');
const staffService = require('./staff-service');
const auth = require('./auth');
const rateLimit = require('express-rate-limit');

const app  = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again after 15 minutes' }
});

// ── Strict Origin Protection (Supporting Localhost and Codespaces) ─────────────
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
  if (!origin) return next();
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Staff-Token');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public'), {
  etag: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.mjs') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// ── SSE clients registry ─────────────────────────────────────────────────────
const sseClients = new Set();

function broadcastAlert(alert) {
  const payload = `data: ${JSON.stringify(alert)}\n\n`;
  sseClients.forEach(res => { try { res.write(payload); } catch { sseClients.delete(res); } });
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
 * Destroys session in database and clears session cookie.
 */
app.post('/api/auth/logout', (req, res) => {
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
    user: {
      id: authData.user.id,
      username: authData.user.username,
      role: authData.user.role
    },
    csrfToken: authData.session.csrfToken
  });
});

// ── SSE endpoint ─────────────────────────────────────────────────────────────
app.get('/events', auth.requireAuth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Heartbeat every 30s
  const heartbeat = setInterval(() => { try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); } }, 30000);

  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'KOSINT live feed connected' })}\n\n`);
  sseClients.add(res);

  req.on('close', () => { sseClients.delete(res); clearInterval(heartbeat); });
});

// ── API: Fetch status for a location ────────────────────────────────────────
app.post('/api/status', auth.requireAuth, async (req, res) => {
  try {
    const { location, lat, lon, timeline = '24h', forceRefresh = false, customKeywords = [] } = req.body || {};
    if (!location) return res.status(400).json({ error: 'location is required' });
    const result = await orchestrate({ location, lat, lon, timeline, forceRefresh, customKeywords });
    // Broadcast any new alerts via SSE
    if (result.alerts?.hasNewAlerts) {
      result.alerts.alerts.forEach(alert => broadcastAlert({ type: 'alert', ...alert }));
    }
    res.json(result);
  } catch (err) {
    console.error('[server] orchestrate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── API: Get alert history ────────────────────────────────────────────────────
app.get('/api/alerts', auth.requireAuth, (req, res) => {
  const alerts = memoryBank.get('alerts') || [];
  const unread = memoryBank.getUnreadCount();
  res.json({ alerts, unreadCount: unread });
});

// ── API: Mark alerts read ─────────────────────────────────────────────────────
app.post('/api/alerts/read', auth.requireAuth, auth.requireCsrf, (req, res) => {
  memoryBank.markAlertsRead();
  res.json({ ok: true });
});

// ── API: Location history ─────────────────────────────────────────────────────
app.get('/api/locations', auth.requireAuth, (req, res) => {
  res.json({ locations: memoryBank.get('locations') || [] });
});

// ── API: Get/set preferences ──────────────────────────────────────────────────
app.get('/api/preferences', auth.requireAuth, (req, res) => {
  res.json({ preferences: memoryBank.get('preferences') });
});

app.post('/api/preferences', auth.requireAuth, auth.requireCsrf, (req, res) => {
  const current = memoryBank.get('preferences');
  memoryBank.set('preferences', { ...current, ...(req.body || {}) });
  res.json({ ok: true, preferences: memoryBank.get('preferences') });
});

// ── API: Weather ─────────────────────────────────────────────────────────────
app.get('/api/weather', auth.requireAuth, async (req, res) => {
  const { location = 'Prishtinë', lat, lon, forceRefresh = 'false' } = req.query;
  try {
    const data = await fetchWeather({
      location,
      lat: lat ? parseFloat(lat) : undefined,
      lon: lon ? parseFloat(lon) : undefined,
      forceRefresh: forceRefresh === 'true',
    });
    res.json(data);
  } catch (err) {
    console.error('[server] weather fetch error:', err);
    res.status(500).json({ error: err.message, skill: 'weather-monitor' });
  }
});

// ── API: Wildfire detections ─────────────────────────────────────────────────────
app.get('/api/wildfire', auth.requireAuth, async (req, res) => {
  const { period = '24h', lat, lon, forceRefresh = 'false', debug = 'false' } = req.query;
  try {
    const data = await fetchWildfire({
      period,
      lat: lat ? parseFloat(lat) : undefined,
      lon: lon ? parseFloat(lon) : undefined,
      forceRefresh: forceRefresh === 'true',
      debug: debug === 'true'
    });
    res.json(data);
  } catch (err) {
    console.error('[server] wildfire fetch error:', err);
    res.status(500).json({ error: err.message, detections: [], count: 0 });
  }
});

// ── API: Aviation Intelligence ────────────────────────────────────────────────
app.get('/api/aviation', auth.requireAuth, async (req, res) => {
  const { forceRefresh = 'false' } = req.query;
  try {
    const data = await fetchAviation({ forceRefresh: forceRefresh === 'true' });
    res.json(data);
  } catch (err) {
    console.error('[server] aviation fetch error:', err);
    res.status(500).json({
      skill: 'aviation-monitor',
      status: 'UNAVAILABLE',
      source: 'Live ADS-B Services',
      updatedAt: new Date().toISOString(),
      error: err.message,
      count: 0,
      summary: { commercial: 0, private: 0, privateJets: 0, military: 0, unknown: 0 },
      aircraft: []
    });
  }
});

// ── API: Telegram Public Feed ─────────────────────────────────────────────────
app.get('/api/telegram', auth.requireAuth, async (req, res) => {
  const { forceRefresh = 'false', channels, limit, demo = 'false' } = req.query;
  try {
    const channelList = channels ? channels.split(',').map(s => s.trim()).filter(Boolean) : null;
    const limitNum = limit ? parseInt(limit, 10) : null;
    const data = await fetchTelegram({
      channels: channelList,
      limitPerChannel: limitNum,
      forceRefresh: forceRefresh === 'true',
      useDemo: demo === 'true'
    });
    res.json(data);
  } catch (err) {
    console.error('[server] telegram fetch error:', err);
    res.status(500).json({
      skill: 'telegram-monitor',
      status: 'UNAVAILABLE',
      source: 'Telegram Official API',
      updatedAt: new Date().toISOString(),
      channels: [],
      count: 0,
      posts: [],
      error: 'SERVER_ERROR',
      message: err.message || 'Failed to fetch Telegram intelligence.'
    });
  }
});

// ── API: Telegram Media Thumbnail Preview ──────────────────────────────────────
app.get('/api/telegram/media', auth.requireAuth, async (req, res) => {
  const { channel, id, demo = 'false' } = req.query;
  if (!channel || !id) {
    return res.status(400).json({ error: 'channel and id are required' });
  }

  try {
    const thumb = await fetchMediaThumbnail({
      channel,
      messageId: id,
      demo: demo === 'true'
    });

    if (thumb && thumb.buffer) {
      res.setHeader('Content-Type', thumb.mimeType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(thumb.buffer);
    }

    return res.status(404).json({ error: 'Thumbnail not available' });
  } catch (err) {
    console.error('[server] Telegram media thumbnail error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve media thumbnail' });
  }
});

// ── API: Border Crossing Monitor ──────────────────────────────────────────────
app.get('/api/borders', auth.requireAuth, async (req, res) => {
  const { forceRefresh = 'false' } = req.query;
  try {
    const data = await fetchBorders({
      forceRefresh: forceRefresh === 'true'
    });
    res.json(data);
  } catch (err) {
    console.error('[server] borders fetch error:', err.message);
    res.status(500).json({
      skill: 'border-monitor',
      status: 'UNAVAILABLE',
      source: 'QKMK',
      updatedAt: new Date().toISOString(),
      count: 0,
      crossings: [],
      error: 'SERVER_ERROR',
      message: err.message || 'Failed to fetch border crossing intelligence.'
    });
  }
});

// ── API: Staff Warden & Evacuation (Protected) ─────────────────────────────────
function requireStaffAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : req.headers['x-staff-token'];
  const session = staffService.verifyToken(token);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Valid staff credentials required' });
  }
  req.staffUser = session.user;
  next();
}

app.post('/api/staff/login', (req, res) => {
  const { username, password } = req.body || {};
  const authResult = staffService.login(username, password);
  if (!authResult.success) {
    return res.status(401).json(authResult);
  }
  res.json(authResult);
});

app.post('/api/staff/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/staff/locations', requireStaffAuth, (req, res) => {
  try {
    const locations = staffService.getLocations();
    res.json({ locations, count: locations.length, user: req.staffUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/staff/locations', requireStaffAuth, (req, res) => {
  try {
    const created = staffService.addLocation(req.body);
    res.status(201).json({ success: true, location: created });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/staff/import', requireStaffAuth, (req, res) => {
  try {
    const locations = staffService.importLocations(req.body.locations);
    res.json({ success: true, count: locations.length, locations });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/staff/locations/:id', requireStaffAuth, (req, res) => {
  try {
    const removed = staffService.deleteLocation(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Location not found' });
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Serve frontend ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🛰️  SENTINEL Dashboard running at http://localhost:${PORT}`);
  console.log(`   SSE feed at http://localhost:${PORT}/events`);
  console.log(`   API docs: POST /api/status, GET /api/alerts, GET /api/locations\n`);
});
