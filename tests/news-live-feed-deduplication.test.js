'use strict';

const assert = require('assert');
const {
  clusterEventArticles,
  deduplicateNewsItems
} = require('../skills/news-intel/skill');

console.log('=== KOSINT News Intelligence Live-Feed Deduplication & Data-Flow Integration Test ===\n');

// -----------------------------------------------------------------------------
// 1. SR / AL / EN same event -> one Event
// -----------------------------------------------------------------------------
console.log('--- 1. SR / AL / EN same event -> one Event ---');
const multilingualArticles = [
  { id: '1', title: 'Uhapšen četvrti osumnjičeni za krađu u Leposaviću', url: 'https://kossev.info/1', source: 'KoSSev', publishedAt: '2026-08-22T14:00:00.000Z' },
  { id: '2', title: 'Arrestohet i dyshuari i katërt për vjedhje në Leposaviq', url: 'https://indeksonline.net/2', source: 'Indeks Online', publishedAt: '2026-08-22T14:10:00.000Z' },
  { id: '3', title: 'Fourth suspect arrested for theft in Leposavic', url: 'https://balkaninsight.com/3', source: 'Balkan Insight', publishedAt: '2026-08-22T14:30:00.000Z' }
];
const evMulti = clusterEventArticles(multilingualArticles);
assert.strictEqual(evMulti.length, 1, 'SR/AL/EN articles must cluster into 1 Event');
assert.strictEqual(evMulti[0].sourceCount, 3, 'Must record 3 sources');
console.log('✓ 1. Passed: SR / AL / EN merged into 1 Event');

// -----------------------------------------------------------------------------
// 2. Syndicated same-state reports -> one Development
// -----------------------------------------------------------------------------
console.log('--- 2. Syndicated same-state reports -> one Development ---');
const syndicatedArticles = [
  { id: 's1', title: 'Kfor: Otkazan sastanak general-majora Ulutaša i Aljbina Kurtija', url: 'https://radiomitrovicasever.com/1', source: 'Radio Mitrovica Sever', publishedAt: '2026-08-22T19:00:00.000Z' },
  { id: 's2', title: 'Nije održan sastanak Ulutaša i Kurtija', url: 'https://radiokim.net/2', source: 'Radio KIM', publishedAt: '2026-08-22T19:05:00.000Z' },
  { id: 's3', title: 'Dështon takimi Kurti-Ulutash', url: 'https://koha.net/3', source: 'Koha', publishedAt: '2026-08-22T18:00:00.000Z' }
];
const evSynd = clusterEventArticles(syndicatedArticles);
assert.strictEqual(evSynd.length, 1, 'Must form 1 Event');
assert.strictEqual(evSynd[0].developments.length, 1, 'Same state must form 1 Development');
assert.strictEqual(evSynd[0].developments[0].type, 'MEETING_CANCELLED');
assert.strictEqual(evSynd[0].developments[0].sources.length, 3, 'Development must contain all 3 sources');
console.log('✓ 2. Passed: 3 Syndicated reports merged into 1 Development with 3 sources');

// -----------------------------------------------------------------------------
// 3. New factual state -> new Development
// -----------------------------------------------------------------------------
console.log('--- 3. New factual state -> new Development ---');
const newFactualArticles = [
  { id: 'f1', title: 'Policia në veri arreston tre persona për vjedhje të rëndë në Leposaviq', url: 'https://jepize.com/1', source: 'Jepize', publishedAt: '2026-08-22T08:00:00.000Z' },
  { id: 'f2', title: 'Uhapšen i četvrti osumnjičeni za krađu u Leposaviću – maloletnik zatečen sa 5.750 evra na Jarinju', url: 'https://kossev.info/2', source: 'KoSSev', publishedAt: '2026-08-22T12:00:00.000Z' }
];
const evNewFact = clusterEventArticles(newFactualArticles);
assert.strictEqual(evNewFact.length, 1, 'Must form 1 Event');
assert.strictEqual(evNewFact[0].developments.length, 2, 'Factual update (4th suspect + cash) must form 2nd Development');
assert.strictEqual(evNewFact[0].sourceCount, 2, 'Must record 2 sources');
console.log('✓ 3. Passed: New factual update formed discrete 2nd Development');

// -----------------------------------------------------------------------------
// 4. Conflicting event type -> separate Event
// -----------------------------------------------------------------------------
console.log('--- 4. Conflicting event type -> separate Event ---');
const conflictingTypeArticles = [
  { id: 'ct1', title: 'Saobraćajna nesreća u Zvečanu, dvoje povređenih', url: 'https://kossev.info/nesreca', source: 'KoSSev', publishedAt: '2026-08-22T10:00:00.000Z' },
  { id: 'ct2', title: 'Policija zaplenila arsenal oružja u Zvečanu', url: 'https://kossev.info/oruzje', source: 'KoSSev', publishedAt: '2026-08-22T10:30:00.000Z' }
];
const evConfType = clusterEventArticles(conflictingTypeArticles);
assert.strictEqual(evConfType.length, 2, 'Accident vs weapon seizure must form 2 separate Events');
console.log('✓ 4. Passed: Conflicting event types isolated into separate Events');

// -----------------------------------------------------------------------------
// 5. Conflicting location -> separate Event
// -----------------------------------------------------------------------------
console.log('--- 5. Conflicting location -> separate Event ---');
const conflictingLocArticles = [
  { id: 'cl1', title: 'Policija zaplenila oružje u Peći', url: 'https://koha.net/peja', source: 'Koha', publishedAt: '2026-08-22T10:00:00.000Z' },
  { id: 'cl2', title: 'Policija zaplenila oružje u Prizrenu', url: 'https://koha.net/prizren', source: 'Koha', publishedAt: '2026-08-22T10:15:00.000Z' }
];
const evConfLoc = clusterEventArticles(conflictingLocArticles);
assert.strictEqual(evConfLoc.length, 2, 'Pejë vs Prizren must form 2 separate Events');
console.log('✓ 5. Passed: Conflicting locations isolated into separate Events');

// -----------------------------------------------------------------------------
// 6. Refresh does not duplicate sources
// -----------------------------------------------------------------------------
console.log('--- 6. Refresh does not duplicate sources ---');
const refreshTestArticles = [
  { id: 'r1', title: 'Otkazan sastanak Ulutaša i Kurtija', url: 'https://radiokim.net/1', source: 'Radio KIM', publishedAt: '2026-08-22T19:00:00.000Z' },
  { id: 'r2', title: 'Dështon takimi Kurti-Ulutash', url: 'https://koha.net/2', source: 'Koha', publishedAt: '2026-08-22T19:05:00.000Z' }
];
const refA = clusterEventArticles(refreshTestArticles);
const refB = clusterEventArticles(refreshTestArticles);
assert.strictEqual(refA[0].sourceCount, 2, 'First refresh must have 2 sources');
assert.strictEqual(refB[0].sourceCount, 2, 'Second refresh must still have 2 sources');
assert.deepStrictEqual(refA[0].sources, refB[0].sources, 'Sources must be identical');
console.log('✓ 6. Passed: Refresh stability verified');

// -----------------------------------------------------------------------------
// 7. eventId is deterministic across permutations [A,B,C], [B,C,A], [C,A,B]
// -----------------------------------------------------------------------------
console.log('--- 7. eventId is deterministic across permutations ---');
const permA = clusterEventArticles([syndicatedArticles[0], syndicatedArticles[1], syndicatedArticles[2]]);
const permB = clusterEventArticles([syndicatedArticles[1], syndicatedArticles[2], syndicatedArticles[0]]);
const permC = clusterEventArticles([syndicatedArticles[2], syndicatedArticles[0], syndicatedArticles[1]]);
assert.strictEqual(permA[0].eventId, permB[0].eventId, 'eventId must match across permutations');
assert.strictEqual(permB[0].eventId, permC[0].eventId, 'eventId must match across permutations');
console.log(`✓ 7. Passed: Deterministic eventId = "${permA[0].eventId}"`);

// -----------------------------------------------------------------------------
// 8. Event -> exactly one sidebar card
// -----------------------------------------------------------------------------
console.log('--- 8. Event -> exactly one sidebar card ---');
function renderSidebarCards(events) {
  return events.map(item => {
    const s = item.intensityScore || 1;
    const sev = (item.severity || 'medium').toLowerCase();
    const sourceCount = item.sourceCount || 1;
    const devCount = item.developmentCount || 1;
    const developments = item.developments || [];
    return `<div class="news-item score-${sev}">
      <div class="news-title">${item.title}</div>
      <div class="news-metrics">${sourceCount} SOURCES · ${devCount} DEVELOPMENTS</div>
      <div class="news-developments">${developments.map(d => `<div class="news-dev">${d.type}: ${d.sources.join(', ')}</div>`).join('')}</div>
    </div>`;
  });
}
const cards = renderSidebarCards(evSynd);
assert.strictEqual(cards.length, 1, 'Sidebar MUST render exactly 1 Card for the 3 syndicated articles');
assert.ok(cards[0].includes('3 SOURCES'), 'Card must state 3 SOURCES');
assert.ok(cards[0].includes('1 DEVELOPMENTS'), 'Card must state 1 DEVELOPMENTS');
console.log('✓ 8. Passed: Event rendered as exactly 1 sidebar card with 3 nested sources');

// -----------------------------------------------------------------------------
// 9. Event -> exactly one map marker
// -----------------------------------------------------------------------------
console.log('--- 9. Event -> exactly one map marker ---');
function simulateMapMarkers(events) {
  return events.map((item, idx) => ({
    markerId: item.eventId || `news-marker-${idx}`,
    title: item.title,
    sourceCount: item.sourceCount,
    developmentCount: item.developmentCount
  }));
}
const markers = simulateMapMarkers(evSynd);
assert.strictEqual(markers.length, 1, 'Map MUST create exactly 1 marker for the Event');
assert.strictEqual(markers[0].markerId, evSynd[0].eventId, 'Marker ID must match Event ID');
console.log('✓ 9. Passed: Event rendered as exactly 1 map marker');

console.log('\n=== ALL 9 INTEGRATION VERIFICATIONS PASSED 100% GREEN ===');
