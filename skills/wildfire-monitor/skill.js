'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const axios = require('axios');

const BALKAN_BOUNDS = { minLat: 39.4, maxLat: 45.2, minLon: 18.0, maxLon: 23.6 };

// NASA FIRMS Area API accepts day range from 1 to 5
const DAY_RANGES = { '24h': 1, '48h': 2, '7d': 5 };

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
      type: sourceName
    });
  }
  return detections;
}

async function fetchFromNASA({ period, apiKey }) {
  const dayCount = DAY_RANGES[period] || 1;
  const areaBbox = `${BALKAN_BOUNDS.minLon},${BALKAN_BOUNDS.minLat},${BALKAN_BOUNDS.maxLon},${BALKAN_BOUNDS.maxLat}`;
  
  const sources = [
    { name: 'VIIRS_SNPP_NRT', label: 'VIIRS (Suomi-NPP)' },
    { name: 'VIIRS_NOAA20_NRT', label: 'VIIRS (NOAA-20)' },
    { name: 'MODIS_NRT', label: 'MODIS (Terra/Aqua)' }
  ];

  const requests = sources.map(s => {
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/${s.name}/${areaBbox}/${dayCount}`;
    return axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'SENTINEL-Intelligence/1.0' }
    }).then(res => ({ source: s.label, data: res.data }))
      .catch(err => ({ source: s.label, error: err.message, status: err.response?.status }));
  });

  const responses = await Promise.all(requests);

  let allDetections = [];
  let successCount = 0;
  let authFailed = false;

  for (const resp of responses) {
    if (resp.status === 403 || resp.status === 401) {
      authFailed = true;
      continue;
    }
    if (resp.data && typeof resp.data === 'string') {
      successCount++;
      const parsed = parseCsvFires(resp.data, resp.source);
      allDetections = allDetections.concat(parsed);
    }
  }

  if (authFailed && successCount === 0) {
    return { success: false, error: 'FIRMS_AUTH_FAILED', message: 'NASA FIRMS API key authentication failed (401/403).' };
  }

  if (successCount === 0) {
    return { success: false, error: 'FIRMS_FETCH_FAILED', message: 'NASA FIRMS API connection failed or returned no response.' };
  }

  return { success: true, detections: allDetections };
}

async function fetchWildfire({ period = '24h', lat, lon } = {}) {
  const apiKey = process.env.FIRMS_MAP_KEY;

  if (!apiKey || apiKey === 'YOUR_NASA_FIRMS_KEY' || apiKey.trim() === '') {
    return {
      skill: 'wildfire-monitor',
      fetchedAt: new Date().toISOString(),
      detections: [],
      count: 0,
      period,
      status: 'NOT_CONFIGURED',
      error: 'FIRMS_KEY_MISSING',
      message: 'NASA FIRMS API key not configured. Live thermal monitoring is inactive.',
      source: 'NASA FIRMS',
      provider: 'nasa_firms',
      region: 'Balkans/Western Eurasia',
      bounds: BALKAN_BOUNDS
    };
  }

  try {
    const result = await fetchFromNASA({ period, apiKey });

    if (!result.success) {
      return {
        skill: 'wildfire-monitor',
        fetchedAt: new Date().toISOString(),
        detections: [],
        count: 0,
        period,
        status: 'UNAVAILABLE',
        error: result.error,
        message: result.message || 'NASA FIRMS service unavailable.',
        source: 'NASA FIRMS',
        provider: 'nasa_firms',
        region: 'Balkans/Western Eurasia',
        bounds: BALKAN_BOUNDS
      };
    }

    let detections = result.detections || [];

    if (lat && lon) {
      detections = detections.map(d => ({
        ...d,
        distanceKm: Math.round(haversine(lat, lon, d.lat, d.lon))
      }));
    }

    detections.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

    if (detections.length === 0) {
      return {
        skill: 'wildfire-monitor',
        fetchedAt: new Date().toISOString(),
        detections: [],
        count: 0,
        period,
        status: 'NO_ACTIVE_FIRES',
        message: `No active thermal fire anomalies detected in the selected period (${period}).`,
        source: 'NASA FIRMS (MODIS/VIIRS)',
        provider: 'nasa_firms',
        region: 'Balkans/Western Eurasia',
        bounds: BALKAN_BOUNDS
      };
    }

    return {
      skill: 'wildfire-monitor',
      fetchedAt: new Date().toISOString(),
      detections,
      count: detections.length,
      period,
      status: 'LIVE_DATA',
      source: 'NASA FIRMS (MODIS/VIIRS)',
      provider: 'nasa_firms',
      region: 'Balkans/Western Eurasia',
      bounds: BALKAN_BOUNDS
    };
  } catch (err) {
    console.warn('[wildfire-monitor] error fetching FIRMS:', err.message);
    return {
      skill: 'wildfire-monitor',
      fetchedAt: new Date().toISOString(),
      detections: [],
      count: 0,
      period,
      status: 'UNAVAILABLE',
      error: err.message,
      message: 'Failed to communicate with NASA FIRMS service.',
      source: 'NASA FIRMS',
      provider: 'nasa_firms',
      region: 'Balkans/Western Eurasia',
      bounds: BALKAN_BOUNDS
    };
  }
}

module.exports = { fetchWildfire };

if (require.main === module) {
  const args = process.argv.slice(2);
  const period = args[args.indexOf('--period') + 1] || '24h';
  fetchWildfire({ period }).then(r => {
    console.log(JSON.stringify(r, null, 2));
  }).catch(err => console.error('Fetch error:', err.message));
}