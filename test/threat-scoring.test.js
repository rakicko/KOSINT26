'use strict';

const assert = require('assert');
const { computeThreatLevel } = require('../server/orchestrator');

function runThreatScoringTests() {
  console.log('\n=== TESTING MULTI-DOMAIN THREAT SCORING & CONFIDENCE ENGINE ===\n');

  // Test 1: Baseline / Quiet Operational State
  console.log('1. Testing baseline peaceful conditions...');
  const baselineResult = {
    news: { status: 'LIVE_DATA', items: [{ title: 'Normal peaceful news', severity: 'low', intensityScore: 1 }], summary: { maxScore: 1 } },
    traffic: { status: 'LIVE_DATA', incidents: [], anomalyDetected: false },
    borders: { status: 'LIVE_DATA', crossings: [{ name: 'Merdare', direction: { entry: { waitingMinutes: 5 }, exit: { waitingMinutes: 5 } } }] },
    wildfire: { status: 'LIVE_DATA', detections: [] },
    aviation: { status: 'LIVE_DATA', summary: { military: 0 } },
    telegram: { status: 'LIVE_DATA', posts: [] },
    weather: { status: 'LIVE_DATA', alerts: [] },
    radiation: { status: 'LIVE_DATA', primary: { status: 'normal' } },
    aqi: { status: 'LIVE_DATA', current: { europeanAQI: 20 } },
    earthquakes: { status: 'LIVE_DATA', summary: { maxMagnitude: 1.2 } }
  };

  const baselineThreat = computeThreatLevel(baselineResult);
  assert.strictEqual(baselineThreat.level, 'LOW');
  assert.ok(baselineThreat.score <= 10, 'Quiet state score should be low');
  assert.strictEqual(baselineThreat.confidenceScore, 100, 'All 10 active feeds should yield 100% confidence');
  assert.strictEqual(baselineThreat.confidenceLevel, 'HIGH');
  assert.strictEqual(baselineThreat.isDegraded, false);
  assert.strictEqual(baselineThreat.isBlackout, false);
  console.log(`  ✓ Baseline score: ${baselineThreat.score}, level: ${baselineThreat.level}, confidence: ${baselineThreat.confidenceLevel}`);

  // Test 2: Wildfire Integration
  console.log('2. Testing wildfire signal inclusion...');
  const wildfireResult = JSON.parse(JSON.stringify(baselineResult));
  wildfireResult.wildfire.detections = [
    { id: 'fire-1', distanceKm: 12, confidence: 95 },
    { id: 'fire-2', distanceKm: 18, confidence: 90 }
  ];
  const wildfireThreat = computeThreatLevel(wildfireResult);
  assert.ok(wildfireThreat.score >= baselineThreat.score + 15, 'Critical nearby wildfires must add 15 points');
  assert.strictEqual(wildfireThreat.breakdown.wildfire, 15);
  console.log('  ✓ Wildfire signals properly factored into composite threat level');

  // Test 3: Border Crossing Disruption Integration (REAL SCHEMA)
  console.log('3. Testing border crossing disruption inclusion (real direction.entry schema)...');
  const borderResult = JSON.parse(JSON.stringify(baselineResult));
  borderResult.borders.crossings = [
    {
      id: 'border-merdare',
      name: 'Merdare',
      direction: {
        entry: { waitingMinutes: 240, waitingMinutesText: '240 min' },
        exit: { waitingMinutes: 30, waitingMinutesText: '30 min' }
      }
    }
  ];
  const borderThreat = computeThreatLevel(borderResult);
  assert.ok(borderThreat.score >= baselineThreat.score + 15, 'Border delay >= 180 min must add 15 points');
  assert.strictEqual(borderThreat.breakdown.borders, 15);
  console.log('  ✓ Border delays properly factored into composite threat level using real skill schema');

  // Test 4: Telegram Urgent Intelligence Inclusion
  console.log('4. Testing Telegram channel intelligence inclusion...');
  const telegramResult = JSON.parse(JSON.stringify(baselineResult));
  telegramResult.telegram.posts = [
    { id: 'tg-1', text: 'Критично стање на путу Рашка-Јариње' },
    { id: 'tg-2', text: 'Полиција и инцидент код пункта' },
    { id: 'tg-3', text: 'Затворено за саобраћај због инцидента' }
  ];
  const telegramThreat = computeThreatLevel(telegramResult);
  assert.ok(telegramThreat.score >= baselineThreat.score + 10, '3+ urgent Telegram incident posts must add 10 points');
  assert.strictEqual(telegramThreat.breakdown.telegram, 10);
  console.log('  ✓ Telegram intelligence signals properly factored into composite threat level');

  // Test 5: Real News Schema Integration (items array with severity and intensityScore)
  console.log('5. Testing real news schema integration (items array)...');
  const newsCrisisResult = JSON.parse(JSON.stringify(baselineResult));
  newsCrisisResult.news = {
    skill: 'news-intel',
    status: 'LIVE_DATA',
    source: 'kosovo-local-rss',
    items: [
      { id: 'ev-1', title: 'Armed clash reported at border crossing', severity: 'critical', intensityScore: 10 },
      { id: 'ev-2', title: 'Police cordon established', severity: 'high', intensityScore: 8 }
    ],
    summary: { maxScore: 10, total: 2, highIntensity: 2 }
  };
  const newsThreat = computeThreatLevel(newsCrisisResult);
  assert.ok(newsThreat.breakdown.news > 0, 'Critical news in real items schema MUST produce non-zero threat points');
  assert.strictEqual(newsThreat.breakdown.news, 24);
  console.log(`  ✓ Real news schema (items) yields ${newsThreat.breakdown.news} points`);

  // Test 6: Cumulative Critical Threat Escalation
  console.log('6. Testing cumulative multi-domain critical escalation...');
  const criticalResult = {
    news: { status: 'LIVE_DATA', summary: { maxScore: 9 }, items: [{ severity: 'critical', intensityScore: 9 }, { severity: 'critical', intensityScore: 9 }] },
    traffic: { status: 'LIVE_DATA', anomalyDetected: true, incidents: [{}, {}, {}] },
    borders: { status: 'LIVE_DATA', crossings: [{ direction: { entry: { waitingMinutes: 200 } } }] },
    wildfire: { status: 'LIVE_DATA', detections: [{ distanceKm: 15 }, { distanceKm: 19 }] },
    aviation: { status: 'LIVE_DATA', summary: { military: 5 } },
    telegram: { status: 'LIVE_DATA', posts: [{ text: 'критично' }, { text: 'инцидент' }, { text: 'затворено' }] },
    weather: { status: 'LIVE_DATA', alerts: [{ severity: 'high' }, { severity: 'high' }] },
    radiation: { status: 'LIVE_DATA', primary: { status: 'critical' } },
    aqi: { status: 'LIVE_DATA', current: { europeanAQI: 95 } },
    earthquakes: { status: 'LIVE_DATA', summary: { maxMagnitude: 5.4 } }
  };
  const criticalThreat = computeThreatLevel(criticalResult);
  assert.strictEqual(criticalThreat.level, 'CRITICAL');
  assert.ok(criticalThreat.score >= 80, 'Accumulated critical signals must yield CRITICAL level');
  console.log(`  ✓ Cumulative critical score: ${criticalThreat.score}, level: ${criticalThreat.level}`);

  // Test 7: Total Telemetry Blackout (0 feeds active)
  console.log('7. Testing total telemetry blackout semantics (0 active feeds)...');
  const blackoutResult = {
    news: { status: 'UNAVAILABLE' },
    traffic: { status: 'UNAVAILABLE' },
    borders: { status: 'UNAVAILABLE' },
    wildfire: { status: 'UNAVAILABLE' },
    aviation: { status: 'UNAVAILABLE' },
    telegram: { status: 'UNAVAILABLE' },
    weather: { status: 'UNAVAILABLE' },
    radiation: { status: 'UNAVAILABLE' },
    aqi: { status: 'UNAVAILABLE' },
    earthquakes: { status: 'UNAVAILABLE' }
  };
  const blackoutThreat = computeThreatLevel(blackoutResult);
  assert.strictEqual(blackoutThreat.activeFeeds, 0);
  assert.strictEqual(blackoutThreat.level, 'NO TELEMETRY');
  assert.strictEqual(blackoutThreat.color, '#94a3b8');
  assert.notStrictEqual(blackoutThreat.color, '#34d399', 'Total blackout must NEVER be rendered in green');
  assert.strictEqual(blackoutThreat.confidenceScore, 0);
  assert.strictEqual(blackoutThreat.isBlackout, true);
  assert.strictEqual(blackoutThreat.isDegraded, true);
  assert.ok(blackoutThreat.confidenceNote.includes('Total telemetry blackout'));
  console.log(`  ✓ Blackout correctly classified as ${blackoutThreat.level} (${blackoutThreat.color}) - NOT green LOW 0`);

  // Test 8: Partial Sensor Degradation
  console.log('8. Testing partial telemetry degradation...');
  const partialResult = {
    news: { status: 'UNAVAILABLE' },
    traffic: { status: 'UNAVAILABLE' },
    borders: { status: 'UNAVAILABLE' },
    wildfire: { status: 'UNAVAILABLE' },
    aviation: { status: 'UNAVAILABLE' },
    telegram: { status: 'UNAVAILABLE' },
    weather: { status: 'UNAVAILABLE' },
    radiation: { status: 'LIVE_DATA', primary: { status: 'normal' } },
    aqi: { status: 'LIVE_DATA', current: { europeanAQI: 20 } },
    earthquakes: { status: 'UNAVAILABLE' }
  };
  const partialThreat = computeThreatLevel(partialResult);
  assert.strictEqual(partialThreat.activeFeeds, 2);
  assert.strictEqual(partialThreat.isDegraded, true);
  assert.strictEqual(partialThreat.level, 'DEGRADED');
  assert.strictEqual(partialThreat.color, '#eab308');
  assert.ok(partialThreat.confidenceNote.includes('Threat assessment based on degraded telemetry'));
  console.log(`  ✓ Partial outage correctly flagged as ${partialThreat.level} (${partialThreat.color})`);

  console.log('\n=== ALL THREAT SCORING TESTS PASSED ===\n');
}

runThreatScoringTests();
