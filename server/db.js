'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'sentinel.db');
const db = new Database(DB_PATH);

// Enable WAL mode, foreign keys, and sensible busy timeouts
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('operator', 'administrator')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    csrf_token TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT
  );

  CREATE TABLE IF NOT EXISTS auth_rate_limits (
    key TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL,
    first_attempt INTEGER NOT NULL,
    locked_until INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL COLLATE NOCASE,
    lat REAL,
    lon REAL,
    added_at TEXT NOT NULL,
    last_monitored TEXT NOT NULL,
    monitor_count INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    module TEXT NOT NULL,
    panel_id TEXT,
    type TEXT,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    timestamp TEXT NOT NULL,
    source TEXT,
    source_url TEXT,
    location TEXT,
    coordinates_json TEXT,
    value REAL,
    threshold TEXT,
    is_cached INTEGER DEFAULT 0,
    read INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS preferences (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    data_json TEXT NOT NULL,
    fetched_at TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
  CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(read);
  CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);
`);

/**
 * Migrate legacy server/db.json data into SQLite if not already migrated
 */
function migrateLegacyJsonDb() {
  const legacyPath = path.join(__dirname, 'db.json');
  if (!fs.existsSync(legacyPath)) return;

  const countAlerts = db.prepare('SELECT COUNT(*) as count FROM alerts').get().count;
  const countLocations = db.prepare('SELECT COUNT(*) as count FROM locations').get().count;

  // Only migrate if database is currently empty
  if (countAlerts > 0 || countLocations > 0) return;

  try {
    const raw = fs.readFileSync(legacyPath, 'utf8');
    const legacy = JSON.parse(raw);
    console.log('[database] Migrating legacy server/db.json to SQLite...');

    const insertLocation = db.prepare(`
      INSERT OR IGNORE INTO locations (id, name, lat, lon, added_at, last_monitored, monitor_count)
      VALUES (@id, @name, @lat, @lon, @addedAt, @lastMonitored, @monitorCount)
    `);

    const insertAlert = db.prepare(`
      INSERT OR IGNORE INTO alerts (
        id, module, panel_id, type, severity, title, message, timestamp,
        source, source_url, location, coordinates_json, value, threshold,
        is_cached, read, created_at
      ) VALUES (
        @id, @module, @panelId, @type, @severity, @title, @message, @timestamp,
        @source, @sourceUrl, @location, @coordinatesJson, @value, @threshold,
        @isCached, @read, @createdAt
      )
    `);

    const setPref = db.prepare(`
      INSERT OR REPLACE INTO preferences (key, value_json, updated_at)
      VALUES (@key, @valueJson, @updatedAt)
    `);

    const setCacheEntry = db.prepare(`
      INSERT OR REPLACE INTO cache (key, data_json, fetched_at, expires_at)
      VALUES (@key, @dataJson, @fetchedAt, @expiresAt)
    `);

    const migrateTx = db.transaction(() => {
      // 1. Locations
      if (Array.isArray(legacy.locations)) {
        for (const loc of legacy.locations) {
          insertLocation.run({
            id: loc.id || `loc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: loc.name || 'Unknown',
            lat: typeof loc.lat === 'number' ? loc.lat : null,
            lon: typeof loc.lon === 'number' ? loc.lon : null,
            addedAt: loc.addedAt || new Date().toISOString(),
            lastMonitored: loc.lastMonitored || new Date().toISOString(),
            monitorCount: loc.monitorCount || 1
          });
        }
      }

      // 2. Alerts
      if (Array.isArray(legacy.alerts)) {
        for (const a of legacy.alerts) {
          insertAlert.run({
            id: a.id || `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
      }

      // 3. Preferences
      if (legacy.preferences && typeof legacy.preferences === 'object') {
        setPref.run({
          key: 'user_preferences',
          valueJson: JSON.stringify(legacy.preferences),
          updatedAt: new Date().toISOString()
        });
      }

      // 4. Cache
      if (legacy.cache && legacy.cache.data) {
        setCacheEntry.run({
          key: 'orchestrator_cache',
          dataJson: JSON.stringify(legacy.cache.data),
          fetchedAt: legacy.cache.lastFetch || new Date().toISOString(),
          expiresAt: Date.now() + 300000
        });
      }
    });

    migrateTx();
    console.log('[database] Legacy db.json migration successfully completed.');
  } catch (err) {
    console.warn('[database] Legacy db.json migration skipped or failed:', err.message);
  }
}

migrateLegacyJsonDb();

function seedBootstrapAdmin() {
  try {
    const defaultUser = process.env.ADMIN_BOOTSTRAP_USER || 'rakicko';
    const defaultPass = process.env.ADMIN_BOOTSTRAP_PASS || 'Medjurecko1';
    const existing = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(defaultUser);
    if (!existing) {
      const crypto = require('crypto');
      const salt = crypto.randomBytes(32).toString('hex');
      const hash = crypto.scryptSync(defaultPass, salt, 64).toString('hex');
      const now = new Date().toISOString();
      const id = `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      db.prepare('INSERT INTO users (id, username, password_hash, salt, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id, defaultUser, hash, salt, 'administrator', now, now);
      console.log(`[database] Seeded bootstrap administrator: ${defaultUser}`);
    }
  } catch (err) {
    console.warn('[database] Bootstrap admin seeding failed:', err.message);
  }
}

seedBootstrapAdmin();

module.exports = db;

