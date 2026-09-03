'use strict';

const db = require('../../server/db');

const MAX_ALERTS = 100;

const DEFAULT_PREFERENCES = {
  defaultLocation: 'Mitrovica, Kosovo',
  defaultTimeline: '24h',
  alertThresholds: { news: 7, trafficIncidents: 3, radiation: 'elevated' },
  browserNotifications: true,
  pollIntervalMs: 300000,
};

// Prepared Statements
const stmtGetLocations = db.prepare('SELECT id, name, lat, lon, added_at as addedAt, last_monitored as lastMonitored, monitor_count as monitorCount FROM locations ORDER BY last_monitored DESC LIMIT 20');
const stmtFindLocation = db.prepare('SELECT id, monitor_count as monitorCount FROM locations WHERE name = ? COLLATE NOCASE');
const stmtUpdateLocation = db.prepare('UPDATE locations SET last_monitored = ?, monitor_count = ?, lat = COALESCE(?, lat), lon = COALESCE(?, lon) WHERE id = ?');
const stmtInsertLocation = db.prepare('INSERT INTO locations (id, name, lat, lon, added_at, last_monitored, monitor_count) VALUES (?, ?, ?, ?, ?, ?, ?)');

const stmtGetAlerts = db.prepare('SELECT id, module, panel_id as panelId, type, severity, title, message, timestamp, source, source_url as sourceUrl, location, coordinates_json as coordinatesJson, value, threshold, is_cached as isCached, read FROM alerts ORDER BY timestamp DESC LIMIT ?');
const stmtUnreadCount = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE read = 0');
const stmtMarkAlertsRead = db.prepare('UPDATE alerts SET read = 1 WHERE read = 0');
const stmtFindAlert = db.prepare('SELECT id, read FROM alerts WHERE id = ?');
const stmtInsertAlert = db.prepare(`
  INSERT INTO alerts (id, module, panel_id, type, severity, title, message, timestamp, source, source_url, location, coordinates_json, value, threshold, is_cached, read, created_at)
  VALUES (@id, @module, @panelId, @type, @severity, @title, @message, @timestamp, @source, @sourceUrl, @location, @coordinatesJson, @value, @threshold, @isCached, @read, @createdAt)
`);
const stmtUpdateAlert = db.prepare(`
  UPDATE alerts SET module = @module, panel_id = @panelId, type = @type, severity = @severity, title = @title, message = @message, timestamp = @timestamp, source = @source, source_url = @sourceUrl, location = @location, coordinates_json = @coordinatesJson, value = @value, threshold = @threshold, is_cached = @isCached
  WHERE id = @id
`);

const stmtGetPref = db.prepare('SELECT value_json FROM preferences WHERE key = ?');
const stmtSetPref = db.prepare('INSERT OR REPLACE INTO preferences (key, value_json, updated_at) VALUES (?, ?, ?)');

const stmtGetCache = db.prepare('SELECT data_json, fetched_at, expires_at FROM cache WHERE key = ?');
const stmtSetCache = db.prepare('INSERT OR REPLACE INTO cache (key, data_json, fetched_at, expires_at) VALUES (?, ?, ?, ?)');
const stmtClearCache = db.prepare('DELETE FROM cache WHERE key = ?');

function get(key) {
  if (key === 'locations') {
    return stmtGetLocations.all();
  }

  if (key === 'alerts') {
    const rows = stmtGetAlerts.all(MAX_ALERTS);
    return rows.map(r => ({
      ...r,
      read: Boolean(r.read),
      isCached: Boolean(r.isCached),
      coordinates: r.coordinatesJson ? JSON.parse(r.coordinatesJson) : null
    }));
  }

  if (key === 'preferences') {
    const row = stmtGetPref.get('user_preferences');
    if (!row || !row.value_json) return { ...DEFAULT_PREFERENCES };
    try {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(row.value_json) };
    } catch {
      return { ...DEFAULT_PREFERENCES };
    }
  }

  return null;
}

function set(key, value) {
  if (key === 'preferences') {
    const current = get('preferences') || {};
    const merged = { ...current, ...value };
    stmtSetPref.run('user_preferences', JSON.stringify(merged), new Date().toISOString());
  }
}

function addLocation(loc) {
  if (!loc || !loc.name) return;
  const now = new Date().toISOString();
  const existing = stmtFindLocation.get(loc.name);

  if (existing) {
    stmtUpdateLocation.run(now, (existing.monitorCount || 0) + 1, loc.lat || null, loc.lon || null, existing.id);
  } else {
    const id = `loc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    stmtInsertLocation.run(id, loc.name, loc.lat || null, loc.lon || null, now, now, 1);
  }
}

function addAlerts(newAlerts) {
  if (!Array.isArray(newAlerts) || !newAlerts.length) return;
  const now = new Date().toISOString();

  const insertTx = db.transaction((alerts) => {
    for (const na of alerts) {
      if (!na || !na.id) continue;
      const existing = stmtFindAlert.get(na.id);
      const params = {
        id: na.id,
        module: na.module || 'alert',
        panelId: na.panelId || null,
        type: na.type || 'ALERT',
        severity: String(na.severity || 'MEDIUM').toUpperCase(),
        title: na.title || 'Security Alert',
        message: na.message || '',
        timestamp: na.timestamp || now,
        source: na.source || 'SENTINEL',
        sourceUrl: na.sourceUrl || '',
        location: na.location || 'Kosovo',
        coordinatesJson: na.coordinates ? JSON.stringify(na.coordinates) : null,
        value: typeof na.value === 'number' ? na.value : null,
        threshold: na.threshold || null,
        isCached: na.isCached ? 1 : 0,
        read: existing ? existing.read : 0,
        createdAt: now
      };

      if (existing) {
        stmtUpdateAlert.run(params);
      } else {
        stmtInsertAlert.run(params);
      }
    }
  });

  insertTx(newAlerts);
}

function markAlertsRead() {
  stmtMarkAlertsRead.run();
}

function getUnreadCount() {
  return stmtUnreadCount.get().count || 0;
}

function setCache(keyOrData, maybeData, ttlMs = 300000) {
  let key = 'orchestrator_cache';
  let data = keyOrData;
  let ttl = ttlMs;
  if (typeof keyOrData === 'string' && maybeData !== undefined) {
    key = keyOrData;
    data = maybeData;
  }
  const now = new Date().toISOString();
  const expiresAt = Date.now() + ttl;
  stmtSetCache.run(key, JSON.stringify(data), now, expiresAt);
}

function getCache(keyOrMaxAge = 5 * 60 * 1000, maybeMaxAge) {
  let key = 'orchestrator_cache';
  let maxAgeMs = 5 * 60 * 1000;
  if (typeof keyOrMaxAge === 'string') {
    key = keyOrMaxAge;
    if (typeof maybeMaxAge === 'number') maxAgeMs = maybeMaxAge;
  } else if (typeof keyOrMaxAge === 'number') {
    maxAgeMs = keyOrMaxAge;
  }
  const row = stmtGetCache.get(key);
  if (!row) return null;
  const age = Date.now() - new Date(row.fetched_at).getTime();
  if (age < maxAgeMs) {
    try {
      return JSON.parse(row.data_json);
    } catch {
      return null;
    }
  }
  return null;
}

function clearCache(key = 'orchestrator_cache') {
  stmtClearCache.run(key);
}

module.exports = {
  get,
  set,
  addLocation,
  addAlerts,
  markAlertsRead,
  getUnreadCount,
  setCache,
  getCache,
  clearCache
};

if (require.main === module) {
  console.log('Testing Memory Bank SQLite implementation...');
  addLocation({ name: 'Mitrovica, Kosovo', lat: 42.89, lon: 20.87 });
  addLocation({ name: 'Prishtina, Kosovo', lat: 42.66, lon: 21.16 });
  console.log('Locations count:', get('locations').length);
  addAlerts([{
    id: `test-alert-${Date.now()}`,
    severity: 'HIGH',
    module: 'news',
    title: 'Test Alert Verification',
    message: 'Testing SQLite ACID durability',
    location: 'Mitrovica',
    timestamp: new Date().toISOString()
  }]);
  console.log('Unread alerts:', getUnreadCount());
  markAlertsRead();
  console.log('Unread after markAlertsRead:', getUnreadCount());
}
