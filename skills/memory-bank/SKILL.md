---
name: memory-bank
description: |
  Embedded SQLite persistent storage for alerts, locations, preferences, sessions, and cache.
  Supports ACID transactions, WAL mode, and parameterized queries.
---

# Memory Bank Skill

## Database Engine
Backed by embedded SQLite (`server/data/sentinel.db`) with Write-Ahead Logging (WAL mode) and synchronous durability.

## Database Tables
- `users`: User callsigns, scrypt password hashes, 32-byte salts, and RBAC roles.
- `sessions`: Active authenticated session tokens, CSRF tokens, and TTL expirations.
- `locations`: Tracked monitoring hubs (e.g. Mitrovica, Prishtina, Peja).
- `alerts`: Ingested multi-domain incident alerts with severity, source, coordinates, and read status.
- `preferences`: System operational thresholds and configuration.
- `cache`: Intelligence orchestrator cache payloads.

## API
- `get(key)` → returns records at key (`alerts`, `locations`, `preferences`)
- `set(key, value)` → updates configuration
- `addLocation(locationObj)` → upserts location with timestamp and count
- `addAlerts(alertsArray)` → inserts newly triggered alerts into database
- `markAlertsRead()` → marks all active alerts as read
- `getUnreadCount()` → returns count of unread alerts
- `setCache(data)` → caches orchestrator intelligence payload
- `getCache(maxAgeMs)` → retrieves valid cached data
- `clearCache()` → invalidates cached intelligence

## Usage
```bash
node skills/memory-bank/skill.js
```
