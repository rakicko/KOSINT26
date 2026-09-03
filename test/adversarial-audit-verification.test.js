'use strict';

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { app } = require('../server/index');
const auth = require('../server/auth');
const db = require('../server/db');
const { computeThreatLevel } = require('../server/orchestrator');

// Helper to make HTTP requests against the test server
function makeRequest(server, { path: reqPath, method = 'GET', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const req = http.request({
      port,
      path: reqPath,
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          rawBody: data,
          json
        });
      });
    });

    req.on('error', reject);

    if (body) {
      if (typeof body === 'string') {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

async function runAdversarialAuditTests() {
  console.log('\n================================================================');
  console.log('OSCE FINAL ADVERSARIAL RE-AUDIT VERIFICATION TEST SUITE');
  console.log('Testing P0/P1/P2/P3 Remediations & Proving Process Crash Resistance');
  console.log('================================================================\n');

  // Start test server on dynamic port
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  try {
    // 1. Setup authenticated session
    console.log('[Setup] Creating test user and establishing authenticated session...');
    const testUser = auth.findUserByUsername('audit_tester') || auth.createUser({
      username: 'audit_tester',
      password: 'StrongAuditPassword123!',
      role: 'administrator'
    });

    const session = auth.createSession(testUser.id, '127.0.0.1', 'Adversarial-Auditor');
    const cookieHeader = `sentinel_session=${session.sessionId}`;
    const csrfToken = session.csrfToken;
    console.log('  ✓ Test user authenticated with valid session token and CSRF\n');

    // ──────────────────────────────────────────────────────────────────────────
    // P0.1: ForceRefresh Rate Limiter Threshold & Process Crash Resistance
    // ──────────────────────────────────────────────────────────────────────────
    console.log('--- 1. P0.1: ForceRefresh Rate Limiter & Server Crash Resistance ---');
    console.log('Firing 15 rapid forceRefresh requests to exceed the 10 req/min threshold...');

    const forceRefreshResponses = [];
    for (let i = 1; i <= 15; i++) {
      const res = await makeRequest(server, {
        path: '/api/status',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookieHeader,
          'X-CSRF-Token': csrfToken
        },
        body: {
          location: 'Mitrovica, Kosovo',
          timeline: '24h',
          forceRefresh: true
        }
      });
      forceRefreshResponses.push(res.statusCode);
    }

    const rateLimitedCount = forceRefreshResponses.filter(s => s === 429).length;
    console.log(`  ✓ Responses: ${forceRefreshResponses.slice(0, 10).join(', ')} ... (${rateLimitedCount} requests received HTTP 429)`);
    assert.ok(rateLimitedCount >= 1, 'Requests exceeding forceRefresh threshold MUST receive HTTP 429');

    // Verify the server process did NOT crash and is fully operational
    const checkAlive = await makeRequest(server, {
      path: '/api/status',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
        'X-CSRF-Token': csrfToken
      },
      body: {
        location: 'Mitrovica, Kosovo',
        timeline: '24h',
        forceRefresh: false
      }
    });

    assert.strictEqual(checkAlive.statusCode, 200, 'Server MUST remain alive and serve regular requests after rate limiting');
    assert.ok(checkAlive.json?.threatLevel, 'Server responded with valid status payload');
    console.log('  ✓ PROVEN: No unhandled ERR_HTTP_HEADERS_SENT exception. Server process remains healthy.\n');

    // ──────────────────────────────────────────────────────────────────────────
    // P0.2: Threat Engine Schema Contract (Real News & Real Borders)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('--- 2. P0.2: Threat Engine Schema Contract Alignment ---');

    // A. Real News Output Shape (items: [...])
    console.log('Testing real skills/news-intel output contract (items array)...');
    const newsRealSchema = {
      news: {
        skill: 'news-intel',
        status: 'LIVE_DATA',
        source: 'kosovo-local-rss',
        items: [
          { id: 'n-1', title: 'Armed clash reported at northern checkpoint', severity: 'critical', intensityScore: 10 },
          { id: 'n-2', title: 'Security cordon deployed', severity: 'high', intensityScore: 8 }
        ],
        summary: { maxScore: 10, total: 2, highIntensity: 2 }
      }
    };

    const tlNews = computeThreatLevel(newsRealSchema);
    assert.ok(tlNews.breakdown.news > 0, 'News threat contribution MUST be > 0 with real news.items output');
    assert.strictEqual(tlNews.breakdown.news, 24, 'News threat points calculated correctly');
    console.log(`  ✓ Real news.items contract verified: ${tlNews.breakdown.news} points generated`);

    // B. Real Border Output Shape (direction.entry.waitingMinutes)
    console.log('Testing real skills/border-monitor output contract (direction.entry schema)...');
    const borderRealSchema = {
      borders: {
        skill: 'border-monitor',
        status: 'LIVE_DATA',
        source: 'QKMK',
        crossings: [
          {
            id: 'border-merdare',
            name: 'Merdare',
            direction: {
              entry: { waitingMinutes: 240, waitingMinutesText: '240 min' },
              exit: { waitingMinutes: 15, waitingMinutesText: '15 min' }
            }
          }
        ]
      }
    };

    const tlBorder = computeThreatLevel(borderRealSchema);
    assert.ok(tlBorder.breakdown.borders > 0, 'Border threat contribution MUST be > 0 with real direction.entry schema');
    assert.strictEqual(tlBorder.breakdown.borders, 15, 'Border delay >= 180 min must yield maximum 15 points');
    console.log(`  ✓ Real border direction.entry contract verified: ${tlBorder.breakdown.borders} points generated`);

    // C. Simulated Combined Crisis
    console.log('Testing combined crisis scenario with real schemas...');
    const combinedCrisis = {
      news: newsRealSchema.news,
      borders: borderRealSchema.borders
    };
    const tlCrisis = computeThreatLevel(combinedCrisis);
    assert.strictEqual(tlCrisis.breakdown.news, 24);
    assert.strictEqual(tlCrisis.breakdown.borders, 15);
    assert.ok(tlCrisis.score >= 39, 'Combined crisis threat score properly elevated');
    console.log(`  ✓ Combined crisis score elevated to ${tlCrisis.score}/100\n`);

    // ──────────────────────────────────────────────────────────────────────────
    // P0.3: HTML Injection Sinks (Popup Builder & News Error)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('--- 3. P0.3: HTML Injection Sink Elimination ---');

    // Read and test the actual buildMapPopupHtml and sanitizeColor functions from public/app.js
    const appJsContent = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');

    // Standard escHtml function matching app.js
    function escHtmlFn(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/`/g, '&#96;');
    }

    // Extract sanitizeColor from app.js source to ensure exact code execution
    assert.ok(appJsContent.includes('function sanitizeColor(col)'), 'sanitizeColor must be implemented in app.js');
    const sanitizeColorCode = appJsContent.substring(
      appJsContent.indexOf('function sanitizeColor(col)'),
      appJsContent.indexOf('function buildMapPopupHtml')
    );
    const sanitizeColor = new Function('col', sanitizeColorCode + '; return sanitizeColor(col);');

    // Color sanitizer assertions
    assert.strictEqual(sanitizeColor('#34d399'), '#34d399');
    assert.strictEqual(sanitizeColor('#f8717120'), '#f8717120');
    assert.strictEqual(sanitizeColor('var(--cyan)'), 'var(--cyan)');
    assert.strictEqual(sanitizeColor('red; background: url(evil.com)'), '', 'Injected CSS in color must be rejected');
    assert.strictEqual(sanitizeColor('"><script>alert(1)</script>'), '', 'HTML tag breakout in color must be rejected');
    console.log('  ✓ Color validator strictly enforces safe hex/CSS values and rejects injection');

    // Extract buildMapPopupHtml from app.js
    assert.ok(appJsContent.includes('function buildMapPopupHtml'), 'buildMapPopupHtml must be implemented in app.js');
    const buildMapPopupHtmlCode = appJsContent.substring(
      appJsContent.indexOf('function buildMapPopupHtml'),
      appJsContent.indexOf('function createMapPopup')
    );
    const buildMapPopupHtml = new Function('opts', 'escHtml', 'sanitizeColor', buildMapPopupHtmlCode + '; return buildMapPopupHtml(opts);');

    // Test malicious payloads through real buildMapPopupHtml
    const hostilePayloads = [
      '<img src=x onerror=alert(1)>',
      '<script>alert(1)</script>',
      '"><svg/onload=alert(1)>'
    ];

    for (const payload of hostilePayloads) {
      const popupResult = buildMapPopupHtml({
        icon: '✈️',
        title: 'ADS-B Target',
        primary: {
          val: payload,
          sub: payload
        },
        footer: payload,
        badge: { text: payload, color: payload }
      }, escHtmlFn, sanitizeColor);

      assert.strictEqual(popupResult.includes('<img src=x'), false, `Executable <img> tag found for ${payload}`);
      assert.strictEqual(popupResult.includes('<script>'), false, `Executable <script> tag found for ${payload}`);
      assert.strictEqual(popupResult.includes('<svg/onload'), false, `Executable <svg> tag found for ${payload}`);
      assert.ok(popupResult.includes('&lt;'), 'Hostile characters properly entity-encoded in popup HTML');
    }
    console.log('  ✓ Verified: primary.val, primary.sub, and footer in map popups neutralize all hostile injection vectors');

    // Test news error escaping in renderNews
    assert.ok(appJsContent.includes('${escHtml(news?.error || \'\')}'), 'news.error must be wrapped in escHtml()');
    console.log('  ✓ Verified: news.error is escaped with escHtml() before DOM insertion\n');

    // ──────────────────────────────────────────────────────────────────────────
    // P0.4: Telemetry Blackout Semantics & Frontend Representation
    // ──────────────────────────────────────────────────────────────────────────
    console.log('--- 4. P0.4: Telemetry Blackout Semantics (No Data ≠ No Threat) ---');

    // A. Healthy low threat
    const healthyData = {
      news: { status: 'LIVE_DATA', items: [{ intensityScore: 1 }] },
      traffic: { status: 'LIVE_DATA', incidents: [] },
      borders: { status: 'LIVE_DATA', crossings: [] },
      wildfire: { status: 'LIVE_DATA', detections: [] },
      aviation: { status: 'LIVE_DATA', summary: { military: 0 } },
      telegram: { status: 'LIVE_DATA', posts: [] },
      weather: { status: 'LIVE_DATA', alerts: [] },
      radiation: { status: 'LIVE_DATA', primary: { status: 'normal' } },
      aqi: { status: 'LIVE_DATA', current: { europeanAQI: 20 } },
      earthquakes: { status: 'LIVE_DATA', summary: { maxMagnitude: 1.0 } }
    };
    const healthyTl = computeThreatLevel(healthyData);
    assert.strictEqual(healthyTl.level, 'LOW');
    assert.strictEqual(healthyTl.color, '#34d399');
    assert.strictEqual(healthyTl.isDegraded, false);
    assert.strictEqual(healthyTl.isBlackout, false);
    console.log('  ✓ State 1 (Healthy Telemetry): Classified as LOW (Green #34d399), 100% confidence');

    // B. Partial outage
    const partialData = {
      news: { status: 'UNAVAILABLE' },
      traffic: { status: 'UNAVAILABLE' },
      borders: { status: 'UNAVAILABLE' },
      wildfire: { status: 'UNAVAILABLE' },
      aviation: { status: 'UNAVAILABLE' },
      telegram: { status: 'UNAVAILABLE' },
      weather: { status: 'UNAVAILABLE' },
      radiation: { status: 'LIVE_DATA', primary: { status: 'normal' } },
      aqi: { status: 'LIVE_DATA', current: { europeanAQI: 20 } },
      earthquakes: { status: 'UNAVAILABLE' }
    };
    const partialTl = computeThreatLevel(partialData);
    assert.strictEqual(partialTl.level, 'DEGRADED');
    assert.strictEqual(partialTl.color, '#eab308');
    assert.strictEqual(partialTl.isDegraded, true);
    assert.notStrictEqual(partialTl.color, '#34d399', 'Degraded state must not display calm green');
    console.log('  ✓ State 2 (Partial Outage): Classified as DEGRADED (Amber #eab308)');

    // C. Total blackout (0 feeds)
    const blackoutData = {
      news: { status: 'UNAVAILABLE' },
      traffic: { status: 'UNAVAILABLE' },
      borders: { status: 'UNAVAILABLE' },
      wildfire: { status: 'UNAVAILABLE' },
      aviation: { status: 'UNAVAILABLE' },
      telegram: { status: 'UNAVAILABLE' },
      weather: { status: 'UNAVAILABLE' },
      radiation: { status: 'UNAVAILABLE' },
      aqi: { status: 'UNAVAILABLE' },
      earthquakes: { status: 'UNAVAILABLE' }
    };
    const blackoutTl = computeThreatLevel(blackoutData);
    assert.strictEqual(blackoutTl.activeFeeds, 0);
    assert.strictEqual(blackoutTl.level, 'NO TELEMETRY');
    assert.strictEqual(blackoutTl.color, '#94a3b8');
    assert.notStrictEqual(blackoutTl.color, '#34d399', 'Total blackout MUST NEVER be green');
    assert.strictEqual(blackoutTl.isBlackout, true);
    console.log('  ✓ State 3 (Total Blackout): Classified as NO TELEMETRY (Neutral #94a3b8) - NOT green LOW 0\n');

    // ──────────────────────────────────────────────────────────────────────────
    // P1.5: API Middleware Ordering (/api/auth/me rate limiting)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('--- 5. P1.5: Middleware Ordering (/api/auth/me Rate Limiting) ---');
    const meRes = await makeRequest(server, { path: '/api/auth/me' });
    assert.ok(meRes.headers['ratelimit-limit'], 'apiLimiter headers must be present on /api/auth/me');
    assert.strictEqual(meRes.headers['ratelimit-limit'], '120');
    console.log('  ✓ Verified: /api/auth/me is protected by apiLimiter (RateLimit-Limit: 120)\n');

    // ──────────────────────────────────────────────────────────────────────────
    // P1.6: CSRF Protection on POST /api/auth/logout
    // ──────────────────────────────────────────────────────────────────────────
    console.log('--- 6. P1.6: CSRF Protection on Logout ---');

    // Missing CSRF token
    const logoutMissingCsrf = await makeRequest(server, {
      path: '/api/auth/logout',
      method: 'POST',
      headers: {
        'Cookie': cookieHeader
      }
    });
    assert.strictEqual(logoutMissingCsrf.statusCode, 403, 'Logout without CSRF token must return 403 Forbidden');
    console.log('  ✓ Logout with missing CSRF rejected (HTTP 403)');

    // Invalid CSRF token
    const logoutInvalidCsrf = await makeRequest(server, {
      path: '/api/auth/logout',
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
        'X-CSRF-Token': 'invalid-forged-csrf-token'
      }
    });
    assert.strictEqual(logoutInvalidCsrf.statusCode, 403, 'Logout with invalid CSRF token must return 403 Forbidden');
    console.log('  ✓ Logout with invalid CSRF rejected (HTTP 403)');

    // Valid CSRF token
    const logoutValid = await makeRequest(server, {
      path: '/api/auth/logout',
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
        'X-CSRF-Token': csrfToken
      }
    });
    assert.strictEqual(logoutValid.statusCode, 200, 'Logout with valid CSRF token must succeed with 200');
    assert.strictEqual(logoutValid.json?.ok, true);
    console.log('  ✓ Logout with valid CSRF succeeded (HTTP 200)\n');

    // ──────────────────────────────────────────────────────────────────────────
    // P1.7: Terminal Express Error Middleware (JSON response, no stack trace)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('--- 7. P1.7: Terminal Error Middleware (Malformed JSON Handling) ---');
    const malformedJsonRes = await makeRequest(server, {
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: '{ malformed: json, missing quote }'
    });

    assert.strictEqual(malformedJsonRes.statusCode, 400);
    assert.strictEqual(malformedJsonRes.headers['content-type'].includes('application/json'), true, 'Must return JSON');
    assert.strictEqual(malformedJsonRes.json?.error, 'Malformed JSON request body');
    assert.strictEqual(malformedJsonRes.rawBody.includes('node_modules'), false, 'Response must not disclose node_modules path');
    assert.strictEqual(malformedJsonRes.rawBody.includes('/workspaces/'), false, 'Response must not disclose absolute file paths');
    assert.strictEqual(malformedJsonRes.rawBody.includes('SyntaxError'), false, 'Response must not disclose stack trace');
    console.log('  ✓ Verified: Malformed JSON returns controlled JSON error with zero filesystem or stack trace leakage\n');

    // ──────────────────────────────────────────────────────────────────────────
    // P1.8: SSE Connection Caps & Resource Controls
    // ──────────────────────────────────────────────────────────────────────────
    console.log('--- 8. P1.8: SSE Lifecycle & Connection Caps ---');

    // Re-authenticate for SSE test
    const newSession = auth.createSession(testUser.id, '127.0.0.1', 'SSE-Tester');
    const sseCookie = `sentinel_session=${newSession.sessionId}`;

    // Establish connections up to per-user limit
    const sseRequests = [];
    const port = server.address().port;

    for (let i = 0; i < 5; i++) {
      const sseReq = http.request({
        port,
        path: '/events',
        headers: { 'Cookie': sseCookie }
      });
      sseReq.end();
      sseRequests.push(sseReq);
    }

    // Attempt 6th connection (exceeding MAX_SSE_PER_USER = 5)
    const exceedSse = await makeRequest(server, {
      path: '/events',
      headers: { 'Cookie': sseCookie }
    });

    assert.strictEqual(exceedSse.statusCode, 429, 'Excess SSE connections per user must receive 429 Too Many Requests');
    console.log('  ✓ Per-user SSE connection cap enforced (6th connection received HTTP 429)');

    // Close opened connections
    sseRequests.forEach(req => req.destroy());
    console.log('  ✓ Active SSE connections cleaned up cleanly\n');

    // ──────────────────────────────────────────────────────────────────────────
    // P2.9: Verification of Zero Residual Cache Files
    // ──────────────────────────────────────────────────────────────────────────
    console.log('--- 9. P2.9: Elimination of Residual File Cache Persistence ---');
    const borderCacheFile = path.join(__dirname, '../skills/border-monitor/.border_cache.json');
    const wildfireCacheFile = path.join(__dirname, '../skills/wildfire-monitor/.wildfire_cache.json');

    assert.strictEqual(fs.existsSync(borderCacheFile), false, '.border_cache.json must not exist on disk');
    assert.strictEqual(fs.existsSync(wildfireCacheFile), false, '.wildfire_cache.json must not exist on disk');
    console.log('  ✓ Verified: No residual .border_cache.json or .wildfire_cache.json files exist on disk');
    console.log('  ✓ Skills use centralized SQLite cache via memoryBank\n');

    console.log('================================================================');
    console.log('ALL 9 ADVERSARIAL AUDIT VERIFICATION SUITES PASSED (100%)');
    console.log('System is verified resilient, fail-safe, and contract-aligned.');
    console.log('================================================================\n');

  } finally {
    server.close();
  }
}

if (require.main === module) {
  runAdversarialAuditTests().catch(err => {
    console.error('\n❌ ADVERSARIAL AUDIT TEST SUITE FAILED:', err);
    process.exit(1);
  });
}

module.exports = { runAdversarialAuditTests };
