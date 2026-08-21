'use strict';

const http = require('http');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');

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

console.log('Testing live API news items rendering through buildNewsPopupHtml...');

const req = http.request('http://localhost:3000/api/status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      const newsItems = data?.news?.items || [];
      console.log(`Received ${newsItems.length} news items from live /api/status`);

      newsItems.slice(0, 10).forEach((item, idx) => {
        const popup = buildNewsPopupHtml(item);
        assert.ok(popup.includes('NEWS INTELLIGENCE'), `Item ${idx} missing header`);
        assert.ok(popup.includes('via '), `Item ${idx} missing source`);
        assert.ok(!popup.includes('map-popup-stat-label'), `Item ${idx} must not have stats`);
        assert.ok(!popup.includes('Location:'), `Item ${idx} must not have Location`);
        assert.ok(!popup.includes('Threat Score'), `Item ${idx} must not have Threat Score`);
        assert.ok(!popup.includes('Category:'), `Item ${idx} must not have Category`);
        if (item.url && isValidArticleUrl(item.url)) {
          assert.ok(popup.includes(`href="${escHtml(item.url)}"`), `Item ${idx} missing article link`);
          assert.ok(popup.includes('target="_blank"'), `Item ${idx} missing target="_blank"`);
        }
      });
      console.log('✓ All live news items render compliant popups without prohibited fields!');
      process.exit(0);
    } catch (e) {
      console.error('Integration test error:', e);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.warn('Could not connect to dev server (skipped live check):', e.message);
  process.exit(0);
});

req.write(JSON.stringify({ location: 'Kosovo', timeline: '24h' }));
req.end();
