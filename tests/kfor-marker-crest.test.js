'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Starting KFOR Marker Crest & Tactical Presentation Tests ---');

const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');

// Test 1: Verify text labels are eliminated from the map marker surface
console.log('Test 1: Verifying base/checkpoint text tags are removed from map markers...');
assert.strictEqual(
  appJs.includes('<div class="kfor-marker-tag">'),
  false,
  'kfor-marker-tag text element must be removed from map marker DOM to keep the map clean'
);
console.log('✓ Passed: Map surface is free from floating text labels');

// Test 2: Verify KFOR Crest SVG is rendered with NATO insignia
console.log('Test 2: Verifying KFOR Crest SVG insignia rendering...');
assert.strictEqual(appJs.includes('class="kfor-crest-svg"'), true, 'Must render kfor-crest-svg');
assert.strictEqual(appJs.includes('>KFOR</text>'), true, 'Must render KFOR header text in SVG crest');
assert.strictEqual(appJs.includes('#60a5fa'), true, 'Must style crest with tactical NATO border stroke');
assert.strictEqual(styleCss.includes('.kfor-crest-svg'), true, 'style.css must style .kfor-crest-svg');
console.log('✓ Passed: KFOR Crest SVG shield and NATO insignia rendered cleanly');

// Test 3: Verify hover tooltip title and accessible label
console.log('Test 3: Verifying tooltip title and aria-label attributes...');
assert.strictEqual(appJs.includes('el.title = `${p.name} · ${p.typeLabel}`;'), true, 'Must have descriptive tooltip title');
assert.strictEqual(appJs.includes('el.setAttribute(\'aria-label\', p.name);'), true, 'Must have aria-label for accessibility');
console.log('✓ Passed: Tooltip and accessibility labels present');

// Test 4: Verify popup click handler and telemetry content are preserved
console.log('Test 4: Verifying tactical popup structure and telemetry fields...');
assert.strictEqual(appJs.includes('KFOR MILITARY BASE · ${p.typeLabel}'), true, 'Must preserve popup badge');
assert.strictEqual(appJs.includes('${p.name}'), true, 'Must preserve base name');
assert.strictEqual(appJs.includes('${p.leadNation}'), true, 'Must preserve leadNation');
assert.strictEqual(appJs.includes('${p.command}'), true, 'Must preserve command');
assert.strictEqual(appJs.includes('${p.units}'), true, 'Must preserve units');
assert.strictEqual(appJs.includes('${p.capabilities}'), true, 'Must preserve capabilities');
console.log('✓ Passed: Full popup content and telemetry intact upon clicking marker');

console.log('--- ALL KFOR CREST MARKER TESTS PASSED SUCCESSFULLY ---');
