const { getCatalogStore } = require('./catalogBlobStore.cjs');
const { normalizePromotions, DEFAULT_PROMOTIONS, incrementCouponUsage } = require('./promotions.cjs');

async function loadCatalogSettings(event) {
  const store = getCatalogStore(event);
  try {
    return (await store.get('settings', { type: 'json' })) || {};
  } catch {
    return {};
  }
}

async function loadPromotions(event) {
  const settings = await loadCatalogSettings(event);
  return normalizePromotions(settings.promotions || DEFAULT_PROMOTIONS);
}

async function savePromotions(event, promotions) {
  const store = getCatalogStore(event);
  const settings = await loadCatalogSettings(event);
  const next = {
    ...settings,
    promotions: normalizePromotions(promotions),
  };
  await store.setJSON('settings', next);
  return next.promotions;
}

async function appendCouponAndSave(event, coupon) {
  const promos = await loadPromotions(event);
  const exists = promos.coupons.some(
    (c) => String(c.restrictedEmail || '').toLowerCase() === String(coupon.restrictedEmail || '').toLowerCase() &&
      c.trigger === 'after_delivery' &&
      c.sourceOrderNumber === coupon.sourceOrderNumber,
  );
  if (exists) return null;
  promos.coupons = [coupon, ...promos.coupons];
  await savePromotions(event, promos);
  return coupon;
}

async function markCouponUsed(event, code) {
  const promos = await loadPromotions(event);
  promos.coupons = incrementCouponUsage(promos.coupons, code);
  await savePromotions(event, promos);
}

module.exports = {
  loadPromotions,
  savePromotions,
  appendCouponAndSave,
  markCouponUsed,
  loadCatalogSettings,
};
