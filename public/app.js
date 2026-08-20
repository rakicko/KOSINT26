import * as maplibregl from './vendor/maplibre-gl.mjs';

'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   SENTINEL Dashboard — Frontend Application v2
   MapLibre GL JS implementation with OSM basemap
   ═══════════════════════════════════════════════════════════════════════════ */

const DEFAULT_LOCATION = 'Kosovo';
const DEFAULT_MAP_CENTER = { lon: 20.9, lat: 42.6 };
const DEFAULT_MAP_ZOOM = 8.5;
const DEFAULT_KOSOVO_BOUNDS = [[19.9, 41.8], [21.8, 43.3]];

const CCTV_CAMERAS = [
  {
    id: 'cctv-prishtine-bus-station',
    name: 'SlowTV - Stacioni i autobusëve, Prishtinë',
    location: 'Prishtinë - Bus Station',
    city: 'Prishtinë',
    lat: 42.6515,
    lon: 21.1490,
    provider: 'GjirafaVideo',
    pageUrl: 'https://video.gjirafa.com/slow-tv-stacioni-i-autobuseve-prishtine',
    status: 'live'
  },
  {
    id: 'cctv-veternik',
    name: 'SlowTV - Veternik',
    location: 'Veternik',
    city: 'Prishtinë',
    lat: 42.6340,
    lon: 21.1660,
    provider: 'GjirafaVideo',
    pageUrl: 'https://video.gjirafa.com/slow-tv-veternik',
    status: 'live'
  },
  {
    id: 'cctv-veternik-2',
    name: 'SlowTV - Veternik 2',
    location: 'Veternik 2',
    city: 'Prishtinë',
    lat: 42.6280,
    lon: 21.1620,
    provider: 'GjirafaVideo',
    pageUrl: 'https://video.gjirafa.com/slow-tv-veternik-2',
    status: 'live'
  },
  {
    id: 'cctv-ulpiane',
    name: 'SlowTV - Ulpianë, Prishtinë',
    location: 'Ulpianë',
    city: 'Prishtinë',
    lat: 42.6540,
    lon: 21.1600,
    provider: 'GjirafaVideo',
    pageUrl: 'https://video.gjirafa.com/slow-tv-ulpiane',
    status: 'live'
  },
  {
    id: 'cctv-gjilani',
    name: 'SlowTV - Gjilani',
    location: 'Gjilani',
    city: 'Gjilani',
    lat: 42.4635,
    lon: 21.4694,
    provider: 'GjirafaVideo',
    pageUrl: 'https://video.gjirafa.com/slow-tv-gjilani',
    status: 'live'
  },
  {
    id: 'cctv-gavran-gjilan',
    name: 'SlowTV - Gavran, Gjilan',
    location: 'Gavran near Gjilani',
    city: 'Gjilani',
    lat: 42.4520,
    lon: 21.4580,
    provider: 'GjirafaVideo',
    pageUrl: 'https://video.gjirafa.com/slow-tv-gavran-gjilan',
    status: 'live'
  },
  {
    id: 'cctv-prizren-ambient',
    name: 'SlowTV - Qendra e Prizrenit',
    location: 'Prizren City Center',
    city: 'Prizren',
    lat: 42.2139,
    lon: 20.7397,
    provider: 'GjirafaVideo',
    pageUrl: 'https://video.gjirafa.com/slow-tv-prizren-ambienti',
    status: 'live'
  },
  {
    id: 'cctv-bazhderhane-prizren',
    name: 'SlowTV - Bazhderhane, Prizren',
    location: 'Bazhderhane, Prizren',
    city: 'Prizren',
    lat: 42.2220,
    lon: 20.7320,
    provider: 'GjirafaVideo',
    pageUrl: 'https://video.gjirafa.com/slow-tv-bazhderhane-prizren',
    status: 'live'
  },
  {
    id: 'cctv-ortakoll-prizren',
    name: 'SlowTV - Ortakoll: Wesley Clark, Prizren',
    location: 'Ortakoll, Prizren',
    city: 'Prizren',
    lat: 42.2140,
    lon: 20.7260,
    provider: 'GjirafaVideo',
    pageUrl: 'https://video.gjirafa.com/slow-tv-ortakoll-prizren',
    status: 'live'
  },
  {
    id: 'cctv-bregu-i-diellit-2',
    name: 'SlowTV - Bregu i Diellit 2',
    location: 'Bregu i Diellit',
    city: 'Kosovo',
    lat: 42.6535,
    lon: 21.1810,
    provider: 'GjirafaVideo',
    pageUrl: 'https://video.gjirafa.com/slow-tv-bregu-i-diellit-2',
    status: 'live'
  },
  {
    id: 'cctv-vushtrri',
    name: 'SlowTV - Magjistralja Vushtrri-Mitrovice',
    location: 'Vushtrri-Kukës Highway',
    city: 'Vushtrri',
    lat: 42.8250,
    lon: 20.9660,
    provider: 'GjirafaVideo',
    pageUrl: 'https://video.gjirafa.com/slow-tv-vushtrri-2',
    status: 'live'
  },
  {
    id: 'cctv-brezovica',
    name: 'SlowTV - Brezovicë',
    location: 'Brezovica',
    city: 'Prizren',
    lat: 42.2180,
    lon: 20.9980,
    provider: 'GjirafaVideo',
    pageUrl: 'https://video.gjirafa.com/slowtv-brezovica',
    status: 'live'
  },
  {
    id: 'cctv-brezovica-2',
    name: 'SlowTV - Brezovica 2',
    location: 'Brezovica 2',
    city: 'Prizren',
    lat: 42.1830,
    lon: 20.9880,
    provider: 'GjirafaVideo',
    pageUrl: 'https://video.gjirafa.com/slowtv-brezovica2',
    status: 'live'
  },
  {
    id: 'cctv-decan',
    name: 'SlowTV - Deçan',
    location: 'Deçan',
    city: 'Deçan',
    lat: 42.5410,
    lon: 20.2880,
    provider: 'GjirafaVideo',
    pageUrl: 'https://video.gjirafa.com/slow-tv-decan',
    status: 'live'
  },
  {
    id: 'cctv-gjakove',
    name: 'SlowTV - Qendra e Gjakovës',
    location: 'Gjakova City Center',
    city: 'Gjakova',
    lat: 42.3810,
    lon: 20.4320,
    provider: 'GjirafaVideo',
    pageUrl: 'https://video.gjirafa.com/slow-tv-gjakove',
    status: 'live'
  },
  {
    id: 'cctv-ferizaj',
    name: 'SlowTV - Qendra e qytetit, Ferizaj',
    location: 'Ferizaj City Center',
    city: 'Ferizaj',
    lat: 42.3705,
    lon: 21.1530,
    provider: 'GjirafaVideo',
    pageUrl: 'https://video.gjirafa.com/qendra-e-qytetit-ferizaj',
    status: 'live'
  }
];

const OSM_STYLE = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    },
    'satellite-tiles': {
      type: 'raster',
      tiles: ['https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2022-08-17/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg'],
      tileSize: 256,
      maxzoom: 9,
      attribution: 'NASA GIBS'
    },
    'wildfire-source': {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    }
  },
  layers: [
    {
      id: 'osm-basemap',
      type: 'raster',
      source: 'osm-tiles',
      paint: { 'raster-opacity': 1 }
    },
    {
      id: 'satellite-basemap',
      type: 'raster',
      source: 'satellite-tiles',
      layout: {
        visibility: 'none'
      }
    },
    {
      id: 'wildfire-layer',
      type: 'circle',
      source: 'wildfire-source',
      layout: { visibility: 'none' },
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'frp'],
          0, 4,
          5, 6,
          20, 10,
          100, 16
        ],
        'circle-color': '#ff4500',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff',
        'circle-stroke-opacity': 0.9,
        'circle-opacity': 0.85,
        'circle-blur': 1
      }
    }
  ],
  attribution: '© OpenStreetMap contributors, NASA GIBS, NASA FIRMS'
};

class BasemapControl {
  onAdd(map) {
    this._map = map;
    const container = document.createElement('div');
    container.className = 'mapboxgl-ctrl maplibregl-control maplibregl-control-corner basemap-control-container';
    container.innerHTML = `
      <button class="basemap-btn" data-basemap="dark">MAP</button>
      <button class="basemap-btn" data-basemap="satellite">SATELLITE</button>
    `;
    const btnMap = container.querySelector('.basemap-btn[data-basemap="dark"]');
    const btnSat = container.querySelector('.basemap-btn[data-basemap="satellite"]');
    if (btnMap) btnMap.classList.add('active');
    btnMap.addEventListener('click', () => switchBasemap('dark'));
    btnSat.addEventListener('click', () => switchBasemap('satellite'));
    this._container = container;
    return container;
  }
  onRemove() {
    this._container?.parentNode?.removeChild(this._container);
    this._map = undefined;
  }
}

function switchBasemap(basemapId) {
  if (!state.map) return;
  const map = state.map;
  if (basemapId === 'dark') {
    if (map.getLayer('osm-basemap')) {
      map.setLayoutProperty('osm-basemap', 'visibility', 'visible');
    }
    if (map.getLayer('satellite-basemap')) {
      map.setLayoutProperty('satellite-basemap', 'visibility', 'none');
    }
    const buttons = document.querySelectorAll('.basemap-btn');
    buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.basemap === 'dark'));
  } else if (basemapId === 'satellite') {
    if (map.getLayer('satellite-basemap')) {
      map.setLayoutProperty('satellite-basemap', 'visibility', 'visible');
    }
    if (map.getLayer('osm-basemap')) {
      map.setLayoutProperty('osm-basemap', 'visibility', 'none');
    }
    const buttons = document.querySelectorAll('.basemap-btn');
    buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.basemap === 'satellite'));
  }
}

window.setBasemapMode = switchBasemap;

class MapModeControl {
  onAdd(map) {
    this._map = map;
    const container = document.createElement('div');
    container.className = 'mapboxgl-ctrl maplibregl-control maplibregl-control-corner map-mode-control-container';
    container.innerHTML = `
      <button class="map-mode-btn" data-mode="2d">2D</button>
      <button class="map-mode-btn" data-mode="3d">3D</button>
    `;
    const btn2d = container.querySelector('.map-mode-btn[data-mode="2d"]');
    const btn3d = container.querySelector('.map-mode-btn[data-mode="3d"]');
    if (btn2d) btn2d.addEventListener('click', () => window.setMapViewMode('2d'));
    if (btn3d) btn3d.addEventListener('click', () => window.setMapViewMode('3d'));
    this._container = container;
    return container;
  }
  onRemove() {
    this._container?.parentNode?.removeChild(this._container);
    this._map = undefined;
  }
}

const state = {
  currentLocation: DEFAULT_LOCATION,
  currentTimeline: '24h',
  data: null,
  newsFilter: 'all',
  wildfireFilter: '24h',
  pollTimer: null,
  pollIntervalMs: 300000,
  sseSource: null,
  customKeywords: [],
  map: null,
  mapInitialized: false,
  mapVisible: true,
  activeModule: null,
  mapMarkers: [],
  wildfireMarkers: [],
  mapMode: '2d',
  cctvVisible: false,
  cctvMarkers: [],
  radiationVisible: false,
  radiationMarkers: [],
  trafficVisible: false,
  trafficMarkers: [],
};

const $ = id => document.getElementById(id);

function setMapViewMode(mode) {
  if (!state.map) return;
  
  state.mapMode = mode;
  const buttons = document.querySelectorAll('.map-mode-btn');
  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  
  if (mode === '3d') {
    state.map.setPitch(50);
    state.map.setBearing(0);
  } else {
    state.map.setPitch(0);
    state.map.setBearing(0);
  }
}

window.setMapViewMode = setMapViewMode;

document.addEventListener('DOMContentLoaded', () => {
  startClock();
  connectSSE();
  loadAlertHistory();
  initMap();
  startMonitor();
  
  setupCCTVPanelButtons();
});

function setupCCTVPanelButtons() {
  const closeBtn = $('cctvClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeCCTVViewer();
    });
  }
  
  const rawFeedBtn = $('cctvRawFeed');
  if (rawFeedBtn) {
    rawFeedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const camera = currentCCTVCamera || window.cctvCurrentCamera;
      if (camera && camera.pageUrl) {
        window.open(camera.pageUrl, '_blank', 'noopener,noreferrer');
      }
    });
  }
  
  const mapTargetBtn = $('cctvMapTargetBtn');
  if (mapTargetBtn) {
    mapTargetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const camera = currentCCTVCamera || window.cctvCurrentCamera;
      if (camera) {
        centerMapOnCCTV(camera);
      }
    });
  }
}

function startClock() {
  const update = () => {
    $('clockDisplay').textContent = new Date().toLocaleString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short', hour12: false,
    });
  };
  update(); setInterval(update, 1000);
}

function connectSSE() {
  if (state.sseSource) state.sseSource.close();
  const es = new EventSource('/events');
  state.sseSource = es;
  es.onopen = () => setLiveStatus(true);
  es.onerror = () => { setLiveStatus(false); setTimeout(connectSSE, 5000); };
  es.onmessage = e => {
    try {
      const m = JSON.parse(e.data);
      if (m.type === 'alert') {
        loadAlertHistory();
      }
    } catch {}
  };
}
function setLiveStatus(online) {
  const el = $('liveIndicator');
  el.className = `status-indicator ${online ? 'online' : 'offline'}`;
  el.querySelector('.status-text').textContent = online ? 'LIVE' : 'OFFLINE';
}

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
  } catch {
    console.error('Monitor failed');
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
  ensureTrafficIncidentLocations(data.traffic);
  state.data = data;

  hideWelcome();
  renderThreatLevel(data.threatLevel);
  renderNews(data.news);
  renderWeather(data.weather);
  renderTraffic(data.traffic);
  renderRadiation(data.radiation);
  renderAQI(data.aqi);
  renderEarthquakes(data.earthquakes);
  updateMap(data);
  loadAlertHistory();
}

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

function renderThreatLevel(tl) {
  if (!tl) return;
  const widget = $('threatWidget');
  widget.style.display = 'flex';
  $('threatFill').style.width = `${tl.score}%`;
  $('threatFill').style.background = tl.color;
  const text = $('threatText');
  text.textContent = `${tl.level}  ${tl.score}`;
  text.style.color = tl.color;
  document.querySelector('.header').style.borderBottomColor = tl.score >= 80 ? tl.color : '';
}

function renderNews(news) {
  const panel = $('newsPanel');
  if (!news || news.error) { $('newsList').innerHTML = `<div class="error-state">News unavailable: ${news?.error || ''}</div>`; return; }

  const high = news.summary?.highIntensity || 0;
  $('newsBadge').textContent = high > 0 ? `${high} HIGH` : '';
  $('newsBadge').style.display = high > 0 ? '' : 'none';
  $('newsMeta').textContent = `${news.summary?.total || 0} articles · ${news.source}`;

  filterNewsItems(news.items, state.newsFilter);
}

function filterNewsItems(items, filter) {
  state.newsFilter = filter;
  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter);
  const list = $('newsList');
  if (!filtered.length) { list.innerHTML = '<div class="empty-state">No matching articles</div>'; return; }
  list.innerHTML = filtered.map(item => {
    const s = item.intensityScore;
    const cls = s >= 9 ? 'score-critical' : s >= 7 ? 'score-high' : s >= 5 ? 'score-medium' : '';
    const tags = (item.tags || []).slice(0, 3).map(t => `<span class="news-tag">${escHtml(t)}</span>`).join('');
    const url = isValidArticleUrl(item.url) ? item.url.trim() : '';
    const card = `<div class="news-item ${cls}">
      <div class="news-item-header">
        <span class="news-score score-${s}">${s}/10</span>
        <span class="news-category">${(item.category||'other').replace(/_/g,' ')}</span>
        <span class="news-time">${formatTimeAgo(item.publishedAt)}</span>
      </div>
      <div class="news-title">${escHtml(item.title)}</div>
      ${item.description ? `<div class="news-desc">${escHtml(item.description)}</div>` : ''}
      <div class="news-footer">
        <span class="news-source">📡 ${escHtml(item.source)}</span>
        <div class="news-tags">${tags}</div>
      </div>
    </div>`;
    return url ? `<a class="news-item-link" href="${escHtml(url)}" target="_blank" rel="noopener noreferrer">${card}</a>` : card;
  }).join('');
}
function filterNews(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (state.data?.news) filterNewsItems(state.data.news.items || [], cat);
}

function renderWeather(weather) {
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

const KOSOVO_TRAFFIC_LOCATIONS = [
  { city: 'Vushtrri', lat: 42.8250, lon: 20.9660, keywords: ['smrekonic', 'smrekovnic', 'vushtrr', 'vučitrn', 'vucitrn'] },
  { city: 'Drenas', lat: 42.6250, lon: 20.8920, keywords: ['komoran', 'drenas', 'gllogoc', 'glogovac'] },
  { city: 'Suharekë', lat: 42.3600, lon: 20.8250, keywords: ['duhël', 'duhel', 'dulje', 'suharek', 'suva reka', 'therand'] },
  { city: 'Podujevë', lat: 42.9100, lon: 21.1900, keywords: ['merdar', 'lluzhan', 'podujev', 'podujevo', 'besian'] },
  { city: 'Brezovicë', lat: 42.2180, lon: 20.9980, keywords: ['brezovic', 'shtërpc', 'shterpc', 'štrpce', 'strpce'] },
  { city: 'Shtime', lat: 42.4330, lon: 21.0400, keywords: ['carralev', 'shtime', 'štimlje', 'stimlje'] },
  { city: 'Pejë', lat: 42.6593, lon: 20.2887, keywords: ['rugov', 'pejë', 'peje', 'peć', 'pec'] },
  { city: 'Mitrovicë', lat: 42.8914, lon: 20.8660, keywords: ['zveçan', 'zvecan', 'mitrovic', 'mitrovica'] },
  { city: 'Leposaviq', lat: 43.1000, lon: 20.8000, keywords: ['jaranja', 'jarinj', 'leposaviq', 'leposavić', 'leposavic'] },
  { city: 'Zubin Potok', lat: 42.9100, lon: 20.6900, keywords: ['gazivod', 'ujman', 'zubin potok'] },
  { city: 'Fushë Kosovë', lat: 42.6340, lon: 21.0960, keywords: ['fushë kosov', 'fushe kosov', 'kosovo polje'] },
  { city: 'Prishtinë', lat: 42.6629, lon: 21.1655, keywords: ['veternik', 'çagllavic', 'caglavic', 'prishtin', 'prištin', 'pristina'] },
  { city: 'Prizren', lat: 42.2139, lon: 20.7397, keywords: ['shadervan', 'ortakoll', 'bazhderhane', 'prizren'] },
  { city: 'Gjilan', lat: 42.4635, lon: 21.4694, keywords: ['gavran', 'gjilan', 'gnjilan'] },
  { city: 'Ferizaj', lat: 42.3705, lon: 21.1530, keywords: ['ferizaj', 'uroševac', 'urosevac'] },
  { city: 'Gjakovë', lat: 42.3810, lon: 20.4320, keywords: ['gjakov', 'đakovic', 'djakovic'] },
  { city: 'Rahovec', lat: 42.3990, lon: 20.6550, keywords: ['rahovec', 'orahovac'] },
  { city: 'Klinë', lat: 42.6210, lon: 20.5780, keywords: ['klinë', 'kline', 'klina'] },
  { city: 'Deçan', lat: 42.5410, lon: 20.2880, keywords: ['deçan', 'decan', 'dečani', 'decani'] },
  { city: 'Istog', lat: 42.7800, lon: 20.4900, keywords: ['istog', 'istok', 'burim'] },
  { city: 'Lipjan', lat: 42.5220, lon: 21.1250, keywords: ['janjev', 'lipjan', 'lipljan'] },
  { city: 'Kaçanik', lat: 42.2300, lon: 21.2600, keywords: ['kaçanik', 'kacanik'] },
  { city: 'Skenderaj', lat: 42.7480, lon: 20.7890, keywords: ['skenderaj', 'srbica'] },
  { city: 'Malishevë', lat: 42.4820, lon: 20.7450, keywords: ['malishev', 'mališevo', 'malisevo'] },
  { city: 'Kamenicë', lat: 42.5780, lon: 21.5800, keywords: ['dardan', 'kamenic', 'kamenica'] },
  { city: 'Viti', lat: 42.3210, lon: 21.3580, keywords: ['kllokot', 'klokot', 'viti', 'vitina'] },
];

function extractTrafficLocation(title, description) {
  const titleLower = (title || '').toLowerCase();
  const descLower = (description || '').toLowerCase();
  for (const loc of KOSOVO_TRAFFIC_LOCATIONS) {
    for (const kw of loc.keywords) {
      if (titleLower.includes(kw.toLowerCase())) return { city: loc.city, lat: loc.lat, lon: loc.lon };
    }
  }
  for (const loc of KOSOVO_TRAFFIC_LOCATIONS) {
    for (const kw of loc.keywords) {
      if (descLower.includes(kw.toLowerCase())) return { city: loc.city, lat: loc.lat, lon: loc.lon };
    }
  }
  return null;
}

function ensureTrafficIncidentLocations(traffic) {
  if (!traffic || !Array.isArray(traffic.incidents)) return;
  traffic.incidents.forEach(inc => {
    if (!inc.location || !inc.location.lat || !inc.location.lon) {
      const loc = extractTrafficLocation(inc.title, inc.description);
      if (loc) inc.location = loc;
    }
  });
}

function renderTraffic(traffic) {
  ensureTrafficIncidentLocations(traffic);
  if (!traffic || traffic.error) { $('incidentList').innerHTML = `<div class="error-state">Traffic data unavailable</div>`; return; }
  if (traffic.source === 'none') {
    $('trafficMeta').textContent = 'via news RSS';
    $('trafficAnomaly').style.display = 'none';
    $('trafficAnomalyBanner').style.display = 'none';
    $('incidentList').innerHTML = '<div class="empty-state">No current traffic incidents reported</div>';
    return;
  }
  
  $('trafficMeta').textContent = `via news RSS`;
  $('trafficAnomaly').style.display = traffic.anomalyDetected ? '' : 'none';
  $('trafficAnomalyBanner').style.display = traffic.anomalyDetected ? '' : 'none';
  if (traffic.anomalyDetected) $('trafficAnomalyBanner').textContent = `🚨 ${traffic.anomalySummary}`;
  $('incidentList').innerHTML = (traffic.incidents||[]).length
    ? (traffic.incidents||[]).map(inc => `<div class="incident-item ${inc.anomaly?'anomaly':''}">
        <div class="incident-body">
          <div class="incident-type">${escHtml(inc.type.replace(/_/g,' '))}${inc.location?.city ? ` <span class="incident-road">📍 ${escHtml(inc.location.city)}</span>` : ''}${inc.anomaly?`<span class="incident-anomaly-tag">⚠ ${inc.anomalyType}</span>`:''}</div>
          <div class="incident-desc">${escHtml(inc.description)}</div>
          <div class="incident-source">📰 ${escHtml(inc.source)} · ${formatTimeAgo(inc.publishedAt)}</div>
          ${inc.url && inc.url !== '#' ? `<div class="incident-link"><a href="${escHtml(inc.url)}" target="_blank">Read article</a></div>` : ''}
        </div></div>`).join('')
    : '<div class="empty-state">No current traffic incidents reported</div>';
}

function renderTrafficMarkers(trafficData) {
  if (!state.map) return;
  state.trafficMarkers.forEach(m => m.remove());
  state.trafficMarkers = [];

  if (!state.trafficVisible) return;

  const data = trafficData || state.data?.traffic;
  if (!data || data.error) return;

  ensureTrafficIncidentLocations(data);
  (data.incidents || []).forEach(inc => {
    if (!inc.location?.lat || !inc.location?.lon) return;
    const color = inc.anomaly ? '#fb923c' : '#fbbf24';
    const cityLabel = inc.location.city ? ` · ${escHtml(inc.location.city)}` : '';
    const marker = new maplibregl.Marker({ element: createMapMarkerElement(color, inc.anomaly ? 14 : 12, 2) })
      .setLngLat([inc.location.lon, inc.location.lat])
      .setPopup(new maplibregl.Popup({ offset: 20, className: 'mapbox-popup' })
        .setHTML(`<strong>🚦 ${escHtml(inc.type.replace(/_/g, ' '))}${cityLabel}</strong><br>${escHtml(inc.description)}${inc.delay > 0 ? `<br>+${inc.delay} min delay` : ''}`))
      .addTo(state.map);
    state.trafficMarkers.push(marker);
  });
}

function renderRadiation(rad) {
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

function renderRadiationMarkers(radData) {
  if (!state.map) return;
  state.radiationMarkers.forEach(m => m.remove());
  state.radiationMarkers = [];

  if (!state.radiationVisible) return;

  const data = radData || state.data?.radiation;
  if (!data || data.error) return;

  (data.neighbors || []).forEach(n => {
    if (!n.lat || !n.lon) return;
    const color = { normal: '#34d399', elevated: '#fbbf24', high: '#fb923c', critical: '#f87171' }[n.status] || '#94a3b8';
    const marker = new maplibregl.Marker({ element: createMapMarkerElement(color, 12, 2) })
      .setLngLat([n.lon, n.lat])
      .setPopup(new maplibregl.Popup({ offset: 20, className: 'mapbox-popup' })
        .setHTML(`<strong>☢️ ${escHtml(n.name)}</strong><br>Radiation: ${n.usvh != null ? n.usvh.toFixed(3) : 'N/A'} µSv/h<br>Status: <span style="color:${color};font-weight:600">${escHtml((n.status || 'unknown').toUpperCase())}</span>${n.distanceKm ? `<br>Distance: ${n.distanceKm}km` : ''}`))
      .addTo(state.map);
    state.radiationMarkers.push(marker);
  });
}

function renderAQI(aqi) {
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

function renderEarthquakes(data) {
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

function renderWildfire(wildfireData) {
  const list = $('wildfireList');
  const meta = $('wildfireMeta');
  const badge = $('wildfireBadge');
  
  if (!wildfireData || wildfireData.error) {
    list.innerHTML = `<div class="error-state">Wildfire data unavailable</div>`;
    meta.textContent = wildfireData?.source || 'NASA FIRMS';
    badge.style.display = 'none';
    return;
  }
  
  meta.textContent = `${wildfireData.count} detections · ${formatTimeAgo(wildfireData.fetchedAt)} · via ${wildfireData.source}`;
  
  const detections = wildfireData.detections || [];
  const significant = detections.filter(d => (d.confidence || 0) >= 50).length;
  badge.style.display = significant > 0 ? '' : 'none';
  badge.textContent = significant > 0 ? `${significant} HIGH` : '';
  
  if (detections.length === 0) {
    list.innerHTML = '<div class="empty-state">No active fire detections</div>';
    return;
  }
  
  list.innerHTML = detections.map(d => {
    const conf = d.confidence || 0;
    const confClass = conf >= 80 ? 'high' : conf >= 50 ? 'medium' : 'low';
    const sat = d.satellite || 'Unknown';
    const time = d.acq_time ? `${formatHour(d.acq_time)}` : '';
    const date = d.acq_date ? formatDate(d.acq_date) : '';
    
    return `<div class="wildfire-item severity-${confClass}">
      <div class="wildfire-header">
        <span class="wildfire-confidence">${conf}%</span>
        <span class="wildfire-sat">${escHtml(sat)}</span>
      </div>
      <div class="wildfire-coords">
        <span class="wildfire-lat">Lat: ${d.lat?.toFixed(4)}</span>
        <span class="wildfire-lon">Lon: ${d.lon?.toFixed(4)}</span>
      </div>
      <div class="wildfire-details">
        <span class="wildfire-time">${date} ${time}</span>
        <span class="wildfire-brightness">Brightness: ${d.brightness?.toFixed(1) || '?'} K</span>
        <span class="wildfire-frp">FRP: ${(d.frp || 0).toFixed(1)}</span>
      </div>
    </div>`;
  }).join('');
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

function filterWildfire(period, btn) {
  document.querySelectorAll('#wildfireFilterRow .filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  state.wildfireFilter = period;
  if (state.map && window.updateWildfireLayer) {
    window.updateWildfireLayer(period);
  }
}

window.updateWildfireLayer = async function(period = '24h') {
  if (!state.mapInitialized) return;
  
  try {
    const response = await fetch(`/api/wildfire?period=${period}`);
    if (!response.ok) throw new Error('Failed to fetch wildfire data');
    const data = await response.json();
    
    if (data.error || !data.source) {
      setWildfireVisibility(false);
      renderWildfire(data);
      return;
    }
    
    const features = (data.detections || []).map(d => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [d.lon, d.lat]
      },
      properties: {
        id: d.id,
        lat: d.lat,
        lon: d.lon,
        confidence: d.confidence,
        brightness: d.brightness,
        frp: d.frp,
        satellite: d.satellite,
        acq_date: d.acq_date,
        acq_time: d.acq_time
      }
    }));
    
    const geojson = {
      type: 'FeatureCollection',
      features: features
    };
    
    if (state.map.getSource('wildfire-source')) {
      state.map.getSource('wildfire-source').setData(geojson);
    }
    
    setWildfireVisibility(features.length > 0);
    renderWildfire(data);
  } catch (err) {
    console.error('Wildfire update error:', err);
    setWildfireVisibility(false);
    renderWildfire({ error: true });
  }
}

function setWildfireVisibility(visible) {
  if (!state.map) return;
  if (visible) {
    if (state.map.getLayer('wildfire-layer')) {
      state.map.setLayoutProperty('wildfire-layer', 'visibility', 'visible');
    }
  } else {
    if (state.map.getLayer('wildfire-layer')) {
      state.map.setLayoutProperty('wildfire-layer', 'visibility', 'none');
    }
  }
}

window.toggleWildfireLayer = function() {
  if (state.wildfireVisible) {
    setWildfireVisibility(false);
    state.wildfireVisible = false;
  } else {
    state.wildfireVisible = true;
    window.updateWildfireLayer(state.wildfireFilter);
  }
}

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
    setTimeout(() => state.map.resize(), 200);
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
    setTimeout(() => state.map.resize(), 200);
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
    setTimeout(() => state.map.resize(), 200);
  }
}

function toggleModule(panelId) {
  const overlay = $('moduleOverlay');
  const panel = $(panelId);
  if (!overlay || !panel) return;

  if (state.activeModule === panelId) {
    closeModulePanel();
    return;
  }

  ensureMapVisible();

  overlay.querySelectorAll('.overlay-panel').forEach(p => { p.style.display = 'none'; });
  panel.style.display = 'flex';
  overlay.classList.add('active');
  $('overlayTitle').textContent = panel.dataset.panelTitle || 'Module';
  overlay.setAttribute('aria-hidden', 'false');
  document.querySelectorAll('.module-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.panel === panelId));
  state.activeModule = panelId;

  if (!state.mapInitialized) initMap();
  else if (state.data) updateMap(state.data);

  if (panelId === 'wildfirePanel') {
    state.wildfireVisible = true;
    window.updateWildfireLayer(state.wildfireFilter);
    if (state.map.getLayer('wildfire-layer')) {
      state.map.setLayoutProperty('wildfire-layer', 'visibility', 'visible');
    }
  } else {
    if (state.wildfireVisible) {
      state.wildfireVisible = false;
      if (state.map && state.map.getLayer('wildfire-layer')) {
        state.map.setLayoutProperty('wildfire-layer', 'visibility', 'none');
      }
    }
  }

  if (panelId === 'cctvIntelligencePanel') {
    openCCTVModule();
  } else {
    if (state.cctvVisible) {
      state.cctvVisible = false;
      state.cctvMarkers.forEach(m => m.remove());
      state.cctvMarkers = [];
    }
  }

  if (panelId === 'trafficPanel') {
    state.trafficVisible = true;
    renderTrafficMarkers(state.data?.traffic);
  } else {
    if (state.trafficVisible) {
      state.trafficVisible = false;
      renderTrafficMarkers();
    }
  }

  if (panelId === 'radiationPanel') {
    state.radiationVisible = true;
    renderRadiationMarkers(state.data?.radiation);
  } else {
    if (state.radiationVisible) {
      state.radiationVisible = false;
      renderRadiationMarkers();
    }
  }

  if (state.map) {
    setTimeout(() => state.map.resize(), 200);
  }
}

function closeModulePanel() {
  const overlay = $('moduleOverlay');
  if (!overlay) return;
  
  if (state.wildfireVisible) {
    state.wildfireVisible = false;
    if (state.map.getLayer('wildfire-layer')) {
      state.map.setLayoutProperty('wildfire-layer', 'visibility', 'none');
    }
  }
  
  if (state.cctvVisible) {
    state.cctvVisible = false;
    state.cctvMarkers.forEach(m => m.remove());
    state.cctvMarkers = [];
  }

  if (state.trafficVisible) {
    state.trafficVisible = false;
    renderTrafficMarkers();
  }

  if (state.radiationVisible) {
    state.radiationVisible = false;
    renderRadiationMarkers();
  }
  
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
  state.activeModule = null;
  document.querySelectorAll('.module-btn').forEach(btn => btn.classList.remove('active'));
  if (state.map) {
    setTimeout(() => state.map.resize(), 200);
  }
}

function createMapMarkerElement(color, size = 16, border = 3) {
  const marker = document.createElement('div');
  marker.className = 'mapbox-marker';
  marker.style.width = `${size}px`;
  marker.style.height = `${size}px`;
  marker.style.border = `${border}px solid rgba(255,255,255,0.92)`;
  marker.style.borderRadius = '50%';
  marker.style.backgroundColor = color;
  marker.style.boxShadow = `0 0 14px ${color}`;
  marker.style.cursor = 'pointer';
  return marker;
}

function createCCTVMarkerElement(camera, map) {
  const container = document.createElement('div');
  container.className = 'cctv-marker-container';
  container.dataset.cameraId = camera.id;
  container.setAttribute('title', camera.name || 'CCTV Camera');

  const dot = document.createElement('div');
  dot.className = 'cctv-marker-dot';
  container.appendChild(dot);
  
  container.addEventListener('click', (e) => {
    e.stopPropagation();
    e.stopImmediatePropagation();
    openCCTVViewer(camera);
  });
  
  return container;
}

let currentCCTVCamera = null;

function renderCCTVCameraList() {
  const listEl = $('cctvCameraList');
  if (!listEl) return;

  listEl.innerHTML = CCTV_CAMERAS.map(cam => {
    const isActive = currentCCTVCamera && currentCCTVCamera.id === cam.id;
    return `
      <div class="cctv-camera-item ${isActive ? 'active' : ''}" data-camera-id="${escHtml(cam.id)}">
        <span class="cctv-camera-item-name" title="${escHtml(cam.name)}">📹 ${escHtml(cam.location || cam.name)}</span>
        <span class="cctv-camera-item-city">${escHtml(cam.city)}</span>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.cctv-camera-item').forEach(item => {
    item.addEventListener('click', () => {
      const camId = item.dataset.cameraId;
      const cam = CCTV_CAMERAS.find(c => c.id === camId);
      if (cam) {
        openCCTVViewer(cam);
        centerMapOnCCTV(cam);
      }
    });
  });
}

function highlightActiveCCTV(camera) {
  if (!camera) return;

  const listEl = $('cctvCameraList');
  if (listEl) {
    listEl.querySelectorAll('.cctv-camera-item').forEach(item => {
      const isSelected = item.dataset.cameraId === camera.id;
      item.classList.toggle('active', isSelected);
      if (isSelected) {
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  document.querySelectorAll('.cctv-marker-container[data-camera-id]').forEach(markerEl => {
    const isSelected = markerEl.dataset.cameraId === camera.id;
    markerEl.classList.toggle('active', isSelected);
  });
}

function openCCTVViewer(camera) {
  currentCCTVCamera = camera;
  
  const panel = $('cctvIntelligencePanel');
  const nameEl = $('cctvName');
  const videoFrame = $('cctvVideoFrame');
  const videoUnavailable = $('cctvVideoUnavailable');
  const openLink = $('cctvOpenFeed');
  const statusEl = $('cctvStatus');
  
  if (panel) {
    panel.style.display = 'flex';
    
    if (nameEl) {
      nameEl.textContent = camera.name || 'CAMERA';
    }
    
    const isLive = (camera.status || '').toLowerCase() === 'live';
    if (statusEl) {
      statusEl.textContent = isLive ? '● LIVE' : `● ${(camera.status || 'UNKNOWN').toUpperCase()}`;
      statusEl.className = `cctv-status-indicator ${isLive ? 'live' : ''}`;
    }

    const metadataEl = panel.querySelector('.cctv-intelligence-metadata');
    if (metadataEl) {
      const coordsText = (camera.lat != null && camera.lon != null)
        ? `${camera.lat.toFixed(4)}, ${camera.lon.toFixed(4)}`
        : 'N/A';

      metadataEl.innerHTML = `
        <div class="cctv-metadata-row">
          <span class="cctv-metadata-label">CITY</span>
          <span class="cctv-metadata-value">${escHtml(camera.city || 'Kosovo')}</span>
        </div>
        <div class="cctv-metadata-row">
          <span class="cctv-metadata-label">LOCATION</span>
          <span class="cctv-metadata-value">${escHtml(camera.location || 'N/A')}</span>
        </div>
        <div class="cctv-metadata-row">
          <span class="cctv-metadata-label">PROVIDER</span>
          <span class="cctv-metadata-value">${escHtml(camera.provider || 'N/A')}</span>
        </div>
        <div class="cctv-metadata-row">
          <span class="cctv-metadata-label">STATUS</span>
          <span class="cctv-metadata-value">${escHtml((camera.status || 'live').toUpperCase())}</span>
        </div>
        <div class="cctv-metadata-row">
          <span class="cctv-metadata-label">COORDINATES</span>
          <span class="cctv-metadata-value">${escHtml(coordsText)}</span>
        </div>
      `;
    }
    
    if (videoUnavailable) {
      videoUnavailable.style.display = 'flex';
      videoUnavailable.innerHTML = `
        <div class="cctv-unavailable-icon">📹</div>
        <div class="cctv-unavailable-title" style="font-weight:600; color:var(--text-primary); font-size:13px; text-align:center;">${escHtml(camera.location || camera.name)}</div>
        <div class="cctv-unavailable-text" style="font-size:11px; color:var(--text-dim); text-align:center;">External live feed via ${escHtml(camera.provider || 'provider')}</div>
        <a id="cctvOpenFeed" class="cctv-open-feed-btn" href="${escHtml(camera.pageUrl || '#')}" target="_blank" rel="noopener noreferrer" style="margin-top:4px;">↗ OPEN LIVE FEED</a>
      `;
    }
    
    if (videoFrame) {
      videoFrame.style.display = 'block';
      videoFrame.src = camera.pageUrl || '';
    }

    highlightActiveCCTV(camera);
  }
  
  window.cctvCurrentCamera = camera;
}

function closeCCTVViewer() {
  const panel = $('cctvIntelligencePanel');
  const videoFrame = $('cctvVideoFrame');
  
  if (panel) {
    panel.style.display = 'none';
  }
  
  if (videoFrame) {
    videoFrame.src = '';
  }
  
  currentCCTVCamera = null;
  window.cctvCurrentCamera = null;
}

function centerMapOnCCTV(camera) {
  if (!state.map || !camera.lat || !camera.lon) return;
  state.map.flyTo({
    center: [camera.lon, camera.lat],
    zoom: Math.max(14, state.map.getZoom() || 8),
    duration: 800
  });
}

window.openCCTVViewer = openCCTVViewer;
window.closeCCTVViewer = closeCCTVViewer;
window.centerMapOnCCTV = centerMapOnCCTV;

function openCCTVModule() {
  if (state.cctvVisible) {
    closeCCTVModule();
    return;
  }

  const panel = $('cctvIntelligencePanel');
  if (panel) {
    panel.style.display = 'flex';
    $('cctvName').textContent = 'CCTV Surveillance';
  }

  state.cctvVisible = true;
  renderCCTVMarkers();
  renderCCTVCameraList();
  
  if (CCTV_CAMERAS.length > 0) {
    openCCTVViewer(currentCCTVCamera || CCTV_CAMERAS[0]);
  }
  
  document.querySelectorAll('.module-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.panel === 'cctvIntelligencePanel'));
  state.activeModule = 'cctvIntelligencePanel';

  if (state.map) {
    setTimeout(() => state.map.resize(), 200);
  }
}

function closeCCTVModule() {
  const panel = $('cctvIntelligencePanel');
  if (panel) {
    panel.style.display = 'none';
  }
  
  state.activeModule = null;
  document.querySelectorAll('.module-btn').forEach(btn => btn.classList.remove('active'));
  state.cctvVisible = false;
  state.cctvMarkers.forEach(m => m.remove());
  state.cctvMarkers = [];
  if (state.map) {
    setTimeout(() => state.map.resize(), 200);
  }
}

function renderCCTVMarkers() {
  if (!state.map) return;
  state.cctvMarkers.forEach(m => m.remove());
  state.cctvMarkers = [];

  if (!state.cctvVisible) return;

  CCTV_CAMERAS.forEach(camera => {
    if (!camera.lat || !camera.lon) return;
    const element = createCCTVMarkerElement(camera, state.map);
    const marker = new maplibregl.Marker({ element })
      .setLngLat([camera.lon, camera.lat])
      .addTo(state.map);
    state.cctvMarkers.push(marker);
  });

  if (currentCCTVCamera) {
    highlightActiveCCTV(currentCCTVCamera);
  }
}

function initMap() {
  if (state.mapInitialized) return;
  state.mapInitialized = true;

  state.map = new maplibregl.Map({
    container: 'leafletMap',
    style: OSM_STYLE,
    center: [DEFAULT_MAP_CENTER.lon, DEFAULT_MAP_CENTER.lat],
    zoom: DEFAULT_MAP_ZOOM,
    pitch: 35,
    projection: 'mercator',
  });

  state.map.addControl(new maplibregl.NavigationControl());
  state.map.addControl(new BasemapControl(), 'top-right');
  state.map.addControl(new MapModeControl(), 'bottom-right');

  state.map.on('load', () => {
    if (state.data) updateMap(state.data);
    setTimeout(() => { if (state.map) state.map.resize(); }, 200);
    
    state.map.on('click', 'wildfire-layer', (e) => {
      if (e.features && e.features.length > 0) {
        const props = e.features[0].properties;
        const popup = new maplibregl.Popup({ offset: 25, className: 'mapbox-popup' })
          .setHTML(`
            <strong>🔥 Active Fire Detection</strong><br>
            <div style="font-size:11px; color:#94a3b8">
              Lat: ${props.lat?.toFixed(4)}<br>
              Lon: ${props.lon?.toFixed(4)}<br>
              Time: ${props.acq_date} ${props.acq_time ? formatHour(props.acq_time) : ''}<br>
              Satellite: ${props.satellite || 'Unknown'}<br>
              Confidence: ${props.confidence || '?'}%<br>
              Brightness: ${(props.brightness || 0).toFixed(1)}K<br>
              FRP: ${(props.frp || 0).toFixed(1)} MW
            </div>
          `);
        popup.setLngLat(e.lngLat).addTo(state.map);
      }
    });
    
    state.map.on('mouseenter', 'wildfire-layer', () => {
      if (state.map.getCanvas()) state.map.getCanvas().style.cursor = 'pointer';
    });
    state.map.on('mouseleave', 'wildfire-layer', () => {
      if (state.map.getCanvas()) state.map.getCanvas().style.cursor = '';
    });
    
    state.map.on('click', 'radiation-layer', (e) => {
      if (e.features && e.features.length > 0) {
        const props = e.features[0].properties;
        const popup = new maplibregl.Popup({ offset: 25, className: 'mapbox-popup' })
          .setHTML(`
            <strong>☢️ Radiation Station</strong><br>
            <div style="font-size:11px; color:#94a3b8">
              Station: ${escHtml(props.name)}<br>
              Radiation: ${props.usvh} µSv/h<br>
              Status: ${escHtml(props.status)}
            </div>
          `);
        popup.setLngLat(e.lngLat).addTo(state.map);
      }
    });
    
    state.map.on('mouseenter', 'radiation-layer', () => {
      if (state.map.getCanvas()) state.map.getCanvas().style.cursor = 'pointer';
    });
    state.map.on('mouseleave', 'radiation-layer', () => {
      if (state.map.getCanvas()) state.map.getCanvas().style.cursor = '';
    });
    
    state.map.setPaintProperty('wildfire-layer', 'circle-radius', [
      'interpolate',
      ['linear'],
      ['get', 'frp'],
      0, 4,
      5, 6,
      20, 10,
      100, 16
    ]);
    
    window.updateWildfireLayer(state.wildfireFilter);
  });

  state.map.on('idle', () => {
    try { state.map.triggerRepaint(); } catch (e) {}
    const buttons = document.querySelectorAll('.map-mode-btn');
    if (buttons.length >= 2 && !document.querySelector('.map-mode-btn.active')) {
      buttons[0].classList.add('active');
    }
  });

  state.map.on('error', (event) => {
    if (event && event.error) {
      console.warn('Map error:', event.error);
    }
  });

  setTimeout(() => { if (state.map) state.map.resize(); }, 200);
}

function updateMap(data) {
  if (!state.mapInitialized || !state.map || !data) return;

  if (!state.map.isStyleLoaded()) {
    state.map.once('load', () => updateMap(data));
    return;
  }

  state.mapMarkers.forEach(m => m.remove());
  state.mapMarkers = [];

  const coords = data.weather?.coordinates || DEFAULT_MAP_CENTER;
  const centerPoint = [coords.lon, coords.lat];

  const centerMarker = new maplibregl.Marker({ element: createMapMarkerElement('#22d3ee', 18, 3) })
    .setLngLat(centerPoint)
    .setPopup(new maplibregl.Popup({ offset: 25, className: 'mapbox-popup' })
      .setHTML(`<strong>📍 ${escHtml(data.location)}</strong><br>Monitoring center`))
    .addTo(state.map);
  state.mapMarkers.push(centerMarker);

  const shouldShowKosovoView = state.currentLocation.toLowerCase().includes('kosovo') || (data.location && data.location.toLowerCase().includes('kosovo'));
  if (shouldShowKosovoView) {
    state.map.fitBounds(DEFAULT_KOSOVO_BOUNDS, { padding: 60, duration: 800 });
    state.map.setPitch(35);
  } else {
    state.map.easeTo({ center: centerPoint, zoom: 11, pitch: 35, duration: 800 });
  }

  renderTrafficMarkers(data.traffic);

  (data.earthquakes?.earthquakes || []).filter(eq => eq.magnitude >= 2.5).forEach(eq => {
    if (!eq.lat || !eq.lon) return;
    const radius = Math.max(8, eq.magnitude * 3);
    const element = createMapMarkerElement(eq.color || '#38bdf8', radius, 3);
    element.style.width = `${radius}px`;
    element.style.height = `${radius}px`;
    element.style.boxShadow = `0 0 18px ${eq.color || '#38bdf8'}`;

    const marker = new maplibregl.Marker({ element })
      .setLngLat([eq.lon, eq.lat])
      .setPopup(new maplibregl.Popup({ offset: 20, className: 'mapbox-popup' })
        .setHTML(`<strong>🌊 M${eq.magnitude.toFixed(1)} ${escHtml(eq.label)}</strong><br>${escHtml(eq.place)}<br>Depth: ${eq.depth}km · ${formatTimeAgo(eq.time)}`))
      .addTo(state.map);
    state.mapMarkers.push(marker);
  });

  renderRadiationMarkers(data.radiation);

  $('mapBadge').style.display = state.mapMarkers.length > 1 ? '' : 'none';
  $('mapBadge').textContent = `${state.mapMarkers.length - 1} pins`;
  $('mapMeta').textContent = `${state.mapMarkers.length - 1} incident markers · scroll to zoom`;
  
  if (state.mapMode === '3d') {
    state.map.setPitch(50);
    state.map.setBearing(0);
  } else if (state.mapMode === '2d') {
    state.map.setPitch(0);
    state.map.setBearing(0);
  }
  
  setTimeout(() => { if (state.map) state.map.resize(); }, 100);
}

function loadCustomKeywords() {
  try { state.customKeywords = JSON.parse(localStorage.getItem('sentinel_keywords') || '[]'); } catch { state.customKeywords = []; }
  renderKeywordChips();
}

function addKeyword() {
  const input = $('keywordInput');
  const kw = input.value.trim().toLowerCase();
  if (!kw || state.customKeywords.includes(kw)) { input.value = ''; return; }
  state.customKeywords.push(kw);
  localStorage.setItem('sentinel_keywords', JSON.stringify(state.customKeywords));
  renderKeywordChips();
  input.value = '';
}

function removeKeyword(kw) {
  state.customKeywords = state.customKeywords.filter(k => k !== kw);
  localStorage.setItem('sentinel_keywords', JSON.stringify(state.customKeywords));
  renderKeywordChips();
}

function renderKeywordChips() {
  $('keywordChips').innerHTML = state.customKeywords.map(kw =>
    `<div class="keyword-chip">${escHtml(kw)}<span class="keyword-remove" onclick="removeKeyword('${escHtml(kw)}')">✕</span></div>`
  ).join('');
}

function exportReport() {
  if (!state.data) { return; }

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
    ...(d.news?.items || []).map(n => `[${n.intensityScore}/10] ${n.category}: ${n.title} (${n.source})`),
    ``,
    `── WEATHER ────────────────────────`,
    d.weather?.current ? `Temp: ${d.weather.current.temp}°C, Wind: ${d.weather.current.windSpeed}km/h, ${d.weather.current.description}` : 'N/A',
    ...(d.weather?.alerts || []).map(a => `  ⚠ ${a.type}: ${a.message}`),
    ``,
    `── TRAFFIC ────────────────────────`,
    `Source: ${d.traffic?.source || 'none'}`,
    d.traffic?.incidents?.length ? `Incidents: ${d.traffic.incidents.length}` : 'No traffic incidents',
    d.traffic?.anomalyDetected ? `  ⚠ ANOMALY: ${d.traffic.anomalySummary}` : '  No anomalies',
    ...(d.traffic?.incidents || []).map(i => `  • ${i.type}: ${i.title}`),
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
}

async function loadAlertHistory() {
  try {
    const { alerts, unreadCount } = await fetch('/api/alerts').then(r => r.json());
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

async function loadLocationHistory() {
  return;
}
function selectLocation(name) { state.currentLocation = name; startMonitor(); }

function setupSuggestions(names) {
  return;
}

function showLoading(show, sub = '') { $('loadingOverlay').style.display = show ? 'flex' : 'none'; if (sub) $('loadingSub').textContent = sub; }
function hideWelcome() {
  const panel = $('welcomePanel');
  if (panel) panel.style.display = 'none';
}

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

window.toggleModule = toggleModule;
window.startMonitor = startMonitor;
window.toggleMap = toggleMap;
window.updatePollInterval = updatePollInterval;
window.filterNews = filterNews;
window.closeModulePanel = closeModulePanel;
window.exportReport = exportReport;
window.markAllRead = markAllRead;
window.filterWildfire = filterWildfire;
window.openCCTVModule = openCCTVModule;
window.closeCCTVModule = closeCCTVModule;