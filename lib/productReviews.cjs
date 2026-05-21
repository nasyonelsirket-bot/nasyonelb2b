/**
 * Ürün değerlendirmeleri — Trendyol puanı + sentetik yorumlar
 */

const FIRST = ['Ayşe', 'Fatma', 'Zeynep', 'Elif', 'Merve', 'Selin', 'Deniz', 'Can', 'Emre', 'Burak', 'Gamze', 'Ece'];
const LAST = ['K.', 'Y.', 'A.', 'T.', 'D.', 'S.', 'M.', 'B.'];
const COMMENTS = [
  'Çocuğum çok sevdi, kaliteli görünüyor.',
  'Hızlı kargo, paketleme özenliydi.',
  'Fiyat performans olarak iyi.',
  'Montessori tarzı, eğitici bulduk.',
  'Kurulumu kolay, parçalar sağlam.',
  'Hediye olarak aldık, çok beğenildi.',
  'Renkleri canlı, malzeme kokusuz.',
  'İkinci siparişimiz, yine memnun kaldık.',
  'Küçük parçalar için dikkat gerekir ama güzel.',
  'Açıklamaya uygun ürün geldi.',
  'Oyun saatleri uzadı, tavsiye ederim.',
  'Stokta bulunca hemen aldık, pişman olmadık.',
  'Kargo süresi makul, ürün beklentiyi karşıladı.',
  'Arkadaşımın önerisiyle aldım, memnunuz.',
  'Ahşap kısımlar düzgün işlenmiş.',
];

function hash(s) {
  let h = 0;
  const str = String(s);
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function pick(arr, seed, i) {
  return arr[(seed + i * 17) % arr.length];
}

function extractTrendyolRating(item) {
  const r =
    item?.rating?.averageRating ??
    item?.averageRating ??
    item?.ratingScore ??
    item?.productRating?.averageRating;
  const count =
    item?.rating?.totalCount ??
    item?.rating?.count ??
    item?.reviewCount ??
    item?.ratingCount ??
    item?.productRating?.count;
  const avg = Number(r);
  const cnt = Number(count);
  if (avg > 0 && avg <= 5) return { avg: Math.round(avg * 10) / 10, count: cnt > 0 ? cnt : 0 };
  return null;
}

function generateReviews(product, count = 12) {
  const seed = hash(`${product.id}|${product.sku}|${product.barcode}|${product.name}`);
  const ty = product.trendyolRating;
  const targetAvg = ty?.avg || 4.6;
  const n = Math.min(15, Math.max(10, count));
  const reviews = [];
  const now = Date.now();

  for (let i = 0; i < n; i += 1) {
    const roll = (seed + i * 13) % 100;
    let stars = 5;
    if (roll > 88) stars = 4;
    else if (roll > 96) stars = 3;
    if (targetAvg >= 4.5 && roll > 8) stars = 5;

    const daysAgo = 3 + ((seed + i * 7) % 180);
    reviews.push({
      id: `gen-${seed}-${i}`,
      author: `${pick(FIRST, seed, i)} ${pick(LAST, seed, i + 3)}`,
      rating: stars,
      comment: pick(COMMENTS, seed, i + 5),
      date: new Date(now - daysAgo * 86400000).toISOString(),
      source: ty ? 'trendyol-sync' : 'generated',
      verified: true,
    });
  }

  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  const avg = Math.round((sum / reviews.length) * 10) / 10;
  const reviewCount = ty?.count > reviews.length ? ty.count : reviews.length;

  return {
    reviews,
    ratingAvg: ty?.avg || avg,
    reviewCount,
    ratingSource: ty ? 'trendyol' : 'generated',
  };
}

function enrichProductReviews(product) {
  if (!product || typeof product !== 'object') return product;
  if (Array.isArray(product.reviews) && product.reviews.length >= 8) {
    return {
      ...product,
      ratingAvg: product.ratingAvg ?? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length,
      reviewCount: product.reviewCount ?? product.reviews.length,
    };
  }
  const data = generateReviews(product);
  return { ...product, ...data };
}

module.exports = { extractTrendyolRating, generateReviews, enrichProductReviews };
