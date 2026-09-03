'use strict';

const assert = require('assert');

// The upgraded comprehensive escHtml and safeUrl functions as implemented for the client
function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}

function safeUrl(url) {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  // Strip control characters
  if (/[\x00-\x1F\x7F]/.test(trimmed)) return '#';

  try {
    // Relative safe paths
    if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
      return escHtml(trimmed);
    }
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return escHtml(trimmed);
    }
    return '#';
  } catch {
    return '#';
  }
}

function runXssTests() {
  console.log('\n=== TESTING XSS DEFENSE & SANITIZATION ENGINE ===\n');

  // Test 1: Tag injection
  console.log('1. Testing HTML tag injection...');
  const scriptPayload = '<script>alert("XSS")</script>';
  const escapedScript = escHtml(scriptPayload);
  assert.strictEqual(escapedScript.includes('<script>'), false);
  assert.strictEqual(escapedScript, '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
  console.log('  ✓ <script> tags neutralised');

  // Test 2: Event handler attribute injection via quotes and single quotes
  console.log('2. Testing single-quote and double-quote attribute breakout...');
  const singleQuotePayload = "test' onmouseover='alert(1)";
  const escapedSingle = escHtml(singleQuotePayload);
  assert.strictEqual(escapedSingle.includes("'"), false);
  assert.strictEqual(escapedSingle, 'test&#39; onmouseover=&#39;alert(1)');

  const doubleQuotePayload = 'test" onfocus="alert(1)';
  const escapedDouble = escHtml(doubleQuotePayload);
  assert.strictEqual(escapedDouble.includes('"'), false);
  assert.strictEqual(escapedDouble, 'test&quot; onfocus=&quot;alert(1)');
  console.log('  ✓ Single quote and double quote breakout neutralised');

  // Test 3: Backtick injection (Template literal breakout)
  console.log('3. Testing backtick template literal breakout...');
  const backtickPayload = '`+alert(1)+`';
  const escapedBacktick = escHtml(backtickPayload);
  assert.strictEqual(escapedBacktick.includes('`'), false);
  assert.strictEqual(escapedBacktick, '&#96;+alert(1)+&#96;');
  console.log('  ✓ Backticks neutralised');

  // Test 4: Image onerror payload
  console.log('4. Testing img onerror payload...');
  const imgPayload = '<img src=x onerror=alert(1)>';
  const escapedImg = escHtml(imgPayload);
  assert.strictEqual(escapedImg.includes('<img'), false);
  assert.strictEqual(escapedImg, '&lt;img src=x onerror=alert(1)&gt;');
  console.log('  ✓ img onerror payload neutralised');

  // Test 5: Safe URL protocol enforcement (javascript:, data:, vbscript:)
  console.log('5. Testing malicious URL schemes...');
  assert.strictEqual(safeUrl('javascript:alert(document.cookie)'), '#');
  assert.strictEqual(safeUrl('JAVASCRIPT:alert(1)'), '#');
  assert.strictEqual(safeUrl('javascript :alert(1)'), '#');
  assert.strictEqual(safeUrl('data:text/html,<script>alert(1)</script>'), '#');
  assert.strictEqual(safeUrl('vbscript:msgbox(1)'), '#');
  assert.strictEqual(safeUrl('//evil.com/phish'), '#');
  assert.strictEqual(safeUrl('https://mpb.rks-gov.net/?culture=sr'), 'https://mpb.rks-gov.net/?culture=sr');
  assert.strictEqual(safeUrl('http://localhost:3000/api/status'), 'http://localhost:3000/api/status');
  assert.strictEqual(safeUrl('/api/telegram/media?id=1'), '/api/telegram/media?id=1');
  assert.strictEqual(safeUrl('https://example.com/test?a=1&b=2'), 'https://example.com/test?a=1&amp;b=2');
  console.log('  ✓ URL scheme validation blocks javascript, data, and vbscript');

  // Test 6: Null and Undefined edge cases
  console.log('6. Testing null/undefined handling...');
  assert.strictEqual(escHtml(null), '');
  assert.strictEqual(escHtml(undefined), '');
  assert.strictEqual(safeUrl(null), '#');
  assert.strictEqual(safeUrl(undefined), '#');
  console.log('  ✓ Null and undefined handled cleanly');

  console.log('\n=== ALL XSS DEFENSE TESTS PASSED ===\n');
}

runXssTests();
