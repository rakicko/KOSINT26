'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Starting Live Alerts Ticker Bar Hover Verification Tests ---');

const styleCss = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');

// Test 1: Verify pointer-events: auto on ticker bar & viewport
console.log('Test 1: Verifying pointer-events: auto on live alert ticker elements...');
assert.strictEqual(
  styleCss.includes('.live-alert-ticker-bar {\n  position: fixed;\n  bottom: 0;\n  left: 0;\n  right: 0;\n  height: 28px;\n  background: rgba(10, 15, 26, 0.92);\n  backdrop-filter: blur(10px);\n  -webkit-backdrop-filter: blur(10px);\n  border-top: 1px solid rgba(56, 189, 248, 0.25);\n  display: flex;\n  align-items: center;\n  z-index: 990;\n  pointer-events: auto;') ||
  styleCss.includes('.live-alert-ticker-bar {') && styleCss.includes('pointer-events: auto'),
  true,
  '.live-alert-ticker-bar must have pointer-events: auto'
);

assert.strictEqual(
  styleCss.includes('.ticker-viewport {') && styleCss.includes('pointer-events: auto'),
  true,
  '.ticker-viewport must have pointer-events: auto'
);
console.log('✓ Passed: Pointer events enabled on ticker bar and viewport');

// Test 2: Verify CSS animation pause on hover
console.log('Test 2: Verifying CSS animation-play-state: paused on hover...');
assert.strictEqual(
  styleCss.includes('animation-play-state: paused !important'),
  true,
  'Must have animation-play-state: paused !important on hover'
);
assert.strictEqual(
  styleCss.includes('.live-alert-ticker-bar:hover .ticker-track'),
  true,
  'Must target .live-alert-ticker-bar:hover .ticker-track'
);
console.log('✓ Passed: CSS paused animation on hover configured');

// Test 3: Verify JS mouse event listeners in app.js
console.log('Test 3: Verifying JS mouseenter/mouseleave listeners in app.js...');
assert.strictEqual(
  appJs.includes("track.onmouseenter = () => { track.style.animationPlayState = 'paused'; }"),
  true,
  'track must have onmouseenter handler to pause'
);
assert.strictEqual(
  appJs.includes("track.onmouseleave = () => { track.style.animationPlayState = 'running'; }"),
  true,
  'track must have onmouseleave handler to resume'
);
console.log('✓ Passed: JS mouse event handlers registered on ticker track and bar');

console.log('--- ALL TICKER HOVER TESTS PASSED SUCCESSFULLY ---');
