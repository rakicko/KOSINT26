'use strict';

const assert = require('assert');
const {
  fetchNews,
  analyzeArticle,
  deduplicateNewsItems,
  clusterEventArticles,
  extractMultilingualEntities,
  normalizeHeadline,
  calculateTitleSimilarity,
  isDuplicateStory,
  normalizeUrl
} = require('../skills/news-intel/skill');

console.log('=== KOSINT News Intelligence Event Clustering & Deduplication System Test Suite ===');

// ----------------------------------------------------
// A. Identical Article Deduplication
// ----------------------------------------------------
console.log('\n--- Test A: Identical Article Deduplication ---');
const identicalArticles = [
  {
    id: 'art-1',
    title: 'Aksion i Policisë në Mitrovicë',
    url: 'https://koha.net/mitrovice-aksion?utm_source=rss&ref=feed',
    source: 'Koha',
    publishedAt: '2026-08-22T10:00:00.000Z'
  },
  {
    id: 'art-2',
    title: 'Aksion i Policisë në Mitrovicë',
    url: 'https://koha.net/mitrovice-aksion/',
    source: 'Koha',
    publishedAt: '2026-08-22T10:00:00.000Z'
  }
];

const dedupA = deduplicateNewsItems(identicalArticles);
assert.strictEqual(dedupA.length, 1, 'Identical URLs must produce 1 deduplicated article');
console.log('✓ Passed Test A');

// ----------------------------------------------------
// B. Same Event / Different Source
// ----------------------------------------------------
console.log('\n--- Test B: Same Event / Different Source ---');
const diffSourceArticles = [
  {
    id: 'art-b1',
    title: 'Policia e Kosovës konfiskon armatim në Zveçan',
    url: 'https://koha.net/zvecan-armatimi',
    source: 'Koha',
    publishedAt: '2026-08-22T12:00:00.000Z'
  },
  {
    id: 'art-b2',
    title: 'Policija Kosova zaplenila oružje u Zvečanu',
    url: 'https://kossev.info/zvecan-oruzje',
    source: 'KoSSev',
    publishedAt: '2026-08-22T12:15:00.000Z'
  }
];

const clustersB = clusterEventArticles(diffSourceArticles);
assert.strictEqual(clustersB.length, 1, 'Same event reported by Koha and KoSSev must cluster into 1 Event');
assert.strictEqual(clustersB[0].sources.length, 2, 'Event must record 2 sources');
console.log('✓ Passed Test B');

// ----------------------------------------------------
// C. Same Event / Different Language (Serbian ↔ Albanian ↔ English)
// ----------------------------------------------------
console.log('\n--- Test C: Same Event / Different Language ---');
const multilingualArticles = [
  {
    id: 'art-c1',
    title: 'Uhapšen četvrti osumnjičeni za krađu u Leposaviću',
    url: 'https://kossev.info/leposavic-kradja',
    source: 'KoSSev',
    publishedAt: '2026-08-22T14:00:00.000Z'
  },
  {
    id: 'art-c2',
    title: 'Arrestohet i dyshuari i katërt për vjedhje në Leposaviq',
    url: 'https://indeksonline.net/leposaviq-vjedhje',
    source: 'Indeks Online',
    publishedAt: '2026-08-22T14:10:00.000Z'
  },
  {
    id: 'art-c3',
    title: 'Fourth suspect arrested for theft in Leposavic',
    url: 'https://balkaninsight.com/leposavic-theft',
    source: 'Balkan Insight',
    publishedAt: '2026-08-22T14:30:00.000Z'
  }
];

const clustersC = clusterEventArticles(multilingualArticles);
assert.strictEqual(clustersC.length, 1, 'SR / AL / EN reporting on Leposavić theft must form 1 Event Cluster');
console.log('✓ Passed Test C');

// ----------------------------------------------------
// D. Same Event / Different Title
// ----------------------------------------------------
console.log('\n--- Test D: Same Event / Different Title ---');
const diffTitleArticles = [
  {
    id: 'art-d1',
    title: 'Sekuestrohen 80 kg kanabis në Durrës',
    url: 'https://mitrovicasot.net/durres-drog',
    source: 'MitrovicaSOT',
    publishedAt: '2026-08-22T15:00:00.000Z'
  },
  {
    id: 'art-d2',
    title: 'Zaplenjeno 80kg kanabisa u Draču, uhićene dve osobe',
    url: 'https://radiokim.net/drac-drog',
    source: 'Radio KIM',
    publishedAt: '2026-08-22T15:20:00.000Z'
  }
];

const clustersD = clusterEventArticles(diffTitleArticles);
assert.strictEqual(clustersD.length, 1, 'Different titles for 80kg cannabis in Durrës/Drač must cluster into 1 Event');
console.log('✓ Passed Test D');

// ----------------------------------------------------
// E. Same Event / New Development (Timeline Classification)
// ----------------------------------------------------
console.log('\n--- Test E: Same Event / New Development ---');
const developmentArticles = [
  {
    id: 'art-e1',
    title: 'Kurti najavio sastanak sa komandantom KFOR-a Ulutašem',
    url: 'https://koha.net/kurti-ulutas-1',
    source: 'Koha',
    publishedAt: '2026-08-22T16:00:00.000Z'
  },
  {
    id: 'art-e2',
    title: 'Sastanak Kurti–Ulutaš otkazan u poslednjem trenutku',
    url: 'https://koha.net/kurti-ulutas-2',
    source: 'Koha',
    publishedAt: '2026-08-22T18:00:00.000Z'
  },
  {
    id: 'art-e3',
    title: 'KFOR potvrdio da sastanak sa Kurtijem nije održan',
    url: 'https://kossev.info/kurti-ulutas-3',
    source: 'KoSSev',
    publishedAt: '2026-08-22T19:00:00.000Z'
  }
];

const clustersE = clusterEventArticles(developmentArticles);
assert.strictEqual(clustersE.length, 1, 'Developments for Kurti–Ulutaš meeting must belong to 1 Event');
assert.strictEqual(clustersE[0].developments.length, 2, 'Scheduled meeting + cancellation/confirmation must yield 2 Developments');
assert.strictEqual(clustersE[0].developments[0].type, 'MEETING_SCHEDULED');
assert.strictEqual(clustersE[0].developments[1].type, 'MEETING_CANCELLED');
assert.strictEqual(clustersE[0].developments[1].sources.length, 2, 'Cancellation development must group both Koha and KoSSev sources');
console.log('✓ Passed Test E');

// ----------------------------------------------------
// F & G. Syndicated Articles & Source Independence
// ----------------------------------------------------
console.log('\n--- Test F & G: Syndicated Articles & Source Independence ---');
const syndicatedArticles = [
  { id: 's1', title: 'Aksioni në Zveçan', url: 'https://koha.net/a1', source: 'Koha', publishedAt: '2026-08-22T10:00:00.000Z' },
  { id: 's2', title: 'Aksioni në Zveçan', url: 'https://express.com/a1', source: 'Gazeta Express', publishedAt: '2026-08-22T10:05:00.000Z' },
  { id: 's3', title: 'Aksioni në Zveçan', url: 'https://lajmi.net/a1', source: 'Lajmi', publishedAt: '2026-08-22T10:10:00.000Z' },
  { id: 's4', title: 'Policia jep detaje të reja për aksionin në Zveçan', url: 'https://kossev.info/b1', source: 'KoSSev', publishedAt: '2026-08-22T11:00:00.000Z' }
];

const clustersFG = clusterEventArticles(syndicatedArticles);
assert.strictEqual(clustersFG.length, 1, 'Syndicated articles + update must form 1 Event');
assert.strictEqual(clustersFG[0].sourceCount, 4, 'Total source count must be 4');
assert.strictEqual(clustersFG[0].independentSourceCount, 2, 'Independent source count must be 2');
console.log('✓ Passed Test F & G');

// ----------------------------------------------------
// H. Primary Source Detection
// ----------------------------------------------------
console.log('\n--- Test H: Primary Source Detection ---');
const primarySourceArticles = [
  { id: 'p1', title: 'Incident u Zubin Potoku', url: 'https://lajmi.net/p1', source: 'Lajmi', publishedAt: '2026-08-22T10:00:00.000Z' },
  { id: 'p2', title: 'Incident u Zubin Potoku', url: 'https://koha.net/p1', source: 'Koha', publishedAt: '2026-08-22T10:05:00.000Z' }
];

const clustersH = clusterEventArticles(primarySourceArticles);
assert.strictEqual(clustersH[0].primarySource, 'Koha', 'Authoritative source (Koha) must be selected as primarySource');
console.log('✓ Passed Test H');

// ----------------------------------------------------
// J. Unrelated Articles with Similar Keywords
// ----------------------------------------------------
console.log('\n--- Test J: Unrelated Articles with Similar Keywords ---');
const unrelatedArticles = [
  {
    id: 'u1',
    title: 'Policia e Kosovës arreston dy persona në Pejë për vjedhje',
    url: 'https://express.com/peje-vjedhje',
    source: 'Gazeta Express',
    publishedAt: '2026-08-22T10:00:00.000Z'
  },
  {
    id: 'u2',
    title: 'Policia e Kosovës arreston tri persona në Prizren për mashtrim',
    url: 'https://express.com/prizren-mashtrim',
    source: 'Gazeta Express',
    publishedAt: '2026-08-22T10:30:00.000Z'
  }
];

const clustersJ = clusterEventArticles(unrelatedArticles);
assert.strictEqual(clustersJ.length, 2, 'Unrelated events in Pejë and Prizren must form 2 separate Events');
console.log('✓ Passed Test J');

// ----------------------------------------------------
// K. Same People but Different Events
// ----------------------------------------------------
console.log('\n--- Test K: Same People but Different Events ---');
const samePeopleDiffEvents = [
  {
    id: 'k1',
    title: 'Kurti u takua me ambasadorët e Kuintit në Prishtinë',
    url: 'https://koha.net/kurti-kuint',
    source: 'Koha',
    publishedAt: '2026-08-22T09:00:00.000Z'
  },
  {
    id: 'k2',
    title: 'Kurti vizitoi fabrikën e re të përpunimit në Podujevë',
    url: 'https://koha.net/kurti-podujeve',
    source: 'Koha',
    publishedAt: '2026-08-22T14:00:00.000Z'
  }
];

const clustersK = clusterEventArticles(samePeopleDiffEvents);
assert.strictEqual(clustersK.length, 2, 'Same person (Kurti) in 2 different events (Quint vs Podujevë factory) must be 2 separate Events');
console.log('✓ Passed Test K');

// ----------------------------------------------------
// L. Same Location but Different Events
// ----------------------------------------------------
console.log('\n--- Test L: Same Location but Different Events ---');
const sameLocDiffEvents = [
  {
    id: 'l1',
    title: 'Aksident komunikacioni me të lënduar në Zveçan',
    url: 'https://kossev.info/zvecan-aksident',
    source: 'KoSSev',
    publishedAt: '2026-08-22T08:00:00.000Z'
  },
  {
    id: 'l2',
    title: 'Policia konfiskon armatim ilegal në një shtëpi në Zveçan',
    url: 'https://kossev.info/zvecan-armatimi-2',
    source: 'KoSSev',
    publishedAt: '2026-08-22T15:00:00.000Z'
  }
];

const clustersL = clusterEventArticles(sameLocDiffEvents);
assert.strictEqual(clustersL.length, 2, 'Traffic accident vs weapon seizure in Zveçan must form 2 separate Events');
// ----------------------------------------------------
// M. Numerical Differences & Currency Money Anchors
// ----------------------------------------------------
console.log('\n--- Test M: Numerical & Currency Money Anchors ---');
const moneyArticles = [
  {
    id: 'm1',
    title: 'Policia konfiskon 50.000 euro të falsifikuara në Prishtinë',
    url: 'https://koha.net/prishtine-euro-1',
    source: 'Koha',
    publishedAt: '2026-08-22T11:00:00.000Z'
  },
  {
    id: 'm2',
    title: 'Zaplenjeno 50.000 evra lažnog novca u Prištini',
    url: 'https://kossev.info/pristina-euro-2',
    source: 'KoSSev',
    publishedAt: '2026-08-22T11:20:00.000Z'
  }
];

const clustersM = clusterEventArticles(moneyArticles);
assert.strictEqual(clustersM.length, 1, 'Articles anchored by 50.000 euro money quantity in Prishtinë must form 1 Event Cluster');
console.log('✓ Passed Test M');

// ----------------------------------------------------
// N. Contradiction Reports & Timeline Handling
// ----------------------------------------------------
console.log('\n--- Test N: Contradiction Reports & Timeline Handling ---');
const contradictionArticles = [
  {
    id: 'n1',
    title: 'Raportohet për të shtëna me armë te ura e Ibrit në Mitrovicë',
    url: 'https://express.com/stena-1',
    source: 'Gazeta Express',
    publishedAt: '2026-08-22T18:00:00.000Z'
  },
  {
    id: 'n2',
    title: 'Policia e Kosovës demanton navode o pucnjavi te mosta na Ibru',
    url: 'https://kossev.info/stena-2',
    source: 'KoSSev',
    publishedAt: '2026-08-22T18:30:00.000Z'
  }
];

const clustersN = clusterEventArticles(contradictionArticles);
assert.strictEqual(clustersN.length, 1, 'Contradictory report must attach to original Event timeline as CONTRADICTION');
assert.strictEqual(clustersN[0].developments.some(d => d.type === 'CONTRADICTION'), true, 'Timeline must contain a CONTRADICTION development');
console.log('✓ Passed Test N');

// ----------------------------------------------------
// O. URL Tracking Parameters Stripping
// ----------------------------------------------------
console.log('\n--- Test O: URL Tracking Parameters Stripping ---');
const trackingParamArticles = [
  { id: 'o1', title: 'Aksion në Mitrovicë', url: 'https://koha.net/art-1?utm_source=fb&utm_medium=cpc&fbclid=123', source: 'Koha', publishedAt: '2026-08-22T10:00:00.000Z' },
  { id: 'o2', title: 'Aksion në Mitrovicë', url: 'https://koha.net/art-1?ref=twitter', source: 'Koha', publishedAt: '2026-08-22T10:00:00.000Z' }
];
const dedupO = deduplicateNewsItems(trackingParamArticles);
assert.strictEqual(dedupO.length, 1, 'Articles with tracking params must resolve to 1 deduplicated article');
console.log('✓ Passed Test O');

// ----------------------------------------------------
// P. Deterministic Event ID
// ----------------------------------------------------
console.log('\n--- Test P: Deterministic Event ID ---');
const eventA1 = clusterEventArticles([
  { id: 'p1', title: 'Policija zaplenila oružje u Zvečanu', url: 'https://kossev.info/p1', source: 'KoSSev', publishedAt: '2026-08-22T12:00:00.000Z' }
]);
const eventA2 = clusterEventArticles([
  { id: 'p1', title: 'Policija zaplenila oružje u Zvečanu', url: 'https://kossev.info/p1', source: 'KoSSev', publishedAt: '2026-08-22T12:00:00.000Z' }
]);
assert.strictEqual(eventA1[0].eventId, eventA2[0].eventId, 'eventId must be 100% deterministic and identical across repeated runs');
console.log('✓ Passed Test P');

// ----------------------------------------------------
// Q. Development Chronology
// ----------------------------------------------------
console.log('\n--- Test Q: Development Chronology ---');
const chronoArticles = [
  { id: 'q2', title: 'Sastanak Kurti–Ulutaš otkazan', url: 'https://koha.net/q2', source: 'Koha', publishedAt: '2026-08-22T18:00:00.000Z' },
  { id: 'q1', title: 'Najavljen sastanak Kurti–Ulutaš', url: 'https://koha.net/q1', source: 'Koha', publishedAt: '2026-08-22T10:00:00.000Z' }
];
const clusterQ = clusterEventArticles(chronoArticles);
assert.strictEqual(clusterQ[0].developments[0].type, 'MEETING_SCHEDULED', 'Earlier development must be first');
assert.strictEqual(clusterQ[0].developments[1].type, 'MEETING_CANCELLED', 'Later development must be second');
assert.strictEqual(clusterQ[0].latestDevelopment.type, 'MEETING_CANCELLED', 'latestDevelopment must be final development');
console.log('✓ Passed Test Q');

// ----------------------------------------------------
// R. Missing publishedAt Handled Gracefully
// ----------------------------------------------------
console.log('\n--- Test R: Missing publishedAt Handled Gracefully ---');
const missingDateArticles = [
  { id: 'r1', title: 'Zaplenjeno oružje u Leposaviću', url: 'https://kossev.info/r1', source: 'KoSSev' },
  { id: 'r2', title: 'Konfiskohen armë në Leposaviq', url: 'https://koha.net/r2', source: 'Koha', publishedAt: '2026-08-22T12:00:00.000Z' }
];
const clusterR = clusterEventArticles(missingDateArticles);
assert.strictEqual(clusterR.length, 1, 'Missing publishedAt must not crash clustering');
console.log('✓ Passed Test R');

// ----------------------------------------------------
// S. Duplicate Body / Syndication
// ----------------------------------------------------
console.log('\n--- Test S: Duplicate Body / Syndication ---');
const syndArticles = [
  { id: 's1', title: 'Aksioni në veri', description: 'Policia ka zhvilluar aksion të gjerë në veri të Mitrovicës.', url: 'https://koha.net/s1', source: 'Koha', publishedAt: '2026-08-22T10:00:00.000Z' },
  { id: 's2', title: 'Aksioni në veri', description: 'Policia ka zhvilluar aksion të gjerë në veri të Mitrovicës.', url: 'https://express.com/s2', source: 'Gazeta Express', publishedAt: '2026-08-22T10:05:00.000Z' }
];
const clusterS = clusterEventArticles(syndArticles);
assert.strictEqual(clusterS.length, 1, 'Syndicated articles must form 1 Event');
assert.strictEqual(clusterS[0].developments.length, 1, 'Syndicated articles must form 1 Development');
assert.strictEqual(clusterS[0].sourceCount, 2, 'sourceCount must be 2');
console.log('✓ Passed Test S');

// ----------------------------------------------------
// T. Exact Real-World Feed Regression: Kurti-Ulutaš Meeting + Mitropol Espionage + MitrovicaSOT
// ----------------------------------------------------
console.log('\n--- Test T: Real Feed Regression (Kurti-Ulutaš + Mitropol Espionage + MitrovicaSOT) ---');
const realFeedArticles = [
  {
    id: 'rf-1',
    title: 'Kfor: Otkazan sastanak general-majora Ulutaša i Aljbina Kurtija',
    description: 'KFOR je saopštio da sastanak nije održan zbog nepredviđenih okolnosti.',
    url: 'https://radiomitrovicasever.com/otkazan-sastanak',
    source: 'Radio Mitrovica Sever',
    publishedAt: '2026-08-22T19:00:00.000Z'
  },
  {
    id: 'rf-2',
    title: 'Nije održan sastanak Ulutaša i Kurtija',
    description: 'Zbog nepredviđenih okolnosti danas nije održan sastanak komandanta KFOR-a i premijera.',
    url: 'https://radiokim.net/nije-odrzan-sastanak',
    source: 'Radio KIM',
    publishedAt: '2026-08-22T19:05:00.000Z'
  },
  {
    id: 'rf-3',
    title: 'Dështon takimi Kurti-Ulutash',
    description: 'Takimi nuk u zhvillua për shkak të rrethanave të paparashikuara.',
    url: 'https://koha.net/deshton-takimi',
    source: 'Koha',
    publishedAt: '2026-08-22T18:00:00.000Z'
  },
  {
    id: 'rf-4',
    title: 'Kroacija ngre aktakuzë për spiunazh ndaj pilotit kroat që kishte shërbyer në KFOR',
    description: 'Prokuroria në Kroaci ka ngritur aktakuzë ndaj pilotit ushtarak.',
    url: 'https://mitropol.net/kroacia-spiunazh',
    source: 'Mitropol',
    publishedAt: '2026-08-22T14:00:00.000Z'
  },
  {
    id: 'rf-5',
    title: 'Albin Kurti takohet sot me komandantin e KFOR-it për çështjen e urës së Ibrit',
    description: 'Kryeministri Albin Kurti paralajmëron takim lidhur me urën.',
    url: 'https://mitrovicasot.net/kurti-kfor-ura',
    source: 'MitrovicaSOT',
    publishedAt: '2026-08-22T11:00:00.000Z'
  }
];

const clustersT = clusterEventArticles(realFeedArticles);
assert.strictEqual(clustersT.length, 3, 'Real feed MUST produce exactly 3 separate Events');

const kurtiMeetingCluster = clustersT.find(c => c.articles.some(a => a.id === 'rf-1'));
assert.strictEqual(kurtiMeetingCluster.developments.length, 1, 'Cancellation articles MUST form 1 Development');
assert.strictEqual(kurtiMeetingCluster.developments[0].type, 'MEETING_CANCELLED', 'Development type must be MEETING_CANCELLED');
assert.strictEqual(kurtiMeetingCluster.developments[0].sources.length, 3, 'Cancellation development must merge all 3 sources');
assert.strictEqual(kurtiMeetingCluster.sourceCount, 3, 'Must record 3 sources');

const espionageCluster = clustersT.find(c => c.articles.some(a => a.id === 'rf-4'));
assert.strictEqual(Boolean(espionageCluster), true, 'Mitropol espionage story must be isolated');

const iberBridgeCluster = clustersT.find(c => c.articles.some(a => a.id === 'rf-5'));
assert.strictEqual(Boolean(iberBridgeCluster), true, 'MitrovicaSOT Ibër bridge story must be isolated');
console.log('✓ Passed Test T (Exact Real-World Feed Regression)');

// ====================================================
// MANDATORY REGRESSION TESTS
// ====================================================

console.log('\n=== MANDATORY REGRESSION TESTS ===');

// Regression Test 1: Kurti-Ulutaš
console.log('Regression Test 1: Kurti–Ulutaš meeting cancellation across 6 portals...');
const kurtiUlutasPortals = [
  { id: 'r1-1', title: 'Kurti–Ulutaš sastanak nije održan', url: 'https://kossev.info/1', source: 'KoSSev', publishedAt: '2026-08-22T19:00:00.000Z' },
  { id: 'r1-2', title: 'Kurti–Ulutaš sastanak nije održan', url: 'https://lajmi.net/2', source: 'Lajmi', publishedAt: '2026-08-22T19:05:00.000Z' },
  { id: 'r1-3', title: 'Kurti–Ulutaš sastanak nije održan', url: 'https://radiomitrovicasever.com/3', source: 'Radio Mitrovica Sever', publishedAt: '2026-08-22T19:10:00.000Z' },
  { id: 'r1-4', title: 'Kurti–Ulutaš sastanak nije održan', url: 'https://mitropol.net/4', source: 'Mitropol', publishedAt: '2026-08-22T19:12:00.000Z' },
  { id: 'r1-5', title: 'Sastanak Kurti–Ulutaš nije održan', url: 'https://koha.net/5', source: 'Koha', publishedAt: '2026-08-22T19:15:00.000Z' },
  { id: 'r1-6', title: 'Kurti–Ulutaš sastanak nije održan', url: 'https://radiokim.net/6', source: 'Radio KIM', publishedAt: '2026-08-22T19:20:00.000Z' }
];

const reg1 = clusterEventArticles(kurtiUlutasPortals);
assert.strictEqual(reg1.length, 1, 'Kurti–Ulutaš meeting reports across 6 portals MUST yield exactly 1 Event');
assert.strictEqual(reg1[0].sourceCount, 6, 'Event must record 6 sources');
assert.strictEqual(reg1[0].developments.length, 1, 'Identical cancellation reports must yield 1 Development');
assert.strictEqual(reg1[0].developments[0].sources.length, 6, 'Development must contain all 6 sources');
console.log('✓ Passed Regression Test 1: Exactly 1 Event object and 1 Development created for 6 reporting media outlets');

// Regression Test 2: Leposavić theft
console.log('Regression Test 2: Leposavić theft across KoSSev, Indeks Online, Jepize...');
const leposavicTheftPortals = [
  { id: 'r2-1', title: 'Uhapšen četvrti osumnjičeni za krađu u Leposaviću', url: 'https://kossev.info/lep1', source: 'KoSSev', publishedAt: '2026-08-22T12:00:00.000Z' },
  { id: 'r2-2', title: 'Vjedhja e rëndë në Leposaviq / Arrestohet edhe një i dyshuar', url: 'https://indeksonline.net/lep2', source: 'Indeks Online', publishedAt: '2026-08-22T12:05:00.000Z' },
  { id: 'r2-3', title: 'Arrestohet i dyshuari i katërt për vjedhje në Leposaviq', url: 'https://jepize.com/lep3', source: 'Jepize', publishedAt: '2026-08-22T12:10:00.000Z' }
];

const reg2 = clusterEventArticles(leposavicTheftPortals);
assert.strictEqual(reg2.length, 1, 'Leposavić theft reports MUST yield 1 Event cluster instead of 3 separate events');
assert.strictEqual(reg2[0].sourceCount, 3, 'Event must record 3 sources');
console.log('✓ Passed Regression Test 2: Exactly 1 Event Cluster created for Leposavić theft');

// Regression Test 3: 80kg cannabis / Durrës
console.log('Regression Test 3: 80kg cannabis / Durrës across Radio KIM, MitrovicaSOT...');
const durresDrugPortals = [
  { id: 'r3-1', title: 'Zaplenjeno 80kg kanabisa u Draču', url: 'https://radiokim.net/durres1', source: 'Radio KIM', publishedAt: '2026-08-22T16:00:00.000Z' },
  { id: 'r3-2', title: 'Sekuestrohen 80 kg kanabis në Durrës', url: 'https://mitrovicasot.net/durres2', source: 'MitrovicaSOT', publishedAt: '2026-08-22T16:15:00.000Z' }
];

const reg3 = clusterEventArticles(durresDrugPortals);
assert.strictEqual(reg3.length, 1, '80kg cannabis / Durrës reports MUST yield 1 Event cluster');
assert.strictEqual(reg3[0].sourceCount, 2, 'Event must record 2 sources');
console.log('✓ Passed Regression Test 3: Exactly 1 Event Cluster created for 80kg cannabis / Durrës');

console.log('\n=== ALL EVENT CLUSTERING & DEDUPLICATION TESTS PASSED SUCCESSFULLY ===');
