import { suggestEmojiForName } from '@/data/categoryEmojis';

export function slugifyCategory(text) {
  return String(text || '')
    .toLocaleLowerCase('tr')
    .replace(/[^a-z0-9ğüşıöç]+/gi, '-')
    .replace(/(^-|-$)/g, '');
}

export function buildCategoriesFromProducts(products) {
  const names = [
    ...new Set(
      (Array.isArray(products) ? products : [])
        .map((p) => String(p.category || '').trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, 'tr'));

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
