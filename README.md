# 🛰️ KOSINT26 — SENTINEL Situational Awareness Dashboard

> Real-time tactical operational awareness: multilingual news intelligence, severe weather, traffic incidents, border crossings, radiation, air quality, wildfire hotspots, seismic activity, ADS-B military/civil aviation, and staff warden tracking — with high-performance MapLibre GL 3D WebGL visualization, SSE live alerts, and hardened SQLite storage.

![KOSINT26 Dashboard](https://img.shields.io/badge/stack-Node.js%2020%2B%20%7C%20Express%20%7C%20MapLibre%20GL-38bdf8?style=flat-square)
![Database](https://img.shields.io/badge/database-SQLite%20(WAL%20Mode)-003B57?style=flat-square&logo=sqlite)
![License](https://img.shields.io/badge/license-MIT-34d399?style=flat-square)
![Tests](https://img.shields.io/badge/tests-50%2F50%20passing%20(100%25)-brightgreen?style=flat-square)

---

## 🎯 Architecture & Data Feeds

| Module | Engine / Source | Capabilities |
|---|---|---|
| 📰 **News Intelligence** | Multilingual NLP RSS Ontology (Albanian, Serbian, International) | Real-time cross-lingual clustering, dynamic threat scoring, TF-IDF location extraction, and flash 3-bullet SitRep synthesis. |
| 🗺️ **Tactical Map** | MapLibre GL JS (WebGL 3D) + OSM Carto & Satellite | Tactical MSR routes, KFOR base perimeters, minefield polygons, border checkpoints, and 3D aviation pitch/bearing rendering. |
| 🚦 **Border Crossings** | QKMK / Nakordoni Official Feeds | 13 Kosovo border checkpoints with entry/exit car & truck waiting times and queue lengths. |
| 🌤 **Weather & Hazards** | Open-Meteo & MET Norway | Severe weather tracking, temperature, wind gusts, and proactive 429 backoff cache. |
| ✈️ **ADS-B Aviation** | OpenSky Network / ADS-B Exchange | Live aircraft telemetry over the Balkans with military/KFOR/rotary classification and 3D altitude vectors. |
| 🔥 **Thermal Hotspots** | NASA FIRMS (VIIRS/MODIS) | Active thermal anomaly detections with tactical threat buffers. |
| 🌊 **Seismic Monitor** | USGS FDSN Earthquake API | Real-time regional seismic event telemetry with epicentral distance and magnitude rings. |
| ☢️ **Radiation Monitor** | Radmon.org & EURDEP | Environmental gamma radiation monitoring from regional sensor stations. |
| 🌍 **Air Quality Index** | Open-Meteo Air Quality | European Air Quality Index (AQI) with PM2.5 and PM10 breakdown. |
| 🛡️ **Staff Warden** | Mitrovica Ward No. 10 Evacuation Roster | Authenticated tactical personnel tracking, emergency communications, and rally routing. |
| 💾 **Persistence Engine** | SQLite 3 (`sentinel.db`) with WAL Mode | Zero-latency atomic transactions, prepared statements, and automated 48h TTL cleanup. |

---

## 🚀 Quick Start (Local)

```bash
# 1. Clone repository
git clone https://github.com/rakicko/KOSINT26.git
cd KOSINT26

# 2. Install dependencies (Node.js 20+ recommended)
npm install

# 3. Configure environment
cp .env.example .env

# 4. Start dashboard
npm start

# Open http://localhost:3000 in your browser
```

---

## 🐳 Docker Deployment

The repository includes an optimized multi-stage `Dockerfile` and `docker-compose.yml` with healthchecks and persistent volume storage.

### Using Docker Compose:

```bash
# Build and run container in background
docker compose up -d

# Check healthcheck status
docker compose ps

# View live application logs
docker compose logs -f sentinel-app
```

### Using Docker CLI:

```bash
docker build -t kosint26-sentinel .
docker run -d -p 3000:3000 -v $(pwd)/server/data:/app/server/data --name sentinel-app kosint26-sentinel
```

---

## 🩺 Healthchecks & Observability

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/healthz` | **Liveness probe**: Returns `{ status: "ok", uptime, timestamp }`. |
| `GET` | `/ready` | **Readiness probe**: Performs active SQLite connection test (`SELECT 1`). Returns `200 OK` or `503 Service Unavailable`. |
| `GET` | `/api/breakers` | Real-time upstream circuit breaker statuses and failure telemetry (Requires auth). |
| `GET` | `/api/cache/stats` | Cache hit/miss rates and memory utilization (Requires auth). |

---

## 🔒 Security & Performance Features

- **HTTP Compression & Headers**: Enabled `compression` (Gzip/Brotli) and `helmet` security headers (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`).
- **Graceful Shutdown**: Intercepts `SIGTERM` and `SIGINT`, flushes and closes active SSE streams, safely closes the HTTP server, and cleanly terminates SQLite WAL connections.
- **Circuit Breaker**: Upstream external APIs (Open-Meteo, NASA FIRMS, USGS) are guarded against cascading 5xx and 429 rate limit failures with automatic 60-second cooldown fast-fails.
- **Strict CORS & CSRF**: Unauthorized cross-origin mutating requests (`POST`, `PUT`, `DELETE`, `PATCH`) are rejected with `403 Forbidden`.
- **DOM XSS Defense**: All dynamic HTML injections are strictly escaped using hardened entity replacement (`&`, `<`, `>`, `"`, `'`, `` ` ``).

---

## 🧪 Forensic Test Suite

Run the full suite of **50 automated test suites** across unit, adversarial, clustering, and E2E verifications:

```bash
npm test
```

All 50 test suites execute sequentially in isolated child processes with duration metrics and exit status verification.

---

## 📄 License

MIT License. Developed for open-source situational awareness and regional operational resilience.
