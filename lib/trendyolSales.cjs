/**
 * Trendyol ürün yanıtından satış / popülerlik sinyali çıkarır.
 * API sürümüne göre alan adları değişebilir; bilinen tüm adaylar taranır.
 */

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function pickNested(obj, paths) {
  for (const path of paths) {
    const parts = path.split('.');
    let cur = obj;
    let ok = true;
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object') {
        ok = false;
        break;
      }
      cur = cur[p];
    }
    if (ok && cur != null) {
      const n = num(cur);
      if (n > 0) return n;
    }
  }
  return 0;
}

function extractTrendyolSalesScore(item) {
  if (!item || typeof item !== 'object') return 0;

  let score = 0;

  const directFields = [
    'totalSales',
    'salesQuantity',
    'salesCount',
    'soldQuantity',
    'quantitySold',
    'orderCount',
    'totalOrders',
    'totalOrderCount',
    'favoriteCount',
    'favoritesCount',
    'reviewCount',
    'commentCount',
    'ratingCount',
    'visitCount',
    'viewCount',
    'popularity',
    'popularityScore',
    'bestSellerRank',
    'ranking',
  ];

  directFields.forEach((key) => {
    if (key.includes('Rank')) {
      const rank = num(item[key]);
      if (rank > 0) score += Math.max(0, 150 - rank * 2);
    } else {
      score += num(item[key]);
    }
  });

  score += pickNested(item, [
    'rating.averageRating',
    'rating.totalCount',
    'rating.count',
    'statistics.totalSales',
    'statistics.orderCount',
    'statistics.favoriteCount',
    'sales.total',
    'sales.quantity',
  ]);

  const rating = num(item.rating?.averageRating) || num(item.averageRating);
  const reviews = num(item.rating?.totalCount) || num(item.reviewCount);
  if (rating > 0 && reviews > 0) score += rating * reviews * 0.5;

  const stock = num(item.quantity);
  if (stock > 0 && stock <= 30) score += (31 - stock) * 2;

  if (item.onSale === true || item.saleStatus === 'ON_SALE') score += 5;

  return Math.round(score * 100) / 100;
}

module.exports = { extractTrendyolSalesScore };
