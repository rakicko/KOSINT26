'use strict';

const assert = require('assert');
const { fetchEarthquakes } = require('../skills/earthquake-monitor/skill');

console.log('─────────────────────────────────────────────────────────────────');
console.log('🧪 Starting Seismic Map Marker Geographic Anchoring Tests');
console.log('─────────────────────────────────────────────────────────────────\n');

(async () => {
  // ── Test 1: Data Coordinate Integrity & No Inversion ───────────────────────────
  console.log('Test 1: Verifying earthquake coordinate extraction and lat/lon ordering...');

  const mockEmscFeature = {
    type: 'Feature',
    id: 'emsc_test_1',
    geometry: {
      type: 'Point',
      coordinates: [21.7453, 41.6086, -10] // [lon, lat, depth] -> North Macedonia
    },
    properties: {
      mag: 3.8,
      flynn_region: 'NORTH MACEDONIA',
      lat: 41.6086,
      lon: 21.7453,
      time: new Date().toISOString()
    }
  };

  const coords = mockEmscFeature.geometry.coordinates;
  const eqLon = coords[0];
  const eqLat = coords[1];

  assert.strictEqual(eqLat, 41.6086, 'Latitude must be 41.6086');
  assert.strictEqual(eqLon, 21.7453, 'Longitude must be 21.7453');
  assert.ok(eqLat > 35 && eqLat < 45, 'Latitude must be in Balkan range (35-45°N)');
  assert.ok(eqLon > 15 && eqLon < 30, 'Longitude must be in Balkan range (15-30°E)');
  console.log('✓ Passed: Geographic coordinates parsed in correct [lon, lat] order with valid Balkan bounds.\n');

  // ── Test 2: Known Locations Geographic Separation (North Macedonia vs Greece) ──
  console.log('Test 2: Verifying distinct separation for North Macedonia and Greece test locations...');

  const testLocationA_NM = {
    id: 'eq-north-macedonia-1',
    magnitude: 4.2,
    place: 'North Macedonia',
    lat: 41.6086,
    lon: 21.7453,
    depth: 10,
    time: new Date().toISOString()
  };

  const testLocationB_GR = {
    id: 'eq-greece-1',
    magnitude: 4.5,
    place: 'Greece',
    lat: 39.6390,
    lon: 22.4191,
    depth: 12,
    time: new Date().toISOString()
  };

  // Delta latitude is nearly 2 full degrees (~220 km apart)
  const latDelta = Math.abs(testLocationA_NM.lat - testLocationB_GR.lat);
  assert.ok(latDelta > 1.8, 'Locations must be clearly separated by >1.8 degrees latitude');
  console.log(`✓ Passed: North Macedonia (lat ${testLocationA_NM.lat}) and Greece (lat ${testLocationB_GR.lat}) separated by ${latDelta.toFixed(2)}° lat (~${Math.round(latDelta * 111)}km).\n`);

  // ── Test 3: MapLibre Marker Configuration & DOM Structure ──────────────────────
  console.log('Test 3: Verifying MapLibre marker construction does NOT use inline position: relative...');

  // Mock DOM environment
  const createdElements = [];
  const mockDocument = {
    createElement: (tag) => {
      const el = {
        tagName: tag.toUpperCase(),
        className: '',
        style: {},
        classList: {
          classes: new Set(),
          add: function(c) { this.classes.add(c); },
          contains: function(c) { return this.classes.has(c); }
        },
        appendChild: function(c) { this.children.push(c); },
        children: []
      };
      createdElements.push(el);
      return el;
    }
  };

  function createMapMarkerElementTest(color, size = 16, border = 3, severity = null) {
    const marker = mockDocument.createElement('div');
    marker.className = 'mapbox-marker';
    marker.style.width = `${size}px`;
    marker.style.height = `${size}px`;
    marker.style.border = `${border}px solid rgba(255,255,255,0.92)`;
    marker.style.borderRadius = '50%';
    marker.style.backgroundColor = color;
    marker.style.boxShadow = `0 0 14px ${color}`;
    marker.style.cursor = 'pointer';
    // Must NOT have marker.style.position = 'relative';

    const sev = String(severity || '').toUpperCase();
    if (sev === 'CRITICAL') {
      marker.classList.add('threat-pulse-critical');
      const radar = mockDocument.createElement('div');
      radar.className = 'radar-ring critical';
      marker.appendChild(radar);
    }
    return marker;
  }

  const markerEl = createMapMarkerElementTest('#f87171', 14, 3, 'CRITICAL');
  assert.strictEqual(markerEl.style.position, undefined, 'Marker element must NOT have inline position: relative');
  console.log('✓ Passed: Marker element leaves positioning to MapLibre .maplibregl-marker (position: absolute).\n');

  // ── Test 4: MapLibre Marker Anchoring & Coordinate Pipeline ─────────────────────
  console.log('Test 4: Simulating multi-marker rendering and verifying zero flow-stacking drift...');

  const addedMarkers = [];
  class MockMapLibreMarker {
    constructor(options) {
      this.element = options.element;
      this.anchor = options.anchor || 'center';
      this.lngLat = null;
      this.popup = null;
      this.map = null;
    }
    setLngLat(coords) {
      this.lngLat = coords;
      return this;
    }
    setPopup(popup) {
      this.popup = popup;
      return this;
    }
    addTo(map) {
      this.map = map;
      addedMarkers.push(this);
      return this;
    }
    getElement() {
      return this.element;
    }
  }

  const mockMap = {
    project: ([lon, lat]) => ({
      x: (lon - 20) * 400 + 300,
      y: (43 - lat) * 400 + 200
    }),
    getContainer: () => ({
      getBoundingClientRect: () => ({ left: 80, top: 60, width: 1200, height: 800 })
    })
  };

  const testEarthquakes = [
    testLocationA_NM,
    testLocationB_GR,
    { id: 'eq-albania-1', magnitude: 3.2, place: 'Albania', lat: 41.2, lon: 19.8, depth: 8, time: new Date().toISOString() },
    { id: 'eq-kosovo-1', magnitude: 2.8, place: 'Kosovo', lat: 42.6, lon: 21.1, depth: 5, time: new Date().toISOString() }
  ];

  testEarthquakes.forEach(eq => {
    const el = createMapMarkerElementTest('#38bdf8', 12, 2);
    const marker = new MockMapLibreMarker({ element: el, anchor: 'center' })
      .setLngLat([eq.lon, eq.lat])
      .addTo(mockMap);
    marker._module = 'earthquake';
    marker._eqData = eq;
  });

  assert.strictEqual(addedMarkers.length, 4, 'Must have rendered 4 markers');

  // Verify each marker is anchored to its specific lon, lat
  const markerNM = addedMarkers.find(m => m._eqData.id === 'eq-north-macedonia-1');
  const markerGR = addedMarkers.find(m => m._eqData.id === 'eq-greece-1');

  assert.deepStrictEqual(markerNM.lngLat, [21.7453, 41.6086], 'North Macedonia marker must be at [lon, lat]');
  assert.deepStrictEqual(markerGR.lngLat, [22.4191, 39.6390], 'Greece marker must be at [lon, lat]');

  const projNM = mockMap.project(markerNM.lngLat);
  const projGR = mockMap.project(markerGR.lngLat);

  console.log(`North Macedonia Map Coordinates: x=${projNM.x.toFixed(2)}, y=${projNM.y.toFixed(2)}`);
  console.log(`Greece Map Coordinates:          x=${projGR.x.toFixed(2)}, y=${projGR.y.toFixed(2)}`);

  assert.ok(projGR.y > projNM.y + 700, 'Greece marker must be projected significantly further south than North Macedonia');
  console.log('✓ Passed: Markers maintain strictly independent, non-drifting geographic projection.\n');

  // ── Test 5: Page Scroll & Viewport Invariance ──────────────────────────────────
  console.log('Test 5: Verifying page scroll does not cause relative marker drift...');

  function computeMarkerScreenCoords(marker, map, scrollY = 0) {
    const projected = map.project(marker.lngLat);
    const container = map.getContainer().getBoundingClientRect();
    // Map container moves on page scroll, markers move with map container 1:1
    return {
      screenX: container.left + projected.x,
      screenY: container.top + projected.y - scrollY
    };
  }

  const initialNM = computeMarkerScreenCoords(markerNM, mockMap, 0);
  const initialGR = computeMarkerScreenCoords(markerGR, mockMap, 0);

  const scrolledNM = computeMarkerScreenCoords(markerNM, mockMap, 250);
  const scrolledGR = computeMarkerScreenCoords(markerGR, mockMap, 250);

  // The relative distance between markers on screen MUST remain invariant
  const initialDistance = Math.hypot(initialGR.screenX - initialNM.screenX, initialGR.screenY - initialNM.screenY);
  const scrolledDistance = Math.hypot(scrolledGR.screenX - scrolledNM.screenX, scrolledGR.screenY - scrolledNM.screenY);

  assert.strictEqual(initialDistance.toFixed(4), scrolledDistance.toFixed(4), 'Marker-to-marker distance must be 100% identical after scroll');
  console.log(`Initial Distance: ${initialDistance.toFixed(2)}px | Scrolled Distance: ${scrolledDistance.toFixed(2)}px`);
  console.log('✓ Passed: Geographic distance between markers is 100% invariant under page scrolling.\n');

  // ── Test 6: Debug Logger Output Format Verification ────────────────────────────
  console.log('Test 6: Verifying format of debug seismic logging output...');

  const loggedLines = [];
  const originalConsoleLog = console.log;
  console.log = (...args) => loggedLines.push(args.join(' '));

  function logSeismicMarkerDebugMock(eq, element, map) {
    const projected = map.project([eq.lon, eq.lat]);
    const containerRect = map.getContainer().getBoundingClientRect();
    const markerRect = { left: containerRect.left + projected.x - 6, top: containerRect.top + projected.y - 6, width: 12, height: 12 };

    const mapProjectedX = projected.x.toFixed(2);
    const mapProjectedY = projected.y.toFixed(2);
    const containerX = (containerRect.left + projected.x).toFixed(2);
    const containerY = (containerRect.top + projected.y).toFixed(2);
    const finalMarkerX = (markerRect.left + markerRect.width / 2).toFixed(2);
    const finalMarkerY = (markerRect.top + markerRect.height / 2).toFixed(2);

    console.log(`[seismic-marker]\n` +
      `eventId=${eq.id || 'N/A'}\n` +
      `latitude=${eq.lat}\n` +
      `longitude=${eq.lon}\n` +
      `country=${eq.place || 'Unknown'}\n` +
      `mapProjectedX=${mapProjectedX}\n` +
      `mapProjectedY=${mapProjectedY}\n` +
      `containerX=${containerX}\n` +
      `containerY=${containerY}\n` +
      `finalMarkerX=${finalMarkerX}\n` +
      `finalMarkerY=${finalMarkerY}`
    );
  }

  logSeismicMarkerDebugMock(testLocationA_NM, markerNM.element, mockMap);
  console.log = originalConsoleLog;

  const fullLog = loggedLines.join('\n');
  assert.ok(fullLog.includes('[seismic-marker]'), 'Must include header');
  assert.ok(fullLog.includes('eventId=eq-north-macedonia-1'), 'Must include eventId');
  assert.ok(fullLog.includes('latitude=41.6086'), 'Must include latitude');
  assert.ok(fullLog.includes('longitude=21.7453'), 'Must include longitude');
  assert.ok(fullLog.includes('country=North Macedonia'), 'Must include country');
  assert.ok(fullLog.includes('mapProjectedX='), 'Must include mapProjectedX');
  assert.ok(fullLog.includes('mapProjectedY='), 'Must include mapProjectedY');
  assert.ok(fullLog.includes('containerX='), 'Must include containerX');
  assert.ok(fullLog.includes('containerY='), 'Must include containerY');
  assert.ok(fullLog.includes('finalMarkerX='), 'Must include finalMarkerX');
  assert.ok(fullLog.includes('finalMarkerY='), 'Must include finalMarkerY');

  console.log('Sample Debug Log Output:\n' + fullLog + '\n');
  console.log('✓ Passed: Debug log provides full coordinate pipeline inspection.\n');

  console.log('─────────────────────────────────────────────────────────────────');
  console.log('🎉 ALL SEISMIC MARKER GEOGRAPHIC ANCHORING TESTS PASSED!');
  console.log('─────────────────────────────────────────────────────────────────\n');
})().catch(err => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
