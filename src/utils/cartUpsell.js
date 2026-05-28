import { HIGH_VALUE_DISCOUNT_THRESHOLD_TL } from '@/constants/commerceCopy';
import { UPSELL_PROMO_BUNDLE, getUpsellDiscountRate } from '@/utils/cartLinePricing';
import { buildAdminBundleUpsell, normalizeBundleRules } from '@/utils/bundleRules';
import { getMinOrderQty, getMinOrderQtyForProduct } from '@/utils/minOrderQty';
import { getEffectiveUnitPrice } from '@/utils/cartLinePricing';

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

function scoreSimilarity(product, cartItems, primaryCategories, preferLine = null) {
  const price = Number(product.price) || 0;
  if (price <= 0) return -1;

  let score = 0;
  const cat = product.category || '';
  if (primaryCategories.includes(cat)) score += 50;
  if (preferLine && preferLine.category === cat) score += 40;
  if (preferLine && preferLine.id === product.id) score -= 100;

  cartItems.forEach((line) => {
    if (line.category === cat) score += 30;
    score += tokenOverlap(product.name, line.name) * 8;
    const linePrice = getEffectiveUnitPrice(line);
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

function pickBestProduct(catalog, cartItems, cartIds, primaryCats, preferLine, sortFn) {
  const ranked = availableCatalog(catalog, cartIds)
    .map((product) => ({
      product,
      score: scoreSimilarity(product, cartItems, primaryCats, preferLine),
      unit: bundleUnitPrice(product),
      list: Number(product.price) || 0,
    }))
    .filter((x) => x.score > 0 && x.unit > 0)
    .sort(sortFn);

  return ranked[0] || null;
}

/** Minimum adet kuralı ihlali — aynı veya benzer ürün öner */
export function buildMinQtyUpsell(cartItems, catalog) {
  const needs = [];

  (cartItems || []).forEach((line) => {
    const minQty = getMinOrderQty(getEffectiveUnitPrice(line));
    const qty = Number(line.quantity) || 0;
    if (qty >= minQty) return;
    needs.push({
      line,
      minQty,
      shortfall: minQty - qty,
      rule: getMinOrderQtyForProduct(line),
    });
  });

  if (!needs.length) return null;

  const primary = needs[0];
  const { line, minQty, shortfall } = primary;
  const cartIds = cartItems.map((i) => i.id);
  const primaryCats = cartCategories(cartItems);

  const sameInCatalog = (catalog || []).find((p) => p.id === line.id);
  const addQty = shortfall;

  if (sameInCatalog) {
    return {
      type: 'min_qty',
      promo: null,
      suggestedProduct: sameInCatalog,
      picked: [{ product: sameInCatalog, quantity: addQty, promo: null }],
      targetLine: line,
      minQty,
      shortfall: addQty,
      discountPercent: 0,
      message: `Ücretsiz kargo için bu üründen ${addQty} adet daha ekleyin`,
      headline: `Minimum ${minQty} adet — ${shortfall} eksik`,
    };
  }

  const chosen = pickBestProduct(
    catalog,
    cartItems,
    cartIds,
    primaryCats,
    line,
    (a, b) => b.score - a.score,
  );

  if (!chosen) return null;

  return {
    type: 'min_qty',
    promo: UPSELL_PROMO_BUNDLE,
    discountPercent: BUNDLE_DISCOUNT_PERCENT,
    suggestedProduct: chosen.product,
    picked: [{ product: chosen.product, quantity: addQty, promo: UPSELL_PROMO_BUNDLE }],
    targetLine: line,
    minQty,
    shortfall: addQty,
    message: `"${line.name}" için ${minQty} adet gerekli — ${addQty} adet daha ekleyin`,
    headline: 'Minimum sipariş adedini tamamlayın',
    bundleTotal: chosen.unit * addQty,
    bundleListTotal: chosen.list * addQty,
  };
}

/** 500 TL üzeri %5 indirim için sepet önerisi */
export function buildHighValueUpsell(cartItems, catalog, subtotal) {
  const threshold = HIGH_VALUE_DISCOUNT_THRESHOLD_TL;
  const amount = Math.max(0, Number(subtotal) || 0);
  if (amount >= threshold) return null;

  const remaining = Math.max(0, threshold - amount);
  const cartIds = cartItems.map((i) => i.id);
  const primaryCats = cartCategories(cartItems);

  const chosen = pickBestProduct(
    catalog,
    cartItems,
    cartIds,
    primaryCats,
    null,
    (a, b) => {
      const scoreDiff = b.score - a.score;
      if (Math.abs(scoreDiff) > 8) return scoreDiff;
      return Math.abs(a.unit - remaining) - Math.abs(b.unit - remaining);
    },
  );

  if (!chosen) return null;

  const picked = [{ product: chosen.product, quantity: 1, promo: UPSELL_PROMO_BUNDLE }];
  const bundleTotal = chosen.unit;
  const projectedSubtotal = Math.round((amount + bundleTotal) * 100) / 100;
  const reachesDiscount = projectedSubtotal >= threshold;

  return {
    type: 'high_value',
    promo: UPSELL_PROMO_BUNDLE,
    discountPercent: BUNDLE_DISCOUNT_PERCENT,
    remaining,
    threshold,
    picked,
    suggestedProduct: chosen.product,
    bundleTotal,
    bundleListTotal: chosen.list,
    bundleSavings: Math.round((chosen.list - bundleTotal) * 100) / 100,
    projectedSubtotal,
    reachesHighValueDiscount: reachesDiscount,
    message: reachesDiscount
      ? `%5 ekstra indirim için uyumlu ürün — ${threshold} TL'yi geçersiniz`
      : `${formatRemaining(remaining)} daha — %5 ekstra indirim kazanın`,
    headline: reachesDiscount
      ? '%5 ekstra indirim için son ürün!'
      : 'Sepetinizi tamamlayın — %5 ekstra indirim',
  };
}

function formatRemaining(n) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(n);
}

export function getCartUpsellOffers(cartItems, catalog, subtotal, promotions = null) {
  const adminRules = normalizeBundleRules(promotions?.bundleRules);
  if (adminRules.length) {
    const adminBundle = buildAdminBundleUpsell(cartItems, catalog, adminRules, subtotal);
    if (adminBundle) {
      const offerInCart = (cartItems || []).some((i) =>
        adminRules.some((r) => r.offerProductId === i.id),
      );
      return {
        minQty: buildMinQtyUpsell(cartItems, catalog),
        highValue: buildHighValueUpsell(cartItems, catalog, subtotal),
        bundle: adminBundle,
        eligible: !offerInCart,
        threshold: HIGH_VALUE_DISCOUNT_THRESHOLD_TL,
      };
    }
  }

  return {
    minQty: buildMinQtyUpsell(cartItems, catalog),
    highValue: buildHighValueUpsell(cartItems, catalog, subtotal),
    bundle: null,
    eligible: true,
    threshold: HIGH_VALUE_DISCOUNT_THRESHOLD_TL,
  };
}

/** @deprecated — buildHighValueUpsell kullanın */
export function buildFreeShippingBundle(cartItems, catalog, subtotal) {
  return buildHighValueUpsell(cartItems, catalog, subtotal);
}
