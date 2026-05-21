/** En çok satanlar — öncelik: Trendyol Sipariş API (trendyolUnitsSold) */

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
];

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

/** Gerçek Trendyol sipariş adedi (sync sonrası) */
export function getTrendyolUnitsSold(product) {
  return Math.max(0, Number(product?.trendyolUnitsSold) || 0);
}

export function hasTrendyolSalesData(products) {
  return (Array.isArray(products) ? products : []).some((p) => getTrendyolUnitsSold(p) > 0);
}

export function getProductSalesScore(product) {
  const sold = getTrendyolUnitsSold(product);
  if (sold > 0) return sold;

  if (product?.source === 'trendyol' && product?.trendyolSalesSource === 'orders-api') {
    return 0;
  }

  const legacy = Number(product?.trendyolSalesScore) || 0;
  if (legacy > 0) return legacy;

  if (product?.source !== 'trendyol') {
    return estimateSalesScore(product);
  }

  return 0;
}

/** Yalnızca tahmin — Trendyol API satış verisi yokken */
export function estimateSalesScore(product) {
  if (!product) return 0;
  let score = 0;
  if (product.isCampaign) score += 10;
  const compare = Number(product.compareAtPrice) || 0;
  const price = Number(product.price) || 0;
  if (compare > price && compare > 0) {
    score += Math.min(15, Math.round(((compare - price) / compare) * 100));
  }
  return score;
}

export function sortByBestSellers(products) {
  const list = Array.isArray(products) ? [...products] : [];
  return list.sort((a, b) => {
    const diff = getProductSalesScore(b) - getProductSalesScore(a);
    if (diff !== 0) return diff;
    return String(a.name || '').localeCompare(String(b.name || ''), 'tr');
  });
}

export function getBestSellerProducts(products, limit = 16) {
  const list = Array.isArray(products) ? products : [];
  const withRealSales = list.filter((p) => getTrendyolUnitsSold(p) > 0);

  const pool = withRealSales.length >= 3 ? withRealSales : list.filter((p) => p.source === 'trendyol');
  const sorted = sortByBestSellers(pool);

  const unique = [];
  const seen = new Set();
  for (const p of sorted) {
    const key = p.sku || p.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(p);
    if (unique.length >= limit) break;
  }
  return unique;
}

export function markBestSellerFlags(products, limit = 16) {
  const topIds = new Set(getBestSellerProducts(products, limit).map((p) => p.id));
  return (Array.isArray(products) ? products : []).map((p) => ({
    ...p,
    isBestSeller: topIds.has(p.id),
  }));
}

export function filterEducationalProducts(products, limit = 12) {
  const list = Array.isArray(products) ? products : [];
  return sortByBestSellers(
    list.filter((p) => {
      const blob = `${p.name} ${p.category} ${p.description || ''}`;
      return textHasAny(blob, EDUCATIONAL_KEYWORDS);
    }),
  ).slice(0, limit);
}
