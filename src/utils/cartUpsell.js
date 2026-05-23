import { FREE_SHIPPING_THRESHOLD_TL } from '@/utils/cartShipping';
import { UPSELL_PROMO_BUNDLE, getUpsellDiscountRate } from '@/utils/cartLinePricing';
import { buildAdminBundleUpsell, normalizeBundleRules } from '@/utils/bundleRules';

const BUNDLE_DISCOUNT_PERCENT = 5;

function bundleUnitPrice(product) {
  const base = Number(product.price) || 0;
  const rate = getUpsellDiscountRate(UPSELL_PROMO_BUNDLE);
  return Math.round(base * (1 - rate) * 100) / 100;
}

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
 * 500 TL'ye tamamlamak için sepete uyumlu tek ürün (%5 indirimli)
 */
export function buildFreeShippingBundle(cartItems, catalog, subtotal) {
  const threshold = FREE_SHIPPING_THRESHOLD_TL;
  const amount = Math.max(0, Number(subtotal) || 0);
  if (amount >= threshold) return null;

  const remaining = Math.max(0, threshold - amount);
  const cartIds = cartItems.map((i) => i.id);
  const primaryCats = cartCategories(cartItems);

  const ranked = availableCatalog(catalog, cartIds)
    .map((product) => ({
      product,
      score: scoreSimilarity(product, cartItems, primaryCats),
      unit: bundleUnitPrice(product),
      list: Number(product.price) || 0,
    }))
    .filter((x) => x.score > 0 && x.unit > 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) return null;

  const qualifies = ranked.filter((x) => amount + x.unit >= threshold);

  let chosen;
  if (qualifies.length) {
    qualifies.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;
      return amount + a.unit - (amount + b.unit);
    });
    chosen = qualifies[0];
  } else {
    ranked.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (Math.abs(scoreDiff) > 8) return scoreDiff;
      return Math.abs(a.unit - remaining) - Math.abs(b.unit - remaining);
    });
    chosen = ranked[0];
  }

  const picked = [{ product: chosen.product, quantity: 1, promo: UPSELL_PROMO_BUNDLE }];
  const bundleTotal = chosen.unit;
  const projectedSubtotal = Math.round((amount + bundleTotal) * 100) / 100;
  const reachesFreeShipping = projectedSubtotal >= threshold;

  return {
    type: 'single',
    promo: UPSELL_PROMO_BUNDLE,
    discountPercent: BUNDLE_DISCOUNT_PERCENT,
    remaining,
    targetFill: remaining,
    picked,
    suggestedProduct: chosen.product,
    bundleTotal,
    bundleListTotal: chosen.list,
    bundleSavings: Math.round((chosen.list - bundleTotal) * 100) / 100,
    projectedSubtotal,
    reachesFreeShipping,
    message: reachesFreeShipping
      ? 'Uyumlu ürün — %5 indirimle kargo bedava'
      : 'Sepete en uyumlu ürün — %5 indirim',
  };
}

export function getCartUpsellOffers(cartItems, catalog, subtotal, promotions = null) {
  const threshold =
    Number(promotions?.freeShippingThreshold) > 0
      ? Number(promotions.freeShippingThreshold)
      : FREE_SHIPPING_THRESHOLD_TL;

  const adminRules = normalizeBundleRules(promotions?.bundleRules);
  if (adminRules.length) {
    const adminBundle = buildAdminBundleUpsell(cartItems, catalog, adminRules, subtotal);
    if (adminBundle) {
      const offerInCart = (cartItems || []).some((i) =>
        adminRules.some((r) => r.offerProductId === i.id),
      );
      return {
        bundle: adminBundle,
        eligible: !offerInCart,
        threshold,
      };
    }
  }

  const bundle = buildFreeShippingBundle(cartItems, catalog, subtotal);
  if (bundle && threshold !== FREE_SHIPPING_THRESHOLD_TL) {
    const amount = Math.max(0, Number(subtotal) || 0);
    bundle.reachesFreeShipping = bundle.projectedSubtotal >= threshold;
    bundle.remaining = Math.max(0, threshold - amount);
  }
  return { bundle, eligible: subtotal < threshold, threshold };
}
