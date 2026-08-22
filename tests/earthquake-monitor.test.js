'use strict';

const assert = require('assert');
const { fetchEarthquakes } = require('../skills/earthquake-monitor/skill');

console.log('--- Starting Seismic Activity (Earthquake Monitor) Verification Tests ---');

async function runTests() {
  console.log('Test 1: Fetching live seismic data from EMSC for Kosovo region...');
  const res = await fetchEarthquakes({ location: 'Kosovo', lat: 42.6026, lon: 20.9030 });

  assert.strictEqual(res.skill, 'earthquake-monitor', 'Skill name must be earthquake-monitor');
  assert.strictEqual(res.source, 'EMSC', 'Data source must be EMSC (European-Mediterranean Seismological Centre)');
  assert.ok(Array.isArray(res.earthquakes), 'Payload must contain earthquakes array');
  assert.ok(res.earthquakes.length > 0, 'Must return real recent regional earthquakes from EMSC');

  console.log(`✓ Data Source: ${res.source}`);
  console.log(`✓ Real Earthquakes Count: ${res.earthquakes.length}`);
  console.log(`✓ Max Magnitude: M${res.summary.maxMagnitude}`);

  res.earthquakes.slice(0, 5).forEach((eq, idx) => {
    assert.strictEqual(typeof eq.magnitude, 'number', 'Magnitude must be number');
    assert.strictEqual(typeof eq.lat, 'number', 'Latitude must be number');
    assert.strictEqual(typeof eq.lon, 'number', 'Longitude must be number');
    assert.ok(eq.place && eq.place !== 'Unknown', 'Place name must be specified');
    console.log(`  ✓ #${idx + 1}: M${eq.magnitude} — ${eq.place} (${eq.distanceKm} km away, ${eq.time})`);
  });

  console.log('✓ Passed: EMSC integration returns real, verified regional seismic telemetry without fake demo fallback');
  console.log('--- ALL SEISMIC ACTIVITY TESTS PASSED SUCCESSFULLY ---');
}

runTests().catch(err => {
  console.error('Test FAILED:', err);
  process.exit(1);
});
