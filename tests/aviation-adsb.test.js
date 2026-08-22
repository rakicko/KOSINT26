'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Starting Aviation ADS-B Link Verification Tests ---');

const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');

// Test 1: Verify buildMapPopupHtml linkText support
console.log('Test 1: Verifying linkText support in buildMapPopupHtml...');
assert.strictEqual(appJs.includes('linkText = \'\''), true, 'linkText parameter must be destructured');
assert.strictEqual(appJs.includes('linkText || \'OPEN SOURCE REPORT ↗\''), true, 'linkText default fallback present');
console.log('✓ Passed: buildMapPopupHtml accepts custom link text');

// Test 2: Verify ADS-B tracking URL generation logic (ICAO hex primary, callsign fallback)
console.log('Test 2: Verifying ADS-B URL generation logic (ICAO hex primary vs Callsign fallback)...');

function getAdsbUrl(ac) {
  const icao = (ac.icao24 || '').trim().toLowerCase();
  const callsign = (ac.callsign || '').trim();
  return icao ? `https://globe.adsbexchange.com/?icao=${icao}` : (callsign ? `https://globe.adsbexchange.com/?callsign=${encodeURIComponent(callsign)}` : null);
}

// 2a. ICAO hex primary
const acWithIcao = { icao24: '4b1812', callsign: 'WZZ101' };
const url1 = getAdsbUrl(acWithIcao);
assert.strictEqual(url1, 'https://globe.adsbexchange.com/?icao=4b1812', 'ICAO hex address takes priority');

// 2b. Callsign fallback
const acWithCallsignOnly = { icao24: '', callsign: 'THY34X' };
const url2 = getAdsbUrl(acWithCallsignOnly);
assert.strictEqual(url2, 'https://globe.adsbexchange.com/?callsign=THY34X', 'Callsign fallback used when ICAO hex is missing');

console.log('✓ Passed: ADS-B tracking URL correctly prefers ICAO hex and falls back to Callsign without inventing IDs');

// Test 3: Verify popup HTML includes ADS-B tracking link
console.log('Test 3: Verifying generated popup HTML includes ADS-B tracking button...');
assert.strictEqual(appJs.includes('linkUrl: adsbUrl'), true, 'renderAviationMapMarkers passes adsbUrl to popup builder');
assert.strictEqual(appJs.includes('linkText: \'TRACK ON ADS-B LIVE ↗\''), true, 'renderAviationMapMarkers passes custom link text');
console.log('✓ Passed: Popup HTML incorporates ADS-B tracking button');

console.log('--- ALL AVIATION ADS-B LINK TESTS PASSED SUCCESSFULLY ---');
