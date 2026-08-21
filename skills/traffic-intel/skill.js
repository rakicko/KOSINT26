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

function classifyTrafficIncident(title, description) {
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  
  for (const lang of ['sq', 'sr']) {
    const terms = TRAFFIC_RELEVANCE_TERMS[lang];
    if (!terms) continue;

    for (const term of terms.closure_blockage) {
      if (text.includes(term.toLowerCase())) {
        return { isTraffic: true, type: 'road_closure', label: 'Road Closure / Blockade' };
      }
    }
    for (const term of terms.accident) {
      if (text.includes(term.toLowerCase())) {
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
  { city: 'Vushtrri', lat: 42.8250, lon: 20.9660, keywords: ['smrekonic', 'smrekovnic', 'vushtrr', 'vučitrn', 'vucitrn'] },
  { city: 'Drenas', lat: 42.6250, lon: 20.8920, keywords: ['komoran', 'drenas', 'gllogoc', 'glogovac'] },
  { city: 'Suharekë', lat: 42.3600, lon: 20.8250, keywords: ['duhël', 'duhel', 'dulje', 'suharek', 'suva reka', 'therand'] },
  { city: 'Podujevë', lat: 42.9100, lon: 21.1900, keywords: ['merdar', 'lluzhan', 'podujev', 'podujevo', 'besian'] },
  { city: 'Brezovicë', lat: 42.2180, lon: 20.9980, keywords: ['brezovic', 'shtërpc', 'shterpc', 'štrpce', 'strpce'] },
  { city: 'Shtime', lat: 42.4330, lon: 21.0400, keywords: ['carralev', 'shtime', 'štimlje', 'stimlje'] },
  { city: 'Pejë', lat: 42.6593, lon: 20.2887, keywords: ['rugov', 'pejë', 'peje', 'peć', 'pec'] },
  { city: 'Mitrovicë', lat: 42.8914, lon: 20.8660, keywords: ['zveçan', 'zvecan', 'mitrovic', 'mitrovica'] },
  { city: 'Leposaviq', lat: 43.1000, lon: 20.8000, keywords: ['jaranja', 'jarinj', 'leposaviq', 'leposavić', 'leposavic'] },
  { city: 'Zubin Potok', lat: 42.9100, lon: 20.6900, keywords: ['gazivod', 'ujman', 'zubin potok'] },
  { city: 'Fushë Kosovë', lat: 42.6340, lon: 21.0960, keywords: ['fushë kosov', 'fushe kosov', 'kosovo polje'] },
  { city: 'Prishtinë', lat: 42.6629, lon: 21.1655, keywords: ['veternik', 'çagllavic', 'caglavic', 'prishtin', 'prištin', 'pristina'] },
  { city: 'Prizren', lat: 42.2139, lon: 20.7397, keywords: ['shadervan', 'ortakoll', 'bazhderhane', 'prizren'] },
  { city: 'Gjilan', lat: 42.4635, lon: 21.4694, keywords: ['gavran', 'gjilan', 'gnjilan'] },
  { city: 'Ferizaj', lat: 42.3705, lon: 21.1530, keywords: ['ferizaj', 'uroševac', 'urosevac'] },
  { city: 'Gjakovë', lat: 42.3810, lon: 20.4320, keywords: ['gjakov', 'đakovic', 'djakovic'] },
  { city: 'Rahovec', lat: 42.3990, lon: 20.6550, keywords: ['rahovec', 'orahovac'] },
  { city: 'Klinë', lat: 42.6210, lon: 20.5780, keywords: ['klinë', 'kline', 'klina'] },
  { city: 'Deçan', lat: 42.5410, lon: 20.2880, keywords: ['deçan', 'decan', 'dečani', 'decani'] },
  { city: 'Istog', lat: 42.7800, lon: 20.4900, keywords: ['istog', 'istok', 'burim'] },
  { city: 'Lipjan', lat: 42.5220, lon: 21.1250, keywords: ['janjev', 'lipjan', 'lipljan'] },
  { city: 'Kaçanik', lat: 42.2300, lon: 21.2600, keywords: ['kaçanik', 'kacanik'] },
  { city: 'Skenderaj', lat: 42.7480, lon: 20.7890, keywords: ['skenderaj', 'srbica'] },
  { city: 'Malishevë', lat: 42.4820, lon: 20.7450, keywords: ['malishev', 'mališevo', 'malisevo'] },
  { city: 'Kamenicë', lat: 42.5780, lon: 21.5800, keywords: ['dardan', 'kamenic', 'kamenica'] },
  { city: 'Viti', lat: 42.3210, lon: 21.3580, keywords: ['kllokot', 'klokot', 'viti', 'vitina'] }
];

function extractLocation(title, description) {
  const titleLower = (title || '').toLowerCase();
  const descLower = (description || '').toLowerCase();
  
  for (const loc of KOSOVO_LOCATIONS) {
    for (const kw of loc.keywords) {
      if (titleLower.includes(kw.toLowerCase())) {
        return { city: loc.city, lat: loc.lat, lon: loc.lon };
      }
    }
  }

  for (const loc of KOSOVO_LOCATIONS) {
    for (const kw of loc.keywords) {
      if (descLower.includes(kw.toLowerCase())) {
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