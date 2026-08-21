# 🛰️ SENTINEL — Situational Awareness Dashboard

> Real-time multi-feed situational awareness: news, weather, traffic, radiation, air quality, and earthquakes for any location — with push alerts and an interactive map.

![SENTINEL Dashboard](https://img.shields.io/badge/stack-Node.js%20%2B%20Express%20%2B%20Vanilla%20JS-38bdf8?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-34d399?style=flat-square)

## Features

| Panel | Data Source | API Key? |
|-------|-------------|----------|
| 📰 News Intelligence | GNews API — intensity-scored, categorized | Optional (free tier) |
| 🌤 Weather Monitor | Open-Meteo — with severe weather alerts | ❌ Not needed |
| 🚦 Traffic Intelligence | News RSS — traffic keywords detection | ❌ Not needed |
| ☢️ Radiation Monitor | Radmon.org — neighboring region table | ❌ Not needed |
| 🌍 Air Quality Index | Open-Meteo Air Quality — European AQI | ❌ Not needed |
| 🌊 Seismic Monitor | USGS Earthquake — magnitude + distance | ❌ Not needed |
| 🗺️ Interactive Map | Leaflet.js + OpenStreetMap — incident pins | ❌ Not needed |
| 🎯 Threat Level | Composite score across all 6 feeds | — |
| 🔍 Custom Keywords | Add personal tracking terms | — |
| 📤 Export Report | Download situation report as text | — |
| 🔔 Push Alerts | SSE real-time + browser notifications | — |
| 💾 Memory Bank | JSON persistence — location history, alerts | — |

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/sentinel-dashboard
cd sentinel-dashboard
npm install
cp .env.example .env    # add optional API keys
node server/index.js
# Open http://localhost:3000
```

## API Keys (All Optional)

The dashboard works fully without any keys. Add these to `.env` for live data:

```env
GNEWS_API_KEY=      # https://gnews.io — 100 req/day free
```

## Skills Architecture

Each data feed is a self-contained, reusable skill module:

```
skills/
├── news-intel/          # GNews + intensity scoring
├── weather-monitor/     # Open-Meteo (no key needed)
├── traffic-intel/       # News RSS traffic keyword detection
├── radiation-monitor/   # Radmon.org + neighbour regions
├── aqi-monitor/         # Open-Meteo Air Quality (no key)
├── earthquake-monitor/  # USGS FDSN API (no key needed)
├── wildfire-monitor/    # NASA FIRMS thermal anomaly detection
├── aviation-monitor/    # OpenSky & ADS-B aircraft monitoring
├── telegram-monitor/    # Telegram official API public channel monitor
├── border-monitor/      # QKMK Kosovo border crossing waiting times
├── alert-engine/        # Threshold evaluator → SSE
└── memory-bank/         # JSON persistence layer
```

Test any skill independently:
```bash
node skills/news-intel/skill.js --test --location "Mumbai, India"
node skills/weather-monitor/skill.js --test --location "Delhi"
node skills/earthquake-monitor/skill.js --test --location "Tokyo"
node skills/telegram-monitor/skill.js --test
node skills/border-monitor/skill.js
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/status` | Fetch all core skills for a location |
| `GET` | `/api/alerts` | Alert history |
| `GET` | `/events` | SSE stream for real-time push |
| `GET` | `/api/locations` | Location history |
| `GET` | `/api/wildfire` | Wildfire detections |
| `GET` | `/api/aviation` | Aviation telemetry |
| `GET` | `/api/telegram` | Telegram public channel feed |
| `GET` | `/api/borders` | Kosovo border crossing waiting times |

## Deploying to Render (Free)

1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service → Connect repo
3. Runtime: **Node**, Build: `npm install`, Start: `node server/index.js`
4. Add environment variables from `.env.example`

## License

MIT
