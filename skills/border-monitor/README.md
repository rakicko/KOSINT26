## Source Architecture & Priority

SENTINEL implements a strict hierarchical source strategy:

```
1. QKMK Official Source (Primary)
   └── https://mpb.rks-gov.net/?culture=sr-latn-rs
       │
       ├──[If Reachable & Valid]──► Returns LIVE_DATA (source: "QKMK")
       │
       └──[If Unreachable / Cloud Blocked]
            │
            ▼
2. Nakordoni Developer REST API (Secondary Fallback)
   └── https://nakordoni.eu/api/v1/data/multi
       │
       ├──[If NAKORDONI_API_KEY configured & Valid]──► Returns LIVE_DATA (source: "NAKORDONI")
       │
       └──[If Key Missing / Unreachable]
            │
            ▼
3. UNAVAILABLE State
   └── Deterministic UNAVAILABLE response with zero fabricated values
```

---

## Data Sources

### 1. Primary: QKMK / MPB (Official Government Source)
* **Authority:** National Center for Border Management (*Qendra Kombëtare për Menaxhim Kufitar* — QKMK) / Ministry of Internal Affairs (MPB)
* **URL:** `https://mpb.rks-gov.net/?culture=sr-latn-rs`
* **Format:** HTML `#fluksi-tabela` or JSON
* **Auth:** None (public reporting page)
* **Cloud Connectivity Note:** The Kosovo state datacenter rejects direct TCP connections (`ECONNREFUSED`) from non-domestic cloud hosts like GitHub Codespaces.

### 2. Secondary: Nakordoni Developer API (External Data Provider)
* **Provider:** Nakordoni (`https://nakordoni.eu/` — independent European border monitoring platform)
* **Endpoint:** `GET https://nakordoni.eu/api/v1/data/multi?ppids={KOSOVO_PPIDS}&include=queue,update-info&lang=en`
* **Auth:** HTTP Header `Authorization: Bearer <NAKORDONI_API_KEY>`
* **Terms & Attribution:** Permitted under Nakordoni Developer API terms; requires visible attribution (`Data powered by Nakordoni.eu`).
* **Rate Limits:** 1,000 standard requests / day on free Explorer tier.

---

## Environment Variables

Configured in `.env`:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `BORDER_API_URL` | `https://mpb.rks-gov.net/?culture=sr-latn-rs` | Primary QKMK source URL override |
| `BORDER_CACHE_TTL_MS` | `60000` (60 seconds) | In-memory cache TTL |
| `NAKORDONI_API_KEY` | *(Empty)* | API key for secondary Nakordoni fallback |
| `NAKORDONI_API_URL` | `https://nakordoni.eu` | Base URL for Nakordoni API |
| `NAKORDONI_KOSOVO_PPIDS` | `id_512,id_513,...` | Comma-separated list of Kosovo crossing PPIDs |

---

## Response Statuses
* **`LIVE_DATA`**: Live border crossing wait times and queue lengths successfully retrieved (source indicated as `"QKMK"` or `"NAKORDONI"`).
* **`NO_DATA`**: Endpoint reachable, but no active records are returned.
* **`UNAVAILABLE`**: Both primary official and secondary fallback sources could not be reached.
* **`INVALID_DATA`**: Response was unparseable or malformed.

---

## CLI Testing

Run direct skill test:
```bash
node skills/border-monitor/skill.js
```


## Static Coordinate Mapping
Geographic coordinates for all known Kosovo border crossings are maintained in a static dictionary (`BORDER_LOCATIONS`) separate from live queue data:
* **Merdare** (`42.9439, 21.2464`) — Border with Serbia
* **Jarinje** (`43.2181, 20.6975`) — Border with Serbia
* **Bërnjak** (`42.9753, 20.5519`) — Border with Serbia
* **Dheu i Bardhë** (`42.4844, 21.6547`) — Border with Serbia
* **Mutivodë** (`42.7561, 21.4686`) — Border with Serbia
* **Muçibabë** (`42.3883, 21.5583`) — Border with Serbia
* **Hani i Elezit** (`42.1469, 21.2981`) — Border with North Macedonia
* **Glloboçicë** (`42.1644, 21.0967`) — Border with North Macedonia
* **Stançiq** (`42.2778, 21.5278`) — Border with North Macedonia
* **Kullë** (`42.7933, 20.2789`) — Border with Montenegro
* **Vërmicë** (`42.1583, 20.5486`) — Border with Albania
* **Qafë e Prushit** (`42.3014, 20.3553`) — Border with Albania
* **Qafë e Morinës** (`42.4106, 20.2528`) — Border with Albania

---

## Testing
Run standalone CLI test:
```bash
node skills/border-monitor/skill.js
```
