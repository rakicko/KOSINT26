'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BALKAN_BOUNDS = { minLat: 39.4, maxLat: 45.2, minLon: 18.0, maxLon: 23.6 };

// Period to day range mapping
const FIRMS_DAY_RANGES = { '1h': 1, '6h': 1, '24h': 1, '48h': 2, '7d': 5 };
const EONET_DAY_RANGES = { '1h': 3, '6h': 3, '24h': 7, '48h': 14, '7d': 30 };

// Timeouts & TTL
const FIRMS_TIMEOUT_MS = parseInt(process.env.FIRMS_TIMEOUT_MS || '15000', 10);
const WILDFIRE_CACHE_TTL_MS = parseInt(process.env.WILDFIRE_CACHE_TTL_MS || '300000', 10); // 5 min default

// In-memory & SQLite persistent cache
const memoryBank = require('../memory-bank/skill');
let wildfireCache = {};
let lastFetchTimes = {};

try {
  // Purge legacy flat-file cache if present
  const legacyCacheFile = path.join(__dirname, '.wildfire_cache.json');
  if (fs.existsSync(legacyCacheFile)) {
    fs.unlinkSync(legacyCacheFile);
  }
} catch (e) {}

function loadCache() {
  try {
    const cached = memoryBank.getCache('wildfire_cache', 3600000);
    if (cached && typeof cached === 'object') {
      wildfireCache = cached;
    }
  } catch (e) {
    // ignore cache load errors
  }
}

loadCache();

function persistCache(period, data) {
  // Fix cache degradation: Never overwrite existing valid FIRMS cache with lower-quality EONET fallback
  if (wildfireCache[period] && wildfireCache[period].provider === 'nasa_firms' && data.provider !== 'nasa_firms') {
    return;
  }
  wildfireCache[period] = data;
  lastFetchTimes[period] = Date.now();
  try {
    memoryBank.setCache('wildfire_cache', wildfireCache, 3600000);
  } catch (e) {
    // ignore cache errors
  }
}

function clearCache() {
  wildfireCache = {};
  lastFetchTimes = {};
  try {
    memoryBank.clearCache('wildfire_cache');
  } catch (e) {}
}

function getCache() {
  return wildfireCache;
}

function setCacheEntry(period, data, fetchTime = Date.now()) {
  wildfireCache[period] = data;
  lastFetchTimes[period] = fetchTime;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Parse raw CSV lines from NASA FIRMS Area API
 */
function parseCsvFires(csvText, sourceName) {
  if (!csvText || typeof csvText !== 'string') return [];
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const latIdx = headers.indexOf('latitude');
  const lonIdx = headers.indexOf('longitude');
  const brightIdx = headers.indexOf('brightness') !== -1 ? headers.indexOf('brightness') : headers.indexOf('bright_ti4');
  const frpIdx = headers.indexOf('frp');
  const confIdx = headers.indexOf('confidence');
  const satIdx = headers.indexOf('satellite');
  const dateIdx = headers.indexOf('acq_date');
  const timeIdx = headers.indexOf('acq_time');
  const daynightIdx = headers.indexOf('daynight');

  if (latIdx === -1 || lonIdx === -1) return [];

  const detections = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length < headers.length) continue;

    const lat = parseFloat(cols[latIdx]);
    const lon = parseFloat(cols[lonIdx]);
    if (isNaN(lat) || isNaN(lon)) continue;

    // Validate bounds
    if (lat < BALKAN_BOUNDS.minLat || lat > BALKAN_BOUNDS.maxLat ||
        lon < BALKAN_BOUNDS.minLon || lon > BALKAN_BOUNDS.maxLon) {
      continue;
    }

    const brightness = brightIdx !== -1 ? parseFloat(cols[brightIdx]) : 0;
    const frp = frpIdx !== -1 ? parseFloat(cols[frpIdx]) : 0;
    let conf = confIdx !== -1 ? cols[confIdx] : 'nominal';
    let numericConf = 50;
    if (conf === 'l' || conf === 'low') numericConf = 30;
    else if (conf === 'n' || conf === 'nominal') numericConf = 65;
    else if (conf === 'h' || conf === 'high') numericConf = 90;
    else if (!isNaN(parseFloat(conf))) numericConf = Math.min(100, Math.max(0, parseFloat(conf)));

    let rawSat = (satIdx !== -1 && cols[satIdx]) ? cols[satIdx] : '';
    let satellite = sourceName;
    if (rawSat === 'N') satellite = 'VIIRS (Suomi-NPP)';
    else if (rawSat === '1' || rawSat === 'J1' || rawSat === 'N20') satellite = 'VIIRS (NOAA-20)';
    else if (rawSat === '2' || rawSat === 'J2' || rawSat === 'N21') satellite = 'VIIRS (NOAA-21)';
    else if (rawSat === 'T' || rawSat.toLowerCase().includes('terra')) satellite = 'MODIS (Terra)';
    else if (rawSat === 'A' || rawSat.toLowerCase().includes('aqua')) satellite = 'MODIS (Aqua)';
    else if (rawSat) satellite = rawSat;

    const acq_date = dateIdx !== -1 ? cols[dateIdx] : new Date().toISOString().split('T')[0];
    const acq_time = timeIdx !== -1 ? cols[timeIdx] : '0000';
    const daynight = daynightIdx !== -1 ? cols[daynightIdx] : 'D';

    detections.push({
      id: `firms-${acq_date}-${acq_time}-${lat.toFixed(4)}-${lon.toFixed(4)}`,
      lat,
      lon,
      brightness: isNaN(brightness) ? 0 : brightness,
      frp: isNaN(frp) ? 0 : frp,
      confidence: numericConf,
      satellite,
      acq_date,
      acq_time,
      daynight,
      source: 'NASA FIRMS',
      sourceUrl: 'https://firms.modaps.eosdis.nasa.gov/',
      type: sourceName
    });
  }
  return detections;
}

/**
 * Primary Provider: NASA FIRMS Direct API
 * Uses Promise.allSettled so partial satellite feed success is preserved.
 */
async function fetchFromFIRMS({ period, apiKey, customSources, timeout = FIRMS_TIMEOUT_MS } = {}) {
  const dayCount = FIRMS_DAY_RANGES[period] || 1;
  const areaBbox = `${BALKAN_BOUNDS.minLon},${BALKAN_BOUNDS.minLat},${BALKAN_BOUNDS.maxLon},${BALKAN_BOUNDS.maxLat}`;
  
  const sources = customSources || [
    { name: 'VIIRS_SNPP_NRT', label: 'VIIRS (Suomi-NPP)' },
    { name: 'VIIRS_NOAA20_NRT', label: 'VIIRS (NOAA-20)' },
    { name: 'MODIS_NRT', label: 'MODIS (Terra/Aqua)' }
  ];

  const requests = sources.map(s => {
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/${s.name}/${areaBbox}/${dayCount}`;
    return axios.get(url, {
      timeout,
      headers: { 'User-Agent': 'SENTINEL-Intelligence/1.0' }
    }).then(res => ({ source: s.label, name: s.name, data: res.data, status: res.status }))
      .catch(err => ({ source: s.label, name: s.name, error: err.message, status: err.response?.status, code: err.code }));
  });

  const results = await Promise.allSettled(requests);

  let allDetections = [];
  let successfulFeeds = [];
  let failedFeeds = [];
  let authFailed = false;

  for (const res of results) {
    const resp = res.status === 'fulfilled' ? res.value : res.reason;
    if (!resp) continue;
    if (resp.status === 403 || resp.status === 401) {
      authFailed = true;
      failedFeeds.push({ source: resp.source || resp.name, error: 'AUTH_FAILED' });
      continue;
    }
    if (resp.data && typeof resp.data === 'string' && !resp.data.includes('Invalid MAP_KEY')) {
      const parsed = parseCsvFires(resp.data, resp.source);
      allDetections = allDetections.concat(parsed);
      successfulFeeds.push(resp.source);
    } else {
      failedFeeds.push({ source: resp.source || resp.name, error: resp.error || 'INVALID_DATA' });
    }
  }

  if (authFailed && successfulFeeds.length === 0) {
    return { success: false, error: 'FIRMS_AUTH_FAILED', message: 'NASA FIRMS API authentication failed (401/403).' };
  }

  if (successfulFeeds.length === 0) {
    return { success: false, error: 'FIRMS_FETCH_FAILED', message: 'NASA FIRMS API connection timed out or unreachable.' };
  }

  return {
    success: true,
    detections: allDetections,
    source: 'NASA FIRMS (MODIS/VIIRS)',
    sourceUrl: 'https://firms.modaps.eosdis.nasa.gov/',
    provider: 'nasa_firms',
    successfulFeeds,
    failedFeeds,
    feedCount: successfulFeeds.length,
    totalFeeds: sources.length
  };
}

/**
 * Secondary Provider: NASA EONET v3 Wildfires API (NASA Earth Science / Copernicus EFFIS)
 */
async function fetchFromEONET({ period } = {}) {
  const days = EONET_DAY_RANGES[period] || 7;
  const bboxStr = `${BALKAN_BOUNDS.minLon},${BALKAN_BOUNDS.maxLat},${BALKAN_BOUNDS.maxLon},${BALKAN_BOUNDS.minLat}`;
  const url = `https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&bbox=${bboxStr}&days=${days}&status=all`;

  const response = await axios.get(url, {
    timeout: 8000,
    headers: { 'User-Agent': 'SENTINEL-Wildfire-Monitor/1.0' }
  });

  const events = response.data?.events || [];
  const detections = [];

  for (const ev of events) {
    const geometries = ev.geometry || [];
    for (const geom of geometries) {
      if (!geom.coordinates || geom.coordinates.length < 2) continue;
      const ptLon = parseFloat(geom.coordinates[0]);
      const ptLat = parseFloat(geom.coordinates[1]);
      if (isNaN(ptLat) || isNaN(ptLon)) continue;

      if (ptLat < BALKAN_BOUNDS.minLat || ptLat > BALKAN_BOUNDS.maxLat ||
          ptLon < BALKAN_BOUNDS.minLon || ptLon > BALKAN_BOUNDS.maxLon) {
        continue;
      }

      const dateStr = geom.date ? geom.date.split('T')[0] : new Date().toISOString().split('T')[0];
      const timeStr = geom.date && geom.date.includes('T') ? geom.date.split('T')[1].replace(/[^0-9]/g, '').slice(0, 4) : '1200';
      const magnitude = geom.magnitudeValue || 0;

      // Estimate satellite confidence and FRP from area / GDACS satellite metrics
      const conf = magnitude > 5000 ? 95 : magnitude > 1000 ? 85 : 75;
      const frpEst = magnitude > 0 ? Math.round(magnitude / 50) : 15;
      const brightEst = 320 + Math.min(60, Math.round(frpEst / 5));

      const sourceObj = ev.sources?.[0] || {};
      const sourceUrl = sourceObj.url || ev.link || 'https://eonet.gsfc.nasa.gov/';

      detections.push({
        id: `eonet-${ev.id}-${ptLat.toFixed(4)}-${ptLon.toFixed(4)}`,
        lat: ptLat,
        lon: ptLon,
        brightness: brightEst,
        frp: frpEst,
        confidence: conf,
        satellite: 'VIIRS/MODIS (NASA EONET)',
        acq_date: dateStr,
        acq_time: timeStr,
        daynight: 'D',
        source: 'NASA EONET / Copernicus EFFIS',
        sourceUrl,
        title: ev.title,
        magnitudeHectares: magnitude,
        type: 'Wildfire Thermal Event'
      });
    }
  }

  return {
    success: true,
    detections,
    source: 'NASA EONET (Earth Observatory / Copernicus EFFIS)',
    sourceUrl: 'https://eonet.gsfc.nasa.gov/',
    provider: 'nasa_eonet'
  };
}

/**
 * Main wildfire fetching entrypoint with strict source priority:
 * 1. Fresh Cache (within TTL)
 * 2. Primary: NASA FIRMS Direct API (if configured & reachable, partial success supported)
 * 3. Stale FIRMS Cache (if live FIRMS fails/times out, prefer stale FIRMS over EONET)
 * 4. Secondary Fallback: NASA EONET / Copernicus EFFIS Live API (only if no FIRMS cache available)
 * 5. Stale EONET Cache (if EONET live fails)
 * 6. Fallback: UNAVAILABLE
 */
async function fetchWildfire({ period = '24h', lat, lon, forceRefresh = false } = {}) {
  // 1. Check fresh cache
  if (!forceRefresh && wildfireCache[period] && (Date.now() - (lastFetchTimes[period] || 0) < WILDFIRE_CACHE_TTL_MS)) {
    const cached = wildfireCache[period];
    let detections = cached.detections || [];
    if (lat && lon && Array.isArray(detections)) {
      detections = detections.map(d => ({
        ...d,
        distanceKm: Math.round(haversine(lat, lon, d.lat, d.lon))
      }));
    }
    return { ...cached, detections, isCached: true, isStale: false };
  }

  const firmsKey = process.env.FIRMS_MAP_KEY;
  let firmsFetchResult = null;

  // 2. Primary Source: NASA FIRMS
  if (firmsKey && firmsKey !== 'YOUR_NASA_FIRMS_KEY' && firmsKey.trim() !== '') {
    try {
      const firmsRes = await fetchFromFIRMS({ period, apiKey: firmsKey.trim() });
      if (firmsRes.success) {
        firmsFetchResult = firmsRes;
      } else {
        console.warn(`[wildfire-monitor] Primary NASA FIRMS failed: ${firmsRes.message}.`);
      }
    } catch (err) {
      console.warn(`[wildfire-monitor] Primary NASA FIRMS error: ${err.message}.`);
    }
  }

  // Handle successful live fetch from Primary FIRMS
  if (firmsFetchResult && firmsFetchResult.success) {
    let detections = firmsFetchResult.detections || [];

    if (lat && lon) {
      detections = detections.map(d => ({
        ...d,
        distanceKm: Math.round(haversine(lat, lon, d.lat, d.lon))
      }));
    }

    detections.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

    const status = detections.length === 0 ? 'NO_ACTIVE_FIRES' : 'LIVE_DATA';
    const message = detections.length === 0 
      ? `No active thermal fire anomalies detected in the selected period (${period}).`
      : undefined;

    const payload = {
      skill: 'wildfire-monitor',
      status,
      source: firmsFetchResult.source,
      sourceUrl: firmsFetchResult.sourceUrl,
      sourceAttribution: {
        name: firmsFetchResult.source,
        url: firmsFetchResult.sourceUrl
      },
      provider: firmsFetchResult.provider,
      successfulFeeds: firmsFetchResult.successfulFeeds,
      region: 'Balkans/Western Eurasia',
      bounds: BALKAN_BOUNDS,
      period,
      fetchedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      count: detections.length,
      detections,
      message,
      isCached: false,
      isStale: false
    };

    persistCache(period, payload);
    return payload;
  }

  // 3. Stale FIRMS Cache Fallback: If live FIRMS fails, prefer stale FIRMS over degraded EONET fallback
  if (wildfireCache[period] && wildfireCache[period].provider === 'nasa_firms' && wildfireCache[period].status !== 'UNAVAILABLE') {
    const cached = wildfireCache[period];
    let detections = cached.detections || [];
    if (lat && lon) {
      detections = detections.map(d => ({
        ...d,
        distanceKm: Math.round(haversine(lat, lon, d.lat, d.lon))
      }));
    }
    return {
      ...cached,
      detections,
      isCached: true,
      isStale: true
    };
  }

  // 4. Secondary Fallback: NASA EONET / Copernicus EFFIS (only if no valid FIRMS cache exists)
  let eonetFetchResult = null;
  try {
    const eonetRes = await fetchFromEONET({ period });
    if (eonetRes.success) {
      eonetFetchResult = eonetRes;
    }
  } catch (err) {
    console.warn(`[wildfire-monitor] Secondary NASA EONET error: ${err.message}`);
  }

  if (eonetFetchResult && eonetFetchResult.success) {
    let detections = eonetFetchResult.detections || [];

    if (lat && lon) {
      detections = detections.map(d => ({
        ...d,
        distanceKm: Math.round(haversine(lat, lon, d.lat, d.lon))
      }));
    }

    detections.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

    const status = detections.length === 0 ? 'NO_ACTIVE_FIRES' : 'LIVE_DATA';
    const message = detections.length === 0 
      ? `No active thermal fire anomalies detected in the selected period (${period}).`
      : undefined;

    const payload = {
      skill: 'wildfire-monitor',
      status,
      source: eonetFetchResult.source,
      sourceUrl: eonetFetchResult.sourceUrl,
      sourceAttribution: {
        name: eonetFetchResult.source,
        url: eonetFetchResult.sourceUrl
      },
      provider: eonetFetchResult.provider,
      region: 'Balkans/Western Eurasia',
      bounds: BALKAN_BOUNDS,
      period,
      fetchedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      count: detections.length,
      detections,
      message,
      isCached: false,
      isStale: false
    };

    persistCache(period, payload);
    return payload;
  }

  // 5. Stale EONET Cache Fallback
  if (wildfireCache[period] && wildfireCache[period].status !== 'UNAVAILABLE') {
    const cached = wildfireCache[period];
    let detections = cached.detections || [];
    if (lat && lon) {
      detections = detections.map(d => ({
        ...d,
        distanceKm: Math.round(haversine(lat, lon, d.lat, d.lon))
      }));
    }
    return {
      ...cached,
      detections,
      isCached: true,
      isStale: true
    };
  }

  // 6. Final Fallback: UNAVAILABLE
  return {
    skill: 'wildfire-monitor',
    status: 'UNAVAILABLE',
    error: 'WILDFIRE_SOURCES_UNAVAILABLE',
    message: 'Primary and secondary wildfire satellite services could not be reached.',
    source: 'NASA FIRMS / NASA EONET',
    sourceUrl: 'https://firms.modaps.eosdis.nasa.gov/',
    provider: 'unavailable',
    region: 'Balkans/Western Eurasia',
    bounds: BALKAN_BOUNDS,
    period,
    fetchedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    count: 0,
    detections: [],
    isCached: false,
    isStale: false
  };
}

module.exports = {
  fetchWildfire,
  fetchFromFIRMS,
  fetchFromEONET,
  parseCsvFires,
  persistCache,
  clearCache,
  getCache,
  setCacheEntry,
  FIRMS_TIMEOUT_MS,
  FIRMS_DAY_RANGES,
  EONET_DAY_RANGES,
  BALKAN_BOUNDS
};

if (require.main === module) {
  const args = process.argv.slice(2);
  const period = args[args.indexOf('--period') + 1] || '24h';
  fetchWildfire({ period, lat: 42.6026, lon: 20.9030, forceRefresh: true }).then(r => {
    console.log(JSON.stringify(r, null, 2));
  }).catch(err => console.error('Fetch error:', err.message));
}