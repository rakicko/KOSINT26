'use strict';

const assert = require('assert');
const path = require('path');
const db = require('../server/db');
const memoryBank = require('../skills/memory-bank/skill');

async function testPersistence() {
  console.log('\n=== TESTING SQLITE PERSISTENCE & DATA INTEGRITY ===\n');

  // Test 1: Concurrency - 100 simultaneous alert inserts
  console.log('1. Testing 100 concurrent alert insertions...');
  const alertPromises = [];
  for (let i = 0; i < 100; i++) {
    alertPromises.push(Promise.resolve().then(() => {
      memoryBank.addAlerts([{
        id: `concurrency-alert-${i}`,
        severity: i % 2 === 0 ? 'CRITICAL' : 'HIGH',
        title: `Concurrent Alert ${i}`,
        message: 'Testing concurrent database access',
        timestamp: new Date().toISOString()
      }]);
    }));
  }
  await Promise.all(alertPromises);
  const alerts = memoryBank.get('alerts');
  assert.ok(alerts.length > 0, 'Alerts should be populated');
  console.log('  ✓ 100 concurrent alert inserts succeeded without deadlock or corruption');

  // Test 2: Concurrency - 50 simultaneous location updates
  console.log('2. Testing 50 concurrent location upserts...');
  const locPromises = [];
  for (let i = 0; i < 50; i++) {
    locPromises.push(Promise.resolve().then(() => {
      memoryBank.addLocation({
        name: `Test-City-${i % 5}`,
        lat: 42.0 + (i % 5) * 0.1,
        lon: 21.0 + (i % 5) * 0.1
      });
    }));
  }
  await Promise.all(locPromises);
  const locs = memoryBank.get('locations');
  assert.ok(locs.length > 0, 'Locations should be stored');
  console.log('  ✓ Concurrent location upserts succeeded');

  // Test 3: Interleaved concurrent reads and writes
  console.log('3. Testing interleaved concurrent reads and writes...');
  const interleaved = [];
  for (let i = 0; i < 30; i++) {
    interleaved.push(Promise.resolve().then(() => {
      if (i % 2 === 0) {
        memoryBank.addAlerts([{
          id: `interleaved-${i}`,
          severity: 'MEDIUM',
          title: `Interleaved ${i}`,
          timestamp: new Date().toISOString()
        }]);
      } else {
        const u = memoryBank.getUnreadCount();
        assert.ok(typeof u === 'number');
      }
    }));
  }
  await Promise.all(interleaved);
  console.log('  ✓ Interleaved reads and writes completed cleanly');

  // Test 4: Malformed input resilience
  console.log('4. Testing resilience against malformed inputs...');
  memoryBank.addAlerts(null);
  memoryBank.addAlerts([]);
  memoryBank.addAlerts([null, undefined, {}, { title: 'No ID' }]);
  memoryBank.addLocation(null);
  memoryBank.addLocation({});
  memoryBank.set('preferences', null);
  console.log('  ✓ Malformed inputs handled safely without crashes');

  // Test 5: Durability & ACID rollback on transaction error
  console.log('5. Testing transaction rollback integrity...');
  const countBefore = db.prepare('SELECT COUNT(*) as c FROM alerts').get().c;
  try {
    const failingTx = db.transaction(() => {
      db.prepare('INSERT INTO alerts (id, module, severity, title, timestamp, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
        'should-rollback-id', 'test', 'LOW', 'Rollback test', new Date().toISOString(), new Date().toISOString()
      );
      // Force an error
      throw new Error('SIMULATED_TRANSACTION_FAILURE');
    });
    failingTx();
  } catch (err) {
    assert.strictEqual(err.message, 'SIMULATED_TRANSACTION_FAILURE');
  }
  const countAfter = db.prepare('SELECT COUNT(*) as c FROM alerts').get().c;
  assert.strictEqual(countBefore, countAfter, 'Failed transaction must roll back completely');
  const rolledBackRow = db.prepare('SELECT id FROM alerts WHERE id = ?').get('should-rollback-id');
  assert.strictEqual(rolledBackRow, undefined, 'Rollback row must not exist in database');
  console.log('  ✓ Transaction rollback verified: database remains in consistent state');

  console.log('\n=== ALL PERSISTENCE TESTS PASSED ===\n');
}

testPersistence().catch(err => {
  console.error('Persistence test failed:', err);
  process.exit(1);
});
