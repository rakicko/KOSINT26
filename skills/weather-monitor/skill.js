'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const axios = require('axios');

// ── WMO weather code descriptions ─────────────────────────────────────────────
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

// ── Geocode ───────────────────────────────────────────────────────────────────
async function geocode(location) {
  const res = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: { q: location, format: 'json', limit: 1 },
    headers: { 'User-Agent': 'Sentinel-Dashboard/1.0' },
    timeout: 6000,
  });
  if (!res.data.length) throw new Error(`Could not geocode ${location}`);
  return { lat: parseFloat(res.data[0].lat), lon: parseFloat(res.data[0].lon) };
}

// ── Alert derivation (existing logic, unchanged) ──────────────────────────────
function deriveAlerts(current) {
  const alerts = [];
  if (current.weatherCode >= 95) alerts.push({ type: 'THUNDERSTORM', severity: 'high', message: 'Active thunderstorm conditions' });
  if (current.windSpeed > 80) alerts.push({ type: 'EXTREME_WIND', severity: 'high', message: `Wind speed ${current.windSpeed} km/h — dangerous conditions` });
  else if (current.windSpeed > 50) alerts.push({ type: 'STRONG_WIND', severity: 'medium', message: `Wind speed ${current.windSpeed} km/h` });
  if (current.precipitation > 20) alerts.push({ type: 'HEAVY_RAIN', severity: 'high', message: `Heavy rainfall ${current.precipitation}mm/h` });
  if (current.visibility < 1) alerts.push({ type: 'LOW_VISIBILITY', severity: 'medium', message: `Visibility only ${current.visibility}km` });
  return alerts;
}

// ── Intelligence pipeline helpers ─────────────────────────────────────────────

/**
 * Map a WMO weather code to a SENTINEL intelligence category.
 * Weather events belong to either "Weather" or "Natural Disaster" depending
 * on the intensity of the event.
 */
function classifyWeatherCategory(code, alerts) {
  const hasHighAlert = alerts.some(a => a.severity === 'high');
  if (code >= 95 || hasHighAlert) return 'Natural Disaster'; // thunderstorms, extreme wind, heavy rain
  if (code >= 51 || alerts.length > 0) return 'Weather';     // rain, fog, moderate wind
  return 'Weather';
}

/**
 * Derive a canonical severity from current weather conditions.
 * Mirrors the news-intel severity model: LOW / MEDIUM / HIGH / CRITICAL.
 */
function calculateWeatherSeverity(current, alerts) {
  if (current.weatherCode >= 99) return 'CRITICAL'; // thunderstorm + heavy hail
  const highAlerts = alerts.filter(a => a.severity === 'high');
  if (highAlerts.length >= 2 || (current.weatherCode >= 95 && current.windSpeed > 60)) return 'CRITICAL';
  if (highAlerts.length >= 1 || current.weatherCode >= 95) return 'HIGH';
  if (alerts.length > 0 || current.weatherCode >= 51) return 'MEDIUM';
  return 'LOW';
}

/**
 * Confidence for weather intelligence is high when using a live provider and
 * when conditions are concrete and measurable (not just forecasted).
 * Range: 0–100.
 */
function calculateWeatherConfidence(source) {
  if (source === 'open-meteo') return 88; // live, reputable free API
  if (source === 'demo') return 35;       // synthetic fallback
  return 60;
}

/**
 * Threat score for a weather intelligence event.
 * Combines severity, confidence, and Kosovo relevance baseline.
 * Range: 0–100.
 */
function calculateWeatherThreatScore({ severity, confidence, alertCount }) {
  const sevWeight = { LOW: 12, MEDIUM: 30, HIGH: 55, CRITICAL: 80 }[severity] || 12;
  const alertBonus = Math.min(15, alertCount * 6);
  return Math.min(100, Math.round(sevWeight * 0.55 + confidence * 0.25 + alertBonus));
}

/**
 * Convert the raw weather result into one canonical intelligence event
 * following the same schema as news-intel intelligenceEvents.
 *
 * The event represents the current observed weather state as an intelligence
 * observation — not a forecast. Active alerts become keywords and entities.
 * Forecast degradation events (e.g. rain incoming within 3h) are reflected
 * in the summary but stored as a separate forecast-period field.
 *
 * Returns null when there are no alerts and severity is LOW (no intelligence
 * value in completely clear-sky conditions).
 */
function buildWeatherIntelligenceEvent(weatherResult) {
  const { location, coordinates, current, alerts, forecast, source, fetchedAt } = weatherResult;

  const severity = calculateWeatherSeverity(current, alerts);
  // Do not produce intelligence events for fully clear, alert-free weather
  if (severity === 'LOW' && alerts.length === 0) return null;

  const category = classifyWeatherCategory(current.weatherCode, alerts);
  const confidence = calculateWeatherConfidence(source);
  const threatScore = calculateWeatherThreatScore({ severity, confidence, alertCount: alerts.length });

  const alertDescriptions = alerts.map(a => a.type.replace(/_/g, ' ').toLowerCase());
  const title = alerts.length > 0
    ? `Weather Alert — ${alerts.map(a => a.type.replace(/_/g, ' ')).join(', ')}`
    : `Weather Intelligence — ${current.description}`;

  // Summarise the immediate situation plus near-term forecast degradation
  const forecastWarning = forecast.find(f => f.weatherCode >= 80 || f.precipitation > 5);
  const summary = [
    `${current.description}. Temp ${current.temp}°C, wind ${current.windSpeed} km/h, humidity ${current.humidity}%.`,
    alerts.map(a => a.message).join(' '),
    forecastWarning ? `Forecast: ${forecastWarning.description} expected.` : '',
  ].filter(Boolean).join(' ').trim();

  const locationObj = {
    originalName: location,
    normalizedName: location,
    municipality: location,
    country: 'Kosovo',
    region: 'Kosovo',
    coordinates: coordinates ? { lat: coordinates.lat, lon: coordinates.lon } : null,
  };

  const entities = [
    ...alerts.map(a => a.type.replace(/_/g, ' ')),
    current.description,
    `${current.temp}°C`,
  ].filter(Boolean);

  const keywords = [
    current.description.toLowerCase(),
    ...alertDescriptions,
    `${current.windSpeed}kmh`,
    `${current.precipitation}mm`,
    current.visibility < 5 ? 'low visibility' : null,
  ].filter(Boolean);

  // Attach weather-specific metadata as an extension field.
  // This does not conflict with the canonical schema — it is additive.
  const weatherDetail = {
    temperature: current.temp,
    feelsLike: current.feelsLike,
    humidity: current.humidity,
    windSpeed: current.windSpeed,
    windDirection: current.windDirection,
    precipitation: current.precipitation,
    weatherCode: current.weatherCode,
    conditions: current.description,
    visibility: current.visibility,
    forecastPeriod: forecast.slice(0, 3).map(f => ({
      time: f.time,
      temp: f.temp,
      conditions: f.description,
      precipitation: f.precipitation,
    })),
    affectedAreas: [location],
    warnings: alerts.map(a => ({ type: a.type, severity: a.severity, message: a.message })),
  };

  return {
    id: `weather-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title,
    summary,
    category,
    severity,
    confidence,
    threatScore,
    locations: [locationObj],
    entities,
    keywords,
    timeline: { earliest: fetchedAt, latest: fetchedAt },
    sources: [{ name: `Open-Meteo (${source})`, url: 'https://open-meteo.com', language: 'en' }],
    relatedArticles: [],
    createdAt: fetchedAt,
    updatedAt: fetchedAt,
    // Weather-specific extension fields (additive, does not break canonical contract)
    weatherDetail,
  };
}

// ── Demo data (fallback) ──────────────────────────────────────────────────────
function getDemoData(location) {
  const current = { temp: 24, feelsLike: 26, humidity: 65, windSpeed: 12, windDirection: 210, precipitation: 0, weatherCode: 1, description: 'Mainly clear', visibility: 10, uvIndex: 5 };
  return {
    skill: 'weather-monitor', location,
    coordinates: { lat: 42.89, lon: 20.87 },
    fetchedAt: new Date().toISOString(),
    current, alerts: [],
    forecast: [
      { time: new Date(Date.now() + 3600000).toISOString(), temp: 31, precipitation: 0, weatherCode: 1, description: 'Mainly clear' },
      { time: new Date(Date.now() + 7200000).toISOString(), temp: 30, precipitation: 2, weatherCode: 80, description: 'Slight showers' },
      { time: new Date(Date.now() + 10800000).toISOString(), temp: 28, precipitation: 8, weatherCode: 81, description: 'Moderate showers' },
      { time: new Date(Date.now() + 14400000).toISOString(), temp: 27, precipitation: 1, weatherCode: 61, description: 'Slight rain' },
      { time: new Date(Date.now() + 18000000).toISOString(), temp: 29, precipitation: 0, weatherCode: 2, description: 'Partly cloudy' },
      { time: new Date(Date.now() + 21600000).toISOString(), temp: 31, precipitation: 0, weatherCode: 0, description: 'Clear sky' },
    ],
    source: 'demo',
  };
}

// ── Main fetch function ───────────────────────────────────────────────────────
async function fetchWeather({ location, lat, lon }) {
  let weatherResult;
  try {
    let coords = (lat && lon) ? { lat, lon } : await geocode(location);
    const res = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: coords.lat, longitude: coords.lon,
        current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code,visibility',
        hourly: 'temperature_2m,precipitation,weather_code',
        wind_speed_unit: 'kmh', timezone: 'auto', forecast_days: 1, forecast_hours: 6,
      },
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

    const hourly = res.data.hourly;
    const forecast = (hourly.time || []).slice(0, 6).map((t, i) => ({
      time: t, temp: Math.round(hourly.temperature_2m[i]),
      precipitation: hourly.precipitation[i] || 0,
      weatherCode: hourly.weather_code[i],
      description: describeCode(hourly.weather_code[i]),
    }));

    weatherResult = {
      skill: 'weather-monitor', location, coordinates: coords,
      fetchedAt: new Date().toISOString(),
      current, alerts: deriveAlerts(current), forecast, source: 'open-meteo',
    };
  } catch (err) {
    console.warn('[weather-monitor] error, using demo:', err.message);
    weatherResult = getDemoData(location);
  }

  // Build canonical intelligence event — additive, does not replace existing fields
  const intelEvent = buildWeatherIntelligenceEvent(weatherResult);
  weatherResult.intelligenceEvents = intelEvent ? [intelEvent] : [];
  weatherResult.summary = {
    alertCount: weatherResult.alerts.length,
    severity: intelEvent?.severity || 'LOW',
    threatScore: intelEvent?.threatScore || 0,
    hasActiveAlerts: weatherResult.alerts.length > 0,
  };

  return weatherResult;
}

module.exports = { fetchWeather };

if (require.main === module) {
  const args = process.argv.slice(2);
  const loc = args[args.indexOf('--location') + 1] || 'Mitrovica, Kosovo';
  fetchWeather({ location: loc }).then(r => {
    console.log(JSON.stringify({
      source: r.source,
      current: r.current,
      alertCount: r.alerts.length,
      intelligenceEvents: r.intelligenceEvents.length,
      summary: r.summary,
      firstEvent: r.intelligenceEvents[0] ? {
        title: r.intelligenceEvents[0].title,
        severity: r.intelligenceEvents[0].severity,
        threatScore: r.intelligenceEvents[0].threatScore,
        category: r.intelligenceEvents[0].category,
        confidence: r.intelligenceEvents[0].confidence,
      } : null,
    }, null, 2));
  }).catch(console.error);
}
