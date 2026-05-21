/** Trendyol / katalog ürünlerinde en çok satan sıralaması */

const EDUCATIONAL_KEYWORDS = [
  'eğitici',
  'egitici',
  'montessori',
  'zeka',
  'puzzle',
  'ahşap',
  'ahsap',
  'öğren',
  'ogren',
  'gelişim',
  'gelisim',
  'markalya',
];

const MARKALYA_KEYWORDS = ['markalya', 'marka ly', 'nasyonel toys'];

function norm(s) {
  return String(s || '')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

function textHasAny(text, keywords) {
  const n = norm(text);
  return keywords.some((k) => n.includes(norm(k)));
}

/** API skoru yoksa tahmini popülerlik puanı */
export function estimateSalesScore(product) {
  if (!product) return 0;

  let score = Number(product.trendyolSalesScore) || 0;

  if (product.source === 'trendyol') score += 40;
  if (product.isCampaign) score += 25;

  const compare = Number(product.compareAtPrice) || 0;
  const price = Number(product.price) || 0;
  if (compare > price && compare > 0) {
    score += Math.min(30, Math.round(((compare - price) / compare) * 100));
  }

  const stock = Number(product.stock);
  if (stock > 0 && stock <= 25) score += (26 - stock) * 1.5;

  const blob = `${product.name} ${product.category} ${product.brand || ''} ${product.description || ''}`;
  if (textHasAny(blob, EDUCATIONAL_KEYWORDS)) score += 18;
  if (textHasAny(blob, MARKALYA_KEYWORDS)) score += 22;

  return Math.round(score * 100) / 100;
}

export function getProductSalesScore(product) {
  const api = Number(product?.trendyolSalesScore);
  if (api > 0) return api;
  return estimateSalesScore(product);
}

export function sortByBestSellers(products) {
  const list = Array.isArray(products) ? [...products] : [];
  return list.sort((a, b) => {
    const diff = getProductSalesScore(b) - getProductSalesScore(a);
    if (diff !== 0) return diff;
    const priceDiff = (Number(b.compareAtPrice) || Number(b.price) || 0) - (Number(a.compareAtPrice) || Number(a.price) || 0);
    if (priceDiff !== 0) return priceDiff;
    return String(a.name || '').localeCompare(String(b.name || ''), 'tr');
  });
}

export function getBestSellerProducts(products, limit = 12) {
  const sorted = sortByBestSellers(products);
  const trendyolFirst = [
    ...sorted.filter((p) => p.source === 'trendyol'),
    ...sorted.filter((p) => p.source !== 'trendyol'),
  ];
  const unique = [];
  const seen = new Set();
  for (const p of trendyolFirst) {
    const key = p.sku || p.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(p);
    if (unique.length >= limit) break;
  }
  return unique;
}

export function markBestSellerFlags(products, limit = 12) {
  const topIds = new Set(getBestSellerProducts(products, limit).map((p) => p.id));
  return (Array.isArray(products) ? products : []).map((p) => ({
    ...p,
    isBestSeller: topIds.has(p.id),
  }));
}

export function filterEducationalProducts(products, limit = 12) {
  const list = Array.isArray(products) ? products : [];
  return list
    .filter((p) => {
      const blob = `${p.name} ${p.category} ${p.description || ''}`;
      return textHasAny(blob, EDUCATIONAL_KEYWORDS);
    })
    .slice(0, limit);
}

export function filterMarkalyaProducts(products, limit = 12) {
  const list = Array.isArray(products) ? products : [];
  return list
    .filter((p) => {
      const blob = `${p.name} ${p.category} ${p.brand || ''} ${p.description || ''}`;
      return textHasAny(blob, MARKALYA_KEYWORDS) || norm(p.category).includes('egitici');
    })
    .slice(0, limit);
}
