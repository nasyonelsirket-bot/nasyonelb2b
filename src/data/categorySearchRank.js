/**
 * Türkiye oyuncak / toptan B2B aramalarında en çok aranan kelimeler (yüksek → düşük öncelik).
 * Kategori adları bu listeye göre puanlanır; alfabetik sıra kullanılmaz.
 */
export const POPULAR_TOY_SEARCH_TERMS = [
  'oyuncak',
  'toptan oyuncak',
  'oyuncak araba',
  'araba',
  'kumandalı araba',
  'rc araba',
  'bebek',
  'bebek oyuncağı',
  'peluş',
  'pelüş oyuncak',
  'lego',
  'yapı blok',
  'puzzle',
  'yapboz',
  'eğitici oyuncak',
  'montessori',
  'zeka oyuncağı',
  'figür',
  'aksiyon figür',
  'karakter figür',
  'spor',
  'outdoor',
  'top',
  'futbol topu',
  'bisiklet',
  'scooter',
  'paten',
  'kaykay',
  'parti',
  'parti malzemesi',
  'balon',
  'kutlama',
  'slime',
  'ahşap oyuncak',
  'bebek arabası',
  'puset',
  'kutu oyun',
  'masa oyun',
  'müzik oyuncak',
  'boyama',
  'el işi',
  'deniz oyuncak',
  'havuz',
  'kum havuzu',
  'drone',
  'robot',
  'bilim set',
  'stem',
  'kırtasiye oyuncak',
  'çocuk oyuncak',
  'bebek & figür',
  'oyuncak arabalar',
  'egitici',
  'parti kutlama',
  'puzzle zeka',
];

/** Kategori adı → ek anahtar kelimeler (Trendyol / özel isimler) */
export const CATEGORY_SEARCH_ALIASES = {
  'oyuncak arabalar': ['araba', 'kumandalı', 'rc', 'araç', 'hot wheels'],
  'bebek & figür': ['bebek', 'peluş', 'figür', 'barbie', 'karakter'],
  'eğitici oyuncaklar': ['eğitici', 'montessori', 'zeka', 'stem', 'öğretici'],
  'outdoor & spor': ['spor', 'outdoor', 'top', 'bisiklet', 'scooter', 'açık hava'],
  'parti & kutlama': ['parti', 'balon', 'kutlama', 'doğum günü', 'süsleme'],
  'puzzle & zeka': ['puzzle', 'yapboz', 'zeka', 'bulmaca', 'kutu oyun'],
};

function getAliasesForCategory(categoryName) {
  const normalized = normalizeSearchText(categoryName);
  for (const [key, words] of Object.entries(CATEGORY_SEARCH_ALIASES)) {
    if (normalizeSearchText(key) === normalized) return words;
  }
  return [];
}

function normalizeSearchText(text) {
  return String(text || '')
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

export function getCategorySearchScore(categoryName) {
  const name = normalizeSearchText(categoryName);
  if (!name) return 0;

  let score = 0;
  const aliases = getAliasesForCategory(categoryName);

  POPULAR_TOY_SEARCH_TERMS.forEach((term, index) => {
    const t = normalizeSearchText(term);
    if (!t) return;
    const weight = POPULAR_TOY_SEARCH_TERMS.length - index;

    if (name.includes(t) || t.includes(name)) {
      score += weight * 2;
    } else {
      t.split(/\s+/).forEach((word) => {
        if (word.length > 2 && name.includes(word)) score += weight * 0.6;
      });
    }
  });

  aliases.forEach((alias) => {
    const a = normalizeSearchText(alias);
    if (a && name.includes(a)) score += 80;
  });

  return score;
}
