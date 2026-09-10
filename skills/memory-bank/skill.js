'use strict';

const path = require('path');
const db = require('../../server/db');

const MAX_ALERTS = 100;

const DEFAULT_PREFERENCES = {
  defaultLocation: 'Mitrovica, Kosovo',
  defaultTimeline: '24h',
  alertThresholds: { news: 7, trafficIncidents: 3, radiation: 'elevated' },
  browserNotifications: true,
  pollIntervalMs: 300000,
};

function getLocations() {
  try {
    const rows = db.prepare('SELECT * FROM locations ORDER BY last_monitored DESC LIMIT 20').all();
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      lat: r.lat,
      lon: r.lon,
      addedAt: r.added_at,
      lastMonitored: r.last_monitored,
      monitorCount: r.monitor_count
    }));
  } catch (err) {
    console.warn('[memory-bank] getLocations error:', err.message);
    return [];
  }
}

function getAlerts() {
  try {
    const rows = db.prepare('SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 100').all();
    return rows.map(r => ({
      id: r.id,
      module: r.module,
      panelId: r.panel_id,
      type: r.type,
      severity: r.severity,
      title: r.title,
      message: r.message,
      timestamp: r.timestamp,
      source: r.source,
      sourceUrl: r.source_url,
      location: r.location,
      coordinates: r.coordinates_json ? JSON.parse(r.coordinates_json) : null,
      value: r.value,
      threshold: r.threshold,
      isCached: Boolean(r.is_cached),
      read: Boolean(r.read)
    }));
  } catch (err) {
    console.warn('[memory-bank] getAlerts error:', err.message);
    return [];
  }
}

function getPreferences() {
  try {
    const row = db.prepare('SELECT value_json FROM preferences WHERE key = ?').get('user_preferences');
    if (row && row.value_json) {
      return JSON.parse(row.value_json);
    }
  } catch (err) {
    console.warn('[memory-bank] getPreferences error:', err.message);
  }
  return DEFAULT_PREFERENCES;
}

function setPreferences(val) {
  try {
    db.prepare(`
      INSERT INTO preferences (key, value_json, updated_at)
      VALUES ('user_preferences', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
    `).run(JSON.stringify(val), new Date().toISOString());
  } catch (err) {
    console.warn('[memory-bank] setPreferences error:', err.message);
  }
}

function get(key) {
  if (key === 'locations') return getLocations();
  if (key === 'alerts') return getAlerts();
  if (key === 'preferences') return getPreferences();
  if (key === 'cache') {
    try {
      const row = db.prepare("SELECT data_json, fetched_at FROM cache WHERE key = 'orchestrator_cache'").get();
      return row ? { lastFetch: row.fetched_at, data: JSON.parse(row.data_json) } : { lastFetch: null, data: {} };
    } catch {
      return { lastFetch: null, data: {} };
    }
  }
  return null;
}

function set(key, value) {
  if (key === 'preferences') {
    setPreferences(value);
  } else if (key === 'cache') {
    setCache(value?.data);
  }
}

function addLocation(loc) {
  if (!loc || !loc.name) return;
  try {
    const existing = db.prepare('SELECT * FROM locations WHERE name = ? COLLATE NOCASE').get(loc.name);
    const now = new Date().toISOString();
    if (existing) {
      db.prepare(`
        UPDATE locations SET
          last_monitored = ?,
          monitor_count = monitor_count + 1,
          lat = COALESCE(?, lat),
          lon = COALESCE(?, lon)
        WHERE id = ?
      `).run(now, typeof loc.lat === 'number' ? loc.lat : null, typeof loc.lon === 'number' ? loc.lon : null, existing.id);
    } else {
      const id = loc.id || `loc-${Date.now()}`;
      db.prepare(`
        INSERT INTO locations (id, name, lat, lon, added_at, last_monitored, monitor_count)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `).run(id, loc.name, typeof loc.lat === 'number' ? loc.lat : null, typeof loc.lon === 'number' ? loc.lon : null, now, now);

      // Keep maximum 20 locations
      const count = db.prepare('SELECT COUNT(*) as count FROM locations').get().count;
      if (count > 20) {
        db.prepare('DELETE FROM locations WHERE id IN (SELECT id FROM locations ORDER BY last_monitored ASC LIMIT ?)').run(count - 20);
      }
    }
  } catch (err) {
    console.warn('[memory-bank] addLocation error:', err.message);
  }
}

const insertAlertStmt = db.prepare(`
  INSERT INTO alerts (
    id, module, panel_id, type, severity, title, message, timestamp,
    source, source_url, location, coordinates_json, value, threshold,
    is_cached, read, created_at
  ) VALUES (
    @id, @module, @panelId, @type, @severity, @title, @message, @timestamp,
    @source, @sourceUrl, @location, @coordinatesJson, @value, @threshold,
    @isCached, @read, @createdAt
  )
  ON CONFLICT(id) DO UPDATE SET
    severity = excluded.severity,
    title = excluded.title,
    message = excluded.message,
    timestamp = excluded.timestamp
`);

function addAlerts(newAlerts) {
  if (!Array.isArray(newAlerts) || !newAlerts.length) return;
  const now = Date.now();
  const tx = db.transaction((alerts) => {
    for (const a of alerts) {
      if (!a || !a.id) continue;
      const pubTime = new Date(a.timestamp || 0).getTime();
      if (pubTime > 0 && (now - pubTime) > 48 * 3600 * 1000) continue; // Drop stale alert (>48h)

      insertAlertStmt.run({
        id: a.id,
        module: a.module || a.category || 'news',
        panelId: a.panelId || 'newsPanel',
        type: a.type || 'ALERT',
        severity: String(a.severity || 'MEDIUM').toUpperCase(),
        title: a.title || 'Security Alert',
        message: a.message || '',
        timestamp: a.timestamp || new Date().toISOString(),
        source: a.source || 'SENTINEL',
        sourceUrl: a.sourceUrl || a.url || '',
        location: a.location || 'Kosovo',
        coordinatesJson: a.coordinates ? JSON.stringify(a.coordinates) : null,
        value: typeof a.value === 'number' ? a.value : null,
        threshold: a.threshold || null,
        isCached: a.isCached ? 1 : 0,
        read: a.read ? 1 : 0,
        createdAt: a.timestamp || new Date().toISOString()
      });
    }

    // Enforce 100 max alerts
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM alerts').get().count;
    if (totalCount > MAX_ALERTS) {
      db.prepare('DELETE FROM alerts WHERE id IN (SELECT id FROM alerts ORDER BY timestamp ASC LIMIT ?)').run(totalCount - MAX_ALERTS);
    }
  });

  try {
    tx(newAlerts);
  } catch (err) {
    console.warn('[memory-bank] addAlerts transaction error:', err.message);
  }
}

function markAlertsRead() {
  try {
    db.prepare('UPDATE alerts SET read = 1 WHERE read = 0').run();
  } catch (err) {
    console.warn('[memory-bank] markAlertsRead error:', err.message);
  }
}

function getUnreadCount() {
  try {
    const row = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE read = 0').get();
    return row ? row.count : 0;
  } catch (err) {
    console.warn('[memory-bank] getUnreadCount error:', err.message);
    return 0;
  }
}

function setCache(data) {
  try {
    const now = Date.now();
    db.prepare(`
      INSERT INTO cache (key, data_json, fetched_at, expires_at)
      VALUES ('orchestrator_cache', ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        data_json = excluded.data_json,
        fetched_at = excluded.fetched_at,
        expires_at = excluded.expires_at
    `).run(JSON.stringify(data || {}), new Date().toISOString(), now + 300000);
  } catch (err) {
    console.warn('[memory-bank] setCache error:', err.message);
  }
}

function getCache(maxAgeMs = 5 * 60 * 1000) {
  try {
    const row = db.prepare("SELECT data_json, fetched_at FROM cache WHERE key = 'orchestrator_cache'").get();
    if (!row) return null;
    const age = Date.now() - new Date(row.fetched_at).getTime();
    return age < maxAgeMs ? JSON.parse(row.data_json) : null;
  } catch (err) {
    console.warn('[memory-bank] getCache error:', err.message);
    return null;
  }
}

function clearCache() {
  try {
    db.prepare("DELETE FROM cache WHERE key = 'orchestrator_cache'").run();
  } catch (err) {
    console.warn('[memory-bank] clearCache error:', err.message);
  }
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
  console.log('Memory Bank Test (SQLite WAL)');
  addLocation({ name: 'Mitrovica, Kosovo', lat: 42.89, lon: 20.87 });
  addLocation({ name: 'Prishtina, Kosovo', lat: 42.66, lon: 21.16 });
  console.log('Locations count:', get('locations').length);
  addAlerts([{
    id: `test-${Date.now()}`,
    timestamp: new Date().toISOString(),
    severity: 'high',
    category: 'news',
    title: 'Test Alert',
    message: 'Testing SQLite memory bank',
    location: 'Mitrovica',
    read: false
  }]);
  console.log('Unread count:', getUnreadCount());
  markAlertsRead();
  console.log('After read, unread count:', getUnreadCount());
}
