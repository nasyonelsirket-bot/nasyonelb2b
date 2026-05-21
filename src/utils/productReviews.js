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

const CUSTOM_KEY = 'nt-custom-reviews';

function hash(s) {
  let h = 0;
  const str = String(s);
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function pick(arr, seed, i) {
  return arr[(seed + i * 17) % arr.length];
}

export function generateProductReviews(product, count = 12) {
  const seed = hash(`${product.id}|${product.sku}|${product.barcode}|${product.name}`);
  const ty = product.trendyolRating;
  const targetAvg = ty?.avg || 4.6;
  const n = Math.min(15, Math.max(10, count));
  const now = Date.now();
  const reviews = [];

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

export function enrichProductReviews(product) {
  if (!product || typeof product !== 'object') return product;
  if (Array.isArray(product.reviews) && product.reviews.length >= 8) {
    const avg =
      product.ratingAvg ??
      product.reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / product.reviews.length;
    return {
      ...product,
      ratingAvg: Math.round(avg * 10) / 10,
      reviewCount: product.reviewCount ?? product.reviews.length,
    };
  }
  const data = generateProductReviews(product);
  return { ...product, ...data };
}

export function migrateProductsReviews(products) {
  return (Array.isArray(products) ? products : []).map(enrichProductReviews);
}

export function getProductRatingSummary(product) {
  const p = enrichProductReviews(product || {});
  const avg = Number(p.ratingAvg) || 0;
  const count = Number(p.reviewCount) || (Array.isArray(p.reviews) ? p.reviews.length : 0);
  return { avg, count };
}

function loadCustomStore() {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCustomStore(store) {
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function getCustomReviews(productId) {
  const store = loadCustomStore();
  return Array.isArray(store[productId]) ? store[productId] : [];
}

export function addCustomReview(productId, { author, rating, comment }) {
  const store = loadCustomStore();
  const list = Array.isArray(store[productId]) ? store[productId] : [];
  const entry = {
    id: `cust-${Date.now()}`,
    author: (author || 'Misafir').trim().slice(0, 40) || 'Misafir',
    rating: Math.min(5, Math.max(1, Math.round(Number(rating) || 5))),
    comment: String(comment || '').trim().slice(0, 500),
    date: new Date().toISOString(),
    source: 'customer',
    verified: false,
  };
  store[productId] = [entry, ...list].slice(0, 50);
  saveCustomStore(store);
  return entry;
}

export function getAllProductReviews(product) {
  const base = enrichProductReviews(product);
  const custom = getCustomReviews(product.id);
  const merged = [...custom, ...(base.reviews || [])];
  const seen = new Set();
  const unique = merged.filter((r) => {
    const key = r.id || `${r.author}-${r.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  unique.sort((a, b) => new Date(b.date) - new Date(a.date));
  const count = unique.length;
  const avg =
    count > 0
      ? Math.round((unique.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count) * 10) / 10
      : base.ratingAvg;
  return { reviews: unique, ratingAvg: avg, reviewCount: Math.max(base.reviewCount, count) };
}
