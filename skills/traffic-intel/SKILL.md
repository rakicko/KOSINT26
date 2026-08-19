---
name: traffic-intel
description: |
  Extracts traffic incidents from existing news/RSS data.
  Filters news articles for traffic-related keywords in English, Serbian, and Albanian.
---

# Traffic Intel Skill

## Input
```json
{
  "location": "Kosovo",
  "news": {
    "skill": "news-intel",
    "items": [
      {
        "id": "article-1",
        "title": "Road accident on Mitrovica-Pristina highway",
        "description": "Two vehicles collided...",
        "source": "KoSSev",
        "publishedAt": "ISO"
      }
    ]
  }
}
```

## Output
```json
{
  "skill": "traffic-intel",
  "location": "Kosovo",
  "fetchedAt": "ISO timestamp",
  "incidents": [
    {
      "id": "traffic-article-1",
      "type": "accident | road_closure | congestion | road_block | roadworks | other",
      "title": "Road accident on Mitrovica-Pristina highway",
      "description": "Two vehicles collided...",
      "source": "KoSSev",
      "publishedAt": "ISO",
      "url": "https://article-url"
    }
  ],
  "source": "news-rss | none",
  "anomalyDetected": true,
  "anomalySummary": "Multiple closures detected — possible security cordon"
}
```

## Traffic Keywords
- English: accident, crash, collision, road closed, road closure, blocked road, traffic, congestion, traffic disruption, roadworks, vehicle overturned
- Serbian: saobraćaj, saobraćajna nezgoda, udes, sudar, blokiran put, zatvoren put, gužva, zastoj, kolona
- Albanian: aksident, përplasje, rrugë e bllokuar, rrugë e mbyllur, trafik, kolonë, bllokim

## Incident Types
- `accident` - Vehicle collision or crash
- `road_closure` - Road blocked or closed
- `congestion` - Traffic congestion reported
- `road_block` - Road blocked (bllokim, blokada)
- `roadworks` - Construction work
- `other` - General traffic event

## Usage
```bash
node skills/traffic-intel/skill.js
```