const KEYS = {
  PRODUCTS: 'b2b_products',
  CATEGORIES: 'b2b_categories',
  BANNERS: 'b2b_banners',
  SETTINGS: 'b2b_settings',
  CART: 'b2b_cart',
  CATALOG_META: 'b2b_catalog_meta',
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

/** Mobilde şişmiş önbelleği atla */
export function loadProductsCache() {
  try {
    const raw = localStorage.getItem(KEYS.PRODUCTS);
    if (!raw || raw.length > 1_500_000) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveToStorage(key, data) {
  try {
    const payload = JSON.stringify(data);
    if (payload.length > 1_500_000) return false;
    localStorage.setItem(key, payload);
    return true;
  } catch {
    return false;
  }
}

export function saveCatalogMeta(meta) {
  return saveToStorage(KEYS.CATALOG_META, meta);
}

export { KEYS };
