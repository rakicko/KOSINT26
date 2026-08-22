'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const axios = require('axios');

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function classifyMagnitude(mag) {
  if (mag >= 7.0) return { severity: 'critical', label: 'Major', color: '#f87171' };
  if (mag >= 5.0) return { severity: 'high',     label: 'Moderate', color: '#fb923c' };
  if (mag >= 3.0) return { severity: 'medium',   label: 'Minor', color: '#fbbf24' };
  return                 { severity: 'low',      label: 'Micro', color: '#34d399'  };
}

async function geocode(location) {
  const res = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: { q: location, format: 'json', limit: 1 },
    headers: { 'User-Agent': 'Sentinel-Dashboard/1.0' }, timeout: 5000,
  });
  if (!res.data.length) throw new Error(`Cannot geocode ${location}`);
  return { lat: parseFloat(res.data[0].lat), lon: parseFloat(res.data[0].lon) };
}

function getDemoData(location) {
   return {
     skill: 'earthquake-monitor', location, fetchedAt: new Date().toISOString(),
     earthquakes: [
       { id: 'demo-eq-1', magnitude: 2.4, depth: 10, place: '45km NE of Mitrovica', time: new Date(Date.now() - 7200000).toISOString(), distanceKm: 48, severity: 'low', label: 'Micro', color: '#34d399', lat: 43.3, lon: 21.5 },
       { id: 'demo-eq-2', magnitude: 3.8, depth: 25, place: '110km SE of Mitrovica', time: new Date(Date.now() - 18000000).toISOString(), distanceKm: 112, severity: 'medium', label: 'Minor', color: '#fbbf24', lat: 41.8, lon: 20.2 },
     ],
     summary: { total: 2, maxMagnitude: 3.8, alertLevel: 'medium' },
     source: 'demo',
   };
}

async function fetchEarthquakes({ location = 'Kosovo', lat = 42.6026, lon = 20.9030, radiusKm = 500, minMagnitude = 1.5 } = {}) {
  try {
    if (!lat || !lon) {
      try {
        ({ lat, lon } = await geocode(location));
      } catch (e) {
        lat = 42.6026;
        lon = 20.9030;
      }
    }

    const startTime = new Date(Date.now() - 7 * 24 * 3600000).toISOString().split('.')[0];
    const endTime = new Date().toISOString().split('.')[0];
    const maxradiusDegrees = Math.min(10, Math.max(1, Math.round(radiusKm / 111 * 10) / 10));

    let features = [];
    let sourceUsed = 'EMSC';

    // Primary: EMSC (European-Mediterranean Seismological Centre - official European regional seismic agency)
    try {
      const emscRes = await axios.get('https://seismicportal.eu/fdsnws/event/1/query', {
        params: {
          format: 'json',
          lat: lat,
          lon: lon,
          maxradius: maxradiusDegrees,
          minmag: minMagnitude,
          start: startTime,
          end: endTime,
          limit: 30
        },
        timeout: 8000
      });
      if (emscRes.data && Array.isArray(emscRes.data.features) && emscRes.data.features.length > 0) {
        features = emscRes.data.features;
        sourceUsed = 'EMSC';
      }
    } catch (e) {
      console.warn('[earthquake-monitor] EMSC query failed:', e.message);
    }

    // Fallback: USGS (United States Geological Survey)
    if (features.length === 0) {
      try {
        const usgsRes = await axios.get('https://earthquake.usgs.gov/fdsnws/event/1/query', {
          params: {
            format: 'geojson',
            latitude: lat,
            longitude: lon,
            maxradiuskm: radiusKm,
            minmagnitude: minMagnitude,
            starttime: startTime + 'Z',
            endtime: endTime + 'Z',
            orderby: 'time',
            limit: 30
          },
          timeout: 8000
        });
        if (usgsRes.data && Array.isArray(usgsRes.data.features) && usgsRes.data.features.length > 0) {
          features = usgsRes.data.features;
          sourceUsed = 'USGS';
        }
      } catch (e) {
        console.warn('[earthquake-monitor] USGS query failed:', e.message);
      }
    }

    const earthquakes = features.map(f => {
      const p = f.properties || {};
      const coords = (f.geometry && Array.isArray(f.geometry.coordinates)) ? f.geometry.coordinates : [p.lon || lon, p.lat || lat, p.depth || 10];
      const eqLon = typeof coords[0] === 'number' ? coords[0] : lon;
      const eqLat = typeof coords[1] === 'number' ? coords[1] : lat;
      const depth = typeof coords[2] === 'number' ? Math.round(Math.abs(coords[2])) : (p.depth ? Math.round(p.depth) : 10);
      const mag = typeof p.mag === 'number' ? +p.mag.toFixed(1) : 0;
      const cls = classifyMagnitude(mag);
      const distanceKm = Math.round(haversine(lat, lon, eqLat, eqLon));
      const place = p.flynn_region || p.place || 'Balkan Region';
      const timeIso = p.time ? new Date(p.time).toISOString() : new Date().toISOString();

      return {
        id: f.id || p.unid || `eq-${Math.random().toString(36).slice(2)}`,
        magnitude: mag,
        depth,
        place,
        time: timeIso,
        distanceKm,
        lat: eqLat,
        lon: eqLon,
        ...cls
      };
    });

    earthquakes.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    const maxMag = earthquakes.reduce((m, e) => Math.max(m, e.magnitude), 0);
    const alertLevel = maxMag >= 5.0 ? 'high' : (maxMag >= 3.0 ? 'medium' : 'low');

    return {
      skill: 'earthquake-monitor',
      location,
      fetchedAt: new Date().toISOString(),
      earthquakes,
      summary: { total: earthquakes.length, maxMagnitude: maxMag, alertLevel },
      source: sourceUsed
    };
  } catch (err) {
    console.warn('[earthquake-monitor] fetch failed:', err.message);
    return {
      skill: 'earthquake-monitor',
      location,
      fetchedAt: new Date().toISOString(),
      earthquakes: [],
      summary: { total: 0, maxMagnitude: 0, alertLevel: 'low' },
      source: 'EMSC / USGS',
      error: err.message
    };
  }
}

module.exports = { fetchEarthquakes };

if (require.main === module) {
   const args = process.argv.slice(2);
   const loc = args[args.indexOf('--location') + 1] || 'Mitrovica, Kosovo';
   fetchEarthquakes({ location: loc }).then(r => console.log(JSON.stringify(r, null, 2))).catch(console.error);
}
