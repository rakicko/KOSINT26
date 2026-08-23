# 📱 Telegram Monitor Skill

A lightweight, read-only situational feed skill for SENTINEL that monitors recent posts from explicitly configured public Telegram channels using Telegram's official MTProto API and Telegram Bot API.

## Features
- **Official API Access**: Uses MTProto client (`telegram` / GramJS) and Telegram Bot API protocols without browser/HTML scraping.
- **Strict Environment Isolation**: Prevents `406: AUTH_KEY_DUPLICATED` by strictly isolating sessions between local development (`TELEGRAM_SESSION_LOCAL`) and Render production (`TELEGRAM_SESSION_PRODUCTION`).
- **Singleton Lifecycle & Concurrency Protection**: Manages connection state (`IDLE`, `CONNECTING`, `CONNECTED`, `DISCONNECTING`, `DISCONNECTED`, `FAILED`), coalescing concurrent calls into a single initialization promise.
- **Multi-Process Local Locking**: Prevents dual local instances (e.g. Antigravity IDE and `nodemon`) from clashing on the same local MTProto session.
- **Graceful Shutdown**: Automatically closes MTProto client connections on `SIGINT`, `SIGTERM`, and process exit.

## Environment Variables

| Variable | Type | Description | Default |
|---|---|---|---|
| `TELEGRAM_ENVIRONMENT` | String | Environment mode: `'local'` or `'production'` (auto-detected on Render) | `'local'` |
| `TELEGRAM_API_ID` | Integer | Telegram API Application ID from [my.telegram.org](https://my.telegram.org) | - |
| `TELEGRAM_API_HASH` | String | Telegram API Application Hash from [my.telegram.org](https://my.telegram.org) | - |
| `TELEGRAM_SESSION_LOCAL` | String | MTProto StringSession exclusively for local development | `""` |
| `TELEGRAM_SESSION_PRODUCTION` | String | MTProto StringSession exclusively for Render / production | `""` |
| `TELEGRAM_BOT_TOKEN` | String | Optional Bot Token for Telegram Bot API fallback | - |
| `TELEGRAM_CHANNELS` | String | Comma-separated list of public channel usernames | `koridorsrb,srpskinat,istokinfo` |
| `TELEGRAM_LIMIT_PER_CHANNEL` | Integer | Recent post window per channel | `10` |
| `TELEGRAM_CACHE_TTL_MS` | Integer | In-memory cache time-to-live in ms | `60000` |

> [!IMPORTANT]
> **Never share the same `StringSession` across local development and Render.**
> Telegram MTProto invalidates duplicate sessions active on different IP addresses (`406: AUTH_KEY_DUPLICATED`). Always keep separate local and production sessions.

## Authentication & Setup

### 1. Local Development Authentication
Generates and saves `TELEGRAM_SESSION_LOCAL` in your local `.env` and `.telegram_session_local`:
```bash
node skills/telegram-monitor/skill.js --auth
```

### 2. Production Session Generation (for Render)
Generates and saves `TELEGRAM_SESSION_PRODUCTION`:
```bash
node skills/telegram-monitor/skill.js --auth --prod
```
Then copy the resulting `TELEGRAM_SESSION_PRODUCTION` (or `TELEGRAM_SESSION_PROD`) into your Render Service Environment Variables dashboard.

### 3. Verification & Standalone Run
Test live MTProto connection without re-authenticating:
```bash
node skills/telegram-monitor/skill.js
```

Test simulated demo payload (offline mock verification):
```bash
node skills/telegram-monitor/skill.js --test
```
