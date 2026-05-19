import { formatPrice } from '@/utils/whatsapp';

export const DISCOUNT_THRESHOLD_TL = 30000;
export const DISCOUNT_RATE_LOW = 0.05;
export const DISCOUNT_RATE_HIGH = 0.1;

export function getCartDiscount(subtotal, threshold = DISCOUNT_THRESHOLD_TL) {
  const amount = Math.max(0, Number(subtotal) || 0);

  if (amount <= 0) {
    return {
      subtotal: 0,
      threshold,
      rate: DISCOUNT_RATE_LOW,
      ratePercent: 5,
      discountAmount: 0,
      grandTotal: 0,
      tier: 'low',
      tierLabel: '%5 Bayi İskontosu',
      remainingToHigh: threshold,
      upsellMessage: null,
      currentDiscountMessage: null,
    };
  }

  const isHighTier = amount >= threshold;
  const rate = isHighTier ? DISCOUNT_RATE_HIGH : DISCOUNT_RATE_LOW;
  const discountAmount = Math.round(amount * rate * 100) / 100;
  const grandTotal = Math.round((amount - discountAmount) * 100) / 100;
  const remainingToHigh = Math.max(0, threshold - amount);
  const progressPercent = Math.min(100, (amount / threshold) * 100);

  return {
    subtotal: amount,
    threshold,
    rate,
    ratePercent: rate * 100,
    discountAmount,
    grandTotal,
    tier: isHighTier ? 'high' : 'low',
    tierLabel: isHighTier ? '%10 Bayi İskontosu' : '%5 Bayi İskontosu',
    remainingToHigh,
    progressPercent,
    upsellMessage:
      !isHighTier && remainingToHigh > 0
        ? `Sepete ${formatPrice(remainingToHigh)} daha ürün eklersen size özel %10 iskonto uygulanır!`
        : null,
    currentDiscountMessage: isHighTier
      ? 'Tebrikler! Sepet tutarınıza %10 bayi iskontosu uygulandı.'
      : 'Sepet tutarınıza %5 bayi iskontosu uygulandı.',
  };
}
