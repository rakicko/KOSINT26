'use strict';

require('dotenv').config({
  path: require('path').join(__dirname, '../../.env')
});

const axios = require('axios');
const xml2js = require('xml2js');


// ─────────────────────────────────────
// Kosovo RSS SOURCES
// ─────────────────────────────────────

const SOURCES = [

  // Serbian sources
  {
    url: 'https://kossev.info/feed/',
    name: 'KoSSev',
    lang: 'sr'
  },

  {
    url: 'https://radiomitrovicasever.com/feed/',
    name: 'Radio Mitrovica Sever',
    lang: 'sr'
  },

  {
    url: 'https://bih.kosova.info/feed/',
    name: 'Kosova.info',
    lang: 'sr'
  },


  // Albanian sources
  {
    url: 'https://www.gazetaexpress.com/feed',
    name: 'Gazeta Express',
    lang: 'al'
  },

  {
    url: 'https://indeksonline.net/feed/',
    name: 'Indeks Online',
    lang: 'al'
  },

  {
    url: 'https://lajmi.net/feed/',
    name: 'Lajmi',
    lang: 'al'
  },

  {
    url: 'https://jepize.com/feed/',
    name: 'Jepize',
    lang: 'al'
  },

  {
    url: 'https://mitropol.net/feed/',
    name: 'Mitropol',
    lang: 'al'
  },

  {
    url: 'https://mitrovicasot.net/feed/',
    name: 'MitrovicaSOT',
    lang: 'al'
  },

  {
    url: 'https://klankosova.tv/feed/',
    name: 'Klan Kosova',
    lang: 'al'
  }

];



// ─────────────────────────────────────
// Source reliability
// ─────────────────────────────────────

const SOURCE_RELIABILITY = {

  'KoSSev': 0.90,

  'Radio Mitrovica Sever': 0.85,

  'Kosova.info': 0.80,

  'Gazeta Express': 0.85,

  'Indeks Online': 0.75,

  'Lajmi': 0.70,

  'Jepize': 0.65,

  'Mitropol': 0.70,

  'MitrovicaSOT': 0.80,

  'Klan Kosova': 0.85

};




// ─────────────────────────────────────
// Keywords SR + AL
// ─────────────────────────────────────

const ALERT_WORDS = {


  security: [

    // SR

    'policija',
    'policija kosova',
    'kfor',
    'eulex',
    'hapšenje',
    'hapsenje',
    'uhapšen',
    'uhapsen',
    'incident',
    'sukob',
    'napad',
    'pritvor',
    'istraga',


    // AL

    'policia',
    'policia e kosoves',
    'arrestim',
    'arrestuar',
    'incident',
    'sulm',
    'konflikt',
    'hetim',
    'ndalim'

  ],



  unrest: [

    // SR

    'protest',
    'protesti',
    'demonstracija',
    'blokada',
    'barikada',
    'neredi',
    'tenzije',
    'kriza',
    'sukob',


    // AL

    'protestë',
    'protesta',
    'demonstratë',
    'bllokadë',
    'barrikadë',
    'tensione',
    'përplasje',
    'krizë'

  ],



  emergency: [

    // SR

    'požar',
    'pozar',
    'eksplozija',
    'nesreća',
    'nesreca',
    'poplava',
    'evakuacija',
    'spasavanje',


    // AL

    'zjarr',
    'eksplodim',
    'aksident',
    'përmbytje',
    'evakuim',
    'shpëtim'

  ],




  politics: [

    // SR

    'vlada',
    'skupština',
    'sporazum',
    'dijalog',
    'brisel',
    'izbori',
    'premijer',
    'predsednik',


    // AL

    'qeveria',
    'kuvendi',
    'marrëveshje',
    'dialog',
    'bruksel',
    'zgjedhje',
    'kryeministër',
    'president'

  ],




  north_kosovo: [

    // SR

    'sever kosova',
    'severu kosova',
    'mitrovica',
    'zvečan',
    'zvecan',
    'leposavić',
    'leposaviq',
    'zubin potok',
    'kosovska mitrovica',


    // AL

    'veriu i kosoves',
    'mitrovicë',
    'zveçan',
    'leposaviq',
    'zubin potok'

  ]


};





// ─────────────────────────────────────
// Intelligence event model / normalization
// ─────────────────────────────────────

const CATEGORY_MAP = {
  security: 'Security',
  terrorism: 'Terrorism',
  organized_crime: 'Organized Crime',
  politics: 'Politics',
  military: 'Military',
  border_activity: 'Border Activity',
  civil_unrest: 'Civil Unrest',
  infrastructure: 'Infrastructure',
  weather: 'Weather',
  natural_disaster: 'Natural Disaster',
  cyber: 'Cyber',
  economy: 'Economy',
  health: 'Health',
  other: 'Other',
  unrest: 'Civil Unrest',
  emergency: 'Infrastructure',
  north_kosovo: 'Border Activity'
};

const CATEGORY_PRIORITY = {
  'Terrorism': 95,
  'Military': 88,
  'Border Activity': 82,
  'Security': 78,
  'Civil Unrest': 72,
  'Infrastructure': 68,
  'Natural Disaster': 66,
  'Cyber': 64,
  'Organized Crime': 60,
  'Politics': 48,
  'Weather': 38,
  'Economy': 30,
  'Health': 28,
  'Other': 10
};

const SEVERITY_ALIASES = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};

const STARTER_STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'from', 'by', 'at', 'is', 'it',
  'be', 'as', 'are', 'was', 'were', 'this', 'that', 'their', 'there', 'after', 'before', 'na', 'sa', 'u', 'i',
  'je', 'se', 'ko', 'ka', 'da', 'ne', 'su', 'prema', 'dokt', 'po', 'za', 'nje', 'në', 'me', 'e', 'të', 'per', 'si',
  'nga', 'për', 'edhe', 'kjo', 'kishte', 'duhet', 'ndaj'
]);

const KOSOVO_LOCATION_ALIASES = {
  'prishtina': { originalName: 'Prishtina', normalizedName: 'Prishtina', municipality: 'Prishtina', region: 'Central Kosovo', country: 'Kosovo', coordinates: { lat: 42.6629, lon: 21.1655 } },
  'pristina': { originalName: 'Pristina', normalizedName: 'Prishtina', municipality: 'Prishtina', region: 'Central Kosovo', country: 'Kosovo', coordinates: { lat: 42.6629, lon: 21.1655 } },
  'pristinë': { originalName: 'Prishtinë', normalizedName: 'Prishtina', municipality: 'Prishtina', region: 'Central Kosovo', country: 'Kosovo', coordinates: { lat: 42.6629, lon: 21.1655 } },
  'mitrovica': { originalName: 'Mitrovica', normalizedName: 'Mitrovicë', municipality: 'Mitrovica', region: 'North Kosovo', country: 'Kosovo', coordinates: { lat: 42.8900, lon: 20.8681 } },
  'kosovska mitrovica': { originalName: 'Kosovska Mitrovica', normalizedName: 'Mitrovicë', municipality: 'Mitrovica', region: 'North Kosovo', country: 'Kosovo', coordinates: { lat: 42.8900, lon: 20.8681 } },
  'mitrovicë': { originalName: 'Mitrovicë', normalizedName: 'Mitrovicë', municipality: 'Mitrovica', region: 'North Kosovo', country: 'Kosovo', coordinates: { lat: 42.8900, lon: 20.8681 } },
  'mitrovica north': { originalName: 'Mitrovica North', normalizedName: 'Mitrovicë', municipality: 'Mitrovica', region: 'North Kosovo', country: 'Kosovo', coordinates: { lat: 42.8900, lon: 20.8681 } },
  'peja': { originalName: 'Peja', normalizedName: 'Pejë', municipality: 'Peja', region: 'Western Kosovo', country: 'Kosovo', coordinates: { lat: 42.6591, lon: 20.2922 } },
  'pejë': { originalName: 'Pejë', normalizedName: 'Pejë', municipality: 'Peja', region: 'Western Kosovo', country: 'Kosovo', coordinates: { lat: 42.6591, lon: 20.2922 } },
  'pec': { originalName: 'Peć', normalizedName: 'Pejë', municipality: 'Peja', region: 'Western Kosovo', country: 'Kosovo', coordinates: { lat: 42.6591, lon: 20.2922 } },
  'gjakova': { originalName: 'Gjakova', normalizedName: 'Gjakovë', municipality: 'Gjakova', region: 'Western Kosovo', country: 'Kosovo', coordinates: { lat: 42.3804, lon: 20.4283 } },
  'gjakovë': { originalName: 'Gjakovë', normalizedName: 'Gjakovë', municipality: 'Gjakova', region: 'Western Kosovo', country: 'Kosovo', coordinates: { lat: 42.3804, lon: 20.4283 } },
  'đakovica': { originalName: 'Đakovica', normalizedName: 'Gjakovë', municipality: 'Gjakova', region: 'Western Kosovo', country: 'Kosovo', coordinates: { lat: 42.3804, lon: 20.4283 } },
  'gjilan': { originalName: 'Gjilan', normalizedName: 'Gjilan', municipality: 'Gjilan', region: 'Eastern Kosovo', country: 'Kosovo', coordinates: { lat: 42.4603, lon: 21.4681 } },
  'gnjilane': { originalName: 'Gnjilane', normalizedName: 'Gjilan', municipality: 'Gjilan', region: 'Eastern Kosovo', country: 'Kosovo', coordinates: { lat: 42.4603, lon: 21.4681 } },
  'ferizaj': { originalName: 'Ferizaj', normalizedName: 'Ferizaj', municipality: 'Ferizaj', region: 'Central Kosovo', country: 'Kosovo', coordinates: { lat: 42.3800, lon: 21.1578 } },
  'uroševac': { originalName: 'Uroševac', normalizedName: 'Ferizaj', municipality: 'Ferizaj', region: 'Central Kosovo', country: 'Kosovo', coordinates: { lat: 42.3800, lon: 21.1578 } },
  'vushtrri': { originalName: 'Vushtrri', normalizedName: 'Vushtrri', municipality: 'Vushtrri', region: 'North Kosovo', country: 'Kosovo', coordinates: { lat: 42.8231, lon: 20.9674 } },
  'suhareka': { originalName: 'Suhareka', normalizedName: 'Suharekë', municipality: 'Suhareka', region: 'Western Kosovo', country: 'Kosovo', coordinates: { lat: 42.3556, lon: 20.8278 } },
  'podujeva': { originalName: 'Podujeva', normalizedName: 'Podujevë', municipality: 'Podujeva', region: 'Northern Kosovo', country: 'Kosovo', coordinates: { lat: 42.9114, lon: 21.1864 } },
  'skenderaj': { originalName: 'Srbica', normalizedName: 'Skenderaj', municipality: 'Skenderaj', region: 'North Kosovo', country: 'Kosovo', coordinates: { lat: 42.7528, lon: 20.7881 } },
  'srbica': { originalName: 'Srbica', normalizedName: 'Skenderaj', municipality: 'Skenderaj', region: 'North Kosovo', country: 'Kosovo', coordinates: { lat: 42.7528, lon: 20.7881 } },
  'zvecan': { originalName: 'Zvečan', normalizedName: 'Zvečan', municipality: 'Zvečan', region: 'North Kosovo', country: 'Kosovo', coordinates: { lat: 42.9089, lon: 20.8407 } },
  'zvecan': { originalName: 'Zvečan', normalizedName: 'Zvečan', municipality: 'Zvečan', region: 'North Kosovo', country: 'Kosovo', coordinates: { lat: 42.9089, lon: 20.8407 } },
  'leposavic': { originalName: 'Leposavić', normalizedName: 'Leposaviq', municipality: 'Leposaviq', region: 'North Kosovo', country: 'Kosovo', coordinates: { lat: 43.1026, lon: 20.8065 } }
};

const ENTITY_KEYWORDS = {
  organizations: ['policija', 'policia', 'kfor', 'eulex', 'nato', 'kosovo police', 'municipality', 'customs', 'health ministry', 'government', 'ministry'],
  military: ['army', 'military', 'brigade', 'battalion', 'operation', 'patrol', 'security forces'],
  border: ['border crossing', 'checkpoint', 'crossing', 'border', 'gate', 'passage'],
  infrastructure: ['power plant', 'water station', 'road', 'bridge', 'school', 'hospital', 'airport', 'railway', 'grid', 'substation', 'pipeline'],
  cyber: ['cyber', 'ransomware', 'malware', 'ddos', 'phishing', 'hack', 'breach'],
  violence: ['attack', 'explosion', 'shooting', 'fire', 'clash', 'assault', 'bomb']
};

function normalizeText(value = '') {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[šŠ]/g, 's')
    .replace(/[čČ]/g, 'c')
    .replace(/[ćĆ]/g, 'c')
    .replace(/[žŽ]/g, 'z')
    .replace(/[ëË]/g, 'e')
    .replace(/[çÇ]/g, 'c')
    .replace(/[üÜ]/g, 'u')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[ıİ]/g, 'i')
    .replace(/[œ]/g, 'oe')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeKosovoLocationName(name = '') {
  const base = normalizeText(name)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!base) return null;
  if (KOSOVO_LOCATION_ALIASES[base]) return KOSOVO_LOCATION_ALIASES[base];

  const direct = Object.keys(KOSOVO_LOCATION_ALIASES).find(key => base.includes(key));
  if (direct) return KOSOVO_LOCATION_ALIASES[direct];

  return null;
}

function extractLocations(text = '') {
  const values = new Map();
  const input = normalizeText(text);

  Object.entries(KOSOVO_LOCATION_ALIASES).forEach(([key, loc]) => {
    if (input.includes(key)) {
      values.set(loc.normalizedName, {
        originalName: loc.originalName,
        normalizedName: loc.normalizedName,
        municipality: loc.municipality,
        country: loc.country,
        region: loc.region,
        coordinates: loc.coordinates
      });
    }
  });

  return Array.from(values.values());
}

function extractEntities(title = '', description = '', locations = []) {
  const text = normalizeText(`${title} ${description}`);
  const entities = new Set();

  locations.forEach(location => {
    if (location.normalizedName) entities.add(location.normalizedName);
    if (location.municipality) entities.add(location.municipality);
  });

  Object.values(ENTITY_KEYWORDS).flat().forEach(keyword => {
    if (text.includes(normalizeText(keyword))) entities.add(keyword);
  });

  const directMatches = [
    'policija', 'policia', 'kfor', 'eulex', 'nato', 'kosovo police', 'municipality', 'customs', 'army', 'military', 'checkpoint',
    'bridge', 'airport', 'road', 'school', 'hospital', 'power plant', 'border crossing', 'railway', 'substation', 'airport', 'highway'
  ];
  directMatches.forEach(match => {
    if (text.includes(normalizeText(match))) entities.add(match);
  });

  return Array.from(entities).slice(0, 20);
}

function extractKeywords(title = '', description = '') {
  const text = normalizeText(`${title} ${description}`)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token && token.length > 3 && !STARTER_STOP_WORDS.has(token));

  const freq = new Map();
  text.forEach(token => {
    freq.set(token, (freq.get(token) || 0) + 1);
  });

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([token]) => token);
}

function calculateSeverity(title = '', description = '', category = 'Other', locations = []) {
  const text = normalizeText(`${title} ${description}`);
  let score = 0;

  const urgencyPatterns = [
    'dead', 'killed', 'injured', 'attack', 'explosion', 'blast', 'clash', 'fire', 'shooting', 'terror', 'armed',
    'road closed', 'checkpoint', 'evacuated', 'casualty', 'casualties', 'alert', 'curfew', 'damaged', 'collapsed',
    'military', 'border', 'accident', 'power outage', 'riot', 'protest', 'arrest', 'detained', 'bomb'
  ];

  urgencyPatterns.forEach(pattern => {
    if (text.includes(normalizeText(pattern))) score += 2;
  });

  if (/\b(killed|dead|murder|fatal|casualty|casualties|injured|wounded)\b/.test(text)) score += 4;
  if (/\b(attack|explosion|bomb|shooting|clash|fire)\b/.test(text)) score += 4;
  if (/\b(road|bridge|power|water|hospital|airport|railway)\b/.test(text) && /\b(damage|closed|collapse|outage|fail|damaged)\b/.test(text)) score += 3;
  if (category === 'Military' || category === 'Terrorism' || category === 'Border Activity') score += 3;
  if (category === 'Civil Unrest') score += 2;
  if (locations.some(loc => loc.country === 'Kosovo')) score += 2;

  if (score >= 12) return 'CRITICAL';
  if (score >= 8) return 'HIGH';
  if (score >= 4) return 'MEDIUM';
  return 'LOW';
}

function calculateConfidence(articles = []) {
  const avgReliability = articles.reduce((sum, article) => sum + (article.reliability || 0.5), 0) / Math.max(articles.length, 1);
  const uniqueSources = new Set(articles.map(article => article.source)).size;
  const corroboration = Math.min(100, articles.length * 18 + uniqueSources * 12);
  const completeness = Math.min(100, (articles.filter(article => article.title && article.description).length / Math.max(articles.length, 1)) * 100);
  const confidence = Math.round((avgReliability * 45) + (corroboration * 0.35) + (completeness * 0.20));
  return Math.min(100, Math.max(0, confidence));
}

function calculateThreatScore({ severity, confidence, locations, sourceCount, recencyHours, category }) {
  const severityWeight = { LOW: 18, MEDIUM: 35, HIGH: 60, CRITICAL: 82 }[severity] || 18;
  const kosovoWeight = locations.some(loc => loc.country === 'Kosovo') ? 22 : 0;
  const categoryWeight = CATEGORY_PRIORITY[category] || 10;
  const recencyFactor = Math.max(0, 20 - Math.min(recencyHours, 20));
  const sourceWeight = Math.min(18, sourceCount * 5);

  return Math.min(100, Math.round(severityWeight * 0.42 + confidence * 0.28 + kosovoWeight * 0.28 + recencyFactor * 0.10 + sourceWeight * 0.12 + categoryWeight * 0.18));
}

function classifyArticle(text = '') {
  const normalized = normalizeText(text);
  let bestCategory = 'Other';
  let bestHits = 0;

  Object.entries(ALERT_WORDS).forEach(([key, words]) => {
    const hits = words.reduce((count, word) => {
      const norm = normalizeText(word);
      return count + (normalized.includes(norm) ? 1 : 0);
    }, 0);

    if (hits > bestHits) {
      bestHits = hits;
      bestCategory = CATEGORY_MAP[key] || 'Other';
    }
  });

  if (bestHits === 0) {
    const fallback = normalizeText(text);
    if (/\b(terror|attack|explosion|bomb|shooting|armed)\b/.test(fallback)) bestCategory = 'Terrorism';
    else if (/\b(military|army|troops|brigade|battalion|base|airbase|exercise)\b/.test(fallback)) bestCategory = 'Military';
    else if (/\b(border|checkpoint|customs|crossing|frontier|passport)\b/.test(fallback)) bestCategory = 'Border Activity';
    else if (/\b(protest|riot|demonstration|blockade|strike|civil)\b/.test(fallback)) bestCategory = 'Civil Unrest';
    else if (/\b(cyber|hacker|ddos|ransom|malware|breach)\b/.test(fallback)) bestCategory = 'Cyber';
    else if (/\b(road|bridge|water|power|airport|rail|hospital|school|energy)\b/.test(fallback)) bestCategory = 'Infrastructure';
    else if (/\b(flood|earthquake|storm|wildfire|weather|rain|snow)\b/.test(fallback)) bestCategory = 'Weather';
  }

  return bestCategory;
}

function scoreArticle(title, description) {
  const text = `${title} ${description}`;
  const category = classifyArticle(text);
  const locations = extractLocations(text);
  const severity = calculateSeverity(title, description, category, locations);
  const tags = extractKeywords(title, description);

  let score = 1;
  score += severity === 'CRITICAL' ? 7 : severity === 'HIGH' ? 5 : severity === 'MEDIUM' ? 3 : 1;
  if (locations.some(loc => loc.country === 'Kosovo')) score += 3;
  if (tags.length > 4) score += 2;

  return {
    score: Math.min(10, score),
    category,
    severity,
    tags: [...new Set(tags)]
  };
}

function buildEventFromArticles(articles = []) {
  if (!articles.length) return [];

  const grouped = new Map();

  articles.forEach(article => {
    const normalizedTitle = normalizeText(article.title);
    let matched = null;

    for (const [eventId, existing] of grouped.entries()) {
      const existingTitle = normalizeText(existing.title);
      const sameLocation = article.locations?.some(loc => existing.locations?.some(existingLoc => existingLoc.normalizedName === loc.normalizedName)) || false;
      const titleSimilarity = existingTitle && normalizedTitle ?
        (existingTitle.includes(normalizedTitle.slice(0, 12)) || normalizedTitle.includes(existingTitle.slice(0, 12))) ? 0.9 : 0 : 0;
      const sharedWords = new Set(existing.keywords || []).size && new Set((existing.keywords || []).filter(word => (article.keywords || []).includes(word))).size;
      if (sameLocation && (titleSimilarity > 0.8 || sharedWords > 0)) {
        matched = eventId;
        break;
      }
    }

    if (!matched) {
      grouped.set(`event-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, {
        id: `event-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        title: article.title,
        summary: article.description || article.title,
        category: article.category,
        severity: article.severity,
        confidence: 0,
        threatScore: 0,
        locations: article.locations || [],
        entities: article.entities || [],
        keywords: article.keywords || [],
        timeline: {
          earliest: article.publishedAt,
          latest: article.publishedAt
        },
        sources: [{ name: article.source, language: article.language, url: article.url }],
        relatedArticles: [article],
        createdAt: article.publishedAt,
        updatedAt: article.publishedAt
      });
      return;
    }

    const event = grouped.get(matched);
    event.relatedArticles.push(article);
    event.sources.push({ name: article.source, language: article.language, url: article.url });
    event.locations = [...new Map([...event.locations, ...(article.locations || [])].map(item => [item.normalizedName || item.originalName || item.city || item.country, item])).values()];
    event.entities = [...new Set([...(event.entities || []), ...(article.entities || [])])];
    event.keywords = [...new Set([...(event.keywords || []), ...(article.keywords || [])])].slice(0, 20);
    event.title = event.title || article.title;
    event.summary = event.summary || article.description || article.title;
    event.timeline.earliest = new Date(Math.min(new Date(event.timeline.earliest).getTime(), new Date(article.publishedAt).getTime())).toISOString();
    event.timeline.latest = new Date(Math.max(new Date(event.timeline.latest).getTime(), new Date(article.publishedAt).getTime())).toISOString();
    event.updatedAt = event.timeline.latest;
    event.confidence = calculateConfidence(event.relatedArticles);
    event.threatScore = calculateThreatScore({
      severity: event.severity,
      confidence: event.confidence,
      locations: event.locations,
      sourceCount: new Set(event.sources.map(s => s.name)).size,
      recencyHours: Math.max(0, (Date.now() - new Date(event.timeline.latest).getTime()) / (1000 * 60 * 60)),
      category: event.category
    });
    event.severity = calculateSeverity(event.title, event.summary, event.category, event.locations);
  });

  return [...grouped.values()].map((event) => {
    const allArticles = event.relatedArticles || [];
    const topArticle = allArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))[0] || {};
    event.title = topArticle.title || event.title;
    event.summary = topArticle.description || event.summary;
    event.category = classifyArticle(`${event.title} ${event.summary}`);
    event.severity = calculateSeverity(event.title, event.summary, event.category, event.locations);
    event.confidence = calculateConfidence(allArticles);
    event.threatScore = calculateThreatScore({
      severity: event.severity,
      confidence: event.confidence,
      locations: event.locations,
      sourceCount: new Set(event.sources.map(s => s.name)).size,
      recencyHours: Math.max(0, (Date.now() - new Date(event.timeline.latest).getTime()) / (1000 * 60 * 60)),
      category: event.category
    });
    event.sources = [...new Map(event.sources.map(item => [item.name, item])).values()];
    event.relatedArticles = allArticles.map(article => ({
      id: article.id,
      title: article.title,
      source: article.source,
      url: article.url,
      publishedAt: article.publishedAt,
      language: article.language,
      category: article.category,
      reliability: article.reliability,
      intensityScore: article.intensityScore
    }));
    return event;
  });
}

// ─────────────────────────────────────
// RSS Fetch// ─────────────────────────────────────


async function fetchRSS(source) {

  try {

    const response =
      await axios.get(
        source.url,
        {
          timeout: 8000,

          headers: {
            'User-Agent':
              'Mozilla/5.0 SENTINEL Intelligence'
          }
        }
      );


    const parsed =
      await xml2js.parseStringPromise(
        response.data
      );


    const items =
      parsed.rss?.channel?.[0]?.item || [];


    return items.map(
      (item,index)=>{


        const title =
          item.title?.[0] || '';



        const description =
          item.description?.[0]
          ?.replace(/<[^>]+>/g,'')
          || '';



        // FIX: RSS link parsing
        let link = '#';


        if (typeof item.link?.[0] === 'string') {

          link = item.link[0];

        }
        else if (item.link?.[0]?._) {

          link = item.link[0]._ ;

        }
        else if (item.link?.[0]?.$?.href) {

          link = item.link[0].$.href;

        }



        const date =
          item.pubDate?.[0]
          ||
          new Date().toISOString();




        const analysis =
          scoreArticle(
            title,
            description
          );




        return {


          id:
            `${source.name}-${index}`,



          title,



          description:
            description.substring(0,300),



          url:
            link,



          source:
            source.name,



          language:
            source.lang,



          reliability:
            SOURCE_RELIABILITY[source.name] || 0.5,



          publishedAt:
            new Date(date).toISOString(),



          intensityScore:
            analysis.score,



          category:
            analysis.category,



          tags:
            analysis.tags


        };


      });


  }

  catch(error) {


    console.log(
      `[news-intel] ${source.name} failed: ${error.message}`
    );


    return [];

  }

}



// ─────────────────────────────────────
// MAIN
// ─────────────────────────────────────


async function fetchNews({
  location='Kosovo',
  timeline='24h',
  keywords=[]
}) {
  console.log(`[news-intel] Kosovo RSS scan: ${location}`);

  const feeds = await Promise.all(SOURCES.map(fetchRSS));
  let articles = feeds.flat();

  articles = articles.map(article => {
    const titleText = `${article.title || ''} ${article.description || ''}`;
    const locations = extractLocations(titleText);
    const category = classifyArticle(titleText);
    const severity = calculateSeverity(article.title || '', article.description || '', category, locations);
    const keywordsList = extractKeywords(article.title || '', article.description || '');
    const entities = extractEntities(article.title || '', article.description || '', locations);

    return {
      ...article,
      category,
      severity,
      locations,
      entities,
      keywords: keywordsList,
      reliability: article.reliability || 0.5,
      confidence: 0,
      threatScore: 0,
      intellgienceEventId: null,
      normalizedLocationNames: locations.map(loc => loc.normalizedName)
    };
  });

  articles.sort((a, b) => b.intensityScore - a.intensityScore);

  const intelligenceEvents = buildEventFromArticles(articles)
    .sort((a, b) => b.threatScore - a.threatScore || b.confidence - a.confidence || new Date(b.timeline.latest) - new Date(a.timeline.latest));

  const rankedArticles = articles
    .map(article => ({
      ...article,
      confidence: Math.min(100, Math.round((article.reliability || 0.5) * 100)),
      threatScore: calculateThreatScore({
        severity: article.severity,
        confidence: Math.min(100, Math.round((article.reliability || 0.5) * 100)),
        locations: article.locations || [],
        sourceCount: 1,
        recencyHours: Math.max(0, (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60)),
        category: article.category
      })
    }))
    .sort((a, b) => b.threatScore - a.threatScore || b.confidence - a.confidence || new Date(b.publishedAt) - new Date(a.publishedAt));

  return {
    skill: 'news-intel',
    location,
    fetchedAt: new Date().toISOString(),
    source: 'kosovo-local-rss',
    items: rankedArticles.slice(0, 50),
    intelligenceEvents: intelligenceEvents.slice(0, 25),
    summary: {
      total: articles.length,
      highIntensity: articles.filter(a => a.intensityScore >= 7).length,
      maxScore: articles[0]?.intensityScore || 0,
      eventCount: intelligenceEvents.length,
      averageThreat: intelligenceEvents.length ? Math.round(intelligenceEvents.reduce((sum, event) => sum + event.threatScore, 0) / intelligenceEvents.length) : 0
    }
  };
}


module.exports = {
  fetchNews
};