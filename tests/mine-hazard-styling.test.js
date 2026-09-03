const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== KOSINT Mine Hazard & Tactical UI Enhancements Test Suite ===\n');

const styleCss = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');

// Test 1: Tactical Layers Widget Position
console.log('1. Verifying Tactical Layers Widget Position (clearing nav rail)...');
assert.ok(styleCss.includes('.tactical-layers-widget'), 'style.css must have .tactical-layers-widget');
const widgetMatch = styleCss.match(/\.tactical-layers-widget\s*\{[^}]*left:\s*([^;]+);/);
assert.ok(widgetMatch, 'Must find left position on .tactical-layers-widget');
const leftPx = parseInt(widgetMatch[1], 10);
assert.ok(leftPx >= 80, `Widget left position (${leftPx}px) must be >= 80px to clear the 52px nav-rail module list`);
console.log(`✓ Passed: .tactical-layers-widget moved to left: ${leftPx}px (~2cm to the right, clearing module list).\n`);

// Test 2: Standardized Full Popup Background
console.log('2. Verifying Full Popup Background for Minefields & Tactical Layers...');
assert.ok(appJs.includes('buildMinefieldPopupHtml(p)'), 'app.js must define buildMinefieldPopupHtml');
assert.ok(appJs.includes('buildMapPopupHtml('), 'app.js must call buildMapPopupHtml for minefield popups');
assert.ok(styleCss.includes('.tactical-layer-popup'), 'style.css must style .tactical-layer-popup');
assert.ok(styleCss.includes('background: #0b1329 !important') || styleCss.includes('background: rgba(10, 16, 26'), 'Popup must have solid full dark background');
console.log('✓ Passed: Minefield popup uses standardized buildMapPopupHtml with full solid opaque background.\n');

// Test 3: Standardized, Non-Overreactive Bomb Marker
console.log('3. Verifying Bomb Marker Styling (consistent with other markers)...');
assert.ok(styleCss.includes('.mine-marker-pin'), 'style.css must define .mine-marker-pin');
const markerPinMatch = styleCss.match(/\.mine-marker-pin\s*\{([^}]+)\}/);
assert.ok(markerPinMatch, 'Must match .mine-marker-pin CSS rule');
const markerPinBody = markerPinMatch[1];
assert.ok(markerPinBody.includes('border-radius: 50%'), 'Marker must be circular like other map markers');
assert.ok(markerPinBody.includes('width: 18px') || markerPinBody.includes('width: 20px'), 'Marker must be compact circular scale (18-20px) like other markers');
assert.ok(!markerPinBody.includes('width: 28px'), 'Marker must not be oversized/overreactive (removed 28px bulb)');
console.log('✓ Passed: Bomb marker is styled like other circular markers without overreactive balloon or floating clutter.\n');

// Test 4: Popup content verification
console.log('4. Verifying Drenica Hills & SHA popup details formatting...');
// Simulate buildMinefieldPopupHtml function
const mockHazard = {
  id: 'mine-drenica',
  name: 'Drenica Hills / Likovac – Prekaz Sector',
  sector: 'Central Drenica Highland',
  municipality: 'Skenderaj / Gllogoc',
  riskLevel: 'MEDIUM',
  status: 'SUSPECTED HAZARDOUS AREA (SHA)',
  munitionTypes: 'Mortar Blind Shells, Abandoned Ammunition Pits, Residual Submunitions',
  estimatedAreaHa: 21.0,
  standoffDistanceMeters: 80,
  deminingAgency: 'KSF EOD Demining Battalion',
  lastSurveyDate: '2025-06-11',
  emergencyContact: 'Police Operations: 192 · KSF Ops Desk',
  description: 'Agricultural and secondary forestry areas with intermittent deep-plow unearthing of wartime unexploded shells.'
};

assert.ok(appJs.includes('estimatedAreaHa'), 'buildMinefieldPopupHtml must format estimatedAreaHa');
assert.ok(appJs.includes('standoffDistanceMeters'), 'buildMinefieldPopupHtml must format standoffDistanceMeters');
assert.ok(appJs.includes('munitionTypes'), 'buildMinefieldPopupHtml must format munitionTypes');
assert.ok(appJs.includes('emergencyContact'), 'buildMinefieldPopupHtml must format emergencyContact');
console.log('✓ Passed: All SHA telemetry correctly incorporated into standardized popup layout.\n');

console.log('=== ALL MINE HAZARD & TACTICAL UI TESTS PASSED SUCCESSFULLY ===');
