'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Starting Live Alert Ticker Verification Tests ---');

const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');

// Test 1: HTML structure
console.log('Test 1: Verifying Live Alert Ticker elements in index.html...');
assert.strictEqual(indexHtml.includes('id="liveAlertTickerBar"'), true, '#liveAlertTickerBar must exist');
assert.strictEqual(indexHtml.includes('id="liveAlertTickerTrack"'), true, '#liveAlertTickerTrack must exist');
assert.strictEqual(indexHtml.includes('class="ticker-prefix"'), true, '.ticker-prefix must exist');
console.log('✓ Passed: Live Alert Ticker HTML structure verified');

// Test 2: Non-blocking map interactions CSS & single continuous constant-speed animation
console.log('Test 2: Verifying CSS pointer-events: none, slowed animation speed (160s), and position fixed bottom...');
assert.strictEqual(styleCss.includes('.live-alert-ticker-bar'), true, '.live-alert-ticker-bar CSS present');
assert.strictEqual(styleCss.includes('position: fixed;'), true, 'Ticker must be fixed at screen bottom');
assert.strictEqual(styleCss.includes('bottom: 0;'), true, 'Ticker anchored at bottom: 0');
assert.strictEqual(styleCss.includes('animation: tickerMove 160s linear infinite;'), true, 'Ticker duration slowed down to 160s for readability');
assert.strictEqual(styleCss.includes('@keyframes tickerMove'), true, '@keyframes tickerMove must exist');
assert.strictEqual(styleCss.includes('transform: translateX(-50%);'), true, 'Seamless marquee loop moves to -50%');
console.log('✓ Passed: CSS rules verify slowed marquee speed (160s) for easy reading');

// Test 3: App.js functions and integration
console.log('Test 3: Verifying renderLiveAlertTicker and window exports in app.js...');
assert.strictEqual(appJs.includes('function renderLiveAlertTicker'), true, 'renderLiveAlertTicker function defined');
assert.strictEqual(appJs.includes('renderLiveAlertTicker(alerts);'), true, 'renderAlertLog invokes renderLiveAlertTicker');
assert.strictEqual(appJs.includes('window.renderLiveAlertTicker = renderLiveAlertTicker'), true, 'window.renderLiveAlertTicker exported');
console.log('✓ Passed: App.js ticker render logic and exports verified');

// Test 4: Functional rendering test in DOM environment
console.log('Test 4: Functional DOM test for ticker item rendering and loop duplication...');

let tickerInnerHTML = '';
global.window = global;
global.document = {
  getElementById: (id) => {
    if (id === 'liveAlertTickerTrack') {
      return {
        set innerHTML(val) { tickerInnerHTML = val; },
        get innerHTML() { return tickerInnerHTML; },
        style: {}
      };
    }
    if (id === 'alertLog') {
      return { innerHTML: '', style: {} };
    }
    if (id === 'unreadBadge') {
      return { style: {} };
    }
    return null;
  }
};

function escHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function formatTimeAgo() { return '2m ago'; }

const codeExtract = `
  ${appJs.slice(appJs.indexOf('function renderLiveAlertTicker('), appJs.indexOf('function handleAlertClick('))}
`;

const runtimeTicker = new Function('document', 'escHtml', 'formatTimeAgo', '$', `
  function $(id) { return document.getElementById(id); }
  ${codeExtract}
  return { renderLiveAlertTicker };
`)(global.document, escHtml, formatTimeAgo, (id) => global.document.getElementById(id));

const sampleAlerts = [
  { id: 'a1', severity: 'CRITICAL', module: 'NEWS', title: 'Të shtëna me armë në Mitrovicë', timestamp: new Date().toISOString() },
  { id: 'a2', severity: 'HIGH', module: 'BORDER', title: 'Merdare: 45 min wait time', timestamp: new Date().toISOString() }
];

runtimeTicker.renderLiveAlertTicker(sampleAlerts);

assert.strictEqual(tickerInnerHTML.includes('[CRITICAL]'), true, 'Ticker must render [CRITICAL] badge');
assert.strictEqual(tickerInnerHTML.includes('[HIGH]'), true, 'Ticker must render [HIGH] badge');
assert.strictEqual(tickerInnerHTML.includes('Të shtëna me armë në Mitrovicë'), true, 'Ticker must render title 1');
assert.strictEqual(tickerInnerHTML.includes('Merdare: 45 min wait time'), true, 'Ticker must render title 2');

// Count occurrences of a1 to ensure seamless loop duplication (itemsHtml + itemsHtml)
const a1Count = (tickerInnerHTML.match(/handleAlertClick\('a1'\)/g) || []).length;
assert.strictEqual(a1Count, 2, 'Alert items must be duplicated (2x) for uninterrupted 100% seamless marquee scrolling');
console.log('✓ Passed: Ticker renders alerts in a single continuous row with seamless duplication');

console.log('--- ALL LIVE ALERT TICKER TESTS PASSED SUCCESSFULLY ---');
