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

const MET_NO_SYMBOLS = {
  clearsky: { code: 0, description: 'Clear sky' },
  fair: { code: 1, description: 'Mainly clear' },
  partlycloudy: { code: 2, description: 'Partly cloudy' },
  cloudy: { code: 3, description: 'Overcast' },
  fog: { code: 45, description: 'Fog' },
  lightrainshowers: { code: 61, description: 'Light drizzle' },
  rainshowers: { code: 80, description: 'Showers' },
  heavyrainshowers: { code: 82, description: 'Heavy showers' },
  lightrain: { code: 61, description: 'Light rain' },
  rain: { code: 63, description: 'Moderate rain' },
  heavyrain: { code: 65, description: 'Heavy rain' },
  lightsnowshowers: { code: 85, description: 'Light snow showers' },
  snowshowers: { code: 85, description: 'Snow showers' },
  heavysnowshowers: { code: 86, description: 'Heavy snow showers' },
  lightsnow: { code: 71, description: 'Light snow' },
  snow: { code: 73, description: 'Moderate snow' },
  heavysnow: { code: 75, description: 'Heavy snow' },
  lightrainandthunder: { code: 95, description: 'Thunderstorm' },
  rainandthunder: { code: 95, description: 'Thunderstorm' },
  heavyrainandthunder: { code: 99, description: 'Heavy thunderstorm' },
  sleet: { code: 77, description: 'Sleet' }
};

function parseMetNoSymbol(rawSymbol) {
  if (!rawSymbol) return { code: 0, description: 'Clear sky' };
  const base = rawSymbol.split('_')[0].toLowerCase();
  return MET_NO_SYMBOLS[base] || { code: 1, description: base.replace(/([A-Z])/g, ' $1').toLowerCase() };
}

/**
 * Secondary Provider: MET Norway / Yr.no Locationforecast 2.0 API
 * Highly accurate, keyless official European weather service.
 */
async function fetchFromYrNo({ location, coords, _httpClient = axios }) {
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${coords.lat.toFixed(4)}&lon=${coords.lon.toFixed(4)}`;
  const res = await _httpClient.get(url, {
    headers: { 'User-Agent': 'KOSINT-Intelligence/1.0 (https://github.com/rakicko/KOSINT26)' },
    timeout: 8000
  });

  const timeseries = res.data?.properties?.timeseries || [];
  if (!timeseries.length) throw new Error('Empty timeseries from MET Norway (Yr.no)');

  const currentEntry = timeseries[0];
  const instant = currentEntry.data?.instant?.details || {};
  const next1h = currentEntry.data?.next_1_hours;
  const symCode = next1h?.summary?.symbol_code || currentEntry.data?.next_6_hours?.summary?.symbol_code || 'clearsky_day';
  const parsedSym = parseMetNoSymbol(symCode);

  const temp = Math.round(instant.air_temperature ?? 20);
  const windMps = instant.wind_speed ?? 0;
  const windSpeedKmh = Math.round(windMps * 3.6);
  const humidity = Math.round(instant.relative_humidity ?? 50);
  const windDirection = Math.round(instant.wind_from_direction ?? 0);
  const precipitation = next1h?.details?.precipitation_amount ?? (currentEntry.data?.next_6_hours?.details?.precipitation_amount ? Math.round(currentEntry.data.next_6_hours.details.precipitation_amount / 6) : 0);

  const current = {
    temp,
    feelsLike: temp,
    humidity,
    windSpeed: windSpeedKmh,
    windDirection,
    precipitation,
    weatherCode: parsedSym.code,
    description: parsedSym.description,
    visibility: 10,
    uvIndex: null
  };

  const forecast = timeseries.slice(0, 6).map(t => {
    const tInstant = t.data?.instant?.details || {};
    const tNext = t.data?.next_1_hours;
    const tSym = tNext?.summary?.symbol_code || t.data?.next_6_hours?.summary?.symbol_code || 'clearsky_day';
    const tParsed = parseMetNoSymbol(tSym);
    return {
      time: t.time,
      temp: Math.round(tInstant.air_temperature ?? 20),
      precipitation: tNext?.details?.precipitation_amount ?? 0,
      weatherCode: tParsed.code,
      description: tParsed.description
    };
  });

  return {
    skill: 'weather-monitor',
    location,
    coordinates: coords,
    fetchedAt: new Date().toISOString(),
    current,
    alerts: deriveAlerts(current),
    forecast,
    source: 'Yr.no / MET Norway',
    provider: 'met_norway',
    isCached: false,
    stale: false
  };
}

/**
 * Fetch current weather and short-term forecast for a location
 * Includes: Multi-Provider (Open-Meteo primary -> Yr.no / MET Norway secondary),
 * In-memory Caching (TTL 15m), In-Flight Request Deduplication,
 * HTTP 429 Cooldown / Stale-Cache Fallback, and Commercial API Key support.
 */
async function fetchWeather({ location = 'Prishtinë', lat, lon, forceRefresh = false, _httpClient = axios } = {}) {
  const cacheTTL = getCacheTTL();
  const now = Date.now();
  const environment = process.env.NODE_ENV || (process.env.RENDER ? 'production' : 'local');

  // 1. Resolve coordinates
  let coords;
  if (typeof lat === 'number' && !isNaN(lat) && typeof lon === 'number' && !isNaN(lon)) {
    coords = { lat, lon };
  } else {
    coords = await geocode(location);
  }

  const coordsStr = `${coords.lat.toFixed(4)},${coords.lon.toFixed(4)}`;
  const cacheKey = getCacheKey(location, coords.lat, coords.lon);
  const cachedEntry = weatherCache.get(cacheKey);

  // 2. Return fresh cached data if valid and not force-refreshing
  if (!forceRefresh && cachedEntry && (now < cachedEntry.expiresAt)) {
    console.log(`[weather-monitor] environment=${environment}`);
    console.log(`[weather-monitor] city=${location}`);
    console.log(`[weather-monitor] coordinates=${coordsStr}`);
    console.log(`[weather-monitor] cacheStatus=HIT`);
    console.log(`[weather-monitor] provider=${cachedEntry.data?.provider || 'open-meteo'}`);
    console.log(`[weather-monitor] response status=200`);
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
    console.log(`[weather-monitor] environment=${environment}`);
    console.log(`[weather-monitor] city=${location}`);
    console.log(`[weather-monitor] coordinates=${coordsStr}`);
    console.log(`[weather-monitor] cacheStatus=STALE`);
    console.log(`[weather-monitor] provider=${cachedEntry.data?.provider || 'open-meteo'}`);
    console.log(`[weather-monitor] fallback reason=Active 429 rate-limit cooldown until ${new Date(rateLimitCooldownUntil).toISOString()}`);
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
    const providerName = apiKey ? 'open-meteo-customer' : 'open-meteo';
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

    const sanitizedParams = { ...params };
    if (sanitizedParams.apikey) sanitizedParams.apikey = '***';
    const qs = Object.entries(sanitizedParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    const sanitizedUrl = `${baseUrl}?${qs}`;

    console.log(`[weather-monitor] environment=${environment}`);
    console.log(`[weather-monitor] city=${location}`);
    console.log(`[weather-monitor] coordinates=${coordsStr}`);
    console.log(`[weather-monitor] cacheStatus=MISS`);
    console.log(`[weather-monitor] provider=${providerName}`);
    console.log(`[weather-monitor] request URL=${sanitizedUrl}`);

    let openMeteoSuccess = false;

    // ── Attempt Primary Provider: Open-Meteo ──
    const maxRetries = 1;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await _httpClient.get(baseUrl, {
          params,
          timeout: 8000,
        });

        console.log(`[weather-monitor] response status=${res.status || 200}`);

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
          provider: 'open-meteo',
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
        openMeteoSuccess = true;

        return resultData;
      } catch (err) {
        lastError = err;
        const status = err.response?.status || 'FAILED';
        const errCode = err.code || (err.response ? `HTTP_${err.response.status}` : 'ERR_NETWORK');
        console.warn(`[weather-monitor] response status=${status}`);
        console.warn(`[weather-monitor] error code=${errCode}`);
        console.warn(`[weather-monitor] error message=${err.message}`);

        const is429 = err.response && err.response.status === 429;

        if (is429) {
          const retryAfterHeader = err.response?.headers?.['retry-after'];
          const retryAfterSec = parseInt(retryAfterHeader, 10);
          const cooldownMs = (!isNaN(retryAfterSec) && retryAfterSec > 0 && retryAfterSec < 300)
            ? retryAfterSec * 1000
            : DEFAULT_COOLDOWN_MS;

          rateLimitCooldownUntil = Date.now() + cooldownMs;
          console.warn(`[weather-monitor] Rate-limit (HTTP 429) received for ${location}. Cooldown active for ${Math.round(cooldownMs / 1000)}s.`);
          break; // Immediately proceed to secondary provider on 429
        } else if (attempt < maxRetries && (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT')) {
          await new Promise(r => setTimeout(r, 500));
          continue;
        } else {
          break;
        }
      }
    }

    // ── Attempt Secondary Provider: Yr.no / MET Norway ──
    if (!openMeteoSuccess) {
      try {
        console.log(`[weather-monitor] Open-Meteo unavailable (${lastError?.message || '429'}). Attempting secondary provider: Yr.no / MET Norway...`);
        console.log(`[weather-monitor] environment=${environment}`);
        console.log(`[weather-monitor] city=${location}`);
        console.log(`[weather-monitor] coordinates=${coordsStr}`);
        console.log(`[weather-monitor] cacheStatus=MISS`);
        console.log(`[weather-monitor] provider=Yr.no / MET Norway`);
        console.log(`[weather-monitor] request URL=https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${coords.lat.toFixed(4)}&lon=${coords.lon.toFixed(4)}`);

        const yrNoResult = await fetchFromYrNo({ location, coords, _httpClient });
        console.log(`[weather-monitor] response status=200 (Yr.no)`);

        // Cache successful Yr.no response
        weatherCache.set(cacheKey, {
          data: yrNoResult,
          fetchedAt: Date.now(),
          expiresAt: Date.now() + cacheTTL,
        });

        return yrNoResult;
      } catch (yrErr) {
        console.warn(`[weather-monitor] Secondary provider Yr.no / MET Norway failed: ${yrErr.message}`);
        lastError = yrErr;
      }
    }

    // Fallback Strategy 1: Stale cache fallback (PREFER OVER DEMO!)
    if (cachedEntry && cachedEntry.data) {
      console.warn(`[weather-monitor] cacheStatus=STALE`);
      console.warn(`[weather-monitor] fallback reason=All live APIs failed (${lastError?.response?.status || lastError?.code || lastError?.message}), serving stale cache`);
      return {
        ...cachedEntry.data,
        isCached: true,
        stale: true,
        warning: `Weather API rate-limited (${lastError?.message || 'HTTP 429'}). Serving last known cached data.`,
      };
    }

    // Fallback Strategy 2: DEMO fallback ONLY when no cache exists anywhere
    console.warn(`[weather-monitor] fallback reason=Cold cache (no prior cache exists) & all weather APIs failed (${lastError?.response?.status || lastError?.code || 'UNKNOWN'} - ${lastError?.message || 'unknown error'})`);
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
  fetchFromYrNo,
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
