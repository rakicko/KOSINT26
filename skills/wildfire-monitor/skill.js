'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BALKAN_BOUNDS = { minLat: 39.4, maxLat: 45.2, minLon: 18.0, maxLon: 23.6 };

// Period to day range mapping
const FIRMS_DAY_RANGES = { '24h': 1, '48h': 2, '7d': 5 };
const EONET_DAY_RANGES = { '24h': 7, '48h': 14, '7d': 30 };

// Persistent & in-memory cache
const CACHE_FILE = path.join(__dirname, '.wildfire_cache.json');
let wildfireCache = {};
let lastFetchTimes = {};
const WILDFIRE_CACHE_TTL_MS = parseInt(process.env.WILDFIRE_CACHE_TTL_MS || '300000', 10); // 5 min default

try {
  if (fs.existsSync(CACHE_FILE)) {
    const rawCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    if (rawCache && typeof rawCache === 'object') {
      wildfireCache = rawCache;
    }
  }
} catch (e) {
  // ignore cache load errors
}

function persistCache(period, data) {
  wildfireCache[period] = data;
  lastFetchTimes[period] = Date.now();
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(wildfireCache, null, 2));
  } catch (e) {
    // ignore disk write errors
  }
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
    else if (rawSat === '1' || rawSat === 'J1') satellite = 'VIIRS (NOAA-20)';
    else if (rawSat === '2' || rawSat === 'J2') satellite = 'VIIRS (NOAA-21)';
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
 */
async function fetchFromFIRMS({ period, apiKey }) {
  const dayCount = FIRMS_DAY_RANGES[period] || 1;
  const areaBbox = `${BALKAN_BOUNDS.minLon},${BALKAN_BOUNDS.minLat},${BALKAN_BOUNDS.maxLon},${BALKAN_BOUNDS.maxLat}`;
  
  const sources = [
    { name: 'VIIRS_SNPP_NRT', label: 'VIIRS (Suomi-NPP)' },
    { name: 'VIIRS_NOAA20_NRT', label: 'VIIRS (NOAA-20)' },
    { name: 'MODIS_NRT', label: 'MODIS (Terra/Aqua)' }
  ];

  const attemptedSources = [];
  const successfulSources = [];
  const failedSources = [];

  const requests = sources.map(s => {
    attemptedSources.push(s.name);
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/${s.name}/${areaBbox}/${dayCount}`;
    const start = Date.now();
    return axios.get(url, {
      timeout: 3500, // short timeout to fail fast if network filters connection
      headers: { 'User-Agent': 'SENTINEL-Intelligence/1.0' }
    }).then(res => {
      const duration = Date.now() - start;
      if (res.data && typeof res.data === 'string' && res.data.includes('Invalid MAP_KEY')) {
        console.warn(`[wildfire-monitor] FIRMS ${s.name} failed: code=INVALID_MAP_KEY status=${res.status} duration=${duration}ms`);
        failedSources.push({ source: s.name, status: res.status, code: 'INVALID_MAP_KEY', duration });
        return { source: s.label, sourceName: s.name, data: null, error: 'Invalid MAP_KEY', status: 403 };
      }
      const parsed = parseCsvFires(res.data, s.label);
      console.log(`[wildfire-monitor] FIRMS ${s.name} succeeded: status=${res.status} duration=${duration}ms detections=${parsed.length}`);
      successfulSources.push(s.name);
      return { source: s.label, sourceName: s.name, data: res.data, status: res.status, parsed };
    }).catch(err => {
      const duration = Date.now() - start;
      const code = err.code || (err.response ? `HTTP_${err.response.status}` : 'ERR_UNKNOWN');
      console.warn(`[wildfire-monitor] FIRMS ${s.name} failed: code=${code} duration=${duration}ms`);
      failedSources.push({ source: s.name, status: err.response?.status, code, message: err.message, duration });
      return { source: s.label, sourceName: s.name, error: err.message, status: err.response?.status, code: err.code };
    });
  });

  const responses = await Promise.all(requests);

  let allDetections = [];
  let successCount = 0;
  let authFailed = false;

  for (const resp of responses) {
    if (resp.status === 403 || resp.status === 401 || resp.error === 'Invalid MAP_KEY') {
      authFailed = true;
      continue;
    }
    if (resp.parsed && Array.isArray(resp.parsed)) {
      successCount++;
      allDetections = allDetections.concat(resp.parsed);
    }
  }

  if (authFailed && successCount === 0) {
    return {
      success: false,
      error: 'FIRMS_AUTH_FAILED',
      message: 'NASA FIRMS API authentication failed (401/403).',
      firmsDiagnostic: { attemptedSources, successfulSources, failedSources }
    };
  }

  if (successCount === 0) {
    return {
      success: false,
      error: 'FIRMS_FETCH_FAILED',
      message: 'NASA FIRMS API connection timed out or unreachable.',
      firmsDiagnostic: { attemptedSources, successfulSources, failedSources }
    };
  }

  return {
    success: true,
    detections: allDetections,
    source: 'NASA FIRMS (MODIS/VIIRS)',
    sourceUrl: 'https://firms.modaps.eosdis.nasa.gov/',
    provider: 'nasa_firms',
    firmsDiagnostic: { attemptedSources, successfulSources, failedSources }
  };
}

/**
 * Secondary Provider: NASA EONET v3 Wildfires API (NASA Earth Science / Copernicus EFFIS)
 */
async function fetchFromEONET({ period }) {
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
 * 1. Primary: NASA FIRMS Direct API (if configured & reachable)
 * 2. Secondary: NASA EONET / Copernicus EFFIS Live API
 * 3. Stale Cache Fallback: previously cached live detections (marked as isCached: true)
 * 4. Fallback: UNAVAILABLE
 */
async function fetchWildfire({ period = '24h', lat, lon, forceRefresh = false, debug = false } = {}) {
  // Check fresh in-memory cache
  const isFreshCache = !forceRefresh && wildfireCache[period] && (Date.now() - (lastFetchTimes[period] || 0) < WILDFIRE_CACHE_TTL_MS);
  if (isFreshCache) {
    const cached = wildfireCache[period];
    const ageSec = Math.round((Date.now() - (lastFetchTimes[period] || 0)) / 1000);
    const cacheSource = (cached.provider === 'nasa_firms' || cached.source?.includes('FIRMS')) ? 'firms' : ((cached.provider === 'nasa_eonet' || cached.source?.includes('EONET')) ? 'eonet' : 'cache');
    console.log(`[wildfire-monitor] Cache HIT period=${period} source=${cacheSource} age=${ageSec}s`);

    if (debug) {
      return {
        period,
        source: cached.source,
        detectionCount: cached.count || cached.detections?.length || 0,
        cache: {
          used: true,
          age: ageSec,
          source: cacheSource,
          stale: false
        },
        firms: cached.firmsDiagnostic || {
          attemptedSources: [],
          successfulSources: [],
          failedSources: []
        }
      };
    }

    if (lat && lon && Array.isArray(cached.detections)) {
      const withDistance = cached.detections.map(d => ({
        ...d,
        distanceKm: Math.round(haversine(lat, lon, d.lat, d.lon))
      }));
      return { ...cached, detections: withDistance, isCached: true };
    }
    return { ...cached, isCached: true };
  }

  console.log(`[wildfire-monitor] Cache MISS period=${period}`);

  const firmsKey = process.env.FIRMS_MAP_KEY;
  let fetchResult = null;
  let firmsDiag = {
    attemptedSources: ['VIIRS_SNPP_NRT', 'VIIRS_NOAA20_NRT', 'MODIS_NRT'],
    successfulSources: [],
    failedSources: []
  };

  // 1. Primary Source: NASA FIRMS
  if (firmsKey && firmsKey !== 'YOUR_NASA_FIRMS_KEY' && firmsKey.trim() !== '') {
    try {
      const firmsRes = await fetchFromFIRMS({ period, apiKey: firmsKey.trim() });
      if (firmsRes.firmsDiagnostic) {
        firmsDiag = firmsRes.firmsDiagnostic;
      }
      if (firmsRes.success) {
        fetchResult = firmsRes;
      } else {
        console.warn(`[wildfire-monitor] period=${period} FIRMS unavailable, falling back to EONET`);
      }
    } catch (err) {
      console.warn(`[wildfire-monitor] period=${period} FIRMS unavailable, falling back to EONET`);
      firmsDiag.failedSources.push({ code: 'EXCEPTION', message: err.message });
    }
  } else {
    console.warn(`[wildfire-monitor] period=${period} FIRMS unavailable, falling back to EONET`);
    firmsDiag.failedSources = firmsDiag.attemptedSources.map(s => ({
      source: s,
      code: 'FIRMS_KEY_MISSING',
      message: 'FIRMS_MAP_KEY is not configured in environment'
    }));
  }

  // 2. Secondary Source: NASA EONET / Copernicus EFFIS
  if (!fetchResult) {
    try {
      const eonetRes = await fetchFromEONET({ period });
      if (eonetRes.success) {
        fetchResult = eonetRes;
      }
    } catch (err) {
      console.warn(`[wildfire-monitor] Secondary NASA EONET error: ${err.message}`);
    }
  }

  // Handle successful live fetch from Primary or Secondary
  if (fetchResult && fetchResult.success) {
    let detections = fetchResult.detections || [];
    const sourceLabel = fetchResult.provider === 'nasa_firms' ? 'FIRMS' : 'EONET';
    console.log(`[wildfire-monitor] period=${period} source=${sourceLabel} detections=${detections.length}`);

    if (debug) {
      const cacheSource = fetchResult.provider === 'nasa_firms' ? 'firms' : 'eonet';
      return {
        period,
        source: fetchResult.source,
        detectionCount: detections.length,
        cache: {
          used: false,
          age: 0,
          source: cacheSource,
          stale: false
        },
        firms: firmsDiag
      };
    }

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
      source: fetchResult.source,
      sourceUrl: fetchResult.sourceUrl,
      sourceAttribution: {
        name: fetchResult.source,
        url: fetchResult.sourceUrl
      },
      provider: fetchResult.provider,
      region: 'Balkans/Western Eurasia',
      bounds: BALKAN_BOUNDS,
      period,
      fetchedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      count: detections.length,
      detections,
      firmsDiagnostic: firmsDiag,
      message,
      isCached: false
    };

    persistCache(period, payload);
    return payload;
  }

  // 3. Stale Cache Fallback: return previously cached live data during transient upstream outage
  if (wildfireCache[period] && wildfireCache[period].status !== 'UNAVAILABLE') {
    const cached = wildfireCache[period];
    const cacheAgeSec = cached.fetchedAt ? Math.round((Date.now() - new Date(cached.fetchedAt).getTime()) / 1000) : 0;
    const cacheSource = (cached.provider === 'nasa_firms' || cached.source?.includes('FIRMS')) ? 'firms' : ((cached.provider === 'nasa_eonet' || cached.source?.includes('EONET')) ? 'eonet' : 'cache');
    console.log(`[wildfire-monitor] Cache STALE period=${period} source=${cacheSource} age=${cacheAgeSec}s`);

    if (debug) {
      return {
        period,
        source: cached.source,
        detectionCount: cached.count || cached.detections?.length || 0,
        cache: {
          used: true,
          age: cacheAgeSec,
          source: cacheSource,
          stale: true
        },
        firms: firmsDiag
      };
    }

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
      isCached: true
    };
  }

  // 4. Fallback: UNAVAILABLE
  console.log(`[wildfire-monitor] period=${period} source=UNAVAILABLE detections=0`);
  if (debug) {
    return {
      period,
      source: 'UNAVAILABLE',
      detectionCount: 0,
      cache: {
        used: false,
        age: 0,
        source: 'none',
        stale: false
      },
      firms: firmsDiag
    };
  }

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
    isCached: false
  };
}

module.exports = {
  fetchWildfire,
  fetchFromFIRMS,
  fetchFromEONET,
  parseCsvFires
};

if (require.main === module) {
  const args = process.argv.slice(2);
  const period = args[args.indexOf('--period') + 1] || '24h';
  fetchWildfire({ period, lat: 42.6026, lon: 20.9030, forceRefresh: true }).then(r => {
    console.log(JSON.stringify(r, null, 2));
  }).catch(err => console.error('Fetch error:', err.message));
}