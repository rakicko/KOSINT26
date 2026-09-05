'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Starting Style Studio & Reorganized Map Controls Verification ---');

const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');

// Test 1: Reorganized Bottom-Left Widget Order
console.log('Test 1: Verifying bottom-left widget structure and button sequence...');
const widgetMatch = indexHtml.match(/<div class="osiris-bottom-left-widget" id="osirisBottomLeftWidget">([\s\S]*?)<\/div>\s*<!-- ── OSIRIS Right-Side/);
assert.ok(widgetMatch, 'osirisBottomLeftWidget must be present');
const widgetContent = widgetMatch[1];

const idx3D = widgetContent.indexOf('id="btnOsiris3D"');
const idx2D = widgetContent.indexOf('id="btnOsiris2D"');
const idxDayNight = widgetContent.indexOf('id="btnToggleDayNightCycle"');
const idxResetNorth = widgetContent.indexOf('id="btnOsirisResetNorth"');
const idxMap = widgetContent.indexOf('id="btnOsirisMap"');
const idxSat = widgetContent.indexOf('id="btnOsirisSat"');
const idxScale = widgetContent.indexOf('id="osirisScalePill"');

assert.ok(idx3D !== -1 && idx2D !== -1, '3D and 2D buttons must be present in widget');
assert.ok(idxDayNight !== -1, 'Day/Night button must be present in widget');
assert.ok(idxResetNorth !== -1, 'Reset North compass button must be present in widget');
assert.ok(idxMap !== -1 && idxSat !== -1, 'MAP and SAT buttons must be present in widget');
assert.ok(idxScale !== -1, 'Scale indicator must be present in widget');

// Verify exact ordering requested: 3D/2D -> Day/Night -> Reset Compass -> MAP/SAT -> Scale
assert.ok(idx2D < idxDayNight, '2D must precede Day/Night');
assert.ok(idxDayNight < idxResetNorth, 'Day/Night must precede Reset North');
assert.ok(idxResetNorth < idxMap, 'Reset North must precede MAP/SAT (between 2D/3D and MAP/SAT)');
assert.ok(idxMap < idxSat, 'MAP must precede SAT');
assert.ok(idxSat < idxScale, 'MAP/SAT must precede Scale');
console.log('✓ Passed: Bottom-left map controls sequence exactly matches user specifications');

// Test 2: Redundant 3D DEM Terrain Elevation Button Removal
console.log('Test 2: Verifying removal of redundant 3D DEM button in right rail...');
const rightRailMatch = indexHtml.match(/<div class="osiris-right-rail" id="osirisRightRail">([\s\S]*?)<\/div>/);
assert.ok(rightRailMatch, 'osirisRightRail must be present');
assert.strictEqual(rightRailMatch[1].includes('id="btnToggleTerrainElevation"'), false, 'btnToggleTerrainElevation must NOT be in right rail');
console.log('✓ Passed: Redundant 3D DEM terrain button successfully removed');

// Test 3: Telemetry Shortcuts Hint Removal
console.log('Test 3: Verifying removal of shortcuts hint text from footer right...');
assert.strictEqual(indexHtml.includes('Press ? for shortcuts'), false, 'Shortcuts hint text must be completely removed');
console.log('✓ Passed: Shortcuts hint text removed from footer telemetry');

// Test 4: Style Studio UI Structure in index.html
console.log('Test 4: Verifying Style Studio markup in System Settings...');
assert.strictEqual(indexHtml.includes('Style Studio'), true, 'Must display Style Studio heading');
assert.strictEqual(indexHtml.includes('Live UI tokens'), true, 'Must display Live UI tokens sub-heading');

// Presets
['HORUS', 'PHANTOM', 'TERMINAL', 'CRIMSON', 'ARCTIC', 'BLACKOUT'].forEach(preset => {
  assert.strictEqual(indexHtml.includes(`data-preset="${preset}"`), true, `Must have preset button ${preset}`);
});

// Accent & Signal tokens
assert.strictEqual(indexHtml.includes('id="studioAccentPrimary"'), true, 'Must have primary accent picker');
assert.strictEqual(indexHtml.includes('id="studioAccentSecondary"'), true, 'Must have secondary accent picker');
assert.strictEqual(indexHtml.includes('id="studioSignalCritical"'), true, 'Must have critical signal picker');
assert.strictEqual(indexHtml.includes('id="studioSignalWarning"'), true, 'Must have warning signal picker');
assert.strictEqual(indexHtml.includes('id="studioSignalNominal"'), true, 'Must have nominal signal picker');
assert.strictEqual(indexHtml.includes('id="studioSignalInfo"'), true, 'Must have info signal picker');

// Map controls
assert.strictEqual(indexHtml.includes('Pan/zoom pad'), true, 'Must have pan/zoom pad control');
assert.strictEqual(indexHtml.includes('id="osirisPanZoomPad"'), true, 'Must have virtual pan/zoom pad container on map');

// Map layers (Cameras, Satellites, Aircraft)
assert.strictEqual(indexHtml.includes('id="studioLayerCameras"'), true, 'Must have cameras color picker');
assert.strictEqual(indexHtml.includes('id="studioSatComms"'), true, 'Must have satellite comms picker');
assert.strictEqual(indexHtml.includes('id="studioSatMilitary"'), true, 'Must have satellite military picker');
assert.strictEqual(indexHtml.includes('id="studioPlaneCivil"'), true, 'Must have plane civil picker');
assert.strictEqual(indexHtml.includes('id="studioPlaneMil"'), true, 'Must have plane military picker');

// Surface & Text & Typography & Motion & FX
assert.strictEqual(indexHtml.includes('id="studioSurfaceBg"'), true, 'Must have surface bg picker');
assert.strictEqual(indexHtml.includes('id="studioTextPrimary"'), true, 'Must have text primary picker');
assert.strictEqual(indexHtml.includes('INTER'), true, 'Must have INTER font option');
assert.strictEqual(indexHtml.includes('JETBRAINS'), true, 'Must have JETBRAINS mono font option');
assert.strictEqual(indexHtml.includes('Scanlines'), true, 'Must have scanlines control');
assert.strictEqual(indexHtml.includes('Grain'), true, 'Must have grain control');
assert.strictEqual(indexHtml.includes('Vignette'), true, 'Must have vignette control');
assert.strictEqual(indexHtml.includes('id="styleStudioScanlines"'), true, 'Must have scanlines overlay in DOM');
assert.strictEqual(indexHtml.includes('id="styleStudioGrain"'), true, 'Must have grain overlay in DOM');
assert.strictEqual(indexHtml.includes('id="styleStudioVignette"'), true, 'Must have vignette overlay in DOM');
console.log('✓ Passed: All Style Studio UI sections and elements verified in index.html');

// Test 5: StyleStudio JavaScript Logic and Persistence
console.log('Test 5: Verifying StyleStudio logic in app.js...');
assert.strictEqual(appJs.includes('const STYLE_STUDIO_PRESETS'), true, 'STYLE_STUDIO_PRESETS defined');
assert.strictEqual(appJs.includes('const StyleStudio'), true, 'StyleStudio object defined');
assert.strictEqual(appJs.includes('window.StyleStudio = StyleStudio;'), true, 'StyleStudio exported on window');
assert.strictEqual(appJs.includes('localStorage.setItem(\'kosint_style_studio_tokens\''), true, 'Local storage saving configured');
console.log('✓ Passed: StyleStudio JavaScript logic, presets and storage verified');

// Test 6: CSS styling for Pan/Zoom Pad and Style Studio
console.log('Test 6: Verifying CSS classes in style.css...');
assert.strictEqual(styleCss.includes('.style-studio-box'), true, '.style-studio-box styled');
assert.strictEqual(styleCss.includes('.style-studio-scanlines'), true, '.style-studio-scanlines styled');
assert.strictEqual(styleCss.includes('.style-studio-grain'), true, '.style-studio-grain styled');
assert.strictEqual(styleCss.includes('.style-studio-vignette'), true, '.style-studio-vignette styled');
assert.strictEqual(styleCss.includes('.osiris-pan-pad'), true, '.osiris-pan-pad styled');
console.log('✓ Passed: CSS rules for Style Studio and overlays verified');

console.log('\n--- ALL STYLE STUDIO & MAP CONTROLS TESTS PASSED SUCCESSFULLY ---');
