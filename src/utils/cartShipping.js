import { formatPrice } from '@/utils/whatsapp';
import {
  resolveDiscountRate,
  buildDiscountFromRate,
  DISCOUNT_THRESHOLD_TL,
} from '@/utils/cartDiscount';

export const FREE_SHIPPING_THRESHOLD_TL = 5000;
export const STANDARD_SHIPPING_FEE_TL = 300;

/** Ücretsiz kargo: sepet ara toplamı (iskonto öncesi) ≥ eşik */
export function getFreeShippingStatus(cartSubtotal, threshold = FREE_SHIPPING_THRESHOLD_TL) {
  const amount = Math.max(0, Number(cartSubtotal) || 0);

  if (amount <= 0) {
    return {
      cartSubtotal: 0,
      subtotal: 0,
      threshold,
      eligible: false,
      remaining: threshold,
      progressPercent: 0,
      shippingFee: 0,
      label: 'Kargo',
      upsellMessage: null,
      successMessage: null,
    };
  }

  const eligible = amount >= threshold;
  const remaining = Math.max(0, threshold - amount);
  const progressPercent = Math.min(100, (amount / threshold) * 100);
  const shippingFee = eligible ? 0 : STANDARD_SHIPPING_FEE_TL;

  return {
    cartSubtotal: amount,
    subtotal: amount,
    threshold,
    eligible,
    remaining,
    progressPercent,
    shippingFee,
    label: eligible ? 'Kargo bedava' : 'Kargo',
    upsellMessage: !eligible
      ? `Sepete ${formatPrice(remaining)} daha ürün eklersen kargo bedava!`
      : null,
    successMessage: eligible
      ? `${formatPrice(threshold)} üzeri siparişinizde kargo bedava.`
      : null,
  };
}

/** Kargo, iskonto düşülmüş tutarın üzerine eklenir */
export function getOrderPayableTotal(totalAfterDiscount, shipping) {
  const afterDiscount = Math.max(0, Number(totalAfterDiscount) || 0);
  const fee = shipping?.eligible ? 0 : shipping?.shippingFee || 0;
  return Math.round((afterDiscount + fee) * 100) / 100;
}

export function getCartOrderSummary(cartSubtotal) {
  const subtotal = Math.max(0, Number(cartSubtotal) || 0);
  const shipping = getFreeShippingStatus(subtotal);
  const shippingFee = shipping.eligible ? 0 : shipping.shippingFee;

  const rate = resolveDiscountRate(subtotal, shippingFee);
  const discountAmount = Math.round(subtotal * rate * 100) / 100;
  const totalAfterDiscount = Math.round((subtotal - discountAmount) * 100) / 100;
  const orderTotal = getOrderPayableTotal(totalAfterDiscount, shipping);

  const discount = buildDiscountFromRate(subtotal, rate, {
    orderTotal,
    threshold: DISCOUNT_THRESHOLD_TL,
  });

  return {
    discount,
    shipping,
    totalAfterDiscount,
    orderTotal,
  };
}
