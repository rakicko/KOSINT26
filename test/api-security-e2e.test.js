'use strict';

const assert = require('assert');
const http = require('http');
const { app } = require('../server/index');
const { stopWorker } = require('../server/worker');
const { createUser } = require('../server/auth');

let server;
let baseUrl;

function request(method, path, { headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqOptions = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { ...headers }
    };

    let payload = null;
    if (body) {
      payload = typeof body === 'string' ? body : JSON.stringify(body);
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data,
          json
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runE2eTests() {
  console.log('\n=== TESTING E2E API SECURITY, AUTH, RBAC, CSRF & HEADERS ===\n');

  // Start test server on random ephemeral port
  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;

  try {
    // 1. Unauthenticated request rejection
    console.log('1. Verifying unauthenticated requests are rejected with 401...');
    const unauthAlerts = await request('GET', '/api/alerts');
    assert.strictEqual(unauthAlerts.status, 401);
    assert.strictEqual(unauthAlerts.json?.error, 'Authentication required');

    const unauthStatus = await request('POST', '/api/status', { body: { location: 'Kosovo' } });
    assert.strictEqual(unauthStatus.status, 401);

    const unauthEvents = await request('GET', '/events');
    assert.strictEqual(unauthEvents.status, 401);
    console.log('  ✓ Unauthenticated access to /api/* and /events correctly rejected (401)');

    // 2. Security Headers
    console.log('2. Verifying HTTP security headers (Helmet)...');
    const headerCheck = await request('GET', '/');
    assert.ok(headerCheck.headers['content-security-policy'], 'CSP must be present');
    assert.strictEqual(headerCheck.headers['x-content-type-options'], 'nosniff');
    assert.strictEqual(headerCheck.headers['x-frame-options'], 'DENY');
    console.log('  ✓ Security headers (CSP, nosniff, DENY) verified');

    // 3. CORS / Unauthorized Cross-Origin Rejection
    console.log('3. Verifying unauthorized cross-origin rejection...');
    const corsCheck = await request('GET', '/api/alerts', {
      headers: { 'Origin': 'http://hostile-phishing-domain.com' }
    });
    assert.strictEqual(corsCheck.status, 403, 'Unauthorized origin must be rejected with 403');
    console.log('  ✓ Unauthorized cross-origin request rejected (403)');

    // 4. Authentication Login Failure (Generic Error)
    console.log('4. Verifying login failure behavior...');
    const badLogin = await request('POST', '/api/auth/login', {
      body: { username: 'nonexistent_user', password: 'WrongPassword123#' }
    });
    assert.strictEqual(badLogin.status, 401);
    assert.strictEqual(badLogin.json?.error, 'Invalid username or password');
    console.log('  ✓ Invalid credentials return generic 401 error message');

    // 5. Successful Operator Login & Session Creation
    console.log('5. Testing operator login and HttpOnly cookie issuance...');
    const opUsername = `op_${Date.now()}`;
    createUser({ username: opUsername, password: 'StrongPassword123!', role: 'operator' });

    const opLogin = await request('POST', '/api/auth/login', {
      body: { username: opUsername, password: 'StrongPassword123!' }
    });
    assert.strictEqual(opLogin.status, 200);
    assert.ok(opLogin.json?.ok);
    assert.strictEqual(opLogin.json?.user?.role, 'operator');
    const opCsrf = opLogin.json?.csrfToken;
    assert.ok(opCsrf && opCsrf.length === 64, 'CSRF token must be provided');

    // Extract set-cookie
    const setCookie = opLogin.headers['set-cookie']?.[0];
    assert.ok(setCookie && setCookie.includes('sentinel_session='), 'sentinel_session cookie must be set');
    assert.ok(setCookie.includes('HttpOnly'), 'Cookie must be HttpOnly');
    const cookieVal = setCookie.split(';')[0];
    console.log('  ✓ Operator authenticated, HttpOnly session and CSRF issued');

    // 6. Authenticated GET request with cookie
    console.log('6. Testing authenticated access with session cookie...');
    const authAlerts = await request('GET', '/api/alerts', {
      headers: { 'Cookie': cookieVal }
    });
    assert.strictEqual(authAlerts.status, 200);
    assert.ok(Array.isArray(authAlerts.json?.alerts));
    console.log('  ✓ Authenticated request with cookie succeeded (200)');

    // 7. CSRF Defense on Mutating Endpoint
    console.log('7. Verifying CSRF protection on mutating POST requests...');
    // Attempt POST without CSRF header
    const noCsrfPost = await request('POST', '/api/alerts/read', {
      headers: { 'Cookie': cookieVal }
    });
    assert.strictEqual(noCsrfPost.status, 403, 'Mutating POST without CSRF token must return 403');
    assert.strictEqual(noCsrfPost.json?.error, 'Invalid or missing CSRF token');

    // Attempt POST with valid CSRF header
    const validCsrfPost = await request('POST', '/api/alerts/read', {
      headers: {
        'Cookie': cookieVal,
        'X-CSRF-Token': opCsrf
      }
    });
    assert.strictEqual(validCsrfPost.status, 200, 'Mutating POST with valid CSRF token must succeed (200)');
    console.log('  ✓ CSRF protection verified (blocked without token, allowed with token)');

    // 8. Server-Side RBAC: Operator blocked from Admin operations
    console.log('8. Verifying RBAC: Operator blocked from administrative operations...');
    const opAdminAttempt = await request('POST', '/api/preferences', {
      headers: {
        'Cookie': cookieVal,
        'X-CSRF-Token': opCsrf
      },
      body: { preferences: { defaultTimeline: '7d' } }
    });
    assert.strictEqual(opAdminAttempt.status, 403, 'Operator must receive 403 on admin-only route');
    assert.strictEqual(opAdminAttempt.json?.error, 'Insufficient administrative privileges');
    console.log('  ✓ Operator blocked from administrative preferences update (403)');

    // 9. Server-Side RBAC: Administrator allowed on Admin operations
    console.log('9. Verifying RBAC: Administrator permitted on administrative operations...');
    const adminUsername = `adm_${Date.now()}`;
    createUser({ username: adminUsername, password: 'AdminPassword123!', role: 'administrator' });

    const adminLogin = await request('POST', '/api/auth/login', {
      body: { username: adminUsername, password: 'AdminPassword123!' }
    });
    const adminCookie = adminLogin.headers['set-cookie']?.[0].split(';')[0];
    const adminCsrf = adminLogin.json?.csrfToken;

    const adminPrefUpdate = await request('POST', '/api/preferences', {
      headers: {
        'Cookie': adminCookie,
        'X-CSRF-Token': adminCsrf
      },
      body: { preferences: { defaultTimeline: '7d' } }
    });
    assert.strictEqual(adminPrefUpdate.status, 200, 'Administrator must be allowed to update preferences');
    assert.strictEqual(adminPrefUpdate.json?.preferences?.defaultTimeline, '7d');
    console.log('  ✓ Administrator successfully performed administrative update (200)');

    // 10. Logout & Session Invalidation
    console.log('10. Testing logout and session destruction...');
    const logoutRes = await request('POST', '/api/auth/logout', {
      headers: {
        'Cookie': cookieVal,
        'X-CSRF-Token': opCsrf
      }
    });
    assert.strictEqual(logoutRes.status, 200);

    // Subsequent request with destroyed session must fail
    const revokedCheck = await request('GET', '/api/alerts', {
      headers: { 'Cookie': cookieVal }
    });
    assert.strictEqual(revokedCheck.status, 401, 'Logged out session must be rejected with 401');
    console.log('  ✓ Session terminated and invalidated upon logout');

    console.log('\n=== ALL E2E API SECURITY TESTS PASSED ===\n');
  } finally {
    stopWorker();
    server.close();
  }
}

runE2eTests().catch(err => {
  console.error('E2E Test Failed:', err);
  stopWorker();
  if (server) server.close();
  process.exit(1);
});
