'use strict';

const {
  CANONICAL_ENTITIES,
  CANONICAL_EVENT_TYPES,
  NEGATION_LEXICON,
  TEMPORAL_LEXICON,
  NUMBER_WORDS_MAP
} = require('./ontology');
const {
  normalizeMultilingualText,
  buildPhraseRegex
} = require('./normalizer');

// Precompiled Regex Patterns for Entity and Event extraction
const COMPILED_PATTERNS = new Map();
const COMPILED_GLOBAL_PATTERNS = new Map();

function getOrCreateRegex(phrase, exactWord = true) {
  const key = `${phrase}_${exactWord ? '1' : '0'}`;
  let re = COMPILED_PATTERNS.get(key);
  if (!re) {
    re = buildPhraseRegex(phrase, { exactWord });
    COMPILED_PATTERNS.set(key, re);
  }
  return re;
}

function getOrCreateGlobalRegex(phrase, exactWord = true) {
  const key = `${phrase}_${exactWord ? '1' : '0'}`;
  let re = COMPILED_GLOBAL_PATTERNS.get(key);
  if (!re) {
    const baseRe = getOrCreateRegex(phrase, exactWord);
    re = new RegExp(baseRe.source, 'giu');
    COMPILED_GLOBAL_PATTERNS.set(key, re);
  }
  return re;
}

// Flat fast lookup tables for negations
const ALL_NEGATIONS = [
  ...(NEGATION_LEXICON.sr || []),
  ...(NEGATION_LEXICON.al || []),
  ...(NEGATION_LEXICON.en || [])
].map(neg => ({
  word: neg,
  re: getOrCreateRegex(neg, true)
}));

const DENIAL_SUBSTRINGS = [
  'demantov', 'demantoi', 'demanton', 'moho', 'deni', 'odbac', 'netac', 'netač', 'false', 'refut'
];

/**
 * Pre-compiled and Pre-normalized Ontology Definitions for Zero Runtime Overhead
 */
const PREPARED_PEOPLE = Object.entries(CANONICAL_ENTITIES.people).map(([key, ent]) => ({
  key,
  ent,
  disqualifiers: ent.disqualifiers || [],
  patterns: [
    ...(ent.variants.sr || []),
    ...(ent.variants.al || []),
    ...(ent.variants.en || []),
    ...(ent.variants.cyrillic || [])
  ].map(v => getOrCreateRegex(normalizeMultilingualText(v).transliteratedText, true))
}));

const PREPARED_INSTITUTIONS = Object.entries(CANONICAL_ENTITIES.institutions).map(([key, inst]) => ({
  key,
  inst,
  disqualifiers: inst.disqualifiers || [],
  patterns: [
    ...(inst.variants.sr || []),
    ...(inst.variants.al || []),
    ...(inst.variants.en || []),
    ...(inst.variants.cyrillic || [])
  ].map(v => getOrCreateRegex(normalizeMultilingualText(v).transliteratedText, true))
}));

const PREPARED_LOCATIONS = Object.entries(CANONICAL_ENTITIES.locations).map(([key, loc]) => ({
  key,
  loc,
  disqualifiers: loc.disqualifiers || [],
  patterns: [
    ...(loc.variants.sr || []),
    ...(loc.variants.al || []),
    ...(loc.variants.en || []),
    ...(loc.variants.cyrillic || [])
  ].map(v => getOrCreateRegex(normalizeMultilingualText(v).transliteratedText, true))
}));

const PREPARED_TOPICS = Object.entries(CANONICAL_ENTITIES.topics).map(([key, topic]) => ({
  key,
  topic,
  disqualifiers: topic.disqualifiers || [],
  patterns: [
    ...(topic.variants.sr || []),
    ...(topic.variants.al || []),
    ...(topic.variants.en || [])
  ].map(v => getOrCreateRegex(normalizeMultilingualText(v).transliteratedText, true))
}));

const PREPARED_EVENT_TYPES = Object.entries(CANONICAL_EVENT_TYPES).map(([key, ev]) => ({
  key,
  ev,
  disqualifiers: ev.disqualifiers || [],
  variants: [
    ...(ev.variants.sr || []),
    ...(ev.variants.al || []),
    ...(ev.variants.en || []),
    ...(ev.variants.cyrillic || [])
  ].map(v => {
    const vNorm = normalizeMultilingualText(v).transliteratedText;
    return {
      rawVariant: v,
      normLength: vNorm.length,
      regex: getOrCreateGlobalRegex(vNorm, true)
    };
  })
}));

/**
 * Checks for negation in the immediate clause window around a target match
 */
function checkScopedNegation(text, matchIndex, matchLength) {
  const maxLookback = Math.max(0, matchIndex - 45);
  let precedingText = text.slice(maxLookback, matchIndex);

  const lastPunctIdx = Math.max(
    precedingText.lastIndexOf('.'),
    precedingText.lastIndexOf(';'),
    precedingText.lastIndexOf('!'),
    precedingText.lastIndexOf('?')
  );
  if (lastPunctIdx !== -1) {
    precedingText = precedingText.slice(lastPunctIdx + 1);
  }

  const lastContrastiveIdx = Math.max(
    precedingText.lastIndexOf(' ali '),
    precedingText.lastIndexOf(', ali '),
    precedingText.lastIndexOf(' por '),
    precedingText.lastIndexOf(', por '),
    precedingText.lastIndexOf(' but '),
    precedingText.lastIndexOf(', but '),
    precedingText.lastIndexOf(' već '),
    precedingText.lastIndexOf(', već '),
    precedingText.lastIndexOf(' međutim '),
    precedingText.lastIndexOf(', međutim '),
    precedingText.lastIndexOf(' medjutim '),
    precedingText.lastIndexOf(' however ')
  );
  if (lastContrastiveIdx !== -1) {
    precedingText = precedingText.slice(lastContrastiveIdx);
  }

  const maxLookahead = Math.min(text.length, matchIndex + matchLength + 55);
  let followingText = text.slice(matchIndex + matchLength, maxLookahead);

  const hasDenialInFollowing = DENIAL_SUBSTRINGS.some(dp => followingText.includes(dp));

  if (!hasDenialInFollowing) {
    const nextPunctIdx = followingText.search(/[\.;!\?]|,\s*(?:ali|por|but|već|dok)/i);
    if (nextPunctIdx !== -1) {
      followingText = followingText.slice(0, nextPunctIdx);
    }
  }

  for (let i = 0; i < ALL_NEGATIONS.length; i++) {
    const { word, re } = ALL_NEGATIONS[i];
    if (re.test(precedingText) || re.test(followingText)) {
      return {
        isNegated: true,
        negationWord: word,
        context: `${precedingText} [TARGET] ${followingText}`.trim()
      };
    }
  }

  return {
    isNegated: false,
    negationWord: null,
    context: `${precedingText} [TARGET] ${followingText}`.trim()
  };
}

/**
 * Checks whether an entity or event is disqualified by a known false-positive context (Fast substring lookup)
 */
function isDisqualified(disqualifiers, fullOriginalLower, fullTranslit) {
  if (!disqualifiers || disqualifiers.length === 0) return false;
  for (let i = 0; i < disqualifiers.length; i++) {
    const dq = disqualifiers[i];
    if (fullTranslit.includes(dq) || fullOriginalLower.includes(dq)) {
      return true;
    }
  }
  return false;
}

// Pre-compiled global quantity regexes
const WEIGHT_REGEX = /(?:^|[^\p{L}\p{N}])(\d+(?:[\.,]\d+)?)\s*(kg|kilogram|kilogramë|kilograma|kilograms|g|gram|gramë|grama|grams|tona|tonë|tone|ton|tonne|tonnes|t)(?=[^\p{L}\p{N}]|$)/giu;
const MONEY_PREFIX_REGEX = /€\s*(\d{1,3}(?:[\.,]\d{3})*(?:[\.,]\d{2})?|\d+)/gi;
const MONEY_WORD_REGEX = /(\d+(?:[\.,]\d+)?)\s*(mijë|mije|hiljada|hiljade|tisuca|tisuća|thousand|milion|miliona|milionë|milione|million)\s*(euro|eur|€|evra|evro|dinar|dinara)?/gi;
const MONEY_STANDARD_REGEX = /(?:^|[^\p{L}\p{N}])(\d{1,3}(?:[\.,]\d{3})*(?:[\.,]\d{1,2})?|\d+)\s*(euro|eur|evra|evro|dinar|dinara)(?=[^\p{L}\p{N}]|$)/giu;
const PERSON_CONTEXT_REGEX = /(?:^|[^\p{L}\p{N}])(\d+|[a-zçëčćžš]+)\s*(osumnjičen[a-z]*|osumnjicen[a-z]*|osob[a-z]*|lic[a-z]*|të\s*arrestuar[a-z]*|te\s*arrestuar[a-z]*|të\s*dyshuar[a-z]*|te\s*dyshuar[a-z]*|të\s*plagosur[a-z]*|të\s*vrarë|person[a-z]*|njerëz[a-z]*|suspect[a-z]*|people|persons|arrested|injured|killed)(?=[^\p{L}\p{N}]|$)/giu;
const COMMENTARY_REGEX = /\b(rekao|izjavio|poručio|istakao|kaže|tvrdi|ocenio|ocenjuje|pisao|tražio|najavio|upozorio|apelovao|komentarisao|reagovao|saopštila|saopštio|saopšteno|thotë|deklaroi|deklaron|tha|paralajmëroi|vlerëson|kërkoi|kërkon|shkroi|njoftoi|komentoi|reagoi|analitičari|analistët|eksperti|ekspertët|opozita|opozicija|komentar|said|stated|warned|demanded|urged|announced|aludon|aludoi|aluduar|opinionist|opinionisti|analist|analisti|gazetari|pressing|debat\s*plus|rubikon|në\s*studio|ne\s*studio|shtron\s*pyetjen|pyetjen\s*a\s*do|debat\s*politik|polemikë|polemike|replikë|replike)\b/iu;

/**
 * Extracts Weights & Volumes from text using matchAll()
 */
function extractQuantities(text) {
  if (!text) return [];
  const quantities = [];
  const normalized = text.toLowerCase();

  for (const match of normalized.matchAll(WEIGHT_REGEX)) {
    const rawVal = match[1];
    const unit = match[2].toLowerCase();

    let num;
    if (/\.\d{3}$/.test(rawVal) && unit.startsWith('kg')) {
      num = parseFloat(rawVal.replace('.', ''));
    } else {
      num = parseFloat(rawVal.replace(',', '.'));
    }

    if (!isNaN(num)) {
      let valueInGrams = num;
      if (unit.startsWith('kg') || unit.startsWith('kilo')) valueInGrams = num * 1000;
      else if (unit.startsWith('ton') || unit === 't') valueInGrams = num * 1000000;

      quantities.push({
        type: 'weight',
        value: valueInGrams,
        unit: 'g',
        displayValue: num,
        displayUnit: unit,
        raw: match[0].trim()
      });
    }
  }

  return quantities;
}

/**
 * Extracts Money & Currency from text using matchAll()
 */
function extractMoney(text) {
  if (!text) return [];
  const moneyItems = [];
  const normalized = text.toLowerCase();

  for (const match of normalized.matchAll(MONEY_PREFIX_REGEX)) {
    const cleanDigits = match[1].replace(/[\.,](?=\d{3})/g, '').replace(',', '.');
    const amount = parseFloat(cleanDigits);
    if (!isNaN(amount)) {
      moneyItems.push({
        type: 'money',
        value: amount,
        currency: 'EUR',
        raw: match[0].trim()
      });
    }
  }

  for (const match of normalized.matchAll(MONEY_WORD_REGEX)) {
    const baseNum = parseFloat(match[1].replace(',', '.'));
    const multWord = match[2].toLowerCase();
    const currWord = (match[3] || 'EUR').toUpperCase();
    let multiplier = 1;
    if (['mijë', 'mije', 'hiljada', 'hiljade', 'tisuca', 'tisuća', 'thousand'].includes(multWord)) multiplier = 1000;
    else if (['milion', 'miliona', 'milionë', 'milione', 'million'].includes(multWord)) multiplier = 1000000;

    const total = baseNum * multiplier;
    if (!isNaN(total)) {
      moneyItems.push({
        type: 'money',
        value: total,
        currency: currWord.includes('DINAR') ? 'RSD' : 'EUR',
        raw: match[0].trim()
      });
    }
  }

  for (const match of normalized.matchAll(MONEY_STANDARD_REGEX)) {
    const rawMatch = match[0].trim();
    if (!moneyItems.some(m => rawMatch.includes(m.raw) || m.raw.includes(rawMatch))) {
      const cleanDigits = match[1].replace(/[\.,](?=\d{3})/g, '').replace(',', '.');
      const amount = parseFloat(cleanDigits);
      if (!isNaN(amount)) {
        const curr = match[2].toLowerCase().includes('dinar') ? 'RSD' : 'EUR';
        moneyItems.push({
          type: 'money',
          value: amount,
          currency: curr,
          raw: rawMatch
        });
      }
    }
  }

  return moneyItems;
}

/**
 * Extracts Person Count
 */
function extractPersonsCount(text) {
  if (!text) return [];
  const counts = [];
  const normalized = text.toLowerCase();

  const boundedPatterns = [
    { re: /(?:najmanje|najmanje\s*od|at\s*least|më\s*së\s*paku|me\s*se\s*paku|jo\s*më\s*pak\s*se)\s*(\d+|[a-zçëčćžš]+)\s*(?:osoba|osobe|osumnjičen|osumnjičena|lica|të\s*arrestuar|të\s*dyshuar|persona|njerëz|suspects|people|persons|arrested)?/giu, type: 'min' },
    { re: /(?:više\s*od|preko|more\s*than|më\s*shumë\s*se|me\s*shume\s*se)\s*(\d+|[a-zçëčćžš]+)\s*(?:osoba|osobe|osumnjičen|lica|persona|të\s*dyshuar|suspects|people|persons)?/giu, type: 'more' },
    { re: /(?:do|maksimalno|up\s*to|deri\s*në|deri\s*ne)\s*(\d+|[a-zçëčćžš]+)\s*(?:osoba|osobe|osumnjičen|lica|persona|të\s*dyshuar|suspects|people|persons)?/giu, type: 'max' },
    { re: /\b(desetine|dhjetëra|dhjetera|dozens\s*of|dozens)\s*(?:osoba|persona|njerëzish|people|suspects)?\b/giu, type: 'approx_dozens' },
    { re: /\b(nekoliko|disa|several)\s*(?:osoba|persona|njerëz|people|suspects)?\b/giu, type: 'approx_several' }
  ];

  for (let i = 0; i < boundedPatterns.length; i++) {
    const bp = boundedPatterns[i];
    for (const match of normalized.matchAll(bp.re)) {
      if (bp.type === 'approx_dozens') {
        counts.push({ exact: false, min: 10, max: 99, raw: match[0].trim() });
      } else if (bp.type === 'approx_several') {
        counts.push({ exact: false, min: 3, max: 9, raw: match[0].trim() });
      } else {
        const valToken = match[1];
        let num = parseInt(valToken, 10);
        if (isNaN(num) && NUMBER_WORDS_MAP[valToken]) {
          num = NUMBER_WORDS_MAP[valToken];
        }
        if (!isNaN(num)) {
          counts.push({
            exact: false,
            min: bp.type === 'min' ? num : (bp.type === 'more' ? num + 1 : null),
            max: bp.type === 'max' ? num : null,
            raw: match[0].trim()
          });
        }
      }
    }
  }

  for (const match of normalized.matchAll(PERSON_CONTEXT_REGEX)) {
    const rawMatch = match[0].trim();
    if (!counts.some(c => c.raw.includes(rawMatch) || rawMatch.includes(c.raw))) {
      const valToken = match[1].toLowerCase();
      let num = parseInt(valToken, 10);
      if (isNaN(num) && NUMBER_WORDS_MAP[valToken]) {
        num = NUMBER_WORDS_MAP[valToken];
      }
      if (!isNaN(num) && num > 0 && num < 100000) {
        counts.push({
          exact: true,
          count: num,
          role: match[2].toLowerCase(),
          raw: rawMatch
        });
      }
    }
  }

  return counts;
}

/**
 * Central Intelligence Signal Extractor
 */
function extractIntelligenceSignals(title = '', description = '') {
  const normTitle = normalizeMultilingualText(title);
  const normDesc = normalizeMultilingualText(description);
  const fullOriginal = `${title} ${description}`.trim();
  const fullOriginalLower = fullOriginal.toLowerCase();
  const fullTranslit = `${normTitle.transliteratedText} ${normDesc.transliteratedText}`.trim();

  const entities = new Set();
  const people = [];
  const institutions = [];
  const locations = [];
  const eventTypes = [];
  const topics = [];
  const negations = [];
  const actionSignals = [];
  const commentarySignals = [];
  const temporalSignals = [];

  // 1. Extract People
  for (let i = 0; i < PREPARED_PEOPLE.length; i++) {
    const { key, ent, disqualifiers, patterns } = PREPARED_PEOPLE[i];
    if (isDisqualified(disqualifiers, fullOriginalLower, fullTranslit)) continue;

    let matched = false;
    for (let j = 0; j < patterns.length; j++) {
      if (patterns[j].test(fullTranslit)) {
        matched = true;
        break;
      }
    }

    if (matched) {
      entities.add(key);
      people.push({ id: key, label: ent.label, role: ent.role });
    }
  }

  // 2. Extract Institutions
  for (let i = 0; i < PREPARED_INSTITUTIONS.length; i++) {
    const { key, inst, disqualifiers, patterns } = PREPARED_INSTITUTIONS[i];
    if (isDisqualified(disqualifiers, fullOriginalLower, fullTranslit)) continue;

    let matched = false;
    for (let j = 0; j < patterns.length; j++) {
      if (patterns[j].test(fullTranslit)) {
        matched = true;
        break;
      }
    }

    if (matched) {
      entities.add(key);
      institutions.push({ id: key, label: inst.label });
    }
  }

  // 3. Extract Locations with Hierarchy
  for (let i = 0; i < PREPARED_LOCATIONS.length; i++) {
    const { key, loc, disqualifiers, patterns } = PREPARED_LOCATIONS[i];
    if (isDisqualified(disqualifiers, fullOriginalLower, fullTranslit)) continue;

    let matched = false;
    for (let j = 0; j < patterns.length; j++) {
      if (patterns[j].test(fullTranslit)) {
        matched = true;
        break;
      }
    }

    if (matched) {
      entities.add(key);
      locations.push({
        id: key,
        name: loc.name,
        isNorth: loc.isNorth,
        parent: loc.parent || null,
        municipality: loc.municipality || loc.name
      });
    }
  }

  // 4. Extract Topics
  for (let i = 0; i < PREPARED_TOPICS.length; i++) {
    const { key, topic, disqualifiers, patterns } = PREPARED_TOPICS[i];
    if (isDisqualified(disqualifiers, fullOriginalLower, fullTranslit)) continue;

    let matched = false;
    for (let j = 0; j < patterns.length; j++) {
      if (patterns[j].test(fullTranslit)) {
        matched = true;
        break;
      }
    }

    if (matched) {
      entities.add(key);
      topics.push({ id: key, label: topic.label });
    }
  }

  // 5. Extract Canonical Event Types with Scoped Negation & Modality
  for (let i = 0; i < PREPARED_EVENT_TYPES.length; i++) {
    const { key, ev, disqualifiers, variants } = PREPARED_EVENT_TYPES[i];
    if (isDisqualified(disqualifiers, fullOriginalLower, fullTranslit)) continue;

    const occurrences = [];
    for (let j = 0; j < variants.length; j++) {
      const { rawVariant, normLength, regex } = variants[j];
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(fullTranslit)) !== null) {
        const matchIdx = match.index || 0;
        const scoped = checkScopedNegation(fullTranslit, matchIdx, normLength);
        occurrences.push({
          variant: rawVariant,
          matchIndex: matchIdx,
          isNegated: scoped.isNegated,
          negationInfo: scoped
        });
        if (!regex.global) break;
      }
    }

    if (occurrences.length > 0) {
      const positiveOccurrences = occurrences.filter(o => !o.isNegated);
      const isOverallNegated = positiveOccurrences.length === 0;
      const primaryOcc = positiveOccurrences[0] || occurrences[0];

      let modality = 'CONFIRMED';
      if (isOverallNegated) {
        modality = 'DENIED';
        negations.push({
          eventType: key,
          negationWord: primaryOcc.negationInfo.negationWord,
          context: primaryOcc.negationInfo.context
        });
      } else if (key === 'event:release' || key === 'event:meeting_held' || key === 'event:meeting_cancellation') {
        modality = 'RESOLVED';
      }

      entities.add(key);
      eventTypes.push({
        id: key,
        name: ev.name,
        baseSeverity: ev.baseSeverity,
        defaultScore: ev.defaultScore,
        actionType: ev.actionType,
        matchedVariant: primaryOcc.variant,
        modality
      });
      actionSignals.push(key);
    }
  }

  // 6. Extract Quantities, Money, Person Counts
  const quantities = extractQuantities(fullOriginal);
  const money = extractMoney(fullOriginal);
  const personsCount = extractPersonsCount(fullOriginal);

  for (let i = 0; i < quantities.length; i++) {
    const q = quantities[i];
    if (q.unit === 'g') {
      const kg = Math.round(q.value / 1000);
      entities.add(`qty:${kg}kg`);
    }
  }

  for (let i = 0; i < money.length; i++) {
    entities.add(`qty:${Math.round(money[i].value)}eur`);
  }

  for (let i = 0; i < personsCount.length; i++) {
    const p = personsCount[i];
    if (p.exact && p.count) {
      entities.add(`qty:${p.count}persons`);
    } else if (p.min) {
      entities.add(`qty:min${p.min}persons`);
    }
  }

  // 7. Extract Temporal Signals
  if (TEMPORAL_LEXICON) {
    for (let i = 0; i < TEMPORAL_LEXICON.historical.length; i++) {
      if (fullTranslit.includes(TEMPORAL_LEXICON.historical[i])) {
        temporalSignals.push('HISTORICAL_REFERENCE');
        break;
      }
    }
    for (let i = 0; i < TEMPORAL_LEXICON.planned.length; i++) {
      if (fullTranslit.includes(TEMPORAL_LEXICON.planned[i])) {
        temporalSignals.push('FUTURE_PLANNED');
        break;
      }
    }
    for (let i = 0; i < TEMPORAL_LEXICON.completed.length; i++) {
      if (fullTranslit.includes(TEMPORAL_LEXICON.completed[i])) {
        temporalSignals.push('COMPLETED');
        break;
      }
    }
  }

  // 8. Extract Commentary & Speech Signals
  if (COMMENTARY_REGEX.test(normTitle.transliteratedText) || COMMENTARY_REGEX.test(normDesc.transliteratedText)) {
    commentarySignals.push('speech_statement');
  }

  return {
    entities: Array.from(entities),
    people,
    institutions,
    locations,
    eventTypes,
    topics,
    quantities,
    money,
    personsCount,
    negations,
    temporalSignals,
    commentarySignals,
    actionSignals
  };
}

module.exports = {
  extractIntelligenceSignals,
  extractQuantities,
  extractMoney,
  extractPersonsCount,
  checkScopedNegation
};
