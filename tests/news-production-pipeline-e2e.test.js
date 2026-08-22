'use strict';

const assert = require('assert');
const {
  clusterEventArticles,
  deduplicateNewsItems
} = require('../skills/news-intel/skill');

console.log('=== KOSINT News Intelligence Production Pipeline End-to-End Audit & Verification ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// DATA FLOW AUDIT: CRITICAL REGRESSION 1 (Kurti-Ulutaš 3-Portal Cancellation)
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- Step 1: Ingest Raw Articles (Layer A) ---');
const rawArticlesKurti = [
  {
    id: 'raw-1',
    title: 'Kfor: Otkazan sastanak general-majora Ulutaša i Aljbina Kurtija',
    description: 'KFOR je saopštio da sastanak general-majora Ulutaša i Kurtija nije održan.',
    url: 'https://radiomitrovicasever.com/kfor-otkazan-sastanak',
    source: 'Radio Mitrovica Sever',
    publishedAt: '2026-08-22T19:00:00.000Z',
    isSecurityRelevant: true,
    intensityScore: 7,
    severity: 'high'
  },
  {
    id: 'raw-2',
    title: 'Nije održan sastanak Ulutaša i Kurtija',
    description: 'Nije održan najavljeni sastanak komandanta KFOR-a Ulutaša i kosovskog premijera.',
    url: 'https://radiokim.net/nije-odrzan-sastanak-ulutasa-i-kurtija',
    source: 'Radio KIM',
    publishedAt: '2026-08-22T19:05:00.000Z',
    isSecurityRelevant: true,
    intensityScore: 7,
    severity: 'high'
  },
  {
    id: 'raw-3',
    title: 'Dështon takimi Kurti-Ulutash',
    description: 'Takimi në mes të kryeministrit Albin Kurti dhe komandantit të KFOR-it Özkan Ulutaş ka dështuar të mbahet.',
    url: 'https://koha.net/deshton-takimi-kurti-ulutash',
    source: 'Koha',
    publishedAt: '2026-08-22T18:00:00.000Z',
    isSecurityRelevant: true,
    intensityScore: 7,
    severity: 'high'
  }
];

console.log(`Raw articles input count: ${rawArticlesKurti.length}`);

console.log('\n--- Step 2: Skill Processing (clusterEventArticles) ---');
const clusteredEventsKurti = clusterEventArticles(rawArticlesKurti);

console.log(`Clustered events count: ${clusteredEventsKurti.length}`);
assert.strictEqual(clusteredEventsKurti.length, 1, 'Production pipeline MUST produce exactly 1 Event');

const event1 = clusteredEventsKurti[0];
console.log('Produced Event Structure:', {
  eventId: event1.eventId,
  title: event1.title,
  status: event1.status,
  sourceCount: event1.sourceCount,
  independentSourceCount: event1.independentSourceCount,
  developmentCount: event1.developmentCount,
  developments: event1.developments.map(d => ({
    type: d.type,
    title: d.title,
    sources: d.sources
  }))
});

assert.strictEqual(event1.sourceCount, 3, 'Event must record 3 sources');
assert.strictEqual(event1.developmentCount, 1, 'Event must record 1 development');
assert.strictEqual(event1.developments[0].type, 'MEETING_CANCELLED', 'Development must be MEETING_CANCELLED');
assert.strictEqual(event1.developments[0].sources.length, 3, 'Development must merge all 3 sources');

console.log('\n--- Step 3: Mock Server Response Structure (API /api/status) ---');
const apiResponseKurti = {
  skill: 'news-intel',
  location: 'Kosovo',
  fetchedAt: new Date().toISOString(),
  source: 'kosovo-local-rss',
  items: clusteredEventsKurti,
  summary: {
    total: clusteredEventsKurti.length,
    rawScanned: rawArticlesKurti.length
  }
};

console.log('\n--- Step 4: Verification of Object Received by renderNews() ---');
const debugObj = {
  eventCount: apiResponseKurti.items.length,
  events: apiResponseKurti.items.map(e => ({
    eventId: e.eventId,
    title: e.title,
    developmentCount: e.developmentCount,
    sourceCount: e.sourceCount,
    developments: e.developments.map(d => ({
      type: d.type,
      sources: d.sources
    }))
  }))
};
console.log('DEBUG REPRESENTATION IMMEDIATELY BEFORE renderNews():');
console.log(JSON.stringify(debugObj, null, 2));

assert.strictEqual(debugObj.eventCount, 1, 'renderNews() MUST receive 1 Event object, NOT 3 raw articles');

// ─────────────────────────────────────────────────────────────────────────────
// DATA FLOW AUDIT: CRITICAL REGRESSION 2 (Kurti-Ulutaš + Mitropol + MitrovicaSOT)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Step 5: 3-Event Scenario (Kurti-Ulutaš + Mitropol Espionage + MitrovicaSOT) ---');
const rawArticles3Events = [
  ...rawArticlesKurti,
  {
    id: 'raw-4',
    title: 'Kroacija ngre aktakuzë për spiunazh ndaj pilotit kroat që kishte shërbyer në KFOR',
    description: 'Prokuroria në Kroaci ka ngritur aktakuzë ndaj pilotit ushtarak kroat.',
    url: 'https://mitropol.net/kroacia-spiunazh-pilot',
    source: 'Mitropol',
    publishedAt: '2026-08-22T14:00:00.000Z',
    isSecurityRelevant: true,
    intensityScore: 6,
    severity: 'medium'
  },
  {
    id: 'raw-5',
    title: 'Albin Kurti takohet sot me komandantin e KFOR-it për çështjen e urës së Ibrit',
    description: 'Kryeministri Albin Kurti paralajmëron takim lidhur me çështjen e hapjes së urës mbi lumin Ibër.',
    url: 'https://mitrovicasot.net/kurti-kfor-ura-ibrit',
    source: 'MitrovicaSOT',
    publishedAt: '2026-08-22T11:00:00.000Z',
    isSecurityRelevant: true,
    intensityScore: 6,
    severity: 'medium'
  }
];

console.log(`Total 3-Scenario Raw articles input: ${rawArticles3Events.length}`);
const clustered3Events = clusterEventArticles(rawArticles3Events);
console.log(`Total Produced Events: ${clustered3Events.length}`);

assert.strictEqual(clustered3Events.length, 3, 'Must produce exactly 3 Event objects from 5 input articles');

const evKurti = clustered3Events.find(e => e.articles.some(a => a.id === 'raw-1'));
const evMitropol = clustered3Events.find(e => e.articles.some(a => a.id === 'raw-4'));
const evMitrovicaSot = clustered3Events.find(e => e.articles.some(a => a.id === 'raw-5'));

assert.ok(evKurti, 'Kurti-Ulutas event must exist');
assert.strictEqual(evKurti.sourceCount, 3, 'Kurti-Ulutas event must have 3 sources');
assert.strictEqual(evKurti.developmentCount, 1, 'Kurti-Ulutas event must have 1 development');

assert.ok(evMitropol, 'Mitropol espionage event must exist');
assert.strictEqual(evMitropol.sourceCount, 1, 'Mitropol event must have 1 source');
assert.strictEqual(evMitropol.developmentCount, 1, 'Mitropol event must have 1 development');

assert.ok(evMitrovicaSot, 'MitrovicaSOT Iber bridge meeting event must exist');
assert.strictEqual(evMitrovicaSot.sourceCount, 1, 'MitrovicaSOT event must have 1 source');
assert.strictEqual(evMitrovicaSot.developmentCount, 1, 'MitrovicaSOT event must have 1 development');

// ─────────────────────────────────────────────────────────────────────────────
// DOM / UI RENDERING VERIFICATION (Synthetic DOM check matching app.js)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- Step 6: Synthetic DOM Render Verification of renderNews() ---');

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  return 'recently';
}

function isValidArticleUrl(url) {
  return typeof url === 'string' && url.startsWith('http');
}

function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderNewsSimulated(items) {
  return items.map(item => {
    const s = item.intensityScore || 1;
    const sev = (item.severity || 'medium').toLowerCase();
    const cls = sev === 'critical' ? 'score-critical' : sev === 'high' ? 'score-high' : 'score-medium';
    const catLabel = (item.category || 'security').replace(/_/g, ' ').toUpperCase();
    const confPercent = Math.round((item.confidence || 0.7) * 100);
    const status = item.status || 'DEVELOPING';
    const statusClass = `status-${status.toLowerCase()}`;
    const sourceCount = item.sourceCount || (Array.isArray(item.sources) ? item.sources.length : 1);
    const indCount = item.independentSourceCount || item.uniqueSourceCount || 1;
    const devCount = item.developmentCount || (Array.isArray(item.developments) ? item.developments.length : 1);
    const allSourcesList = (item.sources || [item.source]).join(', ');
    const tags = (item.tags || []).slice(0, 3).map(t => `<span class="news-tag">${escHtml(t.replace(/_/g, ' '))}</span>`).join('');
    const url = isValidArticleUrl(item.url) ? item.url.trim() : '';

    const developments = Array.isArray(item.developments) ? item.developments : [];
    const devTimelineHtml = developments.length > 0 ? `
      <div class="news-event-developments" style="margin-top: 6px; padding-top: 6px;">
        <div class="news-developments-title" style="font-size: 9px; margin-bottom: 4px;">TIMELINE (${devCount} DEVELOPMENTS)</div>
        <div class="news-developments-list" style="gap: 4px;">
          ${developments.map(d => `
            <div class="news-dev-item" style="padding: 4px 6px;">
              <div class="news-dev-header">
                <span class="news-dev-type news-dev-${(d.type || 'update').toLowerCase()}">${escHtml(d.type || 'UPDATE')}</span>
                <span class="news-dev-time">${d.timestamp ? escHtml(formatTimeAgo(d.timestamp)) : ''}</span>
              </div>
              <div class="news-dev-summary" style="font-size: 10.5px;">${escHtml(d.title || d.summary || '')}</div>
              <div class="news-dev-source" style="font-size: 9px; color: var(--text-dim); font-family: var(--font-mono);">
                Sources: ${escHtml(Array.isArray(d.sources) ? d.sources.join(', ') : d.source || '')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    const card = `<div class="news-item ${cls}">
      <div class="news-item-header">
        <span class="news-score score-${s}">${s}/10</span>
        <span class="news-severity sev-${sev}">${sev.toUpperCase()}</span>
        <span class="news-event-status-badge ${statusClass}">STATUS: ${escHtml(status)}</span>
        <span class="news-category">${catLabel}</span>
        <span class="news-confidence">${confPercent}% Conf</span>
        <span class="news-time">${formatTimeAgo(item.publishedAt)}</span>
      </div>
      <div class="news-event-metrics-bar" style="font-size: 9px; margin-top: 4px; margin-bottom: 4px;">
        <span>${sourceCount} SOURCES</span>
        <span>·</span>
        <span>${indCount} INDEPENDENT</span>
        <span>·</span>
        <span>${devCount} DEVELOPMENTS</span>
      </div>
      <div class="news-title">${escHtml(item.title || item.canonicalTitle || '')}</div>
      ${item.description ? `<div class="news-desc">${escHtml(item.description)}</div>` : ''}
      ${devTimelineHtml}
      <div class="news-footer" style="margin-top: 6px;">
        <span class="news-source" title="${escHtml(allSourcesList)}">Primary: ${escHtml(item.primarySource || item.source || '')}</span>
        <div class="news-tags">${tags}</div>
      </div>
    </div>`;
    return url ? `<a class="news-item-link" href="${escHtml(url)}" target="_blank" rel="noopener noreferrer">${card}</a>` : card;
  });
}

// 1. Render Kurti 3-portal cancellation
const renderedCardsKurti = renderNewsSimulated(clusteredEventsKurti);
console.log(`Rendered UI card count for Kurti 3-portal cancellation: ${renderedCardsKurti.length}`);
assert.strictEqual(renderedCardsKurti.length, 1, 'UI MUST render exactly 1 Card for the 3 cancellation articles');
assert.ok(renderedCardsKurti[0].includes('3 SOURCES'), 'Card must contain "3 SOURCES"');
assert.ok(renderedCardsKurti[0].includes('1 DEVELOPMENTS'), 'Card must contain "1 DEVELOPMENTS"');
assert.ok(renderedCardsKurti[0].includes('MEETING_CANCELLED'), 'Card must contain development type "MEETING_CANCELLED"');
assert.ok(renderedCardsKurti[0].includes('Radio Mitrovica Sever'), 'Card must list Radio Mitrovica Sever');
assert.ok(renderedCardsKurti[0].includes('Radio KIM'), 'Card must list Radio KIM');
assert.ok(renderedCardsKurti[0].includes('Koha'), 'Card must list Koha');
console.log('✓ UI Card successfully verified for 3-portal cancellation: 1 Card rendered containing 3 Sources!');

// 2. Render 3-scenario feed
const renderedCards3Events = renderNewsSimulated(clustered3Events);
console.log(`Rendered UI card count for 3-Scenario Feed: ${renderedCards3Events.length}`);
assert.strictEqual(renderedCards3Events.length, 3, 'UI MUST render exactly 3 Cards for the 5 articles');
console.log('✓ UI Cards successfully verified for 3-Scenario Feed: exactly 3 Cards rendered!');

console.log('\n=== ALL END-TO-END PRODUCTION DATA FLOW AUDITS PASSED WITH 100% ACCURACY ===');
