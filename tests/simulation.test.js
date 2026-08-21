const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Starting DOM & Runtime Intelligence Simulation ---');

const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');

const BORDER_CROSSING_LOCATIONS = {
  jarinje: { name: 'Jarinje (Border)', lat: 43.2185, lon: 20.6980 }
};

const mockWindow = {
  state: {
    data: {
      news: {
        items: [
          { id: '1', title: 'Aksident trafiku në Mitrovicë', description: 'Dy vetura u përplasën', severity: 'medium' },
          { id: '2', title: 'Traffic normal in Peja', description: 'Clear roads in Peja', severity: 'low' }
        ]
      },
      wildfire: {
        features: [
          { geometry: { coordinates: [20.86, 42.89] }, properties: { frp: 25 } }
        ]
      },
      traffic: {
        incidents: [
          { title: 'Aksident trafiku në Mitrovicë', location: { lat: 42.8914, lon: 20.8660, city: 'Mitrovicë' }, type: 'accident' }
        ]
      }
    },
    borderData: {
      crossings: [
        { id: 'jarinje', name: 'Jarinje (Border)', coordinates: { lat: 43.2185, lon: 20.6980 }, direction: { entry: { waitingMinutes: 45 }, exit: { waitingMinutes: 10 } } }
      ]
    },
    map: {
      getZoom: () => 10,
      project: ([lon, lat]) => ({ x: lon * 10, y: lat * 10 }),
      getSource: () => ({ setData: () => {} }),
      addSource: () => {},
      addLayer: () => {},
      fitBounds: () => {}
    }
  }
};

// Evaluate geocoding
eval(appJs.slice(appJs.indexOf('const KOSOVO_LOCATIONS_GEOCODE ='), appJs.indexOf('async function calculateRoute(')));

console.log('Test A: Geocoding resolution for known Kosovo locations...');
const pr = resolveLocationCoordinates('Prishtinë');
assert(pr && pr.lat && pr.lon, 'Prishtinë must resolve');
console.log(`✓ Prishtinë resolved to [${pr.lat}, ${pr.lon}]`);

const mit = resolveLocationCoordinates('Mitrovicë');
assert(mit && mit.lat && mit.lon, 'Mitrovicë must resolve');
console.log(`✓ Mitrovicë resolved to [${mit.lat}, ${mit.lon}]`);

const coordsDirect = resolveLocationCoordinates('42.50, 20.80');
assert(coordsDirect && coordsDirect.lat === 42.5 && coordsDirect.lon === 20.8, 'Direct coordinates must parse');
console.log('✓ Direct coordinates (42.50, 20.80) correctly parsed');

console.log('Test B: Traffic classification in frontend app.js runtime...');
eval(appJs.slice(appJs.indexOf('const TRAFFIC_RELEVANCE_TERMS ='), appJs.indexOf('function ensureTrafficIncidentLocations(')));

const incident1 = classifyTrafficIncident('Aksident i rëndë trafiku në rrugën Prishtinë - Pejë');
assert(incident1.isTraffic, 'Albanian accident must be classified');
assert.strictEqual(incident1.type, 'accident');

const incident2 = classifyTrafficIncident('Zbog odrona na putu obustavljen saobraćaj');
assert(incident2.isTraffic, 'Serbian road closure / hazard must be classified');
assert.strictEqual(incident2.type, 'road_closure');

const nonIncident = classifyTrafficIncident('Policia arreston personin e kërkuar në Prizren');
assert(!nonIncident.isTraffic, 'Arrest must not be classified as traffic');
console.log('✓ Frontend traffic classification runtime verified');

console.log('Test C: Marker Clustering simulation...');
const state = mockWindow.state;
eval(appJs.slice(appJs.indexOf('function clusterGeoItems('), appJs.indexOf('function createCCTVMarkerElement(')));

const points = [
  { coords: [21.16, 42.66], title: 'Point 1' },
  { coords: [21.17, 42.67], title: 'Point 2' },
  { coords: [20.28, 42.65], title: 'Point 3' }
];

const clusters = clusterGeoItems(points, p => p.coords, 50);
assert(clusters.length < points.length, 'Nearby points must be clustered when zoomed out');
console.log(`✓ Clustered ${points.length} points into ${clusters.length} visual entities`);

console.log('--- ALL RUNTIME SIMULATION TESTS COMPLETED SUCCESSFULLY ---');
