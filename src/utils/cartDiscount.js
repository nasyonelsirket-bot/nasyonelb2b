import { formatPrice } from '@/utils/whatsapp';

export const DISCOUNT_THRESHOLD_TL = 30000;
export const DISCOUNT_RATE_LOW = 0.05;
export const DISCOUNT_RATE_HIGH = 0.1;

/** %10: ara toplam ≥ 30.000 veya ödenecek tutar (iskonto + kargo) ≥ 30.000 */
export function resolveDiscountRate(
  subtotal,
  shippingFee = 0,
  threshold = DISCOUNT_THRESHOLD_TL,
) {
  const amount = Math.max(0, Number(subtotal) || 0);
  const ship = Math.max(0, Number(shippingFee) || 0);

  if (amount <= 0) return DISCOUNT_RATE_LOW;
  if (amount >= threshold) return DISCOUNT_RATE_HIGH;

  const payableWithHighRate = amount * (1 - DISCOUNT_RATE_HIGH) + ship;
  if (payableWithHighRate >= threshold) return DISCOUNT_RATE_HIGH;

  return DISCOUNT_RATE_LOW;
}

export function buildDiscountFromRate(
  subtotal,
  rate,
  { orderTotal = 0, threshold = DISCOUNT_THRESHOLD_TL } = {},
) {
  const amount = Math.max(0, Number(subtotal) || 0);
  const discountAmount = Math.round(amount * rate * 100) / 100;
  const grandTotal = Math.round((amount - discountAmount) * 100) / 100;
  const payable = Math.max(0, Number(orderTotal) || grandTotal);
  const isHighTier = rate >= DISCOUNT_RATE_HIGH - 0.001;
  const remainingToHigh = Math.max(0, threshold - payable);
  const progressPercent = Math.min(100, (payable / threshold) * 100);

  return {
    subtotal: amount,
    threshold,
    rate,
    ratePercent: rate * 100,
    discountAmount,
    grandTotal,
    orderTotal: payable,
    tier: isHighTier ? 'high' : 'low',
    tierLabel: isHighTier ? '%10 Bayi İskontosu' : '%5 Bayi İskontosu',
    remainingToHigh,
    progressPercent,
    upsellMessage:
      !isHighTier && remainingToHigh > 0
        ? `Ödenecek tutarınız ${formatPrice(payable)}. ${formatPrice(remainingToHigh)} daha eklerseniz %10 iskonto uygulanır!`
        : null,
    currentDiscountMessage: isHighTier
      ? `Ödenecek tutarınız ${formatPrice(payable)} — %10 bayi iskontosu uygulandı.`
      : `Ödenecek tutarınız ${formatPrice(payable)} — %5 bayi iskontosu uygulandı.`,
  };
}

/** @deprecated — getCartOrderSummary kullanın */
export function getCartDiscount(subtotal, threshold = DISCOUNT_THRESHOLD_TL) {
  const rate = resolveDiscountRate(subtotal, 0, threshold);
  const discountAmount = Math.round(subtotal * rate * 100) / 100;
  const grandTotal = Math.round((subtotal - discountAmount) * 100) / 100;
  return buildDiscountFromRate(subtotal, rate, { orderTotal: grandTotal, threshold });
}
