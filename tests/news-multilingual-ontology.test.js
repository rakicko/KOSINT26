'use strict';

const assert = require('assert');
const {
  extractIntelligenceSignals,
  normalizeMultilingualText,
  calculateSecurityScore,
  clusterEventArticles,
  deduplicateNewsItems,
  explainEventMatch,
  CANONICAL_ENTITIES,
  CANONICAL_EVENT_TYPES,
  areLocationsCompatible,
  areEventTypesCompatible
} = require('../skills/news-intel/skill');

console.log('=== KOSINT Multilingual Intelligence Engine Verification Suite ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// Test A: Serbian Language Precision
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- Test A: Serbian Event Signal Extraction ---');
const sr1 = extractIntelligenceSignals('Uhapšen muškarac u Zvečanu', 'Kosovska policija privela osumnjičenog');
assert(sr1.entities.includes('loc:zvecan'), 'SR: loc:zvecan must be extracted');
assert(sr1.entities.includes('event:arrest'), 'SR: event:arrest must be extracted');
assert(sr1.institutions.some(i => i.id === 'inst:kosovo_police'), 'SR: Police must be extracted');

const sr2 = extractIntelligenceSignals('Policija zaplenila oružje u Zubinom Potoku', 'Otkriven arsenal municije');
assert(sr2.entities.includes('loc:zubin_potok'), 'SR: loc:zubin_potok must be extracted');
assert(sr2.entities.includes('event:weapon_seizure'), 'SR: event:weapon_seizure must be extracted');
console.log('✓ Passed Test A');

// ─────────────────────────────────────────────────────────────────────────────
// Test B: Albanian Language Precision
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Test B: Albanian Event Signal Extraction ---');
const al1 = extractIntelligenceSignals('Arrestohet një person në Mitrovicë', 'Policia e Kosovës ka ndaluar një të dyshuar');
assert(al1.entities.includes('loc:mitrovica'), 'AL: loc:mitrovica must be extracted');
assert(al1.entities.includes('event:arrest'), 'AL: event:arrest must be extracted');

const al2 = extractIntelligenceSignals('Policia konfiskon armë në Zveçan', 'U gjetën armatim dhe municion');
assert(al2.entities.includes('loc:zvecan'), 'AL: loc:zvecan must be extracted');
assert(al2.entities.includes('event:weapon_seizure'), 'AL: event:weapon_seizure must be extracted');
console.log('✓ Passed Test B');

// ─────────────────────────────────────────────────────────────────────────────
// Test C: English Language Precision
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Test C: English Event Signal Extraction ---');
const en1 = extractIntelligenceSignals('Police arrested a suspect in North Mitrovica', 'Kosovo Police detained the individual');
assert(en1.entities.includes('loc:mitrovica_north') || en1.entities.includes('loc:mitrovica'), 'EN: loc:mitrovica must be extracted');
assert(en1.entities.includes('event:arrest'), 'EN: event:arrest must be extracted');

const en2 = extractIntelligenceSignals('Weapons were seized in Zubin Potok', 'Police uncovered an ammunition cache');
assert(en2.entities.includes('loc:zubin_potok'), 'EN: loc:zubin_potok must be extracted');
assert(en2.entities.includes('event:weapon_seizure'), 'EN: event:weapon_seizure must be extracted');
console.log('✓ Passed Test C');

// ─────────────────────────────────────────────────────────────────────────────
// Test D: Cyrillic Script Transliteration & Extraction
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Test D: Cyrillic Script Extraction ---');
const cyr1 = extractIntelligenceSignals('Ухапшен мушкарац у Звечану', 'Полиција Косова привела осумњиченог');
assert(cyr1.entities.includes('loc:zvecan'), 'Cyrillic: loc:zvecan must be extracted');
assert(cyr1.entities.includes('event:arrest'), 'Cyrillic: event:arrest must be extracted');

const cyr2 = extractIntelligenceSignals('Полиција запленила оружје у Зубином Потоку', 'Пронађен арсенал');
assert(cyr2.entities.includes('loc:zubin_potok'), 'Cyrillic: loc:zubin_potok must be extracted');
assert(cyr2.entities.includes('event:weapon_seizure'), 'Cyrillic: event:weapon_seizure must be extracted');
console.log('✓ Passed Test D');

// ─────────────────────────────────────────────────────────────────────────────
// Test E: Cross-Language Semantic Clustering (SR / AL / EN)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Test E: Cross-Language Same Event Clustering ---');
const crossLangArticles = [
  { id: 'cl-1', title: 'Uhapšen muškarac u Mitrovici', url: 'https://kossev.info/cl1', source: 'KoSSev', publishedAt: '2026-08-22T10:00:00.000Z' },
  { id: 'cl-2', title: 'Arrested man in Mitrovica', url: 'https://balkaninsight.com/cl2', source: 'Balkan Insight', publishedAt: '2026-08-22T10:05:00.000Z' },
  { id: 'cl-3', title: 'Arrestohet një person në Mitrovicë', url: 'https://koha.net/cl3', source: 'Koha', publishedAt: '2026-08-22T10:10:00.000Z' }
];
const crossClusters = clusterEventArticles(crossLangArticles);
assert.strictEqual(crossClusters.length, 1, 'Cross-lingual reports of identical event must cluster into 1 Event');
assert.strictEqual(crossClusters[0].sourceCount, 3, 'Must record 3 distinct sources');
assert.strictEqual(crossClusters[0].developments.length, 1, 'Must form 1 unified Development');
console.log('✓ Passed Test E');

// ─────────────────────────────────────────────────────────────────────────────
// Test F: Scoped Negation & Contradiction Detection
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Test F: Scoped Negation and Denial ---');
const neg1 = extractIntelligenceSignals('Nije uhapšen osumnjičeni u Zvečanu');
assert.strictEqual(neg1.eventTypes.find(e => e.id === 'event:arrest')?.modality, 'DENIED', 'SR: Negated arrest must have modality DENIED');

const neg2 = extractIntelligenceSignals('Nuk është arrestuar i dyshuari në Mitrovicë');
assert.strictEqual(neg2.eventTypes.find(e => e.id === 'event:arrest')?.modality, 'DENIED', 'AL: Negated arrest must have modality DENIED');

const neg3 = extractIntelligenceSignals('Suspect was not arrested in Zubin Potok');
assert.strictEqual(neg3.eventTypes.find(e => e.id === 'event:arrest')?.modality, 'DENIED', 'EN: Negated arrest must have modality DENIED');
console.log('✓ Passed Test F');

// ─────────────────────────────────────────────────────────────────────────────
// Test G: Weapon Semantics (Discovery vs Seizure vs Use)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Test G: Weapon Discovery vs Seizure vs Gunfire ---');
const wepDiscovery = extractIntelligenceSignals('Pronađeno oružje u Zvečanu');
assert(wepDiscovery.eventTypes.some(e => e.id === 'event:weapon_discovery'), 'Must be weapon_discovery');

const wepSeizure = extractIntelligenceSignals('Zaplenjeno oružje u Leposaviću');
assert(wepSeizure.eventTypes.some(e => e.id === 'event:weapon_seizure'), 'Must be weapon_seizure');

const wepUse = extractIntelligenceSignals('Pucnjava u Severnoj Mitrovici');
assert(wepUse.eventTypes.some(e => e.id === 'event:weapon_use'), 'Must be weapon_use');
console.log('✓ Passed Test G');

// ─────────────────────────────────────────────────────────────────────────────
// Test H: Quantities & Money Extraction
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Test H: Quantities, Money & Person Counts ---');
const qArticle = extractIntelligenceSignals('Policia konfiskoi 80 kg drogë dhe 100 mijë euro, u arrestuan 3 persona');
assert(qArticle.quantities.some(q => q.value === 80000 && q.unit === 'g'), '80 kg must normalize to 80,000 g');
assert(qArticle.money.some(m => m.value === 100000 && m.currency === 'EUR'), '100 mijë euro must normalize to 100,000 EUR');
assert(qArticle.personsCount.some(p => p.exact && p.count === 3), '3 persons must be extracted');

const qArticle2 = extractIntelligenceSignals('Seized 12,000 EUR and arrested at least 5 suspects');
assert(qArticle2.money.some(m => m.value === 12000), '12,000 EUR must be extracted');
assert(qArticle2.personsCount.some(p => !p.exact && p.min === 5), 'at least 5 suspects must have min=5');
console.log('✓ Passed Test H');

// ─────────────────────────────────────────────────────────────────────────────
// Test I: Event Lifecycle & Development Timeline
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Test I: Complete Event Lifecycle Timeline ---');
const lifecycleArticles = [
  { id: 'lc-1', title: 'Pucnjava u Severnoj Mitrovici', url: 'https://koha.net/lc1', source: 'Koha', publishedAt: '2026-08-22T10:00:00.000Z' },
  { id: 'lc-2', title: 'Policija traga za osumnjičenim za pucnjavu u Mitrovici', url: 'https://express.com/lc2', source: 'Gazeta Express', publishedAt: '2026-08-22T11:00:00.000Z' },
  { id: 'lc-3', title: 'Uhapšen osumnjičeni za pucnjavu u Mitrovici', url: 'https://kossev.info/lc3', source: 'KoSSev', publishedAt: '2026-08-22T13:00:00.000Z' },
  { id: 'lc-4', title: 'Osumnjičeni za pucnjavu u Mitrovici pušten da se brani sa slobode', url: 'https://radiokim.net/lc4', source: 'Radio KIM', publishedAt: '2026-08-22T16:00:00.000Z' }
];
const lcClusters = clusterEventArticles(lifecycleArticles);
assert.strictEqual(lcClusters.length, 1, 'Lifecycle steps must remain unified in 1 Event');
assert.strictEqual(lcClusters[0].developments.length, 4, 'Must create 4 discrete timeline developments');
assert.strictEqual(lcClusters[0].developments[0].type, 'INITIAL_REPORT');
assert.strictEqual(lcClusters[0].developments[2].type, 'ARREST');
assert.strictEqual(lcClusters[0].developments[3].type, 'RELEASE');
assert.strictEqual(lcClusters[0].status, 'RESOLVED', 'Final state (release) marks event as RESOLVED');
console.log('✓ Passed Test I');

// ─────────────────────────────────────────────────────────────────────────────
// Test J: Location Conflict Isolation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Test J: Location Conflicts (Pejë vs Prizren) ---');
const locConflictArticles = [
  { id: 'lc-a', title: 'Aksion policor në Pejë', url: 'https://koha.net/peja1', source: 'Koha', publishedAt: '2026-08-22T10:00:00.000Z' },
  { id: 'lc-b', title: 'Aksion policor në Prizren', url: 'https://express.com/prizren1', source: 'Gazeta Express', publishedAt: '2026-08-22T10:00:00.000Z' }
];
const locClusters = clusterEventArticles(locConflictArticles);
assert.strictEqual(locClusters.length, 2, 'Pejë and Prizren events must NEVER cluster together');
console.log('✓ Passed Test J');

// ─────────────────────────────────────────────────────────────────────────────
// Test K: Non-False-Positive Boundaries (firefighter, meetingpoint)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Test K: Substring Safety (No False Positives) ---');
const safe1 = extractIntelligenceSignals('Firefighter was honoured in Pristina');
assert(!safe1.eventTypes.some(e => e.id === 'event:fire'), '"firefighter" must NOT trigger event:fire');

const safe2 = extractIntelligenceSignals('Tourists visited the meetingpoint in Prizren');
assert(!safe2.eventTypes.some(e => e.id === 'event:meeting'), '"meetingpoint" must NOT trigger event:meeting');
console.log('✓ Passed Test K');

// ─────────────────────────────────────────────────────────────────────────────
// Test L: Same URL Hard Deduplication
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Test L: Same URL Deduplication ---');
const sameUrlArticles = [
  { id: 'u1', title: 'Policija zaplenila oružje', url: 'https://kossev.info/art1?utm_source=twitter', source: 'KoSSev', publishedAt: '2026-08-22T10:00:00.000Z' },
  { id: 'u2', title: 'POLICIJA ZAPLENILA ORUŽJE', url: 'https://kossev.info/art1?utm_medium=rss', source: 'KoSSev', publishedAt: '2026-08-22T10:00:00.000Z' }
];
const dedupedUrls = deduplicateNewsItems(sameUrlArticles);
assert.strictEqual(dedupedUrls.length, 1, 'Same URL with different tracking params must deduplicate to 1 item');
console.log('✓ Passed Test L');

// ─────────────────────────────────────────────────────────────────────────────
// Test M: Syndication & Independent Source Calculation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Test M: Syndication & Independent Source Count ---');
const syndicationArticles = [
  { id: 'syn-1', title: 'Zaplenjeno oružje u Zvečanu', url: 'https://kossev.info/1', source: 'KoSSev', publishedAt: '2026-08-22T10:00:00.000Z' },
  { id: 'syn-2', title: 'Zaplenjeno oružje u Zvečanu', url: 'https://radiomitrovicasever.com/1', source: 'Radio Mitrovica Sever', publishedAt: '2026-08-22T10:05:00.000Z' },
  { id: 'syn-3', title: 'Zaplenjeno oružje u Zvečanu', url: 'https://radiokim.net/1', source: 'Radio KIM', publishedAt: '2026-08-22T10:10:00.000Z' },
  { id: 'syn-4', title: 'Novi detalji o zaplenjenom oružju u Zvečanu', url: 'https://koha.net/2', source: 'Koha', publishedAt: '2026-08-22T12:00:00.000Z' }
];
const synCluster = clusterEventArticles(syndicationArticles);
assert.strictEqual(synCluster.length, 1, 'Must form 1 Event');
assert.strictEqual(synCluster[0].sourceCount, 4, 'Total sources must be 4');
assert.strictEqual(synCluster[0].independentSourceCount, 2, 'Independent source count must be 2 (syndicated wire + independent update)');
console.log('✓ Passed Test M');

console.log('\n🎉 ALL MULTILINGUAL INTELLIGENCE ONTOLOGY TESTS PASSED SUCCESSFULLY! 🎉\n');
