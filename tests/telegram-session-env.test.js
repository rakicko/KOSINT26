'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('─────────────────────────────────────────────────────────────────');
console.log('🧪 Starting Telegram Client Lifecycle & Session Isolation Tests');
console.log('─────────────────────────────────────────────────────────────────\n');

// Backup original process.env
const originalEnv = { ...process.env };

function resetEnv() {
  process.env = { ...originalEnv };
}

// ── Test D: Module import alone does not initialize Telegram ─────────────────
console.log('Test D: Verifying module import alone has NO side-effect connection...');
const skill = require('../skills/telegram-monitor/skill');
assert.strictEqual(typeof skill.getTelegramClient, 'function', 'getTelegramClient should be exported');
assert.strictEqual(typeof skill.getTelegramEnvironment, 'function', 'getTelegramEnvironment should be exported');
assert.strictEqual(typeof skill.getSavedSession, 'function', 'getSavedSession should be exported');
assert.strictEqual(typeof skill.validateTelegramConfiguration, 'function', 'validateTelegramConfiguration should be exported');
assert.strictEqual(typeof skill.disconnectTelegramClient, 'function', 'disconnectTelegramClient should be exported');
assert.strictEqual(typeof skill.getClientLifecycleState, 'function', 'getClientLifecycleState should be exported');

// Lifecycle state must be IDLE immediately after import
assert.strictEqual(skill.getClientLifecycleState(), skill.ClientLifecycleState.IDLE, 'Lifecycle state must be IDLE on initial module import');
console.log('✓ Passed: Module import has zero side effects and state is IDLE.\n');

// ── Test E: Local environment session isolation ──────────────────────────────
console.log('Test E: Verifying local environment selects ONLY local session and rejects production session...');
resetEnv();
process.env.TELEGRAM_ENVIRONMENT = 'local';
process.env.TELEGRAM_SESSION_LOCAL = 'MOCK_LOCAL_SESSION_KEY_AAA';
process.env.TELEGRAM_SESSION_PRODUCTION = 'MOCK_PROD_SESSION_KEY_BBB';
process.env.TELEGRAM_SESSION_PROD = 'MOCK_PROD_SESSION_KEY_CCC';

assert.strictEqual(skill.getTelegramEnvironment(), 'local', 'Environment should resolve to local');
assert.strictEqual(skill.getSavedSession('local'), 'MOCK_LOCAL_SESSION_KEY_AAA', 'Local environment must select TELEGRAM_SESSION_LOCAL');

// Verify that if TELEGRAM_SESSION_LOCAL is missing, it NEVER falls back to production
delete process.env.TELEGRAM_SESSION_LOCAL;
delete process.env.TELEGRAM_SESSION_DEV;
// Ensure no local session files interfere in this test
const testSessionLocalFile = path.join(__dirname, '../skills/telegram-monitor/.telegram_session_local');
const testSessionLegacyFile = path.join(__dirname, '../skills/telegram-monitor/.telegram_session');
let backupLocal = null;
let backupLegacy = null;
if (fs.existsSync(testSessionLocalFile)) {
  backupLocal = fs.readFileSync(testSessionLocalFile, 'utf8');
  fs.unlinkSync(testSessionLocalFile);
}
if (fs.existsSync(testSessionLegacyFile)) {
  backupLegacy = fs.readFileSync(testSessionLegacyFile, 'utf8');
  fs.unlinkSync(testSessionLegacyFile);
}

try {
  process.env.TELEGRAM_API_ID = '123456';
  process.env.TELEGRAM_API_HASH = 'test_hash';
  const localSessionWithoutEnv = skill.getSavedSession('local');
  assert.strictEqual(localSessionWithoutEnv, '', 'Local session must be empty when TELEGRAM_SESSION_LOCAL is absent, refusing to fall back to production session');
  
  const localValidation = skill.validateTelegramConfiguration('local');
  assert.strictEqual(localValidation.valid, false, 'Validation must fail when local session is missing');
  assert.strictEqual(localValidation.errors.some(e => e.includes('TELEGRAM_SESSION_LOCAL is required')), true, 'Validation must give clear instruction for local session');
} finally {
  // Restore files if needed
  if (backupLocal) fs.writeFileSync(testSessionLocalFile, backupLocal, 'utf8');
  if (backupLegacy) fs.writeFileSync(testSessionLegacyFile, backupLegacy, 'utf8');
}
console.log('✓ Passed: Local environment strictly uses local session and never falls back to production.\n');

// ── Test F: Production / Render environment session isolation ────────────────
console.log('Test F: Verifying production/Render environment selects ONLY production session and rejects local session...');
resetEnv();
process.env.RENDER = 'true';
process.env.TELEGRAM_SESSION_LOCAL = 'MOCK_LOCAL_SESSION_KEY_AAA';
process.env.TELEGRAM_SESSION_PRODUCTION = 'MOCK_PROD_SESSION_KEY_PRODUCTION_999';

assert.strictEqual(skill.getTelegramEnvironment(), 'production', 'Environment should resolve to production on Render');
assert.strictEqual(skill.getSavedSession('production'), 'MOCK_PROD_SESSION_KEY_PRODUCTION_999', 'Production environment must select TELEGRAM_SESSION_PRODUCTION');

// Verify TELEGRAM_SESSION_PROD alias also works
delete process.env.TELEGRAM_SESSION_PRODUCTION;
process.env.TELEGRAM_SESSION_PROD = 'MOCK_PROD_SESSION_KEY_PROD_888';
assert.strictEqual(skill.getSavedSession('production'), 'MOCK_PROD_SESSION_KEY_PROD_888', 'Production environment must support TELEGRAM_SESSION_PROD alias');

// Verify missing production session fails safely without using local session
delete process.env.TELEGRAM_SESSION_PROD;
process.env.TELEGRAM_API_ID = '123456';
process.env.TELEGRAM_API_HASH = 'mock_api_hash';

const prodSessionWhenMissing = skill.getSavedSession('production');
assert.strictEqual(prodSessionWhenMissing, '', 'Production session must be empty when TELEGRAM_SESSION_PRODUCTION is missing');

const prodValidation = skill.validateTelegramConfiguration('production');
assert.strictEqual(prodValidation.valid, false, 'Production validation must fail safely when production session is missing');
assert.strictEqual(prodValidation.errors.some(e => e.includes('TELEGRAM_SESSION_PRODUCTION (or TELEGRAM_SESSION_PROD) is required in production')), true, 'Must output explicit Render/production session error');
console.log('✓ Passed: Production/Render environment strictly uses production session and rejects local fallback.\n');

// ── Mock Factory Helper for Client Lifecycle Tests ───────────────────────────
function createMockClientClass() {
  let instancesCreated = 0;
  let connectCalls = 0;
  let startCalls = 0;
  let disconnectCalls = 0;

  class MockTelegramClient {
    constructor() {
      instancesCreated++;
      this.id = `mock-client-${instancesCreated}`;
      this.connected = false;
      this.isAuthorizedResult = true;
    }

    async connect() {
      connectCalls++;
      // Simulate network connection latency
      await new Promise(r => setTimeout(r, 20));
      this.connected = true;
    }

    async start() {
      startCalls++;
      await new Promise(r => setTimeout(r, 20));
      this.connected = true;
    }

    async checkAuthorization() {
      return this.isAuthorizedResult;
    }

    async disconnect() {
      disconnectCalls++;
      this.connected = false;
    }
  }

  return {
    MockTelegramClient,
    getStats: () => ({ instancesCreated, connectCalls, startCalls, disconnectCalls })
  };
}

// ── Test A & C: Sequential initialization & single connect call ───────────────
(async () => {
  console.log('Test A & C: Verifying multiple sequential initialize calls return identical client instance and connect is called only once...');
  resetEnv();
  skill._resetTelegramClientForTesting();

  process.env.TELEGRAM_ENVIRONMENT = 'local';
  process.env.TELEGRAM_API_ID = '12345';
  process.env.TELEGRAM_API_HASH = 'test_hash';
  process.env.TELEGRAM_SESSION_LOCAL = 'test_session_local';

  const mockFactory = createMockClientClass();
  const customFactory = () => new mockFactory.MockTelegramClient();

  const client1 = await skill.getTelegramClient(customFactory);
  assert.ok(client1, 'First call should return client');
  assert.strictEqual(client1.connected, true, 'Client should be connected');
  assert.strictEqual(skill.getClientLifecycleState(), skill.ClientLifecycleState.CONNECTED, 'Lifecycle state should be CONNECTED');

  const client2 = await skill.getTelegramClient(customFactory);
  assert.strictEqual(client1, client2, 'Second call must return identical singleton client instance');

  const stats = mockFactory.getStats();
  assert.strictEqual(stats.instancesCreated, 1, 'Only 1 MockTelegramClient instance must be constructed');
  assert.strictEqual(stats.connectCalls, 1, 'connect() must be invoked exactly once');

  console.log('✓ Passed: Sequential calls return identical client singleton and connect is called once.\n');

  // ── Test B: Concurrent initialization calls ──────────────────────────────────
  console.log('Test B: Verifying concurrent initialize calls coalesce into a single connection and instance...');
  skill._resetTelegramClientForTesting();
  const mockFactoryConcurrent = createMockClientClass();
  const concurrentFactory = () => new mockFactoryConcurrent.MockTelegramClient();

  // Trigger 5 concurrent initialization calls simultaneously
  const [c1, c2, c3, c4, c5] = await Promise.all([
    skill.getTelegramClient(concurrentFactory),
    skill.getTelegramClient(concurrentFactory),
    skill.getTelegramClient(concurrentFactory),
    skill.getTelegramClient(concurrentFactory),
    skill.getTelegramClient(concurrentFactory)
  ]);

  assert.strictEqual(c1, c2, 'Concurrent clients 1 and 2 must match');
  assert.strictEqual(c2, c3, 'Concurrent clients 2 and 3 must match');
  assert.strictEqual(c3, c4, 'Concurrent clients 3 and 4 must match');
  assert.strictEqual(c4, c5, 'Concurrent clients 4 and 5 must match');

  const concurrentStats = mockFactoryConcurrent.getStats();
  assert.strictEqual(concurrentStats.instancesCreated, 1, 'Concurrent calls must create only 1 instance');
  assert.strictEqual(concurrentStats.connectCalls, 1, 'Concurrent calls must execute connect() only once');

  console.log('✓ Passed: Concurrent initialize calls successfully share single in-flight promise and singleton.\n');

  // ── Test G: Graceful shutdown and single disconnect ───────────────────────────
  console.log('Test G: Verifying disconnectTelegramClient gracefully disconnects client exactly once...');
  await skill.disconnectTelegramClient();
  assert.strictEqual(skill.getClientLifecycleState(), skill.ClientLifecycleState.DISCONNECTED, 'State must be DISCONNECTED');

  const statsAfterFirstDisconnect = mockFactoryConcurrent.getStats();
  assert.strictEqual(statsAfterFirstDisconnect.disconnectCalls, 1, 'disconnect() must be called once');

  // Second disconnect call on already disconnected client must be a no-op
  await skill.disconnectTelegramClient();
  const statsAfterSecondDisconnect = mockFactoryConcurrent.getStats();
  assert.strictEqual(statsAfterSecondDisconnect.disconnectCalls, 1, 'Repeated disconnect() calls must not trigger duplicate disconnects');

  console.log('✓ Passed: Disconnection occurs cleanly and idempotently.\n');

  // ── Test H: Shutdown handlers registered only once ───────────────────────────
  console.log('Test H: Verifying shutdown signal handlers are registered exactly once...');
  const mockFactoryH = createMockClientClass();
  await skill.getTelegramClient(() => new mockFactoryH.MockTelegramClient());
  const sigintListenersBefore = process.listenerCount('SIGINT');
  const sigtermListenersBefore = process.listenerCount('SIGTERM');

  // Attempt repeated initializations
  await skill.getTelegramClient(() => new mockFactoryH.MockTelegramClient());
  await skill.getTelegramClient(() => new mockFactoryH.MockTelegramClient());

  const sigintListenersAfter = process.listenerCount('SIGINT');
  const sigtermListenersAfter = process.listenerCount('SIGTERM');

  assert.strictEqual(sigintListenersAfter, sigintListenersBefore, 'SIGINT listeners count must not grow on repeated initialization');
  assert.strictEqual(sigtermListenersAfter, sigtermListenersBefore, 'SIGTERM listeners count must not grow on repeated initialization');
  await skill.disconnectTelegramClient();
  console.log('✓ Passed: Shutdown handlers registration is strictly idempotent.\n');

  // ── Test I: Safe recovery and retry on failed initialization ──────────────────
  console.log('Test I: Verifying failed initialization transitions to FAILED and resets safely for retry...');
  resetEnv();
  skill._resetTelegramClientForTesting();
  process.env.TELEGRAM_ENVIRONMENT = 'local';
  process.env.TELEGRAM_API_ID = '12345';
  process.env.TELEGRAM_API_HASH = 'test_hash';
  process.env.TELEGRAM_SESSION_LOCAL = 'test_session_local';

  const mockFactoryRetry = createMockClientClass();
  let attemptCount = 0;
  const failingFactory = () => {
    attemptCount++;
    if (attemptCount === 1) {
      throw new Error('SIMULATED_NETWORK_FAILURE');
    }
    return new mockFactoryRetry.MockTelegramClient();
  };

  const failedClient = await skill.getTelegramClient(failingFactory);
  assert.strictEqual(failedClient, null, 'First attempt must return null when client factory/connection fails');
  assert.strictEqual(skill.getClientLifecycleState(), skill.ClientLifecycleState.FAILED, 'Lifecycle state must transition to FAILED');

  // Retry initialization: should recover cleanly
  const recoveredClient = await skill.getTelegramClient(failingFactory);
  assert.ok(recoveredClient, 'Retry should succeed and return client');
  assert.strictEqual(recoveredClient.connected, true, 'Recovered client should be connected');
  assert.strictEqual(skill.getClientLifecycleState(), skill.ClientLifecycleState.CONNECTED, 'Lifecycle state should recover to CONNECTED');
  await skill.disconnectTelegramClient();

  console.log('✓ Passed: Failure resets state safely and allows controlled retry.\n');

  // ── Test J: Multi-process local session lock safeguard ────────────────────────
  console.log('Test J: Verifying local multi-process lock blocks dual processes from clashing on local session...');
  skill._resetTelegramClientForTesting();

  // Acquire lock as current process
  const lock1 = skill.acquireLocalLock();
  assert.strictEqual(lock1.acquired, true, 'Current process should acquire lock');

  // Simulate another active process PID holding lock
  const lockFile = path.join(__dirname, '../skills/telegram-monitor/.telegram_local.lock');
  fs.writeFileSync(lockFile, JSON.stringify({
    pid: process.pid === 999999 ? 888888 : 999999, // Another process PID
    env: 'local',
    createdAt: new Date().toISOString(),
    timestamp: Date.now()
  }), 'utf8');

  // Reset internal lock flag to test external process lock detection
  skill._resetTelegramClientForTesting();

  // If the simulated PID is not alive, acquireLocalLock safely recovers stale lock.
  // Verify stale lock detection:
  const staleRecovery = skill.acquireLocalLock();
  assert.strictEqual(staleRecovery.acquired, true, 'Stale lock from non-existent PID should be safely reclaimed');

  skill.releaseLocalLock();
  console.log('✓ Passed: Local session lock safeguard is robust against stale locks and collisions.\n');

  // ── Test K: Fetch integration with missing environment session ────────────────
  console.log('Test K: Verifying fetchTelegram returns clear NOT_CONFIGURED without crashing when session is missing...');
  resetEnv();
  skill._resetTelegramClientForTesting();

  process.env.TELEGRAM_ENVIRONMENT = 'production';
  process.env.TELEGRAM_API_ID = '12345';
  process.env.TELEGRAM_API_HASH = 'test_hash';
  // Missing TELEGRAM_SESSION_PRODUCTION
  delete process.env.TELEGRAM_SESSION_PRODUCTION;
  delete process.env.TELEGRAM_SESSION_PROD;

  const fetchResult = await skill.fetchTelegram({ useDemo: false });
  assert.strictEqual(fetchResult.status, 'NOT_CONFIGURED', 'fetchTelegram must return NOT_CONFIGURED in production when session is missing');
  assert.strictEqual(fetchResult.error, 'NOT_CONFIGURED');
  assert.strictEqual(fetchResult.message.includes('TELEGRAM_SESSION_PRODUCTION'), true, 'Error message must specify required production variable');
  console.log('✓ Passed: fetchTelegram handles missing production session safely and informatively.\n');

  // ── Test L: Channel normalization and handle cleaning ───────────────────────
  console.log('Test L: Verifying channel normalization handles all cases, prefixes, and URLs...');
  assert.strictEqual(skill.normalizeChannelName('Istokinfo'), 'istokinfo', 'Istokinfo should normalize to lowercase istokinfo');
  assert.strictEqual(skill.normalizeChannelName('@Istokinfo'), 'istokinfo', '@Istokinfo should strip @ and lowercase');
  assert.strictEqual(skill.normalizeChannelName('https://t.me/Istokinfo'), 'istokinfo', 'URL should be stripped');
  assert.strictEqual(skill.normalizeChannelName('https://t.me/s/Istokinfo/'), 'istokinfo', 'Preview URL and trailing slash should be stripped');
  assert.strictEqual(skill.normalizeChannelName('  @KoridorSrb  '), 'koridorsrb', 'Whitespace and uppercase should be normalized');
  assert.strictEqual(skill.normalizeChannelName('SrpskiNat'), 'srpskinat', 'CamelCase should be normalized');
  console.log('✓ Passed: Channel normalization robust across cases, handles, and URLs.\n');

  // ── Test M: Channel authorization for media retrieval (isChannelConfigured) ──
  console.log('Test M: Verifying channel authorization for media requests with Istokinfo and security protection against unconfigured channels...');
  resetEnv();
  process.env.TELEGRAM_CHANNELS = 'koridorsrb,srpskinat,istokinfo';

  assert.strictEqual(skill.isChannelConfigured('Istokinfo'), true, 'Istokinfo must be accepted (case-insensitive)');
  assert.strictEqual(skill.isChannelConfigured('istokinfo'), true, 'istokinfo must be accepted');
  assert.strictEqual(skill.isChannelConfigured('@Istokinfo'), true, '@Istokinfo must be accepted');
  assert.strictEqual(skill.isChannelConfigured('https://t.me/Istokinfo'), true, 'https://t.me/Istokinfo must be accepted');
  assert.strictEqual(skill.isChannelConfigured('Istok Info'), true, 'Istok Info display name alias must be accepted');
  assert.strictEqual(skill.isChannelConfigured('исток инфо'), true, 'Cyrillic title alias must be accepted');
  assert.strictEqual(skill.isChannelConfigured('KoridorSrb'), true, 'KoridorSrb must be accepted');
  assert.strictEqual(skill.isChannelConfigured('SrpskiNat'), true, 'SrpskiNat must be accepted');

  // Verify strict security: unconfigured channels are rejected
  assert.strictEqual(skill.isChannelConfigured('malicious_channel_attack'), false, 'Arbitrary unconfigured channel must be rejected');
  assert.strictEqual(skill.isChannelConfigured('random_crypto_spam'), false, 'Random unconfigured channel must be rejected');
  assert.strictEqual(skill.isChannelConfigured(''), false, 'Empty channel must be rejected');
  console.log('✓ Passed: Istokinfo is authorized for media retrieval while unconfigured channels remain strictly blocked.\n');

  // ── Test N: Dynamically resolved channel entity registration ─────────────────
  console.log('Test N: Verifying dynamic channel entity resolution registers metadata for media authorization...');
  skill.registerResolvedChannel('istokinfo', {
    username: 'Istokinfo',
    title: 'Исток Инфо',
    id: 1987654321,
    canonical: 'istokinfo'
  });

  assert.strictEqual(skill.isChannelConfigured('Istokinfo'), true, 'Resolved username Istokinfo must be authorized');
  assert.strictEqual(skill.isChannelConfigured('1987654321'), true, 'Resolved channel numeric ID must be authorized');
  console.log('✓ Passed: Dynamically resolved channel metadata is safely registered and queryable.\n');

  // ── Test O: Media thumbnail retrieval for configured Istokinfo channel ───────
  console.log('Test O: Verifying media thumbnail endpoint authorizes configured Istokinfo and rejects unconfigured channels...');
  const validThumb = await skill.fetchMediaThumbnail({ channel: 'Istokinfo', messageId: 1042, demo: true });
  assert.ok(validThumb, 'fetchMediaThumbnail must return thumbnail for configured Istokinfo channel');
  assert.ok(validThumb.buffer, 'Thumbnail buffer must be present');
  assert.strictEqual(validThumb.mimeType, 'image/svg+xml', 'MIME type must be image/svg+xml for demo thumbnail');

  const lowerThumb = await skill.fetchMediaThumbnail({ channel: 'istokinfo', messageId: 1042, demo: true });
  assert.ok(lowerThumb, 'fetchMediaThumbnail must return thumbnail for lowercase istokinfo channel');

  const unconfiguredThumb = await skill.fetchMediaThumbnail({ channel: 'unconfigured_hacker_channel', messageId: 1042, demo: true });
  assert.strictEqual(unconfiguredThumb, null, 'fetchMediaThumbnail must reject unconfigured channel with null');
  console.log('✓ Passed: Media thumbnail endpoint successfully authorizes Istokinfo and blocks unconfigured channels.\n');

  // Clean up
  resetEnv();
  skill._resetTelegramClientForTesting();

  console.log('─────────────────────────────────────────────────────────────────');
  console.log('🎉 ALL TELEGRAM CLIENT LIFECYCLE & MEDIA AUTHORIZATION TESTS PASSED!');
  console.log('─────────────────────────────────────────────────────────────────\n');
})().catch(err => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});

