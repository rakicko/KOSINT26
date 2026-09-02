'use strict';

require('dotenv').config({
  path: require('path').join(__dirname, '../../.env')
});

const axios = require('axios');
const xml2js = require('xml2js');

const {
  CANONICAL_ENTITIES,
  CANONICAL_EVENT_TYPES,
  EVENT_COMPATIBILITY_MATRIX,
  areLocationsCompatible,
  areEventTypesCompatible,
  NEGATION_LEXICON,
  NUMBER_WORDS_MAP
} = require('./ontology');

const {
  normalizeMultilingualText,
  transliterateCyrillicToLatin,
  foldDiacritics,
  standardizePunctuation,
  buildPhraseRegex
} = require('./normalizer');

const {
  extractIntelligenceSignals,
  extractQuantities,
  extractMoney,
  extractPersonsCount,
  checkScopedNegation
} = require('./extractor');

const {
  hasKosovoContext,
  calculateSecurityScore
} = require('./security');

const {
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
} = require('./clustering');

// ─────────────────────────────────────────────────────────────────────────────
// Kosovo RSS SOURCES
// ─────────────────────────────────────────────────────────────────────────────

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

/**
 * Backward-compatible Multilingual Entity Extractor
 */
function extractMultilingualEntities(title = '', description = '') {
  const signals = extractIntelligenceSignals(title, description);
  return signals.entities;
}

/**
 * Backward-compatible Article Analyzer
 */
function analyzeArticle(title = '', description = '', publishedAt = null) {
  const signals = extractIntelligenceSignals(title, description);
  const scoreResult = calculateSecurityScore(signals, title, description, publishedAt);

  return {
    intensityScore: scoreResult.intensityScore,
    severity: scoreResult.severity,
    category: scoreResult.category,
    eventType: scoreResult.eventType,
    confidence: scoreResult.confidence,
    tags: scoreResult.tags,
    isSecurityRelevant: scoreResult.isSecurityRelevant,
    signals
  };
}

/**
 * RSS Fetch for individual source
 */
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

      // Filter out automated placeholder promotional livestream broadcasts
      const isLivestream = /^(transmetim\s+live\b|live\s*[:–-]|ndiqeni\s+live\b|shikoni\s+live\b|pratite\s+uživo\b|uzivo\s+prenos\b)/i.test(title) ||
        /live\s+në\s+indeksonline|transmetim\s+live\s+dhe\s+lajme\s+në\s+kohë\s+reale/i.test(`${title} ${description}`);
      if (isLivestream) {
        return null;
      }

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
        isSecurityRelevant: analysis.isSecurityRelevant,
        _signals: analysis.signals,
        multilingualEntities: analysis.signals.entities
      };
    }).filter(Boolean);
  } catch (error) {
    console.log(`[news-intel] ${source.name} failed: ${error.message}`);
    return [];
  }
}

/**
 * Main News Scan & Intelligence Aggregator
 */
async function fetchNews({
  location = 'Kosovo',
  timeline = '24h',
  keywords = []
} = {}) {
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

  // Filter out non-security articles from main dashboard
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
  // Core Pipeline
  fetchNews,
  analyzeArticle,
  fetchRSS,
  SOURCES,
  SOURCE_RELIABILITY,
  SOURCE_AUTHORITY,

  // Normalization & Extraction
  normalizeMultilingualText,
  transliterateCyrillicToLatin,
  foldDiacritics,
  standardizePunctuation,
  extractIntelligenceSignals,
  extractMultilingualEntities,
  extractQuantities,
  extractMoney,
  extractPersonsCount,
  checkScopedNegation,

  // Scoring & Ontology
  calculateSecurityScore,
  CANONICAL_ENTITIES,
  CANONICAL_EVENT_TYPES,
  EVENT_COMPATIBILITY_MATRIX,
  areLocationsCompatible,
  areEventTypesCompatible,
  NEGATION_LEXICON,

  // Deduplication, Clustering & Timeline
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