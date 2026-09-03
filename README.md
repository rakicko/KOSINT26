# 🛰️ SENTINEL — Situational Awareness & Operational Monitoring Platform

> Real-time multi-source tactical and situational awareness platform for Kosovo & the Western Balkans. Aggregates regional dual-language news, border crossing delays, wildfires, airspace surveillance, public Telegram monitors, weather, seismic events, and radiological telemetry into a unified command dashboard with push alerts and an interactive vector map.

![SENTINEL Platform](https://img.shields.io/badge/stack-Node.js%20%2B%20Express%20%2B%20SQLite%20%2B%20MapLibre-38bdf8?style=flat-square)
![Security](https://img.shields.io/badge/security-Helmet%20CSP%20%7C%20RBAC%20%7C%20scrypt-10b981?style=flat-square)
![Audit Status](https://img.shields.io/badge/OSCE%20Audit-Remediated%20P0%2FP1-34d399?style=flat-square)

---

## Operational Capabilities

| Intelligence Module | Data Source | Security / Operational Profile |
|:---|:---|:---|
| 📰 **News Intelligence** | 10 Regional Portals (Albanian & Serbian) | Regex incident scoring, cross-source entity clustering, dual-language analysis |
| 🛂 **Border Monitor** | QKMK / MPB Official Portal + Nakordoni API | Live vehicle and cargo queue lengths, wait times, crossing status |
| 🔥 **Wildfire Monitor** | NASA FIRMS (MODIS/VIIRS) + NASA EONET v3 | Real-time thermal anomaly detection, regional distance calculation |
| ✈️ **Airspace Activity** | OpenSky Network & ADSB.fi ADS-B | Military, surveillance, VIP, and commercial flight classification |
| 📱 **Telegram Intel** | Public Channel Reader / Bot API | Read-only open channels (`@koridorsrb`, `@srpskinat`, `@istokinfo`), zero user credential storage |
| 🚦 **Traffic Intel** | Inferred from multi-source road reports | Corridor blockades, police checkpoints, transit anomalies |
| 🌤 **Weather Monitor** | Open-Meteo & DWD Heuristics | Severe storm alerts, extreme wind warnings, tactical conditions |
| ☢️ **Radiation Telemetry** | Radmon.org Regional Observation | Gamma dose rate (µSv/h), baseline deviation alerts |
| 🌍 **Air Quality Index** | Copernicus CAMS & Open-Meteo AQ | European AQI, PM2.5/PM10 particulate monitoring |
| 🌊 **Seismic Monitor** | USGS Earthquake FDSN | Balkan regional seismic events, depth & epicenter tracking |
| 🗺️ **Vector Map Engine** | MapLibre GL JS + Carto Dark Matter | Hardware-accelerated GPU map rendering, live tactical incident pins |
| 🎯 **Composite Threat** | Multi-Domain 10-Source Scoring (0–100) | Weighted threat matrix with sensor health and telemetry confidence rating |

---

## Security Architecture

* **Authentication & Session Management:** Server-side session tokens stored in SQLite, issued via secure HttpOnly, SameSite cookies.
* **Role-Based Access Control (RBAC):** Strict operational segregation (`operator` vs `administrator`).
* **Cryptographic Standards:** Passwords hashed with `scrypt` using 32-byte cryptographically random salt and timing-safe comparison.
* **CSRF Defense:** Session-bound cryptographic tokens required for all state-mutating requests (`POST`, `PUT`, `DELETE`).
* **Defense-in-Depth:** Content Security Policy (CSP), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, strict Referrer-Policy, and restricted CORS.
* **DoS Protection:** Multi-tier rate limiting on authentication and API endpoints; single-flight request coalescing.
* **Decoupled Ingestion:** Background intelligence worker decouples external scraping from client HTTP requests.
* **Authoritative Geocoding:** Offline static coordinate registry for Kosovo municipalities and border points, eliminating external API dependencies.
* **ACID Persistence:** Embedded SQLite with Write-Ahead Logging (WAL mode), parameterized queries, and atomic transactions.

---

## Quick Start

### 1. Installation
```bash
git clone https://github.com/rakicko/KOSINT26.git
cd KOSINT26
npm install
```

### 2. Configuration
Copy the example configuration file:
```bash
cp .env.example .env
```
*(Optional: add `FIRMS_MAP_KEY`, `NAKORDONI_API_KEY`, or `TELEGRAM_BOT_TOKEN` for live third-party feeds. Rich simulation fixtures are provided automatically if keys are omitted).*

### 3. Provision Initial Administrator
Create your initial administrator account securely via CLI:
```bash
npm run user:create -- --username osce_admin --password "YourStrongPassword2026!" --role administrator
```

To list registered accounts:
```bash
node server/cli/create-user.js --list
```

### 4. Launch System
```bash
npm start
```
Open your browser at `http://localhost:3000` and sign in with your provisioned callsign and passphrase.

---

## Automated Verification & Test Suite

Run the full automated verification suite:
```bash
npm test
```

The test runner executes 6 deterministic suites covering:
1. **Authentication & RBAC:** Password hashing, timing attacks, session lifecycle, brute-force lockout, role restrictions, and CSRF defense.
2. **XSS & Sanitization:** Tag neutralisation, single/double quote attribute breakout, backtick template literals, and safe URL protocol validation.
3. **SQLite Persistence & Concurrency:** Concurrent multi-thread writes, interleaved reads/writes, malformed input resilience, and transaction rollback.
4. **Threat Scoring Engine:** Domain contributions, border and wildfire weighting, sensor degradation guardrails, and telemetry confidence calculations.
5. **E2E API Security:** Unauthenticated 401 rejection, login/cookie lifecycle, CSRF enforcement, RBAC privilege checks, Helmet CSP headers, and CORS rejection.
6. **Wildfire Regression:** NASA FIRMS CSV parsing, small FRP detection preservation, and hierarchical fallback logic.

---

## API Reference

All `/api/*` and `/events` endpoints require an active authenticated session. Mutating requests require an `X-CSRF-Token` header.

| Method | Endpoint | Access Level | Description |
|:---|:---|:---|:---|
| `POST` | `/api/auth/login` | Public (Rate-Limited) | Authenticates credentials, establishes HttpOnly session cookie |
| `POST` | `/api/auth/logout` | Authenticated | Destroys session in database and clears session cookie |
| `GET` | `/api/auth/me` | Public | Returns current authenticated user and CSRF token |
| `GET` | `/api/auth/users` | Administrator | Lists all registered accounts (usernames, roles, creation dates) |
| `POST` | `/api/auth/users` | Administrator | Provisions a new user account |
| `POST` | `/api/status` | Operator / Admin | Ingests/retrieves composite intelligence status for location |
| `GET` | `/api/alerts` | Operator / Admin | Retrieves alert log history and unread count |
| `POST` | `/api/alerts/read` | Operator / Admin | Marks alert notifications as read |
| `GET` | `/api/preferences` | Operator / Admin | Retrieves system operational preferences |
| `POST` | `/api/preferences` | Administrator | Updates system operational preferences |
| `GET` | `/events` | Operator / Admin | Server-Sent Events (SSE) real-time alert feed |
| `GET` | `/api/weather` | Operator / Admin | Meteorological observations and severe weather alerts |
| `GET` | `/api/wildfire` | Operator / Admin | Thermal anomaly and wildfire satellite detections |
| `GET` | `/api/aviation` | Operator / Admin | ADS-B airspace tracking and military aircraft classification |
| `GET` | `/api/telegram` | Operator / Admin | Public Telegram channel intelligence posts |
| `GET` | `/api/borders` | Operator / Admin | Kosovo border crossing waiting times and queue lengths |
| `GET` | `/api/locations` | Operator / Admin | Monitored location history |
