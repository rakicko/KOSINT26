'use strict';

function genAlertId(module, key) {
  const cleanKey = String(key || '').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 40);
  return `alert-${module}-${cleanKey}`;
}

const THRESHOLDS = {
  news: { critical: 9, high: 7, medium: 5 },
  weather: {
    tempHigh: 38,
    tempLow: -10,
    windSevere: 60,
    windHigh: 45,
    severeTypes: ['THUNDERSTORM', 'EXTREME_WIND', 'BLIZZARD', 'HEAVY_STORM']
  },
  traffic: { high: 'anomaly', incidentCount: 3 },
  radiation: { critical: 0.50, high: 0.30, elevated: 0.20 },
  aqi: { extreme: 100, veryPoor: 80, poor: 60 },
  seismic: { critical: 5.0, high: 4.0, medium: 3.2, info: 3.0 },
  wildfire: { criticalDist: 100, highDist: 250, mediumDist: 500 },
  border: { criticalWait: 180, highWait: 60, mediumWait: 30, queueHigh: 500, queueMedium: 200 },
  telegram: { critical: 9, high: 7 }
};

/**
 * Evaluate intelligence modules and produce normalized alerts
 */
function evaluate({ news, weather, traffic, radiation, aqi, earthquakes, wildfire, borders, telegram, aviation, location }) {
  const alerts = [];
  const now = new Date().toISOString();

  // 1. News alerts
  if (news?.items && Array.isArray(news.items)) {
    news.items.forEach(item => {
      let severity = null;
      if (item.intensityScore >= THRESHOLDS.news.critical || item.threatLevel === 'critical') {
        severity = 'CRITICAL';
      } else if (item.intensityScore >= THRESHOLDS.news.high || item.isSecurityIncident) {
        severity = 'HIGH';
      } else if (item.intensityScore >= THRESHOLDS.news.medium && (item.category === 'security' || item.category === 'civil_unrest' || item.category === 'military')) {
        severity = 'MEDIUM';
      }
      if (severity) {
        const id = genAlertId('news', item.url || item.title);
        alerts.push({
          id,
          module: 'news',
          panelId: 'newsPanel',
          type: 'SECURITY_EVENT',
          severity,
          title: `[News] ${item.title}`,
          message: item.description || item.title,
          timestamp: item.publishedAt || now,
          source: item.source || 'News Intelligence',
          sourceUrl: item.url || '#',
          location: location || 'Kosovo',
          value: item.intensityScore,
          threshold: `score >= ${severity === 'CRITICAL' ? 9 : severity === 'HIGH' ? 7 : 5}`,
          isCached: false
        });
      }
    });
  }

  // 2. Weather alerts
  if (weather) {
    if (weather.alerts && Array.isArray(weather.alerts)) {
      weather.alerts.forEach(a => {
        const severity = (a.severity === 'high' || THRESHOLDS.weather.severeTypes.includes(a.type)) ? 'HIGH' : 'MEDIUM';
        alerts.push({
          id: genAlertId('weather', a.type),
          module: 'weather',
          panelId: 'weatherPanel',
          type: 'WEATHER_ALERT',
          severity,
          title: `[Weather] ${a.type.replace(/_/g, ' ')}`,
          message: a.message || a.description || 'Severe weather condition reported',
          timestamp: now,
          source: weather.source || 'Open-Meteo',
          location: location || 'Kosovo',
          isCached: Boolean(weather.isCached)
        });
      });
    }

    if (weather.current) {
      const { temp, windSpeed } = weather.current;
      if (typeof temp === 'number' && temp >= THRESHOLDS.weather.tempHigh) {
        alerts.push({
          id: genAlertId('weather', 'extreme_heat'),
          module: 'weather',
          panelId: 'weatherPanel',
          type: 'EXTREME_HEAT',
          severity: 'HIGH',
          title: `[Weather] Extreme Heat Warning (${temp}°C)`,
          message: `${temp}°C recorded in ${location || 'region'} — heat hazard`,
          timestamp: now,
          source: weather.source || 'Open-Meteo',
          location: location || 'Kosovo',
          value: temp,
          threshold: `>= ${THRESHOLDS.weather.tempHigh}°C`,
          isCached: Boolean(weather.isCached)
        });
      } else if (typeof temp === 'number' && temp <= THRESHOLDS.weather.tempLow) {
        alerts.push({
          id: genAlertId('weather', 'extreme_freeze'),
          module: 'weather',
          panelId: 'weatherPanel',
          type: 'EXTREME_FREEZE',
          severity: 'HIGH',
          title: `[Weather] Extreme Freeze Warning (${temp}°C)`,
          message: `${temp}°C recorded in ${location || 'region'} — frost hazard`,
          timestamp: now,
          source: weather.source || 'Open-Meteo',
          location: location || 'Kosovo',
          value: temp,
          threshold: `<= ${THRESHOLDS.weather.tempLow}°C`,
          isCached: Boolean(weather.isCached)
        });
      }

      if (typeof windSpeed === 'number' && windSpeed >= THRESHOLDS.weather.windSevere) {
        alerts.push({
          id: genAlertId('weather', 'gale_wind'),
          module: 'weather',
          panelId: 'weatherPanel',
          type: 'SEVERE_WIND',
          severity: 'HIGH',
          title: `[Weather] Severe Gale Wind Alert (${windSpeed} km/h)`,
          message: `Strong wind gusts up to ${windSpeed} km/h detected`,
          timestamp: now,
          source: weather.source || 'Open-Meteo',
          location: location || 'Kosovo',
          value: windSpeed,
          threshold: `>= ${THRESHOLDS.weather.windSevere} km/h`,
          isCached: Boolean(weather.isCached)
        });
      }
    }
  }

  // 3. Traffic alerts
  if (traffic) {
    if (traffic.anomalyDetected) {
      alerts.push({
        id: genAlertId('traffic', 'anomaly'),
        module: 'traffic',
        panelId: 'trafficPanel',
        type: 'TRAFFIC_ANOMALY',
        severity: 'HIGH',
        title: '[Traffic] Anomaly Detected',
        message: traffic.anomalySummary || 'Abnormal movement or major corridor disruption',
        timestamp: now,
        source: traffic.source || 'Traffic Intelligence',
        location: location || 'Kosovo',
        isCached: Boolean(traffic.isCached)
      });
    } else if (traffic.incidents && traffic.incidents.length >= THRESHOLDS.traffic.incidentCount) {
      alerts.push({
        id: genAlertId('traffic', 'multiple_incidents'),
        module: 'traffic',
        panelId: 'trafficPanel',
        type: 'TRAFFIC_CONGESTION',
        severity: 'MEDIUM',
        title: '[Traffic] Multiple Road Incidents',
        message: `${traffic.incidents.length} traffic incidents reported across key routes`,
        timestamp: now,
        source: traffic.source || 'Traffic Intelligence',
        location: location || 'Kosovo',
        value: traffic.incidents.length,
        threshold: `>= ${THRESHOLDS.traffic.incidentCount} incidents`,
        isCached: Boolean(traffic.isCached)
      });
    }
  }

  // 4. Radiation alerts
  if (radiation?.primary && radiation.status !== 'UNAVAILABLE') {
    const s = radiation.primary.status;
    const usvh = typeof radiation.primary.usvh === 'number' ? radiation.primary.usvh : 0;
    if (s === 'critical' || usvh >= THRESHOLDS.radiation.critical) {
      alerts.push({
        id: genAlertId('radiation', 'primary_critical'),
        module: 'radiation',
        panelId: 'radiationPanel',
        type: 'RADIATION_CRITICAL',
        severity: 'CRITICAL',
        title: '[Radiation] CRITICAL Level Detected',
        message: `${usvh} µSv/h detected at ${radiation.primary.sensorName || 'Kosovo Station'} — immediate hazard`,
        timestamp: now,
        source: radiation.source || 'EURDEP / Radiation Network',
        location: radiation.primary.sensorName || 'Kosovo',
        coordinates: { lat: radiation.primary.lat, lon: radiation.primary.lon },
        value: usvh,
        threshold: `>= ${THRESHOLDS.radiation.critical} µSv/h`,
        isCached: Boolean(radiation.isCached)
      });
    } else if (s === 'high' || usvh >= THRESHOLDS.radiation.high) {
      alerts.push({
        id: genAlertId('radiation', 'primary_high'),
        module: 'radiation',
        panelId: 'radiationPanel',
        type: 'RADIATION_HIGH',
        severity: 'HIGH',
        title: '[Radiation] High Level Detected',
        message: `${usvh} µSv/h detected at ${radiation.primary.sensorName || 'Kosovo Station'} — above threshold`,
        timestamp: now,
        source: radiation.source || 'EURDEP / Radiation Network',
        location: radiation.primary.sensorName || 'Kosovo',
        coordinates: { lat: radiation.primary.lat, lon: radiation.primary.lon },
        value: usvh,
        threshold: `>= ${THRESHOLDS.radiation.high} µSv/h`,
        isCached: Boolean(radiation.isCached)
      });
    } else if (s === 'elevated' || usvh >= THRESHOLDS.radiation.elevated) {
      alerts.push({
        id: genAlertId('radiation', 'primary_elevated'),
        module: 'radiation',
        panelId: 'radiationPanel',
        type: 'RADIATION_ELEVATED',
        severity: 'MEDIUM',
        title: '[Radiation] Elevated Level',
        message: `${usvh} µSv/h detected at ${radiation.primary.sensorName || 'Kosovo Station'} — monitoring advised`,
        timestamp: now,
        source: radiation.source || 'EURDEP / Radiation Network',
        location: radiation.primary.sensorName || 'Kosovo',
        coordinates: { lat: radiation.primary.lat, lon: radiation.primary.lon },
        value: usvh,
        threshold: `>= ${THRESHOLDS.radiation.elevated} µSv/h`,
        isCached: Boolean(radiation.isCached)
      });
    }

    // Neighbors
    (radiation.neighbors || []).forEach(n => {
      const nUsvh = typeof n.usvh === 'number' ? n.usvh : 0;
      if (n.status === 'critical' || nUsvh >= THRESHOLDS.radiation.critical) {
        alerts.push({
          id: genAlertId('radiation', `neighbor_${n.name}_critical`),
          module: 'radiation',
          panelId: 'radiationPanel',
          type: 'RADIATION_REGIONAL',
          severity: 'CRITICAL',
          title: `[Radiation] Regional CRITICAL — ${n.name}`,
          message: `${n.name} sensor: ${nUsvh} µSv/h`,
          timestamp: now,
          source: radiation.source || 'EURDEP',
          location: n.name,
          coordinates: { lat: n.lat, lon: n.lon },
          value: nUsvh,
          isCached: Boolean(radiation.isCached)
        });
      } else if (n.status === 'high' || nUsvh >= THRESHOLDS.radiation.high) {
        alerts.push({
          id: genAlertId('radiation', `neighbor_${n.name}_high`),
          module: 'radiation',
          panelId: 'radiationPanel',
          type: 'RADIATION_REGIONAL',
          severity: 'HIGH',
          title: `[Radiation] Regional High — ${n.name}`,
          message: `${n.name} sensor: ${nUsvh} µSv/h`,
          timestamp: now,
          source: radiation.source || 'EURDEP',
          location: n.name,
          coordinates: { lat: n.lat, lon: n.lon },
          value: nUsvh,
          isCached: Boolean(radiation.isCached)
        });
      }
    });
  }

  // 5. AQI alerts
  if (aqi?.current && aqi.status !== 'UNAVAILABLE') {
    const eaqi = typeof aqi.current.eaqi === 'number' ? aqi.current.eaqi : 0;
    const pm25 = aqi.current.pm25;
    const pm10 = aqi.current.pm10;
    const label = aqi.current.label || '';

    if (eaqi >= THRESHOLDS.aqi.extreme || label === 'Hazardous' || label === 'Extreme') {
      alerts.push({
        id: genAlertId('aqi', 'hazardous'),
        module: 'aqi',
        panelId: 'aqiPanel',
        type: 'AIR_QUALITY_CRITICAL',
        severity: 'CRITICAL',
        title: `[AQI] Hazardous Air Quality (EAQI ${eaqi})`,
        message: `PM2.5: ${pm25} µg/m³ · PM10: ${pm10} µg/m³ — hazardous health alert`,
        timestamp: now,
        source: aqi.source || 'Copernicus / Open-Meteo AQI',
        location: location || 'Kosovo',
        value: eaqi,
        threshold: `>= ${THRESHOLDS.aqi.extreme}`,
        isCached: Boolean(aqi.isCached)
      });
    } else if (eaqi >= THRESHOLDS.aqi.veryPoor || label === 'Very Poor' || label === 'Very Unhealthy') {
      alerts.push({
        id: genAlertId('aqi', 'very_poor'),
        module: 'aqi',
        panelId: 'aqiPanel',
        type: 'AIR_QUALITY_HIGH',
        severity: 'HIGH',
        title: `[AQI] Very Poor Air Quality (EAQI ${eaqi})`,
        message: `PM2.5: ${pm25} µg/m³ · Respiratory precautions recommended`,
        timestamp: now,
        source: aqi.source || 'Copernicus / Open-Meteo AQI',
        location: location || 'Kosovo',
        value: eaqi,
        threshold: `>= ${THRESHOLDS.aqi.veryPoor}`,
        isCached: Boolean(aqi.isCached)
      });
    } else if (eaqi >= THRESHOLDS.aqi.poor || label === 'Poor' || label === 'Unhealthy') {
      alerts.push({
        id: genAlertId('aqi', 'poor'),
        module: 'aqi',
        panelId: 'aqiPanel',
        type: 'AIR_QUALITY_MEDIUM',
        severity: 'MEDIUM',
        title: `[AQI] Unhealthy Air Quality (EAQI ${eaqi})`,
        message: `PM2.5: ${pm25} µg/m³ · Sensitive groups should limit outdoor exertion`,
        timestamp: now,
        source: aqi.source || 'Copernicus / Open-Meteo AQI',
        location: location || 'Kosovo',
        value: eaqi,
        threshold: `>= ${THRESHOLDS.aqi.poor}`,
        isCached: Boolean(aqi.isCached)
      });
    }
  }

  // 6. Seismic alerts
  if (earthquakes?.events && Array.isArray(earthquakes.events) && earthquakes.status !== 'UNAVAILABLE') {
    earthquakes.events.forEach(ev => {
      const mag = typeof ev.mag === 'number' ? ev.mag : 0;
      if (mag >= THRESHOLDS.seismic.info) {
        let severity = 'INFO';
        if (mag >= THRESHOLDS.seismic.critical) severity = 'CRITICAL';
        else if (mag >= THRESHOLDS.seismic.high) severity = 'HIGH';
        else if (mag >= THRESHOLDS.seismic.medium) severity = 'MEDIUM';

        alerts.push({
          id: genAlertId('earthquake', ev.id || `${ev.lat}_${ev.lon}_${mag}`),
          module: 'earthquake',
          panelId: 'earthquakePanel',
          type: 'SEISMIC_EVENT',
          severity,
          title: `[Seismic] M${mag.toFixed(1)} Earthquake · ${ev.place || 'Regional'}`,
          message: `Depth ${ev.depth || 10}km${ev.distanceKm ? ` · ${ev.distanceKm} km from Kosovo` : ''}`,
          timestamp: ev.time ? new Date(ev.time).toISOString() : now,
          source: earthquakes.source || 'USGS / EMSC',
          location: ev.place || 'Balkans',
          coordinates: { lat: ev.lat, lon: ev.lon },
          value: mag,
          threshold: `>= M${THRESHOLDS.seismic.info}`,
          isCached: Boolean(earthquakes.isCached)
        });
      }
    });
  }

  // 7. Wildfire alerts (only on real satellite detections)
  if (wildfire?.detections && Array.isArray(wildfire.detections) && wildfire.status === 'LIVE_DATA') {
    wildfire.detections.forEach(d => {
      const conf = typeof d.confidence === 'number' ? d.confidence : 50;
      const dist = typeof d.distanceKm === 'number' ? d.distanceKm : 999;
      if (conf >= 50) {
        let severity = 'MEDIUM';
        if (dist <= THRESHOLDS.wildfire.criticalDist) severity = 'CRITICAL';
        else if (dist <= THRESHOLDS.wildfire.highDist) severity = 'HIGH';

        const distText = dist < 999 ? `${dist} km from Kosovo` : 'Balkan region';
        alerts.push({
          id: genAlertId('wildfire', d.id || `${d.lat}_${d.lon}`),
          module: 'wildfire',
          panelId: 'wildfirePanel',
          type: 'WILDFIRE_DETECTION',
          severity,
          title: `[Wildfire] ${dist <= THRESHOLDS.wildfire.criticalDist ? 'Proximate Wildfire' : 'Wildfire Detected'} (${distText})`,
          message: `${d.title || 'Thermal anomaly'} · Sat: ${d.satellite || 'VIIRS/MODIS'} · ${conf}% Conf`,
          timestamp: d.acq_date ? `${d.acq_date}T${(d.acq_time || '1200').padStart(4, '0').slice(0, 2)}:${(d.acq_time || '1200').padStart(4, '0').slice(2, 4)}:00Z` : now,
          source: wildfire.source || 'NASA Satellites',
          sourceUrl: d.sourceUrl || wildfire.sourceUrl || '#',
          location: d.title || `Lat: ${d.lat.toFixed(2)}, Lon: ${d.lon.toFixed(2)}`,
          coordinates: { lat: d.lat, lon: d.lon },
          value: conf,
          isCached: Boolean(wildfire.isCached || d.isCached)
        });
      }
    });
  }

  // 8. Border alerts
  if (borders?.crossings && Array.isArray(borders.crossings) && borders.status !== 'UNAVAILABLE') {
    borders.crossings.forEach(c => {
      const entryWait = c.entryWaitMin || 0;
      const exitWait = c.exitWaitMin || 0;
      const entryQ = c.entryQueueMeters || (c.entryCars ? c.entryCars * 8 : 0);
      const exitQ = c.exitQueueMeters || (c.exitCars ? c.exitCars * 8 : 0);
      const maxWait = Math.max(entryWait, exitWait);
      const maxQ = Math.max(entryQ, exitQ);

      if (maxWait >= THRESHOLDS.border.mediumWait || maxQ >= THRESHOLDS.border.queueMedium) {
        let severity = 'MEDIUM';
        if (maxWait >= THRESHOLDS.border.criticalWait) severity = 'CRITICAL';
        else if (maxWait >= THRESHOLDS.border.highWait || maxQ >= THRESHOLDS.border.queueHigh) severity = 'HIGH';

        const dir = entryWait >= exitWait ? 'ENTRY' : 'EXIT';
        const waitVal = dir === 'ENTRY' ? entryWait : exitWait;
        const qVal = dir === 'ENTRY' ? entryQ : exitQ;
        const carsVal = dir === 'ENTRY' ? c.entryCars : c.exitCars;
        const qStr = qVal > 0 ? `Queue: ${qVal}m` : (carsVal ? `Queue: ${carsVal} cars` : 'Heavy congestion');

        alerts.push({
          id: genAlertId('border', `${c.id || c.name}_${dir.toLowerCase()}`),
          module: 'border',
          panelId: 'borderPanel',
          type: 'BORDER_DELAY',
          severity,
          title: `[Border] ${c.name} ${dir} · ${waitVal} min wait`,
          message: `${qStr} · Substantial delay at crossing point`,
          timestamp: borders.updatedAt || now,
          source: borders.source || 'Border Monitor (Nakordoni/QKMK)',
          location: c.name,
          coordinates: { lat: c.lat, lon: c.lon },
          value: waitVal,
          threshold: `>= ${THRESHOLDS.border.mediumWait} min`,
          isCached: Boolean(borders.isCached || c.isCached)
        });
      }
    });
  }

  // 9. Telegram alerts
  if (telegram?.posts && Array.isArray(telegram.posts) && telegram.status !== 'UNAVAILABLE') {
    telegram.posts.forEach(p => {
      const score = typeof p.threatScore === 'number' ? p.threatScore : 0;
      if (score >= THRESHOLDS.telegram.high || p.isSecurityAlert) {
        const severity = score >= THRESHOLDS.telegram.critical ? 'CRITICAL' : 'HIGH';
        alerts.push({
          id: genAlertId('telegram', `${p.channel}_${p.id}`),
          module: 'telegram',
          panelId: 'telegramPanel',
          type: 'TELEGRAM_INTEL',
          severity,
          title: `[Telegram @${p.channel}] Intelligence Alert`,
          message: p.text ? p.text.slice(0, 140) : 'Security-relevant channel publication',
          timestamp: p.date ? new Date(p.date * 1000).toISOString() : now,
          source: `@${p.channel} (Telegram)`,
          location: location || 'Kosovo',
          value: score,
          threshold: `>= ${THRESHOLDS.telegram.high}`,
          isCached: Boolean(telegram.isCached)
        });
      }
    });
  }

  return {
    skill: 'alert-engine',
    alerts,
    hasNewAlerts: alerts.length > 0,
    evaluatedAt: now
  };
}

module.exports = { evaluate, THRESHOLDS, genAlertId };

if (require.main === module) {
  const testData = {
    location: 'Kosovo',
    news: { items: [{ intensityScore: 8, title: 'Security incident in northern border', description: 'Patrol dispatched', category: 'security' }] },
    weather: { alerts: [{ type: 'THUNDERSTORM', severity: 'high', message: 'Severe storm incoming' }] },
    traffic: { anomalyDetected: true, anomalySummary: 'Road blocked near Merdare', anomalyType: 'blockade' },
    radiation: { primary: { usvh: 0.12, status: 'normal', sensorName: 'Prishtina' }, neighbors: [] },
    aqi: { current: { eaqi: 72, pm25: 35, pm10: 50, label: 'Unhealthy' } },
    earthquakes: { events: [{ id: 'eq-1', mag: 4.2, place: 'North Macedonia', depth: 10, distanceKm: 85 }] },
    wildfire: { status: 'LIVE_DATA', count: 1, detections: [{ id: 'wf-1', lat: 41.17, lon: 21.64, confidence: 95, distanceKm: 171, title: 'Wildfire in NMK' }] },
    borders: { status: 'LIVE_DATA', crossings: [{ id: 'merdare', name: 'Merdarë', entryWaitMin: 465, exitWaitMin: 40, entryCars: 90 }] }
  };
  console.log(JSON.stringify(evaluate(testData), null, 2));
}
