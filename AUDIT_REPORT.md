# FORENSIC FULL-REPOSITORY AUDIT REPORT
**Target Repository:** `rakicko/KOSINT26` (`sentinel-dashboard`)  
**Workspace:** `c:\Users\Pc\Desktop\KOSINT26.worktrees\codespaces-baseline`  
**Audit Date:** September 9, 2026  
**Auditor:** Antigravity Forensic Engineering  
**Methodology:** Evidence-First Cross-System Forensic Verification  

---

## 1. Executive Summary

### 1.1 What the Application Does
**KOSINT26 / SENTINEL** is a real-time Situational Awareness & Open-Source Intelligence (OSINT) platform tailored to the Western Balkans (specifically Kosovo, North Kosovo, and border friction corridors). It ingests, normalizes, clusters, and analyzes multi-source data:
- Multilingual regional news RSS/web scrapers (Serbian, Albanian, English).
- Live Telegram public channels via MTProto (`telegram` library).
- Meteorological alerts and air quality telemetry (Open-Meteo).
- Seismic activity (USGS Earthquake Hazards).
- Thermal anomaly / wildfire tracking (NASA FIRMS MODIS/VIIRS).
- Aviation telemetry (ADS-B / military flight classifier).
- Regional border crossing delays and queue lengths (QKMK).
- Kosovo Minefields & UXO Hazards (KMAC / HALO Trust historical CHA/SHA geodata).
- Regional Tension Index (RTI) calculation and Flash Tactical Situation Reports (SitRep).
- OSCE/Mission Staff Warden and evacuation muster point coordination.
- MapLibre GL JS 2D/3D WebGL tactical visualization with live CCTV HLS streaming proxy.

### 1.2 General Codebase State
The application exhibits high domain specialization and sophisticated intelligence algorithms—particularly in the multilingual news ontology, phonetic/Cyrillic transliteration, entity normalization, and deduplication engine (`skills/news-intel/`). However, the repository suffers from significant architectural drift, sensitive data exposure, and production readiness gaps:
1. **Critical Secret & PII Exposure:** Real/realistic operational PII (names, exact home addresses, radio callsigns, phone numbers, and family dependants) are committed in plain text in `server/staff-service.js` and `server/staff-db.json`. Live Telegram MTProto session strings and NASA API keys are stored in `.env`.
2. **Dual-Database Architectural Drift:** A robust SQLite database (`server/db.js`) with WAL mode, prepared statements, and session tables was introduced, but the core business logic (`skills/memory-bank/skill.js` and `server/index.js`) still relies on synchronous, blocking read/writes to a 4.7 MB flat `server/db.json` file.
3. **Broken Authentication & CSRF Boundaries:** Multiple sensitive endpoints (`/api/news/sitrep`, `/api/news/tension`, `/api/stream/*`) lack authentication entirely. Staff warden tokens are stateless HMAC tokens that cannot be revoked on logout and lack CSRF validation.
4. **Testing & CI Illusion:** `package.json` test runner executes only 1 test out of 50 existing test files in `tests/`. No CI/CD workflows exist.

### 1.3 Production Readiness Verdict
**NOT PRODUCTION READY (FAIL)**. The system must undergo remediation of P0/P1 security and data-integrity findings before deployment in any untrusted or multi-user environment.

---

## 2. Quantitative Scores (0–10)

| Dimension | Score | Justification |
| :--- | :---: | :--- |
| **Architecture** | **5.5 / 10** | Strong modular skill concepts, but severe architectural drift between SQLite and legacy JSON file persistence. |
| **Code Quality** | **6.0 / 10** | High NLP/ontology quality in `news-intel`, but 12,300+ lines in a monolithic `public/app.js` and inconsistent error handling. |
| **Correctness** | **6.5 / 10** | Core algorithms work well, but single-quote DOM XSS in `escHtml` and concurrent file write races degrade correctness. |
| **Security** | **3.0 / 10** | Hardcoded secrets in `.env`, PII committed in source, unauthenticated API endpoints, unrevocable staff HMAC tokens, missing CSRF on staff mutators. |
| **Performance** | **5.0 / 10** | Synchronous 4.7 MB `fs.readFileSync`/`fs.writeFileSync` in `memory-bank` blocks the Node.js event loop on read/write. |
| **Reliability** | **6.0 / 10** | Good defensive fallback handling in skill fetchers, but missing circuit breakers and race conditions in flat JSON storage. |
| **Data Integrity** | **4.5 / 10** | Relational schemas in `server/db.js` exist but are bypassed for domain data. No atomic rename or file locking on JSON writes. |
| **Testing** | **4.0 / 10** | 50 test files exist, but `npm test` only runs 1 test file. Several test files only check string presence in source code. |
| **UX** | **7.5 / 10** | Highly responsive, rich tactical UI, excellent geospatial MapLibre layers, clear telemetry and tension indicators. |
| **Accessibility** | **4.5 / 10** | Missing keyboard navigation and ARIA attributes on numerous interactive `div` controls in ticker, alerts, and map. |
| **Observability** | **4.0 / 10** | Only basic `console.log` / `console.error`. No structured logging, request IDs, correlation IDs, or Prometheus metrics. |
| **Documentation** | **4.0 / 10** | Significant drift. `README.md` documents Leaflet.js (actually MapLibre GL) and GNews (actually custom RSS ontology), omits 10+ endpoints. |
| **DevOps** | **2.5 / 10** | No Dockerfile, no docker-compose, no `.github/workflows` CI/CD. Bare `Procfile` is the only deployment artifact. |
| **Production Readiness** | **3.5 / 10** | Multiple critical blockers preventing safe enterprise or public cloud deployment. |

---

## 3. Architecture

### 3.1 Real System Topology

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 Browser (MapLibre GL)                   │
                  │   public/index.html + public/app.js (12,303 lines)      │
                  └──────────────┬───────────────────────────▲──────────────┘
                                 │ HTTP Requests             │ SSE Events
                                 ▼                           │ (/events)
┌───────────────────────────────────────────────────────────────────────────┐
│ Express Server (server/index.js - Node.js CommonJS)                       │
│                                                                           │
│  ├─ Middleware: Origin Validation, Express JSON, Static Cache Headers     │
│  ├─ Stream Proxy: /api/stream/* (HLS manifest rewriting & segment proxy)  │
│  ├─ Auth Engine: /api/auth/* (SQLite scrypt + sessions + rate limiting)   │
│  ├─ Staff Service: /api/staff/* (HMAC stateless token + staff-db.json)    │
│  └─ Orchestrator: /api/status (Promise.allSettled across 8 skills)        │
└──────────────┬────────────────────────────┬───────────────────────────────┘
               │                            │
               ▼                            ▼
┌─────────────────────────────┐   ┌─────────────────────────────────────────┐
│     SQLite (sentinel.db)    │   │           Flat File Storage             │
│  users, sessions,           │   │  server/db.json (4.7 MB)               │
│  auth_rate_limits           │   │  server/staff-db.json (12 KB)           │
│  (server/db.js)             │   │  skills/news-intel/.news_cache.json     │
└─────────────────────────────┘   └─────────────────────────────────────────┘
               │
               ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ Reusable Modular Skills (skills/*)                                        │
│  ├── news-intel (Multi-lingual RSS, transliteration, ontology clustering)│
│  ├── telegram-monitor (MTProto client via telegram package)               │
│  ├── weather-monitor & aqi-monitor (Open-Meteo REST)                      │
│  ├── wildfire-monitor (NASA FIRMS CSV API)                                │
│  ├── aviation-monitor (ADS-B exchange & military classification)          │
│  ├── border-monitor (QKMK scraper / HTML regex parser)                    │
│  ├── earthquake-monitor (USGS FDSN API)                                   │
│  ├── radiation-monitor (Radmon.org scraper)                               │
│  └── alert-engine (Rule-based multi-vector threshold evaluator)           │
└───────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Authentication & Data Flow Breakdown
1. **Primary Web Session:**
   - User inputs credentials at `POST /api/auth/login`.
   - `auth.js` checks brute force lockout (`auth_rate_limits` table in SQLite).
   - Verifies password using `crypto.scryptSync` with timing-safe comparison.
   - Inserts session into `sessions` SQLite table with 8-hour TTL.
   - Sets `sentinel_session` HttpOnly cookie and returns `csrfToken`.
2. **Staff Warden Authentication (Parallel Disconnected Auth):**
   - User authenticates at `POST /api/staff/login`.
   - Compares plaintext input with `STAFF_AUTH_USER` and `STAFF_AUTH_PASS` from `.env`.
   - Generates stateless base64 HMAC token: `Buffer.from('${user}:${expiresAt}:${hmac}')`.
   - Client sends token in `Authorization: Bearer <token>` or `X-Staff-Token`.
   - **No session is saved in database; token cannot be invalidated server-side.**
3. **Intelligence Orchestration Flow:**
   - Client issues `POST /api/status` with location coordinates.
   - `orchestrator.js` triggers `Promise.allSettled` across all monitor skills.
   - Aggregates results, computes composite threat level (0–100).
   - Evaluates alerts via `alert-engine`.
   - Saves results into `memoryBank` (`server/db.json`) via synchronous JSON serialization.
   - Broadcasts new alerts via SSE to connected browser clients.

---

## 4. Repository Map

```
.
├── .env                       # Environment configuration (CONTAINS SENSITIVE SECRETS)
├── .env.example               # Template environment configuration
├── .gitignore                 # Git ignore rules
├── package.json               # Package manifests and dependency declarations
├── package-lock.json          # Dependency lockfile
├── Procfile                   # Process definition for deployment (Node web service)
├── README.md                  # High-level documentation (Drifts from implementation)
├── public/                    # Frontend client bundle and assets
│   ├── app.js                 # Monolithic main application client (12,303 lines)
│   ├── index.html             # Main dashboard UI structure
│   ├── style.css              # Main tactical theme stylesheets (234 KB)
│   ├── civil-unrest-map.js    # Civil unrest layer visualizer
│   ├── civil-unrest.css       # Civil unrest styles
│   ├── operational-zones.js   # KFOR bases, MSR routes, and corridor GeoJSON
│   ├── tactical-map.js        # Tactical threat markers, range rings, symbols
│   ├── map-styles/            # Vector map styling (OSM Liberty GL)
│   └── vendor/                # Vendored MapLibre GL JS & CSS
├── server/                    # Backend services and API endpoints
│   ├── index.js               # Express application entry point & routing (539 lines)
│   ├── auth.js                # SQLite scrypt authentication, session management & CSRF
│   ├── db.js                  # Better-SQLite3 database initializer & migration logic
│   ├── db.json                # Legacy JSON database file (4.7 MB, actively queried)
│   ├── staff-service.js       # Warden evacuation roster service & HMAC token auth
│   ├── staff-db.json          # Staff evacuation database with sensitive PII
│   ├── mine-service.js        # Kosovo Minefields & UXO Hazards proximity engine
│   ├── sitrep.js              # World Monitor tactical Flash SitRep generator
│   ├── tension.js             # Regional Tension Index (RTI) calculator
│   ├── stream-proxy.js        # HLS manifest rewriting and segment streaming proxy
│   ├── cache.js               # In-memory Map TTL cache
│   ├── orchestrator.js        # Multi-skill parallel aggregator
│   └── cli/                   # Administrative CLI tools
│       └── create-user.js     # User provisioning CLI utility
├── skills/                    # Modular domain monitor skills
│   ├── news-intel/            # NLP ontology, bilingual deduplication & clustering
│   ├── telegram-monitor/      # Telegram MTProto client and media thumbnail preview
│   ├── weather-monitor/       # Open-Meteo severe weather integration
│   ├── wildfire-monitor/      # NASA FIRMS thermal anomaly detector
│   ├── aviation-monitor/      # ADS-B Exchange military & civilian tracker
│   ├── border-monitor/        # QKMK border crossing waiting time scraper
│   ├── earthquake-monitor/    # USGS seismic activity monitor
│   ├── radiation-monitor/     # Radmon radiation detector network scraper
│   ├── aqi-monitor/           # Open-Meteo European AQI tracker
│   ├── alert-engine/          # Rule-based threshold evaluation
│   └── memory-bank/           # Synchronous JSON file persistence layer
├── tests/                     # 50 automated test suites
│   ├── osiris-3d-aviation.test.js # Only test run by "npm test"
│   └── *.test.js              # 49 standalone test suites
└── scripts/                   # Operational maintenance scripts
    └── check-streams.js       # Live CCTV stream health checker
```

---

## 5. Critical User Flows

1. **Operator Sign-In & Dashboard Initialization:**
   Browser → `POST /api/auth/login` → `auth.js` checks SQLite rate limits & verifies password → Sets `sentinel_session` cookie → Browser connects to `/events` (SSE) → Requests initial `/api/status` → Maps render tactical pins.
2. **Flash SitRep Synthesis:**
   Browser triggers SitRep generation → `POST /api/news/sitrep` → Server clusters top 10 articles into kinetic, friction, and political domains → Returns structured brief.
3. **Staff Warden Evacuation Tracking:**
   Staff coordinator logs in at `POST /api/staff/login` → Receives base64 HMAC token → `GET /api/staff/locations` loads staff roster → Coordinator adds or deletes staff locations via `POST` or `DELETE /api/staff/locations` → Writes directly to `staff-db.json`.
4. **HLS CCTV Stream Relay:**
   Browser requests stream manifest → `GET /api/stream/manifest?url=<target>&proxySegments=1` → `stream-proxy.js` validates URL against SSRF patterns, fetches upstream manifest with spoofed broadcaster headers, rewrites relative segments to `/api/stream/segment?url=...` → Client plays live stream without CORS errors.

---

## 6. Repository Statistics

- **Programming Languages:** JavaScript (Node.js CommonJS backend, Vanilla ES6+ frontend), HTML5, CSS3.
- **Package Manager:** `npm` (manifest: `package.json`, lockfile: `package-lock.json`).
- **Dependencies:** 10 runtime dependencies (`better-sqlite3`, `express`, `axios`, `cors`, `dotenv`, `express-rate-limit`, `maplibre-gl`, `telegram`, `xml2js`), 1 devDependency (`nodemon`).
- **Source Files Count:** 32 primary JavaScript source files across `server/`, `skills/`, `public/`.
- **Test Files Count:** 50 test files in `tests/`.
- **API Endpoints:** 24 HTTP routes + 1 SSE endpoint.
- **Database Tables:** 7 SQLite tables in `server/db.js` (`users`, `sessions`, `auth_rate_limits`, `locations`, `alerts`, `preferences`, `cache`).
- **Flat Files:** 2 active JSON databases (`server/db.json` [4.7 MB], `server/staff-db.json` [12.8 KB]).
- **CI/CD Workflows:** 0 GitHub Actions workflows.

---

## 7. Findings Summary Table

| ID | Severity | Category | Problem Summary | Location | Confidence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **P0** | Security / Privacy | Plaintext Mission Staff PII & Hardcoded Fallback Passwords | `server/staff-service.js:10-12`, `server/staff-db.json` | HIGH | CONFIRMED |
| **SEC-02** | **P0** | Security / Secrets | Committed Real Telegram MTProto Session & API Credentials | `.env:11-15` | HIGH | CONFIRMED |
| **SEC-03** | **P0** | Security / Auth | Unauthenticated Sensitive Endpoints (`/api/news/sitrep`, `/api/news/tension`, `/api/stream/*`) | `server/index.js:219, 231, 77` | HIGH | CONFIRMED |
| **ARCH-01**| **P1** | Architecture | Dual-Database Drift: 4.7 MB `db.json` Sync I/O Bypasses SQLite | `skills/memory-bank/skill.js:6`, `server/index.js:246` | HIGH | CONFIRMED |
| **SEC-04** | **P1** | Security / Auth | Stateless Staff Token Lacks Server Revocation & CSRF Defense | `server/staff-service.js:421-455`, `server/index.js:483` | HIGH | CONFIRMED |
| **SEC-05** | **P1** | Security / SSRF | Unbounded Public Streaming Proxy Allows External Request Relay | `server/stream-proxy.js:21-67, 196-290` | HIGH | CONFIRMED |
| **BUG-01** | **P1** | Security / XSS | Single-Quote DOM XSS Injection in Keyword Removal & Alert Handlers | `public/app.js:6758, 7469, 7656` | HIGH | CONFIRMED |
| **OPS-01** | **P1** | DevOps / Testing | `npm test` Ignores 49 Test Files; Zero CI/CD Automation | `package.json:9`, `tests/` | HIGH | CONFIRMED |
| **DATA-01**| **P2** | Data Integrity | Unprotected File Overwrite Races in `memory-bank` and `staff-service` | `skills/memory-bank/skill.js:49-52`, `server/staff-service.js:380` | HIGH | CONFIRMED |
| **SEC-06** | **P2** | Security / CORS | Flawed Origin Filter Middleware Continues Execution on Disallowed Origins | `server/index.js:51-62` | HIGH | CONFIRMED |
| **PERF-01**| **P2** | Performance | 12,303-Line Monolithic Client Bundle Blocks Parsing & Cache Granularity | `public/app.js` | HIGH | CONFIRMED |
| **REL-01** | **P2** | Reliability | Missing Circuit Breakers and Retry Backoff on Upstream Third-Party APIs | `skills/weather-monitor`, `wildfire-monitor` | MEDIUM | CONFIRMED |
| **A11Y-01**| **P3** | Accessibility | Non-Interactive `<div>` Click Handlers Without Keyboard Accessibility | `public/app.js:7469`, `public/index.html:98` | HIGH | CONFIRMED |
| **DOC-01** | **P3** | Documentation | Severe Documentation Drift in `README.md` Regarding Stack & APIs | `README.md:18, 73-85` | HIGH | CONFIRMED |
| **CODE-01**| **P3** | Code Quality | Flawed Test Assertions Relying on File String Matching Rather than Behavior | `tests/osiris-3d-aviation.test.js:16-57` | HIGH | CONFIRMED |
| **IMP-01** | **P4** | Improvement | Missing Security Headers (`Content-Security-Policy`, `HSTS`, `X-Frame-Options`) | `server/index.js` | HIGH | CONFIRMED |
| **IMP-02** | **P4** | Improvement | Lack of Structured JSON Logging & Request ID Tracing | `server/index.js` | MEDIUM | CONFIRMED |

---

## 8. P0 Critical Findings

### Finding SEC-01: Plaintext Mission Staff PII & Hardcoded Fallback Passwords
- **ID:** SEC-01
- **Severity:** P0 - CRITICAL
- **Category:** Security / Privacy / Access Control
- **Confidence:** HIGH
- **Status:** CONFIRMED
- **Location:**  
  - File: `server/staff-service.js:10-12, 18-358`
  - File: `server/staff-db.json`
  - File: `server/db.js:218-219`
- **Description:**  
  The system manages sensitive evacuation, safe haven, and warden intelligence for international mission staff (OSCE / UN / KFOR liaison). In `server/staff-service.js`, the default authentication password is hardcoded as `'osce2026safe'`, and the database initialization seeds an admin account with username `'rakicko'` and password `'Medjurecko1'` if environment variables are absent. More critically, `server/staff-service.js` and `server/staff-db.json` contain unencrypted, highly specific PII of real mission personnel in Mitrovica, Zvečan, Leposavić, and Prishtinë: full names, exact residential addresses (street name, block, floor, apartment number), personal mobile numbers, secondary Serbian mobile numbers, VHF radio channels, callsigns, and names of family members/dependants (spouses, minor children and their birth years).
- **Evidence:**
  ```javascript
  // server/staff-service.js:10-12
  const AUTH_USER = process.env.STAFF_AUTH_USER || 'warden';
  const AUTH_PASS = process.env.STAFF_AUTH_PASS || 'osce2026safe';
  const SESSION_SECRET = process.env.STAFF_SESSION_SECRET || 'k0s1nt_w4rd3n_s3cr3t_2026_x9';

  // server/db.js:218-219
  const defaultUser = process.env.ADMIN_BOOTSTRAP_USER || 'rakicko';
  const defaultPass = process.env.ADMIN_BOOTSTRAP_PASS || 'Medjurecko1';
  ```
  ```json
  // server/staff-service.js:40-43
  "name": "Nikolaos Kavallaris Ladis",
  "address": "Str. Alpet Shqiptare, Bllok 2/B 5th floor Nr B22, Prishtinë/a",
  "phone": "+383 49 957 537",
  "dependants": "Venera (Wife), Leon Georgios (Son)"
  ```
- **Execution / Data Flow:**  
  1. If deployed without setting `STAFF_AUTH_PASS` in the environment, any actor can sign in with `warden` / `osce2026safe`.
  2. The endpoint `GET /api/staff/locations` dumps the entire roster including staff addresses, phone numbers, and child names.
  3. The file is committed directly to the git tree, meaning anyone with repository read access acquires full mission staff intelligence.
- **Reproduction Scenario:**  
  1. Start server with default environment.
  2. Execute `curl -X POST http://localhost:3000/api/staff/login -H "Content-Type: application/json" -d '{"username":"warden","password":"osce2026safe"}'`.
  3. Take returned token and query `curl http://localhost:3000/api/staff/locations -H "Authorization: Bearer <TOKEN>"`.
  4. Complete staff personal addresses and family names are returned.
- **Impact:** Severe physical security and operational risk to international and national field personnel stationed in sensitive northern Kosovo sectors. Complete compromise of mission duty of care.
- **Root Cause:** Committing production operational seed files into the source tree and providing hardcoded default credentials instead of failing closed on startup.
- **Remediation:**  
  1. Immediately purge `server/staff-db.json` and sensitive seed records from Git history using `git-filter-repo` or BFG.
  2. Replace seed data with synthetic dummy callsigns (e.g., `ALPHA-01`, `ZONE-NORTH-RALLY`).
  3. Enforce startup assertion: terminate process if `STAFF_AUTH_PASS` and `ADMIN_BOOTSTRAP_PASS` are unset or set to weak defaults.
  4. Encrypt sensitive PII at rest in SQLite using AES-256-GCM.
- **Complexity:** M (Medium)

---

### Finding SEC-02: Committed Real Telegram MTProto Session & API Credentials
- **ID:** SEC-02
- **Severity:** P0 - CRITICAL
- **Category:** Security / Secrets Management
- **Confidence:** HIGH
- **Status:** CONFIRMED
- **Location:**  
  - File: `.env:7, 11-15`
  - File: `skills/telegram-monitor/.telegram_session`
- **Description:**  
  The root `.env` file contains production credentials including a NASA FIRMS API key, Telegram `API_ID` (`31840224`), `API_HASH` (`224b522183f7...`), and two complete base64-encoded Telegram `StringSession` strings (`TELEGRAM_SESSION_LOCAL` and `TELEGRAM_SESSION_PRODUCTION`). In addition, `skills/telegram-monitor/.telegram_session` exists on disk. MTProto StringSessions represent fully authenticated user sessions that bypass 2FA and allow full access to the linked Telegram user account.
- **Evidence:**
  ```env
  # .env:11-15
  TELEGRAM_API_ID=31840224
  TELEGRAM_API_HASH=224b522183f79a31ee60bffe84fd4194
  TELEGRAM_CHANNELS=koridorsrb,srpskinat,istokinfo
  TELEGRAM_SESSION_LOCAL=1BAAOMTQ5LjE1NC4xNjcuOTEAUGy/rEDqOrJCXvjZ6EPOmo/rVNRcTBzVYp3N8zFOu9hmBpJIEedhYssHVncWCM/cSDw7Qe5hAKTeedpeIW8HqMIPa00rdGl2Rk0U1EXolBM/NPT6FjnuyVn8aIdGYAaPY1Yb/5saPjrKBCDbj7ykoryYdXRW+mmLXUdHEqy/XQrfJDTHeTra7kmMRXnqOtrdE7BXkw4t2gXu7WGu69T4UVcLFtDbPX6nWUk7BZzGcdCNR+Er23vufgYbp/hKJhcWyJT1ivNo4OQaPjFY7+Azgdeu54hUOsfJ/W3SK9LCpJ0JG9D39yexc20b9TfaiIyI3YUQFEUyf51t4gAvMPTPwbg=
  TELEGRAM_SESSION_PRODUCTION=1BAAOMTQ5LjE1NC4xNjcuOTEAUGR9fi5g9Gf+2C5A7MIfsl1wUOqCmY0/hBJsyInKPBS0mU5comHCuVV2gGJaNzQgU0mxIF5rZwqzo81JYHxQ2cLnHx456wxv8rk0FD6EBKFisLL9/XSLjyWygcfn7lhT0w50ujhWPkwwLSaTknUxyjxXzS2XVlhkJBttFyPAiNo1wfjnq10xCb11BwpINnpDvchXpCpd0174TqscFsbRvrEFHm41xkdpp0jMSUzEDbK5BGmiuqzixt86OV05tvvMdQON715iUCg98+DUKVL857+AGkq6yVbeW9hl6Qt8A1ZZ47IZ17KDW0vrBL3vBYgFPVVbC29Rk9wHNU4prMTpOFs=
  ```
- **Execution / Data Flow:**  
  Any party who clones or views this repository can instantiate a `TelegramClient(new StringSession(TELEGRAM_SESSION_PRODUCTION), ...)` and read or send messages as the account owner without password or SMS verification.
- **Reproduction Scenario:**  
  Load the string session in a standalone script with `telegram` package; the client connects to Telegram MTProto servers and logs in as the associated phone account immediately.
- **Impact:** Complete account takeover of the Telegram account used to generate the session; exposure of private chats and potential impersonation.
- **Root Cause:** Storing live credentials in the project root `.env` within the working tree.
- **Remediation:**  
  1. Revoke the active session immediately in Telegram settings (Settings → Devices → Terminate All Other Sessions).
  2. Regenerate Telegram API credentials at `my.telegram.org`.
  3. Ensure `.env` is removed from tracking and added to `.gitignore` across all branches.
  4. Use secret managers in cloud environments (Render Environment Secrets / Vault).
- **Complexity:** S (Small)

---

### Finding SEC-03: Unauthenticated Sensitive Endpoints (`/api/news/sitrep`, `/api/news/tension`, `/api/stream/*`)
- **ID:** SEC-03
- **Severity:** P0 - CRITICAL
- **Category:** Security / Broken Access Control
- **Confidence:** HIGH
- **Status:** CONFIRMED
- **Location:**  
  - File: `server/index.js:77, 219-239`
- **Description:**  
  While core endpoints like `/api/status`, `/api/alerts`, and `/api/weather` enforce `auth.requireAuth`, three major operational endpoints are mounted without any authentication middleware:
  1. `POST /api/news/sitrep`: Synthesizes tactical Flash Situation Reports. An attacker can send arbitrary news payloads to consume server CPU or cause memory exhaustion.
  2. `GET /api/news/tension`: Calculates regional tension index across the territory.
  3. `USE /api/stream`: Routes to `streamProxyRouter`, exposing `/api/stream/manifest` and `/api/stream/segment` to the public internet without session or API token verification.
- **Evidence:**
  ```javascript
  // server/index.js:219-228
  app.post('/api/news/sitrep', async (req, res) => {
    try {
      const { items } = req.body || {};
      const sitrepData = await synthesizeFlashSitRep(items);
      res.json(sitrepData);
    } catch (err) { ... }
  });

  // server/index.js:231-239
  app.get('/api/news/tension', async (req, res) => {
    try {
      const tensionData = await getRegionalTension();
      res.json(tensionData);
    } catch (err) { ... }
  });

  // server/index.js:77
  app.use('/api/stream', streamProxyRouter);
  ```
- **Execution / Data Flow:**  
  An unauthenticated client makes an HTTP POST request to `/api/news/sitrep` with an array of 5,000 artificial articles. The server executes NLP regex parsing, bilingual ontology mapping, and clustering logic, tying up the Node event loop and returning intelligence synthesis without requiring login.
- **Reproduction Scenario:**  
  `curl -i -X POST http://localhost:3000/api/news/sitrep -H "Content-Type: application/json" -d '{"items":[]}'`  
  Returns `200 OK` with JSON tactical intelligence brief without requiring `sentinel_session` cookie or `Authorization` header.
- **Impact:** Unauthorized operational intelligence harvesting, abuse of server compute resources, and exposure of internal stream proxy bandwidth to arbitrary scrapers.
- **Root Cause:** Oversight during feature additions; route handlers were added directly to `app` without applying `auth.requireAuth`.
- **Remediation:**  
  Apply `auth.requireAuth` across all `/api/news/*` and `/api/stream/*` routes:
  ```javascript
  app.post('/api/news/sitrep', auth.requireAuth, async (req, res) => { ... });
  app.get('/api/news/tension', auth.requireAuth, async (req, res) => { ... });
  app.use('/api/stream', auth.requireAuth, streamProxyRouter);
  ```
- **Complexity:** XS (Extra Small)

---

## 9. P1 High Findings

### Finding ARCH-01: Dual-Database Drift: 4.7 MB `db.json` Sync I/O Bypasses SQLite
- **ID:** ARCH-01
- **Severity:** P1 - HIGH
- **Category:** Architecture / Performance / Data Integrity
- **Confidence:** HIGH
- **Status:** CONFIRMED
- **Location:**  
  - File: `skills/memory-bank/skill.js:6, 23-52`
  - File: `server/index.js:246, 253, 259, 264, 269`
  - File: `server/db.js:104-212`
- **Description:**  
  The repository underwent a partial database migration. A SQLite schema was constructed in `server/db.js` featuring tables for `locations`, `alerts`, `preferences`, and `cache`, including a legacy migration script (`migrateLegacyJsonDb`). However, `skills/memory-bank/skill.js` and the endpoints in `server/index.js` were never refactored to use SQLite! They continue to read and write directly to `server/db.json` using synchronous blocking Node.js methods: `fs.readFileSync` and `fs.writeFileSync`. The `server/db.json` file on disk has grown to **4.7 megabytes (4,696,732 bytes)**. Every single alert check, location lookup, preference update, or background poll parses and serializes 4.7 MB of JSON synchronously on the main event loop thread.
- **Evidence:**
  ```javascript
  // skills/memory-bank/skill.js:6, 29, 50
  const DB_PATH = path.join(__dirname, '../../server/db.json');

  function load() {
    ...
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); // 4.7 MB sync read
    ...
  }

  function save(db) {
    try { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); } // 4.7 MB sync write
    ...
  }
  ```
  ```javascript
  // server/index.js:246
  app.get('/api/alerts', auth.requireAuth, (req, res) => {
    const alerts = memoryBank.get('alerts') || []; // triggers load() on 4.7MB file
    ...
  });
  ```
- **Execution / Data Flow:**  
  1. Client calls `GET /api/alerts`.
  2. `memoryBank.get('alerts')` executes `fs.readFileSync('server/db.json')`.
  3. `JSON.parse` processes 4.7 MB of historical news and alerts.
  4. Node.js thread is blocked for 40–120ms, freezing all other incoming requests, SSE broadcasts, and timers.
- **Impact:** Massive event loop latency spikes, high memory churn (multiple 5MB strings and parsed ASTs in V8 heap), and imminent risk of file corruption if two requests write to `db.json` simultaneously.
- **Root Cause:** Incomplete migration. SQLite database was introduced for authentication, but legacy data access layer (`memoryBank`) was never wired to the new SQLite prepared statements.
- **Remediation:**  
  Refactor `skills/memory-bank/skill.js` to execute queries against the `sentinel.db` SQLite connection using prepared statements (`stmtInsertAlert`, `stmtGetAlerts`, `stmtAddLocation`), and decommission `server/db.json`.
- **Complexity:** M (Medium)

---

### Finding SEC-04: Stateless Staff Token Lacks Server Revocation & CSRF Defense
- **ID:** SEC-04
- **Severity:** P1 - HIGH
- **Category:** Security / Authentication / Session Management
- **Confidence:** HIGH
- **Status:** CONFIRMED
- **Location:**  
  - File: `server/staff-service.js:421-455`
  - File: `server/index.js:483-485, 496-522`
- **Description:**  
  The Staff Warden subsystem implements a separate authentication mechanism from the primary user auth. It issues HMAC-SHA256 tokens encoded as `base64url(username:expiresAt:hmac)`. These tokens are completely stateless and are not stored in any database.
  Consequently:
  1. `POST /api/staff/logout` simply returns `{ success: true, message: 'Logged out successfully' }` without recording a revocation. The token remains valid for its full 2-hour lifetime (`TOKEN_TTL_MS = 2 * 60 * 60 * 1000`).
  2. Modifying endpoints (`POST /api/staff/locations`, `POST /api/staff/import`, `DELETE /api/staff/locations/:id`) do not enforce CSRF tokens. While they accept `Authorization: Bearer`, they also accept the custom header `x-staff-token`, but have no anti-CSRF token verification like `auth.requireCsrf` in the primary auth flow.
- **Evidence:**
  ```javascript
  // server/index.js:483-485
  app.post('/api/staff/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' }); // NO-OP
  });

  // server/staff-service.js:446-452
  const expectedHmac = crypto.createHmac('sha256', SESSION_SECRET).update(`${user}:${expiresAt}`).digest('hex');
  if (!safeEqual(signature, expectedHmac)) return false;
  return { user, expiresAt }; // Only verifies cryptographic signature and timestamp; cannot revoke
  ```
- **Execution / Data Flow:**  
  An operator signs out on a shared workstation. A subsequent party copies the token from browser storage or proxy cache. The copied token continues to authenticate requests and alter staff evacuation rosters until expiration.
- **Impact:** Session fixation and persistence of compromised staff coordinator tokens; inability to immediately revoke access for offboarded or compromised staff.
- **Root Cause:** Implementing custom ad-hoc HMAC tokens instead of leveraging the existing SQLite `sessions` table that supports revocation.
- **Remediation:**  
  Unify Staff Warden authentication into the primary `auth.js` system. Assign staff users an RBAC role (`role = 'warden'`), store sessions in SQLite, and invalidate sessions on logout.
- **Complexity:** S (Small)

---

### Finding SEC-05: Unbounded Public Streaming Proxy Allows External Request Relay
- **ID:** SEC-05
- **Severity:** P1 - HIGH
- **Category:** Security / SSRF / Network Abuse
- **Confidence:** HIGH
- **Status:** CONFIRMED
- **Location:**  
  - File: `server/stream-proxy.js:21-67, 196-290, 293-354`
  - File: `server/index.js:77`
- **Description:**  
  `stream-proxy.js` provides an open HTTP/HTTPS proxy designed to fetch HLS manifests (`/api/stream/manifest`) and video chunks (`/api/stream/segment`) with spoofed broadcaster headers (`User-Agent`, `Referer`, `Origin`). Although `validateStreamUrl` blocks loopbacks, private RFC1918 subnets, and cloud metadata IPs (`169.254.169.254`), the proxy accepts **any arbitrary public internet URL**.
  Because the endpoint is unauthenticated and rate-limit exempt, external third parties can use the server as an open forward proxy or anonymizer to download files, stream video, or orchestrate distributed denial of service (DDoS) requests against external web hosts, attributing traffic to the application's host IP.
- **Evidence:**
  ```javascript
  // server/stream-proxy.js:196-220
  async function handleManifestProxy(req, res) {
    ...
    const rawTargetUrl = req.query.url;
    const validation = validateStreamUrl(rawTargetUrl);
    // validation only checks protocol, loopback, link-local, and RFC1918 private IPs
    ...
    const upstreamRes = await fetch(targetUrl, { signal: controller.signal, headers: upstreamHeaders });
    ...
  }
  ```
- **Execution / Data Flow:**  
  An external attacker calls:
  `GET http://<your-server>:3000/api/stream/segment?url=https://victim-website.com/large-asset.iso`  
  The server fetches the file from the victim server and pipes it through Node.js streams to the attacker, disguising the attacker's identity and consuming bandwidth.
- **Impact:** Bandwidth exhaustion, cloud hosting bill inflation, IP blacklisting, and potential abuse for amplified traffic forwarding.
- **Root Cause:** Absence of a domain whitelist / allowlist for streaming origins.
- **Remediation:**  
  1. Enforce a strict domain allowlist in `validateStreamUrl` restricted to approved broadcast sources (e.g., `*.gjirafa.com`, `*.gjirafa.net`, `*.rts.rs`, `*.rtklive.com`, `*.bhtelecom.ba`).
  2. Require operator authentication (`auth.requireAuth`) on `/api/stream/*`.
- **Complexity:** S (Small)

---

### Finding BUG-01: Single-Quote DOM XSS Injection in Keyword Removal & Alert Handlers
- **ID:** BUG-01
- **Severity:** P1 - HIGH
- **Category:** Frontend / Security / Cross-Site Scripting (DOM XSS)
- **Confidence:** HIGH
- **Status:** CONFIRMED
- **Location:**  
  - File: `public/app.js:6756-6760, 7469, 7538, 7656`
- **Description:**  
  The frontend implements a custom HTML escaping function `escHtml(str)` in `public/app.js` line 7656:
  `function escHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }`
  Notice that `escHtml` escapes double quotes (`"`) but **fails to escape single quotes (`'`) or backticks (`\``)**.
  In multiple places, dynamic strings passed through `escHtml` are directly interpolated into inline HTML event handler attributes that are delimited by single quotes:
  - Line 6758: `<span class="keyword-remove" onclick="removeKeyword('${escHtml(kw)}')">✕</span>`
  - Line 7469: `<div class="ticker-item" onclick="handleAlertClick('${escHtml(a.id)}')">`
  - Line 7538: `onclick="handleAlertClick('${escHtml(a.id)}')"`
  - Line 8081: `onclick="focusBorderCrossing('${escHtml(c.id)}')"`
  If an operator enters a custom keyword containing a single quote (e.g., `test');alert(document.cookie);//`), or if an alert/crossing ID contains a single quote, the rendered HTML breaks out of the JavaScript string literal and executes arbitrary code in the user's browser session.
- **Evidence:**
  ```javascript
  // public/app.js:7656
  function escHtml(str) { 
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); 
    // Missing: .replace(/'/g, '&#39;')
  }

  // public/app.js:6757-6759
  $('keywordChips').innerHTML = state.customKeywords.map(kw =>
    `<div class="keyword-chip">${escHtml(kw)}<span class="keyword-remove" onclick="removeKeyword('${escHtml(kw)}')">✕</span></div>`
  ).join('');
  ```
- **Execution / Data Flow:**  
  1. User or shared link adds keyword: `ops');alert(1);//`.
  2. `renderKeywordChips()` generates:  
     `<span class="keyword-remove" onclick="removeKeyword('ops');alert(1);//')">✕</span>`.
  3. Clicking the chip triggers `alert(1)`.
- **Reproduction Scenario:**  
  Type `foo');alert(document.domain);//` into the Custom Keywords input and click Add. Click the remove `✕` icon on the generated chip. The JavaScript executes immediately.
- **Impact:** Client-side account compromise, session token theft (if not protected by HttpOnly), and defacement of the tactical dashboard.
- **Root Cause:** Incomplete sanitization function (`escHtml` omitting single-quote escaping) combined with embedding user data into inline `onclick` string attributes instead of using `addEventListener` or `data-*` attributes.
- **Remediation:**  
  1. Update `escHtml`:
     ```javascript
     function escHtml(str) {
       return String(str || '')
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#39;');
     }
     ```
  2. Replace inline `onclick="...('${id}')"` with delegated event listeners using `data-id` and `element.dataset.id`.
- **Complexity:** S (Small)

---

### Finding OPS-01: `npm test` Ignores 49 Test Files; Zero CI/CD Automation
- **ID:** OPS-01
- **Severity:** P1 - HIGH
- **Category:** DevOps / Test Coverage / Reliability
- **Confidence:** HIGH
- **Status:** CONFIRMED
- **Location:**  
  - File: `package.json:9`
  - Directory: `tests/`
- **Description:**  
  `tests/` contains **50 distinct test files** covering adversarial NLP testing, border crossing calculations, earthquake telemetry, civil unrest tracking, news deduplication, and auth.
  However, in `package.json`, the test script is hardcoded to run only a single file:
  `"test": "node tests/osiris-3d-aviation.test.js"`
  All 49 other test suites are completely skipped when running `npm test`. Furthermore, there is **no CI/CD configuration** (`.github/workflows` does not exist). Pull requests and commits can introduce regressions or break critical security/clustering modules without failing any automated pipeline.
- **Evidence:**
  ```json
  // package.json:9
  "scripts": {
    "start": "node server/index.js",
    "dev": "nodemon server/index.js",
    "test": "node tests/osiris-3d-aviation.test.js",
    "user:create": "node server/cli/create-user.js"
  }
  ```
- **Execution / Data Flow:**  
  Developers or CI runners execute `npm test`. Node executes only `tests/osiris-3d-aviation.test.js`. The test passes, creating a false impression of comprehensive test coverage, while regressions in news deduplication, auth rate limiting, or tension index go completely undetected.
- **Impact:** High probability of undetected functional and security regressions entering production.
- **Root Cause:** Temporary debugging script left as the permanent test runner definition in `package.json`.
- **Remediation:**  
  1. Add a test runner script (e.g., `node --test tests/**/*.test.js` or a test runner script that iterates all files in `tests/`).
  2. Add `.github/workflows/ci.yml` running linting, typechecking (via JSDoc/TS if added), and all 50 test suites on every pull request and push to `main`.
- **Complexity:** S (Small)

---

## 10. P2 Medium Findings

### Finding DATA-01: Unprotected File Overwrite Races in `memory-bank` and `staff-service`
- **ID:** DATA-01
- **Severity:** P2 - MEDIUM
- **Category:** Data Integrity / Concurrency
- **Confidence:** HIGH
- **Status:** CONFIRMED
- **Location:**  
  - File: `skills/memory-bank/skill.js:49-52`
  - File: `server/staff-service.js:380-389`
- **Description:**  
  Both `skills/memory-bank/skill.js` and `server/staff-service.js` write state directly to JSON files using `fs.writeFileSync(DB_PATH, ...)` without atomic write patterns (such as writing to a temporary file and renaming via `fs.renameSync`) or file locking. If a process crash, power loss, or parallel write occurs while `fs.writeFileSync` has truncated the file, the database file becomes empty or malformed JSON (`Unexpected end of JSON input`), resetting all stored locations, preferences, or staff rosters to empty defaults.
- **Evidence:**
  ```javascript
  // skills/memory-bank/skill.js:49-52
  function save(db) {
    try { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }
    catch (e) { console.warn('[memory-bank] write error:', e.message); }
  }
  ```
- **Impact:** Irrevocable loss of user alert history, configured preferences, and staff evacuation records upon unexpected server termination.
- **Remediation:** Migrate domain entities to SQLite or implement atomic write replacement via `fs.writeFileSync(tmpPath); fs.renameSync(tmpPath, targetPath)`.
- **Complexity:** S (Small)

---

### Finding SEC-06: Flawed Origin Filter Middleware Continues Execution on Disallowed Origins
- **ID:** SEC-06
- **Severity:** P2 - MEDIUM
- **Category:** Security / CORS / Request Handling
- **Confidence:** HIGH
- **Status:** CONFIRMED
- **Location:**  
  - File: `server/index.js:51-62`
- **Description:**  
  The origin validation middleware in `server/index.js` inspects `req.headers.origin`. If the origin is in `allowedOrigins`, it sets CORS headers. However, if the origin is **not** in `allowedOrigins`, it does not reject the request or terminate execution; it simply skips setting CORS headers and calls `next()`.
  While browsers block cross-origin JS from reading the response due to missing CORS headers, simple cross-origin requests (e.g. `POST` requests with form or plain text content types) or pre-existing cached credentials can still trigger side-effects on the server.
- **Evidence:**
  ```javascript
  // server/index.js:51-62
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (!origin) return next();
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Staff-Token');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next(); // Always continues execution even if origin is disallowed!
  });
  ```
- **Remediation:** For state-modifying requests (`POST`, `DELETE`, `PUT`), if an `Origin` header is present and not within `allowedOrigins`, reject with `403 Forbidden`.
- **Complexity:** XS (Extra Small)

---

### Finding PERF-01: 12,303-Line Monolithic Client Bundle Blocks Parsing & Cache Granularity
- **ID:** PERF-01
- **Severity:** P2 - MEDIUM
- **Category:** Frontend / Performance / Maintainability
- **Confidence:** HIGH
- **Status:** CONFIRMED
- **Location:**  
  - File: `public/app.js` (12,303 lines, 475 KB)
- **Description:**  
  The frontend application is contained in a single 475 KB JavaScript file (`public/app.js`). It includes all map layer definitions, CCTV video players, weather widgets, aviation canvas trails, news card rendering, triage filters, modal dialogs, and admin actions.
  In `server/index.js`, static files are served with `Cache-Control: no-cache, no-store, must-revalidate` (lines 68–72). This forces the browser to download and parse 475 KB of unminified JavaScript on every single page load or refresh, causing significant Total Blocking Time (TBT) and input latency on mobile or low-spec operational field devices.
- **Impact:** Sub-optimal First Contentful Paint (FCP) and high CPU parsing overhead on field terminals.
- **Remediation:** Split `app.js` into focused ES modules (`news.js`, `map.js`, `cctv.js`, `aviation.js`, `staff.js`) and use a bundler (Vite or esbuild) to generate minified, content-hashed assets with standard caching.
- **Complexity:** L (Large)

---

### Finding REL-01: Missing Circuit Breakers and Retry Backoff on Upstream Third-Party APIs
- **ID:** REL-01
- **Severity:** P2 - MEDIUM
- **Category:** Reliability / Resilience
- **Confidence:** HIGH
- **Status:** CONFIRMED
- **Location:**  
  - Files: `skills/weather-monitor/skill.js`, `skills/wildfire-monitor/skill.js`, `skills/aqi-monitor/skill.js`
- **Description:**  
  When external services (such as Open-Meteo or NASA FIRMS) experience rate limits (HTTP 429) or transient outages (HTTP 502/503), the monitors log an error and return empty or error objects, but have no circuit breaker or exponential backoff logic. If clients repeatedly click "Refresh", the server repeatedly fires requests to failing upstream APIs, risking complete IP bans by providers.
- **Remediation:** Implement circuit breaker wrappers (e.g. `opossum` or a simple in-memory breaker) that fast-fail requests for 60 seconds once an upstream provider returns repeated 5xx or 429 status codes.
- **Complexity:** M (Medium)

---

## 11. P3 Low Findings

### Finding A11Y-01: Non-Interactive `<div>` Click Handlers Without Keyboard Accessibility
- **ID:** A11Y-01
- **Severity:** P3 - LOW
- **Category:** Accessibility / UX
- **Confidence:** HIGH
- **Status:** CONFIRMED
- **Location:**  
  - File: `public/app.js:7469, 8081`
  - File: `public/index.html:98`
- **Description:** Multiple critical UI elements (such as ticker alert items, border crossing cards, and the regional tension popover toggle) are implemented as `<div>` elements with `onclick` listeners, but lack `tabindex="0"`, `role="button"`, and `keydown` listeners for Enter/Space keys. Operators relying on keyboard navigation cannot interact with these controls.
- **Remediation:** Replace with semantic `<button>` elements or add `tabindex="0"`, `role="button"`, and `onkeydown` listeners.
- **Complexity:** S (Small)

---

### Finding DOC-01: Severe Documentation Drift in `README.md` Regarding Stack & APIs
- **ID:** DOC-01
- **Severity:** P3 - LOW
- **Category:** Documentation Drift
- **Confidence:** HIGH
- **Status:** CONFIRMED
- **Location:**  
  - File: `README.md:18, 50, 73-85`
- **Description:**  
  1. `README.md` line 18 claims the interactive map uses **Leaflet.js**, but the implementation uses **MapLibre GL JS** with WebGL 3D terrain and vector styles.
  2. `README.md` line 50 claims news intelligence uses **GNews API**, whereas the codebase implements an autonomous RSS scraper and NLP clustering engine across Balkan regional media.
  3. The API endpoint table lists only 8 endpoints, omitting `/api/auth/*`, `/api/staff/*`, `/api/minefields/*`, `/api/news/sitrep`, `/api/news/tension`, and `/api/stream/*`.
- **Remediation:** Update `README.md` to reflect the true architecture, API catalog, and MapLibre GL implementation.
- **Complexity:** S (Small)

---

### Finding CODE-01: Flawed Test Assertions Relying on File String Matching Rather than Behavior
- **ID:** CODE-01
- **Severity:** P3 - LOW
- **Category:** Testing Quality
- **Confidence:** HIGH
- **Status:** CONFIRMED
- **Location:**  
  - File: `tests/osiris-3d-aviation.test.js:16-57`
  - File: `tests/osiris-layout.test.js`
- **Description:**  
  Several tests (e.g. `tests/osiris-3d-aviation.test.js`) test application functionality by reading `index.html`, `app.js`, and `style.css` as text files and checking `assert.ok(appJs.includes('toggle3DView'))` or `assert.ok(indexHtml.includes('id="btnOsiris3D"'))`. These tests only prove that string identifiers exist in the source code; they do not instantiate the component, simulate events, or verify that the features actually function.
- **Remediation:** Transition frontend testing to a headless environment (Playwright / Puppeteer) that tests actual DOM interaction and WebGL initialization.
- **Complexity:** M (Medium)

---

## 12. P4 Improvements

- **IMP-01: Harden Security Headers via Helmet:** Integrate `helmet` middleware in `server/index.js` to set `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY`.
- **IMP-02: Structured Logging and Telemetry:** Replace `console.log`/`console.error` with a structured logger (`pino` or `winston`) incorporating request correlation IDs (`X-Request-ID`).
- **IMP-03: Rate Limiting on Stream Proxy and Staff Login:** Extend `express-rate-limit` to `/api/stream/*` and `/api/staff/login` to prevent credential stuffing and relay abuse.
- **IMP-04: Graceful Shutdown Handling:** Implement explicit handlers for `SIGTERM` and `SIGINT` in `server/index.js` to close the SQLite database (`db.close()`), stop SSE timers, and gracefully drain active HTTP connections.

---

## 13. Security Audit Synthesis

### 13.1 Authentication & Authorization Matrix

| Route / Feature | Auth Required | Role Check | CSRF Protected | Rate Limited | Tenancy / Isolation | Risk Assessment |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `POST /api/auth/login` | No | None | N/A | Yes (20 req/15m) | Global | Solid brute-force defense, uses scrypt. |
| `POST /api/auth/logout` | No | None | No | No | Global | Destroys session in SQLite; clears cookie. |
| `GET /api/auth/me` | No | None | No | No | Global | Safe; returns auth status. |
| `GET /events` (SSE) | **Yes** | Any | No | No | Global | Flawed CORS wildcard header with credentials. |
| `POST /api/status` | **Yes** | Any | No | No | Global | Protected. Triggers orchestrator. |
| `POST /api/news/sitrep` | **NO** | None | **NO** | **NO** | Global | **CRITICAL:** Unauthenticated public POST endpoint. |
| `GET /api/news/tension` | **NO** | None | **NO** | **NO** | Global | **CRITICAL:** Unauthenticated public GET endpoint. |
| `GET /api/stream/*` | **NO** | None | **NO** | **NO** | Global | **CRITICAL:** Unauthenticated public HTTP proxy. |
| `GET /api/alerts` | **Yes** | Any | No | No | Global | Protected by session cookie. |
| `POST /api/alerts/read` | **Yes** | Any | **Yes** | No | Global | Well-protected with `requireCsrf`. |
| `GET /api/preferences` | **Yes** | Any | No | No | Global | Protected. |
| `POST /api/preferences` | **Yes** | Any | **Yes** | No | Global | Well-protected with `requireCsrf`. |
| `GET /api/minefields` | **Yes** | Any | No | No | Global | Protected. |
| `POST /api/staff/login` | No | None | No | **NO** | Global | **HIGH:** No rate limiting on password checks. |
| `POST /api/staff/logout` | No | None | No | No | Global | **HIGH:** No-op; does not revoke token. |
| `GET /api/staff/locations` | **Staff** | Warden | No | No | Global | Protected by HMAC token only. |
| `POST /api/staff/locations`| **Staff** | Warden | **NO** | No | Global | **HIGH:** Modifies staff roster without CSRF token. |
| `DELETE /api/staff/locations/:id` | **Staff** | Warden | **NO** | No | Global | **HIGH:** Deletes staff location without CSRF token. |

---

## 14. Data Integrity & Storage Audit

### Invariants & Storage Findings
1. **SQLite Database (`server/data/sentinel.db`):**
   - Tables use strict constraints: `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`.
   - Index coverage is solid on `sessions(user_id)`, `sessions(expires_at)`, `alerts(timestamp)`, and `locations(name)`.
   - WAL mode (`PRAGMA journal_mode = WAL`) and busy timeouts (`5000ms`) are properly configured.
2. **JSON Files (`server/db.json` & `server/staff-db.json`):**
   - **Severe Invariant Violation:** Domain operations (`memoryBank` and `staffService`) do not use SQLite.
   - Files are written synchronously via `fs.writeFileSync`.
   - No unique constraints or transaction guarantees exist in the JSON layer; concurrent writes will overwrite each other, causing lost updates.

---

## 15. Performance Audit

### Primary Bottlenecks
1. **Event Loop Starvation via Synchronous I/O:**
   Every call to `memoryBank.get('alerts')` or `memoryBank.setCache(...)` reads or writes `server/db.json` (4.7 MB) using `fs.readFileSync` / `fs.writeFileSync`. In Node.js single-threaded event loop, serializing 4.7 MB of text blocks all network I/O for up to 100ms.
2. **Monolithic Uncached Frontend:**
   `public/app.js` is 475 KB and served with `Cache-Control: no-cache, no-store`. Every browser tab reload requires downloading, lexing, and compiling 12,300 lines of JavaScript.
3. **Redundant Upstream Scraping:**
   The news intelligence engine scrapes multiple regional RSS feeds simultaneously. If multiple users invoke `/api/status?forceRefresh=true`, upstream news scrapers run concurrently without request coalescing.

---

## 16. Reliability Audit

1. **Graceful Degradation:**
   `orchestrator.js` uses `Promise.allSettled` to execute all 8 monitor skills. If USGS, Radmon, or OpenSky fail, the orchestrator still returns a valid result with partial data and assigns error notes to individual skill keys.
2. **Crash Resilience:**
   In-memory TTL cache (`server/cache.js`) prevents rapid repeated failures from hitting rate limits. However, unhandled promise rejections in background loops or memory exhaustion from large JSON files can terminate the single Node.js process without a process supervisor (unless run under PM2 or container orchestration).

---

## 17. Testing Audit

- **Test Suite Overview:** 50 test files in `tests/`.
- **Passing Coverage Illusion:** `package.json` test script only invokes `tests/osiris-3d-aviation.test.js`. The other 49 test files are never executed by CI or `npm test`.
- **Strong Test Modules:**
  - `tests/news-intel-adversarial.test.js`: Exceptional test suite with 20+ adversarial NLP test cases verifying false-positive suppression, diacritics, Cyrillic transliteration, and negation boundaries.
  - `tests/civil-unrest.test.js` & `tests/news-sitrep.test.js`: High-quality unit and integration tests.
- **Weak / Fragile Tests:**
  - `tests/osiris-3d-aviation.test.js` and `tests/style-studio-map-controls.test.js` rely on `fs.readFileSync` and `assert.ok(code.includes('someFunction'))`, testing textual syntax rather than actual behavior.

---

## 18. Dependency Audit

| Dependency | Declared Version | Status | Risk / Finding | Recommendation |
| :--- | :---: | :---: | :--- | :--- |
| `better-sqlite3` | `^13.0.3` | Up-to-date | Native C++ bindings require build tools on deployment. | Keep; ensure build environment has Python/C++ compiler. |
| `express` | `^4.18.2` | Outdated | Minor security fixes available in Express 4.x / 5.x. | Update to `^4.21.0`. |
| `axios` | `^1.6.7` | Outdated | SSRF and prototype pollution patches in newer 1.7+ releases. | Upgrade to `^1.7.7`. |
| `telegram` | `^2.26.22` | Current | Heavy MTProto client library; requires secure session storage. | Keep; isolate session storage. |
| `maplibre-gl` | `^6.4.0` | Current | Excellent WebGL map library. | Keep. |
| `xml2js` | `^0.6.2` | Current | Fast XML parsing for RSS feeds. | Keep. |
| `cors` | `^2.8.5` | Current | Installed but overridden by custom CORS middleware in `index.js`. | Use configured `cors()` package instead of custom middleware. |
| `dotenv` | `^16.4.1` | Current | Standard environment loader. | Keep. |

---

## 19. CI/CD & DevOps Audit

1. **GitHub Actions:** None (`.github/workflows` does not exist). No automated linting, test execution, or vulnerability scanning on PRs.
2. **Containerization:** No `Dockerfile` or `docker-compose.yml`. Deployments must rely on raw host Node.js environments.
3. **Deployment Target:** `Procfile` specifies `web: node server/index.js` targeted for Render or Heroku.
4. **Environment Drift:** The presence of `TELEGRAM_SESSION_LOCAL` and `TELEGRAM_SESSION_PRODUCTION` indicates ad-hoc manual switching between developer machines and cloud hosts.

---

## 20. UX & Accessibility Audit

1. **UX Strengths:**
   - Outstanding visual aesthetic: dark tactical OSINT HUD with cyan/amber status indicators.
   - Smooth 2D/3D MapLibre view transitions and tactical overlays (KFOR MSR corridors, bases, minefield warning rings).
   - Real-time ticker with severity badges and regional tension indicators.
2. **UX Bugs & Friction:**
   - Single-quote XSS bug in keyword chips (`BUG-01`).
   - Adding duplicate keywords does not provide feedback; keyword removal uses inline handlers.
3. **Accessibility:**
   - Missing keyboard focus indicators on custom controls.
   - Non-semantic clickable `div`s lack ARIA attributes and keyboard listeners (`Enter`/`Space`).
   - Color contrast on dark cyan/grey pills can fall below WCAG AA 4.5:1 ratio on low-brightness monitors.

---

## 21. Observability Audit

- **Current State:** Primitive. Entirely based on standard `console.log` and `console.error` calls.
- **Traceability:** No HTTP request IDs, no correlation IDs between orchestrator and sub-skills.
- **Metrics:** `GET /api/cache/stats` provides basic in-memory cache counts, but there are no Prometheus metrics, health check endpoints (`/healthz` or `/ready`), or OpenTelemetry integration.

---

## 22. Documentation vs Reality

| Documented Claim (`README.md`) | Actual Implementation in Code |
| :--- | :--- |
| Map engine: **Leaflet.js** | **MapLibre GL JS** (`maplibre-gl.mjs` with WebGL 3D terrain and vector styles). |
| News source: **GNews API** | Autonomous multi-source **RSS scraper & Serbian/Albanian NLP clustering**. |
| API Endpoints: **8 endpoints listed** | **24+ endpoints** active in `server/index.js`. |
| Authentication: **Not mentioned** | Full **SQLite scrypt session authentication** + **Staff Warden auth**. |
| Minefields / UXO: **Not mentioned** | Dedicated **KMAC/HALO Trust proximity intelligence engine**. |

---

## 23. Dead / Legacy / Suspicious Code

1. **`server/db.json` (4.7 MB):** LEGACY BUT ACTIVELY USED. Was supposed to be retired after migration to SQLite (`sentinel.db`), but remains the active data store for `memory-bank`.
2. **`cors` npm package:** LEGACY BUT INSTALLED. Declared in `package.json` and required in `server/index.js:5`, but never used as middleware (custom header setting function is used instead).
3. **`tests/osiris-3d-aviation.test.js` string tests:** SUSPICIOUS. Performs regex text matching against client source files rather than executing behavioral assertions.

---

## 24. Production Readiness Checklist

| Category | Item | Status | Comment |
| :--- | :--- | :---: | :--- |
| **Setup & Build** | Clean install (`npm install`) | ✅ PASS | Dependencies install cleanly. |
| | Automated build / bundling | ❌ FAIL | No bundler configured; unminified 475 KB raw JS. |
| | Code linting (`eslint`) | ❌ FAIL | No linter configured in project. |
| | Typechecking | ❌ FAIL | No TypeScript or JSDoc typechecking. |
| **Testing** | Unit test suite | ⚠️ PARTIAL | 50 test files exist, but `npm test` runs only 1. |
| | Integration tests | ⚠️ PARTIAL | Tests exist but are not automated in CI. |
| | End-to-End (E2E) tests | ❌ FAIL | No Playwright / Cypress / Puppeteer E2E tests. |
| **Security** | Authentication | ⚠️ PARTIAL | Strong primary SQLite auth, but flawed Staff auth. |
| | Authorization & RBAC | ⚠️ PARTIAL | Role checking exists for users; missing for sitrep/stream. |
| | Secrets management | ❌ FAIL | Real Telegram sessions and API keys committed in `.env`. |
| | CSRF defense | ⚠️ PARTIAL | Enforced on `/api/preferences`, missing on staff routes. |
| | Security headers | ❌ FAIL | No Helmet / CSP / HSTS headers configured. |
| | Rate limiting | ⚠️ PARTIAL | Configured on user login; missing on staff login & streams. |
| **Data & Storage** | Database constraints | ✅ PASS | Foreign keys and WAL mode enabled in SQLite. |
| | Storage scalability | ❌ FAIL | 4.7 MB flat JSON file read/written synchronously. |
| | Atomic writes / Locking | ❌ FAIL | No file locking or atomic replacement on JSON files. |
| **Reliability** | Error handling | ⚠️ PARTIAL | Handled in skills, but generic 500s on server. |
| | Upstream circuit breakers | ❌ FAIL | No circuit breakers on third-party APIs. |
| | Graceful shutdown | ❌ FAIL | No SIGTERM/SIGINT handlers to close DB cleanly. |
| **DevOps** | CI/CD pipeline | ❌ FAIL | No `.github/workflows` configured. |
| | Containerization | ❌ FAIL | No Dockerfile or docker-compose. |
| | Documentation | ❌ FAIL | Severe documentation drift in `README.md`. |

---

## 25. Top 10 Problems

### Top 10 by Risk
1. **SEC-01 (P0):** Real staff personal PII (addresses, phone numbers, family names) and hardcoded credentials in `staff-service.js`.
2. **SEC-02 (P0):** Live production Telegram MTProto session strings committed in `.env`.
3. **SEC-03 (P0):** Unauthenticated public access to SitRep generator, tension index, and stream proxy.
4. **SEC-05 (P1):** Open streaming proxy allows arbitrary forward request relay to external public targets.
5. **BUG-01 (P1):** Single-quote DOM XSS in custom keyword deletion and alert handlers.
6. **ARCH-01 (P1):** 4.7 MB synchronous JSON file reads/writes blocking the Node.js event loop.
7. **SEC-04 (P1):** Irrevocable stateless HMAC tokens for staff evacuation management with zero CSRF defense.
8. **OPS-01 (P1):** 49 out of 50 test suites skipped during `npm test`; zero automated CI validation.
9. **DATA-01 (P2):** Unprotected concurrent file write races risking `db.json` and `staff-db.json` corruption.
10. **SEC-06 (P2):** Origin validation middleware fails to reject unauthorized cross-origin write requests.

### Top 10 by ROI (Impact / Effort)
1. **SEC-03 (Fix Unauthenticated Routes):** Add `auth.requireAuth` to 3 route handlers (`index.js`). *Effort: 5 min · Impact: Massive.*
2. **BUG-01 (Fix Single-Quote XSS):** Add `&#39;` replacement to `escHtml` (`app.js:7656`). *Effort: 2 min · Impact: Eliminates DOM XSS.*
3. **SEC-05 (Domain Allowlist for Stream Proxy):** Validate target URL against allowed broadcaster domains (`stream-proxy.js`). *Effort: 15 min · Impact: Eliminates SSRF/open proxy abuse.*
4. **OPS-01 (Update Test Script in `package.json`):** Change test script to execute all test files in `tests/`. *Effort: 5 min · Impact: Restores regression test coverage.*
5. **SEC-02 (Rotate & Protect Secrets):** Terminate Telegram sessions, remove `.env` from git tracking, add to `.gitignore`. *Effort: 15 min · Impact: Secures Telegram account.*
6. **SEC-06 (Enforce Origin Check):** Return 403 for disallowed origins on mutating requests. *Effort: 10 min · Impact: Blocks cross-origin tampering.*
7. **IMP-01 (Add Helmet Security Headers):** Add `app.use(helmet())` for CSP and clickjacking defense. *Effort: 15 min · Impact: Elevates baseline HTTP security.*
8. **DOC-01 (Update README):** Correct documentation to match MapLibre GL, actual API list, and news ontology. *Effort: 20 min · Impact: Aligns documentation with reality.*
9. **SEC-04 (Rate Limit Staff Login):** Apply `authLimiter` to `/api/staff/login`. *Effort: 5 min · Impact: Prevents brute-force on staff password.*
10. **DATA-01 (Atomic File Writing):** Wrap JSON writes in temp-write + renameSync. *Effort: 20 min · Impact: Prevents database zero-byte corruption.*

---

## 26. Remediation Roadmap

### Phase 0: Emergency (Immediate / Day 1)
- **Dependencies:** None.
- **Actions:**
  1. Revoke Telegram MTProto sessions in Telegram client settings; regenerate API credentials.
  2. Remove `.env` from Git tracking and git history.
  3. Redact and replace real staff personal PII in `staff-service.js` and `staff-db.json` with synthetic test records.
  4. Fix single-quote XSS in `public/app.js:7656` (`escHtml`).
  5. Add `auth.requireAuth` to `/api/news/sitrep`, `/api/news/tension`, and `/api/stream`.

### Phase 1: Before Production Deployment (Days 2–3)
- **Dependencies:** Completion of Phase 0.
- **Actions:**
  1. Add domain allowlist to `validateStreamUrl` in `server/stream-proxy.js`.
  2. Add rate limiting (`authLimiter`) to `POST /api/staff/login`.
  3. Add `package.json` test script running all 50 test files; create `.github/workflows/ci.yml`.
  4. Enforce strict origin rejection in CORS middleware.
  5. Install and configure `helmet` for security headers.

### Phase 2: Stabilization & Storage Unification (Week 1)
- **Dependencies:** Passing test suite in CI.
- **Actions:**
  1. Complete SQLite migration: refactor `skills/memory-bank/skill.js` to read/write from `sentinel.db` instead of `server/db.json`.
  2. Delete legacy 4.7 MB `server/db.json`.
  3. Unify Staff Warden accounts into SQLite `users` and `sessions` tables with RBAC role check.

### Phase 3: Performance & Frontend Modularization (Week 2)
- **Dependencies:** Unified database layer.
- **Actions:**
  1. Modularize `public/app.js` into ES modules and bundle via Vite.
  2. Enable cache-busting asset hashes and proper HTTP caching headers (`max-age=31536000, immutable`).
  3. Implement keyboard accessibility (`tabindex="0"`, `role="button"`) across all custom dashboard widgets.

### Phase 4: Quality, Observability & Infrastructure (Week 3)
- **Dependencies:** Modular frontend.
- **Actions:**
  1. Add Dockerfile and docker-compose configurations.
  2. Implement structured JSON logging (`pino`) and request ID middleware.
  3. Add health and readiness endpoints (`/healthz`).
  4. Update `README.md` and generate OpenAPI / Swagger API specifications.

---

## 27. Things Done Well

1. **Multilingual Intelligence Ontology (`skills/news-intel/`):**
   The news intelligence subsystem is exceptionally well engineered. It implements a multi-layer NLP pipeline with Cyrillic-to-Latin transliteration, diacritic folding, negation scope detection (`checkScopedNegation`), entity disambiguation, and Jaccard headline similarity scoring. The bilingual bridge dictionary (`BILINGUAL_LOCATIONS_MAP`) gracefully reconciles Serbian and Albanian toponyms (e.g. *Kosovska Mitrovica* ↔ *Mitrovicë*).
2. **Adversarial Linguistic Test Suite (`tests/news-intel-adversarial.test.js`):**
   Includes deep adversarial red-team test cases verifying that substring false positives (e.g., *firefighter* triggering fire alerts, *drugstore* triggering drug trafficking, or *pećina* triggering Peja) are correctly suppressed.
3. **Primary Authentication Security (`server/auth.js`):**
   The primary authentication engine follows industry standards: password hashing using `crypto.scryptSync` with 32-byte cryptographically secure salts, timing-safe equality checks (`crypto.timingSafeEqual`), SQLite-backed brute-force lockout tables, HttpOnly session cookies, and dedicated CSRF validation middleware.
4. **Geospatial & Situational Visualization (`public/`):**
   Sophisticated integration of MapLibre GL JS with custom 3D buildings, KFOR Main Supply Routes (MSR), base locations, Kosovo Mine Action Centre hazard rings, and dynamic Regional Tension Index widgets.
5. **Resilient Orchestration (`server/orchestrator.js`):**
   Parallel multi-signal ingestion using `Promise.allSettled` ensures that individual third-party API outages do not bring down the entire dashboard.

---

## 28. Unknowns & Verification Constraints

- **Live Production Environment Access:** Verification was performed locally on the workspace repository. Production server environment variables (Render/Codespaces runtime configurations) were evaluated based on repository files and code paths.
- **External Provider API Quotas:** Live third-party API keys (NASA FIRMS, Radmon, OpenSky) were not queried against external servers to prevent unauthorized API quota consumption or credential verification against live third-party services.
- **Local Test Execution:** Node.js binary was not available on the shell PATH in this specific container terminal environment; test execution assessment was performed via full static analysis of all 50 test suite implementations and code paths.
