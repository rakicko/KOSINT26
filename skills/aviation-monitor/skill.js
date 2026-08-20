'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const axios = require('axios');

// Balkan geographic bounding box
const BALKAN_BOUNDS = {
  minLat: 39.0,
  maxLat: 46.5,
  minLon: 14.0,
  maxLon: 25.5
};

// In-memory cache
let aviationCache = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 15 * 1000; // 15 seconds

// Military callsign prefixes & keywords
const MILITARY_PREFIXES = [
  'NATO', 'RFR', 'RRR', 'ASY', 'CFC', 'BAF', 'GAF', 'FAF', 'IAM', 'HAF',
  'THK', 'TUAF', 'ROF', 'SVF', 'AME', 'PLF', 'HRZ', 'SAF', 'NVF', 'DAF',
  'NOW', 'FNF', 'CEF', 'UAF', 'RFF', 'IRF'
];

const MILITARY_TACTICAL = [
  'VIPER', 'FORTE', 'JAKE', 'HOMER', 'REDEYE', 'LAGR', 'NCHO', 'TITAN',
  'VALOR', 'DUKE', 'EVAC', 'BART', 'COBRA', 'HAWK', 'REAPER', 'HERKY',
  'KNIFE', 'TOPCAT', 'TALON', 'GHOST', 'BOXER', 'SWIFT', 'SPAR', 'SAM',
  'EXEC', 'BOMBER', 'DRAG', 'RCH', 'REACH', 'PAT', 'MOOSE', 'MAKO'
];

const MILITARY_TYPES = new Set([
  'C17', 'C130', 'C30J', 'A400', 'KC30', 'K35R', 'E3TF', 'E3CF', 'EUFI',
  'F16', 'F18', 'F35', 'MG29', 'SU27', 'SU30', 'SU35', 'JAS39', 'TOR',
  'B52', 'B1', 'B2', 'U2', 'RC135', 'RQ4', 'MQ9', 'P8', 'V22', 'V280',
  'UH60', 'AH64', 'CH47', 'MI8', 'MI24', 'MI17', 'IL76', 'AN12', 'AN26',
  'C295', 'CN35', 'T129', 'TB2', 'AKNC'
]);

// Private / Executive Jet operators & types
const PRIVATE_JET_OPERATORS = [
  'NJE', 'EJA', 'VJT', 'FYG', 'TAG', 'LXA', 'AHO', 'GAC', 'GES', 'SWT',
  'JME', 'SAZ', 'PNC', 'AXE', 'VPC', 'IJM', 'ECA', 'TYW', 'LWG', 'SCR',
  'XRO', 'JUP', 'VMP', 'AOJ', 'JDI', 'EJM', 'PEG', 'VVV', 'EDC', 'FJO'
];

const PRIVATE_JET_TYPES = new Set([
  'GLF4', 'GLF5', 'GLF6', 'G150', 'G280', 'G650', 'GA5C', 'GA6C', 'GLEX',
  'GL5T', 'GL7T', 'CL30', 'CL35', 'CL60', 'CL64', 'CL65', 'LJ35', 'LJ45',
  'LJ60', 'LJ75', 'FA7X', 'FA8X', 'FA50', 'F2TH', 'F900', 'FA6X', 'C510',
  'C525', 'C550', 'C560', 'C56X', 'C680', 'C700', 'C750', 'E50P', 'E55P',
  'E35L', 'E550', 'PRM1', 'H25B', 'BE40', 'HA4T', 'HDJT', 'PC24', 'EA50',
  'SF50'
]);

// Commercial Airline ICAO prefixes
const COMMERCIAL_AIRLINES = [
  'WZZ', 'RYR', 'THY', 'DLH', 'AUA', 'SXS', 'PGT', 'ASL', 'EZY', 'BAW',
  'AFR', 'KLM', 'SAS', 'FIN', 'SWR', 'TAP', 'LOT', 'QTR', 'UAE', 'ETD',
  'MSR', 'TAR', 'RAM', 'FDB', 'JZR', 'AEE', 'ROT', 'LZB', 'CTN', 'MGX',
  'EXS', 'TOM', 'TVS', 'VOE', 'TRA', 'VLG', 'IBE', 'NOZ', 'DLA', 'DAT',
  'WUK', 'RUK', 'BCS', 'FDX', 'UPS', 'BOX', 'GEC', 'CLX', 'EJU', 'EZS',
  'WMT', 'SEH', 'TAY', 'NVR', 'ISR', 'ETH', 'SVA', 'KAC', 'RJA', 'MEA',
  'GEO', 'AFL', 'SBI', 'BLX', 'VKG', 'ITY', 'EVE', 'EWG', 'CFG', 'BTI'
];

const COMMERCIAL_TYPES = new Set([
  'A318', 'A319', 'A320', 'A321', 'A20N', 'A21N', 'A330', 'A332', 'A333',
  'A338', 'A339', 'A340', 'A343', 'A346', 'A350', 'A359', 'A35K', 'A380',
  'A388', 'B737', 'B738', 'B739', 'B38M', 'B39M', 'B744', 'B748', 'B752',
  'B753', 'B762', 'B763', 'B764', 'B772', 'B773', 'B77L', 'B77W', 'B788',
  'B789', 'B78X', 'E170', 'E190', 'E195', 'E290', 'E295', 'CRJ9', 'CRJX',
  'DH8D', 'AT72', 'AT76', 'AT45', 'BCS1', 'BCS3', 'SU95', 'MD11', 'MD80'
]);

// General Aviation / Small Piston types
const GA_TYPES = new Set([
  'C150', 'C152', 'C172', 'C182', 'C206', 'C208', 'C210', 'PA28', 'PA34',
  'PA38', 'PA44', 'PA46', 'DA20', 'DA40', 'DA42', 'DA62', 'SR20', 'SR22',
  'BE33', 'BE36', 'BE58', 'BE76', 'BE9L', 'B200', 'B350', 'PC12', 'TBM7',
  'TBM8', 'TBM9', 'P28A', 'P28R', 'P32R', 'M20P', 'M20T', 'AA5', 'RV6',
  'RV7', 'RV8', 'RV9', 'RV10', 'RV12', 'ULAC', 'GLID', 'GYRO', 'P208',
  'P06T', 'DV20', 'AT3'
]);

/**
 * Robust, explainable aircraft classification
 */
function classifyAircraft({ callsign = '', typeCode = '', squawk = '', dbFlags = 0, emitterCategory = 0 }) {
  const cs = (callsign || '').toUpperCase().trim();
  const type = (typeCode || '').toUpperCase().trim();

  // 1. Military Check
  if (dbFlags === 1 || (dbFlags & 1) === 1) {
    return { category: 'military', reason: 'ADS-B database military flag', confidence: 0.98 };
  }
  if (type && MILITARY_TYPES.has(type)) {
    return { category: 'military', reason: `Military airframe type (${type})`, confidence: 0.95 };
  }
  if (cs) {
    for (const prefix of MILITARY_PREFIXES) {
      if (cs.startsWith(prefix)) {
        return { category: 'military', reason: `Military callsign prefix (${prefix})`, confidence: 0.92 };
      }
    }
    for (const tac of MILITARY_TACTICAL) {
      if (cs.startsWith(tac)) {
        return { category: 'military', reason: `Military tactical callsign (${tac})`, confidence: 0.90 };
      }
    }
  }
  if (squawk === '7777') {
    return { category: 'military', reason: 'Military intercept squawk (7777)', confidence: 0.85 };
  }

  // 2. Private Jet Check
  if (type && PRIVATE_JET_TYPES.has(type)) {
    return { category: 'private_jet', reason: `Executive business jet type (${type})`, confidence: 0.92 };
  }
  if (cs) {
    for (const op of PRIVATE_JET_OPERATORS) {
      if (cs.startsWith(op)) {
        return { category: 'private_jet', reason: `Business jet operator prefix (${op})`, confidence: 0.90 };
      }
    }
  }

  // 3. Commercial Airliner Check
  if (type && COMMERCIAL_TYPES.has(type)) {
    return { category: 'commercial', reason: `Commercial airliner type (${type})`, confidence: 0.92 };
  }
  if (cs) {
    for (const air of COMMERCIAL_AIRLINES) {
      if (cs.startsWith(air)) {
        return { category: 'commercial', reason: `Commercial airline prefix (${air})`, confidence: 0.90 };
      }
    }
    // Generic airline callsign shape: 3 letters followed by numbers (e.g., AZA123, JAF54M)
    if (/^[A-Z]{3}[0-9]{1,4}[A-Z0-9]?$/i.test(cs) && !cs.startsWith('N')) {
      return { category: 'commercial', reason: 'Standard commercial flight number pattern', confidence: 0.75 };
    }
  }

  // 4. Private / General Aviation Check
  if (type && GA_TYPES.has(type)) {
    return { category: 'private', reason: `Light general aviation type (${type})`, confidence: 0.88 };
  }
  if (emitterCategory === 2 || emitterCategory === 3) {
    return { category: 'private', reason: 'Light/small emitter category', confidence: 0.70 };
  }
  // Registration format callsigns (e.g. YU-XYZ, N12345, D-EXYZ, ZA-XYZ)
  if (/^(N[0-9]{1,5}[A-Z]{0,2}|[A-Z0-9]{1,3}-[A-Z0-9]{2,5})$/i.test(cs)) {
    return { category: 'private', reason: 'Civil aircraft registration callsign', confidence: 0.80 };
  }

  // 5. Unknown
  return { category: 'unknown', reason: 'Insufficient metadata for definitive classification', confidence: 0.30 };
}

/**
 * Fetch from OpenSky Network
 */
async function fetchFromOpenSky() {
  const { minLat, maxLat, minLon, maxLon } = BALKAN_BOUNDS;
  const url = `https://opensky-network.org/api/states/all?lamin=${minLat}&lomin=${minLon}&lamax=${maxLat}&lomax=${maxLon}`;

  const auth = {};
  if (process.env.OPENSKY_USERNAME && process.env.OPENSKY_PASSWORD) {
    auth.username = process.env.OPENSKY_USERNAME;
    auth.password = process.env.OPENSKY_PASSWORD;
  }

  const res = await axios.get(url, {
    auth: Object.keys(auth).length > 0 ? auth : undefined,
    headers: { 'User-Agent': 'SENTINEL-Intel/1.0' },
    timeout: 8000
  });

  if (!res.data || !Array.isArray(res.data.states)) {
    return [];
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const aircraftList = [];

  for (const s of res.data.states) {
    const icao24 = (s[0] || '').toLowerCase().trim();
    const callsign = (s[1] || '').trim();
    const originCountry = s[2];
    const timePosition = s[3];
    const lastContact = s[4] || timePosition || nowSec;
    const lon = s[5];
    const lat = s[6];
    const baroAltitude = s[7]; // meters
    const onGround = !!s[8];
    const velocity = s[9]; // m/s
    const trueTrack = s[10]; // degrees
    const verticalRate = s[11]; // m/s
    const geoAltitude = s[13]; // meters
    const squawk = s[14];
    const emitterCategory = s[17] || 0;

    // Strict validation
    if (!icao24 || typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
      continue;
    }
    if (lat < minLat || lat > maxLat || lon < minLon || lon > maxLon) {
      continue;
    }
    // Drop stale observations older than 5 minutes (300s)
    if (nowSec - lastContact > 300) {
      continue;
    }

    const classification = classifyAircraft({
      callsign,
      squawk,
      emitterCategory
    });

    const alt = typeof baroAltitude === 'number' && !isNaN(baroAltitude) ? baroAltitude : (typeof geoAltitude === 'number' ? geoAltitude : 0);

    aircraftList.push({
      id: `aircraft-${icao24}-${lastContact}`,
      icao24,
      callsign: callsign || null,
      category: classification.category,
      classificationReason: classification.reason,
      confidence: classification.confidence,
      latitude: lat,
      longitude: lon,
      altitude: alt ? Math.round(alt) : null,
      altitudeFt: alt ? Math.round(alt * 3.28084) : null,
      speed: typeof velocity === 'number' && !isNaN(velocity) ? Math.round(velocity * 3.6) : null,
      speedKts: typeof velocity === 'number' && !isNaN(velocity) ? Math.round(velocity * 1.94384) : null,
      heading: typeof trueTrack === 'number' && !isNaN(trueTrack) ? Math.round(trueTrack) : null,
      verticalRate: typeof verticalRate === 'number' && !isNaN(verticalRate) ? +verticalRate.toFixed(1) : null,
      onGround,
      squawk: squawk || null,
      originCountry: originCountry || null,
      aircraftType: null,
      aircraftDesc: null,
      registration: null,
      operator: null,
      origin: null,
      destination: null,
      timestamp: new Date(lastContact * 1000).toISOString(),
      source: 'OpenSky Network'
    });
  }

  return aircraftList;
}

/**
 * Fetch from Open Data ADS-B (ADSB.fi)
 */
async function fetchFromAdsbFi() {
  const lat = 42.6026;
  const lon = 20.9030;
  const dist = 250; // nm covers Balkans
  const url = `https://opendata.adsb.fi/api/v2/lat/${lat}/lon/${lon}/dist/${dist}`;

  const res = await axios.get(url, {
    headers: { 'User-Agent': 'SENTINEL-Intel/1.0' },
    timeout: 8000
  });

  if (!res.data || !Array.isArray(res.data.aircraft)) {
    return [];
  }

  const { minLat, maxLat, minLon, maxLon } = BALKAN_BOUNDS;
  const nowSec = Math.floor(Date.now() / 1000);
  const aircraftList = [];

  for (const ac of res.data.aircraft) {
    const icao24 = (ac.hex || '').toLowerCase().trim();
    const callsign = (ac.flight || '').trim();
    const acLat = ac.lat;
    const acLon = ac.lon;
    const altBaro = ac.alt_baro === 'ground' ? 0 : (typeof ac.alt_baro === 'number' ? ac.alt_baro * 0.3048 : null);
    const speedKts = typeof ac.gs === 'number' ? ac.gs : null;
    const heading = typeof ac.track === 'number' ? ac.track : (typeof ac.true_heading === 'number' ? ac.true_heading : null);
    const vRate = typeof ac.baro_rate === 'number' ? +(ac.baro_rate * 0.00508).toFixed(1) : null;
    const onGround = ac.alt_baro === 'ground';
    const typeCode = ac.t || '';
    const desc = ac.desc || null;
    const registration = ac.r || null;
    const squawk = ac.squawk || null;
    const dbFlags = ac.dbFlags || 0;
    const seen = typeof ac.seen === 'number' ? ac.seen : 0;

    // Strict validation
    if (!icao24 || typeof acLat !== 'number' || typeof acLon !== 'number' || isNaN(acLat) || isNaN(acLon)) {
      continue;
    }
    if (acLat < minLat || acLat > maxLat || acLon < minLon || acLon > maxLon) {
      continue;
    }
    if (seen > 300) {
      continue;
    }

    const classification = classifyAircraft({
      callsign,
      typeCode,
      squawk,
      dbFlags
    });

    const timestampSec = nowSec - Math.round(seen);

    aircraftList.push({
      id: `aircraft-${icao24}-${timestampSec}`,
      icao24,
      callsign: callsign || null,
      category: classification.category,
      classificationReason: classification.reason,
      confidence: classification.confidence,
      latitude: acLat,
      longitude: acLon,
      altitude: altBaro !== null ? Math.round(altBaro) : null,
      altitudeFt: typeof ac.alt_baro === 'number' ? Math.round(ac.alt_baro) : (altBaro !== null ? Math.round(altBaro * 3.28084) : null),
      speed: speedKts !== null ? Math.round(speedKts * 1.852) : null,
      speedKts: speedKts !== null ? Math.round(speedKts) : null,
      heading: heading !== null ? Math.round(heading) : null,
      verticalRate: vRate,
      onGround,
      squawk,
      originCountry: null,
      aircraftType: typeCode || null,
      aircraftDesc: desc || null,
      registration,
      operator: null,
      origin: null,
      destination: null,
      timestamp: new Date(timestampSec * 1000).toISOString(),
      source: 'Open ADS-B Network'
    });
  }

  return aircraftList;
}

/**
 * Main skill entry point: queries sources and creates an enriched, deduplicated Balkan aircraft picture
 */
async function fetchAviation({ forceRefresh = false } = {}) {
  // Check cache
  if (!forceRefresh && aviationCache && (Date.now() - lastFetchTime < CACHE_TTL_MS)) {
    return { ...aviationCache, isCached: true };
  }

  try {
    const [openSkyResult, adsbResult] = await Promise.allSettled([
      fetchFromOpenSky(),
      fetchFromAdsbFi()
    ]);

    const openSkyAircraft = openSkyResult.status === 'fulfilled' ? openSkyResult.value : [];
    const adsbAircraft = adsbResult.status === 'fulfilled' ? adsbResult.value : [];

    if (openSkyAircraft.length === 0 && adsbAircraft.length === 0) {
      const errorMsg = openSkyResult.reason?.message || adsbResult.reason?.message || 'ADS-B tracking services are unreachable.';
      return {
        skill: 'aviation-monitor',
        status: 'UNAVAILABLE',
        source: 'OpenSky Network & Open ADS-B',
        updatedAt: new Date().toISOString(),
        error: 'SERVICE_UNAVAILABLE',
        message: errorMsg,
        count: 0,
        summary: {
          commercial: 0,
          private: 0,
          privateJets: 0,
          military: 0,
          unknown: 0
        },
        aircraft: [],
        isCached: false
      };
    }

    // Merge and enrich aircraft
    const aircraftMap = new Map();

    // 1. Add ADS-B aircraft (rich metadata: type, registration, desc, dbFlags)
    for (const ac of adsbAircraft) {
      aircraftMap.set(ac.icao24, ac);
    }

    // 2. Add / Merge OpenSky aircraft
    for (const ac of openSkyAircraft) {
      if (aircraftMap.has(ac.icao24)) {
        const existing = aircraftMap.get(ac.icao24);
        if (!existing.originCountry && ac.originCountry) existing.originCountry = ac.originCountry;
        if (!existing.callsign && ac.callsign) {
          existing.callsign = ac.callsign;
          const reclass = classifyAircraft({ callsign: ac.callsign, typeCode: existing.aircraftType });
          existing.category = reclass.category;
          existing.classificationReason = reclass.reason;
          existing.confidence = reclass.confidence;
        }
      } else {
        aircraftMap.set(ac.icao24, ac);
      }
    }

    const unifiedAircraft = Array.from(aircraftMap.values());

    // Compute category counts
    const summary = {
      commercial: 0,
      private: 0,
      privateJets: 0,
      military: 0,
      unknown: 0
    };

    unifiedAircraft.forEach(ac => {
      if (ac.category === 'commercial') summary.commercial++;
      else if (ac.category === 'private') summary.private++;
      else if (ac.category === 'private_jet') summary.privateJets++;
      else if (ac.category === 'military') summary.military++;
      else summary.unknown++;
    });

    const status = unifiedAircraft.length > 0 ? 'LIVE_DATA' : 'NO_AIRCRAFT';

    const result = {
      skill: 'aviation-monitor',
      status,
      source: 'OpenSky Network & Open ADS-B',
      updatedAt: new Date().toISOString(),
      count: unifiedAircraft.length,
      summary,
      aircraft: unifiedAircraft,
      isCached: false
    };

    // Save to cache
    aviationCache = result;
    lastFetchTime = Date.now();

    return result;
  } catch (err) {
    console.error('[aviation-monitor] Unexpected error:', err.message);
    return {
      skill: 'aviation-monitor',
      status: 'UNAVAILABLE',
      source: 'OpenSky Network & Open ADS-B',
      updatedAt: new Date().toISOString(),
      error: 'UNEXPECTED_ERROR',
      message: err.message || 'Failed to process aviation intelligence.',
      count: 0,
      summary: {
        commercial: 0,
        private: 0,
        privateJets: 0,
        military: 0,
        unknown: 0
      },
      aircraft: [],
      isCached: false
    };
  }
}

module.exports = {
  fetchAviation,
  classifyAircraft,
  BALKAN_BOUNDS
};

if (require.main === module) {
  fetchAviation().then(res => {
    console.log('Status:', res.status);
    console.log('Source:', res.source);
    console.log('Total Count:', res.count);
    console.log('Summary:', res.summary);
    if (res.aircraft.length > 0) {
      console.log('Sample Aircraft:', JSON.stringify(res.aircraft[0], null, 2));
    }
  }).catch(console.error);
}
