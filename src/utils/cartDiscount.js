import { formatPrice } from '@/utils/whatsapp';
import { computeCartTotals, normalizePromotions } from '@/utils/promotions';

export const IBAN_DISCOUNT_RATE = 0.1;

export const PAYMENT_IBAN = 'iban';
export const PAYMENT_COD = 'cod';

/**
 * @param {number} subtotal
 * @param {'iban'|'cod'} paymentMethod
 * @param {{ promotions?: object, couponResult?: object }} opts
 */
export function getCartDiscount(subtotal, paymentMethod = PAYMENT_COD, opts = {}) {
  const promos = normalizePromotions(opts.promotions);
  const totals = computeCartTotals({
    subtotal,
    paymentMethod,
    couponResult: opts.couponResult || null,
    promotions: promos,
  });

  const rate = paymentMethod === PAYMENT_IBAN ? (promos.ibanDiscountPercent || 10) / 100 : 0;

  return {
    ...totals,
    rate,
    ratePercent: totals.ratePercent ?? rate * 100,
    tierLabel: totals.tierLabel || '',
    upsellMessage: totals.upsellMessage,
    currentDiscountMessage: totals.currentDiscountMessage,
    couponLabel: opts.couponResult?.ok ? opts.couponResult.label : null,
  };
}

export function formatDiscountParts(discount) {
  const parts = Array.isArray(discount?.parts) ? discount.parts : [];
  return parts.map((p) => `${p.label}: -${formatPrice(p.amount)}`).join(' · ');
}
