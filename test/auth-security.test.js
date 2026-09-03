'use strict';

const assert = require('assert');
const auth = require('../server/auth');

async function runAuthTests() {
  console.log('\n=== TESTING AUTHENTICATION, SESSIONS, RBAC & CSRF SECURITY ===\n');

  // 1. Password Hashing & Timing-Safe Verification
  console.log('1. Testing scrypt password hashing and verification...');
  const { hash, salt } = auth.hashPassword('SuperSecretTestPassword#123');
  assert.ok(hash && hash.length === 128, 'Hash must be 64-byte hex string (128 chars)');
  assert.ok(salt && salt.length === 64, 'Salt must be 32-byte hex string (64 chars)');
  assert.strictEqual(auth.verifyPassword('SuperSecretTestPassword#123', hash, salt), true, 'Correct password must verify');
  assert.strictEqual(auth.verifyPassword('WrongPassword#999', hash, salt), false, 'Wrong password must be rejected');
  assert.strictEqual(auth.verifyPassword('', hash, salt), false, 'Empty password must be rejected');
  console.log('  ✓ Password hashing and timing-safe verification confirmed');

  // 2. User Creation & Validation
  console.log('2. Testing user creation constraints...');
  assert.throws(() => auth.createUser({ username: 'ab', password: 'ValidPass123#' }), /Username must be 3-32/);
  assert.throws(() => auth.createUser({ username: 'valid_user', password: 'short' }), /Password must be at least 10/);
  assert.throws(() => auth.createUser({ username: 'valid_user', password: 'ValidPass123#', role: 'supergod' }), /Role must be either/);
  
  const testUser = auth.createUser({
    username: `test_user_${Date.now()}`,
    password: 'ValidPassword2026!',
    role: 'operator'
  });
  assert.strictEqual(testUser.role, 'operator');
  console.log('  ✓ User creation and input validation confirmed');

  // 3. Session Creation, Validation, and Expiration
  console.log('3. Testing session lifecycle...');
  const session = auth.createSession(testUser.id, '127.0.0.1', 'Mozilla/Test');
  assert.ok(session.sessionId && session.sessionId.length === 64, 'Session ID must be 32-byte hex');
  assert.ok(session.csrfToken && session.csrfToken.length === 64, 'CSRF token must be 32-byte hex');

  const validated = auth.validateSession(session.sessionId);
  assert.ok(validated !== null, 'Active session must validate');
  assert.strictEqual(validated.user.username, testUser.username);
  assert.strictEqual(validated.user.role, 'operator');
  assert.strictEqual(validated.session.csrfToken, session.csrfToken);

  // Expired session test
  const expiredSession = auth.createSession(testUser.id, '127.0.0.1', 'Mozilla/Test');
  // Manually backdate expiration in db
  const db = require('../server/db');
  db.prepare('UPDATE sessions SET expires_at = ? WHERE id = ?').run(Date.now() - 1000, expiredSession.sessionId);
  assert.strictEqual(auth.validateSession(expiredSession.sessionId), null, 'Expired session must be rejected');
  console.log('  ✓ Session lifecycle and expiration enforcement confirmed');

  // 4. Session Invalidation / Logout
  console.log('4. Testing session termination...');
  auth.destroySession(session.sessionId);
  assert.strictEqual(auth.validateSession(session.sessionId), null, 'Destroyed session must be rejected immediately');
  console.log('  ✓ Session termination confirmed');

  // 5. Brute-Force Rate Limiting
  console.log('5. Testing brute-force protection...');
  const testIpKey = `rate-limit-test-${Date.now()}`;
  auth.clearAuthRateLimit(testIpKey);

  for (let i = 1; i <= 4; i++) {
    auth.recordFailedAttempt(testIpKey);
    const status = auth.checkAuthRateLimit(testIpKey);
    assert.strictEqual(status.allowed, true, `Attempt ${i} should be allowed before threshold`);
  }

  // 5th attempt triggers lockout
  auth.recordFailedAttempt(testIpKey);
  const lockedStatus = auth.checkAuthRateLimit(testIpKey);
  assert.strictEqual(lockedStatus.allowed, false, '5th failed attempt must trigger lockout');
  assert.ok(lockedStatus.message.includes('Too many failed login attempts'));

  auth.clearAuthRateLimit(testIpKey);
  assert.strictEqual(auth.checkAuthRateLimit(testIpKey).allowed, true, 'Clear rate limit resets lockout');
  console.log('  ✓ Brute-force lockout and rate limiting confirmed');

  // 6. Role-Based Access Control (RBAC) Middleware Logic
  console.log('6. Testing server-side RBAC enforcement...');
  const operatorReq = { user: { role: 'operator', username: 'op1' } };
  const adminReq = { user: { role: 'administrator', username: 'adm1' } };
  const unauthReq = { user: null };

  let allowed = false;
  let statusCode = 0;
  const mockRes = {
    status: (c) => {
      statusCode = c;
      return { json: () => {} };
    }
  };

  const adminOnlyMiddleware = auth.requireRole('administrator');

  // Operator on admin-only route
  statusCode = 0;
  allowed = false;
  adminOnlyMiddleware(operatorReq, mockRes, () => { allowed = true; });
  assert.strictEqual(allowed, false, 'Operator must NOT be allowed on admin route');
  assert.strictEqual(statusCode, 403, 'Operator must receive 403 Forbidden');

  // Admin on admin-only route
  statusCode = 0;
  allowed = false;
  adminOnlyMiddleware(adminReq, mockRes, () => { allowed = true; });
  assert.strictEqual(allowed, true, 'Administrator must be allowed on admin route');

  // Unauthenticated on admin route
  statusCode = 0;
  allowed = false;
  adminOnlyMiddleware(unauthReq, mockRes, () => { allowed = true; });
  assert.strictEqual(allowed, false, 'Unauthenticated user must NOT pass');
  assert.strictEqual(statusCode, 401, 'Unauthenticated user must receive 401');

  console.log('  ✓ Server-side RBAC middleware validation confirmed');

  // 7. CSRF Token Validation Middleware Logic
  console.log('7. Testing CSRF token validation...');
  const safeGetReq = { method: 'GET' };
  let csrfPassed = false;
  auth.requireCsrf(safeGetReq, mockRes, () => { csrfPassed = true; });
  assert.strictEqual(csrfPassed, true, 'GET request must bypass CSRF');

  const mutatingNoCsrf = { method: 'POST', headers: {}, session: { csrfToken: 'valid-csrf-token' } };
  csrfPassed = false;
  statusCode = 0;
  auth.requireCsrf(mutatingNoCsrf, mockRes, () => { csrfPassed = true; });
  assert.strictEqual(csrfPassed, false, 'POST without CSRF header must be rejected');
  assert.strictEqual(statusCode, 403, 'Missing CSRF must return 403');

  const mutatingWrongCsrf = { method: 'POST', headers: { 'x-csrf-token': 'wrong-csrf-token' }, session: { csrfToken: 'valid-csrf-token' } };
  csrfPassed = false;
  statusCode = 0;
  auth.requireCsrf(mutatingWrongCsrf, mockRes, () => { csrfPassed = true; });
  assert.strictEqual(csrfPassed, false, 'POST with forged CSRF token must be rejected');
  assert.strictEqual(statusCode, 403, 'Forged CSRF must return 403');

  const mutatingValidCsrf = { method: 'POST', headers: { 'x-csrf-token': 'valid-csrf-token' }, session: { csrfToken: 'valid-csrf-token' } };
  csrfPassed = false;
  auth.requireCsrf(mutatingValidCsrf, mockRes, () => { csrfPassed = true; });
  assert.strictEqual(csrfPassed, true, 'POST with valid session-bound CSRF token must pass');

  console.log('  ✓ CSRF middleware validation confirmed');

  console.log('\n=== ALL AUTHENTICATION & SECURITY TESTS PASSED ===\n');
}

runAuthTests().catch(err => {
  console.error('Auth test failed:', err);
  process.exit(1);
});
