/**
 * KOSINT-26 / SENTINEL Operational Geospatial Intelligence Layers
 * 
 * Authoritative datasets for:
 * 1. ABL (Administrative Boundary Line) - High-fidelity topographic border contour
 * 2. 4 Northern Kosovo Municipalities (Severna Mitrovica, Zvečan, Leposavić, Zubin Potok)
 * 3. KFOR Military Bases, Camps & Fixed Checkpoints (Point Markers with full tactical telemetry)
 * 4. Sensitive Transition Corridors & Special Protective Zones (SPZ)
 */

export const ABL_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'abl-line-main',
        name: 'Administrativna Linija / Administrative Boundary Line (ABL)',
        type: 'boundary_line',
        lengthApproxKm: 382,
        status: 'Monitored by KFOR & Border Police',
        description: 'Demarcation line separating Kosovo and central Serbia per UNSCR 1244 and MTA.'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [20.3540, 42.8330], // Tripoint Montenegro / Kosovo / Serbia (Mokra Gora ridge)
          [20.3800, 42.8550],
          [20.4100, 42.8800],
          [20.4450, 42.9100],
          [20.4850, 42.9350],
          [20.5200, 42.9550],
          [20.5519, 42.9753], // Bërnjak / Gate 31
          [20.5650, 43.0050],
          [20.5820, 43.0380],
          [20.6050, 43.0720], // Rogozna mountain ridge
          [20.6250, 43.1050],
          [20.6400, 43.1380],
          [20.6550, 43.1700],
          [20.6720, 43.1950],
          [20.6975, 43.2181], // Jarinjë / Gate 1
          [20.7250, 43.2420],
          [20.7600, 43.2580],
          [20.7950, 43.2660],
          [20.8120, 43.2680], // Pančićev Vrh (Northernmost apex of Kosovo, 2,017m)
          [20.8450, 43.2550],
          [20.8800, 43.2320], // Belo Brdo crest
          [20.9150, 43.2050],
          [20.9450, 43.1780],
          [20.9780, 43.1480],
          [21.0100, 43.1180],
          [21.0450, 43.0900], // Ridge dividing Leposavić/Podujevo
          [21.0820, 43.0650],
          [21.1200, 43.0400],
          [21.1600, 43.0120],
          [21.2050, 42.9800],
          [21.2464, 42.9439], // Merdarë / Gate 3
          [21.2780, 42.9150],
          [21.3120, 42.8800],
          [21.3480, 42.8450],
          [21.3850, 42.8120],
          [21.4250, 42.7800],
          [21.4686, 42.7561], // Mutivodë / Gate 4
          [21.5050, 42.7200],
          [21.5420, 42.6750],
          [21.5750, 42.6250],
          [21.6050, 42.5700],
          [21.6320, 42.5250],
          [21.6547, 42.4844], // Dheu i Bardhë / Končulj (Bela Zemlja)
          [21.6420, 42.4450],
          [21.6150, 42.4150],
          [21.5850, 42.3980],
          [21.5583, 42.3883], // Muçibabë / Gate 5
          [21.5250, 42.3600],
          [21.4900, 42.3300],
          [21.4550, 42.2950]  // Southeast boundary near Preševo valley
        ]
      }
    }
  ]
};

export const MUNICIPALITIES_NORTH_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'mun-leposavic',
        name: 'Leposavić / Leposaviq',
        nameSr: 'LEPOSAVIĆ',
        nameSq: 'Leposaviq',
        code: 'LEP',
        areaKm2: 539,
        populationEst: '13,500',
        hq: 'Leposavić Centar',
        policeStation: 'KPS Leposavić (North Directorate)',
        color: '#38bdf8',
        borderColor: '#0284c7',
        center: [20.8033, 43.1025],
        primaryAccess: 'M-22.3 (Magistralni put Mitrovica–Jarinje)',
        keyLocations: 'Lešak, Sočanica, Jarinje prelaz, Belo Brdo, Camp Nothing Hill'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [20.6720, 43.1950],
          [20.6975, 43.2181],
          [20.7600, 43.2580],
          [20.8120, 43.2680],
          [20.8800, 43.2320],
          [20.9450, 43.1780],
          [20.9780, 43.1480],
          [20.9400, 43.0600],
          [20.8900, 43.0200], // Južna granica sa Zvečanom kod Sočanice
          [20.8200, 43.0300],
          [20.7600, 43.0500], // Tromeđa sa Zvečanom i Zubin Potokom
          [20.6500, 43.1200],
          [20.6720, 43.1950]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'mun-zvecan',
        name: 'Zvečan / Zveçan',
        nameSr: 'ZVEČAN',
        nameSq: 'Zveçan',
        code: 'ZVE',
        areaKm2: 122,
        populationEst: '16,500',
        hq: 'Zvečan Centar',
        policeStation: 'KPS Zvečan (North Directorate)',
        color: '#f59e0b',
        borderColor: '#d97706',
        center: [20.8250, 42.9550],
        primaryAccess: 'M-22.3, R-121 (Pravac Banjska–Novi Pazar)',
        keyLocations: 'Tvrđava Zvečan, Manastir Banjska, Žerovnica, Rudare, Grabovac'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [20.7600, 43.0500], // Sever: dodir sa Leposavićem
          [20.8200, 43.0300],
          [20.8900, 43.0200],
          [20.9050, 42.9650], // Istok: padine ka Bajgori
          [20.8850, 42.9200], // Jugoistok: dodir sa Severnom Mitrovicom
          [20.8520, 42.8980], // Granica iznad Malog Zvečana / Kule
          [20.8100, 42.9250], // Zapad: Žitkovac i Banjska kanjon ka Zubin Potoku
          [20.7400, 42.9700],
          [20.7600, 43.0500]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'mun-severna-mitrovica',
        name: 'Severna Mitrovica / Mitrovica e Veriut',
        nameSr: 'SEVERNA MITROVICA',
        nameSq: 'Mitrovica e Veriut',
        code: 'NMI',
        areaKm2: 11,
        populationEst: '29,500',
        hq: 'Severna Mitrovica Centar',
        policeStation: 'KPS Severna Mitrovica (Regionalna komanda Sever)',
        color: '#ef4444',
        borderColor: '#dc2626',
        center: [20.8680, 42.8970],
        primaryAccess: 'Kralja Petra I, Kolašinska, Mostovi na reci Ibar',
        keyLocations: 'KBC Kosovska Mitrovica, Bošnjačka Mahala, Mikro-naselje, Suvi Do, Glavni Most'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [20.8520, 42.8980], // Severna ivica (podnožje Zvečana / Kukavica)
          [20.8850, 42.9200],
          [20.8950, 42.8990], // Istočni ugao kod ušća Sitnice
          [20.8850, 42.8950],
          [20.8732, 42.8926], // Pešački most kod Bošnjačke Mahale (reka Ibar)
          [20.8665, 42.8912], // Glavni most na Ibru
          [20.8540, 42.8918],
          [20.8420, 42.8930], // Zapad: prelaz Suvi Do
          [20.8520, 42.8980]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'mun-zubin-potok',
        name: 'Zubin Potok',
        nameSr: 'ZUBIN POTOK',
        nameSq: 'Zubin Potok',
        code: 'ZUP',
        areaKm2: 335,
        populationEst: '15,000',
        hq: 'Zubin Potok Centar',
        policeStation: 'KPS Zubin Potok (North Directorate)',
        color: '#10b981',
        borderColor: '#059669',
        center: [20.6900, 42.9350],
        primaryAccess: 'M-2 (Magistralni put Mitrovica–Ribariće–Brnjak)',
        keyLocations: 'Jezero Gazivode, Brnjak prelaz, Čabra, Velji Breg, Ugljare'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [20.5200, 42.9550], // Zapad: ABL granica kod jezera Gazivode
          [20.5519, 42.9753], // Brnjak
          [20.6050, 43.0720], // Rogozna venac
          [20.6500, 43.1200],
          [20.7600, 43.0500], // Dodir sa Zvečanom
          [20.7400, 42.9700],
          [20.8100, 42.9250],
          [20.8420, 42.8930], // Južno od Suvog Dola ka Čabri
          [20.8100, 42.8600], // Južni masiv ka Drenici
          [20.7100, 42.8650],
          [20.6000, 42.8750],
          [20.5000, 42.8950], // Mokra Gora venac
          [20.5200, 42.9550]
        ]]
      }
    }
  ]
};

// Tactical Municipal Label Points for Map Surface Rendering
export const MUNICIPALITIES_CENTROIDS_GEOJSON = {
  type: 'FeatureCollection',
  features: MUNICIPALITIES_NORTH_GEOJSON.features.map(f => ({
    type: 'Feature',
    properties: {
      id: f.properties.id + '-label',
      nameSr: f.properties.nameSr,
      nameSq: f.properties.nameSq,
      code: f.properties.code,
      color: f.properties.borderColor
    },
    geometry: {
      type: 'Point',
      coordinates: f.properties.center
    }
  }))
};

/**
 * KFOR Military Bases, Camps, Forward Operating Sites & Fixed Checkpoints
 * Authoritative point locations with command structure and force telemetry
 */
export const KFOR_BASES_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'kfor-camp-bondsteel',
        name: 'Camp Bondsteel',
        category: 'military_base',
        typeLabel: 'HQ REGIONAL COMMAND EAST (RC-E)',
        leadNation: 'United States of America 🇺🇸',
        command: 'KFOR RC-East / Task Force Medical',
        sector: 'East / South-East (Ferizaj / Sojevë)',
        units: '56th Stryker BCT, 2-224th Aviation (UH-60 Blackhawks), EOD',
        capabilities: 'Airfield / Helipads, Level 2+ Surgical Hospital, Armored QRF',
        status: 'Primary Operating Base',
        lat: 42.3667,
        lon: 21.2500
      },
      geometry: {
        type: 'Point',
        coordinates: [21.2500, 42.3667]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'kfor-camp-film-city',
        name: 'Camp Film City',
        category: 'military_base',
        typeLabel: 'KFOR GENERAL HEADQUARTERS',
        leadNation: 'NATO International Command 🌐',
        command: 'COMKFOR / Joint Operations Center (JOC)',
        sector: 'Prishtinë (Dragodan)',
        units: 'HQ Staff, Joint Logistics Support Group (JLSG), Signal Bn',
        capabilities: 'Strategic C4ISR Command Center, VIP Helipads, Medical Unit',
        status: 'Operational Headquarters',
        lat: 42.6489,
        lon: 21.1394
      },
      geometry: {
        type: 'Point',
        coordinates: [21.1394, 42.6489]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'kfor-camp-villaggio-italia',
        name: 'Camp Villaggio Italia',
        category: 'military_base',
        typeLabel: 'HQ REGIONAL COMMAND WEST (RC-W)',
        leadNation: 'Italy 🇮🇹',
        command: 'KFOR RC-West / 11° Reggimento Bersaglieri',
        sector: 'West (Peć / Belo Polje)',
        units: 'Italian, Austrian, Moldovan & North Macedonian contingents',
        capabilities: 'Mechanized Infantry, Visoki Dečani Security Detachment, Helipad',
        status: 'Primary Operating Base',
        lat: 42.6392,
        lon: 20.2653
      },
      geometry: {
        type: 'Point',
        coordinates: [20.2653, 42.6392]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'kfor-camp-nothing-hill',
        name: 'Camp Nothing Hill',
        category: 'military_base',
        typeLabel: 'FORWARD OPERATING BASE NORTH',
        leadNation: 'United States 🇺🇸 / Latvia 🇱🇻 / North Macedonia 🇲🇰',
        command: 'KFOR RC-East Kinetic Battalion North',
        sector: 'North (Leposavić / Jarinje Corridor)',
        units: 'US Light Infantry / Stryker Patrols, Latvian Recon, EOD',
        capabilities: 'Forward Tactical QRF, Helipad, Armored Patrol Base',
        status: 'Active Forward Base',
        lat: 43.1167,
        lon: 20.8000
      },
      geometry: {
        type: 'Point',
        coordinates: [20.8000, 43.1167]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'kfor-camp-novo-selo',
        name: 'Camp Novo Selo (Camp De Lattre)',
        category: 'military_base',
        typeLabel: 'TACTICAL MANEUVER & LOGISTICS BASE',
        leadNation: 'Hungary 🇭🇺 / USA 🇺🇸',
        command: 'KFOR Tactical Reserve Battalion (KTRBN)',
        sector: 'North / Central Staging Area (Maxhunaj / Vushtrri)',
        units: 'Hungarian Kinetic Bn, Freedom of Movement Detachment (FOMD)',
        capabilities: 'Heavy Logistics, Crowd & Riot Control (CRC), Armored Staging',
        status: 'Operational Reserve Base',
        lat: 42.7917,
        lon: 20.9833
      },
      geometry: {
        type: 'Point',
        coordinates: [20.9833, 42.7917]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'kfor-camp-cabra',
        name: 'Camp Cabra / Zubin Potok Post',
        category: 'outpost',
        typeLabel: 'SURVEILLANCE & PATROL OUTPOST',
        leadNation: 'Multinational Patrol Unit 🛡️',
        command: 'KFOR North Observation Detachment',
        sector: 'North (Zubin Potok / Lake Gazivode)',
        units: 'Infantry Squad / Border Surveillance Team',
        capabilities: 'Lake Gazivode Waterway & M-2 Transit Surveillance',
        status: 'Active Outpost',
        lat: 42.9220,
        lon: 20.6780
      },
      geometry: {
        type: 'Point',
        coordinates: [20.6780, 42.9220]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'kfor-msu-ibar-bridge',
        name: 'KFOR MSU Main Ibar Bridge Post',
        category: 'checkpoint',
        typeLabel: '24/7 PERMANENT STATIC CHECKPOINT',
        leadNation: 'Italy (Carabinieri MSU) 🇮🇹',
        command: 'Multinational Specialized Unit (MSU)',
        sector: 'Mitrovica Division Line (Glavni Most na Ibru)',
        units: 'Carabinieri Armored Patrols & Fixed Checkpoint Guard',
        capabilities: 'RG-12 Armored Patrols, 24/7 De-escalation & Surveillance',
        status: 'Active 24/7 Fixed Post',
        lat: 42.8912,
        lon: 20.8665
      },
      geometry: {
        type: 'Point',
        coordinates: [20.8665, 42.8912]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'kfor-gate1-jarinje',
        name: 'KFOR Gate 1 (Jarinje Forward Staging)',
        category: 'checkpoint',
        typeLabel: 'ABL NORTHERN STAGING POST',
        leadNation: 'KFOR Kinetic Maneuver Unit 🛡️',
        command: 'RC-East Forward Demarcation Monitoring',
        sector: 'North (ABL Jarinje / M-22.3)',
        units: 'Forward Observation & Rapid Intervention Patrols',
        capabilities: 'Barrier Control, Static Border Monitor',
        status: 'Active Forward Post',
        lat: 43.2170,
        lon: 20.6990
      },
      geometry: {
        type: 'Point',
        coordinates: [20.6990, 43.2170]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'kfor-gate31-brnjak',
        name: 'KFOR Gate 31 (Brnjak Forward Staging)',
        category: 'checkpoint',
        typeLabel: 'ABL NORTHWEST STAGING POST',
        leadNation: 'KFOR Kinetic Maneuver Unit 🛡️',
        command: 'RC-East / RC-West Demarcation Patrol',
        sector: 'North (ABL Brnjak / Gazivode Dam)',
        units: 'Forward Observation Team',
        capabilities: 'Dam Protection, Roadblock Prevention',
        status: 'Active Forward Post',
        lat: 42.9740,
        lon: 20.5530
      },
      geometry: {
        type: 'Point',
        coordinates: [20.5530, 42.9740]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'kfor-camp-slim-lines',
        name: 'Camp Slim Lines',
        category: 'military_base',
        typeLabel: 'JOINT COMMUNICATIONS & LOGISTICS DEPOT',
        leadNation: 'United Kingdom 🇬🇧',
        command: 'KFOR Operational Reserve / Support Units',
        sector: 'Prishtinë',
        units: 'British Army Signals & Logistics Detachment',
        capabilities: 'Theater Communications, Supply Staging, Medevac Support',
        status: 'Operational Support Base',
        lat: 42.6680,
        lon: 21.1730
      },
      geometry: {
        type: 'Point',
        coordinates: [21.1730, 42.6680]
      }
    }
  ]
};

export const SENSITIVE_CORRIDORS_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    // Ibar River Bridges & Transition Corridors
    {
      type: 'Feature',
      properties: {
        id: 'bridge-main-ibar',
        name: 'Main Ibar Bridge (Glavni Most / Ura e Ibrit)',
        category: 'bridge',
        status: 'KFOR / Carabinieri Fixed Static Post · Closed to Vehicular Traffic',
        securityLevel: 'HIGH SENSITIVITY',
        description: 'Primary demarcation crossing between North and South Mitrovica across the Ibar River. 24/7 static guard and monitoring by Italian Carabinieri MSU.',
        lat: 42.8912,
        lon: 20.8665
      },
      geometry: {
        type: 'Point',
        coordinates: [20.8665, 42.8912]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'bridge-bosnjacka',
        name: 'Bošnjačka Mahala Transit Bridge (Pedestrian / Light Vehicle)',
        category: 'bridge',
        status: 'Open for Pedestrians & Light Traffic',
        securityLevel: 'ELEVATED MONITORING',
        description: 'Mixed eastern transit crossing connecting North Mitrovica (Bošnjačka Mahala) with South Mitrovica.',
        lat: 42.8926,
        lon: 20.8732
      },
      geometry: {
        type: 'Point',
        coordinates: [20.8732, 42.8926]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'bridge-railway',
        name: 'Mitrovica North Railway Bridge (Ibar Rail Spur)',
        category: 'bridge',
        status: 'Single-Track Industrial / Rail Crossing',
        securityLevel: 'MEDIUM',
        description: 'Northern railway bridge spanning the Ibar river upstream near the industrial perimeter.',
        lat: 42.8940,
        lon: 20.8580
      },
      geometry: {
        type: 'Point',
        coordinates: [20.8580, 42.8940]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'crossing-suvi-do',
        name: 'Suvi Do / Kroi i Vitakut Transition Crossing',
        category: 'corridor',
        status: 'Open Transit Approach',
        securityLevel: 'MEDIUM',
        description: 'Western transit approach corridor connecting South Mitrovica with Suvi Do and the northern bypass.',
        lat: 42.8915,
        lon: 20.8490
      },
      geometry: {
        type: 'Point',
        coordinates: [20.8490, 42.8915]
      }
    },
    // Special Protective Zones (SPZ) under Law No. 03/L-047
    {
      type: 'Feature',
      properties: {
        id: 'spz-decani',
        name: 'Special Protective Zone: Visoki Dečani Monastery',
        category: 'spz',
        status: 'UNESCO World Heritage · 24/7 KFOR Static Perimeter Guard',
        securityLevel: 'MAXIMUM SECURITY',
        description: '14th-century Serbian Orthodox monastery under 24/7 direct static security protection by KFOR (Italian RC-West contingent). Legally protected SPZ perimeter.',
        lat: 42.5497,
        lon: 20.2661
      },
      geometry: {
        type: 'Point',
        coordinates: [20.2661, 42.5497]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'spz-patriarchate-pec',
        name: 'Special Protective Zone: Patriarchate of Peć (Pećka Patrijaršija)',
        category: 'spz',
        status: 'UNESCO World Heritage · Protected Heritage Complex',
        securityLevel: 'HIGH SENSITIVITY',
        description: 'Medieval monastic complex at the mouth of Rugova Canyon. Historic seat of Serbian Orthodox Patriarchs. Guarded by Kosovo Police Special Protective Unit (SPU).',
        lat: 42.6611,
        lon: 20.2644
      },
      geometry: {
        type: 'Point',
        coordinates: [20.2644, 42.6611]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'spz-gracanica',
        name: 'Special Protective Zone: Gračanica Monastery',
        category: 'spz',
        status: 'UNESCO World Heritage · Protected Heritage Area',
        securityLevel: 'HIGH SENSITIVITY',
        description: '14th-century monastery founded by King Stefan Milutin in Gračanica enclave. Key religious and cultural site in central Kosovo.',
        lat: 42.5986,
        lon: 21.1931
      },
      geometry: {
        type: 'Point',
        coordinates: [21.1931, 42.5986]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'spz-banjska',
        name: 'Special Protective Zone: Banjska Monastery',
        category: 'spz',
        status: 'Protected Heritage Area · Northern Sector',
        securityLevel: 'HIGH SENSITIVITY',
        description: '14th-century fortified monastery in Zvečan municipality with an established statutory security perimeter.',
        lat: 42.9720,
        lon: 20.7830
      },
      geometry: {
        type: 'Point',
        coordinates: [20.7830, 42.9720]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'spz-sokolica',
        name: 'Special Protective Zone: Sokolica Monastery',
        category: 'spz',
        status: 'Protected Heritage Area · Zvečan Ridge',
        securityLevel: 'MEDIUM SENSITIVITY',
        description: 'Medieval monastery on the forested slopes of Sokolica hill overlooking the Ibar valley, Zvečan municipality.',
        lat: 42.9230,
        lon: 20.8710
      },
      geometry: {
        type: 'Point',
        coordinates: [20.8710, 42.9230]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'spz-devic',
        name: 'Special Protective Zone: Devič Monastery',
        category: 'spz',
        status: 'Protected Heritage Area · Drenica Forest Sector',
        securityLevel: 'HIGH SENSITIVITY',
        description: '15th-century monastery located in dense Drenica woodland (Skenderaj municipality). Guarded by Kosovo Police Special Protective Unit.',
        lat: 42.7167,
        lon: 20.7917
      },
      geometry: {
        type: 'Point',
        coordinates: [20.7917, 42.7167]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'spz-our-lady-ljevis',
        name: 'Special Protective Zone: Our Lady of Ljeviš (Bogorodica Ljeviška)',
        category: 'spz',
        status: 'UNESCO World Heritage · Historic Center Prizren',
        securityLevel: 'HIGH SENSITIVITY',
        description: '14th-century cathedral church in urban Prizren. UNESCO World Heritage Site with designated statutory protective zone.',
        lat: 42.2119,
        lon: 20.7425
      },
      geometry: {
        type: 'Point',
        coordinates: [20.7425, 42.2119]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'spz-holy-archangels',
        name: 'Special Protective Zone: Holy Archangels Monastery (Sveti Arhangeli)',
        category: 'spz',
        status: 'Protected Heritage Area · Prizren Bistrica Canyon',
        securityLevel: 'ELEVATED MONITORING',
        description: '14th-century monastic foundation of Emperor Stefan Dušan situated in the Prizren Bistrica canyon.',
        lat: 42.1931,
        lon: 20.7639
      },
      geometry: {
        type: 'Point',
        coordinates: [20.7639, 42.1931]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'spz-gazimestan',
        name: 'Special Protective Zone: Gazimestan Memorial Monument',
        category: 'spz',
        status: 'Historic Memorial SPZ · Static Police Post',
        securityLevel: 'ELEVATED MONITORING',
        description: 'Memorial commemorative monument and tower north of Prishtinë (Obiliq). Guarded by Kosovo Police SPU.',
        lat: 42.6908,
        lon: 21.1242
      },
      geometry: {
        type: 'Point',
        coordinates: [21.1242, 42.6908]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'spz-draganac',
        name: 'Special Protective Zone: Draganac Monastery',
        category: 'spz',
        status: 'Protected Heritage Area · Eastern Kosovo',
        securityLevel: 'MEDIUM SENSITIVITY',
        description: 'Active 14th-century monastery in Novo Brdo municipality serving the eastern Kosovo enclaves.',
        lat: 42.5414,
        lon: 21.4683
      },
      geometry: {
        type: 'Point',
        coordinates: [21.4683, 42.5414]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'spz-duboki-potok',
        name: 'Special Protective Zone: Duboki Potok Monastery',
        category: 'spz',
        status: 'Protected Heritage Area · Ibarski Kolašin',
        securityLevel: 'MEDIUM SENSITIVITY',
        description: '14th-century monastery situated in northern Ibarski Kolašin (Zubin Potok municipality).',
        lat: 42.9239,
        lon: 20.6789
      },
      geometry: {
        type: 'Point',
        coordinates: [20.6789, 42.9239]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'spz-zociste',
        name: 'Special Protective Zone: Zočište Monastery (Sveti Vrači)',
        category: 'spz',
        status: 'Protected Heritage Area · Rahovec Sector',
        securityLevel: 'ELEVATED MONITORING',
        description: 'Medieval monastery dedicated to Saints Cosmas and Damian, situated in Zočište near Rahovec.',
        lat: 42.3831,
        lon: 20.7103
      },
      geometry: {
        type: 'Point',
        coordinates: [20.7103, 42.3831]
      }
    }
  ]
};

/**
 * Authoritative Dataset: KFOR Main Supply Routes (MSR) & Strategic Patrol Corridors
 * Official NATO / KFOR theater callsigns and designated logistical arteries.
 */
export const KFOR_MSR_ROUTES_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    // 1. MSR BULL
    {
      type: 'Feature',
      properties: {
        id: 'msr-bull',
        callsign: 'MSR BULL',
        name: 'MSR BULL (Mitrovica – Zvečan – Leposavić – Jarinje Gate 1)',
        civilianRoute: 'Magistralni put M-22.3',
        sector: 'RC-East / Northern Sector (Mitrovica North)',
        command: 'KFOR Regional Command East (RC-East)',
        status: 'Strategic Primary Supply Route · High Freedom of Movement Patrol Priority',
        securityLevel: 'MAXIMUM TACTICAL PRIORITY',
        color: '#38bdf8',
        lengthApproxKm: 56,
        description: 'Primary northern tactical artery along the Ibar valley connecting Mitrovica through Leposavić to ABL Gate 1 (Jarinje). Monitored 24/7 by KFOR kinetic and ISR aerial patrols.'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [20.8672, 42.8945], // Mitrovica
          [20.8520, 42.9050], // Zvečan
          [20.8350, 42.9450], // Rudar
          [20.8200, 42.9850], // Banjska Junction
          [20.8100, 43.0250], // Sočanica
          [20.8033, 43.1025], // Leposavić
          [20.7800, 43.1350], // Dren
          [20.7450, 43.1650], // Lešak
          [20.7200, 43.1900], // Krn
          [20.6975, 43.2181]  // Jarinje (Gate 1)
        ]
      }
    },
    // 2. ROUTE FOX
    {
      type: 'Feature',
      properties: {
        id: 'msr-fox',
        callsign: 'ROUTE FOX',
        name: 'ROUTE FOX (Mitrovica – Zubin Potok – Gazivode – Brnjak Gate 31)',
        civilianRoute: 'Magistralni put M-2',
        sector: 'Northwest Operational Sector (Ibarski Kolašin)',
        command: 'KFOR Regional Command East / Kinetic Patrols',
        status: 'Critical Dam & ABL Access Corridor · Static Checkpoints',
        securityLevel: 'HIGH MOBILITY PATROL ROUTE',
        color: '#60a5fa',
        lengthApproxKm: 42,
        description: 'Northwestern tactical supply route running alongside Lake Gazivode towards ABL Gate 31 (Brnjak) and the critical Gazivode hydroelectric dam complex.'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [20.8672, 42.8945], // Mitrovica
          [20.8150, 42.8900], // Zupče
          [20.7600, 42.9020], // Ugljare
          [20.6900, 42.9130], // Zubin Potok
          [20.6550, 42.9400], // Velji Breg
          [20.6178, 42.9619], // Gazivode Dam
          [20.5850, 42.9700], // Lake Gazivode north shore
          [20.5519, 42.9753]  // Brnjak (Gate 31)
        ]
      }
    },
    // 3. MSR HAWK
    {
      type: 'Feature',
      properties: {
        id: 'msr-hawk',
        callsign: 'MSR HAWK',
        name: 'MSR HAWK (Hani i Elezit / Blace – Kaçanik – Ferizaj – Prishtinë)',
        civilianRoute: 'Corridor M-2 / R6 Motorway',
        sector: 'RC-East Southern Logistics Corridor',
        command: 'KFOR JLSG / RC-East Logistics Support',
        status: 'Primary International Heavy Logistics Artery · Project Hawk Bridges',
        securityLevel: 'STRATEGIC SUPPLY ARTERY',
        color: '#0284c7',
        lengthApproxKm: 78,
        description: 'Southern international lifeline connecting North Macedonia (Skopje corridor) via the Kaçanik Gorge to Prishtina and Camp Bondsteel. Subject of historical KFOR bridge modernization (Project Hawk).'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [21.2960, 42.1470], // Hani i Elezit / SMKD Border
          [21.2590, 42.2280], // Kaçanik Gorge
          [21.2150, 42.3150], // Ferizaj / Camp Bondsteel access
          [21.1900, 42.4200], // Bablak
          [21.1650, 42.5200], // Lipjan junction
          [21.1550, 42.5950], // Çagllavicë
          [21.1600, 42.6450]  // Prishtinë HQ
        ]
      }
    },
    // 4. MSR DOG
    {
      type: 'Feature',
      properties: {
        id: 'msr-dog',
        callsign: 'MSR DOG',
        name: 'MSR DOG (Prishtinë – Komoran – Klinë – Pejë)',
        civilianRoute: 'Magistralni put M-9',
        sector: 'East-West Transversal Corridor (RC-East to RC-West)',
        command: 'KFOR RC-West / Multinational Task Force',
        status: 'Strategic Transversal Axis · Inter-Regional Quick Reaction Link',
        securityLevel: 'STRATEGIC TRANSIT AXIS',
        color: '#06b6d4',
        lengthApproxKm: 85,
        description: 'Central east-west arterial transit axis connecting KFOR Film City Headquarters with Western Regional Command (Camp Villaggio Italia, Peja) and the Rugova mountain approach.'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [21.1600, 42.6450], // Prishtinë
          [21.0900, 42.6250], // Fushë Kosovë
          [21.0100, 42.5950], // Slatina Airport junction
          [20.9100, 42.5750], // Komoran
          [20.8000, 42.5650], // Kijevë pass
          [20.7100, 42.5850], // Dollc
          [20.5800, 42.6200], // Klinë
          [20.4400, 42.6450], // Zahaq
          [20.2880, 42.6600]  // Pejë (Camp Villaggio Italia)
        ]
      }
    },
    // 5. MSR LION
    {
      type: 'Feature',
      properties: {
        id: 'msr-lion',
        callsign: 'MSR LION',
        name: 'MSR LION (Prishtinë – Gračanica – Gjilan – Camp Bondsteel)',
        civilianRoute: 'Magistralni put M-25.2 / M-25',
        sector: 'RC-East Central & Eastern Staging Sector',
        command: 'KFOR RC-East / Task Force Medical & Aviation',
        status: 'Operational Staging Route · Direct Bondsteel Logistics Axis',
        securityLevel: 'HIGH MOBILITY LOGISTICS CORRIDOR',
        color: '#38bdf8',
        lengthApproxKm: 58,
        description: 'Eastern arterial corridor facilitating rapid military mobility, medevac transit, and convoys between Prishtina, eastern enclaves, and Camp Bondsteel.'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [21.1600, 42.6450], // Prishtinë
          [21.1930, 42.5980], // Gračanica
          [21.2500, 42.5400], // Kishnicë
          [21.3200, 42.4900], // Livoç
          [21.4680, 42.4630], // Gjilan
          [21.3500, 42.3900], // Camp Bondsteel Gate
          [21.2500, 42.3667]  // Camp Bondsteel Center
        ]
      }
    },
    // Route Waypoints (Shield Badges on Map)
    {
      type: 'Feature',
      properties: {
        id: 'msr-bull-waypoint',
        routeId: 'msr-bull',
        callsign: 'MSR BULL',
        name: 'MSR BULL (Mitrovica – Zvečan – Leposavić – Jarinje Gate 1)',
        civilianRoute: 'Magistralni put M-22.3',
        sector: 'RC-East / Northern Sector (Mitrovica North)',
        command: 'KFOR Regional Command East (RC-East)',
        status: 'Strategic Primary Supply Route',
        securityLevel: 'MAXIMUM TACTICAL PRIORITY',
        description: 'Primary northern tactical artery along the Ibar valley connecting Mitrovica with ABL Gate 1 (Jarinje).'
      },
      geometry: {
        type: 'Point',
        coordinates: [20.8033, 43.1025] // Leposavić
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'msr-fox-waypoint',
        routeId: 'msr-fox',
        callsign: 'ROUTE FOX',
        name: 'ROUTE FOX (Mitrovica – Zubin Potok – Gazivode – Brnjak Gate 31)',
        civilianRoute: 'Magistralni put M-2',
        sector: 'Northwest Operational Sector',
        command: 'KFOR Regional Command East',
        status: 'Critical Dam & ABL Access Corridor',
        securityLevel: 'HIGH MOBILITY PATROL ROUTE',
        description: 'Northwestern tactical supply route running alongside Lake Gazivode towards ABL Gate 31 (Brnjak).'
      },
      geometry: {
        type: 'Point',
        coordinates: [20.6900, 42.9130] // Zubin Potok
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'msr-hawk-waypoint',
        routeId: 'msr-hawk',
        callsign: 'MSR HAWK',
        name: 'MSR HAWK (Hani i Elezit / Blace – Kaçanik – Ferizaj – Prishtinë)',
        civilianRoute: 'Corridor M-2 / R6 Motorway',
        sector: 'RC-East Southern Logistics Corridor',
        command: 'KFOR JLSG',
        status: 'Primary International Heavy Logistics Artery',
        securityLevel: 'STRATEGIC SUPPLY ARTERY',
        description: 'Southern international lifeline connecting North Macedonia via the Kaçanik Gorge to Prishtina and Camp Bondsteel.'
      },
      geometry: {
        type: 'Point',
        coordinates: [21.2450, 42.2450] // Kaçanik Gorge
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'msr-dog-waypoint',
        routeId: 'msr-dog',
        callsign: 'MSR DOG',
        name: 'MSR DOG (Prishtinë – Komoran – Klinë – Pejë)',
        civilianRoute: 'Magistralni put M-9',
        sector: 'East-West Transversal Corridor',
        command: 'KFOR RC-West',
        status: 'Strategic Transversal Axis',
        securityLevel: 'STRATEGIC TRANSIT AXIS',
        description: 'Central east-west arterial transit axis connecting KFOR HQ with Western Regional Command (Peja).'
      },
      geometry: {
        type: 'Point',
        coordinates: [20.7100, 42.5850] // Klinë / Kijevë
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'msr-lion-waypoint',
        routeId: 'msr-lion',
        callsign: 'MSR LION',
        name: 'MSR LION (Prishtinë – Gračanica – Gjilan – Camp Bondsteel)',
        civilianRoute: 'Magistralni put M-25.2 / M-25',
        sector: 'RC-East Central & Eastern Staging Sector',
        command: 'KFOR RC-East',
        status: 'Operational Staging Route',
        securityLevel: 'HIGH MOBILITY LOGISTICS CORRIDOR',
        description: 'Eastern arterial corridor connecting Prishtina, eastern enclaves, and Camp Bondsteel.'
      },
      geometry: {
        type: 'Point',
        coordinates: [21.3600, 42.4300] // Gjilan / Bondsteel axis
      }
    }
  ]
};

/**
 * Authoritative Dataset: Minefields, Cluster Munition Footprints & Suspected Hazardous Areas (SHA/CHA) in Kosovo
 * Compiled from Kosovo Mine Action Centre (KMAC), KFOR EOD Coordination Cell, and HALO Trust operational records.
 */
export const MINEFIELDS_KOSOVO_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
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
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [20.1350, 42.4450],
          [20.1700, 42.4480],
          [20.1780, 42.4680],
          [20.1520, 42.4750],
          [20.1300, 42.4620],
          [20.1350, 42.4450]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
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
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [20.5050, 42.1950],
          [20.5450, 42.2020],
          [20.5520, 42.2250],
          [20.5200, 42.2300],
          [20.4980, 42.2120],
          [20.5050, 42.1950]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
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
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [20.8800, 42.4080],
          [20.9120, 42.4120],
          [20.9180, 42.4280],
          [20.8920, 42.4310],
          [20.8750, 42.4200],
          [20.8800, 42.4080]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
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
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [20.9500, 42.9520],
          [20.9880, 42.9560],
          [20.9950, 42.9780],
          [20.9620, 42.9810],
          [20.9420, 42.9660],
          [20.9500, 42.9520]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
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
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [20.4650, 42.8420],
          [20.5050, 42.8460],
          [20.5120, 42.8680],
          [20.4800, 42.8720],
          [20.4580, 42.8580],
          [20.4650, 42.8420]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
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
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [20.8250, 43.1980],
          [20.8580, 43.2020],
          [20.8650, 43.2210],
          [20.8350, 43.2250],
          [20.8180, 43.2120],
          [20.8250, 43.1980]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
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
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [20.7950, 42.7150],
          [20.8280, 42.7180],
          [20.8320, 42.7350],
          [20.8050, 42.7380],
          [20.7880, 42.7260],
          [20.7950, 42.7150]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
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
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [20.1700, 42.1680],
          [20.2080, 42.1720],
          [20.2150, 42.1910],
          [20.1820, 42.1950],
          [20.1650, 42.1810],
          [20.1700, 42.1680]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
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
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [21.2050, 42.9180],
          [21.2380, 42.9220],
          [21.2420, 42.9410],
          [21.2120, 42.9450],
          [21.1980, 42.9310],
          [21.2050, 42.9180]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
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
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [20.4050, 42.4580],
          [20.4380, 42.4620],
          [20.4420, 42.4810],
          [20.4120, 42.4850],
          [20.3980, 42.4710],
          [20.4050, 42.4580]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
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
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [21.0150, 42.2080],
          [21.0480, 42.2120],
          [21.0550, 42.2310],
          [21.0250, 42.2350],
          [21.0080, 42.2210],
          [21.0150, 42.2080]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
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
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [20.6350, 41.9180],
          [20.6680, 41.9220],
          [20.6720, 41.9420],
          [20.6420, 41.9450],
          [20.6250, 41.9310],
          [20.6350, 41.9180]
        ]]
      }
    }
  ]
};

