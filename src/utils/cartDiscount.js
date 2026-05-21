import { formatPrice } from '@/utils/whatsapp';

export const IBAN_DISCOUNT_RATE = 0.1;

export const PAYMENT_IBAN = 'iban';
export const PAYMENT_COD = 'cod';

export function getCartDiscount(subtotal, paymentMethod = PAYMENT_COD) {
  const amount = Math.max(0, Number(subtotal) || 0);
  const isIban = paymentMethod === PAYMENT_IBAN;
  const rate = isIban ? IBAN_DISCOUNT_RATE : 0;
  const discountAmount = Math.round(amount * rate * 100) / 100;
  const grandTotal = Math.round((amount - discountAmount) * 100) / 100;

  return {
    subtotal: amount,
    paymentMethod,
    rate,
    ratePercent: rate * 100,
    discountAmount,
    grandTotal,
    tierLabel: isIban ? '%10 Havale/EFT indirimi' : '',
    upsellMessage: !isIban && amount > 0 ? 'IBAN ile ödeyin, %10 indirim kazanın!' : null,
    currentDiscountMessage: isIban
      ? 'Havale/EFT ile %10 indirim uygulandı.'
      : null,
  };
}
