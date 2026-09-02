'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function runOperationalZonesTest() {
  console.log('=== KOSINT-26 Operational Zones & Tactical Layers Test Suite ===\n');

  // 1. Data File Verification
  console.log('1. Verifying public/operational-zones.js exports...');
  const opZonesPath = path.join(__dirname, '../public/operational-zones.js');
  assert.ok(fs.existsSync(opZonesPath), 'operational-zones.js must exist');

  const zonesModule = await import('file:///' + opZonesPath.replace(/\\/g, '/'));
  const {
    ABL_GEOJSON,
    MUNICIPALITIES_NORTH_GEOJSON,
    MUNICIPALITIES_CENTROIDS_GEOJSON,
    KFOR_BASES_GEOJSON,
    SENSITIVE_CORRIDORS_GEOJSON
  } = zonesModule;

  // Verify ABL has dense, faithful boundary geometry
  assert.strictEqual(ABL_GEOJSON.type, 'FeatureCollection', 'ABL must be FeatureCollection');
  assert.ok(ABL_GEOJSON.features.length >= 1, 'ABL must have at least one feature');
  const ablCoords = ABL_GEOJSON.features[0].geometry.coordinates;
  assert.ok(ablCoords.length >= 40, `ABL must have detailed contour (found ${ablCoords.length} points)`);
  console.log(`✓ Passed: ABL LineString validated with ${ablCoords.length} topographic border waypoints.`);

  // Verify Municipalities: strictly 4 Northern Kosovo Municipalities
  assert.strictEqual(MUNICIPALITIES_NORTH_GEOJSON.type, 'FeatureCollection');
  const munIds = MUNICIPALITIES_NORTH_GEOJSON.features.map(f => f.properties.id);
  assert.strictEqual(munIds.length, 4, 'Must contain strictly 4 Northern Kosovo municipalities');
  assert.ok(munIds.includes('mun-leposavic'), 'Must include Leposavić');
  assert.ok(munIds.includes('mun-zvecan'), 'Must include Zvečan');
  assert.ok(munIds.includes('mun-zubin-potok'), 'Must include Zubin Potok');
  assert.ok(munIds.includes('mun-severna-mitrovica'), 'Must include Severna Mitrovica');
  assert.ok(!munIds.includes('mun-juzna-mitrovica'), 'Must NOT include Južna Mitrovica in Northern layer');
  console.log(`✓ Passed: Northern Kosovo Municipalities validated (4 distinct northern municipalities).`);

  // Verify Centroid Labels
  assert.strictEqual(MUNICIPALITIES_CENTROIDS_GEOJSON.type, 'FeatureCollection');
  assert.strictEqual(MUNICIPALITIES_CENTROIDS_GEOJSON.features.length, 4);
  console.log(`✓ Passed: Municipal centroid labels validated.`);

  // Verify KFOR Military Bases & Outpost Points
  assert.strictEqual(KFOR_BASES_GEOJSON.type, 'FeatureCollection');
  const kforIds = KFOR_BASES_GEOJSON.features.map(f => f.properties.id);
  assert.ok(kforIds.includes('kfor-camp-bondsteel'), 'Must include Camp Bondsteel');
  assert.ok(kforIds.includes('kfor-camp-film-city'), 'Must include Camp Film City');
  assert.ok(kforIds.includes('kfor-camp-nothing-hill'), 'Must include Camp Nothing Hill (Leposavić)');
  assert.ok(kforIds.includes('kfor-msu-ibar-bridge'), 'Must include KFOR MSU Main Ibar Bridge post');
  assert.ok(kforIds.length >= 8, `Must contain at least 8 KFOR bases/outposts (found ${kforIds.length})`);
  console.log(`✓ Passed: KFOR Tactical Bases validated (${kforIds.length} bases & outposts with full telemetry).`);

  // Verify Corridors & Bridges
  assert.strictEqual(SENSITIVE_CORRIDORS_GEOJSON.type, 'FeatureCollection');
  const corridorIds = SENSITIVE_CORRIDORS_GEOJSON.features.map(f => f.properties.id);
  assert.ok(corridorIds.includes('bridge-main-ibar'), 'Must include Main Ibar Bridge');
  assert.ok(corridorIds.includes('bridge-bosnjacka'), 'Must include Bošnjačka Bridge');
  assert.ok(corridorIds.includes('spz-banjska'), 'Must include SPZ Banjska');
  console.log(`✓ Passed: Sensitive transition points & corridors validated (${corridorIds.length} features).\n`);

  // 2. HTML Controls Verification
  console.log('2. Verifying public/index.html UI elements...');
  const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  assert.ok(indexHtml.includes('id="tacticalLayersWidget"'), 'index.html must have tacticalLayersWidget');
  assert.ok(indexHtml.includes('id="btnTacticalLayersToggle"'), 'index.html must have btnTacticalLayersToggle');
  assert.ok(indexHtml.includes('id="tacticalLayersMenu"'), 'index.html must have tacticalLayersMenu');
  assert.ok(indexHtml.includes('id="toggleLayerAbl"'), 'index.html must have toggleLayerAbl');
  assert.ok(indexHtml.includes('id="toggleLayerMunicipalities"'), 'index.html must have toggleLayerMunicipalities');
  assert.ok(indexHtml.includes('id="toggleLayerKfor"'), 'index.html must have toggleLayerKfor');
  assert.ok(indexHtml.includes('id="toggleLayerCorridors"'), 'index.html must have toggleLayerCorridors');
  console.log('✓ Passed: All tactical layer toggle controls present in index.html.\n');

  // 3. Client Logic & Window Exports Verification
  console.log('3. Verifying public/app.js integration...');
  const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
  assert.ok(appJs.includes('initTacticalLayers'), 'app.js must call initTacticalLayers');
  assert.ok(appJs.includes('renderTacticalKforBases'), 'app.js must define renderTacticalKforBases');
  assert.ok(appJs.includes('renderTacticalMunLabels'), 'app.js must define renderTacticalMunLabels');
  assert.ok(appJs.includes('function toggleTacticalLayer'), 'app.js must define toggleTacticalLayer');
  assert.ok(appJs.includes('function toggleTacticalLayersMenu'), 'app.js must define toggleTacticalLayersMenu');
  assert.ok(appJs.includes('window.toggleTacticalLayer = toggleTacticalLayer'), 'app.js must export toggleTacticalLayer');
  assert.ok(appJs.includes('window.toggleTacticalLayersMenu = toggleTacticalLayersMenu'), 'app.js must export toggleTacticalLayersMenu');
  console.log('✓ Passed: App.js properly hooks and exports tactical layer functions.\n');

  // 4. CSS Verification
  console.log('4. Verifying public/style.css tactical styles...');
  const styleCss = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');
  assert.ok(styleCss.includes('.tactical-layers-widget'), 'style.css must have .tactical-layers-widget');
  assert.ok(styleCss.includes('.tactical-layers-btn'), 'style.css must have .tactical-layers-btn');
  assert.ok(styleCss.includes('.kfor-marker-pin'), 'style.css must have .kfor-marker-pin');
  assert.ok(styleCss.includes('.mun-tactical-label'), 'style.css must have .mun-tactical-label');
  assert.ok(styleCss.includes('.tactical-layer-popup'), 'style.css must have .tactical-layer-popup');
  console.log('✓ Passed: Style.css has tactical styling.\n');

  console.log('=== ALL OPERATIONAL ZONES TESTS PASSED SUCCESSFULLY ===');
}

runOperationalZonesTest().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
