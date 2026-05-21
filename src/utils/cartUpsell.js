import { FREE_SHIPPING_THRESHOLD_TL } from '@/utils/cartShipping';
import { UPSELL_PROMO_BUNDLE } from '@/utils/cartLinePricing';

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

function scoreSimilarity(product, cartItems, primaryCategories) {
  const price = Number(product.price) || 0;
  if (price <= 0) return -1;

  let score = 0;
  const cat = product.category || '';
  if (primaryCategories.includes(cat)) score += 50;

  cartItems.forEach((line) => {
    if (line.category === cat) score += 30;
    score += tokenOverlap(product.name, line.name) * 8;
    const linePrice = Number(line.price) || 0;
    if (linePrice > 0) {
      const ratio = price / linePrice;
      if (ratio >= 0.35 && ratio <= 2.8) score += 12;
    }
  });

  if (product.isCampaign) score += 4;
  return score;
}

function availableCatalog(catalog, cartIds) {
  const ids = new Set(cartIds);
  return (Array.isArray(catalog) ? catalog : []).filter(
    (p) => p?.id && !ids.has(p.id) && Number(p.price) > 0,
  );
}

/**
 * 750 TL'ye tamamlamak için birkaç emsal ürün (tek dev ürün değil)
 */
export function buildFreeShippingBundle(cartItems, catalog, subtotal) {
  const threshold = FREE_SHIPPING_THRESHOLD_TL;
  const amount = Math.max(0, Number(subtotal) || 0);
  if (amount >= threshold) return null;

  const remaining = threshold - amount;
  const targetMin = remaining * 0.88;
  const targetMax = remaining * 1.08;
  const cartIds = cartItems.map((i) => i.id);
  const primaryCats = cartCategories(cartItems);

  const candidates = availableCatalog(catalog, cartIds)
    .map((p) => ({ product: p, score: scoreSimilarity(p, cartItems, primaryCats) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!candidates.length) return null;

  const maxSingle = Math.max(remaining * 0.45, 80);
  const pool = candidates.filter((c) => Number(c.product.price) <= maxSingle);
  const pickFrom = pool.length >= 2 ? pool : candidates.slice(0, 24);

  const picked = [];
  let sum = 0;

  for (const { product } of pickFrom) {
    if (picked.length >= 5) break;
    const price = Number(product.price) || 0;
    if (picked.length >= 1 && sum + price > targetMax) continue;
    if (picked.length >= 2 && sum >= targetMin) break;
    picked.push({ product, quantity: 1, promo: UPSELL_PROMO_BUNDLE });
    sum += price;
  }

  if (picked.length < 2) {
    picked.length = 0;
    sum = 0;
    for (const { product } of pickFrom.slice(0, 6)) {
      if (picked.length >= 4) break;
      const price = Number(product.price) || 0;
      if (sum + price > targetMax && picked.length >= 2) break;
      picked.push({ product, quantity: 1, promo: UPSELL_PROMO_BUNDLE });
      sum += price;
      if (sum >= targetMin) break;
    }
  }

  if (!picked.length) return null;

  const projectedSubtotal = amount + sum;

  return {
    type: 'bundle',
    promo: UPSELL_PROMO_BUNDLE,
    discountPercent: 5,
    remaining,
    targetFill: remaining,
    picked,
    bundleTotal: Math.round(sum * 100) / 100,
    projectedSubtotal: Math.round(projectedSubtotal * 100) / 100,
    reachesFreeShipping: projectedSubtotal >= threshold,
    message: `${picked.length} ürünlük paket — kargo bedava + özel fiyat`,
  };
}

export function getCartUpsellOffers(cartItems, catalog, subtotal) {
  const bundle = buildFreeShippingBundle(cartItems, catalog, subtotal);
  return { bundle, eligible: subtotal < FREE_SHIPPING_THRESHOLD_TL };
}
