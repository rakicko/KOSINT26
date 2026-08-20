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
// Kosovo Relevance & Location Matching
// ─────────────────────────────────────

const KOSOVO_PATTERNS = [
  /kosov/i,
  /prishtin/i, /prištin/i, /pristina/i,
  /mitrovic/i, /\b(ibër|ibri|ibrit|ibar|ibru|ibra)\b/i,
  /zvečan/i, /zveçan/i, /zvecan/i,
  /leposav/i, /jarinj/i, /brnjak/i, /bërnjak/i, /merdar/i,
  /zubin/i, /gazivod/i, /ujman/i,
  /\b(pejë|peja|peje|peć|pec|peći)\b/i,
  /prizren/i, /gjilan/i, /gnjilan/i, /ferizaj/i, /uroševac/i, /urosevac/i,
  /drenas/i, /vushtrr/i, /vučitrn/i, /vucitrn/i, /podujev/i,
  /deçan/i, /decan/i, /dečani/i, /kamenic/i, /rahovec/i, /orahovac/i, /shtime/i, /štimlje/i, /kaçanik/i, /kacanik/i, /skenderaj/i, /srbica/i,
  /\b(kfor|eulex|unmik|osce|oebs)\b/i,
  /kurti/i, /osmani/i, /sveçl/i, /svecl/i, /bislimi/i, /srpska lista/i, /petković/i, /petkovic/i, /vučić/i, /vucic/i, /vuçiq/i, /rashiq/i, /rašić/i,
  /policia e kosov/i, /policija kosova/i, /\b(fsk|ksf)\b/i,
  /beograd/i
];

function hasKosovoContext(text) {
  if (!text) return false;
  return KOSOVO_PATTERNS.some(re => re.test(text));
}

function cleanTextForLocation(title, description) {
  let t = (title + ' ' + (description || '')).toLowerCase();
  t = t.replace(/mitrovicasot(\.net)?/g, '');
  t = t.replace(/radio\s*(kosovska\s*)?mitrovica(\s*sever)?/g, '');
  t = t.replace(/kossev/g, '');
  t = t.replace(/gazeta express/g, '');
  t = t.replace(/klan kosova/g, '');
  t = t.replace(/indeks online/g, '');
  return t;
}

const NORTH_KOSOVO_PATTERNS = [
  /sever kosov/i, /severu kosov/i, /veriu i kosov/i, /veri të kosovës/i, /veri te kosoves/i, /në veri\b/i, /na severu\b/i,
  /mitrovic/i, /\b(ibër|ibri|ibrit|ibar|ibru|ibra)\b/i,
  /zvečan/i, /zveçan/i, /zvecan/i,
  /leposav/i, /jarinj/i, /brnjak/i, /bërnjak/i,
  /zubin/i, /gazivod/i, /ujman/i, /kaludr/i, /kalludr/i, /banjsk/i
];

function isNorthKosovo(title, description) {
  const cleaned = cleanTextForLocation(title, description);
  return NORTH_KOSOVO_PATTERNS.some(re => re.test(cleaned));
}

// ─────────────────────────────────────
// Severity Signal Hierarchy
// ─────────────────────────────────────

// Tier 4: CRITICAL (9–10)
const CRITICAL_SIGNALS = [
  /pucnjav/i, /pucano/i, /të shtëna/i, /te shtena/i, /gjuajtje me armë/i,
  /ubistv/i, /ubijen/i, /ubijena/i, /vrasj/i, /vrarë/i, /likvidir/i,
  /eksplozij/i, /eksplodim/i, /mjet shpërthyes/i, /shperthim/i, /bomba/i, /bombë/i,
  /oružani incident/i, /oruzani incident/i, /oružani sukob/i, /oruzani sukob/i, /perleshje me arme/i, /përleshje me armë/i, /konflikt i armatosur/i,
  /arsenal/i, /veća količina oružja/i, /sasi e madhe e armëve/i, /72 armë/i,
  /napad na policiju/i, /sulm ndaj policisë/i, /napad na kfor/i, /sulm ndaj kfor/i,
  /ranjen iz vatrenog/i, /plagosur nga të shtënat/i
];

// Tier 3: HIGH (7–8)
const HIGH_SIGNALS = [
  /hapšen/i, /hapsen/i, /uhapšen/i, /uhapsen/i, /pritvor/i, /pritvoren/i, /arrestim/i, /arrestuar/i, /ndalim/i, /ndaluar/i,
  /racij/i, /pretres/i, /bastisj/i, /bastisur/i, /policijska akcija/i, /aksion policor/i, /policijska operacija/i, /operacion policor/i, /njësia speciale/i, /specijalci/i,
  /zaplen/i, /zaplena/i, /zaplenjeno/i, /sekuestr/i, /sekuestrim/i, /sekuestruar/i, /konfisk/i, /konfiskohen/i, /konfiskuar/i,
  /oružj/i, /oruzj/i, /municij/i, /armë/i, /arme/i, /armatim/i, /granat/i, /mitraljez/i, /kalašnjikov/i, /snajper/i,
  /barikad/i, /barrikad/i, /blokad/i, /bllokad/i, /neredi/i, /përplasje/i, /perplasje/i,
  /kontraband/i, /šverc/i, /sverc/i, /narkotik/i, /laborator drog/i, /narkotikë/i,
  /të plagosur/i, /plagosur/i, /ranjen/i, /ranjena/i,
  /incident në kufi/i, /granični incident/i, /incident na prelazu/i, /pika kufitare/i,
  /požar/i, /pozar/i, /zjarr/i, /poplav/i, /përmbyt/i, /evakuac/i, /evakuim/i
];

// Tier 2: MEDIUM (4–6)
const MEDIUM_SIGNALS = [
  /istrag/i, /hetim/i, /hetime/i, /tužilaštv/i, /prokurori/i,
  /policij/i, /policaj/i, /policia/i, /policisë/i, /policinë/i, /policët/i, /policor/i,
  /\b(kfor|eulex|nato|unmik|rosu|fsk|ksf)\b/i,
  /most na ibru/i, /mostu na ibru/i, /mosta na ibru/i, /ura e ibrit/i, /urën e ibrit/i, /otvaranje mosta/i, /hapja e urës/i,
  /tenzij/i, /tensione/i, /krizë/i, /kriza/i, /eskalac/i, /përshkallëz/i,
  /poginul/i, /viktim/i
];

// Commentary / Reaction Markers
const COMMENTARY_PATTERNS = [
  /\b(rekao|izjavio|poručio|istakao|kaže|tvrdi|ocenio|ocenjuje|pisao|tražio|najavio|upozorio|apelovao|komentarisao|reagovao|odgovor)\b/i,
  /\b(thotë|deklaroi|deklaron|tha|paralajmëroi|vlerëson|kërkoi|kërkon|shkroi|letër|leter|njoftoi|komentoi|reagoi|flet për)\b/i,
  /\b(analitičari|analistët|eksperti|ekspertët|opozita|opozicija|komentar)\b/i
];

// Confirmed Event Physical Action Markers
const EVENT_ACTION_PATTERNS = [
  /uhapšen/i, /uhapšeni/i, /uhapšena/i, /uhapsili/i, /zaplenjeno/i, /pronađeno/i, /otkriveno/i, /oduzeto/i, /pretreseno/i, /bastisur/i, /konfiskuar/i, /sekuestruar/i,
  /arrestohet/i, /arrestuar/i, /ndalohet/i, /ndaluar/i, /konfiskohet/i, /sekuestrohet/i, /gjetur/i, /zbuluar/i,
  /pucano/i, /pucnjava/i, /eksplodiralo/i, /napadnut/i, /napadnuta/i, /ranjen/i, /ubijen/i, /plagosur/i, /vrarë/i, /sulmuar/i,
  /konferencija policije/i, /konferencë e jashtëzakonshme/i, /aksion policor/i, /policijska akcija/i, /operacion policor/i, /patrola/i, /patrullim/i
];

// ─────────────────────────────────────
// Article Analysis Engine
// ─────────────────────────────────────

function analyzeArticle(title, description, publishedAt) {
  const fullText = `${title} ${description || ''}`.toLowerCase();
  const titleLower = title.toLowerCase();

  // 1. Must have explicit Kosovo relevance context
  if (!hasKosovoContext(fullText)) {
    return {
      intensityScore: 1,
      severity: 'low',
      category: 'other',
      eventType: 'commentary',
      confidence: 0.30,
      tags: [],
      isSecurityRelevant: false
    };
  }

  // 2. Identify Signals
  const isCritical = CRITICAL_SIGNALS.some(re => re.test(fullText));
  const isHigh = HIGH_SIGNALS.some(re => re.test(fullText));
  const isMedium = MEDIUM_SIGNALS.some(re => re.test(fullText));

  // If no security signal -> pure other / low priority
  if (!isCritical && !isHigh && !isMedium) {
    return {
      intensityScore: 1,
      severity: 'low',
      category: 'other',
      eventType: 'commentary',
      confidence: 0.30,
      tags: [],
      isSecurityRelevant: false
    };
  }

  // 3. Event vs Commentary
  const isCommentary = COMMENTARY_PATTERNS.some(re => re.test(titleLower)) && !EVENT_ACTION_PATTERNS.some(re => re.test(titleLower));
  const eventType = isCommentary ? 'commentary' : 'event';

  // 4. Base Severity Level
  let baseScore = 3;
  let severity = 'low';
  let category = 'security';

  if (isCritical) {
    baseScore = 9;
    severity = 'critical';
  } else if (isHigh) {
    baseScore = 7;
    severity = 'high';
  } else if (isMedium) {
    baseScore = 4;
    severity = 'medium';
  }

  // Category determination
  if (/barikad|barrikad|blokad|bllokad|protest|demonstra|tenzij|tensione|krizë/i.test(fullText) && !isCritical) {
    category = 'unrest';
  } else if (/požar|pozar|zjarr|eksplozij|eksplodim|poplav|përmbyt|evakuac|poginul|viktim/i.test(fullText) && !isCritical) {
    category = 'emergency';
  }

  // Commentary adjustment (confirmed events take precedence over talk/reactions)
  if (eventType === 'commentary') {
    baseScore = Math.max(2, baseScore - 1);
    if (severity === 'critical') severity = 'high';
    else if (severity === 'high') severity = 'medium';
    else if (severity === 'medium') severity = 'low';
  }

  // 5. North Kosovo Check
  let north = isNorthKosovo(title, description);
  // KEK/Obiliq/Pristina district override
  if (/kek\b|obiliq|kastriot/i.test(fullText)) {
    north = false;
  }

  let northBoost = 0;
  if (north && (isCritical || isHigh || isMedium)) {
    category = 'north_kosovo';
    northBoost = 2;
  }

  // 6. Temporal Boost
  let timeBoost = 0;
  if (publishedAt) {
    const pubTime = new Date(publishedAt).getTime();
    if (!isNaN(pubTime)) {
      const ageHours = (Date.now() - pubTime) / (3600 * 1000);
      if (ageHours < 3) timeBoost = 2;
      else if (ageHours < 6) timeBoost = 1;
    }
  }

  const finalScore = Math.min(10, baseScore + northBoost + timeBoost);

  // Recalculate severity label
  if (finalScore >= 9 && (isCritical || north)) severity = 'critical';
  else if (finalScore >= 7) severity = 'high';
  else if (finalScore >= 4) severity = 'medium';
  else severity = 'low';

  // 7. Confidence Calculation
  let confidence = 0.50;
  if (north) confidence += 0.15;
  if (/polic|kfor|eulex|nato|prokurori|tužilaštv/i.test(fullText)) confidence += 0.15;
  if (EVENT_ACTION_PATTERNS.some(re => re.test(fullText))) confidence += 0.10;
  if (eventType === 'commentary') confidence -= 0.05;
  confidence = Math.max(0.40, Math.min(0.95, Number(confidence.toFixed(2))));

  // Extract Security Tags
  const tags = [];
  if (isCritical) tags.push('critical_incident');
  if (/pucnjav|të shtëna/i.test(fullText)) tags.push('shooting');
  if (/oružj|oruzj|armë|armatim|arsenal/i.test(fullText)) tags.push('weapons');
  if (/polic/i.test(fullText)) tags.push('police');
  if (/kfor|nato/i.test(fullText)) tags.push('kfor_nato');
  if (/eulex/i.test(fullText)) tags.push('eulex');
  if (/hapšen|arrestim|ndalim/i.test(fullText)) tags.push('arrest');
  if (/pretres|bastisj/i.test(fullText)) tags.push('raid');
  if (/barikad|barrikad|blokad/i.test(fullText)) tags.push('barricade');
  if (/most na ibru|ura e ibrit/i.test(fullText)) tags.push('ibar_bridge');

  return {
    intensityScore: finalScore,
    severity,
    category,
    eventType,
    confidence,
    tags,
    isSecurityRelevant: severity !== 'low' && category !== 'other'
  };
}

// ─────────────────────────────────────
// Cross-Source Deduplication & Grouping
// ─────────────────────────────────────

function extractEventEntities(title, description) {
  const text = (title + ' ' + (description || '')).toLowerCase();
  const entities = [];
  
  if (/zubin/i.test(text)) entities.push('loc:zubin_potok');
  if (/mitrovic/i.test(text)) entities.push('loc:mitrovica');
  if (/leposav/i.test(text)) entities.push('loc:leposavic');
  if (/zvečan|zveçan|zvecan/i.test(text)) entities.push('loc:zvecan');
  if (/jarinj/i.test(text)) entities.push('loc:jarinje');
  if (/brnjak|bërnjak/i.test(text)) entities.push('loc:brnjak');
  if (/kek/i.test(text)) entities.push('loc:kek');
  if (/prishtin|prištin|pristina/i.test(text)) entities.push('loc:prishtina');
  
  // Specific weapon seizure events in north
  if ((/zubin|kaludr|grobnica|varreza|veri\b|sever/i.test(text)) && (/oružj|oruzj|armë|armat|arsenal|konfisk|zaplen/i.test(text))) {
    entities.push('event:north_weapons_seizure');
  }
  
  if (/most na ibru|ura e ibrit|urën e ibrit|mosta na ibru|rihapjen e urës/i.test(text)) entities.push('topic:ibar_bridge');
  if (/rute|rutte/i.test(text)) entities.push('entity:rutte');
  if (/srpske demokratije|srpska demokratija|radosavljević|lazović/i.test(text)) entities.push('entity:srpska_demokratija');
  if (/kek/i.test(text) && (/poginul|vdekj|viktima|strada|ndalohet|ndaluar|punëtor/i.test(text))) entities.push('topic:kek_casualty');
  if (/cia/i.test(text) && (/deport|al kaid|al qaeda|infiltr/i.test(text))) entities.push('topic:cia_agent');
  if (/prevar.*avionsk|biletash|kompaniji za prodaju/i.test(text)) entities.push('topic:ticket_fraud');
  if (/trazirat e 2004|ushtrinë.*nato|2004.*nato/i.test(text)) entities.push('topic:thaci_2004');
  if (/simović|aleksandra simovića/i.test(text)) entities.push('topic:simovic_anniversary');

  return entities;
}

function clusterSecurityArticles(articles) {
  const clusters = [];

  for (const article of articles) {
    const entities = extractEventEntities(article.title, article.description);
    let matchedCluster = null;

    if (entities.length > 0) {
      matchedCluster = clusters.find(c => {
        const intersection = c.entities.filter(e => entities.includes(e));
        if (intersection.length >= 2) return true;
        if (intersection.length === 1 && (intersection[0].startsWith('event:') || intersection[0].startsWith('topic:') || intersection[0] === 'entity:srpska_demokratija')) return true;
        
        const wordsA = new Set(article.title.toLowerCase().split(/\W+/).filter(w => w.length > 3));
        const wordsB = new Set(c.primary.title.toLowerCase().split(/\W+/).filter(w => w.length > 3));
        let common = 0;
        for (const w of wordsA) { if (wordsB.has(w)) common++; }
        return common >= 3;
      });
    }

    if (matchedCluster) {
      matchedCluster.articles.push(article);
      matchedCluster.entities = [...new Set([...matchedCluster.entities, ...entities])];
      if (article.intensityScore > matchedCluster.primary.intensityScore || (article.eventType === 'event' && matchedCluster.primary.eventType === 'commentary')) {
        matchedCluster.primary = article;
      }
    } else {
      clusters.push({
        entities,
        primary: article,
        articles: [article]
      });
    }
  }

  return clusters.map(c => {
    const primary = c.primary;
    const sources = [...new Set(c.articles.map(a => a.source))];
    const sourceCount = sources.length;
    const allTags = [...new Set(c.articles.flatMap(a => a.tags || []))];
    
    let confidence = primary.confidence;
    if (sourceCount >= 4) confidence = Math.min(0.98, confidence + 0.20);
    else if (sourceCount >= 2) confidence = Math.min(0.95, confidence + 0.10);

    const relatedArticles = c.articles.map(a => ({
      source: a.source,
      title: a.title,
      url: a.url,
      publishedAt: a.publishedAt
    }));

    // Use latest timestamp from clustered articles
    const validTimestamps = c.articles
      .map(a => new Date(a.publishedAt).getTime())
      .filter(t => !isNaN(t));
    const latestDateIso = validTimestamps.length > 0
      ? new Date(Math.max(...validTimestamps)).toISOString()
      : primary.publishedAt;

    return {
      ...primary,
      publishedAt: latestDateIso,
      sourceCount,
      sources,
      tags: allTags,
      confidence: Number(confidence.toFixed(2)),
      relatedArticles
    };
  });
}

// ─────────────────────────────────────
// RSS Fetch
// ─────────────────────────────────────

async function fetchRSS(source) {
  try {
    const response = await axios.get(source.url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 SENTINEL Intelligence'
      }
    });

    const parsed = await xml2js.parseStringPromise(response.data);
    const items = parsed.rss?.channel?.[0]?.item || parsed['rdf:RDF']?.item || parsed.feed?.entry || [];

    return items.map((item, index) => {
      const title = item.title?.[0] || '';
      const description = item.description?.[0]?.replace(/<[^>]+>/g, '') || item.summary?.[0]?.replace(/<[^>]+>/g, '') || '';

      let link = '#';
      if (typeof item.link?.[0] === 'string') {
        link = item.link[0];
      } else if (item.link?.[0]?._) {
        link = item.link[0]._;
      } else if (item.link?.[0]?.$?.href) {
        link = item.link[0].$.href;
      }

      let parsedDateIso;
      try {
        const rawDate = item.pubDate?.[0] || item.updated?.[0] || item.published?.[0];
        const d = rawDate ? new Date(rawDate) : new Date();
        parsedDateIso = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
      } catch {
        parsedDateIso = new Date().toISOString();
      }

      const analysis = analyzeArticle(title, description, parsedDateIso);

      return {
        id: `${source.name}-${index}`,
        title,
        description: description.substring(0, 300),
        url: link,
        source: source.name,
        sources: [source.name],
        sourceCount: 1,
        language: source.lang,
        reliability: SOURCE_RELIABILITY[source.name] || 0.5,
        publishedAt: parsedDateIso,
        intensityScore: analysis.intensityScore,
        severity: analysis.severity,
        category: analysis.category,
        eventType: analysis.eventType,
        confidence: analysis.confidence,
        tags: analysis.tags,
        isSecurityRelevant: analysis.isSecurityRelevant
      };
    });
  } catch (error) {
    console.log(`[news-intel] ${source.name} failed: ${error.message}`);
    return [];
  }
}

// ─────────────────────────────────────
// MAIN
// ─────────────────────────────────────

async function fetchNews({
  location = 'Kosovo',
  timeline = '24h',
  keywords = []
}) {
  console.log(`[news-intel] Kosovo RSS scan: ${location}`);

  const feeds = await Promise.all(
    SOURCES.map(fetchRSS)
  );

  const now = Date.now();
  const timelineMs = {
    '24h': 24 * 60 * 60 * 1000,
    '48h': 48 * 60 * 60 * 1000,
    '7d':  7 * 24 * 60 * 60 * 1000
  }[timeline] || (24 * 60 * 60 * 1000);

  let allArticles = feeds.flat().filter(a => {
    const pubTime = new Date(a.publishedAt).getTime();
    if (isNaN(pubTime)) return false;
    const diff = now - pubTime;
    return diff >= -3600000 && diff <= timelineMs;
  });

  // Filter out non-security articles from the main intelligence dashboard feed
  const securityArticles = allArticles.filter(a => a.isSecurityRelevant);

  // Deduplicate and cluster multi-source events
  const deduplicatedEvents = clusterSecurityArticles(securityArticles);

  // Sort Order: 1. Severity, 2. Score, 3. Confidence, 4. SourceCount, 5. PublishedAt
  const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
  deduplicatedEvents.sort((a, b) => {
    if (severityRank[b.severity] !== severityRank[a.severity]) {
      return severityRank[b.severity] - severityRank[a.severity];
    }
    if (b.intensityScore !== a.intensityScore) {
      return b.intensityScore - a.intensityScore;
    }
    if (Math.abs(b.confidence - a.confidence) >= 0.01) {
      return b.confidence - a.confidence;
    }
    if (b.sourceCount !== a.sourceCount) {
      return b.sourceCount - a.sourceCount;
    }
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return {
    skill: 'news-intel',
    location,
    fetchedAt: new Date().toISOString(),
    source: 'kosovo-local-rss',
    items: deduplicatedEvents.slice(0, 50),
    summary: {
      total: deduplicatedEvents.length,
      rawScanned: allArticles.length,
      discardedOther: allArticles.length - securityArticles.length,
      highIntensity: deduplicatedEvents.filter(a => a.intensityScore >= 7).length,
      maxScore: deduplicatedEvents[0]?.intensityScore || 0
    }
  };
}

module.exports = {
  fetchNews,
  analyzeArticle
};