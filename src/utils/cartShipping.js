import {
  FREE_SHIPPING_LABEL,
  FREE_SHIPPING_SUBLABEL,
} from '@/constants/commerceCopy';

/** @deprecated Kargo artık eşiksiz ücretsiz; yalnızca geriye dönük importlar için */
export const FREE_SHIPPING_THRESHOLD_TL = 0;
export const STANDARD_SHIPPING_FEE_TL = 0;

/** Tüm siparişlerde kargo ücreti yok */
export function getFreeShippingStatus(subtotal) {
  const amount = Math.max(0, Number(subtotal) || 0);

  return {
    subtotal: amount,
    threshold: 0,
    eligible: amount > 0,
    remaining: 0,
    progressPercent: amount > 0 ? 100 : 0,
    shippingFee: 0,
    label: FREE_SHIPPING_LABEL,
    upsellMessage: null,
    successMessage: amount > 0 ? FREE_SHIPPING_SUBLABEL : null,
  };
}

export function getOrderPayableTotal(discountGrandTotal) {
  return Math.round(Math.max(0, Number(discountGrandTotal) || 0) * 100) / 100;
}
