'use strict';

/**
 * Authoritative Albanian (sq) and Serbian (sr) Traffic Incident Lexicon
 * Categorized by incident nature with targeted keyword patterns to avoid false positives.
 */
const TRAFFIC_RELEVANCE_TERMS = {
  sq: {
    accident: [
      'aksident', 'aksidente', 'aksidenti', 'aksidentuar', 'përplasje', 'përplasur', 'u përplasën',
      'ndeshje automjetesh', 'ndeshje trafiku', 'rrokullisje e automjetit', 'rrokullisur vetura',
      'goditje e këmbësorit', 'veturë e aksidentuar', 'aksident trafiku', 'aksident komunikacioni'
    ],
    closure_blockage: [
      'rrugë e mbyllur', 'rruga e mbyllur', 'mbyllet rruga', 'mbyllje e rrugës', 'bllokohet rruga',
      'rrugë e bllokuar', 'rruga e bllokuar', 'bllokim i rrugës', 'bllokimi i rrugës',
      'ndërprerje e qarkullimit', 'ndërprerë qarkullimi', 'ndërprerje e trafikut',
      'bllokadë policore', 'bllokim nga policia', 'e pakalueshme', 'ndalim qarkullimi'
    ],
    congestion: [
      'kolonë automjetesh', 'kolona të gjata', 'kolonë kilometrike', 'kolonë e gjatë',
      'dendësi trafiku', 'trafik i rënduar', 'fluks i madh i automjeteve', 'vonesa në trafik',
      'ngarkesë në trafik', 'radhë të gjata automjetesh'
    ],
    roadworks: [
      'punime në rrugë', 'punimet në rrugë', 'punime në aksin', 'mbyllje e korsisë',
      'korsi e bllokuar', 'devijim i trafikut', 'riorientim i qarkullimit', 'asfaltim i rrugës',
      'rindërtim i rrugës', 'sinjalistikë rrugore'
    ],
    hazard_weather: [
      'rrëshqitje dheu', 'rrëshqitje e dheut', 'rënie gurësh në rrugë', 'shembje dheu',
      'vërshime në rrugë', 'ujë në rrugë', 'përmbytje e rrugës', 'vërshuar rruga',
      'akull në rrugë', 'ngrica në rrugë', 'borë në rrugë', 'rrugë me borë', 'ngricë në rrugë',
      'dëmtim i rrugës', 'dëmtim i urës', 'shembje e urës', 'gropa në rrugë', 'shembje e rrugës'
    ]
  },
  sr: {
    accident: [
      'saobraćajna nezgoda', 'saobraćajne nezgode', 'saobraćajnoj nezgodi', 'saobraćajnih nezgoda',
      'saobraćajna nesreća', 'saobraćajne nesreće', 'saobraćajnoj nesreći', 'saobraćajnih nesreća',
      'sudar', 'sudara', 'sudarili', 'sudaru', 'lančani sudar',
      'udes', 'udesa', 'udesu', 'prevrtanje vozila', 'sletanje sa puta', 'obaranje pešaka'
    ],
    closure_blockage: [
      'zatvoren put', 'zatvorena ulica', 'zatvoreni putevi', 'zatvaranje puta',
      'blokiran put', 'blokirana ulica', 'blokada puta', 'blokiran saobraćaj',
      'obustava saobraćaja', 'obustavljen saobraćaj', 'prekid saobraćaja',
      'neprohodan put', 'neprohodno za saobraćaj', 'policijska blokada', 'policijska blokada puta'
    ],
    congestion: [
      'saobraćajni zastoj', 'zastoji u saobraćaju', 'zastoj', 'saobraćajna gužva',
      'gužva u saobraćaju', 'gužve u saobraćaju', 'kolona vozila', 'kolone vozila',
      'duge kolone', 'otežan saobraćaj', 'usporen saobraćaj', 'kilometarska kolona'
    ],
    roadworks: [
      'radovi na putu', 'radovi na kolovozu', 'radovi na deonici', 'zatvaranje trake',
      'zatvorena traka', 'preusmeravanje saobraćaja', 'rekonstrukcija puta', 'asfaltiranje puta',
      'popravka kolovoza'
    ],
    hazard_weather: [
      'odron na putu', 'odron kamena', 'odroni na putu', 'odroni', 'klizište', 'klizišta na putu',
      'poplava na putu', 'voda na kolovozu', 'bujica na putu', 'poledica na putu', 'poledica',
      'led na putu', 'sneg na putu', 'snežni nanosi', 'oštećenje puta',
      'oštećenje mosta', 'rupa na kolovozu', 'urušavanje mosta', 'oštećen most'
    ]
  }
};

const NON_TRAFFIC_ACCIDENTAL = /kallash|armë zjarri|arme zjarri|fishek|shkrep.*armë|shkrepur fishek|plagos.*me armë|u vetëvra|vetevra|ubistvo iz nehata|pucanje iz nehata/i;

function classifyTrafficIncident(title, description) {
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  
  if (NON_TRAFFIC_ACCIDENTAL.test(text) && !/aksident trafiku|aksident me veturë|saobraćajn|saobracajn/i.test(text)) {
    return { isTraffic: false, type: null, label: null };
  }

  for (const lang of ['sq', 'sr']) {
    const terms = TRAFFIC_RELEVANCE_TERMS[lang];
    if (!terms) continue;

    for (const term of terms.closure_blockage) {
      if (text.includes(term.toLowerCase())) {
        return { isTraffic: true, type: 'road_closure', label: 'Road Closure / Blockade' };
      }
    }
    for (const term of terms.accident) {
      const termLower = term.toLowerCase();
      if (termLower === 'aksident' && (text.includes('aksidentalisht') || text.includes('aksidentale'))) {
        if (text.includes('aksident trafiku') || text.includes('aksident rrugor') || text.includes('aksident me veturë') || text.includes('aksidenti') || text.includes('aksidente') || text.includes('aksidentuar')) {
          return { isTraffic: true, type: 'accident', label: 'Traffic Accident' };
        }
        continue;
      }
      if (text.includes(termLower)) {
        return { isTraffic: true, type: 'accident', label: 'Traffic Accident' };
      }
    }
    for (const term of terms.hazard_weather) {
      if (text.includes(term.toLowerCase())) {
        return { isTraffic: true, type: 'hazard', label: 'Road Hazard / Weather' };
      }
    }
    for (const term of terms.roadworks) {
      if (text.includes(term.toLowerCase())) {
        return { isTraffic: true, type: 'roadworks', label: 'Roadworks / Lane Closure' };
      }
    }
    for (const term of terms.congestion) {
      if (text.includes(term.toLowerCase())) {
        return { isTraffic: true, type: 'congestion', label: 'Traffic Congestion' };
      }
    }
  }

  return { isTraffic: false, type: null, label: null };
}

function detectAnomalies(incidents) {
  const closures = incidents.filter(i => i.type === 'road_closure');
  const accidents = incidents.filter(i => i.type === 'accident');

  if (closures.length >= 2 && accidents.length === 0) {
    return { detected: true, type: 'vip_movement', summary: `${closures.length} simultaneous road closures — possible security convoy or cordon` };
  }
  if (closures.length >= 3) {
    return { detected: true, type: 'perimeter', summary: 'Multiple closures forming potential security perimeter' };
  }
  return { detected: false, type: null, summary: null };
}

const KOSOVO_LOCATIONS = [
  // North Kosovo Municipalities & Key Towns
  { city: 'Zveçan', lat: 42.9080, lon: 20.8400, keywords: ['zveçan', 'zvečan', 'zvecan', 'banjsk', 'banjska'] },
  { city: 'Leposaviq', lat: 43.1000, lon: 20.8000, keywords: ['jaranja', 'jarinj', 'leposaviq', 'leposavić', 'leposavic', 'sočanic', 'soçanic'] },
  { city: 'Zubin Potok', lat: 42.9100, lon: 20.6900, keywords: ['zubin potok', 'gazivod', 'ujman', 'varag', 'varage'] },
  { city: 'Mitrovicë', lat: 42.8914, lon: 20.8660, keywords: ['mitrovic', 'mitrovica', 'mitrovicë', 'mitrovice', 'severna mitrovica', 'mitrovica e veriut', 'mitrovica e jugut', 'ibër bridge', 'most na ibru', 'ura e ibrit'] },

  // Border Crossings & Key Landmarks
  { city: 'Merdare', lat: 42.9367, lon: 21.2425, keywords: ['merdar', 'merdare'] },
  { city: 'Bërnjak', lat: 42.9667, lon: 20.5500, keywords: ['bërnjak', 'bernjak', 'brnjak'] },

  // Other Kosovo Municipalities & Towns
  { city: 'Prishtinë', lat: 42.6629, lon: 21.1655, keywords: ['prishtin', 'prištin', 'pristina', 'veternik', 'çagllavic', 'caglavic', 'hajvali', 'hajvalia'] },
  { city: 'Graçanicë', lat: 42.6000, lon: 21.1930, keywords: ['graçanic', 'gračanica', 'gracanica'] },
  { city: 'Fushë Kosovë', lat: 42.6340, lon: 21.0960, keywords: ['fushë kosov', 'fushe kosov', 'kosovo polje'] },
  { city: 'Obiliq', lat: 42.6870, lon: 21.0770, keywords: ['obiliq', 'obilić', 'kastriot', 'kek'] },
  { city: 'Podujevë', lat: 42.9100, lon: 21.1900, keywords: ['podujev', 'podujevo', 'besian', 'lluzhan'] },
  { city: 'Vushtrri', lat: 42.8250, lon: 20.9660, keywords: ['vushtrr', 'vučitrn', 'vucitrn', 'smrekonic', 'smrekovnic'] },
  { city: 'Drenas', lat: 42.6250, lon: 20.8920, keywords: ['drenas', 'gllogoc', 'glogovac', 'komoran'] },
  { city: 'Skenderaj', lat: 42.7480, lon: 20.7890, keywords: ['skenderaj', 'srbica', 'prekaz'] },
  { city: 'Pejë', lat: 42.6593, lon: 20.2887, keywords: ['pejë', 'peje', 'peć', 'pec', 'rugov'] },
  { city: 'Istog', lat: 42.7800, lon: 20.4900, keywords: ['istog', 'istok', 'burim'] },
  { city: 'Klinë', lat: 42.6210, lon: 20.5780, keywords: ['klinë', 'kline', 'klina'] },
  { city: 'Deçan', lat: 42.5410, lon: 20.2880, keywords: ['deçan', 'decan', 'dečani', 'decani'] },
  { city: 'Gjakovë', lat: 42.3810, lon: 20.4320, keywords: ['gjakov', 'đakovic', 'djakovic'] },
  { city: 'Rahovec', lat: 42.3990, lon: 20.6550, keywords: ['rahovec', 'orahovac'] },
  { city: 'Malishevë', lat: 42.4820, lon: 20.7450, keywords: ['malishev', 'mališevo', 'malisevo'] },
  { city: 'Prizren', lat: 42.2139, lon: 20.7397, keywords: ['prizren', 'shadervan', 'ortakoll', 'bazhderhane'] },
  { city: 'Suharekë', lat: 42.3600, lon: 20.8250, keywords: ['suharek', 'suva reka', 'therand', 'duhël', 'duhel', 'dulje'] },
  { city: 'Shtërpcë', lat: 42.2394, lon: 21.0261, keywords: ['shtërpc', 'shterpc', 'štrpce', 'strpce', 'brezovic'] },
  { city: 'Shtime', lat: 42.4330, lon: 21.0400, keywords: ['shtime', 'štimlje', 'stimlje', 'carralev'] },
  { city: 'Ferizaj', lat: 42.3705, lon: 21.1530, keywords: ['ferizaj', 'uroševac', 'urosevac'] },
  { city: 'Lipjan', lat: 42.5220, lon: 21.1250, keywords: ['lipjan', 'lipljan', 'janjev'] },
  { city: 'Gjilan', lat: 42.4635, lon: 21.4694, keywords: ['gjilan', 'gnjilan', 'gavran'] },
  { city: 'Kamenicë', lat: 42.5780, lon: 21.5800, keywords: ['kamenic', 'kamenica', 'dardan'] },
  { city: 'Viti', lat: 42.3210, lon: 21.3580, keywords: ['viti', 'vitina', 'kllokot', 'klokot'] },
  { city: 'Kaçanik', lat: 42.2300, lon: 21.2600, keywords: ['kaçanik', 'kacanik'] }
];

function cleanTextForLocation(text) {
  if (!text) return '';
  let t = String(text).toLowerCase();
  t = t.replace(/mitrovicasot(\.net)?/g, '');
  t = t.replace(/radio\s*(kosovska\s*)?mitrovica(\s*sever)?/g, '');
  t = t.replace(/kossev(\.info)?/g, '');
  t = t.replace(/gazeta\s*express/g, '');
  t = t.replace(/klan\s*kosova/g, '');
  t = t.replace(/indeks\s*online/g, '');
  t = t.replace(/jepize(\.com)?/g, '');
  t = t.replace(/mitropol(\.net)?/g, '');
  t = t.replace(/lajmi(\.net)?/g, '');
  return t;
}

function extractLocation(title, description) {
  const cleanTitle = cleanTextForLocation(title);
  const cleanDesc = cleanTextForLocation(description);
  
  for (const loc of KOSOVO_LOCATIONS) {
    for (const kw of loc.keywords) {
      if (cleanTitle.includes(kw.toLowerCase())) {
        return { city: loc.city, lat: loc.lat, lon: loc.lon };
      }
    }
  }

  for (const loc of KOSOVO_LOCATIONS) {
    for (const kw of loc.keywords) {
      if (cleanDesc.includes(kw.toLowerCase())) {
        return { city: loc.city, lat: loc.lat, lon: loc.lon };
      }
    }
  }

  return null;
}

function extractTrafficIncidents(newsItems) {
  if (!newsItems || !Array.isArray(newsItems)) return [];
  
  const incidents = [];
  for (const item of newsItems) {
    if (!item || !item.title) continue;

    const classification = classifyTrafficIncident(item.title, item.description);
    if (!classification.isTraffic) continue;

    const location = extractLocation(item.title, item.description);
    const desc = (item.description || item.title || 'Traffic incident').substring(0, 300);

    incidents.push({
      id: `traffic-${item.id || incidents.length}`,
      type: classification.type,
      typeLabel: classification.label,
      title: item.title,
      description: desc,
      source: item.source || 'News Intelligence',
      publishedAt: item.publishedAt || new Date().toISOString(),
      url: item.url || item.link || '#',
      location: location || null
    });
  }

  return incidents;
}

async function fetchTraffic({ location, news = null }) {
  let incidents = [];
  let newsItems = [];

  if (news && news.items && Array.isArray(news.items)) {
    newsItems = news.items;
    incidents = extractTrafficIncidents(newsItems);
  }

  const uniqueIncidents = Array.from(new Map(incidents.map(i => [i.title + i.source, i])).values());

  const anomaly = detectAnomalies(uniqueIncidents);
  if (anomaly.detected) {
    uniqueIncidents.forEach(i => {
      i.anomaly = true;
      i.anomalyType = anomaly.type;
    });
  }

  return {
    skill: 'traffic-intel',
    location: location || 'Kosovo',
    fetchedAt: new Date().toISOString(),
    incidents: uniqueIncidents,
    source: uniqueIncidents.length > 0 ? 'news-rss' : 'none',
    anomalyDetected: anomaly.detected,
    anomalySummary: anomaly.summary
  };
}

module.exports = {
  fetchTraffic,
  extractLocation,
  extractTrafficIncidents,
  classifyTrafficIncident,
  TRAFFIC_RELEVANCE_TERMS
};