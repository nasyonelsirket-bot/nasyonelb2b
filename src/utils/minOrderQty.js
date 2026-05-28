import { getEffectiveUnitPrice } from '@/utils/cartLinePricing';

/** Ürün birim fiyatına göre minimum sipariş adedi */
export function getMinOrderQty(unitPrice) {
  const price = Math.max(0, Number(unitPrice) || 0);
  if (price > 0 && price <= 50) return 4;
  if (price <= 75) return 3;
  if (price <= 150) return 2;
  return 1;
}

export function getMinOrderQtyForProduct(product) {
  const unit = getEffectiveUnitPrice(product);
  const minQty = getMinOrderQty(unit);
  return {
    minQty,
    unitPrice: unit,
    message:
      minQty > 1 ? `Bu ürün için minimum sipariş adedi: ${minQty}` : null,
    tierLabel: getTierLabel(unit),
  };
}

function getTierLabel(price) {
  if (price > 0 && price <= 50) return '0–50 TL';
  if (price <= 75) return '50–75 TL';
  if (price <= 150) return '75–150 TL';
  return '150 TL üzeri';
}

export function validateCartMinQty(items = []) {
  const violations = [];

  (Array.isArray(items) ? items : []).forEach((item) => {
    const minQty = getMinOrderQty(getEffectiveUnitPrice(item));
    const qty = Math.max(0, Number(item.quantity) || 0);
    if (qty < minQty) {
      violations.push({
        id: item.id,
        name: item.name,
        quantity: qty,
        minQty,
        shortfall: minQty - qty,
        message: `"${item.name}" için minimum ${minQty} adet gerekli (sepette ${qty})`,
      });
    }
  });

  return {
    ok: violations.length === 0,
    violations,
    summary:
      violations.length > 0
        ? violations.map((v) => v.message).join(' · ')
        : null,
  };
}

export function clampQtyToMin(product, quantity) {
  const minQty = getMinOrderQty(getEffectiveUnitPrice(product));
  const q = Math.max(0, parseInt(quantity, 10) || 0);
  if (q === 0) return 0;
  return Math.max(minQty, q);
}
