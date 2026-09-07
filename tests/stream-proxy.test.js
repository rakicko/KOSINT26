'use strict';

const assert = require('assert');
const { validateStreamUrl, rewriteManifest } = require('../server/stream-proxy');

console.log('--- Testing Stream Proxy URL Validation & SSRF Prevention ---');

// 1. Valid URLs
assert.strictEqual(validateStreamUrl('https://example.com/live/stream.m3u8').valid, true);
assert.strictEqual(validateStreamUrl('http://cdn.broadcaster.rs:8080/live/hls.m3u8').valid, true);

// 2. SSRF / Localhost / Private subnet blocking
assert.strictEqual(validateStreamUrl('http://localhost:3000/stream.m3u8').valid, false);
assert.strictEqual(validateStreamUrl('http://127.0.0.1:8080/stream.m3u8').valid, false);
assert.strictEqual(validateStreamUrl('http://10.0.0.1/stream.m3u8').valid, false);
assert.strictEqual(validateStreamUrl('http://192.168.1.1/stream.m3u8').valid, false);
assert.strictEqual(validateStreamUrl('http://172.16.0.1/stream.m3u8').valid, false);
assert.strictEqual(validateStreamUrl('http://169.254.169.254/latest/meta-data').valid, false);
assert.strictEqual(validateStreamUrl('ftp://example.com/stream.m3u8').valid, false);
assert.strictEqual(validateStreamUrl('').valid, false);
assert.strictEqual(validateStreamUrl(null).valid, false);

console.log('✓ Passed: SSRF protection and protocol validation verified.');

console.log('--- Testing Manifest URL Rewriting ---');

const sampleMasterManifest = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=1280000,RESOLUTION=720x480
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2560000,RESOLUTION=1280x720
https://absolute-cdn.com/live/1080p.m3u8
`;

const rewrittenMaster = rewriteManifest(sampleMasterManifest, 'https://origin-cdn.com/live/master.m3u8');
assert.ok(rewrittenMaster.includes('/api/stream/manifest?url='), 'Variant m3u8 playlist should be proxied');
assert.ok(rewrittenMaster.includes(encodeURIComponent('https://origin-cdn.com/live/720p.m3u8')), 'Relative variant should resolve to origin base');
assert.ok(rewrittenMaster.includes('/api/stream/manifest?url=' + encodeURIComponent('https://absolute-cdn.com/live/1080p.m3u8')), 'Absolute variant should route through manifest proxy');

const sampleMediaManifest = `#EXTM3U
#EXT-X-TARGETDURATION:6
#EXTINF:6.000,
chunk_001.ts
#EXTINF:6.000,
/media/chunk_002.ts
#EXTINF:6.000,
https://other-cdn.com/chunk_003.ts
`;

const rewrittenMedia = rewriteManifest(sampleMediaManifest, 'https://origin-cdn.com/live/stream/');
assert.ok(rewrittenMedia.includes('https://origin-cdn.com/live/stream/chunk_001.ts'), 'Relative chunk 1 must point directly to origin CDN');
assert.ok(rewrittenMedia.includes('https://origin-cdn.com/media/chunk_002.ts'), 'Root-relative chunk 2 must point directly to origin CDN');
assert.ok(rewrittenMedia.includes('https://other-cdn.com/chunk_003.ts'), 'Absolute chunk 3 must remain untouched');
assert.ok(!rewrittenMedia.includes('/api/stream/manifest?url=https%3A%2F%2Forigin-cdn.com%2Flive%2Fstream%2Fchunk_001.ts'), 'Video chunks (.ts) must NEVER be proxied through backend');

console.log('✓ Passed: Manifest rewritten correctly without video chunk proxying.');

console.log('--- Testing Broadcaster Header Spoofing ---');
const { getBroadcasterHeaders } = require('../server/stream-proxy');
const rtsHeaders = getBroadcasterHeaders('https://webtvstream.bhtelecom.ba/rts1.m3u8');
assert.strictEqual(rtsHeaders.Referer, 'https://webtv.bhtelecom.ba/', 'Referer should match bhtelecom portal');
assert.ok(rtsHeaders['User-Agent'].includes('Mozilla/5.0'), 'Modern browser User-Agent must be set');

const gjirafaHeaders = getBroadcasterHeaders('https://gjirafa-video-live.gjirafa.net/live.m3u8');
assert.strictEqual(gjirafaHeaders.Referer, 'https://video.gjirafa.com/', 'Referer should match gjirafa video portal');

console.log('--- Testing Selective Segment Proxy Rewriting ---');
const rewrittenWithSegments = rewriteManifest(sampleMediaManifest, 'https://origin-cdn.com/live/stream/', { proxySegments: true, referer: 'https://webtv.bhtelecom.ba/' });
assert.ok(rewrittenWithSegments.includes('/api/stream/segment?url='), 'When proxySegments=true, chunks route through segment proxy');
assert.ok(rewrittenWithSegments.includes('ref=' + encodeURIComponent('https://webtv.bhtelecom.ba/')), 'Referer query parameter should be attached to segment proxy URL');

console.log('✓ Passed: Broadcaster header spoofing & segment proxy rewriting verified.');
console.log('\n--- ALL STREAM PROXY TESTS PASSED ---');

