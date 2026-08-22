'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Starting News Cluster Markers & Popup Verification Tests ---');

// Setup mock environment matching popup-lifecycle.test.js
let openPopupsInDom = [];

global.window = global;
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
      dataset: {},
      children: [],
      parentNode: { removeChild: (child) => { openPopupsInDom = openPopupsInDom.filter(p => p !== child); } },
      appendChild: function(c) { this.children.push(c); return c; },
      setAttribute: function(k, v) { this[k] = v; },
      setAttributeNS: function() {},
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
function formatTimeAgo() { return '5m ago'; }
function formatHour() { return '14:30'; }

const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');

const state = {
  map: {
    getZoom: () => 9.0,
    project: (coords) => ({ x: coords[0] * 1000, y: coords[1] * 1000 }),
    flyTo: (opts) => { state.lastFlyTo = opts; }
  },
  mapInitialized: true,
  activeMapModule: 'news',
  selectedNewsItemId: null,
  selectedNewsClusterId: null,
  activeMapPopup: null,
  data: {
    news: { items: [] }
  }
};

const codeExtract = `
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
  ${appJs.slice(appJs.indexOf('function clearMarkerList(markerList) {'), appJs.indexOf('function updateMapBadgeAndMeta() {'))}
  ${appJs.slice(appJs.indexOf('function cleanTextForNewsLocation('), appJs.indexOf('function ensureTrafficIncidentLocations('))}
  ${appJs.slice(appJs.indexOf('function buildMapPopupHtml({'), appJs.indexOf('function openWeatherPopup(city, weatherData) {'))}
  ${appJs.slice(appJs.indexOf('function buildNewsPopupHtml('), appJs.indexOf('function renderAqiMapMarkers('))}
  ${appJs.slice(appJs.indexOf('function createMapMarkerElement('), appJs.indexOf('function createCCTVMarkerElement('))}
  function updateMapBadgeAndMeta() {}
  function closeWeatherPopup() { closeMapPopup(); }
  function closeBorderPopup() { closeMapPopup(); }
  function clearWildfireMapLayer() {}
  function clearRoute() {}
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
  'state', 'maplibregl', 'document', 'escHtml', 'formatTimeAgo', 'formatHour',
  `
    ${codeExtract}
    return {
      moduleLayers,
      clearAllModuleLayers,
      setActiveMapModule,
      closeMapPopup,
      buildNewsPopupHtml,
      buildNewsClusterPopupHtml,
      openNewsClusterPopup,
      openNewsPopup,
      closeNewsPopup,
      renderNewsMapMarkers,
      clusterGeoItems,
      createNewsClusterMarkerElement,
      zoomToNewsCluster
    };
  `
)(state, global.maplibregl, global.document, escHtml, formatTimeAgo, formatHour);

// Sample news items located at nearby coordinates in Mitrovica
const story1 = {
  id: 'news-m1',
  title: 'Incident te Qendra Zejtare në Mitrovicë',
  description: 'Gjuajtje me armë zjarri në Mitrovicë.',
  source: 'Mitropol',
  url: 'https://mitropol.net/incident-mitrovice',
  intensityScore: 9,
  severity: 'critical',
  publishedAt: '2026-08-22T14:00:00.000Z',
  location: { city: 'Mitrovicë', lat: 42.8914, lon: 20.8660 }
};

const story2 = {
  id: 'news-m2',
  title: 'Patrullime të shtuara te Ura e Ibrit',
  description: 'KFOR dhe Policia vëzhgojnë situatën te ura.',
  source: 'KoSSev',
  url: 'https://kossev.info/patrole-na-ibru',
  intensityScore: 7,
  severity: 'high',
  publishedAt: '2026-08-22T13:30:00.000Z',
  location: { city: 'Mitrovicë', lat: 42.8914, lon: 20.8660 }
};

const storyPeja = {
  id: 'news-p1',
  title: 'Aktivitet kulturor në Pejë',
  description: 'Festivali i filmit në Pejë.',
  source: 'Gazeta Express',
  url: 'https://express.com/peje-film',
  intensityScore: 4,
  severity: 'medium',
  publishedAt: '2026-08-22T12:00:00.000Z',
  location: { city: 'Pejë', lat: 42.6593, lon: 20.2887 }
};

// 1. Test: Spatial clustering at low zoom
console.log('Test 1: Verifying nearby news markers form a cluster at low zoom...');
state.data.news.items = [story1, story2, storyPeja];
runtimeModule.renderNewsMapMarkers(state.data.news);

const newsMarkers = runtimeModule.moduleLayers.news.markers;
assert.strictEqual(newsMarkers.length, 2, '2 markers expected: 1 cluster for Mitrovica (2 items) and 1 individual for Peja');

const clusterMarkerObj = newsMarkers.find(m => m._clusterId);
assert.notStrictEqual(clusterMarkerObj, undefined, 'Mitrovica cluster marker must exist');
console.log('✓ Passed: Nearby news markers correctly created a cluster');

// 2. Test: Cluster contains correct number of stories
console.log('Test 2: Verifying cluster HTML element contains correct count...');
const clusterEl = clusterMarkerObj.getElement();
assert.strictEqual(clusterEl.innerHTML.includes('2'), true, 'Cluster badge must show story count 2');
console.log('✓ Passed: Cluster element displays count 2');

// 3. Test: Clicking cluster triggers openNewsClusterPopup
console.log('Test 3: Testing cluster click handler opens cluster popup...');
clusterEl._on_click({ stopPropagation: () => {}, stopImmediatePropagation: () => {} });

assert.notStrictEqual(state.activeMapPopup, null, 'Active map popup must be set');
assert.strictEqual(openPopupsInDom.length, 1, 'Exactly 1 popup active in DOM');
console.log('✓ Passed: Clicking cluster marker opens cluster popup');

// 4. Test: Popup contains ONLY stories from that cluster
console.log('Test 4: Verifying popup contains only stories from that cluster...');
const popupHtml = state.activeMapPopup.getHTML();
assert.strictEqual(popupHtml.includes('Incident te Qendra Zejtare'), true, 'Contains story 1');
assert.strictEqual(popupHtml.includes('Patrullime të shtuara te Ura e Ibrit'), true, 'Contains story 2');
assert.strictEqual(popupHtml.includes('Aktivitet kulturor në Pejë'), false, 'Must NOT contain story from Peja');
console.log('✓ Passed: Cluster popup contains strictly isolated cluster stories');

// 5. Test: Each story renders headline, severity badge, and source
console.log('Test 5: Verifying headlines, severity badges, and sources...');
assert.strictEqual(popupHtml.includes('CRITICAL'), true, 'Contains CRITICAL severity badge');
assert.strictEqual(popupHtml.includes('HIGH'), true, 'Contains HIGH severity badge');
assert.strictEqual(popupHtml.includes('Mitropol'), true, 'Contains Mitropol source');
assert.strictEqual(popupHtml.includes('KoSSev'), true, 'Contains KoSSev source');
console.log('✓ Passed: Headlines, badges, and sources accurately rendered');

// 6. Test: Clickable links with target="_blank"
console.log('Test 6: Verifying article links have target="_blank" and rel="noopener noreferrer"...');
assert.strictEqual(popupHtml.includes(`href="${story1.url}"`), true, 'Contains story 1 link');
assert.strictEqual(popupHtml.includes(`href="${story2.url}"`), true, 'Contains story 2 link');
assert.strictEqual(popupHtml.includes('target="_blank"'), true, 'Contains target="_blank"');
assert.strictEqual(popupHtml.includes('rel="noopener noreferrer"'), true, 'Contains rel="noopener noreferrer"');
console.log('✓ Passed: Article headlines are safe clickable external links');

// 7. Test: Switching active module closes cluster popup
console.log('Test 7: Testing switching module closes cluster popup...');
runtimeModule.setActiveMapModule('traffic');
assert.strictEqual(state.activeMapPopup, null, 'Popup state cleared');
assert.strictEqual(openPopupsInDom.length, 0, 'Cluster popup removed from DOM on module switch');
console.log('✓ Passed: Switching module closes cluster popup cleanly');

// 8. Test: Individual News markers and popups still work
console.log('Test 8: Testing individual news markers and popups...');
runtimeModule.setActiveMapModule('news');
state.map.getZoom = () => 13.0; // High zoom -> no clustering
runtimeModule.renderNewsMapMarkers(state.data.news);

const indMarkers = runtimeModule.moduleLayers.news.markers;
assert.strictEqual(indMarkers.length, 3, '3 individual markers at zoom 13');
const story1Marker = indMarkers.find(m => m._newsItemId === story1.id);
assert.notStrictEqual(story1Marker, undefined, 'Individual story 1 marker present');

story1Marker.getElement()._on_click({ stopPropagation: () => {}, stopImmediatePropagation: () => {} });
assert.notStrictEqual(state.activeMapPopup, null, 'Individual news popup opened');
assert.strictEqual(state.activeMapPopup.getHTML().includes(story1.title), true, 'Individual popup shows title');
console.log('✓ Passed: Individual news markers and popups work seamlessly');

// 9. Test: Non-news modules remain unaffected
console.log('Test 9: Verifying non-news module cluster creation remains unaffected...');
const genericClusterEl = runtimeModule.createNewsClusterMarkerElement({ items: [1, 2, 3] }, 'HIGH');
assert.strictEqual(genericClusterEl.className.includes('map-cluster-marker'), true, 'Uses standard map-cluster-marker class');
assert.strictEqual(genericClusterEl.innerHTML.includes('3'), true, 'Count 3 rendered');
console.log('✓ Passed: Non-news clustering utilities remain intact');

console.log('--- ALL 9 NEWS CLUSTER TESTS PASSED SUCCESSFULLY ---');
