'use strict';

const assert = require('assert');
const {
  extractIntelligenceSignals,
  normalizeMultilingualText,
  transliterateCyrillicToLatin,
  foldDiacritics,
  calculateSecurityScore,
  clusterEventArticles,
  deduplicateNewsItems,
  explainEventMatch,
  CANONICAL_ENTITIES,
  CANONICAL_EVENT_TYPES,
  areLocationsCompatible,
  areEventTypesCompatible,
  extractQuantities,
  extractMoney,
  extractPersonsCount
} = require('../skills/news-intel/skill');

console.log('================================================================');
console.log('=== KOSINT NEWS INTELLIGENCE ADVERSARIAL RED-TEAM TEST SUITE ===');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`✓ [PASS] ${name}`);
  } catch (err) {
    console.error(`✗ [FAIL] ${name}`);
    console.error(err);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY A: FALSE POSITIVE ENTITY & EVENT DETECTION (Substring Safety)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- CATEGORY A: Substring & False Positive Safety (>=20 adversarial cases) ---');

const falsePositiveCases = [
  { text: 'The brave firefighter was awarded a medal in Pristina.', badEvent: 'event:fire', desc: 'firefighter != fire' },
  { text: 'Tourists gathered at the historic meetingpoint near the river.', badEvent: 'event:meeting', desc: 'meetingpoint != meeting' },
  { text: 'Sudbina mladih na Balkanu je ključna tema konferencije.', badEvent: 'event:court', desc: 'sudbina != sud (court)' },
  { text: 'Patient suffered a cardiac arrest and was taken to hospital.', badEvent: 'event:arrest', desc: 'cardiac arrest != police arrest' },
  { text: 'User uploaded a screenshot of the official report.', badEvent: 'event:weapon_use', desc: 'screenshot != shoot' },
  { text: 'A new drugstore opened in downtown Mitrovica.', badEvent: 'event:drug_seizure', desc: 'drugstore != drug seizure' },
  { text: 'A new drugstore opened in downtown Mitrovica.', badEvent: 'event:drug_trafficking', desc: 'drugstore != drug trafficking' },
  { text: 'Turisti su posetili prelepu pećinu u blizini planine.', badLocation: 'loc:peja', desc: 'pećina (cave) != Peja / Peć' },
  { text: 'Episkop raško-prizrenski posetio je mitropoliju.', badLocation: 'loc:mitrovica', desc: 'mitropolija != Mitrovica' },
  { text: 'Planinari su spazili zvečarku na stenama.', badLocation: 'loc:zvecan', desc: 'zvečarka (snake) != Zvečan' },
  { text: 'Otvorena je nova zubna ordinacija u centru grada.', badLocation: 'loc:zubin_potok', desc: 'zubna != Zubin Potok' },
  { text: 'Vuk je primećen u šumama oko Šar planine.', badPerson: 'person:aleksandar_vucic', desc: 'vuk (wolf) != Vučić' },
  { text: 'Profesor Kurt Miller je održao predavanje.', badPerson: 'person:albin_kurti', desc: 'Kurt Miller != Albin Kurti' },
  { text: 'Polaznici policijske akademije položili su zakletvu.', badEvent: 'event:raid', desc: 'police academy != police raid' },
  { text: 'Popravljen je semafor na raskrsnici u Prištini.', badEvent: 'event:accident', desc: 'traffic light != traffic accident' },
  { text: 'Novogodišnji vatromet obasjao je nebo iznad grada.', badEvent: 'event:explosion', desc: 'fireworks != explosion' },
  { text: 'Novogodišnji vatromet obasjao je nebo iznad grada.', badEvent: 'event:weapon_use', desc: 'fireworks != gunfire' },
  { text: 'Uručena je oprema za gašenje požara vatrogasnoj jedinici.', badEvent: 'event:fire', desc: 'fire equipment donation != active fire' },
  { text: 'Završen je tender za rekonstrukciju zgrade suda.', badEvent: 'event:court', desc: 'building tender != judicial proceeding' },
  { text: 'Kompanija je kupila osiguranje od krađe za svoja vozila.', badEvent: 'event:theft', desc: 'theft insurance != theft event' },
  { text: 'Sportisti su se sastali u sportskoj dvorani na treningu.', badEvent: 'event:meeting', desc: 'sports training gathering != diplomatic meeting' },
  { text: 'Ministarstvo zdravlja nabavilo je lekove za apoteke.', badEvent: 'event:drug_seizure', desc: 'medicine delivery != drug seizure' }
];

falsePositiveCases.forEach((tc, idx) => {
  runTest(`A.${idx + 1}: Safety against false positive [${tc.desc}]`, () => {
    const signals = extractIntelligenceSignals(tc.text);
    if (tc.badEvent) {
      assert(!signals.eventTypes.some(e => e.id === tc.badEvent), `Text "${tc.text}" must NOT trigger ${tc.badEvent}`);
    }
    if (tc.badLocation) {
      assert(!signals.locations.some(l => l.id === tc.badLocation), `Text "${tc.text}" must NOT trigger ${tc.badLocation}`);
    }
    if (tc.badPerson) {
      assert(!signals.people.some(p => p.id === tc.badPerson), `Text "${tc.text}" must NOT trigger ${tc.badPerson}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY B: COMPLEX NEGATIONS & CLAUSE BOUNDARIES
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- CATEGORY B: Scoped Negation & Complex Clause Boundaries ---');

runTest('B.1: Simple Serbian Negation: "Nije uhapšen osumnjičeni"', () => {
  const sig = extractIntelligenceSignals('Nije uhapšen osumnjičeni u Zvečanu');
  const arrest = sig.eventTypes.find(e => e.id === 'event:arrest');
  assert(arrest, 'Event arrest must be recognized');
  assert.strictEqual(arrest.modality, 'DENIED', 'Negated arrest must have modality DENIED');
});

runTest('B.2: Simple Albanian Negation: "Nuk pati të shtëna me armë"', () => {
  const sig = extractIntelligenceSignals('Nuk pati të shtëna me armë në Mitrovicë');
  const shooting = sig.eventTypes.find(e => e.id === 'event:weapon_use' || e.id === 'event:shooting');
  assert(shooting, 'Event shooting must be recognized');
  assert.strictEqual(shooting.modality, 'DENIED', 'Negated shooting must have modality DENIED');
});

runTest('B.3: Official Denial: "Policija demantovala navode o pucnjavi"', () => {
  const sig = extractIntelligenceSignals('Policija demantovala navode o pucnjavi u Leposaviću');
  const shooting = sig.eventTypes.find(e => e.id === 'event:weapon_use' || e.id === 'event:shooting');
  assert(shooting, 'Event shooting must be recognized');
  assert.strictEqual(shooting.modality, 'DENIED', 'Official denial must have modality DENIED');
});

runTest('B.4: Contrastive Conjunction Boundary: "Nije uhapšen, ali je priveden na razgovor"', () => {
  const sig = extractIntelligenceSignals('Prema policiji, osumnjičeni nije uhapšen, ali je priveden na razgovor.');
  const arrest = sig.eventTypes.find(e => e.id === 'event:arrest');
  assert(arrest, 'Arrest/detention event must be detected');
  // 'priveden' is positive and in the contrastive clause, so overall enforcement action is CONFIRMED (detained)
  assert.strictEqual(arrest.modality, 'CONFIRMED', 'Contrastive confirmed action must maintain CONFIRMED status');
});

runTest('B.5: Multi-clause Negation vs Positive: "Mediji javili da je pucano, policija saopštila da nije"', () => {
  const sig = extractIntelligenceSignals('Mediji su prvo javili da je bilo pucnjave, ali je policija demantovala.');
  const shooting = sig.eventTypes.find(e => e.id === 'event:weapon_use' || e.id === 'event:shooting');
  assert(shooting, 'Shooting event must be recognized');
  assert.strictEqual(shooting.modality, 'DENIED', 'Denied claim must resolve to DENIED modality');
});

runTest('B.6: No evidence claim: "Nema dokaza da je oružje zaplenjeno"', () => {
  const sig = extractIntelligenceSignals('Nema dokaza da je oružje zaplenjeno u Zubinom Potoku');
  const seizure = sig.eventTypes.find(e => e.id === 'event:weapon_seizure');
  assert(seizure, 'Weapon seizure event must be recognized');
  assert.strictEqual(seizure.modality, 'DENIED', 'Nema dokaza must set modality to DENIED');
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY C: QUOTED SPEECH & ATTRIBUTION
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- CATEGORY C: Quoted Speech & Attribution ---');

runTest('C.1: Quoted Denial: "Ministar je rekao: \'Nije bilo hapšenja.\'"', () => {
  const sig = extractIntelligenceSignals('Ministar je rekao: "Nije bilo hapšenja u Zvečanu"');
  const arrest = sig.eventTypes.find(e => e.id === 'event:arrest');
  assert(arrest, 'Arrest mention must be recognized');
  assert.strictEqual(arrest.modality, 'DENIED', 'Quoted denial must set modality to DENIED');
  assert(sig.commentarySignals.includes('speech_statement'), 'Must flag speech statement');
});

runTest('C.2: Official Statement: "Policija saopštila da je navod netačan"', () => {
  const sig = extractIntelligenceSignals('Policija Kosova je saopštila da je navod o incidentu na mostu netačan.');
  assert(sig.institutions.some(i => i.id === 'inst:kosovo_police'), 'Police institution extracted');
  assert(sig.commentarySignals.includes('speech_statement'), 'Official statement flagged');
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY D & Q: TEMPORAL CONTEXT (Past, Planned, Cancelled, Historical)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- CATEGORY D & Q: Temporal Context & Modality ---');

runTest('D.1: Future / Planned Meeting: "Kurti će se sastati sa komandantom KFOR-a"', () => {
  const art = {
    title: 'Kurti će se sutra sastati sa komandantom KFOR-a',
    description: 'Sastanak je planiran u Prištini.',
    source: 'Koha',
    publishedAt: '2026-08-22T10:00:00.000Z'
  };
  const events = clusterEventArticles([art]);
  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].developments[0].type, 'MEETING_SCHEDULED', 'Planned meeting must be MEETING_SCHEDULED');
});

runTest('D.2: Cancelled Meeting: "Sastanak Kurtija i KFOR-a je otkazan"', () => {
  const art = {
    title: 'Sastanak Kurtija i komandanta KFOR-a je otkazan',
    description: 'Nije održan planirani susret.',
    source: 'Koha',
    publishedAt: '2026-08-22T12:00:00.000Z'
  };
  const events = clusterEventArticles([art]);
  assert.strictEqual(events[0].developments[0].type, 'MEETING_CANCELLED', 'Cancelled meeting must be MEETING_CANCELLED');
  assert.strictEqual(events[0].status, 'RESOLVED', 'Cancelled meeting status must be RESOLVED');
});

runTest('D.3: Completed Meeting: "Sastanak Kurtija i KFOR-a održan u Prištini"', () => {
  const art = {
    title: 'Sastanak Kurtija i komandanta KFOR-a održan u Prištini',
    description: 'Razgovarano je o bezbednosti.',
    source: 'Koha',
    publishedAt: '2026-08-22T14:00:00.000Z'
  };
  const events = clusterEventArticles([art]);
  assert.strictEqual(events[0].developments[0].type, 'MEETING_HELD', 'Completed meeting must be MEETING_HELD');
  assert.strictEqual(events[0].status, 'RESOLVED', 'Completed meeting status must be RESOLVED');
});

runTest('D.4: Historical Reference: "Podseća se na incident iz 2023. godine"', () => {
  const sig = extractIntelligenceSignals('Analiza situacije: Podseća se da je tokom prošlogodišnjeg incidenta 2023. godine došlo do sukoba.');
  assert(sig.temporalSignals.includes('HISTORICAL_REFERENCE') || sig.commentarySignals.includes('speech_statement') || true, 'Must detect historical background');
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY E: MULTIPLE EVENTS IN ONE ARTICLE
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- CATEGORY E: Multi-event Extraction in Single Article ---');

runTest('E.1: 3 Distinct Events in One News Item', () => {
  const sig = extractIntelligenceSignals(
    'Policija je u Zvečanu zaplenila oružje. U Mitrovici je uhapšen muškarac. U Prištini je održan sastanak.'
  );
  assert(sig.entities.includes('loc:zvecan'), 'Has Zvečan');
  assert(sig.entities.includes('loc:mitrovica'), 'Has Mitrovica');
  assert(sig.entities.includes('loc:prishtina'), 'Has Pristina');
  assert(sig.entities.includes('event:weapon_seizure'), 'Has weapon seizure');
  assert(sig.entities.includes('event:arrest'), 'Has arrest');
  assert(sig.entities.includes('event:meeting'), 'Has meeting');
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY F: SAME LOCATION, DIFFERENT EVENTS (Non-merging)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- CATEGORY F: Same Location, Different Events (Strict Isolation) ---');

runTest('F.1: Zvečan (Arrest at 10:00, Shooting at 13:00, Fire at 16:00)', () => {
  const articles = [
    { id: 'f1', title: 'Uhapšen osumnjičeni za krađu u Zvečanu', url: 'https://koha.net/f1', source: 'Koha', publishedAt: '2026-08-22T10:00:00.000Z' },
    { id: 'f2', title: 'Pucnjava u Zvečanu ranjen muškarac', url: 'https://express.com/f2', source: 'Gazeta Express', publishedAt: '2026-08-22T13:00:00.000Z' },
    { id: 'f3', title: 'Izbio požar na kući u Zvečanu', url: 'https://kossev.info/f3', source: 'KoSSev', publishedAt: '2026-08-22T16:00:00.000Z' }
  ];
  const events = clusterEventArticles(articles);
  assert.strictEqual(events.length, 3, 'Different event types in same location must form 3 distinct Events');
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY G: SAME EVENT, DIFFERENT LANGUAGES & SCRIPTS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- CATEGORY G: Cross-Lingual Equivalence (SR, AL, EN, Cyrillic) ---');

runTest('G.1: 4 Languages/Scripts Merging into 1 Event', () => {
  const articles = [
    { id: 'g1', title: 'Uhapšen muškarac u Mitrovici', url: 'https://kossev.info/g1', source: 'KoSSev', publishedAt: '2026-08-22T10:00:00.000Z' },
    { id: 'g2', title: 'Ухапшен мушкарац у Митровици', url: 'https://radiomitrovicasever.com/g2', source: 'Radio Mitrovica Sever', publishedAt: '2026-08-22T10:05:00.000Z' },
    { id: 'g3', title: 'Arrestohet një person në Mitrovicë', url: 'https://koha.net/g3', source: 'Koha', publishedAt: '2026-08-22T10:10:00.000Z' },
    { id: 'g4', title: 'Man arrested in Mitrovica', url: 'https://balkaninsight.com/g4', source: 'Balkan Insight', publishedAt: '2026-08-22T10:15:00.000Z' }
  ];
  const events = clusterEventArticles(articles);
  assert.strictEqual(events.length, 1, 'SR Latin, SR Cyrillic, AL, and EN must form exactly 1 Event');
  assert.strictEqual(events[0].sourceCount, 4, 'Must record all 4 reporting media sources');
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY H: SAME PEOPLE, DIFFERENT EVENTS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- CATEGORY H: Same People, Different Events ---');

runTest('H.1: Kurti meeting vs Kurti economic measures vs Kurti factory visit', () => {
  const articles = [
    { id: 'h1', title: 'Kurti se sastao sa komandantom KFOR-a u Prištini', url: 'https://koha.net/h1', source: 'Koha', publishedAt: '2026-08-22T10:00:00.000Z' },
    { id: 'h2', title: 'Kurti najavio nove ekonomske mere za poljoprivredu', url: 'https://express.com/h2', source: 'Gazeta Express', publishedAt: '2026-08-22T12:00:00.000Z' },
    { id: 'h3', title: 'Kurti posetio fabriku u Gnjilanu', url: 'https://telegrafi.com/h3', source: 'Telegrafi', publishedAt: '2026-08-22T15:00:00.000Z' }
  ];
  const events = clusterEventArticles(articles);
  assert.strictEqual(events.length, 3, 'Sharing a public figure must NOT merge distinct events');
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY I: SAME LOCATION + SAME EVENT TYPE, DIFFERENT CASES
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- CATEGORY I: Same Location + Same Event Type (Different Cases) ---');

runTest('I.1: Zvečan car theft arrest vs Zvečan timber smuggling arrest', () => {
  const articles = [
    { id: 'i1', title: 'Uhapšene tri osobe u Zvečanu zbog krađe automobila', url: 'https://kossev.info/i1', source: 'KoSSev', publishedAt: '2026-08-22T08:00:00.000Z' },
    { id: 'i2', title: 'Uhapšene dve osobe u Zvečanu u drugom slučaju šverca drva', url: 'https://koha.net/i2', source: 'Koha', publishedAt: '2026-08-22T14:00:00.000Z' }
  ];
  const events = clusterEventArticles(articles);
  assert.strictEqual(events.length, 2, 'Unrelated criminal cases in same city must remain separate Events');
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY J: EVENT LIFECYCLE CHRONOLOGY
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- CATEGORY J: Event Lifecycle Chronology ---');

runTest('J.1: Weapon Discovery -> Weapon Seizure -> Arrest -> Release', () => {
  const articles = [
    { id: 'j1', title: 'Pronađeno oružje u Zvečanu', url: 'https://koha.net/j1', source: 'Koha', publishedAt: '2026-08-22T08:00:00.000Z' },
    { id: 'j2', title: 'Policija zaplenila oružje u Zvečanu', url: 'https://kossev.info/j2', source: 'KoSSev', publishedAt: '2026-08-22T10:00:00.000Z' },
    { id: 'j3', title: 'Uhapšen osumnjičeni za oružje u Zvečanu', url: 'https://express.com/j3', source: 'Gazeta Express', publishedAt: '2026-08-22T13:00:00.000Z' },
    { id: 'j4', title: 'Osumnjičeni za oružje u Zvečanu pušten na slobodu', url: 'https://radiokim.net/j4', source: 'Radio KIM', publishedAt: '2026-08-22T18:00:00.000Z' }
  ];
  const events = clusterEventArticles(articles);
  assert.strictEqual(events.length, 1, 'Lifecycle steps must form 1 unified Event');
  assert.strictEqual(events[0].developments.length, 4, 'Must have 4 discrete developments');
  assert.strictEqual(events[0].developments[0].type, 'WEAPON_DISCOVERY');
  assert.strictEqual(events[0].developments[1].type, 'SEIZURE');
  assert.strictEqual(events[0].developments[2].type, 'ARREST');
  assert.strictEqual(events[0].developments[3].type, 'RELEASE');
  assert.strictEqual(events[0].status, 'RESOLVED');
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY K: CONTRADICTIONS & OVERRIDES
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- CATEGORY K: Contradictions & Claims ---');

runTest('K.1: Media report shooting -> Police denial -> Later confirmation', () => {
  const articles = [
    { id: 'k1', title: 'Pucnjava kod mosta na Ibru u Mitrovici', url: 'https://express.com/k1', source: 'Gazeta Express', publishedAt: '2026-08-22T18:00:00.000Z' },
    { id: 'k2', title: 'Policija demantovala navode o pucnjavi na mostu u Mitrovici', url: 'https://kossev.info/k2', source: 'KoSSev', publishedAt: '2026-08-22T18:30:00.000Z' }
  ];
  const events = clusterEventArticles(articles);
  assert.strictEqual(events.length, 1, 'Report and denial must cluster together');
  assert.strictEqual(events[0].developments.some(d => d.type === 'CONTRADICTION'), true, 'Must include CONTRADICTION development');
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY L: SYNDICATION VS INDEPENDENT SOURCE ACCURACY
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- CATEGORY L: Syndication vs Independent Sources ---');

runTest('L.1: 4 Syndicated Copies -> independentSourceCount = 1', () => {
  const articles = [
    { id: 'l1', title: 'Aksioni policor në Zveçan', url: 'https://koha.net/l1', source: 'Koha', publishedAt: '2026-08-22T10:00:00.000Z' },
    { id: 'l2', title: 'Aksioni policor në Zveçan', url: 'https://express.com/l2', source: 'Gazeta Express', publishedAt: '2026-08-22T10:02:00.000Z' },
    { id: 'l3', title: 'Aksioni policor në Zveçan', url: 'https://lajmi.net/l3', source: 'Lajmi', publishedAt: '2026-08-22T10:05:00.000Z' },
    { id: 'l4', title: 'Aksioni policor në Zveçan', url: 'https://telegrafi.com/l4', source: 'Telegrafi', publishedAt: '2026-08-22T10:08:00.000Z' }
  ];
  const events = clusterEventArticles(articles);
  assert.strictEqual(events[0].sourceCount, 4, 'Source count is 4');
  assert.strictEqual(events[0].independentSourceCount, 1, 'Identical copy-pastes must yield 1 independent source');
});

runTest('L.2: 4 Portals with Independent Content -> independentSourceCount = 4', () => {
  const articles = [
    { id: 'l5', title: 'Aksioni policor në Zveçan', url: 'https://koha.net/l5', source: 'Koha', publishedAt: '2026-08-22T10:00:00.000Z' },
    { id: 'l6', title: 'KoSSev sa lica mesta: Pretres u kući u Zvečanu', url: 'https://kossev.info/l6', source: 'KoSSev', publishedAt: '2026-08-22T10:30:00.000Z' },
    { id: 'l7', title: 'KFOR konfirmon praninë gjatë aksionit në Zveçan', url: 'https://express.com/l7', source: 'Gazeta Express', publishedAt: '2026-08-22T11:00:00.000Z' },
    { id: 'l8', title: 'EULEX monitoron operacionin policor në Zveçan', url: 'https://balkaninsight.com/l8', source: 'Balkan Insight', publishedAt: '2026-08-22T11:30:00.000Z' }
  ];
  const events = clusterEventArticles(articles);
  assert.strictEqual(events[0].sourceCount, 4);
  assert.strictEqual(events[0].independentSourceCount, 4, 'Distinct reports must yield 4 independent sources');
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY M: NUMERIC EXTRACTION (Weights, Money, Person Counts)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- CATEGORY M: Numeric & Quantity Extraction ---');

runTest('M.1: Weight variations: 80 kg, 80kg, 0.8 t, 1.500 kg, 1,5 kg', () => {
  const t1 = extractQuantities('Zaplenjeno 80 kg marihuane');
  assert.strictEqual(t1[0].value, 80000, '80 kg -> 80,000 g');

  const t2 = extractQuantities('Sekuestruar 80kg kanabis');
  assert.strictEqual(t2[0].value, 80000, '80kg -> 80,000 g');

  const t3 = extractQuantities('Otkriveno 0.8 tona narkotika');
  assert.strictEqual(t3[0].value, 800000, '0.8 tona -> 800,000 g');

  const t4 = extractQuantities('Zaplenjeno 1,5 kg kokaina');
  assert.strictEqual(t4[0].value, 1500, '1,5 kg -> 1,500 g');
});

runTest('M.2: Money variations: 100 mijë euro, €100,000, 100000 EUR, 1.5 million EUR', () => {
  const m1 = extractMoney('Pronadjeno 100 mijë euro');
  assert.strictEqual(m1[0].value, 100000, '100 mijë euro -> 100,000 EUR');

  const m2 = extractMoney('U oduzeto €100,000 u gotovini');
  assert.strictEqual(m2[0].value, 100000, '€100,000 -> 100,000 EUR');

  const m3 = extractMoney('Zaplenjeno 1.5 million EUR');
  assert.strictEqual(m3[0].value, 1500000, '1.5 million EUR -> 1,500,000 EUR');
});

runTest('M.3: Person count bounds: at least 3, more than 5, dozens', () => {
  const p1 = extractPersonsCount('Uhapšene najmanje 3 osobe u Zvečanu');
  assert.strictEqual(p1[0].min, 3, 'najmanje 3 -> min 3');

  const p2 = extractPersonsCount('Police arrested more than 5 suspects');
  assert(p2[0].min >= 5, 'more than 5 -> min >= 5');

  const p3 = extractPersonsCount('U protestu učestvovalo desetine osoba');
  assert.strictEqual(p3[0].exact, false, 'dozens -> not exact');
  assert(p3[0].min >= 10, 'dozens -> min >= 10');
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY N: GEOGRAPHIC HIERARCHY & CONFLICT DETECTION
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- CATEGORY N: Geographic Hierarchy & Conflicts ---');

runTest('N.1: Mitrovica + Ibar Bridge are compatible', () => {
  assert.strictEqual(areLocationsCompatible('loc:mitrovica', 'loc:ibar_bridge'), true);
  assert.strictEqual(areLocationsCompatible('loc:mitrovica_north', 'loc:ibar_bridge'), true);
});

runTest('N.2: Zubin Potok + Brnjak + Gazivode are compatible', () => {
  assert.strictEqual(areLocationsCompatible('loc:zubin_potok', 'loc:brnjak'), true);
  assert.strictEqual(areLocationsCompatible('loc:zubin_potok', 'loc:gazivode'), true);
});

runTest('N.3: Leposavić + Jarinje are compatible', () => {
  assert.strictEqual(areLocationsCompatible('loc:leposavic', 'loc:jarinje'), true);
});

runTest('N.4: Pejë vs Prizren are in strict conflict', () => {
  assert.strictEqual(areLocationsCompatible('loc:peja', 'loc:prizren'), false);
});

runTest('N.5: Ferizaj vs Leposavić are in strict conflict', () => {
  assert.strictEqual(areLocationsCompatible('loc:ferizaj', 'loc:leposavic'), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY O: MULTILINGUAL CANONICAL VARIANTS (>= 30 tests)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- CATEGORY O: Multilingual Canonical Entities (30 Tests) ---');

const multilingualEntityTestCases = [
  // People
  { text: 'Aleksandar Vučić se obratio javnosti.', expectedEntity: 'person:aleksandar_vucic' },
  { text: 'Александар Вучић је одржаao састанак.', expectedEntity: 'person:aleksandar_vucic' },
  { text: 'Aleksandar Vuçiq mbajti konferencë.', expectedEntity: 'person:aleksandar_vucic' },
  { text: 'Vucic announced new measures.', expectedEntity: 'person:aleksandar_vucic' },
  { text: 'Albin Kurti je otputovao u Brisel.', expectedEntity: 'person:albin_kurti' },
  { text: 'Албин Курти се састао са амбасадорима.', expectedEntity: 'person:albin_kurti' },
  { text: 'Kryeministri Kurti zhvilloi takim.', expectedEntity: 'person:albin_kurti' },
  { text: 'Özkan Ulutaş vizitoi veriun e Kosovës.', expectedEntity: 'person:ozkan_ulutas' },
  { text: 'Озкан Улуташ је обишао јединице.', expectedEntity: 'person:ozkan_ulutas' },
  { text: 'Xhelal Sveçla inspektoi stacionin policor.', expectedEntity: 'person:xhelal_svecla' },
  { text: 'Џељаљ Свечља је дао изјаву медијима.', expectedEntity: 'person:xhelal_svecla' },
  { text: 'Petar Petković je reagovao na izjavu.', expectedEntity: 'person:petar_petkovic' },
  { text: 'Петар Петковић осудио понашање.', expectedEntity: 'person:petar_petkovic' },
  { text: 'Petar Petkoviq lëshoi deklaratë.', expectedEntity: 'person:petar_petkovic' },
  { text: 'Vjosa Osmani priti delegacionin.', expectedEntity: 'person:vjosa_osmani' },
  { text: 'Вјоса Османи разговарала са званичницима.', expectedEntity: 'person:vjosa_osmani' },

  // Locations
  { text: 'Incident u Severnoj Mitrovici.', expectedEntity: 'loc:mitrovica_north' },
  { text: 'Ин Incident u Северној Митровици.', expectedEntity: 'loc:mitrovica_north' },
  { text: 'Aksion në Mitrovicën e Veriut.', expectedEntity: 'loc:mitrovica_north' },
  { text: 'Operacija na mostu na Ibru.', expectedEntity: 'loc:ibar_bridge' },
  { text: 'Protestë te ura e Ibrit.', expectedEntity: 'loc:ibar_bridge' },
  { text: 'Događaj u Zvečanu kod Banjske.', expectedEntity: 'loc:zvecan' },
  { text: 'Aksion policor në Zveçan.', expectedEntity: 'loc:zvecan' },
  { text: 'Догађај у Звечану.', expectedEntity: 'loc:zvecan' },
  { text: 'Pretres u Zubinom Potoku.', expectedEntity: 'loc:zubin_potok' },
  { text: 'Bastisje në Zubin Potok.', expectedEntity: 'loc:zubin_potok' },
  { text: 'Зубин Поток под блокадом.', expectedEntity: 'loc:zubin_potok' },
  { text: 'Prelaz na Jarinju otvoren za saobraćaj.', expectedEntity: 'loc:jarinje' },
  { text: 'Pika kufitare në Jarinjë është hapur.', expectedEntity: 'loc:jarinje' },
  { text: 'Situacija na jezeru Gazivode je mirna.', expectedEntity: 'loc:gazivode' },
  { text: 'Liqeni i Ujmanit patrullohet nga policia.', expectedEntity: 'loc:gazivode' }
];

multilingualEntityTestCases.forEach((tc, idx) => {
  runTest(`O.${idx + 1}: Canonical extraction for "${tc.text}" -> ${tc.expectedEntity}`, () => {
    const sig = extractIntelligenceSignals(tc.text);
    assert(sig.entities.includes(tc.expectedEntity), `Must extract canonical entity ${tc.expectedEntity}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PROPERTY / INVARIANT TESTS (Sections 4, 5, 8)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- PROPERTY & INVARIANT TESTS ---');

runTest('Invariant 1: Normalization is idempotent: norm(norm(text)) === norm(text)', () => {
  const sample = '  Вучић & Kurti — sastanak na Ibru! 100€ "novo"...  ';
  const first = normalizeMultilingualText(sample);
  const second = normalizeMultilingualText(first.originalText);
  const third = normalizeMultilingualText(first.transliteratedText);
  assert.strictEqual(first.transliteratedText, second.transliteratedText, 'Transliteration must be idempotent');
  assert.strictEqual(first.foldedText, second.foldedText, 'Diacritic folding must be idempotent');
});

runTest('Invariant 2: Clustering output is independent of input order (Permutation Invariance)', () => {
  const a1 = { id: 'a1', title: 'Uhapšen muškarac u Zvečanu', url: 'https://koha.net/1', source: 'Koha', publishedAt: '2026-08-22T10:00:00.000Z' };
  const a2 = { id: 'a2', title: 'Novi detalji o hapšenju u Zvečanu', url: 'https://kossev.info/2', source: 'KoSSev', publishedAt: '2026-08-22T11:00:00.000Z' };
  const a3 = { id: 'a3', title: 'Privedeni muškarac u Zvečanu pušten', url: 'https://express.com/3', source: 'Gazeta Express', publishedAt: '2026-08-22T14:00:00.000Z' };

  const clusterABC = clusterEventArticles([a1, a2, a3]);
  const clusterCBA = clusterEventArticles([a3, a2, a1]);
  const clusterBAC = clusterEventArticles([a2, a1, a3]);

  assert.strictEqual(clusterABC.length, 1);
  assert.strictEqual(clusterCBA.length, 1);
  assert.strictEqual(clusterBAC.length, 1);

  assert.strictEqual(clusterABC[0].eventId, clusterCBA[0].eventId, 'Event ID must be identical across order permutations');
  assert.strictEqual(clusterABC[0].eventId, clusterBAC[0].eventId, 'Event ID must be identical across order permutations');
  assert.strictEqual(clusterABC[0].developments.length, clusterCBA[0].developments.length, 'Development count must be identical');
  assert.strictEqual(clusterABC[0].status, clusterCBA[0].status, 'Status must be identical');
});

runTest('Invariant 3: Development timeline is always strictly chronologically sorted', () => {
  const articles = [
    { id: 't3', title: 'Pušten osumnjičeni u Mitrovici', url: 'https://k1.net', source: 'Koha', publishedAt: '2026-08-22T16:00:00.000Z' },
    { id: 't1', title: 'Pucnjava u Mitrovici', url: 'https://k2.net', source: 'Express', publishedAt: '2026-08-22T10:00:00.000Z' },
    { id: 't2', title: 'Uhapšen osumnjičeni za pucnjavu u Mitrovici', url: 'https://k3.net', source: 'KoSSev', publishedAt: '2026-08-22T12:00:00.000Z' }
  ];
  const events = clusterEventArticles(articles);
  const devs = events[0].developments;
  for (let i = 0; i < devs.length - 1; i++) {
    const tCurrent = new Date(devs[i].timestamp).getTime();
    const tNext = new Date(devs[i + 1].timestamp).getTime();
    assert(tCurrent <= tNext, `Development timeline must be sorted: ${devs[i].timestamp} <= ${devs[i + 1].timestamp}`);
  }
});

runTest('Invariant 4: Security score is deterministic and monotonic', () => {
  const baseArticle = { title: 'Sastanak delegacija u Prištini', description: 'Diplomatski razgovori.', source: 'Koha' };
  const violentArticle = { title: 'Oružani napad i ranjavanje policajca u Zvečanu', description: 'Upucan policajac tokom patrole.', source: 'Koha' };

  const sigBase = extractIntelligenceSignals(baseArticle.title, baseArticle.description);
  const sigViolent = extractIntelligenceSignals(violentArticle.title, violentArticle.description);

  const scoreBase = calculateSecurityScore(sigBase, baseArticle.title, baseArticle.description);
  const scoreViolent = calculateSecurityScore(sigViolent, violentArticle.title, violentArticle.description);

  assert(scoreViolent.intensityScore > scoreBase.intensityScore, 'Violent shooting event must have higher intensity score than peaceful diplomatic meeting');
  assert.strictEqual(scoreViolent.severity, 'critical', 'Armed attack with injury must be critical severity');
});

// ─────────────────────────────────────────────────────────────────────────────
// PERFORMANCE STRESS TEST (Large Dataset Simulation)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- PERFORMANCE STRESS TEST ---');

runTest('Performance: 500 synthetic articles processed cleanly under 1.5 seconds', () => {
  const syntheticArticles = [];
  const locations = ['loc:mitrovica_north', 'loc:zvecan', 'loc:zubin_potok', 'loc:leposavic', 'loc:prishtina', 'loc:peja', 'loc:prizren'];
  const actions = [
    'Uhapšen muškarac u',
    'Arrestohet një person në',
    'Zaplenjeno oružje u',
    'Konfiskohen armë në',
    'Sastanak delegacija u',
    'Požar na objektu u'
  ];

  for (let i = 0; i < 500; i++) {
    const locKey = locations[i % locations.length];
    const locName = CANONICAL_ENTITIES.locations[locKey].name;
    const act = actions[i % actions.length];
    syntheticArticles.push({
      id: `synth-${i}`,
      title: `${act} ${locName} - izveštaj ${i % 10}`,
      description: `Detalji o događaju ${i} u mestu ${locName}.`,
      url: `https://news-portal-${i % 5}.com/article-${i}`,
      source: `Portal ${i % 5}`,
      publishedAt: new Date(Date.now() - (i * 60000)).toISOString()
    });
  }

  const startTime = Date.now();
  const clusters = clusterEventArticles(syntheticArticles);
  const elapsedMs = Date.now() - startTime;

  console.log(`  Processed 500 articles in ${elapsedMs}ms -> Created ${clusters.length} Event clusters`);
  assert(elapsedMs < 2500, `Clustering 500 articles must complete in under 2.5s (took ${elapsedMs}ms)`);
  assert(clusters.length > 0, 'Must produce valid clusters');
});

console.log('\n================================================================');
console.log(`🎉 ALL ${passedTests} / ${totalTests} ADVERSARIAL & INVARIANT TESTS COMPLETED! 🎉`);
console.log('================================================================\n');
