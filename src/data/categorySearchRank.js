/**
 * Türkiye perakende oyuncak aramalarında öncelikli kelimeler (yüksek → düşük).
 */
export const CATEGORY_SEARCH_RANK = [
  'oyuncak',
  'eğitici oyuncak',
  'egitici oyuncak',
  'çocuk oyuncak',
  'peluş oyuncak',
  'pelus oyuncak',
  'bebek oyuncak',
  'zeka oyuncak',
  'puzzle',
  'montessori',
  'kutu oyun',
  'oyuncak araba',
  'stem oyuncak',
  'ahşap oyuncak',
  'yapboz',
];

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

/** Kategori adına göre arama popülerliği skoru (yüksek = daha popüler) */
export function getCategorySearchScore(name) {
  const haystack = normalizeSearchText(name);
  if (!haystack) return 0;
  let score = 0;
  CATEGORY_SEARCH_RANK.forEach((term, index) => {
    const kw = normalizeSearchText(term);
    if (kw && haystack.includes(kw)) {
      score += CATEGORY_SEARCH_RANK.length - index;
    }
  });
  return score;
}
