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

const app  = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
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

// ── SSE endpoint ─────────────────────────────────────────────────────────────
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Heartbeat every 30s
  const heartbeat = setInterval(() => { try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); } }, 30000);

  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SENTINEL live feed connected' })}\n\n`);
  sseClients.add(res);

  req.on('close', () => { sseClients.delete(res); clearInterval(heartbeat); });
});

// ── API: Fetch status for a location ────────────────────────────────────────
app.post('/api/status', async (req, res) => {
  const { location, lat, lon, timeline = '24h', forceRefresh = false, customKeywords = [] } = req.body;
  if (!location) return res.status(400).json({ error: 'location is required' });
  try {
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
app.get('/api/alerts', (req, res) => {
  const alerts = memoryBank.get('alerts') || [];
  const unread = memoryBank.getUnreadCount();
  res.json({ alerts, unreadCount: unread });
});

// ── API: Mark alerts read ─────────────────────────────────────────────────────
app.post('/api/alerts/read', (req, res) => {
  memoryBank.markAlertsRead();
  res.json({ ok: true });
});

// ── API: Location history ─────────────────────────────────────────────────────
app.get('/api/locations', (req, res) => {
  res.json({ locations: memoryBank.get('locations') || [] });
});

// ── API: Get/set preferences ──────────────────────────────────────────────────
app.get('/api/preferences', (req, res) => {
  res.json({ preferences: memoryBank.get('preferences') });
});

app.post('/api/preferences', (req, res) => {
  const current = memoryBank.get('preferences');
  memoryBank.set('preferences', { ...current, ...req.body });
  res.json({ ok: true, preferences: memoryBank.get('preferences') });
});

// ── API: Weather ─────────────────────────────────────────────────────────────
app.get('/api/weather', async (req, res) => {
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
app.get('/api/wildfire', async (req, res) => {
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
app.get('/api/aviation', async (req, res) => {
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
app.get('/api/telegram', async (req, res) => {
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
app.get('/api/telegram/media', async (req, res) => {
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
app.get('/api/borders', async (req, res) => {
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

// ── Serve frontend ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🛰️  SENTINEL Dashboard running at http://localhost:${PORT}`);
  console.log(`   SSE feed at http://localhost:${PORT}/events`);
  console.log(`   API docs: POST /api/status, GET /api/alerts, GET /api/locations\n`);
});
