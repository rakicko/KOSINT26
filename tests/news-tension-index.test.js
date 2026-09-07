'use strict';

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');

const { calculateRegionalTension, isNorthKosovoOrCheckpoint } = require('../skills/news-intel/security');
const { calculateRegionalTension: skillCalculateTension } = require('../skills/news-intel/skill');
const { getRegionalTension } = require('../server/tension');
const { app } = require('../server/index');

console.log('=== World Monitor Regional Tension Index (RTI) Test Suite ===\n');

async function runTests() {
  const now = Date.now();
  const ONE_HOUR = 3600 * 1000;

  // ── Test 1: Normalization Boundary & Default Baseline ─────────────────────────
  console.log('--- Test 1: Normalization Boundary (Strict 1.0 - 10.0) & Baseline ---');

  // Baseline on empty array
  const emptyRes = calculateRegionalTension([], now);
  assert.strictEqual(emptyRes.score, 1.5, 'Empty input must default to baseline 1.5');
  assert.strictEqual(emptyRes.level, 'LOW / NORMAL', 'Baseline level must be LOW / NORMAL');
  assert.strictEqual(emptyRes.trend, 'STABLE', 'Baseline trend must be STABLE');
  assert.strictEqual(emptyRes.delta24h, 0, 'Baseline delta must be 0');
  assert.strictEqual(emptyRes.incidentCount24h, 0, 'Baseline incidentCount24h must be 0');

  // Skill re-export parity check
  const skillRes = skillCalculateTension([], now);
  assert.strictEqual(skillRes.score, 1.5, 'skills/news-intel/skill.js re-export must match');

  // Boundary check: Upper bound clamp at 10.0 under extreme load
  const extremeEvents = [];
  for (let i = 0; i < 50; i++) {
    extremeEvents.push({
      title: `Active armed clash in North Mitrovica #${i}`,
      severity: 'critical',
      location: 'North Mitrovica',
      isNorth: true,
      pubDate: new Date(now - i * 10 * 60 * 1000).toISOString()
    });
  }
  const extremeRes = calculateRegionalTension(extremeEvents, now);
  assert.ok(extremeRes.score <= 10.0, `Score must be <= 10.0, got ${extremeRes.score}`);
  assert.strictEqual(extremeRes.score, 10.0, `Score must clamp at exactly 10.0, got ${extremeRes.score}`);
  assert.strictEqual(extremeRes.level, 'CRITICAL / ACTIVE CONFLICT', 'Extreme load must trigger CRITICAL / ACTIVE CONFLICT');

  // Boundary check: Lower bound never < 1.0
  const nullRes = calculateRegionalTension(null, now);
  assert.ok(nullRes.score >= 1.0, `Score must never be < 1.0, got ${nullRes.score}`);

  console.log('✓ Passed Test 1: Normalization boundaries strictly enforced [1.0, 10.0] with 1.5 baseline');

  // ── Test 2: Severity Weights and Context Multiplier (North Kosovo / Checkpoint) ─
  console.log('\n--- Test 2: Severity Weights & Context Multiplier (x1.4 North Kosovo) ---');

  // Critical in Pristina: 2.5 pts -> score = 1.5 + 2.5 = 4.0 (MODERATE / GUARDED)
  const pristinaCritical = [{
    title: 'Major incident in Pristina centre',
    severity: 'critical',
    location: 'Pristina',
    pubDate: new Date(now - 2 * ONE_HOUR).toISOString()
  }];
  const resPristina = calculateRegionalTension(pristinaCritical, now);
  assert.strictEqual(resPristina.score, 4.0, `Pristina critical should be 1.5 + 2.5 = 4.0, got ${resPristina.score}`);
  assert.strictEqual(resPristina.level, 'MODERATE / GUARDED');

  // Critical in North Kosovo (Mitrovica): 2.5 * 1.4 = 3.5 pts -> score = 1.5 + 3.5 = 5.0
  const northCritical = [{
    title: 'Shooting incident near Ibar Bridge in Mitrovica',
    severity: 'critical',
    location: 'North Mitrovica',
    pubDate: new Date(now - 2 * ONE_HOUR).toISOString()
  }];
  const resNorth = calculateRegionalTension(northCritical, now);
  assert.strictEqual(resNorth.score, 5.0, `North critical should be 1.5 + 3.5 = 5.0, got ${resNorth.score}`);
  assert.ok(resNorth.score > resPristina.score, 'North Kosovo event must yield strictly higher score than non-North event');

  // Priority checkpoint test (Jarinje)
  const jarinjeEvent = [{
    title: 'Armed blockage at Jarinje border crossing checkpoint',
    severity: 'high', // 1.5 * 1.4 = 2.1 pts -> 1.5 + 2.1 = 3.6
    location: 'Jarinje checkpoint',
    pubDate: new Date(now - 1 * ONE_HOUR).toISOString()
  }];
  const resJarinje = calculateRegionalTension(jarinjeEvent, now);
  assert.strictEqual(resJarinje.score, 3.6, `Jarinje high event should score 3.6, got ${resJarinje.score}`);

  // Two critical events in North Kosovo: 2 * 3.5 = 7.0 pts -> score = 1.5 + 7.0 = 8.5 (CRITICAL)
  const dualNorthCritical = [
    { title: 'Gunfire at Banjska', severity: 'critical', location: 'Banjska', pubDate: new Date(now - 2 * ONE_HOUR).toISOString() },
    { title: 'Explosion at Zubin Potok', severity: 'critical', location: 'Zubin Potok', pubDate: new Date(now - 3 * ONE_HOUR).toISOString() }
  ];
  const resDualNorth = calculateRegionalTension(dualNorthCritical, now);
  assert.strictEqual(resDualNorth.score, 8.5, `Dual north critical should score 8.5, got ${resDualNorth.score}`);
  assert.strictEqual(resDualNorth.level, 'CRITICAL / ACTIVE CONFLICT');

  // Guard: KEK / Obiliq should NOT receive North context boost
  const obiliqEvent = [{
    title: 'KEK power plant inspection in Obiliq',
    severity: 'medium',
    location: 'Obiliq',
    pubDate: new Date(now - 2 * ONE_HOUR).toISOString()
  }];
  assert.strictEqual(isNorthKosovoOrCheckpoint(obiliqEvent[0]), false, 'Obiliq/KEK should not trigger North boost');

  console.log('✓ Passed Test 2: Severity weights and North Kosovo x1.4 multiplier verified');

  // ── Test 3: Trend Direction (RISING vs FALLING vs STABLE) & 24h Rolling Window ─
  console.log('\n--- Test 3: Trend Direction (RISING vs FALLING vs STABLE) & 24h Window ---');

  // Case A: Recent activity (last 12h) > prior activity (12h-24h) -> RISING
  const risingEvents = [
    { title: 'Incident 2h ago', severity: 'high', location: 'North Mitrovica', pubDate: new Date(now - 2 * ONE_HOUR).toISOString() },
    { title: 'Incident 4h ago', severity: 'medium', location: 'Pristina', pubDate: new Date(now - 4 * ONE_HOUR).toISOString() }
  ];
  const resRising = calculateRegionalTension(risingEvents, now);
  assert.strictEqual(resRising.trend, 'RISING', `Trend should be RISING, got ${resRising.trend}`);
  assert.ok(resRising.delta24h > 0, `Delta should be positive, got ${resRising.delta24h}`);

  // Case B: Prior activity (12h-24h) > recent activity (0-12h) -> FALLING
  const fallingEvents = [
    { title: 'Incident 16h ago', severity: 'critical', location: 'Leposavic', pubDate: new Date(now - 16 * ONE_HOUR).toISOString() },
    { title: 'Incident 20h ago', severity: 'high', location: 'Zvecan', pubDate: new Date(now - 20 * ONE_HOUR).toISOString() }
  ];
  const resFalling = calculateRegionalTension(fallingEvents, now);
  assert.strictEqual(resFalling.trend, 'FALLING', `Trend should be FALLING, got ${resFalling.trend}`);
  assert.ok(resFalling.delta24h < 0, `Delta should be negative, got ${resFalling.delta24h}`);

  // Case C: Equal activity in both windows -> STABLE
  const stableEvents = [
    { title: 'Incident 3h ago', severity: 'high', location: 'Pristina', pubDate: new Date(now - 3 * ONE_HOUR).toISOString() },
    { title: 'Incident 15h ago', severity: 'high', location: 'Pristina', pubDate: new Date(now - 15 * ONE_HOUR).toISOString() }
  ];
  const resStable = calculateRegionalTension(stableEvents, now);
  assert.strictEqual(resStable.trend, 'STABLE', `Trend should be STABLE, got ${resStable.trend}`);
  assert.strictEqual(resStable.delta24h, 0, `Delta should be 0, got ${resStable.delta24h}`);

  // Case D: Older than 24h events must be dropped from rolling 24h calculation
  const oldEvents = [
    { title: 'Incident 26h ago', severity: 'critical', location: 'Banjska', pubDate: new Date(now - 26 * ONE_HOUR).toISOString() },
    { title: 'Incident 3 days ago', severity: 'critical', location: 'Jarinje', pubDate: new Date(now - 72 * ONE_HOUR).toISOString() }
  ];
  const resOld = calculateRegionalTension(oldEvents, now);
  assert.strictEqual(resOld.incidentCount24h, 0, 'Items older than 24h must be excluded');
  assert.strictEqual(resOld.score, 1.5, 'Items older than 24h must not elevate score above baseline');

  console.log('✓ Passed Test 3: Trend direction (RISING / FALLING / STABLE) & 24h window verified');

  // ── Test 4: HTTP GET /api/news/tension Endpoint ──────────────────────────────
  console.log('\n--- Test 4: HTTP GET /api/news/tension Endpoint ---');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  try {
    const apiRes = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/api/news/tension`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });

    assert.strictEqual(apiRes.statusCode, 200, `API should respond with 200, got ${apiRes.statusCode}`);
    assert.ok(typeof apiRes.data.score === 'number', 'API must return numeric score');
    assert.ok(apiRes.data.score >= 1.0 && apiRes.data.score <= 10.0, `API score ${apiRes.data.score} must be within [1.0, 10.0]`);
    assert.ok(['LOW / NORMAL', 'MODERATE / GUARDED', 'ELEVATED / HIGH ALERT', 'CRITICAL / ACTIVE CONFLICT'].includes(apiRes.data.level), `API returned valid level: ${apiRes.data.level}`);
    assert.ok(['RISING', 'STABLE', 'FALLING'].includes(apiRes.data.trend), `API returned valid trend: ${apiRes.data.trend}`);
    assert.ok(typeof apiRes.data.incidentCount24h === 'number', 'API must return incidentCount24h');
    assert.ok(typeof apiRes.data.delta24h === 'number', 'API must return delta24h');

    console.log(`✓ Passed Test 4: GET /api/news/tension responds with 200 and verified RTI payload (Score: ${apiRes.data.score}, Level: ${apiRes.data.level})`);
  } finally {
    server.close();
  }

  // ── Test 5: UI Elements in public/index.html, style.css, app.js ─────────────
  console.log('\n--- Test 5: UI Badge & Tooltip in index.html, style.css & app.js ---');

  const htmlContent = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  assert.ok(htmlContent.includes('id="regionalTensionBadge"'), 'index.html must contain #regionalTensionBadge');
  assert.ok(htmlContent.includes('id="tensionScore"'), 'index.html must contain #tensionScore');
  assert.ok(htmlContent.includes('id="tensionLevel"'), 'index.html must contain #tensionLevel');
  assert.ok(htmlContent.includes('id="tensionTrend"'), 'index.html must contain #tensionTrend');
  assert.ok(htmlContent.includes('id="tensionTooltip"'), 'index.html must contain #tensionTooltip');

  const cssContent = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');
  assert.ok(cssContent.includes('.regional-tension-badge'), 'style.css must style .regional-tension-badge');
  assert.ok(cssContent.includes('.tension-low'), 'style.css must define .tension-low');
  assert.ok(cssContent.includes('.tension-moderate'), 'style.css must define .tension-moderate');
  assert.ok(cssContent.includes('.tension-elevated'), 'style.css must define .tension-elevated');
  assert.ok(cssContent.includes('.tension-critical'), 'style.css must define .tension-critical');
  assert.ok(cssContent.includes('.tension-tooltip'), 'style.css must define .tension-tooltip');

  const appContent = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
  assert.ok(appContent.includes('function calculateRegionalTension'), 'app.js must implement calculateRegionalTension');
  assert.ok(appContent.includes('function renderRegionalTension'), 'app.js must implement renderRegionalTension');
  assert.ok(appContent.includes('function toggleRegionalTensionTooltip'), 'app.js must implement toggleRegionalTensionTooltip');
  assert.ok(appContent.includes('function fetchRegionalTension'), 'app.js must implement fetchRegionalTension');
  assert.ok(appContent.includes('window.calculateRegionalTension = calculateRegionalTension;'), 'app.js must export calculateRegionalTension');
  assert.ok(appContent.includes('window.renderRegionalTension = renderRegionalTension;'), 'app.js must export renderRegionalTension');

  console.log('✓ Passed Test 5: UI badge, tooltips, CSS states, and app.js integration verified');

  console.log('\n🎉 ALL REGIONAL TENSION INDEX (RTI) TESTS PASSED 100%! 🎉');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
