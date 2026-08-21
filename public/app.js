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

const KOSOVO_WEATHER_CITIES = [
  { id: 'prishtine', name: 'Prishtinë', lat: 42.6629, lon: 21.1655 },
  { id: 'mitrovice', name: 'Mitrovicë', lat: 42.8914, lon: 20.8660 },
  { id: 'peje',      name: 'Pejë',      lat: 42.6591, lon: 20.2883 },
  { id: 'prizren',   name: 'Prizren',   lat: 42.2153, lon: 20.7415 },
  { id: 'ferizaj',   name: 'Ferizaj',   lat: 42.3705, lon: 21.1553 },
  { id: 'gjilan',    name: 'Gjilan',    lat: 42.4635, lon: 21.4694 },
  { id: 'gjakove',   name: 'Gjakovë',   lat: 42.3803, lon: 20.4308 }
];

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
  activeMapModule: null, // Authoritative single active map module: null | 'news' | 'weather' | 'traffic' | 'radiation' | 'aqi' | 'earthquake' | 'wildfire' | 'aviation' | 'cctv'
  activeModule: null,
  mapMode: '2d',
  aviationFilter: 'all',
  telegramFilter: 'all',
  telegramData: null,
  selectedWeatherCityId: null,
  weatherCache: {},
  weatherPopup: null,
  activeMapPopup: null,
};

function clearMarkerList(markerList) {
  if (Array.isArray(markerList)) {
    markerList.forEach(m => {
      try { m.remove(); } catch(e) {}
    });
    markerList.length = 0;
  }
}

const moduleLayers = {
  news: {
    markers: [],
    render: (data) => renderNewsMapMarkers(data?.news || state.data?.news),
    clear: () => clearMarkerList(moduleLayers.news.markers)
  },
  weather: {
    markers: [],
    render: (data) => renderWeatherMapMarkers(data?.weather || state.data?.weather),
    clear: () => clearMarkerList(moduleLayers.weather.markers)
  },
  traffic: {
    markers: [],
    render: (data) => renderTrafficMapMarkers(data?.traffic || state.data?.traffic),
    clear: () => clearMarkerList(moduleLayers.traffic.markers)
  },
  radiation: {
    markers: [],
    render: (data) => renderRadiationMapMarkers(data?.radiation || state.data?.radiation),
    clear: () => clearMarkerList(moduleLayers.radiation.markers)
  },
  aqi: {
    markers: [],
    render: (data) => renderAqiMapMarkers(data?.aqi || state.data?.aqi),
    clear: () => clearMarkerList(moduleLayers.aqi.markers)
  },
  earthquake: {
    markers: [],
    render: (data) => renderEarthquakeMapMarkers(data?.earthquakes || state.data?.earthquakes),
    clear: () => clearMarkerList(moduleLayers.earthquake.markers)
  },
  wildfire: {
    markers: [],
    render: (data) => renderWildfireMapLayer(data?.wildfire || state.data?.wildfire),
    clear: () => clearWildfireMapLayer()
  },
  aviation: {
    markers: [],
    render: (data) => renderAviationMapMarkers(data?.aviation || state.data?.aviation),
    clear: () => clearMarkerList(moduleLayers.aviation.markers)
  },
  telegram: {
    markers: [],
    render: () => {},
    clear: () => {}
  },
  border: {
    markers: [],
    render: (data) => renderBorderMapMarkers(data || state.borderData),
    clear: () => clearMarkerList(moduleLayers.border.markers)
  },
  cctv: {
    markers: [],
    render: () => renderCCTVMapMarkers(),
    clear: () => clearMarkerList(moduleLayers.cctv.markers)
  }
};

function clearAllModuleLayers() {
  Object.keys(moduleLayers).forEach(mod => {
    try {
      moduleLayers[mod].clear();
    } catch(e) {
      console.warn(`Error clearing module layer ${mod}:`, e);
    }
  });
  updateMapBadgeAndMeta();
}

function setActiveMapModule(mod, data) {
  clearAllModuleLayers();
  state.activeMapModule = mod || null;
  state.activeModule = mod ? `${mod}Panel` : null;

  if (mod && moduleLayers[mod]) {
    if (state.map && state.mapInitialized) {
      moduleLayers[mod].render(data || state.data);
    }
  }
  updateMapBadgeAndMeta();
}

function updateMapBadgeAndMeta() {
  const badge = $('mapBadge');
  const meta = $('mapMeta');
  if (!badge || !meta) return;

  if (!state.activeMapModule) {
    badge.style.display = 'none';
    badge.textContent = '';
    meta.textContent = 'Balkan Intelligence Base Map · Scroll to zoom';
    return;
  }

  let count = 0;
  const mod = state.activeMapModule;
  if (mod === 'telegram') {
    badge.style.display = 'none';
    meta.textContent = 'Telegram Public Channels · Read-Only Feed';
    return;
  }
  if (mod === 'border') {
    count = moduleLayers.border.markers.length;
    badge.style.display = count > 0 ? '' : 'none';
    badge.textContent = `${count} crossings`;
    meta.textContent = `${count} border crossings · QKMK Live`;
    return;
  }
  if (mod === 'wildfire') {
    const src = state.map?.getSource('wildfire-source');
    count = src?._data?.features?.length || 0;
    badge.style.display = count > 0 ? '' : 'none';
    badge.textContent = `${count} fires`;
    meta.textContent = `${count} active fire detections · NASA FIRMS`;
  } else if (mod === 'weather') {
    count = moduleLayers.weather.markers.length;
    badge.style.display = count > 0 ? '' : 'none';
    badge.textContent = `${count} cities`;
    const selectedCity = KOSOVO_WEATHER_CITIES.find(c => c.id === state.selectedWeatherCityId);
    meta.textContent = `Weather Stations · ${selectedCity ? selectedCity.name : 'Kosovo'} active`;
  } else if (moduleLayers[mod]) {
    count = moduleLayers[mod].markers.length;
    badge.style.display = count > 0 ? '' : 'none';
    badge.textContent = `${count} pins`;
    meta.textContent = `${count} ${mod.toUpperCase()} markers · Scroll to zoom`;
  }
}

window.moduleLayers = moduleLayers;
window.clearAllModuleLayers = clearAllModuleLayers;
window.setActiveMapModule = setActiveMapModule;
window.updateMapBadgeAndMeta = updateMapBadgeAndMeta;

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
    body: JSON.stringify({ location, lat: DEFAULT_MAP_CENTER.lat, lon: DEFAULT_MAP_CENTER.lon, timeline, forceRefresh, customKeywords: state.customKeywords }),
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
  renderWildfire(data.wildfire);
  renderAviation(data.aviation);
  fetchTelegram(forceRefresh);
  fetchBorder(forceRefresh);
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

  const items = news.items || [];
  const totalEvents = news.summary?.total || items.length;
  const criticalCount = items.filter(i => i.severity === 'critical' || i.intensityScore >= 9).length;
  const highCount = items.filter(i => i.severity === 'high' || (i.intensityScore >= 7 && i.intensityScore <= 8)).length;

  const badge = $('newsBadge');
  if (criticalCount > 0) {
    badge.textContent = `${criticalCount} CRITICAL`;
    badge.className = 'panel-badge badge-critical';
    badge.style.display = '';
  } else if (highCount > 0) {
    badge.textContent = `${highCount} HIGH`;
    badge.className = 'panel-badge badge-high';
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }

  $('newsMeta').textContent = `${totalEvents} Security Events`;

  filterNewsItems(items, state.newsFilter || 'all');
}

/**
 * Safely parses any publication timestamp field into epoch milliseconds.
 * Returns NaN if missing, null, or unparseable.
 */
function getArticlePubTime(item) {
  if (!item) return NaN;
  const raw = item.publishedAt || item.published || item.pubDate || item.published_at || item.timestamp;
  if (!raw) return NaN;
  const time = new Date(raw).getTime();
  return isNaN(time) ? NaN : time;
}

/**
 * Sorts news articles strictly in reverse chronological order (newest publication first, oldest last).
 * - Valid timestamps are sorted newest -> oldest.
 * - Missing or invalid timestamps are safely placed at the end without throwing errors.
 * - Ties with identical publication timestamps are deterministically ordered by title.
 */
function sortNewsByChronological(items) {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    const timeA = getArticlePubTime(a);
    const timeB = getArticlePubTime(b);

    const validA = !isNaN(timeA);
    const validB = !isNaN(timeB);

    if (validA && validB) {
      if (timeB !== timeA) return timeB - timeA;
      const titleA = String(a.title || a.url || '');
      const titleB = String(b.title || b.url || '');
      return titleA.localeCompare(titleB);
    }
    if (validA && !validB) return -1;
    if (!validA && validB) return 1;
    
    // Both invalid or missing
    const titleA = String(a.title || a.url || '');
    const titleB = String(b.title || b.url || '');
    return titleA.localeCompare(titleB);
  });
}

function filterNewsItems(items, filter) {
  state.newsFilter = filter || 'all';
  items = items || [];
  let filtered = items;
  if (filter === 'critical') {
    filtered = items.filter(i => i.severity === 'critical' || i.intensityScore >= 9);
  } else if (filter === 'high') {
    filtered = items.filter(i => i.severity === 'high' || (i.intensityScore >= 7 && i.intensityScore <= 8));
  } else if (filter === 'medium') {
    filtered = items.filter(i => i.severity === 'medium' || (i.intensityScore >= 4 && i.intensityScore <= 6));
  } else if (filter === 'north_kosovo') {
    filtered = items.filter(i => i.category === 'north_kosovo');
  } else if (filter === 'event') {
    filtered = items.filter(i => (i.eventType || 'event') === 'event');
  } else if (filter === 'commentary') {
    filtered = items.filter(i => i.eventType === 'commentary');
  }

  const sorted = sortNewsByChronological(filtered);

  const list = $('newsList');
  if (!sorted.length) { list.innerHTML = '<div class="empty-state">No matching security events</div>'; return; }
  list.innerHTML = sorted.map(item => {
    const s = item.intensityScore || 1;
    const sev = (item.severity || (s >= 9 ? 'critical' : s >= 7 ? 'high' : 'medium')).toLowerCase();
    const cls = sev === 'critical' ? 'score-critical' : sev === 'high' ? 'score-high' : 'score-medium';
    const eventType = (item.eventType || 'event').toUpperCase();
    const catLabel = (item.category || 'security').replace(/_/g, ' ').toUpperCase();
    const confPercent = Math.round((item.confidence || 0.7) * 100);
    const sourcesText = item.sourceCount > 1 
      ? `📡 ${escHtml(item.source)} +${item.sourceCount - 1} sources` 
      : `📡 ${escHtml(item.source)}`;
    const allSourcesList = (item.sources || [item.source]).join(', ');
    const tags = (item.tags || []).slice(0, 3).map(t => `<span class="news-tag">${escHtml(t.replace(/_/g, ' '))}</span>`).join('');
    const url = isValidArticleUrl(item.url) ? item.url.trim() : '';

    const card = `<div class="news-item ${cls}">
      <div class="news-item-header">
        <span class="news-score score-${s}">${s}/10</span>
        <span class="news-severity sev-${sev}">${sev.toUpperCase()}</span>
        <span class="news-event-type type-${(item.eventType||'event').toLowerCase()}">${eventType}</span>
        <span class="news-category">${catLabel}</span>
        <span class="news-confidence">${confPercent}% Conf</span>
        <span class="news-time">${formatTimeAgo(item.publishedAt)}</span>
      </div>
      <div class="news-title">${escHtml(item.title)}</div>
      ${item.description ? `<div class="news-desc">${escHtml(item.description)}</div>` : ''}
      <div class="news-footer">
        <span class="news-source" title="${escHtml(allSourcesList)}">${sourcesText}</span>
        <div class="news-tags">${tags}</div>
      </div>
    </div>`;
    return url ? `<a class="news-item-link" href="${escHtml(url)}" target="_blank" rel="noopener noreferrer">${card}</a>` : card;
  }).join('');
}
function filterNews(cat, btn) {
  document.querySelectorAll('.panel-filter-row .filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (state.data?.news) filterNewsItems(state.data.news.items || [], cat);
}

function renderWeather(weather, explicitCityName) {
  const selectedCity = KOSOVO_WEATHER_CITIES.find(c => c.id === state.selectedWeatherCityId);
  const cityName = explicitCityName || weather?.location || selectedCity?.name || 'Prishtinë';
  const city = KOSOVO_WEATHER_CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase()) || selectedCity;

  if (weather && !weather.error && city) {
    if (!state.weatherCache) state.weatherCache = {};
    state.weatherCache[city.id] = { data: weather, fetchedAt: Date.now() };

    // Update marker temp display if rendered
    if (moduleLayers.weather?.markers) {
      const marker = moduleLayers.weather.markers.find(m => m._cityId === city.id);
      if (marker && typeof weather.current?.temp === 'number') {
        const el = marker.getElement ? marker.getElement() : marker._element;
        if (el) {
          let tempEl = el.querySelector('.weather-marker-temp');
          if (!tempEl) {
            tempEl = document.createElement('span');
            tempEl.className = 'weather-marker-temp';
            el.appendChild(tempEl);
          }
          tempEl.textContent = `${weather.current.temp}°`;
        }
      }
    }

    // Update open popup if currently displayed for this city
    if (state.weatherPopup && state.selectedWeatherCityId === city.id) {
      openWeatherPopup(city, weather);
    }
  }
}

/* ── Unified Map Popup System (Design System Reference: Weather Popup) ─────── */
function buildMapPopupHtml({
  icon = '📍',
  title = '',
  source = '',
  badge = null, // { text: 'HIGH', color: '#f87171' }
  primary = null, // { val: '35°C', sub: 'Clear sky', secondary: 'Feels like 32°C' }
  stats = [], // [ { label: 'Humidity', val: '21%' }, ... ]
  description = '',
  contentHtml = '', // direct custom body html
  sections = '', // raw custom html like hourly forecast
  footer = '' // raw footer html or text
}) {
  const badgeHtml = badge ? `
    <span class="map-popup-badge" style="background:${badge.color || 'var(--cyan)'}20; color:${badge.color || 'var(--cyan)'}; border:1px solid ${badge.color || 'var(--cyan)'}40;">
      ${escHtml(badge.text)}
    </span>
  ` : '';

  const primaryHtml = primary ? `
    <div class="map-popup-primary">
      <div class="map-popup-primary-row">
        <span class="map-popup-primary-val">${primary.val}</span>
        ${primary.sub ? `<span class="map-popup-primary-sub">${primary.sub}</span>` : ''}
      </div>
      ${primary.secondary ? `<div class="map-popup-secondary">${escHtml(primary.secondary)}</div>` : ''}
    </div>
  ` : '';

  const statsHtml = Array.isArray(stats) && stats.length > 0 ? `
    <div class="map-popup-grid">
      ${stats.map(s => `
        <div class="map-popup-stat">
          <span class="map-popup-stat-label">${escHtml(s.label)}</span>
          <span class="map-popup-stat-val" ${s.color ? `style="color:${s.color}"` : ''}>${escHtml(String(s.val ?? 'N/A'))}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  const descHtml = description ? `
    <div class="map-popup-desc-text">${escHtml(description)}</div>
  ` : '';

  return `
    <div class="map-popup">
      <div class="map-popup-header">
        <div class="map-popup-title">
          <span class="map-popup-icon">${icon}</span>
          <span class="map-popup-title-text">${escHtml(title.toUpperCase())}</span>
          ${badgeHtml}
        </div>
        ${source ? `<div class="map-popup-source">via ${escHtml(source)}</div>` : ''}
      </div>
      <div class="map-popup-body">
        ${primaryHtml}
        ${descHtml}
        ${statsHtml}
        ${contentHtml}
        ${sections || ''}
      </div>
      ${footer ? `<div class="map-popup-footer">${footer}</div>` : ''}
    </div>
  `;
}

function createMapPopup(html, opts = {}) {
  return new maplibregl.Popup({
    offset: opts.offset || 20,
    closeButton: opts.closeButton ?? true,
    closeOnClick: opts.closeOnClick ?? true,
    className: `mapbox-popup map-unified-popup ${opts.className || ''}`.trim()
  }).setHTML(html);
}

function openMapPopup(coords, html, onClose, opts = {}) {
  if (!state.map) return null;
  closeMapPopup();

  const popup = createMapPopup(html, opts)
    .setLngLat(coords);

  popup.on('close', () => {
    if (state.activeMapPopup === popup) {
      state.activeMapPopup = null;
      state.weatherPopup = null;
      state.selectedWeatherCityId = null;
      state.selectedMarkerId = null;
    }
    if (typeof onClose === 'function') onClose();
    updateMapBadgeAndMeta();
  });

  popup.addTo(state.map);
  state.activeMapPopup = popup;
  state.weatherPopup = popup;
  return popup;
}

function closeMapPopup() {
  if (state.activeMapPopup) {
    const p = state.activeMapPopup;
    state.activeMapPopup = null;
    state.weatherPopup = null;
    try { p.remove(); } catch(e) {}
  }
}

function buildWeatherPopupHtml(city, weatherData) {
  if (!weatherData || weatherData.error) {
    return buildMapPopupHtml({
      icon: '🌤',
      title: city.name,
      source: 'Open-Meteo · UNAVAILABLE',
      description: weatherData?.error || 'Live weather data currently unavailable.'
    });
  }

  const c = weatherData.current || {};
  const forecast = (weatherData.forecast || []).slice(0, 5);
  const sourceLabel = (weatherData.source && weatherData.source.toLowerCase() === 'open-meteo') ? 'Open-Meteo' : (weatherData.source || 'Open-Meteo');
  const forecastHtml = forecast.length > 0 ? `
    <div class="weather-popup-forecast-section">
      <div class="weather-popup-forecast-title">HOURLY FORECAST</div>
      <div class="weather-popup-forecast-row">
        ${forecast.map(f => `
          <div class="weather-popup-forecast-item">
            <div class="weather-popup-f-time">${formatHour(f.time)}</div>
            <div class="weather-popup-f-icon">${weatherIcon(f.weatherCode)}</div>
            <div class="weather-popup-f-temp">${f.temp}°</div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  return buildMapPopupHtml({
    icon: '🌤',
    title: city.name,
    source: sourceLabel,
    primary: {
      val: `${c.temp ?? 'N/A'}°C`,
      sub: `${weatherIcon(c.weatherCode)} ${escHtml(c.description || 'Clear sky')}`,
      secondary: `Feels like ${c.feelsLike ?? c.temp ?? 'N/A'}°C`
    },
    stats: [
      { label: 'Humidity', val: `${c.humidity ?? 'N/A'}%` },
      { label: 'Wind', val: `${c.windSpeed ?? 'N/A'} km/h` },
      { label: 'Precip.', val: `${c.precipitation ?? 0} mm` },
      { label: 'Visibility', val: `${c.visibility ?? 'N/A'} km` }
    ],
    sections: forecastHtml
  });
}

function closeWeatherPopup() {
  closeMapPopup();
  state.selectedWeatherCityId = null;
  if (moduleLayers.weather?.markers) {
    moduleLayers.weather.markers.forEach(m => {
      const el = m.getElement ? m.getElement() : m._element;
      if (el) el.classList.remove('active');
    });
  }
}

function openWeatherPopup(city, weatherData) {
  if (!state.map) return;
  
  closeMapPopup();
  state.selectedWeatherCityId = city.id;

  // Synchronize active class on all weather markers
  if (moduleLayers.weather?.markers) {
    moduleLayers.weather.markers.forEach(m => {
      const el = m.getElement ? m.getElement() : m._element;
      if (el) {
        if (m._cityId === city.id) el.classList.add('active');
        else el.classList.remove('active');
      }
    });
  }

  const html = buildWeatherPopupHtml(city, weatherData);
  const popup = createMapPopup(html, { className: 'weather-map-popup' })
    .setLngLat([city.lon, city.lat]);

  popup.on('close', () => {
    if (state.activeMapPopup === popup || state.weatherPopup === popup) {
      state.activeMapPopup = null;
      state.weatherPopup = null;
      state.selectedWeatherCityId = null;
      if (moduleLayers.weather?.markers) {
        moduleLayers.weather.markers.forEach(m => {
          const el = m.getElement ? m.getElement() : m._element;
          if (el) el.classList.remove('active');
        });
      }
    }
    updateMapBadgeAndMeta();
  });

  popup.addTo(state.map);
  state.activeMapPopup = popup;
  state.weatherPopup = popup;
}

async function fetchCityWeather(cityId, forceRefresh = false, showPopup = true) {
  const city = KOSOVO_WEATHER_CITIES.find(c => c.id === cityId) || KOSOVO_WEATHER_CITIES[0];
  if (!city) return null;

  if (!state.weatherCache) state.weatherCache = {};
  const cached = state.weatherCache[city.id];
  const now = Date.now();
  const CACHE_TTL = 300000; // 5 min

  if (!forceRefresh && cached && cached.data && (now - cached.fetchedAt < CACHE_TTL)) {
    // Only open popup if this city is STILL currently selected
    if (showPopup && state.selectedWeatherCityId === city.id) {
      openWeatherPopup(city, cached.data);
    }
    renderWeather(cached.data, city.name);
    return cached.data;
  }

  try {
    const url = `/api/weather?location=${encodeURIComponent(city.name)}&lat=${city.lat}&lon=${city.lon}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.weatherCache[city.id] = { data, fetchedAt: now };
    
    // Only open popup if this city is STILL currently selected (prevents race condition)
    if (showPopup && state.selectedWeatherCityId === city.id) {
      openWeatherPopup(city, data);
    }
    renderWeather(data, city.name);

    // Update marker temp display if rendered
    if (moduleLayers.weather?.markers) {
      const marker = moduleLayers.weather.markers.find(m => m._cityId === city.id);
      if (marker) {
        const el = marker.getElement ? marker.getElement() : marker._element;
        if (el && typeof data?.current?.temp === 'number') {
          let tempEl = el.querySelector('.weather-marker-temp');
          if (!tempEl) {
            tempEl = document.createElement('span');
            tempEl.className = 'weather-marker-temp';
            el.appendChild(tempEl);
          }
          tempEl.textContent = `${data.current.temp}°`;
        }
      }
    }

    return data;
  } catch (err) {
    console.warn(`[weather] Failed to fetch weather for ${city.name}:`, err.message);
    const errData = { error: err.message, location: city.name };
    if (showPopup && state.selectedWeatherCityId === city.id) {
      openWeatherPopup(city, cached?.data || errData);
    }
    if (cached && cached.data) {
      renderWeather(cached.data, city.name);
      return cached.data;
    }
    renderWeather(errData, city.name);
    return null;
  }
}

function selectWeatherCity(cityId, showPopup = true) {
  const city = KOSOVO_WEATHER_CITIES.find(c => c.id === cityId);
  if (!city) return;

  // Toggle behavior: If user clicks the currently active marker whose popup is open, close it!
  if (state.selectedWeatherCityId === city.id && state.weatherPopup) {
    closeWeatherPopup();
    updateMapBadgeAndMeta();
    return;
  }

  state.selectedWeatherCityId = city.id;

  // Update active state on weather markers
  if (moduleLayers.weather?.markers) {
    moduleLayers.weather.markers.forEach(m => {
      const el = m.getElement ? m.getElement() : m._element;
      if (el) {
        if (m._cityId === city.id) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });
  }

  // Fetch / render weather data and display map popup directly at the marker
  fetchCityWeather(city.id, false, showPopup);

  updateMapBadgeAndMeta();
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
  renderTrafficMapMarkers(trafficData);
}

function renderTrafficMapMarkers(trafficData) {
  if (!state.map || state.activeMapModule !== 'traffic') return;
  clearMarkerList(moduleLayers.traffic.markers);

  const data = trafficData || state.data?.traffic;
  if (!data || data.error || !Array.isArray(data.incidents)) {
    updateMapBadgeAndMeta();
    return;
  }

  ensureTrafficIncidentLocations(data);
  data.incidents.forEach(inc => {
    if (!inc.location?.lat || !inc.location?.lon) return;
    const color = inc.anomaly ? '#fb923c' : '#fbbf24';
    const popupHtml = buildMapPopupHtml({
      icon: '🚦',
      title: inc.type ? inc.type.replace(/_/g, ' ') : 'Traffic Event',
      source: 'Traffic Intelligence',
      badge: inc.anomaly ? { text: 'ANOMALY', color: '#fb923c' } : { text: 'MONITORED', color: '#34d399' },
      description: inc.description || 'Live traffic telemetry point',
      stats: [
        { label: 'Location', val: inc.location.city || 'Kosovo Road' },
        { label: 'Delay', val: inc.delay > 0 ? `+${inc.delay} min` : 'None', color: inc.delay > 0 ? '#fb923c' : '#34d399' },
        { label: 'Speed', val: inc.avgSpeed ? `${inc.avgSpeed} km/h` : 'Normal' },
        { label: 'Status', val: inc.status || 'Active' }
      ]
    });

    const marker = new maplibregl.Marker({ element: createMapMarkerElement(color, inc.anomaly ? 14 : 12, 2) })
      .setLngLat([inc.location.lon, inc.location.lat])
      .setPopup(createMapPopup(popupHtml))
      .addTo(state.map);

    marker._module = 'traffic';
    moduleLayers.traffic.markers.push(marker);
  });
  updateMapBadgeAndMeta();
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
  renderRadiationMapMarkers(radData);
}

function renderRadiationMapMarkers(radData) {
  if (!state.map || state.activeMapModule !== 'radiation') return;
  clearMarkerList(moduleLayers.radiation.markers);

  const data = radData || state.data?.radiation;
  if (!data || data.error || !Array.isArray(data.neighbors)) {
    updateMapBadgeAndMeta();
    return;
  }

  data.neighbors.forEach(n => {
    if (!n.lat || !n.lon) return;
    const color = { normal: '#34d399', elevated: '#fbbf24', high: '#fb923c', critical: '#f87171' }[n.status] || '#94a3b8';
    const popupHtml = buildMapPopupHtml({
      icon: '☢️',
      title: n.name || 'Radiation Sensor',
      source: data.source || 'EURDEP Sensor Network',
      badge: { text: (n.status || 'NORMAL').toUpperCase(), color },
      primary: {
        val: `${n.usvh != null ? n.usvh.toFixed(3) : 'N/A'} µSv/h`,
        sub: 'Ambient Dose Rate',
        secondary: `Baseline: ${data.baseline || '0.100'} µSv/h`
      },
      stats: [
        { label: 'Status', val: (n.status || 'NORMAL').toUpperCase(), color },
        { label: 'Distance', val: n.distanceKm ? `${n.distanceKm} km` : 'Local' },
        { label: 'Data Quality', val: (data.dataQuality || 'Verified').toUpperCase() },
        { label: 'Unit', val: 'µSv/h' }
      ]
    });

    const marker = new maplibregl.Marker({ element: createMapMarkerElement(color, 12, 2) })
      .setLngLat([n.lon, n.lat])
      .setPopup(createMapPopup(popupHtml))
      .addTo(state.map);

    marker._module = 'radiation';
    moduleLayers.radiation.markers.push(marker);
  });
  updateMapBadgeAndMeta();
}

function renderAQI(aqi) {
  const main = $('aqiMain');
  const meta = $('aqiMeta');
  const badge = $('aqiBadge');
  const pollutants = $('aqiPollutants');
  const trendSec = $('aqiTrendSection');
  const trendBars = $('aqiTrendBars');
  if (!main) return;

  if (!aqi || aqi.status !== 'LIVE_DATA' || !aqi.current) {
    main.innerHTML = `
      <div class="error-state aqi-error-state">
        <div style="font-weight:600; font-size:12px; margin-bottom:4px;">AIR QUALITY DATA UNAVAILABLE</div>
        <div style="font-size:11px; color:var(--text-dim);">${escHtml(aqi?.message || aqi?.error || 'Open-Meteo Air Quality service is currently unavailable.')}</div>
      </div>`;
    if (meta) meta.textContent = 'OPEN-METEO · UNAVAILABLE';
    if (badge) badge.style.display = 'none';
    if (pollutants) pollutants.innerHTML = '';
    if (trendSec) trendSec.style.display = 'none';
    return;
  }

  const c = aqi.current;
  if (meta) meta.textContent = `OPEN-METEO · LIVE · ${formatTimeAgo(aqi.updatedAt || aqi.fetchedAt)}`;

  if (badge) {
    const val = c.europeanAQI;
    badge.style.display = '';
    if (val >= 80) badge.className = 'panel-badge badge-critical';
    else if (val >= 60) badge.className = 'panel-badge badge-high';
    else badge.className = 'panel-badge';
    badge.textContent = `${c.label.toUpperCase()}`;
  }

  const circumference = 2 * Math.PI * 35;
  const pct = Math.min(100, (c.europeanAQI / 100) * 100);
  const dashOffset = circumference - (pct / 100) * circumference;

  const trendObj = aqi.trend || { status: 'stable', icon: '→' };
  const trendCls = `trend-${trendObj.status || 'stable'}`;

  main.innerHTML = `
    <div class="aqi-gauge-wrap">
      <svg class="aqi-gauge-svg" viewBox="0 0 100 100">
        <circle class="aqi-gauge-bg" cx="50" cy="50" r="35" transform="rotate(-90 50 50)"/>
        <circle class="aqi-gauge-arc" cx="50" cy="50" r="35"
          stroke="${c.color}" transform="rotate(-90 50 50)"
          stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}"/>
      </svg>
      <div class="aqi-gauge-center">
        <div class="aqi-gauge-value" style="color:${c.color}">${c.europeanAQI}</div>
        <div class="aqi-gauge-label">EAQI</div>
      </div>
    </div>
    <div class="aqi-info">
      <div class="aqi-status" style="color:${c.color}">${c.icon} ${c.label}</div>
      <div class="aqi-dominant">Dominant: <strong>${escHtml(c.dominantPollutant)}</strong></div>
      <div class="aqi-trend ${trendCls}">${trendObj.icon} ${trendObj.status}</div>
    </div>`;

  if (pollutants) {
    const pList = [
      { name: 'PM2.5', val: c.pm2_5, unit: 'μg/m³' },
      { name: 'PM10',  val: c.pm10,  unit: 'μg/m³' },
      { name: 'NO₂',   val: c.no2,   unit: 'μg/m³' },
      { name: 'O₃',    val: c.o3,    unit: 'μg/m³' },
      { name: 'SO₂',   val: c.so2,   unit: 'μg/m³' },
      { name: 'CO',    val: c.co,    unit: 'μg/m³' },
      { name: 'Dust',  val: c.dust,  unit: 'μg/m³' }
    ];

    pollutants.innerHTML = pList.map(p => `<div class="pollutant-item">
      <div class="pollutant-name">${p.name}</div>
      <div class="pollutant-value">${p.val}</div>
      <div class="pollutant-unit">${p.unit}</div>
    </div>`).join('');
  }

  if (trendSec && trendBars && Array.isArray(aqi.hourlyTrend) && aqi.hourlyTrend.length > 0) {
    trendSec.style.display = '';
    const maxVal = Math.max(50, ...aqi.hourlyTrend.map(h => h.aqi));
    trendBars.innerHTML = aqi.hourlyTrend.slice(0, 24).map(h => {
      const heightPercent = Math.max(10, Math.min(100, Math.round((h.aqi / maxVal) * 100)));
      return `
        <div class="aqi-trend-bar-item" title="${h.hour} — AQI: ${h.aqi} (${h.label})">
          <div class="aqi-trend-val">${h.aqi}</div>
          <div class="aqi-trend-bar-wrap">
            <div class="aqi-trend-bar" style="height:${heightPercent}%; background:${h.color};"></div>
          </div>
          <div class="aqi-trend-time">${h.hour}</div>
        </div>`;
    }).join('');
  } else if (trendSec) {
    trendSec.style.display = 'none';
  }
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

function renderEarthquakeMapMarkers(eqData) {
  if (!state.map || state.activeMapModule !== 'earthquake') return;
  clearMarkerList(moduleLayers.earthquake.markers);

  const data = eqData || state.data?.earthquakes;
  if (!data || data.error || !Array.isArray(data.earthquakes)) {
    updateMapBadgeAndMeta();
    return;
  }

  data.earthquakes.filter(eq => eq.magnitude >= 2.5).forEach(eq => {
    if (!eq.lat || !eq.lon) return;
    const radius = Math.max(8, eq.magnitude * 3);
    const element = createMapMarkerElement(eq.color || '#38bdf8', radius, 3);
    element.style.width = `${radius}px`;
    element.style.height = `${radius}px`;
    element.style.boxShadow = `0 0 18px ${eq.color || '#38bdf8'}`;

    const color = eq.color || '#38bdf8';
    const popupHtml = buildMapPopupHtml({
      icon: '🌊',
      title: 'Seismic Event',
      source: data.source || 'USGS / EMSC',
      badge: { text: `M${eq.magnitude.toFixed(1)}`, color },
      primary: {
        val: `M${eq.magnitude.toFixed(1)} ${eq.label || 'Earthquake'}`,
        sub: eq.place || 'Regional Event',
        secondary: formatTimeAgo(eq.time)
      },
      stats: [
        { label: 'Depth', val: `${eq.depth} km` },
        { label: 'Magnitude', val: eq.magnitude.toFixed(1), color },
        { label: 'Location', val: eq.place || 'Regional' },
        { label: 'Time', val: formatHour(eq.time) || 'Recent' }
      ]
    });

    const marker = new maplibregl.Marker({ element })
      .setLngLat([eq.lon, eq.lat])
      .setPopup(createMapPopup(popupHtml))
      .addTo(state.map);

    marker._module = 'earthquake';
    moduleLayers.earthquake.markers.push(marker);
  });
  updateMapBadgeAndMeta();
}

function renderNewsMapMarkers(newsData) {
  if (!state.map || state.activeMapModule !== 'news') return;
  clearMarkerList(moduleLayers.news.markers);

  const data = newsData || state.data?.news;
  if (!data || data.error || !Array.isArray(data.items)) {
    updateMapBadgeAndMeta();
    return;
  }

  data.items.forEach(item => {
    const loc = extractTrafficLocation(item.title, item.description);
    if (loc && typeof loc.lat === 'number' && typeof loc.lon === 'number') {
      const s = item.intensityScore || 5;
      const color = s >= 9 ? '#f87171' : s >= 7 ? '#fb923c' : '#fbbf24';
      const sevLabel = s >= 9 ? 'CRITICAL' : (s >= 7 ? 'HIGH' : (s >= 5 ? 'MEDIUM' : 'LOW'));
      const timeStr = item.publishedAt ? formatTimeAgo(item.publishedAt) : 'Recently';

      const popupHtml = buildMapPopupHtml({
        icon: '📰',
        title: 'News Intelligence',
        source: item.source || 'News Feed',
        badge: { text: sevLabel, color },
        description: item.title,
        stats: [
          { label: 'Location', val: loc.city },
          { label: 'Threat Score', val: `${s}/10`, color },
          { label: 'Published', val: timeStr },
          { label: 'Category', val: (item.category || 'general').toUpperCase() }
        ]
      });

      const marker = new maplibregl.Marker({ element: createMapMarkerElement(color, 12, 2) })
        .setLngLat([loc.lon, loc.lat])
        .setPopup(createMapPopup(popupHtml))
        .addTo(state.map);

      marker._module = 'news';
      moduleLayers.news.markers.push(marker);
    }
  });
  updateMapBadgeAndMeta();
}

function createWeatherMarkerElement(city, isActive = false, temp = null) {
  const container = document.createElement('div');
  container.className = `weather-marker-container ${isActive ? 'active' : ''}`;
  container.dataset.cityId = city.id;
  container.setAttribute('title', `Weather for ${city.name}`);

  const icon = document.createElement('span');
  icon.className = 'weather-marker-icon';
  icon.textContent = '🌤';
  container.appendChild(icon);

  const name = document.createElement('span');
  name.className = 'weather-marker-name';
  name.textContent = city.name;
  container.appendChild(name);

  if (typeof temp === 'number') {
    const tempEl = document.createElement('span');
    tempEl.className = 'weather-marker-temp';
    tempEl.textContent = `${temp}°`;
    container.appendChild(tempEl);
  }

  container.addEventListener('click', (e) => {
    e.stopPropagation();
    e.stopImmediatePropagation();
    selectWeatherCity(city.id, true);
  });

  return container;
}

function renderWeatherMapMarkers(weatherData) {
  if (!state.map || state.activeMapModule !== 'weather') return;
  clearMarkerList(moduleLayers.weather.markers);

  const selectedId = state.selectedWeatherCityId;

  KOSOVO_WEATHER_CITIES.forEach(city => {
    const isActive = (city.id === selectedId) && (state.weatherPopup !== null);
    const cached = state.weatherCache?.[city.id]?.data;
    const temp = cached?.current?.temp ?? (city.id === 'prishtine' && weatherData?.current?.temp ? weatherData.current.temp : null);

    const el = createWeatherMarkerElement(city, isActive, temp);
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([city.lon, city.lat])
      .addTo(state.map);

    marker._module = 'weather';
    marker._cityId = city.id;
    moduleLayers.weather.markers.push(marker);
  });

  updateMapBadgeAndMeta();
}

function renderAqiMapMarkers(aqiData) {
  if (!state.map || state.activeMapModule !== 'aqi') return;
  clearMarkerList(moduleLayers.aqi.markers);

  const data = aqiData || state.data?.aqi;
  if (!data || data.status !== 'LIVE_DATA' || !data.coordinates) {
    updateMapBadgeAndMeta();
    return;
  }

  const c = data.current;
  const color = c?.category?.color || '#34d399';
  const popupHtml = buildMapPopupHtml({
    icon: '🌍',
    title: 'Air Quality Index',
    source: data.source || 'Open-Meteo',
    badge: { text: c?.category?.label || 'Good', color },
    primary: {
      val: `EAQI ${c?.europeanAQI ?? 'N/A'}`,
      sub: c?.category?.label || 'Air Quality',
      secondary: `Dominant: ${c?.dominantPollutant ? c.dominantPollutant.toUpperCase() : 'N/A'}`
    },
    stats: [
      { label: 'PM2.5', val: c?.pollutants?.pm2_5 ? `${c.pollutants.pm2_5.value} µg/m³` : 'N/A' },
      { label: 'PM10', val: c?.pollutants?.pm10 ? `${c.pollutants.pm10.value} µg/m³` : 'N/A' },
      { label: 'NO2', val: c?.pollutants?.no2 ? `${c.pollutants.no2.value} µg/m³` : 'N/A' },
      { label: 'O3', val: c?.pollutants?.o3 ? `${c.pollutants.o3.value} µg/m³` : 'N/A' }
    ]
  });

  const marker = new maplibregl.Marker({ element: createMapMarkerElement(color, 14, 3) })
    .setLngLat([data.coordinates.lon, data.coordinates.lat])
    .setPopup(createMapPopup(popupHtml))
    .addTo(state.map);

  marker._module = 'aqi';
  moduleLayers.aqi.markers.push(marker);
  updateMapBadgeAndMeta();
}

function renderWildfire(wildfireData) {
  const list = $('wildfireList');
  const meta = $('wildfireMeta');
  const badge = $('wildfireBadge');
  if (!list) return;

  if (!wildfireData) {
    list.innerHTML = '<div class="empty-state">Loading fire detection data...</div>';
    if (meta) meta.textContent = 'NASA FIRMS';
    if (badge) badge.style.display = 'none';
    return;
  }

  if (wildfireData.status === 'NOT_CONFIGURED' || wildfireData.error === 'FIRMS_KEY_MISSING') {
    list.innerHTML = `
      <div class="empty-state wildfire-empty-state">
        <div class="wildfire-state-icon">📡</div>
        <div class="wildfire-state-title">FIRMS NOT CONFIGURED</div>
        <div class="wildfire-state-desc">NASA FIRMS API key is missing. Set <code>FIRMS_MAP_KEY</code> in server environment (.env) to enable live satellite thermal detections.</div>
      </div>`;
    if (meta) meta.textContent = 'NASA FIRMS · Not Configured';
    if (badge) badge.style.display = 'none';
    return;
  }

  if (wildfireData.status === 'UNAVAILABLE' || (wildfireData.error && wildfireData.status !== 'NO_ACTIVE_FIRES')) {
    list.innerHTML = `
      <div class="error-state wildfire-error-state">
        <div class="wildfire-state-title">NO LIVE FIRE DATA</div>
        <div class="wildfire-state-desc">${escHtml(wildfireData.message || wildfireData.error || 'NASA satellite fire services are currently unavailable.')}</div>
      </div>`;
    if (meta) meta.textContent = `${(wildfireData.source || 'NASA SATELLITES').toUpperCase()} · UNAVAILABLE`;
    if (badge) badge.style.display = 'none';
    return;
  }

  const detections = (wildfireData.detections || []).filter(d => 
    typeof d.lat === 'number' && typeof d.lon === 'number' && !d.isDemo
  );

  const sourceName = (wildfireData.source || 'NASA Satellite Network').toUpperCase();
  const cachedLabel = wildfireData.isCached ? ' (CACHED)' : '';

  if (detections.length === 0 || wildfireData.status === 'NO_ACTIVE_FIRES') {
    list.innerHTML = `
      <div class="empty-state wildfire-empty-state">
        <div class="wildfire-state-icon">🔥</div>
        <div class="wildfire-state-title">NO ACTIVE FIRES</div>
        <div class="wildfire-state-desc">No thermal fire anomalies detected in the selected period (${escHtml(wildfireData.period || '24h')}).</div>
      </div>`;
    if (meta) meta.textContent = `${sourceName} · LIVE DATA (0 Detections)${cachedLabel}`;
    if (badge) badge.style.display = 'none';
    return;
  }

  if (meta) meta.textContent = `${sourceName} · LIVE DATA (${detections.length} Detections)${cachedLabel}`;
  if (badge) {
    badge.style.display = '';
    badge.className = wildfireData.isCached ? 'panel-badge badge-warning' : 'panel-badge badge-critical';
    badge.textContent = wildfireData.isCached ? `${detections.length} ACTIVE (CACHED)` : `${detections.length} ACTIVE`;
  }

  list.innerHTML = detections.map(d => {
    const conf = d.confidence || 0;
    const confClass = conf >= 80 ? 'high' : conf >= 50 ? 'medium' : 'low';
    const sat = d.satellite || 'NASA Satellite';
    const time = d.acq_time ? formatHour(d.acq_time) : '';
    const date = d.acq_date ? formatDate(d.acq_date) : '';
    const bright = typeof d.brightness === 'number' && d.brightness > 0 ? `${d.brightness.toFixed(1)} K` : 'N/A';
    const frp = typeof d.frp === 'number' && d.frp > 0 ? `${d.frp.toFixed(1)} MW` : 'N/A';
    const distText = d.distanceKm ? ` · ${d.distanceKm} km away` : '';

    return `<div class="wildfire-item severity-${confClass}">
      <div class="wildfire-header">
        <span class="wildfire-confidence">${conf}% Conf${distText}</span>
        <span class="wildfire-sat">${escHtml(sat)}</span>
      </div>
      ${d.title ? `<div class="wildfire-event-title" style="font-size:11px;font-weight:600;color:var(--text-primary);margin-bottom:4px;">🔥 ${escHtml(d.title)}</div>` : ''}
      <div class="wildfire-coords">
        <span class="wildfire-lat">Lat: ${d.lat.toFixed(4)}</span>
        <span class="wildfire-lon">Lon: ${d.lon.toFixed(4)}</span>
      </div>
      <div class="wildfire-details">
        <span class="wildfire-time">${date} ${time}</span>
        <span class="wildfire-brightness">Brightness: ${bright}</span>
        <span class="wildfire-frp">FRP: ${frp}</span>
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
  if (state.activeMapModule === 'wildfire') {
    window.updateWildfireLayer(period);
  }
}

window.updateWildfireLayer = async function(period = '24h') {
  if (!state.mapInitialized) return;
  const requestModule = 'wildfire';
  
  try {
    const response = await fetch(`/api/wildfire?period=${period}`);
    if (!response.ok) throw new Error('Failed to fetch wildfire data');
    const data = await response.json();
    
    if (state.data) state.data.wildfire = data;
    renderWildfire(data);
    
    // Async guard check: only render wildfire layer if wildfire is STILL active!
    if (state.activeMapModule === requestModule) {
      renderWildfireMapLayer(data);
    }
  } catch (err) {
    console.error('Wildfire update error:', err);
    renderWildfire({ status: 'UNAVAILABLE', error: err.message });
    if (state.activeMapModule === requestModule) {
      clearWildfireMapLayer();
    }
  }
};

function clearWildfireMapLayer() {
  if (!state.map) return;
  if (state.map.getSource('wildfire-source')) {
    state.map.getSource('wildfire-source').setData({ type: 'FeatureCollection', features: [] });
  }
  if (state.map.getLayer('wildfire-layer')) {
    state.map.setLayoutProperty('wildfire-layer', 'visibility', 'none');
  }
}

function renderWildfireMapLayer(wildfireData) {
  if (!state.map || state.activeMapModule !== 'wildfire') {
    clearWildfireMapLayer();
    return;
  }

  const data = wildfireData || state.data?.wildfire;
  if (!data || data.error || data.status === 'NO_ACTIVE_FIRES' || data.status === 'NOT_CONFIGURED' || data.status === 'UNAVAILABLE' || data.isDemo) {
    clearWildfireMapLayer();
    updateMapBadgeAndMeta();
    return;
  }

  const validDetections = (data.detections || []).filter(d => 
    typeof d.lat === 'number' && typeof d.lon === 'number' && !d.isDemo
  );

  const features = validDetections.map(d => ({
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
      acq_time: d.acq_time,
      _module: 'wildfire'
    }
  }));

  if (state.map.getSource('wildfire-source')) {
    state.map.getSource('wildfire-source').setData({
      type: 'FeatureCollection',
      features
    });
  }
  if (state.map.getLayer('wildfire-layer')) {
    state.map.setLayoutProperty('wildfire-layer', 'visibility', features.length > 0 ? 'visible' : 'none');
  }
  updateMapBadgeAndMeta();
}

window.toggleWildfireLayer = function() {
  if (state.activeMapModule === 'wildfire') {
    closeModulePanel();
  } else {
    toggleModule('wildfirePanel');
  }
};

/* ── Aviation Intelligence ─────────────────────────────────────────────────── */
function getAircraftCategoryColor(cat) {
  switch (cat) {
    case 'military': return '#f87171';
    case 'private_jet': return '#c084fc';
    case 'commercial': return '#38bdf8';
    case 'private': return '#34d399';
    default: return '#94a3b8';
  }
}

function createAircraftMarkerElement(aircraft) {
  const el = document.createElement('div');
  el.className = `aircraft-marker-el aircraft-marker-${aircraft.category || 'unknown'}`;
  const rot = typeof aircraft.heading === 'number' ? aircraft.heading : 0;
  
  el.innerHTML = `
    <svg class="aircraft-icon-svg" viewBox="0 0 24 24" style="transform: rotate(${rot}deg);">
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
    </svg>
  `;
  return el;
}

function renderAviationMarkers(aviationData) {
  renderAviationMapMarkers(aviationData);
}

function renderAviationMapMarkers(aviationData) {
  if (!state.map || state.activeMapModule !== 'aviation') return;
  clearMarkerList(moduleLayers.aviation.markers);

  const data = aviationData || state.data?.aviation;
  if (!data || data.status !== 'LIVE_DATA' || !Array.isArray(data.aircraft)) {
    updateMapBadgeAndMeta();
    return;
  }

  const filtered = data.aircraft.filter(ac => {
    if (typeof ac.latitude !== 'number' || typeof ac.longitude !== 'number') return false;
    if (state.aviationFilter === 'all') return true;
    return ac.category === state.aviationFilter;
  });

  filtered.forEach(ac => {
    const el = createAircraftMarkerElement(ac);
    const catColor = getAircraftCategoryColor(ac.category);
    const altStr = ac.altitudeFt ? `${ac.altitudeFt.toLocaleString()} ft` : (ac.altitude ? `${ac.altitude} m` : 'N/A');
    const spdStr = ac.speedKts ? `${ac.speedKts} kts` : (ac.speed ? `${ac.speed} km/h` : 'N/A');
    const hdgStr = ac.heading !== null ? `${ac.heading}°` : 'N/A';
    const typeStr = ac.aircraftDesc || ac.aircraftType || 'N/A';
    const callsignStr = ac.callsign || ac.icao24.toUpperCase();

    const popupHtml = buildMapPopupHtml({
      icon: '✈️',
      title: callsignStr,
      source: 'OpenSky Network',
      badge: { text: ac.category.replace('_', ' '), color: catColor },
      primary: {
        val: callsignStr,
        sub: `ICAO: ${ac.icao24.toUpperCase()}`,
        secondary: ac.registration ? `Reg: ${ac.registration}` : (ac.operator || 'Operator Unknown')
      },
      stats: [
        { label: 'Altitude', val: altStr },
        { label: 'Speed', val: spdStr },
        { label: 'Heading', val: hdgStr },
        { label: 'Type', val: typeStr }
      ]
    });

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([ac.longitude, ac.latitude])
      .setPopup(createMapPopup(popupHtml, { offset: 15 }))
      .addTo(state.map);

    marker._module = 'aviation';
    moduleLayers.aviation.markers.push(marker);
  });

  updateMapBadgeAndMeta();
}

function renderAviation(aviationData) {
  const list = $('aviationList');
  const meta = $('aviationMeta');
  const badge = $('aviationBadge');
  const totalCount = $('aviationTotalCount');
  const countAll = $('countAll');
  const countCommercial = $('countCommercial');
  const countPrivate = $('countPrivate');
  const countPrivateJets = $('countPrivateJets');
  const countMilitary = $('countMilitary');
  const countUnknown = $('countUnknown');

  if (!list) return;

  if (!aviationData) {
    list.innerHTML = '<div class="empty-state">Loading live aviation telemetry...</div>';
    if (meta) meta.textContent = 'OPEN SKY';
    if (badge) badge.style.display = 'none';
    return;
  }

  if (aviationData.status === 'NOT_CONFIGURED') {
    list.innerHTML = `
      <div class="empty-state aviation-empty-state">
        <div class="wildfire-state-icon">📡</div>
        <div class="wildfire-state-title">AVIATION NOT CONFIGURED</div>
        <div class="wildfire-state-desc">${escHtml(aviationData.message || 'ADS-B tracking service is not configured.')}</div>
      </div>`;
    if (meta) meta.textContent = 'OPEN SKY · Not Configured';
    if (badge) badge.style.display = 'none';
    if (totalCount) totalCount.textContent = '0 AIRCRAFT';
    if (state.activeMapModule === 'aviation') renderAviationMapMarkers(null);
    return;
  }

  if (aviationData.status === 'UNAVAILABLE' || aviationData.error) {
    list.innerHTML = `
      <div class="error-state aviation-error-state">
        <div class="wildfire-state-title">AVIATION DATA UNAVAILABLE</div>
        <div class="wildfire-state-desc">${escHtml(aviationData.message || aviationData.error || 'Live ADS-B tracking service is currently unreachable.')}</div>
      </div>`;
    if (meta) meta.textContent = 'OPEN SKY · UNAVAILABLE';
    if (badge) badge.style.display = 'none';
    if (totalCount) totalCount.textContent = '0 AIRCRAFT';
    if (state.activeMapModule === 'aviation') renderAviationMapMarkers(null);
    return;
  }

  const aircraftList = Array.isArray(aviationData.aircraft) ? aviationData.aircraft : [];
  const summary = aviationData.summary || { commercial: 0, private: 0, privateJets: 0, military: 0, unknown: 0 };

  if (meta) meta.textContent = `OPEN SKY · LIVE · ${formatTimeAgo(aviationData.updatedAt)}`;

  if (badge) {
    if (summary.military > 0) {
      badge.style.display = '';
      badge.className = 'panel-badge badge-critical';
      badge.textContent = `${summary.military} MILITARY`;
    } else {
      badge.style.display = 'none';
    }
  }

  if (totalCount) totalCount.textContent = `${aviationData.count} AIRCRAFT (BALKAN AIRSPACE)`;
  if (countAll) countAll.textContent = aviationData.count;
  if (countCommercial) countCommercial.textContent = summary.commercial;
  if (countPrivate) countPrivate.textContent = summary.private;
  if (countPrivateJets) countPrivateJets.textContent = summary.privateJets;
  if (countMilitary) countMilitary.textContent = summary.military;
  if (countUnknown) countUnknown.textContent = summary.unknown;

  // Filter aircraft for display
  const currentFilter = state.aviationFilter || 'all';
  const filtered = aircraftList.filter(ac => {
    if (currentFilter === 'all') return true;
    return ac.category === currentFilter;
  });

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state aviation-empty-state">
        <div class="wildfire-state-icon">✈️</div>
        <div class="wildfire-state-title">NO AIRCRAFT IN VIEW</div>
        <div class="wildfire-state-desc">No aircraft found matching category filter: <strong>${escHtml(currentFilter.replace('_', ' '))}</strong></div>
      </div>`;
  } else {
    list.innerHTML = filtered.map(ac => {
      const callsign = ac.callsign || 'N/A';
      const icao = ac.icao24.toUpperCase();
      const cat = ac.category || 'unknown';
      const catLabel = cat.toUpperCase().replace('_', ' ');
      const alt = ac.altitudeFt ? `${ac.altitudeFt.toLocaleString()} ft` : (ac.altitude ? `${ac.altitude} m` : 'N/A');
      const spd = ac.speedKts ? `${ac.speedKts} kts` : (ac.speed ? `${ac.speed} km/h` : 'N/A');
      const hdg = ac.heading !== null ? `${ac.heading}°` : 'N/A';
      const type = ac.aircraftDesc || ac.aircraftType || 'N/A';
      const reg = ac.registration || 'N/A';
      const op = ac.operator || ac.originCountry || 'N/A';
      const time = formatTimeAgo(ac.timestamp);

      return `
        <div class="aviation-item cat-${cat}" onclick="centerMapOnAircraft(${ac.latitude}, ${ac.longitude}, '${ac.icao24}')">
          <div class="aviation-item-header">
            <div>
              <span class="aviation-callsign">${escHtml(callsign)}</span>
              <span class="aviation-icao">${icao}</span>
            </div>
            <span class="aviation-cat-badge cat-${cat}">${escHtml(catLabel)}</span>
          </div>
          <div class="aviation-grid">
            <div class="aviation-cell">
              <span class="aviation-label">Altitude</span>
              <span class="aviation-value">${alt}</span>
            </div>
            <div class="aviation-cell">
              <span class="aviation-label">Speed</span>
              <span class="aviation-value">${spd}</span>
            </div>
            <div class="aviation-cell">
              <span class="aviation-label">Heading</span>
              <span class="aviation-value">${hdg}</span>
            </div>
            <div class="aviation-cell">
              <span class="aviation-label">Type</span>
              <span class="aviation-value" title="${escHtml(type)}">${escHtml(type)}</span>
            </div>
            <div class="aviation-cell">
              <span class="aviation-label">Registration</span>
              <span class="aviation-value">${escHtml(reg)}</span>
            </div>
            <div class="aviation-cell">
              <span class="aviation-label">Updated</span>
              <span class="aviation-value">${time}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Update map markers ONLY if aviation is currently active!
  if (state.activeMapModule === 'aviation') {
    renderAviationMapMarkers(aviationData);
  }
}

function filterAviation(category, btn) {
  document.querySelectorAll('#aviationFilterRow .filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  state.aviationFilter = category;
  if (state.data?.aviation) {
    renderAviation(state.data.aviation);
    if (state.activeMapModule === 'aviation') {
      renderAviationMapMarkers(state.data.aviation);
    }
  }
}

function centerMapOnAircraft(lat, lon, icao24) {
  if (!state.map || typeof lat !== 'number' || typeof lon !== 'number') return;
  state.map.flyTo({
    center: [lon, lat],
    zoom: Math.max(10, state.map.getZoom() || 8),
    duration: 800
  });

  const marker = moduleLayers.aviation.markers.find(m => {
    const lngLat = m.getLngLat();
    return Math.abs(lngLat.lat - lat) < 0.001 && Math.abs(lngLat.lng - lon) < 0.001;
  });
  if (marker) {
    marker.togglePopup();
  }
}

window.filterAviation = filterAviation;
window.centerMapOnAircraft = centerMapOnAircraft;
window.renderAviation = renderAviation;

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

  // Weather is purely map-based: toggle weather markers on map without overlay panel
  if (panelId === 'weatherPanel') {
    if (state.activeMapModule === 'weather') {
      closeModulePanel();
      return;
    }
    ensureMapVisible();
    if (overlay) {
      overlay.querySelectorAll('.overlay-panel').forEach(p => { p.style.display = 'none'; });
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
    }
    document.querySelectorAll('.module-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.panel === 'weatherPanel'));
    setActiveMapModule('weather', state.data);
    return;
  }

  const panel = $(panelId);
  if (!panel) return;

  const panelToModule = {
    'newsPanel': 'news',
    'trafficPanel': 'traffic',
    'radiationPanel': 'radiation',
    'aqiPanel': 'aqi',
    'earthquakePanel': 'earthquake',
    'wildfirePanel': 'wildfire',
    'aviationPanel': 'aviation',
    'telegramPanel': 'telegram',
    'borderPanel': 'border',
    'cctvIntelligencePanel': 'cctv'
  };

  const targetModule = panelToModule[panelId] || null;

  // Toggle OFF if already active
  if (state.activeMapModule === targetModule || state.activeModule === panelId) {
    closeModulePanel();
    return;
  }

  ensureMapVisible();

  // If activating CCTV
  if (panelId === 'cctvIntelligencePanel') {
    if (overlay) {
      overlay.querySelectorAll('.overlay-panel').forEach(p => { p.style.display = 'none'; });
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
    }
    panel.style.display = 'flex';
    const cctvName = $('cctvName');
    if (cctvName) cctvName.textContent = 'CCTV Surveillance';

    document.querySelectorAll('.module-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.panel === panelId));
    setActiveMapModule('cctv', state.data);
    renderCCTVCameraList();
    if (CCTV_CAMERAS.length > 0) {
      openCCTVViewer(currentCCTVCamera || CCTV_CAMERAS[0]);
    }
  } else {
    // If activating an overlay panel
    const cctvPanel = $('cctvIntelligencePanel');
    if (cctvPanel) {
      cctvPanel.style.display = 'none';
      closeCCTVViewer();
    }

    if (overlay) {
      overlay.querySelectorAll('.overlay-panel').forEach(p => { p.style.display = 'none'; });
      panel.style.display = 'flex';
      overlay.classList.add('active');
      const titleEl = $('overlayTitle');
      if (titleEl) titleEl.textContent = panel.dataset.panelTitle || 'Module';
      overlay.setAttribute('aria-hidden', 'false');
    }
    document.querySelectorAll('.module-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.panel === panelId));

    // Atomic module switch
    setActiveMapModule(targetModule, state.data);

    // Async triggers with targetModule guard
    if (targetModule === 'wildfire') {
      window.updateWildfireLayer(state.wildfireFilter);
    } else if (targetModule === 'aviation') {
      if (!state.data?.aviation) {
        const requestModule = 'aviation';
        fetch('/api/aviation')
          .then(res => res.json())
          .then(aviationData => {
            if (state.data) state.data.aviation = aviationData;
            renderAviation(aviationData);
            if (state.activeMapModule === requestModule) {
              renderAviationMapMarkers(aviationData);
            }
          })
          .catch(err => {
            renderAviation({ status: 'UNAVAILABLE', error: err.message });
          });
      }
    } else if (targetModule === 'telegram') {
      if (!state.telegramData) {
        fetchTelegram();
      }
    } else if (targetModule === 'border') {
      if (!state.borderData) {
        fetchBorder();
      }
    }
  }

  if (state.map) {
    setTimeout(() => state.map.resize(), 200);
  }
}

function closeModulePanel() {
  const overlay = $('moduleOverlay');
  if (overlay) {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.querySelectorAll('.overlay-panel').forEach(p => { p.style.display = 'none'; });
  }

  const cctvPanel = $('cctvIntelligencePanel');
  if (cctvPanel) {
    cctvPanel.style.display = 'none';
  }
  closeCCTVViewer();

  setActiveMapModule(null);
  
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
  toggleModule('cctvIntelligencePanel');
}

function closeCCTVModule() {
  closeModulePanel();
}

window.openCCTVModule = openCCTVModule;
window.closeCCTVModule = closeCCTVModule;

function renderCCTVMarkers() {
  renderCCTVMapMarkers();
}

function renderCCTVMapMarkers() {
  if (!state.map || state.activeMapModule !== 'cctv') return;
  clearMarkerList(moduleLayers.cctv.markers);

  CCTV_CAMERAS.forEach(camera => {
    if (!camera.lat || !camera.lon) return;
    const element = createCCTVMarkerElement(camera, state.map);
    const marker = new maplibregl.Marker({ element })
      .setLngLat([camera.lon, camera.lat])
      .addTo(state.map);

    marker._module = 'cctv';
    moduleLayers.cctv.markers.push(marker);
  });

  if (currentCCTVCamera) {
    highlightActiveCCTV(currentCCTVCamera);
  }

  updateMapBadgeAndMeta();
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
        const popupHtml = buildMapPopupHtml({
          icon: '🔥',
          title: 'Wildfire Detection',
          source: 'NASA FIRMS / EONET',
          badge: { text: `${props.confidence || 'HIGH'}% CONF`, color: '#f87171' },
          primary: {
            val: `${(Number(props.frp) || 0).toFixed(1)} MW`,
            sub: 'Fire Radiative Power (FRP)',
            secondary: `Brightness: ${(Number(props.brightness) || 0).toFixed(1)} K`
          },
          stats: [
            { label: 'Satellite', val: props.satellite || 'NASA VIIRS' },
            { label: 'Confidence', val: `${props.confidence || '?'}%` },
            { label: 'Acq. Date', val: props.acq_date || 'Live' },
            { label: 'Acq. Time', val: props.acq_time ? formatHour(props.acq_time) : 'UTC' }
          ],
          footer: `COORDINATES: ${Number(props.lat)?.toFixed(4)}, ${Number(props.lon)?.toFixed(4)}`
        });
        openMapPopup(e.lngLat, popupHtml);
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
        const color = { normal: '#34d399', elevated: '#fbbf24', high: '#fb923c', critical: '#f87171' }[props.status] || '#94a3b8';
        const popupHtml = buildMapPopupHtml({
          icon: '☢️',
          title: props.name || 'Radiation Station',
          source: 'EURDEP Sensor Network',
          badge: { text: (props.status || 'NORMAL').toUpperCase(), color },
          primary: {
            val: `${props.usvh != null ? Number(props.usvh).toFixed(3) : 'N/A'} µSv/h`,
            sub: 'Ambient Dose Rate'
          },
          stats: [
            { label: 'Station', val: props.name },
            { label: 'Status', val: (props.status || 'NORMAL').toUpperCase(), color },
            { label: 'Radiation', val: `${props.usvh} µSv/h` }
          ]
        });
        openMapPopup(e.lngLat, popupHtml);
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

  const coords = data.weather?.coordinates || DEFAULT_MAP_CENTER;
  const centerPoint = [coords.lon, coords.lat];

  const shouldShowKosovoView = state.currentLocation.toLowerCase().includes('kosovo') || (data.location && data.location.toLowerCase().includes('kosovo'));
  if (shouldShowKosovoView) {
    state.map.fitBounds(DEFAULT_KOSOVO_BOUNDS, { padding: 60, duration: 800 });
    state.map.setPitch(35);
  } else {
    state.map.easeTo({ center: centerPoint, zoom: 11, pitch: 35, duration: 800 });
  }

  // Only render layer for the currently active map module
  if (state.activeMapModule && moduleLayers[state.activeMapModule]) {
    moduleLayers[state.activeMapModule].render(data);
  } else {
    clearAllModuleLayers();
  }
  
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

/* ═══════════════════════════════════════════════════════════════════════════
   CENTRAL ALERT LOG & MULTI-MODULE AGGREGATOR
   ═══════════════════════════════════════════════════════════════════════════ */

const ALERT_THRESHOLDS = {
  news: {
    criticalScore: 9, // intensityScore >= 9 -> CRITICAL
    highScore: 7,     // intensityScore >= 7 or isSecurityIncident -> HIGH
    mediumScore: 5    // intensityScore >= 5 (security/military/unrest) -> MEDIUM
  },
  weather: {
    tempExtremeHigh: 38, // > 38°C -> HIGH
    tempExtremeLow: -10, // < -10°C -> HIGH
    windSevere: 60,      // > 60 km/h -> HIGH
    windHigh: 45,        // > 45 km/h -> MEDIUM
    severeTypes: ['THUNDERSTORM', 'EXTREME_WIND', 'BLIZZARD', 'HEAVY_STORM']
  },
  traffic: {
    anomaly: true,       // anomalyDetected -> HIGH
    severeCount: 3       // >= 3 incidents -> MEDIUM
  },
  radiation: {
    criticalUsvh: 0.50,  // > 0.50 µSv/h -> CRITICAL
    highUsvh: 0.30,      // > 0.30 µSv/h -> HIGH
    elevatedUsvh: 0.20   // > 0.20 µSv/h -> MEDIUM
  },
  aqi: {
    extremeEAQI: 100,    // EAQI > 100 -> CRITICAL
    veryPoorEAQI: 80,    // EAQI > 80 or 'Very Poor' -> HIGH
    poorEAQI: 60         // EAQI > 60 or 'Poor'/'Unhealthy' -> MEDIUM
  },
  seismic: {
    criticalMag: 5.0,    // M >= 5.0 -> CRITICAL
    highMag: 4.0,        // M >= 4.0 -> HIGH
    mediumMag: 3.2,      // M >= 3.2 (< 300 km) -> MEDIUM
    infoMag: 3.0         // M >= 3.0 -> INFO
  },
  wildfire: {
    criticalDistKm: 100, // < 100 km from Kosovo -> CRITICAL
    highDistKm: 250,     // < 250 km -> HIGH
    mediumDistKm: 500,   // In Balkan region -> MEDIUM
    minConfidence: 50    // Sat confidence >= 50%
  },
  border: {
    criticalWaitMin: 180, // >= 180 min -> CRITICAL
    highWaitMin: 60,      // >= 60 min or queue >= 500m -> HIGH
    mediumWaitMin: 30,    // >= 30 min or queue >= 200m -> MEDIUM
    queueHighMeters: 500,
    queueMediumMeters: 200
  },
  telegram: {
    criticalScore: 9,    // Threat score >= 9 -> CRITICAL
    highScore: 7         // Threat score >= 7 or security alert -> HIGH
  }
};

const SEVERITY_WEIGHT = {
  'CRITICAL': 5,
  'HIGH': 4,
  'MEDIUM': 3,
  'LOW': 2,
  'INFO': 1
};

function genFrontendAlertId(module, key) {
  const cleanKey = String(key || '').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 40);
  return `alert-${module}-${cleanKey}`;
}

/**
 * Aggregates alerts across all 10 intelligence modules from already available data
 */
function buildAlerts(statusData = state.data, borderData = state.borderData, telegramData = state.telegramData) {
  const alerts = [];
  const now = new Date().toISOString();
  const location = statusData?.location || state.currentLocation || 'Kosovo';

  // 1. NEWS
  const news = statusData?.news;
  if (news?.items && Array.isArray(news.items)) {
    news.items.forEach(item => {
      let severity = null;
      if (item.intensityScore >= ALERT_THRESHOLDS.news.criticalScore || item.threatLevel === 'critical') {
        severity = 'CRITICAL';
      } else if (item.intensityScore >= ALERT_THRESHOLDS.news.highScore || item.isSecurityIncident) {
        severity = 'HIGH';
      } else if (item.intensityScore >= ALERT_THRESHOLDS.news.mediumScore && (item.category === 'security' || item.category === 'civil_unrest' || item.category === 'military' || item.category === 'border')) {
        severity = 'MEDIUM';
      }
      if (severity) {
        alerts.push({
          id: genFrontendAlertId('news', item.url || item.title),
          module: 'news',
          panelId: 'newsPanel',
          type: 'SECURITY_EVENT',
          severity,
          title: item.title,
          message: item.description || item.title,
          timestamp: item.publishedAt || now,
          source: item.source || 'News Intelligence',
          sourceUrl: item.url || '#',
          location,
          value: item.intensityScore,
          threshold: `score >= ${severity === 'CRITICAL' ? 9 : severity === 'HIGH' ? 7 : 5}`,
          isCached: false
        });
      }
    });
  }

  // 2. WEATHER
  const weather = statusData?.weather;
  if (weather && weather.status !== 'UNAVAILABLE') {
    if (weather.alerts && Array.isArray(weather.alerts)) {
      weather.alerts.forEach(a => {
        const severity = (a.severity === 'high' || ALERT_THRESHOLDS.weather.severeTypes.includes(a.type)) ? 'HIGH' : 'MEDIUM';
        alerts.push({
          id: genFrontendAlertId('weather', a.type),
          module: 'weather',
          panelId: 'weatherPanel',
          type: 'WEATHER_ALERT',
          severity,
          title: `Weather Alert: ${a.type.replace(/_/g, ' ')}`,
          message: a.message || a.description || 'Severe weather condition reported',
          timestamp: now,
          source: weather.source || 'Open-Meteo',
          location,
          isCached: Boolean(weather.isCached)
        });
      });
    }

    if (weather.current) {
      const { temp, windSpeed } = weather.current;
      if (typeof temp === 'number' && temp >= ALERT_THRESHOLDS.weather.tempExtremeHigh) {
        alerts.push({
          id: genFrontendAlertId('weather', 'extreme_heat'),
          module: 'weather',
          panelId: 'weatherPanel',
          type: 'EXTREME_HEAT',
          severity: 'HIGH',
          title: `Extreme Heat Warning (${temp}°C)`,
          message: `${temp}°C recorded in ${location} — heat advisory`,
          timestamp: now,
          source: weather.source || 'Open-Meteo',
          location,
          value: temp,
          threshold: `>= ${ALERT_THRESHOLDS.weather.tempExtremeHigh}°C`,
          isCached: Boolean(weather.isCached)
        });
      } else if (typeof temp === 'number' && temp <= ALERT_THRESHOLDS.weather.tempExtremeLow) {
        alerts.push({
          id: genFrontendAlertId('weather', 'extreme_freeze'),
          module: 'weather',
          panelId: 'weatherPanel',
          type: 'EXTREME_FREEZE',
          severity: 'HIGH',
          title: `Extreme Freeze Warning (${temp}°C)`,
          message: `${temp}°C recorded in ${location} — frost/freeze advisory`,
          timestamp: now,
          source: weather.source || 'Open-Meteo',
          location,
          value: temp,
          threshold: `<= ${ALERT_THRESHOLDS.weather.tempExtremeLow}°C`,
          isCached: Boolean(weather.isCached)
        });
      }

      if (typeof windSpeed === 'number' && windSpeed >= ALERT_THRESHOLDS.weather.windSevere) {
        alerts.push({
          id: genFrontendAlertId('weather', 'gale_wind'),
          module: 'weather',
          panelId: 'weatherPanel',
          type: 'SEVERE_WIND',
          severity: 'HIGH',
          title: `Severe Gale Wind Alert (${windSpeed} km/h)`,
          message: `Strong wind gusts up to ${windSpeed} km/h detected in area`,
          timestamp: now,
          source: weather.source || 'Open-Meteo',
          location,
          value: windSpeed,
          threshold: `>= ${ALERT_THRESHOLDS.weather.windSevere} km/h`,
          isCached: Boolean(weather.isCached)
        });
      }
    }
  }

  // 3. TRAFFIC
  const traffic = statusData?.traffic;
  if (traffic && traffic.status !== 'UNAVAILABLE') {
    if (traffic.anomalyDetected) {
      alerts.push({
        id: genFrontendAlertId('traffic', 'anomaly'),
        module: 'traffic',
        panelId: 'trafficPanel',
        type: 'TRAFFIC_ANOMALY',
        severity: 'HIGH',
        title: `Traffic Anomaly: ${traffic.anomalyType || 'Disruption'}`,
        message: traffic.anomalySummary || 'Abnormal movement or corridor closure detected',
        timestamp: now,
        source: traffic.source || 'Traffic Intelligence',
        location,
        isCached: Boolean(traffic.isCached)
      });
    } else if (traffic.incidents && traffic.incidents.length >= ALERT_THRESHOLDS.traffic.severeCount) {
      alerts.push({
        id: genFrontendAlertId('traffic', 'multiple_incidents'),
        module: 'traffic',
        panelId: 'trafficPanel',
        type: 'TRAFFIC_CONGESTION',
        severity: 'MEDIUM',
        title: 'Multiple Road Incidents',
        message: `${traffic.incidents.length} traffic disruptions reported across key corridors`,
        timestamp: now,
        source: traffic.source || 'Traffic Intelligence',
        location,
        value: traffic.incidents.length,
        threshold: `>= ${ALERT_THRESHOLDS.traffic.severeCount} incidents`,
        isCached: Boolean(traffic.isCached)
      });
    }
  }

  // 4. RADIATION
  const radiation = statusData?.radiation;
  if (radiation?.primary && radiation.status !== 'UNAVAILABLE') {
    const s = radiation.primary.status;
    const usvh = typeof radiation.primary.usvh === 'number' ? radiation.primary.usvh : 0;
    if (s === 'critical' || usvh >= ALERT_THRESHOLDS.radiation.criticalUsvh) {
      alerts.push({
        id: genFrontendAlertId('radiation', 'primary_critical'),
        module: 'radiation',
        panelId: 'radiationPanel',
        type: 'RADIATION_CRITICAL',
        severity: 'CRITICAL',
        title: 'CRITICAL Radiation Level',
        message: `${usvh} µSv/h detected at ${radiation.primary.sensorName || 'Station'} — immediate attention required`,
        timestamp: now,
        source: radiation.source || 'EURDEP',
        location: radiation.primary.sensorName || location,
        coordinates: { lat: radiation.primary.lat, lon: radiation.primary.lon },
        value: usvh,
        threshold: `>= ${ALERT_THRESHOLDS.radiation.criticalUsvh} µSv/h`,
        isCached: Boolean(radiation.isCached)
      });
    } else if (s === 'high' || usvh >= ALERT_THRESHOLDS.radiation.highUsvh) {
      alerts.push({
        id: genFrontendAlertId('radiation', 'primary_high'),
        module: 'radiation',
        panelId: 'radiationPanel',
        type: 'RADIATION_HIGH',
        severity: 'HIGH',
        title: 'High Radiation Level',
        message: `${usvh} µSv/h detected at ${radiation.primary.sensorName || 'Station'} — above alert threshold`,
        timestamp: now,
        source: radiation.source || 'EURDEP',
        location: radiation.primary.sensorName || location,
        coordinates: { lat: radiation.primary.lat, lon: radiation.primary.lon },
        value: usvh,
        threshold: `>= ${ALERT_THRESHOLDS.radiation.highUsvh} µSv/h`,
        isCached: Boolean(radiation.isCached)
      });
    } else if (s === 'elevated' || usvh >= ALERT_THRESHOLDS.radiation.elevatedUsvh) {
      alerts.push({
        id: genFrontendAlertId('radiation', 'primary_elevated'),
        module: 'radiation',
        panelId: 'radiationPanel',
        type: 'RADIATION_ELEVATED',
        severity: 'MEDIUM',
        title: 'Elevated Radiation Level',
        message: `${usvh} µSv/h detected at ${radiation.primary.sensorName || 'Station'} — monitoring advised`,
        timestamp: now,
        source: radiation.source || 'EURDEP',
        location: radiation.primary.sensorName || location,
        coordinates: { lat: radiation.primary.lat, lon: radiation.primary.lon },
        value: usvh,
        threshold: `>= ${ALERT_THRESHOLDS.radiation.elevatedUsvh} µSv/h`,
        isCached: Boolean(radiation.isCached)
      });
    }

    (radiation.neighbors || []).forEach(n => {
      const nUsvh = typeof n.usvh === 'number' ? n.usvh : 0;
      if (n.status === 'critical' || nUsvh >= ALERT_THRESHOLDS.radiation.criticalUsvh) {
        alerts.push({
          id: genFrontendAlertId('radiation', `neighbor_${n.name}_critical`),
          module: 'radiation',
          panelId: 'radiationPanel',
          type: 'RADIATION_REGIONAL',
          severity: 'CRITICAL',
          title: `Regional CRITICAL Radiation — ${n.name}`,
          message: `${n.name} sensor: ${nUsvh} µSv/h`,
          timestamp: now,
          source: radiation.source || 'EURDEP',
          location: n.name,
          coordinates: { lat: n.lat, lon: n.lon },
          value: nUsvh,
          isCached: Boolean(radiation.isCached)
        });
      } else if (n.status === 'high' || nUsvh >= ALERT_THRESHOLDS.radiation.highUsvh) {
        alerts.push({
          id: genFrontendAlertId('radiation', `neighbor_${n.name}_high`),
          module: 'radiation',
          panelId: 'radiationPanel',
          type: 'RADIATION_REGIONAL',
          severity: 'HIGH',
          title: `Regional High Radiation — ${n.name}`,
          message: `${n.name} sensor: ${nUsvh} µSv/h`,
          timestamp: now,
          source: radiation.source || 'EURDEP',
          location: n.name,
          coordinates: { lat: n.lat, lon: n.lon },
          value: nUsvh,
          isCached: Boolean(radiation.isCached)
        });
      }
    });
  }

  // 5. AQI
  const aqi = statusData?.aqi;
  if (aqi?.current && aqi.status !== 'UNAVAILABLE') {
    const eaqi = typeof aqi.current.eaqi === 'number' ? aqi.current.eaqi : 0;
    const pm25 = aqi.current.pm25;
    const pm10 = aqi.current.pm10;
    const label = aqi.current.label || '';

    if (eaqi >= ALERT_THRESHOLDS.aqi.extremeEAQI || label === 'Hazardous' || label === 'Extreme') {
      alerts.push({
        id: genFrontendAlertId('aqi', 'hazardous'),
        module: 'aqi',
        panelId: 'aqiPanel',
        type: 'AIR_QUALITY_CRITICAL',
        severity: 'CRITICAL',
        title: `Hazardous Air Quality (EAQI ${eaqi})`,
        message: `PM2.5: ${pm25} µg/m³ · PM10: ${pm10} µg/m³ · Hazardous health alert`,
        timestamp: now,
        source: aqi.source || 'Open-Meteo AQI',
        location,
        value: eaqi,
        threshold: `>= ${ALERT_THRESHOLDS.aqi.extremeEAQI}`,
        isCached: Boolean(aqi.isCached)
      });
    } else if (eaqi >= ALERT_THRESHOLDS.aqi.veryPoorEAQI || label === 'Very Poor' || label === 'Very Unhealthy') {
      alerts.push({
        id: genFrontendAlertId('aqi', 'very_poor'),
        module: 'aqi',
        panelId: 'aqiPanel',
        type: 'AIR_QUALITY_HIGH',
        severity: 'HIGH',
        title: `Very Poor Air Quality (EAQI ${eaqi})`,
        message: `PM2.5: ${pm25} µg/m³ · Respiratory precautions recommended`,
        timestamp: now,
        source: aqi.source || 'Open-Meteo AQI',
        location,
        value: eaqi,
        threshold: `>= ${ALERT_THRESHOLDS.aqi.veryPoorEAQI}`,
        isCached: Boolean(aqi.isCached)
      });
    } else if (eaqi >= ALERT_THRESHOLDS.aqi.poorEAQI || label === 'Poor' || label === 'Unhealthy') {
      alerts.push({
        id: genFrontendAlertId('aqi', 'poor'),
        module: 'aqi',
        panelId: 'aqiPanel',
        type: 'AIR_QUALITY_MEDIUM',
        severity: 'MEDIUM',
        title: `Unhealthy Air Quality (EAQI ${eaqi})`,
        message: `PM2.5: ${pm25} µg/m³ · Sensitive groups should limit outdoor exertion`,
        timestamp: now,
        source: aqi.source || 'Open-Meteo AQI',
        location,
        value: eaqi,
        threshold: `>= ${ALERT_THRESHOLDS.aqi.poorEAQI}`,
        isCached: Boolean(aqi.isCached)
      });
    }
  }

  // 6. SEISMIC (Earthquakes)
  const earthquakes = statusData?.earthquakes;
  if (earthquakes?.events && Array.isArray(earthquakes.events) && earthquakes.status !== 'UNAVAILABLE') {
    earthquakes.events.forEach(ev => {
      const mag = typeof ev.mag === 'number' ? ev.mag : 0;
      if (mag >= ALERT_THRESHOLDS.seismic.infoMag) {
        let severity = 'INFO';
        if (mag >= ALERT_THRESHOLDS.seismic.criticalMag) severity = 'CRITICAL';
        else if (mag >= ALERT_THRESHOLDS.seismic.highMag) severity = 'HIGH';
        else if (mag >= ALERT_THRESHOLDS.seismic.mediumMag) severity = 'MEDIUM';

        alerts.push({
          id: genFrontendAlertId('earthquake', ev.id || `${ev.lat}_${ev.lon}_${mag}`),
          module: 'earthquake',
          panelId: 'earthquakePanel',
          type: 'SEISMIC_EVENT',
          severity,
          title: `M${mag.toFixed(1)} Earthquake · ${ev.place || 'Regional Event'}`,
          message: `Depth ${ev.depth || 10}km${ev.distanceKm ? ` · ${ev.distanceKm} km from Kosovo` : ''}`,
          timestamp: ev.time ? new Date(ev.time).toISOString() : now,
          source: earthquakes.source || 'USGS / EMSC',
          location: ev.place || 'Balkans',
          coordinates: { lat: ev.lat, lon: ev.lon },
          value: mag,
          threshold: `>= M${ALERT_THRESHOLDS.seismic.infoMag}`,
          isCached: Boolean(earthquakes.isCached)
        });
      }
    });
  }

  // 7. WILDFIRE (only on real satellite detections)
  const wildfire = statusData?.wildfire;
  if (wildfire?.detections && Array.isArray(wildfire.detections) && wildfire.status === 'LIVE_DATA') {
    wildfire.detections.forEach(d => {
      const conf = typeof d.confidence === 'number' ? d.confidence : 50;
      const dist = typeof d.distanceKm === 'number' ? d.distanceKm : 999;
      if (conf >= ALERT_THRESHOLDS.wildfire.minConfidence) {
        let severity = 'MEDIUM';
        if (dist <= ALERT_THRESHOLDS.wildfire.criticalDistKm) severity = 'CRITICAL';
        else if (dist <= ALERT_THRESHOLDS.wildfire.highDistKm) severity = 'HIGH';

        const distText = dist < 999 ? `${dist} km from Kosovo` : 'Balkan region';
        alerts.push({
          id: genFrontendAlertId('wildfire', d.id || `${d.lat}_${d.lon}`),
          module: 'wildfire',
          panelId: 'wildfirePanel',
          type: 'WILDFIRE_DETECTION',
          severity,
          title: dist <= ALERT_THRESHOLDS.wildfire.criticalDistKm ? `Proximate Wildfire (${distText})` : `Wildfire Detected (${distText})`,
          message: `${d.title || 'Thermal anomaly'} · Sat: ${d.satellite || 'VIIRS/MODIS'} · ${conf}% Conf`,
          timestamp: d.acq_date ? `${d.acq_date}T${(d.acq_time || '1200').padStart(4, '0').slice(0, 2)}:${(d.acq_time || '1200').padStart(4, '0').slice(2, 4)}:00Z` : now,
          source: wildfire.source || 'NASA Satellites',
          sourceUrl: d.sourceUrl || wildfire.sourceUrl || '#',
          location: d.title || `Lat: ${d.lat.toFixed(2)}, Lon: ${d.lon.toFixed(2)}`,
          coordinates: { lat: d.lat, lon: d.lon },
          value: conf,
          isCached: Boolean(wildfire.isCached || d.isCached)
        });
      }
    });
  }

  // 8. BORDER CROSSINGS
  const borders = borderData || statusData?.borders;
  if (borders?.crossings && Array.isArray(borders.crossings) && borders.status !== 'UNAVAILABLE') {
    borders.crossings.forEach(c => {
      const entryWait = c.entryWaitMin || 0;
      const exitWait = c.exitWaitMin || 0;
      const entryQ = c.entryQueueMeters || (c.entryCars ? c.entryCars * 8 : 0);
      const exitQ = c.exitQueueMeters || (c.exitCars ? c.exitCars * 8 : 0);
      const maxWait = Math.max(entryWait, exitWait);
      const maxQ = Math.max(entryQ, exitQ);

      if (maxWait >= ALERT_THRESHOLDS.border.mediumWaitMin || maxQ >= ALERT_THRESHOLDS.border.queueMediumMeters) {
        let severity = 'MEDIUM';
        if (maxWait >= ALERT_THRESHOLDS.border.criticalWaitMin) severity = 'CRITICAL';
        else if (maxWait >= ALERT_THRESHOLDS.border.highWaitMin || maxQ >= ALERT_THRESHOLDS.border.queueHighMeters) severity = 'HIGH';

        const dir = entryWait >= exitWait ? 'ENTRY' : 'EXIT';
        const waitVal = dir === 'ENTRY' ? entryWait : exitWait;
        const qVal = dir === 'ENTRY' ? entryQ : exitQ;
        const carsVal = dir === 'ENTRY' ? c.entryCars : c.exitCars;
        const qStr = qVal > 0 ? `Queue: ${qVal}m` : (carsVal ? `Queue: ${carsVal} vehicles` : 'Heavy congestion');

        alerts.push({
          id: genFrontendAlertId('border', `${c.id || c.name}_${dir.toLowerCase()}`),
          module: 'border',
          panelId: 'borderPanel',
          type: 'BORDER_DELAY',
          severity,
          title: `${c.name} ${dir} · ${waitVal} min wait`,
          message: `${qStr} · Severe delay at border crossing point`,
          timestamp: borders.updatedAt || now,
          source: borders.source || 'Border Monitor (Nakordoni/QKMK)',
          location: c.name,
          coordinates: { lat: c.lat, lon: c.lon },
          value: waitVal,
          threshold: `>= ${ALERT_THRESHOLDS.border.mediumWaitMin} min`,
          isCached: Boolean(borders.isCached || c.isCached)
        });
      }
    });
  }

  // 9. TELEGRAM
  const telegram = telegramData || statusData?.telegram;
  if (telegram?.posts && Array.isArray(telegram.posts) && telegram.status !== 'UNAVAILABLE') {
    telegram.posts.forEach(p => {
      const score = typeof p.threatScore === 'number' ? p.threatScore : 0;
      if (score >= ALERT_THRESHOLDS.telegram.highScore || p.isSecurityAlert) {
        const severity = score >= ALERT_THRESHOLDS.telegram.criticalScore ? 'CRITICAL' : 'HIGH';
        alerts.push({
          id: genFrontendAlertId('telegram', `${p.channel}_${p.id}`),
          module: 'telegram',
          panelId: 'telegramPanel',
          type: 'TELEGRAM_INTEL',
          severity,
          title: `[Telegram @${p.channel}] Intelligence Alert`,
          message: p.text ? p.text.slice(0, 140) : 'Security-relevant channel publication',
          timestamp: p.date ? new Date(p.date * 1000).toISOString() : now,
          source: `@${p.channel} (Telegram)`,
          location,
          value: score,
          threshold: `>= ${ALERT_THRESHOLDS.telegram.highScore}`,
          isCached: Boolean(telegram.isCached)
        });
      }
    });
  }

  // 10. AVIATION
  const aviation = statusData?.aviation;
  if (aviation && aviation.status !== 'UNAVAILABLE') {
    if (aviation.anomalyDetected) {
      alerts.push({
        id: genFrontendAlertId('aviation', 'anomaly'),
        module: 'aviation',
        panelId: 'aviationPanel',
        type: 'AVIATION_ANOMALY',
        severity: 'HIGH',
        title: 'Aviation Anomaly / Squawk Detected',
        message: aviation.anomalySummary || 'Unusual flight pattern or emergency transponder detected',
        timestamp: now,
        source: aviation.source || 'ADS-B Network',
        location,
        isCached: Boolean(aviation.isCached)
      });
    }
  }

  return alerts;
}

/**
 * Main entrypoint for accumulating, deduplicating, sorting and rendering alerts
 */
function aggregateAndRenderAlerts(statusData = state.data, borderData = state.borderData, telegramData = state.telegramData) {
  if (!state.alertStore) {
    state.alertStore = new Map();
  }

  const freshAlerts = buildAlerts(statusData, borderData, telegramData);

  // Merge into state.alertStore with deduplication & stability
  freshAlerts.forEach(a => {
    if (state.alertStore.has(a.id)) {
      const existing = state.alertStore.get(a.id);
      const shouldUnread = (SEVERITY_WEIGHT[a.severity] || 0) > (SEVERITY_WEIGHT[existing.severity] || 0);
      state.alertStore.set(a.id, {
        ...existing,
        ...a,
        read: shouldUnread ? false : existing.read,
        timestamp: a.timestamp || existing.timestamp
      });
    } else {
      state.alertStore.set(a.id, {
        ...a,
        read: false
      });
    }
  });

  // Convert to array and sort by severity descending, then timestamp descending
  const allAlerts = Array.from(state.alertStore.values());
  allAlerts.sort((a, b) => {
    const sDiff = (SEVERITY_WEIGHT[b.severity] || 0) - (SEVERITY_WEIGHT[a.severity] || 0);
    if (sDiff !== 0) return sDiff;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Cap alerts list at 40
  const cappedAlerts = allAlerts.slice(0, 40);
  state.alertStore = new Map(cappedAlerts.map(a => [a.id, a]));

  renderAlertLog(cappedAlerts);
}

function renderAlertLog(alerts = []) {
  const log = $('alertLog');
  const badge = $('unreadBadge');
  if (!log) return;

  const unreadCount = alerts.filter(a => !a.read).length;
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }

  if (!alerts || alerts.length === 0) {
    log.innerHTML = '<div class="empty-state">No active alerts · All systems normal</div>';
    return;
  }

  log.innerHTML = alerts.map(a => {
    const sev = (a.severity || 'INFO').toUpperCase();
    const sevClass = sev.toLowerCase();
    const isUnread = !a.read;
    const timeAgo = formatTimeAgo(a.timestamp);
    const cachedTag = a.isCached ? '<span class="alert-cached-tag">CACHED</span>' : '';
    const moduleName = (a.module || 'SYSTEM').toUpperCase();

    return `
      <div class="alert-log-item severity-${sevClass} ${isUnread ? 'unread' : ''}" 
           onclick="handleAlertClick('${escHtml(a.id)}')" 
           title="Click to open ${escHtml(moduleName)} module">
        <div class="alert-log-header">
          <span class="alert-sev-tag sev-${sevClass}">[${sev}]</span>
          <span class="alert-module-tag">${escHtml(moduleName)}</span>
          ${cachedTag}
          <span class="alert-log-time">${escHtml(timeAgo)}</span>
        </div>
        <div class="alert-log-title">${escHtml(a.title)}</div>
        ${a.message && a.message !== a.title ? `<div class="alert-log-msg">${escHtml(a.message)}</div>` : ''}
        <div class="alert-log-footer">
          <span class="alert-log-source">${escHtml(a.source || '')}</span>
          <span class="alert-log-nav">→ ${escHtml(moduleName)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function handleAlertClick(alertId) {
  if (!state.alertStore || !state.alertStore.has(alertId)) return;
  const alert = state.alertStore.get(alertId);
  
  // Mark clicked alert as read
  alert.read = true;
  state.alertStore.set(alertId, alert);
  renderAlertLog(Array.from(state.alertStore.values()));

  // Focus map on coordinates if available
  if (alert.coordinates && typeof alert.coordinates.lat === 'number' && typeof alert.coordinates.lon === 'number' && state.map) {
    try {
      state.map.flyTo({
        center: [alert.coordinates.lon, alert.coordinates.lat],
        zoom: 10,
        essential: true
      });
    } catch (e) {}
  }

  // Open corresponding module panel
  if (alert.panelId) {
    if (state.activeModule !== alert.panelId) {
      toggleModule(alert.panelId);
    }
  }
}

async function loadAlertHistory() {
  try {
    const { alerts } = await fetch('/api/alerts').then(r => r.json());
    if (Array.isArray(alerts) && alerts.length > 0) {
      if (!state.alertStore) state.alertStore = new Map();
      alerts.forEach(a => {
        const mod = a.module || a.category || 'news';
        const normAlert = {
          id: a.id || `alert-legacy-${Math.random().toString(36).slice(2)}`,
          module: mod,
          panelId: a.panelId || `${mod}Panel`,
          type: a.type || 'SYSTEM_ALERT',
          severity: (a.severity || 'INFO').toUpperCase(),
          title: a.title,
          message: a.message || a.title,
          timestamp: a.timestamp || new Date().toISOString(),
          source: a.source || 'Alert Log',
          sourceUrl: a.sourceUrl || a.url || '#',
          location: a.location || 'Kosovo',
          read: Boolean(a.read),
          isCached: Boolean(a.isCached)
        };
        if (!state.alertStore.has(normAlert.id)) {
          state.alertStore.set(normAlert.id, normAlert);
        }
      });
    }
  } catch (e) {}
  aggregateAndRenderAlerts();
}

async function markAllRead() {
  if (state.alertStore) {
    for (const [id, a] of state.alertStore.entries()) {
      a.read = true;
      state.alertStore.set(id, a);
    }
    renderAlertLog(Array.from(state.alertStore.values()));
  }
  await fetch('/api/alerts/read', { method: 'POST' }).catch(() => {});
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

/* ═══════════════════════════════════════════════════════════════════════════
   TELEGRAM FEED MODULE (Read-Only Public Feed)
   ═══════════════════════════════════════════════════════════════════════════ */

async function fetchTelegram(forceRefresh = false) {
  try {
    const url = `/api/telegram${forceRefresh ? '?forceRefresh=true' : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.telegramData = data;
    renderTelegram(data);
    aggregateAndRenderAlerts(state.data, state.borderData, data);
    return data;
  } catch (err) {
    console.warn('[telegram] Fetch error:', err.message);
    const errData = {
      skill: 'telegram-monitor',
      status: 'UNAVAILABLE',
      source: 'Telegram Official API',
      updatedAt: new Date().toISOString(),
      channels: ['koridorsrb', 'srpskinat', 'istokinfo'],
      count: 0,
      posts: [],
      error: err.message || 'Failed to connect to Telegram feed'
    };
    state.telegramData = errData;
    renderTelegram(errData);
    return errData;
  }
}

function filterTelegram(channel, btn) {
  state.telegramFilter = channel || 'all';
  const filterRow = $('telegramFilterRow');
  if (filterRow) {
    filterRow.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  }
  if (btn) {
    btn.classList.add('active');
  }
  renderTelegram(state.telegramData);
}

function renderTelegram(telegramData) {
  const list = $('telegramList');
  const meta = $('telegramMeta');
  const badge = $('telegramBadge');
  const summaryText = $('telegramSummaryText');

  if (!list) return;

  if (!telegramData) {
    list.innerHTML = '<div class="empty-state">Loading Telegram public feed...</div>';
    if (meta) meta.textContent = 'OFFICIAL API · READ-ONLY';
    if (badge) badge.style.display = 'none';
    return;
  }

  // 1. NOT CONFIGURED State
  if (telegramData.status === 'NOT_CONFIGURED') {
    list.innerHTML = `
      <div class="empty-state telegram-state-card not-configured">
        <div class="state-icon">📱</div>
        <div class="state-title">TELEGRAM API NOT CONFIGURED</div>
        <div class="state-desc">${escHtml(telegramData.message || 'Set TELEGRAM_API_ID & TELEGRAM_API_HASH (or TELEGRAM_BOT_TOKEN) in your environment.')}</div>
        <div class="telegram-config-hint">
          <code>TELEGRAM_API_ID=...</code><br/>
          <code>TELEGRAM_API_HASH=...</code><br/>
          <code>TELEGRAM_CHANNELS=koridorsrb,srpskinat,istokinfo</code>
        </div>
      </div>`;
    if (meta) meta.textContent = 'NOT CONFIGURED';
    if (badge) badge.style.display = 'none';
    if (summaryText) summaryText.textContent = 'CREDENTIALS REQUIRED (ENV)';
    return;
  }

  // 2. UNAVAILABLE State
  if (telegramData.status === 'UNAVAILABLE' || telegramData.error) {
    list.innerHTML = `
      <div class="error-state telegram-state-card unavailable">
        <div class="state-icon">⚠️</div>
        <div class="state-title">TELEGRAM FEED UNAVAILABLE</div>
        <div class="state-desc">${escHtml(telegramData.message || telegramData.error || 'Unable to reach Telegram official services.')}</div>
      </div>`;
    if (meta) meta.textContent = 'UNAVAILABLE';
    if (badge) badge.style.display = 'none';
    if (summaryText) summaryText.textContent = 'SERVICE UNREACHABLE';
    return;
  }

  // 3. INVALID_DATA State
  if (telegramData.status === 'INVALID_DATA') {
    list.innerHTML = `
      <div class="error-state telegram-state-card invalid">
        <div class="state-icon">❌</div>
        <div class="state-title">INVALID CHANNEL DATA</div>
        <div class="state-desc">${escHtml(telegramData.message || telegramData.error || 'Configured channels could not be resolved.')}</div>
      </div>`;
    if (meta) meta.textContent = 'INVALID DATA';
    if (badge) badge.style.display = 'none';
    if (summaryText) summaryText.textContent = 'CHANNEL ERROR';
    return;
  }

  const posts = Array.isArray(telegramData.posts) ? telegramData.posts : [];
  const currentFilter = state.telegramFilter || 'all';

  const filtered = posts.filter(p => {
    if (currentFilter === 'all') return true;
    const ch = (p.channelUsername || p.channel || '').replace(/^@/, '').toLowerCase();
    return ch === currentFilter.toLowerCase();
  });

  if (meta) {
    meta.textContent = `LIVE · ${formatTimeAgo(telegramData.updatedAt)}`;
  }

  if (badge) {
    if (posts.length > 0) {
      badge.style.display = '';
      badge.className = 'panel-badge badge-primary';
      badge.textContent = `${posts.length} POSTS`;
    } else {
      badge.style.display = 'none';
    }
  }

  if (summaryText) {
    const chList = (telegramData.channels || ['koridorsrb', 'srpskinat', 'istokinfo']).map(c => `@${c.replace(/^@/, '')}`).join(' · ');
    summaryText.textContent = `PUBLIC CHANNELS: ${chList}`;
  }

  // 4. NO_POSTS State (or filter empty)
  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state telegram-state-card">
        <div class="state-icon">📭</div>
        <div class="state-title">NO POSTS FOUND</div>
        <div class="state-desc">${currentFilter === 'all' ? (telegramData.message || 'No recent messages in the configured channel window.') : `No recent messages for @${escHtml(currentFilter)}.`}</div>
      </div>`;
    return;
  }

  // 5. LIVE_DATA list render
  list.innerHTML = filtered.map(p => {
    const chName = p.channelTitle || p.channel || 'Telegram Channel';
    const chHandle = p.channel || (p.channelUsername ? `@${p.channelUsername}` : '@telegram');
    const timeStr = formatTimeAgo(p.timestamp);
    const postUrl = p.url || `https://t.me/${(p.channelUsername || '').replace(/^@/, '')}/${p.messageId || ''}`;
    const textContent = p.text ? escHtml(p.text).replace(/\n/g, '<br/>') : '<em class="tg-no-text">[Media post / No text]</em>';
    
    let mediaHtml = '';
    if (p.media && p.media.hasMedia) {
      const mType = (p.media.type || 'attachment').toUpperCase();
      const mDesc = p.media.description || `${mType} attachment`;
      const isVideo = p.media.type === 'video' || p.media.type === 'animation';
      const mIcon = p.media.type === 'photo' ? '🖼️' : isVideo ? '🎬' : p.media.type === 'audio' ? '🎵' : p.media.type === 'webpage' ? '🔗' : '📎';
      
      const badgeHtml = `
        <div class="telegram-media-badge media-${escHtml(p.media.type || 'other')}">
          <span class="tg-media-icon">${mIcon}</span>
          <span class="tg-media-label">${escHtml(mDesc)}</span>
        </div>
      `;

      if (p.media.hasPreview && p.media.previewUrl) {
        mediaHtml = `
          <div class="telegram-media-preview-container">
            <a href="${escHtml(postUrl)}" target="_blank" rel="noopener noreferrer" class="telegram-media-preview-link" title="Open on Telegram">
              <img class="telegram-media-img" src="${escHtml(p.media.previewUrl)}" loading="lazy" alt="${escHtml(mDesc)}" onerror="const c = this.closest('.telegram-media-preview-container'); if(c) c.style.display='none'; const b = this.closest('.telegram-post-body')?.querySelector('.telegram-media-fallback-badge'); if(b) b.style.display='inline-flex';" />
              ${isVideo ? '<div class="telegram-video-play-overlay"><span class="telegram-play-icon">▶</span><span class="telegram-video-badge">VIDEO</span></div>' : ''}
            </a>
          </div>
          <div class="telegram-media-fallback-badge" style="display:none;">
            ${badgeHtml}
          </div>
        `;
      } else {
        mediaHtml = badgeHtml;
      }
    }

    let statsHtml = '';
    if (typeof p.views === 'number' || typeof p.forwards === 'number') {
      statsHtml = `
        <div class="telegram-post-stats">
          ${typeof p.views === 'number' ? `<span class="tg-stat" title="Views">👁️ ${p.views.toLocaleString()}</span>` : ''}
          ${typeof p.forwards === 'number' ? `<span class="tg-stat" title="Forwards">🔄 ${p.forwards.toLocaleString()}</span>` : ''}
        </div>
      `;
    }

    return `
      <div class="telegram-post-card">
        <div class="telegram-post-header">
          <div class="telegram-channel-info">
            <span class="telegram-channel-title">${escHtml(chName)}</span>
            <span class="telegram-channel-handle">${escHtml(chHandle)}</span>
          </div>
          <span class="telegram-post-time" title="${escHtml(p.timestamp)}">${escHtml(timeStr)}</span>
        </div>
        <div class="telegram-post-body">
          <div class="telegram-post-text">${textContent}</div>
          ${mediaHtml}
        </div>
        <div class="telegram-post-footer">
          ${statsHtml}
          <a class="telegram-post-link" href="${escHtml(postUrl)}" target="_blank" rel="noopener noreferrer">
            <span>View on Telegram</span> ↗
          </a>
        </div>
      </div>
    `;
  }).join('');
}

// ── BORDER CROSSING MONITOR MODULE ───────────────────────────────────────────
async function fetchBorder(forceRefresh = false) {
  const list = $('borderList');
  const badge = $('borderBadge');
  const meta = $('borderMeta');
  const summaryText = $('borderSummaryText');

  state.borderLoading = true;
  if (!state.borderData && list) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="state-icon">🔄</div>
        <div class="state-title">CONNECTING TO QKMK...</div>
        <div class="state-desc">Querying National Center for Border Management</div>
      </div>`;
  }

  try {
    const url = `/api/borders${forceRefresh ? '?forceRefresh=true' : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.borderData = data;
    renderBorder(data);
    if (state.activeMapModule === 'border') {
      renderBorderMapMarkers(data);
    }
    aggregateAndRenderAlerts(state.data, data, state.telegramData);
  } catch (err) {
    console.error('[app] Failed to fetch border intelligence:', err);
    state.borderData = {
      skill: 'border-monitor',
      status: 'UNAVAILABLE',
      source: 'QKMK',
      count: 0,
      crossings: [],
      error: 'Official border data source could not be reached.',
      message: 'Official border data source could not be reached.'
    };
    renderBorder(state.borderData);
    if (state.activeMapModule === 'border') {
      renderBorderMapMarkers(state.borderData);
    }
  } finally {
    state.borderLoading = false;
  }
}

function renderBorder(borderData) {
  const list = $('borderList');
  const badge = $('borderBadge');
  const meta = $('borderMeta');
  const summaryText = $('borderSummaryText');
  if (!list) return;

  if (!borderData) {
    list.innerHTML = `<div class="empty-state">No border data available.</div>`;
    return;
  }

  const { status, crossings = [], source, sourceUrl, updatedAt, message, error } = borderData;

  // 1. Badge & Meta Header
  if (badge) {
    if (status === 'LIVE_DATA' && crossings.length > 0) {
      badge.style.display = '';
      badge.className = source === 'NAKORDONI' ? 'panel-badge badge-warning' : 'panel-badge badge-primary';
      badge.textContent = source === 'NAKORDONI' ? `${crossings.length} CROSSINGS (NAKORDONI)` : `${crossings.length} CROSSINGS`;
    } else if (status === 'UNAVAILABLE') {
      badge.style.display = '';
      badge.className = 'panel-badge badge-critical';
      badge.textContent = 'UNAVAILABLE';
    } else {
      badge.style.display = 'none';
    }
  }

  if (meta) {
    const timeAgoStr = updatedAt ? formatTimeAgo(updatedAt) : 'Live';
    if (source === 'NAKORDONI') {
      meta.textContent = `SECONDARY SOURCE · NAKORDONI API · UPDATED ${timeAgoStr.toUpperCase()}`;
    } else {
      meta.textContent = status === 'LIVE_DATA' ? `QKMK · UPDATED ${timeAgoStr.toUpperCase()}` : 'OFFICIAL API · READ-ONLY';
    }
  }

  if (summaryText) {
    if (status === 'LIVE_DATA') {
      if (source === 'NAKORDONI') {
        summaryText.innerHTML = `LIVE QUEUES · ${crossings.length} BORDER CROSSINGS · POWERED BY <a href="https://nakordoni.eu/" target="_blank" rel="noopener noreferrer" style="color:var(--cyan);text-decoration:underline;">NAKORDONI.EU</a>`;
      } else {
        summaryText.textContent = `LIVE QUEUES · ${crossings.length} BORDER CROSSINGS MONITORED`;
      }
    } else {
      summaryText.textContent = 'NATIONAL CENTER FOR BORDER MANAGEMENT';
    }
  }

  // 2. UNAVAILABLE State
  if (status === 'UNAVAILABLE') {
    list.innerHTML = `
      <div class="border-state-card unavailable">
        <div class="state-icon">⚠️</div>
        <div class="state-title">UNAVAILABLE</div>
        <div class="state-desc">${escHtml(error || message || 'Official and secondary border data sources could not be reached.')}</div>
        <div class="border-source-link-box">
          <a href="https://mpb.rks-gov.net/?culture=sr-latn-rs" target="_blank" rel="noopener noreferrer" class="border-ext-link">
            Open Official MPB / QKMK Portal ↗
          </a>
        </div>
      </div>`;
    return;
  }

  // 3. NO_DATA / NOT_CONFIGURED State
  if (status === 'NO_DATA' || crossings.length === 0) {
    list.innerHTML = `
      <div class="border-state-card not-configured">
        <div class="state-icon">📭</div>
        <div class="state-title">NO BORDER DATA</div>
        <div class="state-desc">${escHtml(message || 'No active border crossing wait times currently reported.')}</div>
      </div>`;
    return;
  }

  // 4. LIVE_DATA Render
  list.innerHTML = crossings.map(c => {
    const entry = c.direction?.entry || {};
    const exit = c.direction?.exit || {};
    const trucks = c.trucks || {};
    const truckEntry = trucks.entry || {};
    const truckExit = trucks.exit || {};

    const entryWait = entry.waitingMinutesText || (entry.waitingMinutes != null ? `${entry.waitingMinutes} min` : 'N/A');
    const entryQueue = entry.queueLengthText || (entry.queueLengthMeters != null ? `${entry.queueLengthMeters} m` : 'N/A');

    const exitWait = exit.waitingMinutesText || (exit.waitingMinutes != null ? `${exit.waitingMinutes} min` : 'N/A');
    const exitQueue = exit.queueLengthText || (exit.queueLengthMeters != null ? `${exit.queueLengthMeters} m` : 'N/A');

    // Severity level for color badge
    const maxWait = Math.max(entry.waitingMinutes || 0, exit.waitingMinutes || 0);
    const maxQueue = Math.max(entry.queueLengthMeters || 0, exit.queueLengthMeters || 0);

    let delayClass = 'delay-low';
    let delayLabel = 'NORMAL FLOW';
    if (maxWait >= 60 || maxQueue >= 500) {
      delayClass = 'delay-critical';
      delayLabel = 'HEAVY DELAY';
    } else if (maxWait >= 30 || maxQueue >= 200) {
      delayClass = 'delay-high';
      delayLabel = 'MODERATE DELAY';
    } else if (maxWait >= 15 || maxQueue >= 50) {
      delayClass = 'delay-elevated';
      delayLabel = 'SLIGHT DELAY';
    }

    const timeAgoStr = c.updatedAt ? formatTimeAgo(c.updatedAt) : 'Recent';

    // Truck row if available
    let trucksHtml = '';
    if (c.trucks) {
      const trEntryWait = truckEntry.waitingMinutesText || (truckEntry.waitingMinutes != null ? `${truckEntry.waitingMinutes} min` : '03-05 min');
      const trExitWait = truckExit.waitingMinutesText || (truckExit.waitingMinutes != null ? `${truckExit.waitingMinutes} min` : '03-05 min');
      const trEntryQueue = truckEntry.queueLengthText || (truckEntry.queueLengthMeters != null ? `${truckEntry.queueLengthMeters} m` : '0 m');
      const trExitQueue = truckExit.queueLengthText || (truckExit.queueLengthMeters != null ? `${truckExit.queueLengthMeters} m` : '0 m');

      trucksHtml = `
        <div class="border-trucks-row">
          <span class="truck-tag">🚛 TRUCKS</span>
          <span class="truck-metric">Entry: <strong>${escHtml(trEntryWait)}</strong> (${escHtml(trEntryQueue)})</span>
          <span class="truck-divider">·</span>
          <span class="truck-metric">Exit: <strong>${escHtml(trExitWait)}</strong> (${escHtml(trExitQueue)})</span>
        </div>
      `;
    }

    const sourceLabel = c.source === 'NAKORDONI' ? 'NAKORDONI (SECONDARY)' : (c.source || 'QKMK');
    const sourceLink = c.source === 'NAKORDONI' ? 'https://nakordoni.eu/en/country/kosovo' : (c.sourceUrl || 'https://mpb.rks-gov.net/?culture=sr-latn-rs');
    const linkText = c.source === 'NAKORDONI' ? 'Nakordoni ↗' : 'Official Source ↗';

    return `
      <div class="border-card ${delayClass}" data-crossing-id="${escHtml(c.id)}" onclick="focusBorderCrossing('${escHtml(c.id)}')">
        <div class="border-card-header">
          <div class="border-name-info">
            <span class="border-crossing-name">${escHtml(c.name)}</span>
            <span class="border-neighbor-name">↔ ${escHtml(c.neighborCountry || 'Border')}</span>
          </div>
          <div class="border-status-pill ${delayClass}">
            ${delayLabel}
          </div>
        </div>

        <div class="border-flow-grid">
          <!-- Entry Box -->
          <div class="border-flow-box entry-box">
            <div class="flow-box-title">
              <span class="flow-arrow">⬇</span> CARS ENTRY (INTO KOSOVO)
            </div>
            <div class="flow-metric-row">
              <div class="flow-metric">
                <span class="metric-label">WAIT TIME</span>
                <span class="metric-value ${entry.waitingMinutes >= 30 ? 'text-warning' : 'text-primary'}">${escHtml(entryWait)}</span>
              </div>
              <div class="flow-metric">
                <span class="metric-label">QUEUE</span>
                <span class="metric-value">${escHtml(entryQueue)}</span>
              </div>
            </div>
          </div>

          <!-- Exit Box -->
          <div class="border-flow-box exit-box">
            <div class="flow-box-title">
              <span class="flow-arrow">⬆</span> CARS EXIT (OUT OF KOSOVO)
            </div>
            <div class="flow-metric-row">
              <div class="flow-metric">
                <span class="metric-label">WAIT TIME</span>
                <span class="metric-value ${exit.waitingMinutes >= 30 ? 'text-warning' : 'text-primary'}">${escHtml(exitWait)}</span>
              </div>
              <div class="flow-metric">
                <span class="metric-label">QUEUE</span>
                <span class="metric-value">${escHtml(exitQueue)}</span>
              </div>
            </div>
          </div>
        </div>

        ${trucksHtml}

        <div class="border-card-footer">
          <span class="border-time-tag">UPDATED ${escHtml(timeAgoStr.toUpperCase())} · SOURCE ${escHtml(sourceLabel)}</span>
          <a href="${escHtml(sourceLink)}" target="_blank" rel="noopener noreferrer" class="border-link-btn" onclick="event.stopPropagation()">
            ${escHtml(linkText)}
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function renderBorderMapMarkers(borderData) {
  if (!state.map || state.activeMapModule !== 'border') return;
  clearMarkerList(moduleLayers.border.markers);

  const data = borderData || state.borderData;
  if (!data || !Array.isArray(data.crossings)) {
    updateMapBadgeAndMeta();
    return;
  }

  data.crossings.forEach(c => {
    const coords = c.coordinates;
    if (!coords || typeof coords.lat !== 'number' || typeof coords.lon !== 'number') return;

    const entry = c.direction?.entry || {};
    const exit = c.direction?.exit || {};
    const maxWait = Math.max(entry.waitingMinutes || 0, exit.waitingMinutes || 0);
    const maxQueue = Math.max(entry.queueLengthMeters || 0, exit.queueLengthMeters || 0);

    let color = '#34d399'; // Green (low/normal)
    let statusText = 'NORMAL FLOW';
    if (maxWait >= 60 || maxQueue >= 500) {
      color = '#f87171'; // Red (critical)
      statusText = 'HEAVY DELAY';
    } else if (maxWait >= 30 || maxQueue >= 200) {
      color = '#fb923c'; // Orange (high)
      statusText = 'MODERATE DELAY';
    } else if (maxWait >= 15 || maxQueue >= 50) {
      color = '#fbbf24'; // Yellow (elevated)
      statusText = 'SLIGHT DELAY';
    }

    const markerEl = createBorderMarkerElement(color, c.shortName || c.name);

    const timeAgoStr = c.updatedAt ? formatTimeAgo(c.updatedAt) : 'Recent';
    const entryWaitStr = entry.waitingMinutesText || (entry.waitingMinutes != null ? `${entry.waitingMinutes} min` : 'N/A');
    const entryQueueStr = entry.queueLengthText || (entry.queueLengthMeters != null ? `${entry.queueLengthMeters} m` : 'None');
    const exitWaitStr = exit.waitingMinutesText || (exit.waitingMinutes != null ? `${exit.waitingMinutes} min` : 'N/A');
    const exitQueueStr = exit.queueLengthText || (exit.queueLengthMeters != null ? `${exit.queueLengthMeters} m` : 'None');

    let truckPopupHtml = '';
    if (c.trucks) {
      const trEntryWait = c.trucks.entry?.waitingMinutesText || (c.trucks.entry?.waitingMinutes != null ? `${c.trucks.entry.waitingMinutes} min` : '03-05 min');
      const trExitWait = c.trucks.exit?.waitingMinutesText || (c.trucks.exit?.waitingMinutes != null ? `${c.trucks.exit.waitingMinutes} min` : '03-05 min');
      truckPopupHtml = `
        <div style="margin-top:4px; padding-top:4px; border-top:1px solid rgba(255,255,255,0.08); font-size:9px; color:var(--text-dim); font-family:var(--font-mono);">
          <strong style="color:#f59e0b;">🚛 TRUCKS:</strong> Entry ${escHtml(trEntryWait)} · Exit ${escHtml(trExitWait)}
        </div>
      `;
    }

    const sourceLabel = c.source === 'NAKORDONI' ? 'NAKORDONI (nakordoni.eu)' : (c.source || 'QKMK');

    const popupHtml = buildMapPopupHtml({
      icon: '🛂',
      title: c.name,
      source: sourceLabel,
      badge: { text: `${c.status || 'OPEN'} (${statusText})`, color },
      stats: [
        { label: 'Entry Wait', val: entryWaitStr },
        { label: 'Entry Queue', val: entryQueueStr },
        { label: 'Exit Wait', val: exitWaitStr },
        { label: 'Exit Queue', val: exitQueueStr }
      ],
      sections: truckPopupHtml,
      footer: `UPDATED: ${escHtml(timeAgoStr)}`
    });

    const marker = new maplibregl.Marker({ element: markerEl, anchor: 'center' })
      .setLngLat([coords.lon, coords.lat])
      .setPopup(createMapPopup(popupHtml, { className: 'border-map-popup' }))
      .addTo(state.map);

    marker._module = 'border';
    marker._crossingId = c.id;
    moduleLayers.border.markers.push(marker);
  });

  updateMapBadgeAndMeta();
}

function createBorderMarkerElement(color, label) {
  const el = document.createElement('div');
  el.className = 'border-custom-marker';
  el.innerHTML = `
    <div class="border-marker-pin" style="background:${color}; box-shadow: 0 0 10px ${color}88;">
      <span class="border-pin-icon">🛂</span>
    </div>
    <div class="border-marker-label">${escHtml(label)}</div>
  `;
  return el;
}

function focusBorderCrossing(crossingId) {
  const marker = moduleLayers.border.markers.find(m => m._crossingId === crossingId);
  if (marker && state.map) {
    const lngLat = marker.getLngLat();
    state.map.flyTo({ center: [lngLat.lng, lngLat.lat], zoom: 12, speed: 1.2 });
    marker.togglePopup();
  }
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
window.filterTelegram = filterTelegram;
window.fetchTelegram = fetchTelegram;
window.fetchBorder = fetchBorder;
window.focusBorderCrossing = focusBorderCrossing;
window.buildAlerts = buildAlerts;
window.aggregateAndRenderAlerts = aggregateAndRenderAlerts;
window.renderAlertLog = renderAlertLog;
window.handleAlertClick = handleAlertClick;
window.loadAlertHistory = loadAlertHistory;
window.fetchAndRender = fetchAndRender;
window.ALERT_THRESHOLDS = ALERT_THRESHOLDS;
window.renderNews = renderNews;
window.filterNewsItems = filterNewsItems;
window.sortNewsByChronological = sortNewsByChronological;
window.getArticlePubTime = getArticlePubTime;
window.KOSOVO_WEATHER_CITIES = KOSOVO_WEATHER_CITIES;
window.selectWeatherCity = selectWeatherCity;
window.fetchCityWeather = fetchCityWeather;
window.renderWeather = renderWeather;
window.renderWeatherMapMarkers = renderWeatherMapMarkers;
window.createWeatherMarkerElement = createWeatherMarkerElement;
window.openWeatherPopup = openWeatherPopup;
window.closeWeatherPopup = closeWeatherPopup;
window.buildWeatherPopupHtml = buildWeatherPopupHtml;
window.buildMapPopupHtml = buildMapPopupHtml;
window.createMapPopup = createMapPopup;
window.openMapPopup = openMapPopup;
window.closeMapPopup = closeMapPopup;
window.renderTrafficMapMarkers = renderTrafficMapMarkers;
window.renderRadiationMapMarkers = renderRadiationMapMarkers;
window.renderEarthquakeMapMarkers = renderEarthquakeMapMarkers;
window.renderNewsMapMarkers = renderNewsMapMarkers;
window.renderAqiMapMarkers = renderAqiMapMarkers;
window.renderAviationMapMarkers = renderAviationMapMarkers;
window.renderBorderMapMarkers = renderBorderMapMarkers;
window.state = state;