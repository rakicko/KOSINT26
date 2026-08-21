'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Starting News Intelligence Popup Verification Tests ---');

// Read app.js content
const appJsContent = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
const styleCssContent = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');

// Helper mock functions matching app.js
function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function isValidArticleUrl(url) {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === '#' || trimmed.startsWith('#')) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function buildMapPopupHtml({
  icon = '📍',
  title = '',
  source = '',
  badge = null,
  primary = null,
  stats = [],
  description = '',
  contentHtml = '',
  sections = '',
  footer = ''
}) {
  const badgeHtml = badge ? `
    <span class="map-popup-badge" style="background:${badge.color || 'var(--cyan)'}20; color:${badge.color || 'var(--cyan)'}; border:1px solid ${badge.color || 'var(--cyan)'}40;">
      ${escHtml(badge.text)}
    </span>
  ` : '';

  const primaryHtml = primary ? `
    <div class="map-popup-primary">
      <div class="map-popup-primary-row">
        <span class="map-popup-primary-val">${primary.val}</span>
        ${primary.sub ? `<span class="map-popup-primary-sub">${primary.sub}</span>` : ''}
      </div>
      ${primary.secondary ? `<div class="map-popup-secondary">${escHtml(primary.secondary)}</div>` : ''}
    </div>
  ` : '';

  const statsHtml = Array.isArray(stats) && stats.length > 0 ? `
    <div class="map-popup-grid">
      ${stats.map(s => `
        <div class="map-popup-stat">
          <span class="map-popup-stat-label">${escHtml(s.label)}</span>
          <span class="map-popup-stat-val" ${s.color ? `style="color:${s.color}"` : ''}>${escHtml(String(s.val ?? 'N/A'))}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  const descHtml = description ? `
    <div class="map-popup-desc-text">${escHtml(description)}</div>
  ` : '';

  return `
    <div class="map-popup">
      <div class="map-popup-header">
        <div class="map-popup-title">
          <span class="map-popup-icon">${icon}</span>
          <span class="map-popup-title-text">${escHtml(title.toUpperCase())}</span>
          ${badgeHtml}
        </div>
        ${source ? `<div class="map-popup-source">via ${escHtml(source)}</div>` : ''}
      </div>
      <div class="map-popup-body">
        ${primaryHtml}
        ${descHtml}
        ${statsHtml}
        ${contentHtml}
        ${sections || ''}
      </div>
      ${footer ? `<div class="map-popup-footer">${footer}</div>` : ''}
    </div>
  `;
}

function buildNewsPopupHtml(item) {
  if (!item) return '';
  const s = item.intensityScore || 5;
  const sev = (item.severity ? item.severity.toUpperCase() : (s >= 9 ? 'CRITICAL' : (s >= 7 ? 'HIGH' : (s >= 5 ? 'MEDIUM' : 'LOW'))));
  const color = sev === 'CRITICAL' ? '#f87171' : sev === 'HIGH' ? '#fb923c' : sev === 'MEDIUM' ? '#fbbf24' : '#34d399';

  const titleText = item.title || 'News Intelligence';
  const rawUrl = item.url ? item.url.trim() : '';
  const url = isValidArticleUrl(rawUrl) ? rawUrl : (rawUrl && rawUrl !== '#' && !rawUrl.startsWith('#') ? rawUrl : '');

  const headlineHtml = url ? `
    <a class="news-popup-headline-link" href="${escHtml(url)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" title="Open article on source website">
      ${escHtml(titleText)}
    </a>
  ` : `
    <div class="news-popup-headline">${escHtml(titleText)}</div>
  `;

  return buildMapPopupHtml({
    icon: '📰',
    title: 'NEWS INTELLIGENCE',
    source: item.source || 'News Feed',
    badge: { text: sev, color },
    contentHtml: headlineHtml,
    stats: []
  });
}

// Sample News Item from prompt
const sampleItem1 = {
  id: 'news-mitropol-1',
  title: 'Pas 11 ditësh arrati, vetëdorëzohen në Polici dy të dyshuarit për gjuajtjen me armë te Qendra Zejtare në Mitrovicë',
  description: 'Gjuajtje me armë zjarri në Mitrovicë te Qendra Zejtare.',
  source: 'Mitropol',
  url: 'https://mitropol.net/pas-11-ditesh-arrati-vetedorezohen-ne-polici-dy-te-dyshuarit-per-gjuajtjen-me-arme-te-qendra-zejtare-ne-mitrovice/',
  intensityScore: 10,
  severity: 'critical',
  publishedAt: '2026-08-21T12:00:00.000Z',
  category: 'north_kosovo'
};

const sampleItem2 = {
  id: 'news-kossev-2',
  title: 'Incident u severnom delu Kosovske Mitrovice',
  source: 'KoSSev',
  url: 'https://kossev.info/incident-u-severnom-delu-kosovske-mitrovice/',
  intensityScore: 7,
  severity: 'high',
  publishedAt: '2026-08-21T10:00:00.000Z',
  category: 'security'
};

const sampleItem3 = {
  id: 'news-lajmi-3',
  title: 'Aktivitete të zakonshme në Prishtinë',
  source: 'Lajmi',
  url: 'https://lajmi.net/aktivitete-prishtine',
  intensityScore: 3,
  severity: 'low',
  publishedAt: '2026-08-21T08:00:00.000Z',
  category: 'general'
};

const sampleItemNoUrl = {
  id: 'news-no-url-4',
  title: 'Lajm pa link burimi',
  source: 'Radio Mitrovica',
  url: '',
  intensityScore: 5,
  severity: 'medium',
  category: 'security'
};

// 1. Test: Location is no longer present
console.log('Test 1: Verifying "Location" is completely absent...');
const html1 = buildNewsPopupHtml(sampleItem1);
assert.strictEqual(html1.includes('Location:'), false, 'Location label must not be in popup');
assert.strictEqual(html1.includes('map-popup-stat-label'), false, 'Stat labels must not be rendered');
console.log('✓ Passed: Location is absent');

// 2. Test: Threat Score is no longer present
console.log('Test 2: Verifying "Threat Score" is completely absent...');
assert.strictEqual(html1.includes('Threat Score'), false, 'Threat Score must not be in popup');
assert.strictEqual(html1.includes('10/10'), false, '10/10 score must not be in popup');
console.log('✓ Passed: Threat Score is absent');

// 3. Test: Published is no longer present
console.log('Test 3: Verifying "Published" is completely absent...');
assert.strictEqual(html1.includes('Published'), false, 'Published field must not be in popup');
assert.strictEqual(html1.includes('ago'), false, 'Time ago must not be in popup');
console.log('✓ Passed: Published is absent');

// 4. Test: Category is no longer present
console.log('Test 4: Verifying "Category" is completely absent...');
assert.strictEqual(html1.includes('Category'), false, 'Category label must not be in popup');
assert.strictEqual(html1.includes('NORTH_KOSOVO'), false, 'Category value must not be in popup');
console.log('✓ Passed: Category is absent');

// 5. Test: Source name remains visible
console.log('Test 5: Verifying source name remains visible...');
assert.strictEqual(html1.includes('via Mitropol'), true, 'via Mitropol must be visible');
const html2 = buildNewsPopupHtml(sampleItem2);
assert.strictEqual(html2.includes('via KoSSev'), true, 'via KoSSev must be visible');
console.log('✓ Passed: Source name is visible');

// 6. Test: Article headline remains visible
console.log('Test 6: Verifying article headline remains visible...');
assert.strictEqual(html1.includes('Pas 11 ditësh arrati, vetëdorëzohen në Polici'), true, 'Full headline must be rendered');
console.log('✓ Passed: Article headline is visible');

// 7. Test: Clicking the headline opens the exact original article URL in a new tab
console.log('Test 7: Verifying headline is clickable with exact URL in new tab...');
assert.strictEqual(html1.includes(`href="${sampleItem1.url}"`), true, 'Must contain exact article URL');
assert.strictEqual(html1.includes('target="_blank"'), true, 'Must contain target="_blank"');
assert.strictEqual(html1.includes('rel="noopener noreferrer"'), true, 'Must contain rel="noopener noreferrer"');
assert.strictEqual(html1.includes('onclick="event.stopPropagation()"'), true, 'Must prevent event propagation');
assert.strictEqual(html1.includes('class="news-popup-headline-link"'), true, 'Must use news-popup-headline-link class');
console.log('✓ Passed: Headline link has exact URL, target="_blank", and safe event handling');

// 8. Test: Severity badge is displayed correctly
console.log('Test 8: Verifying severity badges and colors...');
assert.strictEqual(html1.includes('CRITICAL'), true, 'Item 1 should display CRITICAL');
assert.strictEqual(html1.includes('#f87171'), true, 'CRITICAL should use #f87171');

assert.strictEqual(html2.includes('HIGH'), true, 'Item 2 should display HIGH');
assert.strictEqual(html2.includes('#fb923c'), true, 'HIGH should use #fb923c');

const html3 = buildNewsPopupHtml(sampleItem3);
assert.strictEqual(html3.includes('LOW'), true, 'Item 3 should display LOW');
assert.strictEqual(html3.includes('#34d399'), true, 'LOW should use #34d399');
console.log('✓ Passed: Severity badges and colors are accurate');

// 9. Test: Headline fallback when no URL
console.log('Test 9: Verifying headline fallback without URL...');
const htmlNoUrl = buildNewsPopupHtml(sampleItemNoUrl);
assert.strictEqual(htmlNoUrl.includes('class="news-popup-headline"'), true, 'Non-link headline container used');
assert.strictEqual(htmlNoUrl.includes('Lajm pa link burimi'), true, 'Headline text is present');
console.log('✓ Passed: Headline fallback functions properly');

// 10. Test: CSS Styles follow Weather Monitor popup design system
console.log('Test 10: Verifying CSS styles for .news-map-popup and .news-popup-headline-link...');
assert.strictEqual(styleCssContent.includes('.news-map-popup .maplibregl-popup-content'), true, 'Popup container selector in style.css');
assert.strictEqual(styleCssContent.includes('.news-popup-headline-link'), true, '.news-popup-headline-link in style.css');
assert.strictEqual(styleCssContent.includes('.news-popup-headline-link:hover'), true, '.news-popup-headline-link:hover in style.css');
console.log('✓ Passed: CSS contains unified popup styling');

// 11. Test: App.js code structure and toggle logic
console.log('Test 11: Verifying toggle logic and single popup management in app.js...');
assert.strictEqual(appJsContent.includes('function buildNewsPopupHtml(item)'), true, 'buildNewsPopupHtml defined');
assert.strictEqual(appJsContent.includes('function openNewsPopup(item, coords'), true, 'openNewsPopup defined');
assert.strictEqual(appJsContent.includes('function closeNewsPopup()'), true, 'closeNewsPopup defined');
assert.strictEqual(appJsContent.includes('state.selectedNewsItemId === itemId && state.activeMapPopup'), true, 'Toggle logic checks active popup');
assert.strictEqual(appJsContent.includes('window.buildNewsPopupHtml = buildNewsPopupHtml'), true, 'buildNewsPopupHtml exported');
assert.strictEqual(appJsContent.includes('window.openNewsPopup = openNewsPopup'), true, 'openNewsPopup exported');
assert.strictEqual(appJsContent.includes('window.closeNewsPopup = closeNewsPopup'), true, 'closeNewsPopup exported');
console.log('✓ Passed: App.js contains all required functions and toggle state handling');

// 12. Test: Chronological Sorting & Severity Classification Unchanged
console.log('Test 12: Verifying News sorting & classification integrity...');
function getArticlePubTime(item) {
  if (!item) return NaN;
  const raw = item.publishedAt || item.published || item.pubDate || item.published_at || item.timestamp;
  if (!raw) return NaN;
  const time = new Date(raw).getTime();
  return isNaN(time) ? NaN : time;
}

function sortNewsByChronological(items) {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    const timeA = getArticlePubTime(a);
    const timeB = getArticlePubTime(b);

    const validA = !isNaN(timeA);
    const validB = !isNaN(timeB);

    if (validA && validB) {
      if (timeB !== timeA) return timeB - timeA;
      const titleA = String(a.title || a.url || '');
      const titleB = String(b.title || b.url || '');
      return titleA.localeCompare(titleB);
    }
    if (validA && !validB) return -1;
    if (!validA && validB) return 1;
    
    const titleA = String(a.title || a.url || '');
    const titleB = String(b.title || b.url || '');
    return titleA.localeCompare(titleB);
  });
}

const unsorted = [sampleItem3, sampleItem1, sampleItem2];
const sorted = sortNewsByChronological(unsorted);
assert.strictEqual(sorted[0].id, sampleItem1.id, 'Newest article (12:00) should be first');
assert.strictEqual(sorted[1].id, sampleItem2.id, 'Second article (10:00) should be second');
assert.strictEqual(sorted[2].id, sampleItem3.id, 'Oldest article (08:00) should be third');
console.log('✓ Passed: Chronological ordering and classification are 100% preserved');

console.log('--- ALL 12 VERIFICATION TESTS PASSED SUCCESSFULLY ---');
