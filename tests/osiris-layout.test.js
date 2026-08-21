'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Starting OSIRIS AI Layout Verification Tests ---');

const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');

// 1. Check OSIRIS Navigation Rail Presence
console.log('Test 1: Verifying .osiris-nav-rail in index.html...');
assert.strictEqual(indexHtml.includes('class="osiris-nav-rail"'), true, 'Must have .osiris-nav-rail container');
assert.strictEqual(indexHtml.includes('id="moduleNavRail"'), true, 'Must have #moduleNavRail ID');
console.log('✓ Passed: .osiris-nav-rail is present');

// 2. Check all 13 module buttons and tooltips
console.log('Test 2: Verifying all 13 module icon buttons and tooltips...');
const expectedPanels = [
  { panel: 'newsPanel', label: 'News Intelligence' },
  { panel: 'weatherPanel', label: 'Weather Monitor' },
  { panel: 'trafficPanel', label: 'Traffic Intelligence' },
  { panel: 'radiationPanel', label: 'Radiation Monitor' },
  { panel: 'aqiPanel', label: 'Air Quality Index' },
  { panel: 'earthquakePanel', label: 'Seismic Activity' },
  { panel: 'wildfirePanel', label: 'Wildfire Detection' },
  { panel: 'aviationPanel', label: 'Aviation Intelligence' },
  { panel: 'telegramPanel', label: 'Telegram Public Feed' },
  { panel: 'borderPanel', label: 'Border Crossing Monitor' },
  { panel: 'cctvIntelligencePanel', label: 'CCTV Surveillance' },
  { panel: 'alertPanel', label: 'Alert Log' },
  { panel: 'settingsPanel', label: 'System Settings' }
];

expectedPanels.forEach(({ panel, label }) => {
  assert.strictEqual(indexHtml.includes(`data-panel="${panel}"`), true, `Missing button for ${panel}`);
  assert.strictEqual(indexHtml.includes(`class="nav-rail-tooltip">${label}</span>`), true, `Missing tooltip for ${label}`);
});
console.log('✓ Passed: All 13 module icon buttons & tooltips are configured');

// 3. Check that all target panel containers exist in the DOM
console.log('Test 3: Verifying all target panel elements exist in index.html...');
expectedPanels.forEach(({ panel }) => {
  assert.strictEqual(indexHtml.includes(`id="${panel}"`), true, `Missing panel DOM container #${panel}`);
});
console.log('✓ Passed: All 13 module panels exist in the DOM');

// 4. Check critical DOM IDs are preserved and title text is removed
console.log('Test 4: Verifying map title text is completely removed...');
assert.strictEqual(indexHtml.includes('Interactive Situation Map'), false, 'Title "Interactive Situation Map" must be removed');
assert.strictEqual(indexHtml.includes('Pinch/scroll to zoom'), false, 'Instruction "Pinch/scroll to zoom" must be removed');
assert.strictEqual(indexHtml.includes('Balkan Intelligence Base Map'), false, 'Instruction "Balkan Intelligence Base Map" must be removed');
console.log('✓ Passed: Map title and instruction text are completely absent');

console.log('Test 4b: Verifying critical legacy element IDs are preserved...');
const criticalIds = [
  'leafletMap',
  'mapPanel',
  'moduleOverlay',
  'overlayTitle',
  'alertLog',
  'unreadBadge',
  'pollInterval',
  'mapToggle',
  'newsList',
  'newsBadge',
  'incidentList',
  'radiationPrimary',
  'aqiMain',
  'earthquakeList',
  'wildfireList',
  'aviationList',
  'telegramList',
  'borderList',
  'cctvIntelligencePanel'
];

criticalIds.forEach(id => {
  assert.strictEqual(indexHtml.includes(`id="${id}"`), true, `Critical ID #${id} must be preserved`);
});
console.log('✓ Passed: All critical element IDs are preserved');

// 5. Check app.js toggleModule and OSIRIS map controls
console.log('Test 5: Verifying toggleModule and map controls in app.js...');
assert.strictEqual(appJs.includes("'alertPanel': 'alert'"), true, 'alertPanel mapped in toggleModule');
assert.strictEqual(appJs.includes("'settingsPanel': 'settings'"), true, 'settingsPanel mapped in toggleModule');
assert.strictEqual(appJs.includes('.nav-rail-btn, .module-btn'), true, 'nav-rail-btn queried in toggleModule & closeModulePanel');
assert.strictEqual(appJs.includes("e.key === 'Escape'"), true, 'Escape key listener added');
assert.strictEqual(appJs.includes("attributionControl: false"), true, 'attributionControl is set to false');
assert.strictEqual(appJs.includes("🗺️</span> Map"), true, 'Basemap control has 🗺️ Map');
assert.strictEqual(appJs.includes("🛰️</span> Satellite"), true, 'Basemap control has 🛰️ Satellite');
assert.strictEqual(appJs.includes("osiris-map-ctrl-pill"), true, 'osiris-map-ctrl-pill class used in controls');
assert.strictEqual(appJs.includes("addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'bottom-right')"), true, 'NavigationControl positioned in bottom-right');
console.log('✓ Passed: app.js contains full toggleModule mapping, compact pill controls, bottom-right navigation, and attribution suppression');

// 6. Check KOSINT branding and logo
console.log('Test 6: Verifying KOSINT branding and logo in index.html...');
assert.strictEqual(indexHtml.includes('<span class="brand-name">KOSINT</span>'), true, 'Must display "KOSINT"');
assert.strictEqual(indexHtml.includes('<span class="brand-sub">Open-Source Intelligence Platform</span>'), true, 'Must display "Open-Source Intelligence Platform"');
assert.strictEqual(indexHtml.includes('id="kosintLogo"'), true, 'Must have #kosintLogo container');
assert.strictEqual(indexHtml.includes('brand-logo-svg'), true, 'Must have brand-logo-svg SVG element');
assert.strictEqual(indexHtml.includes('SENTINEL'), false, 'Old SENTINEL brand name must be replaced');
assert.strictEqual(indexHtml.includes('Situational Awareness System'), false, 'Old subtitle must be replaced');
assert.strictEqual(indexHtml.includes('THREAT LEVEL'), false, 'Threat Level must be completely removed from header');
assert.strictEqual(indexHtml.includes('threatWidget'), false, 'threatWidget must be completely removed from header');
assert.strictEqual(indexHtml.includes('exportReport()'), false, 'Export button must be completely removed from UI');
console.log('✓ Passed: KOSINT branding, logo, and header cleanup verified');

// 7. Check CCTV 3x large split-screen layout, unobstructed video & Map controls
console.log('Test 7: Verifying OSIRIS styling, bottom-right map controls, and unobstructed CCTV viewer...');
assert.strictEqual(styleCss.includes('.osiris-nav-rail'), true, '.osiris-nav-rail styled in style.css');
assert.strictEqual(styleCss.includes('.nav-rail-btn'), true, '.nav-rail-btn styled in style.css');
assert.strictEqual(styleCss.includes('.nav-rail-tooltip'), true, '.nav-rail-tooltip styled in style.css');
assert.strictEqual(styleCss.includes('.module-overlay.active'), true, '.module-overlay.active styled in style.css');
assert.strictEqual(styleCss.includes('.osiris-map-ctrl-pill'), true, '.osiris-map-ctrl-pill styled in style.css');
assert.strictEqual(styleCss.includes('.maplibregl-ctrl-bottom-right'), true, '.maplibregl-ctrl-bottom-right styled in style.css');
assert.strictEqual(styleCss.includes('.maplibregl-ctrl-attrib'), true, '.maplibregl-ctrl-attrib hidden in style.css');
assert.strictEqual(styleCss.includes('.brand-logo-svg'), true, '.brand-logo-svg styled in style.css');
assert.strictEqual(styleCss.includes('width: min(50vw, calc(100vw - 80px));'), true, 'CCTV panel occupies ~50% right half viewport');
assert.strictEqual(styleCss.includes('aspect-ratio: 16 / 9;'), true, 'CCTV video player has large 16:9 canvas');
assert.strictEqual(styleCss.includes('bottom: auto;'), true, 'CCTV panel height wraps content without stretching to bottom');
assert.strictEqual(styleCss.includes('flex: 0 0 auto;'), true, 'CCTV body does not expand unnecessarily');
assert.strictEqual(indexHtml.includes('cctv-header-right'), true, 'CCTV panel has header status & close button');
assert.strictEqual(indexHtml.includes('cctv-intelligence-body'), true, 'CCTV panel has structured scrollable body');
assert.strictEqual(indexHtml.includes('id="cctvFullscreenBtn"'), true, 'CCTV panel has fullscreen button');
assert.strictEqual(appJs.includes('toggleCCTVFullscreen'), true, 'toggleCCTVFullscreen function defined in app.js');
assert.strictEqual(styleCss.includes('.cctv-header-link-btn'), true, '.cctv-header-link-btn styled in style.css');
// 8. Check CCTV dedicated embed URL transformation
console.log('Test 8: Verifying CCTV dedicated player embed URL transformation and camera list removal...');
assert.strictEqual(appJs.includes('function getCCTVEmbedUrl(camera)'), true, 'getCCTVEmbedUrl function exists in app.js');
assert.strictEqual(appJs.includes('/embed/'), true, 'Uses /embed/ route for player');

// Extract and test getCCTVEmbedUrl directly
const getCCTVEmbedUrlMatch = appJs.match(/function getCCTVEmbedUrl\(camera\) \{[\s\S]*?\n\}/);
assert.ok(getCCTVEmbedUrlMatch, 'getCCTVEmbedUrl code found');
const testFn = new Function('camera', getCCTVEmbedUrlMatch[0] + '; return getCCTVEmbedUrl(camera);');

const testCam = { pageUrl: 'https://video.gjirafa.com/slow-tv-stacioni-i-autobuseve-prishtine' };
const transformedEmbedUrl = testFn(testCam);
assert.strictEqual(transformedEmbedUrl, 'https://video.gjirafa.com/embed/slow-tv-stacioni-i-autobuseve-prishtine?autoplay=true&am=true');
console.log('✓ Passed: getCCTVEmbedUrl correctly transforms page URL to dedicated video player embed URL');

// 9. Verify CAMERAS directory list is removed from visible CCTV panel UI
console.log('Test 9: Verifying CAMERAS list directory is completely removed from visible CCTV UI...');
assert.strictEqual(indexHtml.includes('cctv-camera-list-section'), false, 'CAMERAS list section must be removed from index.html');
assert.strictEqual(indexHtml.includes('<span>CAMERAS</span>'), false, 'CAMERAS heading text must be removed from index.html');

// 10. Verify all 16 CCTV cameras preserved in CCTV_CAMERAS with coordinates
console.log('Test 10: Verifying all 16 CCTV cameras preserved in data...');
const cctvCamerasMatch = appJs.match(/const CCTV_CAMERAS = (\[[\s\S]*?\]);/);
assert.ok(cctvCamerasMatch, 'CCTV_CAMERAS array found in app.js');
const cctvCameras = eval(cctvCamerasMatch[1]);
assert.strictEqual(cctvCameras.length, 16, 'All 16 CCTV cameras preserved');
cctvCameras.forEach(cam => {
  assert.ok(cam.id, 'Camera has id');
  assert.ok(cam.lat && cam.lon, 'Camera has coordinates');
  assert.ok(cam.pageUrl, 'Camera has pageUrl');
});
assert.strictEqual(appJs.includes('function renderCCTVMapMarkers()'), true, 'renderCCTVMapMarkers defined');
console.log('✓ Passed: All 16 CCTV cameras and map markers intact with primary map-first interaction');

console.log('--- ALL OSIRIS AI LAYOUT TESTS PASSED SUCCESSFULLY ---');
