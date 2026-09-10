'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'staff-db.json');

// Auth Credentials
const isProduction = process.env.NODE_ENV === 'production';
let SESSION_SECRET = process.env.STAFF_SESSION_SECRET || 'k0s1nt_w4rd3n_s3cr3t_2026_x9';
const AUTH_USER = process.env.STAFF_AUTH_USER || 'warden';
const AUTH_PASS = process.env.STAFF_AUTH_PASS || 'osce2026safe';

if (isProduction) {
  if (!process.env.STAFF_AUTH_PASS || process.env.STAFF_AUTH_PASS === 'osce2026safe') {
    console.warn('[staff-service] Production notice: STAFF_AUTH_PASS not set or default; consider configuring a custom STAFF_AUTH_PASS in production.');
  }
  if (!process.env.STAFF_SESSION_SECRET || process.env.STAFF_SESSION_SECRET === 'k0s1nt_w4rd3n_s3cr3t_2026_x9') {
    SESSION_SECRET = crypto.randomBytes(32).toString('hex');
    console.warn('[staff-service] Production notice: STAFF_SESSION_SECRET not set; generated secure ephemeral secret for this session.');
  }
}
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Seed operational staff locations & safe havens (Sanitized Tactical Call-signs)
 */
const DEFAULT_STAFF_DB = {
  version: 2,
  ward: "WARD No. 10",
  regionalCentre: "Regional Centre Mitrovicë/Mitrovica",
  updatedAt: new Date().toISOString(),
  locations: [
    {
      id: "staff-warden-01",
      callsign: "61 A",
      radioChannel: "CH-04",
      name: "WARDEN-LEAD (61 A)",
      role: "Warden",
      category: "residence",
      nationality: "International Mission",
      staffType: "international",
      zone: "Prishtinë",
      address: "Tactical Sector Alpha, Bllok 2/B, Prishtinë",
      gridRef: "42°39'05.0\"N 21°10'07.0\"E",
      lat: 42.6514,
      lon: 21.1685,
      phone: "+383 49 000 001",
      emergencyContact: "Radio: 61 A (CH-04) / Mob: +383 49 000 001",
      evacuationPriority: "CRITICAL",
      capacity: "3 Persons (Spouse, Son)",
      dependants: "Spouse, Child (Son)",
      totalSouls: 3,
      notes: "WARD No. 10 WARDEN. Tactical Sector Alpha, Bllok 2/B. Total: 3 (Warden + Spouse + Son). Primary radio: CH-04."
    },
    {
      id: "staff-deputy-01",
      callsign: "64W",
      radioChannel: "CH-04",
      name: "DEPUTY-WARDEN (64W)",
      role: "Deputy Warden",
      category: "residence",
      nationality: "International Mission",
      staffType: "international",
      zone: "Mitrovica South",
      address: "Tactical Sector Bravo, Mitrovica South",
      gridRef: "42°53'21.58\"N 20°52'17.44\"E",
      lat: 42.8893,
      lon: 20.8715,
      phone: "+383 49 000 002",
      emergencyContact: "Radio: 64W (CH-04) / Mob: +383 49 000 002",
      evacuationPriority: "CRITICAL",
      capacity: "1 Person",
      dependants: "None",
      totalSouls: 1,
      notes: "WARD No. 10 DEPUTY WARDEN. Tactical Sector Bravo. Primary rally coordinator for Mitrovica South."
    },
    {
      id: "staff-member-01",
      callsign: "63 B",
      radioChannel: "CH-04",
      name: "INTL-OFFICER-01 (63 B)",
      role: "Mission Member",
      category: "residence",
      nationality: "Czech Republic",
      staffType: "international",
      zone: "Mitrovica North",
      address: "Mitrovica North Sector 1",
      gridRef: "42°53'49.35\"N 20°51'58.56\"E",
      lat: 42.8970,
      lon: 20.8663,
      phone: "+383 49 000 003",
      secondaryPhone: "+381 64 000 003",
      emergencyContact: "Radio: 63 B (CH-04) / +381 64 000 003",
      evacuationPriority: "HIGH",
      capacity: "1 Person",
      dependants: "None",
      totalSouls: 1,
      notes: "Mitrovica North Sector 1. Dual phone lines. Primary egress to SAFE HAVEN - NORTH."
    },
    {
      id: "staff-member-02",
      callsign: "64 M",
      radioChannel: "CH-04",
      name: "INTL-OFFICER-02 (64 M)",
      role: "Mission Member",
      category: "residence",
      nationality: "France",
      staffType: "international",
      zone: "Mitrovica South",
      address: "Tavnik Sector, Mitrovica South",
      gridRef: "N42°52'39.65\" / E20°51'48.40\"",
      lat: 42.8777,
      lon: 20.8634,
      phone: "+383 49 000 004",
      emergencyContact: "Radio: 64 M (CH-04) / Mob: +383 49 000 004",
      evacuationPriority: "HIGH",
      capacity: "1 Person",
      dependants: "None",
      totalSouls: 1,
      notes: "Tavnik sector, 2nd floor. Primary southern egress corridor via M2 towards Prishtinë."
    },
    {
      id: "staff-member-03",
      callsign: "64 R",
      radioChannel: "CH-04",
      name: "INTL-OFFICER-03 (64 R)",
      role: "Mission Member",
      category: "residence",
      nationality: "USA",
      staffType: "international",
      zone: "Mitrovica North",
      address: "Central Sector, Mitrovica North",
      gridRef: "42.894001N / 20.864041E",
      lat: 42.8940,
      lon: 20.8640,
      phone: "+383 49 000 005",
      emergencyContact: "Radio: 64 R (CH-04) / Mob: +383 49 000 005",
      evacuationPriority: "HIGH",
      capacity: "1 Person",
      dependants: "None",
      totalSouls: 1,
      notes: "Central Sector, 4th floor. Central Mitrovica North sector near Main Bridge checkpoint."
    },
    {
      id: "staff-member-04",
      callsign: "64J",
      radioChannel: "CH-04",
      name: "INTL-OFFICER-04 (64J)",
      role: "Mission Member",
      category: "residence",
      nationality: "Montenegro",
      staffType: "international",
      zone: "Mitrovica North",
      address: "North Sector, Mitrovica North",
      gridRef: "42°53'54.13\"N 20°51'46.45\"E",
      lat: 42.8984,
      lon: 20.8629,
      phone: "+383 49 000 006",
      secondaryPhone: "+381 64 000 006",
      emergencyContact: "Radio: 64J (CH-04) / Mob: +381 64 000 006",
      evacuationPriority: "HIGH",
      capacity: "1 Person",
      dependants: "None",
      totalSouls: 1,
      notes: "North Sector, door 5, floor 2. Dual phone lines. Proximity to Regional Mission Office North."
    },
    {
      id: "staff-safe-haven-01",
      callsign: "SAFE HAVEN - NORTH",
      radioChannel: "CH-16",
      name: "Regional Mission Office / Assembly Point North",
      role: "Assembly Point",
      category: "safe_haven",
      nationality: "International Mission",
      zone: "Mitrovica North",
      address: "Kralja Petra I, Severna Mitrovica",
      gridRef: "42°53'56.0\"N 20°51'44.0\"E",
      lat: 42.898893,
      lon: 20.862213,
      phone: "+383 28 530 100",
      email: "mitrovica.security@osce.org",
      emergencyContact: "Security Desk: Ch 16 / +383 49 100 200",
      evacuationPriority: "CRITICAL",
      capacity: "40 Persons",
      dependants: "Safe Haven",
      totalSouls: 0,
      notes: "Primary fortified rally point, generator power, satellite comms & medical emergency trauma kit."
    },
    {
      id: "staff-national-01",
      callsign: "62C",
      radioChannel: "CH-04",
      name: "NATL-OFFICER-01 (62C)",
      role: "Mission Member",
      category: "residence",
      staffType: "national",
      nationality: "Kosovo (National Staff)",
      zone: "Mitrovica North",
      address: "Mitrovica North Sector 2",
      gridRef: "42.89943, 20.86372",
      lat: 42.89943,
      lon: 20.86372,
      phone: "+383 49 000 007",
      secondaryPhone: "+381 64 000 007",
      emergencyContact: "Radio: 62C (CH-04) / +381 64 000 007",
      evacuationPriority: "HIGH",
      capacity: "4 Persons",
      dependants: "Spouse, 2 Dependants",
      totalSouls: 4,
      notes: "Mitrovica North Sector 2. Dual phone lines. Spouse and 2 dependants."
    },
    {
      id: "staff-national-02",
      callsign: "62G",
      radioChannel: "CH-04",
      name: "NATL-OFFICER-02 (62G)",
      role: "Mission Member",
      category: "residence",
      staffType: "national",
      nationality: "Kosovo (National Staff)",
      zone: "Mitrovica North",
      address: "Mitrovica North Sector 3",
      gridRef: "42.89801, 20.86508",
      lat: 42.89801,
      lon: 20.86508,
      phone: "+383 49 000 008",
      secondaryPhone: "+381 64 000 008",
      emergencyContact: "Radio: 62G (CH-04) / +381 64 000 008",
      evacuationPriority: "HIGH",
      capacity: "4 Persons",
      dependants: "Spouse, 2 Dependants",
      totalSouls: 4,
      notes: "Mitrovica North Sector 3. Spouse and 2 dependants."
    },
    {
      id: "staff-national-03",
      callsign: "62M",
      radioChannel: "CH-04",
      name: "NATL-OFFICER-03 (62M)",
      role: "Mission Member",
      category: "residence",
      staffType: "national",
      nationality: "Kosovo (National Staff)",
      zone: "Leposavić",
      address: "Leposavic Sector 1",
      gridRef: "43.10012, 20.80284",
      lat: 43.10012,
      lon: 20.80284,
      phone: "+383 49 000 009",
      secondaryPhone: "+381 65 000 009",
      emergencyContact: "Radio: 62M (CH-04) / +381 65 000 009",
      evacuationPriority: "HIGH",
      capacity: "2 Persons",
      dependants: "Spouse",
      totalSouls: 2,
      notes: "Leposavic Sector 1. Spouse."
    },
    {
      id: "staff-national-04",
      callsign: "62P",
      radioChannel: "CH-04",
      name: "NATL-OFFICER-04 (62P)",
      role: "Mission Member",
      category: "residence",
      staffType: "national",
      nationality: "Kosovo (National Staff)",
      zone: "Zvečan",
      address: "Zvecan Sector 1",
      gridRef: "42.90517, 20.83804",
      lat: 42.90517,
      lon: 20.83804,
      phone: "+383 49 000 010",
      secondaryPhone: "+381 64 000 010",
      emergencyContact: "Radio: 62P (CH-04) / +381 64 000 010",
      evacuationPriority: "HIGH",
      capacity: "1 Person",
      dependants: "None",
      totalSouls: 1,
      notes: "Zvecan Sector 1."
    },
    {
      id: "staff-national-05",
      callsign: "62T",
      radioChannel: "CH-04",
      name: "NATL-OFFICER-05 (62T)",
      role: "Mission Member",
      category: "residence",
      staffType: "national",
      nationality: "Kosovo (National Staff)",
      zone: "Brezovica / Štrpce",
      address: "Brezovica Sector 1",
      gridRef: "42.21906, 20.99951",
      lat: 42.21906,
      lon: 20.99951,
      phone: "+383 49 000 011",
      secondaryPhone: "+381 65 000 011",
      emergencyContact: "Radio: 62T (CH-04) / +381 65 000 011",
      evacuationPriority: "HIGH",
      capacity: "4 Persons",
      dependants: "Spouse, 2 Dependants",
      totalSouls: 4,
      notes: "Brezovica Sector 1. Spouse and 2 dependants."
    },
    {
      id: "staff-national-06",
      callsign: "62H",
      radioChannel: "CH-04",
      name: "NATL-OFFICER-06 (62H)",
      role: "Mission Member",
      category: "residence",
      staffType: "national",
      nationality: "Kosovo (National Staff)",
      zone: "Mitrovica North",
      address: "Mitrovica North Sector 4",
      gridRef: "42.89620, 20.86480",
      lat: 42.8962,
      lon: 20.8648,
      phone: "+383 49 000 012",
      secondaryPhone: "+381 64 000 012",
      emergencyContact: "Radio: 62H (CH-04) / +381 64 000 012",
      evacuationPriority: "HIGH",
      capacity: "4 Persons",
      dependants: "Spouse, 2 Dependants",
      totalSouls: 4,
      notes: "Mitrovica North Sector 4. Spouse, 4 souls total."
    },
    {
      id: "staff-safe-haven-rc-mitrovica",
      callsign: "RC MITROVICA",
      radioChannel: "CH-16",
      name: "Regional Centre Mitrovica",
      role: "Regional Centre",
      category: "safe_haven",
      staffType: "safe_haven",
      nationality: "International Mission",
      zone: "Mitrovica South",
      address: "Mitrovica South",
      gridRef: "42°53'24.5\"N 20°52'34.2\"E",
      lat: 42.890128,
      lon: 20.876167,
      phone: "+383 28 530 100",
      email: "mitrovica.rc@osce.org",
      emergencyContact: "Duty Officer: CH-16 / +383 49 000 002",
      evacuationPriority: "CRITICAL",
      capacity: "50 Persons",
      dependants: "Safe Haven",
      totalSouls: 0,
      notes: "Regional Centre Mitrovica operational headquarters and primary assembly point for WARD No. 10."
    },
    {
      id: "staff-safe-haven-02",
      callsign: "SAFE HAVEN - HQ",
      radioChannel: "CH-16",
      name: "Central Mission HQ / Assembly Point Prishtinë",
      role: "Central Assembly Point",
      category: "safe_haven",
      nationality: "International Mission",
      zone: "Prishtinë",
      address: "M9 / Veternik, Prishtinë",
      gridRef: "42°38'28.3\"N 21°09'19.4\"E",
      lat: 42.6412,
      lon: 21.1554,
      phone: "+383 38 500 100",
      email: "hq.security@osce.org",
      emergencyContact: "24/7 Ops Room: +383 49 500 200",
      evacuationPriority: "CRITICAL",
      capacity: "120 Persons",
      dependants: "Safe Haven",
      totalSouls: 0,
      notes: "Main mission compound, helipad access, emergency trauma stabilization."
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

const revokedTokens = new Set();

/**
 * Revoke a staff token on logout
 */
function revokeToken(token) {
  if (token && typeof token === 'string') {
    revokedTokens.add(token);
    return true;
  }
  return false;
}

/**
 * Verify a signed token
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  if (revokedTokens.has(token)) return false;
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
    radioChannel: data.radioChannel || 'CH-04',
    name: String(data.name || data.callsign).trim(),
    role: data.role || 'Mission Member',
    category: data.category || 'residence',
    nationality: data.nationality || 'International',
    zone: data.zone || 'Kosovo',
    address: data.address || '',
    gridRef: data.gridRef || '',
    phone: data.phone || '',
    secondaryPhone: data.secondaryPhone || '',
    email: data.email || '',
    emergencyContact: data.emergencyContact || '',
    lat: Number(data.lat),
    lon: Number(data.lon),
    evacuationPriority: data.evacuationPriority || 'MEDIUM',
    capacity: data.capacity || '1 Person',
    dependants: data.dependants || 'None',
    totalSouls: typeof data.totalSouls === 'number' ? data.totalSouls : 1,
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
    radioChannel: item.radioChannel || 'CH-04',
    name: String(item.name || item.callsign).trim(),
    role: item.role || 'Mission Member',
    category: item.category || 'residence',
    nationality: item.nationality || 'International',
    zone: item.zone || 'Kosovo',
    address: item.address || '',
    gridRef: item.gridRef || '',
    phone: item.phone || '',
    secondaryPhone: item.secondaryPhone || '',
    email: item.email || '',
    emergencyContact: item.emergencyContact || '',
    lat: Number(item.lat),
    lon: Number(item.lon),
    evacuationPriority: item.evacuationPriority || 'MEDIUM',
    capacity: item.capacity || '1 Person',
    dependants: item.dependants || 'None',
    totalSouls: typeof item.totalSouls === 'number' ? item.totalSouls : 1,
    notes: item.notes || '',
    updatedAt: new Date().toISOString()
  }));
  saveDb(db);
  return db.locations;
}

module.exports = {
  login,
  verifyToken,
  revokeToken,
  getLocations,
  addLocation,
  updateLocation,
  deleteLocation,
  importLocations,
  DB_PATH
};
