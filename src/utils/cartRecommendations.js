import { getBestSellerProducts } from '@/utils/productBestseller';
import { getMinOrderQty } from '@/utils/minOrderQty';

function norm(s) {
  return String(s || '')
    .toLocaleLowerCase('tr')
    .replace(/[^a-z0-9ğüşıöç\s]/gi, ' ')
    .trim();
}

function tokenOverlap(a, b) {
  const ta = new Set(norm(a).split(/\s+/).filter((w) => w.length > 2));
  const tb = new Set(norm(b).split(/\s+/).filter((w) => w.length > 2));
  if (!ta.size || !tb.size) return 0;
  let n = 0;
  ta.forEach((t) => {
    if (tb.has(t)) n += 1;
  });
  return n;
}

function cartCategories(cartItems) {
  const counts = {};
  cartItems.forEach((i) => {
    const c = i.category || 'Genel';
    counts[c] = (counts[c] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
}

function scoreForCart(product, cartItems, primaryCats) {
  const price = Number(product.price) || 0;
  if (price <= 0) return -1;

  let score = 0;
  const cat = product.category || '';
  if (primaryCats.includes(cat)) score += 50;

  cartItems.forEach((line) => {
    if (line.category === cat) score += 28;
    score += tokenOverlap(product.name, line.name) * 6;
  });

  const minQ = getMinOrderQty(price);
  if (minQ <= 2) score += 4;

  if (product.isBestSeller) score += 8;
  return score;
}

function excludeCart(catalog, cartIds, limit) {
  const ids = new Set(cartIds);
  return (Array.isArray(catalog) ? catalog : [])
    .filter((p) => p?.id && !ids.has(p.id) && Number(p.price) > 0)
    .slice(0, limit * 3);
}

/** Sepette olmayan, aynı kategoriye yakın ürünler */
export function getCartCrossSellProducts(cartItems, catalog, limit = 8) {
  if (!cartItems?.length) return [];

  const cartIds = cartItems.map((i) => i.id);
  const primaryCats = cartCategories(cartItems);
  const pool = excludeCart(catalog, cartIds, limit);

  return pool
    .map((product) => ({
      product,
      score: scoreForCart(product, cartItems, primaryCats),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.product);
}

/** Çok satanlar — sepette olmayan */
export function getCartBestsellerSuggestions(cartItems, catalog, limit = 8) {
  const cartIds = new Set((cartItems || []).map((i) => i.id));
  const all = getBestSellerProducts(catalog, limit + cartIds.size);
  return all.filter((p) => !cartIds.has(p.id)).slice(0, limit);
}
