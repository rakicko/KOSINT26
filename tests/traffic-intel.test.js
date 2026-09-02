const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Starting KOSINT Traffic & Route Intelligence Architecture Tests ---');

const { classifyTrafficIncident, extractTrafficIncidents, extractLocation, TRAFFIC_RELEVANCE_TERMS } = require('../skills/traffic-intel/skill');
const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const styleCss = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');

// Test 1: Albanian traffic incident detection
console.log('Test 1: Verifying Albanian traffic incidents detection...');
const sqAccident = classifyTrafficIncident('Aksident trafiku në magjistralen Prishtinë - Ferizaj, dy vetura të përplasura');
assert(sqAccident.isTraffic, 'Albanian accident headline must be detected');
assert.strictEqual(sqAccident.type, 'accident');

const sqClosure = classifyTrafficIncident('Rrugë e bllokuar në dalje të Mitrovicës për shkak të ndërhyrjes');
assert(sqClosure.isTraffic, 'Albanian road closure headline must be detected');
assert.strictEqual(sqClosure.type, 'road_closure');

const sqCongestion = classifyTrafficIncident('Kolona të gjata automjetesh te rrethi kryesor në Prishtinë');
assert(sqCongestion.isTraffic, 'Albanian traffic congestion must be detected');
assert.strictEqual(sqCongestion.type, 'congestion');

const sqHazard = classifyTrafficIncident('Rrëshqitje dheu në rrugën e Pejës, rrezikohet qarkullimi');
assert(sqHazard.isTraffic, 'Albanian landslide hazard must be detected');
assert.strictEqual(sqHazard.type, 'hazard');

const sqRoadworks = classifyTrafficIncident('Punime në rrugë në aksin Podujevë - Prishtinë, devijohet trafiku');
assert(sqRoadworks.isTraffic, 'Albanian roadworks headline must be detected');
assert.strictEqual(sqRoadworks.type, 'roadworks');
console.log('✓ Passed: All Albanian traffic incident types successfully classified');

// Test 2: Serbian traffic incident detection
console.log('Test 2: Verifying Serbian traffic incidents detection...');
const srAccident = classifyTrafficIncident('Teška saobraćajna nesreća kod Zubinog Potoka, udes dva automobila');
assert(srAccident.isTraffic, 'Serbian traffic accident headline must be detected');
assert.strictEqual(srAccident.type, 'accident');

const srClosure = classifyTrafficIncident('Zbog odrona kamena zatvoren put Leposavić - Mitrovica');
assert(srClosure.isTraffic, 'Serbian road closure headline must be detected');
assert.strictEqual(srClosure.type, 'road_closure');

const srCongestion = classifyTrafficIncident('Saobraćajni zastoj i duga kolona vozila na ulazu u grad');
assert(srCongestion.isTraffic, 'Serbian congestion must be detected');
assert.strictEqual(srCongestion.type, 'congestion');

const srRoadworks = classifyTrafficIncident('Radovi na kolovozu u Zvečanu, zatvaranje trake');
assert(srRoadworks.isTraffic, 'Serbian roadworks headline must be detected');
assert.strictEqual(srRoadworks.type, 'roadworks');
console.log('✓ Passed: All Serbian traffic incident types successfully classified');

// Test 3: Unrelated Albanian/Serbian news (must NOT be classified as traffic)
console.log('Test 3: Verifying unrelated Albanian & Serbian news is rejected...');
const unrelatedChurch = classifyTrafficIncident('Ndërtimi i një kishe në Vushtrri vazhdon sipas planit');
assert(!unrelatedChurch.isTraffic, 'Church construction news must NOT be traffic');

const unrelatedRobbery = classifyTrafficIncident('Policia në veri arreston tre persona për vjedhje të rëndë në Leposaviq');
assert(!unrelatedRobbery.isTraffic, 'Robbery arrest news must NOT be traffic');

const unrelatedWorkStop = classifyTrafficIncident('Inspektorati Qendror i Punës ndalon punimet në 12 vendpunishte në Mitrovicë');
assert(!unrelatedWorkStop.isTraffic, 'Work safety inspection must NOT be traffic');

const unrelatedSrTheft = classifyTrafficIncident('Iz kuće u Leposaviću ukradeno 12.000 evra, trojica uhapšena');
assert(!unrelatedSrTheft.isTraffic, 'Serbian theft arrest must NOT be traffic');
console.log('✓ Passed: Non-traffic news correctly rejected');

// Test 4: CRITICAL severity unrelated news (must NOT be classified as traffic)
console.log('Test 4: Verifying CRITICAL non-traffic news is rejected...');
const criticalShooting = classifyTrafficIncident('Pas 11 ditësh arrati, vetëdorëzohen në Polici dy të dyshuarit për gjuajtjen me armë te Qendra Zejtare në Mitrovicë');
assert(!criticalShooting.isTraffic, 'Critical shooting news must NOT become traffic incident');

const criticalSrCrime = classifyTrafficIncident('Uhapšeni osumnjičeni za teška krivična dela u Severnoj Mitrovici');
assert(!criticalSrCrime.isTraffic, 'Critical criminal investigation must NOT become traffic incident');
console.log('✓ Passed: General CRITICAL severity news is NOT forced into traffic');

// Test 5: Article with only a city name (must NOT automatically become traffic)
console.log('Test 5: Verifying city-only news is NOT traffic...');
const cityOnlyNews = classifyTrafficIncident('Vizitë zyrtare e delegacionit ndërkombëtar në Pejë');
assert(!cityOnlyNews.isTraffic, 'Article with only a city name must NOT become traffic');
console.log('✓ Passed: Location mention alone does not produce traffic incident');

// Test 6: Geographic coordinates integrity (no fake markers)
console.log('Test 6: Verifying geographic coordinates & marker filtering...');
const trafficItems = extractTrafficIncidents([
  { id: '1', title: 'Aksident trafiku në Prishtinë', description: 'Ndeshje veturash në Prishtinë' },
  { id: '2', title: 'Aksident komunikacioni me të lënduar', description: 'Përplasje në një rrugë të panjohur pa lokacion' }
]);
assert.strictEqual(trafficItems.length, 2, 'Both traffic events should be extracted');
assert(trafficItems[0].location && trafficItems[0].location.lat === 42.6629, 'Prishtinë location should resolve accurately');
assert.strictEqual(trafficItems[1].location, null, 'Unknown location must remain null (NO fake coordinates)');
console.log('✓ Passed: Exact geographic resolution verified; null locations preserved without fabrication');

// Test 7: Route Intelligence architecture cleanup (no news threat analysis)
console.log('Test 7: Verifying Route Intelligence contains NO threat intelligence or news analysis...');
assert(!indexHtml.includes('id="routeThreatBanner"'), 'index.html must not contain routeThreatBanner');
assert(!indexHtml.includes('THREAT DETECTED NEAR ROUTE'), 'index.html must not contain threat detected header');
assert(!appJs.includes('function analyzeRouteThreats'), 'app.js must not contain analyzeRouteThreats');
assert(!appJs.includes('ROUTE INTERSECTS ACTIVE INCIDENT'), 'app.js must not contain news route threat status');
assert(!styleCss.includes('.route-threat-banner'), 'style.css must not contain route-threat-banner');
assert(appJs.includes('ROUTING SERVICE UNAVAILABLE'), 'app.js must show ROUTING SERVICE UNAVAILABLE when routing fails');
console.log('✓ Passed: Route Intelligence architecture is strictly clean, decoupled from news threat analysis');

// Test 8: Political/institutional dispute rejection & substring location false positive prevention
console.log('Test 8: Verifying political clash rejection & substring location prevention...');
const kpkClash = classifyTrafficIncident(
  'Përplasje në KPK, nuk miratohet raporti për punën e Prokurorisë Speciale',
  'Këshilli Prokurorial i Kosovës, në takimin e 301-të të saj, ka refuzuar miratimin e raportit të punës për Prokurorinë Speciale për vitin 2025.'
);
assert(!kpkClash.isTraffic, 'Political/institutional clash in KPK must NOT be classified as traffic');

const kuvendClash = classifyTrafficIncident('Përplasje në Kuvend mes deputetëve të pozitës dhe opozitës për buxhetin');
assert(!kuvendClash.isTraffic, 'Parliamentary debate clash must NOT be classified as traffic');

const locKpk = extractLocation(
  'Përplasje në KPK, nuk miratohet raporti për punën e Prokurorisë Speciale',
  'Prokuroria Speciale raporton për vitin 2025.'
);
assert.strictEqual(locKpk, null, 'Word "Speciale" must NOT trigger false positive Pejë location via "pec" substring');
console.log('✓ Passed: Political disputes rejected from traffic and location substring false positives prevented');

console.log('--- ALL TRAFFIC & ROUTE INTELLIGENCE TESTS PASSED ---');

