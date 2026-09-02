'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Starting News Intelligence Compact Triage Tests ---');

// 1. Check index.html elements
console.log('Test 1: Verifying index.html streamlined filter elements...');
const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');

assert(indexHtml.includes('id="tabNewsOperational"'), 'index.html must contain tabNewsOperational');
assert(indexHtml.includes('id="tabNewsNorth"'), 'index.html must contain tabNewsNorth');
assert(indexHtml.includes('id="tabNewsOther"'), 'index.html must contain tabNewsOther');
assert(indexHtml.includes('id="btnNewsUrgentToggle"'), 'index.html must contain btnNewsUrgentToggle');
assert(indexHtml.includes('id="newsList"'), 'index.html must retain newsList container');
assert(!indexHtml.includes('onclick="filterNews(\'critical\''), 'index.html must NOT contain obsolete 7-button filter bar');
console.log('✓ Passed: index.html has clean 3-tab layout and urgent toggle button');

// 2. Check public/app.js functions
console.log('Test 2: Verifying app.js functions & operational filtering...');
const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');

assert(appJs.includes('function isOperationalNewsItem'), 'app.js must define isOperationalNewsItem');
assert(appJs.includes('function switchNewsTab'), 'app.js must define switchNewsTab');
assert(appJs.includes('function toggleNewsUrgent'), 'app.js must define toggleNewsUrgent');
assert(appJs.includes('news-simple-card'), 'app.js must render news-simple-card');
assert(appJs.includes('news-badge-sev'), 'app.js must render severity badge');
assert(appJs.includes('news-badge-cat'), 'app.js must render category badge');
console.log('✓ Passed: app.js contains clean news card renderer and triage logic');

// 3. Check CSS rules in public/style.css
console.log('Test 3: Verifying public/style.css styling for simplified news cards...');
const styleCss = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');

assert(styleCss.includes('.news-simple-card'), 'style.css must style .news-simple-card');
assert(styleCss.includes('.news-badge-sev'), 'style.css must style .news-badge-sev');
assert(styleCss.includes('.news-badge-cat'), 'style.css must style .news-badge-cat');
assert(styleCss.includes('.news-urgent-toggle-btn'), 'style.css must style .news-urgent-toggle-btn');
assert(styleCss.includes('.news-triage-tabs'), 'style.css must style .news-triage-tabs');
console.log('✓ Passed: style.css contains all simplified card and toggle styles');

// 4. Test Operational Triage Logic directly
console.log('Test 4: Testing operational vs other separation logic...');
const { analyzeArticle } = require('../skills/news-intel/skill');

// Operational incident: Shooting / Police arrest
const policeIncident = analyzeArticle(
  'Aksion policor në Mitrovicë, arrestohen dy persona të dyshuar',
  'Njësia Speciale e Policisë së Kosovës ka arrestuar dy persona të dyshuar për posedim pa leje të armëve të zjarrit në Lagjen e Boshnjakëve.'
);
assert(['security', 'north_kosovo'].includes(policeIncident.category), 'Police incident in Mitrovica should be security or north_kosovo');
assert.strictEqual(policeIncident.eventType, 'event');

// Non-operational: Studio talk-show commentary
const talkShowItem = analyzeArticle(
  'Syla aludon se Abdixhiku mund ta përdorë Kurtin për t’i eliminuar 6 deputetët dhe sulme ndaj Përparim Ramës',
  'Gazetari Valon Syla, ka ngritur disa pyetje në “Pressing” të T7, të mërkurën. Ai ka pyetur nëse Lumir Abdixhiku do e përdor Albin Kurtin për të eliminuar gjashtë deputetët.'
);
assert.strictEqual(talkShowItem.eventType, 'commentary', 'TV talk-show punditry must be commentary');
assert.notStrictEqual(talkShowItem.severity, 'critical', 'TV talk-show punditry must NEVER be critical');

console.log('✓ Passed: Operational events vs talk-show commentary triage verified');

console.log('--- ALL NEWS COMPACT TRIAGE TESTS PASSED ---');
