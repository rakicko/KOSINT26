'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const axios = require('axios');

const BALKAN_BOUNDS = { minLat: 39.4, maxLat: 45.2, minLon: 18.0, maxLon: 23.6 };

const TIME_RANGES = { '24h': '24h', '48h': '48h', '7d': '7d' };

const FIRMS_SOURCES = [
  { type: 'modis', prefix: 'MODIS' },
  { type: 'viirs', prefix: 'VIIRS' }
];

const MODIS_COLLECTION = 'MODIS_C6';
const VIIRS_COLLECTION = 'VIIRS_C3';

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatFirmsData(rawFires, sourceType) {
  if (!rawFires || !Array.isArray(rawFires)) return [];
  
  return rawFires.map(f => ({
    id: `ns-${f.acq_date}-${f.acq_time}-${f.latitude}-${f.longitude}`,
    lat: f.latitude,
    lon: f.longitude,
    brightness: f.bright_t31,
    frp: f.frp,
    confidence: f.confidence,
    satellite: f.satellite || f.provider,
    acq_date: f.acq_date,
    acq_time: f.acq_time,
    bright_t42: f.bright_t42,
    version: f.version,
    daynight: f.daynight,
    type: f.type || sourceType
  }));
}

async function fetchFromNASA({ period, apiKey }) {
  const endpoints = [
    `https://firms.modaps.eosdis.nasa.gov/api/area/fire/${MODIS_COLLECTION}/${TIME_RANGES[period]}.json`,
    `https://firms.modaps.eosdis.nasa.gov/api/area/fire/${VIIRS_COLLECTION}/${TIME_RANGES[period]}.json`
  ];
  
  const headers = {
    'User-Agent': 'Sentinel-Dashboard/1.0'
  };
  
  if (apiKey) {
    headers['Authorization'] = apiKey;
  }
  
  const results = await Promise.allSettled(
    endpoints.map(url => axios.get(url, { headers, timeout: 20000 }))
  );
  
  let allFires = [];
  let source = '';
  let authFailed = false;
  let requestStarted = new Date().toISOString();
  
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'fulfilled') {
      const data = results[i].value?.data;
      if (data && data.fires && Array.isArray(data.fires)) {
        const sourceType = i === 0 ? 'MODIS' : 'VIIRS';
        allFires = allFires.concat(formatFirmsData(data.fires, sourceType.toLowerCase()));
        if (!source) source = data.satellite || sourceType;
      }
    } else if (results[i].reason?.response?.status === 403) {
      authFailed = true;
    }
  }
  
  if (authFailed) {
    return { success: false, error: 'AUTH_FAILED', source: 'NASA FIRMS' };
  }
  
  if (allFires.length === 0) {
    return { success: false, error: 'NO_DATA', source: source || 'NASA FIRMS' };
  }
  
  const filtered = allFires.filter(d => 
    d.lat >= BALKAN_BOUNDS.minLat && 
    d.lat <= BALKAN_BOUNDS.maxLat && 
    d.lon >= BALKAN_BOUNDS.minLon && 
    d.lon <= BALKAN_BOUNDS.maxLon
  );
  
  console.log(`[wildfire-monitor] Source: ${source}, Period: ${period}, Detections: ${filtered.length}`);
  
  return { success: true, detections: filtered, source, period, requestStarted };
}

async function fetchWildfire({ period = '24h', lat, lon } = {}) {
  const apiKey = process.env.FIRMS_MAP_KEY;
  
  if (!apiKey) {
    return {
      skill: 'wildfire-monitor',
      fetchedAt: new Date().toISOString(),
      detections: [],
      count: 0,
      period,
      source: 'NASA FIRMS',
      error: 'NASA FIRMS • API key not configured',
      provider: 'nasa_firms',
      region: 'Balkans/Western Eurasia',
      bounds: BALKAN_BOUNDS
    };
  }
  
  const result = await fetchFromNASA({ period, apiKey });
  
  if (!result.success) {
    if (result.error === 'AUTH_FAILED') {
      return {
        skill: 'wildfire-monitor',
        fetchedAt: new Date().toISOString(),
        detections: [],
        count: 0,
        period,
        source: result.source,
        error: 'NASA FIRMS • Authentication failed',
        provider: 'nasa_firms',
        region: 'Balkans/Western Eurasia',
        bounds: BALKAN_BOUNDS
      };
    }
    
    if (result.error === 'NO_DATA') {
      return {
        skill: 'wildfire-monitor',
        fetchedAt: new Date().toISOString(),
        detections: [],
        count: 0,
        period,
        source: result.source,
        provider: 'nasa_firms',
        region: 'Balkans/Western Eurasia',
        bounds: BALKAN_BOUNDS
      };
    }
  }
  
  let detections = result.detections || [];
  
  if (lat && lon) {
    detections = detections.map(d => ({
      ...d,
      distanceKm: Math.round(haversine(lat, lon, d.lat, d.lon))
    }));
  }
  
  detections.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  
  return {
    skill: 'wildfire-monitor',
    fetchedAt: new Date().toISOString(),
    detections,
    count: detections.length,
    period,
    source: result.source || 'NASA FIRMS',
    provider: 'nasa_firms',
    region: 'Balkans/Western Eurasia',
    bounds: BALKAN_BOUNDS
  };
}

module.exports = { fetchWildfire };

if (require.main === module) {
  const args = process.argv.slice(2);
  const period = args[args.indexOf('--period') + 1] || '24h';
  console.log(`Fetching wildfire data for period: ${period}`);
  fetchWildfire({ period }).then(r => {
    console.log(`Source: ${r.source}`);
    console.log(`Period: ${r.period}`);
    console.log(`Count: ${r.count}`);
    console.log(`Error: ${r.error || 'None'}`);
    if (r.error === 'NASA FIRMS • API key not configured') {
      console.log('Set FIRMS_MAP_KEY environment variable to access NASA FIRMS data');
    }
    if (r.detections?.length > 0) {
      console.log('Sample detections:', JSON.stringify(r.detections.slice(0, 3), null, 2));
    }
  }).catch(err => console.error('Fetch error:', err.message));
}