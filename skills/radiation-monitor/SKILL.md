---
name: radiation-monitor
description: |
  Fetches radiation (background gamma) levels for Kosovo and neighboring Balkan regions.
  Monitors sensor data from regional observation points and detects baseline deviations.
---

# Radiation Monitor Skill

## Input
```json
{
  "location": "Mitrovica, Kosovo",
  "lat": 42.8914,
  "lon": 20.8660,
  "neighborRadiusKm": 200
}
```

## Output
```json
{
  "skill": "radiation-monitor",
  "location": "Mitrovica, Kosovo",
  "fetchedAt": "ISO timestamp",
  "primary": {
    "usvh": 0.12,
    "status": "normal",
    "sensorName": "Regional Sensor",
    "distanceKm": 15,
    "lastUpdate": "ISO"
  },
  "neighbors": [],
  "baseline": 0.11,
  "dataQuality": "live | estimated | baseline",
  "source": "radmon | regional_baseline"
}
```

## Status Thresholds (µSv/h)
- normal: < 0.30 (natural background)
- elevated: 0.30 – 1.00 (worth monitoring)
- high: 1.00 – 10.00 (alert threshold)
- critical: > 10.00 (radiological emergency)

## Usage
```bash
node skills/radiation-monitor/skill.js --test --location "Mitrovica"
```
