---
name: news-intel
description: |
  Ingests, classifies, and scores security-relevant news across 10 regional Kosovo portals (Albanian and Serbian).
  Detects protests, border tensions, blockades, police activity, and geopolitical developments.
  Provides multi-source entity clustering and deduplication.
---

# News Intelligence Skill

## Target Regional Sources
1. **KoSSev** (Serbian / North Kosovo)
2. **Koha Ditore** (Albanian / Pristina)
3. **Kosovo Online** (Serbian)
4. **Telegrafi** (Albanian)
5. **Indeksonline** (Albanian)
6. **Radio Kontakt Plus** (Serbian / North Mitrovica)
7. **Klan Kosova** (Albanian)
8. **Gazeta Express** (Albanian)
9. **Danas — Kosovo** (Serbian regional)
10. **Balkan Insight — BIRN** (English/Regional)

## Input
```json
{
  "location": "Mitrovica, Kosovo",
  "timeline": "24h",
  "keywords": ["kp", "kfor", "eulex"]
}
```

## Supported Timelines
- `1h`: Last 60 minutes
- `6h`: Last 6 hours
- `24h`: Last 24 hours
- `48h`: Last 48 hours
- `7d`: Last 7 days

## Output
```json
{
  "skill": "news-intel",
  "location": "Mitrovica, Kosovo",
  "fetchedAt": "ISO timestamp",
  "articles": [],
  "events": [],
  "summary": {
    "total": 12,
    "highIntensity": 3,
    "maxScore": 8.5
  }
}
```

## CLI Usage
```bash
node skills/news-intel/skill.js --test --location "Mitrovica" --timeline "24h"
```
