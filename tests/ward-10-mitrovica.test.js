'use strict';

const test = require('node:test');
const assert = require('node:assert');
const staffService = require('../server/staff-service');

test('WARD No. 10 (Regional Centre Mitrovicë/Mitrovica) Staff Verification', async (t) => {
  const locations = staffService.getLocations();

  await t.test('1. Verify total personnel locations count (12 MMs: 6 Intl + 6 Natl, and 3 Safe Havens/Facilities)', () => {
    assert.strictEqual(locations.length, 15, 'Expected 15 total locations (12 staff residences + 3 safe havens/facilities)');
  });

  await t.test('2. Verify Warden details & email privacy', () => {
    const warden = locations.find(l => l.callsign === '61 A');
    assert.ok(warden, 'Warden with callsign 61 A must exist');
    assert.strictEqual(warden.name, 'WARDEN-LEAD (61 A)');
    assert.strictEqual(warden.role, 'Warden');
    assert.strictEqual(warden.staffType, 'international');
    assert.strictEqual(warden.radioChannel, 'CH-04');
    assert.strictEqual(warden.phone, '+383 49 000 001');
    assert.strictEqual(warden.email, undefined, 'User personal email must be omitted for privacy/OPSEC');
    assert.strictEqual(warden.totalSouls, 3, 'Warden + 2 dependants = 3 souls');
    assert.ok(warden.dependants.includes('Spouse'), 'Dependant spouse must be listed');
    assert.ok(warden.dependants.includes('Son'), 'Dependant son must be listed');
    assert.ok(warden.address.includes('Tactical Sector Alpha'));
    assert.strictEqual(warden.zone, 'Prishtinë');
  });

  await t.test('3. Verify Deputy Warden details & email privacy', () => {
    const deputy = locations.find(l => l.callsign === '64W');
    assert.ok(deputy, 'Deputy Warden with callsign 64W must exist');
    assert.strictEqual(deputy.name, 'DEPUTY-WARDEN (64W)');
    assert.strictEqual(deputy.role, 'Deputy Warden');
    assert.strictEqual(deputy.staffType, 'international');
    assert.strictEqual(deputy.radioChannel, 'CH-04');
    assert.strictEqual(deputy.phone, '+383 49 000 002');
    assert.strictEqual(deputy.email, undefined, 'User personal email must be omitted for privacy/OPSEC');
    assert.strictEqual(deputy.zone, 'Mitrovica South');
    assert.ok(Math.abs(deputy.lat - 42.8893) < 0.005);
    assert.ok(Math.abs(deputy.lon - 20.8715) < 0.005);
  });

  await t.test('4. Verify INTL-OFFICER-01 (63 B) details & email privacy', () => {
    const staff = locations.find(l => l.callsign === '63 B');
    assert.ok(staff, 'Staff with callsign 63 B must exist');
    assert.strictEqual(staff.nationality, 'Czech Republic');
    assert.strictEqual(staff.staffType, 'international');
    assert.strictEqual(staff.radioChannel, 'CH-04');
    assert.ok(staff.phone.includes('+383 49 000 003'));
    assert.ok(staff.secondaryPhone.includes('+381 64 000 003'));
    assert.strictEqual(staff.email, undefined, 'User personal email must be omitted for privacy/OPSEC');
    assert.strictEqual(staff.zone, 'Mitrovica North');
    assert.ok(staff.address.includes('Mitrovica North Sector 1'));
  });

  await t.test('5. Verify INTL-OFFICER-02 (64 M) details & email privacy', () => {
    const staff = locations.find(l => l.callsign === '64 M');
    assert.ok(staff, 'Staff with callsign 64 M must exist');
    assert.strictEqual(staff.nationality, 'France');
    assert.strictEqual(staff.staffType, 'international');
    assert.strictEqual(staff.radioChannel, 'CH-04');
    assert.strictEqual(staff.phone, '+383 49 000 004');
    assert.strictEqual(staff.email, undefined, 'User personal email must be omitted for privacy/OPSEC');
    assert.strictEqual(staff.zone, 'Mitrovica South');
    assert.ok(staff.address.includes('Tavnik Sector'));
  });

  await t.test('6. Verify INTL-OFFICER-03 (64 R) details & email privacy', () => {
    const staff = locations.find(l => l.callsign === '64 R');
    assert.ok(staff, 'Staff with callsign 64 R must exist');
    assert.strictEqual(staff.nationality, 'USA');
    assert.strictEqual(staff.staffType, 'international');
    assert.strictEqual(staff.radioChannel, 'CH-04');
    assert.strictEqual(staff.phone, '+383 49 000 005');
    assert.strictEqual(staff.email, undefined, 'User personal email must be omitted for privacy/OPSEC');
    assert.strictEqual(staff.zone, 'Mitrovica North');
    assert.ok(staff.address.includes('Central Sector'));
  });

  await t.test('7. Verify INTL-OFFICER-04 (64J) details & email privacy', () => {
    const staff = locations.find(l => l.callsign === '64J');
    assert.ok(staff, 'Staff with callsign 64J must exist');
    assert.strictEqual(staff.nationality, 'Montenegro');
    assert.strictEqual(staff.staffType, 'international');
    assert.strictEqual(staff.radioChannel, 'CH-04');
    assert.ok(staff.phone.includes('+383 49 000 006'));
    assert.ok(staff.secondaryPhone.includes('+381 64 000 006'));
    assert.strictEqual(staff.email, undefined, 'User personal email must be omitted for privacy/OPSEC');
    assert.strictEqual(staff.zone, 'Mitrovica North');
    assert.ok(staff.address.includes('North Sector'));
  });

  await t.test('8. Verify 6 National Staff members in WARD No. 10', () => {
    const natStaff = locations.filter(l => l.staffType === 'national');
    assert.strictEqual(natStaff.length, 6, 'Must have 6 national staff members');

    const dejan = natStaff.find(s => s.callsign === '62C');
    assert.ok(dejan, 'National officer 62C must exist');
    assert.strictEqual(dejan.totalSouls, 4);
    assert.strictEqual(dejan.lat, 42.89943);
    assert.strictEqual(dejan.lon, 20.86372);
    assert.ok(dejan.dependants.includes('Spouse'));

    const aleksandar = natStaff.find(s => s.callsign === '62G');
    assert.ok(aleksandar, 'National officer 62G must exist');
    assert.strictEqual(aleksandar.totalSouls, 4);
    assert.strictEqual(aleksandar.lat, 42.89801);
    assert.strictEqual(aleksandar.lon, 20.86508);

    const branislav = natStaff.find(s => s.callsign === '62M');
    assert.ok(branislav, 'National officer 62M must exist');
    assert.strictEqual(branislav.totalSouls, 2);
    assert.strictEqual(branislav.zone, 'Leposavić');

    const milos = natStaff.find(s => s.callsign === '62P');
    assert.ok(milos, 'National officer 62P must exist');
    assert.strictEqual(milos.totalSouls, 1);
    assert.strictEqual(milos.zone, 'Zvečan');

    const ivica = natStaff.find(s => s.callsign === '62T');
    assert.ok(ivica, 'National officer 62T must exist');
    assert.strictEqual(ivica.totalSouls, 4);
    assert.strictEqual(ivica.lat, 42.21906);
    assert.strictEqual(ivica.lon, 20.99951);

    const vladan = natStaff.find(s => s.callsign === '62H');
    assert.ok(vladan, 'National officer 62H must exist');
    assert.strictEqual(vladan.totalSouls, 4);
    assert.strictEqual(vladan.lat, 42.8962);
    assert.strictEqual(vladan.lon, 20.8648);
  });

  await t.test('9. Verify total souls equals 27 across WARD No. 10', () => {
    const staffMembers = locations.filter(l => l.category !== 'safe_haven');
    const totalSouls = staffMembers.reduce((sum, item) => sum + (item.totalSouls || 1), 0);
    assert.strictEqual(totalSouls, 27, 'Total mission members + dependants must equal 27 souls (8 intl + 19 natl)');
  });

  await t.test('10. Verify Safe Haven in Mitrovica North is at exact grids 42.898893, 20.862213', () => {
    const safeHavenNorth = locations.find(l => l.callsign === 'SAFE HAVEN - NORTH');
    assert.ok(safeHavenNorth, 'Safe Haven North must exist');
    assert.ok(Math.abs(safeHavenNorth.lat - 42.898893) < 0.0001, 'Latitude must match 42.898893');
    assert.ok(Math.abs(safeHavenNorth.lon - 20.862213) < 0.0001, 'Longitude must match 20.862213');
  });

  await t.test('11. Verify Regional Centre Mitrovica at 42.890128, 20.876167', () => {
    const rcMitrovica = locations.find(l => l.callsign === 'RC MITROVICA');
    assert.ok(rcMitrovica, 'RC Mitrovica facility must exist');
    assert.strictEqual(rcMitrovica.name, 'Regional Centre Mitrovica');
    assert.ok(Math.abs(rcMitrovica.lat - 42.890128) < 0.0001);
    assert.ok(Math.abs(rcMitrovica.lon - 20.876167) < 0.0001);
  });

  await t.test('12. Verify International and National staff tick checkboxes exist in UI', () => {
    const fs = require('fs');
    const path = require('path');
    const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
    assert.ok(indexHtml.includes('id="staffFilterInternational"'), 'Must have checkbox for International staff');
    assert.ok(indexHtml.includes('id="staffFilterNational"'), 'Must have checkbox for National staff');
    assert.ok(indexHtml.includes('id="staffFilterSafeHaven"'), 'Must have checkbox for Safe Havens');
  });

  await t.test('13. Verify cards remove (1 Souls) / (X Souls) and leave only Dependants', () => {
    const fs = require('fs');
    const path = require('path');
    const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
    assert.ok(appJs.includes('<strong>Dependants:</strong>'), 'Cards must display clean <strong>Dependants:</strong> label');
    assert.ok(!appJs.includes('<strong>Dependants (${staff.totalSouls'), 'Must not display (${staff.totalSouls} Souls)');
  });

  await t.test('14. Verify route default start marks Regional Centre Mitrovica for Mitrovica South', () => {
    const fs = require('fs');
    const path = require('path');
    const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
    assert.ok(appJs.includes("SOUTH_LABEL = 'Regional Centre Mitrovica'"), 'South start must be labeled Regional Centre Mitrovica');
    assert.ok(appJs.includes("startInput.value = SOUTH_LABEL"), 'startInput must receive SOUTH_LABEL');
    assert.ok(appJs.includes("'regional centre mitrovica': { name: 'Regional Centre Mitrovica'"), 'Geocoding dictionary must map Regional Centre Mitrovica');
  });

  await t.test('15. Verify nav rail bottom is spaced above live alert ticker bar', () => {
    const fs = require('fs');
    const path = require('path');
    const css = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');
    assert.ok(css.includes('bottom: 42px;'), 'Nav rail bottom must be at 42px to clear ticker bar');
    assert.ok(css.includes('.nav-rail-utility'), '.nav-rail-utility must have distinct spacing');
  });
});
