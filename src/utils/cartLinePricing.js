/** Sepet satırı indirimleri — öneri ürün promosyonları */

export const UPSELL_PROMO_BUNDLE = 'bundle5';
export const UPSELL_PROMO_SIMILAR = 'similar8';

const PROMO_RATES = {
  [UPSELL_PROMO_BUNDLE]: 0.05,
  [UPSELL_PROMO_SIMILAR]: 0.08,
};

export function getUpsellDiscountRate(promo) {
  return PROMO_RATES[promo] || 0;
}

export function getUpsellDiscountPercent(promo) {
  const rate = getUpsellDiscountRate(promo);
  return rate ? Math.round(rate * 100) : 0;
}

export function getEffectiveUnitPrice(item) {
  const base = Number(item?.price) || 0;
  const rate = getUpsellDiscountRate(item?.upsellPromo);
  if (!rate) return base;
  return Math.round(base * (1 - rate) * 100) / 100;
}

export function getCartSubtotal(items) {
  const list = Array.isArray(items) ? items : [];
  return Math.round(
    list.reduce((sum, item) => sum + getEffectiveUnitPrice(item) * (item.quantity || 1), 0) * 100,
  ) / 100;
}

export function getUpsellSavings(items) {
  const list = Array.isArray(items) ? items : [];
  return Math.round(
    list.reduce((sum, item) => {
      if (!item.upsellPromo) return sum;
      const base = Number(item.price) || 0;
      const eff = getEffectiveUnitPrice(item);
      return sum + (base - eff) * (item.quantity || 1);
    }, 0) * 100,
  ) / 100;
}

/** Sipariş / WhatsApp için fiyatı uygulanmış kalem */
export function mapItemsForOrder(items) {
  return (Array.isArray(items) ? items : []).map((item) => {
    const unit = getEffectiveUnitPrice(item);
    const promoPct = getUpsellDiscountPercent(item.upsellPromo);
    return {
      ...item,
      price: unit,
      originalPrice: item.price,
      upsellDiscountLabel: promoPct ? `%${promoPct} öneri indirimi` : '',
    };
  });
}
