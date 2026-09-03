'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { resolveWildfireLocation, parseCsvFires } = require('../skills/wildfire-monitor/skill');

console.log('--- Starting Wildfire Reverse Geocoding & Geographic Formatting Tests ---');

// Test 1: Test user-specified coordinates
console.log('Test 1: Verifying exact coordinates from user prompt...');

const negotinTest = resolveWildfireLocation(44.3065, 22.4747);
console.log('  Negotin / Serbia detection:', negotinTest);
assert.strictEqual(negotinTest.country, 'Serbia', 'Must resolve to Serbia');
assert.ok(negotinTest.place.includes('Negotin') || negotinTest.place.includes('Bor'), 'Must identify Negotin / Bor area');

const albaniaTest1 = resolveWildfireLocation(41.6075, 19.8613);
console.log('  Albania detection #1:', albaniaTest1);
assert.strictEqual(albaniaTest1.country, 'Albania', 'Must resolve to Albania');
assert.ok(albaniaTest1.place.includes('Burrel') || albaniaTest1.place.includes('Mat'), 'Must identify Burrel / Mat area');

const albaniaTest2 = resolveWildfireLocation(41.6136, 19.8592);
console.log('  Albania detection #2:', albaniaTest2);
assert.strictEqual(albaniaTest2.country, 'Albania', 'Must resolve to Albania');

const kosovoTest = resolveWildfireLocation(42.7481, 20.7892);
console.log('  Kosovo detection:', kosovoTest);
assert.strictEqual(kosovoTest.country, 'Kosovo', 'Must resolve to Kosovo');
assert.ok(kosovoTest.place.includes('Skenderaj') || kosovoTest.place.includes('Drenica'), 'Must identify Skenderaj / Drenica');

console.log('✓ Passed: User coordinates correctly resolved to human-readable place and country');

// Test 2: Verify parseCsvFires attaches place, country, and locationLabel
console.log('Test 2: Verifying parseCsvFires attaches place and country fields...');
const sampleCsv = `latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
44.3065,22.4747,344.2,1.0,1.0,2026-09-03,0000,T,MODIS,93,6.1NRT,300.0,82.3,N
41.6075,19.8613,367.0,0.4,0.4,2026-09-03,0122,N,VIIRS,90,2.0NRT,295.0,7.5,N`;

const parsed = parseCsvFires(sampleCsv, 'NASA FIRMS');
assert.strictEqual(parsed.length, 2, 'Must parse 2 detections');
assert.strictEqual(parsed[0].country, 'Serbia');
assert.ok(parsed[0].place.includes('Negotin') || parsed[0].place.includes('Bor'));
assert.strictEqual(parsed[0].locationLabel, `${parsed[0].place}, ${parsed[0].country}`);

assert.strictEqual(parsed[1].country, 'Albania');
assert.ok(parsed[1].place.includes('Burrel') || parsed[1].place.includes('Mat'));
assert.strictEqual(parsed[1].locationLabel, `${parsed[1].place}, ${parsed[1].country}`);
console.log('✓ Passed: parseCsvFires automatically enriches detections with place, country, and locationLabel');

// Test 3: Check app.js renderWildfire template contains location row & country badge
console.log('Test 3: Verifying app.js and style.css markup for wildfire location displays...');
const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');

assert.strictEqual(appJs.includes('wildfire-location-row'), true, 'app.js must render wildfire-location-row');
assert.strictEqual(appJs.includes('wildfire-place-name'), true, 'app.js must render wildfire-place-name');
assert.strictEqual(appJs.includes('wildfire-country-badge'), true, 'app.js must render wildfire-country-badge');
assert.strictEqual(styleCss.includes('.wildfire-location-row'), true, 'style.css must style .wildfire-location-row');
assert.strictEqual(styleCss.includes('.wildfire-country-badge'), true, 'style.css must style .wildfire-country-badge');

console.log('✓ Passed: UI markup and styling support rich wildfire place and country badges');
console.log('--- ALL WILDFIRE GEOCODING TESTS PASSED SUCCESSFULLY ---');
