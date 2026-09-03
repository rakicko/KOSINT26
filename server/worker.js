'use strict';

const { orchestrate } = require('./orchestrator');

let workerIntervalId = null;
let workerTimeoutId = null;
let isWorkerRunning = false;
const DEFAULT_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '300000', 10); // 5 minutes

/**
 * Run a background intelligence ingestion cycle
 */
async function runIngestionCycle(onNewAlert = null) {
  if (isWorkerRunning) {
    console.log('[worker] Ingestion cycle already in progress, skipping overlapping tick.');
    return;
  }

  isWorkerRunning = true;
  console.log(`[worker] Starting automated background intelligence cycle at ${new Date().toISOString()}`);

  try {
    const result = await orchestrate({
      location: 'Mitrovica, Kosovo',
      timeline: '24h',
      forceRefresh: true
    });

    console.log(`[worker] Ingestion cycle completed. Threat level: ${result.threatLevel?.level} (${result.threatLevel?.score}/100), Active feeds: ${result.threatLevel?.activeFeeds}/10`);

    if (result.alerts?.hasNewAlerts && Array.isArray(result.alerts.alerts) && typeof onNewAlert === 'function') {
      console.log(`[worker] Broadcasting ${result.alerts.alerts.length} newly discovered alerts.`);
      for (const alert of result.alerts.alerts) {
        onNewAlert({ type: 'alert', ...alert });
      }
    }
  } catch (err) {
    console.error('[worker] Background intelligence cycle error:', err.message);
  } finally {
    isWorkerRunning = false;
  }
}

/**
 * Start the background worker
 */
function startWorker({ onNewAlert = null, intervalMs = DEFAULT_INTERVAL_MS } = {}) {
  if (workerIntervalId || workerTimeoutId) {
    console.log('[worker] Background worker is already active.');
    return;
  }

  console.log(`[worker] Initializing background intelligence scheduler (interval: ${Math.round(intervalMs / 1000)}s)`);

  // Run initial cycle after 5 seconds
  workerTimeoutId = setTimeout(() => {
    workerTimeoutId = null;
    runIngestionCycle(onNewAlert);
  }, 5000);

  workerIntervalId = setInterval(() => {
    runIngestionCycle(onNewAlert);
  }, intervalMs);
}

/**
 * Stop the background worker cleanly
 */
function stopWorker() {
  if (workerTimeoutId) {
    clearTimeout(workerTimeoutId);
    workerTimeoutId = null;
  }
  if (workerIntervalId) {
    clearInterval(workerIntervalId);
    workerIntervalId = null;
    console.log('[worker] Background intelligence scheduler stopped.');
  }
}

module.exports = {
  startWorker,
  stopWorker,
  runIngestionCycle
};

if (require.main === module) {
  console.log('Testing worker single cycle run...');
  runIngestionCycle((alert) => {
    console.log('Alert received:', alert.title);
  }).then(() => console.log('Done test cycle'));
}
