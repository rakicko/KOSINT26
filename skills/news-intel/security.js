'use strict';

const { normalizeMultilingualText } = require('./normalizer');

const SPORTS_ENTERTAINMENT_BLACKLIST = /\b(fudbal|utakmic[ae]|lig[ae]|gol|golov[ai]|trener|arsenal|atletico|napoli|real madrid|košark[ae]|tenis|estrad[ae]|rijaliti|euroleague|uefa|fifa|superliga|futboll|ndeshj[ae]|kampionat|trajner|sporti|basketboll|këngëtar|transferim)\b/i;

const POLITICAL_KEYWORDS_REGEX = /\b(skupština|skupstina|kuvend|kuvendi|kuvendit|sednica|sednice|seancë|seance|seanca|seancës|vlada|vlade|vladi|qeveri|qeveria|qeverisë|qeverise|ministar|ministra|ministri|ministër|minister|ministrit|izbori|izborima|zgjedhje|zgjedhjet|zgjedhjeve|dijalog|dijaloga|dialogu|dialog|ambasada|ambasade|ambasadë|ambasada|ambasadës|sporazum|sporazuma|marrëveshje|marreveshje|marrëveshja|parlament|parlamenti)\b/i;

const WELFARE_GIVEAWAY_NOISE_REGEX = /\b(6\.?000\s*(?:dinara|rsd)|u\s*ponoć\s*počin|u\s*ponoc\s*pocin|novčan[ae]\s*pomoć|novcan[ae]\s*pomoc|prijava\s*za\s*(?:novčanu\s*|novcanu\s*)?pomoć|prijava\s*za\s*(?:novčanu\s*|novcanu\s*)?pomoc|pomoć\s*države|pomoc\s*drzave|pomoć\s*mladima|pomoc\s*mladima|pomoć\s*penzionerima|pomoc\s*penzionerima|isplata\s*penzij|povećanje\s*penzij|povecanje\s*penzij|nagradn[ae]\s*igr[ae]|uzmi\s*račun|uzmi\s*racun|vaučer[ie]?|vaucer[ie]?|lutrij[ae]|loto|ndihm[aë]\s*financiare|loj[ëe]\s*shpërblyese|pensionet)\b/i;

function isWelfareOrGiveawayNoise(title = '', description = '') {
  const text = `${title} ${description}`.trim();
  return WELFARE_GIVEAWAY_NOISE_REGEX.test(text);
}

function isSportsOrEntertainment(title = '', description = '', signals = null) {
  const text = `${title} ${description}`.trim();
  if (!SPORTS_ENTERTAINMENT_BLACKLIST.test(text)) return false;

  // Guard against "arsenal" false positive when referring to a weapon/ammunition arsenal seizure
  if (/\barsenal\b/i.test(text)) {
    const isWeaponArsenal = /arsenal\s+(?:oružj|oruzj|armë|arme|municij|naoružan)/i.test(text) ||
      /(?:zaplen|konfisk|sekuestr|otkriv|gjet|zbul|pronađ|pronadj).*arsenal/i.test(text) ||
      (signals && signals.eventTypes && signals.eventTypes.some(e => e.id && e.id.includes('weapon')));
    if (isWeaponArsenal) {
      const otherSports = /\b(fudbal|utakmic[ae]|lig[ae]|gol|golov[ai]|trener|atletico|napoli|real madrid|košark[ae]|tenis|estrad[ae]|rijaliti|euroleague|uefa|fifa|superliga|futboll|ndeshj[ae]|kampionat|trajner|sporti|basketboll|këngëtar|transferim)\b/i;
      if (!otherSports.test(text)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Checks general Kosovo context in text
 */
function hasKosovoContext(signals, fullText = '') {
  if (signals.locations.length > 0 || signals.institutions.length > 0 || signals.people.length > 0 || signals.topics.length > 0) {
    return true;
  }
  const norm = normalizeMultilingualText(fullText).transliteratedText;
  return /\b(kosov|kosova|kosovo|prishtin|pristin|mitrovic|beograd|serb|shqiptar|balkan|kfor|eulex|qeveri|kuvend|parlament|vlada|skupštin|skupstin|dialog|dijalog)\b/i.test(norm);
}

/**
 * Calculates deterministic security score and classification based on extracted intelligence signals
 * @param {object} signals - Output of extractIntelligenceSignals
 * @param {string} title - Raw or normalized title
 * @param {string} description - Raw or normalized description
 * @param {string|Date} publishedAt - Publication timestamp
 */
function calculateSecurityScore(signals, title = '', description = '', publishedAt = null) {
  const fullText = `${title} ${description}`.trim();
  const titleNorm = normalizeMultilingualText(title).transliteratedText;

  // 0. Hard Sports, Entertainment & Welfare/Giveaway Blacklist
  if (isSportsOrEntertainment(title, description, signals) || isWelfareOrGiveawayNoise(title, description)) {
    return {
      intensityScore: 1,
      severity: 'low',
      category: 'other',
      eventType: 'commentary',
      confidence: 0.10,
      tags: ['noise_excluded'],
      isSecurityRelevant: false
    };
  }

  // 1. Must have Kosovo relevance context
  if (!hasKosovoContext(signals, fullText)) {
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

  // ── Classification Priority Cascade (Single Category Assignment) ───────────
  // Step 1 (Operational - Highest Priority): Physical field events (arrests, weapons, raids, shootings, traffic blockades, border incidents). If true, assign category = 'operational' and stop.
  // Step 2 (Opinion / Commentary): Studio debates, op-eds, analyst columns (analist, opinionist, kolumna, intervistë, komentar). If true, assign category = 'opinion' and stop.
  // Step 3 (Political): Government, diplomacy, assembly sessions, agreements without active unrest. If true, assign category = 'political' and stop.

  const hasOperationalEvent = signals.eventTypes.some(e =>
    ['VIOLENCE', 'ENFORCEMENT', 'SEIZURE', 'DISCOVERY', 'EMERGENCY', 'UNREST', 'ACCIDENT'].includes(e.actionType) ||
    ['event:clash', 'event:shooting', 'event:weapon_use', 'event:explosion', 'event:arrest', 'event:raid', 'event:weapon_seizure', 'event:weapon_discovery', 'event:barricade', 'event:accident', 'event:fire', 'event:espionage'].includes(e.id)
  );

  const hasOperationalKeywords = /\b(uhapšen|uhapsen|uhapšeni|uhapseni|hapje|arrestim|arrestuar|arrestohen|arrestoi|arrestuan|bastisje|bastisën|bastisur|pretres|pretresi|racija|pucnjava|pucano|të\s*shtëna|te\s*shtena|gjuajtje|eksplod|shpërthim|shperthim|zaplena\s*oružja|armë|oruzje|oružje|municij|municion|barikad|bllokad|bllokim\s*rruge|blokada\s*puta|kufi|granic|vendkalim)\b/i.test(fullText);

  const isOperational = hasOperationalEvent || hasOperationalKeywords;

  const isOpinion = /\b(analist|analisti|analistët|analiste|analitičar|analitičari|opinionist|opinionisti|kolumn[ae]|kolumnist|intervist[aëe]|intervju|komentar|komentator|aludon|aludoi|në\s*studio|ne\s*studio|pressing|debat\s*plus|rubikon|shtron\s*pyetjen|polemik|replikë|replike|debat\s*politik)\b/i.test(fullText);

  const isPolitical = POLITICAL_KEYWORDS_REGEX.test(fullText) ||
    signals.institutions.some(i => ['inst:government_kosovo', 'inst:parliament_kosovo', 'inst:ministry_interior'].includes(i.id)) ||
    signals.people.some(p => ['person:albin_kurti', 'person:vjosa_osmani', 'person:aleksandar_vucic', 'person:petar_petkovic', 'person:xhelal_svecla'].includes(p.id));

  let category = 'other';
  let eventType = 'commentary';
  let baseScore = 3;
  let severity = 'low';

  if (isOperational) {
    // Step 1 (Operational - Highest Priority) -> STOP
    category = 'operational';
    eventType = 'event';

    const maxEvent = signals.eventTypes.reduce((prev, curr) => {
      const pScore = prev ? prev.defaultScore : 0;
      return curr.defaultScore > pScore ? curr : prev;
    }, null);

    baseScore = maxEvent ? maxEvent.defaultScore : 6;
    severity = maxEvent ? maxEvent.baseSeverity : 'high';
  } else if (isOpinion) {
    // Step 2 (Opinion / Commentary) -> STOP
    category = 'opinion';
    eventType = 'commentary';
    baseScore = 3;
    severity = 'medium';
  } else if (isPolitical) {
    // Step 3 (Political) -> STOP
    category = 'political';
    eventType = 'political';
    baseScore = 4;
    severity = 'medium';
  } else if (signals.institutions.length > 0 || signals.people.length > 0) {
    category = 'political';
    eventType = 'political';
    baseScore = 4;
    severity = 'medium';
  } else {
    // Fallback unvetted / other
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

  // Commentary score adjustment for opinion
  if (category === 'opinion') {
    baseScore = Math.min(5, Math.max(2, baseScore - 1));
    if (severity === 'critical') severity = 'high';
    else if (severity === 'high') severity = 'medium';
  }

  // 5. North Kosovo Detection & Boost (Geographic attribute, does not mutate primary category)
  let isNorth = signals.locations.some(l => l.isNorth);
  const isKek = signals.locations.some(l => l.id === 'loc:kek') || /\b(kek|obiliq|kastriot)\b/i.test(fullText);
  if (isKek) {
    isNorth = false;
  }

  let northBoost = 0;
  if (isNorth && (baseScore >= 4 || severity !== 'low')) {
    northBoost = 2;
  }

  // 6. Recency Boost
  let timeBoost = 0;
  if (publishedAt) {
    const pubTime = new Date(publishedAt).getTime();
    if (!isNaN(pubTime)) {
      const ageHours = (Date.now() - pubTime) / (3600 * 1000);
      if (ageHours >= 0 && ageHours < 3) timeBoost = 2;
      else if (ageHours >= 3 && ageHours < 6) timeBoost = 1;
    }
  }

  // 7. Negation penalty
  let negationPenalty = 0;
  if (signals.negations.length > 0) {
    negationPenalty = 2;
  }

  const finalScore = Math.min(10, Math.max(1, baseScore + northBoost + timeBoost - negationPenalty));

  // Determine final severity category based on score and category constraints
  if (category === 'opinion') {
    // Opinion pieces never trigger panic/critical
    severity = finalScore >= 7 ? 'high' : finalScore >= 4 ? 'medium' : 'low';
  } else if (finalScore >= 9 && (severity === 'critical' || isNorth || baseScore >= 8)) {
    severity = 'critical';
  } else if (finalScore >= 7) {
    severity = 'high';
  } else if (finalScore >= 4 || category === 'political' || category === 'operational') {
    severity = 'medium';
  } else {
    severity = 'low';
  }

  // 8. Confidence Calculation
  let confidence = 0.50;
  if (isNorth) confidence += 0.15;
  if (signals.institutions.length > 0) confidence += 0.15;
  if (category === 'operational') confidence += 0.10;
  if (signals.people.length > 0) confidence += 0.05;
  if (category === 'political') confidence += 0.10;
  if (eventType === 'commentary') confidence -= 0.05;
  if (signals.negations.length > 0) confidence -= 0.05;
  confidence = Math.max(0.40, Math.min(0.98, Number(confidence.toFixed(2))));

  // 9. Generate Tags from Canonical Signals
  const tags = new Set();
  if (severity === 'critical') tags.add('critical_incident');

  signals.eventTypes.forEach(ev => {
    const tag = ev.id.replace('event:', '');
    tags.add(tag);
  });

  signals.institutions.forEach(inst => {
    if (inst.id === 'inst:kfor') tags.add('kfor_nato');
    else if (inst.id === 'inst:kosovo_police') tags.add('police');
    else if (inst.id === 'inst:eulex') tags.add('eulex');
    else tags.add(inst.id.replace('inst:', ''));
  });

  signals.locations.forEach(loc => {
    if (loc.id === 'loc:ibar_bridge') tags.add('ibar_bridge');
    else if (loc.isNorth) tags.add('north_kosovo');
  });

  if (category === 'operational') {
    tags.add('operational');
  } else if (category === 'opinion') {
    tags.add('opinion');
    tags.add('commentary');
  } else if (category === 'political') {
    tags.add('political');
    tags.add('governance');
  }

  return {
    intensityScore: finalScore,
    severity,
    category,
    eventType,
    confidence,
    tags: Array.from(tags),
    isSecurityRelevant: category === 'operational' || category === 'political'
  };
}

const NORTH_KOSOVO_LOCATIONS_REGEX = /\b(sever\s*kosov|veri\s*(?:u|t[eë]|it)?\s*(?:i|e)?\s*kosov|north\s*kosovo|severn[aoj]\s*mitrovic|mitrovic|zve[cč]|leposav|zubin\s*potok|banjsk|gazivod|ujman|ib[ae]r)/i;

const PRIORITY_CHECKPOINT_REGEX = /\b(jarinj|b[eë]rnjak|brnjak|merdar|dheu\s*i\s*bardh|bela\s*zemlj|mutivod|mu[cč]ibab|hani\s*i\s*elezit|gllobo[cč]i[cç]|stan[cč]i[cç]|kull[eë]|v[eë]rmi[cç]|checkpoint|punkt|vendkalim|prelaz|gate\s*(?:1|31))/i;

/**
 * World Monitor dynamic threat & time-decay news ranking:
 *
 * 1. Base severity score: critical = 4000, high = 3000, medium = 2000, low = 1000
 * 2. Context boost: +500 if location is North Kosovo or priority checkpoint
 * 3. Time decay penalty: -50 points per elapsed hour from item.pubDate
 *
 * @param {object} item - News article or clustered event item
 * @param {number|Date} [referenceTime=Date.now()] - Reference timestamp for elapsed hour calculation
 * @returns {number} Effective ranking score
 */
function calculateEffectiveRank(item, referenceTime = Date.now()) {
  if (!item || typeof item !== 'object') return 0;

  // 1. Base severity score: critical = 4000, high = 3000, medium = 2000, low = 1000
  const SEVERITY_BASE = {
    critical: 4000,
    high: 3000,
    medium: 2000,
    low: 1000
  };

  const sev = String(item.severity || '').toLowerCase().trim();
  let baseScore = SEVERITY_BASE[sev];
  if (baseScore === undefined) {
    const intensity = Number(item.intensityScore) || 0;
    if (intensity >= 9) baseScore = 4000;
    else if (intensity >= 7) baseScore = 3000;
    else if (intensity >= 4) baseScore = 2000;
    else baseScore = 1000;
  }

  // 2. Context boost: +500 if location is North Kosovo or priority checkpoint
  const isNorthOrCheckpoint = isNorthKosovoOrCheckpoint(item);
  const contextBoost = isNorthOrCheckpoint ? 500 : 0;

  // 3. Time decay penalty: -50 points per elapsed hour from item.pubDate
  const rawDate = item.pubDate || item.publishedAt || item.published || item.timestamp || item.date || item.lastUpdated;
  let elapsedHours = 0;
  if (rawDate) {
    const pubTime = new Date(rawDate).getTime();
    const refTime = typeof referenceTime === 'number' ? referenceTime : new Date(referenceTime).getTime();
    if (!isNaN(pubTime) && !isNaN(refTime)) {
      const elapsedMs = Math.max(0, refTime - pubTime);
      elapsedHours = elapsedMs / (3600 * 1000);
    }
  }

  const timeDecayPenalty = elapsedHours * 50;

  const finalRank = Math.round((baseScore + contextBoost - timeDecayPenalty) * 100) / 100;
  return finalRank;
}

/**
 * Checks whether an item is located in North Kosovo or at a priority border checkpoint
 */
function isNorthKosovoOrCheckpoint(item) {
  if (!item || typeof item !== 'object') return false;

  // Direct flag
  if (item.isNorth === true) return true;

  // Check signals / entities if present
  const signalsLocs = (item._signals && item._signals.locations) ||
                      (item.signals && item.signals.locations) ||
                      (item.multilingualEntities && item.multilingualEntities.locations) ||
                      (Array.isArray(item.locations) ? item.locations : []);

  if (Array.isArray(signalsLocs) && signalsLocs.length > 0) {
    for (const loc of signalsLocs) {
      if (!loc) continue;
      if (loc.isNorth) return true;
      const lid = String(loc.id || '').toLowerCase();
      const lname = String(loc.name || '').toLowerCase();
      if (lid.includes('jarinje') || lid.includes('brnjak') || lid.includes('bridge') || lid.includes('merdare') ||
          lname.includes('jarinje') || lname.includes('brnjak') || lname.includes('bridge') || lname.includes('merdare')) {
        return true;
      }
    }
  }

  // Check tags
  if (Array.isArray(item.tags)) {
    for (const tag of item.tags) {
      const t = String(tag).toLowerCase();
      if (t === 'north_kosovo' || t === 'ibar_bridge' || t === 'checkpoint' || t.includes('jarinje') || t.includes('brnjak') || t.includes('merdare')) {
        return true;
      }
    }
  }

  // Check location string / title / description
  const locText = typeof item.location === 'string' ? item.location : (item.location?.name || '');
  const searchTarget = `${locText} ${item.title || ''} ${item.description || ''}`.trim();

  if (NORTH_KOSOVO_LOCATIONS_REGEX.test(searchTarget) || PRIORITY_CHECKPOINT_REGEX.test(searchTarget)) {
    // Guard against KEK / Obiliq / Kastriot false positive North detection
    const fullText = `${item.title || ''} ${item.description || ''} ${typeof item.location === 'string' ? item.location : ''}`.trim();
    if (/\b(kek|obiliq|kastriot)\b/i.test(fullText) && !/\b(mitrovic|zve[cč]|leposav|zubin|jarinj|brnjak|banjsk)\b/i.test(fullText)) {
      return false;
    }
    return true;
  }

  return false;
}

/**
 * World Monitor-Inspired Regional Tension Index (RTI)
 * Analogous to Country Instability Index (CII)
 *
 * Deterministic calculation across a rolling 24-hour window:
 * - Filter items within rolling 24h of referenceTime (default Date.now())
 * - Weighted scores:
 *   - critical incident: 2.5 pts
 *   - high incident:     1.5 pts
 *   - medium incident:   0.8 pts
 *   - low incident:      0.3 pts
 * - Context multiplier: x 1.4 if North Kosovo or priority checkpoints
 * - Trend: Compare last 12 hours vs prior 12 hours (12h-24h). Movement: RISING (↑), STABLE (→), FALLING (↓)
 * - Normalized strict scale: 1.0 to 10.0 (clamped, default baseline = 1.5)
 * - DEFCON / Status levels:
 *   - 1.0 - 3.4: LOW / NORMAL
 *   - 3.5 - 5.9: MODERATE / GUARDED
 *   - 6.0 - 7.9: ELEVATED / HIGH ALERT
 *   - 8.0 - 10.0: CRITICAL / ACTIVE CONFLICT
 *
 * @param {Array<object>} newsItems - List of clustered or raw intelligence items
 * @param {number|Date|string} [referenceTime=Date.now()] - Point in time to compute 24h rolling index
 * @returns {object} { score: number, level: string, trend: 'RISING'|'STABLE'|'FALLING', delta24h: number, incidentCount24h: number }
 */
function calculateRegionalTension(newsItems, referenceTime = Date.now()) {
  const refTime = referenceTime ? new Date(referenceTime).getTime() : Date.now();
  const validRefTime = isNaN(refTime) ? Date.now() : refTime;

  const SEVERITY_WEIGHTS = {
    critical: 2.5,
    high: 1.5,
    medium: 0.8,
    low: 0.3
  };

  const BASELINE_SCORE = 1.5;
  const WINDOW_24H_MS = 24 * 3600 * 1000;
  const WINDOW_12H_MS = 12 * 3600 * 1000;

  if (!Array.isArray(newsItems) || newsItems.length === 0) {
    return {
      score: BASELINE_SCORE,
      level: 'LOW / NORMAL',
      trend: 'STABLE',
      delta24h: 0,
      incidentCount24h: 0,
      breakdown: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        northKosovo: 0,
        recent12hCount: 0,
        prior12hCount: 0
      },
      generatedAt: new Date(validRefTime).toISOString()
    };
  }

  let recentScore = 0;
  let priorScore = 0;
  let recent12hCount = 0;
  let prior12hCount = 0;

  let countCritical = 0;
  let countHigh = 0;
  let countMedium = 0;
  let countLow = 0;
  let countNorth = 0;

  for (const item of newsItems) {
    if (!item || typeof item !== 'object') continue;
    if (item.category === 'other') continue; // Exclude non-security / sports

    const rawDate = item.pubDate || item.publishedAt || item.published || item.timestamp || item.date || item.lastUpdated;
    let elapsedMs = 0;
    if (rawDate) {
      const pubTime = new Date(rawDate).getTime();
      if (!isNaN(pubTime)) {
        elapsedMs = validRefTime - pubTime;
      }
    }

    // Rolling 24-hour window filter (allow up to 10 min clock skew)
    if (elapsedMs < -600000 || elapsedMs > WINDOW_24H_MS) {
      continue;
    }

    // Determine incident severity
    const sev = String(item.severity || '').toLowerCase().trim();
    let weight = SEVERITY_WEIGHTS[sev];
    if (weight === undefined) {
      const intensity = Number(item.intensityScore) || 0;
      if (intensity >= 9) weight = SEVERITY_WEIGHTS.critical;
      else if (intensity >= 7) weight = SEVERITY_WEIGHTS.high;
      else if (intensity >= 4) weight = SEVERITY_WEIGHTS.medium;
      else weight = SEVERITY_WEIGHTS.low;
    }

    // Context multiplier: x 1.4 if North Kosovo or priority checkpoint
    const isNorth = isNorthKosovoOrCheckpoint(item);
    const multiplier = isNorth ? 1.4 : 1.0;
    const finalItemScore = weight * multiplier;

    // Track breakdown statistics
    if (weight === SEVERITY_WEIGHTS.critical) countCritical++;
    else if (weight === SEVERITY_WEIGHTS.high) countHigh++;
    else if (weight === SEVERITY_WEIGHTS.medium) countMedium++;
    else countLow++;

    if (isNorth) countNorth++;

    // Partition into recent 12h vs prior 12h (12h-24h)
    if (elapsedMs <= WINDOW_12H_MS) {
      recentScore += finalItemScore;
      recent12hCount++;
    } else {
      priorScore += finalItemScore;
      prior12hCount++;
    }
  }

  const incidentCount24h = recent12hCount + prior12hCount;
  const totalPoints24h = recentScore + priorScore;

  // Trend: Compare last 12 hours vs prior 12 hours (12h-24h)
  const rawDelta = recentScore - priorScore;
  const delta24h = Math.round(rawDelta * 10) / 10;

  let trend = 'STABLE';
  if (delta24h > 0.1) {
    trend = 'RISING';
  } else if (delta24h < -0.1) {
    trend = 'FALLING';
  }

  // Normalize on strict scale of 1.0 to 10.0 (clamped, default baseline = 1.5)
  const rawNormalized = BASELINE_SCORE + totalPoints24h;
  const score = Math.min(10.0, Math.max(1.0, Math.round(rawNormalized * 10) / 10));

  // Assign DEFCON / Status level
  let level = 'LOW / NORMAL';
  if (score >= 8.0) {
    level = 'CRITICAL / ACTIVE CONFLICT';
  } else if (score >= 6.0) {
    level = 'ELEVATED / HIGH ALERT';
  } else if (score >= 3.5) {
    level = 'MODERATE / GUARDED';
  } else {
    level = 'LOW / NORMAL';
  }

  return {
    score,
    level,
    trend,
    delta24h,
    incidentCount24h,
    breakdown: {
      critical: countCritical,
      high: countHigh,
      medium: countMedium,
      low: countLow,
      northKosovo: countNorth,
      recent12hCount,
      prior12hCount
    },
    generatedAt: new Date(validRefTime).toISOString()
  };
}

module.exports = {
  hasKosovoContext,
  calculateSecurityScore,
  calculateEffectiveRank,
  calculateRegionalTension,
  isNorthKosovoOrCheckpoint,
  isSportsOrEntertainment,
  isWelfareOrGiveawayNoise,
  WELFARE_GIVEAWAY_NOISE_REGEX,
  SPORTS_ENTERTAINMENT_BLACKLIST,
  POLITICAL_KEYWORDS_REGEX,
  NORTH_KOSOVO_LOCATIONS_REGEX,
  PRIORITY_CHECKPOINT_REGEX
};

