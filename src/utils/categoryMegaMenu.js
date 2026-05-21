import { getCategorySearchScore } from '@/data/categorySearchRank';

/** Ana menü grupları — ürün kategorilerini mega menüde gruplar */
export const MEGA_GROUPS = [
  {
    id: 'oyuncak',
    label: 'Oyuncak',
    match: (name) =>
      /oyuncak|araba|figür|figur|peluş|pelus|lego|yapı|yapi|silah|pist|bebek oyuncak/i.test(name),
  },
  {
    id: 'egitici',
    label: 'Eğitici & Zeka',
    match: (name) => /eğitici|egitici|zeka|puzzle|yapboz|bilim|montessori|ahşap|ahsap/i.test(name),
  },
  {
    id: 'bebek',
    label: 'Bebek & Aktivite',
    match: (name) => /bebek|aktivite|kukla|figür oyuncak/i.test(name),
  },
  {
    id: 'aile',
    label: 'Kutu & Aile Oyunu',
    match: (name) => /kutu oyun|satranç|okey|aile/i.test(name),
  },
  {
    id: 'diger',
    label: 'Diğer Ürünler',
    match: () => true,
  },
];

export function buildCategoryMegaMenu(categories, products) {
  const cats = Array.isArray(categories) ? categories : [];
  const counts = {};
  (Array.isArray(products) ? products : []).forEach((p) => {
    const k = String(p.category || '').trim() || 'Genel';
    counts[k] = (counts[k] || 0) + 1;
  });

  const sorted = [...cats].sort((a, b) => {
    const score = getCategorySearchScore(b.name) - getCategorySearchScore(a.name);
    if (score !== 0) return score;
    return (counts[b.name] || 0) - (counts[a.name] || 0);
  });

  const assigned = new Set();
  const groups = MEGA_GROUPS.map((g) => {
    const items =
      g.id === 'diger'
        ? sorted.filter((c) => !assigned.has(c.name))
        : sorted.filter((c) => {
            if (assigned.has(c.name)) return false;
            if (g.match(c.name)) {
              assigned.add(c.name);
              return true;
            }
            return false;
          });
    return { ...g, categories: items };
  }).filter((g) => g.categories.length > 0);

  return groups;
}

export function splitIntoColumns(items, cols = 4) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return [];
  const perCol = Math.ceil(list.length / cols);
  const columns = [];
  for (let i = 0; i < cols; i += 1) {
    const slice = list.slice(i * perCol, (i + 1) * perCol);
    if (slice.length) columns.push(slice);
  }
  return columns;
}
