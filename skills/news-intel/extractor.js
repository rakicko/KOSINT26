'use strict';

const {
  CANONICAL_ENTITIES,
  CANONICAL_EVENT_TYPES,
  NEGATION_LEXICON,
  NUMBER_WORDS_MAP
} = require('./ontology');
const {
  normalizeMultilingualText,
  buildPhraseRegex
} = require('./normalizer');

// Precompiled Regex Patterns for Entity and Event extraction
const COMPILED_PATTERNS = new Map();

function getOrCreateRegex(phrase, exactWord = true) {
  const key = `${phrase}_${exactWord ? '1' : '0'}`;
  if (!COMPILED_PATTERNS.has(key)) {
    COMPILED_PATTERNS.set(key, buildPhraseRegex(phrase, { exactWord }));
  }
  return COMPILED_PATTERNS.get(key);
}

/**
 * Checks for negation in the immediate window (up to 4 tokens) around a target match
 */
function checkScopedNegation(text, matchIndex, matchLength) {
  const windowStart = Math.max(0, matchIndex - 35);
  const windowEnd = Math.min(text.length, matchIndex + matchLength + 35);
  const beforeWindow = text.slice(windowStart, matchIndex).toLowerCase();
  const afterWindow = text.slice(matchIndex + matchLength, windowEnd).toLowerCase();
  const context = `${beforeWindow} [TARGET] ${afterWindow}`;

  const allNegations = [
    ...NEGATION_LEXICON.sr,
    ...NEGATION_LEXICON.al,
    ...NEGATION_LEXICON.en
  ];

  for (const neg of allNegations) {
    const negRe = getOrCreateRegex(neg, true);
    if (negRe.test(beforeWindow) || negRe.test(afterWindow)) {
      return { isNegated: true, negationWord: neg, context };
    }
  }

  return { isNegated: false, negationWord: null, context };
}

/**
 * Extracts Weights & Volumes from text using matchAll()
 */
function extractQuantities(text) {
  if (!text) return [];
  const quantities = [];
  const normalized = text.toLowerCase();

  // Pattern for weight: e.g. 80 kg, 80kg, 100 g, 1.5 tona, 2 tonë
  const weightRegex = /(?:^|[^\p{L}\p{N}])(\d+(?:[\.,]\d+)?)\s*(kg|kilogram|kilogramë|kilograma|g|gram|gramë|grama|tona|tonë|tone|ton)(?=[^\p{L}\p{N}]|$)/giu;
  for (const match of normalized.matchAll(weightRegex)) {
    const rawVal = match[1].replace(',', '.');
    const num = parseFloat(rawVal);
    const unit = match[2].toLowerCase();

    if (!isNaN(num)) {
      let valueInGrams = num;
      if (unit.startsWith('kg') || unit.startsWith('kilo')) valueInGrams = num * 1000;
      else if (unit.startsWith('ton')) valueInGrams = num * 1000000;

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

  // Pattern 1: Symbol prefix e.g. €12,000, € 100.000
  const prefixRegex = /€\s*(\d{1,3}(?:[\.,]\d{3})*(?:[\.,]\d{2})?|\d+)/gi;
  for (const match of normalized.matchAll(prefixRegex)) {
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

  // Pattern 2: Word amounts e.g. 100 mijë euro, 1 milion euro, 50 hiljada evra
  const wordAmountRegex = /(\d+(?:[\.,]\d+)?)\s*(mijë|mije|hiljada|hiljade|tisuca|tisuća|thousand|milion|miliona|milionë|milione|million)\s*(euro|eur|€|evra|evro|dinar|dinara)?/gi;
  for (const match of normalized.matchAll(wordAmountRegex)) {
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

  // Pattern 3: Standard numeric e.g. 100.000 euro, 12,500 EUR, 5000 evra
  const standardRegex = /(?:^|[^\p{L}\p{N}])(\d{1,3}(?:[\.,]\d{3})*(?:[\.,]\d{1,2})?|\d+)\s*(euro|eur|evra|evro|dinar|dinara)(?=[^\p{L}\p{N}]|$)/giu;
  for (const match of normalized.matchAll(standardRegex)) {
    const rawMatch = match[0].trim();
    // Avoid double counting if already captured in word amounts
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
 * Extracts Person Count (arbitrary numbers, text numbers, bounds like at least 3)
 */
function extractPersonsCount(text) {
  if (!text) return [];
  const counts = [];
  const normalized = text.toLowerCase();

  // Pattern A: Bounded expressions ("at least 3", "najmanje 4", "më së paku 5", "dozens", "several")
  const boundedPatterns = [
    { re: /(?:najmanje|najmanje\s*od|at\s*least|më\s*së\s*paku|me\s*se\s*paku|jo\s*më\s*pak\s*se)\s*(\d+|[a-zçëčćžš]+)\s*(?:osoba|osobe|osumnjičen|osumnjičena|lica|të\s*arrestuar|të\s*dyshuar|persona|njerëz|suspects|people|persons|arrested)?/giu, type: 'min' },
    { re: /(?:više\s*od|preko|more\s*than|më\s*shumë\s*se|me\s*shume\s*se)\s*(\d+|[a-zçëčćžš]+)\s*(?:osoba|osobe|osumnjičen|lica|persona|të\s*dyshuar|suspects|people|persons)?/giu, type: 'min' },
    { re: /(?:do|maksimalno|up\s*to|deri\s*në|deri\s*ne)\s*(\d+|[a-zçëčćžš]+)\s*(?:osoba|osobe|osumnjičen|lica|persona|të\s*dyshuar|suspects|people|persons)?/giu, type: 'max' },
    { re: /\b(desetine|dhjetëra|dhjetera|dozens\s*of|dozens)\s*(?:osoba|persona|njerëzish|people|suspects)?\b/giu, type: 'approx_dozens' },
    { re: /\b(nekoliko|disa|several)\s*(?:osoba|persona|njerëz|people|suspects)?\b/giu, type: 'approx_several' }
  ];

  for (const bp of boundedPatterns) {
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
            min: bp.type === 'min' ? num : null,
            max: bp.type === 'max' ? num : null,
            raw: match[0].trim()
          });
        }
      }
    }
  }

  // Pattern B: Exact counts with persons/suspects/arrested (e.g. "6 suspects", "12 injured", "tri osobe")
  const personContextRegex = /(?:^|[^\p{L}\p{N}])(\d+|[a-zçëčćžš]+)\s*(osumnjičen[a-z]*|osumnjicen[a-z]*|osob[a-z]*|lic[a-z]*|të\s*arrestuar[a-z]*|te\s*arrestuar[a-z]*|të\s*dyshuar[a-z]*|te\s*dyshuar[a-z]*|të\s*plagosur[a-z]*|të\s*vrarë|person[a-z]*|njerëz[a-z]*|suspect[a-z]*|people|persons|arrested|injured|killed)(?=[^\p{L}\p{N}]|$)/giu;
  for (const match of normalized.matchAll(personContextRegex)) {
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
 * Extracts canonical entities, events, locations, quantities, and modality signals from news content.
 */
function extractIntelligenceSignals(title = '', description = '') {
  const normTitle = normalizeMultilingualText(title);
  const normDesc = normalizeMultilingualText(description);
  const fullOriginal = `${title} ${description}`.trim();
  const fullTranslit = `${normTitle.transliteratedText} ${normDesc.transliteratedText}`.trim();
  const fullFolded = `${normTitle.foldedText} ${normDesc.foldedText}`.trim();

  const entities = new Set();
  const people = [];
  const institutions = [];
  const locations = [];
  const eventTypes = [];
  const topics = [];
  const negations = [];
  const actionSignals = [];
  const commentarySignals = [];

  // 1. Extract People
  for (const [key, ent] of Object.entries(CANONICAL_ENTITIES.people)) {
    let matched = false;
    const allVariants = [
      ...(ent.variants.sr || []),
      ...(ent.variants.al || []),
      ...(ent.variants.en || []),
      ...(ent.variants.cyrillic || [])
    ];

    for (const variant of allVariants) {
      const vNorm = normalizeMultilingualText(variant).transliteratedText;
      const re = getOrCreateRegex(vNorm, true);
      if (re.test(fullTranslit)) {
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
  for (const [key, inst] of Object.entries(CANONICAL_ENTITIES.institutions)) {
    let matched = false;
    const allVariants = [
      ...(inst.variants.sr || []),
      ...(inst.variants.al || []),
      ...(inst.variants.en || []),
      ...(inst.variants.cyrillic || [])
    ];

    for (const variant of allVariants) {
      const vNorm = normalizeMultilingualText(variant).transliteratedText;
      const re = getOrCreateRegex(vNorm, true);
      if (re.test(fullTranslit)) {
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
  for (const [key, loc] of Object.entries(CANONICAL_ENTITIES.locations)) {
    let matched = false;
    const allVariants = [
      ...(loc.variants.sr || []),
      ...(loc.variants.al || []),
      ...(loc.variants.en || []),
      ...(loc.variants.cyrillic || [])
    ];

    for (const variant of allVariants) {
      const vNorm = normalizeMultilingualText(variant).transliteratedText;
      const re = getOrCreateRegex(vNorm, true);
      if (re.test(fullTranslit)) {
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
  for (const [key, topic] of Object.entries(CANONICAL_ENTITIES.topics)) {
    let matched = false;
    const allVariants = [
      ...(topic.variants.sr || []),
      ...(topic.variants.al || []),
      ...(topic.variants.en || [])
    ];

    for (const variant of allVariants) {
      const vNorm = normalizeMultilingualText(variant).transliteratedText;
      const re = getOrCreateRegex(vNorm, true);
      if (re.test(fullTranslit)) {
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
  for (const [key, ev] of Object.entries(CANONICAL_EVENT_TYPES)) {
    let matched = false;
    let matchedVariant = null;
    let isNegated = false;
    let negationInfo = null;

    const allVariants = [
      ...(ev.variants.sr || []),
      ...(ev.variants.al || []),
      ...(ev.variants.en || []),
      ...(ev.variants.cyrillic || [])
    ];

    for (const variant of allVariants) {
      const vNorm = normalizeMultilingualText(variant).transliteratedText;
      const re = getOrCreateRegex(vNorm, true);
      const match = fullTranslit.match(re);
      if (match) {
        matched = true;
        matchedVariant = variant;
        const matchIdx = match.index || fullTranslit.indexOf(vNorm);
        const scoped = checkScopedNegation(fullTranslit, matchIdx, vNorm.length);
        if (scoped.isNegated) {
          isNegated = true;
          negationInfo = scoped;
        }
        break;
      }
    }

    if (matched) {
      // Determine Modality (MENTION, CONFIRMED, DENIED, RESOLVED)
      let modality = 'CONFIRMED';
      if (isNegated) {
        modality = 'DENIED';
        negations.push({
          eventType: key,
          negationWord: negationInfo.negationWord,
          context: negationInfo.context
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
        matchedVariant,
        modality
      });
      actionSignals.push(key);
    }
  }

  // 6. Extract Quantities, Money, Person Counts
  const quantities = extractQuantities(fullOriginal);
  const money = extractMoney(fullOriginal);
  const personsCount = extractPersonsCount(fullOriginal);

  // Add semantic quantity anchors into entities
  quantities.forEach(q => {
    if (q.unit === 'g') {
      const kg = Math.round(q.value / 1000);
      entities.add(`qty:${kg}kg`);
    }
  });

  money.forEach(m => {
    entities.add(`qty:${Math.round(m.value)}eur`);
  });

  personsCount.forEach(p => {
    if (p.exact && p.count) {
      entities.add(`qty:${p.count}persons`);
    } else if (p.min) {
      entities.add(`qty:min${p.min}persons`);
    }
  });

  // 7. Extract Commentary & Speech Signals
  const commentaryRegex = /\b(rekao|izjavio|poručio|istakao|kaže|tvrdi|ocenio|ocenjuje|pisao|tražio|najavio|upozorio|apelovao|komentarisao|reagovao|thotë|deklaroi|deklaron|tha|paralajmëroi|vlerëson|kërkoi|kërkon|shkroi|njoftoi|komentoi|reagoi|analitičari|analistët|eksperti|ekspertët|opozita|opozicija|komentar|said|stated|warned|demanded|urged)\b/iu;
  if (commentaryRegex.test(normTitle.transliteratedText)) {
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
    temporalSignals: [],
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
