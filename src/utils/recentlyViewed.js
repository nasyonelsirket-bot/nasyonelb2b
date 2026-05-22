const STORAGE_KEY = 'nt_recently_viewed';
const MAX_ITEMS = 12;

export function trackRecentlyViewed(product) {
  if (!product?.id || typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
    const entry = {
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      slug: product.slug,
      viewedAt: Date.now(),
    };
    const next = [entry, ...list.filter((x) => x.id !== product.id)].slice(0, MAX_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

export function getRecentlyViewedIds() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
    return list.map((x) => x.id).filter(Boolean);
  } catch {
    return [];
  }
}
