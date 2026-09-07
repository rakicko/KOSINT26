'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Starting Live Feeds Stream & Proxy Health Verification ---');

const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');

// 1. Verify Stream Proxy exports & functionality in server/stream-proxy.js
console.log('Test 1: Verifying stream-proxy server module and broadcaster headers...');
const streamProxy = require('../server/stream-proxy');

assert.strictEqual(typeof streamProxy.getBroadcasterHeaders, 'function', 'getBroadcasterHeaders must be exported');
assert.strictEqual(typeof streamProxy.handleSegmentProxy, 'function', 'handleSegmentProxy must be exported');
assert.strictEqual(typeof streamProxy.handleManifestProxy, 'function', 'handleManifestProxy must be exported');
assert.strictEqual(typeof streamProxy.validateStreamUrl, 'function', 'validateStreamUrl must be exported');
assert.strictEqual(typeof streamProxy.rewriteManifest, 'function', 'rewriteManifest must be exported');

// Test broadcaster header derivation
const bhHeaders = streamProxy.getBroadcasterHeaders('https://webtvstream.bhtelecom.ba/rts1.m3u8');
assert.strictEqual(bhHeaders.Referer, 'https://webtv.bhtelecom.ba/', 'BH Telecom streams must spoof referer');
assert.strictEqual(bhHeaders.Origin, 'https://webtv.bhtelecom.ba', 'BH Telecom streams must spoof origin');
assert.ok(bhHeaders['User-Agent'].includes('Mozilla/5.0'), 'Must include modern browser User-Agent');
assert.strictEqual(bhHeaders['Sec-Fetch-Mode'], 'cors', 'Must include Sec-Fetch-Mode');

const gjirafaHeaders = streamProxy.getBroadcasterHeaders('https://gjirafa-video-live.gjirafa.net/live/rtk3.m3u8');
assert.strictEqual(gjirafaHeaders.Referer, 'https://video.gjirafa.com/', 'Gjirafa streams must spoof referer');

const rtsHeaders = streamProxy.getBroadcasterHeaders('https://rts.rs/stream/live.m3u8');
assert.strictEqual(rtsHeaders.Referer, 'https://www.rts.rs/', 'RTS streams must spoof referer');

console.log('✓ Passed: Stream proxy exports and broadcaster header spoofing verified');

// 2. Verify Manifest Rewriting with Segment Proxy support
console.log('Test 2: Verifying manifest rewriting with optional segment proxy...');
const sampleManifest = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:6
#EXTINF:6.000,
chunk_001.ts
#EXTINF:6.000,
chunk_002.ts
`;

const directRewritten = streamProxy.rewriteManifest(sampleManifest, 'https://webtvstream.bhtelecom.ba/rts1.m3u8', { proxySegments: false });
assert.ok(directRewritten.includes('https://webtvstream.bhtelecom.ba/chunk_001.ts'), 'Segments should be absolute CDN URLs by default');
assert.ok(!directRewritten.includes('/api/stream/segment'), 'Default rewriting must not proxy video chunks (Render bandwidth protection)');

const proxyRewritten = streamProxy.rewriteManifest(sampleManifest, 'https://webtvstream.bhtelecom.ba/rts1.m3u8', { proxySegments: true });
assert.ok(proxyRewritten.includes('/api/stream/segment?url='), 'When proxySegments is enabled, segments must route through segment proxy');
console.log('✓ Passed: Manifest segment rewriting and bandwidth-protection rules verified');

// 3. Verify HTML5 Video & Iframe Embed markup in index.html
console.log('Test 3: Verifying video player and embed iframe in index.html...');
assert.ok(indexHtml.includes('id="liveFeedVideoPlayer"'), 'Must have #liveFeedVideoPlayer');
assert.ok(indexHtml.includes('id="liveFeedIframePlayer"'), 'Must have #liveFeedIframePlayer');
assert.ok(indexHtml.includes('class="tactical-video-wrapper"'), 'Must have .tactical-video-wrapper');
assert.ok(indexHtml.includes('id="videoChannelOverlay"'), 'Must have #videoChannelOverlay');
assert.ok(indexHtml.includes('id="videoPlayerSpinner"'), 'Must have #videoPlayerSpinner');
assert.ok(styleCss.includes('.tactical-iframe-player'), 'Must have .tactical-iframe-player styling');
console.log('✓ Passed: In-player video and iframe embed markup verified');

// 4. Verify Channel Lineup in app.js
console.log('Test 4: Verifying comprehensive Serbian, Albanian & Global channel lineup in app.js...');

// Extract LIVE_FEEDS_CHANNELS array from app.js using a safe mock environment
const vm = require('vm');
const sandbox = {
  window: {},
  document: {
    querySelectorAll: () => [],
    getElementById: () => null
  },
  console: { log: () => {}, warn: () => {}, error: () => {} },
  setTimeout: () => {},
  clearTimeout: () => {}
};
sandbox.window = sandbox;

// Extract just the array definition
const startIdx = appJs.indexOf('const LIVE_FEEDS_CHANNELS = [');
assert.ok(startIdx !== -1, 'app.js must define LIVE_FEEDS_CHANNELS');
const endIdx = appJs.indexOf('];', startIdx);
assert.ok(endIdx !== -1, 'app.js LIVE_FEEDS_CHANNELS array must be closed');
const channelsCode = appJs.slice(startIdx, endIdx + 2);

vm.createContext(sandbox);
const channels = vm.runInContext('(function() { ' + channelsCode + ' return LIVE_FEEDS_CHANNELS; })()', sandbox);

assert.ok(Array.isArray(channels), 'LIVE_FEEDS_CHANNELS must be an array');
assert.ok(channels.length >= 20, `Channel lineup must have at least 20 channels (found ${channels.length})`);

// Verify required channel names
const requiredChannelNames = [
  'Bloomberg TV',
  'NBC News NOW',
  'CBS News 24/7',
  'ABC News Live',
  'C-SPAN',
  'Al Jazeera Balkans',
  'N1 Info Balkans',
  'RTS Svet',
  'RTK 1',
  'TRT Balkan',
  'Euronews Serbia'
];

requiredChannelNames.forEach(name => {
  const found = channels.find(c => c.name === name);
  assert.ok(found, `Required channel "${name}" must be present in LIVE_FEEDS_CHANNELS`);
});

// Check structure of each channel
channels.forEach(channel => {
  assert.ok(channel.id, `Channel must have id: ${JSON.stringify(channel)}`);
  assert.ok(channel.name, `Channel ${channel.id} must have name`);
  assert.ok(channel.lang, `Channel ${channel.id} must have lang`);
  assert.ok(channel.streamUrl, `Channel ${channel.id} must have streamUrl`);
  assert.ok(channel.embedUrl, `Channel ${channel.id} must have embedUrl`);
  assert.ok(channel.streamUrl.startsWith('http'), `Channel ${channel.id} streamUrl must be http/https`);
  assert.ok(channel.embedUrl.startsWith('http'), `Channel ${channel.id} embedUrl must be http/https`);
});

// Verify Serbian and Albanian counts
const srChannels = channels.filter(c => c.lang === 'sr');
const sqChannels = channels.filter(c => c.lang === 'sq');
const enChannels = channels.filter(c => c.lang === 'en' || c.region === 'global');

assert.ok(srChannels.length >= 8, `Must have at least 8 Serbian language channels (found ${srChannels.length})`);
assert.ok(sqChannels.length >= 8, `Must have at least 8 Albanian language channels (found ${sqChannels.length})`);
assert.ok(enChannels.length >= 5, `Must have at least 5 International channels (found ${enChannels.length})`);

console.log(`✓ Passed: Channel roster verified with ${channels.length} channels (${srChannels.length} SR, ${sqChannels.length} SQ, ${enChannels.length} Global/EN)`);

// 5. Verify Embed Switch & Watchdog Fallback logic in app.js
console.log('Test 5: Verifying switchPlayerToEmbed and fallback functions in app.js...');
assert.ok(appJs.includes('function switchPlayerToEmbed'), 'Must define switchPlayerToEmbed');
assert.ok(appJs.includes('function playHlsStream'), 'Must define playHlsStream');
assert.ok(appJs.includes('window.switchPlayerToEmbed = switchPlayerToEmbed'), 'Must export switchPlayerToEmbed on window');
assert.ok(appJs.includes('switchPlayerToEmbed(channelObj'), 'playHlsStream must call switchPlayerToEmbed on failure/timeout');
assert.ok(appJs.includes('4000'), '4-second timeout watchdog must be present');

console.log('✓ Passed: switchPlayerToEmbed and 4-second watchdog escalation logic verified');

console.log('\n--- ALL LIVE FEEDS STREAM & PROXY HEALTH TESTS PASSED ---');
