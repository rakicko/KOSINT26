'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   SENTINEL Dashboard — Frontend Application
   Map-first OSINT dashboard with Leaflet, intelligence events, and live feeds.
   ═══════════════════════════════════════════════════════════════════════════ */

// ── State ─────────────────────────────────────────────────────────────────────
const DEFAULT_LOCATION = 'Kosovo';
const DEFAULT_MAP_CENTER = { lon: 20.9, lat: 42.6 }; // Kosovo center
const DEFAULT_MAP_ZOOM = 8.8;

// Leaflet migration settings
const LEAFLET_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const LEAFLET_ATTRIBUTION = 'Tiles &copy; Esri';

/* Leaflet migration
   - The dashboard keeps the same tactical layout and module flow.
   - The map engine is switched to Leaflet to avoid token/billing requirements.
   - Markers are rendered as lightweight Leaflet layers with popup metadata.
   - The map resizes when overlays open/close or when the map visibility toggles.
*/

const state = {
  currentLocation: DEFAULT_LOCATION,
  currentTimeline: '24h',
  data: null,
  pollTimer: null,
  pollIntervalMs: 300000,
  sseSource: null,
  customKeywords: [],
  map: null,
  mapInitialized: false,
  mapVisible: true,
  activeModule: null,
  mapMarkers: [],
  mapLayers: {
    markers: true,
    heatmap: false,
    radiation: true,
    earthquakes: true,
    traffic: true,
  },
  markerCluster: null,
  heatLayer: null,
  timelineMarkers: [],
  // Notifications are suppressed until notificationsReady=true (set 4s after
  // first successful fetch) so page load/refresh never produce toast spam.
  notificationsReady: false,
  // Persisted set of seen alert IDs — prevents duplicate toasts across sessions.
  seenAlertIds: (() => {
    try { return new Set(JSON.parse(localStorage.getItem('sentinel_seen_alerts') || '[]')); }
    catch { return new Set(); }
  })(),
};

const $ = id => document.getElementById(id);

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  startClock();
  connectSSE();
  loadAlertHistory();

  // Default dashboard startup behavior: load Kosovo immediately and show the map.
  initMap();
  startMonitor();
});

// ── Clock ─────────────────────────────────────────────────────────────────────
function startClock() {
  const update = () => {
    $('clockDisplay').textContent = new Date().toLocaleString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short', hour12: false,
    });
  };
  update(); setInterval(update, 1000);
}

// ── SSE Connection ────────────────────────────────────────────────────────────
function connectSSE() {
  if (state.sseSource) state.sseSource.close();
  const es = new EventSource('/events');
  state.sseSource = es;
  es.onopen = () => setLiveStatus(true);
  es.onerror = () => { setLiveStatus(false); setTimeout(connectSSE, 5000); };
  es.onmessage = e => { try { const m = JSON.parse(e.data); if (m.type === 'alert') handleIncomingAlert(m); } catch {} };
}
function setLiveStatus(online) {
  const el = $('liveIndicator');
  el.className = `status-indicator ${online ? 'online' : 'offline'}`;
  el.querySelector('.status-text').textContent = online ? 'LIVE' : 'OFFLINE';
}

// ── Monitor ───────────────────────────────────────────────────────────────────
async function startMonitor() {
  const location = state.currentLocation || DEFAULT_LOCATION;
  const timeline = $('timelineSelect').value;

  state.currentLocation = location;
  state.currentTimeline = timeline;
  ensureMapVisible();
  showLoading(true, 'Connecting to all intelligence feeds...');
  $('monitorBtn').classList.add('loading');
  $('monitorBtn').innerHTML = '<span class="btn-icon">⏳</span> ACQUIRING...';
  clearPollTimer();

  try {
    await fetchAndRender(location, timeline, false);
    schedulePoll();
    closeModulePanel();
    // Allow toast notifications only AFTER initial load completes and
    // loadAlertHistory() has had time to seed seenAlertIds from the server.
    if (!state.notificationsReady) {
      setTimeout(() => { state.notificationsReady = true; }, 4000);
    }
  } catch (err) {
    showToast('critical', '❌', 'Fetch Failed', err.message);
  } finally {
    showLoading(false);
    $('monitorBtn').classList.remove('loading');
    $('monitorBtn').innerHTML = '<span class="btn-icon">⚡</span> REFRESH';
  }
}

async function fetchAndRender(location, timeline, forceRefresh = false) {
  const res = await fetch('/api/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location, timeline, forceRefresh, customKeywords: state.customKeywords }),
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  const data = await res.json();
  state.data = data;

  hideWelcome();
  renderThreatLevel(data.threatLevel);
  renderNews(data.news);
  renderWeather(data.weather);
  renderTraffic(data.traffic);
  renderRadiation(data.radiation);
  renderAQI(data.aqi);
  renderEarthquakes(data.earthquakes);
  updateStatsRibbon(data);
  renderTimeline(data);
  renderLiveEventFeed(data);
  updateMap(data);
  loadAlertHistory();
}

// ── Poll Timer ─────────────────────────────────────────────────────────────────
function schedulePoll() {
  clearPollTimer();
  if (!state.pollIntervalMs || !state.currentLocation) return;
  state.pollTimer = setTimeout(async () => {
    try { await fetchAndRender(state.currentLocation, state.currentTimeline, true); } catch {}
    schedulePoll();
  }, state.pollIntervalMs);
}
function clearPollTimer() { if (state.pollTimer) { clearTimeout(state.pollTimer); state.pollTimer = null; } }
function updatePollInterval() {
  state.pollIntervalMs = parseInt($('pollInterval').value, 10);
  clearPollTimer();
  if (state.currentLocation) schedulePoll();
}

// ── Threat Level ──────────────────────────────────────────────────────────────
function renderThreatLevel(tl) {
  if (!tl) return;
  const widget = $('threatWidget');
  widget.style.display = 'flex';
  $('threatFill').style.width = `${tl.score}%`;
  $('threatFill').style.background = tl.color;
  const text = $('threatText');
  text.textContent = `${tl.level}  ${tl.score}`;
  text.style.color = tl.color;
  // Flash header border color for critical
  document.querySelector('.header').style.borderBottomColor = tl.score >= 80 ? tl.color : '';
}

// ── Render: News / Intelligence Events ───────────────────────────────────────
function getNewsIntelligenceEvents(newsData) {
  if (!newsData) return [];
  if (Array.isArray(newsData.intelligenceEvents) && newsData.intelligenceEvents.length) return newsData.intelligenceEvents;
  if (Array.isArray(newsData.items)) {
    return newsData.items.map((item, index) => ({
      id: item.id || `legacy-${index}`,
      title: item.title || 'Untitled intelligence event',
      summary: item.description || item.summary || '',
      category: item.category || 'Other',
      severity: item.severity || (item.intensityScore >= 9 ? 'CRITICAL' : item.intensityScore >= 7 ? 'HIGH' : item.intensityScore >= 5 ? 'MEDIUM' : 'LOW'),
      confidence: item.confidence || Math.max(20, Math.min(95, (item.intensityScore || 5) * 10)),
      threatScore: item.threatScore || Math.max(10, (item.intensityScore || 5) * 10),
      locations: item.location ? [{
        originalName: item.location,
        normalizedName: item.location,
        municipality: item.location,
        country: 'Kosovo',
        region: 'Kosovo',
        coordinates: item.lat && item.lon ? { lat: item.lat, lon: item.lon } : null,
      }] : [],
      entities: Array.isArray(item.entities) ? item.entities : [],
      keywords: Array.isArray(item.tags) ? item.tags : (Array.isArray(item.keywords) ? item.keywords : []),
      timeline: { earliest: item.publishedAt || new Date().toISOString(), latest: item.publishedAt || new Date().toISOString() },
      sources: item.source ? [{ name: item.source, url: item.url || '#', language: 'unknown' }] : [],
      relatedArticles: item.url ? [{ title: item.title, source: item.source, url: item.url, publishedAt: item.publishedAt || new Date().toISOString() }] : [],
      createdAt: item.publishedAt || new Date().toISOString(),
      updatedAt: item.publishedAt || new Date().toISOString(),
    }));
  }
  return [];
}

function getEventLocation(event) {
  const locations = Array.isArray(event?.locations) ? event.locations : [];
  const loc = locations.find(l => l?.coordinates && Number.isFinite(l.coordinates.lat) && Number.isFinite(l.coordinates.lon)) || locations[0] || {};
  const coords = loc.coordinates || {};
  return {
    text: loc.municipality || loc.city || loc.normalizedName || loc.originalName || 'Kosovo',
    lat: Number(coords.lat),
    lon: Number(coords.lon),
  };
}

function summarizeIntelligenceCounters(events) {
  return {
    highThreat: events.filter(e => Number(e.threatScore || 0) >= 70).length,
    critical: events.filter(e => String(e.severity || 'LOW').toUpperCase() === 'CRITICAL').length,
    security: events.filter(e => String(e.category || 'Other').toLowerCase() === 'security').length,
    politics: events.filter(e => String(e.category || 'Other').toLowerCase() === 'politics').length,
    border: events.filter(e => String(e.category || 'Other').toLowerCase() === 'border activity').length,
    military: events.filter(e => String(e.category || 'Other').toLowerCase() === 'military').length,
  };
}

function focusEventOnMap(event) {
  if (!event || !state.map || !state.mapInitialized) return;
  const location = getEventLocation(event);
  if (!Number.isFinite(location.lat) || !Number.isFinite(location.lon)) return;

  const marker = state.mapMarkers.find(item => item._sentinelEventId === (event.id || event.title));
  if (marker) {
    const latlng = marker.getLatLng ? marker.getLatLng() : L.latLng(location.lat, location.lon);
    state.map.flyTo(latlng, Math.max(state.map.getZoom(), 10), { duration: 0.8 });
    setTimeout(() => marker.openPopup && marker.openPopup(), 260);
    return;
  }

  const safeSeverity = (event.severity || 'LOW').toUpperCase();
  const color = safeSeverity === 'CRITICAL' ? '#f87171' : safeSeverity === 'HIGH' ? '#fb923c' : safeSeverity === 'MEDIUM' ? '#fbbf24' : '#34d399';
  const newsMarker = L.marker([location.lat, location.lon], {
    icon: createMapMarkerElement('alert', color, 18, safeSeverity !== 'LOW'),
  });
  newsMarker.bindPopup(`<strong>📰 ${escHtml(event.category || 'News')}</strong><br>${escHtml(event.title)}<br>${escHtml(location.text)}`, { className: 'sentinel-popup' });
  newsMarker._sentinelEventId = event.id || event.title;
  newsMarker._sentinelType = 'news';
  state.mapMarkers.push(newsMarker);
  state.markerCluster.addLayer(newsMarker);
  state.timelineMarkers.push(newsMarker);
  state.map.flyTo([location.lat, location.lon], Math.max(state.map.getZoom(), 10), { duration: 0.8 });
  setTimeout(() => newsMarker.openPopup && newsMarker.openPopup(), 260);
}

// Softly highlight the map marker corresponding to an intelligence event.
function highlightMarkerForEvent(event, active) {
  if (!event || !state.map || !state.mapInitialized) return;
  const marker = state.mapMarkers.find(m => m._sentinelEventId === event.id || m._sentinelEventId === event.title);
  if (!marker) return;
  const el = marker.getElement ? marker.getElement() : null;
  if (!el) return;
  el.style.filter = active ? 'brightness(2) drop-shadow(0 0 10px cyan)' : '';
  el.style.zIndex = active ? '9999' : '';
}

// Build the full intelligence card HTML — shared between renderNews and filterNews.
function buildIntelligenceCardHTML(event, index) {
  const severity = String(event.severity || 'LOW').toUpperCase();
  const threat = Number(event.threatScore || 0);
  const confidence = Number(event.confidence || 0);
  const location = getEventLocation(event);
  const category = event.category || 'Other';
  const sourceCount = Array.isArray(event.sources) ? event.sources.length : 1;
  const articleCount = Array.isArray(event.relatedArticles) ? event.relatedArticles.length : 0;
  const keywords = (event.keywords || []).slice(0, 5)
    .map(k => `<span class="intelligence-tag">${escHtml(k)}</span>`).join('');
  const entities = (event.entities || []).slice(0, 5)
    .map(e => `<span class="intelligence-entity">${escHtml(e)}</span>`).join('');
  const sourceLines = (event.sources || []).slice(0, 3).map(source => {
    const name = source?.name || 'Source';
    const url = source?.url && isValidArticleUrl(source.url) ? source.url : '';
    return url
      ? `<a href="${escHtml(url)}" target="_blank" rel="noopener noreferrer">${escHtml(name)}</a>`
      : `<span>${escHtml(name)}</span>`;
  }).join('');
  const relatedLinks = (event.relatedArticles || []).slice(0, 4).map(article => {
    const title = article?.title || 'Related report';
    const url = article?.url && isValidArticleUrl(article.url) ? article.url : '';
    return url
      ? `<a href="${escHtml(url)}" target="_blank" rel="noopener noreferrer">${escHtml(title)}</a>`
      : `<span>${escHtml(title)}</span>`;
  }).join('');
  const locationLines = (event.locations || []).slice(0, 3).map(loc => {
    const name = [loc.municipality, loc.city, loc.normalizedName, loc.country].filter(Boolean).join(', ');
    return `<span class="intelligence-tag">${escHtml(name)}</span>`;
  }).join('');
  const time = event.timeline?.latest || event.updatedAt || event.createdAt || new Date().toISOString();
  const summary = event.summary || event.title;
  const locationText = location.text || 'Kosovo';
  const timelineNote = event.timeline?.earliest && event.timeline.earliest !== event.timeline.latest
    ? `<span class="intelligence-tag muted">${formatTimeAgo(event.timeline.earliest)} → ${formatTimeAgo(time)}</span>`
    : '';

  return `
    <article class="intelligence-card severity-${severity.toLowerCase()}" data-event-id="${escHtml(event.id || `${category}-${index}`)}" data-index="${index}">
      <div class="intelligence-card-header">
        <span class="severity-pill severity-${severity.toLowerCase()}">${severity}</span>
        <span class="threat-pill">Threat ${threat}</span>
        <span class="confidence-pill">${confidence}%</span>
      </div>
      <div class="intelligence-card-main">
        <div class="intelligence-card-title">${escHtml(event.title)}</div>
        <div class="intelligence-card-meta">
          <span>${escHtml(category)}</span>
          <span>${escHtml(locationText)}</span>
          <span>${formatTimeAgo(time)}</span>
        </div>
        <p class="intelligence-summary">${escHtml(summary)}</p>
      </div>
      <div class="intelligence-card-footer">
        <span>${sourceCount} source${sourceCount !== 1 ? 's' : ''}</span>
        <span>${articleCount} related</span>
        <span>${sourceCount > 1 ? '✓ corroborated' : ''}</span>
      </div>
      <div class="intelligence-card-detail">
        <div class="intelligence-detail-grid">
          <div><label>Entities</label><div class="intelligence-detail-tags">${entities || '<span class="intelligence-tag muted">None extracted</span>'}</div></div>
          <div><label>Keywords</label><div class="intelligence-detail-tags">${keywords || '<span class="intelligence-tag muted">None</span>'}</div></div>
          <div><label>Locations</label><div class="intelligence-detail-tags">${locationLines || '<span class="intelligence-tag muted">Kosovo</span>'}</div></div>
          <div><label>Sources</label><div class="intelligence-source-list">${sourceLines || '<span>Unavailable</span>'}</div></div>
          <div><label>Related Reports</label><div class="intelligence-source-list">${relatedLinks || '<span>None</span>'}</div></div>
          ${timelineNote ? `<div><label>Timeline</label><div class="intelligence-detail-tags">${timelineNote}</div></div>` : ''}
        </div>
      </div>
    </article>
  `;
}

// Attach interaction listeners (click = expand+map, hover = highlight marker)
function attachCardListeners(listEl, events) {
  listEl.querySelectorAll('.intelligence-card').forEach(card => {
    const index = Number(card.dataset.index);
    const event = events[index];
    if (!event) return;

    card.addEventListener('click', () => {
      card.classList.toggle('expanded');
      focusEventOnMap(event);
    });

    card.addEventListener('mouseenter', () => highlightMarkerForEvent(event, true));
    card.addEventListener('mouseleave', () => highlightMarkerForEvent(event, false));
  });
}


function renderNews(news) {
  const panel = $('newsPanel');
  panel.style.display = 'flex';
  if (!news || news.error) {
    $('newsList').innerHTML = `<div class="error-state">News unavailable: ${news?.error || ''}</div>`;
    return;
  }

  const events = getNewsIntelligenceEvents(news);
  const counters = summarizeIntelligenceCounters(events);
  $('newsBadge').textContent = counters.highThreat > 0 ? `${counters.highThreat} HIGH` : 'INTEL';
  $('newsBadge').style.display = '';
  $('newsMeta').textContent = `${counters.highThreat} high threat · ${counters.critical} critical · ${events.length} events`;

  const list = $('newsList');
  if (!events.length) {
    list.innerHTML = '<div class="empty-state">No intelligence events available</div>';
    updateTickerFromNews([]);
    return;
  }

  list.innerHTML = events.map((event, index) => buildIntelligenceCardHTML(event, index)).join('');
  attachCardListeners(list, events);

  updateTickerFromNews(events.map(event => ({
    title: event.title,
    intensityScore: Number(event.threatScore || event.confidence || 50),
    category: event.category,
    severity: event.severity,
  })));
}

function filterNews(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (!state.data?.news) return;
  const allEvents = getNewsIntelligenceEvents(state.data.news);
  const filtered = cat === 'all' ? allEvents : allEvents.filter(event =>
    String(event.category || 'Other').toLowerCase() === String(cat).toLowerCase()
  );
  const list = $('newsList');
  if (!filtered.length) {
    list.innerHTML = '<div class="empty-state">No matching intelligence events</div>';
    return;
  }
  list.innerHTML = filtered.map((event, index) => buildIntelligenceCardHTML(event, index)).join('');
  attachCardListeners(list, filtered);
}


// ── Render: Weather ───────────────────────────────────────────────────────────
function renderWeather(weather) {
  $('weatherPanel').style.display = 'flex';
  if (!weather || weather.error) { $('weatherCurrent').innerHTML = `<div class="error-state">Weather unavailable</div>`; return; }
  const c = weather.current;
  $('weatherMeta').textContent = `via ${weather.source}`;
  $('weatherCurrent').innerHTML = `
    <div class="weather-main">
      <div class="weather-temp">${c.temp}</div><div class="weather-unit">°C</div>
    </div>
    <div class="weather-desc-block">
      <div class="weather-description">${weatherIcon(c.weatherCode)} ${c.description}</div>
      <div class="weather-feels">Feels like ${c.feelsLike}°C</div>
    </div>
    <div class="weather-stats">
      <div class="weather-stat"><span class="weather-stat-label">Humidity</span><span class="weather-stat-value">${c.humidity}%</span></div>
      <div class="weather-stat"><span class="weather-stat-label">Wind</span><span class="weather-stat-value">${c.windSpeed} km/h</span></div>
      <div class="weather-stat"><span class="weather-stat-label">Precip.</span><span class="weather-stat-value">${c.precipitation}mm</span></div>
      <div class="weather-stat"><span class="weather-stat-label">Visibility</span><span class="weather-stat-value">${c.visibility}km</span></div>
    </div>`;
  $('weatherAlerts').innerHTML = (weather.alerts||[]).map(a =>
    `<div class="weather-alert-item ${a.severity}">⚠ ${escHtml(a.type.replace(/_/g,' '))} — ${escHtml(a.message)}</div>`).join('');
  $('weatherForecast').innerHTML = (weather.forecast||[]).map(f =>
    `<div class="forecast-item">
      <div class="forecast-time">${formatHour(f.time)}</div>
      <div class="forecast-icon">${weatherIcon(f.weatherCode)}</div>
      <div class="forecast-temp">${f.temp}°</div>
      ${f.precipitation>0 ? `<div class="forecast-rain">💧${f.precipitation}mm</div>` : ''}
    </div>`).join('');
}

// ── Render: Traffic ───────────────────────────────────────────────────────────
function renderTraffic(traffic) {
  $('trafficPanel').style.display = 'flex';
  if (!traffic || traffic.error) { $('incidentList').innerHTML = `<div class="error-state">Traffic unavailable</div>`; return; }
  $('trafficMeta').textContent = `via ${traffic.source}`;
  const score = traffic.congestionScore || 0;
  const scoreColor = score>=8 ? 'var(--red)' : score>=5 ? 'var(--orange)' : score>=3 ? 'var(--amber)' : 'var(--green)';
  $('trafficScoreRow').innerHTML = `<div class="congestion-label">Congestion</div><div class="congestion-bar"><div class="congestion-fill" style="width:${score*10}%;background:${scoreColor}"></div></div><div class="congestion-score" style="color:${scoreColor}">${score}/10</div>`;
  $('trafficAnomaly').style.display = traffic.anomalyDetected ? '' : 'none';
  $('trafficAnomalyBanner').style.display = traffic.anomalyDetected ? '' : 'none';
  if (traffic.anomalyDetected) $('trafficAnomalyBanner').textContent = `🚨 ${traffic.anomalySummary}`;
  $('incidentList').innerHTML = (traffic.incidents||[]).length
    ? (traffic.incidents||[]).map(inc => `<div class="incident-item ${inc.anomaly?'anomaly':''}">
        <div class="incident-severity sev-${inc.severity}"></div>
        <div class="incident-body">
          <div class="incident-type">${escHtml(inc.type.replace(/_/g,' '))} ${inc.anomaly?`<span class="incident-anomaly-tag">⚠ ${inc.anomalyType}</span>`:''}</div>
          <div class="incident-desc">${escHtml(inc.description)}</div>
          ${inc.affectedRoads?.length?`<div class="incident-road">🛣 ${inc.affectedRoads.join(', ')}</div>`:''}
          ${inc.delay>0?`<div class="incident-delay">+${inc.delay} min delay</div>`:''}
        </div></div>`).join('')
    : '<div class="empty-state">No active incidents</div>';
}

// ── Render: Radiation ─────────────────────────────────────────────────────────
function renderRadiation(rad) {
  $('radiationPanel').style.display = 'flex';
  if (!rad || rad.error) { $('radiationPrimary').innerHTML = `<div class="error-state">Radiation data unavailable</div>`; return; }
  $('radiationMeta').textContent = `via ${rad.source}`;
  $('radiationQuality').textContent = rad.dataQuality?.toUpperCase() || '';
  const p = rad.primary;
  const circumference = 2 * Math.PI * 40;
  const pct = Math.min(100, (p.usvh / 2) * 100);
  const gaugeColor = { normal:'var(--green)', elevated:'var(--amber)', high:'var(--orange)', critical:'var(--red)' }[p.status] || 'var(--cyan)';
  $('radiationPrimary').innerHTML = `
    <div class="radiation-gauge">
      <svg class="gauge-svg" viewBox="0 0 100 100">
        <circle class="gauge-track" cx="50" cy="50" r="40"/>
        <circle class="gauge-fill" cx="50" cy="50" r="40" stroke="${gaugeColor}" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference-(pct/100)*circumference}"/>
      </svg>
      <div class="gauge-center"><div class="gauge-value" style="color:${gaugeColor}">${p.usvh.toFixed(3)}</div><div class="gauge-unit">µSv/h</div></div>
    </div>
    <div class="radiation-info">
      <div class="radiation-status status-${p.status}">${p.status.toUpperCase()}</div>
      <div class="radiation-sensor">📡 ${escHtml(p.sensorName)}${p.sensorDistanceKm?` (${p.sensorDistanceKm}km away)`:''}</div>
      <div class="radiation-quality">Baseline: ${rad.baseline} µSv/h · ${rad.dataQuality?.toUpperCase()}</div>
    </div>`;
  $('radiationNeighbors').innerHTML = `<table class="neighbor-table"><thead><tr><th>Region</th><th>Dist.</th><th>µSv/h</th><th>Status</th></tr></thead><tbody>${
    (rad.neighbors||[]).map(n=>`<tr><td>${escHtml(n.name)}</td><td>${n.distanceKm}km</td><td>${n.usvh.toFixed(3)}</td><td><span class="rad-status-pill pill-${n.status}">${n.status}</span></td></tr>`).join('')
  }</tbody></table>`;
}

// ── Render: AQI (NEW) ─────────────────────────────────────────────────────────
function renderAQI(aqi) {
  const panel = $('aqiPanel');
  panel.style.display = 'flex';
  if (!aqi || aqi.error) { $('aqiMain').innerHTML = `<div class="error-state">AQI unavailable</div>`; return; }
  $('aqiMeta').textContent = `via ${aqi.source}`;

  const c = aqi.current;
  const circumference = 2 * Math.PI * 35;
  const pct = Math.min(100, c.europeanAQI);
  const dashOffset = circumference - (pct / 100) * circumference;

  $('aqiBadge').style.display = c.europeanAQI >= 60 ? '' : 'none';
  $('aqiBadge').textContent = c.label;

  const trendIcon = { improving: '↗ improving', worsening: '↘ worsening', stable: '→ stable' }[aqi.trend] || '';
  const trendCls  = `trend-${aqi.trend || 'stable'}`;

  $('aqiMain').innerHTML = `
    <div class="aqi-gauge-wrap">
      <svg class="aqi-gauge-svg" viewBox="0 0 100 100">
        <circle class="aqi-gauge-bg" cx="50" cy="50" r="35" transform="rotate(-90 50 50)"/>
        <circle class="aqi-gauge-arc" cx="50" cy="50" r="35"
          stroke="${c.color}" transform="rotate(-90 50 50)"
          stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}"/>
      </svg>
      <div class="aqi-gauge-center">
        <div class="aqi-gauge-value" style="color:${c.color}">${c.europeanAQI}</div>
        <div class="aqi-gauge-label">AQI</div>
      </div>
    </div>
    <div class="aqi-info">
      <div class="aqi-status" style="color:${c.color}">${c.icon} ${c.label}</div>
      <div class="aqi-dominant">Dominant: ${c.dominantPollutant}</div>
      <div class="aqi-trend ${trendCls}">${trendIcon}</div>
    </div>`;

  $('aqiPollutants').innerHTML = [
    { name: 'PM2.5', val: c.pm2_5, unit: 'µg/m³' },
    { name: 'PM10',  val: c.pm10,  unit: 'µg/m³' },
    { name: 'NO₂',  val: c.no2,   unit: 'µg/m³' },
    { name: 'O₃',   val: c.o3,    unit: 'µg/m³' },
  ].map(p => `<div class="pollutant-item">
    <div class="pollutant-name">${p.name}</div>
    <div class="pollutant-value">${p.val}</div>
    <div class="pollutant-unit">${p.unit}</div>
  </div>`).join('');
}

// ── Render: Earthquakes (NEW) ─────────────────────────────────────────────────
function renderEarthquakes(data) {
  const panel = $('earthquakePanel');
  panel.style.display = 'flex';
  if (!data || data.error) { $('earthquakeList').innerHTML = `<div class="error-state">Seismic data unavailable</div>`; return; }
  $('eqMeta').textContent = `Last 7 days · via ${data.source}`;

  const sig = (data.earthquakes||[]).filter(e => e.magnitude >= 3.0).length;
  $('eqBadge').style.display = sig > 0 ? '' : 'none';
  $('eqBadge').textContent = sig > 0 ? `${sig} SIGNIFICANT` : '';

  $('earthquakeList').innerHTML = (data.earthquakes||[]).length
    ? data.earthquakes.map(eq => `<div class="eq-item">
        <div class="eq-magnitude" style="color:${eq.color}">
          <div class="eq-mag-value">${eq.magnitude.toFixed(1)}</div>
          <div class="eq-mag-label">${eq.label}</div>
        </div>
        <div class="eq-body">
          <div class="eq-place">${escHtml(eq.place)}</div>
          <div class="eq-depth">Depth: ${eq.depth}km</div>
          <div class="eq-meta">${formatTimeAgo(eq.time)}</div>
        </div>
        <div class="eq-distance">${eq.distanceKm}km</div>
      </div>`).join('')
    : '<div class="empty-state">No seismic activity in range</div>';
}

// ── Interactive Map ───────────────────────────────────────────────────────────
function toggleMap() {
  state.mapVisible = !state.mapVisible;
  const mapPanel = document.querySelector('.map-panel');
  const btn = $('mapToggle');

  if (mapPanel) {
    mapPanel.style.display = state.mapVisible ? 'flex' : 'none';
  }

  if (btn) {
    btn.textContent = state.mapVisible ? 'Hide Map' : 'Show Map';
    btn.classList.toggle('active', state.mapVisible);
  }

  
  if (state.mapVisible && state.map) {
    setTimeout(() => state.map.invalidateSize(), 200);
  }
}

function showMainMap() {
  state.mapVisible = true;
  const mapPanel = document.querySelector('.map-panel');
  const btn = $('mapToggle');

  if (mapPanel) {
    mapPanel.style.display = 'flex';
  }
  if (btn) {
    btn.textContent = 'Hide Map';
    btn.classList.add('active');
  }

  closeModulePanel();

  if (!state.mapInitialized) initMap();
  else if (state.data) updateMap(state.data);

  if (state.map) {
    setTimeout(() => state.map.invalidateSize(), 200);
  }
}

function ensureMapVisible() {
  if (!state.mapVisible) {
    state.mapVisible = true;
    const mapPanel = document.querySelector('.map-panel');
    const btn = $('mapToggle');

    if (mapPanel) {
      mapPanel.style.display = 'flex';
    }
    if (btn) {
      btn.textContent = 'Hide Map';
      btn.classList.add('active');
    }
  }

  if (!state.mapInitialized) initMap();
  else if (state.data) updateMap(state.data);

  if (state.map) {
    setTimeout(() => state.map.invalidateSize(), 200);
  }
}

function toggleModule(panelId) {
  const overlay = $('moduleOverlay');
  const panel = $(panelId);
  if (!overlay || !panel) return;

  ensureMapVisible();

  if (state.activeModule === panelId) {
    closeModulePanel();
    return;
  }

  overlay.querySelectorAll('.overlay-panel').forEach(p => { p.style.display = 'none'; });
  panel.style.display = 'flex';
  overlay.classList.add('active');
  $('overlayTitle').textContent = panel.dataset.panelTitle || 'Module';
  overlay.setAttribute('aria-hidden', 'false');
  document.querySelectorAll('.module-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.panel === panelId));
  state.activeModule = panelId;

  if (!state.mapInitialized) initMap();
  else if (state.data) updateMap(state.data);

  setTimeout(() => { if (state.map) state.map.invalidateSize(); }, 180);
}

function closeModulePanel() {
  const overlay = $('moduleOverlay');
  if (!overlay) return;

  overlay.classList.remove('active');
  overlay.querySelectorAll('.overlay-panel').forEach(panel => {
    panel.style.display = 'none';
  });
  overlay.setAttribute('aria-hidden', 'true');
  state.activeModule = null;
  document.querySelectorAll('.module-btn').forEach(btn => btn.classList.remove('active'));

  setTimeout(() => { if (state.map) state.map.invalidateSize(); }, 200);
}

function createMapMarkerElement(type, color, size = 16, pulse = false) {
  const pulseClass = pulse ? ' sentinel-marker--pulse' : '';
  const markerSize = size + 12;
  const icons = {
    monitor: '<path d="M32 6c-9.4 0-17 7.6-17 17 0 12.8 13.7 25.2 16 27.6 2.3-2.4 16-14.8 16-27.6 0-9.4-7.6-17-15-17zm0 24.5A7.5 7.5 0 1 1 32 15a7.5 7.5 0 0 1 0 15.5z" />',
    traffic: '<path d="M20 12h24l6 22v10a4 4 0 0 1-4 4h-3a4 4 0 0 1-8 0h-8a4 4 0 0 1-8 0h-3a4 4 0 0 1-4-4V34l6-22zm7 10h18l-2 12H29l-2-12zm2 18h14v4H29v-4zm-4 0h4v4h-4v-4zm18 0h4v4h-4v-4z" />',
    radiation: '<circle cx="32" cy="32" r="18" /><path d="M32 10v11M32 54v-9M10 32h11M43 32h11M18 18l8 8M38 38l8 8M46 18l-8 8M26 38l-8 8" />',
    earthquake: '<path d="M14 40l12-18 8 10 8-16 12 24H14z" />',
    alert: '<path d="M32 10l20 36H12L32 10zm0 12v12m0 9h.01" />',
  };

  return L.divIcon({
    className: `sentinel-map-icon sentinel-map-icon--${type}`,
    html: `
      <span class="sentinel-marker sentinel-marker--${type}${pulseClass}" style="--marker-color:${color}; --marker-size:${size}px;">
        <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
          ${icons[type] || icons.alert}
        </svg>
      </span>
    `,
    iconSize: [markerSize, markerSize],
    iconAnchor: [markerSize / 2, markerSize / 2],
    popupAnchor: [0, -(markerSize / 2)],
  });
}

function initMap() {
  if (state.mapInitialized) return;
  state.mapInitialized = true;

  const mapContainer = document.getElementById('leafletMap');
  if (!mapContainer) return;

  state.map = L.map('leafletMap', {
    zoomControl: true,
    attributionControl: true,
    preferCanvas: true,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
  }).setView([DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lon], DEFAULT_MAP_ZOOM);

  L.tileLayer(LEAFLET_TILE_URL, {
    maxZoom: 19,
    attribution: LEAFLET_ATTRIBUTION,
    noWrap: false,
  }).addTo(state.map);

  state.markerCluster = L.markerClusterGroup({
    chunkedLoading: true,
    disableClusteringAtZoom: 11,
    maxClusterRadius: 55,
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
  });
  state.map.addLayer(state.markerCluster);

  state.heatLayer = L.heatLayer([], {
    radius: 22,
    blur: 18,
    maxZoom: 17,
    minOpacity: 0.35,
  });

  state.map.whenReady(() => {
    if (state.data) updateMap(state.data);
    setTimeout(() => { if (state.map) state.map.invalidateSize(); }, 200);
  });

  setTimeout(() => { if (state.map) state.map.invalidateSize(); }, 250);
}

function updateMap(data) {
  if (!state.mapInitialized || !state.map || !data) return;

  if (state.markerCluster) {
    state.markerCluster.clearLayers();
  }
  state.mapMarkers = [];
  state.timelineMarkers = [];

  if (state.heatLayer) {
    state.map.removeLayer(state.heatLayer);
    state.heatLayer = L.heatLayer([], {
      radius: 22,
      blur: 18,
      maxZoom: 17,
      minOpacity: 0.35,
    });
  }

  const coords = data.weather?.coordinates || DEFAULT_MAP_CENTER;
  const centerLatLng = [coords.lat, coords.lon];

  const centerMarker = L.marker(centerLatLng, {
    icon: createMapMarkerElement('monitor', '#38bdf8', 20),
  });
  centerMarker.bindPopup(`<strong>📍 ${escHtml(data.location)}</strong><br>Monitoring center`, {
    className: 'sentinel-popup',
    offset: [0, -12],
  });
  state.mapMarkers.push(centerMarker);
  state.markerCluster.addLayer(centerMarker);

  const shouldShowKosovoView = state.currentLocation.toLowerCase().includes('kosovo') || (data.location && data.location.toLowerCase().includes('kosovo'));
  if (shouldShowKosovoView) {
    state.map.fitBounds(L.latLngBounds([[41.8, 19.9], [43.3, 21.8]]), { padding: [35, 35] });
  } else {
    state.map.flyTo(centerLatLng, 11.2, { duration: 0.8 });
  }

  const heatPoints = [];

  if (state.mapLayers.traffic) {
    (data.traffic?.incidents || []).forEach((inc, index) => {
      if (!inc.location?.lat || !inc.location?.lon) return;
      const color = inc.anomaly ? '#fb923c' : '#fbbf24';
      const marker = L.marker([inc.location.lat, inc.location.lon], {
        icon: createMapMarkerElement('traffic', color, inc.anomaly ? 16 : 14, inc.anomaly),
      });
      marker.bindPopup(`<strong>🚦 ${escHtml(inc.type.replace(/_/g, ' '))}</strong><br>${escHtml(inc.description)}${inc.delay > 0 ? `<br>+${inc.delay} min delay` : ''}`, {
        className: 'sentinel-popup',
        offset: [0, -10],
      });
      marker._sentinelId = `traffic-${index}`;
      marker._sentinelType = 'traffic';
      state.mapMarkers.push(marker);
      state.markerCluster.addLayer(marker);
      state.timelineMarkers.push(marker);
      heatPoints.push([inc.location.lat, inc.location.lon, inc.anomaly ? 0.9 : 0.6]);
    });
  }

  if (state.mapLayers.earthquakes) {
    (data.earthquakes?.earthquakes || []).filter(eq => eq.magnitude >= 2.5).forEach((eq, index) => {
      if (!eq.lat || !eq.lon) return;
      const magnitudeSize = Math.max(14, eq.magnitude * 4);
      const marker = L.marker([eq.lat, eq.lon], {
        icon: createMapMarkerElement('earthquake', eq.color || '#f87171', magnitudeSize, eq.magnitude >= 5),
      });
      marker.bindPopup(`<strong>🌊 M${eq.magnitude.toFixed(1)} ${escHtml(eq.label)}</strong><br>${escHtml(eq.place)}<br>Depth: ${eq.depth}km · ${formatTimeAgo(eq.time)}`, {
        className: 'sentinel-popup',
        offset: [0, -12],
      });
      marker._sentinelId = `quake-${index}`;
      marker._sentinelType = 'earthquake';
      state.mapMarkers.push(marker);
      state.markerCluster.addLayer(marker);
      state.timelineMarkers.push(marker);
      heatPoints.push([eq.lat, eq.lon, 0.95]);
    });
  }

  if (state.mapLayers.radiation) {
    (data.radiation?.neighbors || []).forEach((n, index) => {
      if (!n.lat || !n.lon) return;
      const color = { normal: '#34d399', elevated: '#fbbf24', high: '#fb923c', critical: '#f87171' }[n.status] || '#94a3b8';
      const marker = L.marker([n.lat, n.lon], {
        icon: createMapMarkerElement('radiation', color, 14),
      });
      marker.bindPopup(`<strong>☢️ ${escHtml(n.name)}</strong><br>Radiation: ${n.usvh} µSv/h<br>Status: ${escHtml(n.status)}`, {
        className: 'sentinel-popup',
        offset: [0, -10],
      });
      marker._sentinelId = `radiation-${index}`;
      marker._sentinelType = 'radiation';
      state.mapMarkers.push(marker);
      state.markerCluster.addLayer(marker);
      state.timelineMarkers.push(marker);
      heatPoints.push([n.lat, n.lon, 0.7]);
    });
  }

  if (state.mapLayers.markers) {
    const newsEvents = getNewsIntelligenceEvents(data.news || {});
    newsEvents.forEach((event, index) => {
      const location = getEventLocation(event);
      if (!Number.isFinite(location.lat) || !Number.isFinite(location.lon)) return;
      const safeSeverity = String(event.severity || 'LOW').toUpperCase();
      const color = safeSeverity === 'CRITICAL' ? '#f87171' : safeSeverity === 'HIGH' ? '#fb923c' : safeSeverity === 'MEDIUM' ? '#fbbf24' : '#34d399';
      const marker = L.marker([location.lat, location.lon], {
        icon: createMapMarkerElement('alert', color, 18, safeSeverity !== 'LOW'),
      });
      marker.bindPopup(`<strong>📰 ${escHtml(event.category || 'Intelligence')}</strong><br>${escHtml(event.title)}<br>${escHtml(location.text || 'Kosovo')}`, {
        className: 'sentinel-popup',
        offset: [0, -12],
      });
      // Use _sentinelEventId (same key used by focusEventOnMap / highlightMarkerForEvent)
      marker._sentinelEventId = event.id || event.title;
      marker._sentinelId = event.id || `news-${index}`;
      marker._sentinelType = 'news';
      marker._sentinelEvent = event;
      state.mapMarkers.push(marker);
      state.markerCluster.addLayer(marker);
      state.timelineMarkers.push(marker);
      heatPoints.push([location.lat, location.lon, 0.8]);
    });
  }

  if (state.mapLayers.heatmap && heatPoints.length) {
    state.heatLayer = L.heatLayer(heatPoints, {
      radius: 22,
      blur: 18,
      maxZoom: 17,
      minOpacity: 0.35,
    });
    state.heatLayer.addTo(state.map);
  }

  $('mapBadge').style.display = state.mapMarkers.length > 1 ? '' : 'none';
  $('mapBadge').textContent = `${state.mapMarkers.length - 1} pins`;
  $('mapMeta').textContent = `${state.mapMarkers.length - 1} incident markers · scroll to zoom`;

  setTimeout(() => { if (state.map) state.map.invalidateSize(); }, 100);
}

function toggleMapLayer(layerName) {
  if (!state.mapLayers || !(layerName in state.mapLayers)) return;
  state.mapLayers[layerName] = !state.mapLayers[layerName];
  const btn = document.querySelector(`[data-map-layer="${layerName}"]`);
  if (btn) btn.classList.toggle('active', state.mapLayers[layerName]);
  if (state.data) updateMap(state.data);
}

function updateStatsRibbon(_data) {
  // Stats ribbon elements were removed from the HTML in Phase 3B.
  // This function is retained as a no-op so the fetchAndRender call chain
  // does not need to change. Remove once a replacement stats surface is added.
}

function getTimelineBucketLabel(timestamp) {
  if (!timestamp) return 'NOW';
  const diffMinutes = (Date.now() - new Date(timestamp).getTime()) / 60000;
  if (diffMinutes < 10) return 'NOW';
  if (diffMinutes < 60) return '10 MIN AGO';
  if (diffMinutes < 180) return '1 HOUR AGO';
  if (diffMinutes < 720) return '6 HOURS AGO';
  return 'EARLIER';
}

function renderTimeline(data) {
  const items = [];

  (data.traffic?.incidents || []).forEach((inc, index) => {
    items.push({ id: `traffic-${index}`, icon: '🚦', category: 'Traffic', severity: inc.anomaly ? 'HIGH' : 'MEDIUM', time: inc.timestamp || new Date().toISOString(), label: inc.type.replace(/_/g, ' '), source: 'Traffic feed', lat: inc.location?.lat, lon: inc.location?.lon });
  });

  (data.earthquakes?.earthquakes || []).slice(0, 5).forEach((eq, index) => {
    items.push({ id: `quake-${index}`, icon: '🌊', category: 'Seismic', severity: eq.magnitude >= 5 ? 'CRITICAL' : eq.magnitude >= 3 ? 'HIGH' : 'MEDIUM', time: eq.time, label: `M${eq.magnitude.toFixed(1)} ${eq.label}`, source: 'Seismic registry', lat: eq.lat, lon: eq.lon });
  });

  (data.radiation?.neighbors || []).slice(0, 4).forEach((n, index) => {
    items.push({ id: `radiation-${index}`, icon: '☢️', category: 'Radiation', severity: n.status === 'critical' ? 'CRITICAL' : n.status === 'high' ? 'HIGH' : 'MEDIUM', time: new Date().toISOString(), label: `${n.name} · ${n.status}`, source: 'Radiation network', lat: n.lat, lon: n.lon });
  });

  (data.weather?.alerts || []).slice(0, 3).forEach((a, index) => {
    items.push({ id: `weather-${index}`, icon: '⚠', category: 'Weather', severity: (a.severity || 'MEDIUM').toUpperCase(), time: new Date().toISOString(), label: a.type.replace(/_/g, ' '), source: 'Weather alert' });
  });

  const newsItems = getNewsIntelligenceEvents(data.news || {});
  newsItems.forEach((event, index) => {
    const location = getEventLocation(event);
    items.push({
      id: event.id || `news-${index}`,
      icon: '📰',
      category: event.category || 'News',
      severity: String(event.severity || 'LOW').toUpperCase(),
      time: event.timeline?.latest || event.updatedAt || event.createdAt || new Date().toISOString(),
      label: event.title,
      source: (event.sources || [{}])[0]?.name || 'Intelligence feed',
      lat: location.lat,
      lon: location.lon,
    });
  });

  items.sort((a, b) => new Date(b.time || Date.now()) - new Date(a.time || Date.now()));
  const grouped = {};
  items.forEach(item => {
    const key = getTimelineBucketLabel(item.time);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  const timeline = $('timelineList');
  const groupOrder = ['NOW', '10 MIN AGO', '1 HOUR AGO', '6 HOURS AGO', 'EARLIER'];
  const finalGroups = groupOrder.filter(key => grouped[key] && grouped[key].length);

  if (!finalGroups.length) {
    timeline.innerHTML = '<div class="empty-state">No timeline events</div>';
    return;
  }

  timeline.innerHTML = finalGroups.map(groupKey => `
    <div class="timeline-group">
      <div class="timeline-group-label">${groupKey}</div>
      ${grouped[groupKey].slice(0, 4).map(item => `
        <button class="timeline-item severity-${String(item.severity).toLowerCase()}" type="button" data-target-id="${item.id}">
          <span class="timeline-icon">${item.icon}</span>
          <span class="timeline-copy">
            <span class="timeline-topline">
              <span class="timeline-category">${escHtml(item.category)}</span>
              <span class="timeline-time">${formatTimeAgo(item.time)}</span>
            </span>
            <span class="timeline-title">${escHtml(item.label)}</span>
            <span class="timeline-source">${escHtml(item.source)}</span>
          </span>
        </button>
      `).join('')}
    </div>
  `).join('');

  timeline.querySelectorAll('[data-target-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = state.timelineMarkers.find(marker => marker._sentinelId === btn.dataset.targetId);
      if (!target) return;
      const latlng = target.getLatLng ? target.getLatLng() : L.latLng(target._sentinelLat, target._sentinelLon);
      if (latlng && Number.isFinite(latlng.lat) && Number.isFinite(latlng.lng)) {
        state.map.flyTo(latlng, Math.max(state.map.getZoom(), 10), { duration: 0.8 });
        setTimeout(() => target.openPopup && target.openPopup(), 250);
      }
    });
  });
}

function renderLiveEventFeed(data) {
  const feed = $('liveEventFeed');
  const events = [];

  (data.traffic?.incidents || []).forEach((inc, index) => {
    events.push({ id: `traffic-${index}`, type: 'traffic', icon: '🚦', title: inc.type.replace(/_/g, ' '), message: inc.description, time: inc.timestamp || new Date().toISOString(), severity: inc.anomaly ? 'high' : 'medium' });
  });
  (data.earthquakes?.earthquakes || []).slice(0, 3).forEach((eq, index) => {
    events.push({ id: `quake-${index}`, type: 'earthquake', icon: '🌊', title: `M${eq.magnitude.toFixed(1)} ${eq.label}`, message: eq.place, time: eq.time, severity: eq.magnitude >= 5 ? 'critical' : 'high' });
  });
  (data.radiation?.neighbors || []).slice(0, 3).forEach((n, index) => {
    events.push({ id: `radiation-${index}`, type: 'radiation', icon: '☢️', title: `${n.name}`, message: `${n.status.toUpperCase()} · ${n.usvh} µSv/h`, time: new Date().toISOString(), severity: n.status === 'critical' ? 'critical' : n.status === 'high' ? 'high' : 'medium' });
  });
  (data.weather?.alerts || []).slice(0, 3).forEach((a, index) => {
    events.push({ id: `weather-${index}`, type: 'weather', icon: '⚠', title: a.type.replace(/_/g, ' '), message: a.message, time: new Date().toISOString(), severity: a.severity || 'medium' });
  });

  const newsEvents = getNewsIntelligenceEvents(data.news || {});
  newsEvents.slice(0, 3).forEach((event, index) => {
    const location = getEventLocation(event);
    events.push({
      id: event.id || `news-${index}`,
      type: 'news',
      icon: '📰',
      title: event.title,
      message: location.text || 'Kosovo',
      time: event.timeline?.latest || event.updatedAt || event.createdAt || new Date().toISOString(),
      severity: String(event.severity || 'LOW').toLowerCase(),
    });
  });

  events.sort((a, b) => new Date(b.time || Date.now()) - new Date(a.time || Date.now()));
  const selected = events.slice(0, 6);
  if (!selected.length) {
    feed.innerHTML = '<div class="empty-state">No live events</div>';
    return;
  }

  feed.innerHTML = selected.map(event => `
    <div class="feed-item severity-${event.severity}">
      <div class="feed-item-icon">${event.icon}</div>
      <div class="feed-item-copy">
        <div class="feed-item-title">${escHtml(event.title)}</div>
        <div class="feed-item-message">${escHtml(event.message)}</div>
      </div>
      <div class="feed-item-meta">${formatTimeAgo(event.time)}</div>
    </div>
  `).join('');
}

// ── Alert Ticker ──────────────────────────────────────────────────────────────
// updateTickerFromNews now accepts either legacy items (intensityScore) or
// intelligence event objects (threatScore / confidence) — both shapes are handled.
function updateTickerFromNews(items) {
  if (!items || !items.length) return;
  const high = items.filter(i => {
    const score = i.intensityScore || (i.threatScore ? i.threatScore / 10 : 0);
    return score >= 5;
  });
  if (!high.length) return;
  const container = document.createElement('div');
  container.className = 'ticker-items-container';
  [...high, ...high].forEach(item => {
    const score = item.intensityScore || (item.threatScore ? Math.round(item.threatScore / 10) : 5);
    const severity = item.severity
      ? String(item.severity).toLowerCase()
      : (score >= 9 ? 'critical' : score >= 7 ? 'high' : 'medium');
    const div = document.createElement('div');
    div.className = `ticker-item ${severity}`;
    div.textContent = `[${item.category || 'INTEL'}] ${item.title}`;
    container.appendChild(div);
  });
  const track = $('alertTicker');
  track.innerHTML = '';
  track.appendChild(container);
}

// ── Custom Keywords (state only — UI removed) ─────────────────────────────────
// Keywords are still passed to the backend fetch; the UI for managing them was
// removed. customKeywords persists in localStorage and can be set programmatically.
function loadCustomKeywords() {
  try { state.customKeywords = JSON.parse(localStorage.getItem('sentinel_keywords') || '[]'); } catch { state.customKeywords = []; }
}

// ── Export Report ─────────────────────────────────────────────────────────────
function exportReport() {
  if (!state.data) { showToast('medium', '⚠️', 'No Data', 'MONITOR a location first to generate a report.'); return; }

  const d = state.data;
  const tl = d.threatLevel || {};
  const lines = [
    `SENTINEL SITUATION REPORT`,
    `═══════════════════════════════════`,
    `Location  : ${d.location}`,
    `Timeline  : ${d.timeline}`,
    `Generated : ${new Date(d.fetchedAt).toLocaleString()}`,
    `Threat    : ${tl.level} (${tl.score}/100)`,
    ``,
    `── NEWS INTELLIGENCE ──────────────`,
    ...getNewsIntelligenceEvents(d.news || {}).map(e =>
      `[${e.severity}|T${e.threatScore}|${e.confidence}%] ${e.category}: ${e.title}`
    ),
    ``,
    `── WEATHER ────────────────────────`,
    d.weather?.current ? `Temp: ${d.weather.current.temp}°C, Wind: ${d.weather.current.windSpeed}km/h, ${d.weather.current.description}` : 'N/A',
    ...(d.weather?.alerts || []).map(a => `  ⚠ ${a.type}: ${a.message}`),
    ``,
    `── TRAFFIC ────────────────────────`,
    `Congestion Score: ${d.traffic?.congestionScore || 0}/10`,
    d.traffic?.anomalyDetected ? `  ⚠ ANOMALY: ${d.traffic.anomalySummary}` : '  No anomalies',
    ...(d.traffic?.incidents || []).map(i => `  • ${i.type}: ${i.description}`),
    ``,
    `── RADIATION ──────────────────────`,
    `Primary: ${d.radiation?.primary?.usvh?.toFixed(3) || '?'} µSv/h (${d.radiation?.primary?.status || '?'})`,
    ...(d.radiation?.neighbors || []).map(n => `  ${n.name}: ${n.usvh?.toFixed(3)} µSv/h (${n.status})`),
    ``,
    `── AIR QUALITY ────────────────────`,
    d.aqi?.current ? `AQI: ${d.aqi.current.europeanAQI} — ${d.aqi.current.label} (${d.aqi.trend || 'stable'})` : 'N/A',
    ``,
    `── SEISMIC ACTIVITY ───────────────`,
    ...(d.earthquakes?.earthquakes || []).map(e => `M${e.magnitude.toFixed(1)} ${e.label} — ${e.place} (${e.distanceKm}km away)`),
    ``,
    `── ALERTS ─────────────────────────`,
    ...(d.alerts?.alerts || []).map(a => `[${a.severity.toUpperCase()}] ${a.title}: ${a.message}`),
    ``,
    `Source: SENTINEL Dashboard | https://localhost:3000`,
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sentinel-report-${d.location.replace(/[^a-z0-9]/gi,'_')}-${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('low', '📤', 'Report Exported', `Situation report downloaded for ${d.location}.`);
}

// ── Alert History & Locations ─────────────────────────────────────────────────
async function loadAlertHistory() {
  try {
    const { alerts, unreadCount } = await fetch('/api/alerts').then(r => r.json());
    // Seed seen IDs silently — existing alerts must never produce toasts
    alerts.forEach(a => {
      const id = a.id || `${a.title}:${a.timestamp}`;
      state.seenAlertIds.add(id);
    });
    const badge = $('unreadBadge');
    if (unreadCount > 0) { badge.textContent = unreadCount; badge.style.display = ''; }
    else badge.style.display = 'none';
    const log = $('alertLog');
    if (!alerts.length) { log.innerHTML = '<div class="empty-state">No alerts yet</div>'; return; }
    log.innerHTML = alerts.slice(0,20).map(a => {
      const url = isValidArticleUrl(a.url) ? a.url.trim() : '';
      const item = `<div class="alert-log-item severity-${a.severity} ${!a.read?'unread':''}" title="${escHtml(a.message||'')}">
        <div class="alert-log-title">${escHtml(a.title)}</div>
        <div class="alert-log-time">${formatTimeAgo(a.timestamp)}</div>
      </div>`;
      return url ? `<a class="alert-log-link" href="${escHtml(url)}" target="_blank" rel="noopener noreferrer">${item}</a>` : item;
    }).join('');
  } catch {}
}
async function markAllRead() {
  await fetch('/api/alerts/read', { method: 'POST' }).catch(() => {});
  loadAlertHistory();
}

function selectLocation(name) { state.currentLocation = name; startMonitor(); }

// ── SSE Alert Handler ─────────────────────────────────────────────────────────
// Toasts are only shown after notificationsReady is set (post initial load)
// and only for alert IDs that have not been shown before (deduplication).
function handleIncomingAlert(alert) {
  if (!state.notificationsReady) return;
  const id = alert.id || `${alert.title}:${alert.timestamp}`;
  if (state.seenAlertIds.has(id)) return;
  state.seenAlertIds.add(id);
  // Persist last 500 IDs so duplicates survive page refreshes
  try {
    const arr = [...state.seenAlertIds].slice(-500);
    localStorage.setItem('sentinel_seen_alerts', JSON.stringify(arr));
  } catch {}
  const sevIcon = { critical: '🚨', high: '⚠️', medium: '⚡', low: 'ℹ️' }[alert.severity] || '🔔';
  showToast(alert.severity, sevIcon, alert.title, alert.message);
  loadAlertHistory();
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(severity, icon, title, message, ms=6000) {
  const id = `toast-${Date.now()}`;
  const toast = document.createElement('div');
  toast.className = `toast ${severity}`; toast.id = id;
  toast.innerHTML = `<div class="toast-icon">${icon}</div><div class="toast-body"><div class="toast-title">${escHtml(title)}</div><div class="toast-msg">${escHtml(message)}</div></div><button class="toast-close" onclick="dismissToast('${id}')">✕</button>`;
  $('toastContainer').appendChild(toast);
  setTimeout(() => dismissToast(id), ms);
}
function dismissToast(id) {
  const el = document.getElementById(id);
  if (el) { el.style.animation = 'slide-in 0.2s ease reverse'; setTimeout(() => el.remove(), 200); }
}

// ── Loading / Welcome ─────────────────────────────────────────────────────────
function showLoading(show, sub = '') { $('loadingOverlay').style.display = show ? 'flex' : 'none'; if (sub) $('loadingSub').textContent = sub; }
function hideWelcome() {
  const panel = $('welcomePanel');
  if (panel) panel.style.display = 'none';
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function escHtml(str) { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function isValidArticleUrl(url) {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === '#' || trimmed.startsWith('#')) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
function formatTimeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff/60000);
  if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`;
  const h = Math.floor(m/60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}
function formatHour(iso) { try { return new Date(iso).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:false }); } catch { return iso; } }
function weatherIcon(code) {
  if (code===0) return '☀️'; if (code<=3) return '⛅'; if (code<=48) return '🌫️';
  if (code<=67) return '🌧️'; if (code<=77) return '🌨️'; if (code<=82) return '🌦️'; if (code<=99) return '⛈️'; return '🌤️';
}
