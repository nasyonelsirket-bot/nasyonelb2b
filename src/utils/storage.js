const KEYS = {
  PRODUCTS: 'b2b_products',
  CATEGORIES: 'b2b_categories',
  BANNERS: 'b2b_banners',
  SETTINGS: 'b2b_settings',
  CART: 'b2b_cart',
};

export function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function loadArrayFromStorage(key, fallback) {
  const data = loadFromStorage(key, fallback);
  return Array.isArray(data) ? data : fallback;
}

export function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export { KEYS };
