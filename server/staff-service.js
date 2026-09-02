'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'staff-db.json');

// Auth Credentials
const AUTH_USER = process.env.STAFF_AUTH_USER || 'warden';
const AUTH_PASS = process.env.STAFF_AUTH_PASS || 'osce2026safe';
const SESSION_SECRET = process.env.STAFF_SESSION_SECRET || 'k0s1nt_w4rd3n_s3cr3t_2026_x9';
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Seed operational staff locations & safe havens
 */
const DEFAULT_STAFF_DB = {
  version: 1,
  updatedAt: new Date().toISOString(),
  locations: [
    {
      id: 'staff-safe-haven-01',
      callsign: 'SAFE HAVEN - NORTH',
      name: 'Regional Mission Office / Assembly Point North',
      category: 'safe_haven',
      nationality: 'International Mission',
      zone: 'Mitrovica North',
      address: 'Kralja Petra I, Severna Mitrovica',
      phone: '+383 28 530 100',
      emergencyContact: 'Security Desk: Ch 16 / +383 49 100 200',
      lat: 42.8945,
      lon: 20.8672,
      evacuationPriority: 'CRITICAL',
      capacity: '40 Persons',
      notes: 'Primary fortified rally point, generator power, satellite comms & medical kit.'
    },
    {
      id: 'staff-safe-haven-02',
      callsign: 'SAFE HAVEN - HQ',
      name: 'Central Mission HQ / Assembly Point Prishtinë',
      category: 'safe_haven',
      nationality: 'International Mission',
      zone: 'Prishtinë',
      address: 'M9 / Veternik, Prishtinë',
      phone: '+383 38 500 100',
      emergencyContact: '24/7 Ops Room: +383 49 500 200',
      lat: 42.6412,
      lon: 21.1554,
      evacuationPriority: 'CRITICAL',
      capacity: '120 Persons',
      notes: 'Main compound, helipad access, emergency trauma stabilization.'
    },
    {
      id: 'staff-residence-01',
      callsign: 'ALPHA-1',
      name: 'Team Leader Residence',
      category: 'residence',
      nationality: 'International',
      zone: 'Mitrovica North',
      address: 'Kolašinska / Bošnjačka Mahala sector',
      phone: '+383 49 701 101',
      emergencyContact: 'Warden Sector A',
      lat: 42.8968,
      lon: 20.8715,
      evacuationPriority: 'HIGH',
      capacity: '2 Persons',
      notes: 'Apartment on 2nd floor, access from courtyard, primary evacuation route via Zvečan.'
    },
    {
      id: 'staff-residence-02',
      callsign: 'ALPHA-2',
      name: 'Senior Security Officer Residence',
      category: 'residence',
      nationality: 'International',
      zone: 'Mitrovica North',
      address: 'Sutjeska, Severna Mitrovica',
      phone: '+383 49 701 102',
      emergencyContact: 'Warden Sector A',
      lat: 42.8920,
      lon: 20.8612,
      evacuationPriority: 'HIGH',
      capacity: '3 Persons',
      notes: 'Secure compound with armored parking.'
    },
    {
      id: 'staff-residence-03',
      callsign: 'BRAVO-1',
      name: 'Reporting Officer Residence',
      category: 'residence',
      nationality: 'International',
      zone: 'Prishtinë',
      address: 'Dragodan / Arberia sector, Prishtinë',
      phone: '+383 49 701 103',
      emergencyContact: 'Warden Sector B',
      lat: 42.6655,
      lon: 21.1510,
      evacuationPriority: 'MEDIUM',
      capacity: '2 Persons',
      notes: 'Gated residential complex, quick egress to highway M2.'
    },
    {
      id: 'staff-residence-04',
      callsign: 'CHARLIE-1',
      name: 'Field Monitor Residence',
      category: 'residence',
      nationality: 'International',
      zone: 'Leposaviq / Leposavić',
      address: 'Centar, Leposavić',
      phone: '+383 49 701 104',
      emergencyContact: 'Warden Sector C',
      lat: 43.1025,
      lon: 20.8033,
      evacuationPriority: 'HIGH',
      capacity: '2 Persons',
      notes: 'Northern border corridor proximity (Jarinje exit route).'
    }
  ]
};

/**
 * Load Database from disk
 */
function loadDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_STAFF_DB, null, 2));
      return JSON.parse(JSON.stringify(DEFAULT_STAFF_DB));
    }
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[staff-service] DB read error:', err.message);
    return JSON.parse(JSON.stringify(DEFAULT_STAFF_DB));
  }
}

/**
 * Save Database to disk
 */
function saveDb(db) {
  try {
    db.updatedAt = new Date().toISOString();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    return true;
  } catch (err) {
    console.error('[staff-service] DB write error:', err.message);
    return false;
  }
}

/**
 * Constant-time string equality check
 */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // still compare against self to prevent timing disparity
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Authenticate credentials and return signed token
 */
function login(username, password) {
  if (!username || !password) {
    return { success: false, error: 'Username and password are required' };
  }

  const userMatch = safeEqual(username.trim(), AUTH_USER.trim());
  const passMatch = safeEqual(password, AUTH_PASS);

  if (!userMatch || !passMatch) {
    return { success: false, error: 'Invalid username or password' };
  }

  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${username}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  const token = Buffer.from(`${payload}:${hmac}`).toString('base64url');

  return {
    success: true,
    token,
    user: username,
    expiresAt: new Date(expiresAt).toISOString()
  };
}

/**
 * Verify a signed token
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const parts = raw.split(':');
    if (parts.length !== 3) return false;

    const [user, expStr, signature] = parts;
    const expiresAt = parseInt(expStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return false;

    const expectedHmac = crypto.createHmac('sha256', SESSION_SECRET).update(`${user}:${expiresAt}`).digest('hex');
    if (!safeEqual(signature, expectedHmac)) return false;

    return { user, expiresAt };
  } catch {
    return false;
  }
}

/**
 * Get all staff locations
 */
function getLocations() {
  const db = loadDb();
  return db.locations || [];
}

/**
 * Add a new staff location
 */
function addLocation(data) {
  if (!data || !data.callsign || typeof data.lat !== 'number' || typeof data.lon !== 'number') {
    throw new Error('Callsign, lat, and lon are required');
  }

  const db = loadDb();
  const newLocation = {
    id: data.id || `staff-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    callsign: String(data.callsign).trim(),
    name: String(data.name || data.callsign).trim(),
    category: data.category || 'residence',
    nationality: data.nationality || 'International',
    zone: data.zone || 'Kosovo',
    address: data.address || '',
    phone: data.phone || '',
    emergencyContact: data.emergencyContact || '',
    lat: Number(data.lat),
    lon: Number(data.lon),
    evacuationPriority: data.evacuationPriority || 'MEDIUM',
    capacity: data.capacity || '1 Person',
    notes: data.notes || '',
    updatedAt: new Date().toISOString()
  };

  db.locations.unshift(newLocation);
  saveDb(db);
  return newLocation;
}

/**
 * Update an existing staff location
 */
function updateLocation(id, data) {
  const db = loadDb();
  const idx = db.locations.findIndex(l => l.id === id);
  if (idx === -1) return null;

  db.locations[idx] = {
    ...db.locations[idx],
    ...data,
    id, // preserve id
    updatedAt: new Date().toISOString()
  };

  saveDb(db);
  return db.locations[idx];
}

/**
 * Delete a staff location
 */
function deleteLocation(id) {
  const db = loadDb();
  const initialLen = db.locations.length;
  db.locations = db.locations.filter(l => l.id !== id);
  if (db.locations.length !== initialLen) {
    saveDb(db);
    return true;
  }
  return false;
}

/**
 * Bulk import staff locations
 */
function importLocations(list) {
  if (!Array.isArray(list)) throw new Error('Input must be an array of locations');
  const valid = list.filter(item => item && item.callsign && typeof item.lat === 'number' && typeof item.lon === 'number');
  const db = loadDb();
  db.locations = valid.map((item, idx) => ({
    id: item.id || `staff-imp-${Date.now()}-${idx}`,
    callsign: String(item.callsign).trim(),
    name: String(item.name || item.callsign).trim(),
    category: item.category || 'residence',
    nationality: item.nationality || 'International',
    zone: item.zone || 'Kosovo',
    address: item.address || '',
    phone: item.phone || '',
    emergencyContact: item.emergencyContact || '',
    lat: Number(item.lat),
    lon: Number(item.lon),
    evacuationPriority: item.evacuationPriority || 'MEDIUM',
    capacity: item.capacity || '1 Person',
    notes: item.notes || '',
    updatedAt: new Date().toISOString()
  }));
  saveDb(db);
  return db.locations;
}

module.exports = {
  login,
  verifyToken,
  getLocations,
  addLocation,
  updateLocation,
  deleteLocation,
  importLocations,
  DB_PATH
};
