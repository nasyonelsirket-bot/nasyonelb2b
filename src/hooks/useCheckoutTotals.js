import { useMemo } from 'react';
import { computeCheckoutTotals } from '@/utils/cartCheckoutTotals';
import { PAYMENT_PAYTR } from '@/utils/cartDiscount';

/**
 * Sepet + checkout + ödeme için tek hesaplama kaynağı.
 * items değişince (adet güncellemesi dahil) tüm toplamlar birlikte yenilenir.
 */
export function useCheckoutTotals({
  items,
  promotions,
  couponResult = null,
  paymentMethod = PAYMENT_PAYTR,
}) {
  return useMemo(
    () =>
      computeCheckoutTotals({
        items,
        promotions,
        couponResult,
        paymentMethod,
      }),
    [items, promotions, couponResult, paymentMethod],
  );
}
