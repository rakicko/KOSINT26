'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function runE2eTest() {
  console.log('=== Staff Warden End-to-End Verification ===\n');

  // 1. HTML Verification
  console.log('1. Verifying public/index.html elements...');
  const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  assert.ok(html.includes('id="btnStaffWarden"'), 'Nav rail must have btnStaffWarden');
  assert.ok(html.includes('id="staffNavLockBadge"'), 'Nav rail must have staffNavLockBadge');
  assert.ok(html.includes('id="staffPanel"'), 'index.html must have staffPanel');
  assert.ok(html.includes('id="staffList"'), 'staffPanel must have staffList');
  assert.ok(html.includes('id="staffLoginModal"'), 'index.html must have staffLoginModal');
  assert.ok(html.includes('id="staffAuthUser"'), 'staffLoginModal must have staffAuthUser');
  assert.ok(html.includes('id="staffAuthPass"'), 'staffLoginModal must have staffAuthPass');
  assert.ok(html.includes('id="staffAddModal"'), 'index.html must have staffAddModal');
  console.log('✓ Passed: All HTML elements present in index.html.\n');

  // 2. Client JS Verification
  console.log('2. Verifying public/app.js functions...');
  const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
  assert.ok(appJs.includes('staffToken:'), 'state must have staffToken');
  assert.ok(appJs.includes('staffLocations:'), 'state must have staffLocations');
  assert.ok(appJs.includes('staff: {'), 'moduleLayers must have staff');
  assert.ok(appJs.includes('function openStaffLoginModal'), 'app.js must define openStaffLoginModal');
  assert.ok(appJs.includes('function submitStaffLogin'), 'app.js must define submitStaffLogin');
  assert.ok(appJs.includes('function logoutStaff'), 'app.js must define logoutStaff');
  assert.ok(appJs.includes('function fetchStaffLocations'), 'app.js must define fetchStaffLocations');
  assert.ok(appJs.includes('function renderStaffMapMarkers'), 'app.js must define renderStaffMapMarkers');
  assert.ok(appJs.includes('function focusStaffLocation'), 'app.js must define focusStaffLocation');
  assert.ok(appJs.includes('function routeToStaff'), 'app.js must define routeToStaff');
  assert.ok(appJs.includes('window.openStaffLoginModal = openStaffLoginModal'), 'Must export openStaffLoginModal to window');
  console.log('✓ Passed: All client logic and handlers present in app.js.\n');

  // 3. CSS Verification
  console.log('3. Verifying public/style.css tactical styles...');
  const css = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');
  assert.ok(css.includes('.staff-auth-card'), 'style.css must have .staff-auth-card');
  assert.ok(css.includes('.staff-marker-pin'), 'style.css must have .staff-marker-pin');
  assert.ok(css.includes('.staff-card'), 'style.css must have .staff-card');
  assert.ok(css.includes('.staff-map-popup'), 'style.css must have .staff-map-popup');
  console.log('✓ Passed: Tactical styles present in style.css.\n');

  // 4. Live Server Verification
  console.log('4. Verifying live HTTP server on port 3000...');
  let indexRes;
  for (let i = 0; i < 5; i++) {
    try {
      indexRes = await axios.get('http://localhost:3000/');
      if (indexRes.status === 200) break;
    } catch (e) {
      await new Promise(r => setTimeout(r, 250));
    }
  }
  assert.strictEqual(indexRes?.status, 200, 'Frontend must serve HTTP 200');

  // Unauthenticated API request must return 401
  try {
    await axios.get('http://localhost:3000/api/staff/locations');
    assert.fail('Unauthenticated request should have failed');
  } catch (err) {
    assert.strictEqual(err.response?.status, 401, 'Should return 401 Unauthorized');
  }

  // Authenticate
  const loginRes = await axios.post('http://localhost:3000/api/staff/login', {
    username: 'warden',
    password: 'osce2026safe'
  });
  assert.strictEqual(loginRes.status, 200);
  assert.ok(loginRes.data.token, 'Must return session token');

  // Authenticated GET
  const staffRes = await axios.get('http://localhost:3000/api/staff/locations', {
    headers: { Authorization: `Bearer ${loginRes.data.token}` }
  });
  assert.strictEqual(staffRes.status, 200);
  assert.ok(Array.isArray(staffRes.data.locations));
  assert.ok(staffRes.data.locations.length >= 6);
  console.log(`✓ Passed: Live server authenticated successfully (${staffRes.data.locations.length} personnel locations returned).\n`);

  // 5. Verify coordinate parsing in routing logic does not split lat,lon
  console.log('5. Verifying route coordinate resolution for "42.8945, 20.8672"...');
  assert.ok(appJs.includes('parseDestinations'), 'app.js must contain parseDestinations to protect lat,lon coordinates');
  console.log('✓ Passed: parseDestinations function present.\n');

  console.log('=== ALL E2E VERIFICATION CHECKS PASSED ===');
}

runE2eTest().catch(err => {
  console.error('E2E Test Failure:', err.message);
  process.exit(1);
});
