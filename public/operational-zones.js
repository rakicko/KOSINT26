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
        name: 'Glavni most na reci Ibar (Main Ibar Bridge)',
        category: 'bridge',
        status: 'KFOR / Carabinieri Fixed Post · Closed for Vehicles',
        securityLevel: 'HIGH SENSITIVITY',
        description: 'Ključna tačka razdvajanja Severne i Južne Mitrovice. 24/7 fiksni nadzor karabinjera.',
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
        name: 'Pešački / Tranzitni most - Bošnjačka Mahala',
        category: 'bridge',
        status: 'Open for Pedestrians & Light Traffic',
        securityLevel: 'ELEVATED MONITORING',
        description: 'Glavni mešoviti tranzitni pravac između istočnih delova Mitrovice.',
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
        id: 'crossing-suvi-do',
        name: 'Prelaz Suvi Do / Kroi i Vitakut',
        category: 'corridor',
        status: 'Open Transit',
        securityLevel: 'MEDIUM',
        description: 'Zapadni prilazni koridor reci Ibar.',
        lat: 42.8915,
        lon: 20.8490
      },
      geometry: {
        type: 'Point',
        coordinates: [20.8490, 42.8915]
      }
    },
    // Special Protective Zones (SPZ)
    {
      type: 'Feature',
      properties: {
        id: 'spz-banjska',
        name: 'Specijalna Zaštitna Zona: Manastir Banjska',
        category: 'spz',
        status: 'Protected Heritage Area',
        securityLevel: 'HIGH SENSITIVITY',
        description: 'Srednjovekovni manastir Banjska (14. vek) sa zaštićenim bezbednosnim perimetrom u opštini Zvečan.',
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
        name: 'Specijalna Zaštitna Zona: Manastir Sokolica',
        category: 'spz',
        status: 'Protected Heritage Area',
        securityLevel: 'MEDIUM',
        description: 'Manastir Sokolica na padinama brda Sokolica, opština Zvečan.',
        lat: 42.9230,
        lon: 20.8710
      },
      geometry: {
        type: 'Point',
        coordinates: [20.8710, 42.9230]
      }
    },
    // Primary Security Patrol Corridors
    {
      type: 'Feature',
      properties: {
        id: 'corridor-m22',
        name: 'Magistralni Koridor M-22.3 (Mitrovica – Zvečan – Leposavić – Jarinje)',
        category: 'patrol_route',
        status: 'Primary Arterial Supply Route',
        securityLevel: 'STRATEGIC TRANSIT CORRIDOR',
        description: 'Glavna drumska komunikacija koja povezuje Severnu Mitrovicu sa administrativnim prelazom Jarinje.'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [20.8672, 42.8945], // Severna Mitrovica
          [20.8400, 42.9050], // Zvečan
          [20.8100, 43.0100], // Slatina / Sočanica
          [20.8033, 43.1025], // Leposavić
          [20.7500, 43.1600], // Lešak
          [20.6975, 43.2181]  // Jarinje
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'corridor-m2',
        name: 'Magistralni Koridor M-2 (Mitrovica – Zubin Potok – Gazivode – Brnjak)',
        category: 'patrol_route',
        status: 'Primary Arterial Supply Route',
        securityLevel: 'STRATEGIC TRANSIT CORRIDOR',
        description: 'Glavna drumska komunikacija duž jezera Gazivode prema administrativnom prelazu Brnjak.'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [20.8672, 42.8945], // Severna Mitrovica
          [20.7800, 42.8950],
          [20.6900, 42.9130], // Zubin Potok
          [20.6178, 42.9619], // Gazivode
          [20.5519, 42.9753]  // Brnjak
        ]
      }
    }
  ]
};
