'use strict';

const axios = require('axios');

/**
 * Authoritative static coordinate registry for Kosovo municipalities,
 * regional hubs, and border monitoring points.
 * Offline resolution with zero external network dependency.
 */
const STATIC_REGISTRY = [
  { names: ['kosovo', 'kosova', 'kosovo polje', 'central kosovo', 'rks'], lat: 42.6026, lon: 20.9030 },
  { names: ['prishtinë', 'prishtina', 'priština', 'pristina'], lat: 42.6629, lon: 21.1655 },
  { names: ['mitrovicë', 'mitrovica', 'severna mitrovica', 'mitrovicë e veriut', 'north mitrovica', 'kosovska mitrovica'], lat: 42.8914, lon: 20.8660 },
  { names: ['prizren', 'prizreni'], lat: 42.2139, lon: 20.7397 },
  { names: ['pejë', 'peja', 'peć', 'pec'], lat: 42.6593, lon: 20.2887 },
  { names: ['gjilan', 'gjilani', 'gnjilane'], lat: 42.4635, lon: 21.4694 },
  { names: ['ferizaj', 'uroševac', 'urosevac'], lat: 42.3705, lon: 21.1530 },
  { names: ['gjakovë', 'gjakova', 'đakovica', 'djakovica'], lat: 42.3810, lon: 20.4320 },
  { names: ['leposaviq', 'leposaviqi', 'leposavić', 'leposavic'], lat: 43.1000, lon: 20.8000 },
  { names: ['zubin potok', 'zubin potoku'], lat: 42.9100, lon: 20.6900 },
  { names: ['zveçan', 'zveçani', 'zvečan', 'zvecan'], lat: 42.9050, lon: 20.8400 },
  { names: ['vushtrri', 'vushtrria', 'vučitrn', 'vucitrn'], lat: 42.8250, lon: 20.9660 },
  { names: ['drenas', 'gllogoc', 'glogovac'], lat: 42.6250, lon: 20.8920 },
  { names: ['suharekë', 'suhareka', 'suva reka', 'therandë'], lat: 42.3600, lon: 20.8250 },
  { names: ['podujevë', 'podujeva', 'podujevo', 'besianë'], lat: 42.9100, lon: 21.1900 },
  { names: ['shtime', 'shtimja', 'štimlje', 'stimlje'], lat: 42.4330, lon: 21.0400 },
  { names: ['fushë kosovë', 'fushe kosove', 'kosovo polje'], lat: 42.6340, lon: 21.0960 },
  { names: ['kaçanik', 'kačanik'], lat: 42.2300, lon: 21.2600 },
  { names: ['skenderaj', 'srbica'], lat: 42.7480, lon: 20.7890 },
  { names: ['malishevë', 'malisheva', 'mališevo'], lat: 42.4820, lon: 20.7450 },
  { names: ['kamenicë', 'kamenica', 'dardanë', 'kosovska kamenica'], lat: 42.5780, lon: 21.5800 },
  { names: ['deçan', 'deçani', 'dečani', 'decani'], lat: 42.5410, lon: 20.2880 },
  { names: ['istog', 'istogu', 'istok', 'burim'], lat: 42.7800, lon: 20.4900 },
  { names: ['klinë', 'klina'], lat: 42.6210, lon: 20.5780 },
  { names: ['lipjan', 'lipljan'], lat: 42.5220, lon: 21.1250 },
  { names: ['rahovec', 'orahovac'], lat: 42.3990, lon: 20.6550 },
  { names: ['dragash', 'dragaš', 'šarr'], lat: 42.0620, lon: 20.6530 },
  { names: ['graçanicë', 'gračanica'], lat: 42.5980, lon: 21.1930 },
  { names: ['novobërdë', 'novo brdo', 'artana'], lat: 42.6160, lon: 21.4330 },
  { names: ['shterpcë', 'štrpce', 'brezovicë', 'brezovica'], lat: 42.2370, lon: 21.0260 },
  { names: ['merdare', 'merdarë'], lat: 42.9439, lon: 21.2464 },
  { names: ['jarinje', 'jarinjë'], lat: 43.2181, lon: 20.6975 },
  { names: ['bërnjak', 'brnjak'], lat: 42.9753, lon: 20.5519 },
  { names: ['dheu i bardhë', 'bela zemlja', 'končulj'], lat: 42.4844, lon: 21.6547 },
  { names: ['hani i elezit', 'general janković'], lat: 42.1469, lon: 21.2981 },
  { names: ['kullë', 'kula'], lat: 42.7933, lon: 20.2789 },
  { names: ['vërmicë', 'vermice', 'vrbnica', 'morinë'], lat: 42.1583, lon: 20.5486 }
];

// In-memory cache for dynamic geocoding
const geoCache = new Map();
const GEO_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting for dynamic upstream requests (max 1 req/sec per OSM policy)
let lastUpstreamCallTime = 0;

function normalizeName(str) {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[ëe]/g, 'e')
    .replace(/[çc]/g, 'c')
    .replace(/[šs]/g, 's')
    .replace(/[žz]/g, 'z')
    .replace(/[đdj]/g, 'dj')
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Resolve coordinates for a location string.
 * Priority:
 * 1. Static authoritative registry (instant, offline)
 * 2. In-memory 24-hour cache
 * 3. Throttled Nominatim fallback with compliant User-Agent
 * 4. Default Kosovo center coordinates
 */
async function resolveCoordinates(location) {
  const DEFAULT_COORDS = { lat: 42.6026, lon: 20.9030 };
  if (!location || typeof location !== 'string') return DEFAULT_COORDS;

  const normalized = normalizeName(location);

  // 1. Static Registry Check
  for (const entry of STATIC_REGISTRY) {
    for (const name of entry.names) {
      const normName = normalizeName(name);
      if (normalized.includes(normName) || normName.includes(normalized)) {
        return { lat: entry.lat, lon: entry.lon, source: 'static_registry' };
      }
    }
  }

  // 2. Cache Check
  const cached = geoCache.get(normalized);
  if (cached && (Date.now() - cached.timestamp < GEO_CACHE_TTL_MS)) {
    return { lat: cached.lat, lon: cached.lon, source: 'cache' };
  }

  // 3. Dynamic Upstream Fallback with OSM policy rate limit (min 1.1s spacing)
  const now = Date.now();
  const waitMs = Math.max(0, 1100 - (now - lastUpstreamCallTime));
  if (waitMs > 0) {
    await new Promise(r => setTimeout(r, waitMs));
  }
  lastUpstreamCallTime = Date.now();

  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: location, format: 'json', limit: 1 },
      headers: {
        'User-Agent': 'SENTINEL-Kosovo-Mission/1.0 (contact: admin@sentinel.mission.local)'
      },
      timeout: 5000
    });

    if (Array.isArray(response.data) && response.data.length > 0) {
      const lat = parseFloat(response.data[0].lat);
      const lon = parseFloat(response.data[0].lon);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        geoCache.set(normalized, { lat, lon, timestamp: Date.now() });
        return { lat, lon, source: 'nominatim' };
      }
    }
  } catch (err) {
    console.warn(`[geocoder] Dynamic geocoding failed for "${location}": ${err.message}. Using default coordinates.`);
  }

  return { ...DEFAULT_COORDS, source: 'fallback_default' };
}

module.exports = {
  resolveCoordinates,
  STATIC_REGISTRY,
  normalizeName
};
