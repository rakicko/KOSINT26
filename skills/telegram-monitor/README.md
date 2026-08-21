# 📱 Telegram Monitor Skill

A lightweight, read-only situational feed skill for SENTINEL that monitors recent posts from explicitly configured public Telegram channels using Telegram's official API.

## Features
- **Official API Access**: Uses MTProto client (GramJS) and Telegram Bot API protocols without browser/HTML scraping.
- **Configured Public Sources**: Tracks specific public channels (default: `@koridorsrb`, `@srpskinat`, `@istokinfo`).
- **Normalized Data Structure**: Output includes status, channel username, channel title, message ID, timestamp, text, original message URL, and safe media metadata.
- **Non-Invasive**: Read-only display; does not affect composite threat scoring, does not plot map pins, and does not alter other feeds.

## Environment Variables

| Variable | Type | Description | Default |
|---|---|---|---|
| `TELEGRAM_API_ID` | Integer | Telegram API Application ID from [my.telegram.org](https://my.telegram.org) | - |
| `TELEGRAM_API_HASH` | String | Telegram API Application Hash from [my.telegram.org](https://my.telegram.org) | - |
| `TELEGRAM_SESSION` | String | Optional pre-authenticated MTProto StringSession | `""` |
| `TELEGRAM_BOT_TOKEN` | String | Optional Bot Token for Telegram Bot API fallback | - |
| `TELEGRAM_CHANNELS` | String | Comma-separated list of public channel usernames | `koridorsrb,srpskinat,istokinfo` |
| `TELEGRAM_LIMIT_PER_CHANNEL` | Integer | Recent post window per channel | `10` |
| `TELEGRAM_CACHE_TTL_MS` | Integer | In-memory cache time-to-live in ms | `60000` |

## Standalone Testing & Authentication

One-time interactive login (creates and persists `TELEGRAM_SESSION`):
```bash
node skills/telegram-monitor/skill.js --auth
```

Normal run (uses saved session without re-prompting):
```bash
node skills/telegram-monitor/skill.js
```

Test with simulated posts (verifies payload format):
```bash
node skills/telegram-monitor/skill.js --test
```
