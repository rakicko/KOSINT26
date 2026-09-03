import * as maplibregl from './vendor/maplibre-gl.mjs';
import {
  KFOR_BASES_GEOJSON,
  SENSITIVE_CORRIDORS_GEOJSON,
  MINEFIELDS_KOSOVO_GEOJSON,
  KFOR_MSR_ROUTES_GEOJSON
} from './operational-zones.js';

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

const CARTO_API_KEY = (typeof window !== 'undefined' && (window.CARTO_API_KEY || window.CARTO_KEY)) || '';
const OPENFREEMAP_DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark';

const DARK_MAP_TILES = CARTO_API_KEY
  ? [`https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`]
  : ['https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'];
const DARK_REF_TILES = CARTO_API_KEY
  ? [`https://basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`]
  : ['https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'];

const OSM_STYLE = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: DARK_MAP_TILES,
      tileSize: 256,
      attribution: '© OpenStreetMap contributors, Esri'
    },
    'osm-ref-tiles': {
      type: 'raster',
      tiles: DARK_REF_TILES,
      tileSize: 256,
      attribution: '© Esri'
    },
    'satellite-tiles': {
      type: 'raster',
      tiles: ['https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© Esri Clarity Archive'
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
      paint: {
        'raster-opacity': 1,
        'raster-brightness-max': 0.22,
        'raster-contrast': 0.65,
        'raster-saturation': -1
      }
    },
    {
      id: 'osm-ref-basemap',
      type: 'raster',
      source: 'osm-ref-tiles',
      paint: {
        'raster-opacity': 0.85,
        'raster-contrast': 0.35
      }
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
  attribution: '© OpenStreetMap contributors, Esri Clarity, NASA GIBS, NASA FIRMS'
};

class BasemapControl {
  onAdd(map) {
    this._map = map;
    const container = document.createElement('div');
    container.className = 'mapboxgl-ctrl maplibregl-control osiris-map-ctrl-pill basemap-control-container';
    container.innerHTML = `
      <button class="basemap-btn active" data-basemap="dark"><span class="ctrl-icon">🗺️</span> Map</button>
      <button class="basemap-btn" data-basemap="satellite"><span class="ctrl-icon">🛰️</span> Satellite</button>
    `;
    const btnMap = container.querySelector('.basemap-btn[data-basemap="dark"]');
    const btnSat = container.querySelector('.basemap-btn[data-basemap="satellite"]');
    if (btnMap) btnMap.addEventListener('click', () => switchBasemap('dark'));
    if (btnSat) btnSat.addEventListener('click', () => switchBasemap('satellite'));
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
    if (map.getLayer('osm-basemap')) map.setLayoutProperty('osm-basemap', 'visibility', 'visible');
    if (map.getLayer('osm-ref-basemap')) map.setLayoutProperty('osm-ref-basemap', 'visibility', 'visible');
    if (map.getLayer('satellite-basemap')) map.setLayoutProperty('satellite-basemap', 'visibility', 'none');
  } else if (basemapId === 'satellite') {
    if (map.getLayer('satellite-basemap')) map.setLayoutProperty('satellite-basemap', 'visibility', 'visible');
    if (map.getLayer('osm-basemap')) map.setLayoutProperty('osm-basemap', 'visibility', 'none');
    if (map.getLayer('osm-ref-basemap')) map.setLayoutProperty('osm-ref-basemap', 'visibility', 'none');
  }

  const buttons = document.querySelectorAll('.basemap-btn');
  buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.basemap === basemapId));
}

window.setBasemapMode = switchBasemap;

class MapModeControl {
  onAdd(map) {
    this._map = map;
    const container = document.createElement('div');
    container.className = 'mapboxgl-ctrl maplibregl-control osiris-map-ctrl-pill map-mode-control-container';
    container.innerHTML = `
      <button class="map-mode-btn active" data-mode="2d">2D</button>
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
  { id: 'peje', name: 'Pejë', lat: 42.6591, lon: 20.2883 },
  { id: 'prizren', name: 'Prizren', lat: 42.2153, lon: 20.7415 },
  { id: 'ferizaj', name: 'Ferizaj', lat: 42.3705, lon: 21.1553 },
  { id: 'gjilan', name: 'Gjilan', lat: 42.4635, lon: 21.4694 },
  { id: 'gjakove', name: 'Gjakovë', lat: 42.3803, lon: 20.4308 }
];

const BORDER_CROSSING_LOCATIONS = {
  'border-merdare': { lat: 42.9439, lon: 21.2464, name: 'Merdarë / Merdare', shortName: 'Merdarë', neighbor: 'Serbia' },
  'border-jarinje': { lat: 43.2181, lon: 20.6975, name: 'Jarinjë / Jarinje', shortName: 'Jarinjë', neighbor: 'Serbia' },
  'border-bernjak': { lat: 42.9753, lon: 20.5519, name: 'Bërnjak / Brnjak', shortName: 'Bërnjak', neighbor: 'Serbia' },
  'border-dheu-i-bardhe': { lat: 42.4844, lon: 21.6547, name: 'Dheu i Bardhë / Bela Zemlja', shortName: 'Dheu i Bardhë', neighbor: 'Serbia' },
  'border-mutivode': { lat: 42.7561, lon: 21.4686, name: 'Mutivodë / Mutivode', shortName: 'Mutivodë', neighbor: 'Serbia' },
  'border-mucibabe': { lat: 42.3883, lon: 21.5583, name: 'Muçibabë / Mučibaba', shortName: 'Muçibabë', neighbor: 'Serbia' },
  'border-hani-i-elezit': { lat: 42.1469, lon: 21.2981, name: 'Hani i Elezit', shortName: 'Hani i Elezit', neighbor: 'North Macedonia' },
  'border-gllobocice': { lat: 42.1644, lon: 21.0967, name: 'Glloboçicë / Globočica', shortName: 'Glloboçicë', neighbor: 'North Macedonia' },
  'border-stanciq': { lat: 42.2778, lon: 21.5278, name: 'Stançiq / Staničić', shortName: 'Stançiq', neighbor: 'North Macedonia' },
  'border-kulle': { lat: 42.7933, lon: 20.2789, name: 'Kullë / Kula', shortName: 'Kullë', neighbor: 'Montenegro' },
  'border-vermice': { lat: 42.1583, lon: 20.5486, name: 'Vërmicë / Vrbnica / Morinë', shortName: 'Vërmicë', neighbor: 'Albania' },
  'border-qafe-e-prushit': { lat: 42.3014, lon: 20.3553, name: 'Qafë e Prushit', shortName: 'Qafë e Prushit', neighbor: 'Albania' },
  'border-qafe-e-morines': { lat: 42.4106, lon: 20.2528, name: 'Qafë e Morinës', shortName: 'Qafë e Morinës', neighbor: 'Albania' }
};

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
  activeMapModule: null, // Authoritative single active map module: null | 'news' | 'weather' | 'traffic' | 'radiation' | 'aqi' | 'earthquake' | 'wildfire' | 'aviation' | 'cctv' | 'border'
  activeModule: null,
  mapMode: '2d',
  aviationFilter: 'all',
  telegramFilter: 'all',
  telegramData: null,
  borderData: null,
  borderLoading: false,
  selectedWeatherCityId: null,
  selectedNewsItemId: null,
  selectedBorderCrossingId: null,
  weatherCache: {},
  weatherPopup: null,
  borderPopup: null,
  activeMapPopup: null,
  staffToken: typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('staff_warden_token') : null,
  staffLocations: [],
  staffFilteredLocations: [],
  staffInactivityTimer: null
};

function clearMarkerList(markerList) {
  if (Array.isArray(markerList)) {
    markerList.forEach(m => {
      try {
        if (m.getPopup && m.getPopup()) {
          m.getPopup().remove();
        }
        m.remove();
      } catch (e) { }
    });
    markerList.length = 0;
  }
}

const moduleLayers = {
  news: {
    markers: [],
    render: (data) => renderNewsMapMarkers(data?.news || state.data?.news),
    clear: () => {
      clearMarkerList(moduleLayers.news.markers);
      closeNewsPopup();
    }
  },
  weather: {
    markers: [],
    render: (data) => renderWeatherMapMarkers(data?.weather || state.data?.weather),
    clear: () => {
      clearMarkerList(moduleLayers.weather.markers);
      closeWeatherPopup();
    }
  },
  traffic: {
    markers: [],
    render: (data) => renderTrafficMapMarkers(data?.traffic || state.data?.traffic),
    clear: () => {
      clearMarkerList(moduleLayers.traffic.markers);
      closeMapPopup();
    }
  },
  radiation: {
    markers: [],
    render: (data) => renderRadiationMapMarkers(data?.radiation || state.data?.radiation),
    clear: () => {
      clearMarkerList(moduleLayers.radiation.markers);
      closeMapPopup();
    }
  },
  aqi: {
    markers: [],
    render: (data) => renderAqiMapMarkers(data?.aqi || state.data?.aqi),
    clear: () => {
      clearMarkerList(moduleLayers.aqi.markers);
      closeMapPopup();
    }
  },
  earthquake: {
    markers: [],
    render: (data) => renderEarthquakeMapMarkers(data?.earthquakes || state.data?.earthquakes),
    clear: () => {
      clearMarkerList(moduleLayers.earthquake.markers);
      closeMapPopup();
    }
  },
  wildfire: {
    markers: [],
    render: (data) => renderWildfireMapLayer(data?.wildfire || state.data?.wildfire),
    clear: () => {
      clearWildfireMapLayer();
      closeMapPopup();
    }
  },
  aviation: {
    markers: [],
    render: (data) => renderAviationMapMarkers(data?.aviation || state.data?.aviation),
    clear: () => {
      clearMarkerList(moduleLayers.aviation.markers);
      closeMapPopup();
    }
  },
  telegram: {
    markers: [],
    render: () => { },
    clear: () => closeMapPopup()
  },
  border: {
    markers: [],
    render: (data) => renderBorderMapMarkers(data || state.borderData),
    clear: () => {
      clearMarkerList(moduleLayers.border.markers);
      closeBorderPopup();
    }
  },
  cctv: {
    markers: [],
    render: () => renderCCTVMapMarkers(),
    clear: () => {
      clearMarkerList(moduleLayers.cctv.markers);
      closeMapPopup();
    }
  },
  staff: {
    markers: [],
    render: (data) => renderStaffMapMarkers(data || state.staffLocations),
    clear: () => {
      clearMarkerList(moduleLayers.staff.markers);
      closeMapPopup();
    }
  },
  route: {
    markers: [],
    render: () => { },
    clear: () => {
      clearRoute(false);
      closeMapPopup();
    }
  },
  mines: {
    markers: [],
    render: () => {
      if (typeof toggleMinefieldsLayer === 'function') toggleMinefieldsLayer(true);
    },
    clear: () => {
      if (typeof toggleMinefieldsLayer === 'function') toggleMinefieldsLayer(false);
    }
  }
};

function clearAllModuleLayers() {
  closeMapPopup();
  Object.keys(moduleLayers).forEach(mod => {
    // Preserve persistent tactical layers (earthquake, radiation, mines, weather, aqi, msr)
    if (['earthquake', 'radiation', 'mines', 'weather', 'aqi', 'msr'].includes(mod)) return;
    if (mod === 'border' && $('toggleLayerBorder')?.checked) return;
    try {
      moduleLayers[mod].clear();
    } catch (e) {
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
  if (mod === 'mines') {
    const count = MINEFIELDS_KOSOVO_GEOJSON.features.length;
    badge.style.display = '';
    badge.textContent = `${count} HAZARDS`;
    meta.textContent = `${count} Hazardous Sectors & Cluster Footprints · KMAC / EOD`;
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

// ── Global Authentication Gate ───────────────────────────────────────────────
function showLoginModal() {
  const modal = $('loginModal');
  if (modal) modal.style.display = 'flex';
}

function hideLoginModal() {
  const modal = $('loginModal');
  if (modal) modal.style.display = 'none';
}

function updateUserBadgeUI() {
  const badge = $('userBadge');
  const roleEl = $('userRoleBadge');
  const nameEl = $('userName');
  if (!badge) return;

  if (state.user) {
    badge.style.display = 'flex';
    if (roleEl) roleEl.textContent = (state.user.role || 'OPERATOR').toUpperCase();
    if (nameEl) nameEl.textContent = state.user.username || 'Observer';
  } else {
    badge.style.display = 'none';
  }
}

function setupAuthEventListeners() {
  const loginForm = $('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userEl = $('loginUsername');
      const passEl = $('loginPassword');
      const errEl = $('loginError');
      const btn = $('loginSubmitBtn');

      if (!userEl || !passEl) return;
      if (errEl) errEl.style.display = 'none';
      if (btn) btn.disabled = true;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: userEl.value.trim(), password: passEl.value })
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          state.user = data.user;
          state.csrfToken = data.csrfToken;
          updateUserBadgeUI();
          hideLoginModal();
          initAuthenticatedDashboard();
        } else {
          if (errEl) {
            errEl.textContent = data.error || 'Authentication failed';
            errEl.style.display = 'block';
          }
        }
      } catch (err) {
        if (errEl) {
          errEl.textContent = 'Connection error. Please try again.';
          errEl.style.display = 'block';
        }
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  const logoutBtn = $('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': state.csrfToken || ''
          }
        });
      } catch {}
      state.user = null;
      state.csrfToken = null;
      updateUserBadgeUI();
      showLoginModal();
    });
  }
}

let dashboardInitialized = false;
function initAuthenticatedDashboard() {
  if (dashboardInitialized) {
    startMonitor();
    return;
  }
  dashboardInitialized = true;
  startClock();
  connectSSE();
  loadAlertHistory();
  initMap();
  startMonitor();
  setupCCTVPanelButtons();
}

async function checkAuthAndInit() {
  setupAuthEventListeners();

  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.authenticated && data.user) {
      state.user = data.user;
      state.csrfToken = data.csrfToken;
      updateUserBadgeUI();
      hideLoginModal();
      initAuthenticatedDashboard();
    } else {
      showLoginModal();
    }
  } catch (err) {
    console.warn('Failed to verify session:', err);
    showLoginModal();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuthAndInit();
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
    } catch { }
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
    try { await fetchAndRender(state.currentLocation, state.currentTimeline, true); } catch { }
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
  if (!widget) return;
  widget.style.display = 'flex';
  const fill = $('threatFill');
  if (fill) {
    fill.style.width = `${tl.score}%`;
    fill.style.background = tl.color;
  }
  const text = $('threatText');
  if (text) {
    text.textContent = `${tl.level}  ${tl.score}`;
    text.style.color = tl.color;
  }
  const header = document.querySelector('.header');
  if (header) header.style.borderBottomColor = tl.score >= 80 ? tl.color : '';
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

  $('newsMeta').textContent = `${totalEvents} Events`;

  filterNewsItems(items, state.newsTab || state.newsFilter || 'all');
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

function isOperationalNewsItem(item) {
  if (!item) return false;
  if (item.eventType === 'commentary' || item.category === 'commentary' || item.category === 'other') {
    return false;
  }
  const text = `${item.title || ''} ${item.description || ''}`.toLowerCase();
  // TV talk show punditry & studio debates
  if (/aludon|opinionist|analist|në\s*studio|ne\s*studio|pressing|debat\s*plus|rubikon|dpt\s*te\s*fidani|shtron\s*pyetjen|polemik|replikë|replike|debat\s*politik/i.test(text)) {
    return false;
  }
  // Administrative council / procedural voting without operational security incident
  if (/nuk\s*miratohet\s*raporti|raporti\s*i\s*punës|raportin\s*e\s*punës|prokurorial\s*i\s*kosovës|këshilli\s*prokurorial|keshilli\s*prokurorial|kpk\b|seancë\s*solemne|mbledhje\s*e\s*rregullt/i.test(text)) {
    return false;
  }
  return true;
}

const SERBIAN_NEWS_SOURCES = ['kossev', 'radio mitrovica sever', 'radio kim', 'kosova.info'];
const ALBANIAN_NEWS_SOURCES = ['koha', 'gazeta express', 'indeks online', 'lajmi', 'jepize', 'mitropol', 'mitrovicasot', 'telegrafi', 'kallxo'];

function isSerbianNewsItem(item) {
  if (!item) return false;
  if (item.language === 'al' || item.language === 'sq') return false;
  const src = String(item.primarySource || item.source || '').toLowerCase();
  if (ALBANIAN_NEWS_SOURCES.some(s => src.includes(s))) return false;

  // Strict Albanian character and word detection in title
  const text = `${item.title || ''} ${item.description || ''}`;
  if (/[ëËçÇ]/.test(text)) return false;
  if (/\b(në|dhe|për|nga|është|një|së|të|ka|me|pas\s+takimit|marrëveshja|lajme|aksidenti|policisë)\b/i.test(item.title || '')) return false;

  if (item.language === 'sr' || item.language === 'serbian') return true;
  if (SERBIAN_NEWS_SOURCES.some(s => src.includes(s))) return true;
  const sources = Array.isArray(item.sources) ? item.sources : [];
  if (sources.some(s => SERBIAN_NEWS_SOURCES.some(ss => String(s).toLowerCase().includes(ss)))) return true;
  if (/[\u0400-\u04FF]/.test(text)) return true;
  return false;
}

function isAlbanianNewsItem(item) {
  if (!item) return false;
  return !isSerbianNewsItem(item);
}

function filterNewsItems(items, filter) {
  state.newsTab = filter || state.newsTab || 'all';
  state.newsFilter = state.newsTab;
  items = items || [];

  let filtered = items;

  // 1. Language & Operational Tabs
  if (state.newsTab === 'all') {
    filtered = items;
  } else if (state.newsTab === 'serbian') {
    filtered = items.filter(i => isSerbianNewsItem(i));
  } else if (state.newsTab === 'albanian') {
    filtered = items.filter(i => isAlbanianNewsItem(i));
  } else if (state.newsTab === 'operational') {
    filtered = items.filter(i => isOperationalNewsItem(i));
  } else if (state.newsTab === 'critical') {
    filtered = items.filter(i => i.severity === 'critical' || i.intensityScore >= 9);
  } else if (state.newsTab === 'high') {
    filtered = items.filter(i => i.severity === 'high' || (i.intensityScore >= 7 && i.intensityScore <= 8));
  } else if (state.newsTab === 'medium') {
    filtered = items.filter(i => i.severity === 'medium' || (i.intensityScore >= 4 && i.intensityScore <= 6));
  } else {
    filtered = items;
  }

  // 2. Urgent Only Toggle (Filter Critical & High)
  if (state.newsUrgentOnly) {
    filtered = filtered.filter(i => {
      const s = i.intensityScore || 1;
      const sev = (i.severity || '').toLowerCase();
      return sev === 'critical' || sev === 'high' || s >= 7;
    });
  }

  const sorted = sortNewsByChronological(filtered);

  const list = $('newsList');
  if (!list) return;

  if (!sorted.length) {
    const tabName = state.newsTab === 'serbian' ? 'Serbian' : state.newsTab === 'albanian' ? 'Albanian' : state.newsTab === 'operational' ? 'Operational' : 'All';
    list.innerHTML = `<div class="empty-state">No ${state.newsUrgentOnly ? 'urgent ' : ''}events in ${tabName} news feed</div>`;
    return;
  }

  list.innerHTML = sorted.map((item) => {
    const s = item.intensityScore || 1;
    const sev = (item.severity || (s >= 9 ? 'critical' : s >= 7 ? 'high' : s >= 4 ? 'medium' : 'low')).toLowerCase();
    const sevClass = sev === 'critical' ? 'sev-critical' : sev === 'high' ? 'sev-high' : sev === 'medium' ? 'sev-medium' : 'sev-low';
    const sevLabel = sev.toUpperCase();

    // Category / news type tag
    const rawCat = (item.category || (isOperationalNewsItem(item) ? 'Security' : 'Commentary')).replace(/_/g, ' ');
    const catLabel = rawCat.toUpperCase();

    const title = item.title || item.canonicalTitle || 'Untitled Intelligence Item';
    const rawUrl = item.url ? String(item.url).trim() : '';
    const validUrl = (rawUrl && isValidArticleUrl(rawUrl)) ? rawUrl : '';

    if (validUrl) {
      return `
        <a class="news-simple-card ${sevClass}" href="${escHtml(validUrl)}" target="_blank" rel="noopener noreferrer" title="${escHtml(title)}">
          <div class="news-card-meta">
            <span class="news-badge-sev ${sevClass}">${sevLabel}</span>
            <span class="news-badge-cat">${escHtml(catLabel)}</span>
          </div>
          <div class="news-card-title">${escHtml(title)}</div>
          <span class="news-card-ext">↗</span>
        </a>
      `;
    }

    return `
      <div class="news-simple-card ${sevClass}" title="${escHtml(title)}">
        <div class="news-card-meta">
          <span class="news-badge-sev ${sevClass}">${sevLabel}</span>
          <span class="news-badge-cat">${escHtml(catLabel)}</span>
        </div>
        <div class="news-card-title">${escHtml(title)}</div>
      </div>
    `;
  }).join('');
}

function switchNewsTab(tab, btn) {
  state.newsTab = tab;
  document.querySelectorAll('.news-triage-tabs .filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (state.data?.news) filterNewsItems(state.data.news.items || [], tab);
}

function toggleNewsUrgent(btn) {
  state.newsUrgentOnly = !state.newsUrgentOnly;
  if (btn) {
    btn.classList.toggle('active', !!state.newsUrgentOnly);
  }
  if (state.data?.news) filterNewsItems(state.data.news.items || [], state.newsTab || 'operational');
}

function filterNews(cat, btn) {
  switchNewsTab(cat, btn);
}

function renderWeather(weather, explicitCityName) {
  if (!weather || weather.error) return;

  const locName = (explicitCityName || weather.location || '').toLowerCase();
  const city = KOSOVO_WEATHER_CITIES.find(c => c.name.toLowerCase() === locName || c.id === locName);

  if (city) {
    if (!state.weatherCache) state.weatherCache = {};
    state.weatherCache[city.id] = { data: weather, fetchedAt: Date.now() };

    // Update ONLY this specific city's marker
    updateWeatherCityMarker(city.id, weather);

    // Update open popup if currently displayed for this city
    if (state.weatherPopup && state.selectedWeatherCityId === city.id) {
      openWeatherPopup(city, weather);
    }
  }
}

/* ── Standardized Map Popup System (OSIRIS Dark Glass Architecture) ───────── */
function buildMapPopupHtml({
  icon = '📍',
  title = '',
  subtitle = '',
  source = '',
  badge = null, // { text: 'HIGH', color: '#f87171' } or string
  primary = null, // { val: '35°C', sub: 'Clear sky', secondary: 'Feels like 32°C' }
  stats = [], // [ { label: 'Humidity', val: '21%' }, ... ]
  description = '',
  contentHtml = '', // direct custom body html
  sections = '', // raw custom html like hourly forecast
  footer = '', // raw footer html or text
  linkUrl = '',
  linkText = ''
}) {
  const badgeObj = typeof badge === 'string' ? { text: badge, color: 'var(--cyan)' } : badge;
  const badgeHtml = badgeObj ? `
    <span class="map-popup-badge" style="background:${badgeObj.color || 'var(--cyan)'}20; color:${badgeObj.color || 'var(--cyan)'}; border:1px solid ${badgeObj.color || 'var(--cyan)'}40;">
      ${escHtml(badgeObj.text)}
    </span>
  ` : '';

  const subHtml = (subtitle || source) ? `
    <div class="map-popup-header-sub">
      ${subtitle ? `<span class="map-popup-subtitle">${escHtml(subtitle)}</span>` : ''}
      ${source ? `<span class="map-popup-source">via ${escHtml(source)}</span>` : ''}
    </div>
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

  const linkBtnText = linkText || 'OPEN SOURCE REPORT ↗';
  const linkHtml = linkUrl ? `
    <div class="map-popup-link-row">
      <a href="${escHtml(linkUrl)}" target="_blank" rel="noopener noreferrer" class="map-popup-link-btn" onclick="event.stopPropagation()">
        ${escHtml(linkBtnText)}
      </a>
    </div>
  ` : '';

  const footerHtml = footer ? `
    <div class="map-popup-footer">
      ${typeof footer === 'string' && footer.includes('<span') ? footer : `<span>${escHtml(footer)}</span>`}
    </div>
  ` : '';

  return `
    <div class="map-popup map-popup-container">
      <div class="map-popup-header">
        <div class="map-popup-header-top">
          <div class="map-popup-title">
            <span class="map-popup-icon">${icon}</span>
            <span class="map-popup-title-text">${escHtml(title.toUpperCase())}</span>
          </div>
          ${badgeHtml}
        </div>
        ${subHtml}
      </div>
      <div class="map-popup-body">
        ${primaryHtml}
        ${descHtml}
        ${statsHtml}
        ${contentHtml}
        ${sections || ''}
        ${linkHtml}
      </div>
      ${footerHtml}
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
    if (state.activeMapPopup === popup || state.weatherPopup === popup || state.borderPopup === popup) {
      state.activeMapPopup = null;
      state.weatherPopup = null;
      state.borderPopup = null;
      state.selectedWeatherCityId = null;
      state.selectedNewsItemId = null;
      state.selectedBorderCrossingId = null;
      state.selectedMarkerId = null;
      if (moduleLayers.weather?.markers) {
        moduleLayers.weather.markers.forEach(m => {
          const el = m.getElement ? m.getElement() : m._element;
          if (el) el.classList.remove('active');
        });
      }
      if (moduleLayers.border?.markers) {
        moduleLayers.border.markers.forEach(m => {
          const el = m.getElement ? m.getElement() : m._element;
          if (el) el.classList.remove('active');
        });
      }
    }
    if (typeof onClose === 'function') onClose();
    updateMapBadgeAndMeta();
  });

  popup.addTo(state.map);
  state.activeMapPopup = popup;
  return popup;
}

function closeMapPopup() {
  const p = state.activeMapPopup || state.weatherPopup || state.borderPopup;
  if (state.activeMapPopup) {
    try { state.activeMapPopup.remove(); } catch (e) { }
    state.activeMapPopup = null;
  }
  if (state.weatherPopup) {
    try { state.weatherPopup.remove(); } catch (e) { }
    state.weatherPopup = null;
  }
  if (state.borderPopup) {
    try { state.borderPopup.remove(); } catch (e) { }
    state.borderPopup = null;
  }
  if (p) {
    try { p.remove(); } catch (e) { }
  }
  if (typeof document !== 'undefined' && document.querySelectorAll) {
    try {
      const openPopups = document.querySelectorAll('.maplibregl-popup, .mapboxgl-popup');
      openPopups.forEach(pop => {
        if (pop && pop.parentNode) pop.parentNode.removeChild(pop);
      });
    } catch (e) { }
  }
  state.selectedWeatherCityId = null;
  state.selectedNewsItemId = null;
  state.selectedBorderCrossingId = null;
  state.selectedMarkerId = null;

  Object.keys(moduleLayers).forEach(mod => {
    if (moduleLayers[mod]?.markers) {
      moduleLayers[mod].markers.forEach(m => {
        const el = m.getElement ? m.getElement() : m._element;
        if (el) el.classList.remove('active');
        if (m.getPopup && m.getPopup()) {
          try { m.getPopup().remove(); } catch (e) { }
        }
      });
    }
  });
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
    subtitle: `${weatherIcon(c.weatherCode)} ${escHtml(c.description || 'Current Weather')}`,
    source: sourceLabel,
    primary: {
      val: `${c.temp ?? 'N/A'}°C`,
      sub: `${weatherIcon(c.weatherCode)} ${escHtml(c.description || 'Clear sky')}`,
      secondary: `Feels like ${c.feelsLike ?? c.temp ?? 'N/A'}°C`
    },
    stats: [
      { label: 'Humidity', val: `${c.humidity ?? 'N/A'}%` },
      { label: 'Wind', val: `${c.windSpeed ?? 'N/A'} km/h` },
      { label: 'Precipitation', val: `${c.precipitation ?? 0} mm` },
      { label: 'Visibility', val: `${c.visibility ?? 'N/A'} km` }
    ],
    sections: forecastHtml,
    footer: `UPDATED: JUST NOW · SOURCE: ${escHtml(sourceLabel.toUpperCase())}`
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

function updateWeatherCityMarker(cityId, weatherData) {
  if (!moduleLayers.weather?.markers) return;
  const marker = moduleLayers.weather.markers.find(m => m._cityId === cityId);
  if (!marker) return;

  const el = marker.getElement ? marker.getElement() : marker._element;
  if (!el) return;

  const hasTemp = weatherData && typeof weatherData.current?.temp === 'number';
  const iconText = hasTemp ? weatherIcon(weatherData.current.weatherCode) : '🌤️';
  const tempText = hasTemp ? `${weatherData.current.temp}°C` : '—';

  const iconEl = el.querySelector('.weather-marker-icon');
  if (iconEl) iconEl.textContent = iconText;

  const tempEl = el.querySelector('.weather-marker-temp');
  if (tempEl) {
    tempEl.textContent = tempText;
    if (hasTemp) tempEl.classList.remove('loading');
    else tempEl.classList.add('loading');
  }
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
    updateWeatherCityMarker(city.id, cached.data);
    return cached.data;
  }

  try {
    const url = `/api/weather?location=${encodeURIComponent(city.name)}&lat=${city.lat}&lon=${city.lon}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.weatherCache[city.id] = { data, fetchedAt: now };

    // Update ONLY this specific city's marker
    updateWeatherCityMarker(city.id, data);

    // Only open popup if this city is STILL currently selected (prevents race condition)
    if (showPopup && state.selectedWeatherCityId === city.id) {
      openWeatherPopup(city, data);
    }

    return data;
  } catch (err) {
    console.warn(`[weather] Failed to fetch weather for ${city.name}:`, err.message);
    const errData = { error: err.message, location: city.name };
    if (showPopup && state.selectedWeatherCityId === city.id) {
      openWeatherPopup(city, cached?.data || errData);
    }
    updateWeatherCityMarker(city.id, cached?.data || null);
    return cached?.data || null;
  }
}

async function fetchAllWeatherCities(forceRefresh = false) {
  const promises = KOSOVO_WEATHER_CITIES.map(city => {
    return fetchCityWeather(city.id, forceRefresh, false);
  });
  return Promise.allSettled(promises);
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

/**
 * Authoritative Albanian (sq) and Serbian (sr) Traffic Incident Lexicon
 */
const TRAFFIC_RELEVANCE_TERMS = {
  sq: {
    accident: [
      'aksident', 'aksidente', 'aksidenti', 'aksidentuar', 'përplasje', 'përplasur', 'u përplasën',
      'ndeshje automjetesh', 'ndeshje trafiku', 'rrokullisje e automjetit', 'rrokullisur vetura',
      'goditje e këmbësorit', 'veturë e aksidentuar', 'aksident trafiku', 'aksident komunikacioni'
    ],
    closure_blockage: [
      'rrugë e mbyllur', 'rruga e mbyllur', 'mbyllet rruga', 'mbyllje e rrugës', 'bllokohet rruga',
      'rrugë e bllokuar', 'rruga e bllokuar', 'bllokim i rrugës', 'bllokimi i rrugës',
      'ndërprerje e qarkullimit', 'ndërprerë qarkullimi', 'ndërprerje e trafikut',
      'bllokadë policore', 'bllokim nga policia', 'e pakalueshme', 'ndalim qarkullimi'
    ],
    congestion: [
      'kolonë automjetesh', 'kolona të gjata', 'kolonë kilometrike', 'kolonë e gjatë',
      'dendësi trafiku', 'trafik i rënduar', 'fluks i madh i automjeteve', 'vonesa në trafik',
      'ngarkesë në trafik', 'radhë të gjata automjetesh'
    ],
    roadworks: [
      'punime në rrugë', 'punimet në rrugë', 'punime në aksin', 'mbyllje e korsisë',
      'korsi e bllokuar', 'devijim i trafikut', 'riorientim i qarkullimit', 'asfaltim i rrugës',
      'rindërtim i rrugës', 'sinjalistikë rrugore'
    ],
    hazard_weather: [
      'rrëshqitje dheu', 'rrëshqitje e dheut', 'rënie gurësh në rrugë', 'shembje dheu',
      'vërshime në rrugë', 'ujë në rrugë', 'përmbytje e rrugës', 'vërshuar rruga',
      'akull në rrugë', 'ngrica në rrugë', 'borë në rrugë', 'rrugë me borë', 'ngricë në rrugë',
      'dëmtim i rrugës', 'dëmtim i urës', 'shembje e urës', 'gropa në rrugë', 'shembje e rrugës'
    ]
  },
  sr: {
    accident: [
      'saobraćajna nezgoda', 'saobraćajne nezgode', 'saobraćajnoj nezgodi', 'saobraćajnih nezgoda',
      'saobraćajna nesreća', 'saobraćajne nesreće', 'saobraćajnoj nesreći', 'saobraćajnih nesreća',
      'sudar', 'sudara', 'sudarili', 'sudaru', 'lančani sudar',
      'udes', 'udesa', 'udesu', 'prevrtanje vozila', 'sletanje sa puta', 'obaranje pešaka'
    ],
    closure_blockage: [
      'zatvoren put', 'zatvorena ulica', 'zatvoreni putevi', 'zatvaranje puta',
      'blokiran put', 'blokirana ulica', 'blokada puta', 'blokiran saobraćaj',
      'obustava saobraćaja', 'obustavljen saobraćaj', 'prekid saobraćaja',
      'neprohodan put', 'neprohodno za saobraćaj', 'policijska blokada', 'policijska blokada puta'
    ],
    congestion: [
      'saobraćajni zastoj', 'zastoji u saobraćaju', 'zastoj', 'saobraćajna gužva',
      'gužva u saobraćaju', 'gužve u saobraćaju', 'kolona vozila', 'kolone vozila',
      'duge kolone', 'otežan saobraćaj', 'usporen saobraćaj', 'kilometarska kolona'
    ],
    roadworks: [
      'radovi na putu', 'radovi na kolovozu', 'radovi na deonici', 'zatvaranje trake',
      'zatvorena traka', 'preusmeravanje saobraćaja', 'rekonstrukcija puta', 'asfaltiranje puta',
      'popravka kolovoza'
    ],
    hazard_weather: [
      'odron na putu', 'odron kamena', 'odroni na putu', 'odroni', 'klizište', 'klizišta na putu',
      'poplava na putu', 'voda na kolovozu', 'bujica na putu', 'poledica na putu', 'poledica',
      'led na putu', 'sneg na putu', 'snežni nanosi', 'oštećenje puta',
      'oštećenje mosta', 'rupa na kolovozu', 'urušavanje mosta', 'oštećen most'
    ]
  }
};

const NON_TRAFFIC_ACCIDENTAL = /kallash|armë zjarri|arme zjarri|fishek|shkrep.*armë|shkrepur fishek|plagos.*me armë|u vetëvra|vetevra|ubistvo iz nehata|pucanje iz nehata/i;
const NON_TRAFFIC_DISPUTE = /kpk\b|kuvend|parlament|komision|seanc|këshill|keshill|prokuror|gjykat|gjyqës|deputet|ministr|parti\b|parti politike|politik|zgjedh|koalicion|votim|raport.*pun|debat.*politik|përplasje verbale|perplasje verbale/i;

function classifyTrafficIncident(title, description) {
  const text = `${title || ''} ${description || ''}`.toLowerCase();

  if (NON_TRAFFIC_ACCIDENTAL.test(text) && !/aksident trafiku|aksident me veturë|saobraćajn|saobracajn/i.test(text)) {
    return { isTraffic: false, type: null, label: null };
  }

  for (const lang of ['sq', 'sr']) {
    const terms = TRAFFIC_RELEVANCE_TERMS[lang];
    if (!terms) continue;

    for (const term of terms.closure_blockage) {
      if (text.includes(term.toLowerCase())) {
        return { isTraffic: true, type: 'road_closure', label: 'Road Closure / Blockade' };
      }
    }
    for (const term of terms.accident) {
      const termLower = term.toLowerCase();
      if (termLower === 'aksident' && (text.includes('aksidentalisht') || text.includes('aksidentale'))) {
        if (text.includes('aksident trafiku') || text.includes('aksident rrugor') || text.includes('aksident me veturë') || text.includes('aksidenti') || text.includes('aksidente') || text.includes('aksidentuar')) {
          return { isTraffic: true, type: 'accident', label: 'Traffic Accident' };
        }
        continue;
      }
      // Ambiguous collision terms ('përplasje', 'përplasur', 'u përplasën', 'sudar'):
      // Must have vehicular/road context and not be an institutional/political clash
      if (termLower === 'përplasje' || termLower === 'përplasur' || termLower === 'u përplasën' || termLower === 'sudar') {
        const hasVehicleContext = /vetur|automjet|makin|kerr|kamion|autobus|motor|biçiklet|trotinet|këmbësor|kembesor|trafik|komunikacion|magjistral|autostrad|autoudh|korsi|rrug|qarkullim|vozil|automobil|pešak|pesak|kolovoz/i.test(text);
        const isDispute = NON_TRAFFIC_DISPUTE.test(text);
        if (!hasVehicleContext || isDispute) {
          continue;
        }
      }
      if (text.includes(termLower)) {
        return { isTraffic: true, type: 'accident', label: 'Traffic Accident' };
      }
    }
    for (const term of terms.hazard_weather) {
      if (text.includes(term.toLowerCase())) {
        return { isTraffic: true, type: 'hazard', label: 'Road Hazard / Weather' };
      }
    }
    for (const term of terms.roadworks) {
      if (text.includes(term.toLowerCase())) {
        return { isTraffic: true, type: 'roadworks', label: 'Roadworks / Lane Closure' };
      }
    }
    for (const term of terms.congestion) {
      if (text.includes(term.toLowerCase())) {
        return { isTraffic: true, type: 'congestion', label: 'Traffic Congestion' };
      }
    }
  }

  return { isTraffic: false, type: null, label: null };
}

function cleanTextForNewsLocation(text) {
  if (!text) return '';
  let t = String(text).toLowerCase();
  t = t.replace(/mitrovicasot(\.net)?/g, '');
  t = t.replace(/radio\s*(kosovska\s*)?mitrovica(\s*sever)?/g, '');
  t = t.replace(/kossev(\.info)?/g, '');
  t = t.replace(/gazeta\s*express/g, '');
  t = t.replace(/klan\s*kosova/g, '');
  t = t.replace(/indeks\s*online/g, '');
  t = t.replace(/jepize(\.com)?/g, '');
  t = t.replace(/mitropol(\.net)?/g, '');
  t = t.replace(/lajmi(\.net)?/g, '');
  return t;
}

const KOSOVO_LOCATIONS = [
  // North Kosovo Municipalities & Key Towns
  { city: 'Zveçan', lat: 42.9080, lon: 20.8400, keywords: ['zveçan', 'zvečan', 'zvecan', 'banjsk', 'banjska'] },
  { city: 'Leposaviq', lat: 43.1000, lon: 20.8000, keywords: ['jaranja', 'jarinj', 'leposaviq', 'leposavić', 'leposavic', 'sočanic', 'soçanic'] },
  { city: 'Zubin Potok', lat: 42.9100, lon: 20.6900, keywords: ['zubin potok', 'gazivod', 'ujman', 'varag', 'varage'] },
  { city: 'Mitrovicë', lat: 42.8914, lon: 20.8660, keywords: ['mitrovic', 'mitrovica', 'mitrovicë', 'mitrovice', 'severna mitrovica', 'mitrovica e veriut', 'mitrovica e jugut', 'ibër bridge', 'most na ibru', 'ura e ibrit'] },

  // Border Crossings & Key Landmarks
  { city: 'Merdare', lat: 42.9367, lon: 21.2425, keywords: ['merdar', 'merdare'] },
  { city: 'Bërnjak', lat: 42.9667, lon: 20.5500, keywords: ['bërnjak', 'bernjak', 'brnjak'] },

  // Other Kosovo Municipalities & Towns
  { city: 'Prishtinë', lat: 42.6629, lon: 21.1655, keywords: ['prishtin', 'prištin', 'pristina', 'veternik', 'çagllavic', 'caglavic', 'hajvali', 'hajvalia'] },
  { city: 'Graçanicë', lat: 42.6000, lon: 21.1930, keywords: ['graçanic', 'gračanica', 'gracanica'] },
  { city: 'Fushë Kosovë', lat: 42.6340, lon: 21.0960, keywords: ['fushë kosov', 'fushe kosov', 'kosovo polje'] },
  { city: 'Obiliq', lat: 42.6870, lon: 21.0770, keywords: ['obiliq', 'obilić', 'kastriot'] },
  { city: 'Podujevë', lat: 42.9100, lon: 21.1900, keywords: ['podujev', 'podujevo', 'besian', 'lluzhan'] },
  { city: 'Vushtrri', lat: 42.8250, lon: 20.9660, keywords: ['vushtrr', 'vučitrn', 'vucitrn', 'smrekonic', 'smrekovnic'] },
  { city: 'Drenas', lat: 42.6250, lon: 20.8920, keywords: ['drenas', 'gllogoc', 'glogovac', 'komoran'] },
  { city: 'Skenderaj', lat: 42.7480, lon: 20.7890, keywords: ['skenderaj', 'srbica', 'prekaz'] },
  { city: 'Pejë', lat: 42.6593, lon: 20.2887, keywords: ['pejë', 'peje', 'peja', 'peć', 'peći', 'peci', 'pec', 'rugov'] },
  { city: 'Istog', lat: 42.7800, lon: 20.4900, keywords: ['istog', 'istok'] },
  { city: 'Klinë', lat: 42.6210, lon: 20.5780, keywords: ['klinë', 'kline', 'klina'] },
  { city: 'Deçan', lat: 42.5410, lon: 20.2880, keywords: ['deçan', 'decan', 'dečani', 'decani'] },
  { city: 'Gjakovë', lat: 42.3810, lon: 20.4320, keywords: ['gjakov', 'đakovic', 'djakovic'] },
  { city: 'Rahovec', lat: 42.3990, lon: 20.6550, keywords: ['rahovec', 'orahovac'] },
  { city: 'Malishevë', lat: 42.4820, lon: 20.7450, keywords: ['malishev', 'mališevo', 'malisevo'] },
  { city: 'Prizren', lat: 42.2139, lon: 20.7397, keywords: ['prizren', 'shadervan', 'ortakoll', 'bazhderhane'] },
  { city: 'Suharekë', lat: 42.3600, lon: 20.8250, keywords: ['suharek', 'suva reka', 'therand', 'duhël', 'duhel', 'dulje'] },
  { city: 'Shtërpcë', lat: 42.2394, lon: 21.0261, keywords: ['shtërpc', 'shterpc', 'štrpce', 'strpce', 'brezovic'] },
  { city: 'Shtime', lat: 42.4330, lon: 21.0400, keywords: ['shtime', 'štimlje', 'stimlje', 'carralev'] },
  { city: 'Ferizaj', lat: 42.3705, lon: 21.1530, keywords: ['ferizaj', 'uroševac', 'urosevac'] },
  { city: 'Lipjan', lat: 42.5220, lon: 21.1250, keywords: ['lipjan', 'lipljan', 'janjev'] },
  { city: 'Gjilan', lat: 42.4635, lon: 21.4694, keywords: ['gjilan', 'gnjilan', 'gavran'] },
  { city: 'Kamenicë', lat: 42.5780, lon: 21.5800, keywords: ['kamenic', 'kamenica', 'dardan'] },
  { city: 'Viti', lat: 42.3210, lon: 21.3580, keywords: ['vitisë', 'vitise', 'vitia', 'vitinë', 'vitina', 'kllokot', 'klokot'] },
  { city: 'Kaçanik', lat: 42.2300, lon: 21.2600, keywords: ['kaçanik', 'kacanik'] }
];
const KOSOVO_TRAFFIC_LOCATIONS = KOSOVO_LOCATIONS;

function matchesLocationKeyword(text, kw) {
  if (!text || !kw) return false;
  const t = text.toLowerCase();
  const k = kw.toLowerCase();
  const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (k.length <= 4) {
    const regex = new RegExp(`(?<![a-z0-9ëçčćžšđ])${escaped}(?![a-z0-9ëçčćžšđ])`, 'i');
    return regex.test(t);
  }
  const regex = new RegExp(`(?<![a-z0-9ëçčćžšđ])${escaped}`, 'i');
  return regex.test(t);
}

function extractNewsLocation(item) {
  if (!item) return null;

  // 1. Explicit coordinates on item object
  if (item.location && typeof item.location.lat === 'number' && typeof item.location.lon === 'number') {
    return {
      city: item.location.city || item.location.name || 'Explicit Location',
      lat: item.location.lat,
      lon: item.location.lon
    };
  }
  if (item.coords && Array.isArray(item.coords) && item.coords.length === 2 && typeof item.coords[0] === 'number' && typeof item.coords[1] === 'number') {
    return {
      city: item.city || 'Explicit Location',
      lat: item.coords[1],
      lon: item.coords[0]
    };
  }
  if (item.coordinates && typeof item.coordinates.lat === 'number' && typeof item.coordinates.lon === 'number') {
    return {
      city: item.city || 'Explicit Location',
      lat: item.coordinates.lat,
      lon: item.coordinates.lon
    };
  }
  if (typeof item.lat === 'number' && typeof item.lon === 'number') {
    return {
      city: item.city || (typeof item.location === 'string' ? item.location : 'Explicit Location'),
      lat: item.lat,
      lon: item.lon
    };
  }

  // 2. Explicit location/city string property on item
  const explicitCityStr = (typeof item.location === 'string' && item.location) || (typeof item.city === 'string' && item.city);
  if (explicitCityStr) {
    const cleanedExplicit = cleanTextForNewsLocation(explicitCityStr);
    for (const loc of KOSOVO_LOCATIONS) {
      for (const kw of loc.keywords) {
        if (matchesLocationKeyword(cleanedExplicit, kw)) {
          return { city: loc.city, lat: loc.lat, lon: loc.lon };
        }
      }
    }
  }

  // 3. Extract location from headline (title)
  const cleanTitle = cleanTextForNewsLocation(item.title);
  if (cleanTitle) {
    for (const loc of KOSOVO_LOCATIONS) {
      for (const kw of loc.keywords) {
        if (matchesLocationKeyword(cleanTitle, kw)) {
          return { city: loc.city, lat: loc.lat, lon: loc.lon };
        }
      }
    }
  }

  // 4. Extract location from description
  const cleanDesc = cleanTextForNewsLocation(item.description);
  if (cleanDesc) {
    for (const loc of KOSOVO_LOCATIONS) {
      for (const kw of loc.keywords) {
        if (matchesLocationKeyword(cleanDesc, kw)) {
          return { city: loc.city, lat: loc.lat, lon: loc.lon };
        }
      }
    }
  }

  // 5. Unresolved location -> return null (no marker on map)
  return null;
}

function extractTrafficLocation(title, description) {
  const cleanTitle = cleanTextForNewsLocation(title);
  const cleanDesc = cleanTextForNewsLocation(description);
  for (const loc of KOSOVO_LOCATIONS) {
    for (const kw of loc.keywords) {
      if (matchesLocationKeyword(cleanTitle, kw)) return { city: loc.city, lat: loc.lat, lon: loc.lon };
    }
  }
  for (const loc of KOSOVO_LOCATIONS) {
    for (const kw of loc.keywords) {
      if (matchesLocationKeyword(cleanDesc, kw)) return { city: loc.city, lat: loc.lat, lon: loc.lon };
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
  if (!traffic || traffic.error) {
    $('incidentList').innerHTML = `<div class="error-state">Traffic data unavailable</div>`;
    return;
  }

  $('trafficMeta').textContent = `via intelligence RSS feeds`;
  $('trafficAnomaly').style.display = traffic.anomalyDetected ? '' : 'none';
  $('trafficAnomalyBanner').style.display = traffic.anomalyDetected ? '' : 'none';
  if (traffic.anomalyDetected) $('trafficAnomalyBanner').textContent = `🚨 ${traffic.anomalySummary}`;

  const incidents = traffic.incidents || [];
  if (incidents.length === 0) {
    $('incidentList').innerHTML = '<div class="empty-state">No active traffic incidents reported</div>';
    return;
  }

  $('incidentList').innerHTML = incidents.map(inc => {
    const typeLabel = inc.typeLabel || (inc.type ? inc.type.replace(/_/g, ' ').toUpperCase() : 'TRAFFIC INCIDENT');
    return `
      <div class="incident-item ${inc.anomaly ? 'anomaly' : ''}">
        <div class="incident-body">
          <div class="incident-type">
            <span class="incident-badge">${escHtml(typeLabel)}</span>
            ${inc.location?.city ? ` <span class="incident-road">📍 ${escHtml(inc.location.city)}</span>` : ''}
            ${inc.anomaly ? `<span class="incident-anomaly-tag">⚠ ${escHtml(inc.anomalyType || 'ANOMALY')}</span>` : ''}
          </div>
          <div class="incident-title" style="font-weight:600;font-size:12px;margin:4px 0 2px;color:#f1f5f9;">${escHtml(inc.title)}</div>
          <div class="incident-desc">${escHtml(inc.description)}</div>
          <div class="incident-source">📰 ${escHtml(inc.source)} · ${formatTimeAgo(inc.publishedAt)}</div>
          ${inc.url && inc.url !== '#' ? `<div class="incident-link"><a href="${escHtml(inc.url)}" target="_blank" rel="noopener noreferrer">Read source article ↗</a></div>` : ''}
        </div>
      </div>
    `;
  }).join('');
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

  // Strictly filter for incidents with VALID geographic coordinates (NO FAKE MARKERS)
  const geoIncidents = data.incidents.filter(inc => inc.location && typeof inc.location.lat === 'number' && typeof inc.location.lon === 'number');

  geoIncidents.forEach(inc => {
    const isCritical = inc.type === 'road_closure' || inc.anomaly;
    const color = isCritical ? '#f87171' : (inc.type === 'accident' ? '#fb923c' : '#fbbf24');
    const typeLabel = inc.typeLabel || (inc.type ? inc.type.replace(/_/g, ' ') : 'Traffic Event');

    const popupHtml = buildMapPopupHtml({
      icon: '🚦',
      title: typeLabel,
      subtitle: inc.location.city || 'Kosovo Road',
      source: inc.source || 'Traffic Intelligence',
      badge: inc.anomaly ? { text: 'ANOMALY', color: '#f87171' } : { text: 'ACTIVE', color: '#fb923c' },
      description: inc.title + (inc.description && inc.description !== inc.title ? ` — ${inc.description}` : ''),
      stats: [
        { label: 'Location', val: inc.location.city || 'Kosovo Road' },
        { label: 'Type', val: typeLabel },
        { label: 'Reported', val: formatTimeAgo(inc.publishedAt) }
      ],
      linkUrl: inc.url && inc.url !== '#' ? inc.url : undefined,
      footer: `REPORTED: ${formatTimeAgo(inc.publishedAt).toUpperCase()} · SOURCE: ${escHtml((inc.source || 'TRAFFIC INTEL').toUpperCase())}`
    });

    const markerEl = createMapMarkerElement(color, isCritical ? 14 : 12, 2);
    if (isCritical) {
      markerEl.classList.add('threat-pulse-critical');
    }

    const marker = new maplibregl.Marker({ element: markerEl })
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
  const gaugeColor = { normal: 'var(--green)', elevated: 'var(--amber)', high: 'var(--orange)', critical: 'var(--red)' }[p.status] || 'var(--cyan)';
  $('radiationPrimary').innerHTML = `
    <div class="radiation-gauge">
      <svg class="gauge-svg" viewBox="0 0 100 100">
        <circle class="gauge-track" cx="50" cy="50" r="40"/>
        <circle class="gauge-fill" cx="50" cy="50" r="40" stroke="${gaugeColor}" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference - (pct / 100) * circumference}"/>
      </svg>
      <div class="gauge-center"><div class="gauge-value" style="color:${gaugeColor}">${p.usvh.toFixed(3)}</div><div class="gauge-unit">µSv/h</div></div>
    </div>
    <div class="radiation-info">
      <div class="radiation-status status-${p.status}">${p.status.toUpperCase()}</div>
      <div class="radiation-sensor">📡 ${escHtml(p.sensorName)}${p.sensorDistanceKm ? ` (${p.sensorDistanceKm}km away)` : ''}</div>
      <div class="radiation-quality">Baseline: ${rad.baseline} µSv/h · ${rad.dataQuality?.toUpperCase()}</div>
    </div>`;
  $('radiationNeighbors').innerHTML = `<table class="neighbor-table"><thead><tr><th>Region</th><th>Dist.</th><th>µSv/h</th><th>Status</th></tr></thead><tbody>${(rad.neighbors || []).map(n => `<tr><td>${escHtml(n.name)}</td><td>${n.distanceKm}km</td><td>${n.usvh.toFixed(3)}</td><td><span class="rad-status-pill pill-${n.status}">${n.status}</span></td></tr>`).join('')
    }</tbody></table>`;
}

function renderRadiationMarkers(radData) {
  renderRadiationMapMarkers(radData);
}

function renderRadiationMapMarkers(radData) {
  if (!state.map) return;
  const isEnabled = $('toggleLayerRadiation') ? $('toggleLayerRadiation').checked : true;
  clearMarkerList(moduleLayers.radiation.markers);
  if (!isEnabled) {
    updateMapBadgeAndMeta();
    return;
  }

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
      subtitle: 'EURDEP Sensor Station',
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
      ],
      footer: `STATUS: ${(n.status || 'NORMAL').toUpperCase()} · SOURCE: EURDEP NETWORK`
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
      { name: 'PM10', val: c.pm10, unit: 'μg/m³' },
      { name: 'NO₂', val: c.no2, unit: 'μg/m³' },
      { name: 'O₃', val: c.o3, unit: 'μg/m³' },
      { name: 'SO₂', val: c.so2, unit: 'μg/m³' },
      { name: 'CO', val: c.co, unit: 'μg/m³' },
      { name: 'Dust', val: c.dust, unit: 'μg/m³' }
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

  const sig = (data.earthquakes || []).filter(e => e.magnitude >= 3.0).length;
  $('eqBadge').style.display = sig > 0 ? '' : 'none';
  $('eqBadge').textContent = sig > 0 ? `${sig} SIGNIFICANT` : '';

  $('earthquakeList').innerHTML = (data.earthquakes || []).length
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

function logSeismicMarkerDebug(eq, element) {
  if (!state.map) return;
  const projected = state.map.project([eq.lon, eq.lat]);
  const container = state.map.getContainer();
  const containerRect = container ? container.getBoundingClientRect() : { left: 0, top: 0 };
  const markerRect = element ? element.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };

  const mapProjectedX = projected.x.toFixed(2);
  const mapProjectedY = projected.y.toFixed(2);
  const containerX = (containerRect.left + projected.x).toFixed(2);
  const containerY = (containerRect.top + projected.y).toFixed(2);
  const finalMarkerX = (markerRect.left + markerRect.width / 2).toFixed(2);
  const finalMarkerY = (markerRect.top + markerRect.height / 2).toFixed(2);

  console.log(`[seismic-marker]\n` +
    `eventId=${eq.id || 'N/A'}\n` +
    `latitude=${eq.lat}\n` +
    `longitude=${eq.lon}\n` +
    `country=${eq.place || 'Unknown'}\n` +
    `mapProjectedX=${mapProjectedX}\n` +
    `mapProjectedY=${mapProjectedY}\n` +
    `containerX=${containerX}\n` +
    `containerY=${containerY}\n` +
    `finalMarkerX=${finalMarkerX}\n` +
    `finalMarkerY=${finalMarkerY}`
  );
}

function debugSeismicMarkers() {
  if (!moduleLayers.earthquake?.markers || moduleLayers.earthquake.markers.length === 0) {
    console.log('[seismic-marker] No active seismic markers on map.');
    return;
  }
  console.log(`=== SEISMIC MARKERS COORDINATE AUDIT (${moduleLayers.earthquake.markers.length} MARKERS) ===`);
  moduleLayers.earthquake.markers.forEach((m, idx) => {
    const eq = m._eqData;
    const el = m.getElement ? m.getElement() : m._element;
    if (eq && el) {
      console.log(`--- Marker #${idx + 1} ---`);
      logSeismicMarkerDebug(eq, el);
    }
  });
}

function renderEarthquakeMapMarkers(eqData) {
  if (!state.map) return;
  const isEnabled = $('toggleLayerSeismic') ? $('toggleLayerSeismic').checked : true;
  clearMarkerList(moduleLayers.earthquake.markers);
  if (!isEnabled) {
    updateMapBadgeAndMeta();
    return;
  }

  const data = eqData || state.data?.earthquakes;
  if (!data || data.error || !Array.isArray(data.earthquakes)) {
    updateMapBadgeAndMeta();
    return;
  }

  const isDebug = window._DEBUG_SEISMIC || 
    (typeof window.location !== 'undefined' && (window.location.search.includes('debug=seismic') || window.location.search.includes('debug=true')));

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
      subtitle: eq.place || 'Regional Event',
      source: data.source || 'USGS / EMSC',
      badge: { text: `M${eq.magnitude.toFixed(1)} · ${(eq.label || 'Earthquake').toUpperCase()}`, color },
      primary: {
        val: `M${eq.magnitude.toFixed(1)}`,
        sub: eq.label || 'Earthquake',
        secondary: `${eq.place} (${eq.distanceKm} km away)`
      },
      stats: [
        { label: 'Depth', val: `${eq.depth} km` },
        { label: 'Magnitude', val: eq.magnitude.toFixed(1), color },
        { label: 'Distance', val: `${eq.distanceKm} km` },
        { label: 'Time', val: formatHour(eq.time) || 'Recent' }
      ],
      footer: `REPORTED: ${formatTimeAgo(eq.time).toUpperCase()} · SOURCE: USGS / EMSC`
    });

    const marker = new maplibregl.Marker({ element, anchor: 'center' })
      .setLngLat([eq.lon, eq.lat])
      .setPopup(createMapPopup(popupHtml))
      .addTo(state.map);

    marker._module = 'earthquake';
    marker._eqData = eq;
    moduleLayers.earthquake.markers.push(marker);

    if (isDebug) {
      logSeismicMarkerDebug(eq, element);
    }
  });
  updateMapBadgeAndMeta();
}

function buildNewsPopupHtml(item) {
  if (!item) return '';

  const s = item.intensityScore || 5;
  const sev = (item.severity ? item.severity.toUpperCase() : (s >= 9 ? 'CRITICAL' : (s >= 7 ? 'HIGH' : (s >= 5 ? 'MEDIUM' : 'LOW'))));
  const color = sev === 'CRITICAL' ? '#f87171' : sev === 'HIGH' ? '#fb923c' : sev === 'MEDIUM' ? '#fbbf24' : '#34d399';

  const eventTitle = item.title || item.canonicalTitle || 'News Intelligence Event';
  const rawUrl = item.url ? item.url.trim() : '';
  const url = isValidArticleUrl(rawUrl) ? rawUrl : (rawUrl && rawUrl !== '#' && !rawUrl.startsWith('#') ? rawUrl : '');

  const status = item.status || 'DEVELOPING';
  const statusClass = `status-${status.toLowerCase()}`;

  const sourceCount = item.sourceCount || (Array.isArray(item.sources) ? item.sources.length : 1);
  const indSourceCount = item.independentSourceCount || item.uniqueSourceCount || 1;
  const devCount = item.developmentCount || (Array.isArray(item.developments) ? item.developments.length : 1);

  const developments = Array.isArray(item.developments) ? item.developments : [];

  const headlineHtml = url ? `
    <a class="news-popup-headline-link" href="${escHtml(url)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" title="Open article on source website">
      ${escHtml(eventTitle)}
    </a>
  ` : `
    <div class="news-popup-headline">${escHtml(eventTitle)}</div>
  `;

  const developmentsTimelineHtml = developments.length > 0 ? `
    <div class="news-event-developments">
      <div class="news-developments-title">TIMELINE DEVELOPMENTS (${devCount})</div>
      <div class="news-developments-list">
        ${developments.map(d => `
          <div class="news-dev-item">
            <div class="news-dev-header">
              <span class="news-dev-type news-dev-${(d.type || 'update').toLowerCase()}">${escHtml(d.type || 'UPDATE')}</span>
              <span class="news-dev-time">${d.timestamp ? escHtml(formatTimeAgo(d.timestamp)) : ''}</span>
            </div>
            <div class="news-dev-summary">${escHtml(d.title || d.summary || '')}</div>
            <div class="news-dev-source" style="font-size:9.5px; color:var(--text-dim); font-family:var(--font-mono);">
              ${escHtml(Array.isArray(d.sources) ? d.sources.join(', ') : d.source || '')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  const eventContent = `
    <div class="news-event">
      <div class="news-event-header">
        <span class="news-event-status-badge ${statusClass}">STATUS: ${escHtml(status)}</span>
      </div>
      <div class="news-event-metrics-bar">
        <span>${sourceCount} SOURCES</span>
        <span>·</span>
        <span>${indSourceCount} INDEPENDENT</span>
        <span>·</span>
        <span>${devCount} DEVELOPMENTS</span>
      </div>
      ${headlineHtml}
      ${developmentsTimelineHtml}
    </div>
  `;

  return buildMapPopupHtml({
    icon: '📰',
    title: 'NEWS EVENT',
    source: item.source || item.primarySource || 'News Feed',
    badge: { text: sev, color },
    contentHtml: eventContent,
    stats: []
  });
}

function createNewsClusterMarkerElement(cluster, highestSeverity = 'normal') {
  const el = document.createElement('div');
  const count = (cluster && Array.isArray(cluster.items)) ? cluster.items.length : 1;
  const sevUpper = String(highestSeverity || '').toUpperCase();
  const sevClass = sevUpper === 'CRITICAL' ? 'cluster-critical' : (sevUpper === 'HIGH' ? 'cluster-high' : '');

  el.className = `map-cluster-marker ${sevClass}`;
  el.style.cursor = 'pointer';
  el.innerHTML = `
    <span class="map-cluster-icon">📰</span>
    <span class="map-cluster-count">${count}</span>
  `;

  if (sevUpper === 'CRITICAL') {
    const radar = document.createElement('div');
    radar.className = 'radar-ring critical';
    el.appendChild(radar);
  }

  return el;
}

function buildNewsClusterPopupHtml(cluster) {
  if (!cluster || !Array.isArray(cluster.items) || cluster.items.length === 0) return '';

  const count = cluster.items.length;
  const items = cluster.items.map(entry => entry.item || entry);

  const hasCritical = items.some(i => (i.severity ? i.severity.toLowerCase() === 'critical' : (i.intensityScore || 0) >= 9));
  const hasHigh = items.some(i => (i.severity ? i.severity.toLowerCase() === 'high' : (i.intensityScore || 0) >= 7));
  const highestSev = hasCritical ? 'CRITICAL' : (hasHigh ? 'HIGH' : 'MEDIUM');
  const badgeColor = highestSev === 'CRITICAL' ? '#f87171' : (highestSev === 'HIGH' ? '#fb923c' : '#fbbf24');

  const storiesHtml = items.map((item, idx) => {
    const s = item.intensityScore || 5;
    const itemSev = (item.severity ? item.severity.toUpperCase() : (s >= 9 ? 'CRITICAL' : (s >= 7 ? 'HIGH' : (s >= 5 ? 'MEDIUM' : 'LOW'))));
    const itemColor = itemSev === 'CRITICAL' ? '#f87171' : itemSev === 'HIGH' ? '#fb923c' : itemSev === 'MEDIUM' ? '#fbbf24' : '#34d399';

    const titleText = item.title || 'News Story';
    const rawUrl = item.url ? item.url.trim() : '';
    const url = isValidArticleUrl(rawUrl) ? rawUrl : (rawUrl && rawUrl !== '#' && !rawUrl.startsWith('#') ? rawUrl : '');

    const timeAgoStr = item.publishedAt ? formatTimeAgo(item.publishedAt) : '';
    const sourceStr = item.source || (Array.isArray(item.sources) ? item.sources.join(', ') : 'News Feed');

    const headlineHtml = url ? `
      <a class="news-popup-headline-link" href="${escHtml(url)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" title="Open article on source website">
        ${escHtml(titleText)}
      </a>
    ` : `
      <div class="news-popup-headline">${escHtml(titleText)}</div>
    `;

    return `
      <div class="news-cluster-item" style="${idx > 0 ? 'margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08);' : ''}">
        <div class="news-cluster-item-header" style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
          <span class="map-popup-badge" style="background:${itemColor}20; color:${itemColor}; border:1px solid ${itemColor}40; font-size: 9px; padding: 1px 5px;">
            ${escHtml(itemSev)}
          </span>
          <span class="news-cluster-item-source" style="font-size: 9.5px; color: var(--text-dim); font-family: var(--font-mono); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${escHtml(sourceStr)}${timeAgoStr ? ` · ${escHtml(timeAgoStr)}` : ''}
          </span>
        </div>
        ${headlineHtml}
      </div>
    `;
  }).join('');

  const clusterContent = `
    <div class="news-cluster-story-list" style="max-height: 240px; overflow-y: auto; padding-right: 2px;">
      ${storiesHtml}
    </div>
  `;

  const footerBtn = `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
      <span style="font-size: 9.5px; color: var(--text-dim); font-family: var(--font-mono);">${count} STORIES IN CLUSTER</span>
      <button class="layer-btn" onclick="event.stopPropagation(); zoomToNewsCluster(${cluster.lng}, ${cluster.lat})" style="font-size: 10px; padding: 2px 8px;">
        🔍 Zoom In
      </button>
    </div>
  `;

  return buildMapPopupHtml({
    icon: '📰',
    title: `NEWS CLUSTER (${count})`,
    source: 'News Intelligence',
    badge: { text: highestSev, color: badgeColor },
    contentHtml: clusterContent,
    footer: footerBtn
  });
}

function zoomToNewsCluster(lng, lat) {
  if (!state.map) return;
  state.map.flyTo({
    center: [lng, lat],
    zoom: Math.min(14, state.map.getZoom() + 2.5),
    duration: 700
  });
}

function closeNewsPopup() {
  closeMapPopup();
  state.selectedNewsItemId = null;
  state.selectedNewsClusterId = null;
  if (moduleLayers.news?.markers) {
    moduleLayers.news.markers.forEach(m => {
      const el = m.getElement ? m.getElement() : m._element;
      if (el) el.classList.remove('active');
    });
  }
}

function openNewsClusterPopup(cluster, coords, markerEl = null) {
  if (!state.map) return null;

  closeMapPopup();
  const clusterId = `cluster-${cluster.lng.toFixed(4)}-${cluster.lat.toFixed(4)}-${cluster.items.length}`;
  state.selectedNewsClusterId = clusterId;
  state.selectedNewsItemId = null;

  if (moduleLayers.news?.markers) {
    moduleLayers.news.markers.forEach(m => {
      const el = m.getElement ? m.getElement() : m._element;
      if (el) {
        if (m._clusterId === clusterId) el.classList.add('active');
        else el.classList.remove('active');
      }
    });
  }

  const html = buildNewsClusterPopupHtml(cluster);
  const popup = createMapPopup(html, { className: 'news-map-popup news-cluster-popup' })
    .setLngLat(coords);

  popup.on('close', () => {
    if (state.activeMapPopup === popup) {
      state.activeMapPopup = null;
      state.selectedNewsClusterId = null;
      if (moduleLayers.news?.markers) {
        moduleLayers.news.markers.forEach(m => {
          const el = m.getElement ? m.getElement() : m._element;
          if (el) el.classList.remove('active');
        });
      }
    }
    updateMapBadgeAndMeta();
  });

  popup.addTo(state.map);
  state.activeMapPopup = popup;
  return popup;
}

function openNewsPopup(item, coords, markerEl = null) {
  if (!state.map) return null;

  closeMapPopup();
  const itemId = item.id || item.url || item.title;
  state.selectedNewsItemId = itemId;

  // Synchronize active class on all news markers
  if (moduleLayers.news?.markers) {
    moduleLayers.news.markers.forEach(m => {
      const el = m.getElement ? m.getElement() : m._element;
      if (el) {
        if (m._newsItemId === itemId) el.classList.add('active');
        else el.classList.remove('active');
      }
    });
  }

  const html = buildNewsPopupHtml(item);
  const popup = createMapPopup(html, { className: 'news-map-popup' })
    .setLngLat(coords);

  popup.on('close', () => {
    if (state.activeMapPopup === popup) {
      state.activeMapPopup = null;
      state.selectedNewsItemId = null;
      if (moduleLayers.news?.markers) {
        moduleLayers.news.markers.forEach(m => {
          const el = m.getElement ? m.getElement() : m._element;
          if (el) el.classList.remove('active');
        });
      }
    }
    updateMapBadgeAndMeta();
  });

  popup.addTo(state.map);
  state.activeMapPopup = popup;
  return popup;
}

const SOURCE_AUTHORITY_APP = {
  'Koha Ditore': 100,
  'Koha': 100,
  'Koha.net': 100,
  'Radio Kim': 90,
  'Kallxo': 90,
  'Gazeta Express': 80,
  'Telegrafi': 80,
  'RTK': 80,
  'Radio Kosova': 75,
  'Tanjug': 70,
  'Kossev': 70,
  'Indeksonline': 60,
  'Botasot': 60,
  'Reporteri': 60,
  'Bota Sot': 60,
  'Syri': 50
};

function normalizeUrlForDedup(url) {
  if (!url || typeof url !== 'string' || url === '#') return '';
  try {
    const u = new URL(url);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'fbclid'].forEach(p => u.searchParams.delete(p));
    let clean = (u.hostname.replace(/^www\./, '') + u.pathname + u.search).toLowerCase();
    return clean.replace(/\/+$/, '');
  } catch (e) {
    return url.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
  }
}

function normalizeHeadlineForDedup(title) {
  if (!title || typeof title !== 'string') return '';
  let text = title.toLowerCase();

  text = text.replace(/\[(video|foto|e plotë|audio|live|pamje|lajm i fundit)\]/gi, '');
  text = text.replace(/\((video|foto|e plotë|audio|live|pamje|lajm i fundit)\)/gi, '');

  text = text.replace(/\s*[\-\|]\s*(gazeta\s+express|koha(\.net)?|telegrafi|rtk|radiokim|tanjug|botasot|indeksonline|reporteri|syri|veriu\.info|zëri|zeri)\s*$/gi, '');
  text = text.replace(/^(rtk|express|koha|telegrafi|tanjug|indeksonline|reporteri):\s*/gi, '');

  text = text.replace(/[^\p{L}\p{N}\s]/gu, ' ');
  return text.trim().replace(/\s+/g, ' ');
}

function calculateTitleSimilarityForDedup(title1, title2) {
  const norm1 = normalizeHeadlineForDedup(title1);
  const norm2 = normalizeHeadlineForDedup(title2);

  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;

  const tokens1 = norm1.split(' ').filter(w => w.length > 1);
  const tokens2 = norm2.split(' ').filter(w => w.length > 1);

  if (tokens1.length === 0 || tokens2.length === 0) return 0.0;

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  let common = 0;
  for (const t of set1) {
    if (set2.has(t)) common++;
  }

  const dice = (2 * common) / (tokens1.length + tokens2.length);
  const minTokens = Math.min(tokens1.length, tokens2.length);
  const containment = common / minTokens;

  if (minTokens <= 3) {
    return norm1 === norm2 ? 1.0 : (common === minTokens && tokens1.length === tokens2.length ? 1.0 : dice * 0.8);
  }

  if (containment >= 0.9 && dice >= 0.75) {
    return Math.max(dice, containment);
  }

  return dice;
}

function isDuplicateStoryForDedup(itemA, itemB, similarityThreshold = 0.82) {
  const normUrlA = normalizeUrlForDedup(itemA.url);
  const normUrlB = normalizeUrlForDedup(itemB.url);

  if (normUrlA && normUrlB && normUrlA === normUrlB) {
    return true;
  }

  const sim = calculateTitleSimilarityForDedup(itemA.title, itemB.title);
  return sim >= similarityThreshold;
}

function deduplicateNewsItems(items, similarityThreshold = 0.82) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const getAuthority = (item) => {
    if (typeof item.reliability === 'number') return item.reliability * 100;
    return SOURCE_AUTHORITY_APP[item.source] || 50;
  };

  const getTimestamp = (item) => {
    const t = new Date(item.publishedAt).getTime();
    return isNaN(t) ? Date.now() : t;
  };

  const uniqueGroups = [];

  for (let idx = 0; idx < items.length; idx++) {
    const current = items[idx];
    let matchedGroup = null;

    for (const group of uniqueGroups) {
      if (group.some(existing => isDuplicateStoryForDedup(existing, current, similarityThreshold))) {
        matchedGroup = group;
        break;
      }
    }

    if (matchedGroup) {
      matchedGroup.push(current);
    } else {
      uniqueGroups.push([current]);
    }
  }

  return uniqueGroups.map(group => {
    group.sort((a, b) => {
      const authA = getAuthority(a);
      const authB = getAuthority(b);
      if (authA !== authB) return authB - authA;
      const timeA = getTimestamp(a);
      const timeB = getTimestamp(b);
      if (timeA !== timeB) return timeA - timeB;
      return 0;
    });

    const primary = group[0];
    const allSources = [...new Set(group.flatMap(g => g.sources || [g.source]))];

    return {
      ...primary,
      sources: allSources,
      sourceCount: allSources.length
    };
  });
}

function renderNewsMapMarkers(newsData) {
  if (!state.map || state.activeMapModule !== 'news') return;
  clearMarkerList(moduleLayers.news.markers);

  const data = newsData || state.data?.news;
  if (!data || data.error || !Array.isArray(data.items)) {
    updateMapBadgeAndMeta();
    return;
  }

  const eventItems = data.items;

  const itemsWithCoords = [];
  eventItems.forEach((item, idx) => {
    const loc = extractNewsLocation(item);
    if (loc && typeof loc.lat === 'number' && typeof loc.lon === 'number') {
      const s = item.intensityScore || 5;
      const sev = (item.severity ? item.severity.toUpperCase() : (s >= 9 ? 'CRITICAL' : (s >= 7 ? 'HIGH' : (s >= 5 ? 'MEDIUM' : 'LOW'))));
      const color = sev === 'CRITICAL' ? '#f87171' : sev === 'HIGH' ? '#fb923c' : sev === 'MEDIUM' ? '#fbbf24' : '#34d399';
      const itemId = item.id || item.url || `news-${idx}-${loc.city}`;
      itemsWithCoords.push({ item, loc, sev, color, itemId, coords: [loc.lon, loc.lat] });
    }
  });

  const clusters = clusterGeoItems(itemsWithCoords, d => d.coords);

  clusters.forEach(c => {
    if (c.isCluster) {
      const hasCritical = c.items.some(i => i.sev === 'CRITICAL');
      const hasHigh = c.items.some(i => i.sev === 'HIGH');
      const highestSev = hasCritical ? 'CRITICAL' : (hasHigh ? 'HIGH' : 'NORMAL');
      const clusterId = `cluster-${c.lng.toFixed(4)}-${c.lat.toFixed(4)}-${c.items.length}`;
      const markerEl = createNewsClusterMarkerElement(c, highestSev);
      markerEl.dataset.clusterId = clusterId;

      markerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (state.selectedNewsClusterId === clusterId && state.activeMapPopup) {
          closeNewsPopup();
          updateMapBadgeAndMeta();
          return;
        }

        openNewsClusterPopup(c, [c.lng, c.lat], markerEl);
      });

      const marker = new maplibregl.Marker({ element: markerEl })
        .setLngLat([c.lng, c.lat])
        .addTo(state.map);
      marker._module = 'news';
      marker._clusterId = clusterId;
      moduleLayers.news.markers.push(marker);
    } else {
      const { item, color, itemId, coords, sev } = c.item;
      const el = createMapMarkerElement(color, 12, 2, sev);
      el.dataset.newsId = itemId;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (state.selectedNewsItemId === itemId && state.activeMapPopup) {
          closeNewsPopup();
          updateMapBadgeAndMeta();
          return;
        }

        openNewsPopup(item, coords, el);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(coords)
        .addTo(state.map);

      marker._module = 'news';
      marker._newsItemId = itemId;
      moduleLayers.news.markers.push(marker);
    }
  });

  updateMapBadgeAndMeta();
}

function createWeatherMarkerElement(city, weatherData = null, isActive = false) {
  const container = document.createElement('div');
  container.className = `weather-custom-marker ${isActive ? 'active' : ''}`;
  container.dataset.cityId = city.id;
  container.setAttribute('title', `Weather for ${city.name} — Click for details`);

  const hasTemp = weatherData && typeof weatherData.current?.temp === 'number';
  const iconText = hasTemp ? weatherIcon(weatherData.current.weatherCode) : '🌤️';
  const tempText = hasTemp ? `${weatherData.current.temp}°C` : '—';

  const pill = document.createElement('div');
  pill.className = 'weather-marker-pill';

  const iconEl = document.createElement('span');
  iconEl.className = 'weather-marker-icon';
  iconEl.textContent = iconText;
  pill.appendChild(iconEl);

  const nameEl = document.createElement('span');
  nameEl.className = 'weather-marker-name';
  nameEl.textContent = city.name;
  pill.appendChild(nameEl);

  const tempEl = document.createElement('span');
  tempEl.className = `weather-marker-temp ${hasTemp ? '' : 'loading'}`;
  tempEl.textContent = tempText;
  pill.appendChild(tempEl);

  container.appendChild(pill);

  container.addEventListener('click', (e) => {
    e.stopPropagation();
    e.stopImmediatePropagation();
    selectWeatherCity(city.id, true);
  });

  return container;
}

function renderWeatherMapMarkers(initialWeatherData = null) {
  const showLayer = $('toggleLayerWeather') ? $('toggleLayerWeather').checked : false;
  if (!state.map || !showLayer) return;
  clearMarkerList(moduleLayers.weather.markers);

  if (!state.weatherCache) state.weatherCache = {};

  // If initial status weather arrived for a specific city, seed that specific city's cache
  if (initialWeatherData && typeof initialWeatherData.current?.temp === 'number') {
    const loc = (initialWeatherData.location || '').toLowerCase();
    const matchedCity = KOSOVO_WEATHER_CITIES.find(c => c.name.toLowerCase() === loc || c.id === loc) || KOSOVO_WEATHER_CITIES[0];
    if (matchedCity && (!state.weatherCache[matchedCity.id] || !state.weatherCache[matchedCity.id].data)) {
      state.weatherCache[matchedCity.id] = { data: initialWeatherData, fetchedAt: Date.now() };
    }
  }

  const selectedId = state.selectedWeatherCityId;

  KOSOVO_WEATHER_CITIES.forEach(city => {
    const isActive = (city.id === selectedId) && (state.weatherPopup !== null);
    const cachedData = state.weatherCache[city.id]?.data || null;

    const el = createWeatherMarkerElement(city, cachedData, isActive);
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([city.lon, city.lat])
      .addTo(state.map);

    marker._module = 'weather';
    marker._cityId = city.id;
    moduleLayers.weather.markers.push(marker);
  });

  updateMapBadgeAndMeta();

  // Asynchronously fetch weather for all cities immediately to populate temperatures without clicking
  fetchAllWeatherCities();
}

function renderAqiMapMarkers(aqiData) {
  const showLayer = $('toggleLayerAqi') ? $('toggleLayerAqi').checked : true;
  if (!state.map || !showLayer) return;
  clearMarkerList(moduleLayers.aqi.markers);

  const data = aqiData || state.data?.aqi;
  if (!data || data.status !== 'LIVE_DATA') {
    updateMapBadgeAndMeta();
    return;
  }

  const stationsToRender = Array.isArray(data.stations) && data.stations.length > 0
    ? data.stations
    : (data.coordinates && data.current ? [{
        name: data.location || 'Kosovo AQI Station',
        coordinates: data.coordinates,
        current: data.current
      }] : []);

  stationsToRender.forEach(st => {
    const coords = st.coordinates || { lat: st.lat, lon: st.lon };
    if (!coords || typeof coords.lat !== 'number' || typeof coords.lon !== 'number') return;
    const c = st.current;
    if (!c) return;

    const color = c.color || (c.category?.color) || '#34d399';
    const label = c.label || c.category?.label || 'Good';
    const popupHtml = buildMapPopupHtml({
      icon: '🌍',
      title: st.name || 'Air Quality Station',
      subtitle: 'European Air Quality (EAQI)',
      source: data.source || 'Open-Meteo & CAMS',
      badge: { text: String(label).toUpperCase(), color },
      primary: {
        val: `EAQI ${c.europeanAQI ?? 'N/A'}`,
        sub: label || 'Air Quality',
        secondary: `Dominant: ${String(c.dominantPollutant || 'PM2.5').toUpperCase()}`
      },
      stats: [
        { label: 'PM2.5', val: c.pm2_5 != null ? `${c.pm2_5} µg/m³` : (c.pollutants?.pm2_5 ? `${c.pollutants.pm2_5.value} µg/m³` : 'N/A') },
        { label: 'PM10', val: c.pm10 != null ? `${c.pm10} µg/m³` : (c.pollutants?.pm10 ? `${c.pollutants.pm10.value} µg/m³` : 'N/A') },
        { label: 'NO2', val: c.no2 != null ? `${c.no2} µg/m³` : (c.pollutants?.no2 ? `${c.pollutants.no2.value} µg/m³` : 'N/A') },
        { label: 'O3', val: c.o3 != null ? `${c.o3} µg/m³` : (c.pollutants?.o3 ? `${c.pollutants.o3.value} µg/m³` : 'N/A') }
      ],
      footer: `STATION: ${String(st.name || 'KOSOVO').toUpperCase()} · OPEN-METEO & CAMS`
    });

    const marker = new maplibregl.Marker({ element: createMapMarkerElement(color, 14, 3) })
      .setLngLat([coords.lon, coords.lat])
      .setPopup(createMapPopup(popupHtml))
      .addTo(state.map);

    marker._module = 'aqi';
    moduleLayers.aqi.markers.push(marker);
  });

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

  if (wildfireData.status === 'UNAVAILABLE' || wildfireData.error) {
    list.innerHTML = `
      <div class="empty-state wildfire-empty-state">
        <div class="wildfire-state-icon">⚠️</div>
        <div class="wildfire-state-title">SERVICE TEMPORARILY UNAVAILABLE</div>
        <div class="wildfire-state-desc">${escHtml(wildfireData?.error || 'NASA FIRMS and EONET services could not be reached.')}</div>
      </div>`;
    if (meta) meta.textContent = 'NASA FIRMS / EONET · UNAVAILABLE';
    if (badge) badge.style.display = 'none';
    return;
  }

  const detections = Array.isArray(wildfireData.detections) ? wildfireData.detections : (
    Array.isArray(wildfireData.events) ? wildfireData.events : []
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

    const maxDisplay = 60;
    const displayItems = detections.slice(0, maxDisplay);

    list.innerHTML = displayItems.map(d => {
      const conf = d.confidence || 0;
      const confClass = conf >= 80 ? 'high' : conf >= 50 ? 'medium' : 'low';
      const sat = d.satellite || 'NASA Satellite';
      const time = d.acq_time ? formatHour(d.acq_time) : '';
      const date = d.acq_date ? formatDate(d.acq_date) : '';
      const bright = typeof d.brightness === 'number' && d.brightness > 0 ? `${d.brightness.toFixed(1)} K` : 'N/A';
      const frp = typeof d.frp === 'number' && d.frp > 0 ? `${d.frp.toFixed(1)} MW` : 'N/A';
      const distText = d.distanceKm ? ` · ${d.distanceKm} km away` : '';
      const place = d.place || (typeof resolveWildfireLocation === 'function' ? resolveWildfireLocation(d.lat, d.lon).place : 'Balkan Area');
      const country = d.country || (typeof resolveWildfireLocation === 'function' ? resolveWildfireLocation(d.lat, d.lon).country : 'Regional');

      return `<div class="wildfire-item severity-${confClass}">
      <div class="wildfire-header">
        <span class="wildfire-confidence">${conf}% Conf${distText}</span>
        <span class="wildfire-sat">${escHtml(sat)}</span>
      </div>
      ${d.title ? `<div class="wildfire-event-title" style="font-size:11px;font-weight:600;color:var(--text-primary);margin-bottom:4px;">🔥 ${escHtml(d.title)}</div>` : ''}
      <div class="wildfire-location-row">
        <span>📍</span>
        <strong class="wildfire-place-name">${escHtml(place)}</strong>
        <span class="wildfire-country-badge">${escHtml(country)}</span>
      </div>
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

    if (detections.length > maxDisplay) {
      list.innerHTML += `
      <div class="wildfire-pagination-note" style="text-align:center; padding:10px 12px; font-size:11px; color:var(--text-secondary); background:rgba(15,23,42,0.5); border-radius:8px; margin-top:8px; border:1px solid rgba(56,189,248,0.15);">
        Showing <strong>${maxDisplay}</strong> most critical detections · All <strong>${detections.length}</strong> plotted on live map
      </div>`;
    }
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
    window.updateWildfireLayer(period, true);
  }
}

window.updateWildfireLayer = async function (period = '24h', force = false) {
  if (!state.mapInitialized) return;
  const requestModule = 'wildfire';

  // Fast-path: render immediately from in-memory cache if available and not forced
  if (!force && state.data?.wildfire && state.data.wildfire.period === period && Array.isArray(state.data.wildfire.detections)) {
    renderWildfire(state.data.wildfire);
    if (state.activeMapModule === requestModule) {
      renderWildfireMapLayer(state.data.wildfire);
    }
    return;
  }

  try {
    const response = await fetch(`/api/wildfire?period=${period}`);
    if (!response.ok) throw new Error('Failed to fetch wildfire data');
    const data = await response.json();

    if (state.data) state.data.wildfire = data;

    // Strict guard: only update UI if Wildfire module is still the active view!
    if (state.activeMapModule === requestModule || state.activeModule === 'wildfirePanel') {
      renderWildfire(data);
      renderWildfireMapLayer(data);
    }
  } catch (err) {
    console.error('Wildfire update error:', err);
    if (state.activeMapModule === requestModule || state.activeModule === 'wildfirePanel') {
      renderWildfire({ status: 'UNAVAILABLE', error: err.message });
      clearWildfireMapLayer();
    }
  }
};

function clearWildfireMapLayer() {
  clearMarkerList(moduleLayers.wildfire.markers);
  if (!state.map) return;
  if (state.map.getSource('wildfire-source')) {
    state.map.getSource('wildfire-source').setData({ type: 'FeatureCollection', features: [] });
  }
  if (state.map.getLayer('wildfire-layer')) {
    state.map.setLayoutProperty('wildfire-layer', 'visibility', 'none');
  }
}

function openWildfirePopup(d) {
  if (!state.map || !d) return;
  const lat = Number(d.lat);
  const lon = Number(d.lon);
  if (isNaN(lat) || isNaN(lon)) return;

  const loc = typeof resolveWildfireLocation === 'function' ? resolveWildfireLocation(lat, lon) : { place: 'Balkan Area', country: 'Regional' };
  const place = d.place || loc.place;
  const country = d.country || loc.country;
  const frpVal = (Number(d.frp) || 0).toFixed(1);
  const brightVal = (Number(d.brightness) || 0).toFixed(1);
  const confVal = d.confidence || 'HIGH';

  const popupHtml = buildMapPopupHtml({
    icon: '🔥',
    title: `Wildfire · ${place}`,
    subtitle: `Location: ${place}, ${country}`,
    source: 'NASA FIRMS / EONET',
    badge: { text: `${confVal}% CONF`, color: '#f87171' },
    primary: {
      val: `${frpVal} MW`,
      sub: 'Fire Radiative Power (FRP)',
      secondary: `Brightness: ${brightVal} K`
    },
    stats: [
      { label: 'Place', val: place },
      { label: 'Country', val: country },
      { label: 'Satellite', val: d.satellite || 'NASA VIIRS' },
      { label: 'Confidence', val: `${confVal}%` },
      { label: 'Acq. Date', val: d.acq_date || 'Live' },
      { label: 'Acq. Time', val: d.acq_time ? formatHour(d.acq_time) : 'UTC' }
    ],
    footer: `LOCATION: ${place.toUpperCase()}, ${country.toUpperCase()} · ${lat.toFixed(4)}, ${lon.toFixed(4)} · NASA FIRMS`
  });

  openMapPopup([lon, lat], popupHtml);
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

  clearMarkerList(moduleLayers.wildfire.markers);

  // Create clickable interactive DOM HTML markers with pulsing tactical flame
  validDetections.forEach((d, idx) => {
    const lat = Number(d.lat);
    const lon = Number(d.lon);
    if (isNaN(lat) || isNaN(lon)) return;

    const loc = typeof resolveWildfireLocation === 'function' ? resolveWildfireLocation(lat, lon) : { place: 'Balkan Area', country: 'Regional' };
    const place = d.place || loc.place;
    const country = d.country || loc.country;
    const frp = Number(d.frp) || 0;

    const el = document.createElement('div');
    el.className = 'wildfire-custom-marker';
    el.setAttribute('data-fire-id', d.id || `fire-${idx}`);
    el.setAttribute('title', `🔥 Wildfire: ${place}, ${country} (${frp.toFixed(1)} MW)`);
    el.style.cssText = 'width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer; pointer-events: auto; z-index: 10;';

    el.innerHTML = `
      <div class="wildfire-marker-pin" style="width: 20px; height: 20px; border-radius: 50%; background: radial-gradient(circle, #ffedd5 0%, #ff4500 55%, #b91c1c 100%); border: 2px solid #ffffff; box-shadow: 0 0 10px rgba(255, 69, 0, 0.9), 0 0 18px rgba(239, 68, 68, 0.5); display: flex; align-items: center; justify-content: center; font-size: 11px; user-select: none; transition: transform 0.15s ease, box-shadow 0.15s ease;">
        🔥
      </div>
    `;

    el.addEventListener('mouseenter', () => {
      const pin = el.querySelector('.wildfire-marker-pin');
      if (pin) {
        pin.style.transform = 'scale(1.3)';
        pin.style.boxShadow = '0 0 16px rgba(255, 69, 0, 1), 0 0 25px rgba(239, 68, 68, 0.8)';
      }
    });
    el.addEventListener('mouseleave', () => {
      const pin = el.querySelector('.wildfire-marker-pin');
      if (pin) {
        pin.style.transform = 'scale(1)';
        pin.style.boxShadow = '0 0 10px rgba(255, 69, 0, 0.9), 0 0 18px rgba(239, 68, 68, 0.5)';
      }
    });

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openWildfirePopup(d);
    });

    const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([lon, lat])
      .addTo(state.map);

    marker._module = 'wildfire';
    moduleLayers.wildfire.markers.push(marker);
  });

  const features = validDetections.map(d => {
    const place = d.place || (typeof resolveWildfireLocation === 'function' ? resolveWildfireLocation(d.lat, d.lon).place : 'Balkan Area');
    const country = d.country || (typeof resolveWildfireLocation === 'function' ? resolveWildfireLocation(d.lat, d.lon).country : 'Regional');
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [d.lon, d.lat]
      },
      properties: {
        id: d.id,
        lat: d.lat,
        lon: d.lon,
        place,
        country,
        confidence: d.confidence,
        brightness: d.brightness,
        frp: d.frp,
        satellite: d.satellite,
        acq_date: d.acq_date,
        acq_time: d.acq_time,
        _module: 'wildfire'
      }
    };
  });

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

window.toggleWildfireLayer = function () {
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

    const icao = (ac.icao24 || '').trim().toLowerCase();
    const callsign = (ac.callsign || '').trim();
    const adsbUrl = icao ? `https://globe.adsbexchange.com/?icao=${icao}` : (callsign ? `https://globe.adsbexchange.com/?callsign=${encodeURIComponent(callsign)}` : null);

    const popupHtml = buildMapPopupHtml({
      icon: '✈️',
      title: callsignStr,
      subtitle: ac.registration ? `Reg: ${ac.registration}` : (ac.operator || 'Aircraft In Flight'),
      source: 'OpenSky Network',
      badge: { text: ac.category.replace(/_/g, ' ').toUpperCase(), color: catColor },
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
      ],
      linkUrl: adsbUrl,
      linkText: 'TRACK ON ADS-B LIVE ↗',
      footer: `ICAO: ${ac.icao24.toUpperCase()} · OPEN SKY BALKAN AIRSPACE`
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

  if (!state.mapInitialized) {
    initMap();
  }

  if (state.map) {
    setTimeout(() => state.map.resize(), 100);
  }
}

function toggleModule(panelId) {
  const overlay = $('moduleOverlay');

  // Weather & AQI are now persistent tactical layers on the map: focus map and ensure layer is active
  if (panelId === 'weatherPanel') {
    ensureMapVisible();
    if ($('toggleLayerWeather') && !$('toggleLayerWeather').checked) {
      $('toggleLayerWeather').checked = true;
      toggleTacticalLayer('weather', true);
    }
    return;
  }
  if (panelId === 'aqiPanel') {
    ensureMapVisible();
    if ($('toggleLayerAqi') && !$('toggleLayerAqi').checked) {
      $('toggleLayerAqi').checked = true;
      toggleTacticalLayer('aqi', true);
    }
    return;
  }

  // Border Crossing is purely map-based: toggle border markers on map without overlay panel
  if (panelId === 'borderPanel') {
    if (state.activeMapModule === 'border') {
      closeModulePanel();
      return;
    }
    ensureMapVisible();
    if (overlay) {
      overlay.querySelectorAll('.overlay-panel').forEach(p => { p.style.display = 'none'; });
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
    }
    const cctvPanel = $('cctvIntelligencePanel');
    if (cctvPanel) {
      cctvPanel.style.display = 'none';
      closeCCTVViewer();
    }
    document.querySelectorAll('.nav-rail-btn, .module-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.panel === 'borderPanel'));

    if (!state.borderData) {
      fetchBorder().then(() => {
        if (state.activeMapModule === 'border') {
          setActiveMapModule('border', state.borderData);
        }
      });
    }
    setActiveMapModule('border', state.borderData);
    return;
  }

  if (panelId === 'staffPanel' && !state.staffToken) {
    openStaffLoginModal();
    return;
  }

  const panel = $(panelId);
  if (!panel) return;

  const panelToModule = {
    'newsPanel': 'news',
    'weatherPanel': 'weather',
    'trafficPanel': 'traffic',
    'radiationPanel': 'radiation',
    'aqiPanel': 'aqi',
    'earthquakePanel': 'earthquake',
    'wildfirePanel': 'wildfire',
    'aviationPanel': 'aviation',
    'telegramPanel': 'telegram',
    'borderPanel': 'border',
    'cctvIntelligencePanel': 'cctv',
    'routePanel': 'route',
    'alertPanel': 'alert',
    'settingsPanel': 'settings',
    'staffPanel': 'staff',
    'minePanel': 'mines'
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

    document.querySelectorAll('.nav-rail-btn, .module-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.panel === panelId));
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
    document.querySelectorAll('.nav-rail-btn, .module-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.panel === panelId));

    // Atomic module switch
    setActiveMapModule(targetModule, state.data);

    // Triggers with targetModule guard
    if (targetModule === 'news') {
      if (state.data?.news) renderNews(state.data.news);
    } else if (targetModule === 'wildfire') {
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
    } else if (targetModule === 'staff') {
      fetchStaffLocations();
    } else if (targetModule === 'mines') {
      renderMinefieldsList();
      toggleMinefieldsLayer(true);
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

  document.querySelectorAll('.nav-rail-btn, .module-btn').forEach(btn => btn.classList.remove('active'));
  if (state.map) {
    setTimeout(() => state.map.resize(), 200);
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const overlay = $('moduleOverlay');
    const cctvPanel = $('cctvIntelligencePanel');
    const isOverlayOpen = overlay && overlay.classList.contains('active');
    const isCctvOpen = cctvPanel && cctvPanel.style.display !== 'none';
    if (isOverlayOpen || isCctvOpen || state.activeMapModule) {
      closeModulePanel();
    }
  }
});

function createMapMarkerElement(color, size = 16, border = 3, severity = null) {
  const marker = document.createElement('div');
  marker.className = 'mapbox-marker';
  marker.style.width = `${size}px`;
  marker.style.height = `${size}px`;
  marker.style.border = `${border}px solid rgba(255,255,255,0.92)`;
  marker.style.borderRadius = '50%';
  marker.style.backgroundColor = color;
  marker.style.boxShadow = `0 0 14px ${color}`;
  marker.style.cursor = 'pointer';
  // Position is managed by MapLibre's .maplibregl-marker (position: absolute) to prevent layout flow drift and scroll misalignment.

  const sev = String(severity || '').toUpperCase();
  if (sev === 'CRITICAL') {
    marker.classList.add('threat-pulse-critical');
    const radar = document.createElement('div');
    radar.className = 'radar-ring critical';
    marker.appendChild(radar);
  } else if (sev === 'HIGH') {
    marker.classList.add('threat-pulse-high');
  }

  return marker;
}

/**
 * Spatial clustering utility for MapLibre markers.
 * Groups nearby points within screen pixel radius when zoomed out.
 */
function clusterGeoItems(items, getLngLat, radiusPixels = 38) {
  if (!state.map || !Array.isArray(items) || items.length === 0) return [];
  const zoom = state.map.getZoom();

  // When zoomed in sufficiently close (zoom >= 11.5), render individual markers with full popups
  if (zoom >= 11.5) {
    return items.map(item => ({ isCluster: false, item }));
  }

  const clusters = [];
  items.forEach(item => {
    const coords = getLngLat(item);
    if (!coords || typeof coords[0] !== 'number' || typeof coords[1] !== 'number') return;

    const point = state.map.project(coords);
    let matchedCluster = null;

    for (const c of clusters) {
      const dist = Math.hypot(c.point.x - point.x, c.point.y - point.y);
      if (dist <= radiusPixels) {
        matchedCluster = c;
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.items.push(item);
      const count = matchedCluster.items.length;
      matchedCluster.lng = (matchedCluster.lng * (count - 1) + coords[0]) / count;
      matchedCluster.lat = (matchedCluster.lat * (count - 1) + coords[1]) / count;
      matchedCluster.point = state.map.project([matchedCluster.lng, matchedCluster.lat]);
    } else {
      clusters.push({
        isCluster: false,
        lng: coords[0],
        lat: coords[1],
        point,
        items: [item],
        item
      });
    }
  });

  return clusters.map(c => {
    if (c.items.length > 1) {
      c.isCluster = true;
    }
    return c;
  });
}

function createClusterMarkerElement(cluster, icon = '📍', highestSeverity = 'normal') {
  const el = document.createElement('div');
  const sevUpper = String(highestSeverity || '').toUpperCase();
  const sevClass = sevUpper === 'CRITICAL' ? 'cluster-critical' : (sevUpper === 'HIGH' ? 'cluster-high' : '');

  el.className = `map-cluster-marker ${sevClass}`;
  el.innerHTML = `
    <span class="map-cluster-icon">${icon}</span>
    <span class="map-cluster-count">${cluster.items.length}</span>
  `;

  if (sevUpper === 'CRITICAL') {
    const radar = document.createElement('div');
    radar.className = 'radar-ring critical';
    el.appendChild(radar);
  }

  el.addEventListener('click', (e) => {
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (state.map) {
      state.map.flyTo({
        center: [cluster.lng, cluster.lat],
        zoom: Math.min(14, state.map.getZoom() + 2.2),
        duration: 650
      });
    }
  });

  return el;
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

function getCCTVEmbedUrl(camera) {
  if (!camera) return '';
  if (camera.embedUrl) return camera.embedUrl;
  if (!camera.pageUrl) return '';

  const url = camera.pageUrl.trim();
  if (url.includes('/embed/')) return url;

  if (url.includes('video.gjirafa.com/')) {
    const slug = url.split('video.gjirafa.com/')[1].split('?')[0].replace(/^\/+|\/+$/g, '');
    if (slug) {
      return `https://video.gjirafa.com/embed/${slug}?autoplay=true&am=true`;
    }
  }

  return url;
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
      nameEl.textContent = camera.location || camera.name || 'CAMERA';
    }

    const isLive = (camera.status || '').toLowerCase() === 'live';
    if (statusEl) {
      statusEl.textContent = isLive ? '● LIVE' : `● ${(camera.status || 'UNKNOWN').toUpperCase()}`;
      statusEl.className = `cctv-status-indicator ${isLive ? 'live' : ''}`;
    }

    if (openLink) {
      openLink.href = camera.pageUrl || '#';
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

    const embedUrl = getCCTVEmbedUrl(camera);

    // Embed ONLY the dedicated camera player - no external website UI
    if (videoFrame) {
      videoFrame.style.display = 'block';
      if (embedUrl && videoFrame.src !== embedUrl) {
        videoFrame.src = embedUrl;
      }
    }

    if (videoUnavailable) {
      videoUnavailable.style.display = embedUrl ? 'none' : 'flex';
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

function toggleCCTVFullscreen() {
  const container = $('cctvVideoContainer') || $('cctvVideoFrame');
  if (!container) return;

  if (!document.fullscreenElement) {
    if (container.requestFullscreen) {
      container.requestFullscreen();
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen();
    } else if (container.msRequestFullscreen) {
      container.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

window.openCCTVViewer = openCCTVViewer;
window.closeCCTVViewer = closeCCTVViewer;
window.centerMapOnCCTV = centerMapOnCCTV;
window.toggleCCTVFullscreen = toggleCCTVFullscreen;

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

  const mapStyle = CARTO_API_KEY
    ? OSM_STYLE
    : OPENFREEMAP_DARK_STYLE;

  state.map = new maplibregl.Map({
    container: 'leafletMap',
    style: mapStyle,
    center: [DEFAULT_MAP_CENTER.lon, DEFAULT_MAP_CENTER.lat],
    zoom: DEFAULT_MAP_ZOOM,
    pitch: 35,
    projection: 'mercator',
    attributionControl: false
  });

  state.map.once('error', (err) => {
    if (err && (err.dataType === 'style' || err.sourceId === 'openmaptiles')) {
      console.warn('[map] Falling back to pitch-black tactical raster style:', err);
      try { state.map.setStyle(OSM_STYLE); } catch (e) {}
    }
  });

  state.map.addControl(new BasemapControl(), 'top-right');
  state.map.addControl(new MapModeControl(), 'top-right');
  state.map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'bottom-right');

  state.map.on('load', () => {
    // Ensure satellite raster source and layer exist
    if (!state.map.getSource('satellite-tiles')) {
      state.map.addSource('satellite-tiles', {
        type: 'raster',
        tiles: ['https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© Esri Clarity Archive'
      });
    }
    if (!state.map.getLayer('satellite-basemap')) {
      state.map.addLayer({
        id: 'satellite-basemap',
        type: 'raster',
        source: 'satellite-tiles',
        layout: { visibility: 'none' }
      });
    }

    // Ensure wildfire GeoJSON source and circle layer exist
    if (!state.map.getSource('wildfire-source')) {
      state.map.addSource('wildfire-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
    }
    if (!state.map.getLayer('wildfire-layer')) {
      state.map.addLayer({
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
      });
    }

    if (state.data) updateMap(state.data);
    setTimeout(() => { if (state.map) state.map.resize(); }, 200);

    state.map.on('click', 'wildfire-layer', (e) => {
      if (e.features && e.features.length > 0) {
        const props = e.features[0].properties;
        const loc = resolveWildfireLocation(Number(props.lat), Number(props.lon));
        const place = props.place || loc.place;
        const country = props.country || loc.country;
        const popupHtml = buildMapPopupHtml({
          icon: '🔥',
          title: `Wildfire · ${place}`,
          subtitle: `Location: ${place}, ${country}`,
          source: 'NASA FIRMS / EONET',
          badge: { text: `${props.confidence || 'HIGH'}% CONF`, color: '#f87171' },
          primary: {
            val: `${(Number(props.frp) || 0).toFixed(1)} MW`,
            sub: 'Fire Radiative Power (FRP)',
            secondary: `Brightness: ${(Number(props.brightness) || 0).toFixed(1)} K`
          },
          stats: [
            { label: 'Place', val: place },
            { label: 'Country', val: country },
            { label: 'Satellite', val: props.satellite || 'NASA VIIRS' },
            { label: 'Confidence', val: `${props.confidence || '?'}%` },
            { label: 'Acq. Date', val: props.acq_date || 'Live' },
            { label: 'Acq. Time', val: props.acq_time ? formatHour(props.acq_time) : 'UTC' }
          ],
          footer: `LOCATION: ${place.toUpperCase()}, ${country.toUpperCase()} · ${Number(props.lat)?.toFixed(4)}, ${Number(props.lon)?.toFixed(4)} · NASA FIRMS`
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
          subtitle: 'EURDEP Sensor Station',
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
          ],
          footer: `STATUS: ${(props.status || 'NORMAL').toUpperCase()} · SOURCE: EURDEP NETWORK`
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

    if (!state.map.getSource('route-source')) {
      state.map.addSource('route-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      state.map.addLayer({
        id: 'route-line-glow',
        type: 'line',
        source: 'route-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#38bdf8',
          'line-width': 9,
          'line-opacity': 0.45,
          'line-blur': 3
        }
      });
      state.map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#0284c7',
          'line-width': 4,
          'line-opacity': 0.95
        }
      });
    }

    initTacticalLayers(state.map);
  });

  state.map.on('zoomend', () => {
    if (state.activeMapModule && moduleLayers[state.activeMapModule]) {
      if (['news', 'aviation', 'earthquake', 'traffic', 'radiation'].includes(state.activeMapModule)) {
        try {
          moduleLayers[state.activeMapModule].render(state.data);
        } catch (e) {
          console.warn('Re-clustering error on zoomend:', e);
        }
      }
    }
  });

  state.map.on('idle', () => {
    try { state.map.triggerRepaint(); } catch (e) { }
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

// ─── Tactical Operational Zones (KFOR Sectors, Strategic Corridors, Mines) ───
let tacticalKforMarkers = [];
let tacticalMineMarkers = [];
let tacticalMsrMarkers = [];

function buildMinefieldPopupHtml(p) {
  const riskClass = (p.riskLevel || 'medium').toLowerCase();
  const riskColor = riskClass === 'critical' ? '#ef4444' : (riskClass === 'high' ? '#fb923c' : '#fbbf24');
  const badgeText = `${p.status || 'SUSPECTED HAZARDOUS AREA (SHA)'} · ${p.riskLevel || 'MEDIUM'}`;

  return `
    <div class="map-popup map-popup-container mine-hazard-popup">
      <div class="map-popup-header" style="display:flex; flex-direction:column; gap:5px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.1);">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
          <span class="map-popup-badge" style="background:${riskColor}22; color:${riskColor}; border:1px solid ${riskColor}55; padding:3px 8px; font-size:10px; font-weight:800; border-radius:4px; font-family:var(--font-mono); letter-spacing:0.5px;">
            ⚠️ ${escHtml(badgeText.toUpperCase())}
          </span>
        </div>
        <div class="map-popup-title" style="width:100%; display:flex; align-items:center; gap:8px; margin-top:2px;">
          <span class="map-popup-icon" style="font-size:16px; line-height:1; flex-shrink:0;">💣</span>
          <span class="map-popup-title-text" style="font-size:13.5px; font-weight:700; color:#ffffff; line-height:1.35; word-break:normal; overflow-wrap:break-word;">
            ${escHtml(p.name)}
          </span>
        </div>
        <div class="map-popup-header-sub" style="display:flex; align-items:center; justify-content:space-between; gap:6px; font-size:11px; color:#94a3b8; margin-top:2px;">
          <span class="map-popup-subtitle" style="color:#94a3b8;">Sector: <strong style="color:#e2e8f0;">${escHtml(p.sector)}</strong> · Municipality: <strong style="color:#e2e8f0;">${escHtml(p.municipality)}</strong></span>
          <span class="map-popup-source" style="color:#64748b; font-size:10px;">via ${escHtml(p.deminingAgency || 'KSF EOD')}</span>
        </div>
      </div>
      <div class="map-popup-body" style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
        <div class="map-popup-primary" style="display:flex; align-items:baseline; justify-content:space-between; gap:10px; background:rgba(15,23,42,0.6); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
          <div>
            <span class="map-popup-primary-val" style="font-family:var(--font-mono); font-size:18px; font-weight:800; color:#38bdf8;">${escHtml(String(p.estimatedAreaHa))} Ha</span>
            <span class="map-popup-primary-sub" style="font-size:10.5px; color:#94a3b8; margin-left:6px;">Estimated Contaminated Area</span>
          </div>
          <div style="font-size:11px; color:#94a3b8; font-family:var(--font-mono);">
            Standoff: <strong style="color:#f87171;">${escHtml(String(p.standoffDistanceMeters))}m</strong>
          </div>
        </div>
        ${p.description ? `<div class="map-popup-desc-text" style="font-size:11.5px; line-height:1.45; color:#cbd5e1; background:rgba(0,0,0,0.25); padding:6px 8px; border-radius:4px;">${escHtml(p.description)}</div>` : ''}
        <div class="map-popup-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
          <div class="map-popup-stat" style="background:rgba(15,23,42,0.6); padding:6px 8px; border-radius:5px; border:1px solid rgba(255,255,255,0.06);">
            <span class="map-popup-stat-label" style="display:block; font-size:9.5px; font-weight:700; color:#64748b; font-family:var(--font-mono); text-transform:uppercase;">Munitions</span>
            <span class="map-popup-stat-val" style="display:block; color:#fca5a5; font-size:11px; font-weight:600; line-height:1.35; margin-top:2px;">${escHtml(p.munitionTypes)}</span>
          </div>
          <div class="map-popup-stat" style="background:rgba(15,23,42,0.6); padding:6px 8px; border-radius:5px; border:1px solid rgba(255,255,255,0.06);">
            <span class="map-popup-stat-label" style="display:block; font-size:9.5px; font-weight:700; color:#64748b; font-family:var(--font-mono); text-transform:uppercase;">Standoff Buffer</span>
            <span class="map-popup-stat-val" style="display:block; color:#f87171; font-size:13px; font-weight:700; font-family:var(--font-mono); margin-top:2px;">${escHtml(String(p.standoffDistanceMeters))}m</span>
          </div>
          <div class="map-popup-stat" style="background:rgba(15,23,42,0.6); padding:6px 8px; border-radius:5px; border:1px solid rgba(255,255,255,0.06);">
            <span class="map-popup-stat-label" style="display:block; font-size:9.5px; font-weight:700; color:#64748b; font-family:var(--font-mono); text-transform:uppercase;">Demining Lead</span>
            <span class="map-popup-stat-val" style="display:block; color:#e2e8f0; font-size:11px; line-height:1.3; margin-top:2px;">${escHtml(p.deminingAgency)}</span>
          </div>
          <div class="map-popup-stat" style="background:rgba(15,23,42,0.6); padding:6px 8px; border-radius:5px; border:1px solid rgba(255,255,255,0.06);">
            <span class="map-popup-stat-label" style="display:block; font-size:9.5px; font-weight:700; color:#64748b; font-family:var(--font-mono); text-transform:uppercase;">Survey Date</span>
            <span class="map-popup-stat-val" style="display:block; color:#94a3b8; font-size:11px; font-family:var(--font-mono); margin-top:2px;">${escHtml(p.lastSurveyDate)}</span>
          </div>
        </div>
      </div>
      <div class="map-popup-footer" style="background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.3); border-radius:4px; padding:6px 8px; margin-top:8px;">
        <span style="color:#fca5a5; font-size:11px; font-weight:600;">
          🚨 Emergency Contact: ${escHtml(p.emergencyContact || 'Police Operations: 192 · KSF Ops Desk')}
        </span>
      </div>
    </div>
  `;
}

function renderTacticalMineMarkers(visible) {
  tacticalMineMarkers.forEach(m => m.remove());
  tacticalMineMarkers = [];
  if (!visible || !state.map) return;

  MINEFIELDS_KOSOVO_GEOJSON.features.forEach(hazard => {
    const p = hazard.properties;
    const coords = [p.lon, p.lat];

    const el = document.createElement('div');
    el.className = 'mine-marker-pin';
    el.title = `${p.name} (${p.status || 'Hazardous Area'})`;
    el.setAttribute('aria-label', p.name);
    el.innerHTML = `
      <div class="mine-marker-icon-wrap"></div>
    `;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openMapPopup(coords, buildMinefieldPopupHtml(p));
    });

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat(coords)
      .addTo(state.map);

    tacticalMineMarkers.push(marker);
  });
}

function renderTacticalKforBases(visible) {
  tacticalKforMarkers.forEach(m => m.remove());
  tacticalKforMarkers = [];
  if (!visible || !state.map) return;

  KFOR_BASES_GEOJSON.features.forEach(base => {
    const p = base.properties;
    const coords = base.geometry.coordinates;

    const el = document.createElement('div');
    el.className = 'kfor-marker-pin';
    el.title = `${p.name} · ${p.typeLabel}`;
    el.setAttribute('aria-label', p.name);
    el.innerHTML = `
      <svg viewBox="0 0 28 32" width="24" height="28" class="kfor-crest-svg" style="display:block; overflow:visible;">
        <defs>
          <linearGradient id="kforBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e3a8a" />
            <stop offset="50%" stop-color="#1d4ed8" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>
          <filter id="kforDropGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000" flood-opacity="0.85"/>
          </filter>
        </defs>
        <!-- Tactical Military Shield -->
        <path d="M14 2 L25 5.5 C25 18 19 25.5 14 30 C9 25.5 3 18 3 5.5 Z" fill="url(#kforBlueGrad)" stroke="#60a5fa" stroke-width="1.6" filter="url(#kforDropGlow)" />
        <!-- Inner Gold Rim -->
        <path d="M14 4 L23 7 C23 17 18 23.5 14 27.5 C10 23.5 5 17 5 7 Z" fill="none" stroke="#f59e0b" stroke-width="0.7" opacity="0.85" />
        <!-- "KFOR" Header Banner Text -->
        <text x="14" y="9.2" font-size="4.2" font-weight="900" font-family="'Inter', sans-serif" fill="#ffffff" text-anchor="middle" letter-spacing="0.6">KFOR</text>
        <!-- NATO Compass Star -->
        <polygon points="14,11 15.2,16 14,21 12.8,16" fill="#ffffff" />
        <polygon points="9,16 14,14.8 19,16 14,17.2" fill="#ffffff" />
        <polygon points="14,11 15.2,16 14,16" fill="#93c5fd" />
        <polygon points="14,21 12.8,16 14,16" fill="#93c5fd" />
        <polygon points="19,16 14,17.2 14,16" fill="#93c5fd" />
        <polygon points="9,16 14,14.8 14,16" fill="#93c5fd" />
        <!-- Center circle -->
        <circle cx="14" cy="16" r="1.6" fill="#f59e0b" />
      </svg>
    `;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const html = `
        <div class="tactical-layer-popup">
          <div class="layer-popup-badge badge-kfor">KFOR MILITARY BASE · ${p.typeLabel}</div>
          <div class="layer-popup-title">${p.name}</div>
          <div class="layer-popup-meta">Command: <strong>${p.command}</strong></div>
          <div class="layer-popup-row"><span>Lead Nation:</span> <strong>${p.leadNation}</strong></div>
          <div class="layer-popup-row"><span>Sector:</span> ${p.sector}</div>
          <div class="layer-popup-row"><span>Units:</span> ${p.units}</div>
          <div class="layer-popup-row"><span>Status:</span> ${p.status}</div>
          <div class="layer-popup-notes"><strong>Capabilities:</strong> ${p.capabilities}</div>
        </div>
      `;
      openMapPopup(coords, html);
    });

    const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat(coords)
      .addTo(state.map);

    tacticalKforMarkers.push(marker);
  });
}

function renderTacticalMsrMarkers(visible) {
  tacticalMsrMarkers.forEach(m => m.remove());
  tacticalMsrMarkers = [];
  if (!visible || !state.map) return;

  KFOR_MSR_ROUTES_GEOJSON.features.filter(f => f.geometry.type === 'Point').forEach(feat => {
    const p = feat.properties;
    const coords = feat.geometry.coordinates;

    const el = document.createElement('div');
    el.className = 'msr-badge-marker';
    el.title = `${p.callsign} · ${p.civilianRoute}`;
    el.setAttribute('aria-label', p.callsign);
    el.innerHTML = `<span>${p.callsign}</span>`;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openMapPopup(coords, buildMsrPopupHtml(p));
    });

    const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat(coords)
      .addTo(state.map);

    tacticalMsrMarkers.push(marker);
  });
}

function buildMsrPopupHtml(p) {
  return `
    <div class="tactical-layer-popup">
      <div class="layer-popup-badge badge-msr">KFOR MAIN SUPPLY ROUTE · ${p.callsign || 'MSR'}</div>
      <div class="layer-popup-title">${p.name || p.callsign}</div>
      <div class="layer-popup-meta">Civilian Designation: <strong>${p.civilianRoute || 'Arterial Highway'}</strong></div>
      <div class="layer-popup-row"><span>Operational Sector:</span> <strong>${p.sector || 'Regional Command'}</strong></div>
      <div class="layer-popup-row"><span>Command:</span> ${p.command || 'KFOR Headquarters'}</div>
      <div class="layer-popup-row"><span>Status:</span> ${p.status || 'Active Patrol Route'}</div>
      <div class="layer-popup-row"><span>Security Priority:</span> <strong>${p.securityLevel || 'STRATEGIC'}</strong></div>
      <div class="layer-popup-notes"><strong>Tactical Telemetry:</strong> ${p.description || ''}</div>
    </div>
  `;
}

function initTacticalLayers(map) {
  if (!map) return;

  // 1. Sensitive Corridors & Bridges
  if (!map.getSource('corridors-source')) {
    map.addSource('corridors-source', {
      type: 'geojson',
      data: SENSITIVE_CORRIDORS_GEOJSON
    });
  }
  if (map.getLayer('corridors-line')) {
    map.removeLayer('corridors-line');
  }
  if (!map.getLayer('corridors-points')) {
    map.addLayer({
      id: 'corridors-points',
      type: 'circle',
      source: 'corridors-source',
      filter: ['==', '$type', 'Point'],
      layout: { visibility: 'none' },
      paint: {
        'circle-radius': 7,
        'circle-color': '#ec4899',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.95
      }
    });
  }

  // 2. Minefields & Explosive Hazards (Controlled via UXO module)
  if (!map.getSource('minefields-source')) {
    map.addSource('minefields-source', {
      type: 'geojson',
      data: MINEFIELDS_KOSOVO_GEOJSON
    });
  }
  if (!map.getLayer('minefields-fill')) {
    map.addLayer({
      id: 'minefields-fill',
      type: 'fill',
      source: 'minefields-source',
      layout: { visibility: 'none' },
      paint: {
        'fill-color': '#dc2626',
        'fill-opacity': 0.22
      }
    });
  }
  if (!map.getLayer('minefields-line')) {
    map.addLayer({
      id: 'minefields-line',
      type: 'line',
      source: 'minefields-source',
      layout: { visibility: 'none', 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#ef4444',
        'line-width': 2.4,
        'line-dasharray': [3, 2],
        'line-opacity': 0.95
      }
    });
  }

  // 3. KFOR Main Supply Routes (MSR)
  if (!map.getSource('msr-source')) {
    map.addSource('msr-source', {
      type: 'geojson',
      data: KFOR_MSR_ROUTES_GEOJSON
    });
  }
  if (!map.getLayer('msr-casing')) {
    map.addLayer({
      id: 'msr-casing',
      type: 'line',
      source: 'msr-source',
      filter: ['==', '$type', 'LineString'],
      layout: { visibility: 'none', 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#03213a',
        'line-width': 6,
        'line-opacity': 0.85
      }
    });
  }
  if (!map.getLayer('msr-line')) {
    map.addLayer({
      id: 'msr-line',
      type: 'line',
      source: 'msr-source',
      filter: ['==', '$type', 'LineString'],
      layout: { visibility: 'none', 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#38bdf8',
        'line-width': 3.2,
        'line-opacity': 0.95
      }
    });
  }

  map.on('click', 'corridors-points', (e) => {
    if (e.features && e.features.length > 0) {
      const p = e.features[0].properties;
      const categoryLabel = p.category === 'spz'
        ? 'SPECIAL PROTECTIVE ZONE (SPZ)'
        : (p.category === 'bridge' ? 'IBAR TRANSIT BRIDGE' : (p.category || 'TACTICAL POINT').toUpperCase());
      const html = `
        <div class="tactical-layer-popup">
          <div class="layer-popup-badge badge-corridor">${categoryLabel} · ${p.securityLevel || 'PROTECTED'}</div>
          <div class="layer-popup-title">${p.name}</div>
          <div class="layer-popup-meta">Status: <strong>${p.status}</strong></div>
          <div class="layer-popup-desc">${p.description}</div>
        </div>
      `;
      openMapPopup(e.lngLat, html);
    }
  });

  map.on('click', 'minefields-fill', (e) => {
    if (e.features && e.features.length > 0) {
      const p = e.features[0].properties;
      openMapPopup(e.lngLat, buildMinefieldPopupHtml(p));
    }
  });

  map.on('click', 'msr-line', (e) => {
    if (e.features && e.features.length > 0) {
      const p = e.features[0].properties;
      openMapPopup(e.lngLat, buildMsrPopupHtml(p));
    }
  });

  // Cursor pointers
  ['corridors-points', 'minefields-fill', 'msr-line'].forEach(layerId => {
    map.on('mouseenter', layerId, () => {
      if (map.getCanvas()) map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', layerId, () => {
      if (map.getCanvas()) map.getCanvas().style.cursor = '';
    });
  });

  syncTacticalLayersOnMap();
}

function syncTacticalLayersOnMap() {
  if (!state.map) return;
  const showMines = $('toggleLayerMines') ? $('toggleLayerMines').checked : false;
  const showKfor = $('toggleLayerKfor') ? $('toggleLayerKfor').checked : false;
  const showCorridors = $('toggleLayerCorridors') ? $('toggleLayerCorridors').checked : false;
  const showBorder = $('toggleLayerBorder') ? $('toggleLayerBorder').checked : false;
  const showMsr = $('toggleLayerMsr') ? $('toggleLayerMsr').checked : false;
  const showSeismic = $('toggleLayerSeismic') ? $('toggleLayerSeismic').checked : false;
  const showRadiation = $('toggleLayerRadiation') ? $('toggleLayerRadiation').checked : false;
  const showWeather = $('toggleLayerWeather') ? $('toggleLayerWeather').checked : false;
  const showAqi = $('toggleLayerAqi') ? $('toggleLayerAqi').checked : false;

  if (showMines) toggleMinefieldsLayer(true);
  if (showKfor) renderTacticalKforBases(true);
  if (showCorridors && state.map.getLayer('corridors-points')) state.map.setLayoutProperty('corridors-points', 'visibility', 'visible');
  if (showBorder) toggleBorderTacticalLayer(true);
  if (showMsr) renderTacticalMsrMarkers(true);
  if (showSeismic && state.data?.earthquakes) renderEarthquakeMapMarkers(state.data.earthquakes);
  if (showRadiation && state.data?.radiation) renderRadiationMapMarkers(state.data.radiation);
  if (showWeather && state.data?.weather) renderWeatherMapMarkers(state.data.weather);
  if (showAqi && state.data?.aqi) renderAqiMapMarkers(state.data.aqi);

  let activeCount = 0;
  if ($('toggleLayerMines')?.checked) activeCount++;
  if ($('toggleLayerKfor')?.checked) activeCount++;
  if ($('toggleLayerCorridors')?.checked) activeCount++;
  if ($('toggleLayerBorder')?.checked) activeCount++;
  if ($('toggleLayerMsr')?.checked) activeCount++;
  if ($('toggleLayerSeismic')?.checked) activeCount++;
  if ($('toggleLayerRadiation')?.checked) activeCount++;
  if ($('toggleLayerWeather')?.checked) activeCount++;
  if ($('toggleLayerAqi')?.checked) activeCount++;

  const badge = $('tacticalLayersActiveBadge');
  if (badge) {
    badge.textContent = `${activeCount} Active`;
    badge.classList.toggle('active', activeCount > 0);
  }
}

function toggleTacticalLayer(layerGroup, isVisible) {
  if (!state.map) return;
  const visibility = isVisible ? 'visible' : 'none';

  if (layerGroup === 'abl') {
    ['abl-contour', 'abl-casing', 'abl-glow'].forEach(layerId => {
      if (state.map.getLayer(layerId)) {
        state.map.setLayoutProperty(layerId, 'visibility', visibility);
      }
    });
  } else if (layerGroup === 'municipalities') {
    ['mun-polygons-fill', 'mun-polygons-line'].forEach(layerId => {
      if (state.map.getLayer(layerId)) {
        state.map.setLayoutProperty(layerId, 'visibility', visibility);
      }
    });
    renderTacticalMunLabels(isVisible);
  } else if (layerGroup === 'kfor') {
    renderTacticalKforBases(isVisible);
  } else if (layerGroup === 'corridors') {
    if (state.map.getLayer('corridors-points')) {
      state.map.setLayoutProperty('corridors-points', 'visibility', visibility);
    }
  } else if (layerGroup === 'msr') {
    ['msr-casing', 'msr-line'].forEach(layerId => {
      if (state.map.getLayer(layerId)) {
        state.map.setLayoutProperty(layerId, 'visibility', visibility);
      }
    });
    renderTacticalMsrMarkers(isVisible);
  } else if (layerGroup === 'mines') {
    toggleMinefieldsLayer(isVisible);
  } else if (layerGroup === 'border') {
    toggleBorderTacticalLayer(isVisible);
  } else if (layerGroup === 'seismic') {
    toggleSeismicTacticalLayer(isVisible);
  } else if (layerGroup === 'radiation') {
    toggleRadiationTacticalLayer(isVisible);
  } else if (layerGroup === 'weather') {
    toggleWeatherTacticalLayer(isVisible);
  } else if (layerGroup === 'aqi') {
    toggleAqiTacticalLayer(isVisible);
  }

  let activeCount = 0;
  if ($('toggleLayerMines')?.checked) activeCount++;
  if ($('toggleLayerKfor')?.checked) activeCount++;
  if ($('toggleLayerCorridors')?.checked) activeCount++;
  if ($('toggleLayerBorder')?.checked) activeCount++;
  if ($('toggleLayerMsr')?.checked) activeCount++;
  if ($('toggleLayerSeismic')?.checked) activeCount++;
  if ($('toggleLayerRadiation')?.checked) activeCount++;
  if ($('toggleLayerWeather')?.checked) activeCount++;
  if ($('toggleLayerAqi')?.checked) activeCount++;

  const badge = $('tacticalLayersActiveBadge');
  if (badge) {
    badge.textContent = `${activeCount} Active`;
    badge.classList.toggle('active', activeCount > 0);
  }
}

function toggleMinefieldsLayer(visible) {
  if (!state.map) return;
  const visibility = visible ? 'visible' : 'none';
  ['minefields-fill', 'minefields-line'].forEach(layerId => {
    if (state.map.getLayer(layerId)) {
      state.map.setLayoutProperty(layerId, 'visibility', visibility);
    }
  });
  renderTacticalMineMarkers(visible);
}

function toggleBorderTacticalLayer(visible) {
  if (!state.map) return;
  if (visible) {
    renderBorderMapMarkers(state.borderData);
  } else {
    if (state.activeMapModule !== 'border') {
      clearMarkerList(moduleLayers.border.markers);
      closeBorderPopup();
    }
  }
}

function toggleSeismicTacticalLayer(visible) {
  if (!state.map) return;
  if (visible) {
    renderEarthquakeMapMarkers(state.data?.earthquakes);
  } else {
    clearMarkerList(moduleLayers.earthquake.markers);
  }
}

function toggleRadiationTacticalLayer(visible) {
  if (!state.map) return;
  if (visible) {
    renderRadiationMapMarkers(state.data?.radiation);
  } else {
    clearMarkerList(moduleLayers.radiation.markers);
  }
}

function toggleWeatherTacticalLayer(visible) {
  if (!state.map) return;
  if (visible) {
    renderWeatherMapMarkers(state.data?.weather);
  } else {
    clearMarkerList(moduleLayers.weather.markers);
    if (state.weatherPopup) {
      try { state.weatherPopup.remove(); } catch (_) {}
      state.weatherPopup = null;
    }
  }
}

function toggleAqiTacticalLayer(visible) {
  if (!state.map) return;
  if (visible) {
    renderAqiMapMarkers(state.data?.aqi);
  } else {
    clearMarkerList(moduleLayers.aqi.markers);
  }
}

function toggleTacticalLayersMenu(forceState) {
  const menu = $('tacticalLayersMenu');
  if (!menu) return;
  const isCurrentlyOpen = menu.style.display === 'block';
  const shouldOpen = typeof forceState === 'boolean' ? forceState : !isCurrentlyOpen;
  menu.style.display = shouldOpen ? 'block' : 'none';
  const btn = $('btnTacticalLayersToggle');
  if (btn) btn.classList.toggle('active', shouldOpen);
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
  const currentPitch = state.mapMode === '3d' ? 50 : 0;
  if (shouldShowKosovoView) {
    state.map.fitBounds(DEFAULT_KOSOVO_BOUNDS, { padding: 60, duration: 800, pitch: currentPitch });
  } else {
    state.map.easeTo({ center: centerPoint, zoom: 11, pitch: currentPitch, duration: 800 });
  }

  // Only render layer for the currently active map module
  if (state.activeMapModule && moduleLayers[state.activeMapModule]) {
    moduleLayers[state.activeMapModule].render(data);
  } else {
    clearAllModuleLayers();
  }
  syncTacticalLayersOnMap();

  state.map.setPitch(currentPitch);
  state.map.setBearing(0);

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
  a.download = `sentinel-report-${d.location.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().slice(0, 10)}.txt`;
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

  // 7. WILDFIRE EXCLUDED FROM LIVE ALERTS PER OPERATIONAL REQUIREMENT

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

function renderLiveAlertTicker(alerts = []) {
  const track = $('liveAlertTickerTrack');
  if (!track) return;

  const validAlerts = (alerts || []).filter(a => a.module !== 'wildfire' && a.category !== 'wildfire');

  if (!validAlerts || validAlerts.length === 0) {
    track.innerHTML = '<span class="ticker-item-placeholder">ALL SYSTEMS NORMAL · KOSINT REAL-TIME INTELLIGENCE ACTIVE</span>';
    track.style.animation = 'none';
    return;
  }

  const itemsHtml = validAlerts.map(a => {
    const sev = (a.severity || 'INFO').toUpperCase();
    const sevClass = sev.toLowerCase();
    const mod = (a.module || a.category || 'SYSTEM').toUpperCase();
    const timeStr = formatTimeAgo(a.timestamp);
    const titleText = a.title || a.message || 'Alert Notice';

    return `
      <div class="ticker-item" onclick="handleAlertClick('${escHtml(a.id)}')" title="Click to view alert details">
        <span class="ticker-tag sev-${sevClass}">[${escHtml(sev)}]</span>
        <span class="ticker-mod">${escHtml(mod)}</span>
        <span class="ticker-title">${escHtml(titleText)}</span>
        <span class="ticker-time">· ${escHtml(timeStr)}</span>
      </div>
    `;
  }).join('');

  track.innerHTML = itemsHtml + itemsHtml;
  track.style.animation = 'tickerMove 160s linear infinite';
  track.onmouseenter = () => { track.style.animationPlayState = 'paused'; };
  track.onmouseleave = () => { track.style.animationPlayState = 'running'; };
  const bar = $('liveAlertTickerBar');
  if (bar) {
    bar.onmouseenter = () => { track.style.animationPlayState = 'paused'; };
    bar.onmouseleave = () => { track.style.animationPlayState = 'running'; };
  }
}

function renderAlertLog(alerts = []) {
  const cleanAlerts = (alerts || []).filter(a => a.module !== 'wildfire' && a.category !== 'wildfire');
  renderLiveAlertTicker(cleanAlerts);

  const log = $('alertLog');
  const badge = $('unreadBadge');
  if (!log) return;

  const unreadCount = cleanAlerts.filter(a => !a.read).length;
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }

  if (!cleanAlerts || cleanAlerts.length === 0) {
    log.innerHTML = '<div class="empty-state">No active alerts · All systems normal</div>';
    return;
  }

  log.innerHTML = cleanAlerts.map(a => {
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
    } catch (e) { }
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
  } catch (e) { }
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
  await fetch('/api/alerts/read', { method: 'POST' }).catch(() => { });
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

function escHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
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
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function formatHour(iso) { try { return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }); } catch { return iso; } }
function weatherIcon(code) {
  if (code === 0) return '☀️'; if (code <= 3) return '⛅'; if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️'; if (code <= 77) return '🌨️'; if (code <= 82) return '🌦️'; if (code <= 99) return '⛈️'; return '🌤️';
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

function buildBorderPopupHtml(c) {
  if (!c) return '';
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

  const timeAgoStr = c.updatedAt ? formatTimeAgo(c.updatedAt) : 'Recent';
  const entryWaitStr = entry.waitingMinutesText || (entry.waitingMinutes != null ? `${entry.waitingMinutes} min` : '03-05 min');
  const entryQueueStr = entry.queueLengthText || (entry.queueLengthMeters != null ? `${entry.queueLengthMeters} m` : '0 m');
  const exitWaitStr = exit.waitingMinutesText || (exit.waitingMinutes != null ? `${exit.waitingMinutes} min` : '03-05 min');
  const exitQueueStr = exit.queueLengthText || (exit.queueLengthMeters != null ? `${exit.queueLengthMeters} m` : '0 m');

  const neighbor = c.neighborCountry ? `Kosovo ↔ ${c.neighborCountry}` : 'Border Crossing';
  const sourceLabel = c.source === 'NAKORDONI' ? 'Nakordoni' : (c.source || 'QKMK');
  const statusLabel = `${(c.status || 'OPEN').toUpperCase()} · ${statusText}`;
  const icon = '🛂';

  let truckPopupHtml = '';
  if (c.trucks) {
    const trEntryWait = c.trucks.entry?.waitingMinutesText || (c.trucks.entry?.waitingMinutes != null ? `${c.trucks.entry.waitingMinutes} min` : '03-05 min');
    const trExitWait = c.trucks.exit?.waitingMinutesText || (c.trucks.exit?.waitingMinutes != null ? `${c.trucks.exit.waitingMinutes} min` : '03-05 min');
    const trEntryQueue = c.trucks.entry?.queueLengthText || (c.trucks.entry?.queueLengthMeters != null ? `${c.trucks.entry.queueLengthMeters} m` : '0 m');
    const trExitQueue = c.trucks.exit?.queueLengthText || (c.trucks.exit?.queueLengthMeters != null ? `${c.trucks.exit.queueLengthMeters} m` : '0 m');

    truckPopupHtml = `
      <div class="border-popup-trucks-box border-popup-trucks-row">
        <div class="border-trucks-title">
          <span class="truck-tag">🚛 TRUCKS</span>
        </div>
        <div class="border-trucks-grid">
          <div class="border-truck-col">
            <span class="border-flow-sublabel">ENTRY</span>
            <span class="border-flow-val">${escHtml(trEntryWait)} · ${escHtml(trEntryQueue)}</span>
          </div>
          <div class="border-truck-col">
            <span class="border-flow-sublabel">EXIT</span>
            <span class="border-flow-val">${escHtml(trExitWait)} · ${escHtml(trExitQueue)}</span>
          </div>
        </div>
      </div>
    `;
  }

  const carsGridHtml = `
    <div class="border-popup-cars-section">
      <div class="border-popup-section-title">🚗 CARS & PASSENGERS</div>
      <div class="border-popup-metrics-grid">
        <div class="border-metric-card">
          <span class="border-metric-label">Cars Entry Wait</span>
          <span class="border-metric-val ${entry.waitingMinutes >= 30 ? 'text-warning' : ''}">${escHtml(entryWaitStr)}</span>
          <span class="border-metric-sublabel">Entry Queue</span>
          <span class="border-metric-subval">${escHtml(entryQueueStr)}</span>
        </div>
        <div class="border-metric-card">
          <span class="border-metric-label">Cars Exit Wait</span>
          <span class="border-metric-val ${exit.waitingMinutes >= 30 ? 'text-warning' : ''}">${escHtml(exitWaitStr)}</span>
          <span class="border-metric-sublabel">Exit Queue</span>
          <span class="border-metric-subval">${escHtml(exitQueueStr)}</span>
        </div>
      </div>
    </div>
  `;

  return `
    <div class="map-popup border-popup-container">
      <div class="map-popup-header border-popup-header">
        <div class="border-header-top">
          <div class="map-popup-title">
            <span class="map-popup-icon">🛂</span>
            <span class="border-popup-title-text">${escHtml((c.name || 'BORDER CROSSING').toUpperCase())}</span>
          </div>
          <span class="map-popup-badge" style="background:${color}20; color:${color}; border:1px solid ${color}40;">
            ${escHtml(statusLabel)}
          </span>
        </div>
        <div class="border-header-sub">
          <span class="border-country-pair">${escHtml(neighbor)}</span>
          <span class="map-popup-source">via ${escHtml(sourceLabel)}</span>
        </div>
      </div>
      <div class="map-popup-body border-popup-body">
        ${carsGridHtml}
        ${truckPopupHtml}
      </div>
      <div class="map-popup-footer border-popup-footer">
        <span>UPDATED: ${escHtml(timeAgoStr.toUpperCase())}</span>
        <span>SOURCE: ${escHtml(sourceLabel.toUpperCase())}</span>
      </div>
    </div>
  `;
}

function openBorderPopup(crossing) {
  if (!state.map || !crossing) return;
  const coords = crossing.coordinates || BORDER_CROSSING_LOCATIONS[crossing.id] || BORDER_CROSSING_LOCATIONS[`border-${crossing.id}`];
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lon !== 'number') return;

  closeMapPopup();
  state.selectedBorderCrossingId = crossing.id;

  // Synchronize active class on all border markers
  if (moduleLayers.border?.markers) {
    moduleLayers.border.markers.forEach(m => {
      const el = m.getElement ? m.getElement() : m._element;
      if (el) {
        if (m._crossingId === crossing.id) el.classList.add('active');
        else el.classList.remove('active');
      }
    });
  }

  const html = buildBorderPopupHtml(crossing);
  const popup = createMapPopup(html, { className: 'border-map-popup' })
    .setLngLat([coords.lon, coords.lat]);

  popup.on('close', () => {
    if (state.activeMapPopup === popup || state.borderPopup === popup) {
      state.activeMapPopup = null;
      state.borderPopup = null;
      state.selectedBorderCrossingId = null;
      if (moduleLayers.border?.markers) {
        moduleLayers.border.markers.forEach(m => {
          const el = m.getElement ? m.getElement() : m._element;
          if (el) el.classList.remove('active');
        });
      }
    }
    updateMapBadgeAndMeta();
  });

  popup.addTo(state.map);
  state.activeMapPopup = popup;
  state.borderPopup = popup;
}

function closeBorderPopup() {
  closeMapPopup();
  state.selectedBorderCrossingId = null;
  state.borderPopup = null;
  if (moduleLayers.border?.markers) {
    moduleLayers.border.markers.forEach(m => {
      const el = m.getElement ? m.getElement() : m._element;
      if (el) el.classList.remove('active');
    });
  }
}

function selectBorderCrossing(crossingId) {
  const crossing = (state.borderData?.crossings || []).find(c => c.id === crossingId) ||
    Object.values(BORDER_CROSSING_LOCATIONS).find(b => b.id === crossingId || b.id === `border-${crossingId}`);
  if (!crossing) return;

  // Toggle behavior: If user clicks the currently active marker whose popup is open, close it!
  if (state.selectedBorderCrossingId === crossing.id && (state.borderPopup || state.activeMapPopup)) {
    closeBorderPopup();
    updateMapBadgeAndMeta();
    return;
  }

  openBorderPopup(crossing);
  updateMapBadgeAndMeta();
}

function renderBorderMapMarkers(borderData) {
  const isTacticalActive = (typeof $ === 'function' && $('toggleLayerBorder')) ? $('toggleLayerBorder').checked : false;
  if (!state.map || (state.activeMapModule !== 'border' && !isTacticalActive)) return;
  clearMarkerList(moduleLayers.border.markers);

  const data = borderData || state.borderData;
  const crossings = (data && Array.isArray(data.crossings) && data.crossings.length > 0)
    ? data.crossings
    : Object.entries(BORDER_CROSSING_LOCATIONS).map(([id, meta]) => ({
      id,
      name: meta.name,
      shortName: meta.shortName,
      neighborCountry: meta.neighbor,
      coordinates: { lat: meta.lat, lon: meta.lon },
      status: 'OPEN',
      direction: { entry: { waitingMinutes: 5, queueLengthMeters: 0 }, exit: { waitingMinutes: 5, queueLengthMeters: 0 } },
      source: 'QKMK'
    }));

  crossings.forEach(c => {
    const coords = c.coordinates || BORDER_CROSSING_LOCATIONS[c.id] || BORDER_CROSSING_LOCATIONS[`border-${c.id}`];
    if (!coords || typeof coords.lat !== 'number' || typeof coords.lon !== 'number') return;

    const entry = c.direction?.entry || {};
    const exit = c.direction?.exit || {};
    const maxWait = Math.max(entry.waitingMinutes || 0, exit.waitingMinutes || 0);
    const maxQueue = Math.max(entry.queueLengthMeters || 0, exit.queueLengthMeters || 0);

    let color = '#34d399'; // Green (low/normal)
    let delayClass = 'delay-low';
    if (maxWait >= 60 || maxQueue >= 500) {
      color = '#f87171'; // Red (critical)
      delayClass = 'delay-critical';
    } else if (maxWait >= 30 || maxQueue >= 200) {
      color = '#fb923c'; // Orange (high)
      delayClass = 'delay-high';
    } else if (maxWait >= 15 || maxQueue >= 50) {
      color = '#fbbf24'; // Yellow (elevated)
      delayClass = 'delay-elevated';
    }

    const markerEl = createBorderMarkerElement(color, c.shortName || c.name, c.id, delayClass);
    if (state.selectedBorderCrossingId === c.id) {
      markerEl.classList.add('active');
    }

    // Toggle popup on marker click
    markerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      selectBorderCrossing(c.id);
    });

    const marker = new maplibregl.Marker({ element: markerEl, anchor: 'center' })
      .setLngLat([coords.lon, coords.lat])
      .addTo(state.map);

    marker._module = 'border';
    marker._crossingId = c.id;
    moduleLayers.border.markers.push(marker);
  });

  updateMapBadgeAndMeta();
}

function createBorderMarkerElement(color, label, crossingId = '', delayClass = '') {
  const el = document.createElement('div');
  el.className = 'border-custom-marker';
  if (crossingId) el.setAttribute('data-crossing-id', crossingId);

  const isCritical = delayClass === 'delay-critical';
  const isHigh = delayClass === 'delay-high';
  const pulseClass = isCritical ? 'threat-pulse-critical' : (isHigh ? 'threat-pulse-high' : '');

  el.innerHTML = `
    <div class="border-marker-pin ${pulseClass}" style="background:${color}; box-shadow: 0 0 10px ${color}88; position: relative;">
      ${isCritical ? '<div class="radar-ring critical"></div>' : ''}
    </div>
    <div class="border-marker-label">${escHtml(label)}</div>
  `;
  return el;
}

function focusBorderCrossing(crossingId) {
  const crossing = (state.borderData?.crossings || []).find(c => c.id === crossingId);
  const coords = crossing?.coordinates || BORDER_CROSSING_LOCATIONS[crossingId] || BORDER_CROSSING_LOCATIONS[`border-${crossingId}`];

  if (coords && state.map) {
    state.map.flyTo({ center: [coords.lon, coords.lat], zoom: 12, speed: 1.2 });
    if (crossing) {
      openBorderPopup(crossing);
    }
  }
}

// ── ROUTE INTELLIGENCE & THREAT CORRIDOR ANALYSIS ─────────────────────────────

const KOSOVO_LOCATIONS_GEOCODE = {
  // Major cities & regional centers
  'prishtinë': { name: 'Prishtinë', lat: 42.6629, lon: 21.1655 },
  'prishtine': { name: 'Prishtinë', lat: 42.6629, lon: 21.1655 },
  'pristina': { name: 'Prishtinë', lat: 42.6629, lon: 21.1655 },
  'mitrovicë': { name: 'Mitrovicë', lat: 42.8914, lon: 20.8660 },
  'mitrovice': { name: 'Mitrovicë', lat: 42.8914, lon: 20.8660 },
  'mitrovica': { name: 'Mitrovicë', lat: 42.8914, lon: 20.8660 },
  'prizren': { name: 'Prizren', lat: 42.2153, lon: 20.7415 },
  'pejë': { name: 'Pejë', lat: 42.6593, lon: 20.2887 },
  'peje': { name: 'Pejë', lat: 42.6593, lon: 20.2887 },
  'pec': { name: 'Pejë', lat: 42.6593, lon: 20.2887 },
  'gjilan': { name: 'Gjilan', lat: 42.4635, lon: 21.4694 },
  'gnjilane': { name: 'Gjilan', lat: 42.4635, lon: 21.4694 },
  'ferizaj': { name: 'Ferizaj', lat: 42.3705, lon: 21.1530 },
  'urosevac': { name: 'Ferizaj', lat: 42.3705, lon: 21.1530 },
  'gjakovë': { name: 'Gjakovë', lat: 42.3810, lon: 20.4320 },
  'gjakove': { name: 'Gjakovë', lat: 42.3810, lon: 20.4320 },
  'djakovica': { name: 'Gjakovë', lat: 42.3810, lon: 20.4320 },
  'podujevë': { name: 'Podujevë', lat: 42.9110, lon: 21.1967 },
  'podujeve': { name: 'Podujevë', lat: 42.9110, lon: 21.1967 },
  'vushtrri': { name: 'Vushtrri', lat: 42.8231, lon: 20.9678 },
  'leposavić': { name: 'Leposavić', lat: 43.1039, lon: 20.8028 },
  'leposavic': { name: 'Leposavić', lat: 43.1039, lon: 20.8028 },
  'zvečan': { name: 'Zvečan', lat: 42.9064, lon: 20.8403 },
  'zvecan': { name: 'Zvečan', lat: 42.9064, lon: 20.8403 },
  'zubin potok': { name: 'Zubin Potok', lat: 42.9144, lon: 20.6908 },

  // Smaller towns & regional municipalities
  'shtime': { name: 'Shtime', lat: 42.4331, lon: 21.0397 },
  'stimlje': { name: 'Shtime', lat: 42.4331, lon: 21.0397 },
  'kaçanik': { name: 'Kaçanik', lat: 42.2319, lon: 21.2594 },
  'kacanik': { name: 'Kaçanik', lat: 42.2319, lon: 21.2594 },
  'obiliq': { name: 'Obiliq', lat: 42.6869, lon: 21.0772 },
  'obilic': { name: 'Obiliq', lat: 42.6869, lon: 21.0772 },
  'kastriot': { name: 'Obiliq', lat: 42.6869, lon: 21.0772 },
  'suharekë': { name: 'Suharekë', lat: 42.3586, lon: 20.8250 },
  'suhareke': { name: 'Suharekë', lat: 42.3586, lon: 20.8250 },
  'suva reka': { name: 'Suharekë', lat: 42.3586, lon: 20.8250 },
  'skenderaj': { name: 'Skenderaj', lat: 42.7486, lon: 20.7878 },
  'srbica': { name: 'Skenderaj', lat: 42.7486, lon: 20.7878 },
  'istog': { name: 'Istog', lat: 42.7808, lon: 20.4875 },
  'istok': { name: 'Istog', lat: 42.7808, lon: 20.4875 },
  'klinë': { name: 'Klinë', lat: 42.6217, lon: 20.5778 },
  'kline': { name: 'Klinë', lat: 42.6217, lon: 20.5778 },
  'klina': { name: 'Klinë', lat: 42.6217, lon: 20.5778 },
  'rahovec': { name: 'Rahovec', lat: 42.3994, lon: 20.6547 },
  'orahovac': { name: 'Rahovec', lat: 42.3994, lon: 20.6547 },
  'malishevë': { name: 'Malishevë', lat: 42.4822, lon: 20.7458 },
  'malisheve': { name: 'Malishevë', lat: 42.4822, lon: 20.7458 },
  'malisevo': { name: 'Malishevë', lat: 42.4822, lon: 20.7458 },
  'kamenicë': { name: 'Kamenicë', lat: 42.5781, lon: 21.5803 },
  'kamenice': { name: 'Kamenicë', lat: 42.5781, lon: 21.5803 },
  'kosovska kamenica': { name: 'Kamenicë', lat: 42.5781, lon: 21.5803 },
  'dragash': { name: 'Dragash', lat: 42.0625, lon: 20.6533 },
  'dragas': { name: 'Dragash', lat: 42.0625, lon: 20.6533 },
  'štrpce': { name: 'Štrpce', lat: 42.2394, lon: 21.0272 },
  'strpce': { name: 'Štrpce', lat: 42.2394, lon: 21.0272 },
  'shtërpcë': { name: 'Štrpce', lat: 42.2394, lon: 21.0272 },
  'shterpce': { name: 'Štrpce', lat: 42.2394, lon: 21.0272 },
  'novo brdo': { name: 'Novo Brdo', lat: 42.6156, lon: 21.4339 },
  'novobërdë': { name: 'Novo Brdo', lat: 42.6156, lon: 21.4339 },
  'novoberde': { name: 'Novo Brdo', lat: 42.6156, lon: 21.4339 },
  'gračanica': { name: 'Gračanica', lat: 42.5981, lon: 21.1933 },
  'gracanica': { name: 'Gračanica', lat: 42.5981, lon: 21.1933 },
  'graçanicë': { name: 'Gračanica', lat: 42.5981, lon: 21.1933 },
  'gracanice': { name: 'Gračanica', lat: 42.5981, lon: 21.1933 },
  'deçan': { name: 'Deçan', lat: 42.5403, lon: 20.2889 },
  'decan': { name: 'Deçan', lat: 42.5403, lon: 20.2889 },
  'decani': { name: 'Deçan', lat: 42.5403, lon: 20.2889 },
  'fushë kosovë': { name: 'Fushë Kosovë', lat: 42.6339, lon: 21.0964 },
  'fushe kosove': { name: 'Fushë Kosovë', lat: 42.6339, lon: 21.0964 },
  'kosovo polje': { name: 'Fushë Kosovë', lat: 42.6339, lon: 21.0964 },
  'lipjan': { name: 'Lipjan', lat: 42.5217, lon: 21.1258 },
  'lipljan': { name: 'Lipjan', lat: 42.5217, lon: 21.1258 },
  'ranilug': { name: 'Ranilug', lat: 42.4922, lon: 21.5986 },
  'ranillug': { name: 'Ranilug', lat: 42.4922, lon: 21.5986 },
  'partesh': { name: 'Partesh', lat: 42.4019, lon: 21.4325 },
  'parteš': { name: 'Partesh', lat: 42.4019, lon: 21.4325 },
  'klokot': { name: 'Klokot', lat: 42.3711, lon: 21.3736 },
  'kllokot': { name: 'Klokot', lat: 42.3711, lon: 21.3736 },
  'brezovica': { name: 'Brezovica', lat: 42.2222, lon: 21.0028 },
  'banjë': { name: 'Banjë / Banja', lat: 42.8156, lon: 20.6722 },
  'banje': { name: 'Banjë / Banja', lat: 42.8156, lon: 20.6722 },
  'banja': { name: 'Banjë / Banja', lat: 42.8156, lon: 20.6722 },
  'gazivode': { name: 'Gazivodë / Gazivode', lat: 42.9619, lon: 20.6178 },
  'gazivodë': { name: 'Gazivodë / Gazivode', lat: 42.9619, lon: 20.6178 },
  'prekaz': { name: 'Prekaz', lat: 42.7667, lon: 20.8167 },
  'rugovë': { name: 'Rugovë', lat: 42.6833, lon: 20.1667 },
  'rugove': { name: 'Rugovë', lat: 42.6833, lon: 20.1667 },
  'rugova': { name: 'Rugovë', lat: 42.6833, lon: 20.1667 },

  // Border crossings
  'jarinje': { name: 'Jarinje (Border)', lat: 43.2185, lon: 20.6980 },
  'brnjak': { name: 'Brnjak (Border)', lat: 42.9644, lon: 20.5528 },
  'merdarë': { name: 'Merdarë (Border)', lat: 42.9360, lon: 21.2460 },
  'merdare': { name: 'Merdarë (Border)', lat: 42.9360, lon: 21.2460 },
  'dheu i bardhë': { name: 'Dheu i Bardhë (Border)', lat: 42.4490, lon: 21.6560 },
  'dheu i bardhe': { name: 'Dheu i Bardhë (Border)', lat: 42.4490, lon: 21.6560 },
  'hani i elezit': { name: 'Hani i Elezit (Border)', lat: 42.1490, lon: 21.2980 },
  'vërmicë': { name: 'Vërmicë (Border)', lat: 42.1580, lon: 20.5500 },
  'vermice': { name: 'Vërmicë (Border)', lat: 42.1580, lon: 20.5500 },
  'kullë': { name: 'Kullë / Kula (Border)', lat: 42.7830, lon: 20.3080 },
  'kulle': { name: 'Kullë / Kula (Border)', lat: 42.7830, lon: 20.3080 },
  'kula': { name: 'Kullë / Kula (Border)', lat: 42.7830, lon: 20.3080 },
  'morinë': { name: 'Morinë (Border)', lat: 42.3550, lon: 20.4050 },
  'morine': { name: 'Morinë (Border)', lat: 42.3550, lon: 20.4050 },

  // Operational Hubs & Safe Havens
  'regional centre mitrovica': { name: 'Regional Centre Mitrovica', lat: 42.890128, lon: 20.876167 },
  'regional center mitrovica': { name: 'Regional Centre Mitrovica', lat: 42.890128, lon: 20.876167 },
  'rc mitrovica': { name: 'Regional Centre Mitrovica', lat: 42.890128, lon: 20.876167 },
  'safe haven north': { name: 'Safe Haven North', lat: 42.898893, lon: 20.862213 },
  'safe haven - north': { name: 'Safe Haven North', lat: 42.898893, lon: 20.862213 }
};

function resolveLocationCoordinates(query) {
  if (!query || typeof query !== 'string') return null;
  const q = query.trim().toLowerCase();

  const coordsMatch = q.match(/^([-+]?\d{1,2}(?:\.\d+)?)[,\s]+([-+]?\d{1,3}(?:\.\d+)?)$/);
  if (coordsMatch) {
    const lat = parseFloat(coordsMatch[1]);
    const lon = parseFloat(coordsMatch[2]);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      if (Math.abs(lat - 42.890128) < 0.0005 && Math.abs(lon - 20.876167) < 0.0005) {
        return { name: 'Regional Centre Mitrovica', lat: 42.890128, lon: 20.876167 };
      }
      if (Math.abs(lat - 42.898893) < 0.0005 && Math.abs(lon - 20.862213) < 0.0005) {
        return { name: 'Safe Haven North', lat: 42.898893, lon: 20.862213 };
      }
      return { name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`, lat, lon };
    }
  }

  const cleanQ = q.replace(/\s*\([^)]*\)/g, '').trim();
  if (KOSOVO_LOCATIONS_GEOCODE[cleanQ]) {
    return KOSOVO_LOCATIONS_GEOCODE[cleanQ];
  }

  for (const [key, val] of Object.entries(KOSOVO_LOCATIONS_GEOCODE)) {
    if (cleanQ.includes(key) || key.includes(cleanQ)) {
      return val;
    }
  }

  for (const [id, b] of Object.entries(BORDER_CROSSING_LOCATIONS)) {
    if (cleanQ.includes(id.toLowerCase()) || cleanQ.includes(b.name.toLowerCase()) || cleanQ.includes(b.shortName.toLowerCase())) {
      return { name: b.name, lat: b.lat, lon: b.lon };
    }
  }

  return null;
}

function addRouteDestinationInput(val = '') {
  const container = $('routeViaInputsContainer');
  if (!container) return;

  const count = container.children.length + 1;
  const row = document.createElement('div');
  row.className = 'route-input-row route-via-row';
  row.style.marginTop = '6px';
  row.style.marginBottom = '6px';
  row.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:2px;">
      <label class="route-input-label">VIA WAYPOINT ${count}</label>
      <button type="button" onclick="this.closest('.route-via-row').remove();" style="background:transparent; border:none; color:#f87171; font-size:11px; font-weight:700; cursor:pointer; padding:0;">✕</button>
    </div>
    <div class="route-input-field-wrap">
      <span class="route-input-icon">🔵</span>
      <input type="text" class="input-field route-input route-via-input" placeholder="Via town / locality (e.g. Ferizaj)" list="routeLocationsList" value="${escHtml(val)}" />
    </div>
  `;
  container.appendChild(row);
}

async function calculateRoute() {
  const startQuery = $('routeStartInput')?.value.trim();
  const endQuery = $('routeEndInput')?.value.trim();
  const viaInputs = Array.from(document.querySelectorAll('.route-via-input'))
    .map(i => i.value.trim())
    .filter(Boolean);

  if (!startQuery || (!endQuery && viaInputs.length === 0)) {
    alert('Please enter a start point and at least one destination.');
    return;
  }

  const parseDestinations = (str) => {
    if (!str) return [];
    const trimmed = str.trim();
    // 1. If string is a coordinate pair e.g. "42.8945, 20.8672" or "42.8945 20.8672", preserve as single coordinate item
    if (/^[-+]?\d{1,2}(?:\.\d+)?\s*[, ]\s*[-+]?\d{1,3}(?:\.\d+)?$/.test(trimmed)) {
      return [trimmed];
    }
    // 2. If semicolon is used (e.g. "Prishtinë; Prizren" or "42.89, 20.86; 42.66, 21.15")
    if (trimmed.includes(';')) {
      return trimmed.split(';').map(s => s.trim()).filter(Boolean);
    }
    // 3. If comma separated, check if it's two numbers (lat, lon)
    const parts = trimmed.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
      return [trimmed];
    }
    // 4. Otherwise it's a list of place names like "Prishtinë, Prizren"
    return parts;
  };

  const rawQueries = [];
  parseDestinations(startQuery).forEach(q => rawQueries.push(q));
  viaInputs.forEach(v => {
    parseDestinations(v).forEach(q => rawQueries.push(q));
  });
  if (endQuery) {
    parseDestinations(endQuery).forEach(q => rawQueries.push(q));
  }

  const resolvedPoints = [];
  const unresolvable = [];

  for (const q of rawQueries) {
    const resolved = resolveLocationCoordinates(q);
    if (resolved) {
      resolvedPoints.push(resolved);
    } else {
      unresolvable.push(q);
    }
  }

  if (unresolvable.length > 0 || resolvedPoints.length < 2) {
    alert(`Could not resolve coordinates for "${unresolvable.join(', ') || 'selected points'}". Please enter valid city/town names, border crossings, or lat,lon coordinates.`);
    return;
  }

  const startCoords = resolvedPoints[0];
  const endCoords = resolvedPoints[resolvedPoints.length - 1];

  const calcBtn = $('routeCalcBtn');
  if (calcBtn) {
    calcBtn.disabled = true;
    calcBtn.innerHTML = '<span class="btn-icon">⏳</span> ROUTING...';
  }

  const resultsCard = $('routeResultsCard');
  const distEl = $('routeDistanceVal');
  const durEl = $('routeDurationVal');
  const statusBadge = $('routeStatusBadge');
  const waypointsSummary = $('routeWaypointsSummary');

  try {
    const osrmCoordsStr = resolvedPoints.map(p => `${p.lon},${p.lat}`).join(';');
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${osrmCoordsStr}?overview=full&geometries=geojson`;

    let routeGeoJson = null;
    let distanceKm = null;
    let durationMin = null;

    try {
      const res = await fetch(osrmUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const r = data.routes[0];
          if (r.geometry && Array.isArray(r.geometry.coordinates) && r.geometry.coordinates.length > 0) {
            routeGeoJson = {
              type: 'Feature',
              geometry: r.geometry,
              properties: {}
            };
            distanceKm = (r.distance / 1000).toFixed(1);
            durationMin = Math.round(r.duration / 60);
          }
        }
      }
    } catch (e) {
      console.warn('OSRM routing request failed:', e.message);
    }

    if (!routeGeoJson) {
      state.currentRoute = null;
      if (state.map) {
        const source = state.map.getSource('route-source');
        if (source) source.setData({ type: 'FeatureCollection', features: [] });
      }
      if (state.routeMarkers) {
        state.routeMarkers.forEach(m => { try { m.remove(); } catch (e) { } });
        state.routeMarkers = [];
      }

      if (distEl) distEl.textContent = '--';
      if (durEl) durEl.textContent = '--';
      if (statusBadge) {
        statusBadge.textContent = '⚠ ROUTING SERVICE UNAVAILABLE';
        statusBadge.className = 'metric-status-badge status-unavailable';
      }
      if (waypointsSummary) {
        waypointsSummary.textContent = `${resolvedPoints.map(p => p.name).join(' → ')} · DRIVE (UNAVAILABLE)`;
      }
      if (resultsCard) {
        resultsCard.style.display = 'flex';
      }
      return;
    }

    state.currentRoute = {
      start: startCoords,
      end: endCoords,
      points: resolvedPoints,
      geoJson: routeGeoJson,
      distanceKm,
      durationMin
    };

    if (distEl) distEl.textContent = `${distanceKm} km`;
    if (durEl) {
      const hours = Math.floor(durationMin / 60);
      const mins = durationMin % 60;
      durEl.textContent = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
    }
    if (statusBadge) {
      statusBadge.textContent = 'ROUTE CALCULATED';
      statusBadge.className = 'metric-status-badge status-normal';
    }
    if (waypointsSummary) {
      waypointsSummary.textContent = `${resolvedPoints.map(p => p.name).join(' → ')} · DRIVE`;
    }

    if (resultsCard) {
      resultsCard.style.display = 'flex';
    }

    renderRouteOnMap(routeGeoJson, resolvedPoints);

  } catch (err) {
    console.error('Route calculation error:', err);
    if (statusBadge) {
      statusBadge.textContent = '⚠ ROUTING ERROR';
      statusBadge.className = 'metric-status-badge status-unavailable';
    }
  } finally {
    if (calcBtn) {
      calcBtn.disabled = false;
      calcBtn.innerHTML = '<span class="btn-icon">📍</span> CALCULATE ROUTE';
    }
  }
}

function renderRouteOnMap(routeGeoJson, pointsOrStart, endCoords) {
  if (!state.map) return;

  const points = Array.isArray(pointsOrStart) ? pointsOrStart : [pointsOrStart, endCoords].filter(Boolean);

  let source = state.map.getSource('route-source');
  if (!source) {
    state.map.addSource('route-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [routeGeoJson] }
    });
    state.map.addLayer({
      id: 'route-line-glow',
      type: 'line',
      source: 'route-source',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#38bdf8', 'line-width': 9, 'line-opacity': 0.45, 'line-blur': 3 }
    });
    state.map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route-source',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#0284c7', 'line-width': 4, 'line-opacity': 0.95 }
    });
  } else {
    source.setData({ type: 'FeatureCollection', features: [routeGeoJson] });
  }

  if (state.routeMarkers) {
    state.routeMarkers.forEach(m => { try { m.remove(); } catch (e) { } });
    state.routeMarkers = [];
  } else {
    state.routeMarkers = [];
  }

  points.forEach((pt, idx) => {
    const isStart = idx === 0;
    const isEnd = idx === points.length - 1;
    const pinLetter = String.fromCharCode(65 + Math.min(idx, 25));

    const el = document.createElement('div');
    const pinType = isStart ? 'route-pin-a' : (isEnd ? 'route-pin-b' : 'route-pin-via');
    el.className = `route-pin-marker ${pinType}`;
    el.textContent = pinLetter;
    el.title = `${isStart ? 'Start' : (isEnd ? 'Destination' : `Waypoint ${idx}`)}: ${pt.name || 'Location'}`;

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([pt.lon, pt.lat])
      .addTo(state.map);
    state.routeMarkers.push(marker);
  });

  const coordinates = routeGeoJson.geometry.coordinates;
  const bounds = coordinates.reduce((b, coord) => {
    return b.extend(coord);
  }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

  state.map.fitBounds(bounds, { padding: 80, duration: 800 });
}

function clearRoute(resetInputs = true) {
  state.currentRoute = null;

  if (state.map) {
    const source = state.map.getSource('route-source');
    if (source) {
      source.setData({ type: 'FeatureCollection', features: [] });
    }
  }

  if (state.routeMarkers) {
    state.routeMarkers.forEach(m => { try { m.remove(); } catch (e) { } });
    state.routeMarkers = [];
  }

  const resultsCard = $('routeResultsCard');
  if (resultsCard) resultsCard.style.display = 'none';

  if (resetInputs) {
    const startInput = $('routeStartInput');
    const endInput = $('routeEndInput');
    if (startInput) startInput.value = '';
    if (endInput) endInput.value = '';
  }
}

window.toggleModule = toggleModule;
window.startMonitor = startMonitor;
window.toggleMap = toggleMap;
window.updatePollInterval = updatePollInterval;
window.filterNews = filterNews;
window.switchNewsTab = switchNewsTab;
window.toggleNewsUrgent = toggleNewsUrgent;
window.isSerbianNewsItem = isSerbianNewsItem;
window.isAlbanianNewsItem = isAlbanianNewsItem;
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
window.renderLiveAlertTicker = renderLiveAlertTicker;
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
window.fetchAllWeatherCities = fetchAllWeatherCities;
window.updateWeatherCityMarker = updateWeatherCityMarker;
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
window.renderTraffic = renderTraffic;
window.renderTrafficMarkers = renderTrafficMarkers;
window.renderTrafficMapMarkers = renderTrafficMapMarkers;
window.classifyTrafficIncident = classifyTrafficIncident;
window.TRAFFIC_RELEVANCE_TERMS = TRAFFIC_RELEVANCE_TERMS;
window.renderRadiationMapMarkers = renderRadiationMapMarkers;
window.renderEarthquakeMapMarkers = renderEarthquakeMapMarkers;
window.debugSeismicMarkers = debugSeismicMarkers;
window.logSeismicMarkerDebug = logSeismicMarkerDebug;
window.renderNewsMapMarkers = renderNewsMapMarkers;
window.extractNewsLocation = extractNewsLocation;
window.cleanTextForNewsLocation = cleanTextForNewsLocation;
window.KOSOVO_LOCATIONS = KOSOVO_LOCATIONS;
window.buildNewsPopupHtml = buildNewsPopupHtml;
window.buildNewsClusterPopupHtml = buildNewsClusterPopupHtml;
window.openNewsClusterPopup = openNewsClusterPopup;
window.zoomToNewsCluster = zoomToNewsCluster;
window.createNewsClusterMarkerElement = createNewsClusterMarkerElement;
window.openNewsPopup = openNewsPopup;
window.closeNewsPopup = closeNewsPopup;
window.renderAqiMapMarkers = renderAqiMapMarkers;
window.renderAviationMapMarkers = renderAviationMapMarkers;
window.renderBorderMapMarkers = renderBorderMapMarkers;
window.buildBorderPopupHtml = buildBorderPopupHtml;
window.openBorderPopup = openBorderPopup;
window.closeBorderPopup = closeBorderPopup;
window.selectBorderCrossing = selectBorderCrossing;
window.createBorderMarkerElement = createBorderMarkerElement;
window.BORDER_CROSSING_LOCATIONS = BORDER_CROSSING_LOCATIONS;
window.getCCTVEmbedUrl = getCCTVEmbedUrl;
window.clusterGeoItems = clusterGeoItems;
window.createClusterMarkerElement = createClusterMarkerElement;
// ─── Staff Warden & Evacuation Security Management ────────────────────────────

function updateStaffLockUI() {
  const badge = $('staffNavLockBadge');
  if (badge) {
    if (state.staffToken) {
      badge.textContent = '🔓';
      badge.classList.add('unlocked');
      badge.title = 'Staff Warden Layer Unlocked';
    } else {
      badge.textContent = '🔒';
      badge.classList.remove('unlocked');
      badge.title = 'Staff Warden Layer Locked (Click to Authenticate)';
    }
  }
}

function resetStaffInactivityTimer() {
  if (state.staffInactivityTimer) {
    clearTimeout(state.staffInactivityTimer);
  }
  if (state.staffToken) {
    state.staffInactivityTimer = setTimeout(() => {
      console.warn('[Staff Warden] Auto-locking due to 15 minutes of inactivity.');
      logoutStaff(true);
    }, 15 * 60 * 1000);
  }
}

if (typeof window !== 'undefined') {
  ['mousemove', 'keydown', 'click', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, () => {
      if (state.staffToken) {
        resetStaffInactivityTimer();
      }
    }, { passive: true });
  });
}

function openStaffLoginModal() {
  const modal = $('staffLoginModal');
  if (modal) {
    modal.style.display = 'flex';
    const err = $('staffAuthError');
    if (err) err.style.display = 'none';
    const userField = $('staffAuthUser');
    if (userField) {
      userField.focus();
    }
  }
}

function closeStaffLoginModal() {
  const modal = $('staffLoginModal');
  if (modal) modal.style.display = 'none';
}

async function submitStaffLogin(e) {
  if (e) e.preventDefault();
  const user = $('staffAuthUser')?.value?.trim();
  const pass = $('staffAuthPass')?.value;
  const submitBtn = $('btnStaffSubmit');
  const errEl = $('staffAuthError');

  if (!user || !pass) {
    if (errEl) {
      errEl.textContent = 'Username and passphrase are required';
      errEl.style.display = 'block';
    }
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying...';
    }
    if (errEl) errEl.style.display = 'none';

    const res = await fetch('/api/staff/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Authentication failed');
    }

    state.staffToken = data.token;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('staff_warden_token', data.token);
    }
    updateStaffLockUI();
    closeStaffLoginModal();
    resetStaffInactivityTimer();

    // Clear passphrase input for security
    const passInput = $('staffAuthPass');
    if (passInput) passInput.value = '';

    // Switch to staffPanel immediately
    toggleModule('staffPanel');
    fetchStaffLocations();
  } catch (err) {
    if (errEl) {
      errEl.textContent = err.message || 'Invalid username or passphrase';
      errEl.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '🔓 Authenticate & Decrypt';
    }
  }
}

function logoutStaff(isTimeout = false) {
  state.staffToken = null;
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('staff_warden_token');
  }
  if (state.staffInactivityTimer) {
    clearTimeout(state.staffInactivityTimer);
    state.staffInactivityTimer = null;
  }
  state.staffLocations = [];
  state.staffFilteredLocations = [];

  // Clear map markers and popup
  if (moduleLayers.staff) {
    moduleLayers.staff.clear();
  }
  updateStaffLockUI();

  // If staff panel is open, close it
  if (state.activeModule === 'staffPanel' || state.activeMapModule === 'staff') {
    closeModulePanel();
  }

  if (isTimeout) {
    alert('Staff Warden layer auto-locked due to 15 minutes of inactivity for operational security.');
  }
}

async function fetchStaffLocations() {
  if (!state.staffToken) return;
  const listEl = $('staffList');
  if (listEl) {
    listEl.innerHTML = '<div class="loading-state">Decrypting staff residential roster...</div>';
  }

  try {
    const res = await fetch('/api/staff/locations', {
      headers: {
        'Authorization': `Bearer ${state.staffToken}`
      }
    });

    if (res.status === 401) {
      logoutStaff();
      openStaffLoginModal();
      return;
    }

    const data = await res.json();
    state.staffLocations = data.locations || [];
    const badge = $('staffBadge');
    if (badge) {
      badge.textContent = `${state.staffLocations.length} Active`;
      badge.style.display = 'inline-block';
    }

    filterStaffList();
  } catch (err) {
    console.error('[Staff Warden] Fetch error:', err.message);
    if (listEl) {
      listEl.innerHTML = `<div class="empty-state">Error loading staff data: ${err.message}</div>`;
    }
  }
}

function getNationalityFlag(nat) {
  if (!nat) return '';
  const map = {
    'Greece': '🇬🇷 Greece',
    'Albania': '🇦🇱 Albania',
    'Czech Republic': '🇨🇿 Czech Republic',
    'France': '🇫🇷 France',
    'USA': '🇺🇸 USA',
    'Montenegro': '🇲🇪 Montenegro',
    'Kosovo (National Staff)': '🇽🇰 National Staff',
    'National Staff': '🇽🇰 National Staff',
    'Kosovo': '🇽🇰 National Staff',
    'Kosovo S': '🇽🇰 National Staff',
    'International Mission': '🌐 International Mission'
  };
  return map[nat] || nat;
}

function getRoleBadge(role) {
  if (!role) return '';
  const r = role.toLowerCase();
  if (r.includes('deputy')) {
    return `<span class="staff-role-badge role-deputy" style="font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; background:rgba(56,189,248,0.18); color:#38bdf8; border:1px solid rgba(56,189,248,0.4);">DEPUTY WARDEN</span>`;
  }
  if (r.includes('warden')) {
    return `<span class="staff-role-badge role-warden" style="font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; background:rgba(234,179,8,0.18); color:#fbbf24; border:1px solid rgba(234,179,8,0.4);">WARDEN</span>`;
  }
  if (r.includes('assembly') || r.includes('safe_haven') || r.includes('point') || r.includes('centre') || r.includes('center')) {
    return `<span class="staff-role-badge role-haven" style="font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; background:rgba(16,185,129,0.18); color:#10b981; border:1px solid rgba(16,185,129,0.4);">ASSEMBLY POINT</span>`;
  }
  return `<span class="staff-role-badge role-member" style="font-size:10px; font-weight:600; padding:2px 6px; border-radius:4px; background:rgba(148,163,184,0.15); color:#94a3b8; border:1px solid rgba(148,163,184,0.3);">MISSION MEMBER</span>`;
}

function filterStaffList() {
  const query = ($('staffSearchInput')?.value || '').toLowerCase().trim();
  const zone = $('staffZoneFilter')?.value || 'ALL';
  const showIntl = $('staffFilterInternational') ? $('staffFilterInternational').checked : true;
  const showNatl = $('staffFilterNational') ? $('staffFilterNational').checked : true;
  const showHaven = $('staffFilterSafeHaven') ? $('staffFilterSafeHaven').checked : true;

  state.staffFilteredLocations = (state.staffLocations || []).filter(item => {
    const isSafeHaven = item.category === 'safe_haven';
    const isNational = item.staffType === 'national' || (item.nationality && item.nationality.toLowerCase().includes('kosovo'));
    const isInternational = !isSafeHaven && !isNational;

    if (isSafeHaven && !showHaven) return false;
    if (isInternational && !showIntl) return false;
    if (isNational && !showNatl) return false;

    if (zone !== 'ALL' && item.zone !== zone) return false;
    if (query) {
      const match = (item.callsign || '').toLowerCase().includes(query) ||
                    (item.name || '').toLowerCase().includes(query) ||
                    (item.role || '').toLowerCase().includes(query) ||
                    (item.nationality || '').toLowerCase().includes(query) ||
                    (item.zone || '').toLowerCase().includes(query) ||
                    (item.address || '').toLowerCase().includes(query) ||
                    (item.phone || '').toLowerCase().includes(query);
      if (!match) return false;
    }
    return true;
  });

  const totalSouls = (state.staffFilteredLocations || [])
    .filter(l => l.category !== 'safe_haven')
    .reduce((sum, item) => sum + (item.totalSouls || 1), 0);
  const staffCount = (state.staffFilteredLocations || [])
    .filter(l => l.category !== 'safe_haven').length;
  const metaEl = $('staffMeta');
  if (metaEl) {
    metaEl.textContent = `WARD No. 10 · RC MITROVICA · ${staffCount} PERSONNEL · ${totalSouls} SOULS`;
  }

  renderStaffList();
  if (typeof renderStaffMapMarkers === 'function') {
    renderStaffMapMarkers(state.staffFilteredLocations);
  }
}

function renderStaffList() {
  const listEl = $('staffList');
  if (!listEl) return;

  if (state.staffFilteredLocations.length === 0) {
    listEl.innerHTML = '<div class="empty-state">No personnel or safe havens found matching criteria.</div>';
    return;
  }

  listEl.innerHTML = state.staffFilteredLocations.map(staff => {
    const isSafeHaven = staff.category === 'safe_haven';
    const prioClass = (staff.evacuationPriority || 'medium').toLowerCase();
    const prioLabel = staff.evacuationPriority || 'MEDIUM';
    const radioCh = staff.radioChannel ? `<span class="staff-radio-tag" style="font-size:10px; font-weight:700; color:var(--cyan); background:rgba(56,189,248,0.12); padding:2px 6px; border-radius:4px; border:1px solid rgba(56,189,248,0.25);">📻 ${escHtml(staff.radioChannel)}</span>` : '';
    const natBadge = staff.nationality ? `<span class="staff-nat-tag" style="font-size:11px; color:#cbd5e1; background:rgba(255,255,255,0.06); padding:2px 7px; border-radius:4px;">${getNationalityFlag(staff.nationality)}</span>` : '';
    const roleBadge = getRoleBadge(staff.role);
    // OPSEC requirement: Remove (1 Souls) / (X Souls) and leave only Dependants
    const dependantsText = staff.dependants && staff.dependants !== 'None' && staff.dependants !== 'Safe Haven'
      ? `<div class="staff-card-row staff-dependants-row" style="font-size:11.5px; color:#fbbf24; background:rgba(234,179,8,0.08); padding:5px 8px; border-radius:5px; margin:5px 0; border:1px solid rgba(234,179,8,0.22);">
          <span class="staff-row-icon">👨‍👩‍👧</span> <strong>Dependants:</strong> ${escHtml(staff.dependants)}
        </div>`
      : '';
    const gridRefRow = staff.gridRef
      ? `<div class="staff-card-row staff-grid-row" style="font-size:11px; color:#38bdf8; font-family:var(--font-mono); margin:3px 0;">
          <span class="staff-row-icon">🌐</span> <strong>GR:</strong> ${escHtml(staff.gridRef)}
        </div>`
      : '';
    // OPSEC requirement: Hide user email addresses to preserve identity; display only for facility safe havens
    const emailLink = (isSafeHaven && staff.email)
      ? `<a class="staff-contact-link email" href="mailto:${staff.email}" style="color:#38bdf8;"><span class="staff-row-icon">✉️</span> ${escHtml(staff.email)}</a>`
      : '';
    const secondaryPhoneLink = staff.secondaryPhone
      ? `<a class="staff-contact-link" href="tel:${staff.secondaryPhone}"><span class="staff-row-icon">📞</span> ${escHtml(staff.secondaryPhone)}</a>`
      : '';

    // OPSEC requirement: Only Safe Havens display facility name; mission members identify strictly by Call Sign
    const nameLine = isSafeHaven
      ? `<div class="staff-card-name" style="font-size:13px; font-weight:700; color:var(--text-primary); margin-top:2px;">${escHtml(staff.name || '')}</div>`
      : '';

    return `
      <div class="staff-card ${isSafeHaven ? 'staff-card-safehaven' : ''}" id="staffCard-${staff.id}">
        <div class="staff-card-header">
          <div class="staff-card-title-wrap">
            <span class="staff-category-icon">${isSafeHaven ? '🛡️' : (staff.role === 'Warden' ? '⭐' : (staff.role === 'Deputy Warden' ? '🎖️' : '🏠'))}</span>
            <div>
              <div class="staff-card-callsign" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                <span>${escHtml(staff.callsign)}</span>
                ${radioCh}
                ${roleBadge}
              </div>
              ${nameLine}
            </div>
          </div>
          <div class="staff-card-badges">
            <span class="staff-prio-badge prio-${prioClass}">${prioLabel}</span>
            <span class="staff-zone-badge">${escHtml(staff.zone || 'Kosovo')}</span>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:6px; margin:5px 0;">
          ${natBadge}
        </div>

        ${staff.address ? `<div class="staff-card-row"><span class="staff-row-icon">📍</span> <span class="staff-row-text">${escHtml(staff.address)}</span></div>` : ''}
        ${gridRefRow}
        ${dependantsText}

        <div class="staff-card-row staff-contact-row" style="flex-wrap:wrap; gap:6px; margin-top:6px;">
          ${staff.phone ? `<a class="staff-contact-link" href="tel:${staff.phone}"><span class="staff-row-icon">📞</span> ${escHtml(staff.phone)}</a>` : ''}
          ${secondaryPhoneLink}
          ${staff.phone ? `<a class="staff-contact-link whatsapp" href="https://wa.me/${staff.phone.replace(/[^0-9]/g, '')}" target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>` : ''}
          ${emailLink}
        </div>

        ${staff.notes ? `<div class="staff-card-notes"><span class="staff-notes-label">TACTICAL NOTE:</span> ${escHtml(staff.notes)}</div>` : ''}

        <div class="staff-card-actions">
          <button class="btn-staff-action map-focus" onclick="focusStaffLocation('${staff.id}')" title="Center map on location">
            📍 Focus Map
          </button>
          <button class="btn-staff-action route-btn" onclick="routeToStaff(${staff.lat}, ${staff.lon}, '${(staff.callsign || '').replace(/'/g, "\\'")}', '${(staff.zone || '').replace(/'/g, "\\'")}')">
            🛣️ Route Here
          </button>
          <button class="btn-staff-action edit-btn" onclick="openAddStaffModal('${staff.id}')" title="Edit entry">
            ✏️
          </button>
          <button class="btn-staff-action delete-btn" onclick="deleteStaffEntry('${staff.id}')" title="Remove entry">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderStaffMapMarkers(data) {
  if (!state.map) return;
  clearMarkerList(moduleLayers.staff.markers);

  const locations = Array.isArray(data) ? data : state.staffLocations;
  if (!locations || locations.length === 0) return;

  locations.forEach(staff => {
    if (typeof staff.lat !== 'number' || typeof staff.lon !== 'number') return;

    const isSafeHaven = staff.category === 'safe_haven';
    const prio = (staff.evacuationPriority || 'MEDIUM').toUpperCase();

    const el = document.createElement('div');
    el.className = `staff-marker-pin ${isSafeHaven ? 'pin-safe-haven' : `pin-prio-${prio.toLowerCase()}`}`;
    el.innerHTML = `
      <div class="staff-marker-icon">${isSafeHaven ? '🛡️' : (staff.role === 'Warden' ? '⭐' : (staff.role === 'Deputy Warden' ? '🎖️' : '🏠'))}</div>
      <div class="staff-marker-label">${escHtml(staff.callsign)}</div>
    `;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openStaffMapPopup(staff);
    });

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([staff.lon, staff.lat])
      .addTo(state.map);

    moduleLayers.staff.markers.push(marker);
  });
}

function openStaffMapPopup(staff) {
  if (!state.map) return;
  closeMapPopup();

  const isSafeHaven = staff.category === 'safe_haven';
  const prio = staff.evacuationPriority || 'MEDIUM';
  const roleBadge = staff.role ? `<span style="font-size:10px; font-weight:700; color:var(--cyan); background:rgba(56,189,248,0.15); padding:2px 6px; border-radius:4px;">${escHtml(staff.role.toUpperCase())}</span>` : '';
  const radioBadge = staff.radioChannel ? `<span style="font-size:10px; font-weight:700; color:#fbbf24; background:rgba(234,179,8,0.15); padding:2px 6px; border-radius:4px;">📻 ${escHtml(staff.radioChannel)}</span>` : '';
  const natBadge = staff.nationality ? getNationalityFlag(staff.nationality) : '';

  const popupHtml = `
    <div class="staff-popup-card">
      <div class="staff-popup-header">
        <span class="staff-popup-icon">${isSafeHaven ? '🛡️' : (staff.role === 'Warden' ? '⭐' : (staff.role === 'Deputy Warden' ? '🎖️' : '🏠'))}</span>
        <div>
          <div class="staff-popup-title" style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span>${escHtml(staff.callsign)}</span>
            ${radioBadge}
            ${roleBadge}
          </div>
          ${isSafeHaven && staff.name ? `<div class="staff-popup-sub" style="font-weight:700; color:var(--text-primary); margin-top:2px;">${escHtml(staff.name)} ${natBadge ? `· ${natBadge}` : ''}</div>` : (natBadge ? `<div class="staff-popup-sub" style="margin-top:2px;">${natBadge}</div>` : '')}
        </div>
      </div>
      <div class="staff-popup-body">
        <div class="staff-popup-meta-row">
          <span class="staff-popup-meta-tag prio-${prio.toLowerCase()}">${prio} PRIORITY</span>
          <span class="staff-popup-meta-tag zone">${escHtml(staff.zone || 'Kosovo')}</span>
        </div>
        ${staff.dependants && staff.dependants !== 'None' && staff.dependants !== 'Safe Haven' ? `<div class="staff-popup-info" style="color:#fbbf24;"><span class="info-label">Dependants:</span> ${escHtml(staff.dependants)}</div>` : ''}
        ${staff.address ? `<div class="staff-popup-info"><span class="info-label">Address:</span> ${escHtml(staff.address)}</div>` : ''}
        ${staff.gridRef ? `<div class="staff-popup-info" style="font-family:var(--font-mono); color:#38bdf8;"><span class="info-label">GR:</span> ${escHtml(staff.gridRef)}</div>` : ''}
        ${staff.phone ? `<div class="staff-popup-info"><span class="info-label">Emergency:</span> <a href="tel:${staff.phone}">${escHtml(staff.phone)}</a></div>` : ''}
        ${staff.secondaryPhone ? `<div class="staff-popup-info"><span class="info-label">Secondary:</span> <a href="tel:${staff.secondaryPhone}">${escHtml(staff.secondaryPhone)}</a></div>` : ''}
        ${isSafeHaven && staff.email ? `<div class="staff-popup-info"><span class="info-label">Email:</span> <a href="mailto:${staff.email}">${escHtml(staff.email)}</a></div>` : ''}
        ${staff.notes ? `<div class="staff-popup-notes"><strong>Tactical Notes:</strong> ${escHtml(staff.notes)}</div>` : ''}
        <div class="staff-popup-actions">
          <button class="btn-popup-route" onclick="routeToStaff(${staff.lat}, ${staff.lon}, '${(staff.callsign || '').replace(/'/g, "\\'")}', '${(staff.zone || '').replace(/'/g, "\\'")}')">
            🛣️ Route to Location
          </button>
        </div>
      </div>
    </div>
  `;

  state.activeMapPopup = new maplibregl.Popup({
    closeButton: true,
    closeOnClick: false,
    className: 'staff-map-popup',
    offset: 20
  })
    .setLngLat([staff.lon, staff.lat])
    .setHTML(popupHtml)
    .addTo(state.map);
}

function focusStaffLocation(id) {
  const staff = (state.staffLocations || []).find(s => s.id === id);
  if (!staff || !state.map) return;

  state.map.flyTo({
    center: [staff.lon, staff.lat],
    zoom: 15,
    essential: true
  });

  openStaffMapPopup(staff);

  const card = $(`staffCard-${id}`);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('card-highlight');
    setTimeout(() => card.classList.remove('card-highlight'), 2000);
  }
}

function routeToStaff(destLat, destLon, destName, destZone = '') {
  toggleModule('routePanel');
  const endInput = $('routeEndInput');
  if (endInput) {
    const latStr = typeof destLat === 'number' ? destLat.toFixed(6) : destLat;
    const lonStr = typeof destLon === 'number' ? destLon.toFixed(6) : destLon;
    endInput.value = `${latStr}, ${lonStr}`;
  }
  const startInput = $('routeStartInput');
  if (startInput) {
    const dLat = Number(destLat) || 0;
    const dLon = Number(destLon) || 0;
    const zoneStr = String(destZone || '').toLowerCase();

    // Specific user requirement:
    // Mitrovica North Safe Haven grid: 42.89889288749447, 20.86221307613816
    // Regional Centre Mitrovica: 42.890127875103566, 20.876166511526243
    const NORTH_GRID = '42.898893, 20.862213';
    const SOUTH_LABEL = 'Regional Centre Mitrovica';
    const SOUTH_GRID = '42.890128, 20.876167';

    const isNorth = zoneStr.includes('north') || (dLat >= 42.892 && !zoneStr.includes('prishtin'));
    const isSouth = zoneStr.includes('south') || (dLat < 42.892 && !zoneStr.includes('prishtin'));

    // Check if destination is Safe Haven North itself
    const isDestNorthSafeHaven = Math.abs(dLat - 42.898893) < 0.001 && Math.abs(dLon - 20.862213) < 0.001;
    // Check if destination is Regional Centre Mitrovica itself
    const isDestSouthGrid = Math.abs(dLat - 42.890128) < 0.001 && Math.abs(dLon - 20.876167) < 0.001;

    if (isDestNorthSafeHaven) {
      startInput.value = SOUTH_LABEL;
    } else if (isDestSouthGrid) {
      startInput.value = NORTH_GRID;
    } else if (isNorth) {
      startInput.value = NORTH_GRID;
    } else if (isSouth) {
      startInput.value = SOUTH_LABEL;
    } else {
      startInput.value = NORTH_GRID;
    }
  }
  setTimeout(() => {
    calculateRoute();
  }, 150);
}

function openAddStaffModal(existingId = null) {
  const modal = $('staffAddModal');
  if (!modal) return;

  const form = $('staffAddForm');
  if (form) form.reset();

  const titleEl = $('staffAddModalTitle');
  const idInput = $('staffEntryId');

  if (existingId) {
    const item = (state.staffLocations || []).find(l => l.id === existingId);
    if (item) {
      if (titleEl) titleEl.textContent = `EDIT LOCATION: ${item.callsign}`;
      if (idInput) idInput.value = item.id;
      if ($('staffCallsign')) $('staffCallsign').value = item.callsign || '';
      if ($('staffName')) $('staffName').value = item.name || '';
      if ($('staffRole')) $('staffRole').value = item.role || '';
      if ($('staffNationality')) $('staffNationality').value = item.nationality || '';
      if ($('staffRadioChannel')) $('staffRadioChannel').value = item.radioChannel || '';
      if ($('staffCategory')) $('staffCategory').value = item.category || 'residence';
      if ($('staffZone')) $('staffZone').value = item.zone || '';
      if ($('staffLat')) $('staffLat').value = item.lat || '';
      if ($('staffLon')) $('staffLon').value = item.lon || '';
      if ($('staffGridRef')) $('staffGridRef').value = item.gridRef || '';
      if ($('staffPhone')) $('staffPhone').value = item.phone || '';
      if ($('staffEmail')) $('staffEmail').value = item.email || '';
      if ($('staffDependants')) $('staffDependants').value = item.dependants || '';
      if ($('staffPriority')) $('staffPriority').value = item.evacuationPriority || 'HIGH';
      if ($('staffAddress')) $('staffAddress').value = item.address || '';
      if ($('staffNotes')) $('staffNotes').value = item.notes || '';
    }
  } else {
    if (titleEl) titleEl.textContent = 'ADD STAFF LOCATION / SAFE HAVEN';
    if (idInput) idInput.value = '';
    if ($('staffRadioChannel')) $('staffRadioChannel').value = 'CH-04';
    if ($('staffRole')) $('staffRole').value = 'Mission Member';
    if (state.map) {
      const center = state.map.getCenter();
      if ($('staffLat')) $('staffLat').value = center.lat.toFixed(5);
      if ($('staffLon')) $('staffLon').value = center.lng.toFixed(5);
    }
  }

  modal.style.display = 'flex';
}

function closeAddStaffModal() {
  const modal = $('staffAddModal');
  if (modal) modal.style.display = 'none';
}

async function submitAddStaff(e) {
  if (e) e.preventDefault();
  if (!state.staffToken) return;

  const id = $('staffEntryId')?.value;
  const payload = {
    callsign: $('staffCallsign')?.value?.trim(),
    name: $('staffName')?.value?.trim(),
    role: $('staffRole')?.value?.trim() || 'Mission Member',
    nationality: $('staffNationality')?.value?.trim() || 'International',
    radioChannel: $('staffRadioChannel')?.value?.trim() || 'CH-04',
    category: $('staffCategory')?.value,
    zone: $('staffZone')?.value?.trim(),
    lat: parseFloat($('staffLat')?.value),
    lon: parseFloat($('staffLon')?.value),
    gridRef: $('staffGridRef')?.value?.trim() || '',
    phone: $('staffPhone')?.value?.trim(),
    email: $('staffEmail')?.value?.trim() || '',
    dependants: $('staffDependants')?.value?.trim() || 'None',
    evacuationPriority: $('staffPriority')?.value,
    address: $('staffAddress')?.value?.trim(),
    notes: $('staffNotes')?.value?.trim()
  };

  try {
    const url = '/api/staff/locations';
    const method = 'POST';
    if (id) {
      payload.id = id;
    }

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.staffToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to save location');
    }

    closeAddStaffModal();
    await fetchStaffLocations();
  } catch (err) {
    alert('Error saving staff location: ' + err.message);
  }
}

async function deleteStaffEntry(id) {
  if (!state.staffToken) return;
  const staff = (state.staffLocations || []).find(s => s.id === id);
  const name = staff ? staff.callsign : 'this entry';
  if (!confirm(`Are you sure you want to delete ${name} from the active warden roster?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/staff/locations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${state.staffToken}`
      }
    });

    if (!res.ok) {
      throw new Error('Failed to delete');
    }

    await fetchStaffLocations();
  } catch (err) {
    alert('Error deleting location: ' + err.message);
  }
}

window.openStaffLoginModal = openStaffLoginModal;
window.closeStaffLoginModal = closeStaffLoginModal;
window.submitStaffLogin = submitStaffLogin;
window.logoutStaff = logoutStaff;
window.fetchStaffLocations = fetchStaffLocations;
window.filterStaffList = filterStaffList;
window.renderStaffList = renderStaffList;
window.renderStaffMapMarkers = renderStaffMapMarkers;
window.focusStaffLocation = focusStaffLocation;
window.routeToStaff = routeToStaff;
window.openAddStaffModal = openAddStaffModal;
window.closeAddStaffModal = closeAddStaffModal;
window.submitAddStaff = submitAddStaff;
window.deleteStaffEntry = deleteStaffEntry;

// Update UI on load
updateStaffLockUI();

window.toggleTacticalLayer = toggleTacticalLayer;
window.toggleTacticalLayersMenu = toggleTacticalLayersMenu;

window.calculateRoute = calculateRoute;
window.clearRoute = clearRoute;
window.addRouteDestinationInput = addRouteDestinationInput;
window.deduplicateNewsItems = deduplicateNewsItems;
window.resolveLocationCoordinates = resolveLocationCoordinates;
window.state = state;

// ─── Minefields & Explosive Hazards Controller ────────────────────────────────
function renderMinefieldsList(categoryFilter = 'ALL', search = '') {
  const container = $('minefieldsList');
  if (!container) return;

  const query = (search || '').trim().toLowerCase();
  const cat = (categoryFilter || 'ALL').toUpperCase();

  const filtered = MINEFIELDS_KOSOVO_GEOJSON.features.filter(feat => {
    const p = feat.properties;
    if (cat === 'CHA' && !p.status.includes('CONFIRMED')) return false;
    if (cat === 'SHA' && !p.status.includes('SUSPECTED')) return false;
    if (cat === 'CBU' && p.category !== 'cluster_strike' && !p.status.includes('CLUSTER')) return false;
    if (cat === 'CRITICAL' && p.riskLevel !== 'CRITICAL') return false;

    if (query) {
      const matchText = `${p.name} ${p.sector} ${p.municipality} ${p.munitionTypes} ${p.description}`.toLowerCase();
      if (!matchText.includes(query)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 24px 12px; color:#94a3b8; font-size:12px;">
        No minefields or hazardous areas found matching the filter criteria.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(feat => {
    const p = feat.properties;
    const riskClass = (p.riskLevel || 'medium').toLowerCase();
    return `
      <div class="mine-card" onclick="focusMinefield('${p.id}')">
        <div class="mine-card-header">
          <div class="mine-card-title">💣 ${p.name}</div>
          <span class="mine-risk-badge risk-${riskClass}">${p.riskLevel || 'HIGH'}</span>
        </div>
        <div class="mine-card-sub">📍 ${p.sector} · <strong>${p.municipality}</strong></div>
        <div class="mine-card-details">
          <div><span>Status:</span> <strong>${p.status}</strong></div>
          <div><span>Munitions:</span> <strong style="color:#fca5a5;">${p.munitionTypes}</strong></div>
          <div><span>Standoff Buffer:</span> <strong style="color:#f87171;">${p.standoffDistanceMeters}m</strong> · <span>Est. Area:</span> ${p.estimatedAreaHa} Ha</div>
          <div><span>Demining Lead:</span> ${p.deminingAgency}</div>
        </div>
        <div class="mine-card-actions">
          <button class="btn-xs btn-outline" onclick="event.stopPropagation(); focusMinefield('${p.id}')">
            🎯 Target on Map
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function filterMinefieldsList() {
  const cat = $('mineCategoryFilter')?.value || 'ALL';
  const query = $('mineSearchInput')?.value || '';
  renderMinefieldsList(cat, query);
}

function focusMinefield(id) {
  const feat = MINEFIELDS_KOSOVO_GEOJSON.features.find(f => f.properties.id === id);
  if (!feat || !state.map) return;
  const p = feat.properties;
  const coords = [p.lon, p.lat];

  state.map.flyTo({
    center: coords,
    zoom: 12.5,
    pitch: 35,
    duration: 1500
  });

  setTimeout(() => {
    openMapPopup(coords, buildMinefieldPopupHtml(p));
  }, 1600);
}

async function checkMineProximityCurrentMap() {
  if (!state.map) return;
  const center = state.map.getCenter();
  const statusBox = $('mineProximityStatusBox');
  const textEl = $('mineProximityText');
  if (!statusBox || !textEl) return;

  textEl.textContent = 'Calculating standoff distance to known hazards...';
  statusBox.className = 'proximity-status-box';

  try {
    const res = await fetch(`/api/minefields/proximity?lat=${center.lat}&lon=${center.lng}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const nearest = data.nearestHazard;

    if (data.dangerStatus === 'CRITICAL_DANGER_INSIDE_STANDOFF') {
      statusBox.className = 'proximity-status-box critical';
      textEl.innerHTML = `<strong>CRITICAL HAZARD:</strong> Inside ${nearest.standoffDistanceMeters}m perimeter of <strong>${nearest.name}</strong>!`;
    } else if (data.dangerStatus === 'WARNING_PROXIMATE_HAZARD') {
      statusBox.className = 'proximity-status-box warning';
      textEl.innerHTML = `<strong>WARNING:</strong> Active hazard within <strong>${nearest.distanceKm} km</strong> (${nearest.name}). Keep to verified asphalt routes.`;
    } else {
      statusBox.className = 'proximity-status-box';
      textEl.innerHTML = `<strong>Safe Distance:</strong> Nearest hazard is <strong>${nearest.distanceKm} km</strong> away (${nearest.name}).`;
    }
  } catch (err) {
    textEl.textContent = 'Could not verify proximity. Please ensure server connection is active.';
  }
}

window.renderMinefieldsList = renderMinefieldsList;
window.filterMinefieldsList = filterMinefieldsList;
window.focusMinefield = focusMinefield;
window.checkMineProximityCurrentMap = checkMineProximityCurrentMap;