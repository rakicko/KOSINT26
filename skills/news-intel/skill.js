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
    url: 'https://www.radiokim.net/feed/',
    name: 'Radio KIM',
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
    url: 'https://www.koha.net/rss',
    name: 'Koha',
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
  }
];

// ─────────────────────────────────────
// Source reliability
// ─────────────────────────────────────

const SOURCE_RELIABILITY = {
  'KoSSev': 0.90,
  'Radio Mitrovica Sever': 0.85,
  'Radio KIM': 0.85,
  'Kosova.info': 0.80,
  'Gazeta Express': 0.85,
  'Koha': 0.90,
  'Indeks Online': 0.75,
  'Lajmi': 0.70,
  'Jepize': 0.65,
  'Mitropol': 0.70,
  'MitrovicaSOT': 0.80
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
  /poginul/i, /viktim/i,
  /aksident/i, /saobraćajn/i, /saobracajn/i, /sudar/i, /udes/i, /rrugë e mbyllur|rruga e mbyllur|bllokim i rrugës|zatvoren put|obustava saobraćaja|zastoj|kolonë/i
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

    const rawXml = (typeof response.data === 'string' ? response.data : '').replace(/&(?!(amp|lt|gt|quot|apos);)/g, '&amp;');
    const parsed = await xml2js.parseStringPromise(rawXml);
    const items = parsed.rss?.channel?.[0]?.item || parsed['rdf:RDF']?.item || parsed.feed?.entry || [];

    return items.map((item, index) => {
      const getRawText = (val) => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        if (Array.isArray(val) && val.length > 0) return getRawText(val[0]);
        if (typeof val === 'object' && val._) return String(val._);
        return '';
      };
      const title = getRawText(item.title);
      const description = getRawText(item.description || item.summary || item.content).replace(/<[^>]+>/g, '');

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
// Multilingual Entity & Location Resolver
// ─────────────────────────────────────

const MULTILINGUAL_ENTITIES = {
  // People
  'person:albin_kurti': [/albin\s*kurti/i, /албин\s*курти/i, /kurti/i, /kurti-t/i, /kurtit/i],
  'person:ozkan_ulutas': [/ozkan\s*ulutas/i, /özkan\s*ulutaş/i, /ulutaš/i, /ulutaş/i, /ulutas/i, /ulutash/i, /улутас/i, /general-major.*uluta/i],
  'person:croatian_pilot': [/pilot.*kroat/i, /hrvatsk.*pilot/i, /pilot.*hrvat/i],
  'person:xhelal_svecla': [/xhelal\s*sveçla/i, /svečla/i, /sveçl/i, /svecl/i],
  'person:vjosa_osmani': [/vjosa\s*osmani/i, /osmani/i],
  'person:aleksandar_vucic': [/aleksandar\s*vučić/i, /vučić/i, /vucic/i, /vuçiq/i],
  'person:petar_petkovic': [/petar\s*petković/i, /petković/i, /petkovic/i],
  'person:nenad_rasic': [/nenad\s*rašić/i, /rashiq/i, /rašić/i],

  // Institutions & Groups
  'inst:kfor': [/kfor/i, /kfor-i/i, /kforu/i, /kfor-a/i],
  'inst:eulex': [/eulex/i, /evleks/i],
  'inst:kosovo_police': [/policia\s*e\s*kosovës/i, /policija\s*kosova/i, /kosovo\s*police/i, /policij/i, /policia/i, /njoftim\s*i\s*policisë/i],
  'inst:srpska_lista': [/srpska\s*lista/i, /lista\s*serbe/i],
  'inst:srpska_demokratija': [/srpska\s*demokratija/i, /srpske\s*demokratije/i],

  // Locations (SR / AL / EN equivalents)
  'loc:leposavic': [/leposavić/i, /leposaviq/i, /leposavic/i],
  'loc:mitrovica': [/mitrovic/i, /severn.*mitrovic/i, /mitrovicë/i, /mitrovica/i],
  'loc:zvecan': [/zvečan/i, /zveçan/i, /zvecan/i],
  'loc:zubin_potok': [/zubin\s*potok/i, /zubin-potok/i],
  'loc:peja': [/pejë|peja|peje|peć|pec|peći/i],
  'loc:prizren': [/prizren/i],
  'loc:ferizaj': [/ferizaj/i, /uroševac/i, /urosevac/i],
  'loc:gjilan': [/gjilan/i, /gnjilan/i],
  'loc:gjakova': [/gjakovë/i, /gjakove/i, /đakovica/i, /djakovica/i],
  'loc:podujevo': [/podujevë/i, /podujeve/i, /podujevo/i],
  'loc:shtime': [/shtime/i, /štimlje/i, /stimlje/i],
  'loc:kacanik': [/kaçanik/i, /kacanik/i],
  'loc:durres': [/durrës/i, /durres/i, /drač/i],
  'loc:jarinje': [/jarinj/i],
  'loc:brnjak': [/brnjak/i, /bërnjak/i],
  'loc:merdare': [/merdar/i],
  'loc:dheu_i_bardhe': [/dheu\s*i\s*bardhë/i, /bela\s*zemlja/i],
  'loc:ibar_bridge': [/most[a-z]*\s*(na\s*)?ibr[a-z]*|ibarsk[a-z]*\s*most[a-z]*|ur[aëesn]+\s*(së\s*|e\s*)?ibr[a-z]*|ibar\s*bridge|ibër\s*bridge/i],

  // Specific Actions & Event Types
  'event:espionage': [/spiunazh/i, /špijunaž/i, /spijunaz/i, /espionage/i, /spy/i],
  'event:meeting': [/sastanak|sastati|takim|takimi|meet|meeting|razgovor|takohet/i],
  'event:meeting_cancellation': [/otkazan|nije\s*održan|nuk\s*u\s*mbajt|nuk\s*u\s*zhvillua|odložen|cancelled|canceled|otkazala|otkazana|dështon\s*takimi|dështoi\s*takimi/i],
  'event:arrest': [/uhapš|uhaps|prived|arrest|ndalohet|ndaluar|detain/i],
  'event:theft': [/vjedh[a-z]*|krađ[a-z]*|kradj[a-z]*|ukrad[a-z]*|krad[a-z]*|stolen|theft|burglary/i],
  'event:robbery': [/grabit[a-z]*|pljačk[a-z]*|pljack[a-z]*|razbojništv[a-z]*|robbery/i],
  'event:weapon_seizure': [/oružj|oruzj|armë|armat|arsenal|konfisk|zaplen|sekuestr|weapons|arms|seizure/i],
  'event:drug_seizure': [/kanabis|marihuana|drog|narkotik|cannabis|marijuana|drugs/i],
  'event:police_action': [/aksion|aksioni|akcija|akciji|operacija|operation|patrolla|patrola|bastisje|pretres|raid/i],
  'event:incident': [/incident|incidenti|incidenta|sukob|përleshje|perleshje|clash/i],
  'event:accident': [/aksident|saobraćajn|saobracajn|sudar|udes|traffic accident|crash/i],
  'event:shooting': [/pucnjav|pucano|të shtëna|te shtena|gjuajtje me armë|shooting|gunfire/i],
  'event:fire': [/požar|pozar|zjarr|fire|arson/i],
  'event:protest': [/protest|demonstra|okupjenj|turmë|protestues/i],
  'event:court': [/gjykata|gjykatan|gjykates|sud|sudb|tužilaštv|prokuror|court|prosecut/i],
  'event:military_activity': [/vojn|ushtarak|soldier|vojska|military/i],
  'event:border_incident': [/kufi|kufitar|granič|prelaz|pika kufitare|border/i]
};

function extractMultilingualEntities(title, description = '') {
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  const entities = [];

  for (const [entityKey, patterns] of Object.entries(MULTILINGUAL_ENTITIES)) {
    if (patterns.some(re => re.test(text))) {
      entities.push(entityKey);
    }
  }

  // 1. Weight / Volume anchors (e.g. "80kg", "80 kg", "100g")
  const weightMatch = text.match(/\b(\d+)\s*(kg|kilogram|kg\.?|g|gram|tona|tonë)\b/i);
  if (weightMatch) {
    entities.push(`qty:${weightMatch[1]}${weightMatch[2].toLowerCase().slice(0, 2)}`);
  }

  // 2. Money / Currency anchors (e.g. "10,000€", "50.000 euro", "100 mijë euro")
  const moneyMatch = text.match(/(\d+[\.\,]?\d*)\s*(euro|eur|€|evra|dinar)/i);
  if (moneyMatch) {
    const cleanNum = moneyMatch[1].replace(/[\.\,]/g, '');
    entities.push(`qty:${cleanNum}eur`);
  }

  // 3. Count anchors (digits or word numbers followed by persons/suspects/arrested)
  const COUNT_PATTERNS = [
    { num: '1', re: /(1|një|jedan|jedna|one|edhe\s*një|još\s*jedan)\s*(osumnjič|osob|të\s*arrestuar|të\s*dyshuar|person|arrested|suspect|lënduar|povređ|i\s*dyshuar[it]?)|(osumnjič[a-z]*|osob[a-z]*|i\s*dyshuar[it]?)\s*(i\s*parë|prvi)/i },
    { num: '2', re: /(2|dy|dva|dve|two)\s*(osumnjič|osob|të\s*arrestuar|të\s*dyshuar|person|arrested|suspect|lënduar|povređ|i\s*dyshuar[it]?)|(osumnjič[a-z]*|osob[a-z]*|i\s*dyshuar[it]?)\s*(i\s*dytë|drugi)/i },
    { num: '3', re: /(3|tre|tri|three)\s*(osumnjič|osob|të\s*arrestuar|të\s*dyshuar|person|arrested|suspect|lënduar|povređ|i\s*dyshuar[it]?)|(osumnjič[a-z]*|osob[a-z]*|i\s*dyshuar[it]?)\s*(i\s*tretë|treći)/i },
    { num: '4', re: /(4|katër|i\s*katërt|četiri|četvrti|four)\s*(osumnjič|osob|të\s*arrestuar|të\s*dyshuar|person|arrested|suspect|lënduar|povređ|i\s*dyshuar[it]?)|(osumnjič[a-z]*|osob[a-z]*|i\s*dyshuar[it]?)\s*(i\s*katërt|četvrti)/i },
    { num: '5', re: /(5|pesë|pet|five)\s*(osumnjič|osob|të\s*arrestuar|të\s*dyshuar|person|arrested|suspect|lënduar|povređ|i\s*dyshuar[it]?)|(osumnjič[a-z]*|osob[a-z]*|i\s*dyshuar[it]?)\s*(i\s*pestë|peti)/i }
  ];

  for (const p of COUNT_PATTERNS) {
    if (p.re.test(text)) {
      entities.push(`qty:${p.num}persons`);
    }
  }

  return entities;
}

/**
 * Checks whether two entity sets contain conflicting mutually exclusive event types
 */
function checkEventTypeConflict(entitiesA, entitiesB) {
  const eventTypesA = entitiesA.filter(e => e.startsWith('event:'));
  const eventTypesB = entitiesB.filter(e => e.startsWith('event:'));

  if (eventTypesA.length === 0 || eventTypesB.length === 0) return false;

  const MUTUALLY_EXCLUSIVE_TYPES = [
    'event:accident',
    'event:shooting',
    'event:fire',
    'event:protest',
    'event:court',
    'event:theft',
    'event:weapon_seizure',
    'event:drug_seizure'
  ];

  const exA = eventTypesA.filter(e => MUTUALLY_EXCLUSIVE_TYPES.includes(e));
  const exB = eventTypesB.filter(e => MUTUALLY_EXCLUSIVE_TYPES.includes(e));

  if (exA.length > 0 && exB.length > 0) {
    return !exA.some(t => exB.includes(t));
  }

  return false;
}

const SOURCE_AUTHORITY = {
  'Koha Ditore': 100,
  'Koha': 100,
  'Koha.net': 100,
  'Radio Kim': 90,
  'Radio KIM': 90,
  'Kallxo': 90,
  'Gazeta Express': 80,
  'Telegrafi': 80,
  'RTK': 80,
  'Radio Kosova': 75,
  'Tanjug': 70,
  'Kossev': 70,
  'KoSSev': 70,
  'Radio Mitrovica Sever': 70,
  'Indeks Online': 60,
  'MitrovicaSOT': 60,
  'Jepize': 60,
  'Mitropol': 60,
  'Lajmi': 60,
  'Botasot': 60,
  'Reporteri': 60,
  'Bota Sot': 60,
  'Syri': 50
};

function normalizeUrl(url) {
  if (!url || typeof url !== 'string' || url === '#') return '';
  try {
    const u = new URL(url);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'fbclid'].forEach(p => u.searchParams.delete(p));
    let clean = (u.hostname.replace(/^www\./, '') + u.pathname + u.search).toLowerCase();
    return clean.replace(/\/+$/, '');
  } catch (e) {
    return url.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
  }
}

function normalizeHeadline(title) {
  if (!title || typeof title !== 'string') return '';
  let text = title.toLowerCase();

  text = text.replace(/\[(video|foto|e plotë|audio|live|pamje|lajm i fundit)\]/gi, '');
  text = text.replace(/\((video|foto|e plotë|audio|live|pamje|lajm i fundit)\)/gi, '');

  text = text.replace(/\s*[\-\|]\s*(gazeta\s+express|koha(\.net)?|telegrafi|rtk|radiokim|tanjug|botasot|indeksonline|reporteri|syri|veriu\.info|zëri|zeri)\s*$/gi, '');
  text = text.replace(/^(rtk|express|koha|telegrafi|tanjug|indeksonline|reporteri):\s*/gi, '');

  text = text.replace(/[^\p{L}\p{N}\s]/gu, ' ');
  return text.trim().replace(/\s+/g, ' ');
}

function calculateTitleSimilarity(title1, title2) {
  const norm1 = normalizeHeadline(title1);
  const norm2 = normalizeHeadline(title2);

  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;

  const tokens1 = norm1.split(' ').filter(w => w.length > 1);
  const tokens2 = norm2.split(' ').filter(w => w.length > 1);

  if (tokens1.length === 0 || tokens2.length === 0) return 0.0;

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  let common = 0;
  for (const t of set1) {
    if (set2.has(t)) common++;
  }

  const dice = (2 * common) / (tokens1.length + tokens2.length);
  const minTokens = Math.min(tokens1.length, tokens2.length);
  const containment = common / minTokens;

  if (minTokens <= 3) {
    return norm1 === norm2 ? 1.0 : (common === minTokens && tokens1.length === tokens2.length ? 1.0 : dice * 0.8);
  }

  if (containment >= 0.9 && dice >= 0.75) {
    return Math.max(dice, containment);
  }

  return dice;
}

function isDuplicateStory(itemA, itemB, similarityThreshold = 0.82) {
  const normUrlA = normalizeUrl(itemA.url);
  const normUrlB = normalizeUrl(itemB.url);

  if (normUrlA && normUrlB && normUrlA === normUrlB) {
    return true;
  }

  // If numeric anchors conflict (e.g. 3 vs 4 suspects or 12,000 vs 5,750 EUR), NOT a duplicate story!
  const entA = itemA.multilingualEntities || extractMultilingualEntities(itemA.title, itemA.description);
  const entB = itemB.multilingualEntities || extractMultilingualEntities(itemB.title, itemB.description);
  const numA = entA.filter(e => e.startsWith('qty:'));
  const numB = entB.filter(e => e.startsWith('qty:'));
  if (numA.length > 0 && numB.length > 0 && !numA.some(n => numB.includes(n))) {
    return false;
  }

  const sim = calculateTitleSimilarity(itemA.title, itemB.title);
  return sim >= similarityThreshold;
}

function deduplicateNewsItems(items, similarityThreshold = 0.82) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const getAuthority = (item) => {
    if (typeof item.reliability === 'number') return item.reliability * 100;
    return SOURCE_AUTHORITY[item.source] || 50;
  };

  const getTimestamp = (item) => {
    const t = new Date(item.publishedAt).getTime();
    return isNaN(t) ? Date.now() : t;
  };

  const uniqueGroups = [];

  for (let idx = 0; idx < items.length; idx++) {
    const current = items[idx];
    let matchedGroup = null;

    for (const group of uniqueGroups) {
      if (group.some(existing => isDuplicateStory(existing, current, similarityThreshold))) {
        matchedGroup = group;
        break;
      }
    }

    if (matchedGroup) {
      matchedGroup.push(current);
    } else {
      uniqueGroups.push([current]);
    }
  }

  return uniqueGroups.map(group => {
    group.sort((a, b) => {
      const authA = getAuthority(a);
      const authB = getAuthority(b);
      if (authA !== authB) return authB - authA;
      const timeA = getTimestamp(a);
      const timeB = getTimestamp(b);
      if (timeA !== timeB) return timeA - timeB;
      return 0;
    });

    const primary = group[0];
    const allSources = [...new Set(group.flatMap(g => g.sources || [g.source]))];

    return {
      ...primary,
      sources: allSources,
      sourceCount: allSources.length
    };
  });
}

/**
 * Deterministic Event ID Generator based on semantic anchors
 */
function generateDeterministicEventId(article, entities = []) {
  const specificAnchors = entities.filter(e => 
    !e.startsWith('inst:kosovo_police') && 
    !e.startsWith('event:incident') &&
    !e.startsWith('event:police_action')
  ).sort();

  if (specificAnchors.length > 0) {
    const key = specificAnchors.slice(0, 4).join('_').replace(/[^a-z0-9_:\-]/gi, '_').toLowerCase();
    return `event-${key.replace(/[:]/g, '_')}`;
  }

  const normTitle = normalizeHeadline(article.title || 'event');
  const titleSlug = normTitle.split(' ').slice(0, 4).join('-');
  return `event-${titleSlug.replace(/[^a-z0-9\-]/gi, '')}`;
}

/**
 * Classifies an article's canonical development state across SR / AL / EN
 */
function classifyDevelopmentState(article, isFirstArticle = false) {
  const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();

  // Contradiction / Denial
  if (/demant|demantoi|demanton|mohojnë|mohon|odbacuje|denied|denies|contradiction|porekao/i.test(text)) {
    return 'CONTRADICTION';
  }

  // Meeting states (SR / AL / EN)
  if (/otkazan|nije\s*održan|nuk\s*u\s*mbajt|nuk\s*u\s*zhvillua|odložen|dështon\s*takimi|dështoi\s*takimi|cancelled|meeting cancelled|meeting failed/i.test(text)) {
    if (/sastanak|takim|meeting|razgovor|kurti|uluta/i.test(text)) {
      return 'MEETING_CANCELLED';
    }
  }
  if (/sastanak|takim|meeting|razgovor|takohet|sastao|sastali/i.test(text)) {
    if (/zakazan|najavljen|najavio|najavljuje|paralajmërohet|paralajmëron|sot\s*me|sastaje\s*se|scheduled|will meet|planiran|pritet\s*të/i.test(text)) {
      return 'MEETING_SCHEDULED';
    }
    if (/održan|sastali\s*se|u\s*mbajt|janë\s*takuar|held|met today/i.test(text)) {
      return 'MEETING_HELD';
    }
    return 'MEETING_SCHEDULED';
  }

  // Enforcement / Criminality states
  if (/uhapš|uhaps|prived|arrest|ndalohet|ndaluar|detain/i.test(text)) {
    return 'ARREST';
  }
  if (/pušten|pušt|liroh|liruar|releas/i.test(text)) {
    return 'RELEASE';
  }
  if (/identifik|identifi/i.test(text)) {
    return 'IDENTIFICATION';
  }
  if (/pretres|bastis|search|raid/i.test(text)) {
    return 'SEARCH';
  }
  if (/zaplen|oduzet|konfisk|sekuestr|seiz/i.test(text)) {
    return 'SEIZURE';
  }

  // Fire states
  if (/ugašen\s*požar|fiket\s*zjarr|fire extinguished/i.test(text)) return 'FIRE_EXTINGUISHED';
  if (/lokalizovan\s*požar|lokalizohet\s*zjarr|fire contained/i.test(text)) return 'FIRE_CONTAINED';
  if (/požar|pozar|zjarr|fire/i.test(text)) return 'FIRE_STARTED';

  // Casualties
  if (/ranjen|plagos|lënd|injur|povred/i.test(text)) return 'INJURY';
  if (/ubijen|ubistv|vrarë|vrasj|poginul|vdekj|kill|dead|murder/i.test(text)) return 'DEATH';

  // Legal / Judiciary
  if (/optužnica|aktakuzë|indicted|charged/i.test(text)) return 'CHARGE';
  if (/sud|sudb|gjykata|paraburgim|custody|court/i.test(text)) return 'COURT_UPDATE';
  if (/odluka|vendim|decision/i.test(text)) return 'DECISION';

  // Border / Protest / Military
  if (/kufi|granič|border/i.test(text)) return 'BORDER_UPDATE';
  if (/protest|demonstra/i.test(text)) return 'PROTEST_UPDATE';
  if (/kfor|eulex|military|ushtarak|vojska/i.test(text)) return 'MILITARY_UPDATE';

  // Confirmation
  if (/potvrdio|potvrdila|konfirmoj|konfirmon|potvrđeno|confirmed|confirmation/i.test(text)) {
    return 'CONFIRMATION';
  }

  if (isFirstArticle) return 'INITIAL_REPORT';
  return 'UPDATE';
}

function classifyDevelopmentType(article, isFirstArticle = false) {
  return classifyDevelopmentState(article, isFirstArticle);
}

/**
 * Groups articles in an Event into discrete factual Developments with multiple sources
 */
function groupArticlesIntoDevelopments(eventArticles) {
  if (!Array.isArray(eventArticles) || eventArticles.length === 0) return [];

  // Sort articles chronologically by publishedAt ascending
  const sorted = [...eventArticles].sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
  const developments = [];

  sorted.forEach((art) => {
    const devState = classifyDevelopmentState(art, developments.length === 0);
    const mEntities = art.multilingualEntities || extractMultilingualEntities(art.title, art.description);
    const numAnchors = mEntities.filter(e => e.startsWith('qty:'));

    // Find if an existing development in this event matches this exact factual state
    let matchedDev = developments.find(dev => {
      // If development types are different, they are distinct developments (unless confirmation)
      if (dev.type !== devState) {
        if (dev.type === 'INITIAL_REPORT' && devState === 'CONFIRMATION') {
          return true;
        }
        return false;
      }

      // Both have the same canonical development type
      // Check numeric anchor conflict (e.g. qty:3persons vs qty:4persons or qty:12000eur vs qty:5750eur)
      const devAnchors = dev.numericAnchors || [];
      if (numAnchors.length > 0 && devAnchors.length > 0) {
        const match = numAnchors.some(a => devAnchors.includes(a));
        if (!match) return false; // Factual state numeric change -> NEW DEVELOPMENT!
      }

      return true; // Same development state & matching numeric anchors -> SAME DEVELOPMENT!
    });

    if (matchedDev) {
      // Add source if not already present
      const artSources = Array.isArray(art.sources) ? art.sources : [art.source];
      artSources.forEach(s => {
        if (s && !matchedDev.sources.includes(s)) {
          matchedDev.sources.push(s);
        }
      });
      if (!matchedDev.articles.some(a => a.id === art.id || (a.url && a.url === art.url))) {
        matchedDev.articles.push(art);
      }
      // Update development timestamp if later
      const tArt = new Date(art.publishedAt).getTime();
      const tDev = new Date(matchedDev.timestamp).getTime();
      if (!isNaN(tArt) && (isNaN(tDev) || tArt > tDev)) {
        matchedDev.timestamp = art.publishedAt;
      }
    } else {
      const artSources = Array.isArray(art.sources) ? art.sources : [art.source];
      developments.push({
        developmentId: `dev-${devState.toLowerCase()}-${art.id || Math.random().toString(36).slice(2)}`,
        type: devState,
        timestamp: art.publishedAt,
        articleId: art.id,
        title: art.title,
        summary: art.description || art.title,
        source: art.source,
        sources: [...new Set(artSources.filter(Boolean))],
        articles: [art],
        numericAnchors: numAnchors,
        multilingualEntities: mEntities,
        noveltyScore: devState === 'INITIAL_REPORT' ? 10 : (devState === 'CONTRADICTION' ? 9 : 7)
      });
    }
  });

  // Sort developments chronologically
  developments.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (developments.length > 0) {
    developments[developments.length - 1].isLatest = true;
  }

  return developments;
}

/**
 * Determines Event Lifecycle Status
 */
function determineEventStatus(developments, independentSourceCount) {
  if (!Array.isArray(developments) || developments.length === 0) return 'UNKNOWN';

  const latestDev = developments[developments.length - 1];
  if (latestDev.type === 'CONTRADICTION') return 'CONTRADICTED';

  const RESOLVED_TYPES = ['ARREST', 'RELEASE', 'FIRE_EXTINGUISHED', 'MEETING_HELD', 'MEETING_CANCELLED'];
  if (RESOLVED_TYPES.includes(latestDev.type)) return 'RESOLVED';

  if (independentSourceCount >= 2) return 'CONFIRMED';
  if (developments.length > 1) return 'DEVELOPING';

  return 'DEVELOPING';
}

/**
 * Generates a clean Event Title summary
 */
function generateEventTitle(primaryArticle, entities = []) {
  if (!primaryArticle || !primaryArticle.title) return 'Security Event';
  let title = primaryArticle.title;
  title = title.replace(/\s*[\-\|]\s*(gazeta\s+express|koha(\.net)?|telegrafi|rtk|radiokim|tanjug|kossev|lajmi|indeksonline|mitropol|jepize|radio\s*mitrovica\s*sever)\s*$/gi, '').trim();
  title = title.replace(/\[(video|foto|e plotë|audio|live)\]/gi, '').trim();
  return title;
}

/**
 * Explain/Audit helper for comparing two articles
 */
function explainEventMatch(articleA, articleB) {
  const entA = articleA.multilingualEntities || extractMultilingualEntities(articleA.title, articleA.description);
  const entB = articleB.multilingualEntities || extractMultilingualEntities(articleB.title, articleB.description);

  const locsA = entA.filter(e => e.startsWith('loc:'));
  const locsB = entB.filter(e => e.startsWith('loc:'));
  const typesA = entA.filter(e => e.startsWith('event:'));
  const typesB = entB.filter(e => e.startsWith('event:'));
  const numA = entA.filter(e => e.startsWith('qty:'));
  const numB = entB.filter(e => e.startsWith('qty:'));

  const matchedAnchors = entA.filter(e => entB.includes(e));
  const conflictingAnchors = [];

  let hasLocConflict = false;
  if (locsA.length > 0 && locsB.length > 0 && !locsA.some(l => locsB.includes(l))) {
    hasLocConflict = true;
    conflictingAnchors.push(`location:${locsA.join(',')}_vs_${locsB.join(',')}`);
  }

  let hasTypeConflict = checkEventTypeConflict(entA, entB);
  if (hasTypeConflict) {
    conflictingAnchors.push(`eventType:${typesA.join(',')}_vs_${typesB.join(',')}`);
  }

  const t1 = new Date(articleA.publishedAt).getTime();
  const t2 = new Date(articleB.publishedAt).getTime();
  const timeDiffHours = (!isNaN(t1) && !isNaN(t2)) ? Math.abs(t1 - t2) / 3600000 : 0;
  if (timeDiffHours > 48) {
    conflictingAnchors.push(`timeDiff:${timeDiffHours.toFixed(1)}h`);
  }

  const titleSim = calculateTitleSimilarity(articleA.title, articleB.title);

  let sameEvent = false;
  let decision = 'REJECT';

  if (!hasLocConflict && !hasTypeConflict && timeDiffHours <= 48) {
    const hasKurtiUlutasA = entA.includes('person:albin_kurti') && (entA.includes('person:ozkan_ulutas') || entA.includes('inst:kfor'));
    const hasKurtiUlutasB = entB.includes('person:albin_kurti') && (entB.includes('person:ozkan_ulutas') || entB.includes('inst:kfor'));
    const hasMeetingA = entA.includes('event:meeting') || entA.includes('event:meeting_cancellation');
    const hasMeetingB = entB.includes('event:meeting') || entB.includes('event:meeting_cancellation');

    if (hasKurtiUlutasA && hasKurtiUlutasB && hasMeetingA && hasMeetingB) {
      sameEvent = true;
      decision = 'MATCH: Kurti-Ulutas Meeting';
    } else if (matchedAnchors.length >= 2) {
      const nonGeneric = matchedAnchors.filter(e => !e.startsWith('inst:kosovo_police') && !e.startsWith('event:incident') && !e.startsWith('inst:kfor'));
      if (nonGeneric.length >= 1) {
        sameEvent = true;
        decision = `MATCH: Shared anchors (${nonGeneric.join(', ')})`;
      }
    } else if (titleSim >= 0.55) {
      sameEvent = true;
      decision = `MATCH: Title similarity (${titleSim.toFixed(2)})`;
    }
  } else {
    decision = `REJECT: Conflicts (${conflictingAnchors.join(', ')})`;
  }

  return {
    sameEvent,
    score: titleSim,
    matchedAnchors,
    conflictingAnchors,
    eventTypeA: typesA,
    eventTypeB: typesB,
    locationA: locsA,
    locationB: locsB,
    numericAnchorsA: numA,
    numericAnchorsB: numB,
    decision
  };
}

/**
 * Multi-Factor Event Clustering Engine (Level A - Event Identity)
 */
function clusterEventArticles(articles) {
  if (!Array.isArray(articles) || articles.length === 0) return [];

  const dedupedInput = deduplicateNewsItems(articles);
  const clusters = [];

  for (const article of dedupedInput) {
    const mEntities = extractMultilingualEntities(article.title, article.description);
    const legacyEntities = extractEventEntities(article.title, article.description);
    const allEntities = [...new Set([...mEntities, ...legacyEntities])];
    article.multilingualEntities = allEntities;

    let matchedCluster = null;

    for (const cluster of clusters) {
      // 1. Time proximity check (within 48 hours)
      const t1 = new Date(article.publishedAt).getTime();
      const t2 = new Date(cluster.lastUpdated).getTime();
      if (!isNaN(t1) && !isNaN(t2) && Math.abs(t1 - t2) > 48 * 3600 * 1000) {
        continue;
      }

      // 2. Reject match if explicit locations conflict (e.g. Pejë vs Prizren)
      const locsA = allEntities.filter(e => e.startsWith('loc:'));
      const locsB = cluster.entities.filter(e => e.startsWith('loc:'));
      if (locsA.length > 0 && locsB.length > 0) {
        const hasCommonLoc = locsA.some(l => locsB.includes(l));
        if (!hasCommonLoc) {
          continue;
        }
      }

      // 3. Reject match if distinct event types conflict (e.g. accident vs weapon seizure vs espionage)
      if (checkEventTypeConflict(allEntities, cluster.entities)) {
        continue;
      }

      // 4. Check shared entities
      const shared = cluster.entities.filter(e => allEntities.includes(e));

      // Rule A: Kurti-Ulutas / Kurti-KFOR Meeting Lifecycle Match
      const hasKurtiMeetingA = allEntities.includes('person:albin_kurti') && 
        (allEntities.includes('person:ozkan_ulutas') || allEntities.includes('inst:kfor')) && 
        (allEntities.includes('event:meeting') || allEntities.includes('event:meeting_cancellation'));
      
      const hasKurtiMeetingB = cluster.entities.includes('person:albin_kurti') && 
        (cluster.entities.includes('person:ozkan_ulutas') || cluster.entities.includes('inst:kfor')) && 
        (cluster.entities.includes('event:meeting') || cluster.entities.includes('event:meeting_cancellation'));

      let isMatch = false;
      if (hasKurtiMeetingA && hasKurtiMeetingB) {
        // Hard separation: If one is specifically about Ibër bridge inspection and the other is not, keep isolated
        const bridgeA = allEntities.includes('loc:ibar_bridge');
        const bridgeB = cluster.entities.includes('loc:ibar_bridge');
        if (bridgeA === bridgeB) {
          isMatch = true;
        }
      }

      // Rule B: Matching non-generic anchors (>= 2 entities where at least 1 is specific)
      if (!isMatch && shared.length >= 2) {
        const specificShared = shared.filter(e => 
          !e.startsWith('inst:kfor') && 
          !e.startsWith('inst:kosovo_police') && 
          !e.startsWith('event:incident') &&
          !e.startsWith('person:albin_kurti') &&
          !e.startsWith('event:meeting')
        );
        if (specificShared.length >= 1) {
          isMatch = true;
        }
      }

      // Rule C: Location + specific event/numeric anchor
      if (!isMatch && shared.length >= 1) {
        const hasSpecificAction = shared.some(e => 
          e.startsWith('event:theft') || 
          e.startsWith('event:drug_seizure') || 
          e.startsWith('event:weapon_seizure') ||
          e.startsWith('qty:')
        );
        if (hasSpecificAction) {
          isMatch = true;
        }
      }

      // Rule D: High title similarity when no conflicting anchors
      if (!isMatch) {
        const sim = calculateTitleSimilarity(article.title, cluster.primary.title);
        if (sim >= 0.55) {
          isMatch = true;
        }
      }

      if (isMatch) {
        matchedCluster = cluster;
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.articles.push(article);
      matchedCluster.entities = [...new Set([...matchedCluster.entities, ...allEntities])];

      // Update cluster primary article if new article has higher authority or score
      const currentAuth = (SOURCE_AUTHORITY[article.source] || 50) + (article.intensityScore || 5);
      const primaryAuth = (SOURCE_AUTHORITY[matchedCluster.primary.source] || 50) + (matchedCluster.primary.intensityScore || 5);
      if (currentAuth > primaryAuth || (article.eventType === 'event' && matchedCluster.primary.eventType === 'commentary')) {
        matchedCluster.primary = article;
      }

      const articleTime = new Date(article.publishedAt).getTime();
      if (!isNaN(articleTime)) {
        if (articleTime < new Date(matchedCluster.firstSeen).getTime()) matchedCluster.firstSeen = article.publishedAt;
        if (articleTime > new Date(matchedCluster.lastUpdated).getTime()) matchedCluster.lastUpdated = article.publishedAt;
      }
    } else {
      const deterministicEventId = generateDeterministicEventId(article, allEntities);
      clusters.push({
        eventId: deterministicEventId,
        entities: allEntities,
        primary: article,
        articles: [article],
        firstSeen: article.publishedAt,
        lastUpdated: article.publishedAt
      });
    }
  }

  // Transform clusters into clean Event Objects with Factual Developments Timeline
  return clusters.map(c => {
    const primary = c.primary;
    const allSources = [...new Set(c.articles.flatMap(a => Array.isArray(a.sources) ? a.sources : [a.source]))];

    // Canonical deterministic eventId based on complete cluster entities
    const canonicalEventId = generateDeterministicEventId(primary, c.entities);

    // Compute independent source count by grouping syndicated items
    const syndicatedGroups = deduplicateNewsItems(c.articles, 0.82);
    const independentSourceCount = syndicatedGroups.length;

    // Group articles into discrete factual Developments Timeline
    const developments = groupArticlesIntoDevelopments(c.articles);
    const latestDevelopment = developments.length > 0 ? developments[developments.length - 1] : null;
    const status = determineEventStatus(developments, independentSourceCount);
    const title = generateEventTitle(primary, c.entities);

    // Confidence calculation based on independent sources and contradiction penalty
    let confidence = primary.confidence || 0.50;
    if (independentSourceCount >= 3) confidence = Math.min(0.98, confidence + 0.25);
    else if (independentSourceCount >= 2) confidence = Math.min(0.95, confidence + 0.15);

    const hasContradiction = developments.some(d => d.type === 'CONTRADICTION');
    if (hasContradiction) {
      confidence = Math.max(0.30, confidence - 0.10);
    }

    // Novelty score (higher if recent developments brought new facts)
    const noveltyScore = Math.min(10, Math.max(1, developments.length * 2 + (independentSourceCount > 1 ? 2 : 0)));

    const allTags = [...new Set(c.articles.flatMap(a => a.tags || []))];

    return {
      ...primary,
      id: canonicalEventId,
      eventId: canonicalEventId,
      title,
      canonicalTitle: title,
      status,
      firstSeen: c.firstSeen,
      lastUpdated: c.lastUpdated,
      publishedAt: c.lastUpdated,
      sources: allSources,
      primarySource: primary.source,
      sourceCount: allSources.length,
      independentSourceCount,
      uniqueSourceCount: independentSourceCount,
      developmentCount: developments.length,
      confidence: Number(confidence.toFixed(2)),
      noveltyScore,
      tags: allTags,
      developments,
      latestDevelopment,
      articles: c.articles,
      relatedArticles: c.articles.map(a => ({
        source: a.source,
        title: a.title,
        url: a.url,
        publishedAt: a.publishedAt
      }))
    };
  });
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

  // Deduplicate syndicated news items before clustering
  const deduplicatedArticles = deduplicateNewsItems(securityArticles);

  // Multi-Factor Event Clustering Engine (groups articles into unified Event Objects)
  const deduplicatedEvents = clusterEventArticles(deduplicatedArticles);

  // Sort Order: 1. Severity, 2. Score, 3. Confidence, 4. IndependentSourceCount, 5. PublishedAt
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
    if (b.independentSourceCount !== a.independentSourceCount) {
      return b.independentSourceCount - a.independentSourceCount;
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
  analyzeArticle,
  deduplicateNewsItems,
  clusterEventArticles,
  groupArticlesIntoDevelopments,
  classifyDevelopmentType,
  determineEventStatus,
  generateEventTitle,
  explainEventMatch,
  extractMultilingualEntities,
  normalizeHeadline,
  calculateTitleSimilarity,
  isDuplicateStory,
  normalizeUrl
};