'use strict';

require('dotenv').config({
  path: require('path').join(__dirname, '../../.env')
});

const axios = require('axios');
const xml2js = require('xml2js');


// ─────────────────────────────────────
// Kosovo RSS SOURCES
// ─────────────────────────────────────

const SOURCES = [

  // Serbian sources
  {
    url: 'https://kossev.info/feed/',
    name: 'KoSSev',
    lang: 'sr'
  },

  {
    url: 'https://radiomitrovicasever.com/feed/',
    name: 'Radio Mitrovica Sever',
    lang: 'sr'
  },

  {
    url: 'https://bih.kosova.info/feed/',
    name: 'Kosova.info',
    lang: 'sr'
  },


  // Albanian sources
  {
    url: 'https://www.gazetaexpress.com/feed',
    name: 'Gazeta Express',
    lang: 'al'
  },

  {
    url: 'https://indeksonline.net/feed/',
    name: 'Indeks Online',
    lang: 'al'
  },

  {
    url: 'https://lajmi.net/feed/',
    name: 'Lajmi',
    lang: 'al'
  },

  {
    url: 'https://jepize.com/feed/',
    name: 'Jepize',
    lang: 'al'
  },

  {
    url: 'https://mitropol.net/feed/',
    name: 'Mitropol',
    lang: 'al'
  },

  {
    url: 'https://mitrovicasot.net/feed/',
    name: 'MitrovicaSOT',
    lang: 'al'
  },

  {
    url: 'https://klankosova.tv/feed/',
    name: 'Klan Kosova',
    lang: 'al'
  }

];



// ─────────────────────────────────────
// Source reliability
// ─────────────────────────────────────

const SOURCE_RELIABILITY = {

  'KoSSev': 0.90,

  'Radio Mitrovica Sever': 0.85,

  'Kosova.info': 0.80,

  'Gazeta Express': 0.85,

  'Indeks Online': 0.75,

  'Lajmi': 0.70,

  'Jepize': 0.65,

  'Mitropol': 0.70,

  'MitrovicaSOT': 0.80,

  'Klan Kosova': 0.85

};




// ─────────────────────────────────────
// Keywords SR + AL
// ─────────────────────────────────────

const ALERT_WORDS = {


  security: [

    // SR

    'policija',
    'policija kosova',
    'kfor',
    'eulex',
    'hapšenje',
    'hapsenje',
    'uhapšen',
    'uhapsen',
    'incident',
    'sukob',
    'napad',
    'pritvor',
    'istraga',


    // AL

    'policia',
    'policia e kosoves',
    'arrestim',
    'arrestuar',
    'incident',
    'sulm',
    'konflikt',
    'hetim',
    'ndalim'

  ],



  unrest: [

    // SR

    'protest',
    'protesti',
    'demonstracija',
    'blokada',
    'barikada',
    'neredi',
    'tenzije',
    'kriza',
    'sukob',


    // AL

    'protestë',
    'protesta',
    'demonstratë',
    'bllokadë',
    'barrikadë',
    'tensione',
    'përplasje',
    'krizë'

  ],



  emergency: [

    // SR

    'požar',
    'pozar',
    'eksplozija',
    'nesreća',
    'nesreca',
    'poplava',
    'evakuacija',
    'spasavanje',


    // AL

    'zjarr',
    'eksplodim',
    'aksident',
    'përmbytje',
    'evakuim',
    'shpëtim'

  ],




  politics: [

    // SR

    'vlada',
    'skupština',
    'sporazum',
    'dijalog',
    'brisel',
    'izbori',
    'premijer',
    'predsednik',


    // AL

    'qeveria',
    'kuvendi',
    'marrëveshje',
    'dialog',
    'bruksel',
    'zgjedhje',
    'kryeministër',
    'president'

  ],




  north_kosovo: [

    // SR

    'sever kosova',
    'severu kosova',
    'mitrovica',
    'zvečan',
    'zvecan',
    'leposavić',
    'leposaviq',
    'zubin potok',
    'kosovska mitrovica',


    // AL

    'veriu i kosoves',
    'mitrovicë',
    'zveçan',
    'leposaviq',
    'zubin potok'

  ]


};





// ─────────────────────────────────────
// Article scoring
// ─────────────────────────────────────


function scoreArticle(title, description) {


  const text =
    `${title} ${description}`
      .toLowerCase();



  let score = 1;

  let category = 'other';

  let tags = [];



  for (const [cat, words] of Object.entries(ALERT_WORDS)) {


    let hits = 0;



    for (const word of words) {


      if (text.includes(word)) {

        hits++;

        tags.push(word);

      }

    }



    if (hits > 0) {


      if (hits >= 3)
        score += 4;

      else if (hits === 2)
        score += 2;

      else
        score += 1;



      category = cat;



      // North Kosovo priority

      if (cat === 'north_kosovo') {

        score += 2;

      }

    }


  }




  return {


    score: Math.min(10, score),


    category,


    tags:
      [...new Set(tags)]

  };

}





// ─────────────────────────────────────
// RSS Fetch
// ─────────────────────────────────────


async function fetchRSS(source) {

  try {

    const response =
      await axios.get(
        source.url,
        {
          timeout: 8000,

          headers: {
            'User-Agent':
              'Mozilla/5.0 SENTINEL Intelligence'
          }
        }
      );


    const parsed =
      await xml2js.parseStringPromise(
        response.data
      );


    const items =
      parsed.rss?.channel?.[0]?.item || [];


    return items.map(
      (item,index)=>{


        const title =
          item.title?.[0] || '';



        const description =
          item.description?.[0]
          ?.replace(/<[^>]+>/g,'')
          || '';



        // FIX: RSS link parsing
        let link = '#';


        if (typeof item.link?.[0] === 'string') {

          link = item.link[0];

        }
        else if (item.link?.[0]?._) {

          link = item.link[0]._ ;

        }
        else if (item.link?.[0]?.$?.href) {

          link = item.link[0].$.href;

        }



        const date =
          item.pubDate?.[0]
          ||
          new Date().toISOString();




        const analysis =
          scoreArticle(
            title,
            description
          );




        return {


          id:
            `${source.name}-${index}`,



          title,



          description:
            description.substring(0,300),



          url:
            link,



          source:
            source.name,



          language:
            source.lang,



          reliability:
            SOURCE_RELIABILITY[source.name] || 0.5,



          publishedAt:
            new Date(date).toISOString(),



          intensityScore:
            analysis.score,



          category:
            analysis.category,



          tags:
            analysis.tags


        };


      });


  }

  catch(error) {


    console.log(
      `[news-intel] ${source.name} failed: ${error.message}`
    );


    return [];

  }

}



// ─────────────────────────────────────
// MAIN
// ─────────────────────────────────────


async function fetchNews({

  location='Kosovo',
  timeline='24h',
  keywords=[]

}) {

  console.log(
    `[news-intel] Kosovo RSS scan: ${location}`
  );


  const feeds =
    await Promise.all(
      SOURCES.map(fetchRSS)
    );


  let articles =
    feeds.flat();


  articles.sort(
    (a,b)=>
      b.intensityScore -
      a.intensityScore
  );


  return {

    skill: 'news-intel',

    location,

    fetchedAt:
      new Date().toISOString(),

    source:
      'kosovo-local-rss',

    items:
      articles.slice(0,50),


    summary: {

      total:
        articles.length,

      highIntensity:
        articles.filter(
          a => a.intensityScore >= 7
        ).length,

      maxScore:
        articles[0]?.intensityScore || 0

    }

  };

}


module.exports = {
  fetchNews
};