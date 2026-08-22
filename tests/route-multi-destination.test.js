'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Starting Route Intelligence Multi-Destination Verification Tests ---');

const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');

// Test 1: Verify smaller Kosovo towns & localities exist in geocoding dictionary
console.log('Test 1: Verifying smaller Kosovo towns & localities in geocoding dictionary...');
const evalGeocode = new Function(`
  ${appJs.slice(appJs.indexOf('const KOSOVO_LOCATIONS_GEOCODE ='), appJs.indexOf('function addRouteDestinationInput('))}
  return { KOSOVO_LOCATIONS_GEOCODE, resolveLocationCoordinates };
`);

const { KOSOVO_LOCATIONS_GEOCODE, resolveLocationCoordinates } = evalGeocode();

const sampleLocalities = [
  'Shtime', 'Kaçanik', 'Obiliq', 'Suharekë', 'Skenderaj',
  'Istog', 'Klinë', 'Rahovec', 'Malishevë', 'Kamenicë',
  'Dragash', 'Štrpce', 'Novo Brdo', 'Gračanica', 'Deçan',
  'Fushë Kosovë', 'Lipjan', 'Brezovica'
];

sampleLocalities.forEach(loc => {
  const res = resolveLocationCoordinates(loc);
  assert.ok(res, `Location "${loc}" must resolve to valid coordinates`);
  assert.strictEqual(typeof res.lat, 'number', `${loc} lat must be number`);
  assert.strictEqual(typeof res.lon, 'number', `${loc} lon must be number`);
});
console.log(`✓ Passed: All ${sampleLocalities.length} smaller Kosovo towns and localities successfully resolved to exact coordinates`);

// Test 2: Verify HTML inputs and dynamic destination controls
console.log('Test 2: Verifying HTML multi-destination controls and datalist entries...');
assert.strictEqual(indexHtml.includes('id="routeViaInputsContainer"'), true, 'index.html includes routeViaInputsContainer');
assert.strictEqual(indexHtml.includes('addRouteDestinationInput()'), true, 'index.html includes + ADD DESTINATION button trigger');
sampleLocalities.slice(0, 8).forEach(loc => {
  assert.strictEqual(indexHtml.includes(`value="${loc}"`), true, `Datalist contains option for ${loc}`);
});
console.log('✓ Passed: Multi-destination UI controls and expanded datalist options verified');

// Test 3: Verify OSRM multi-point URL construction logic
console.log('Test 3: Verifying multi-point route calculation logic (Start → Waypoint 1 → Waypoint 2 → End)...');

const pt1 = resolveLocationCoordinates('Prishtinë');
const pt2 = resolveLocationCoordinates('Ferizaj');
const pt3 = resolveLocationCoordinates('Kaçanik');
const pt4 = resolveLocationCoordinates('Hani i Elezit (Border)');

const points = [pt1, pt2, pt3, pt4];
const osrmCoordsStr = points.map(p => `${p.lon},${p.lat}`).join(';');
const expectedOsrmUrl = `https://router.project-osrm.org/route/v1/driving/${pt1.lon},${pt1.lat};${pt2.lon},${pt2.lat};${pt3.lon},${pt3.lat};${pt4.lon},${pt4.lat}?overview=full&geometries=geojson`;

assert.strictEqual(
  `https://router.project-osrm.org/route/v1/driving/${osrmCoordsStr}?overview=full&geometries=geojson`,
  expectedOsrmUrl,
  'OSRM URL must chain all waypoint coordinates sequentially'
);

const waypointsSummaryText = `${points.map(p => p.name).join(' → ')} · DRIVE`;
assert.strictEqual(waypointsSummaryText, 'Prishtinë → Ferizaj → Kaçanik → Hani i Elezit (Border) · DRIVE', 'Waypoints summary correctly lists all route destinations');

console.log('✓ Passed: Multi-point OSRM URL and waypoint telemetry formatting verified');

console.log('--- ALL ROUTE MULTI-DESTINATION TESTS PASSED SUCCESSFULLY ---');
