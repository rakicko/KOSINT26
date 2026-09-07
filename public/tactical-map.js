/**
 * World Monitor-Inspired Tactical Map Layers & Threat Range Rings Module
 * Derived from World Monitor map/layers.ts and military-layer.ts architecture.
 * 
 * Provides:
 * - Geodesic Threat Range Rings (1 km inner incident zone & 3 km outer tactical cordon)
 * - MIL-STD Tactical Marker categorizations (Diamond: Kinetic, Square: Base, Circle: Checkpoint)
 * - In-memory persistent Tactical Layer State manager (Incidents, Checkpoints, Bases)
 */

'use strict';

const R_EARTH_KM = 6371.0;

// Kosovo Operational Theater Bounds [SW, NE]
const KOSOVO_OPERATIONAL_BOUNDS = {
  minLon: 19.8,
  maxLon: 21.9,
  minLat: 41.7,
  maxLat: 43.4
};

/**
 * Calculates geodesic Haversine distance in km between two coordinates [lon, lat]
 */
function haversineDistanceKm(coord1, coord2) {
  if (!coord1 || !coord2) return 0;
  const lon1 = Array.isArray(coord1) ? coord1[0] : (coord1.lon ?? coord1.lng ?? coord1.longitude);
  const lat1 = Array.isArray(coord1) ? coord1[1] : (coord1.lat ?? coord1.latitude);
  const lon2 = Array.isArray(coord2) ? coord2[0] : (coord2.lon ?? coord2.lng ?? coord2.longitude);
  const lat2 = Array.isArray(coord2) ? coord2[1] : (coord2.lat ?? coord2.latitude);

  if (typeof lon1 !== 'number' || typeof lat1 !== 'number' || typeof lon2 !== 'number' || typeof lat2 !== 'number') {
    return 0;
  }

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const rLat1 = lat1 * Math.PI / 180;
  const rLat2 = lat2 * Math.PI / 180;

  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R_EARTH_KM * c * 1000) / 1000;
}

/**
 * Checks if a coordinate is within the Kosovo operational zone
 */
function isPointInKosovoOperationalZone(coord) {
  if (!coord) return false;
  const lon = Array.isArray(coord) ? coord[0] : (coord.lon ?? coord.lng ?? coord.longitude);
  const lat = Array.isArray(coord) ? coord[1] : (coord.lat ?? coord.latitude);
  if (typeof lon !== 'number' || typeof lat !== 'number') return false;

  return (
    lon >= KOSOVO_OPERATIONAL_BOUNDS.minLon &&
    lon <= KOSOVO_OPERATIONAL_BOUNDS.maxLon &&
    lat >= KOSOVO_OPERATIONAL_BOUNDS.minLat &&
    lat <= KOSOVO_OPERATIONAL_BOUNDS.maxLat
  );
}

/**
 * Calculates geodesic range ring polygon coordinates for a given center and radius (km)
 */
function createRangeRingPolygon(centerLon, centerLat, radiusKm, steps = 64) {
  const dLat = (radiusKm / R_EARTH_KM) * (180 / Math.PI);
  const latRad = centerLat * Math.PI / 180;
  const cosLat = Math.cos(latRad);
  const dLon = cosLat > 0.0001 ? dLat / cosLat : dLat;

  const ring = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i * 2 * Math.PI) / steps;
    const pLon = centerLon + dLon * Math.cos(angle);
    const pLat = centerLat + dLat * Math.sin(angle);
    ring.push([Math.round(pLon * 1e6) / 1e6, Math.round(pLat * 1e6) / 1e6]);
  }
  return ring;
}

/**
 * Generates GeoJSON FeatureCollection containing concentric threat range rings:
 * - 1 km radius: Immediate Incident Zone
 * - 3 km radius: Tactical Caution / Perimeter Cordon
 */
function calculateThreatRangeRings(center, options = {}) {
  if (!center) return { type: 'FeatureCollection', features: [] };

  const centerLon = Array.isArray(center) ? center[0] : (center.lon ?? center.lng ?? center.longitude);
  const centerLat = Array.isArray(center) ? center[1] : (center.lat ?? center.latitude);

  if (typeof centerLon !== 'number' || typeof centerLat !== 'number') {
    return { type: 'FeatureCollection', features: [] };
  }

  const radii = Array.isArray(options.radii) ? options.radii : [1.0, 3.0];
  const steps = options.steps || 64;
  const rawSev = String(options.severity || 'critical').toUpperCase();
  const isCritical = rawSev === 'CRITICAL';
  const color = isCritical ? '#ef4444' : '#fb923c';

  const features = radii.map(radiusKm => {
    const isInner = radiusKm <= 1.5;
    const ringCoords = createRangeRingPolygon(centerLon, centerLat, radiusKm, steps);

    return {
      type: 'Feature',
      properties: {
        id: `threat-ring-${radiusKm}km-${centerLon.toFixed(4)}-${centerLat.toFixed(4)}`,
        radiusKm,
        type: isInner ? 'inner_immediate_zone' : 'outer_cordon_zone',
        zoneLabel: isInner ? `${radiusKm} km Immediate Incident Zone` : `${radiusKm} km Tactical Caution Cordon`,
        severity: rawSev,
        strokeColor: color,
        fillColor: isInner
          ? (isCritical ? 'rgba(239, 68, 68, 0.08)' : 'rgba(251, 146, 60, 0.08)')
          : (isCritical ? 'rgba(239, 68, 68, 0.03)' : 'rgba(251, 146, 60, 0.03)'),
        strokeWidth: isInner ? 2.0 : 1.2,
        dashArray: isInner ? [4, 3] : [2, 4],
        center: [centerLon, centerLat],
        timestamp: options.timestamp || new Date().toISOString()
      },
      geometry: {
        type: 'Polygon',
        coordinates: [ringCoords]
      }
    };
  });

  return {
    type: 'FeatureCollection',
    features
  };
}

/**
 * Categorizes an intelligence item into a MIL-STD-2525 inspired tactical symbol:
 * - 'diamond': Kinetic / active field incident (shooting, arrest, explosion, raid)
 * - 'square': Installation / strategic facility / military base
 * - 'circle': Checkpoint / border crossing / transit point
 */
function categorizeMilStdSymbol(item) {
  if (!item) return 'diamond';

  const type = String(item.type || item.category || '').toLowerCase();
  const title = String(item.title || item.name || '').toLowerCase();
  const desc = String(item.description || item.summary || '').toLowerCase();
  const text = `${title} ${desc}`;

  // 1. Checkpoint / Border Crossing -> Circle
  if (
    type === 'checkpoint' ||
    type === 'border' ||
    type === 'border_crossing' ||
    /\b(checkpoint|border|prelaz|vendkalim|pika kufitare|gate \d+|granica|qkmk)\b/i.test(text)
  ) {
    return 'circle';
  }

  // 2. Military Base / Strategic Installation -> Square
  if (
    type === 'military_base' ||
    type === 'installation' ||
    type === 'facility' ||
    type === 'outpost' ||
    /\b(camp bondsteel|film city|nothing hill|novo selo|villaggio italia|base|kasarna|stacion|headquarters|komanda|depot|barracks)\b/i.test(text)
  ) {
    return 'square';
  }

  // 3. Kinetic Incident / Threat Alert -> Diamond (MIL-STD Hostile/Incident)
  const sev = String(item.severity || '').toLowerCase();
  if (
    sev === 'critical' ||
    sev === 'high' ||
    type === 'operational' ||
    /\b(pucnjav|të shtëna|shooting|uhapš|arrest|bastisje|pretres|raid|eksploz|shpërthim|explosion|deton|clash|attack|armed|armë|oruz|drone|barikad)\b/i.test(text)
  ) {
    return 'diamond';
  }

  return 'diamond';
}

/**
 * In-memory persistent Tactical Layer State Manager
 */
const tacticalLayerState = {
  incidents: false,
  checkpoints: false,
  bases: false
};

function getTacticalLayerState() {
  return { ...tacticalLayerState };
}

function setTacticalLayerVisibility(layerId, isVisible) {
  const normId = String(layerId || '').toLowerCase();
  const key = normId === 'border' ? 'checkpoints' : (normId === 'kfor' ? 'bases' : normId);

  if (key in tacticalLayerState) {
    tacticalLayerState[key] = !!isVisible;
  }
  return { ...tacticalLayerState };
}

function isTacticalLayerVisible(layerId) {
  const normId = String(layerId || '').toLowerCase();
  const key = normId === 'border' ? 'checkpoints' : (normId === 'kfor' ? 'bases' : normId);
  return tacticalLayerState[key] !== false;
}

/**
 * Creates a MIL-STD DOM Marker Element with concentric tactical radar pulse rings
 */
function createTacticalThreatMarkerElement(item, options = {}) {
  const sev = (options.severity || item.severity || 'high').toUpperCase();
  const symbol = categorizeMilStdSymbol(item);
  const color = sev === 'CRITICAL' ? '#ef4444' : '#fb923c';

  const container = document.createElement('div');
  container.className = `tactical-threat-marker-wrap sev-${sev.toLowerCase()} symbol-${symbol}`;
  container.setAttribute('title', `${item.title || item.name || 'Tactical Event'} [${sev}]`);

  // Pulsing Radar Rings (1 km and 3 km indicators) for critical / high threats
  if (sev === 'CRITICAL' || sev === 'HIGH') {
    const ring1km = document.createElement('div');
    ring1km.className = 'tactical-radar-ring ring-1km';
    ring1km.setAttribute('title', '1 km Immediate Incident Zone');
    container.appendChild(ring1km);

    const ring3km = document.createElement('div');
    ring3km.className = 'tactical-radar-ring ring-3km';
    ring3km.setAttribute('title', '3 km Tactical Cordon');
    container.appendChild(ring3km);
  }

  // MIL-STD Tactical Icon
  const iconWrap = document.createElement('div');
  iconWrap.className = 'mil-std-symbol';

  if (symbol === 'diamond') {
    const diamond = document.createElement('div');
    diamond.className = 'mil-std-diamond';
    const inner = document.createElement('div');
    inner.className = 'mil-std-diamond-inner';
    diamond.appendChild(inner);
    iconWrap.appendChild(diamond);
  } else if (symbol === 'square') {
    const square = document.createElement('div');
    square.className = 'mil-std-square';
    square.innerHTML = '⛫';
    iconWrap.appendChild(square);
  } else {
    const circle = document.createElement('div');
    circle.className = 'mil-std-circle';
    circle.innerHTML = '🛑';
    iconWrap.appendChild(circle);
  }

  container.appendChild(iconWrap);
  return container;
}

// Universal Exports (ESM + CommonJS + Window)
export {
  haversineDistanceKm,
  isPointInKosovoOperationalZone,
  createRangeRingPolygon,
  calculateThreatRangeRings,
  categorizeMilStdSymbol,
  getTacticalLayerState,
  setTacticalLayerVisibility,
  isTacticalLayerVisible,
  createTacticalThreatMarkerElement,
  KOSOVO_OPERATIONAL_BOUNDS
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    haversineDistanceKm,
    isPointInKosovoOperationalZone,
    createRangeRingPolygon,
    calculateThreatRangeRings,
    categorizeMilStdSymbol,
    getTacticalLayerState,
    setTacticalLayerVisibility,
    isTacticalLayerVisible,
    createTacticalThreatMarkerElement,
    KOSOVO_OPERATIONAL_BOUNDS
  };
}

if (typeof window !== 'undefined') {
  const tacticalMapObj = {
    haversineDistanceKm,
    isPointInKosovoOperationalZone,
    createRangeRingPolygon,
    calculateThreatRangeRings,
    categorizeMilStdSymbol,
    getTacticalLayerState,
    setTacticalLayerVisibility,
    isTacticalLayerVisible,
    createTacticalThreatMarkerElement,
    KOSOVO_OPERATIONAL_BOUNDS
  };
  window.TacticalMap = tacticalMapObj;
  window.tacticalMap = tacticalMapObj;
}
