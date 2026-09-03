'use strict';

/**
 * KOSINT-26 / SENTINEL Minefields & Explosive Hazards Intelligence Subsystem
 * Data source: Kosovo Mine Action Centre (KMAC), KFOR EOD Coordination Cell, HALO Trust
 */

const KOSOVO_MINEFIELDS = [
  {
    id: 'mine-koshare',
    name: 'Koshare / Rrasa e Zogut High Frontier Belt',
    sector: 'Junik / Pastrik Western Frontier',
    municipality: 'Deçan / Gjakovë',
    category: 'minefield',
    riskLevel: 'CRITICAL',
    status: 'CONFIRMED HAZARDOUS AREA (CHA)',
    munitionTypes: 'Antipersonnel (PMA-2, PMA-3), Antitank (TMA-3, TMA-4), PMR-2A stake mines',
    estimatedAreaHa: 68.5,
    standoffDistanceMeters: 200,
    deminingAgency: 'Kosovo Mine Action Centre (KMAC) / KSF EOD / HALO Trust',
    lastSurveyDate: '2025-11-12',
    emergencyContact: 'KMAC Hot Desk: +383 38 500 192 · KFOR EOD Duty Officer: Ch 16',
    description: 'Dense historical minefield belt along high mountainous ridgelines. Unmarked perimeter with steep terrain wash hazards.',
    lat: 42.4583,
    lon: 20.1528
  },
  {
    id: 'mine-pashtrik',
    name: 'Pashtrik Mountain Defensive Frontier (Maja e Pashtrikut)',
    sector: 'Has / Prizren Border Crest',
    municipality: 'Prizren / Gjakovë',
    category: 'minefield',
    riskLevel: 'CRITICAL',
    status: 'CONFIRMED HAZARDOUS AREA (CHA)',
    munitionTypes: 'Antipersonnel (PMA-2, PMR-2A, PROM-1 Bounding), Sub-surface Tripwires',
    estimatedAreaHa: 82.0,
    standoffDistanceMeters: 200,
    deminingAgency: 'KMAC / KSF Demining Company',
    lastSurveyDate: '2025-10-04',
    emergencyContact: 'KMAC: +383 38 500 192 · Police EOD: 192',
    description: 'Heavy legacy defensive installations on alpine approaches. Severe rocky terrain subject to shift following snowmelt.',
    lat: 42.2100,
    lon: 20.5250
  },
  {
    id: 'mine-dulje',
    name: 'Dulje Pass Cluster Strike & Ambush Footprint (Qafa e Duhlës)',
    sector: 'Suva Reka / Shtime Arterial Axis',
    municipality: 'Suharekë / Shtime',
    category: 'cluster_strike',
    riskLevel: 'CRITICAL',
    status: 'CONFIRMED HAZARDOUS AREA (CHA)',
    munitionTypes: 'CBU-87 / BLU-97 A/B Cluster Submunitions, Artillery UXO, Fragmentary Mines',
    estimatedAreaHa: 45.2,
    standoffDistanceMeters: 150,
    deminingAgency: 'NPA (Norwegian People’s Aid) / KMAC',
    lastSurveyDate: '2026-02-18',
    emergencyContact: 'KMAC: +383 38 500 192 · KFOR RC-East EOD',
    description: 'Strategic canyon pass hit during 1999 airstrikes and defensive mining. Submunition duds remain sensitive to disturbance in dense woodland.',
    lat: 42.4180,
    lon: 20.8950
  },
  {
    id: 'mine-bajgora',
    name: 'Shala e Bajgorës Trench & Ridge Perimeter',
    sector: 'Mitrovica East Highland / Trepča Heights',
    municipality: 'Mitrovica / Podujevo',
    category: 'minefield',
    riskLevel: 'HIGH',
    status: 'SUSPECTED HAZARDOUS AREA (SHA)',
    munitionTypes: 'Antipersonnel Mines (PMA-3, PMR-2A), Heavy Mortar Duds',
    estimatedAreaHa: 34.0,
    standoffDistanceMeters: 100,
    deminingAgency: 'KMAC / KFOR EOD Regional Patrol',
    lastSurveyDate: '2025-08-20',
    emergencyContact: 'Police Regional Command North: 192 / +383 28 530 100',
    description: 'Highland grazing zones near historic fortified bunkers. Warnings posted along forest edges; off-road transit strictly prohibited.',
    lat: 42.9650,
    lon: 20.9700
  },
  {
    id: 'mine-mokra-gora',
    name: 'Mokra Gora / Brnjak Ridge Perimeter',
    sector: 'Zubin Potok / Gazivode Highland',
    municipality: 'Zubin Potok',
    category: 'minefield',
    riskLevel: 'HIGH',
    status: 'SUSPECTED HAZARDOUS AREA (SHA)',
    munitionTypes: 'Defensive Barrier Minefields, PMR-2A, Tripwire Improvised Caches',
    estimatedAreaHa: 52.4,
    standoffDistanceMeters: 150,
    deminingAgency: 'KFOR EOD Liaison / KMAC',
    lastSurveyDate: '2025-09-15',
    emergencyContact: 'KFOR Base Camp Cabra: Ch 16 · Police North: 192',
    description: 'Mountain crest line overlooking Lake Gazivode approaches. Isolated unmapped tactical defensive pockets.',
    lat: 42.8550,
    lon: 20.4850
  },
  {
    id: 'mine-kopaonik',
    name: 'Kopaonik / Belo Brdo Highland Cluster Footprint',
    sector: 'Leposavić Northern Highland',
    municipality: 'Leposavić',
    category: 'cluster_strike',
    riskLevel: 'HIGH',
    status: 'CLUSTER MUNITION FOOTPRINT',
    munitionTypes: 'BLU-97 Submunitions, 1999 Airstrike Submunitions, Unexploded Rocket Warheads',
    estimatedAreaHa: 29.8,
    standoffDistanceMeters: 100,
    deminingAgency: 'KMAC / KFOR RC-East Explosive Ordnance Disposal',
    lastSurveyDate: '2025-07-29',
    emergencyContact: 'KMAC: +383 38 500 192 · KFOR Camp Nothing Hill',
    description: 'Dense forest sector near mining communications. Known unexploded yellow BLU-97 canisters hidden under autumn pine needles.',
    lat: 43.2100,
    lon: 20.8400
  },
  {
    id: 'mine-drenica',
    name: 'Drenica Hills / Likovac – Prekaz Sector',
    sector: 'Central Drenica Highland',
    municipality: 'Skenderaj / Gllogoc',
    category: 'uxo_area',
    riskLevel: 'MEDIUM',
    status: 'SUSPECTED HAZARDOUS AREA (SHA)',
    munitionTypes: 'Mortar Blind Shells, Abandoned Ammunition Pits, Residual Submunitions',
    estimatedAreaHa: 21.0,
    standoffDistanceMeters: 80,
    deminingAgency: 'KSF EOD Demining Battalion',
    lastSurveyDate: '2025-06-11',
    emergencyContact: 'Police Operations: 192 · KSF Ops Desk',
    description: 'Agricultural and secondary forestry areas with intermittent deep-plow unearthing of wartime unexploded shells.',
    lat: 42.7250,
    lon: 20.8100
  },
  {
    id: 'mine-gllobocice',
    name: 'Glloboçicë / Šar Mountain Alpine Pass (Border Ridge)',
    sector: 'Kaçanik / Strpce Southern Frontier',
    municipality: 'Kaçanik / Shtërpcë',
    category: 'minefield',
    riskLevel: 'CRITICAL',
    status: 'CONFIRMED HAZARDOUS AREA (CHA)',
    munitionTypes: 'PMA-1, PMA-3 Plastic AP Mines, TMA-4 Antitank, PROM-1 Bounding',
    estimatedAreaHa: 48.0,
    standoffDistanceMeters: 150,
    deminingAgency: 'KMAC / HALO Trust',
    lastSurveyDate: '2025-10-22',
    emergencyContact: 'KMAC: +383 38 500 192 · Border Police South',
    description: 'Border patrol alpine tracks with confirmed plastic mine contamination undetectable by traditional magnetic sweeping.',
    lat: 42.1800,
    lon: 21.1900
  },
  {
    id: 'mine-merdare',
    name: 'Kulina / Podujevo ABL Border Perimeter',
    sector: 'Merdare / Gate 3 North-East Axis',
    municipality: 'Podujevë',
    category: 'minefield',
    riskLevel: 'HIGH',
    status: 'SUSPECTED HAZARDOUS AREA (SHA)',
    munitionTypes: 'Defensive Trenches, PMR-2A, Anti-Vehicle Surface Mines',
    estimatedAreaHa: 37.5,
    standoffDistanceMeters: 120,
    deminingAgency: 'KFOR Multinational EOD / KMAC',
    lastSurveyDate: '2025-09-02',
    emergencyContact: 'Police Podujevo: 192 · KFOR Base Camp Film City',
    description: 'Woodland parallel to the ABL demarcation line. Strictly marked with red hazard skulls; civilian livestock pasturing restricted.',
    lat: 42.9300,
    lon: 21.2200
  },
  {
    id: 'mine-radoniq',
    name: 'Radoniq Lake Basin & Baballoq Foothills',
    sector: 'Dukagjini Basin / Decani Axis',
    municipality: 'Gjakovë / Deçan',
    category: 'cluster_strike',
    riskLevel: 'MEDIUM',
    status: 'PARTIALLY CLEARED / RESIDUAL RISK',
    munitionTypes: 'Cluster Submunition Remnants, Underwater UXO, Hand Grenade Caches',
    estimatedAreaHa: 19.5,
    standoffDistanceMeters: 80,
    deminingAgency: 'KMAC / KSF EOD Divers Team',
    lastSurveyDate: '2025-05-18',
    emergencyContact: 'KMAC: +383 38 500 192 · Emergency 112',
    description: 'Reservoir surrounding shoreline subject to annual water-level exposure of submerged wartime munitions.',
    lat: 42.4700,
    lon: 20.4200
  },
  {
    id: 'mine-sar-brezovica',
    name: 'Šar Mountain / Jazhincë Ridge (Brezovica High Crest)',
    sector: 'Šar Massif Ski & Wilderness Area',
    municipality: 'Shtërpcë / Prizren',
    category: 'minefield',
    riskLevel: 'HIGH',
    status: 'SUSPECTED HAZARDOUS AREA (SHA)',
    munitionTypes: 'PMA-2, TMA-3, Alpine Fortified Pit Mines',
    estimatedAreaHa: 41.0,
    standoffDistanceMeters: 150,
    deminingAgency: 'KMAC / KFOR Mountain Troops EOD',
    lastSurveyDate: '2025-09-28',
    emergencyContact: 'Mountain Rescue: +383 49 112 000 · KMAC: +383 38 500 192',
    description: 'High-altitude ridges off marked ski pistes and hiking paths. Winter avalanche deposits can displace items downhill.',
    lat: 42.2200,
    lon: 21.0300
  },
  {
    id: 'mine-gora-restelica',
    name: 'Gora / Restelica Alpine Tripoint (Korab Frontier)',
    sector: 'Southernmost Kosovo Mountain Frontier',
    municipality: 'Dragash',
    category: 'minefield',
    riskLevel: 'HIGH',
    status: 'SUSPECTED HAZARDOUS AREA (SHA)',
    munitionTypes: 'Boundary Defensive Line, PMA-3, Fragmentation PMR-2A',
    estimatedAreaHa: 58.0,
    standoffDistanceMeters: 150,
    deminingAgency: 'KMAC / KSF Demining',
    lastSurveyDate: '2025-08-08',
    emergencyContact: 'Border Police Dragash: +383 29 281 100 · KMAC: +383 38 500 192',
    description: 'Extremely remote highland pasturage along the Macedonian / Albanian border tripoint.',
    lat: 41.9300,
    lon: 20.6500
  }
];

/**
 * Haversine formula to compute great-circle distance between two points in km
 */
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getMinefieldsData() {
  const stats = {
    totalHazardAreas: KOSOVO_MINEFIELDS.length,
    confirmedHazardAreas: KOSOVO_MINEFIELDS.filter(m => m.status.includes('CONFIRMED')).length,
    suspectedHazardAreas: KOSOVO_MINEFIELDS.filter(m => m.status.includes('SUSPECTED')).length,
    clusterMunitionFootprints: KOSOVO_MINEFIELDS.filter(m => m.category === 'cluster_strike' || m.status.includes('CLUSTER')).length,
    criticalRiskZones: KOSOVO_MINEFIELDS.filter(m => m.riskLevel === 'CRITICAL').length,
    totalAreaHa: Math.round(KOSOVO_MINEFIELDS.reduce((acc, m) => acc + (m.estimatedAreaHa || 0), 0) * 10) / 10
  };

  return {
    status: 'ACTIVE',
    source: 'Kosovo Mine Action Centre (KMAC) / KFOR EOD Coordination',
    updatedAt: new Date().toISOString(),
    stats,
    emergencyHotlines: [
      { organization: 'Kosovo Police EOD Unit', phone: '192', priority: 'Immediate Response' },
      { organization: 'Kosovo Mine Action Centre (KMAC)', phone: '+383 38 500 192', priority: 'Coordination & Verification' },
      { organization: 'KFOR Joint Operations EOD Desk', freq: 'VHF Ch 16 / Ops Room', priority: 'Military Theater EOD' }
    ],
    minefields: KOSOVO_MINEFIELDS
  };
}

function calculateProximity(lat, lon) {
  const userLat = parseFloat(lat);
  const userLon = parseFloat(lon);

  if (isNaN(userLat) || isNaN(userLon)) {
    return { error: 'Valid lat and lon query parameters are required' };
  }

  const evaluated = KOSOVO_MINEFIELDS.map(m => {
    const distKm = haversineDistanceKm(userLat, userLon, m.lat, m.lon);
    const distMeters = Math.round(distKm * 1000);
    const isInsideStandoff = distMeters <= m.standoffDistanceMeters;
    const isNearby = distKm <= 2.0;

    return {
      ...m,
      distanceKm: Math.round(distKm * 100) / 100,
      distanceMeters: distMeters,
      isInsideStandoff,
      isNearby
    };
  });

  evaluated.sort((a, b) => a.distanceKm - b.distanceKm);
  const nearest = evaluated[0];

  let dangerStatus = 'SAFE_DISTANCE';
  let dangerMessage = `Nearest hazard is ${nearest.distanceKm} km away (${nearest.name}).`;

  if (nearest.isInsideStandoff) {
    dangerStatus = 'CRITICAL_DANGER_INSIDE_STANDOFF';
    dangerMessage = `CRITICAL WARNING: You are within the ${nearest.standoffDistanceMeters}m standoff perimeter of ${nearest.name}!`;
  } else if (nearest.isNearby) {
    dangerStatus = 'WARNING_PROXIMATE_HAZARD';
    dangerMessage = `CAUTION: Active hazard area within ${nearest.distanceKm} km (${nearest.name}). Stay on asphalt / verified roads.`;
  }

  return {
    queriedCoordinates: { lat: userLat, lon: userLon },
    dangerStatus,
    dangerMessage,
    nearestHazard: nearest,
    allHazardsRanked: evaluated
  };
}

module.exports = {
  KOSOVO_MINEFIELDS,
  getMinefieldsData,
  calculateProximity
};
