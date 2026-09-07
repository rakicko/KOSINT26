'use strict';

/**
 * Regional Tension Index (RTI) Calculation & Operational Rationale Engine
 * Analogous to Country Instability Index (CII)
 *
 * Provides:
 * 1. Deterministic 1.0 - 10.0 scoring across a rolling 24h window
 * 2. Dynamic contributing factors payload (critical count, high count, active flashpoints)
 * 3. Dynamic operational primary drivers explaining the exact causes
 * 4. Flashpoint heat analysis by municipality
 * 5. Estimated decay time until score recedes
 * 6. Non-kinetic administrative ceiling cap (peaceful rhetoric capped at 6.5 unless paired with kinetic unrest)
 */

const NORTH_KOSOVO_LOCATIONS_REGEX = /\b(sever\s*kosov|veri\s*(?:u|t[eë]|it)?\s*(?:i|e)?\s*kosov|north\s*kosovo|severn[aoj]\s*mitrovic|mitrovic|zve[cč]|leposav|zubin\s*potok|banjsk|gazivod|ujman|ib[ae]r)/i;
const PRIORITY_CHECKPOINT_REGEX = /\b(jarinj|b[eë]rnjak|brnjak|merdar|dheu\s*i\s*bardh|bela\s*zemlj|mutivod|mu[cč]ibab|hani\s*i\s*elezit|gllobo[cč]i[cç]|stan[cč]i[cç]|kull[eë]|v[eë]rmi[cç]|checkpoint|punkt|vendkalim|prelaz|gate\s*(?:1|31))/i;

const KINETIC_UNREST_REGEX = /\b(clash|shooting|pucnjava|të\s*shtëna|te\s*shtena|gunfire|armed|weapon|oružj|armë|explosion|eksploz|shpërthim|shperthim|bomb|granat|raid|bastisje|pretres|arrest|uhapšen|uhapsen|arrestuar|barricade|barikad|blockade|bllokad|protest|unrest|trazir|neredi|molotov|assault|attack|sulm|napad|kfor|patrol|special\s*unit|njësia\s*speciale|specijalci|rosu)\b/i;

/**
 * Checks whether an item is located in North Kosovo or at a priority border checkpoint
 */
function isNorthKosovoOrCheckpoint(item) {
  if (!item || typeof item !== 'object') return false;
  if (item.isNorth === true) return true;

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

  if (Array.isArray(item.tags)) {
    for (const tag of item.tags) {
      const t = String(tag).toLowerCase();
      if (t === 'north_kosovo' || t === 'ibar_bridge' || t === 'checkpoint' || t.includes('jarinje') || t.includes('brnjak') || t.includes('merdare')) {
        return true;
      }
    }
  }

  const locText = typeof item.location === 'string' ? item.location : (item.location?.name || '');
  const searchTarget = `${locText} ${item.title || ''} ${item.description || ''}`.trim();

  if (NORTH_KOSOVO_LOCATIONS_REGEX.test(searchTarget) || PRIORITY_CHECKPOINT_REGEX.test(searchTarget)) {
    const fullText = `${item.title || ''} ${item.description || ''} ${typeof item.location === 'string' ? item.location : ''}`.trim();
    if (/\b(kek|obiliq|kastriot)\b/i.test(fullText) && !/\b(mitrovic|zve[cč]|leposav|zubin|jarinj|brnjak|banjsk)\b/i.test(fullText)) {
      return false;
    }
    return true;
  }

  return false;
}

/**
 * Checks if an item represents a genuine physical, kinetic, or active unrest incident
 */
function isKineticOrOperationalEvent(item) {
  if (!item || typeof item !== 'object') return false;

  if (item.category === 'operational') return true;
  if (item.isKinetic === true) return true;

  const actionTypes = (item.signals && item.signals.eventTypes) ||
                      (item._signals && item._signals.eventTypes) || [];
  if (Array.isArray(actionTypes)) {
    for (const e of actionTypes) {
      if (!e) continue;
      if (['VIOLENCE', 'ENFORCEMENT', 'SEIZURE', 'DISCOVERY', 'EMERGENCY', 'UNREST', 'ACCIDENT'].includes(e.actionType)) {
        return true;
      }
      if (['event:clash', 'event:shooting', 'event:weapon_use', 'event:explosion', 'event:arrest', 'event:raid', 'event:weapon_seizure', 'event:weapon_discovery', 'event:barricade', 'event:unrest'].includes(e.id)) {
        return true;
      }
    }
  }

  const text = `${item.title || ''} ${item.description || ''}`.trim();
  return KINETIC_UNREST_REGEX.test(text);
}

/**
 * Extracts primary location / municipality name from an item
 */
function extractLocationName(item) {
  if (!item || typeof item !== 'object') return null;

  if (typeof item.location === 'string' && item.location.trim()) {
    return item.location.trim();
  }
  if (item.location && typeof item.location.name === 'string' && item.location.name.trim()) {
    return item.location.name.trim();
  }

  const locs = (item.signals && item.signals.locations) ||
               (item._signals && item._signals.locations) ||
               (item.multilingualEntities && item.multilingualEntities.locations);
  if (Array.isArray(locs) && locs.length > 0 && locs[0]) {
    return locs[0].name || locs[0].id || null;
  }

  const text = `${item.title || ''} ${item.description || ''}`;
  if (/\b(mitrovic[aëe]?|severna\s*mitrovica|north\s*mitrovica)\b/i.test(text)) return 'Mitrovicë';
  if (/\b(zve[cč]an|zve[cç]an)\b/i.test(text)) return 'Zvečan';
  if (/\b(leposavi[cć]|leposaviq)\b/i.test(text)) return 'Leposavić';
  if (/\b(zubin\s*potok)\b/i.test(text)) return 'Zubin Potok';
  if (/\b(prishtin[aëe]?|priština|pristina)\b/i.test(text)) return 'Prishtinë';
  if (/\b(gra[cč]anic[aëe]?)\b/i.test(text)) return 'Gračanica';
  if (/\b(pej[aëe]?|pe[cć])\b/i.test(text)) return 'Pejë';
  if (/\b(prizren)\b/i.test(text)) return 'Prizren';
  if (/\b(gjilan|gnjilane)\b/i.test(text)) return 'Gjilan';
  if (/\b(gjakov[aëe]?|đakovica)\b/i.test(text)) return 'Gjakovë';
  if (/\b(jarinj[aëe]?)\b/i.test(text)) return 'Jarinje (Border)';
  if (/\b(brnjak|b[eë]rnjak)\b/i.test(text)) return 'Bërnjak (Border)';
  if (/\b(banjsk[aëe]?)\b/i.test(text)) return 'Banjskë';

  return null;
}

/**
 * Normalized Fingerprint Hash: normalize(title).slice(0, 60) + "_" + source
 */
function getAlertFingerprint(item) {
  if (!item || typeof item !== 'object') return '';
  const rawTitle = item.title || item.canonicalTitle || item.message || '';
  const cleanTitle = String(rawTitle).toLowerCase()
    .replace(/^[\[\(]news[\]\)]\s*/i, '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 60);
  const rawSource = String(item.source || (Array.isArray(item.sources) ? item.sources[0] : '') || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
  return `${cleanTitle}_${rawSource}`;
}

/**
 * Calculates Regional Tension Index (RTI) with dynamic factors & operational rationale
 *
 * @param {Array<object>} newsItems - List of news/intel items
 * @param {number|Date|string} [referenceTime=Date.now()] - Calculation timestamp
 * @returns {object} Full tension payload with factors and operational rationale
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
  const NON_KINETIC_CEILING = 6.5;

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
      factors: {
        criticalEventsCount: 0,
        highEventsCount: 0,
        activeFlashpoints: [],
        primaryDrivers: [
          'Baseline ambient stability — no critical security alerts detected in 24h window',
          'Border crossings and transit corridors operating under nominal conditions'
        ],
        flashpointHeat: [],
        decayTime: 'Stable baseline — no active decay required',
        kineticEventsCount: 0,
        isCeilingApplied: false
      },
      generatedAt: new Date(validRefTime).toISOString()
    };
  }

  // Deduplicate items before calculating RTI so duplicated feeds cannot stack score multipliers
  const seenFingerprints = new Set();
  const dedupedNewsItems = [];
  for (const item of newsItems) {
    if (!item || typeof item !== 'object') continue;
    const fp = getAlertFingerprint(item);
    if (fp && seenFingerprints.has(fp)) continue;
    if (fp) seenFingerprints.add(fp);
    dedupedNewsItems.push(item);
  }

  let recentScore = 0;
  let priorScore = 0;
  let recentActivity = 0;
  let priorActivity = 0;
  let recent12hCount = 0;
  let prior12hCount = 0;

  let countCritical = 0;
  let countHigh = 0;
  let countMedium = 0;
  let countLow = 0;
  let countNorth = 0;
  let countKinetic = 0;

  const flashpointCounts = {};
  const validItemsIn24h = [];
  let oldestHighOrCriticalElapsedMs = 0;
  let newestHighOrCriticalElapsedMs = Infinity;

  for (const item of dedupedNewsItems) {
    if (!item || typeof item !== 'object') continue;
    if (item.category === 'other') continue;

    const rawDate = item.pubDate || item.publishedAt || item.published || item.timestamp || item.date || item.lastUpdated;
    let elapsedMs = 0;
    if (rawDate) {
      const pubTime = new Date(rawDate).getTime();
      if (!isNaN(pubTime)) {
        elapsedMs = validRefTime - pubTime;
      } else {
        continue;
      }
    } else {
      continue; // Undated items have 0 contribution to active 24h tension index
    }

    const ageHours = elapsedMs / (1000 * 60 * 60);

    // Strict 24h Cutoff Gate: zero contribution to active tension index if older than 24h
    if (ageHours > 24 || ageHours < -2) {
      continue;
    }

    // Linear recency decay weight across the 24h window
    const recencyWeight = Math.max(0, 1 - (ageHours / 24));

    const sev = String(item.severity || '').toLowerCase().trim();
    let weight = SEVERITY_WEIGHTS[sev];
    if (weight === undefined) {
      const intensity = Number(item.intensityScore) || 0;
      if (intensity >= 9) weight = SEVERITY_WEIGHTS.critical;
      else if (intensity >= 7) weight = SEVERITY_WEIGHTS.high;
      else if (intensity >= 4) weight = SEVERITY_WEIGHTS.medium;
      else weight = SEVERITY_WEIGHTS.low;
    }

    const isNorth = isNorthKosovoOrCheckpoint(item);
    const multiplier = isNorth ? 1.4 : 1.0;
    const baseWeight = weight * multiplier;
    const finalItemScore = baseWeight * recencyWeight;

    if (weight === SEVERITY_WEIGHTS.critical) {
      countCritical++;
      if (elapsedMs > oldestHighOrCriticalElapsedMs) oldestHighOrCriticalElapsedMs = elapsedMs;
      if (elapsedMs < newestHighOrCriticalElapsedMs) newestHighOrCriticalElapsedMs = elapsedMs;
    } else if (weight === SEVERITY_WEIGHTS.high) {
      countHigh++;
      if (elapsedMs > oldestHighOrCriticalElapsedMs) oldestHighOrCriticalElapsedMs = elapsedMs;
      if (elapsedMs < newestHighOrCriticalElapsedMs) newestHighOrCriticalElapsedMs = elapsedMs;
    } else if (weight === SEVERITY_WEIGHTS.medium) {
      countMedium++;
    } else {
      countLow++;
    }

    if (isNorth) countNorth++;

    const isKinetic = isKineticOrOperationalEvent(item);
    if (isKinetic) countKinetic++;

    const locName = extractLocationName(item) || (isNorth ? 'North Kosovo' : 'Central Kosovo');
    if (!flashpointCounts[locName]) {
      flashpointCounts[locName] = { name: locName, count: 0, isNorth, maxWeight: 0 };
    }
    flashpointCounts[locName].count++;
    if (weight > flashpointCounts[locName].maxWeight) {
      flashpointCounts[locName].maxWeight = weight;
    }

    if (elapsedMs <= WINDOW_12H_MS) {
      recentScore += finalItemScore;
      recentActivity += baseWeight;
      recent12hCount++;
    } else {
      priorScore += finalItemScore;
      priorActivity += baseWeight;
      prior12hCount++;
    }

    validItemsIn24h.push({ item, weight, finalItemScore, elapsedMs, isNorth, isKinetic, locName });
  }

  const incidentCount24h = recent12hCount + prior12hCount;
  const totalPoints24h = recentScore + priorScore;

  // Trend: Compare activity in last 12 hours vs prior 12 hours (12h-24h)
  const rawDelta = recentActivity - priorActivity;
  const delta24h = Math.round(rawDelta * 10) / 10;

  let trend = 'STABLE';
  if (delta24h > 0.1) {
    trend = 'RISING';
  } else if (delta24h < -0.1) {
    trend = 'FALLING';
  }

  // Base normalized computation
  let rawNormalized = BASELINE_SCORE + totalPoints24h;

  // Recalibration Ceiling Check:
  // Peaceful statements, countdown screens, or non-kinetic rhetoric alone cannot push score to CRITICAL (>=8.0)
  let isCeilingApplied = false;
  if (countKinetic === 0 && rawNormalized > NON_KINETIC_CEILING) {
    rawNormalized = NON_KINETIC_CEILING;
    isCeilingApplied = true;
  }

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

  // Active Flashpoints sorted by incident density & severity
  const flashpointHeat = Object.values(flashpointCounts)
    .sort((a, b) => (b.count * b.maxWeight) - (a.count * a.maxWeight))
    .map(f => ({
      name: f.name,
      count: f.count,
      isNorth: f.isNorth,
      severity: f.maxWeight >= 2.5 ? 'critical' : f.maxWeight >= 1.5 ? 'high' : 'medium'
    }));

  const activeFlashpoints = flashpointHeat.slice(0, 5).map(f => f.name);

  // Dynamic Primary Drivers Generation
  const primaryDrivers = [];

  if (countCritical > 0) {
    const critItems = validItemsIn24h.filter(v => v.weight === SEVERITY_WEIGHTS.critical);
    const topCrit = critItems[0]?.item?.title || `${countCritical} critical security events`;
    primaryDrivers.push(`${countCritical} CRITICAL event${countCritical > 1 ? 's' : ''} detected: "${topCrit.slice(0, 75)}${topCrit.length > 75 ? '...' : ''}"`);
  }

  if (countHigh > 0) {
    primaryDrivers.push(`Multiple HIGH severity alerts (${countHigh}) active in rolling window`);
  }

  if (countNorth > 0) {
    const northLocations = flashpointHeat.filter(f => f.isNorth).map(f => f.name);
    const locSummary = northLocations.length > 0 ? northLocations.slice(0, 3).join(', ') : 'Mitrovica / Checkpoints';
    primaryDrivers.push(`Flashpoint multiplier active (x1.4): ${locSummary}`);
  }

  if (isCeilingApplied) {
    primaryDrivers.push('Non-kinetic ceiling active: rhetoric capped at 6.5 until physical unrest is detected');
  } else if (countKinetic > 0) {
    primaryDrivers.push(`Kinetic / operational unrest confirmed (${countKinetic} field incidents)`);
  }

  // Hague Verdict or Major Political Context check
  const hagueArticles = validItemsIn24h.filter(v => /\b(hague|hag[aëu]|special\s*court|dhomat\s*e\s*specializuara|thaci|haradinaj|veseli)\b/i.test(`${v.item.title || ''} ${v.item.description || ''}`));
  if (hagueArticles.length > 0 && primaryDrivers.length < 4) {
    primaryDrivers.push(`Hague Verdict & public demonstrations referenced in ${hagueArticles.length} reports`);
  }

  // Fallback drivers if list is short
  if (primaryDrivers.length === 0) {
    if (score <= 3.4) {
      primaryDrivers.push('Routine localized reports with no active field mobilization');
      primaryDrivers.push('Border crossings operating under nominal transit protocols');
    } else {
      primaryDrivers.push(`${incidentCount24h} regional security and political events monitored in 24h window`);
    }
  }

  // Estimated Decay Time Calculation
  let decayTime = 'Score stable — continuous rolling window monitoring';
  if (oldestHighOrCriticalElapsedMs > 0) {
    const msUntilOldestDrops = Math.max(0, WINDOW_24H_MS - oldestHighOrCriticalElapsedMs);
    const hours = Math.floor(msUntilOldestDrops / (3600 * 1000));
    const mins = Math.floor((msUntilOldestDrops % (3600 * 1000)) / (60 * 1000));
    if (hours > 0 || mins > 0) {
      decayTime = `Initial step-down expected in ~${hours}h ${mins}m if no new critical incidents occur`;
    } else {
      decayTime = 'Decay cycle imminent (oldest critical event exiting 24h window)';
    }
  } else if (incidentCount24h > 0) {
    decayTime = 'Decay active: lower intensity events progressively rolling off within 12h';
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
    factors: {
      criticalEventsCount: countCritical,
      highEventsCount: countHigh,
      activeFlashpoints,
      primaryDrivers: primaryDrivers.slice(0, 4),
      flashpointHeat,
      decayTime,
      kineticEventsCount: countKinetic,
      isCeilingApplied
    },
    generatedAt: new Date(validRefTime).toISOString()
  };
}

/**
 * Async helper to compute regional tension from news items or fetch live 24h news if omitted
 */
async function getRegionalTension(items = null, referenceTime = Date.now()) {
  let newsItems = items;
  if (!newsItems || !Array.isArray(newsItems)) {
    try {
      const { fetchNews } = require('./skill');
      const newsData = await fetchNews({ location: 'Kosovo', timeline: '24h' });
      newsItems = (newsData && Array.isArray(newsData.items)) ? newsData.items : [];
    } catch (err) {
      console.error('[tension-index] Live news fetch failed, computing baseline tension:', err.message);
      newsItems = [];
    }
  }

  return calculateRegionalTension(newsItems, referenceTime);
}

module.exports = {
  calculateRegionalTension,
  isNorthKosovoOrCheckpoint,
  isKineticOrOperationalEvent,
  getRegionalTension,
  getAlertFingerprint,
  NORTH_KOSOVO_LOCATIONS_REGEX,
  PRIORITY_CHECKPOINT_REGEX
};
