'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Starting KOSINT Popup Lifecycle & Standardization Tests ---');

const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');

// 1. Verify CSS rules for standardized map popup system
console.log('Test 1: Verifying standardized popup CSS rules and width constraints...');
assert.strictEqual(styleCss.includes('width: min(360px, calc(100vw - 32px)) !important;'), true, 'Standardized width rule present in style.css');
assert.strictEqual(styleCss.includes('overflow-wrap: anywhere;'), true, 'overflow-wrap anywhere present');
assert.strictEqual(styleCss.includes('.map-popup-grid'), true, '.map-popup-grid present');
assert.strictEqual(styleCss.includes('.map-popup-stat'), true, '.map-popup-stat present');
assert.strictEqual(styleCss.includes('.map-popup-stat-label'), true, '.map-popup-stat-label present');
assert.strictEqual(styleCss.includes('.map-popup-stat-val'), true, '.map-popup-stat-val present');
assert.strictEqual(styleCss.includes('.map-popup-header-top'), true, '.map-popup-header-top present');
assert.strictEqual(styleCss.includes('.map-popup-header-sub'), true, '.map-popup-header-sub present');
console.log('✓ Passed: CSS rules for standardized popup architecture verified');

// 2. Setup mock environment to test runtime popup lifecycle
let openPopupsInDom = [];

global.document = {
  createElement: (tag) => {
    let _rawClass = '';
    const classSet = new Set();
    const el = {
      tagName: tag.toUpperCase(),
      get className() { return _rawClass; },
      set className(v) {
        _rawClass = String(v || '');
        classSet.clear();
        _rawClass.split(/\s+/).filter(Boolean).forEach(c => classSet.add(c));
      },
      classList: {
        add: function(c) { classSet.add(c); _rawClass = Array.from(classSet).join(' '); },
        remove: function(c) { classSet.delete(c); _rawClass = Array.from(classSet).join(' '); },
        contains: function(c) { return classSet.has(c); }
      },
      style: {},
      children: [],
      parentNode: { removeChild: (child) => { openPopupsInDom = openPopupsInDom.filter(p => p !== child); } },
      appendChild: function(c) { this.children.push(c); return c; },
      setAttribute: function(k, v) { this[k] = v; },
      addEventListener: function(evt, fn) { this[`_on_${evt}`] = fn; }
    };
    return el;
  },
  getElementById: () => ({ style: {}, classList: { add: () => {}, remove: () => {}, contains: () => false }, querySelectorAll: () => [] }),
  querySelectorAll: (sel) => {
    if (sel.includes('.maplibregl-popup')) return [...openPopupsInDom];
    return [];
  }
};

global.maplibregl = {
  Popup: function(opts = {}) {
    let _html = '';
    let _onClose = null;
    const domEl = global.document.createElement('div');
    domEl.className = 'maplibregl-popup';

    this.setHTML = function(html) { _html = html; return this; };
    this.setLngLat = function(coords) { this._coords = coords; return this; };
    this.addTo = function(map) {
      openPopupsInDom.push(domEl);
      this._map = map;
      return this;
    };
    this.remove = function() {
      openPopupsInDom = openPopupsInDom.filter(p => p !== domEl);
      if (_onClose) _onClose();
      return this;
    };
    this.on = function(evt, fn) {
      if (evt === 'close') _onClose = fn;
      return this;
    };
    this.getHTML = function() { return _html; };
  },
  Marker: function(opts = {}) {
    this._element = opts.element;
    this._popup = null;
    this.setLngLat = function(coords) { this._coords = coords; return this; };
    this.setPopup = function(p) { this._popup = p; return this; };
    this.getPopup = function() { return this._popup; };
    this.addTo = function(map) { this._map = map; return this; };
    this.remove = function() {
      if (this._popup) this._popup.remove();
      return this;
    };
    this.getElement = function() { return this._element; };
  }
};

function escHtml(str) { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function formatTimeAgo() { return '2m ago'; }
function formatHour() { return '14:00'; }
function weatherIcon() { return '☀️'; }

const state = {
  map: {},
  mapInitialized: true,
  activeMapModule: null,
  activeModule: null,
  selectedWeatherCityId: null,
  selectedNewsItemId: null,
  selectedBorderCrossingId: null,
  weatherPopup: null,
  borderPopup: null,
  activeMapPopup: null,
  data: {
    weather: { current: { temp: 24, weatherCode: 0, description: 'Sunny', humidity: 40, windSpeed: 10 } },
    traffic: { incidents: [] },
    aviation: { aircraft: [] },
    wildfire: { fires: [] }
  }
};

// 3. Test: Weather popup -> switch to Traffic -> Weather popup closes
console.log('Test 3: Testing Weather popup closes on switching to Traffic...');

// Slice moduleLayers, closeMapPopup, clearAllModuleLayers, setActiveMapModule, openWeatherPopup, buildMapPopupHtml, buildWeatherPopupHtml
const codeExtract = `
  ${appJs.slice(appJs.indexOf('function clearMarkerList(markerList) {'), appJs.indexOf('function updateMapBadgeAndMeta() {'))}
  ${appJs.slice(appJs.indexOf('function buildMapPopupHtml({'), appJs.indexOf('function openWeatherPopup(city, weatherData) {'))}
  ${appJs.slice(appJs.indexOf('function openWeatherPopup(city, weatherData) {'), appJs.indexOf('function updateWeatherCityMarker(cityId, weatherData) {'))}
  function updateMapBadgeAndMeta() {}
  function closeNewsPopup() { closeMapPopup(); }
  function closeWeatherPopup() { closeMapPopup(); }
  function closeBorderPopup() { closeMapPopup(); }
  function clearWildfireMapLayer() {}
  function clearRoute() {}
  function renderNewsMapMarkers() {}
  function renderWeatherMapMarkers() {}
  function renderTrafficMapMarkers() {}
  function renderRadiationMapMarkers() {}
  function renderAqiMapMarkers() {}
  function renderEarthquakeMapMarkers() {}
  function renderWildfireMapLayer() {}
  function renderAviationMapMarkers() {}
  function renderBorderMapMarkers() {}
  function renderCCTVMapMarkers() {}
`;

const runtimeModule = new Function(
  'state', 'maplibregl', 'document', 'escHtml', 'formatTimeAgo', 'formatHour', 'weatherIcon',
  `
    ${codeExtract}
    return {
      moduleLayers,
      clearAllModuleLayers,
      setActiveMapModule,
      closeMapPopup,
      openWeatherPopup,
      buildMapPopupHtml,
      buildWeatherPopupHtml
    };
  `
)(state, global.maplibregl, global.document, escHtml, formatTimeAgo, formatHour, weatherIcon);

// Step 1: Open Weather Module & Open a city popup
runtimeModule.setActiveMapModule('weather');
assert.strictEqual(state.activeMapModule, 'weather');

runtimeModule.openWeatherPopup({ id: 'mitrovice', name: 'Mitrovicë', lat: 42.89, lon: 20.86 }, state.data.weather);
assert.strictEqual(state.selectedWeatherCityId, 'mitrovice');
assert.notStrictEqual(state.weatherPopup, null, 'Weather popup is active');
assert.strictEqual(openPopupsInDom.length, 1, '1 popup in DOM');
console.log('✓ Weather popup opened successfully');

// Step 2: Switch to Traffic module
runtimeModule.setActiveMapModule('traffic');
assert.strictEqual(state.activeMapModule, 'traffic');
assert.strictEqual(state.weatherPopup, null, 'Weather popup state cleared');
assert.strictEqual(state.selectedWeatherCityId, null, 'City selection cleared');
assert.strictEqual(openPopupsInDom.length, 0, 'Popup removed from map DOM on module switch');
console.log('✓ Passed: Switching from Weather to Traffic closes weather popup immediately');

// 4. Test: Wildfire popup -> switch to Aviation -> Wildfire popup closes
console.log('Test 4: Testing Wildfire popup closes on switching to Aviation...');
runtimeModule.setActiveMapModule('wildfire');
const wildfirePopupHtml = runtimeModule.buildMapPopupHtml({ icon: '🔥', title: 'Wildfire', source: 'NASA FIRMS' });
const p = new global.maplibregl.Popup().setHTML(wildfirePopupHtml).addTo(state.map);
state.activeMapPopup = p;
assert.strictEqual(openPopupsInDom.length, 1, 'Wildfire popup in DOM');

runtimeModule.setActiveMapModule('aviation');
assert.strictEqual(state.activeMapModule, 'aviation');
assert.strictEqual(state.activeMapPopup, null, 'Wildfire popup state cleared');
assert.strictEqual(openPopupsInDom.length, 0, 'Wildfire popup removed from map DOM on module switch');
console.log('✓ Passed: Switching from Wildfire to Aviation closes wildfire popup immediately');

// 5. Test: Closing active module closes open popup
console.log('Test 5: Testing closing active module closes open popup...');
runtimeModule.setActiveMapModule('weather');
runtimeModule.openWeatherPopup({ id: 'prishtine', name: 'Prishtinë', lat: 42.66, lon: 21.16 }, state.data.weather);
assert.strictEqual(openPopupsInDom.length, 1, 'Weather popup open');

// Close module panel -> calls setActiveMapModule(null)
runtimeModule.setActiveMapModule(null);
assert.strictEqual(state.activeMapModule, null);
assert.strictEqual(state.weatherPopup, null);
assert.strictEqual(openPopupsInDom.length, 0, 'Popup removed from map DOM on closing module');
console.log('✓ Passed: Closing active module closes map popup immediately');

// 6. Test: Standardized buildMapPopupHtml output across modules
console.log('Test 6: Testing standardized buildMapPopupHtml structure...');

const modulesToTest = [
  { name: 'Weather', icon: '🌤', title: 'Prishtinë', subtitle: 'Sunny', source: 'Open-Meteo', stats: [{ label: 'Humidity', val: '40%' }] },
  { name: 'News', icon: '📰', title: 'News Intelligence', source: 'Koha', contentHtml: '<a class="news-popup-headline-link">Headline</a>' },
  { name: 'Traffic', icon: '🚦', title: 'Road Closure', subtitle: 'Mitrovicë', source: 'Traffic Intel', stats: [{ label: 'Location', val: 'Mitrovicë' }] },
  { name: 'Radiation', icon: '☢️', title: 'Station 1', subtitle: 'EURDEP Sensor', source: 'EURDEP', primary: { val: '0.110 µSv/h' } },
  { name: 'AQI', icon: '🌍', title: 'Air Quality Index', subtitle: 'European AQI', source: 'Open-Meteo', primary: { val: 'EAQI 25' } },
  { name: 'Earthquake', icon: '🌊', title: 'Seismic Event', subtitle: 'Prizren', source: 'USGS', primary: { val: 'M3.2' } },
  { name: 'Wildfire', icon: '🔥', title: 'Wildfire Detection', subtitle: 'Thermal Anomaly', source: 'NASA FIRMS', primary: { val: '12.4 MW' } },
  { name: 'Aviation', icon: '✈️', title: 'WZZ123', subtitle: 'Commercial Flight', source: 'OpenSky', stats: [{ label: 'Altitude', val: '32,000 ft' }] }
];

modulesToTest.forEach(mod => {
  const html = runtimeModule.buildMapPopupHtml(mod);
  assert.strictEqual(html.includes('map-popup-container'), true, `${mod.name} contains map-popup-container`);
  assert.strictEqual(html.includes('map-popup-header'), true, `${mod.name} contains map-popup-header`);
  assert.strictEqual(html.includes('map-popup-title'), true, `${mod.name} contains map-popup-title`);
  assert.strictEqual(html.includes('map-popup-body'), true, `${mod.name} contains map-popup-body`);
  assert.strictEqual(html.includes(mod.icon), true, `${mod.name} contains icon ${mod.icon}`);
  if (mod.subtitle) {
    assert.strictEqual(html.includes('map-popup-subtitle'), true, `${mod.name} contains map-popup-subtitle`);
  }
  if (mod.stats && mod.stats.length > 0) {
    assert.strictEqual(html.includes('map-popup-grid'), true, `${mod.name} contains map-popup-grid`);
    assert.strictEqual(html.includes('map-popup-stat'), true, `${mod.name} contains map-popup-stat`);
  }
});
console.log('✓ Passed: All 8 intelligence modules generate standardized, structured popup HTML');

console.log('--- ALL POPUP LIFECYCLE & STANDARDIZATION TESTS PASSED ---');
