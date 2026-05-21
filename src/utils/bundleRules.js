import { FREE_SHIPPING_THRESHOLD_TL } from '@/utils/cartShipping';

export const BUNDLE_RULE_PROMO_PREFIX = 'bundle_rule:';

export function bundleRulePromoId(ruleId) {
  return `${BUNDLE_RULE_PROMO_PREFIX}${ruleId}`;
}

export function normalizeBundleRules(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r) => r && typeof r === 'object')
    .map((r) => ({
      id: String(r.id || '').trim() || `rule-${Date.now()}`,
      active: r.active !== false,
      title: String(r.title || '').trim(),
      triggerProductId: String(r.triggerProductId || '').trim(),
      offerProductId: String(r.offerProductId || '').trim(),
      discountType: r.discountType === 'fixed' ? 'fixed' : 'percent',
      discountPercent: Math.min(100, Math.max(0, Number(r.discountPercent) || 0)),
      offerPrice: Math.max(0, Number(r.offerPrice) || 0),
      grantFreeShipping: r.grantFreeShipping !== false,
    }))
    .filter((r) => r.triggerProductId && r.offerProductId);
}

export function resolveOfferUnitPrice(product, rule) {
  const list = Number(product?.price) || 0;
  if (!list) return 0;
  if (rule.discountType === 'fixed' && rule.offerPrice > 0) {
    return Math.min(list, Math.round(rule.offerPrice * 100) / 100);
  }
  const pct = rule.discountPercent || 0;
  return Math.round(list * (1 - pct / 100) * 100) / 100;
}

export function findCatalogProduct(catalog, productId) {
  if (!productId) return null;
  return (Array.isArray(catalog) ? catalog : []).find((p) => p?.id === productId) || null;
}

/**
 * Tetikleyici sepetteyken önerilecek admin kuralı
 */
export function findBundleRuleOffer(cartItems, catalog, bundleRules) {
  const rules = normalizeBundleRules(bundleRules).filter((r) => r.active);
  if (!rules.length) return null;

  const cartIds = new Set((cartItems || []).map((i) => i.id));

  for (const rule of rules) {
    if (!cartIds.has(rule.triggerProductId)) continue;
    if (cartIds.has(rule.offerProductId)) continue;

    const product = findCatalogProduct(catalog, rule.offerProductId);
    if (!product || !(Number(product.price) > 0)) continue;

    const unit = resolveOfferUnitPrice(product, rule);
    if (unit <= 0) continue;

    const trigger = findCatalogProduct(catalog, rule.triggerProductId);

    return {
      rule,
      trigger,
      product,
      unit,
      list: Number(product.price) || 0,
      promo: bundleRulePromoId(rule.id),
      discountPercent:
        rule.discountType === 'percent'
          ? rule.discountPercent
          : Math.round((1 - unit / (Number(product.price) || 1)) * 100),
    };
  }

  return null;
}

export function buildAdminBundleUpsell(cartItems, catalog, bundleRules, subtotal) {
  const match = findBundleRuleOffer(cartItems, catalog, bundleRules);
  if (!match) return null;

  const threshold = FREE_SHIPPING_THRESHOLD_TL;
  const amount = Math.max(0, Number(subtotal) || 0);
  const projectedSubtotal = Math.round((amount + match.unit) * 100) / 100;
  const reachesThreshold = projectedSubtotal >= threshold;
  const reachesFreeShipping =
    match.rule.grantFreeShipping || reachesThreshold;

  return {
    source: 'admin_rule',
    type: 'single',
    promo: match.promo,
    ruleId: match.rule.id,
    ruleTitle: match.rule.title || 'Birlikte al',
    triggerName: match.trigger?.name || 'Sepetteki ürün',
    discountPercent: match.discountPercent,
    discountType: match.rule.discountType,
    offerPrice: match.unit,
    grantFreeShipping: match.rule.grantFreeShipping,
    picked: [
      {
        product: match.product,
        quantity: 1,
        promo: match.promo,
        upsellDiscountPercent:
          match.rule.discountType === 'percent' ? match.rule.discountPercent : undefined,
        upsellOfferPrice: match.unit,
        list: match.list,
      },
    ],
    suggestedProduct: match.product,
    bundleTotal: match.unit,
    bundleListTotal: match.list,
    bundleSavings: Math.round((match.list - match.unit) * 100) / 100,
    projectedSubtotal,
    reachesFreeShipping,
    reachesThreshold,
    remaining: Math.max(0, threshold - amount),
    message: reachesFreeShipping
      ? `${match.trigger?.name ? `${match.trigger.name} ile birlikte` : 'Birlikte al'} — özel fiyat${match.rule.grantFreeShipping ? ', kargo bedava' : ''}`
      : 'Önerilen ürün — kampanya fiyatı',
  };
}

/** Tetikleyici + öneri ürün sepetteyken ücretsiz kargo */
export function getBundleFreeShippingOverride(cartItems, bundleRules, threshold = FREE_SHIPPING_THRESHOLD_TL) {
  const rules = normalizeBundleRules(bundleRules).filter((r) => r.active && r.grantFreeShipping);
  if (!rules.length) return null;

  const cartIds = new Set((cartItems || []).map((i) => i.id));

  for (const rule of rules) {
    if (cartIds.has(rule.triggerProductId) && cartIds.has(rule.offerProductId)) {
      return {
        eligible: true,
        message: rule.title
          ? `${rule.title} — kargo bedava`
          : 'Birlikte al kampanyası — kargo bedava',
      };
    }
  }

  return null;
}
