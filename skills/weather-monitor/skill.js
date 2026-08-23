'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const axios = require('axios');

const WMO_DESCRIPTIONS = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Freezing fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
  85: 'Slight snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm, heavy hail',
};

function describeCode(code) { return WMO_DESCRIPTIONS[code] || `Code ${code}`; }

// Built-in dictionary for standard Kosovo cities (eliminates rate-limited Nominatim queries)
const KNOWN_LOCATIONS = {
  'prishtine': { lat: 42.6629, lon: 21.1655, name: 'Prishtinë' },
  'prishtina': { lat: 42.6629, lon: 21.1655, name: 'Prishtinë' },
  'pristina': { lat: 42.6629, lon: 21.1655, name: 'Prishtinë' },
  'mitrovice': { lat: 42.8914, lon: 20.8660, name: 'Mitrovicë' },
  'mitrovica': { lat: 42.8914, lon: 20.8660, name: 'Mitrovicë' },
  'peje': { lat: 42.6591, lon: 20.2883, name: 'Pejë' },
  'pec': { lat: 42.6591, lon: 20.2883, name: 'Pejë' },
  'prizren': { lat: 42.2153, lon: 20.7415, name: 'Prizren' },
  'ferizaj': { lat: 42.3705, lon: 21.1553, name: 'Ferizaj' },
  'urosevac': { lat: 42.3705, lon: 21.1553, name: 'Ferizaj' },
  'gjilan': { lat: 42.4635, lon: 21.4694, name: 'Gjilan' },
  'gnjilane': { lat: 42.4635, lon: 21.4694, name: 'Gjilan' },
  'gjakove': { lat: 42.3803, lon: 20.4308, name: 'Gjakovë' },
  'djakovica': { lat: 42.3803, lon: 20.4308, name: 'Gjakovë' },
  'kosovo': { lat: 42.6026, lon: 20.9030, name: 'Kosovo' }
};

// Geocoding memory cache
const geocodeCache = new Map();

function normalizeLocationString(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics (ë->e, ç->c, š->s, etc.)
    .replace(/[,\s]+/g, ' ')
    .replace(/\bkosovo\b/gi, '')
    .replace(/\bkosova\b/gi, '')
    .trim();
}

/** Geocode a location string via known dictionary or Nominatim fallback */
async function geocode(location) {
  if (!location || typeof location !== 'string') {
    return { lat: 42.6629, lon: 21.1655 };
  }

  const normalized = normalizeLocationString(location);

  // Check known dictionary first
  if (KNOWN_LOCATIONS[normalized]) {
    return { lat: KNOWN_LOCATIONS[normalized].lat, lon: KNOWN_LOCATIONS[normalized].lon };
  }

  // Check geocode cache
  if (geocodeCache.has(normalized)) {
    return geocodeCache.get(normalized);
  }

  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: location, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'Sentinel-Dashboard/1.0' },
      timeout: 6000,
    });
    if (res.data && res.data.length > 0) {
      const coords = { lat: parseFloat(res.data[0].lat), lon: parseFloat(res.data[0].lon) };
      geocodeCache.set(normalized, coords);
      return coords;
    }
  } catch (err) {
    console.warn(`[weather-monitor] Geocoding lookup failed for ${location}:`, err.message);
  }

  // Fallback to default Prishtina coordinates if unknown
  return { lat: 42.6629, lon: 21.1655 };
}


/** Derive weather alerts from current conditions */
function deriveAlerts(current) {
  const alerts = [];
  if (current.weatherCode >= 95) alerts.push({ type: 'THUNDERSTORM', severity: 'high', message: 'Active thunderstorm conditions' });
  if (current.windSpeed > 80) alerts.push({ type: 'EXTREME_WIND', severity: 'high', message: `Wind speed ${current.windSpeed} km/h — dangerous conditions` });
  else if (current.windSpeed > 50) alerts.push({ type: 'STRONG_WIND', severity: 'medium', message: `Wind speed ${current.windSpeed} km/h` });
  if (current.precipitation > 20) alerts.push({ type: 'HEAVY_RAIN', severity: 'high', message: `Heavy rainfall ${current.precipitation}mm/h` });
  if (current.visibility < 1) alerts.push({ type: 'LOW_VISIBILITY', severity: 'medium', message: `Visibility only ${current.visibility}km` });
  return alerts;
}

function getDemoData(location, coords = { lat: 42.6629, lon: 21.1655 }) {
  const current = {
    temp: 24, feelsLike: 26, humidity: 65, windSpeed: 12,
    windDirection: 210, precipitation: 0, weatherCode: 1,
    description: 'Mainly clear', visibility: 10, uvIndex: 5
  };
  return {
    skill: 'weather-monitor',
    location,
    coordinates: coords,
    fetchedAt: new Date().toISOString(),
    current,
    alerts: [],
    forecast: [
      { time: new Date(Date.now() + 3600000).toISOString(), temp: 31, precipitation: 0, weatherCode: 1, description: 'Mainly clear' },
      { time: new Date(Date.now() + 7200000).toISOString(), temp: 30, precipitation: 2, weatherCode: 80, description: 'Slight showers' },
      { time: new Date(Date.now() + 10800000).toISOString(), temp: 28, precipitation: 8, weatherCode: 81, description: 'Moderate showers' },
      { time: new Date(Date.now() + 14400000).toISOString(), temp: 27, precipitation: 1, weatherCode: 61, description: 'Slight rain' },
      { time: new Date(Date.now() + 18000000).toISOString(), temp: 29, precipitation: 0, weatherCode: 2, description: 'Partly cloudy' },
      { time: new Date(Date.now() + 21600000).toISOString(), temp: 31, precipitation: 0, weatherCode: 0, description: 'Clear sky' },
    ],
    source: 'demo',
    isCached: false,
    stale: false,
  };
}

// In-Memory Weather Cache: key -> { data, fetchedAt, expiresAt }
const weatherCache = new Map();

// In-Flight Promise Map: key -> Promise<WeatherData> (Deduplication / Coalescing)
const inFlightRequests = new Map();

// Rate Limit Cooldown State
let rateLimitCooldownUntil = 0;
const DEFAULT_COOLDOWN_MS = 60 * 1000; // 60s cooldown on 429

// Cache TTL configuration (Default: 15 minutes = 900,000 ms)
function getCacheTTL() {
  const envTTL = parseInt(process.env.WEATHER_CACHE_TTL_MS, 10);
  return (!isNaN(envTTL) && envTTL > 0) ? envTTL : 15 * 60 * 1000;
}

/** Generate a normalized cache key from location or coordinates */
function getCacheKey(location, lat, lon) {
  if (typeof lat === 'number' && !isNaN(lat) && typeof lon === 'number' && !isNaN(lon)) {
    return `geo:${lat.toFixed(2)},${lon.toFixed(2)}`;
  }
  const normalizedLoc = (location || 'prishtine').toLowerCase().trim();
  if (KNOWN_LOCATIONS[normalizedLoc]) {
    const k = KNOWN_LOCATIONS[normalizedLoc];
    return `geo:${k.lat.toFixed(2)},${k.lon.toFixed(2)}`;
  }
  return `loc:${normalizedLoc}`;
}

/**
 * Fetch current weather and short-term forecast for a location
 * Includes: In-memory Caching (TTL 15m), In-Flight Request Deduplication,
 * HTTP 429 Cooldown / Stale-Cache Fallback, and Commercial API Key support.
 */
async function fetchWeather({ location = 'Prishtinë', lat, lon, forceRefresh = false, _httpClient = axios } = {}) {
  const cacheTTL = getCacheTTL();
  const now = Date.now();

  // 1. Resolve coordinates
  let coords;
  if (typeof lat === 'number' && !isNaN(lat) && typeof lon === 'number' && !isNaN(lon)) {
    coords = { lat, lon };
  } else {
    coords = await geocode(location);
  }

  const cacheKey = getCacheKey(location, coords.lat, coords.lon);
  const cachedEntry = weatherCache.get(cacheKey);

  // 2. Return fresh cached data if valid and not force-refreshing
  if (!forceRefresh && cachedEntry && (now < cachedEntry.expiresAt)) {
    return {
      ...cachedEntry.data,
      isCached: true,
      stale: false,
    };
  }

  // 3. In-Flight Request Deduplication (Coalesce concurrent calls for the same city/coordinates)
  if (inFlightRequests.has(cacheKey)) {
    const inFlightPromise = inFlightRequests.get(cacheKey);
    const result = await inFlightPromise;
    return {
      ...result,
      isCached: true,
    };
  }

  // 4. Rate-Limit Cooldown Check: If currently within 429 cooldown and stale cache exists, serve it
  if (!forceRefresh && now < rateLimitCooldownUntil && cachedEntry && cachedEntry.data) {
    console.warn(`[weather-monitor] Rate-limit cooldown active until ${new Date(rateLimitCooldownUntil).toISOString()}. Serving stale cached weather for ${location}.`);
    return {
      ...cachedEntry.data,
      isCached: true,
      stale: true,
      warning: 'Weather API rate-limited (HTTP 429). Serving cached data.',
    };
  }

  // 5. Build and register the in-flight fetch promise
  const fetchPromise = (async () => {
    let lastError = null;
    const apiKey = process.env.OPEN_METEO_API_KEY || process.env.OPENMETEO_API_KEY;
    const baseUrl = apiKey
      ? 'https://customer-api.open-meteo.com/v1/forecast'
      : 'https://api.open-meteo.com/v1/forecast';

    const params = {
      latitude: coords.lat,
      longitude: coords.lon,
      current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code,visibility',
      hourly: 'temperature_2m,precipitation,weather_code',
      wind_speed_unit: 'kmh',
      timezone: 'auto',
      forecast_days: 1,
      forecast_hours: 6,
    };
    if (apiKey) {
      params.apikey = apiKey;
    }

    const maxRetries = 1;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await _httpClient.get(baseUrl, {
          params,
          timeout: 8000,
        });

        const c = res.data.current;
        const current = {
          temp: Math.round(c.temperature_2m),
          feelsLike: Math.round(c.apparent_temperature),
          humidity: c.relative_humidity_2m,
          windSpeed: Math.round(c.wind_speed_10m),
          windDirection: c.wind_direction_10m,
          precipitation: c.precipitation || 0,
          weatherCode: c.weather_code,
          description: describeCode(c.weather_code),
          visibility: (c.visibility || 10000) / 1000,
          uvIndex: null,
        };

        const hourly = res.data.hourly || {};
        const forecast = (hourly.time || []).slice(0, 6).map((t, i) => ({
          time: t,
          temp: Math.round(hourly.temperature_2m[i]),
          precipitation: hourly.precipitation ? (hourly.precipitation[i] || 0) : 0,
          weatherCode: hourly.weather_code ? hourly.weather_code[i] : 0,
          description: describeCode(hourly.weather_code ? hourly.weather_code[i] : 0),
        }));

        const resultData = {
          skill: 'weather-monitor',
          location,
          coordinates: coords,
          fetchedAt: new Date().toISOString(),
          current,
          alerts: deriveAlerts(current),
          forecast,
          source: 'open-meteo',
          isCached: false,
          stale: false,
        };

        // Cache successful response
        weatherCache.set(cacheKey, {
          data: resultData,
          fetchedAt: Date.now(),
          expiresAt: Date.now() + cacheTTL,
        });

        // Reset rate-limit cooldown on success
        rateLimitCooldownUntil = 0;

        return resultData;
      } catch (err) {
        lastError = err;
        const is429 = err.response && err.response.status === 429;

        if (is429) {
          // Parse Retry-After header if provided
          const retryAfterHeader = err.response?.headers?.['retry-after'];
          const retryAfterSec = parseInt(retryAfterHeader, 10);
          const cooldownMs = (!isNaN(retryAfterSec) && retryAfterSec > 0 && retryAfterSec < 300)
            ? retryAfterSec * 1000
            : DEFAULT_COOLDOWN_MS;

          rateLimitCooldownUntil = Date.now() + cooldownMs;
          console.warn(`[weather-monitor] Rate-limit (HTTP 429) received for ${location}. Cooldown active for ${Math.round(cooldownMs / 1000)}s.`);

          // Single quick retry if Retry-After is tiny (<= 2s) and no cache exists
          if (attempt === 0 && !cachedEntry && !isNaN(retryAfterSec) && retryAfterSec <= 2) {
            await new Promise(r => setTimeout(r, retryAfterSec * 1000));
            continue;
          }
          break; // Stop loop on 429
        } else if (attempt < maxRetries && (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT')) {
          await new Promise(r => setTimeout(r, 500));
          continue;
        } else {
          break;
        }
      }
    }

    // API failed: Handle fallback gracefully
    // Fallback Strategy 1: Stale cache fallback (PREFER OVER DEMO!)
    if (cachedEntry && cachedEntry.data) {
      console.warn(`[weather-monitor] API unavailable (${lastError?.message || '429 Rate Limit'}). Serving stale cached weather for ${location}.`);
      return {
        ...cachedEntry.data,
        isCached: true,
        stale: true,
        warning: `Weather API rate-limited (${lastError?.message || 'HTTP 429'}). Serving last known cached data.`,
      };
    }

    // Fallback Strategy 2: DEMO fallback ONLY when no cache exists anywhere
    console.warn('[weather-monitor] Error, no cached data available, using fallback/demo:', lastError?.message || 'unknown');
    const fallbackCoords = coords || { lat: 42.6629, lon: 21.1655 };
    return getDemoData(location, fallbackCoords);
  })();

  inFlightRequests.set(cacheKey, fetchPromise);

  try {
    const result = await fetchPromise;
    return result;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

/** Testing helper to reset weather cache */
function _resetWeatherCacheForTesting() {
  weatherCache.clear();
  inFlightRequests.clear();
  geocodeCache.clear();
  rateLimitCooldownUntil = 0;
}

/** Testing helper to artificially expire all active cache entries */
function _expireCacheForTesting() {
  for (const [k, v] of weatherCache.entries()) {
    weatherCache.set(k, { ...v, expiresAt: Date.now() - 1000 });
  }
}

/** Testing helper to inspect cache statistics */
function _getWeatherCacheStats() {
  return {
    size: weatherCache.size,
    inFlightSize: inFlightRequests.size,
    rateLimitCooldownUntil,
  };
}

/** Testing helper to set cooldown */
function _setRateLimitCooldownForTesting(ms) {
  rateLimitCooldownUntil = Date.now() + ms;
}

module.exports = {
  fetchWeather,
  geocode,
  describeCode,
  deriveAlerts,
  getDemoData,
  getCacheTTL,
  getCacheKey,
  _resetWeatherCacheForTesting,
  _expireCacheForTesting,
  _getWeatherCacheStats,
  _setRateLimitCooldownForTesting,
  KNOWN_LOCATIONS,
  WMO_DESCRIPTIONS,
};

if (require.main === module) {
  const args = process.argv.slice(2);
  const loc = args[args.indexOf('--location') + 1] || 'Mitrovica, Kosovo';
  fetchWeather({ location: loc }).then(r => console.log(JSON.stringify(r, null, 2))).catch(console.error);
}
