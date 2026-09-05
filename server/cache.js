'use strict';

/**
 * Lightweight, zero-dependency in-memory TTL cache.
 * Uses a plain Map - memory overhead negligible (< 1 MB for all slots).
 *
 * TTLs used across the app:
 *   Aviation   20 s  (CACHE_TTL.AVIATION)
 *   Telegram   60 s  (CACHE_TTL.TELEGRAM)
 *   CCTV       60 s  (CACHE_TTL.CCTV)
 *   Wildfire   15 m  (CACHE_TTL.WILDFIRE)
 *   Borders    60 s  (CACHE_TTL.BORDERS)
 */

const CACHE_TTL = {
  AVIATION: 20 * 1000,
  TELEGRAM:  60 * 1000,
  CCTV:      60 * 1000,
  WILDFIRE:  15 * 60 * 1000,
  BORDERS:   60 * 1000,
};

/** @type {Map<string, { data: any, expiresAt: number }>} */
const store = new Map();

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { store.delete(key); return null; }
  return entry.data;
}

function set(key, data, ttlMs) {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

function invalidate(key) { store.delete(key); }

function stats() {
  const now = Date.now();
  const entries = [];
  for (const [key, entry] of store.entries()) {
    entries.push({ key, ttlRemaining: Math.max(0, Math.round((entry.expiresAt - now) / 1000)), expired: now > entry.expiresAt });
  }
  return { size: store.size, entries };
}

module.exports = { get, set, invalidate, stats, CACHE_TTL };
