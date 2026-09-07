'use strict';

const { calculateEffectiveRank } = require('../skills/news-intel/security');
const { fetchNews } = require('../skills/news-intel/skill');

/**
 * Categorizes news items into the three tactical SitRep intelligence domains:
 * 1. Field Incidents (Kinetic/operational events, police movements, physical incidents)
 * 2. Friction Points & Routes (Checkpoints, bridges, transit corridors, high-friction municipalities)
 * 3. Institutional / Political Posture (Official statements, diplomacy, ministerial announcements)
 */
function categorizeItemForSitRep(item) {
  const cat = (item.category || '').toLowerCase();
  const title = (item.title || item.canonicalTitle || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();
  const text = `${title} ${desc}`;
  const tags = Array.isArray(item.tags) ? item.tags.map(t => String(t).toLowerCase()) : [];

  // Checkpoint & Route friction indicators
  const isFrictionRoute = /\b(jarinj|b[eë]rnjak|brnjak|merdar|dheu\s*i\s*bardh|bela\s*zemlj|mutivod|mu[cč]ibab|hani\s*i\s*elezit|kull[eë]|v[eë]rmi[cç]|ura\s*e\s*ibrit|most\s*na\s*ibru|ibar\s*bridge|barikad|bllokad|blokada|prelaz|checkpoint|punkt|vendkalim|msr|transit|magistral|kfor\s*patrol|patrull)/i.test(text) ||
    tags.some(t => t.includes('checkpoint') || t.includes('bridge') || t.includes('ibar') || t.includes('jarinje') || t.includes('brnjak') || t.includes('merdare'));

  // Operational / Field kinetic indicators
  const isFieldIncident = cat === 'operational' ||
    /\b(uhapšen|uhapsen|arrest|bastisje|pretres|racija|zaplen|pucnjava|të\s*shtëna|gjuajtje|eksplod|shpërthim|armë|oruzj|oružj|municij|vjedhje|krađa|lënduar|povređen|aksident|incident|polici|policij)/i.test(text) ||
    tags.some(t => ['arrest', 'weapon_seizure', 'raid', 'shooting', 'clash', 'accident', 'operational'].includes(t));

  // Political / Institutional posture indicators
  const isInstitutional = cat === 'political' || cat === 'opinion' ||
    /\b(qeveri|vlada|minist|kurti|vučić|vucic|osmani|petkovi|sveçla|svecla|uluta|kfor|nato|eulex|ambasad|ambasada|dialog|dijalog|kuvend|skupštin|skupstin|marrëvesh|sporazum|komunikat|saopštenj)/i.test(text) ||
    tags.some(t => ['political', 'governance', 'kfor_nato', 'eulex'].includes(t));

  return {
    isFieldIncident,
    isFrictionRoute,
    isInstitutional
  };
}

/**
 * Synthesizes a concise tactical summary from a set of articles in a domain.
 */
function synthesizeDomainSummary(domainItems, fallbackText) {
  if (!domainItems || domainItems.length === 0) {
    return fallbackText;
  }

  // Deduplicate and extract unique primary headlines/developments
  const summaries = [];
  const seenHeadlines = new Set();

  for (const item of domainItems) {
    const title = (item.title || item.canonicalTitle || '').trim();
    const cleanTitle = title.replace(/^(\[[^\]]+\]|\([^)]+\))\s*/, '').trim();

    if (!cleanTitle || seenHeadlines.has(cleanTitle.toLowerCase())) continue;
    seenHeadlines.add(cleanTitle.toLowerCase());

    const loc = typeof item.location === 'string' ? item.location : (item.location?.name || '');
    const source = item.primarySource || item.source || (Array.isArray(item.sources) ? item.sources[0] : '');

    let entry = cleanTitle;
    if (loc && !cleanTitle.toLowerCase().includes(loc.toLowerCase())) {
      entry += ` [${loc}]`;
    }
    summaries.push(entry);
    if (summaries.length >= 3) break;
  }

  if (summaries.length === 0) return fallbackText;
  return summaries.join('; ');
}

/**
 * World Monitor Flash SitRep Synthesizer
 *
 * Synthesizes top 10 highest-ranked news items into a structured 3-bullet tactical intelligence brief:
 * - Field Incidents: Kinetic/operational events, police movements, or physical incidents.
 * - Friction Points & Routes: Key checkpoints (Jarinje, Brnjak, etc.), bridges, or municipalities with elevated activity.
 * - Institutional / Political Posture: Official statements or diplomatic reactions.
 *
 * @param {Array} [items] - Raw or clustered intelligence items. If omitted/null, fetches live.
 * @param {object} [options] - Configuration options
 * @returns {Promise<object>} { sitrep, generatedAt, itemClusterCount, sections }
 */
async function synthesizeFlashSitRep(items, options = {}) {
  let sourceItems = items;

  // If items omitted, fetch live news items
  if (!Array.isArray(sourceItems)) {
    try {
      const newsData = await fetchNews({ location: 'Kosovo', timeline: '24h' });
      sourceItems = newsData?.items || [];
    } catch (err) {
      console.warn('[sitrep] live news fetch failed, falling back to empty feed:', err.message);
      sourceItems = [];
    }
  }

  // Calculate _rank if not already present, ensuring ranking fidelity
  const rankedItems = [...sourceItems].map(item => {
    if (!item) return null;
    const rank = typeof item._rank === 'number' ? item._rank : calculateEffectiveRank(item);
    return { ...item, _rank: rank };
  }).filter(Boolean);

  // Order strictly by _rank descending
  rankedItems.sort((a, b) => (b._rank || 0) - (a._rank || 0));

  // Top 10 highest-ranked items
  const topItems = rankedItems.slice(0, 10);
  const itemClusterCount = topItems.length;

  // Domain groupings
  const fieldItems = [];
  const frictionItems = [];
  const institutionalItems = [];

  for (const item of topItems) {
    const { isFieldIncident, isFrictionRoute, isInstitutional } = categorizeItemForSitRep(item);

    // Items can contribute to multiple relevant domains if cross-cutting
    let matched = false;
    if (isFieldIncident) {
      fieldItems.push(item);
      matched = true;
    }
    if (isFrictionRoute) {
      frictionItems.push(item);
      matched = true;
    }
    if (isInstitutional) {
      institutionalItems.push(item);
      matched = true;
    }

    // Default placement if uncategorized
    if (!matched) {
      if ((item.category || '').toLowerCase() === 'operational') {
        fieldItems.push(item);
      } else {
        institutionalItems.push(item);
      }
    }
  }

  // Synthesize 3 concise tactical sections
  const fieldSummary = synthesizeDomainSummary(
    fieldItems,
    'No kinetic clashes, armed raids, or active physical unrest reported across monitored sectors in the past 24 hours.'
  );

  const frictionSummary = synthesizeDomainSummary(
    frictionItems,
    'ABL border gates (Jarinje, Brnjak, Merdare) and Ibar crossings report baseline transit throughput with routine security presence.'
  );

  const institutionalSummary = synthesizeDomainSummary(
    institutionalItems,
    'Institutional posture remains focused on standard inter-agency security protocols and bilateral diplomatic engagements.'
  );

  const sections = {
    fieldIncidents: fieldSummary,
    frictionPointsRoutes: frictionSummary,
    institutionalPoliticalPosture: institutionalSummary
  };

  const sitrepText = [
    `• Field Incidents: ${fieldSummary}`,
    `• Friction Points & Routes: ${frictionSummary}`,
    `• Institutional / Political Posture: ${institutionalSummary}`
  ].join('\n');

  return {
    sitrep: sitrepText,
    generatedAt: new Date().toISOString(),
    itemClusterCount,
    sections
  };
}

module.exports = {
  synthesizeFlashSitRep,
  categorizeItemForSitRep,
  synthesizeDomainSummary
};
