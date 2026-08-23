'use strict';
const assert = require('assert');
const skill = require('../skills/weather-monitor/skill');

console.log('─────────────────────────────────────────────────────────────────');
console.log('🧪 Starting Weather Monitor Caching & 429 Resilience Tests');
console.log('─────────────────────────────────────────────────────────────────\n');

// Mock response builder for Open-Meteo
function createMockOpenMeteoResponse(temp = 25) {
  return {
    status: 200,
    data: {
      current: {
        temperature_2m: temp,
        apparent_temperature: temp + 2,
        relative_humidity_2m: 55,
        wind_speed_10m: 14,
        wind_direction_10m: 180,
        precipitation: 0,
        weather_code: 0,
        visibility: 10000
      },
      hourly: {
        time: ['2026-08-23T12:00', '2026-08-23T13:00', '2026-08-23T14:00'],
        temperature_2m: [temp, temp + 1, temp + 2],
        precipitation: [0, 0, 0],
        weather_code: [0, 0, 1]
      }
    }
  };
}

(async () => {
  // ── Test 1: Cache Hit ──────────────────────────────────────────────────────────
  console.log('Test 1: Verifying cache hit on consecutive requests for the same location...');
  skill._resetWeatherCacheForTesting();

  let httpCallCount = 0;
  const mockHttpClient = {
    get: async (url, config) => {
      httpCallCount++;
      return createMockOpenMeteoResponse(27);
    }
  };

  // First call: should trigger HTTP request and cache response
  const res1 = await skill.fetchWeather({
    location: 'Prishtinë',
    lat: 42.6629,
    lon: 21.1655,
    _httpClient: mockHttpClient
  });

  assert.strictEqual(res1.source, 'open-meteo', 'Source must be open-meteo');
  assert.strictEqual(res1.current.temp, 27, 'Temperature must be 27');
  assert.strictEqual(res1.isCached, false, 'First call is fresh (isCached: false)');
  assert.strictEqual(httpCallCount, 1, 'HTTP request must be called exactly once');

  // Second call: should be served from memory cache without new HTTP request
  const res2 = await skill.fetchWeather({
    location: 'Prishtinë',
    lat: 42.6629,
    lon: 21.1655,
    _httpClient: mockHttpClient
  });

  assert.strictEqual(res2.source, 'open-meteo', 'Source must remain open-meteo');
  assert.strictEqual(res2.current.temp, 27, 'Cached temperature must be 27');
  assert.strictEqual(res2.isCached, true, 'Second call must be marked isCached: true');
  assert.strictEqual(httpCallCount, 1, 'HTTP request count must still be 1 (no new network call)');

  console.log('✓ Passed: Second request served from cache with zero additional network calls.\n');

  // ── Test 2: In-Flight Request Deduplication (Coalescing) ───────────────────────
  console.log('Test 2: Verifying in-flight request deduplication for concurrent calls...');
  skill._resetWeatherCacheForTesting();

  let concurrentHttpCalls = 0;
  const slowMockClient = {
    get: async (url, config) => {
      concurrentHttpCalls++;
      // Simulate 50ms network latency
      await new Promise(resolve => setTimeout(resolve, 50));
      return createMockOpenMeteoResponse(22);
    }
  };

  // Launch 5 parallel requests for Mitrovicë simultaneously
  const parallelPromises = [
    skill.fetchWeather({ location: 'Mitrovicë', lat: 42.8914, lon: 20.8660, _httpClient: slowMockClient }),
    skill.fetchWeather({ location: 'Mitrovicë', lat: 42.8914, lon: 20.8660, _httpClient: slowMockClient }),
    skill.fetchWeather({ location: 'Mitrovicë', lat: 42.8914, lon: 20.8660, _httpClient: slowMockClient }),
    skill.fetchWeather({ location: 'Mitrovicë', lat: 42.8914, lon: 20.8660, _httpClient: slowMockClient }),
    skill.fetchWeather({ location: 'Mitrovicë', lat: 42.8914, lon: 20.8660, _httpClient: slowMockClient }),
  ];

  const results = await Promise.all(parallelPromises);

  assert.strictEqual(results.length, 5, 'All 5 parallel requests must resolve');
  assert.strictEqual(concurrentHttpCalls, 1, 'All 5 concurrent requests must coalesce into exactly 1 HTTP request');
  results.forEach((r, idx) => {
    assert.strictEqual(r.current.temp, 22, `Result ${idx} must have temperature 22`);
    assert.strictEqual(r.source, 'open-meteo', `Result ${idx} source must be open-meteo`);
  });

  console.log('✓ Passed: 5 concurrent requests safely coalesced into a single outbound API call.\n');

  // ── Test 3: HTTP 429 Graceful Degradation to Stale Cache ────────────────────────
  console.log('Test 3: Verifying HTTP 429 rate limit falls back to stale cache instead of demo...');
  skill._resetWeatherCacheForTesting();

  let callPhase = 'initial_ok';
  const rateLimitingClient = {
    get: async (url, config) => {
      if (callPhase === 'initial_ok') {
        return createMockOpenMeteoResponse(28);
      }
      // Simulate HTTP 429 Too Many Requests
      const err = new Error('Request failed with status code 429');
      err.response = { status: 429, headers: { 'retry-after': '60' } };
      throw err;
    }
  };

  // Step 1: Prime cache with real data
  const initial = await skill.fetchWeather({
    location: 'Pejë',
    lat: 42.6591,
    lon: 20.2883,
    _httpClient: rateLimitingClient
  });
  assert.strictEqual(initial.source, 'open-meteo', 'Initial fetch must succeed with open-meteo');
  assert.strictEqual(initial.current.temp, 28, 'Initial temp is 28');

  // Step 2: Now switch API to return 429 and force refresh (simulating expired cache / refresh)
  callPhase = 'rate_limited_429';
  const degradedResult = await skill.fetchWeather({
    location: 'Pejë',
    lat: 42.6591,
    lon: 20.2883,
    forceRefresh: true,
    _httpClient: rateLimitingClient
  });

  // Must NOT be demo data! Must be stale cached open-meteo data!
  assert.strictEqual(degradedResult.source, 'open-meteo', 'Must keep source open-meteo and NOT drop to demo');
  assert.strictEqual(degradedResult.current.temp, 28, 'Must retain real temperature 28 from stale cache');
  assert.strictEqual(degradedResult.stale, true, 'Must be marked as stale: true');
  assert.strictEqual(degradedResult.isCached, true, 'Must be marked as isCached: true');
  assert.ok(degradedResult.warning && degradedResult.warning.includes('rate-limited'), 'Must include informative warning');

  console.log('✓ Passed: HTTP 429 gracefully degrades to stale cache and preserves real data.\n');

  // ── Test 4: Rate-Limit Cooldown Window ──────────────────────────────────────────
  console.log('Test 4: Verifying rate-limit cooldown prevents hammering API while limited...');
  skill._expireCacheForTesting();
  skill._setRateLimitCooldownForTesting(60000);

  let rateLimitedCallsAttempted = 0;
  const countingClient = {
    get: async () => {
      rateLimitedCallsAttempted++;
      const err = new Error('Request failed with status code 429');
      err.response = { status: 429 };
      throw err;
    }
  };

  // While cooldown is active and cache is expired, fetchWeather should immediately serve stale cache without calling countingClient
  const cooldownResult = await skill.fetchWeather({
    location: 'Pejë',
    lat: 42.6591,
    lon: 20.2883,
    _httpClient: countingClient
  });

  assert.strictEqual(cooldownResult.source, 'open-meteo', 'Must serve open-meteo from stale cache');
  assert.strictEqual(cooldownResult.stale, true, 'Must be marked stale');
  assert.strictEqual(rateLimitedCallsAttempted, 0, 'No outbound HTTP call must be attempted during active cooldown');

  console.log('✓ Passed: Active 429 cooldown immediately returns stale cache without network spam.\n');

  // ── Test 5: Fallback to DEMO ONLY on cold cache with no prior data ─────────────
  console.log('Test 5: Verifying fallback to DEMO occurs ONLY when no prior cache exists...');
  skill._resetWeatherCacheForTesting();

  const failAlwaysClient = {
    get: async () => {
      const err = new Error('Request failed with status code 429');
      err.response = { status: 429 };
      throw err;
    }
  };

  const coldDemoResult = await skill.fetchWeather({
    location: 'UnknownCity',
    lat: 42.1000,
    lon: 20.9000,
    _httpClient: failAlwaysClient
  });

  assert.strictEqual(coldDemoResult.source, 'demo', 'Cold cache failure must safely return demo data');
  assert.ok(coldDemoResult.current && typeof coldDemoResult.current.temp === 'number', 'Demo data must have complete structure');

  console.log('✓ Passed: DEMO data used only as last-resort fallback on cold cache.\n');

  // ── Test 6: Built-in Kosovo Geocoding Dictionary ────────────────────────────────
  console.log('Test 6: Verifying built-in dictionary resolves Kosovo cities without Nominatim...');
  const prishtineCoords = await skill.geocode('Prishtinë');
  assert.strictEqual(prishtineCoords.lat, 42.6629, 'Prishtinë lat match');
  assert.strictEqual(prishtineCoords.lon, 21.1655, 'Prishtinë lon match');

  const mitrovicaCoords = await skill.geocode('Mitrovica');
  assert.strictEqual(mitrovicaCoords.lat, 42.8914, 'Mitrovica lat match');

  const pejeCoords = await skill.geocode('Pec, Kosovo');
  assert.strictEqual(pejeCoords.lat, 42.6591, 'Pec alias lat match');

  console.log('✓ Passed: Known Kosovo cities geocoded locally without external Nominatim calls.\n');

  // ── Test 7: Commercial API Key Support ──────────────────────────────────────────
  console.log('Test 7: Verifying commercial API key routes to customer endpoint...');
  skill._resetWeatherCacheForTesting();
  process.env.OPEN_METEO_API_KEY = 'mock_commercial_key_123';

  let requestedUrl = '';
  let requestedParams = null;
  const keyCheckingClient = {
    get: async (url, config) => {
      requestedUrl = url;
      requestedParams = config.params;
      return createMockOpenMeteoResponse(20);
    }
  };

  await skill.fetchWeather({
    location: 'Prizren',
    lat: 42.2153,
    lon: 20.7415,
    _httpClient: keyCheckingClient
  });

  assert.strictEqual(requestedUrl, 'https://customer-api.open-meteo.com/v1/forecast', 'Must target commercial customer API');
  assert.strictEqual(requestedParams.apikey, 'mock_commercial_key_123', 'Must pass apikey parameter');

  delete process.env.OPEN_METEO_API_KEY;
  console.log('✓ Passed: Commercial API key targets customer endpoint correctly.\n');

  console.log('─────────────────────────────────────────────────────────────────');
  console.log('🎉 ALL WEATHER MONITOR CACHING & 429 RESILIENCE TESTS PASSED!');
  console.log('─────────────────────────────────────────────────────────────────\n');
})().catch(err => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
