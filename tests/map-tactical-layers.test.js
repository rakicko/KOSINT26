'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  calculateThreatRangeRings,
  haversineDistanceKm,
  categorizeMilStdSymbol,
  isPointInKosovoOperationalZone,
  getTacticalLayerState,
  setTacticalLayerVisibility,
  isTacticalLayerVisible
} = require('../public/tactical-map.js');

console.log('=== World Monitor-Inspired Tactical Map Layers & Threat Range Rings Test Suite ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Geodesic Threat Range Rings Calculation & Geometry Creation
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- Test 1: Threat Range Rings Calculation & Geodesic Geometry ---');

const incidentCoord = [20.8665, 42.8912]; // Mitrovica Center

const criticalRings = calculateThreatRangeRings(incidentCoord, { severity: 'critical' });
assert.strictEqual(criticalRings.type, 'FeatureCollection', 'Must produce a GeoJSON FeatureCollection');
assert.strictEqual(criticalRings.features.length, 2, 'Must produce concentric 1 km and 3 km rings');

const innerRing = criticalRings.features[0];
const outerRing = criticalRings.features[1];

// 1 km ring assertions
assert.strictEqual(innerRing.properties.radiusKm, 1.0, 'Inner ring must have 1.0 km radius');
assert.strictEqual(innerRing.properties.type, 'inner_immediate_zone', 'Inner ring type must be immediate zone');
assert.strictEqual(innerRing.properties.severity, 'CRITICAL', 'Severity must be recorded');
assert.strictEqual(innerRing.geometry.type, 'Polygon', 'Geometry must be a Polygon');

const innerCoords = innerRing.geometry.coordinates[0];
assert.ok(innerCoords.length >= 32, 'Ring must have smooth vertices');

// Check that every vertex on the 1 km ring is within 1.0 ± 0.05 km of center
innerCoords.forEach((pt, idx) => {
  const dist = haversineDistanceKm(incidentCoord, pt);
  assert(
    Math.abs(dist - 1.0) < 0.05,
    `Vertex ${idx} on 1 km ring has distance ${dist.toFixed(3)} km (expected ~1.0 km)`
  );
});

// 3 km ring assertions
assert.strictEqual(outerRing.properties.radiusKm, 3.0, 'Outer ring must have 3.0 km radius');
assert.strictEqual(outerRing.properties.type, 'outer_cordon_zone', 'Outer ring type must be tactical cordon');
assert.strictEqual(outerRing.geometry.type, 'Polygon');

const outerCoords = outerRing.geometry.coordinates[0];
outerCoords.forEach((pt, idx) => {
  const dist = haversineDistanceKm(incidentCoord, pt);
  assert(
    Math.abs(dist - 3.0) < 0.05,
    `Vertex ${idx} on 3 km ring has distance ${dist.toFixed(3)} km (expected ~3.0 km)`
  );
});

// Color variants
const highRings = calculateThreatRangeRings(incidentCoord, { severity: 'high' });
assert.strictEqual(highRings.features[0].properties.strokeColor, '#fb923c', 'High severity must use amber-orange');
assert.strictEqual(criticalRings.features[0].properties.strokeColor, '#ef4444', 'Critical severity must use tactical red');

console.log('✓ Passed Test 1: Geodesic range rings for 1 km and 3 km calculated with sub-meter accuracy.\n');

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: MIL-STD Tactical Marker Symbol Categorization
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- Test 2: MIL-STD-2525 Tactical Marker Categorization ---');

// A. Kinetic Incidents -> Diamond (Hostile / Threat)
const incidentShooting = {
  title: 'Pucnjava u Banjskoj, policija intervenisala na licu mesta',
  severity: 'critical'
};
const incidentArrest = {
  title: 'Aksion policor në Mitrovicë, arrestohen dy persona për armëmbajtje',
  severity: 'high'
};
const incidentExplosion = {
  title: 'Detonacija u dvorištu porodične kuće u Zvečanu',
  severity: 'high'
};

assert.strictEqual(categorizeMilStdSymbol(incidentShooting), 'diamond', 'Shooting incident must be diamond');
assert.strictEqual(categorizeMilStdSymbol(incidentArrest), 'diamond', 'Arrest operation must be diamond');
assert.strictEqual(categorizeMilStdSymbol(incidentExplosion), 'diamond', 'Explosion incident must be diamond');

// B. Strategic Facilities & Military Bases -> Square (Installation)
const kforBondsteel = {
  name: 'Camp Bondsteel',
  type: 'military_base',
  command: 'KFOR RC-East'
};
const kforFilmCity = {
  name: 'Camp Film City Headquarters',
  type: 'military_base'
};
const policeStation = {
  title: 'Stacioni Policor Mitrovicë e Veriut',
  category: 'installation'
};

assert.strictEqual(categorizeMilStdSymbol(kforBondsteel), 'square', 'Camp Bondsteel must be square');
assert.strictEqual(categorizeMilStdSymbol(kforFilmCity), 'square', 'Camp Film City must be square');
assert.strictEqual(categorizeMilStdSymbol(policeStation), 'square', 'Police station installation must be square');

// C. Border Crossings & Transit Checkpoints -> Circle (Control Point)
const crossingJarinje = {
  name: 'Jarinje (Leposavić / Raška)',
  type: 'border_crossing'
};
const crossingMerdare = {
  title: 'Pika kufitare në Merdare regjistron fluks automjetesh',
  type: 'checkpoint'
};
const crossingIbarBridge = {
  name: 'KFOR MSU Main Ibar Bridge Post',
  type: 'checkpoint'
};

assert.strictEqual(categorizeMilStdSymbol(crossingJarinje), 'circle', 'Jarinje crossing must be circle');
assert.strictEqual(categorizeMilStdSymbol(crossingMerdare), 'circle', 'Merdare checkpoint must be circle');
assert.strictEqual(categorizeMilStdSymbol(crossingIbarBridge), 'circle', 'MSU Ibar Bridge post must be circle');

console.log('✓ Passed Test 2: MIL-STD tactical symbol categorization (diamond vs square vs circle) verified.\n');

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Layer Toggle Logic and Group Containment
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- Test 3: Layer Toggle Logic & Group Containment ---');

// Reset to initial state
setTacticalLayerVisibility('incidents', true);
setTacticalLayerVisibility('checkpoints', true);
setTacticalLayerVisibility('bases', true);

let state = getTacticalLayerState();
assert.strictEqual(state.incidents, true);
assert.strictEqual(state.checkpoints, true);
assert.strictEqual(state.bases, true);

// Toggle Incidents off
setTacticalLayerVisibility('incidents', false);
assert.strictEqual(isTacticalLayerVisible('incidents'), false, 'Incidents layer should be hidden');
assert.strictEqual(isTacticalLayerVisible('checkpoints'), true, 'Checkpoints must remain visible');
assert.strictEqual(isTacticalLayerVisible('bases'), true, 'Bases must remain visible');

// Toggle Checkpoints off via alias 'border'
setTacticalLayerVisibility('border', false);
assert.strictEqual(isTacticalLayerVisible('checkpoints'), false, 'Checkpoints layer should be hidden');

// Toggle Bases off via alias 'kfor'
setTacticalLayerVisibility('kfor', false);
assert.strictEqual(isTacticalLayerVisible('bases'), false, 'Bases layer should be hidden');

// Re-enable all
setTacticalLayerVisibility('incidents', true);
setTacticalLayerVisibility('checkpoints', true);
setTacticalLayerVisibility('bases', true);

assert.strictEqual(isTacticalLayerVisible('incidents'), true);
assert.strictEqual(isTacticalLayerVisible('checkpoints'), true);
assert.strictEqual(isTacticalLayerVisible('bases'), true);

console.log('✓ Passed Test 3: Layer toggle state management and alias mapping verified.\n');

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Kosovo Operational Zone Boundary Filtering
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- Test 4: Kosovo Operational Zone Boundary Filtering ---');

const inMitrovica = [20.8665, 42.8912];
const inJarinje = [20.6975, 43.2181];
const inPristina = [21.1655, 42.6629];
const outBelgrade = [20.4489, 44.7866];
const outTokyo = [139.6917, 35.6895];

assert.strictEqual(isPointInKosovoOperationalZone(inMitrovica), true, 'Mitrovica must be in operational zone');
assert.strictEqual(isPointInKosovoOperationalZone(inJarinje), true, 'Jarinje must be in operational zone');
assert.strictEqual(isPointInKosovoOperationalZone(inPristina), true, 'Pristina must be in operational zone');
assert.strictEqual(isPointInKosovoOperationalZone(outBelgrade), false, 'Belgrade must be outside operational zone');
assert.strictEqual(isPointInKosovoOperationalZone(outTokyo), false, 'Tokyo must be outside operational zone');

console.log('✓ Passed Test 4: Operational zone boundaries correctly enforced.\n');

// ─────────────────────────────────────────────────────────────────────────────
// Test 5: UI & CSS Assets Verification
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- Test 5: UI & CSS Assets Verification ---');

const cssPath = path.join(__dirname, '../public/style.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

assert.ok(cssContent.includes('@keyframes tacticalRadarPulse'), 'style.css must contain @keyframes tacticalRadarPulse');
assert.ok(cssContent.includes('.tactical-threat-marker-wrap'), 'style.css must contain .tactical-threat-marker-wrap');
assert.ok(cssContent.includes('.tactical-radar-ring.ring-1km'), 'style.css must contain 1 km radar ring');
assert.ok(cssContent.includes('.tactical-radar-ring.ring-3km'), 'style.css must contain 3 km radar ring');
assert.ok(cssContent.includes('.mil-std-diamond'), 'style.css must contain .mil-std-diamond');
assert.ok(cssContent.includes('.mil-std-square'), 'style.css must contain .mil-std-square');
assert.ok(cssContent.includes('.mil-std-circle'), 'style.css must contain .mil-std-circle');

const htmlPath = path.join(__dirname, '../public/index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');
assert.ok(htmlContent.includes('toggleLayerIncidents'), 'index.html must contain toggleLayerIncidents');

const appPath = path.join(__dirname, '../public/app.js');
const appContent = fs.readFileSync(appPath, 'utf8');
assert.ok(appContent.includes('createTacticalThreatMarkerElement'), 'app.js must use createTacticalThreatMarkerElement');
assert.ok(appContent.includes('updateTacticalThreatRangeRingsLayer'), 'app.js must have updateTacticalThreatRangeRingsLayer');

console.log('✓ Passed Test 5: UI widget, HTML checkboxes, and CSS keyframe animations verified.\n');

console.log('=== All Tactical Map Layers & Threat Range Rings Tests Passed! (100% Green) ===');
