---
name: weather-monitor
description: |
  Fetches tactical weather and severe conditions for Kosovo locations using Open-Meteo.
  Coordinates resolved via authoritative local geocoder. Detects severe weather and extreme wind.
---

# Weather Monitor Skill

## Input
```json
{
  "location": "Mitrovica, Kosovo",
  "lat": 42.8914,
  "lon": 20.8660
}
```

## Output
```json
{
  "skill": "weather-monitor",
  "location": "Mitrovica, Kosovo",
  "coordinates": { "lat": 42.8914, "lon": 20.8660 },
  "fetchedAt": "ISO timestamp",
  "current": {
    "temp": 18,
    "feelsLike": 17,
    "humidity": 65,
    "windSpeed": 15,
    "windDirection": 180,
    "precipitation": 0,
    "weatherCode": 1,
    "description": "Mainly clear",
    "visibility": 10,
    "uvIndex": 4
  },
  "forecast": [],
  "alerts": [],
  "source": "open-meteo"
}
```

## Alert Triggers
- Wind speed > 50 km/h → STRONG_WIND
- Wind speed > 80 km/h → EXTREME_WIND
- Weather code 95-99 → THUNDERSTORM
- Visibility < 1km → LOW_VISIBILITY

## Usage
```bash
node skills/weather-monitor/skill.js --test --location "Mitrovica"
```
