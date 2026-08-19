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

function extractTrafficIncidents(newsItems) {
  if (!newsItems || !Array.isArray(newsItems)) return [];
  
  return newsItems
    .filter(item => item.title && filterTrafficKeywords(item.title + ' ' + (item.description || '')))
    .map(item => {
      const type = determineIncidentType(item.title, item.description);
      const desc = (item.description || item.title || 'Traffic event').substring(0, 300);
      
      return {
        id: `traffic-${item.id}`,
        type,
        title: item.title,
        description: desc,
        source: item.source || 'news',
        publishedAt: item.publishedAt || new Date().toISOString(),
        url: item.url || item.link || '#'
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

module.exports = { fetchTraffic };