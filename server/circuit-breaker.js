'use strict';

/**
 * Lightweight in-memory Circuit Breaker for Upstream External APIs (Open-Meteo, NASA FIRMS, USGS)
 *
 * States:
 * - CLOSED: Normal operations, tracking failures
 * - OPEN: Service failing, fast-fails immediately or executes fallback without network request
 * - HALF_OPEN: Probe request allowed after cooldown window
 */

class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name || 'default';
    this.failureThreshold = options.failureThreshold || 3;
    this.cooldownMs = options.cooldownMs || 60000; // 60 seconds
    this.state = 'CLOSED'; // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
    this.consecutiveFailures = 0;
    this.lastFailureTime = null;
    this.nextAttempt = Date.now();
    this.stats = {
      successes: 0,
      failures: 0,
      trippedCount: 0,
      fallbackCalls: 0
    };
  }

  isOpen() {
    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextAttempt) {
        this.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess() {
    this.consecutiveFailures = 0;
    this.state = 'CLOSED';
    this.stats.successes++;
  }

  recordFailure(err) {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();
    this.stats.failures++;

    if (this.consecutiveFailures >= this.failureThreshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.cooldownMs;
      this.stats.trippedCount++;
      console.warn(`[circuit-breaker:${this.name}] Breaker TRIPPED to OPEN. Consecutive failures: ${this.consecutiveFailures}. Cooldown for ${this.cooldownMs / 1000}s until ${new Date(this.nextAttempt).toISOString()}. Error: ${err?.message || err}`);
    }
  }

  /**
   * Execute an async action protected by this circuit breaker.
   * If OPEN, immediately invokes fallbackFn (if provided) or throws.
   */
  async execute(actionFn, fallbackFn = null) {
    if (this.isOpen()) {
      this.stats.fallbackCalls++;
      if (typeof fallbackFn === 'function') {
        return await fallbackFn(new Error(`Circuit breaker '${this.name}' is OPEN`));
      }
      throw new Error(`Circuit breaker '${this.name}' is OPEN (cooldown active until ${new Date(this.nextAttempt).toISOString()})`);
    }

    try {
      const result = await actionFn();
      this.recordSuccess();
      return result;
    } catch (err) {
      // Check if error is 5xx, 429, or network error
      const status = err?.response?.status || err?.status;
      const is5xx = status >= 500 && status < 600;
      const is429 = status === 429;
      const isNetwork = err?.code === 'ECONNABORTED' || err?.code === 'ENOTFOUND' || err?.name === 'AbortError' || err?.code === 'ETIMEDOUT';

      if (is5xx || is429 || isNetwork || !status) {
        this.recordFailure(err);
      }

      if (typeof fallbackFn === 'function') {
        this.stats.fallbackCalls++;
        return await fallbackFn(err);
      }
      throw err;
    }
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      nextAttempt: this.state === 'OPEN' ? new Date(this.nextAttempt).toISOString() : null,
      stats: { ...this.stats }
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.lastFailureTime = null;
    this.nextAttempt = Date.now();
  }
}

// Global registry of breakers for external APIs
const breakers = new Map();

function getCircuitBreaker(name, options = {}) {
  if (!breakers.has(name)) {
    breakers.set(name, new CircuitBreaker(name, options));
  }
  return breakers.get(name);
}

function getAllBreakerStatuses() {
  const result = {};
  for (const [name, breaker] of breakers.entries()) {
    result[name] = breaker.getStatus();
  }
  return result;
}

module.exports = {
  CircuitBreaker,
  getCircuitBreaker,
  getAllBreakerStatuses
};
