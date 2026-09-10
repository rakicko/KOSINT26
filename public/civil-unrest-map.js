/**
 * KOSINT — Civil Unrest & Public Gatherings Operational Module
 * Hague Verdict Public Viewing & Support Gatherings (16 September 2026)
 *
 * Universal Module: Compatible with MapLibre GL JS & Leaflet, Browser ESM & Global
 */

'use strict';

// Target Event Timestamp: 16 September 2026, 10:00:00 CEST (UTC+2)
const HAGUE_VERDICT_TARGET_TIME = new Date('2026-09-16T10:00:00+02:00').getTime();

// Inlined Fallback GeoJSON Dataset (Guarantees immediate zero-lag display and offline resilience)
const EMBEDDED_CIVIL_UNREST_GEOJSON = {
  "type": "FeatureCollection",
  "metadata": {
    "title": "Kosovo Public Gatherings Ahead of Hague Verdict",
    "event": "Specialist Chambers Verdict Viewing & Support Gatherings",
    "targetDate": "2026-09-16T10:00:00+02:00",
    "referenceDate": "2026-09-07T00:00:00+02:00",
    "case": "Hashim Tha\u00e7i, Kadri Veseli, Jakup Krasniqi, Rexhep Selimi",
    "totalLocations": 15
  },
  "features": [
    {
      "type": "Feature",
      "id": "gathering-prishtina",
      "geometry": { "type": "Point", "coordinates": [21.1633, 42.6639] },
      "properties": {
        "id": "gathering-prishtina",
        "order": 1,
        "location": "Prishtina",
        "municipality": "Prishtin\u00eb",
        "venue": "Mother Teresa Boulevard / central square",
        "status": "confirmed_viewing",
        "statusLabel": "Confirmed public viewing (16 Sept)",
        "symbolType": "star-circle",
        "severity": "high",
        "targetDate": "2026-09-16T10:00:00+02:00",
        "category": "confirmed",
        "crowdEstimate": "15,000 - 25,000",
        "tacticalNotes": "Live broadcast screening of Hague verdict on 16 September. Main pedestrian boulevard cordoned. High institutional and diplomatic presence."
      }
    },
    {
      "type": "Feature",
      "id": "gathering-ferizaj",
      "geometry": { "type": "Point", "coordinates": [21.1557, 42.3705] },
      "properties": {
        "id": "gathering-ferizaj",
        "order": 2,
        "location": "Ferizaj",
        "municipality": "Ferizaj",
        "venue": "City square",
        "status": "countdown_screen",
        "statusLabel": "Ora e Pritjes (countdown) / support activity",
        "symbolType": "blue-ring",
        "severity": "medium",
        "targetDate": "2026-09-16T10:00:00+02:00",
        "category": "countdown",
        "crowdEstimate": "3,000 - 5,000",
        "tacticalNotes": "Ora e Pritjes countdown screen installed in central square. Local civic and veteran community assembly."
      }
    },
    {
      "type": "Feature",
      "id": "gathering-vushtrri",
      "geometry": { "type": "Point", "coordinates": [20.9664, 42.8236] },
      "properties": {
        "id": "gathering-vushtrri",
        "order": 3,
        "location": "Vushtrri",
        "municipality": "Vushtrri",
        "venue": "Adem Jashari Square",
        "status": "countdown_screen",
        "statusLabel": "Ora e Pritjes (countdown)",
        "symbolType": "blue-ring",
        "severity": "medium",
        "targetDate": "2026-09-16T10:00:00+02:00",
        "category": "countdown",
        "crowdEstimate": "2,500 - 4,000",
        "tacticalNotes": "Countdown monitor staged in Adem Jashari Square. Gathering announced ahead of verdict delivery."
      }
    },
    {
      "type": "Feature",
      "id": "gathering-skenderaj",
      "geometry": { "type": "Point", "coordinates": [20.7892, 42.7483] },
      "properties": {
        "id": "gathering-skenderaj",
        "order": 4,
        "location": "Skenderaj",
        "municipality": "Skenderaj",
        "venue": "Adem Jashari Square",
        "status": "countdown_screen",
        "statusLabel": "Ora e Pritjes (countdown)",
        "symbolType": "blue-ring",
        "severity": "medium",
        "targetDate": "2026-09-16T10:00:00+02:00",
        "category": "countdown",
        "crowdEstimate": "4,000 - 7,000",
        "tacticalNotes": "Drenica focal assembly. Screen installed for Ora e Pritjes. Strong public engagement anticipated."
      }
    },
    {
      "type": "Feature",
      "id": "gathering-prizren",
      "geometry": { "type": "Point", "coordinates": [20.7415, 42.2096] },
      "properties": {
        "id": "gathering-prizren",
        "order": 5,
        "location": "Prizren",
        "municipality": "Prizren",
        "venue": "Shad\u00ebrvan",
        "status": "countdown_screen",
        "statusLabel": "Ora e Pritjes (countdown)",
        "symbolType": "blue-ring",
        "severity": "medium",
        "targetDate": "2026-09-16T10:00:00+02:00",
        "category": "countdown",
        "crowdEstimate": "5,000 - 8,000",
        "tacticalNotes": "Shad\u00ebrvan historic plaza. Dense foot traffic zone; public countdown monitor active."
      }
    },
    {
      "type": "Feature",
      "id": "gathering-viti",
      "geometry": { "type": "Point", "coordinates": [21.3583, 42.3214] },
      "properties": {
        "id": "gathering-viti",
        "order": 6,
        "location": "Viti (Vitina)",
        "municipality": "Viti",
        "venue": "Venue not specified",
        "status": "ovl_uck_support",
        "statusLabel": "Countdown / support activity (local OVL-U\u00c7K branch)",
        "symbolType": "purple-ring",
        "severity": "elevated",
        "targetDate": "2026-09-16T10:00:00+02:00",
        "category": "ovl_uck",
        "crowdEstimate": "1,500 - 3,000",
        "tacticalNotes": "Countdown and support activity organized with participation of the local OVL-U\u00c7K branch. Venue to be specified upon municipal permit."
      }
    },
    {
      "type": "Feature",
      "id": "gathering-rahovec",
      "geometry": { "type": "Point", "coordinates": [20.6558, 42.3994] },
      "properties": {
        "id": "gathering-rahovec",
        "order": 7,
        "location": "Rahovec",
        "municipality": "Rahovec",
        "venue": "City square",
        "status": "countdown_screen",
        "statusLabel": "Ora e Pritjes (countdown)",
        "symbolType": "blue-ring",
        "severity": "medium",
        "targetDate": "2026-09-16T10:00:00+02:00",
        "category": "countdown",
        "crowdEstimate": "1,500 - 2,500",
        "tacticalNotes": "City square public assembly point. Screen installed for live countdown transmission."
      }
    },
    {
      "type": "Feature",
      "id": "gathering-malisheve",
      "geometry": { "type": "Point", "coordinates": [20.7456, 42.4828] },
      "properties": {
        "id": "gathering-malisheve",
        "order": 8,
        "location": "Malishev\u00eb",
        "municipality": "Malishev\u00eb",
        "venue": "Sheshi i D\u00ebshmor\u00ebve",
        "status": "countdown_screen",
        "statusLabel": "Ora e Pritjes (countdown)",
        "symbolType": "blue-ring",
        "severity": "medium",
        "targetDate": "2026-09-16T10:00:00+02:00",
        "category": "countdown",
        "crowdEstimate": "2,000 - 4,000",
        "tacticalNotes": "Sheshi i D\u00ebshmor\u00ebve central square gathering. Countdown screen installed."
      }
    },
    {
      "type": "Feature",
      "id": "gathering-mitrovice",
      "geometry": { "type": "Point", "coordinates": [20.8660, 42.8887] },
      "properties": {
        "id": "gathering-mitrovice",
        "order": 9,
        "location": "Mitrovic\u00eb (South)",
        "municipality": "Mitrovic\u00eb e Jugut",
        "venue": "Meh\u00eb Uka Square",
        "status": "countdown_screen",
        "statusLabel": "Ora e Pritjes (countdown) \u00b7 Proximity to Ibar Bridge",
        "symbolType": "blue-ring",
        "severity": "elevated",
        "targetDate": "2026-09-16T10:00:00+02:00",
        "category": "countdown",
        "crowdEstimate": "3,000 - 6,000",
        "tacticalNotes": "Meh\u00eb Uka Square gathering. Strategic sensitivity due to ~350m proximity to Main Ibar Bridge and KFOR MSU cordon."
      }
    },
    {
      "type": "Feature",
      "id": "gathering-gjakove",
      "geometry": { "type": "Point", "coordinates": [20.4300, 42.3800] },
      "properties": {
        "id": "gathering-gjakove",
        "order": 10,
        "location": "Gjakov\u00eb",
        "municipality": "Gjakov\u00eb",
        "venue": "Venue not specified",
        "status": "countdown_screen",
        "statusLabel": "Ora e Pritjes (countdown)",
        "symbolType": "blue-ring",
        "severity": "medium",
        "targetDate": "2026-09-16T10:00:00+02:00",
        "category": "countdown",
        "crowdEstimate": "3,000 - 5,000",
        "tacticalNotes": "Public gathering announced; municipal confirmation of exact public plaza pending."
      }
    },
    {
      "type": "Feature",
      "id": "gathering-drenas",
      "geometry": { "type": "Point", "coordinates": [20.8931, 42.6247] },
      "properties": {
        "id": "gathering-drenas",
        "order": 11,
        "location": "Drenas",
        "municipality": "Drenas (Gllogoc)",
        "venue": "Fehmi and Xhev\u00eb Lladrovci Square",
        "status": "countdown_screen",
        "statusLabel": "Ora e Pritjes (countdown)",
        "symbolType": "blue-ring",
        "severity": "medium",
        "targetDate": "2026-09-16T10:00:00+02:00",
        "category": "countdown",
        "crowdEstimate": "3,000 - 5,500",
        "tacticalNotes": "Fehmi and Xhev\u00eb Lladrovci Square. Stage setup and countdown screen active."
      }
    },
    {
      "type": "Feature",
      "id": "gathering-suhareke",
      "geometry": { "type": "Point", "coordinates": [20.8247, 42.3589] },
      "properties": {
        "id": "gathering-suhareke",
        "order": 12,
        "location": "Suharek\u00eb",
        "municipality": "Suharek\u00eb (Therand\u00eb)",
        "venue": "Sheshi i Qytetit (Art Center)",
        "status": "countdown_screen",
        "statusLabel": "Ora e Pritjes (countdown)",
        "symbolType": "blue-ring",
        "severity": "medium",
        "targetDate": "2026-09-16T10:00:00+02:00",
        "category": "countdown",
        "crowdEstimate": "2,000 - 3,500",
        "tacticalNotes": "City square adjacent to Art Center. Public screen displaying verdict countdown."
      }
    },
    {
      "type": "Feature",
      "id": "gathering-decan",
      "geometry": { "type": "Point", "coordinates": [20.2886, 42.5358] },
      "properties": {
        "id": "gathering-decan",
        "order": 13,
        "location": "De\u00e7an",
        "municipality": "De\u00e7an",
        "venue": "City centre",
        "status": "countdown_screen",
        "statusLabel": "Ora e Pritjes (countdown)",
        "symbolType": "blue-ring",
        "severity": "medium",
        "targetDate": "2026-09-16T10:00:00+02:00",
        "category": "countdown",
        "crowdEstimate": "2,000 - 3,500",
        "tacticalNotes": "City centre assembly. Support activities along central axis."
      }
    },
    {
      "type": "Feature",
      "id": "gathering-gjilan",
      "geometry": { "type": "Point", "coordinates": [21.4683, 42.4635] },
      "properties": {
        "id": "gathering-gjilan",
        "order": 14,
        "location": "Gjilan",
        "municipality": "Gjilan",
        "venue": "Venue not specified",
        "status": "countdown_screen",
        "statusLabel": "Ora e Pritjes (countdown)",
        "symbolType": "blue-ring",
        "severity": "medium",
        "targetDate": "2026-09-16T10:00:00+02:00",
        "category": "countdown",
        "crowdEstimate": "3,000 - 5,000",
        "tacticalNotes": "Ora e Pritjes announced for Gjilan. Final venue location being arranged."
      }
    },
    {
      "type": "Feature",
      "id": "gathering-kacanik",
      "geometry": { "type": "Point", "coordinates": [21.2592, 42.2319] },
      "properties": {
        "id": "gathering-kacanik",
        "order": 15,
        "location": "Ka\u00e7anik",
        "municipality": "Ka\u00e7anik",
        "venue": "City centre",
        "status": "countdown_screen",
        "statusLabel": "Ora e Pritjes (countdown)",
        "symbolType": "blue-ring",
        "severity": "medium",
        "targetDate": "2026-09-16T10:00:00+02:00",
        "category": "countdown",
        "crowdEstimate": "1,500 - 3,000",
        "tacticalNotes": "Ka\u00e7anik city centre public assembly. Countdown screen operational."
      }
    }
  ]
};

// Module State
const state = {
  map: null,
  geoJsonData: EMBEDDED_CIVIL_UNREST_GEOJSON,
  markers: [], // MapLibre or Leaflet marker instances with metadata
  maplibregl: null,
  activePopup: null,
  popupIntervalId: null,
  bannerIntervalId: null,
  currentFilter: 'all',
  searchQuery: '',
  selectedId: null,
  visible: false
};

/**
 * Calculates remaining time components to the target date
 */
function getCountdownParts(targetTimestamp = HAGUE_VERDICT_TARGET_TIME) {
  const now = Date.now();
  const diffMs = Math.max(0, targetTimestamp - now);

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const seconds = Math.floor((diffMs / 1000) % 60);

  return {
    diffMs,
    isPast: diffMs <= 0,
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    formatted: `${String(days).padStart(2, '0')}d : ${String(hours).padStart(2, '0')}h : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}s`
  };
}

/**
 * Creates custom styled SVG marker DOM element
 * @param {Object} properties Feature properties
 * @returns {HTMLElement} marker container
 */
function createCivilMarkerElement(properties) {
  const el = document.createElement('div');
  let symbolClass = 'marker-ring-blue ring_blue';
  if (properties.symbolType === 'star-circle') {
    symbolClass = 'marker-star-circle ring_red';
  } else if (properties.symbolType === 'purple-ring') {
    symbolClass = 'marker-ring-purple ring_purple';
  }
  el.className = `civil-marker-wrap ${symbolClass} marker-sev-${properties.severity}`;
  el.id = `marker-${properties.id}`;
  el.dataset.id = properties.id;

  let svgHtml = '';

  if (properties.symbolType === 'star-circle') {
    // 1. Red pulsing star/circle for Prishtina (Confirmed public viewing)
    svgHtml = `
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#ef4444" flood-opacity="0.95"/>
          </filter>
          <radialGradient id="gradRedCircle" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ef4444"/>
            <stop offset="70%" stop-color="#dc2626"/>
            <stop offset="100%" stop-color="#7f1d1d"/>
          </radialGradient>
        </defs>
        <!-- Static outer tactical ring -->
        <circle cx="20" cy="20" r="17.5" stroke="#ef4444" stroke-width="1.6" opacity="0.9" fill="none"/>
        <!-- Inner filled disc with glow -->
        <circle cx="20" cy="20" r="13.5" fill="url(#gradRedCircle)" stroke="#fee2e2" stroke-width="1.8" filter="url(#glowRed)"/>
        <!-- Crosshair ticks -->
        <line x1="20" y1="1" x2="20" y2="5" stroke="#fca5a5" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="20" y1="35" x2="20" y2="39" stroke="#fca5a5" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="1" y1="20" x2="5" y2="20" stroke="#fca5a5" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="35" y1="20" x2="39" y2="20" stroke="#fca5a5" stroke-width="1.6" stroke-linecap="round"/>
        <!-- Five-pointed star -->
        <polygon points="20,9.5 22.8,15.2 29.5,15.8 24.5,20.2 25.9,27 20,23.5 14.1,27 15.5,20.2 10.5,15.8 17.2,15.2"
          fill="#ffffff" stroke="#fee2e2" stroke-width="0.8" stroke-linejoin="round"/>
      </svg>
    `;
  } else if (properties.symbolType === 'purple-ring') {
    // 2. Purple ring for local OVL-UÇK branch participation (Viti)
    svgHtml = `
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glowPurple" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#a855f7" flood-opacity="0.9"/>
          </filter>
        </defs>
        <!-- Outer concentric ring -->
        <circle cx="18" cy="18" r="15" stroke="#a855f7" stroke-width="1.8" fill="rgba(126, 34, 206, 0.15)" filter="url(#glowPurple)"/>
        <!-- Middle concentric ring with dashed radar pattern -->
        <circle cx="18" cy="18" r="10.5" stroke="#c084fc" stroke-width="1.6" stroke-dasharray="4 2" opacity="0.95"/>
        <!-- Inner solid glowing disc -->
        <circle cx="18" cy="18" r="5" fill="#7e22ce" stroke="#f3e8ff" stroke-width="1.4"/>
        <!-- Center focal dot -->
        <circle cx="18" cy="18" r="1.8" fill="#ffffff"/>
      </svg>
    `;
  } else {
    // 3. Blue tactical concentric rings for Ora e Pritjes (countdown screens)
    svgHtml = `
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#38bdf8" flood-opacity="0.85"/>
          </filter>
        </defs>
        <!-- Outer concentric ring -->
        <circle cx="17" cy="17" r="14.5" stroke="#38bdf8" stroke-width="1.8" fill="rgba(2, 132, 199, 0.15)" filter="url(#glowBlue)"/>
        <!-- Middle concentric ring with dashed tactical pattern -->
        <circle cx="17" cy="17" r="10" stroke="#0284c7" stroke-width="1.6" stroke-dasharray="4 2"/>
        <!-- Center dot -->
        <circle cx="17" cy="17" r="4.5" fill="#38bdf8" stroke="#ffffff" stroke-width="1.2"/>
      </svg>
    `;
  }

  el.innerHTML = `
    ${svgHtml}
    <div class="civil-marker-tooltip">${properties.location} · ${properties.venue}</div>
  `;

  return el;
}

/**
 * Builds HTML content for the interactive popup
 */
function buildPopupHtml(properties) {
  const cd = getCountdownParts(new Date(properties.targetDate).getTime());

  let badgeClass = 'civil-badge-blue';
  if (properties.category === 'confirmed') badgeClass = 'civil-badge-red';
  if (properties.category === 'ovl_uck') badgeClass = 'civil-badge-purple';

  let sevClass = 'sev-medium';
  if (properties.severity === 'high') sevClass = 'sev-high';
  if (properties.severity === 'elevated') sevClass = 'sev-elevated';

  return `
    <div class="civil-popup-card status-${properties.category}" id="popup-${properties.id}">
      <button type="button" class="civil-popup-close-btn" onclick="if (window.CivilUnrestMap && typeof window.CivilUnrestMap.closeActivePopup === 'function') window.CivilUnrestMap.closeActivePopup();" title="Close popup">✕</button>
      <div class="civil-popup-header">
        <div class="civil-popup-tags">
          <span class="civil-badge ${badgeClass}">
            <span class="civil-badge-dot"></span>
            <span>${properties.statusLabel}</span>
          </span>
          <span class="civil-popup-severity ${sevClass}">${properties.severity.toUpperCase()} ALERT</span>
        </div>
      </div>

      <div class="civil-popup-title-row">
        <div class="civil-popup-title">
          <span class="civil-popup-loc-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          </span>
          <span>${properties.location.toUpperCase()}</span>
        </div>
      </div>

      <div class="civil-popup-venue">
        <span class="civil-popup-venue-icon">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 2l10 8H2l10-8z"/></svg>
        </span>
        <span>${properties.venue}</span>
      </div>

      <!-- Real-time Countdown Block -->
      <div class="civil-popup-countdown-box">
        <div class="civil-countdown-meta">
          <span>HAGUE VERDICT COUNTDOWN</span>
          <span class="civil-countdown-meta-tag">10:00 CET</span>
        </div>
        <div class="civil-popup-timer-digits" id="popupCountdownDisplay" data-target="${properties.targetDate}">
          ${cd.formatted}
        </div>
      </div>

      <!-- Operational Telemetry Grid -->
      <div class="civil-popup-grid">
        <div class="civil-grid-item">
          <div class="civil-grid-lbl">MUNICIPALITY</div>
          <div class="civil-grid-val">${properties.municipality || properties.location}</div>
        </div>
        <div class="civil-grid-item">
          <div class="civil-grid-lbl">EST. CROWD</div>
          <div class="civil-grid-val">${properties.crowdEstimate || 'Announced'}</div>
        </div>
      </div>

      <div class="civil-popup-notes">
        ${properties.tacticalNotes}
      </div>

      <div class="civil-popup-footer">
        <div class="civil-popup-coords">
          #${properties.order} · WGS84
        </div>
        <button type="button" class="civil-popup-fly-btn" onclick="window.CivilUnrestMap.flyToGathering('${properties.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M22 12h-4M6 12H2M12 6V2M12 22v-4"/></svg>
          <span>Center & Zoom</span>
        </button>
      </div>
    </div>
  `;
}

function closeActivePopup() {
  if (state.activePopup) {
    try {
      if (typeof state.activePopup.remove === 'function') {
        state.activePopup.remove();
      } else if (state.map && typeof state.map.closePopup === 'function') {
        state.map.closePopup(state.activePopup);
      }
    } catch (e) {}
    state.activePopup = null;
  }
  if (state.popupIntervalId) {
    clearInterval(state.popupIntervalId);
    state.popupIntervalId = null;
  }
  state.markers.forEach(m => {
    if (m.element) {
      m.element.classList.remove('active');
    }
  });
}

/**
 * Smoothly centers and zooms the map onto the target gathering
 */
function flyToGathering(gatheringId) {
  const feat = state.geoJsonData.features.find(f => f.properties.id === gatheringId);
  if (!feat) return;

  const [lng, lat] = feat.geometry.coordinates;
  state.selectedId = gatheringId;

  // Highlight table row if rendered
  document.querySelectorAll('.civil-row').forEach(row => {
    row.classList.toggle('selected', row.dataset.id === gatheringId);
  });

  // Center & zoom map (Supports MapLibre GL JS and Leaflet)
  if (state.map) {
    if (typeof state.map.flyTo === 'function') {
      if (state.map.easeTo || state.map._canvas) {
        // MapLibre GL JS - Exact zoom: 13, essential: true
        state.map.flyTo({
          center: [lng, lat],
          zoom: 13,
          essential: true
        });
      } else {
        // Leaflet
        state.map.flyTo([lat, lng], 13, { duration: 1.2 });
      }
    } else if (typeof state.map.setView === 'function') {
      state.map.setView([lat, lng], 13);
    }
  }

  // Open marker popup
  const targetMarkerObj = state.markers.find(m => m.id === gatheringId);
  if (targetMarkerObj) {
    openMarkerPopup(targetMarkerObj);
  }
}

/**
 * Opens and manages the popup lifecycle with dynamic countdown ticker
 */
function openMarkerPopup(markerObj) {
  const { marker, feature, lngLat } = markerObj;
  const p = feature.properties;
  const html = buildPopupHtml(p);

  // Clear previous popup interval
  if (state.popupIntervalId) {
    clearInterval(state.popupIntervalId);
    state.popupIntervalId = null;
  }

  closeActivePopup();

  // Update active marker styling
  state.selectedId = p.id;
  state.markers.forEach(m => {
    if (m.element) {
      m.element.classList.toggle('active', m.id === p.id);
    }
  });

  const maplibreglLib = state.maplibregl || (typeof window !== 'undefined' ? (window.maplibregl || window.maplibreglGlobal) : null);

  // Open in MapLibre or Leaflet
  if (maplibreglLib && state.map && (state.map._canvas || state.map.flyTo)) {
    const categoryClass = `status-${p.category}`;
    const popup = new maplibreglLib.Popup({
      offset: 16,
      closeButton: false,
      closeOnClick: true,
      className: `civil-unrest-maplibre-popup ${categoryClass}`
    })
      .setLngLat(lngLat)
      .setHTML(html)
      .addTo(state.map);

    state.activePopup = popup;

    if (typeof popup.on === 'function') {
      popup.on('close', () => {
        closeActivePopup();
      });
    }
  } else if (marker && typeof marker.bindPopup === 'function') {
    // Leaflet marker
    marker.bindPopup(html, { className: 'civil-unrest-leaflet-popup', offset: [0, -10], closeButton: false }).openPopup();
    state.activePopup = marker.getPopup();
  } else if (typeof window !== 'undefined' && typeof window.openMapPopup === 'function') {
    // KOSINT global popup helper
    window.openMapPopup(lngLat, html);
  }

  // Start real-time popup countdown interval
  state.popupIntervalId = setInterval(() => {
    const timerEl = document.getElementById('popupCountdownDisplay');
    if (!timerEl) {
      clearInterval(state.popupIntervalId);
      state.popupIntervalId = null;
      return;
    }
    const target = timerEl.dataset.target ? new Date(timerEl.dataset.target).getTime() : HAGUE_VERDICT_TARGET_TIME;
    const cd = getCountdownParts(target);
    timerEl.textContent = cd.formatted;
  }, 1000);
}

/**
 * Renders all markers on the map
 */
function renderMarkers() {
  // Clear existing
  state.markers.forEach(m => {
    if (m.marker && typeof m.marker.remove === 'function') {
      m.marker.remove();
    }
  });
  state.markers = [];
  if (typeof window !== 'undefined') {
    window.civilUnrestMarkersGroup = [];
  }

  if (!state.map) return;

  const maplibreglLib = state.maplibregl || (typeof window !== 'undefined' ? (window.maplibregl || window.maplibreglGlobal) : null);

  state.geoJsonData.features.forEach(feature => {
    const p = feature.properties;
    const coords = feature.geometry.coordinates; // [lng, lat]
    const markerEl = createCivilMarkerElement(p);

    // Click handler on marker element
    markerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      flyToGathering(p.id);
    });

    let markerInstance = null;

    // MapLibre GL JS marker
    if (maplibreglLib && state.map && (state.map._canvas || state.map.flyTo)) {
      markerInstance = new maplibreglLib.Marker({
        element: markerEl,
        anchor: 'center'
      })
        .setLngLat(coords)
        .addTo(state.map);
    } else if (typeof window !== 'undefined' && window.L && state.map) {
      // Leaflet marker
      const icon = window.L.divIcon({
        html: markerEl,
        className: 'civil-leaflet-div-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      markerInstance = window.L.marker([coords[1], coords[0]], { icon }).addTo(state.map);
    }

    const markerItem = {
      id: p.id,
      feature,
      lngLat: coords,
      element: markerEl,
      marker: markerInstance
    };

    state.markers.push(markerItem);
    if (typeof window !== 'undefined' && window.civilUnrestMarkersGroup) {
      window.civilUnrestMarkersGroup.push(markerInstance || markerItem);
    }
  });

  applyFilters();
}

/**
 * Filter gatherings by category or keyword
 */
function filterGatherings(category = 'all', query = '') {
  state.currentFilter = category;
  state.searchQuery = (query || '').toLowerCase().trim();
  applyFilters();
}

/**
 * Applies active category and search filter to markers and widget list
 */
function applyFilters() {
  const cat = state.currentFilter;
  const q = state.searchQuery;

  // Filter markers on the map
  state.markers.forEach(m => {
    const p = m.feature.properties;
    const matchesCat = (cat === 'all') || (p.category === cat);
    const matchesSearch = !q ||
      p.location.toLowerCase().includes(q) ||
      p.venue.toLowerCase().includes(q) ||
      p.statusLabel.toLowerCase().includes(q);

    const isVisible = state.visible && matchesCat && matchesSearch;

    if (m.element) {
      m.element.style.display = isVisible ? 'flex' : 'none';
      if (m.element.parentElement && m.element.parentElement.classList.contains('maplibregl-marker')) {
        m.element.parentElement.style.display = isVisible ? '' : 'none';
      }
    }
    if (m.marker && typeof m.marker.getElement === 'function') {
      const parentEl = m.marker.getElement();
      if (parentEl) {
        parentEl.style.display = isVisible ? '' : 'none';
      }
    }
  });

  // Re-render sidebar widget table if present
  renderWidgetTable();
}

/**
 * Toggle layer visibility
 */
function toggleCivilUnrestLayer(visible) {
  state.visible = (visible !== undefined) ? visible : !state.visible;
  if (!state.visible && state.activePopup) {
    if (typeof state.activePopup.remove === 'function') state.activePopup.remove();
    state.activePopup = null;
  }
  applyFilters();
  return state.visible;
}

/**
 * Builds and renders the Dashboard Sidebar Widget
 * @param {string|HTMLElement} container Selector or element
 */
function renderCivilUnrestWidget(container) {
  const target = typeof container === 'string' ? document.querySelector(container) : container;
  if (!target) return;

  const cd = getCountdownParts();
  const total = state.geoJsonData.features.length;
  const confirmedCount = state.geoJsonData.features.filter(f => f.properties.category === 'confirmed').length;
  const countdownCount = state.geoJsonData.features.filter(f => f.properties.category === 'countdown').length;
  const ovlCount = state.geoJsonData.features.filter(f => f.properties.category === 'ovl_uck').length;

  target.innerHTML = `
    <div class="civil-unrest-widget">
      <!-- ── Global Countdown Banner ────────────────────────────────────────── -->
      <div class="civil-countdown-banner">
        <div class="civil-banner-top">
          <div class="civil-banner-tag">
            <span class="civil-banner-live-dot"></span>
            <span>HAGUE VERDICT · D-DAY COUNTDOWN</span>
          </div>
          <span class="civil-banner-ref">16 SEPT 2026 · 10:00 CET</span>
        </div>

        <div class="civil-banner-title">SPECIALIST CHAMBERS JUDGMENT</div>
        <div class="civil-banner-case">
          Case: <strong>Hashim Thaçi, Kadri Veseli, Jakup Krasniqi, Rexhep Selimi</strong>
        </div>

        <!-- Big Monospace 4-Unit Digital Clock -->
        <div class="civil-countdown-clock-grid" id="civilGlobalCountdownGrid">
          <div class="civil-clock-cell">
            <span class="civil-clock-number" id="civilClockDays">${cd.days}</span>
            <span class="civil-clock-label">DAYS</span>
          </div>
          <div class="civil-clock-cell">
            <span class="civil-clock-number" id="civilClockHours">${cd.hours}</span>
            <span class="civil-clock-label">HOURS</span>
          </div>
          <div class="civil-clock-cell">
            <span class="civil-clock-number" id="civilClockMinutes">${cd.minutes}</span>
            <span class="civil-clock-label">MINUTES</span>
          </div>
          <div class="civil-clock-cell">
            <span class="civil-clock-number" id="civilClockSeconds">${cd.seconds}</span>
            <span class="civil-clock-label">SECONDS</span>
          </div>
        </div>

        <!-- Operational Summary Bar -->
        <div class="civil-banner-stats">
          <span class="civil-stat-item stat-red">★ ${confirmedCount} Confirmed Viewing</span>
          <span class="civil-stat-item stat-blue">◎ ${countdownCount} Countdown Screens</span>
          <span class="civil-stat-item stat-purple">◉ ${ovlCount} OVL-UÇK Branch</span>
        </div>
      </div>

      <!-- ── Filter & Search Toolbar ──────────────────────────────────────── -->
      <div class="civil-toolbar">
        <div class="civil-filter-pills">
          <button type="button" class="civil-filter-btn active" data-filter="all" onclick="window.CivilUnrestMap.setFilter('all')">
            All (${total})
          </button>
          <button type="button" class="civil-filter-btn filter-confirmed" data-filter="confirmed" onclick="window.CivilUnrestMap.setFilter('confirmed')">
            ★ Confirmed Viewing (${confirmedCount})
          </button>
          <button type="button" class="civil-filter-btn" data-filter="countdown" onclick="window.CivilUnrestMap.setFilter('countdown')">
            ◎ Screens (${countdownCount})
          </button>
          <button type="button" class="civil-filter-btn filter-ovl" data-filter="ovl_uck" onclick="window.CivilUnrestMap.setFilter('ovl_uck')">
            ◉ OVL-UÇK (${ovlCount})
          </button>
        </div>

        <div class="civil-search-wrap">
          <span class="civil-search-icon">🔍</span>
          <input type="text" id="civilSearchInput" class="civil-search-input"
            placeholder="Search town, square, or status..."
            oninput="window.CivilUnrestMap.setSearch(this.value)" />
          <button type="button" class="civil-search-clear" id="civilSearchClear"
            onclick="window.CivilUnrestMap.clearSearch()" style="display:none">✕</button>
        </div>
      </div>

      <!-- ── Gathering Table List ─────────────────────────────────────────── -->
      <div class="civil-list-container" id="civilListContainer">
        <!-- Rendered by renderWidgetTable() -->
      </div>
    </div>
  `;

  renderWidgetTable();
  startGlobalCountdown();
}

/**
 * Renders the rows inside the sidebar widget table
 */
function renderWidgetTable() {
  const container = document.getElementById('civilListContainer');
  if (!container) return;

  const cat = state.currentFilter;
  const q = state.searchQuery;

  const filtered = state.geoJsonData.features.filter(f => {
    const p = f.properties;
    const matchesCat = (cat === 'all') || (p.category === cat);
    const matchesSearch = !q ||
      p.location.toLowerCase().includes(q) ||
      p.venue.toLowerCase().includes(q) ||
      p.statusLabel.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="civil-empty-state">
        <div>No public gatherings match your active filter.</div>
      </div>
    `;
    return;
  }

  let rowsHtml = '';
  filtered.forEach(feat => {
    const p = feat.properties;
    const isSelected = p.id === state.selectedId;

    let badgeMarkup = `<span class="civil-badge civil-badge-blue" title="Ora e Pritjes (Countdown Screen)"><span class="civil-badge-dot"></span> Ora e Pritjes</span>`;
    if (p.category === 'confirmed') {
      badgeMarkup = `<span class="civil-badge civil-badge-red" title="Confirmed public viewing on 16 September"><span class="civil-badge-dot"></span> Confirmed</span>`;
    } else if (p.category === 'ovl_uck') {
      badgeMarkup = `<span class="civil-badge civil-badge-purple" title="OVL-UÇK Veteran Branch"><span class="civil-badge-dot"></span> OVL-UÇK</span>`;
    }

    let symbolIcon = '◎';
    if (p.symbolType === 'star-circle') symbolIcon = '★';
    if (p.symbolType === 'purple-ring') symbolIcon = '◉';

    rowsHtml += `
      <tr class="civil-row ${isSelected ? 'selected' : ''}" data-id="${p.id}" onclick="window.CivilUnrestMap.flyToGathering('${p.id}')">
        <td class="civil-cell-num">${p.order}</td>
        <td class="civil-cell-loc-td">
          <div class="civil-cell-loc">
            <span>${symbolIcon}</span>
            <span>${p.location}</span>
          </div>
        </td>
        <td class="civil-cell-venue-td">
          <div class="civil-cell-venue" title="${p.venue}">${p.venue}</div>
        </td>
        <td class="civil-cell-status-td">
          ${badgeMarkup}
        </td>
        <td class="civil-cell-fly-td">
          <button type="button" class="civil-fly-btn" title="Fly to ${p.location}"
            onclick="event.stopPropagation(); window.CivilUnrestMap.flyToGathering('${p.id}')">
            ⌖ Fly
          </button>
        </td>
      </tr>
    `;
  });

  container.innerHTML = `
    <table class="civil-table">
      <thead>
        <tr>
          <th class="col-num">#</th>
          <th class="col-loc">Location</th>
          <th class="col-venue">Venue</th>
          <th class="col-status">Status</th>
          <th class="col-fly">Map</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
}

/**
 * Starts the global countdown interval timer
 */
function startGlobalCountdown() {
  if (state.bannerIntervalId) clearInterval(state.bannerIntervalId);

  state.bannerIntervalId = setInterval(() => {
    const cd = getCountdownParts();
    const dEl = document.getElementById('civilClockDays');
    const hEl = document.getElementById('civilClockHours');
    const mEl = document.getElementById('civilClockMinutes');
    const sEl = document.getElementById('civilClockSeconds');

    if (dEl) dEl.textContent = cd.days;
    if (hEl) hEl.textContent = cd.hours;
    if (mEl) mEl.textContent = cd.minutes;
    if (sEl) sEl.textContent = cd.seconds;
  }, 1000);
}

/**
 * Sets active filter category
 */
function setFilter(category) {
  state.currentFilter = category;
  document.querySelectorAll('.civil-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === category);
  });
  applyFilters();
}

/**
 * Updates search keyword
 */
function setSearch(query) {
  state.searchQuery = (query || '').toLowerCase().trim();
  const clearBtn = document.getElementById('civilSearchClear');
  if (clearBtn) {
    clearBtn.style.display = query ? 'block' : 'none';
  }
  applyFilters();
}

/**
 * Clears search keyword
 */
function clearSearch() {
  const input = document.getElementById('civilSearchInput');
  if (input) input.value = '';
  setSearch('');
}

/**
 * Primary Initialization Function for Civil Unrest Map Layer
 * @param {Object} map MapLibre or Leaflet map instance
 * @param {Object} options Configuration options
 */
async function initCivilUnrestLayer(map, options = {}) {
  state.map = map;
  state.visible = options.visible ?? false;
  state.maplibregl = options.maplibregl || (typeof window !== 'undefined' ? (window.maplibregl || window.maplibreglGlobal) : null);

  // Try fetching GeoJSON from public/data/civil-unrest.json if in browser HTTP context
  const dataUrl = options.dataUrl || 'data/civil-unrest.json';
  if (typeof fetch === 'function') {
    try {
      const response = await fetch(dataUrl);
      if (response.ok) {
        const json = await response.json();
        if (json && json.features && json.features.length === 15) {
          state.geoJsonData = json;
        }
      }
    } catch (e) {
      // Fallback gracefully to EMBEDDED_CIVIL_UNREST_GEOJSON
      console.warn('[CivilUnrest] Fetching dataset via HTTP failed, using embedded 15-location GeoJSON:', e);
      state.geoJsonData = EMBEDDED_CIVIL_UNREST_GEOJSON;
    }
  }

  // Render tactical markers
  renderMarkers();

  // If container is specified in options, render the sidebar widget automatically
  if (options.container) {
    renderCivilUnrestWidget(options.container);
  }

  return {
    state,
    flyToGathering,
    filterGatherings,
    toggleCivilUnrestLayer,
    renderCivilUnrestWidget,
    getCountdownParts
  };
}

// Module API Object
const CivilUnrestMapModule = {
  initCivilUnrestLayer,
  flyToGathering,
  filterGatherings,
  toggleCivilUnrestLayer,
  renderCivilUnrestWidget,
  getCountdownParts,
  setFilter,
  setSearch,
  clearSearch,
  buildPopupHtml,
  closeActivePopup,
  getGeoJSON: () => state.geoJsonData,
  getState: () => state
};

// Browser Global Attachment
if (typeof window !== 'undefined') {
  window.CivilUnrestMap = CivilUnrestMapModule;
  window.initCivilUnrestLayer = initCivilUnrestLayer;
}

// CommonJS export for Node test runner
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CivilUnrestMapModule;
}

// Standard ESM export
export {
  initCivilUnrestLayer,
  flyToGathering,
  filterGatherings,
  toggleCivilUnrestLayer,
  renderCivilUnrestWidget,
  getCountdownParts,
  setFilter,
  setSearch,
  clearSearch,
  buildPopupHtml,
  closeActivePopup,
  EMBEDDED_CIVIL_UNREST_GEOJSON
};

export default CivilUnrestMapModule;
