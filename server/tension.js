'use strict';

const { calculateRegionalTension, isNorthKosovoOrCheckpoint, getRegionalTension: computeTension } = require('../skills/news-intel/tension-index');
const { fetchNews } = require('../skills/news-intel/skill');

/**
 * Computes regional tension from provided news items or fetches live 24h news if omitted.
 * @param {Array<object>} [items]
 * @param {number|Date|string} [referenceTime=Date.now()]
 * @returns {Promise<object>}
 */
async function getRegionalTension(items = null, referenceTime = Date.now()) {
  let newsItems = items;
  if (!newsItems || !Array.isArray(newsItems)) {
    try {
      const newsData = await fetchNews({ location: 'Kosovo', timeline: '24h' });
      newsItems = (newsData && Array.isArray(newsData.items)) ? newsData.items : [];
    } catch (err) {
      console.error('[tension] Live news fetch failed, computing baseline tension:', err.message);
      newsItems = [];
    }
  }

  return calculateRegionalTension(newsItems, referenceTime);
}

module.exports = {
  calculateRegionalTension,
  isNorthKosovoOrCheckpoint,
  getRegionalTension
};
