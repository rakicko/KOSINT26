'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// KOSINT Centralized Multilingual Canonical Ontology & Lexicon
// ─────────────────────────────────────────────────────────────────────────────

const CANONICAL_ENTITIES = {
  people: {
    'person:albin_kurti': {
      id: 'person:albin_kurti',
      label: 'Albin Kurti',
      role: 'Prime Minister of Kosovo',
      disqualifiers: ['kurt miller', 'kurt cobain', 'kurt westergaard'],
      variants: {
        sr: ['albin kurti', 'kurti', 'kurtija', 'kurtiju', 'kurtijem', 'kurtit'],
        al: ['albin kurti', 'kurti', 'kurtit', 'kurti-t', 'kurtin', 'kryeministri kurti'],
        en: ['albin kurti', 'kurti', "kurti's"],
        cyrillic: ['албин курти', 'курти', 'куртија', 'куртију', 'куртијем']
      }
    },
    'person:ozkan_ulutas': {
      id: 'person:ozkan_ulutas',
      label: 'Özkan Ulutaş',
      role: 'KFOR Commander',
      variants: {
        sr: ['ozkan ulutas', 'ozkan ulutaš', 'ulutas', 'ulutaš', 'ulutaša', 'ulutašu', 'ulutašem', 'ulutasa', 'ulutasu', 'ulutasem', 'general ulutas', 'general-major ulutas'],
        al: ['ozkan ulutas', 'özkan ulutaş', 'ulutash', 'ulutas', 'ulutaş', 'ulutashit', 'ulutashin', 'komandanti i kfor-it ulutas'],
        en: ['ozkan ulutas', 'ozkan ulutash', 'major general ulutas'],
        cyrillic: ['озкан улуташ', 'улуташ', 'улуташа', 'улуташу', 'улуташем']
      }
    },
    'person:vjosa_osmani': {
      id: 'person:vjosa_osmani',
      label: 'Vjosa Osmani',
      role: 'President of Kosovo',
      variants: {
        sr: ['vjosa osmani', 'osmani'],
        al: ['vjosa osmani', 'osmani', 'osmani-sadriu'],
        en: ['vjosa osmani', 'osmani'],
        cyrillic: ['вјоса османи', 'османи']
      }
    },
    'person:aleksandar_vucic': {
      id: 'person:aleksandar_vucic',
      label: 'Aleksandar Vučić',
      role: 'President of Serbia',
      disqualifiers: ['vuk karadžić', 'vuk karadzic', 'vuk jeremić', 'vuk jeremic', 'vuk samotnjak', 'vuk je', 'vukovi'],
      variants: {
        sr: ['aleksandar vučić', 'vučić', 'vucic', 'vučića', 'vucica', 'vučiću'],
        al: ['aleksandar vuçiq', 'vuçiq', 'vucic', 'vuçiqit'],
        en: ['aleksandar vucic', 'vucic'],
        cyrillic: ['александар вучић', 'вучић', 'вучића', 'вучићу']
      }
    },
    'person:xhelal_svecla': {
      id: 'person:xhelal_svecla',
      label: 'Xhelal Sveçla',
      role: 'Minister of Internal Affairs of Kosovo',
      variants: {
        sr: ['dželjalj svećla', 'svećla', 'svecla', 'sveçla'],
        al: ['xhelal sveçla', 'sveçla', 'svecla'],
        en: ['xhelal svecla', 'svecla'],
        cyrillic: ['џељаљ свечља', 'свечља']
      }
    },
    'person:petar_petkovic': {
      id: 'person:petar_petkovic',
      label: 'Petar Petković',
      role: 'Director of Office for Kosovo and Metohija',
      variants: {
        sr: ['petar petković', 'petković', 'petkovic'],
        al: ['petar petkoviq', 'petkoviq'],
        en: ['petar petkovic', 'petkovic'],
        cyrillic: ['петар петковић', 'петковић']
      }
    },
    'person:nenad_rasic': {
      id: 'person:nenad_rasic',
      label: 'Nenad Rašić',
      role: 'Minister for Communities and Returns',
      variants: {
        sr: ['nenad rašić', 'rašić', 'rasic'],
        al: ['nenad rashiq', 'rashiq', 'rasic'],
        en: ['nenad rasic', 'rasic'],
        cyrillic: ['ненад рашић', 'рашић']
      }
    },
    'person:croatian_pilot': {
      id: 'person:croatian_pilot',
      label: 'Croatian Pilot',
      role: 'Pilot',
      variants: {
        sr: ['hrvatski pilot', 'pilot hrvat', 'pilota iz hrvatske'],
        al: ['pilot kroat', 'piloti kroat', 'pilotin kroat'],
        en: ['croatian pilot'],
        cyrillic: ['хрватски пилот']
      }
    },
    'person:milan_radoicic': {
      id: 'person:milan_radoicic',
      label: 'Milan Radoičić',
      role: 'Former VP of Srpska Lista',
      variants: {
        sr: ['milan radoičić', 'radoičić', 'radoicic', 'radojičić'],
        al: ['milan radoiçiq', 'radoiçiq', 'radojçiq'],
        en: ['milan radoicic', 'radoicic'],
        cyrillic: ['милан радоичић', 'радоичић']
      }
    }
  },

  institutions: {
    'inst:kfor': {
      id: 'inst:kfor',
      label: 'KFOR (NATO Mission)',
      variants: {
        sr: ['kfor', 'kfor-a', 'kforu', 'kfora', 'nato kfor', 'snage kfor-a', 'kfor-om'],
        al: ['kfor', 'kfor-i', 'kforit', 'kfor-it', 'kforin', 'misioni i kfor-it'],
        en: ['kfor', 'nato kfor', 'kfor mission'],
        cyrillic: ['кфор', 'кфора', 'кфору', 'кфор-а']
      }
    },
    'inst:eulex': {
      id: 'inst:eulex',
      label: 'EULEX (EU Rule of Law Mission)',
      variants: {
        sr: ['eulex', 'euleks', 'euleksa', 'evleks'],
        al: ['eulex', 'eulex-i', 'eulexit', 'misioni eulex'],
        en: ['eulex', 'eulex mission'],
        cyrillic: ['еулекс', 'еулекса']
      }
    },
    'inst:kosovo_police': {
      id: 'inst:kosovo_police',
      label: 'Kosovo Police',
      variants: {
        sr: ['policija kosova', 'kosovska policija', 'policija', 'policajci', 'policijska stanica', 'specijalna policija', 'rosu', 'specijalci'],
        al: ['policia e kosovës', 'policia e kosoves', 'policia', 'policët', 'policinë', 'policisë', 'njoftim i policisë', 'aksion policor', 'njësia speciale'],
        en: ['kosovo police', 'police', 'police officers', 'special police unit'],
        cyrillic: ['полиција косова', 'косовска полиција', 'полиција', 'полицајци']
      }
    },
    'inst:srpska_lista': {
      id: 'inst:srpska_lista',
      label: 'Srpska Lista',
      variants: {
        sr: ['srpska lista', 'srpske liste', 'srpskoj listi'],
        al: ['lista serbe', 'listës serbe'],
        en: ['serb list', 'srpska lista'],
        cyrillic: ['српска листа', 'српске листе']
      }
    },
    'inst:srpska_demokratija': {
      id: 'inst:srpska_demokratija',
      label: 'Srpska Demokratija',
      variants: {
        sr: ['srpska demokratija', 'srpske demokratije', 'aleksandar arsenijević', 'stefan veljković'],
        al: ['demokracia serbe'],
        en: ['serb democracy'],
        cyrillic: ['српска демократија', 'српске демократије']
      }
    },
    'inst:fsk': {
      id: 'inst:fsk',
      label: 'FSK / KSF',
      variants: {
        sr: ['fsk', 'ksf', 'kosovske bezbednosne snage', 'kbs'],
        al: ['fsk', 'forca e sigurisë së kosovës', 'forca e sigurise', 'ushtria e kosovës'],
        en: ['ksf', 'kosovo security force', 'fsk'],
        cyrillic: ['кбс', 'косовске безбедносне снаге']
      }
    },
    'inst:court': {
      id: 'inst:court',
      label: 'Court / Prosecution / Judiciary',
      variants: {
        sr: ['sud', 'osnovni sud', 'vrhovni sud', 'apelacioni sud', 'tužilaštvo', 'specijalno tužilaštvo', 'tužilac'],
        al: ['gjykata', 'gjykata themelore', 'gjykata supreme', 'prokuroria', 'prokuroria speciale', 'prokurori'],
        en: ['court', 'basic court', 'supreme court', 'prosecution', 'prosecutor', 'special prosecution'],
        cyrillic: ['суд', 'основни суд', 'тужилаштво', 'тужилац']
      }
    }
  },

  locations: {
    'loc:mitrovica': {
      id: 'loc:mitrovica',
      name: 'Mitrovicë / Mitrovica',
      municipality: 'Mitrovica',
      isNorth: true,
      disqualifiers: ['mitropolija', 'mitropolit', 'mitropolije'],
      variants: {
        sr: ['mitrovica', 'mitrovici', 'mitrovice', 'mitrovicom', 'kosovska mitrovica', 'kosovskoj mitrovici'],
        al: ['mitrovicë', 'mitrovica', 'mitrovice', 'mitrovicës', 'mitrovicën'],
        en: ['mitrovica', 'mitrovice'],
        cyrillic: ['митровица', 'митровици', 'митровице', 'косовска митровица']
      }
    },
    'loc:mitrovica_north': {
      id: 'loc:mitrovica_north',
      name: 'North Mitrovica',
      parent: 'loc:mitrovica',
      municipality: 'North Mitrovica',
      isNorth: true,
      variants: {
        sr: ['severna mitrovica', 'severnoj mitrovici', 'severne mitrovice', 'sever mitrovice', 'severni deo mitrovice'],
        al: ['mitrovica veriore', 'mitrovicë e veriut', 'mitrovicën e veriut', 'veri të mitrovicës'],
        en: ['north mitrovica', 'northern mitrovica'],
        cyrillic: ['северна митровица', 'северној митровици']
      }
    },
    'loc:mitrovica_south': {
      id: 'loc:mitrovica_south',
      name: 'South Mitrovica',
      parent: 'loc:mitrovica',
      municipality: 'South Mitrovica',
      isNorth: false,
      variants: {
        sr: ['južna mitrovica', 'juzna mitrovica', 'južnoj mitrovici'],
        al: ['mitrovica jugore', 'mitrovicë e jugut', 'jug të mitrovicës'],
        en: ['south mitrovica', 'southern mitrovica'],
        cyrillic: ['јужна митровица']
      }
    },
    'loc:ibar_bridge': {
      id: 'loc:ibar_bridge',
      name: 'Ibar Bridge',
      parent: 'loc:mitrovica',
      isNorth: true,
      variants: {
        sr: ['most na ibru', 'mostu na ibru', 'mosta na ibru', 'ibarski most', 'ibarskom mostu'],
        al: ['ura e ibrit', 'urën e ibrit', 'urës së ibrit', 'ura mbi ibër', 'urës mbi ibër'],
        en: ['ibar bridge', 'ibër bridge', 'bridge over ibar'],
        cyrillic: ['мост на ибру', 'ибарски мост']
      }
    },
    'loc:zvecan': {
      id: 'loc:zvecan',
      name: 'Zvečan / Zveçan',
      municipality: 'Zvečan',
      isNorth: true,
      disqualifiers: ['zvečarka', 'zvecarka', 'zvečarke', 'zvecarke'],
      variants: {
        sr: ['zvečan', 'zvećan', 'zvecan', 'zvečanu', 'zvečana'],
        al: ['zveçan', 'zveqan', 'zveçani', 'zveçanit'],
        en: ['zvecan', 'zvechan'],
        cyrillic: ['звечан', 'звечану', 'звечана']
      }
    },
    'loc:banjska': {
      id: 'loc:banjska',
      name: 'Banjska',
      parent: 'loc:zvecan',
      municipality: 'Zvečan',
      isNorth: true,
      variants: {
        sr: ['banjska', 'banjske', 'banjski', 'banjskoj'],
        al: ['banjskë', 'banjska', 'banjskës', 'banjske'],
        en: ['banjska'],
        cyrillic: ['бањска', 'бањске', 'бањској']
      }
    },
    'loc:leposavic': {
      id: 'loc:leposavic',
      name: 'Leposavić / Leposaviq',
      municipality: 'Leposavić',
      isNorth: true,
      variants: {
        sr: ['leposavić', 'leposavic', 'leposaviću', 'leposavića'],
        al: ['leposaviq', 'leposaviqi', 'leposaviqit'],
        en: ['leposavic'],
        cyrillic: ['лепосавић', 'лепосавићу', 'лепосавића']
      }
    },
    'loc:jarinje': {
      id: 'loc:jarinje',
      name: 'Jarinje',
      parent: 'loc:leposavic',
      isNorth: true,
      variants: {
        sr: ['jarinje', 'jarinja', 'jarinju', 'prelaz jarinje'],
        al: ['jarinjë', 'jarinje', 'pika në jarinjë'],
        en: ['jarinje', 'jarinje crossing'],
        cyrillic: ['јариње', 'јариња', 'јарињу']
      }
    },
    'loc:zubin_potok': {
      id: 'loc:zubin_potok',
      name: 'Zubin Potok',
      municipality: 'Zubin Potok',
      isNorth: true,
      disqualifiers: ['zubna ordinacija', 'zubni lekar', 'zubne ordinacije', 'zubobolja'],
      variants: {
        sr: ['zubin potok', 'zubinom potoku', 'zubina potoka', 'zubin-potok'],
        al: ['zubin potok', 'zubin potokut', 'zubin-potok'],
        en: ['zubin potok'],
        cyrillic: ['зубин поток', 'зубином потоку']
      }
    },
    'loc:brnjak': {
      id: 'loc:brnjak',
      name: 'Brnjak / Bërnjak',
      parent: 'loc:zubin_potok',
      isNorth: true,
      variants: {
        sr: ['brnjak', 'brnjaku', 'brnjaka', 'prelaz brnjak'],
        al: ['bërnjak', 'bernjak', 'bërnjaku', 'pika në bërnjak'],
        en: ['brnjak', 'brnjak crossing'],
        cyrillic: ['брњак', 'брњаку']
      }
    },
    'loc:gazivode': {
      id: 'loc:gazivode',
      name: 'Gazivode / Ujman',
      parent: 'loc:zubin_potok',
      isNorth: true,
      variants: {
        sr: ['gazivode', 'gazivodama', 'jezero gazivode', 'gazivoda'],
        al: ['ujman', 'ujmani', 'liqeni i ujmanit'],
        en: ['gazivode', 'lake gazivode', 'lake ujman'],
        cyrillic: ['газиводе', 'језеро газиводе']
      }
    },
    'loc:prishtina': {
      id: 'loc:prishtina',
      name: 'Prishtinë / Priština',
      municipality: 'Pristina',
      isNorth: false,
      variants: {
        sr: ['priština', 'pristina', 'prištini', 'prištine'],
        al: ['prishtinë', 'prishtina', 'prishtine', 'prishtinën', 'prishtinës'],
        en: ['pristina', 'prishtina'],
        cyrillic: ['приштина', 'приштини', 'приштине']
      }
    },
    'loc:peja': {
      id: 'loc:peja',
      name: 'Pejë / Peć',
      municipality: 'Peć',
      isNorth: false,
      disqualifiers: ['pećina', 'pecina', 'pećine', 'pecine', 'pećini', 'pecini', 'pećinski', 'peć na drva', 'peć na pelet', 'peć za grejanje'],
      variants: {
        sr: ['peć', 'pec', 'peći', 'peci'],
        al: ['pejë', 'peja', 'peje', 'pejës', 'pejën'],
        en: ['pec', 'peja'],
        cyrillic: ['пећ', 'пеći']
      }
    },
    'loc:prizren': {
      id: 'loc:prizren',
      name: 'Prizren',
      municipality: 'Prizren',
      isNorth: false,
      variants: {
        sr: ['prizren', 'prizrenu', 'prizrena'],
        al: ['prizren', 'prizreni', 'prizrenit'],
        en: ['prizren'],
        cyrillic: ['призрен', 'призрену']
      }
    },
    'loc:ferizaj': {
      id: 'loc:ferizaj',
      name: 'Ferizaj / Uroševac',
      municipality: 'Uroševac',
      isNorth: false,
      variants: {
        sr: ['uroševac', 'urosevac', 'uroševcu'],
        al: ['ferizaj', 'ferizaji', 'ferizajit'],
        en: ['ferizaj', 'urosevac'],
        cyrillic: ['урошевац', 'урошевцу']
      }
    },
    'loc:gjilan': {
      id: 'loc:gjilan',
      name: 'Gjilan / Gnjilane',
      municipality: 'Gnjilane',
      isNorth: false,
      variants: {
        sr: ['gnjilane', 'gnjilanu', 'gnjilana'],
        al: ['gjilan', 'gjilani', 'gjilanit'],
        en: ['gjilan', 'gnjilane'],
        cyrillic: ['гњилане', 'гњилану']
      }
    },
    'loc:gracanica': {
      id: 'loc:gracanica',
      name: 'Gračanica / Graçanicë',
      municipality: 'Gračanica',
      isNorth: false,
      variants: {
        sr: ['gračanica', 'gracanica', 'gračanici'],
        al: ['graçanicë', 'gracanice', 'graçanica'],
        en: ['gracanica'],
        cyrillic: ['грачаница', 'грачаници']
      }
    },
    'loc:strpce': {
      id: 'loc:strpce',
      name: 'Štrpce / Shtërpcë',
      municipality: 'Štrpce',
      isNorth: false,
      variants: {
        sr: ['štrpce', 'strpce', 'štrpcu'],
        al: ['shtërpcë', 'shterpce', 'shtërpca'],
        en: ['strpce', 'shterpce'],
        cyrillic: ['штрпце', 'штрпцу']
      }
    },
    'loc:gjakova': {
      id: 'loc:gjakova',
      name: 'Gjakovë / Đakovica',
      municipality: 'Đakovica',
      isNorth: false,
      variants: {
        sr: ['đakovica', 'djakovica', 'đakovici'],
        al: ['gjakovë', 'gjakova', 'gjakovës'],
        en: ['gjakova', 'djakovica'],
        cyrillic: ['ђаковица', 'ђаковици']
      }
    },
    'loc:kosovo': {
      id: 'loc:kosovo',
      name: 'Kosovo',
      municipality: null,
      isNorth: false,
      variants: {
        sr: ['kosovo', 'kosova', 'kosovu', 'kosovom', 'kosovo i metohija', 'kim'],
        al: ['kosovë', 'kosova', 'kosovës', 'republikës së kosovës'],
        en: ['kosovo', 'republic of kosovo'],
        cyrillic: ['косово', 'косову', 'косова', 'косово и метохија', 'ким']
      }
    }
  },

  topics: {
    'topic:ibar_bridge': {
      id: 'topic:ibar_bridge',
      label: 'Ibar Bridge Opening / Status',
      variants: {
        sr: ['otvaranje mosta', 'otvaranje ibarskog mosta', 'revitalizacija mosta', 'glavni most'],
        al: ['hapja e urës', 'hapja e urës së ibrit', 'ura kryesore'],
        en: ['opening of the bridge', 'ibar bridge opening', 'main bridge']
      }
    },
    'topic:dinar': {
      id: 'topic:dinar',
      label: 'Dinar Currency / CBK Regulation',
      variants: {
        sr: ['dinar', 'dinara', 'ukidanje dinara', 'isplata u dinarima', 'cbk regulativa'],
        al: ['dinari', 'rregullorja e bqk', 'pagesat me dinar', 'valuta serbe'],
        en: ['dinar', 'serbian dinar', 'cbk regulation']
      }
    },
    'topic:ticket_fraud': {
      id: 'topic:ticket_fraud',
      label: 'Ticket Fraud / Travel Agency Scam',
      variants: {
        sr: ['prevara sa kartama', 'lažne avionske karte', 'turistička agencija prevara'],
        al: ['mashtrim me bileta', 'bileta false', 'agjenci turistike mashtrim'],
        en: ['ticket fraud', 'fake airline tickets', 'travel agency scam']
      }
    },
    'topic:elections': {
      id: 'topic:elections',
      label: 'Elections / Voting',
      variants: {
        sr: ['izbori', 'izborima', 'glasanje', 'birački spisak'],
        al: ['zgjedhje', 'zgjedhjet', 'votim', 'procesi zgjedhor'],
        en: ['elections', 'voting', 'election process']
      }
    }
  }
};

const CANONICAL_EVENT_TYPES = {
  'event:arrest': {
    id: 'event:arrest',
    name: 'Arrest',
    baseSeverity: 'high',
    defaultScore: 8,
    actionType: 'ENFORCEMENT',
    disqualifiers: ['cardiac arrest', 'respiratory arrest', 'heart arrest', 'respiratory failure'],
    variants: {
      sr: ['uhapšen', 'uhapšeni', 'uhapšena', 'uhapšene', 'uhapšeno', 'uhapsila', 'uhapsili', 'uhapšenog', 'uhapšenih', 'hapšenje', 'hapšenja', 'hapšenju', 'hapšenjem', 'priveden', 'privedeni', 'privedena', 'privedene', 'privođenje', 'privodjenje', 'privođenja', 'privodjenja', 'privođenju', 'privodjenju', 'pritvoren', 'pritvoreni', 'pritvor', 'pritvora', 'pritvoru', 'lišen slobode', 'lišeni slobode', 'liseni slobode'],
      al: ['arrestohet', 'arrestuar', 'arrestuan', 'arrestimi', 'ndalohet', 'ndaluar', 'ndaluan', 'ndalimi', 'prangoset', 'prangosur', 'në paraburgim'],
      en: ['arrested', 'arrest', 'detained', 'detain', 'taken into custody', 'in custody', 'arresting', 'detention'],
      cyrillic: ['ухапшен', 'ухапшени', 'ухапшена', 'ухапшене', 'ухапсила', 'хапшење', 'хапшењу', 'приведен', 'приведени', 'притвор', 'лишен слободе']
    }
  },
  'event:release': {
    id: 'event:release',
    name: 'Release',
    baseSeverity: 'medium',
    defaultScore: 5,
    actionType: 'JUDICIAL_LIFECYCLE',
    variants: {
      sr: ['pušten na slobodu', 'pušten', 'pušteni', 'puštena', 'oslobođen', 'oslobođeni', 'brani se sa slobode'],
      al: ['lirohet', 'liruar', 'liruan', 'u lirua', 'lirohen', 'mbrohet në liri'],
      en: ['released', 'release', 'freed', 'set free', 'released on bail'],
      cyrillic: ['пуштен на слободу', 'пуштен', 'пуштени', 'ослобођен']
    }
  },
  'event:raid': {
    id: 'event:raid',
    name: 'Police Raid / Search',
    baseSeverity: 'high',
    defaultScore: 7,
    actionType: 'ENFORCEMENT',
    disqualifiers: ['policijska akademija', 'policijske akademije', 'police academy', 'zakletva'],
    variants: {
      sr: ['pretres', 'pretresi', 'pretreseno', 'pretresaju', 'racija', 'racije', 'akcija', 'akciji', 'akciju', 'akcije', 'policijska akcija', 'policijska operacija', 'upad policije'],
      al: ['bastisje', 'bastisur', 'bastisën', 'aksion', 'aksioni', 'aksionit', 'aksionin', 'operacion', 'operacioni', 'kontroll policor', 'aksion policor', 'operacion policor', 'bastisje në veri'],
      en: ['raid', 'raids', 'police raid', 'search operation', 'searched premises', 'police search', 'police action', 'police operation'],
      cyrillic: ['претрес', 'претреси', 'рација', 'акција', 'акцији', 'полицијска акција']
    }
  },
  'event:weapon_seizure': {
    id: 'event:weapon_seizure',
    name: 'Weapon Seizure',
    baseSeverity: 'high',
    defaultScore: 8,
    actionType: 'SEIZURE',
    variants: {
      sr: [
        'zaplena oružja', 'zaplenjeno oružje', 'zaplenjenog oružja', 'zaplenjenom oružju', 'zaplenjenim oružjem',
        'oružje zaplenjeno', 'oružje je zaplenjeno', 'oružje oduzeto', 'oružje je oduzeto',
        'zaplenjena oružja', 'zaplenjenih oružja', 'zaplenila oružje', 'zaplenili oružje', 'zaplenio oružje',
        'oduzeto oružje', 'oduzetog oružja', 'oduzetom oružju', 'oduzeli oružje', 'oduzela oružje', 'oduzeli arsenal',
        'zaplena naoružanja', 'zaplenjena municija', 'zaplenjene municije', 'zaplenjenoj municiji', 'konfiskovano oružje', 'konfiskovanog oružja'
      ],
      al: ['konfiskim i armëve', 'konfiskon armë', 'konfiskojnë armë', 'konfiskohen armë', 'konfiskohet armë', 'konfiskuar armë', 'konfiskuan armë', 'armë të konfiskuara', 'armët e konfiskuara', 'armë të sekuestruara', 'konfiskohet armatim', 'sekuestrim armësh', 'sekuestron armë', 'sekuestrojnë armë', 'sekuestrohen armë', 'sekuestrohet armë', 'sekuestruar armë', 'sekuestruan armatim', 'kapen armë', 'sekuestrohet arsenal', 'u konfiskuan armë', 'u sekuestruan armë'],
      en: ['weapons were seized', 'weapons seized', 'arms were seized', 'arms seized', 'weapons confiscated', 'weapons were confiscated', 'arms confiscation', 'seizure of weapons', 'seized ammunition', 'seized weapons', 'confiscated weapons', 'police seized weapons', 'police seized arms'],
      cyrillic: ['заплена оружја', 'заплењено оружје', 'заплењеног оружја', 'заплењеном оружју', 'оружје заплењено', 'запленила оружје', 'запленили оружје', 'одузето оружје']
    }
  },
  'event:weapon_discovery': {
    id: 'event:weapon_discovery',
    name: 'Weapon Discovery',
    baseSeverity: 'high',
    defaultScore: 8,
    actionType: 'DISCOVERY',
    variants: {
      sr: ['pronađeno oružje', 'pronadjeno oruzje', 'oružje pronađeno', 'oružje je pronađeno', 'otkriven arsenal', 'otkriveno oružje', 'pronađena municija', 'otkriveni meci'],
      al: ['gjetur armë', 'u gjetën armë', 'armë të gjetura', 'zbulim armësh', 'zbuluan armatim', 'u gjet municion'],
      en: ['weapons found', 'arms discovered', 'discovered arsenal', 'weapons cache found', 'ammunition found'],
      cyrillic: ['пронађено оружје', 'откривен арсенал', 'откривено оружје']
    }
  },
  'event:weapon_use': {
    id: 'event:weapon_use',
    name: 'Weapon Use / Gunfire',
    baseSeverity: 'critical',
    defaultScore: 9,
    actionType: 'VIOLENCE',
    disqualifiers: ['screenshot', 'screen shot', 'photo shoot', 'photoshoot', 'novogodišnji vatromet', 'vatromet', 'vatrometa'],
    variants: {
      sr: ['pucnjava', 'pucnjave', 'pucnjavi', 'pucnjavu', 'pucnjavom', 'pucano', 'ispaljeni hici', 'pucali', 'pucao', 'otvorena vatra', 'upotreba vatrenog oružja', 'rafal'],
      al: ['të shtëna', 'te shtena', 'gjuajtje me armë', 'të shtëna me armë', 'të shtënave', 'hapën zjarr', 'krisma'],
      en: ['gunfire', 'shooting', 'shots fired', 'opened fire', 'armed assault'],
      cyrillic: ['пуцњава', 'пуцњаве', 'пуцњави', 'пуцано', 'испаљени хици', 'отворена ватра']
    }
  },
  'event:drug_seizure': {
    id: 'event:drug_seizure',
    name: 'Drug Seizure',
    baseSeverity: 'high',
    defaultScore: 7,
    actionType: 'SEIZURE',
    disqualifiers: ['drugstore', 'drug store', 'apoteka', 'apoteke', 'nabavilo lekove', 'lekovi za apoteke'],
    variants: {
      sr: ['zaplena droge', 'zaplenjena droga', 'zaplenjen kanabis', 'zaplenjena marihuana', 'zaplena narkotika', 'oduzet kokain'],
      al: ['konfiskim i drogës', 'konfiskuan drogë', 'konfiskohet kanabis', 'sekuestrim i narkotikëve', 'kapen drogë', 'sekuestrohet marihuanë'],
      en: ['drugs seized', 'drug seizure', 'cannabis seized', 'narcotics confiscated', 'marijuana seized'],
      cyrillic: ['заплена дроге', 'заплењена дрога', 'заплењен канабис']
    }
  },
  'event:drug_trafficking': {
    id: 'event:drug_trafficking',
    name: 'Drug Trafficking / Smuggling',
    baseSeverity: 'high',
    defaultScore: 7,
    actionType: 'CRIME',
    disqualifiers: ['drugstore', 'drug store', 'apoteka', 'apoteke'],
    variants: {
      sr: ['šverc droge', 'sverc droge', 'krijumčarenje narkotika', 'trgovina drogom', 'narko diler', 'laboratorija droge'],
      al: ['kontrabandë droge', 'trafikim me drogë', 'trafikim i narkotikëve', 'laborator droge'],
      en: ['drug trafficking', 'drug smuggling', 'narcotics trafficking', 'drug lab'],
      cyrillic: ['шверц droge', 'кријумчарење наркотика']
    }
  },
  'event:shooting': {
    id: 'event:shooting',
    name: 'Shooting Incident',
    baseSeverity: 'critical',
    defaultScore: 9,
    actionType: 'VIOLENCE',
    disqualifiers: ['screenshot', 'screen shot', 'photoshoot', 'novogodišnji vatromet', 'vatromet'],
    variants: {
      sr: ['oružani napad', 'oružani incident', 'oružani sukob', 'ranjen iz vatrenog', 'upucan', 'upucana', 'pucnjava', 'pucnjavi'],
      al: ['sulm me armë', 'incident me armë', 'konflikt i armatosur', 'plagosur me armë', 'u plagos nga të shtënat'],
      en: ['shooting incident', 'armed conflict', 'shot and wounded', 'gun attack'],
      cyrillic: ['оружани напад', 'оружани инцидент', 'упуцан', 'пуцњава', 'пуцњави']
    }
  },
  'event:explosion': {
    id: 'event:explosion',
    name: 'Explosion / Bombing',
    baseSeverity: 'critical',
    defaultScore: 9,
    actionType: 'VIOLENCE',
    disqualifiers: ['novogodišnji vatromet', 'vatromet', 'vatrometa', 'fireworks'],
    variants: {
      sr: ['eksplozija', 'eksplodirala bomba', 'bačena bomba', 'eksplodirala naprava', 'detonacija', 'šok bomba'],
      al: ['shpërthim', 'shperthim', 'mjet shpërthyes', 'shpërtheu bomba', 'hedhje e bombës', 'shok bombë'],
      en: ['explosion', 'blast', 'bomb detonated', 'explosive device', 'stun grenade', 'grenade attack'],
      cyrillic: ['експлозија', 'експлодирала бомба', 'бачена бомба']
    }
  },
  'event:fire': {
    id: 'event:fire',
    name: 'Fire / Arson',
    baseSeverity: 'medium',
    defaultScore: 6,
    actionType: 'EMERGENCY',
    disqualifiers: ['firefighter was awarded', 'firefighter award', 'fire extinguisher', 'gašenje požara vatrogasnoj', 'dodeljena oprema'],
    variants: {
      sr: ['požar', 'pozar', 'podmetnut požar', 'zapaljen automobil', 'paljevina', 'izbio požar', 'vatrena stihija'],
      al: ['zjarr', 'zjarrvënie', 'digjet vetura', 'u përfshi nga zjarri'],
      en: ['fire', 'wildfire', 'arson', 'vehicle burned', 'car set on fire', 'blaze'],
      cyrillic: ['пожар', 'подметнут пожар', 'запаљен аутомобил']
    }
  },
  'event:protest': {
    id: 'event:protest',
    name: 'Protest / Demonstration',
    baseSeverity: 'medium',
    defaultScore: 6,
    actionType: 'UNREST',
    variants: {
      sr: ['protest', 'protesti', 'protestuju', 'demonstracije', 'okupljanje građana', 'blokada puta'],
      al: ['protestë', 'protesta', 'protestojnë', 'demonstratë', 'tubim i qytetarëve', 'bllokim rruge'],
      en: ['protest', 'protests', 'demonstration', 'rally', 'gathering', 'roadblock'],
      cyrillic: ['протест', 'протести', 'демонстрације', 'окупљање грађана']
    }
  },
  'event:clash': {
    id: 'event:clash',
    name: 'Clash / Riot / Confrontation',
    baseSeverity: 'high',
    defaultScore: 8,
    actionType: 'UNREST',
    variants: {
      sr: ['sukob', 'sukobi', 'neredi', 'pobuna', 'tuča', 'fizički sukob', 'sukobili se'],
      al: ['përplasje', 'perplasje', 'trazira', 'konflikt', 'përleshje fizike', 'u përleshën'],
      en: ['clash', 'clashes', 'riot', 'riots', 'confrontation', 'scuffle', 'brawl'],
      cyrillic: ['сукоб', 'сукоби', 'нереди', 'туча']
    }
  },
  'event:accident': {
    id: 'event:accident',
    name: 'Traffic Accident',
    baseSeverity: 'medium',
    defaultScore: 5,
    actionType: 'ACCIDENT',
    disqualifiers: ['popravljen je semafor', 'popravljen semafor', 'traffic light'],
    variants: {
      sr: ['saobraćajna nesreća', 'saobracajna nesreca', 'udes', 'sudar', 'saobraćajni udes', 'lančani sudar'],
      al: ['aksident trafiku', 'aksident rrugor', 'aksident me fatalitet', 'u përplasën dy vetura', 'aksidentohen'],
      en: ['traffic accident', 'car crash', 'road collision', 'fatal crash', 'vehicle accident'],
      cyrillic: ['саобраћајна несрећа', 'удес', 'судар']
    }
  },
  'event:espionage': {
    id: 'event:espionage',
    name: 'Espionage / Spy Activity',
    baseSeverity: 'high',
    defaultScore: 8,
    actionType: 'SECURITY',
    variants: {
      sr: ['špijunaža', 'spijunaza', 'špijun', 'rad za stranu službu', 'bia špijun', 'tajna služba'],
      al: ['spiunazh', 'spiun', 'spiunim', 'agjent i bia', 'veprimtari e inteligjencës'],
      en: ['espionage', 'spying', 'foreign intelligence', 'spy ring', 'secret agent'],
      cyrillic: ['шпијунажа', 'шпијун', 'рад за страну службу']
    }
  },
  'event:meeting': {
    id: 'event:meeting',
    name: 'Diplomatic / Official Meeting',
    baseSeverity: 'low',
    defaultScore: 3,
    actionType: 'DIPLOMACY',
    disqualifiers: ['meetingpoint', 'meeting point', 'sportska dvorana', 'sportski trening', 'treningu'],
    variants: {
      sr: ['sastanak', 'sastanka', 'sastanku', 'sastankom', 'sastanci', 'sastao', 'sastala', 'sastali', 'sastaće', 'susret', 'susreta', 'susretu', 'razgovor', 'razgovori', 'razgovarali', 'dijalog'],
      al: ['takim', 'takimi', 'takimit', 'takimin', 'takime', 'takimet', 'takohet', 'takuan', 'u takua', 'janë takuar', 'bisedime'],
      en: ['meeting', 'meetings', 'met', 'meet', 'talks', 'summit', 'discussion'],
      cyrillic: ['састанак', 'састанка', 'састанку', 'састанком', 'састао', 'сусрет', 'разговори']
    }
  },
  'event:meeting_cancellation': {
    id: 'event:meeting_cancellation',
    name: 'Meeting Cancellation / Failure',
    baseSeverity: 'medium',
    defaultScore: 6,
    actionType: 'DIPLOMACY',
    variants: {
      sr: ['otkazan', 'otkazana', 'otkazano', 'otkazani', 'otkazali', 'otkazao', 'otkazala', 'nije održan', 'nije odrzan', 'odložen', 'odloženi', 'propao sastanak', 'propali razgovori', 'otkazan sastanak', 'otkazao sastanak'],
      al: ['dështon', 'dështoi', 'deshton', 'deshtoi', 'anulohet', 'anuluar', 'nuk u mbajt', 'nuk u zhvillua', 'dështon takimi', 'dështoi takimi', 'anulohet takimi', 'refuzoi takimin'],
      en: ['cancelled', 'canceled', 'cancellation', 'postponed', 'collapsed', 'called off', 'failed meeting', 'meeting cancelled', 'meeting canceled', 'talks collapsed'],
      cyrillic: ['отказан', 'отказана', 'отказано', 'отказани', 'није одржан', 'пропали разговори', 'отказан састанак']
    }
  },
  'event:court': {
    id: 'event:court',
    name: 'Judicial Proceeding / Indictment',
    baseSeverity: 'medium',
    defaultScore: 5,
    actionType: 'JUDICIAL',
    disqualifiers: ['sudbina', 'sudbine', 'sudbini', 'sudbinom', 'zgrada suda', 'rekonstrukcija zgrade suda', 'tender za rekonstrukciju'],
    variants: {
      sr: ['suđenje', 'optužnica', 'podignuta optužnica', 'određen pritvor', 'ročište', 'presuda'],
      al: ['seancë gjyqësore', 'aktakuzë', 'u ngrit aktakuzë', 'paraburgim', 'vendim i gjykatës', 'dënohet'],
      en: ['court hearing', 'indictment', 'charges filed', 'remanded in custody', 'verdict', 'sentenced'],
      cyrillic: ['суђење', 'оптужница', 'одређен притвор', 'пресуда']
    }
  },
  'event:border_incident': {
    id: 'event:border_incident',
    name: 'Border Incident',
    baseSeverity: 'high',
    defaultScore: 7,
    actionType: 'BORDER',
    variants: {
      sr: ['granični incident', 'incident na prelazu', 'zatvoren prelaz', 'zadržavanje na prelazu', 'prelaz jarinje blokiran'],
      al: ['incident kufitar', 'incident në pikën kufitare', 'mbyllet pika kufitare', 'pritje në kufi'],
      en: ['border incident', 'crossing incident', 'border closed', 'crossing blocked'],
      cyrillic: ['гранични инцидент', 'инцидент на прелазу', 'затворен прелаз']
    }
  },
  'event:military_activity': {
    id: 'event:military_activity',
    name: 'Military Activity',
    baseSeverity: 'high',
    defaultScore: 8,
    actionType: 'MILITARY',
    variants: {
      sr: ['vojna vežba', 'pokret trupa', 'vojne snage', 'kfor vežba', 'helikopteri kfor-a', 'vojna patrola'],
      al: ['stërvitje ushtarake', 'lëvizje e trupave', 'patrullim ushtarak', 'helikopterët e kfor-it'],
      en: ['military exercise', 'troop movements', 'military patrol', 'kfor exercise', 'military helicopters'],
      cyrillic: ['војна вежба', 'покрет трупа', 'војна патрола']
    }
  },
  'event:theft': {
    id: 'event:theft',
    name: 'Theft / Burglary',
    baseSeverity: 'low',
    defaultScore: 4,
    actionType: 'CRIME',
    disqualifiers: ['osiguranje od krađe', 'osiguranje od kradje', 'theft insurance'],
    variants: {
      sr: ['krađa', 'kradja', 'krađe', 'kradje', 'krađu', 'kradju', 'krađom', 'kradjom', 'obijanje', 'obijena', 'ukrao', 'ukrala', 'ukrali', 'ukraden', 'ukradeni', 'ukradena', 'ukradeno', 'ukradene', 'ukradena stoka', 'obijena kuća'],
      al: ['vjedhje', 'vjedhja', 'vjedhjes', 'vjedhjet', 'vjedhur', 'hajdut', 'vodhën', 'vjedhje e rëndë', 'vjedhje në shtëpi'],
      en: ['theft', 'burglary', 'stolen', 'thief', 'thieves', 'break-in', 'robbed house'],
      cyrillic: ['крађа', 'крађе', 'крађу', 'обијање', 'украо', 'украден', 'украдено']
    }
  },
  'event:robbery': {
    id: 'event:robbery',
    name: 'Armed Robbery / Heist',
    baseSeverity: 'high',
    defaultScore: 7,
    actionType: 'CRIME',
    variants: {
      sr: ['razbojništvo', 'oružana pljačka', 'opljačkan', 'opljačkana banka', 'opljačkana pumpa'],
      al: ['grabitje', 'grabitje me armë', 'grabitje e armatosur', 'u grabit', 'plaçkitje'],
      en: ['armed robbery', 'robbery', 'heist', 'bank robbery', 'robbed at gunpoint'],
      cyrillic: ['разбојништво', 'оружана пљачка', 'опљачкан']
    }
  }
};

// Compatibility Matrix for Event Types (true = can be part of same event story)
const EVENT_COMPATIBILITY_MATRIX = {
  'event:arrest': [
    'event:release', 'event:court', 'event:raid', 'event:weapon_seizure', 'event:weapon_discovery',
    'event:weapon_use', 'event:shooting', 'event:drug_seizure', 'event:drug_trafficking',
    'event:theft', 'event:robbery', 'event:espionage', 'event:border_incident', 'event:clash', 'event:protest', 'event:fire'
  ],
  'event:release': [
    'event:arrest', 'event:court', 'event:raid', 'event:weapon_seizure', 'event:weapon_discovery',
    'event:drug_seizure', 'event:theft', 'event:robbery', 'event:espionage'
  ],
  'event:raid': [
    'event:arrest', 'event:release', 'event:weapon_seizure', 'event:weapon_discovery',
    'event:drug_seizure', 'event:drug_trafficking', 'event:court'
  ],
  'event:weapon_seizure': ['event:arrest', 'event:release', 'event:raid', 'event:weapon_discovery', 'event:weapon_use', 'event:shooting', 'event:drug_seizure', 'event:court'],
  'event:weapon_discovery': ['event:weapon_seizure', 'event:raid', 'event:arrest', 'event:release', 'event:court'],
  'event:weapon_use': ['event:shooting', 'event:clash', 'event:arrest', 'event:release', 'event:weapon_seizure', 'event:court'],
  'event:drug_seizure': ['event:arrest', 'event:release', 'event:raid', 'event:drug_trafficking', 'event:weapon_seizure', 'event:court'],
  'event:drug_trafficking': ['event:drug_seizure', 'event:arrest', 'event:release', 'event:raid', 'event:court'],
  'event:shooting': ['event:weapon_use', 'event:arrest', 'event:release', 'event:clash', 'event:weapon_seizure', 'event:court'],
  'event:explosion': ['event:arrest', 'event:release', 'event:clash', 'event:court'],
  'event:fire': ['event:accident', 'event:arrest', 'event:release'],
  'event:protest': ['event:clash', 'event:arrest', 'event:release'],
  'event:clash': ['event:protest', 'event:shooting', 'event:arrest', 'event:release', 'event:weapon_use'],
  'event:accident': ['event:fire'],
  'event:espionage': ['event:arrest', 'event:release', 'event:court'],
  'event:meeting': ['event:meeting_cancellation'],
  'event:meeting_cancellation': ['event:meeting'],
  'event:court': ['event:arrest', 'event:release', 'event:weapon_seizure', 'event:drug_seizure', 'event:espionage', 'event:theft', 'event:robbery', 'event:shooting'],
  'event:border_incident': ['event:clash', 'event:arrest', 'event:release', 'event:military_activity'],
  'event:military_activity': ['event:border_incident', 'event:meeting'],
  'event:theft': ['event:arrest', 'event:release', 'event:court'],
  'event:robbery': ['event:arrest', 'event:release', 'event:court', 'event:weapon_use']
};

/**
 * Checks if two location IDs are geographically compatible (same municipality/parent/child)
 */
function areLocationsCompatible(locA, locB) {
  if (!locA || !locB) return true;
  if (locA === locB) return true;

  const locObjA = CANONICAL_ENTITIES.locations[locA];
  const locObjB = CANONICAL_ENTITIES.locations[locB];
  if (!locObjA || !locObjB) return true;

  // Direct parent/child relationship
  if (locObjA.parent === locB || locObjB.parent === locA) return true;

  // Shared parent
  if (locObjA.parent && locObjB.parent && locObjA.parent === locObjB.parent) return true;

  // Shared municipality
  if (locObjA.municipality && locObjB.municipality && locObjA.municipality === locObjB.municipality) return true;

  return false;
}

/**
 * Checks if two event types are compatible
 */
function areEventTypesCompatible(typeA, typeB) {
  if (!typeA || !typeB) return true;
  if (typeA === typeB) return true;

  const allowedA = EVENT_COMPATIBILITY_MATRIX[typeA] || [];
  const allowedB = EVENT_COMPATIBILITY_MATRIX[typeB] || [];

  return allowedA.includes(typeB) || allowedB.includes(typeA);
}

const NEGATION_LEXICON = {
  sr: ['nije', 'nisu', 'nema', 'bez', 'demantovao', 'demantovala', 'negirao', 'negirala', 'odbacuje', 'porekao', 'nijedan', 'nikakav', 'netačno', 'netacno', 'nema dokaza', 'nije bilo'],
  al: ['nuk', 'nuk ka', 'nuk pati', 'mohojnë', 'mohon', 'demantoi', 'demanton', 'ska', "s'ka", 'pa', 'mohim', 'nuk është', 'nuk jane', 'pa prova'],
  en: ['not', 'no', 'never', 'denied', 'denies', 'did not', "wasn't", "weren't", 'without', 'rejected', 'false', 'refutes', 'no evidence', 'no proof']
};

const TEMPORAL_LEXICON = {
  historical: [
    'godine 2023', 'u 2023', 'u 2024', 'u 2022', 'tokom 2023', 'tokom 2022', 'prošle godine', 'prosle godine',
    'vitin e kaluar', 'në vitin 2023', 'në vitin 2022', 'last year', 'in 2023', 'in 2022', 'in 2024',
    'podseća se na', 'podseca se na', 'kujtojmë se', 'kujtojme se', 'recalling the', 'reminded of'
  ],
  planned: [
    'će se sastati', 'ce se sastati', 'planira', 'planiran', 'najavljen', 'najavljeno', 'zakazan',
    'do të takohet', 'do te takohet', 'planifikohet', 'paralajmërohet', 'pritet të', 'pritet te',
    'will meet', 'scheduled to meet', 'planned to meet', 'expected to meet'
  ],
  completed: [
    'održan je', 'odrzan je', 'održana', 'održani', 'održan sastanak', 'u mbajt', 'janë takuar', 'met today', 'meeting held', 'concluded'
  ],
  cancelled: [
    'otkazan', 'otkazana', 'otkazano', 'odložen', 'odlozen', 'dështon', 'dështoi', 'anulohet', 'anuluar', 'cancelled', 'canceled', 'called off'
  ]
};

const NUMBER_WORDS_MAP = {
  // Serbian cardinals & ordinals
  'jedan': 1, 'jedna': 1, 'jedno': 1, 'prvi': 1, 'prva': 1, 'prvo': 1, 'prvog': 1,
  'dva': 2, 'dve': 2, 'drugi': 2, 'druga': 2, 'drugo': 2, 'drugog': 2,
  'tri': 3, 'treći': 3, 'treci': 3, 'treća': 3, 'treca': 3, 'trećeg': 3,
  'četiri': 4, 'cetiri': 4, 'četvrti': 4, 'cetvrti': 4, 'četvrta': 4, 'četvrtog': 4,
  'pet': 5, 'peti': 5, 'peta': 5, 'petog': 5,
  'šest': 6, 'sest': 6, 'šesti': 6, 'sesti': 6,
  'sedam': 7, 'sedmi': 7, 'osam': 8, 'osmi': 8, 'devet': 9, 'deveti': 9, 'deset': 10, 'deseti': 10,
  'jedanaest': 11, 'dvanaest': 12, 'dvadeset': 20, 'trideset': 30, 'pedeset': 50,
  'sto': 100, 'stotinu': 100, 'hiljadu': 1000, 'milion': 1000000,
  
  // Albanian cardinals & ordinals
  'një': 1, 'nje': 1, 'i parë': 1, 'e parë': 1,
  'dy': 2, 'i dytë': 2, 'e dytë': 2,
  'tre': 3, 'tri': 3, 'i tretë': 3, 'e tretë': 3,
  'katër': 4, 'kater': 4, 'i katërt': 4, 'e katërt': 4,
  'pesë': 5, 'pese': 5, 'i pestë': 5, 'e pestë': 5,
  'gjashtë': 6, 'gjashte': 6, 'i gjashtë': 6,
  'shtatë': 7, 'shtate': 7, 'tetë': 8, 'tete': 8, 'nëntë': 9, 'nente': 9, 'dhjetë': 10, 'dhjete': 10,
  'njëmbëdhjetë': 11, 'dymbëdhjetë': 12, 'njëzet': 20, 'tridhjetë': 30, 'pesëdhjetë': 50,
  'njëqind': 100, 'qind': 100, 'mijë': 1000, 'mije': 1000, 'milion': 1000000,
  
  // English cardinals & ordinals
  'one': 1, '1st': 1, 'first': 1,
  'two': 2, '2nd': 2, 'second': 2,
  'three': 3, '3rd': 3, 'third': 3,
  'four': 4, '4th': 4, 'fourth': 4,
  'five': 5, '5th': 5, 'fifth': 5,
  'six': 6, '6th': 6, 'sixth': 6,
  'seven': 7, '7th': 7, 'seventh': 7,
  'eight': 8, '8th': 8, 'eighth': 8,
  'nine': 9, '9th': 9, 'ninth': 9,
  'ten': 10, '10th': 10, 'tenth': 10,
  'eleven': 11, 'twelve': 12, 'twenty': 20, 'thirty': 30, 'fifty': 50,
  'hundred': 100, 'thousand': 1000, 'million': 1000000
};

module.exports = {
  CANONICAL_ENTITIES,
  CANONICAL_EVENT_TYPES,
  EVENT_COMPATIBILITY_MATRIX,
  areLocationsCompatible,
  areEventTypesCompatible,
  NEGATION_LEXICON,
  NUMBER_WORDS_MAP
};
