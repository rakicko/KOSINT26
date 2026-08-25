'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// KOSINT Multilingual Text Normalization & Transliteration Layer
// ─────────────────────────────────────────────────────────────────────────────

const CYRILLIC_TO_LATIN_MAP = {
  'А': 'A', 'а': 'a',
  'Б': 'B', 'б': 'b',
  'В': 'V', 'в': 'v',
  'Г': 'G', 'г': 'g',
  'Д': 'D', 'д': 'd',
  'Ђ': 'Đ', 'ђ': 'đ',
  'Е': 'E', 'е': 'e',
  'Ж': 'Ž', 'ж': 'ž',
  'З': 'Z', 'з': 'z',
  'И': 'I', 'и': 'i',
  'Ј': 'J', 'ј': 'j',
  'К': 'K', 'к': 'k',
  'Л': 'L', 'л': 'l',
  'Љ': 'Lj', 'љ': 'lj',
  'М': 'M', 'м': 'm',
  'Н': 'N', 'н': 'n',
  'Њ': 'Nj', 'њ': 'nj',
  'О': 'O', 'о': 'o',
  'П': 'P', 'п': 'p',
  'Р': 'R', 'р': 'r',
  'С': 'S', 'с': 's',
  'Т': 'T', 'т': 't',
  'Ћ': 'Ć', 'ћ': 'ć',
  'У': 'U', 'у': 'u',
  'Ф': 'F', 'ф': 'f',
  'Х': 'H', 'х': 'h',
  'Ц': 'C', 'ц': 'c',
  'Ч': 'Č', 'ч': 'č',
  'Џ': 'Dž', 'џ': 'dž',
  'Ш': 'Š', 'ш': 'š',
  // Cyrillic letters from regional/Russian sources if any
  'Я': 'Ja', 'я': 'ja',
  'Ю': 'Ju', 'ю': 'ju',
  'Щ': 'Šč', 'щ': 'šč',
  'Ы': 'Y', 'ы': 'y',
  'Э': 'E', 'э': 'e',
  'Ё': 'Jo', 'ё': 'jo',
  'Ѓ': 'Gj', 'ѓ': 'gj',
  'Ќ': 'Kj', 'ќ': 'kj',
  'Ѕ': 'Dz', 'ѕ': 'dz',
  'Љ': 'Lj', 'љ': 'lj',
  'Њ': 'Nj', 'њ': 'nj'
};

const DIACRITIC_FOLD_MAP = {
  'č': 'c', 'ć': 'c', 'ç': 'c', 'Č': 'C', 'Ć': 'C', 'Ç': 'C',
  'š': 's', 'Š': 'S',
  'ž': 'z', 'Ž': 'Z',
  'đ': 'dj', 'Đ': 'Dj',
  'ë': 'e', 'Ë': 'E',
  'é': 'e', 'è': 'e', 'ê': 'e', 'É': 'E', 'È': 'E', 'Ê': 'E',
  'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'Á': 'A', 'À': 'A', 'Â': 'A', 'Ä': 'A',
  'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i', 'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I',
  'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o', 'Ó': 'O', 'Ò': 'O', 'Ô': 'O', 'Ö': 'O',
  'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u', 'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U'
};

/**
 * Transliterates Cyrillic text to Latin
 */
function transliterateCyrillicToLatin(text) {
  if (!text || typeof text !== 'string') return '';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    result += CYRILLIC_TO_LATIN_MAP[char] !== undefined ? CYRILLIC_TO_LATIN_MAP[char] : char;
  }
  return result;
}

/**
 * Strips diacritics for fallback/fuzzy equivalence matching
 */
function foldDiacritics(text) {
  if (!text || typeof text !== 'string') return '';
  let res = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    res += DIACRITIC_FOLD_MAP[ch] !== undefined ? DIACRITIC_FOLD_MAP[ch] : ch;
  }
  return res.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Standardizes typographical quotes, hyphens, whitespace and punctuation
 */
function standardizePunctuation(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    // Normalize Unicode
    .normalize('NFKC')
    // Standardize single quotes/apostrophes
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035`´]/g, "'")
    // Standardize double quotes
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036«»]/g, '"')
    // Standardize dashes/hyphens
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-')
    // Clean redundant spaces
    .replace(/[\t\r\n\v\f\u00A0\u2000-\u200B\u202F\u205F\u3000]+/g, ' ')
    .trim();
}

/**
 * Central Multilingual Normalization function
 * @param {string} text
 * @returns {{
 *   originalText: string,
 *   normalizedText: string,
 *   transliteratedText: string,
 *   foldedText: string,
 *   tokens: string[]
 * }}
 */
function normalizeMultilingualText(text) {
  const originalText = typeof text === 'string' ? text : '';
  if (!originalText) {
    return {
      originalText: '',
      normalizedText: '',
      transliteratedText: '',
      foldedText: '',
      tokens: []
    };
  }

  const clean = standardizePunctuation(originalText);
  const transliterated = transliterateCyrillicToLatin(clean);
  const normalizedText = clean.toLowerCase();
  const transliteratedText = transliterated.toLowerCase();
  const foldedText = foldDiacritics(transliteratedText);

  // Extract clean alphabetical/numerical tokens
  const tokens = transliteratedText
    .replace(/[^\p{L}\p{N}\s\-]/gu, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0);

  return {
    originalText,
    normalizedText,
    transliteratedText,
    foldedText,
    tokens
  };
}

/**
 * Word/Token boundary matcher for safe phrase search
 */
function buildPhraseRegex(phrase, { exactWord = true, caseInsensitive = true } = {}) {
  const clean = phrase.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const flags = caseInsensitive ? 'iu' : 'u';
  if (exactWord) {
    return new RegExp(`(^|[^\\p{L}\\p{N}])${clean}(?=[^\\p{L}\\p{N}]|$)`, flags);
  }
  return new RegExp(clean, flags);
}

module.exports = {
  CYRILLIC_TO_LATIN_MAP,
  transliterateCyrillicToLatin,
  foldDiacritics,
  standardizePunctuation,
  normalizeMultilingualText,
  buildPhraseRegex
};
