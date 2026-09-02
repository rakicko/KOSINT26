'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const staffService = require('../server/staff-service');

console.log('=== KOSINT Staff Warden & Evacuation Security Suite ===\n');

// 1. Git Ignore Verification
console.log('Test 1: Verifying staff-db.json is in .gitignore...');
const gitignore = fs.readFileSync(path.join(__dirname, '../.gitignore'), 'utf8');
assert.ok(gitignore.includes('server/staff-db.json'), '.gitignore must explicitly ignore server/staff-db.json');
console.log('✓ Passed: Sensitive staff database is strictly gitignored.\n');

// 2. Authentication Testing
console.log('Test 2: Testing login with invalid credentials...');
const badLogin = staffService.login('wrong-user', 'wrong-pass');
assert.strictEqual(badLogin.success, false, 'Invalid credentials must be rejected');
console.log('✓ Passed: Bad credentials rejected.');

console.log('Test 3: Testing login with correct credentials...');
const goodLogin = staffService.login('warden', 'osce2026safe');
assert.strictEqual(goodLogin.success, true, 'Valid credentials must succeed');
assert.ok(goodLogin.token, 'Must return a session token');
console.log('✓ Passed: Login succeeded and issued token.\n');

// 3. Token Verification
console.log('Test 4: Verifying token validity and tamper resistance...');
const validSession = staffService.verifyToken(goodLogin.token);
assert.ok(validSession, 'Token must be valid');
assert.strictEqual(validSession.user, 'warden');

// Tampered token test
const tamperedToken = goodLogin.token.slice(0, -4) + 'AAAA';
const invalidSession = staffService.verifyToken(tamperedToken);
assert.strictEqual(invalidSession, false, 'Tampered token must be rejected');
console.log('✓ Passed: Token signature verification and tamper prevention verified.\n');

// 4. CRUD Operations
console.log('Test 5: Verifying staff location management...');
const initialLocations = staffService.getLocations();
assert.ok(Array.isArray(initialLocations), 'getLocations must return an array');
assert.ok(initialLocations.length >= 2, 'Default seed must contain safe havens and residences');

// Add test location
const added = staffService.addLocation({
  callsign: 'TEST-WARDEN-99',
  name: 'Test Officer Residence',
  zone: 'Mitrovica North',
  lat: 42.8950,
  lon: 20.8650,
  phone: '+383 49 999 999',
  evacuationPriority: 'HIGH'
});
assert.strictEqual(added.callsign, 'TEST-WARDEN-99');

// Retrieve and confirm presence
const updatedList = staffService.getLocations();
assert.ok(updatedList.some(l => l.id === added.id), 'Added location must be present');

// Update location
const updated = staffService.updateLocation(added.id, { notes: 'Updated security detail' });
assert.strictEqual(updated.notes, 'Updated security detail');

// Delete test location
const deleted = staffService.deleteLocation(added.id);
assert.strictEqual(deleted, true, 'deleteLocation must succeed');
const finalList = staffService.getLocations();
assert.ok(!finalList.some(l => l.id === added.id), 'Deleted location must no longer exist');
console.log('✓ Passed: CRUD operations successfully tested and isolated.\n');

console.log('=== ALL STAFF WARDEN TESTS PASSED SUCCESSFULLY ===');
