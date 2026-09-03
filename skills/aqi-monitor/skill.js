'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const axios = require('axios');

// European Air Quality Index (EAQI) levels per Open-Meteo & CAMS
const AQI_LEVELS = [
  { max: 20,       label: 'Good',           level: 'GOOD',           color: '#34d399', icon: '😊' },
  { max: 40,       label: 'Fair',           level: 'FAIR',           color: '#86efac', icon: '🙂' },
  { max: 60,       label: 'Moderate',       level: 'MODERATE',       color: '#fbbf24', icon: '😐' },
  { max: 80,       label: 'Poor',           level: 'POOR',           color: '#fb923c', icon: '😷' },
  { max: 100,      label: 'Very Poor',      level: 'VERY POOR',      color: '#f87171', icon: '🤢' },
  { max: Infinity, label: 'Extremely Poor', level: 'EXTREMELY POOR', color: '#a855f7', icon: '☠️' }
];

function classifyAQI(europeanAQI) {
  if (typeof europeanAQI !== 'number' || isNaN(europeanAQI) || europeanAQI < 0) {
    return { label: 'Unknown', level: 'UNKNOWN', color: '#94a3b8', icon: '❓' };
  }
  return AQI_LEVELS.find(l => europeanAQI <= l.max) || AQI_LEVELS[AQI_LEVELS.length - 1];
}

// In-memory cache
const aqiCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const { resolveCoordinates } = require('../../server/geocoder');

async function geocode(location) {
  return await resolveCoordinates(location);
}

async function fetchAQI({ location = 'Kosovo', lat, lon, forceRefresh = false } = {}) {
  try {
    let resolvedLat = lat;
    let resolvedLon = lon;

    if (typeof resolvedLat !== 'number' || typeof resolvedLon !== 'number' || isNaN(resolvedLat) || isNaN(resolvedLon)) {
      const geo = await geocode(location);
      resolvedLat = geo.lat;
      resolvedLon = geo.lon;
    }

    // Validation: Coordinates range
    if (!Number.isFinite(resolvedLat) || !Number.isFinite(resolvedLon) ||
        resolvedLat < -90 || resolvedLat > 90 || resolvedLon < -180 || resolvedLon > 180) {
      return {
        skill: 'aqi-monitor',
        location,
        fetchedAt: new Date().toISOString(),
        status: 'INVALID_DATA',
        error: 'INVALID_COORDINATES',
        message: `Coordinates out of range: (${resolvedLat}, ${resolvedLon})`,
        current: null,
        hourlyTrend: [],
        source: 'Open-Meteo & CAMS'
      };
    }

    // Check cache
    const cacheKey = `${resolvedLat.toFixed(3)},${resolvedLon.toFixed(3)}`;
    if (!forceRefresh && aqiCache.has(cacheKey)) {
      const cached = aqiCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return { ...cached.data, isCached: true };
      }
    }

    const apiUrl = 'https://air-quality-api.open-meteo.com/v1/air-quality';
    const params = {
      latitude: resolvedLat,
      longitude: resolvedLon,
      current: 'european_aqi,european_aqi_pm2_5,european_aqi_pm10,european_aqi_nitrogen_dioxide,european_aqi_ozone,european_aqi_sulphur_dioxide,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide,dust',
      hourly: 'european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide,dust',
      timezone: 'auto',
      forecast_days: 2
    };

    const res = await axios.get(apiUrl, { params, timeout: 12000 });

    if (!res.data || typeof res.data !== 'object') {
      return {
        skill: 'aqi-monitor',
        location,
        fetchedAt: new Date().toISOString(),
        status: 'NO_DATA',
        error: 'EMPTY_RESPONSE',
        message: 'Open-Meteo returned empty payload.',
        current: null,
        hourlyTrend: [],
        source: 'Open-Meteo & CAMS'
      };
    }

    const c = res.data.current;
    if (!c || c.european_aqi === undefined || c.european_aqi === null) {
      return {
        skill: 'aqi-monitor',
        location,
        fetchedAt: new Date().toISOString(),
        status: 'NO_DATA',
        error: 'MISSING_AQI_FIELD',
        message: 'Open-Meteo response is missing european_aqi.',
        current: null,
        hourlyTrend: [],
        source: 'Open-Meteo & CAMS'
      };
    }

    const aqi = c.european_aqi;
    // Validation: AQI and pollutant numeric validity
    if (typeof aqi !== 'number' || !Number.isFinite(aqi) || aqi < 0) {
      return {
        skill: 'aqi-monitor',
        location,
        fetchedAt: new Date().toISOString(),
        status: 'INVALID_DATA',
        error: 'INVALID_AQI_VALUE',
        message: `Invalid European AQI value: ${aqi}`,
        current: null,
        hourlyTrend: [],
        source: 'Open-Meteo & CAMS'
      };
    }

    // Validate pollutant measurements
    const pollutantFields = {
      pm2_5: c.pm2_5,
      pm10: c.pm10,
      no2: c.nitrogen_dioxide,
      o3: c.ozone,
      so2: c.sulphur_dioxide,
      co: c.carbon_monoxide,
      dust: c.dust
    };

    for (const [name, val] of Object.entries(pollutantFields)) {
      if (typeof val !== 'number' || !Number.isFinite(val) || val < 0) {
        return {
          skill: 'aqi-monitor',
          location,
          fetchedAt: new Date().toISOString(),
          status: 'INVALID_DATA',
          error: 'INVALID_POLLUTANT_VALUE',
          message: `Invalid pollutant measurement for ${name}: ${val}`,
          current: null,
          hourlyTrend: [],
          source: 'Open-Meteo & CAMS'
        };
      }
    }

    const classification = classifyAQI(aqi);

    // Sub-pollutants and dominant pollutant calculation
    const subIndices = [
      { name: 'Ozone (O₃)', key: 'o3', val: c.european_aqi_ozone },
      { name: 'PM2.5', key: 'pm2_5', val: c.european_aqi_pm2_5 },
      { name: 'PM10', key: 'pm10', val: c.european_aqi_pm10 },
      { name: 'Nitrogen Dioxide (NO₂)', key: 'no2', val: c.european_aqi_nitrogen_dioxide },
      { name: 'Sulphur Dioxide (SO₂)', key: 'so2', val: c.european_aqi_sulphur_dioxide }
    ].filter(s => typeof s.val === 'number' && !isNaN(s.val));

    subIndices.sort((a, b) => b.val - a.val);
    const dominantPollutant = subIndices.length > 0 && subIndices[0].val > 0 ? subIndices[0].name : 'PM2.5';

    // Hourly trend extraction
    const hourly = res.data.hourly || {};
    const hourlyTimes = Array.isArray(hourly.time) ? hourly.time : [];
    const hourlyAqi = Array.isArray(hourly.european_aqi) ? hourly.european_aqi : [];

    if (hourlyTimes.length !== hourlyAqi.length) {
      return {
        skill: 'aqi-monitor',
        location,
        fetchedAt: new Date().toISOString(),
        status: 'INVALID_DATA',
        error: 'HOURLY_ARRAY_MISMATCH',
        message: 'Hourly time and AQI array lengths do not match.',
        current: null,
        hourlyTrend: [],
        source: 'Open-Meteo & CAMS'
      };
    }

    // Trend direction (comparing previous 3 hours to next 3 hours)
    let trend = 'stable';
    let trendIcon = '→';
    if (hourlyAqi.length >= 6) {
      const early = hourlyAqi.slice(0, 3).reduce((a, b) => a + (b || 0), 0) / 3;
      const late  = hourlyAqi.slice(-3).reduce((a, b) => a + (b || 0), 0) / 3;
      if (late - early > 5) { trend = 'worsening'; trendIcon = '↘'; }
      else if (early - late > 5) { trend = 'improving'; trendIcon = '↗'; }
    }

    // Next 24 hours trend
    const next24 = [];
    const currentIso = c.time || new Date().toISOString();
    let startIdx = hourlyTimes.findIndex(t => t >= currentIso);
    if (startIdx === -1) startIdx = 0;

    for (let i = startIdx; i < Math.min(hourlyTimes.length, startIdx + 24); i++) {
      const val = hourlyAqi[i];
      if (Number.isFinite(val)) {
        const cls = classifyAQI(val);
        next24.push({
          time: hourlyTimes[i],
          hour: hourlyTimes[i].includes('T') ? hourlyTimes[i].split('T')[1].substring(0, 5) : hourlyTimes[i],
          aqi: Math.round(val),
          label: cls.label,
          color: cls.color
        });
      }
    }

    // Alert generation
    const alerts = [];
    if (aqi >= 80) {
      alerts.push({ type: 'VERY_POOR_AIR', severity: 'high', message: `European AQI ${aqi} (${classification.label}) — High air pollution. Limit outdoor exertion.` });
    } else if (aqi >= 60) {
      alerts.push({ type: 'POOR_AIR', severity: 'medium', message: `European AQI ${aqi} (${classification.label}) — Sensitive groups should reduce outdoor exposure.` });
    }

    const payload = {
      skill: 'aqi-monitor',
      location,
      coordinates: { lat: resolvedLat, lon: resolvedLon },
      fetchedAt: new Date().toISOString(),
      updatedAt: c.time || new Date().toISOString(),
      status: 'LIVE_DATA',
      source: 'Open-Meteo & CAMS',
      attribution: 'Open-Meteo & Copernicus Atmosphere Monitoring Service (CAMS)',
      current: {
        europeanAQI: Math.round(aqi),
        label: classification.label,
        level: classification.level,
        color: classification.color,
        icon: classification.icon,
        dominantPollutant,
        pm2_5: typeof c.pm2_5 === 'number' ? +c.pm2_5.toFixed(1) : 0,
        pm10: typeof c.pm10 === 'number' ? +c.pm10.toFixed(1) : 0,
        no2: typeof c.nitrogen_dioxide === 'number' ? +c.nitrogen_dioxide.toFixed(1) : 0,
        o3: typeof c.ozone === 'number' ? +c.ozone.toFixed(1) : 0,
        so2: typeof c.sulphur_dioxide === 'number' ? +c.sulphur_dioxide.toFixed(1) : 0,
        co: typeof c.carbon_monoxide === 'number' ? +c.carbon_monoxide.toFixed(1) : 0,
        dust: typeof c.dust === 'number' ? +c.dust.toFixed(1) : 0,
        units: {
          aqi: 'EAQI',
          pm2_5: 'μg/m³',
          pm10: 'μg/m³',
          no2: 'μg/m³',
          o3: 'μg/m³',
          so2: 'μg/m³',
          co: 'μg/m³',
          dust: 'μg/m³'
        }
      },
      trend: {
        status: trend,
        icon: trendIcon
      },
      hourlyTrend: next24,
      alerts,
      isCached: false
    };

    // Cache successful response
    aqiCache.set(cacheKey, { timestamp: Date.now(), data: payload });

    return payload;
  } catch (err) {
    console.warn('[aqi-monitor] Open-Meteo fetch failed:', err.message);
    return {
      skill: 'aqi-monitor',
      location,
      fetchedAt: new Date().toISOString(),
      status: 'UNAVAILABLE',
      error: 'NETWORK_OR_API_ERROR',
      message: err.message || 'Open-Meteo Air Quality service is currently unavailable.',
      current: null,
      hourlyTrend: [],
      source: 'Open-Meteo & CAMS'
    };
  }
}

module.exports = {
  fetchAQI,
  classifyAQI
};

if (require.main === module) {
  fetchAQI({ location: 'Mitrovica, Kosovo', lat: 42.8914, lon: 20.8660 }).then(r => {
    console.log(JSON.stringify(r, null, 2));
  }).catch(console.error);
}
