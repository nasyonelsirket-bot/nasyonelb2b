/** Sunucu tarafı minimum adet — sepet satır fiyatı (indirimli birim) */
function lineUnitPrice(item) {
  const base = Number(item.price) || 0;
  const offer = Number(item.upsellOfferPrice);
  if (item.upsellPromo && Number.isFinite(offer) && offer > 0) return offer;
  const pct = Number(item.upsellDiscountPercent);
  if (item.upsellPromo && Number.isFinite(pct) && pct > 0) {
    return Math.round(base * (1 - pct / 100) * 100) / 100;
  }
  return base;
}

function getMinOrderQty(unitPrice) {
  const price = Math.max(0, Number(unitPrice) || 0);
  if (price > 0 && price <= 50) return 4;
  if (price <= 75) return 3;
  if (price <= 150) return 2;
  return 1;
}

function validateOrderItemsMinQty(items) {
  const violations = [];
  (Array.isArray(items) ? items : []).forEach((item) => {
    const minQty = getMinOrderQty(lineUnitPrice(item));
    const qty = Math.max(0, Number(item.quantity) || 0);
    if (qty < minQty) {
      violations.push({
        sku: item.sku,
        name: item.name,
        minQty,
        quantity: qty,
      });
    }
  });
  return { ok: violations.length === 0, violations };
}

module.exports = { getMinOrderQty, validateOrderItemsMinQty, lineUnitPrice };
