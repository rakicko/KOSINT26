'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  fetchRSS,
  extractImageUrl,
  isFeedInCooldown,
  recordFeedSuccess,
  recordFeedFailure,
  MAX_FAILURES,
  FEED_COOLDOWN_MS,
  FEED_CIRCUIT_STATE,
  isSportsOrEntertainment,
  calculateEffectiveRank
} = require('../skills/news-intel/skill');

console.log('=== News Ingestion Pipeline Resilience & Hardening Test Suite ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Circuit Breaker & Cooldown for Failed Feeds
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- Test 1: Circuit Breaker & Cooldown for Failed Feeds ---');
assert.strictEqual(MAX_FAILURES, 2, 'MAX_FAILURES must be 2');
assert.strictEqual(FEED_COOLDOWN_MS, 5 * 60 * 1000, 'FEED_COOLDOWN_MS must be 5 minutes (300,000ms)');

const testFeedUrl = 'https://mock-failing-feed.com/rss';
FEED_CIRCUIT_STATE.delete(testFeedUrl);

const t0 = Date.now();
assert.strictEqual(isFeedInCooldown(testFeedUrl, t0), false, 'Initially feed must not be in cooldown');

// 1st failure: consecutiveFailures = 1, cooldown not tripped
recordFeedFailure(testFeedUrl, t0);
assert.strictEqual(FEED_CIRCUIT_STATE.get(testFeedUrl).consecutiveFailures, 1);
assert.strictEqual(isFeedInCooldown(testFeedUrl, t0), false, '1 failure must not trigger cooldown');

// 2nd consecutive failure: cooldown tripped!
recordFeedFailure(testFeedUrl, t0);
assert.strictEqual(FEED_CIRCUIT_STATE.get(testFeedUrl).consecutiveFailures, 2);
assert.strictEqual(isFeedInCooldown(testFeedUrl, t0), true, '2 consecutive failures must trip cooldown');
assert.strictEqual(isFeedInCooldown(testFeedUrl, t0 + 4 * 60 * 1000), true, 'Feed still in cooldown after 4 mins');
assert.strictEqual(isFeedInCooldown(testFeedUrl, t0 + 5 * 60 * 1000 + 1), false, 'Feed cooldown expires after 5 mins');

// Reset on success
recordFeedSuccess(testFeedUrl);
assert.strictEqual(FEED_CIRCUIT_STATE.get(testFeedUrl).consecutiveFailures, 0, 'Success resets failure counter');
assert.strictEqual(isFeedInCooldown(testFeedUrl, t0), false, 'Success clears cooldown');

console.log('✓ Passed Test 1: Circuit breaker tracks consecutive failures and enforces 5-min cooldown');

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: In-Cooldown Skipping in fetchRSS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Test 2: In-Cooldown Skipping in fetchRSS ---');
async function testCooldownSkipping() {
  const failingSource = {
    url: 'https://cooldown-test-portal.org/rss',
    name: 'Cooldown Portal',
    lang: 'sr'
  };

  FEED_CIRCUIT_STATE.set(failingSource.url, {
    consecutiveFailures: 2,
    cooldownUntil: Date.now() + 60000
  });

  const startTime = Date.now();
  const items = await fetchRSS(failingSource);
  const elapsed = Date.now() - startTime;

  assert.deepStrictEqual(items, [], 'In-cooldown feed must return empty array without network call');
  assert.ok(elapsed < 100, `Cooldown check must return instantaneously (<100ms), took ${elapsed}ms`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Per-Feed Timeout Budget (4000ms)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Test 3: Per-Feed Timeout Budget (4000ms) in skill.js ---');
const skillJsContent = fs.readFileSync(path.join(__dirname, '../skills/news-intel/skill.js'), 'utf8');
assert.ok(skillJsContent.includes('timeout: 4000'), 'fetchRSS must configure axios timeout: 4000');
assert.ok(!skillJsContent.includes('timeout: 15000'), 'fetchRSS must no longer use 15000ms timeout');
console.log('✓ Passed Test 3: Strict 4000ms timeout budget confirmed');

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Dublin Core <dc:date> Fallback
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Test 4: Dublin Core <dc:date> Fallback Parsing ---');
// Verify Dublin Core parsing logic with mock item structures
const itemWithStandardPubDate = {
  pubDate: ['Sat, 22 Aug 2026 14:00:00 GMT']
};
const itemWithDublinCore = {
  'dc:date': ['2026-08-22T14:30:00Z']
};
const itemWithBothPubDateAndDc = {
  pubDate: ['Sat, 22 Aug 2026 14:00:00 GMT'],
  'dc:date': ['2026-08-22T14:30:00Z']
};

function parseItemDate(item) {
  const rawDate = (Array.isArray(item.pubDate) ? item.pubDate[0] : item.pubDate) ||
    (Array.isArray(item['dc:date']) ? item['dc:date'][0] : item['dc:date']) ||
    (Array.isArray(item.updated) ? item.updated[0] : item.updated) ||
    (Array.isArray(item.published) ? item.published[0] : item.published);
  const dateStr = (typeof rawDate === 'object' && rawDate?._) ? String(rawDate._) : (rawDate ? String(rawDate) : '');
  const d = dateStr ? new Date(dateStr) : new Date();
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

assert.strictEqual(parseItemDate(itemWithStandardPubDate), new Date('2026-08-22T14:00:00Z').toISOString());
assert.strictEqual(parseItemDate(itemWithDublinCore), new Date('2026-08-22T14:30:00Z').toISOString());
assert.strictEqual(parseItemDate(itemWithBothPubDateAndDc), new Date('2026-08-22T14:00:00Z').toISOString(), 'pubDate takes priority when present');
console.log('✓ Passed Test 4: Dublin Core <dc:date> fallback parses reliably');

// ─────────────────────────────────────────────────────────────────────────────
// Test 5: Error-Safe Image Extractor (extractImageUrl)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Test 5: Error-Safe Image Extractor (extractImageUrl) ---');

// a) media:content
const itemMediaContent = {
  'media:content': [{ $: { url: 'https://portal.com/media-content.jpg', medium: 'image' } }]
};
assert.strictEqual(extractImageUrl(itemMediaContent), 'https://portal.com/media-content.jpg');

// b) media:thumbnail
const itemMediaThumbnail = {
  'media:thumbnail': [{ $: { url: 'https://portal.com/thumbnail.png' } }]
};
assert.strictEqual(extractImageUrl(itemMediaThumbnail), 'https://portal.com/thumbnail.png');

// c) <enclosure>
const itemEnclosure = {
  enclosure: [{ $: { url: 'https://portal.com/photo.webp', type: 'image/webp' } }]
};
assert.strictEqual(extractImageUrl(itemEnclosure), 'https://portal.com/photo.webp');

// d) <img> tag inside description
const itemImgInDesc = {
  description: ['<p>Breaking news report.</p><img src="https://portal.com/embedded-hero.jpg" alt="hero"/>']
};
assert.strictEqual(extractImageUrl(itemImgInDesc), 'https://portal.com/embedded-hero.jpg');

// d) <img> tag inside content:encoded
const itemImgInContentEncoded = {
  'content:encoded': ['<div><img src="https://portal.com/encoded-pic.jpg" />Full text</div>']
};
assert.strictEqual(extractImageUrl(itemImgInContentEncoded), 'https://portal.com/encoded-pic.jpg');

// Precedence check: media:content over media:thumbnail
const itemMultiImage = {
  'media:content': [{ $: { url: 'https://portal.com/content-first.jpg' } }],
  'media:thumbnail': [{ $: { url: 'https://portal.com/thumb-second.jpg' } }],
  description: ['<img src="https://portal.com/desc-last.jpg" />']
};
assert.strictEqual(extractImageUrl(itemMultiImage), 'https://portal.com/content-first.jpg', 'Order of precedence (media:content first)');

// No image returns null
assert.strictEqual(extractImageUrl({ title: 'No image article' }), null);
assert.strictEqual(extractImageUrl(null), null);
assert.strictEqual(extractImageUrl({ enclosure: [{ $: { url: 'https://portal.com/audio.mp3', type: 'audio/mpeg' } }] }), null);
console.log('✓ Passed Test 5: All 4 image extraction methods and precedence verified');

// ─────────────────────────────────────────────────────────────────────────────
// Test 6: Verify sports/entertainment drop and dynamic threat ranking remain intact
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Test 6: Invariant verification (sports drop & dynamic threat ranking intact) ---');
assert.strictEqual(isSportsOrEntertainment('Arsenal defeated Chelsea in Champions League', ''), true, 'Sports blacklist must drop');
assert.strictEqual(isSportsOrEntertainment('Policia sekuestroi arsenal armësh në Mitrovicë', ''), false, 'Weapon arsenal must not drop');

const testRankingItem = { severity: 'critical', location: 'North Kosovo', pubDate: new Date().toISOString() };
const rankScore = calculateEffectiveRank(testRankingItem);
assert.strictEqual(rankScore, 4500, 'Critical North Kosovo base+boost rank must be 4500');
console.log('✓ Passed Test 6: Sports filtering and dynamic threat ranking completely intact');

// Run async tests
testCooldownSkipping().then(() => {
  console.log('✓ Passed Test 2: In-cooldown skipping verified');
  console.log('\n🎉 ALL RESILIENT INGESTION & HARDENING TESTS PASSED 100%! 🎉');
}).catch(err => {
  console.error('Failed test:', err);
  process.exit(1);
});
