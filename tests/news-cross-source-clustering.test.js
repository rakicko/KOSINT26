'use strict';

const assert = require('assert');
const {
  clusterEventArticles,
  deduplicateNewsItems,
  calculateJaccardSimilarity,
  tokenizeTitleForJaccard,
  extractBilingualBridgeEntities,
  detectArticleLanguage,
  computeVerificationStatus
} = require('../skills/news-intel/clustering');

console.log('=== World Monitor-Inspired Cross-Source Merging & Verification Test Suite ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Jaccard Title Similarity & Stop Words Stripping
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- Test 1: Jaccard Title Similarity & Stop Words Stripping ---');

const title1 = 'Kosovo Police Arrested Two Suspects in Mitrovica';
const title2 = 'Two Suspects Arrested by Police in Mitrovica';
const titleUnrelated = 'Severe Weather Warning and Rain Forecast for Prishtina';

const tokens1 = tokenizeTitleForJaccard(title1);
const tokens2 = tokenizeTitleForJaccard(title2);

assert(tokens1.includes('police'), 'Tokens should include police');
assert(tokens1.includes('mitrovica'), 'Tokens should include mitrovica');
assert(!tokens1.includes('in') && !tokens1.includes('by'), 'Tokens should strip common stop words');

const simHigh = calculateJaccardSimilarity(title1, title2);
const simLow = calculateJaccardSimilarity(title1, titleUnrelated);

console.log(`High similarity score: ${simHigh.toFixed(2)}`);
console.log(`Low similarity score: ${simLow.toFixed(2)}`);

assert(simHigh >= 0.40, `Similar titles should have similarity >= 0.40, got ${simHigh}`);
assert(simLow < 0.20, `Unrelated titles should have similarity < 0.20, got ${simLow}`);
console.log('✓ Passed Test 1: Jaccard similarity and tokenization works as expected.\n');

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: Bilingual Entity Bridge (Kosovo Operational Domain)
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- Test 2: Bilingual Entity Bridge (SR ↔ SQ ↔ EN) ---');

const srText = 'Kosovska policija: uhapšen osumnjičeni u Banjskoj kod Zvečana';
const sqText = 'Policia e Kosovës: arrestohet një i dyshuar në Bajskë afër Zveçanit';
const enText = 'Kosovo Police: suspect arrested in Banjska near Zvecan';

const srBridges = extractBilingualBridgeEntities(srText);
const sqBridges = extractBilingualBridgeEntities(sqText);
const enBridges = extractBilingualBridgeEntities(enText);

console.log('SR Bridges:', Array.from(srBridges));
console.log('SQ Bridges:', Array.from(sqBridges));
console.log('EN Bridges:', Array.from(enBridges));

assert(srBridges.includes('bridge_loc:banjska'), 'SR text should map to bridge_loc:banjska');
assert(sqBridges.includes('bridge_loc:banjska'), 'SQ text should map to bridge_loc:banjska');
assert(enBridges.includes('bridge_loc:banjska'), 'EN text should map to bridge_loc:banjska');

assert(srBridges.includes('bridge_tactical:arrest'), 'SR text should map to bridge_tactical:arrest');
assert(sqBridges.includes('bridge_tactical:arrest'), 'SQ text should map to bridge_tactical:arrest');
assert(enBridges.includes('bridge_tactical:arrest'), 'EN text should map to bridge_tactical:arrest');

assert(srBridges.includes('bridge_loc:zvecan'), 'SR text should map to bridge_loc:zvecan');
assert(sqBridges.includes('bridge_loc:zvecan'), 'SQ text should map to bridge_loc:zvecan');

console.log('✓ Passed Test 2: Bilingual bridges map SR, SQ, and EN equivalents to identical canonical IDs.\n');

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Simultaneous SR + SQ Articles Tagged as CROSS-VERIFIED
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- Test 3: Simultaneous SR + SQ Articles on Same Incident (Banjska Arrest) ---');

const now = Date.now();
const crossArticles = [
  {
    id: 'art-sr-1',
    title: 'Uhapšeno lice u selu Banjska, zaplenjeno oružje',
    url: 'https://kossev.info/uhapseno-lice-banjska',
    source: 'KoSSev',
    language: 'sr',
    publishedAt: new Date(now - 30 * 60 * 1000).toISOString() // 30m ago
  },
  {
    id: 'art-sq-1',
    title: 'Arrestohet një person në Bajskë, konfiskohet armatim',
    url: 'https://koha.net/arrestohet-bajske-arme',
    source: 'Koha Ditore',
    language: 'sq',
    publishedAt: new Date(now - 15 * 60 * 1000).toISOString() // 15m ago
  }
];

const clusters = clusterEventArticles(crossArticles);

assert.strictEqual(clusters.length, 1, 'SR and SQ articles on Banjska arrest must cluster into 1 event');
const banjskaCluster = clusters[0];

console.log('Cluster verification status:', banjskaCluster.verificationStatus);
console.log('Cluster languages:', banjskaCluster.languages);
console.log('Cluster sources count:', banjskaCluster.sourceCount);
console.log('Cluster participating sources:', banjskaCluster.participatingSources);

assert.strictEqual(banjskaCluster.verificationStatus, 'CROSS-VERIFIED', 'Event reported by SR + SQ must be CROSS-VERIFIED');
assert(banjskaCluster.languages.includes('sr'), 'Languages must include "sr"');
assert(banjskaCluster.languages.includes('sq'), 'Languages must include "sq"');
assert.strictEqual(banjskaCluster.sourceCount, 2, 'Source count must be 2');
assert(banjskaCluster.participatingSources.includes('KoSSev'), 'Participating sources must include KoSSev');
assert(banjskaCluster.participatingSources.includes('Koha Ditore'), 'Participating sources must include Koha Ditore');

console.log('✓ Passed Test 3: Cross-source clustering tags SR + SQ reporting as CROSS-VERIFIED.\n');

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Single-Source Article Receives SINGLE-SOURCE
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- Test 4: Single-Source Article Receives SINGLE-SOURCE ---');

const singleArticle = [
  {
    id: 'art-single-1',
    title: 'Novi radovi na putu prema prelazu Jarinje',
    url: 'https://radiomitrovicasever.com/put-jarinje',
    source: 'Radio Mitrovica Sever',
    language: 'sr',
    publishedAt: new Date(now - 60 * 60 * 1000).toISOString()
  }
];

const singleClusters = clusterEventArticles(singleArticle);
assert.strictEqual(singleClusters.length, 1);
assert.strictEqual(singleClusters[0].verificationStatus, 'SINGLE-SOURCE', 'Single article must receive SINGLE-SOURCE');
assert.strictEqual(singleClusters[0].sourceCount, 1);
assert.deepStrictEqual(singleClusters[0].participatingSources, ['Radio Mitrovica Sever']);
console.log('✓ Passed Test 4: Single-source articles correctly tagged SINGLE-SOURCE.\n');

// ─────────────────────────────────────────────────────────────────────────────
// Test 5: Multi-Source of Same Linguistic Bloc Receives MULTI-SOURCE
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- Test 5: Multi-Source of Same Linguistic Bloc Receives MULTI-SOURCE ---');

const multiSameBlocArticles = [
  {
    id: 'art-sq-a',
    title: 'Aksion i Policisë në Mitrovicë të Jugut për drogë',
    url: 'https://koha.net/mitrovice-droge-1',
    source: 'Koha',
    language: 'sq',
    publishedAt: new Date(now - 45 * 60 * 1000).toISOString()
  },
  {
    id: 'art-sq-b',
    title: 'Aksion i madh policor në Mitrovicë, sekuestrohen narkotikë',
    url: 'https://gazetaexpress.com/mitrovice-droge-2',
    source: 'Gazeta Express',
    language: 'sq',
    publishedAt: new Date(now - 30 * 60 * 1000).toISOString()
  },
  {
    id: 'art-sq-c',
    title: 'Policia konfiskon lëndë narkotike gjatë aksionit në Mitrovicë',
    url: 'https://indeksonline.net/mitrovice-droge-3',
    source: 'Indeks Online',
    language: 'sq',
    publishedAt: new Date(now - 20 * 60 * 1000).toISOString()
  }
];

const multiClusters = clusterEventArticles(multiSameBlocArticles);
assert.strictEqual(multiClusters.length, 1, '3 articles on same Mitrovica raid must cluster into 1 event');
assert.strictEqual(multiClusters[0].verificationStatus, 'MULTI-SOURCE', '>= 3 sources from same linguistic bloc must be MULTI-SOURCE');
assert.strictEqual(multiClusters[0].sourceCount, 3);
assert.strictEqual(multiClusters[0].languages.length, 1);
assert.strictEqual(multiClusters[0].languages[0], 'sq');
console.log('✓ Passed Test 5: Multi-source reports without cross-bloc receive MULTI-SOURCE.\n');

// ─────────────────────────────────────────────────────────────────────────────
// Test 6: Rolling 4-Hour Time Window Boundary
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- Test 6: Rolling 4-Hour Time Window Boundary ---');

const patrolWithin4h = [
  {
    id: 'art-time-1',
    title: 'Patrola primećena na mostu u Mitrovici',
    url: 'https://kossev.info/mitrovica-patrola-1',
    source: 'KoSSev',
    language: 'sr',
    publishedAt: '2026-09-06T08:00:00.000Z'
  },
  {
    id: 'art-time-2',
    title: 'Patrullë afër urës në Mitrovicë',
    url: 'https://koha.net/mitrovice-patrulle-2',
    source: 'Koha',
    language: 'sq',
    publishedAt: '2026-09-06T10:00:00.000Z' // 2 hours later (within 4h window)
  }
];

const clustersWithin = clusterEventArticles(patrolWithin4h);
assert.strictEqual(clustersWithin.length, 1, 'Bilingual patrol reports within 4 hours must merge into 1 cluster');
assert.strictEqual(clustersWithin[0].verificationStatus, 'CROSS-VERIFIED');

const patrolApart = [
  {
    id: 'art-time-3',
    title: 'Patrola primećena na mostu u Mitrovici',
    url: 'https://kossev.info/mitrovica-patrola-3',
    source: 'KoSSev',
    language: 'sr',
    publishedAt: '2026-09-06T08:00:00.000Z'
  },
  {
    id: 'art-time-4',
    title: 'Patrullë afër urës në Mitrovicë',
    url: 'https://koha.net/mitrovice-patrulle-4',
    source: 'Koha',
    language: 'sq',
    publishedAt: '2026-09-06T16:00:00.000Z' // 8 hours later (> 4h window)
  }
];

const clustersApart = clusterEventArticles(patrolApart);
assert.strictEqual(clustersApart.length, 2, 'Bilingual patrol reports separated by > 4 hours must remain 2 separate events');
console.log('✓ Passed Test 6: Rolling 4-hour time window respected (clusters within 4h, separates > 4h).\n');

// ─────────────────────────────────────────────────────────────────────────────
// Test 7: Language Detection & ComputeVerificationStatus Unit Logic
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- Test 7: computeVerificationStatus Unit Logic ---');

assert.strictEqual(computeVerificationStatus(['sr', 'sq'], 2), 'CROSS-VERIFIED');
assert.strictEqual(computeVerificationStatus(['sr', 'sq', 'en'], 3), 'CROSS-VERIFIED');
assert.strictEqual(computeVerificationStatus(['sr'], 3), 'MULTI-SOURCE');
assert.strictEqual(computeVerificationStatus(['sq'], 4), 'MULTI-SOURCE');
assert.strictEqual(computeVerificationStatus(['sq'], 2), 'MULTI-SOURCE');
assert.strictEqual(computeVerificationStatus(['sr'], 1), 'SINGLE-SOURCE');
assert.strictEqual(computeVerificationStatus([], 1), 'SINGLE-SOURCE');

console.log('✓ Passed Test 7: computeVerificationStatus logic strictly adheres to requirements.\n');

console.log('=== All Cross-Source Clustering Tests Passed Successfully! (100% Green) ===');
