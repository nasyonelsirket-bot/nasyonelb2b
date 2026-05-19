import { formatPrice } from '@/utils/whatsapp';

export const FREE_SHIPPING_THRESHOLD_TL = 5000;
export const STANDARD_SHIPPING_FEE_TL = 300;

export function getFreeShippingStatus(subtotal, threshold = FREE_SHIPPING_THRESHOLD_TL) {
  const amount = Math.max(0, Number(subtotal) || 0);

  if (amount <= 0) {
    return {
      subtotal: 0,
      threshold,
      eligible: false,
      remaining: threshold,
      progressPercent: 0,
      shippingFee: 0,
      upsellMessage: null,
      successMessage: null,
    };
  }

  const eligible = amount >= threshold;
  const remaining = Math.max(0, threshold - amount);
  const progressPercent = Math.min(100, (amount / threshold) * 100);
  const shippingFee = eligible ? 0 : STANDARD_SHIPPING_FEE_TL;

  return {
    subtotal: amount,
    threshold,
    eligible,
    remaining,
    progressPercent,
    shippingFee,
    upsellMessage: !eligible
      ? `Sepete ${formatPrice(remaining)} daha ürün eklersen kargo bedava!`
      : null,
    successMessage: eligible ? 'Kargo bedava uygulandı.' : null,
  };
}

export function getOrderPayableTotal(discountGrandTotal, shipping) {
  const base = Math.max(0, Number(discountGrandTotal) || 0);
  const fee = shipping?.shippingFee || 0;
  return Math.round((base + fee) * 100) / 100;
}
