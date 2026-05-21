import {
  REVIEWS_VERSION,
  generateProductReviews,
} from '@/utils/productReviewGenerator';

const CUSTOM_KEY = 'nt-custom-reviews';

export { generateProductReviews };

export function enrichProductReviews(product) {
  if (!product || typeof product !== 'object') return product;

  const hasCurrentReviews =
    product.reviewsVersion === REVIEWS_VERSION &&
    Array.isArray(product.reviews) &&
    product.reviews.length >= 8;

  if (hasCurrentReviews) {
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
    const key = r.id || `${r.author}-${r.date}-${r.comment}`;
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
