'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { fetchNews }          = require('../skills/news-intel/skill');
const { fetchWeather }       = require('../skills/weather-monitor/skill');
const { fetchTraffic }       = require('../skills/traffic-intel/skill');
const { fetchRadiation }     = require('../skills/radiation-monitor/skill');
const { fetchAQI }           = require('../skills/aqi-monitor/skill');
const { fetchEarthquakes }   = require('../skills/earthquake-monitor/skill');
const { fetchWildfire }      = require('../skills/wildfire-monitor/skill');
const { fetchAviation }      = require('../skills/aviation-monitor/skill');
const { fetchTelegram }      = require('../skills/telegram-monitor/skill');
const { fetchBorders }       = require('../skills/border-monitor/skill');
const { evaluate }           = require('../skills/alert-engine/skill');
const memoryBank             = require('../skills/memory-bank/skill');
const { resolveCoordinates } = require('./geocoder');

const CACHE_TTL_MS = parseInt(process.env.POLL_INTERVAL_MS || '300000', 10);

// Concurrency lock to prevent simultaneous upstream scraping floods
let inFlightPromise = null;
let inFlightKey = null;

/**
 * Multi-Domain Threat & Confidence Scoring Model (0–100)
 * Evaluates all 10 operational domains with explicit weight distribution.
 */
function computeThreatLevel(result) {
  let score = 0;
  let activeFeeds = 0;
  const totalFeeds = 10;
  const domainBreakdown = {};

  // 1. News Intelligence (Weight: 25)
  let newsContrib = 0;
  const newsItems = result.news?.items || result.news?.articles;
  if (result.news?.status !== 'UNAVAILABLE' && Array.isArray(newsItems) && newsItems.length > 0) {
    activeFeeds++;
    const maxNewsScore = result.news.summary?.maxScore || (newsItems[0]?.intensityScore || 0);
    const criticalArticles = newsItems.filter(a => a.severity === 'critical' || (a.intensityScore && a.intensityScore >= 9)).length;
    newsContrib = Math.min(25, (maxNewsScore * 2.2) + (criticalArticles * 2.0));
  }
  domainBreakdown.news = Math.round(newsContrib);
  score += newsContrib;

  // 2. Traffic & Road Corridors (Weight: 15)
  let trafficContrib = 0;
  if (result.traffic?.status !== 'UNAVAILABLE') {
    activeFeeds++;
    const trafficIncidents = result.traffic?.incidents?.length || 0;
    if (result.traffic?.anomalyDetected) trafficContrib = 15;
    else if (trafficIncidents >= 3) trafficContrib = 10;
    else if (trafficIncidents >= 1) trafficContrib = 4;
  }
  domainBreakdown.traffic = Math.round(trafficContrib);
  score += trafficContrib;

  // 3. Border Crossings & Transit Disruptions (Weight: 15)
  let borderContrib = 0;
  if (result.borders?.status === 'LIVE_DATA' && Array.isArray(result.borders.crossings)) {
    activeFeeds++;
    const crossings = result.borders.crossings;
    let maxWait = 0;
    crossings.forEach(c => {
      const entryWait = c.direction?.entry?.waitingMinutes ?? c.entryWaitMinutes ?? 0;
      const exitWait = c.direction?.exit?.waitingMinutes ?? c.exitWaitMinutes ?? 0;
      const wait = Math.max(entryWait, exitWait);
      if (wait > maxWait) maxWait = wait;
    });

    if (maxWait >= 180) borderContrib = 15; // Severe blockade (>3 hrs)
    else if (maxWait >= 90) borderContrib = 10; // Major delay (>1.5 hrs)
    else if (maxWait >= 45) borderContrib = 5;  // Moderate congestion
    else if (maxWait >= 20) borderContrib = 2;
  }
  domainBreakdown.borders = Math.round(borderContrib);
  score += borderContrib;

  // 4. Wildfires & Thermal Signatures (Weight: 15)
  let wildfireContrib = 0;
  if (result.wildfire?.status === 'LIVE_DATA' && Array.isArray(result.wildfire.detections)) {
    activeFeeds++;
    const dets = result.wildfire.detections;
    const nearbyDets = dets.filter(d => (d.distanceKm || 999) <= 50);
    const immediateDets = dets.filter(d => (d.distanceKm || 999) <= 20);

    if (immediateDets.length >= 2) wildfireContrib = 15;
    else if (immediateDets.length >= 1 || nearbyDets.length >= 5) wildfireContrib = 10;
    else if (nearbyDets.length >= 1) wildfireContrib = 5;
    else if (dets.length > 0) wildfireContrib = 2;
  }
  domainBreakdown.wildfire = Math.round(wildfireContrib);
  score += wildfireContrib;

  // 5. Aviation & Aerial Surveillance (Weight: 10)
  let aviationContrib = 0;
  if (result.aviation?.status === 'LIVE_DATA') {
    activeFeeds++;
    const milCount = result.aviation.summary?.military || 0;
    if (milCount >= 4) aviationContrib = 10;
    else if (milCount >= 2) aviationContrib = 6;
    else if (milCount >= 1) aviationContrib = 3;
  }
  domainBreakdown.aviation = Math.round(aviationContrib);
  score += aviationContrib;

  // 6. Telegram Open-Source Monitoring (Weight: 10)
  let telegramContrib = 0;
  if (result.telegram?.status === 'LIVE_DATA' && Array.isArray(result.telegram.posts)) {
    activeFeeds++;
    const urgentPosts = result.telegram.posts.filter(p => {
      const txt = (p.text || '').toLowerCase();
      return txt.includes('критично') || txt.includes('инцидент') || txt.includes('затворено') || txt.includes('полициј') ||
             txt.includes('critical') || txt.includes('incident') || txt.includes('closed') || txt.includes('police') ||
             txt.includes('blokiran') || txt.includes('napeto') || txt.includes('barikad');
    });
    if (urgentPosts.length >= 3) telegramContrib = 10;
    else if (urgentPosts.length >= 1) telegramContrib = 5;
    else if (result.telegram.posts.length > 0) telegramContrib = 1;
  }
  domainBreakdown.telegram = Math.round(telegramContrib);
  score += telegramContrib;

  // 7. Weather Alerts (Weight: 5)
  let weatherContrib = 0;
  if (result.weather?.status !== 'UNAVAILABLE') {
    activeFeeds++;
    const alertsCount = result.weather?.alerts?.length || 0;
    weatherContrib = Math.min(5, alertsCount * 2.5);
  }
  domainBreakdown.weather = Math.round(weatherContrib);
  score += weatherContrib;

  // 8. Radiological Telemetry (Weight: 5)
  let radContrib = 0;
  if (result.radiation?.status !== 'UNAVAILABLE') {
    activeFeeds++;
    const radStatus = result.radiation?.primary?.status;
    const radScores = { normal: 0, elevated: 2, high: 4, critical: 5 };
    radContrib = radScores[radStatus] || 0;
  }
  domainBreakdown.radiation = Math.round(radContrib);
  score += radContrib;

  // 9. Air Quality (Weight: 3)
  let aqiContrib = 0;
  if (result.aqi?.status === 'LIVE_DATA' && typeof result.aqi?.current?.europeanAQI === 'number') {
    activeFeeds++;
    const aqi = result.aqi.current.europeanAQI;
    if (aqi >= 80) aqiContrib = 3;
    else if (aqi >= 60) aqiContrib = 1.5;
  }
  domainBreakdown.aqi = Math.round(aqiContrib);
  score += aqiContrib;

  // 10. Seismic Activity (Weight: 2)
  let seismicContrib = 0;
  if (result.earthquakes?.status !== 'UNAVAILABLE') {
    activeFeeds++;
    const maxMag = result.earthquakes?.summary?.maxMagnitude || 0;
    if (maxMag >= 5.0) seismicContrib = 2;
    else if (maxMag >= 3.5) seismicContrib = 1;
  }
  domainBreakdown.seismic = Math.round(seismicContrib);
  score += seismicContrib;

  score = Math.min(100, Math.round(score));

  // Confidence assessment based on operational telemetry availability
  const confidenceScore = Math.round((activeFeeds / totalFeeds) * 100);
  let confidenceLevel;
  if (confidenceScore >= 80) confidenceLevel = 'HIGH';
  else if (confidenceScore >= 50) confidenceLevel = 'MEDIUM';
  else confidenceLevel = 'LOW';

  const isDegraded = confidenceScore < 50;
  const isBlackout = activeFeeds === 0;

  let level, color;
  if (isBlackout) {
    // Zero active feeds: Must NEVER report "LOW 0" or green.
    level = 'NO TELEMETRY';
    color = '#94a3b8'; // Slate Neutral
  } else if (score >= 80) {
    level = 'CRITICAL';
    color = '#f87171';
  } else if (score >= 60) {
    level = 'HIGH';
    color = '#fb923c';
  } else if (score >= 40) {
    level = 'ELEVATED';
    color = '#fbbf24';
  } else if (score >= 20) {
    level = 'GUARDED';
    color = '#38bdf8';
  } else if (isDegraded) {
    // Degraded telemetry with low score must visibly indicate degraded state
    level = 'DEGRADED';
    color = '#eab308'; // Amber Warning
  } else {
    // Healthy telemetry with low score = genuinely LOW
    level = 'LOW';
    color = '#34d399'; // Green All Clear
  }

  let confidenceNote;
  if (isBlackout) {
    confidenceNote = 'CRITICAL: Total telemetry blackout. Zero active intelligence feeds. Operational status unknown.';
  } else if (isDegraded) {
    confidenceNote = `Warning: Threat assessment based on degraded telemetry. ${totalFeeds - activeFeeds} intelligence feeds are unavailable.`;
  } else {
    confidenceNote = 'Telemetry validated across multiple active observation feeds.';
  }

  return {
    score,
    level,
    color,
    confidenceScore,
    confidenceLevel,
    isDegraded,
    isBlackout,
    activeFeeds,
    totalFeeds,
    breakdown: domainBreakdown,
    confidenceNote
  };
}

/** Run all 10 intelligence skills in parallel with deduplication and caching */
async function orchestrate({ location = 'Mitrovica, Kosovo', lat, lon, timeline = '24h', forceRefresh = false, customKeywords = [] }) {
  const cacheKey = `${location}:${timeline}`;

  // 1. Check SQLite database cache if not force refresh
  if (!forceRefresh) {
    const cached = memoryBank.getCache(CACHE_TTL_MS);
    if (cached && cached.location === location && cached.timeline === timeline) {
      return cached;
    }
  }

  // 2. Concurrency Lock: Prevent duplicate simultaneous upstream fetches
  if (inFlightPromise && inFlightKey === cacheKey) {
    return inFlightPromise;
  }

  inFlightKey = cacheKey;
  inFlightPromise = (async () => {
    try {
      // Resolve coordinates if missing or invalid
      let targetLat = lat;
      let targetLon = lon;
      if (typeof targetLat !== 'number' || typeof targetLon !== 'number' || isNaN(targetLat) || isNaN(targetLon)) {
        const coords = await resolveCoordinates(location);
        targetLat = coords.lat;
        targetLon = coords.lon;
      }

      console.log(`[orchestrator] Ingesting intelligence for: ${location} (${targetLat.toFixed(4)}, ${targetLon.toFixed(4)}) [timeline: ${timeline}]`);

      // Fetch news first to inform traffic analysis
      let newsResult = { skill: 'news-intel', items: [], articles: [] };
      try {
        newsResult = await fetchNews({ location, timeline, keywords: customKeywords });
      } catch (newsErr) {
        console.warn('[orchestrator] News intelligence error:', newsErr.message);
      }

      // Parallel execution of remaining 9 intelligence skills
      const [
        weatherRes, trafficRes, radiationRes, aqiRes,
        earthquakesRes, wildfireRes, aviationRes, telegramRes, bordersRes
      ] = await Promise.allSettled([
        fetchWeather({ location, lat: targetLat, lon: targetLon }),
        fetchTraffic({ location, lat: targetLat, lon: targetLon, news: newsResult }),
        fetchRadiation({ location, lat: targetLat, lon: targetLon }),
        fetchAQI({ location, lat: targetLat, lon: targetLon, forceRefresh }),
        fetchEarthquakes({ location, lat: targetLat, lon: targetLon }),
        fetchWildfire({ period: timeline, lat: targetLat, lon: targetLon, forceRefresh }),
        fetchAviation({ forceRefresh }),
        fetchTelegram({ forceRefresh }),
        fetchBorders({ forceRefresh })
      ]);

      const result = {
        location,
        lat: targetLat,
        lon: targetLon,
        timeline,
        fetchedAt: new Date().toISOString(),
        news:        newsResult,
        weather:     weatherRes.status     === 'fulfilled' ? weatherRes.value     : { skill: 'weather-monitor', status: 'UNAVAILABLE', error: weatherRes.reason?.message },
        traffic:     trafficRes.status     === 'fulfilled' ? trafficRes.value     : { skill: 'traffic-intel', status: 'UNAVAILABLE', error: trafficRes.reason?.message },
        radiation:   radiationRes.status   === 'fulfilled' ? radiationRes.value   : { skill: 'radiation-monitor', status: 'UNAVAILABLE', error: radiationRes.reason?.message },
        aqi:         aqiRes.status         === 'fulfilled' ? aqiRes.value         : { skill: 'aqi-monitor', status: 'UNAVAILABLE', error: aqiRes.reason?.message },
        earthquakes: earthquakesRes.status === 'fulfilled' ? earthquakesRes.value : { skill: 'earthquake-monitor', status: 'UNAVAILABLE', error: earthquakesRes.reason?.message },
        wildfire:    wildfireRes.status    === 'fulfilled' ? wildfireRes.value    : { skill: 'wildfire-monitor', status: 'UNAVAILABLE', error: wildfireRes.reason?.message },
        aviation:    aviationRes.status    === 'fulfilled' ? aviationRes.value    : { skill: 'aviation-monitor', status: 'UNAVAILABLE', error: aviationRes.reason?.message, count: 0, summary: { commercial: 0, private: 0, privateJets: 0, military: 0, unknown: 0 }, aircraft: [] },
        telegram:    telegramRes.status    === 'fulfilled' ? telegramRes.value    : { skill: 'telegram-monitor', status: 'UNAVAILABLE', error: telegramRes.reason?.message, count: 0, posts: [] },
        borders:     bordersRes.status     === 'fulfilled' ? bordersRes.value     : { skill: 'border-monitor', status: 'UNAVAILABLE', error: bordersRes.reason?.message, crossings: [] }
      };

      // Compute multi-domain composite threat & confidence levels
      result.threatLevel = computeThreatLevel(result);

      // Run rule-based Alert Engine
      const alertResult = evaluate({ location, ...result });
      result.alerts = alertResult;

      // Persist to SQLite Memory Bank
      memoryBank.setCache(result);
      memoryBank.addLocation({ name: location, lat: targetLat, lon: targetLon });
      if (alertResult && alertResult.hasNewAlerts) {
        memoryBank.addAlerts(alertResult.alerts);
      }

      return result;
    } finally {
      inFlightPromise = null;
      inFlightKey = null;
    }
  })();

  return inFlightPromise;
}

module.exports = {
  orchestrate,
  computeThreatLevel
};
