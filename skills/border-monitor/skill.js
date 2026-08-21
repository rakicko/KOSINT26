'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Authoritative static geographic coordinate metadata for Kosovo border crossings.
 * Coordinates are kept separate from live waiting time data.
 */
const BORDER_LOCATIONS = {
  'merdare': {
    id: 'border-merdare',
    name: 'Merdarë / Merdare',
    shortName: 'Merdare',
    neighborCountry: 'Serbia',
    lat: 42.9439,
    lon: 21.2464
  },
  'jarinje': {
    id: 'border-jarinje',
    name: 'Jarinjë / Jarinje',
    shortName: 'Jarinje',
    neighborCountry: 'Serbia',
    lat: 43.2181,
    lon: 20.6975
  },
  'bernjak': {
    id: 'border-bernjak',
    name: 'Bërnjak / Brnjak',
    shortName: 'Bërnjak',
    neighborCountry: 'Serbia',
    lat: 42.9753,
    lon: 20.5519
  },
  'dheu-i-bardhe': {
    id: 'border-dheu-i-bardhe',
    name: 'Dheu i Bardhë / Bela Zemlja',
    shortName: 'Dheu i Bardhë',
    neighborCountry: 'Serbia',
    lat: 42.4844,
    lon: 21.6547
  },
  'mutivode': {
    id: 'border-mutivode',
    name: 'Mutivodë / Mutivode',
    shortName: 'Mutivodë',
    neighborCountry: 'Serbia',
    lat: 42.7561,
    lon: 21.4686
  },
  'mucibabe': {
    id: 'border-mucibabe',
    name: 'Muçibabë / Mučibaba',
    shortName: 'Muçibabë',
    neighborCountry: 'Serbia',
    lat: 42.3883,
    lon: 21.5583
  },
  'hani-i-elezit': {
    id: 'border-hani-i-elezit',
    name: 'Hani i Elezit / General Janković',
    shortName: 'Hani i Elezit',
    neighborCountry: 'North Macedonia',
    lat: 42.1469,
    lon: 21.2981
  },
  'gllobocice': {
    id: 'border-gllobocice',
    name: 'Glloboçicë / Globočica',
    shortName: 'Glloboçicë',
    neighborCountry: 'North Macedonia',
    lat: 42.1644,
    lon: 21.0967
  },
  'stanciq': {
    id: 'border-stanciq',
    name: 'Stançiq / Staničić',
    shortName: 'Stançiq',
    neighborCountry: 'North Macedonia',
    lat: 42.2778,
    lon: 21.5278
  },
  'kulle': {
    id: 'border-kulle',
    name: 'Kullë / Kula',
    shortName: 'Kullë',
    neighborCountry: 'Montenegro',
    lat: 42.7933,
    lon: 20.2789
  },
  'vermice': {
    id: 'border-vermice',
    name: 'Vërmicë / Vrbnica / Morinë',
    shortName: 'Vërmicë',
    neighborCountry: 'Albania',
    lat: 42.1583,
    lon: 20.5486
  },
  'qafe-e-prushit': {
    id: 'border-qafe-e-prushit',
    name: 'Qafë e Prushit / Ćafa Prušit',
    shortName: 'Qafë e Prushit',
    neighborCountry: 'Albania',
    lat: 42.3014,
    lon: 20.3553
  },
  'qafe-e-morines': {
    id: 'border-qafe-e-morines',
    name: 'Qafë e Morinës / Ćafa Morina',
    shortName: 'Qafë e Morinës',
    neighborCountry: 'Albania',
    lat: 42.4106,
    lon: 20.2528
  }
};

/**
 * Mapping of known Nakordoni PPIDs to SENTINEL crossing keys and direction
 * origin = 23 (Kosovo) -> exit
 * destination = 23 (Kosovo) -> entry
 */
const NAKORDONI_PPID_MAP = {
  'id_595': { key: 'merdare', dir: 'exit', name: 'Merdarë' },
  'id_594': { key: 'merdare', dir: 'entry', name: 'Merdare' },
  'id_567': { key: 'jarinje', dir: 'exit', name: 'Jarinja' },
  'id_566': { key: 'jarinje', dir: 'entry', name: 'Jarinje' },
  'id_564': { key: 'dheu-i-bardhe', dir: 'exit', name: 'Dheu i Bardhë' },
  'id_565': { key: 'dheu-i-bardhe', dir: 'entry', name: 'Končulj' },
  'id_568': { key: 'mutivode', dir: 'exit', name: 'Mutivodë' },
  'id_569': { key: 'mutivode', dir: 'entry', name: 'Mutivode' },
  'id_561': { key: 'hani-i-elezit', dir: 'exit', name: 'Hani i Elezit' },
  'id_560': { key: 'hani-i-elezit', dir: 'entry', name: 'Blace' },
  'id_593': { key: 'vermice', dir: 'exit', name: 'Vërmicë' },
  'id_592': { key: 'vermice', dir: 'entry', name: 'Morinë' },
  'id_530': { key: 'kulle', dir: 'exit', name: 'Kullë' },
  'id_531': { key: 'kulle', dir: 'entry', name: 'Kula (Rožaje)' },
  'id_512': { key: 'qafe-e-morines', dir: 'exit', name: 'Qafë Morinë (KS)' },
  'id_513': { key: 'qafe-e-morines', dir: 'entry', name: 'Qafë Morinë (AL) – Qafë Morinë (KS)' }
};

// In-memory & persistent cache
const CACHE_FILE = path.join(__dirname, '.border_cache.json');
let borderCache = null;
let lastFetchTime = 0;
try {
  if (fs.existsSync(CACHE_FILE)) {
    const rawCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    if (rawCache && rawCache.status === 'LIVE_DATA' && Array.isArray(rawCache.crossings) && rawCache.crossings.length > 0) {
      borderCache = rawCache;
      lastFetchTime = Date.now();
    }
  }
} catch (e) {}

function persistCache(data) {
  borderCache = data;
  lastFetchTime = Date.now();
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (e) {}
}

const BORDER_CACHE_TTL_MS = parseInt(process.env.BORDER_CACHE_TTL_MS || '300000', 10); // 5 min
const DEFAULT_SOURCE_URL = 'https://mpb.rks-gov.net/?culture=sr-latn-rs';
const DEFAULT_NAKORDONI_BASE_URL = 'https://nakordoni.eu';
const DEFAULT_NAKORDONI_PPIDS = 'id_512,id_513,id_530,id_531,id_560,id_561,id_564,id_565,id_566,id_567,id_568,id_569,id_592,id_593,id_594,id_595';

/**
 * Match a raw border crossing name or PPID to known crossing metadata
 */
function matchBorderKey(rawName) {
  if (!rawName) return null;
  const s = String(rawName).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[ëe]/g, 'e')
    .replace(/[çc]/g, 'c')
    .replace(/[^a-z0-9]/g, '');

  if (s.includes('merdar')) return 'merdare';
  if (s.includes('jarinj')) return 'jarinje';
  if (s.includes('bernjak') || s.includes('brnjak') || s.includes('tabalij')) return 'bernjak';
  if (s.includes('dheu') || s.includes('bardh') || s.includes('koncul') || s.includes('bela')) return 'dheu-i-bardhe';
  if (s.includes('mutivod')) return 'mutivode';
  if (s.includes('mucibab') || s.includes('mucibaba')) return 'mucibabe';
  if (s.includes('elezit') || s.includes('hani') || s.includes('elez') || s.includes('jankovic') || s.includes('blace')) return 'hani-i-elezit';
  if (s.includes('glloboc') || s.includes('globocic') || s.includes('glloboq') || s.includes('jazinc')) return 'gllobocice';
  if (s.includes('stanciq') || s.includes('stanicic') || s.includes('bellanoc')) return 'stanciq';
  if (s.includes('kull') || s.includes('kula')) return 'kulle';
  if (s.includes('vermic') || s.includes('vrbnic') || (s.includes('morine') && !s.includes('qafe'))) return 'vermice';
  if (s.includes('prush')) return 'qafe-e-prushit';
  if (s.includes('morin') && (s.includes('qafe') || s.includes('cafa'))) return 'qafe-e-morines';

  return null;
}

/**
 * Extract integer number of minutes from raw string or number (e.g. "05-10 min" -> 10, "60" -> 60)
 */
function parseMinutes(str) {
  if (str === null || str === undefined || str === '') return null;
  if (typeof str === 'number') return isNaN(str) ? null : Math.round(str);
  const matches = String(str).match(/\d+/g);
  if (!matches || matches.length === 0) return null;
  const nums = matches.map(n => parseInt(n, 10));
  return Math.max(...nums);
}

/**
 * Extract integer length in meters or car count from raw string or number (e.g. "50-100 m" -> 100)
 */
function parseMeters(str) {
  if (str === null || str === undefined || str === '') return null;
  if (typeof str === 'number') return isNaN(str) ? null : Math.round(str);
  const matches = String(str).match(/\d+/g);
  if (!matches || matches.length === 0) return null;
  const nums = matches.map(n => parseInt(n, 10));
  return Math.max(...nums);
}

/**
 * Detect direction (entry vs exit) for Nakordoni checkpoint items
 */
function detectDirection(item) {
  if (!item) return 'exit';

  // 1. Explicit direction flags
  const dir = String(item.direction || item.dir || '').toLowerCase();
  if (dir === 'outbound' || dir === 'exit' || dir === 'out') return 'exit';
  if (dir === 'inbound' || dir === 'entry' || dir === 'in') return 'entry';

  // 2. Country from / to or numeric codes (origin 23 = KS exit, dest 23 = KS entry)
  if (item.origin === 23 && item.destination !== 23) return 'exit';
  if (item.origin !== 23 && item.destination === 23) return 'entry';

  const from = String(item.country_from || item.countryFrom || item.from_country || item.fromCountry || '').toLowerCase();
  const to = String(item.country_to || item.countryTo || item.to_country || item.toCountry || '').toLowerCase();

  const isFromKs = from.includes('kosov') || from === 'xk' || from === 'ks' || from === 'rks';
  const isToKs = to.includes('kosov') || to === 'xk' || to === 'ks' || to === 'rks';

  if (isFromKs && !isToKs) return 'exit';
  if (!isFromKs && isToKs) return 'entry';

  // 3. Name parsing 'A — B' (A is Origin, B is Destination)
  const name = String(item.name || item.title || item.bcp || '');
  const parts = name.split(/[\u2014\u2013\->\/]+/).map(s => s.trim());
  if (parts.length >= 2) {
    const first = parts[0].toLowerCase();
    const second = parts[1].toLowerCase();

    const ksPrefixes = ['dheu', 'bardh', 'elezit', 'elez han', 'vermic', 'vërmic', 'kullë', 'glloboq', 'stanciq', 'prush'];
    const neighborPrefixes = ['koncul', 'končul', 'blace', 'bllac', 'kula', 'jazhinc', 'jažinc', 'bellanoc', 'belanovc', 'morine', 'morinë'];

    if (ksPrefixes.some(p => first.includes(p)) && !ksPrefixes.some(p => second.includes(p))) return 'exit';
    if (!ksPrefixes.some(p => first.includes(p)) && ksPrefixes.some(p => second.includes(p))) return 'entry';

    if (neighborPrefixes.some(p => second.includes(p)) && !neighborPrefixes.some(p => first.includes(p))) return 'exit';
    if (neighborPrefixes.some(p => first.includes(p)) && !neighborPrefixes.some(p => second.includes(p))) return 'entry';

    // Merdarë / Merdare, Jarinjë / Jarinje, Mutivodë / Mutivode
    if (first.endsWith('ë') && !second.endsWith('ë')) return 'exit';
    if (!first.endsWith('ë') && second.endsWith('ë')) return 'entry';
    if (first === 'jarinje' && second === 'jarinja') return 'exit';
    if (first === 'jarinja' && second === 'jarinje') return 'entry';
    if (first === 'mutivode' && second === 'mutivodë') return 'entry';
    if (first === 'mutivodë' && second === 'mutivode') return 'exit';
  }

  return 'exit';
}

/**
 * Parse the official #fluksi-tabela HTML table from MPB / QKMK website
 */
function parseQkmkHtml(html) {
  if (!html || typeof html !== 'string') return { crossings: [], updatedAt: null, hasTable: false };

  const crossings = [];
  let updatedAt = null;

  // Extract timestamp: e.g. "Ažurirano: 21/08/2026 15:08:38" or "Përditësuar me: 21.08.2026 15:08"
  const timeMatch = html.match(/(?:Ažurirano|Përditësuar|Updated)[\s:]*?(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\s+\d{1,2}:\d{2}(?::\d{2})?)/i);
  if (timeMatch && timeMatch[1]) {
    try {
      const parts = timeMatch[1].split(/[\s/.:-]+/);
      if (parts.length >= 5) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        const h = parseInt(parts[3], 10);
        const min = parseInt(parts[4], 10);
        const sec = parts[5] ? parseInt(parts[5], 10) : 0;
        const dt = new Date(Date.UTC(y, m, d, h, min, sec));
        if (!isNaN(dt.getTime())) {
          updatedAt = dt.toISOString();
        }
      }
    } catch {}
  }

  // Find table with id='fluksi-tabela' or fallback to first table
  const tableIdx = html.indexOf('fluksi-tabela');
  const hasTable = tableIdx !== -1 || html.includes('<table');
  const tableHtml = tableIdx !== -1 
    ? html.substring(tableIdx, html.indexOf('</table>', tableIdx) + 8)
    : html;

  // Clean comments and scripts
  const cleanTableHtml = tableHtml.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/gi, '');

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(cleanTableHtml)) !== null) {
    const rowContent = rowMatch[1];
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const cellText = cellMatch[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
      cells.push(cellText);
    }

    if (cells.length >= 5) {
      // Ignore header rows
      const firstCell = cells[0].toLowerCase();
      if (firstCell.includes('hyrje') || firstCell.includes('min') || firstCell.includes('pikat') || firstCell.includes('crossing')) {
        continue;
      }

      const rawName = cells[0];
      const entryWaitStr = cells[1] ? (cells[1].includes('min') ? cells[1] : `${cells[1]} min`) : null;
      const exitWaitStr = cells[2] ? (cells[2].includes('min') ? cells[2] : `${cells[2]} min`) : null;
      const entryQueueStr = cells[3] ? (cells[3].includes('m') ? cells[3] : `${cells[3]} m`) : null;
      const exitQueueStr = cells[4] ? (cells[4].includes('m') ? cells[4] : `${cells[4]} m`) : null;

      // Truck columns (cells 5..8 if 9-column table)
      const truckEntryWaitStr = cells[5] ? (cells[5].includes('min') ? cells[5] : `${cells[5]} min`) : null;
      const truckExitWaitStr = cells[6] ? (cells[6].includes('min') ? cells[6] : `${cells[6]} min`) : null;
      const truckEntryQueueStr = cells[7] ? (cells[7].includes('m') ? cells[7] : `${cells[7]} m`) : null;
      const truckExitQueueStr = cells[8] ? (cells[8].includes('m') ? cells[8] : `${cells[8]} m`) : null;

      crossings.push(normalizeCrossing({
        rawName,
        entryWaitStr,
        exitWaitStr,
        entryQueueStr,
        exitQueueStr,
        truckEntryWaitStr,
        truckExitWaitStr,
        truckEntryQueueStr,
        truckExitQueueStr,
        source: 'QKMK',
        sourceUrl: 'https://mpb.rks-gov.net/?culture=sr-latn-rs',
        updatedAt
      }));
    }
  }

  return { crossings, updatedAt, hasTable };
}

/**
 * Parse structured JSON payload if provided by a machine-readable endpoint or mirror
 */
function parseQkmkJson(data) {
  if (!data) return { crossings: [], updatedAt: null, isValidJson: false };

  const items = Array.isArray(data) ? data : (data.crossings || data.data || data.items || []);
  if (!Array.isArray(items)) return { crossings: [], updatedAt: null, isValidJson: false };

  const updatedAt = data.updatedAt || data.updated_at || data.timestamp || new Date().toISOString();
  const crossings = items.map(item => normalizeCrossing({
    rawName: item.name || item.crossing || item.pika || item.title || '',
    entryWaitStr: item.entry_wait || item.entryWait || item.hyrje_pritja || (typeof item.direction?.entry?.waitingMinutes === 'number' ? `${item.direction.entry.waitingMinutes} min` : null),
    exitWaitStr: item.exit_wait || item.exitWait || item.dalje_pritja || (typeof item.direction?.exit?.waitingMinutes === 'number' ? `${item.direction.exit.waitingMinutes} min` : null),
    entryQueueStr: item.entry_queue || item.entryQueue || item.hyrje_kolona || (typeof item.direction?.entry?.queueLengthMeters === 'number' ? `${item.direction.entry.queueLengthMeters} m` : null),
    exitQueueStr: item.exit_queue || item.exitQueue || item.dalje_kolona || (typeof item.direction?.exit?.queueLengthMeters === 'number' ? `${item.direction.exit.queueLengthMeters} m` : null),
    truckEntryWaitStr: item.trucks?.entry?.waitingMinutesText || (typeof item.trucks?.entry?.waitingMinutes === 'number' ? `${item.trucks.entry.waitingMinutes} min` : null),
    truckExitWaitStr: item.trucks?.exit?.waitingMinutesText || (typeof item.trucks?.exit?.waitingMinutes === 'number' ? `${item.trucks.exit.waitingMinutes} min` : null),
    truckEntryQueueStr: item.trucks?.entry?.queueLengthText || (typeof item.trucks?.entry?.queueLengthMeters === 'number' ? `${item.trucks.entry.queueLengthMeters} m` : null),
    truckExitQueueStr: item.trucks?.exit?.queueLengthText || (typeof item.trucks?.exit?.queueLengthMeters === 'number' ? `${item.trucks.exit.queueLengthMeters} m` : null),
    status: item.status,
    lat: item.lat || item.coordinates?.lat,
    lon: item.lon || item.coordinates?.lon,
    source: 'QKMK',
    sourceUrl: 'https://mpb.rks-gov.net/?culture=sr-latn-rs',
    updatedAt: item.updatedAt || updatedAt
  })).filter(Boolean);

  return { crossings, updatedAt, isValidJson: true };
}

/**
 * Parse Nakordoni /api/v1/data/multi JSON payload and merge directional records
 */
function parseNakordoniMultiJson(raw) {
  if (!raw) return { crossings: [], updatedAt: null };

  if (raw.ok === false) {
    if (raw.error) {
      console.warn(`[border-monitor] Nakordoni API error [${raw.error.code || 'unknown'}]: ${raw.error.message || 'Error reported'}`);
    }
    return { crossings: [], updatedAt: null, ok: false, error: raw.error };
  }

  const dataObj = raw.data || raw;
  let items = [];

  if (Array.isArray(dataObj)) {
    items = dataObj;
  } else if (typeof dataObj === 'object' && dataObj !== null) {
    for (const [ppid, val] of Object.entries(dataObj)) {
      if (val && typeof val === 'object') {
        items.push({ ppid, ...val });
      }
    }
  }

  if (items.length === 0) {
    return { crossings: [], updatedAt: null };
  }

  const crossingMap = {};
  let latestTimestamp = null;

  for (const item of items) {
    const ppid = item.ppid;
    const mapped = NAKORDONI_PPID_MAP[ppid];

    const queueObj = item.queue || {};
    const updateInfo = item.update_info || {};

    const rawName = queueObj.name || mapped?.name || item.name || item.title || item.checkpoint || '';
    const key = mapped ? mapped.key : (matchBorderKey(rawName) || matchBorderKey(ppid));
    if (!key) continue;

    if (!crossingMap[key]) {
      const metadata = BORDER_LOCATIONS[key];
      crossingMap[key] = {
        id: metadata?.id || `border-${key}`,
        key,
        name: metadata?.name || rawName,
        shortName: metadata?.shortName || rawName,
        country: 'Kosovo',
        neighborCountry: metadata?.neighborCountry || 'Neighboring State',
        coordinates: metadata ? { lat: metadata.lat, lon: metadata.lon } : null,
        direction: {
          entry: {
            waitingMinutes: null,
            waitingMinutesText: null,
            queueLengthMeters: null,
            queueLengthText: null
          },
          exit: {
            waitingMinutes: null,
            waitingMinutesText: null,
            queueLengthMeters: null,
            queueLengthText: null
          }
        },
        trucks: null,
        status: 'OPEN',
        updatedAt: null,
        source: 'NAKORDONI',
        sourceUrl: 'https://nakordoni.eu/en/country/kosovo',
        sourceAttribution: {
          name: 'Nakordoni',
          url: 'https://nakordoni.eu/'
        }
      };
    }

    const dir = mapped ? mapped.dir : detectDirection(item);

    const waitMin = (typeof queueObj.wait_min === 'number') 
      ? queueObj.wait_min 
      : (queueObj.wait_min !== undefined && queueObj.wait_min !== null ? parseMinutes(queueObj.wait_min) : null);

    const queueCount = (typeof queueObj.queue_now === 'number') 
      ? queueObj.queue_now 
      : (queueObj.queue_now !== undefined && queueObj.queue_now !== null ? parseMeters(queueObj.queue_now) : null);

    const waitText = (waitMin != null) ? `${waitMin} min` : null;
    const queueText = (queueCount != null) ? `${queueCount} cars` : null;

    if (dir === 'entry') {
      crossingMap[key].direction.entry.waitingMinutes = waitMin;
      crossingMap[key].direction.entry.waitingMinutesText = waitText;
      crossingMap[key].direction.entry.queueLengthMeters = queueCount;
      crossingMap[key].direction.entry.queueLengthText = queueText;
    } else {
      crossingMap[key].direction.exit.waitingMinutes = waitMin;
      crossingMap[key].direction.exit.waitingMinutesText = waitText;
      crossingMap[key].direction.exit.queueLengthMeters = queueCount;
      crossingMap[key].direction.exit.queueLengthText = queueText;
    }

    const itemStatus = String(item.status || queueObj.status || 'OPEN').toUpperCase();
    if (itemStatus.includes('CLOSE') || item.status === 0) {
      crossingMap[key].status = 'CLOSED';
    }

    let ts = queueObj.updated_at || updateInfo.datetime || updateInfo.last_update || item.timestamp || item.updatedAt;
    if (ts) {
      if (typeof ts === 'number') {
        ts = new Date(ts * 1000).toISOString();
      } else if (typeof ts === 'string') {
        const isoLike = ts.includes('T') ? ts : ts.replace(' ', 'T') + 'Z';
        const parsedDt = new Date(isoLike);
        if (!isNaN(parsedDt.getTime())) {
          ts = parsedDt.toISOString();
        }
      }
      crossingMap[key].updatedAt = ts;
      if (!latestTimestamp || new Date(ts) > new Date(latestTimestamp)) {
        latestTimestamp = ts;
      }
    }
  }

  const crossings = Object.values(crossingMap);
  return { crossings, updatedAt: latestTimestamp || new Date().toISOString() };
}

/**
 * Normalize single crossing data object
 */
function normalizeCrossing({
  rawName,
  entryWaitStr,
  exitWaitStr,
  entryQueueStr,
  exitQueueStr,
  truckEntryWaitStr = null,
  truckExitWaitStr = null,
  truckEntryQueueStr = null,
  truckExitQueueStr = null,
  status = 'OPEN',
  lat = null,
  lon = null,
  source = 'QKMK',
  sourceUrl = 'https://mpb.rks-gov.net/?culture=sr-latn-rs',
  sourceAttribution = null,
  updatedAt = null
}) {
  const key = matchBorderKey(rawName);
  const metadata = key ? BORDER_LOCATIONS[key] : null;

  const id = metadata?.id || `border-${(rawName || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const displayName = metadata?.name || rawName || 'Border Crossing';
  const shortName = metadata?.shortName || rawName || 'Crossing';
  const neighborCountry = metadata?.neighborCountry || 'Neighboring State';

  const entryMinutes = parseMinutes(entryWaitStr);
  const entryMeters = parseMeters(entryQueueStr);
  const exitMinutes = parseMinutes(exitWaitStr);
  const exitMeters = parseMeters(exitQueueStr);

  const truckEntryMinutes = parseMinutes(truckEntryWaitStr);
  const truckEntryMeters = parseMeters(truckEntryQueueStr);
  const truckExitMinutes = parseMinutes(truckExitWaitStr);
  const truckExitMeters = parseMeters(truckExitQueueStr);

  const coords = (lat && lon) ? { lat: parseFloat(lat), lon: parseFloat(lon) } : (metadata ? { lat: metadata.lat, lon: metadata.lon } : null);

  return {
    id,
    key: key || id,
    name: displayName,
    shortName,
    country: 'Kosovo',
    neighborCountry,
    coordinates: coords,
    direction: {
      entry: {
        waitingMinutes: entryMinutes,
        waitingMinutesText: entryWaitStr || (entryMinutes != null ? `${entryMinutes} min` : null),
        queueLengthMeters: entryMeters,
        queueLengthText: entryQueueStr || (entryMeters != null ? `${entryMeters} m` : null)
      },
      exit: {
        waitingMinutes: exitMinutes,
        waitingMinutesText: exitWaitStr || (exitMinutes != null ? `${exitMinutes} min` : null),
        queueLengthMeters: exitMeters,
        queueLengthText: exitQueueStr || (exitMeters != null ? `${exitMeters} m` : null)
      }
    },
    trucks: (truckEntryWaitStr || truckExitWaitStr || truckEntryQueueStr || truckExitQueueStr) ? {
      entry: {
        waitingMinutes: truckEntryMinutes,
        waitingMinutesText: truckEntryWaitStr || (truckEntryMinutes != null ? `${truckEntryMinutes} min` : null),
        queueLengthMeters: truckEntryMeters,
        queueLengthText: truckEntryQueueStr || (truckEntryMeters != null ? `${truckEntryMeters} m` : null)
      },
      exit: {
        waitingMinutes: truckExitMinutes,
        waitingMinutesText: truckExitWaitStr || (truckExitMinutes != null ? `${truckExitMinutes} min` : null),
        queueLengthMeters: truckExitMeters,
        queueLengthText: truckExitQueueStr || (truckExitMeters != null ? `${truckExitMeters} m` : null)
      }
    } : null,
    status: status || 'OPEN',
    updatedAt: updatedAt || new Date().toISOString(),
    source,
    sourceUrl,
    sourceAttribution
  };
}

/**
 * Fetch from Primary source: QKMK Official Portal
 */
async function fetchFromQkmk() {
  const sourceUrl = process.env.BORDER_API_URL || process.env.BORDER_SOURCE_URL || DEFAULT_SOURCE_URL;

  const response = await axios.get(sourceUrl, {
    timeout: 4000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SENTINEL/1.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8',
      'Accept-Language': 'sr-RS,sr;q=0.9,sq;q=0.8,en-US;q=0.7,en;q=0.6'
    }
  });

  let crossings = [];
  let parsedUpdatedAt = null;
  let formatValid = false;

  const contentType = (response.headers['content-type'] || '').toLowerCase();

  if (contentType.includes('application/json') || typeof response.data === 'object') {
    const parsed = parseQkmkJson(response.data);
    crossings = parsed.crossings;
    parsedUpdatedAt = parsed.updatedAt;
    formatValid = parsed.isValidJson;
  } else if (typeof response.data === 'string') {
    const parsed = parseQkmkHtml(response.data);
    crossings = parsed.crossings;
    parsedUpdatedAt = parsed.updatedAt;
    formatValid = parsed.hasTable;
  }

  if (crossings.length === 0) {
    if (!formatValid) {
      return {
        skill: 'border-monitor',
        status: 'INVALID_DATA',
        source: 'QKMK',
        sourceUrl,
        updatedAt: new Date().toISOString(),
        count: 0,
        crossings: [],
        error: 'Official source returned an unrecognized response format.',
        message: 'Official source returned an unrecognized response format.',
        isCached: false
      };
    }

    return {
      skill: 'border-monitor',
      status: 'NO_DATA',
      source: 'QKMK',
      sourceUrl,
      updatedAt: new Date().toISOString(),
      count: 0,
      crossings: [],
      message: 'No border crossing data currently reported by QKMK.',
      isCached: false
    };
  }

  return {
    skill: 'border-monitor',
    status: 'LIVE_DATA',
    source: 'QKMK',
    sourceUrl,
    updatedAt: parsedUpdatedAt || new Date().toISOString(),
    count: crossings.length,
    crossings,
    isCached: false
  };
}

/**
 * Fetch from Secondary fallback source: Nakordoni Developer API
 */
async function fetchFromNakordoni(apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    throw new Error('NAKORDONI_NOT_CONFIGURED');
  }

  const ppids = process.env.NAKORDONI_KOSOVO_PPIDS || DEFAULT_NAKORDONI_PPIDS;
  const baseUrl = process.env.NAKORDONI_API_URL || DEFAULT_NAKORDONI_BASE_URL;
  const targetUrl = `${baseUrl.replace(/\/+$/, '')}/api/v1/data/multi?ppids=${encodeURIComponent(ppids)}&include=queue,update-info&lang=en`;

  const response = await axios.get(targetUrl, {
    timeout: 8000,
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Accept': 'application/json',
      'User-Agent': 'SENTINEL-Situational-Awareness/1.0'
    }
  });

  if (!response.data || response.data.ok === false) {
    const errCode = response.data?.error?.code || 'UNKNOWN_ERROR';
    const errMsg = response.data?.error?.message || 'Nakordoni API returned ok: false';
    console.warn(`[border-monitor] Nakordoni API error [${errCode}]: ${errMsg}`);
    throw new Error(`NAKORDONI_ERROR_${errCode}`);
  }

  const parsed = parseNakordoniMultiJson(response.data);
  if (!parsed || parsed.crossings.length === 0) {
    return {
      skill: 'border-monitor',
      status: 'NO_DATA',
      source: 'NAKORDONI',
      sourceUrl: 'https://nakordoni.eu/en/country/kosovo',
      sourceAttribution: { name: 'Nakordoni', url: 'https://nakordoni.eu/' },
      updatedAt: new Date().toISOString(),
      count: 0,
      crossings: [],
      message: 'No active Kosovo border records returned by Nakordoni API.',
      isCached: false
    };
  }

  return {
    skill: 'border-monitor',
    status: 'LIVE_DATA',
    source: 'NAKORDONI',
    sourceUrl: 'https://nakordoni.eu/en/country/kosovo',
    sourceAttribution: { name: 'Nakordoni', url: 'https://nakordoni.eu/' },
    updatedAt: parsed.updatedAt || new Date().toISOString(),
    count: parsed.crossings.length,
    crossings: parsed.crossings,
    isCached: false
  };
}

/**
 * Fetch border crossing waiting times with strict source priority:
 * 1. Primary: QKMK official portal
 * 2. Secondary: Nakordoni official Developer API (if NAKORDONI_API_KEY is configured)
 * 3. Fallback: UNAVAILABLE
 */
async function fetchBorders({ forceRefresh = false } = {}) {
  // Check cache
  if (!forceRefresh && borderCache && (Date.now() - lastFetchTime < BORDER_CACHE_TTL_MS)) {
    return { ...borderCache, isCached: true };
  }

  // 1. Primary Source: QKMK Official
  try {
    const qkmkResult = await fetchFromQkmk();
    if (qkmkResult && qkmkResult.status === 'LIVE_DATA' && qkmkResult.crossings && qkmkResult.crossings.length > 0) {
      persistCache(qkmkResult);
      return qkmkResult;
    }
  } catch (err) {
    console.warn('[border-monitor] Primary QKMK source failed:', err.message);
  }

  // 2. Secondary Source: Nakordoni Official Developer API
  const nakordoniKey = process.env.NAKORDONI_API_KEY;
  if (nakordoniKey && nakordoniKey.trim()) {
    try {
      const nakordoniResult = await fetchFromNakordoni(nakordoniKey.trim());
      if (nakordoniResult && nakordoniResult.status === 'LIVE_DATA' && nakordoniResult.crossings && nakordoniResult.crossings.length > 0) {
        persistCache(nakordoniResult);
        return nakordoniResult;
      }
    } catch (err) {
      const status = err.response?.status;
      const errCode = err.response?.data?.error?.code || err.code || 'ERR';
      const errMsg = err.response?.data?.error?.message || err.message;
      console.warn(`[border-monitor] Secondary Nakordoni source failed (HTTP ${status || 'ERR'}): [${errCode}] ${errMsg}`);
    }
  }

  // 3. Fallback: Return previously cached live data if available (e.g. transient 429 quota exhaustion or network glitch)
  if (borderCache && borderCache.status === 'LIVE_DATA' && borderCache.crossings && borderCache.crossings.length > 0) {
    return { ...borderCache, isCached: true };
  }

  // 4. Fallback: UNAVAILABLE
  return {
    skill: 'border-monitor',
    status: 'UNAVAILABLE',
    source: 'QKMK',
    sourceUrl: 'https://mpb.rks-gov.net/?culture=sr-latn-rs',
    updatedAt: new Date().toISOString(),
    count: 0,
    crossings: [],
    error: 'Official and secondary border data sources could not be reached.',
    message: 'Official and secondary border data sources could not be reached.',
    isCached: false
  };
}

module.exports = {
  fetchBorders,
  fetchFromQkmk,
  fetchFromNakordoni,
  matchBorderKey,
  detectDirection,
  parseMinutes,
  parseMeters,
  parseQkmkHtml,
  parseQkmkJson,
  parseNakordoniMultiJson,
  normalizeCrossing,
  BORDER_LOCATIONS,
  NAKORDONI_PPID_MAP,
  DEFAULT_SOURCE_URL,
  DEFAULT_NAKORDONI_BASE_URL,
  DEFAULT_NAKORDONI_PPIDS
};

if (require.main === module) {
  fetchBorders({ forceRefresh: true }).then(res => {
    console.log('=== BORDER MONITOR SKILL CLI TEST ===');
    console.log('Skill:', res.skill);
    console.log('Status:', res.status);
    console.log('Source:', res.source);
    console.log('Source URL:', res.sourceUrl);
    if (res.sourceAttribution) {
      console.log('Source Attribution:', JSON.stringify(res.sourceAttribution));
    }
    console.log('Updated At:', res.updatedAt);
    console.log('Total Crossings:', res.count);
    if (res.crossings && res.crossings.length > 0) {
      console.log('Sample Crossing (First):\n', JSON.stringify(res.crossings[0], null, 2));
    } else {
      console.log('Message / Error:', res.message || res.error);
    }
  }).catch(err => {
    console.error('Fatal CLI Error:', err);
  });
}
