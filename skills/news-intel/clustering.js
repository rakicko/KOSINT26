'use strict';

const {
  CANONICAL_ENTITIES,
  CANONICAL_EVENT_TYPES,
  areLocationsCompatible,
  areEventTypesCompatible
} = require('./ontology');
const {
  normalizeMultilingualText,
  standardizePunctuation
} = require('./normalizer');
const {
  extractIntelligenceSignals
} = require('./extractor');

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

/**
 * Normalizes URL and removes tracking query parameters
 */
function normalizeUrl(url) {
  if (!url || typeof url !== 'string' || url === '#') return '';
  try {
    const u = new URL(url);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'fbclid', 'gclid', 'rss'].forEach(p => u.searchParams.delete(p));
    let clean = (u.hostname.replace(/^www\./, '') + u.pathname + u.search).toLowerCase();
    return clean.replace(/\/+$/, '');
  } catch (e) {
    return url.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
  }
}

const HEADLINE_NORM_CACHE = new Map();

/**
 * Normalizes headline for similarity comparisons (Memoized for high throughput)
 */
function normalizeHeadline(title) {
  if (!title || typeof title !== 'string') return '';
  if (HEADLINE_NORM_CACHE.has(title)) return HEADLINE_NORM_CACHE.get(title);

  let text = title.toLowerCase();

  text = text.replace(/\[(video|foto|e plotë|audio|live|pamje|lajm i fundit)\]/gi, '');
  text = text.replace(/\((video|foto|e plotë|audio|live|pamje|lajm i fundit)\)/gi, '');

  text = text.replace(/\s*[\-\|]\s*(gazeta\s+express|koha(\.net)?|telegrafi|rtk|radiokim|tanjug|botasot|indeksonline|reporteri|syri|veriu\.info|zëri|zeri|kossev|lajmi|jepize|mitropol|mitrovicasot)\s*$/gi, '');
  text = text.replace(/^(rtk|express|koha|telegrafi|tanjug|indeksonline|reporteri|kossev|mitropol):\s*/gi, '');

  const norm = normalizeMultilingualText(text);
  const result = norm.transliteratedText.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().replace(/\s+/g, ' ');
  if (HEADLINE_NORM_CACHE.size < 10000) {
    HEADLINE_NORM_CACHE.set(title, result);
  }
  return result;
}

/**
 * Calculates Title Similarity with token-aware Dice coefficient & containment
 */
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

/**
 * Checks if two articles represent the exact same story (duplicate/syndicated)
 */
function isDuplicateStory(itemA, itemB, similarityThreshold = 0.82) {
  const normUrlA = normalizeUrl(itemA.url);
  const normUrlB = normalizeUrl(itemB.url);

  if (normUrlA && normUrlB && normUrlA === normUrlB) {
    return true;
  }

  const sigA = itemA._signals || extractIntelligenceSignals(itemA.title, itemA.description);
  const sigB = itemB._signals || extractIntelligenceSignals(itemB.title, itemB.description);

  // If numeric anchors conflict (e.g. 3 vs 4 suspects or 12,000 vs 5,750 EUR), NOT an identical story duplicate!
  const numA = sigA.entities.filter(e => e.startsWith('qty:'));
  const numB = sigB.entities.filter(e => e.startsWith('qty:'));
  if (numA.length > 0 && numB.length > 0 && !numA.some(n => numB.includes(n))) {
    return false;
  }

  const sim = calculateTitleSimilarity(itemA.title, itemB.title);
  return sim >= similarityThreshold;
}

/**
 * Deduplicates raw news items from multiple feeds (syndication grouping)
 */
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

  // Pre-attach signals to each item for high-performance parsing
  items.forEach(item => {
    if (!item._signals) {
      item._signals = extractIntelligenceSignals(item.title, item.description);
      item.multilingualEntities = item._signals.entities;
    }
  });

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
 * Generates a stable, deterministic Event ID from canonical fingerprint
 */
function generateDeterministicEventId(article, entities = []) {
  const allEntities = Array.isArray(entities) && entities.length > 0
    ? entities
    : (article._signals?.entities || extractIntelligenceSignals(article.title, article.description).entities);

  const specificAnchors = allEntities.filter(e =>
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
  const sig = article._signals || extractIntelligenceSignals(article.title, article.description);

  // 1. Meeting cancellation states (SR / AL / EN)
  if (/otkazan|nije\s*održan|nije\s*odrzan|nuk\s*u\s*mbajt|nuk\s*u\s*zhvillua|odložen|odlozen|dështon\s*takimi|dështoi\s*takimi|deshton\s*takimi|deshtoi\s*takimi|cancelled|meeting cancelled|meeting failed/i.test(text) || sig.eventTypes.some(e => e.id === 'event:meeting_cancellation')) {
    if (/sastanak|takim|meeting|razgovor|kurti|uluta/i.test(text) || sig.entities.includes('person:albin_kurti') || sig.entities.includes('event:meeting') || sig.entities.includes('event:meeting_cancellation')) {
      return 'MEETING_CANCELLED';
    }
  }

  // 2. Contradiction / Explicit Denial
  if (/demant|demantoi|demanton|mohojnë|mohon|odbacuje|denied|denies|contradiction|porekao/i.test(text)) {
    return 'CONTRADICTION';
  }

  // 3. Meeting scheduled / held states (SR / AL / EN)
  if (/sastanak|takim|meeting|razgovor|takohet|sastao|sastali/i.test(text) || sig.eventTypes.some(e => e.id === 'event:meeting')) {
    if (/zakazan|najavljen|najavio|najavljuje|paralajmërohet|paralajmëron|sot\s*me|sastaje\s*se|scheduled|will meet|planiran|pritet\s*të/i.test(text)) {
      return 'MEETING_SCHEDULED';
    }
    if (/održan|odrzan|sastali\s*se|u\s*mbajt|janë\s*takuar|held|met today/i.test(text)) {
      return 'MEETING_HELD';
    }
    return 'MEETING_SCHEDULED';
  }

  // 4. Enforcement / Criminality states
  if (/uhapš|uhaps|prived|arrest|ndalohet|ndaluar|detain/i.test(text)) {
    return 'ARREST';
  }
  if (/pušten|pušt|liroh|liruar|releas/i.test(text)) {
    return 'RELEASE';
  }
  if (/identifik|identifi/i.test(text)) {
    return 'IDENTIFICATION';
  }
  if (/traga|potraga|kërkim|kerkim|pretres|bastis|search|raid/i.test(text)) {
    return 'SEARCH';
  }
  if (/istrag|hetim|investigat/i.test(text)) {
    return 'INVESTIGATION';
  }
  if (/pronađeno\s*oružje|gjetur\s*armë|weapons\s*found|otkriveno\s*oružje/i.test(text)) {
    return 'WEAPON_DISCOVERY';
  }
  if (/zaplen|oduzet|konfisk|sekuestr|seiz/i.test(text)) {
    return 'SEIZURE';
  }

  // 5. Fire states
  if (/ugašen\s*požar|fiket\s*zjarr|fire extinguished/i.test(text)) return 'FIRE_EXTINGUISHED';
  if (/lokalizovan\s*požar|lokalizohet\s*zjarr|fire contained/i.test(text)) return 'FIRE_CONTAINED';
  if (sig.eventTypes.some(e => e.id === 'event:fire') || /požar|pozar|zjarr|fire/i.test(text)) return 'FIRE_STARTED';

  // 6. Casualties
  if (/ranjen|plagos|lënd|injur|povred/i.test(text)) return 'INJURY';
  if (/ubijen|ubistv|vrarë|vrasj|poginul|vdekj|kill|dead|murder/i.test(text)) return 'DEATH';

  // 7. Legal / Judiciary
  if (/optužnica|aktakuzë|indicted|charged/i.test(text)) return 'CHARGE';
  if (/sud|sudb|gjykata|paraburgim|custody|court/i.test(text)) return 'COURT_UPDATE';
  if (/odluka|vendim|decision/i.test(text)) return 'DECISION';

  // 8. Border / Protest / Military
  if (/kufi|granič|border/i.test(text)) return 'BORDER_UPDATE';
  if (/protest|demonstra/i.test(text)) return 'PROTEST_UPDATE';
  if (/kfor|eulex|military|ushtarak|vojska/i.test(text)) return 'MILITARY_UPDATE';

  // 9. Confirmation
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
    const sig = art._signals || extractIntelligenceSignals(art.title, art.description);
    const numAnchors = sig.entities.filter(e => e.startsWith('qty:'));

    // Find if an existing development in this event matches this exact factual state
    let matchedDev = developments.find(dev => {
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
      const artSources = Array.isArray(art.sources) ? art.sources : [art.source];
      artSources.forEach(s => {
        if (s && !matchedDev.sources.includes(s)) {
          matchedDev.sources.push(s);
        }
      });
      if (!matchedDev.articles.some(a => a.id === art.id || (a.url && a.url === art.url))) {
        matchedDev.articles.push(art);
      }
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
        multilingualEntities: sig.entities,
        noveltyScore: devState === 'INITIAL_REPORT' ? 10 : (devState === 'CONTRADICTION' ? 9 : 7)
      });
    }
  });

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
  title = title.replace(/\s*[\-\|]\s*(gazeta\s+express|koha(\.net)?|telegrafi|rtk|radiokim|tanjug|kossev|lajmi|indeksonline|mitropol|jepize|radio\s*mitrovica\s*sever|mitrovicasot)\s*$/gi, '').trim();
  title = title.replace(/\[(video|foto|e plotë|audio|live)\]/gi, '').trim();
  return title;
}

/**
 * Explain/Audit helper for comparing two articles
 */
function explainEventMatch(articleA, articleB) {
  const sigA = articleA._signals || extractIntelligenceSignals(articleA.title, articleA.description);
  const sigB = articleB._signals || extractIntelligenceSignals(articleB.title, articleB.description);

  const locsA = sigA.locations.map(l => l.id);
  const locsB = sigB.locations.map(l => l.id);
  const typesA = sigA.eventTypes.map(e => e.id);
  const typesB = sigB.eventTypes.map(e => e.id);
  const numA = sigA.entities.filter(e => e.startsWith('qty:'));
  const numB = sigB.entities.filter(e => e.startsWith('qty:'));

  const matchedAnchors = sigA.entities.filter(e => sigB.entities.includes(e));
  const conflictingAnchors = [];

  let hasLocConflict = false;
  if (locsA.length > 0 && locsB.length > 0) {
    const compatible = locsA.some(la => locsB.some(lb => areLocationsCompatible(la, lb)));
    if (!compatible) {
      hasLocConflict = true;
      conflictingAnchors.push(`location:${locsA.join(',')}_vs_${locsB.join(',')}`);
    }
  }

  let hasTypeConflict = false;
  if (typesA.length > 0 && typesB.length > 0) {
    const compatible = typesA.some(ta => typesB.some(tb => areEventTypesCompatible(ta, tb)));
    if (!compatible) {
      hasTypeConflict = true;
      conflictingAnchors.push(`eventType:${typesA.join(',')}_vs_${typesB.join(',')}`);
    }
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
    const hasKurtiMeetingA = sigA.entities.includes('person:albin_kurti') && (sigA.entities.includes('person:ozkan_ulutas') || sigA.entities.includes('inst:kfor'));
    const hasKurtiMeetingB = sigB.entities.includes('person:albin_kurti') && (sigB.entities.includes('person:ozkan_ulutas') || sigB.entities.includes('inst:kfor'));
    const hasMeetingA = sigA.entities.includes('event:meeting') || sigA.entities.includes('event:meeting_cancellation');
    const hasMeetingB = sigB.entities.includes('event:meeting') || sigB.entities.includes('event:meeting_cancellation');

    if (hasKurtiMeetingA && hasKurtiMeetingB && hasMeetingA && hasMeetingB) {
      sameEvent = true;
      decision = 'MATCH: Kurti-Ulutas / Kurti-KFOR Meeting';
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
 * Multi-Factor Semantic Event Clustering Engine (Level A - Event Identity)
 */
function clusterEventArticles(articles) {
  if (!Array.isArray(articles) || articles.length === 0) return [];

  // Deterministically sort chronologically so clustering is permutation invariant
  const sortedArticles = [...articles].sort((a, b) => {
    const tA = new Date(a.publishedAt || 0).getTime();
    const tB = new Date(b.publishedAt || 0).getTime();
    if (tA !== tB) return tA - tB;
    return String(a.id || a.title || '').localeCompare(String(b.id || b.title || ''));
  });

  const dedupedInput = deduplicateNewsItems(sortedArticles);
  const clusters = [];

  for (const article of dedupedInput) {
    const sig = article._signals || extractIntelligenceSignals(article.title, article.description);
    const allEntities = sig.entities;
    article.multilingualEntities = allEntities;

    let matchedCluster = null;

    for (const cluster of clusters) {
      // 1. Time proximity check (within 48 hours)
      const t1 = new Date(article.publishedAt).getTime();
      const t2 = new Date(cluster.lastUpdated).getTime();
      if (!isNaN(t1) && !isNaN(t2) && Math.abs(t1 - t2) > 48 * 3600 * 1000) {
        continue;
      }

      // 2. Separate case explicit declaration check
      const artText = `${article.title || ''} ${article.description || ''}`.toLowerCase();
      const isExplicitSeparateCase = /u drugom slučaju|u drugom slucaju|u odvojenom slučaju|u odvojenom slucaju|në një rast tjetër|ne nje rast tjeter|në rast tjetër|ne rast tjeter|in a separate case|in another case|in a different case/i.test(artText);
      if (isExplicitSeparateCase) {
        // If explicitly a separate case, do not merge with existing cluster unless identical unique people/topic
        const sharedPeople = cluster.entities.filter(e => e.startsWith('person:') && allEntities.includes(e));
        if (sharedPeople.length === 0) {
          continue;
        }
      }

      // 3. Location compatibility check
      const locsA = sig.locations.map(l => l.id);
      const locsB = cluster.signals.locations.map(l => l.id);
      const specificLocsA = locsA.filter(l => l !== 'loc:kosovo');
      const specificLocsB = locsB.filter(l => l !== 'loc:kosovo');
      if (specificLocsA.length > 0 && specificLocsB.length > 0) {
        const hasCompatibleLoc = specificLocsA.some(la => specificLocsB.some(lb => areLocationsCompatible(la, lb)));
        if (!hasCompatibleLoc) {
          continue;
        }
      } else if (locsA.length > 0 && locsB.length > 0) {
        const hasCompatibleLoc = locsA.some(la => locsB.some(lb => areLocationsCompatible(la, lb)));
        if (!hasCompatibleLoc) {
          continue;
        }
      }

      // 4. Event Type compatibility check
      const typesA = sig.eventTypes.map(e => e.id);
      const typesB = cluster.signals.eventTypes.map(e => e.id);
      if (typesA.length > 0 && typesB.length > 0) {
        const hasCompatibleType = typesA.some(ta => typesB.some(tb => areEventTypesCompatible(ta, tb)));
        if (!hasCompatibleType) {
          continue;
        }
      }

      // 5. Topic Conflict check
      const topicsA = sig.topics.map(t => t.id);
      const topicsB = cluster.entities.filter(e => e.startsWith('topic:'));
      if (topicsA.length > 0 && topicsB.length > 0) {
        const hasSharedTopic = topicsA.some(ta => topicsB.includes(ta));
        if (!hasSharedTopic) {
          continue; // Disjoint specific topics
        }
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
          e.startsWith('event:raid') ||
          e.startsWith('event:arrest') ||
          e.startsWith('event:drug_seizure') ||
          e.startsWith('event:drug_trafficking') ||
          e.startsWith('event:weapon_seizure') ||
          e.startsWith('event:weapon_discovery') ||
          e.startsWith('event:weapon_use') ||
          e.startsWith('event:shooting') ||
          e.startsWith('event:explosion') ||
          e.startsWith('event:fire') ||
          e.startsWith('event:espionage') ||
          e.startsWith('topic:') ||
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

      // Rule E: Compatible Location + Compatible Lifecycle Event Types
      if (!isMatch) {
        const hasCompatibleLoc = (locsA.length > 0 && locsB.length > 0 && locsA.some(la => locsB.some(lb => areLocationsCompatible(la, lb)))) ||
          shared.some(e => e.startsWith('loc:'));

        if (hasCompatibleLoc) {
          const hasLifecycleCompatible = typesA.some(ta => typesB.some(tb => areEventTypesCompatible(ta, tb)));
          if (hasLifecycleCompatible) {
            const bothMentionWeapons = (typesA.some(t => t.includes('weapon')) && typesB.some(t => t.includes('weapon'))) ||
              (/oruž|oruz|armë|arme|weapon/i.test(artText) && /oruž|oruz|armë|arme|weapon/i.test(`${cluster.primary.title} ${cluster.primary.description || ''}`));
            const bothMentionArrestRelease = (typesA.some(t => t === 'event:arrest' || t === 'event:release') && typesB.some(t => t === 'event:arrest' || t === 'event:release')) ||
              (/osumnjičen|uhapš|pušten|arrest|release/i.test(artText) && /osumnjičen|uhapš|pušten|arrest|release/i.test(`${cluster.primary.title} ${cluster.primary.description || ''}`));
            const bothMentionDrugs = (typesA.some(t => t.includes('drug')) && typesB.some(t => t.includes('drug'))) ||
              (/drog|kanabis|marihuan|narkotik/i.test(artText) && /drog|kanabis|marihuan|narkotik/i.test(`${cluster.primary.title} ${cluster.primary.description || ''}`));

            const sim = calculateTitleSimilarity(article.title, cluster.primary.title);
            if (bothMentionWeapons || bothMentionArrestRelease || bothMentionDrugs || sim >= 0.35) {
              isMatch = true;
            }
          }
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

      // Merge signals into cluster
      sig.locations.forEach(l => {
        if (!matchedCluster.signals.locations.some(el => el.id === l.id)) matchedCluster.signals.locations.push(l);
      });
      sig.eventTypes.forEach(e => {
        if (!matchedCluster.signals.eventTypes.some(ee => ee.id === e.id)) matchedCluster.signals.eventTypes.push(e);
      });

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
        signals: {
          locations: [...sig.locations],
          eventTypes: [...sig.eventTypes]
        },
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

module.exports = {
  SOURCE_AUTHORITY,
  normalizeUrl,
  normalizeHeadline,
  calculateTitleSimilarity,
  isDuplicateStory,
  deduplicateNewsItems,
  generateDeterministicEventId,
  classifyDevelopmentState,
  classifyDevelopmentType,
  groupArticlesIntoDevelopments,
  determineEventStatus,
  generateEventTitle,
  explainEventMatch,
  clusterEventArticles
};
