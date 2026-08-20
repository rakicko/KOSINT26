'use strict';

const TRAFFIC_KEYWORDS = {
  en: ['accident', 'crash', 'collision', 'traffic accident', 'road closed', 'road closure', 'blocked road', 'traffic disruption', 'roadworks', 'vehicle overturned', 'accident on', 'collision on'],
  sr: ['saobraćaj', 'saobraćajна nesrećа', 'udes', 'sudar', 'nesrećа', 'nezgoda', 'blokiran put', 'zatворен put', 'obustava saobraćaja', 'gužva', 'zastoj', 'kolona', 'put blokiran', 'uspavljen put', 'saobraćaju', 'saobraćajна nesrećи'],
  al: ['aksident', 'aksident trafiku', 'përplasje', 'rrugë e bllokuar', 'rrugë e mbyllur', 'trafik', 'kolonë', 'bllokim']
};

function detectAnomalies(incidents) {
  const closures = incidents.filter(i => i.type === 'road_closure');
  const accidents = incidents.filter(i => i.type === 'accident');

  if (closures.length >= 2 && accidents.length === 0) {
    return { detected: true, type: 'vip_movement', summary: `${closures.length} simultaneous road closures — possible security convoy or security cordon` };
  }
  if (closures.length >= 3) {
    return { detected: true, type: 'perimeter', summary: 'Multiple closures forming possible security perimeter' };
  }
  return { detected: false, type: null, summary: null };
}

function filterTrafficKeywords(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  for (const lang of Object.keys(TRAFFIC_KEYWORDS)) {
    for (const kw of TRAFFIC_KEYWORDS[lang]) {
      if (lower.includes(kw.toLowerCase())) {
        return true;
      }
    }
  }
  return false;
}

function determineIncidentType(title, description) {
  const text = (title + ' ' + (description || '')).toLowerCase();
  
  if (text.includes('closure') || text.includes('zатворен') || text.includes('bllokuar') || text.includes('road closure') || text.includes('blocked road') || text.includes('rrugë e bllokuar') || text.includes('rrugë e mbyllur') || text.includes('put blokiran')) {
    return 'road_closure';
  }
  if (text.includes('congestion') || text.includes('gužva') || text.includes('kolonë')) {
    return 'congestion';
  }
  if (text.includes('roadworks') || text.includes('обуставе') || text.includes('construction') || text.includes('radova')) {
    return 'roadworks';
  }
  if (text.includes('accident') || text.includes('collision') || text.includes('crash') || text.includes('udes') || text.includes('sudar') || text.includes('zjarr') || text.includes('përplasje') || text.includes('aksident') || text.includes('nesrećа') || text.includes('nezgода') || text.includes('saobraćaj') || text.includes('saobraćaju') || text.includes('saobraćajна nesrećа')) {
    return 'accident';
  }
  if (text.includes('blockage') || text.includes('blokada') || text.includes('bllokadë') || text.includes('blokiran put')) {
    return 'road_block';
  }
  return 'other';
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
  { city: 'Viti', lat: 42.3210, lon: 21.3580, keywords: ['kllokot', 'klokot', 'viti', 'vitina'] },
];

function extractLocation(title, description) {
  const titleLower = (title || '').toLowerCase();
  const descLower = (description || '').toLowerCase();
  
  for (const loc of KOSOVO_LOCATIONS) {
    for (const kw of loc.keywords) {
      if (titleLower.includes(kw.toLowerCase())) {
        return {
          city: loc.city,
          lat: loc.lat,
          lon: loc.lon
        };
      }
    }
  }

  for (const loc of KOSOVO_LOCATIONS) {
    for (const kw of loc.keywords) {
      if (descLower.includes(kw.toLowerCase())) {
        return {
          city: loc.city,
          lat: loc.lat,
          lon: loc.lon
        };
      }
    }
  }

  return null;
}

function extractTrafficIncidents(newsItems) {
  if (!newsItems || !Array.isArray(newsItems)) return [];
  
  return newsItems
    .filter(item => item.title && filterTrafficKeywords(item.title + ' ' + (item.description || '')))
    .map(item => {
      const type = determineIncidentType(item.title, item.description);
      const desc = (item.description || item.title || 'Traffic event').substring(0, 300);
      const location = extractLocation(item.title, item.description);
      
      return {
        id: `traffic-${item.id}`,
        type,
        title: item.title,
        description: desc,
        source: item.source || 'news',
        publishedAt: item.publishedAt || new Date().toISOString(),
        url: item.url || item.link || '#',
        location: location || null
      };
    });
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

module.exports = { fetchTraffic, extractLocation, extractTrafficIncidents };