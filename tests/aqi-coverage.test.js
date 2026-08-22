'use strict';

const assert = require('assert');
const { fetchAQI } = require('../skills/aqi-monitor/skill');

console.log('--- Starting Air Quality Coverage Verification Tests ---');

async function runTests() {
  console.log('Test 1: Fetching live AQI data from Open-Meteo & CAMS for Kosovo...');
  const res = await fetchAQI({ location: 'Kosovo', lat: 42.6026, lon: 20.9030 });

  assert.strictEqual(res.status, 'LIVE_DATA', 'Status must be LIVE_DATA');
  assert.strictEqual(res.source, 'Open-Meteo & CAMS', 'Data source must be Open-Meteo & CAMS');
  assert.ok(Array.isArray(res.stations), 'Payload must contain stations array');

  console.log(`✓ Data Source: ${res.source}`);
  console.log(`✓ Stations count: ${res.stations.length}`);

  const expectedCities = ['Prishtinë', 'Mitrovicë', 'Prizren', 'Pejë', 'Gjilan', 'Ferizaj', 'Gjakovë', 'Podujevë'];
  
  expectedCities.forEach(cityName => {
    const station = res.stations.find(s => s.name === cityName);
    assert.ok(station, `Station ${cityName} must exist in payload`);
    assert.strictEqual(typeof station.coordinates.lat, 'number', `${cityName} lat must be valid number`);
    assert.strictEqual(typeof station.coordinates.lon, 'number', `${cityName} lon must be valid number`);
    assert.strictEqual(typeof station.current.europeanAQI, 'number', `${cityName} EAQI must be valid number`);
    assert.ok(Number.isFinite(station.current.pm2_5), `${cityName} PM2.5 must be valid number`);
    assert.ok(Number.isFinite(station.current.pm10), `${cityName} PM10 must be valid number`);
    console.log(`  ✓ ${cityName} -> EAQI: ${station.current.europeanAQI} (${station.current.label}), PM2.5: ${station.current.pm2_5} µg/m³`);
  });

  console.log('✓ Passed: All 8 Kosovo cities provide valid, real-time AQI data without fabrication');
  console.log('--- ALL AIR QUALITY COVERAGE TESTS PASSED SUCCESSFULLY ---');
}

runTests().catch(err => {
  console.error('Test FAILED:', err);
  process.exit(1);
});
