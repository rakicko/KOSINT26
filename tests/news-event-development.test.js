'use strict';

const assert = require('assert');
const {
  clusterEventArticles,
  groupArticlesIntoDevelopments,
  classifyDevelopmentType,
  determineEventStatus
} = require('../skills/news-intel/skill');

console.log('=== KOSINT News Intelligence Event-to-Developments Test Suite ===');

// ----------------------------------------------------
// TEST 1: Same event + same factual state + different sources
// ----------------------------------------------------
console.log('\n--- TEST 1: Same event + same factual state + different sources ---');
const t1Articles = [
  { id: 't1-1', title: 'Tri osobe uhapšene u Leposaviću zbog krađe', url: 'https://kossev.info/1', source: 'KoSSev', publishedAt: '2026-08-22T10:00:00.000Z' },
  { id: 't1-2', title: 'Policija uhapsila tri osobe u Leposaviću zbog krađe', url: 'https://radiokim.net/1', source: 'Radio KIM', publishedAt: '2026-08-22T10:10:00.000Z' }
];
const events1 = clusterEventArticles(t1Articles);
assert.strictEqual(events1.length, 1, 'Must form 1 Event');
assert.strictEqual(events1[0].developments.length, 1, 'Same factual state must form 1 Development');
assert.strictEqual(events1[0].developments[0].sources.length, 2, 'Development must merge both sources');
console.log('✓ Passed TEST 1');

// ----------------------------------------------------
// TEST 2: Same event + new factual development
// ----------------------------------------------------
console.log('\n--- TEST 2: Same event + new factual development ---');
const t2Articles = [
  { id: 't2-1', title: 'Tri osobe uhapšene u Leposaviću', url: 'https://jepize.com/1', source: 'Jepize', publishedAt: '2026-08-22T08:00:00.000Z' },
  { id: 't2-2', title: 'Uhapšen i četvrti osumnjičeni za krađu u Leposaviću', url: 'https://kossev.info/2', source: 'KoSSev', publishedAt: '2026-08-22T12:00:00.000Z' }
];
const events2 = clusterEventArticles(t2Articles);
assert.strictEqual(events2.length, 1, 'Must form 1 Event');
assert.strictEqual(events2[0].developments.length, 2, 'New factual state (4th suspect) must create 2 Developments');
console.log('✓ Passed TEST 2');

// ----------------------------------------------------
// TEST 3: Same event SR / AL / EN
// ----------------------------------------------------
console.log('\n--- TEST 3: Same event SR / AL / EN ---');
const t3Articles = [
  { id: 't3-1', title: 'Zaplenjeno 80kg kanabisa u Draču', url: 'https://radiokim.net/1', source: 'Radio KIM', publishedAt: '2026-08-22T14:00:00.000Z' },
  { id: 't3-2', title: 'Sekuestrohen 80 kg kanabis në Durrës', url: 'https://mitrovicasot.net/2', source: 'MitrovicaSOT', publishedAt: '2026-08-22T14:05:00.000Z' },
  { id: 't3-3', title: '80kg of cannabis seized in Durres', url: 'https://balkaninsight.com/3', source: 'Balkan Insight', publishedAt: '2026-08-22T14:15:00.000Z' }
];
const events3 = clusterEventArticles(t3Articles);
assert.strictEqual(events3.length, 1, 'Must form 1 Event across SR/AL/EN');
assert.strictEqual(events3[0].developments.length, 1, 'Same factual state across 3 languages must form 1 Development');
console.log('✓ Passed TEST 3');

// ----------------------------------------------------
// TEST 4: Same event + numeric change
// ----------------------------------------------------
console.log('\n--- TEST 4: Same event + numeric change ---');
const t4Articles = [
  { id: 't4-1', title: 'Uhapšene 3 osobe u Zvečanu', url: 'https://kossev.info/1', source: 'KoSSev', publishedAt: '2026-08-22T09:00:00.000Z' },
  { id: 't4-2', title: 'Uhapšene 4 osobe u Zvečanu', url: 'https://kossev.info/2', source: 'KoSSev', publishedAt: '2026-08-22T11:00:00.000Z' }
];
const events4 = clusterEventArticles(t4Articles);
assert.strictEqual(events4.length, 1, 'Must form 1 Event');
assert.strictEqual(events4[0].developments.length, 2, 'Numeric change (3 vs 4 arrested) must create 2 Developments');
console.log('✓ Passed TEST 4');

// ----------------------------------------------------
// TEST 5: Same event + money change
// ----------------------------------------------------
console.log('\n--- TEST 5: Same event + money change ---');
const t5Articles = [
  { id: 't5-1', title: 'Ukradeno 12.000 evra u Leposaviću', url: 'https://kossev.info/1', source: 'KoSSev', publishedAt: '2026-08-22T08:00:00.000Z' },
  { id: 't5-2', title: 'Pronađeno i vraćeno 5.750 evra nakon krađe u Leposaviću', url: 'https://kossev.info/2', source: 'KoSSev', publishedAt: '2026-08-22T13:00:00.000Z' }
];
const events5 = clusterEventArticles(t5Articles);
assert.strictEqual(events5.length, 1, 'Must form 1 Event');
assert.strictEqual(events5[0].developments.length, 2, 'Money recovery change must create 2 Developments');
console.log('✓ Passed TEST 5');

// ----------------------------------------------------
// TEST 6: Syndicated articles
// ----------------------------------------------------
console.log('\n--- TEST 6: Syndicated articles ---');
const t6Articles = [
  { id: 't6-1', title: 'Aksioni policor në Zveçan', url: 'https://koha.net/1', source: 'Koha', publishedAt: '2026-08-22T10:00:00.000Z' },
  { id: 't6-2', title: 'Aksioni policor në Zveçan', url: 'https://express.com/2', source: 'Gazeta Express', publishedAt: '2026-08-22T10:05:00.000Z' },
  { id: 't6-3', title: 'Aksioni policor në Zveçan', url: 'https://lajmi.net/3', source: 'Lajmi', publishedAt: '2026-08-22T10:10:00.000Z' }
];
const events6 = clusterEventArticles(t6Articles);
assert.strictEqual(events6.length, 1, 'Must form 1 Event');
assert.strictEqual(events6[0].developments.length, 1, 'Syndicated articles must form 1 Development');
assert.strictEqual(events6[0].sourceCount, 3, 'Must record 3 sources');
console.log('✓ Passed TEST 6');

// ----------------------------------------------------
// TEST 7: Contradiction
// ----------------------------------------------------
console.log('\n--- TEST 7: Contradiction ---');
const t7Articles = [
  { id: 't7-1', title: 'Raportohet për të shtëna te ura e Ibrit', url: 'https://express.com/1', source: 'Gazeta Express', publishedAt: '2026-08-22T18:00:00.000Z' },
  { id: 't7-2', title: 'Policija demantuje navode o pucnjavi te mosta na Ibru', url: 'https://kossev.info/2', source: 'KoSSev', publishedAt: '2026-08-22T18:30:00.000Z' }
];
const events7 = clusterEventArticles(t7Articles);
assert.strictEqual(events7.length, 1, 'Must form 1 Event');
assert.strictEqual(events7[0].developments.length, 2, 'Contradiction must form 2nd Development');
assert.strictEqual(events7[0].developments[1].type, 'CONTRADICTION');
assert.strictEqual(events7[0].status, 'CONTRADICTED');
console.log('✓ Passed TEST 7');

// ----------------------------------------------------
// TEST 8: Different event, same location
// ----------------------------------------------------
console.log('\n--- TEST 8: Different event, same location ---');
const t8Articles = [
  { id: 't8-1', title: 'Krađa automobila u Prištini', url: 'https://kossev.info/1', source: 'KoSSev', publishedAt: '2026-08-22T08:00:00.000Z' },
  { id: 't8-2', title: 'Zaplenjen kanabis u Prištini', url: 'https://kossev.info/2', source: 'KoSSev', publishedAt: '2026-08-22T15:00:00.000Z' }
];
const events8 = clusterEventArticles(t8Articles);
assert.strictEqual(events8.length, 2, 'Car theft vs cannabis seizure in Priština must form 2 separate Events');
console.log('✓ Passed TEST 8');

// ----------------------------------------------------
// TEST 9: Different event type
// ----------------------------------------------------
console.log('\n--- TEST 9: Different event type ---');
const t9Articles = [
  { id: 't9-1', title: 'Aksident komunikacioni në Zveçan', url: 'https://kossev.info/1', source: 'KoSSev', publishedAt: '2026-08-22T09:00:00.000Z' },
  { id: 't9-2', title: 'Zaplenjeno ilegalno oružje u Zvečanu', url: 'https://kossev.info/2', source: 'KoSSev', publishedAt: '2026-08-22T12:00:00.000Z' }
];
const events9 = clusterEventArticles(t9Articles);
assert.strictEqual(events9.length, 2, 'Traffic accident vs weapon seizure in Zvečan must form 2 separate Events');
console.log('✓ Passed TEST 9');

// ----------------------------------------------------
// TEST 10: Timeline ordering
// ----------------------------------------------------
console.log('\n--- TEST 10: Timeline ordering ---');
const t10Articles = [
  { id: 't10-2', title: 'Sastanak Kurti–Ulutaš otkazan', url: 'https://koha.net/2', source: 'Koha', publishedAt: '2026-08-22T18:00:00.000Z' },
  { id: 't10-1', title: 'Najavljen sastanak Kurti–Ulutaš', url: 'https://koha.net/1', source: 'Koha', publishedAt: '2026-08-22T14:00:00.000Z' }
];
const events10 = clusterEventArticles(t10Articles);
assert.strictEqual(['INITIAL_REPORT', 'MEETING_SCHEDULED'].includes(events10[0].developments[0].type), true, 'First chronological report must be INITIAL_REPORT or MEETING_SCHEDULED');
assert.strictEqual(events10[0].developments[1].type, 'MEETING_CANCELLED', 'Second chronological report must be MEETING_CANCELLED');
console.log('✓ Passed TEST 10');

// ----------------------------------------------------
// TEST 11: Latest development
// ----------------------------------------------------
console.log('\n--- TEST 11: Latest development ---');
const t11Articles = [
  { id: 't11-1', title: 'Najavljen sastanak Kurti–Ulutaš', url: 'https://koha.net/1', source: 'Koha', publishedAt: '2026-08-22T14:00:00.000Z' },
  { id: 't11-2', title: 'Sastanak Kurti–Ulutaš otkazan', url: 'https://koha.net/2', source: 'Koha', publishedAt: '2026-08-22T18:00:00.000Z' }
];
const events11 = clusterEventArticles(t11Articles);
assert.strictEqual(events11[0].latestDevelopment.type, 'MEETING_CANCELLED', 'latestDevelopment must be final factual development');
console.log('✓ Passed TEST 11');

// ----------------------------------------------------
// TEST 12: Source count vs independentSourceCount vs developmentCount
// ----------------------------------------------------
console.log('\n--- TEST 12: Source count vs independentSourceCount vs developmentCount ---');
const t12Articles = [
  { id: 't12-1', title: 'Aksioni në Zveçan', url: 'https://koha.net/1', source: 'Koha', publishedAt: '2026-08-22T10:00:00.000Z' },
  { id: 't12-2', title: 'Aksioni në Zveçan', url: 'https://express.com/1', source: 'Gazeta Express', publishedAt: '2026-08-22T10:05:00.000Z' },
  { id: 't12-3', title: 'Policia jep detaje për aksionin në Zveçan', url: 'https://kossev.info/2', source: 'KoSSev', publishedAt: '2026-08-22T11:00:00.000Z' }
];
const events12 = clusterEventArticles(t12Articles);
assert.strictEqual(events12[0].sourceCount, 3, 'sourceCount must be 3');
assert.strictEqual(events12[0].independentSourceCount, 2, 'independentSourceCount must be 2');
assert.strictEqual(events12[0].developmentCount, 2, 'developmentCount must be 2');
console.log('✓ Passed TEST 12');

// ----------------------------------------------------
// TEST 13: Mandatory Regression: Leposavić 3-Article Scenario
// ----------------------------------------------------
console.log('\n--- TEST 13: Mandatory Regression: Leposavić ---');
const leposavicArticles = [
  {
    id: 'lep-1',
    title: 'Policia në veri arreston tre persona për vjedhje të rëndë në Leposaviq',
    url: 'https://jepize.com/1',
    source: 'Jepize',
    publishedAt: '2026-08-21T23:00:00.000Z'
  },
  {
    id: 'lep-2',
    title: 'Vjedhja e rëndë në Leposaviq/ Arrestohet edhe një i dyshuar, u kap në kufi me para',
    url: 'https://indeksonline.net/2',
    source: 'Indeks Online',
    publishedAt: '2026-08-22T18:00:00.000Z'
  },
  {
    id: 'lep-3',
    title: 'Uhapšen i četvrti osumnjičeni za krađu u Leposaviću – maloletnik zatečen sa 5.750 evra na Jarinju',
    url: 'https://kossev.info/3',
    source: 'KoSSev',
    publishedAt: '2026-08-22T18:15:00.000Z'
  }
];

const events13 = clusterEventArticles(leposavicArticles);
assert.strictEqual(events13.length, 1, 'Leposavić scenario MUST yield exactly 1 Event');
assert.strictEqual(events13[0].sourceCount, 3, 'Must record 3 sources');
assert.strictEqual(events13[0].independentSourceCount >= 2, true, 'Must record 2+ independent sources');
assert.strictEqual(events13[0].developments.length >= 2, true, 'Must contain at least 2 Developments');
assert.strictEqual(/četvrti|4/i.test(events13[0].latestDevelopment.title), true, 'latestDevelopment must be 4th suspect arrest report');
console.log('✓ Passed TEST 13 (Mandatory Leposavić Regression)');

console.log('\n=== ALL EVENT DEVELOPMENT TESTS PASSED SUCCESSFULLY ===');
