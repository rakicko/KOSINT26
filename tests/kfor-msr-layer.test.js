'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Starting KFOR Main Supply Routes (MSR) Layer Tests ---');

const opZonesContent = fs.readFileSync(path.join(__dirname, '../public/operational-zones.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');

// Test 1: Verify KFOR_MSR_ROUTES_GEOJSON in operational-zones.js
console.log('Test 1: Verifying KFOR_MSR_ROUTES_GEOJSON dataset...');
assert.ok(opZonesContent.includes('export const KFOR_MSR_ROUTES_GEOJSON = {'), 'Must export KFOR_MSR_ROUTES_GEOJSON');
assert.ok(opZonesContent.includes("callsign: 'MSR BULL'"), 'Must define MSR BULL');
assert.ok(opZonesContent.includes("callsign: 'MSR HAWK'"), 'Must define MSR HAWK');
assert.ok(opZonesContent.includes("callsign: 'MSR DOG'"), 'Must define MSR DOG');
assert.ok(opZonesContent.includes("callsign: 'MSR LION'"), 'Must define MSR LION');
assert.ok(opZonesContent.includes("callsign: 'ROUTE FOX'"), 'Must define ROUTE FOX');
assert.ok(opZonesContent.includes("civilianRoute: 'Magistralni put M-22.3'"), 'Must have civilian route M-22.3 for MSR BULL');
console.log('✓ Passed: KFOR MSR routes defined with full tactical telemetry and callsigns');

// Test 2: Verify HTML toggle in index.html
console.log('Test 2: Verifying tactical layers menu toggle in index.html...');
assert.ok(indexHtml.includes('id="toggleLayerMsr"'), 'index.html must have #toggleLayerMsr');
assert.ok(indexHtml.includes('KFOR Main Supply Routes (MSR)'), 'index.html must have KFOR Main Supply Routes (MSR) label');
assert.ok(indexHtml.includes('indicator-msr'), 'index.html must have indicator-msr');
console.log('✓ Passed: MSR layer toggle present in Tactical Layers Menu');

// Test 3: Verify app.js integration and popup logic
console.log('Test 3: Verifying app.js MSR layer handlers and markers...');
assert.ok(appJs.includes('KFOR_MSR_ROUTES_GEOJSON'), 'app.js must import KFOR_MSR_ROUTES_GEOJSON');
assert.ok(appJs.includes('renderTacticalMsrMarkers'), 'app.js must define renderTacticalMsrMarkers');
assert.ok(appJs.includes('buildMsrPopupHtml'), 'app.js must define buildMsrPopupHtml');
assert.ok(appJs.includes("layerGroup === 'msr'"), 'toggleTacticalLayer must handle msr');
assert.ok(appJs.includes("['earthquake', 'radiation', 'mines', 'weather', 'aqi', 'msr'].includes(mod)"), 'clearAllModuleLayers must preserve msr');
console.log('✓ Passed: app.js hooks, event handlers, and popup builders verified');

// Test 4: Verify CSS rules in style.css
console.log('Test 4: Verifying CSS styling in style.css...');
assert.ok(styleCss.includes('.indicator-msr'), 'style.css must define .indicator-msr');
assert.ok(styleCss.includes('.badge-msr'), 'style.css must define .badge-msr');
assert.ok(styleCss.includes('.msr-badge-marker'), 'style.css must define .msr-badge-marker');
console.log('✓ Passed: MSR indicator, badge, and map marker styles verified');

console.log('--- ALL KFOR MSR LAYER TESTS PASSED SUCCESSFULLY ---');
