'use strict';

process.env.NODE_ENV = 'test';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

const { synthesizeFlashSitRep, categorizeItemForSitRep } = require('../server/sitrep');
const { app } = require('../server/index');

console.log('=== World Monitor Flash SitRep (Situation Report) Test Suite ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: SitRep Synthesis with Diverse Intelligence Items
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- Test 1: SitRep Synthesis with Structured 3-Bullet Brief ---');

const mockItems = [
  {
    id: 'op-1',
    title: 'Aksion policor në Mitrovicën e Veriut, arrestohen dy persona për armëmbajtje pa leje',
    description: 'Policia e Kosovës ka konfiskuar armë automatike dhe municion gjatë një bastisjeje në veri.',
    category: 'operational',
    severity: 'critical',
    location: 'North Mitrovica',
    pubDate: new Date().toISOString()
  },
  {
    id: 'route-1',
    title: 'Pika kufitare në Jarinjë regjistron pritje deri në 30 minuta, patrullat e KFOR-it të pranishme',
    description: 'Fluks i shtuar i veturave në vendkalimin kufitar Jarinje me Serbinë.',
    category: 'operational',
    severity: 'high',
    location: 'Jarinje',
    pubDate: new Date().toISOString()
  },
  {
    id: 'route-2',
    title: 'Inspektohet stabiliteti i Urës së Ibrit para rihapjes së mundshme',
    description: 'Inxhinierët kryejnë teste teknike mbi urën kryesore në Mitrovicë.',
    category: 'operational',
    severity: 'high',
    location: 'Ibar Bridge',
    pubDate: new Date().toISOString()
  },
  {
    id: 'pol-1',
    title: 'Kurti dhe ambasadorët e QUINT-it diskutojnë për situatën e sigurisë në veri',
    description: 'Kryeministri theksoi përkushtimin e qeverisë për sundimin e ligjit dhe koordinimin me aleatët.',
    category: 'political',
    severity: 'medium',
    location: 'Prishtina',
    pubDate: new Date().toISOString()
  },
  {
    id: 'pol-2',
    title: 'Petković reagon ndaj deklaratave të fundit të qeverisë së Kosovës',
    description: 'Drejtori i Zyrës për Kosovë kërkoi respektimin e marrëveshjeve të Brukselit.',
    category: 'political',
    severity: 'medium',
    location: 'Belgrade',
    pubDate: new Date().toISOString()
  }
];

async function runTests() {
  const sitrepResult = await synthesizeFlashSitRep(mockItems);

  assert.ok(sitrepResult, 'Must return a sitrep object');
  assert.strictEqual(typeof sitrepResult.sitrep, 'string', 'sitrep must be a formatted string');
  assert.ok(sitrepResult.generatedAt, 'must include generatedAt timestamp');
  assert.strictEqual(sitrepResult.itemClusterCount, 5, 'Must report itemClusterCount = 5');

  // Verify all 3 required sections exist in the brief
  assert.ok(sitrepResult.sitrep.includes('Field Incidents:'), 'Must contain "Field Incidents:" bullet');
  assert.ok(sitrepResult.sitrep.includes('Friction Points & Routes:'), 'Must contain "Friction Points & Routes:" bullet');
  assert.ok(sitrepResult.sitrep.includes('Institutional / Political Posture:'), 'Must contain "Institutional / Political Posture:" bullet');

  // Verify sections mapping
  assert.ok(sitrepResult.sections.fieldIncidents.includes('Mitrovicën e Veriut') || sitrepResult.sections.fieldIncidents.includes('arrestohen'), 'Field incidents must cite kinetic event');
  assert.ok(sitrepResult.sections.frictionPointsRoutes.includes('Jarinjë') || sitrepResult.sections.frictionPointsRoutes.includes('Urës së Ibrit'), 'Friction routes must cite Jarinje or Ibar Bridge');
  assert.ok(sitrepResult.sections.institutionalPoliticalPosture.includes('Kurti') || sitrepResult.sections.institutionalPoliticalPosture.includes('Petković'), 'Institutional posture must cite official reactions');

  console.log('✓ Passed Test 1: SitRep synthesis produces exact 3-bullet tactical intelligence brief');

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 2: Graceful Handling of Empty Items Input
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Test 2: Empty Items Input Handling ---');
  const emptyResult = await synthesizeFlashSitRep([]);

  assert.ok(emptyResult, 'Empty input must return a valid object');
  assert.strictEqual(emptyResult.itemClusterCount, 0, 'itemClusterCount must be 0 for empty input');
  assert.ok(emptyResult.sitrep.includes('Field Incidents:'), 'Empty result still contains Field Incidents bullet');
  assert.ok(emptyResult.sitrep.includes('Friction Points & Routes:'), 'Empty result still contains Friction Points bullet');
  assert.ok(emptyResult.sitrep.includes('Institutional / Political Posture:'), 'Empty result still contains Institutional bullet');
  assert.ok(!emptyResult.sitrep.includes('undefined'), 'Must not contain undefined strings');
  console.log('✓ Passed Test 2: Empty items input handled gracefully without crashing');

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 3: Top 10 Ranked Item Budget Limit
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Test 3: Top 10 Ranked Item Budget Limit ---');
  // Create 15 items with different ranks
  const fifteenItems = Array.from({ length: 15 }, (_, i) => ({
    id: `item-${i}`,
    title: `Intelligence Report ${i}`,
    category: i % 2 === 0 ? 'operational' : 'political',
    severity: i === 0 ? 'critical' : 'medium',
    _rank: 4000 - i * 100,
    pubDate: new Date().toISOString()
  }));

  const cappedResult = await synthesizeFlashSitRep(fifteenItems);
  assert.strictEqual(cappedResult.itemClusterCount, 10, 'Must cap analyzed cluster count strictly at 10 items');
  console.log('✓ Passed Test 3: Top 10 item budget limit enforced');

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 4: HTTP POST /api/news/sitrep Endpoint
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Test 4: HTTP POST /api/news/sitrep Endpoint ---');
  await new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, async () => {
      const port = server.address().port;
      try {
        const payload = JSON.stringify({ items: mockItems });
        const req = http.request({
          hostname: '127.0.0.1',
          port,
          path: '/api/news/sitrep',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        }, (res) => {
          let body = '';
          res.on('data', chunk => { body += chunk; });
          res.on('end', () => {
            server.close();
            try {
              assert.strictEqual(res.statusCode, 200, 'Endpoint must respond with status 200');
              const json = JSON.parse(body);
              assert.ok(json.sitrep, 'Response must include sitrep text');
              assert.strictEqual(json.itemClusterCount, 5);
              assert.ok(json.sections, 'Response must include structured sections');
              assert.ok(json.sections.fieldIncidents);
              assert.ok(json.sections.frictionPointsRoutes);
              assert.ok(json.sections.institutionalPoliticalPosture);
              console.log('✓ Passed Test 4: POST /api/news/sitrep responds with 200 and verified payload');
              resolve();
            } catch (e) {
              reject(e);
            }
          });
        });

        req.on('error', err => {
          server.close();
          reject(err);
        });

        req.write(payload);
        req.end();
      } catch (err) {
        server.close();
        reject(err);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 5: UI Elements & App Integration Verification
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Test 5: UI Elements in index.html & app.js ---');
  const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  assert.ok(indexHtml.includes('id="btnNewsSitRep"'), 'index.html must contain btnNewsSitRep');
  assert.ok(indexHtml.includes('id="newsSitrepContainer"'), 'index.html must contain newsSitrepContainer');
  assert.ok(indexHtml.includes('requestFlashSitRep()'), 'btnNewsSitRep must trigger requestFlashSitRep()');

  const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
  assert.ok(appJs.includes('function requestFlashSitRep('), 'app.js must define requestFlashSitRep');
  assert.ok(appJs.includes('function renderFlashSitRep('), 'app.js must define renderFlashSitRep');
  assert.ok(appJs.includes('function closeFlashSitRep('), 'app.js must define closeFlashSitRep');
  assert.ok(appJs.includes('state.cachedSitrep'), 'app.js must maintain state.cachedSitrep');
  assert.ok(appJs.includes('window.requestFlashSitRep = requestFlashSitRep'), 'app.js must export requestFlashSitRep to window');
  assert.ok(appJs.includes('window.closeFlashSitRep = closeFlashSitRep'), 'app.js must export closeFlashSitRep to window');

  const styleCss = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');
  assert.ok(styleCss.includes('.news-sitrep-btn'), 'style.css must style .news-sitrep-btn');
  assert.ok(styleCss.includes('.sitrep-card'), 'style.css must style .sitrep-card');
  assert.ok(styleCss.includes('.sitrep-badge'), 'style.css must style .sitrep-badge');
  console.log('✓ Passed Test 5: UI button, container, styles, and state management verified');

  console.log('\n🎉 ALL FLASH SITREP TESTS PASSED 100%! 🎉');
}

runTests().catch(err => {
  console.error('SitRep test failed:', err);
  process.exit(1);
});
