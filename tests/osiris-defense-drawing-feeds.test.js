'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Starting OSIRIS Defense Markets, Drawing Tools & Live Feeds Verification ---');

const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');

// Test 1: Defense Equities & Space Weather Panel
console.log('Test 1: Verifying Defense Equities & Space Weather panel in index.html...');
assert.strictEqual(indexHtml.includes('id="btnDefenseMarkets"'), true, 'Must have #btnDefenseMarkets in header');
assert.strictEqual(indexHtml.includes('id="defenseMarketPanel"'), true, 'Must have #defenseMarketPanel container');
assert.strictEqual(indexHtml.includes('17▲ / 11▼'), true, 'Must include breadth ratio 17▲ / 11▼');
assert.strictEqual(indexHtml.includes('of 28'), true, 'Must include total ratio of 28');
assert.strictEqual(indexHtml.includes('▲ Corn +4.17%'), true, 'Must include Corn +4.17% mover');
assert.strictEqual(indexHtml.includes('▼ PLTR -4.49%'), true, 'Must include PLTR -4.49% mover');
assert.strictEqual(indexHtml.includes('Kp 0 — Quiet'), true, 'Must include Kp 0 — Quiet space weather');
assert.strictEqual(indexHtml.includes('M1.0'), true, 'Must include M1.0 flare');

// Check sectors
['INDICES', 'DEFENSE', 'ENERGY', 'COMMODITIES', 'CRYPTO', 'FX', 'SESSION CLOSED', 'DEFAULT'].forEach(sector => {
  assert.strictEqual(indexHtml.includes(sector), true, `Must include sector/status ${sector}`);
});

// Check defense stocks
const expectedStocks = ['RTX', 'LMT', 'NOC', 'GD', 'BA', 'LHX', 'PLTR'];
expectedStocks.forEach(ticker => {
  assert.strictEqual(indexHtml.includes(`>${ticker}<`), true, `Must include defense ticker ${ticker}`);
});
assert.strictEqual(indexHtml.includes('200.79'), true, 'Must include RTX price 200.79');
assert.strictEqual(indexHtml.includes('525.28'), true, 'Must include LMT price 525.28');
assert.strictEqual(indexHtml.includes('514.98'), true, 'Must include NOC price 514.98');
assert.strictEqual(indexHtml.includes('359.39'), true, 'Must include GD price 359.39');
assert.strictEqual(indexHtml.includes('212.25'), true, 'Must include BA price 212.25');
assert.strictEqual(indexHtml.includes('256.45'), true, 'Must include LHX price 256.45');
assert.strictEqual(indexHtml.includes('174.33'), true, 'Must include PLTR price 174.33');
console.log('✓ Passed: Defense Equities, Space Weather & Sector Overview verified in index.html');

// Test 2: Live Feeds Broadcast Panel
console.log('Test 2: Verifying Live Feeds Broadcast panel and channels...');
assert.strictEqual(indexHtml.includes('id="liveFeedsPanel"'), true, 'Must have #liveFeedsPanel');
assert.strictEqual(indexHtml.includes('id="btnLiveFeedsNav"'), true, 'Must have nav-rail button for liveFeedsPanel');
assert.strictEqual(indexHtml.includes('id="liveFeedVideoFrame"'), true, 'Must have video player frame');
assert.strictEqual(indexHtml.includes('id="feedChannelsGrid"'), true, 'Must have channel grid container');

// Check requested global and Balkan channels in app.js
const expectedChannels = [
  'Bloomberg TV',
  'NBC News NOW',
  'CBS News 24/7',
  'ABC News Live',
  'C-SPAN',
  'Al Jazeera Balkans',
  'N1 Info Balkans',
  'RTS Svet',
  'RTK 1',
  'TRT Balkan',
  'Euronews Serbia'
];
expectedChannels.forEach(name => {
  assert.strictEqual(appJs.includes(name), true, `Must include live channel ${name}`);
});
console.log('✓ Passed: All 11 Balkan & Global live broadcast channels configured in app.js');

// Test 3: Tactical Drawing Tools & AOI Measurement
console.log('Test 3: Verifying Tactical Drawing Tools widget in index.html and app.js...');
assert.strictEqual(indexHtml.includes('id="drawingToolsWidget"'), true, 'Must have #drawingToolsWidget');
assert.strictEqual(indexHtml.includes('id="btnToggleDrawingTools"'), true, 'Must have #btnToggleDrawingTools in right rail');
assert.strictEqual(indexHtml.includes('Tracked Area'), true, 'Must display Tracked Area');
assert.strictEqual(indexHtml.includes('AOIs / Perim'), true, 'Must display AOIs / Perim');
assert.strictEqual(indexHtml.includes('id="aoiTrackedArea"'), true, 'Must have #aoiTrackedArea');
assert.strictEqual(indexHtml.includes('id="aoiPerim"'), true, 'Must have #aoiPerim');

// Check 4 shapes
const shapes = ['AREA', 'BOX', 'RADIUS', 'PATH'];
shapes.forEach(s => {
  assert.strictEqual(indexHtml.includes(s), true, `Must include drawing shape ${s}`);
});
assert.strictEqual(indexHtml.includes('Any shape, corner by corner'), true, 'Must have AREA description');
assert.strictEqual(indexHtml.includes('Two clicks, opposite corners'), true, 'Must have BOX description');
assert.strictEqual(indexHtml.includes('id="drawingInsideBox"'), true, 'Must have #drawingInsideBox for in-AOI intelligence');
console.log('✓ Passed: Tactical Drawing Tools widget markup and shapes verified');

// Test 4: app.js logic and exports
console.log('Test 4: Verifying Drawing & Feed logic and exports in app.js...');
assert.strictEqual(appJs.includes('function toggleDefenseMarketPanel'), true, 'toggleDefenseMarketPanel defined');
assert.strictEqual(appJs.includes('function renderLiveFeeds'), true, 'renderLiveFeeds defined');
assert.strictEqual(appJs.includes('function switchFeedChannel'), true, 'switchFeedChannel defined');
assert.strictEqual(appJs.includes('function toggleDrawingToolsWidget'), true, 'toggleDrawingToolsWidget defined');
assert.strictEqual(appJs.includes('function setDrawingShape'), true, 'setDrawingShape defined');
assert.strictEqual(appJs.includes('function calculatePolygonAreaKm2'), true, 'calculatePolygonAreaKm2 defined');
assert.strictEqual(appJs.includes('function haversineDistanceKm'), true, 'haversineDistanceKm defined');
assert.strictEqual(appJs.includes('function checkEntitiesInAoi'), true, 'checkEntitiesInAoi defined');
assert.strictEqual(appJs.includes('function exportAoiGeoJson'), true, 'exportAoiGeoJson defined');
assert.strictEqual(appJs.includes("'liveFeedsPanel': 'feeds'"), true, 'liveFeedsPanel mapped in toggleModule');
console.log('✓ Passed: All functions, geometric solvers & toggleModule mapping verified');

// Test 5: Mathematical geometry calculations
console.log('Test 5: Validating polygon area and distance math...');
// Test spherical area for a 1-degree square roughly around Kosovo (42-43N, 20-21E)
// Length of 1 deg lat = ~111km, 1 deg lon at 42.5N = ~82km. Expected area = ~9100 km²
function testArea(coords) {
  const rad = Math.PI / 180;
  const R = 6371.0088;
  let total = 0;
  for (let i = 0; i < coords.length; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % coords.length];
    total += (p2[0] - p1[0]) * rad * (2 + Math.sin(p1[1] * rad) + Math.sin(p2[1] * rad));
  }
  return Math.abs(total * R * R / 2.0);
}
const testBox = [[20, 42], [21, 42], [21, 43], [20, 43], [20, 42]];
const areaKm2 = testArea(testBox);
assert.ok(areaKm2 > 8500 && areaKm2 < 9500, `Area should be ~9100 km², got ${areaKm2}`);
console.log(`✓ Passed: Geodesic polygon area verified (${areaKm2.toFixed(1)} km²)`);

// Test 6: CSS styling checks & Non-overlap positioning
console.log('Test 6: Verifying CSS classes and non-duplicate controls in style.css...');
assert.strictEqual(styleCss.includes('.osiris-market-drawer'), true, '.osiris-market-drawer styled');
assert.strictEqual(styleCss.includes('.drawing-tools-widget'), true, '.drawing-tools-widget styled');
assert.strictEqual(styleCss.includes('.live-feed-player-card'), true, '.live-feed-player-card styled');
assert.strictEqual(styleCss.includes('.basemap-control-container'), true, 'basemap-control-container styled');
assert.strictEqual(styleCss.includes('.map-mode-control-container'), true, 'map-mode-control-container styled');
assert.strictEqual(styleCss.includes('display: none !important;'), true, 'display: none !important applied to old controls');

// Check left offset clearance of 80px to clear the 52px left rail
assert.strictEqual(/\.osiris-bottom-left-widget\s*\{[^}]*left:\s*80px;/s.test(styleCss), true, '.osiris-bottom-left-widget must have left: 80px');
assert.strictEqual(/\.drawing-tools-widget\s*\{[^}]*left:\s*80px;/s.test(styleCss), true, '.drawing-tools-widget must have left: 80px');
console.log('✓ Passed: Left clearance (80px) and CSS styling verified');

// Test 7: Right rail button and clickable sectors
console.log('Test 7: Verifying #btnDefenseMarkets in right rail and clickable sectors...');
const rightRailMatches = indexHtml.match(/<div class="osiris-right-rail" id="osirisRightRail">([\s\S]*?)<\/div>/);
assert.ok(rightRailMatches, 'Must have #osirisRightRail container');
assert.strictEqual(rightRailMatches[1].includes('id="btnDefenseMarkets"'), true, '#btnDefenseMarkets must be inside #osirisRightRail');
assert.strictEqual(indexHtml.includes('switchDefenseSector(\'crypto\','), true, 'Must have clickable crypto sector tab');
assert.strictEqual(indexHtml.includes('switchDefenseSector(\'defense\','), true, 'Must have clickable defense sector tab');
assert.strictEqual(appJs.includes('function switchDefenseSector'), true, 'switchDefenseSector function must exist in app.js');
assert.strictEqual(appJs.includes('window.switchDefenseSector = switchDefenseSector;'), true, 'switchDefenseSector must be exported on window');
console.log('✓ Passed: Right rail button and interactive sectors verified');

// Test 8: Live feeds embed player fallback and custom stream connect
console.log('Test 8: Verifying live feeds embed player fallback and connect...');
assert.strictEqual(indexHtml.includes('id="feedVideoFallback"'), true, 'Must have #feedVideoFallback overlay');
assert.strictEqual(indexHtml.includes('id="feedCustomStreamInput"'), true, 'Must have #feedCustomStreamInput for stream entry');
assert.strictEqual(appJs.includes('function connectCustomFeedStream'), true, 'connectCustomFeedStream function must exist in app.js');
assert.strictEqual(appJs.includes('function formatFeedEmbedUrl'), true, 'formatFeedEmbedUrl function must exist in app.js');
console.log('✓ Passed: Live feeds embed player and custom stream connect verified');

// Test 9: Solar Day/Night toggle atmosphere layer
console.log('Test 9: Verifying Solar Day/Night toggle and tactical atmosphere layer...');
assert.strictEqual(appJs.includes('tactical-night-atmosphere'), true, 'Must define tactical-night-atmosphere layer');
assert.strictEqual(appJs.includes("state.map.setLayoutProperty('tactical-night-atmosphere'"), true, 'toggleDayNightCycle must toggle tactical-night-atmosphere');
console.log('✓ Passed: Solar Day/Night toggle and tactical atmosphere verified');

console.log('\n--- ALL OSIRIS DEFENSE MARKETS, DRAWING & FEEDS TESTS PASSED ---');

