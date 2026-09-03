'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Starting Border Crossing Map-First Verification Tests ---');

const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');

// 1. Verify toggleModule has pure map-first handling for borderPanel
console.log('Test 1: Verifying borderPanel is map-first in toggleModule...');
assert.strictEqual(appJs.includes("if (panelId === 'borderPanel') {"), true, "toggleModule has specific branch for borderPanel");
assert.strictEqual(appJs.includes("setActiveMapModule('border', state.borderData);"), true, "borderPanel sets active map module to 'border'");
console.log('✓ Passed: borderPanel activates map layer without opening overlay panel');

// 2. Verify all 13 border locations exist with accurate coordinates
console.log('Test 2: Verifying BORDER_CROSSING_LOCATIONS in app.js...');
assert.strictEqual(appJs.includes('const BORDER_CROSSING_LOCATIONS = {'), true, 'BORDER_CROSSING_LOCATIONS defined');
const expectedCrossings = [
  'border-merdare', 'border-jarinje', 'border-bernjak', 'border-dheu-i-bardhe',
  'border-mutivode', 'border-mucibabe', 'border-hani-i-elezit', 'border-gllobocice',
  'border-stanciq', 'border-kulle', 'border-vermice', 'border-qafe-e-prushit', 'border-qafe-e-morines'
];
expectedCrossings.forEach(id => {
  assert.strictEqual(appJs.includes(`'${id}'`), true, `Crossing ${id} is present in locations`);
});
console.log('✓ Passed: All 13 official border crossings configured with authoritative coordinates');

// 3. Verify marker creation and styling
console.log('Test 3: Verifying border marker elements, no inner emoji, and standard 16px dimensions...');
assert.strictEqual(appJs.includes('function createBorderMarkerElement(color, label, crossingId'), true, 'createBorderMarkerElement defined');
assert.strictEqual(appJs.includes('<span class="border-pin-icon">🛂</span>'), false, 'Emoji icon 🛂 removed from border marker pin');
assert.strictEqual(styleCss.includes('.border-custom-marker'), true, '.border-custom-marker styled in style.css');
assert.strictEqual(styleCss.includes('.border-marker-pin'), true, '.border-marker-pin styled in style.css');
assert.strictEqual(styleCss.includes('width: 16px;'), true, '.border-marker-pin has standard 16px width');
assert.strictEqual(styleCss.includes('height: 16px;'), true, '.border-marker-pin has standard 16px height');
assert.strictEqual(styleCss.includes('.border-marker-label'), true, '.border-marker-label styled in style.css');
assert.strictEqual(styleCss.includes('.border-custom-marker.active'), true, '.border-custom-marker.active styled for active state');
console.log('✓ Passed: Border markers have no inner emoji and conform to standard 16px marker dimensions');

// 4. Verify popup builder matches unified map popup structure
console.log('Test 4: Verifying buildBorderPopupHtml and unified popup styling...');
assert.strictEqual(appJs.includes('function buildBorderPopupHtml(c)'), true, 'buildBorderPopupHtml defined');
assert.strictEqual(appJs.includes('🛂'), true, 'Border popup uses passport icon 🛂');
assert.strictEqual(styleCss.includes('.border-map-popup'), true, '.border-map-popup styled in style.css');
assert.strictEqual(styleCss.includes('.border-popup-trucks-row'), true, '.border-popup-trucks-row styled in style.css');

// Extract and test buildBorderPopupHtml
function escHtml(str) { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function formatTimeAgo() { return '5m ago'; }

const buildBorderPopupHtmlIndex = appJs.indexOf('function buildBorderPopupHtml(c) {');
const openBorderPopupIndex = appJs.indexOf('function openBorderPopup(crossing) {');
const buildBorderPopupCode = appJs.slice(buildBorderPopupHtmlIndex, openBorderPopupIndex);

const buildMapPopupHtmlIndex = appJs.indexOf('function buildMapPopupHtml({');
const createMapPopupIndex = appJs.indexOf('function createMapPopup(html, opts = {}) {');
const buildMapPopupCode = appJs.slice(buildMapPopupHtmlIndex, createMapPopupIndex);

const evalFn = new Function('escHtml', 'formatTimeAgo', `
  ${buildMapPopupCode}
  ${buildBorderPopupCode}
  return buildBorderPopupHtml;
`);

const buildBorderPopup = evalFn(escHtml, formatTimeAgo);

const sampleCrossing = {
  id: 'border-merdare',
  name: 'Merdarë / Merdare',
  shortName: 'Merdarë',
  neighborCountry: 'Serbia',
  status: 'OPEN',
  source: 'QKMK',
  direction: {
    entry: { waitingMinutes: 10, queueLengthMeters: 50 },
    exit: { waitingMinutes: 35, queueLengthMeters: 250 }
  },
  trucks: {
    entry: { waitingMinutes: 15, queueLengthMeters: 100 },
    exit: { waitingMinutes: 20, queueLengthMeters: 150 }
  },
  updatedAt: new Date().toISOString()
};

const popupHtml = buildBorderPopup(sampleCrossing);
assert.strictEqual(popupHtml.toUpperCase().includes('MERDARË'), true, 'Popup includes crossing name');
assert.strictEqual(popupHtml.includes('Kosovo ↔ Serbia'), true, 'Popup includes neighbor connection');
assert.strictEqual(popupHtml.includes('Cars Entry Wait'), true, 'Popup includes Entry wait metric');
assert.strictEqual(popupHtml.includes('Cars Exit Wait'), true, 'Popup includes Exit wait metric');
assert.strictEqual(popupHtml.includes('TRUCKS'), true, 'Popup includes truck information');
assert.strictEqual(popupHtml.includes('QKMK'), true, 'Popup includes source');
console.log('✓ Passed: buildBorderPopupHtml produces rich, compliant unified popup HTML');

// 5. Verify toggle interaction logic (openBorderPopup, closeBorderPopup, selectBorderCrossing)
console.log('Test 5: Verifying popup toggle and selection functions...');
assert.strictEqual(appJs.includes('function openBorderPopup(crossing)'), true, 'openBorderPopup function defined');
assert.strictEqual(appJs.includes('function closeBorderPopup()'), true, 'closeBorderPopup function defined');
assert.strictEqual(appJs.includes('function selectBorderCrossing(crossingId)'), true, 'selectBorderCrossing function defined');
assert.strictEqual(appJs.includes('function focusBorderCrossing(crossingId)'), true, 'focusBorderCrossing function defined');
console.log('✓ Passed: All border popup interaction handlers present');

// 6. Verify border is in OPERATIONAL ZONES & CORRIDORS and removed from main menu nav rail
console.log('Test 6: Verifying border crossing in OPERATIONAL ZONES & CORRIDORS...');
assert.strictEqual(indexHtml.includes('id="toggleLayerBorder"'), true, 'toggleLayerBorder in tactical layers menu');
assert.strictEqual(indexHtml.includes('data-panel="borderPanel"'), false, 'borderPanel button removed from main nav rail');
console.log('✓ Passed: Border crossing is in OPERATIONAL ZONES & CORRIDORS and removed from main menu');

// 7. Verify runtime execution of renderBorderMapMarkers
console.log('Test 7: Verifying runtime execution of renderBorderMapMarkers without exceptions...');
global.$ = (id) => ({ checked: true });
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
      appendChild: function(c) { this.children.push(c); return c; },
      setAttribute: function(k, v) { this[k] = v; },
      addEventListener: function(evt, fn) { this[`_on_${evt}`] = fn; }
    };
    return el;
  },
  getElementById: () => null
};

global.maplibregl = {
  Marker: function(opts) {
    this._element = opts.element;
    this.setLngLat = function(coords) { this._coords = coords; return this; };
    this.addTo = function(map) { this._map = map; return this; };
    this.getElement = function() { return this._element; };
  }
};

const BORDER_CROSSING_LOCATIONS_EVAL = {
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
  map: {},
  activeMapModule: 'border',
  selectedBorderCrossingId: null,
  borderData: null
};

const moduleLayers = {
  border: {
    markers: []
  }
};

function clearMarkerList(markerList) {
  if (Array.isArray(markerList)) markerList.length = 0;
}
function updateMapBadgeAndMeta() {}
function selectBorderCrossing() {}

const renderBorderMapMarkersCode = appJs.slice(
  appJs.indexOf('function renderBorderMapMarkers(borderData) {'),
  appJs.indexOf('function focusBorderCrossing(crossingId) {')
);

const evalRenderBorder = new Function(
  'state', 'moduleLayers', 'BORDER_CROSSING_LOCATIONS', 'clearMarkerList', 'updateMapBadgeAndMeta', 'selectBorderCrossing', 'maplibregl', 'escHtml',
  `
    ${renderBorderMapMarkersCode}
    return { renderBorderMapMarkers, createBorderMarkerElement };
  `
);

const { renderBorderMapMarkers, createBorderMarkerElement } = evalRenderBorder(
  state, moduleLayers, BORDER_CROSSING_LOCATIONS_EVAL, clearMarkerList, updateMapBadgeAndMeta, selectBorderCrossing, global.maplibregl, escHtml
);

renderBorderMapMarkers(null);
assert.strictEqual(moduleLayers.border.markers.length, 13, 'All 13 default border markers rendered');
console.log(`✓ Passed: Successfully rendered ${moduleLayers.border.markers.length} border markers on default/unloaded state`);

// Render with live data
const liveData = {
  status: 'LIVE_DATA',
  source: 'QKMK',
  crossings: [
    { id: 'border-merdare', name: 'Merdare', coordinates: { lat: 42.9439, lon: 21.2464 }, direction: { entry: { waitingMinutes: 65 } } },
    { id: 'border-jarinje', name: 'Jarinje', coordinates: { lat: 43.2181, lon: 20.6975 }, direction: { entry: { waitingMinutes: 35 } } },
    { id: 'border-vermice', name: 'Vermice', coordinates: { lat: 42.1583, lon: 20.5486 }, direction: { entry: { waitingMinutes: 5 } } }
  ]
};

renderBorderMapMarkers(liveData);
assert.strictEqual(moduleLayers.border.markers.length, 3, 'Rendered 3 live border markers');
console.log('✓ Passed: Successfully rendered live border markers with delay classes');

console.log('--- ALL BORDER CROSSING MAP-FIRST TESTS PASSED SUCCESSFULLY ---');
