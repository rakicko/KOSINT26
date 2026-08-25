'use strict';

const { normalizeMultilingualText } = require('./normalizer');

/**
 * Checks general Kosovo context in text
 */
function hasKosovoContext(signals, fullText = '') {
  if (signals.locations.length > 0 || signals.institutions.length > 0 || signals.people.length > 0 || signals.topics.length > 0) {
    return true;
  }
  const norm = normalizeMultilingualText(fullText).transliteratedText;
  return /\b(kosov|kosova|kosovo|prishtin|pristin|mitrovic|beograd|serb|shqiptar|balkan|kfor|eulex)\b/i.test(norm);
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

  // 2. Identify Event vs Commentary
  const isSpeech = signals.commentarySignals.length > 0;
  const hasDirectAction = signals.eventTypes.some(e => ['VIOLENCE', 'ENFORCEMENT', 'SEIZURE', 'DISCOVERY', 'EMERGENCY'].includes(e.actionType) && e.modality !== 'DENIED');
  const eventType = (isSpeech && !hasDirectAction) ? 'commentary' : 'event';

  // 3. Base Score & Severity from Canonical Event Types
  let baseScore = 3;
  let severity = 'low';
  let category = 'security';

  if (signals.eventTypes.length > 0) {
    // Find maximum severity among matched event types
    const maxEvent = signals.eventTypes.reduce((prev, curr) => {
      const pScore = prev ? prev.defaultScore : 0;
      return curr.defaultScore > pScore ? curr : prev;
    }, null);

    if (maxEvent) {
      baseScore = maxEvent.defaultScore;
      severity = maxEvent.baseSeverity;
    }
  } else if (signals.institutions.length > 0 || signals.people.length > 0) {
    baseScore = 4;
    severity = 'medium';
  } else {
    // No specific event, institution, or people matched -> low priority
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

  // 4. Category refinement
  const hasUnrest = signals.eventTypes.some(e => ['event:protest', 'event:clash'].includes(e.id));
  const hasEmergency = signals.eventTypes.some(e => ['event:fire', 'event:accident', 'event:explosion'].includes(e.id));

  if (hasUnrest && severity !== 'critical') {
    category = 'unrest';
  } else if (hasEmergency && severity !== 'critical') {
    category = 'emergency';
  }

  // Commentary score adjustment
  if (eventType === 'commentary') {
    baseScore = Math.max(2, baseScore - 1);
    if (severity === 'critical') severity = 'high';
    else if (severity === 'high') severity = 'medium';
    else if (severity === 'medium') severity = 'low';
  }

  // 5. North Kosovo Detection & Boost
  let isNorth = signals.locations.some(l => l.isNorth);
  // Check KEK / Obiliq exclusion override
  const isKek = signals.locations.some(l => l.id === 'loc:kek') || /\b(kek|obiliq|kastriot)\b/i.test(fullText);
  if (isKek) {
    isNorth = false;
  }

  let northBoost = 0;
  if (isNorth && (baseScore >= 4 || severity !== 'low')) {
    category = 'north_kosovo';
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

  // 7. Negation penalty (if primary event is denied, avoid artificial panic)
  let negationPenalty = 0;
  if (signals.negations.length > 0) {
    negationPenalty = 2;
  }

  const finalScore = Math.min(10, Math.max(1, baseScore + northBoost + timeBoost - negationPenalty));

  // Determine final severity category based on score
  if (finalScore >= 9 && (severity === 'critical' || isNorth || baseScore >= 8)) {
    severity = 'critical';
  } else if (finalScore >= 7) {
    severity = 'high';
  } else if (finalScore >= 4) {
    severity = 'medium';
  } else {
    severity = 'low';
  }

  // 8. Confidence Calculation
  let confidence = 0.50;
  if (isNorth) confidence += 0.15;
  if (signals.institutions.length > 0) confidence += 0.15;
  if (hasDirectAction) confidence += 0.10;
  if (signals.people.length > 0) confidence += 0.05;
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

  return {
    intensityScore: finalScore,
    severity,
    category,
    eventType,
    confidence,
    tags: Array.from(tags),
    isSecurityRelevant: severity !== 'low' && category !== 'other'
  };
}

module.exports = {
  hasKosovoContext,
  calculateSecurityScore
};
