'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Starting Tactical Layers Persistence & Migration Tests ---');

const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');

// Test 1: Verify buttons removed from OSIRIS navigation rail
console.log('Test 1: Verifying Minefields, Seismic, Radiation, Weather, and AQI buttons removed from nav rail...');
assert.strictEqual(indexHtml.includes('data-panel="minePanel"'), false, 'minePanel button must be removed from nav rail');
assert.strictEqual(indexHtml.includes('data-panel="earthquakePanel"'), false, 'earthquakePanel button must be removed from nav rail');
assert.strictEqual(indexHtml.includes('data-panel="radiationPanel"'), false, 'radiationPanel button must be removed from nav rail');
assert.strictEqual(indexHtml.includes('data-panel="weatherPanel"'), false, 'weatherPanel button must be removed from nav rail');
assert.strictEqual(indexHtml.includes('data-panel="aqiPanel"'), false, 'aqiPanel button must be removed from nav rail');
console.log('✓ Passed: Buttons removed from nav rail');

// Test 2: Verify checkboxes in Tactical Layers Menu
console.log('Test 2: Verifying tactical layer checkboxes in #tacticalLayersMenu...');
assert.strictEqual(indexHtml.includes('id="toggleLayerMines"'), true, 'Must have #toggleLayerMines');
assert.strictEqual(indexHtml.includes('id="toggleLayerSeismic"'), true, 'Must have #toggleLayerSeismic');
assert.strictEqual(indexHtml.includes('id="toggleLayerRadiation"'), true, 'Must have #toggleLayerRadiation');
assert.strictEqual(indexHtml.includes('id="toggleLayerWeather"'), true, 'Must have #toggleLayerWeather');
assert.strictEqual(indexHtml.includes('id="toggleLayerAqi"'), true, 'Must have #toggleLayerAqi');
console.log('✓ Passed: Tactical layer controls present in menu');

// Test 3: Verify toggleTacticalLayer handles all groups
console.log('Test 3: Verifying toggleTacticalLayer handles tactical groups...');
assert.strictEqual(appJs.includes("layerGroup === 'mines'"), true, 'toggleTacticalLayer must handle mines');
assert.strictEqual(appJs.includes("layerGroup === 'seismic'"), true, 'toggleTacticalLayer must handle seismic');
assert.strictEqual(appJs.includes("layerGroup === 'radiation'"), true, 'toggleTacticalLayer must handle radiation');
assert.strictEqual(appJs.includes("layerGroup === 'weather'"), true, 'toggleTacticalLayer must handle weather');
assert.strictEqual(appJs.includes("layerGroup === 'aqi'"), true, 'toggleTacticalLayer must handle aqi');
assert.strictEqual(appJs.includes("syncTacticalLayersOnMap"), true, 'Must have syncTacticalLayersOnMap');
console.log('✓ Passed: toggleTacticalLayer handles tactical map layers');

// Test 4: Verify clearAllModuleLayers preserves tactical layers
console.log('Test 4: Verifying clearAllModuleLayers does not clear tactical layers...');
assert.strictEqual(
  appJs.includes("if (['earthquake', 'radiation', 'mines', 'weather', 'aqi', 'msr'].includes(mod)) return;"),
  true,
  'clearAllModuleLayers must skip clearing earthquake, radiation, mines, weather, aqi, and msr'
);
console.log('✓ Passed: clearAllModuleLayers preserves tactical layers when switching active module overlays');

// Test 5: Verify all checkboxes in #tacticalLayersMenu are unchecked by default
console.log('Test 5: Verifying all operational zones & corridors checkboxes are unchecked by default...');
const menuHtmlMatch = indexHtml.match(/<div class="tactical-layers-menu"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
assert.ok(menuHtmlMatch, 'Tactical layers menu must exist in index.html');
const menuHtml = menuHtmlMatch[0];
const checkedInputs = menuHtml.match(/<input[^>]+id="toggleLayer[^>]*\schecked(?:\s|>)/g);
assert.strictEqual(checkedInputs, null, 'No tactical layer checkbox should be checked by default');
console.log('✓ Passed: All operational zones & corridors checkboxes are unchecked by default');

// Test 6: Verify priority ordering: Mines -> KFOR -> Bridges -> Border Crossings -> MSR
console.log('Test 6: Verifying priority ordering (Mines -> KFOR -> Bridges -> Border)...');
const idxMines = indexHtml.indexOf('id="toggleLayerMines"');
const idxKfor = indexHtml.indexOf('id="toggleLayerKfor"');
const idxCorridors = indexHtml.indexOf('id="toggleLayerCorridors"');
const idxBorder = indexHtml.indexOf('id="toggleLayerBorder"');
const idxMsr = indexHtml.indexOf('id="toggleLayerMsr"');

assert.ok(idxMines > 0, 'toggleLayerMines exists');
assert.ok(idxKfor > 0, 'toggleLayerKfor exists');
assert.ok(idxCorridors > 0, 'toggleLayerCorridors exists');
assert.ok(idxBorder > 0, 'toggleLayerBorder exists');
assert.ok(idxMsr > 0, 'toggleLayerMsr exists');

assert.ok(idxMines < idxKfor, 'Mines must precede KFOR');
assert.ok(idxKfor < idxCorridors, 'KFOR must precede Bridges/Corridors');
assert.ok(idxCorridors < idxBorder, 'Bridges/Corridors must precede Border Crossings');
assert.ok(idxBorder < idxMsr, 'Border Crossings must precede MSR');
console.log('✓ Passed: Layer priority order is correctly structured');

// Test 7: Verify Border Crossings handled in toggleTacticalLayer and Wildfire is dedicated module
console.log('Test 7: Verifying toggleTacticalLayer handles border and wildfire remains dedicated module...');
assert.strictEqual(appJs.includes("layerGroup === 'border'"), true, 'toggleTacticalLayer must handle border');
assert.strictEqual(appJs.includes("toggleBorderTacticalLayer"), true, 'Must have toggleBorderTacticalLayer');
assert.strictEqual(indexHtml.includes('data-panel="wildfirePanel"'), true, 'Wildfire must be on nav rail');
assert.strictEqual(indexHtml.includes('id="wildfirePanel"'), true, 'Wildfire panel must exist');
console.log('✓ Passed: Border Crossings supported as tactical layer and Wildfire preserved as dedicated module');

// Test 8: Verify popup close button ('X') is styled white
console.log('Test 8: Verifying map popup close button is white instead of black...');
const styleCss = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');
assert.ok(styleCss.includes('.maplibregl-popup-close-button'), 'CSS must style .maplibregl-popup-close-button');
assert.ok(
  styleCss.includes('color: #ffffff !important;') && styleCss.includes('.maplibregl-popup-close-button'),
  'Popup close button must have #ffffff color override'
);
console.log('✓ Passed: Map popup close button is styled white');

console.log('--- ALL TACTICAL LAYERS PERSISTENCE TESTS PASSED SUCCESSFULLY ---');
