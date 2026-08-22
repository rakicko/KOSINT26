'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Starting News Intelligence Location Pipeline Verification Tests ---');

// Mock browser globals for app.js loading
global.window = global;
global.document = {
  getElementById: () => ({ style: {}, classList: { add: () => {}, remove: () => {}, contains: () => false }, querySelectorAll: () => [] }),
  querySelectorAll: () => [],
  createElement: () => ({ style: {}, classList: { add: () => {}, remove: () => {}, contains: () => false }, appendChild: (c) => c, setAttribute: () => {} })
};
global.maplibregl = {
  Marker: function() { this.setLngLat = function() { return this; }; this.addTo = function() { return this; }; },
  Popup: function() { this.setHTML = function() { return this; }; this.addTo = function() { return this; }; }
};

const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');

// Load extractNewsLocation and cleanTextForNewsLocation from app.js using VM or Function scope
const locationExtractor = new Function(
  `
  ${appJs.slice(appJs.indexOf('function cleanTextForNewsLocation('), appJs.indexOf('function ensureTrafficIncidentLocations('))}
  return { extractNewsLocation, cleanTextForNewsLocation, KOSOVO_LOCATIONS };
  `
)();

const { extractNewsLocation, cleanTextForNewsLocation, KOSOVO_LOCATIONS } = locationExtractor;

// 1. Test: News item with explicit coordinates
console.log('Test 1: News item with explicit coordinates...');
const itemExplicit1 = {
  title: 'General security update',
  description: 'Incident reported in border region',
  location: { city: 'Custom Spot', lat: 42.5000, lon: 20.5000 }
};
const loc1 = extractNewsLocation(itemExplicit1);
assert.notStrictEqual(loc1, null, 'Explicit location must be extracted');
assert.strictEqual(loc1.lat, 42.5000, 'Explicit lat must match');
assert.strictEqual(loc1.lon, 20.5000, 'Explicit lon must match');
assert.strictEqual(loc1.city, 'Custom Spot', 'Explicit city must match');

const itemExplicit2 = {
  title: 'Direct coordinates item',
  lat: 42.7000,
  lon: 21.0000,
  city: 'Test Location'
};
const loc2 = extractNewsLocation(itemExplicit2);
assert.strictEqual(loc2.lat, 42.7000, 'Direct lat must match');
assert.strictEqual(loc2.lon, 21.0000, 'Direct lon must match');
console.log('✓ Passed: Explicit coordinates take precedence and are correctly extracted');

// 2. Test: Kosovo city mentioned in Albanian
console.log('Test 2: Kosovo city mentioned in Albanian...');
const itemAlbanian1 = {
  title: 'Policia e Kosovës kryen aksion në Deçan',
  description: 'Gjatë kontrollit në Deçan janë konfiskuar pajisje me vlerë.',
  source: 'Gazeta Express'
};
const locAlb1 = extractNewsLocation(itemAlbanian1);
assert.notStrictEqual(locAlb1, null, 'Deçan location must be found');
assert.strictEqual(locAlb1.city, 'Deçan', 'City name must be Deçan');
assert.strictEqual(locAlb1.lat, 42.5410, 'Deçan lat must match');
assert.strictEqual(locAlb1.lon, 20.2880, 'Deçan lon must match');

const itemAlbanian2 = {
  title: 'Rritje e qarkullimit të veturave në Prishtinë',
  description: 'Sot në Prishtinë u shënua fluks i lartë trafiku.',
  source: 'Lajmi'
};
const locAlb2 = extractNewsLocation(itemAlbanian2);
assert.strictEqual(locAlb2.city, 'Prishtinë', 'City must be Prishtinë');
console.log('✓ Passed: Albanian place names correctly recognized');

// 3. Test: Kosovo city mentioned in Serbian
console.log('Test 3: Kosovo city mentioned in Serbian...');
const itemSerbian1 = {
  title: 'Incident zabeležen u Zvečanu',
  description: 'Policijska patrola obavila uviđaj u Zvečanu.',
  source: 'KoSSev'
};
const locSr1 = extractNewsLocation(itemSerbian1);
assert.notStrictEqual(locSr1, null, 'Zvečan location must be found');
assert.strictEqual(locSr1.city, 'Zveçan', 'City name must be Zveçan');
assert.strictEqual(locSr1.lat, 42.9080, 'Zvečan lat must be 42.9080 (distinct from Mitrovica)');
assert.strictEqual(locSr1.lon, 20.8400, 'Zvečan lon must be 20.8400');

const itemSerbian2 = {
  title: 'Saobraćajna nezgoda u Peći',
  description: 'Dva vozila su se sudarila u blizini centra u Peći.',
  source: 'Radio Mitrovica Sever'
};
const locSr2 = extractNewsLocation(itemSerbian2);
assert.strictEqual(locSr2.city, 'Pejë', 'Peć must map to Pejë coordinates');
assert.strictEqual(locSr2.lat, 42.6593, 'Peć lat must match Pejë');
console.log('✓ Passed: Serbian place names correctly recognized');

// 4. Test: Ambiguous / unresolved location (should return null)
console.log('Test 4: Ambiguous / unresolved location...');
const itemAmbiguous = {
  title: 'Bisedimet në Bruksel vazhdojnë javën e ardhshme',
  description: 'Delegacionet diskutuan për marrëveshjet ekonomike dhe tregtare pa detaje të tjera.',
  source: 'Klan Kosova'
};
const locAmb = extractNewsLocation(itemAmbiguous);
assert.strictEqual(locAmb, null, 'Articles without a clear Kosovo location must return null');
console.log('✓ Passed: Unresolved location returns null (no arbitrary coordinates)');

// 5. Test: Article that should NOT receive a marker
console.log('Test 5: Verifying article without location receives no marker...');
const itemNoMarker = {
  title: 'Analizë mbi zhvillimet ekonomike rajonale',
  description: 'Ekspertët diskutojnë normat e interesit dhe inflacionin.',
  source: 'Indeks Online'
};
const locNoMarker = extractNewsLocation(itemNoMarker);
assert.strictEqual(locNoMarker, null, 'Must be null so renderNewsMapMarkers does not place a marker');
console.log('✓ Passed: Article without location receives no marker');

// 6. Test: RSS source name cleaning to prevent false positive matching
console.log('Test 6: Verifying RSS publisher name does not contaminate location matching...');
const itemPublisherText = {
  title: 'Konferencë për media lidhur me punimet në Pejë',
  description: 'Publikuar nga Radio Mitrovica Sever — Raport i ri mbi infrastrukturën në Pejë.',
  source: 'Radio Mitrovica Sever'
};
const locPub = extractNewsLocation(itemPublisherText);
assert.strictEqual(locPub.city, 'Pejë', 'Article about Peja must map to Pejë, not Mitrovicë');
assert.strictEqual(locPub.lat, 42.6593, 'Coordinates must be Pejë lat');
console.log('✓ Passed: Source branding stripped; article mapped to actual location (Pejë)');

// 7. Test: Zveçan vs Mitrovicë distinction
console.log('Test 7: Verifying Zveçan has distinct coordinates from Mitrovicë...');
const itemZvecan = {
  title: 'Bastisje në Banjskë të Zveçanit',
  description: 'Njësitë policore kontrolluan një lokacion në Banjskë.',
  source: 'Mitropol'
};
const itemMitrovica = {
  title: 'Ngjarje te Ura e Ibrit në Mitrovicë',
  description: 'Patrulla te ura kryesore në Mitrovicë.',
  source: 'Mitropol'
};
const locZ = extractNewsLocation(itemZvecan);
const locM = extractNewsLocation(itemMitrovica);
assert.strictEqual(locZ.city, 'Zveçan', 'Zveçan item must resolve to Zveçan');
assert.strictEqual(locM.city, 'Mitrovicë', 'Mitrovicë item must resolve to Mitrovicë');
assert.notStrictEqual(locZ.lat, locM.lat, 'Zveçan lat must be distinct from Mitrovicë lat');
assert.notStrictEqual(locZ.lon, locM.lon, 'Zveçan lon must be distinct from Mitrovicë lon');
console.log('✓ Passed: Zveçan and Mitrovicë resolve to distinct geographic coordinates');

console.log('--- ALL 7 NEWS LOCATION PIPELINE TESTS PASSED SUCCESSFULLY ---');
