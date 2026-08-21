const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Starting KOSINT Route Intelligence & Basemap Cleanup Tests ---');

const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');

// Test 1: Basemap - Exactly 2 Options (Map & Satellite using Clarity archive)
console.log('Test 1: Verifying Basemap options (Map & Satellite only, using Clarity archive)...');
assert(!appJs.includes("'clear-satellite-tiles'"), 'Old 3rd basemap source must be removed');
assert(!appJs.includes("'clear-satellite-basemap'"), 'Old 3rd basemap layer must be removed');
assert(!indexHtml.includes('Clear Satellite'), 'Clear Satellite text should not exist in HTML');
assert(appJs.includes('clarity.maptiles.arcgis.com'), 'Satellite imagery must use Clarity optical archive');

// Count basemap buttons in BasemapControl template
const basemapBtns = appJs.match(/<button class="basemap-btn[^"]*" data-basemap="([^"]+)">/g) || [];
assert.strictEqual(basemapBtns.length, 2, 'BasemapControl must have exactly 2 basemap buttons');
assert(appJs.includes('data-basemap="dark"'), 'Basemap must have dark Map option');
assert(appJs.includes('data-basemap="satellite"'), 'Basemap must have Satellite option');
console.log('✓ Passed: Exactly 2 basemaps (Map & Satellite) verified with Clarity optical imagery');

// Test 2: Route Intelligence - Drive Only Mode
console.log('Test 2: Verifying Route Intelligence is Drive-only (no Walk / Bike)...');
assert(!indexHtml.includes('setRouteMode(\'walking\')'), 'Walk mode button must be removed from HTML');
assert(!indexHtml.includes('setRouteMode(\'cycling\')'), 'Bike mode button must be removed from HTML');
assert(!styleCss.includes('.route-mode-buttons'), 'Unused route-mode-buttons CSS must be removed');
assert(!appJs.includes('function setRouteMode'), 'setRouteMode function must be removed');
assert(indexHtml.includes('route-mode-badge'), 'index.html must display fixed DRIVE badge');
console.log('✓ Passed: Drive-only mode verified without leftover Walk/Bike buttons or handlers');

// Test 3: Critical - No Fake / Fabricated Routing Data
console.log('Test 3: Verifying removal of simulated/fallback route data generation...');
assert(!appJs.includes('function generateFallbackRouteGeometry'), 'generateFallbackRouteGeometry must be completely removed');
assert(!appJs.includes('fallback.distanceKm'), 'No fallback distanceKm should be referenced');
assert(!appJs.includes('fallback.durationMin'), 'No fallback durationMin should be referenced');
assert(appJs.includes('ROUTING SERVICE UNAVAILABLE'), 'app.js must explicitly display ROUTING SERVICE UNAVAILABLE when real routing fails');
console.log('✓ Passed: No simulated/fake routing data verified; explicit unavailable state implemented');

// Test 4: Threat animations & clustering integrity
console.log('Test 4: Verifying Threat Animations, Radar Effects & Marker Clustering...');
assert(styleCss.includes('@keyframes threatPulseCritical'), 'threatPulseCritical animation must exist');
assert(styleCss.includes('@keyframes threatPulseHigh'), 'threatPulseHigh animation must exist');
assert(styleCss.includes('@keyframes radarPulse'), 'radarPulse animation must exist');
assert(appJs.includes('function clusterGeoItems'), 'clusterGeoItems must exist');
console.log('✓ Passed: Threat animations, radar effects & clustering preserved');

console.log('--- ALL CLEANUP & VERIFICATION TESTS PASSED SUCCESSFULLY ---');
