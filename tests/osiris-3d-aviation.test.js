'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Starting OSIRIS 3D, Day/Night & Aviation Flight Trails Verification ---');

const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');
const aviationSkill = require('../skills/aviation-monitor/skill');

// 1. Verify OSIRIS Header Telemetry Elements in index.html
console.log('Test 1: Verifying OSIRIS header telemetry in index.html...');
assert.ok(indexHtml.includes('id="osirisHeaderTelemetry"'), 'Header telemetry container must exist');
assert.ok(indexHtml.includes('id="zuluTimeDisplay"'), 'Zulu time display must exist');
assert.ok(indexHtml.includes('id="telemetryActiveLayers"'), 'Active layers chip must exist');
assert.ok(indexHtml.includes('id="telemetryEntityCount"'), 'Entity counter chip must exist');
assert.ok(indexHtml.includes('id="solarFluxVal"'), 'Solar flux chip must exist');
assert.ok(indexHtml.includes('id="osirisSubRibbon"'), 'Operational sub-ribbon must exist');
console.log('✓ Passed: OSIRIS header telemetry markup verified');

// 2. Verify Floating Bottom-Left 3D/2D and Map/Sat Controls in index.html
console.log('Test 2: Verifying OSIRIS floating map controls pill...');
assert.ok(indexHtml.includes('id="osirisBottomLeftWidget"'), 'Bottom-left widget must exist');
assert.ok(indexHtml.includes('id="btnOsiris3D"'), '3D button must exist');
assert.ok(indexHtml.includes('id="btnOsiris2D"'), '2D button must exist');
assert.ok(indexHtml.includes('id="btnOsirisMap"'), 'Vector Map button must exist');
assert.ok(indexHtml.includes('id="btnOsirisSat"'), 'Satellite button must exist');
assert.ok(indexHtml.includes('id="osirisScalePill"'), 'Scale pill must exist');
console.log('✓ Passed: OSIRIS floating map controls markup verified');

// 3. Verify Right-Side Floating Tactical Actions Rail & Tactical Controls
console.log('Test 3: Verifying OSIRIS tactical actions & controls...');
assert.ok(indexHtml.includes('id="osirisRightRail"'), 'Right rail container must exist');
assert.ok(indexHtml.includes('resetMapNorth()'), 'Compass/North reset action must exist');
assert.ok(indexHtml.includes('toggle3DView') || indexHtml.includes('toggleTerrainElevation()'), '3D terrain control must exist');
assert.ok(indexHtml.includes('toggleDayNightCycle()'), 'Day/night cycle toggle must exist');
assert.ok(indexHtml.includes('focusKosovoBounds()'), 'Focus Kosovo action must exist');
console.log('✓ Passed: OSIRIS tactical actions & controls markup verified');

// 4. Verify Bottom Status & Telemetry Bar
console.log('Test 4: Verifying bottom status coordinates and telemetry...');
assert.ok(indexHtml.includes('id="telemetryCursor"'), 'Cursor coordinate display must exist');
assert.ok(indexHtml.includes('id="telemetryLocation"'), 'Location label display must exist');
assert.ok(indexHtml.includes('id="telemetryZoom"'), 'Zoom level display must exist');
assert.ok(indexHtml.includes('class="telemetry-online-badge"'), 'Online badge must exist');
console.log('✓ Passed: Bottom status bar verified');

// 5. Verify 3D Terrain & Buildings in app.js
console.log('Test 5: Verifying 3D terrain and 3D buildings logic in app.js...');
assert.ok(appJs.includes('terrain-dem'), 'raster-dem terrain source defined in app.js');
assert.ok(appJs.includes('elevation-tiles-prod/terrarium'), 'AWS Terrarium DEM tiles referenced');
assert.ok(appJs.includes('3d-buildings'), '3d-buildings extrusion layer defined in app.js');
assert.ok(appJs.includes('window.toggle3DView = function'), 'toggle3DView function implemented');
assert.ok(appJs.includes('map.setTerrain({ source: \'terrain-dem\''), 'setTerrain call present for 3D activation');
console.log('✓ Passed: 3D terrain & building extrusions logic verified');

// 6. Verify Solar Day/Night Terminator in app.js
console.log('Test 6: Verifying Day/Night cycle in app.js...');
assert.ok(appJs.includes('computeSolarTerminator'), 'computeSolarTerminator function implemented');
assert.ok(appJs.includes('daynight-terminator-layer'), 'daynight-terminator-layer defined');
assert.ok(appJs.includes('window.toggleDayNightCycle = function'), 'toggleDayNightCycle function implemented');
console.log('✓ Passed: Day/Night solar cycle verified');

// 7. Verify Military Aviation Classification in skills/aviation-monitor/skill.js
console.log('Test 7: Verifying military classification for KFOR, NATO, helicopters and UAVs...');
const kforTest = aviationSkill.classifyAircraft({ callsign: 'KFOR01', typeCode: 'UH60' });
assert.strictEqual(kforTest.category, 'military', 'KFOR helicopter must be categorized as military');
assert.strictEqual(kforTest.militaryRole, 'kfor', 'Role must be kfor');
assert.strictEqual(kforTest.subType, 'helicopter', 'Subtype must be helicopter');
assert.strictEqual(kforTest.isSpecialMilitary, true, 'isSpecialMilitary must be true');

const uavTest = aviationSkill.classifyAircraft({ callsign: 'REAPER01', typeCode: 'MQ9' });
assert.strictEqual(uavTest.category, 'military', 'MQ9 must be military');
assert.strictEqual(uavTest.subType, 'uav', 'Subtype must be uav');

const c130Test = aviationSkill.classifyAircraft({ callsign: 'HERKY55', typeCode: 'C130' });
assert.strictEqual(c130Test.category, 'military', 'C130 must be military');
assert.strictEqual(c130Test.subType, 'heavy', 'Subtype must be heavy');
console.log('✓ Passed: Military classification correctly identifies KFOR, rotary, UAV, and transport');

// 8. Verify Aviation Flight Trails in app.js
console.log('Test 8: Verifying aviation flight trails logic in app.js...');
assert.ok(appJs.includes('aviation-flight-trails-source'), 'Flight trails source defined');
assert.ok(appJs.includes('aviation-flight-trails-layer'), 'Flight trails layer defined');
assert.ok(appJs.includes('state.aviationTrails'), 'In-memory aviationTrails buffer maintained');
assert.ok(appJs.includes('countKfor'), 'countKfor element updated');
assert.ok(appJs.includes('countRotary'), 'countRotary element updated');
assert.ok(appJs.includes('countUav'), 'countUav element updated');
console.log('✓ Passed: Aviation flight trails buffer and military counters verified');

// 9. Verify CCTV Custom Stream Connect in app.js & index.html
console.log('Test 9: Verifying CCTV custom stream connection...');
assert.ok(indexHtml.includes('id="cctvCustomStreamInput"'), 'cctvCustomStreamInput exists in HTML');
assert.ok(appJs.includes('window.connectCustomCCTVStream = function'), 'connectCustomCCTVStream function defined in app.js');
console.log('✓ Passed: CCTV custom stream connection verified');

// 10. Verify CSS Styles for OSIRIS Theme & Tactical Animations
console.log('Test 10: Verifying OSIRIS CSS rules in style.css...');
assert.ok(styleCss.includes('.osiris-header-telemetry'), '.osiris-header-telemetry styled');
assert.ok(styleCss.includes('.osiris-bottom-left-widget'), '.osiris-bottom-left-widget styled');
assert.ok(styleCss.includes('.osiris-right-rail'), '.osiris-right-rail styled');
assert.ok(styleCss.includes('.telemetry-cursor-cluster'), '.telemetry-cursor-cluster styled');
assert.ok(styleCss.includes('.helicopter-rotor-spin'), '.helicopter-rotor-spin animation styled');
assert.ok(styleCss.includes('.pulse-kfor'), '.pulse-kfor radar pulse animation styled');
console.log('✓ Passed: OSIRIS styling and animations verified');

console.log('\n--- ALL OSIRIS 3D, DAY/NIGHT & AVIATION TESTS PASSED SUCCESSFULLY ---');
