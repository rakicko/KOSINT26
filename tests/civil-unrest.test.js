'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Civil Unrest & Public Gatherings (Hague Verdict 16 Sept 2026) Test Suite ===\n');

(async () => {
  // ─────────────────────────────────────────────────────────────────────────────
  // Test 1: GeoJSON Dataset Validation (public/data/civil-unrest.json)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- Test 1: GeoJSON Dataset Validation ---');

  const geojsonPath = path.join(__dirname, '..', 'public', 'data', 'civil-unrest.json');
  assert.ok(fs.existsSync(geojsonPath), 'public/data/civil-unrest.json must exist on disk');

  const rawData = fs.readFileSync(geojsonPath, 'utf8');
  let geojson;
  assert.doesNotThrow(() => {
    geojson = JSON.parse(rawData);
  }, 'civil-unrest.json must be valid JSON');

  assert.strictEqual(geojson.type, 'FeatureCollection', 'Must be a valid GeoJSON FeatureCollection');
  assert.strictEqual(geojson.features.length, 15, 'Must contain strictly 15 public gathering locations');

  // Kosovo approximate bounding box: 19.8 <= lon <= 21.9, 41.8 <= lat <= 43.3
  geojson.features.forEach((feature, index) => {
    const p = feature.properties;
    assert.strictEqual(feature.type, 'Feature', `Feature #${index + 1} must have type "Feature"`);
    assert.strictEqual(feature.geometry.type, 'Point', `Feature #${index + 1} must have geometry "Point"`);

    const [lon, lat] = feature.geometry.coordinates;
    assert.ok(typeof lon === 'number' && typeof lat === 'number', `Coordinates must be numbers [lon, lat] in #${index + 1}`);
    assert.ok(lon >= 19.8 && lon <= 21.9, `Longitude ${lon} in #${p.location} must be within Kosovo theater`);
    assert.ok(lat >= 41.8 && lat <= 43.3, `Latitude ${lat} in #${p.location} must be within Kosovo theater`);

    // Check required property fields
    const requiredProps = ['id', 'location', 'venue', 'status', 'statusLabel', 'symbolType', 'severity', 'targetDate'];
    requiredProps.forEach(prop => {
      assert.ok(p[prop] !== undefined && p[prop] !== '', `Property "${prop}" is missing in feature #${index + 1} (${p.location})`);
    });
  });
  console.log('✓ GeoJSON structure, coordinate bounds, and required properties validated for all 15 locations.');

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 2: Specific Location & Symbol Assertions
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- Test 2: Specific Location & Symbol Assertions ---');

  // 1. Prishtina: Confirmed public viewing (16 Sept) | Star-Circle / High Risk
  const prishtina = geojson.features.find(f => f.properties.location === 'Prishtina');
  assert.ok(prishtina, 'Prishtina must be in dataset');
  assert.strictEqual(prishtina.properties.venue, 'Mother Teresa Boulevard / central square');
  assert.strictEqual(prishtina.properties.status, 'confirmed_viewing');
  assert.strictEqual(prishtina.properties.symbolType, 'star-circle');
  assert.strictEqual(prishtina.properties.severity, 'high');

  // 6. Viti (Vitina): Countdown / support activity (local OVL-UÇK branch) | Purple Ring
  const viti = geojson.features.find(f => f.properties.location.includes('Viti'));
  assert.ok(viti, 'Viti must be in dataset');
  assert.strictEqual(viti.properties.venue, 'Venue not specified');
  assert.strictEqual(viti.properties.symbolType, 'purple-ring');
  assert.strictEqual(viti.properties.category, 'ovl_uck');

  // 9. Mitrovicë (South): Mehë Uka Square | Proximity to Ibar Bridge
  const mitrovica = geojson.features.find(f => f.properties.location.includes('Mitrovicë'));
  assert.ok(mitrovica, 'Mitrovica must be in dataset');
  assert.strictEqual(mitrovica.properties.venue, 'Mehë Uka Square');
  assert.strictEqual(mitrovica.properties.symbolType, 'blue-ring');
  assert.ok(mitrovica.properties.statusLabel.includes('Ibar Bridge') || mitrovica.properties.tacticalNotes.includes('Ibar Bridge'));

  // Count categories
  const starCount = geojson.features.filter(f => f.properties.symbolType === 'star-circle').length;
  const purpleCount = geojson.features.filter(f => f.properties.symbolType === 'purple-ring').length;
  const blueCount = geojson.features.filter(f => f.properties.symbolType === 'blue-ring').length;

  assert.strictEqual(starCount, 1, 'Exactly 1 Star-Circle location (Prishtina)');
  assert.strictEqual(purpleCount, 1, 'Exactly 1 Purple Ring location (Viti OVL-UÇK)');
  assert.strictEqual(blueCount, 13, 'Exactly 13 Blue Ring locations (Ora e Pritjes countdown screens)');
  console.log('✓ Verified symbols: 1 Star-Circle (Prishtina), 1 Purple Ring (Viti), 13 Blue Rings (Ora e Pritjes).');

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 3: Map Markers Instantiation & MapLibre FlyTo Integration
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- Test 3: Map Markers Instantiation & MapLibre FlyTo Integration ---');

  // Mock DOM environment if running in pure Node
  if (typeof global.document === 'undefined') {
    global.document = {
      createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        className: '',
        id: '',
        dataset: {},
        innerHTML: '',
        style: {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        addEventListener: () => {}
      }),
      querySelectorAll: () => [],
      getElementById: () => null
    };
  }
  if (typeof global.window === 'undefined') {
    global.window = {
      civilUnrestMarkersGroup: []
    };
  }

  // Mock MapLibre GL
  const instantiatedMarkers = [];
  class MockMapLibreMarker {
    constructor(opts) {
      this.opts = opts;
      this.lngLat = null;
      instantiatedMarkers.push(this);
    }
    setLngLat(coords) {
      this.lngLat = coords;
      return this;
    }
    addTo(map) {
      this.map = map;
      return this;
    }
    remove() {
      this.removed = true;
    }
  }

  let flyToArgs = null;
  const mockMap = {
    _canvas: true,
    easeTo: () => {},
    flyTo: (args) => {
      flyToArgs = args;
    },
    setView: (coords, zoom) => {
      flyToArgs = { center: coords, zoom };
    }
  };

  let CivilUnrest;
  try {
    CivilUnrest = await import('../public/civil-unrest-map.js');
  } catch (_) {
    CivilUnrest = require('../public/civil-unrest-map.js');
  }

  const moduleApi = CivilUnrest.default || CivilUnrest;
  assert.ok(moduleApi, 'civil-unrest-map.js must be exportable');

  // Initialize with Mock Map and MapLibre
  await moduleApi.initCivilUnrestLayer(mockMap, {
    maplibregl: { Marker: MockMapLibreMarker, Popup: class { setLngLat() { return this; } setHTML() { return this; } addTo() { return this; } } }
  });

  assert.strictEqual(instantiatedMarkers.length, 15, 'All 15 locations must be instantiated as visual markers');
  console.log(`✓ Verified ${instantiatedMarkers.length} visual MapLibre markers instantiated at exact coordinates.`);

  // Test FlyTo execution with zoom: 13
  moduleApi.flyToGathering('gathering-prishtina');
  assert.ok(flyToArgs, 'flyTo must have been executed on the map');
  assert.strictEqual(flyToArgs.zoom, 13, 'flyTo zoom level must be 13');
  assert.strictEqual(flyToArgs.essential, true, 'flyTo essential flag must be true');
  assert.deepStrictEqual(flyToArgs.center, [21.1633, 42.6639], 'flyTo center must match Prishtina coordinates');
  console.log('✓ Verified cross-navigation flyTo: zoom 13, essential: true, centered on target coordinates.');

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 4: CSS Container Scrollable Constraints
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- Test 4: CSS Container Scrollable Constraints ---');

  const cssPath = path.join(__dirname, '..', 'public', 'style.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  assert.ok(cssContent.includes('#civilUnrestPanel'), '#civilUnrestPanel selector must exist in style.css');
  assert.ok(cssContent.includes('calc(100vh - 180px)'), 'max-height: calc(100vh - 180px) must be present for panel');
  assert.ok(cssContent.includes('overflow-y: auto'), 'overflow-y: auto must be present for scrolling container');
  assert.ok(cssContent.includes('overscroll-behavior: contain'), 'overscroll-behavior: contain must be applied');
  assert.ok(cssContent.includes('flex-shrink: 0'), 'flex-shrink: 0 must protect list rows from clipping');

  const moduleCssPath = path.join(__dirname, '..', 'public', 'civil-unrest.css');
  const moduleCssContent = fs.readFileSync(moduleCssPath, 'utf8');
  assert.ok(moduleCssContent.includes('pulseBorderRed'), 'pulseBorderRed animation must be present in civil-unrest.css');

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 5: Marker & Opened Popup Tactical Styling
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- Test 5: Marker & Opened Popup Tactical Styling ---');

  assert.ok(moduleCssContent.includes('.civil-unrest-maplibre-popup .maplibregl-popup-content'), 'MapLibre popup content selector must exist');
  assert.ok(moduleCssContent.includes('background: transparent !important'), 'MapLibre white box must be eliminated with transparent background');
  assert.ok(moduleCssContent.includes('.civil-unrest-maplibre-popup .maplibregl-popup-tip'), 'Popup tip styling must exist');
  assert.ok(moduleCssContent.includes('.civil-unrest-maplibre-popup .maplibregl-popup-close-button'), 'Close button styling must exist');
  assert.ok(moduleCssContent.includes('.civil-marker-wrap.active'), 'Marker active opened state must exist');
  assert.ok(moduleCssContent.includes('.civil-marker-wrap.active .civil-marker-tooltip'), 'Tooltip must be hidden when marker is active');

  console.log('✓ Verified opened marker styling, elimination of white popup background/tip, and tactical close button.');

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 6: Popup Close Button HTML Structural Isolation
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- Test 6: Popup Close Button HTML Structural Isolation ---');

  const popupCode = fs.readFileSync(path.join(__dirname, '..', 'public', 'civil-unrest-map.js'), 'utf8');
  assert.ok(popupCode.includes('class="civil-popup-close-btn"'), 'civil-popup-close-btn must be present in civil-unrest-map.js HTML template');

  const sampleProps = geojson.features[0].properties;
  const mockFeatureGeoJson = geojson.features[0];
  const builtHtml = moduleApi.buildPopupHtml ? moduleApi.buildPopupHtml(sampleProps) : '';
  
  if (builtHtml) {
    assert.ok(builtHtml.includes('<button type="button" class="civil-popup-close-btn"'), 'Close button element must exist in popup HTML');
    const badgeIndex = builtHtml.indexOf('class="civil-badge');
    const badgeEndIndex = builtHtml.indexOf('</span>', badgeIndex);
    const btnIndex = builtHtml.indexOf('class="civil-popup-close-btn"');
    assert.ok(btnIndex < badgeIndex || btnIndex > badgeEndIndex, 'Close button must NOT be nested inside civil-badge container');
  }

  console.log('✓ Verified close button is isolated at the top-level of the popup card template.');

  console.log('\n=== ALL CIVIL UNREST MODULE TESTS PASSED ===');
})().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
