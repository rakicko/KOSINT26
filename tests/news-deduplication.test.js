'use strict';

const assert = require('assert');
const {
  deduplicateNewsItems,
  normalizeHeadline,
  calculateTitleSimilarity,
  isDuplicateStory,
  normalizeUrl
} = require('../skills/news-intel/skill');

console.log('--- Starting News Intelligence Deduplication Focused Tests ---');

// 1. Test: Identical URLs (with/without tracking query params or slashes)
console.log('Test 1: Verifying identical URLs deduplication...');
const urlItems = [
  {
    id: 'story-1a',
    title: 'Aksioni i Policisë së Kosovës në Mitrovicë',
    url: 'https://koha.net/armi-zvecan?utm_source=rss&utm_medium=feed',
    source: 'Gazeta Express',
    publishedAt: '2026-08-22T10:00:00.000Z'
  },
  {
    id: 'story-1b',
    title: 'Aksioni i Policisë së Kosovës në Mitrovicë',
    url: 'https://koha.net/armi-zvecan/',
    source: 'Koha',
    publishedAt: '2026-08-22T09:30:00.000Z'
  }
];

const dedupUrls = deduplicateNewsItems(urlItems);
assert.strictEqual(dedupUrls.length, 1, 'Identical URLs must be deduplicated into 1 story');
assert.strictEqual(dedupUrls[0].source, 'Koha', 'Authoritative source (Koha) must be preferred over Gazeta Express');
assert.strictEqual(dedupUrls[0].sources.includes('Gazeta Express'), true, 'Deduplicated source list preserves all reporting sources');
console.log('✓ Passed: Identical URLs deduplicated cleanly with authoritative source retention');

// 2. Test: Identical / near-identical headlines from different RSS sources
console.log('Test 2: Verifying identical/near-identical headlines deduplication...');
const syndicatedItems = [
  {
    id: 'syn-1',
    title: 'Policia e Kosovës konfiskon armatim dhe municion në Zveçan',
    url: 'https://express.com/zvecan-1',
    source: 'Gazeta Express',
    publishedAt: '2026-08-22T12:00:00.000Z'
  },
  {
    id: 'syn-2',
    title: '[FOTO] Policia e Kosovës konfiskon armatim dhe municion në Zveçan | Koha',
    url: 'https://koha.net/zvecan-2',
    source: 'Koha',
    publishedAt: '2026-08-22T11:45:00.000Z'
  },
  {
    id: 'syn-3',
    title: 'RTK: Policia e Kosovës konfiskon armatim dhe municion në Zveçan',
    url: 'https://rtklive.com/zvecan-3',
    source: 'RTK',
    publishedAt: '2026-08-22T12:15:00.000Z'
  }
];

const dedupSyndicated = deduplicateNewsItems(syndicatedItems);
assert.strictEqual(dedupSyndicated.length, 1, 'Syndicated headlines must be deduplicated to 1 primary story');
assert.strictEqual(dedupSyndicated[0].source, 'Koha', 'Highest authority source (Koha) retained as primary');
assert.strictEqual(dedupSyndicated[0].sourceCount, 3, 'Combined sourceCount must be 3');
console.log('✓ Passed: Identical/near-identical syndicated headlines deduplicated');

// 3. Test: Same event but genuinely different updates (MUST NOT be deduplicated)
console.log('Test 3: Verifying same event with genuinely different updates are preserved separately...');
const updateItems = [
  {
    id: 'upd-1',
    title: 'Policia e Kosovës nis aksion bastisjeje te ura e Ibrit në Mitrovicë',
    url: 'https://koha.net/ibari-1',
    source: 'Koha',
    publishedAt: '2026-08-22T08:00:00.000Z'
  },
  {
    id: 'upd-2',
    title: 'Gjykata Themelore cakton 30 ditë paraburgim për të arrestuarin te ura e Ibrit',
    url: 'https://koha.net/ibari-2',
    source: 'Koha',
    publishedAt: '2026-08-22T14:00:00.000Z'
  }
];

const dedupUpdates = deduplicateNewsItems(updateItems);
assert.strictEqual(dedupUpdates.length, 2, 'Genuinely different updates must NOT be deduplicated');
console.log('✓ Passed: Distinct event updates preserved as separate intelligence items');

// 4. Test: Unrelated stories with similar wording (MUST NOT be deduplicated)
console.log('Test 4: Verifying unrelated stories with similar wording are preserved separately...');
const similarWordingItems = [
  {
    id: 'sim-1',
    title: 'Policia e Kosovës arreston dy persona në Pejë për vjedhje të rëndë',
    url: 'https://express.com/peje-vjedhje',
    source: 'Gazeta Express',
    publishedAt: '2026-08-22T10:00:00.000Z'
  },
  {
    id: 'sim-2',
    title: 'Policia e Kosovës arreston dy persona në Prizren për mashtrim me biletash',
    url: 'https://express.com/prizren-mashtrim',
    source: 'Gazeta Express',
    publishedAt: '2026-08-22T11:00:00.000Z'
  }
];

const dedupSimilar = deduplicateNewsItems(similarWordingItems);
assert.strictEqual(dedupSimilar.length, 2, 'Unrelated stories with similar wording must NOT be deduplicated');
console.log('✓ Passed: Unrelated stories with similar wording preserved separately');

console.log('--- ALL NEWS DEDUPLICATION FOCUSED TESTS PASSED SUCCESSFULLY ---');
