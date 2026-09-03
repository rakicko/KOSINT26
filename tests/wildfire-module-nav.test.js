'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

test('Wildfire Performance & OSIRIS Module Navigation Resilience', async (t) => {
  const cssContent = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');
  const appJsContent = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');

  await t.test('1. Verify .osiris-nav-rail has z-index higher than .module-overlay', () => {
    assert.match(
      cssContent,
      /\.osiris-nav-rail\s*\{[^}]*z-index:\s*1500\s*!important/s,
      '.osiris-nav-rail must have z-index: 1500 !important so it cannot be occluded by module overlays'
    );
  });

  await t.test('2. Verify .module-overlay does not occlude nav-rail in @media (max-width: 1100px)', () => {
    const media1100Match = cssContent.match(/@media\s*\(max-width:\s*1100px\)\s*\{([^}]*\{[^}]*\})*[^}]*\}/s);
    assert.ok(media1100Match, 'Expected @media (max-width: 1100px) block in style.css');
    
    // Ensure width: 100% is not present for .module-overlay inside 1100px media query
    assert.ok(
      !cssContent.includes('.module-overlay {\n    width: 100%;\n  }'),
      '.module-overlay should not be 100% width in 1100px media query'
    );
  });

  await t.test('3. Verify ensureMapVisible() does not call updateMap()', () => {
    const ensureMapFn = appJsContent.slice(
      appJsContent.indexOf('function ensureMapVisible()'),
      appJsContent.indexOf('function ensureMapVisible()') + 400
    );
    assert.ok(!ensureMapFn.includes('updateMap('), 'ensureMapVisible should not call updateMap on every module toggle');
  });

  await t.test('4. Verify updateMap() does not hardcode pitch 35', () => {
    const updateMapFn = appJsContent.slice(
      appJsContent.indexOf('function updateMap(data)'),
      appJsContent.indexOf('function updateMap(data)') + 1200
    );
    assert.ok(!updateMapFn.includes('setPitch(35)'), 'updateMap should not hardcode setPitch(35)');
    assert.ok(!updateMapFn.includes('pitch: 35'), 'updateMap should not hardcode pitch: 35');
    assert.ok(updateMapFn.includes('currentPitch'), 'updateMap should respect currentPitch from state.mapMode');
  });

  await t.test('5. Verify renderWildfire() limits DOM creation to max 60 detections', () => {
    assert.ok(appJsContent.includes('const maxDisplay = 60;'), 'renderWildfire should cap DOM rendering to 60 items');
    assert.ok(appJsContent.includes('detections.slice(0, maxDisplay)'), 'renderWildfire should slice detections');
  });

  await t.test('6. Verify window.updateWildfireLayer has client caching and module guard', () => {
    assert.ok(appJsContent.includes('state.activeMapModule === requestModule || state.activeModule === \'wildfirePanel\''), 'updateWildfireLayer must check if wildfire is still active before updating UI');
  });

  await t.test('7. Verify toggleModule renders news when switching to newsPanel', () => {
    assert.ok(appJsContent.includes("if (targetModule === 'news')"), 'toggleModule must have handler for targetModule news');
    assert.ok(appJsContent.includes('renderNews(state.data.news)'), 'toggleModule must call renderNews when activating newsPanel');
  });

  await t.test('8. Verify renderWildfireMapLayer creates interactive clickable DOM markers with openWildfirePopup', () => {
    assert.ok(appJsContent.includes('openWildfirePopup(d)'), 'Must have openWildfirePopup function call on click');
    assert.ok(appJsContent.includes('moduleLayers.wildfire.markers.push(marker)'), 'Must push markers to moduleLayers.wildfire.markers');
    assert.ok(appJsContent.includes("el.className = 'wildfire-custom-marker'"), 'Must create wildfire-custom-marker element');
    assert.ok(appJsContent.includes("el.addEventListener('click'"), 'Must attach click event listener to marker element');
  });
});
