import { suggestEmojiForName } from '@/data/categoryEmojis';
import { getCategorySearchScore } from '@/data/categorySearchRank';

export function slugifyCategory(text) {
  return String(text || '')
    .toLocaleLowerCase('tr')
    .replace(/[^a-z0-9ğüşıöç]+/gi, '-')
    .replace(/(^-|-$)/g, '');
}

export function getProductCountsByCategory(products) {
  const counts = {};
  (Array.isArray(products) ? products : []).forEach((p) => {
    const key = String(p.category || 'Genel').trim() || 'Genel';
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

/** Alfabetik değil: popüler arama kelimeleri + ürün adedi */
export function sortCategoriesBySearchPopularity(categories, productCounts = {}) {
  return [...(Array.isArray(categories) ? categories : [])].sort((a, b) => {
    const scoreA = getCategorySearchScore(a.name);
    const scoreB = getCategorySearchScore(b.name);
    if (scoreB !== scoreA) return scoreB - scoreA;

    const countA = productCounts[a.name] || 0;
    const countB = productCounts[b.name] || 0;
    if (countB !== countA) return countB - countA;

    return 0;
  });
}

export function buildCategoriesFromProducts(products) {
  const safe = Array.isArray(products) ? products : [];
  const counts = getProductCountsByCategory(safe);
  const names = [
    ...new Set(safe.map((p) => String(p.category || '').trim()).filter(Boolean)),
  ].sort((a, b) => {
    const scoreDiff = getCategorySearchScore(b) - getCategorySearchScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return (counts[b] || 0) - (counts[a] || 0);
  });

  return names.map((name, index) => ({
    id: `cat-${slugifyCategory(name)}-${index}`,
    name,
    slug: slugifyCategory(name),
    icon: suggestEmojiForName(name),
  }));
}

export const MAP_ADDRESS =
  'Oruçreis, Giyimkent 17. Sk. 35/a, 34000 Esenler/İstanbul';

export function getMapEmbedUrl(query = MAP_ADDRESS) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=tr&z=16&output=embed`;
}

export function getMapDirectionsUrl(query = MAP_ADDRESS) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}&travelmode=driving`;
}
