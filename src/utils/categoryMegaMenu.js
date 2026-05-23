import { getCategorySearchScore } from '@/data/categorySearchRank';

/** Tüm kategoriler — tek liste (grup yok) */
export function buildFlatCategoryList(categories, products) {
  const cats = Array.isArray(categories) ? categories : [];
  const counts = {};
  (Array.isArray(products) ? products : []).forEach((p) => {
    const k = String(p.category || '').trim() || 'Genel';
    counts[k] = (counts[k] || 0) + 1;
  });

  return [...cats]
    .map((c) => ({
      ...c,
      productCount: counts[c.name] || 0,
    }))
    .filter((c) => c.name && (counts[c.name] || 0) > 0)
    .sort((a, b) => {
      const score = getCategorySearchScore(b.name) - getCategorySearchScore(a.name);
      if (score !== 0) return score;
      return (counts[b.name] || 0) - (counts[a.name] || 0);
    });
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

/** @deprecated Gruplu menü kaldırıldı — buildFlatCategoryList kullanın */
export function buildCategoryMegaMenu(categories, products) {
  return buildFlatCategoryList(categories, products);
}
