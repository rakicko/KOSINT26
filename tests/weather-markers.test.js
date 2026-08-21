const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Starting KOSINT Weather Map Markers Verification Tests ---');

const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');

// Mock DOM & MapLibre environment for headless testing
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
        toggle: function(c, force) {
          if (force !== undefined) {
            if (force) this.add(c); else this.remove(c);
          } else {
            if (classSet.has(c)) this.remove(c); else this.add(c);
          }
        },
        contains: function(c) { return classSet.has(c); }
      },
      dataset: {},
      style: {},
      children: [],
      appendChild: function(child) { this.children.push(child); return child; },
      querySelector: function(selector) {
        if (selector.startsWith('.')) {
          const cls = selector.slice(1);
          return findChild(this, (node) => node.classList && node.classList.contains(cls));
        }
        return null;
      },
      querySelectorAll: function(selector) {
        const results = [];
        if (selector.startsWith('.')) {
          const cls = selector.slice(1);
          findAllChildren(this, (node) => node.classList && node.classList.contains(cls), results);
        }
        return results;
      },
      setAttribute: function(k, v) { this[k] = v; },
      getAttribute: function(k) { return this[k]; },
      addEventListener: function(evt, fn) { this[`_on_${evt}`] = fn; }
    };
    return el;
  },
  getElementById: () => null,
  querySelectorAll: () => []
};

function findChild(parent, predicate) {
  for (const child of parent.children || []) {
    if (predicate(child)) return child;
    const found = findChild(child, predicate);
    if (found) return found;
  }
  return null;
}

function findAllChildren(parent, predicate, results) {
  for (const child of parent.children || []) {
    if (predicate(child)) results.push(child);
    findAllChildren(child, predicate, results);
  }
}

global.maplibregl = {
  Marker: function(opts) {
    this._element = opts.element;
    this.setLngLat = function(coords) { this._coords = coords; return this; };
    this.addTo = function(map) { this._map = map; return this; };
    this.getElement = function() { return this._element; };
  },
  Popup: function() {
    this.setLngLat = function() { return this; };
    this.setHTML = function() { return this; };
    this.addTo = function() { return this; };
    this.on = function() { return this; };
    this.remove = function() { return this; };
  }
};

global.window = global;

// Evaluate weather functions from app.js
const KOSOVO_WEATHER_CITIES = [
  { id: 'prishtine', name: 'Prishtinë', lat: 42.6629, lon: 21.1655 },
  { id: 'mitrovice', name: 'Mitrovicë', lat: 42.8914, lon: 20.8660 },
  { id: 'peje',      name: 'Pejë',      lat: 42.6591, lon: 20.2883 },
  { id: 'prizren',   name: 'Prizren',   lat: 42.2153, lon: 20.7415 },
  { id: 'ferizaj',   name: 'Ferizaj',   lat: 42.3705, lon: 21.1553 },
  { id: 'gjilan',    name: 'Gjilan',    lat: 42.4635, lon: 21.4694 },
  { id: 'gjakove',   name: 'Gjakovë',   lat: 42.3803, lon: 20.4308 }
];

function escHtml(str) { return String(str||''); }
function formatHour(iso) { return iso; }
function weatherIcon(code) {
  if (code===0) return '☀️'; if (code<=3) return '⛅'; if (code<=48) return '🌫️';
  if (code<=67) return '🌧️'; if (code<=77) return '🌨️'; if (code<=82) return '🌦️'; if (code<=99) return '⛈️'; return '🌤️';
}

// Extract updateWeatherCityMarker, createWeatherMarkerElement, and renderWeatherMapMarkers
eval(appJs.slice(appJs.indexOf('function updateWeatherCityMarker('), appJs.indexOf('async function fetchCityWeather(')));
eval(appJs.slice(appJs.indexOf('function createWeatherMarkerElement('), appJs.indexOf('function renderAqiMapMarkers(')));

// Test 1: Temperature is visible by default without requiring a click
console.log('Test 1: Verifying temperature is visible by default on marker creation...');
const cityPrishtine = KOSOVO_WEATHER_CITIES[0];
const prishtineData = { current: { temp: 27, weatherCode: 0, description: 'Clear sky' } };
const el1 = createWeatherMarkerElement(cityPrishtine, prishtineData, false);

const tempEl1 = el1.querySelector('.weather-marker-temp');
assert(tempEl1, 'Marker must contain .weather-marker-temp element');
assert.strictEqual(tempEl1.textContent, '27°C', 'Marker must immediately display 27°C');
const nameEl1 = el1.querySelector('.weather-marker-name');
assert.strictEqual(nameEl1.textContent, 'Prishtinë', 'Marker must display city name');
const iconEl1 = el1.querySelector('.weather-marker-icon');
assert.strictEqual(iconEl1.textContent, '☀️', 'Marker must display sunny weather icon');
console.log('✓ Passed: Temperature, icon, and name immediately visible on marker');

// Test 2: Each marker has its own distinct state and temperatures are not shared
console.log('Test 2: Verifying multiple cities display distinct temperatures from their own data...');
const cityMitrovice = KOSOVO_WEATHER_CITIES[1];
const cityPeje = KOSOVO_WEATHER_CITIES[2];
const cityPrizren = KOSOVO_WEATHER_CITIES[3];

const mitroviceData = { current: { temp: 26, weatherCode: 1, description: 'Mainly clear' } };
const pejeData = { current: { temp: 24, weatherCode: 2, description: 'Partly cloudy' } };
const prizrenData = { current: { temp: 28, weatherCode: 0, description: 'Clear sky' } };

const elMitrovice = createWeatherMarkerElement(cityMitrovice, mitroviceData, false);
const elPeje = createWeatherMarkerElement(cityPeje, pejeData, false);
const elPrizren = createWeatherMarkerElement(cityPrizren, prizrenData, false);

assert.strictEqual(elMitrovice.querySelector('.weather-marker-temp').textContent, '26°C', 'Mitrovicë must display 26°C');
assert.strictEqual(elPeje.querySelector('.weather-marker-temp').textContent, '24°C', 'Pejë must display 24°C');
assert.strictEqual(elPrizren.querySelector('.weather-marker-temp').textContent, '28°C', 'Prizren must display 28°C');
console.log('✓ Passed: All cities maintain their own isolated temperature state (26°C, 24°C, 28°C)');

// Test 3: Unloaded / pending data displays neutral loading state (not stale fallback)
console.log('Test 3: Verifying neutral loading state for unloaded data...');
const cityGjakove = KOSOVO_WEATHER_CITIES[6];
const elLoading = createWeatherMarkerElement(cityGjakove, null, false);
const loadingTemp = elLoading.querySelector('.weather-marker-temp');
assert.strictEqual(loadingTemp.textContent, '—', 'Unloaded marker must display neutral placeholder —');
assert(loadingTemp.classList.contains('loading'), 'Unloaded marker must have loading class');
console.log('✓ Passed: Unloaded city data displays neutral loading indicator (no stale fallback)');

// Test 4: updateWeatherCityMarker updates only target city marker without affecting others
console.log('Test 4: Verifying targeted marker update logic...');
const mockMarkers = [
  { _cityId: 'prishtine', getElement: () => el1 },
  { _cityId: 'mitrovice', getElement: () => elMitrovice },
  { _cityId: 'gjakove', getElement: () => elLoading }
];
global.moduleLayers = { weather: { markers: mockMarkers } };

// Update only Gjakove with fresh data
updateWeatherCityMarker('gjakove', { current: { temp: 25, weatherCode: 1 } });
assert.strictEqual(elLoading.querySelector('.weather-marker-temp').textContent, '25°C', 'Gjakovë must update to 25°C');
assert.strictEqual(elLoading.querySelector('.weather-marker-icon').textContent, '⛅', 'Gjakovë icon must update to ⛅');
// Verify Prishtine and Mitrovice were untouched
assert.strictEqual(el1.querySelector('.weather-marker-temp').textContent, '27°C', 'Prishtinë must remain 27°C');
assert.strictEqual(elMitrovice.querySelector('.weather-marker-temp').textContent, '26°C', 'Mitrovicë must remain 26°C');
console.log('✓ Passed: Individual marker update strictly updates targeted city without mutating others');

// Test 5: CSS styles verification
console.log('Test 5: Verifying CSS styles for .weather-custom-marker in style.css...');
assert(styleCss.includes('.weather-custom-marker'), 'style.css must contain .weather-custom-marker');
assert(styleCss.includes('.weather-marker-pill'), 'style.css must contain .weather-marker-pill');
assert(styleCss.includes('.weather-marker-temp'), 'style.css must contain .weather-marker-temp');
assert(styleCss.includes('.weather-marker-temp.loading'), 'style.css must contain .weather-marker-temp.loading');
console.log('✓ Passed: style.css contains all required weather marker classes');

// Test 6: Preloading function exists and is exported
console.log('Test 6: Verifying fetchAllWeatherCities and preloading in app.js...');
assert(appJs.includes('function fetchAllWeatherCities'), 'app.js must define fetchAllWeatherCities');
assert(appJs.includes('window.fetchAllWeatherCities = fetchAllWeatherCities'), 'app.js must export fetchAllWeatherCities');
assert(appJs.includes('window.updateWeatherCityMarker = updateWeatherCityMarker'), 'app.js must export updateWeatherCityMarker');
console.log('✓ Passed: Automatic preloading and exports verified');

console.log('--- ALL WEATHER MAP MARKERS TESTS PASSED SUCCESSFULLY ---');
