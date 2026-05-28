import { getCartSubtotal, mapItemsForOrder } from '@/utils/cartLinePricing';
import { getCartDiscount, PAYMENT_PAYTR } from '@/utils/cartDiscount';
import { getFreeShippingStatus, getOrderPayableTotal } from '@/utils/cartShipping';
import { validateCartMinQty } from '@/utils/minOrderQty';

const BEDAVA_TOKENS = new Set(['bedava', 'ücretsiz', 'free', 'ucretsiz']);

/** "Bedava" veya metin asla sayıya dönüşmez */
export function toPaymentNumber(value, fallback = 0) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || BEDAVA_TOKENS.has(trimmed.toLocaleLowerCase('tr'))) return fallback;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Kargo ücreti — yalnızca 0 veya pozitif sayı */
export function normalizeShippingFee(raw) {
  return Math.max(0, toPaymentNumber(raw, 0));
}

/** API / PayTR için sade shipping objesi */
export function buildShippingPayload(shipping) {
  const fee = normalizeShippingFee(shipping?.shippingFee);
  const subtotal = toPaymentNumber(shipping?.subtotal, 0);
  return {
    subtotal,
    threshold: 0,
    eligible: Boolean(shipping?.eligible) && subtotal > 0,
    remaining: 0,
    progressPercent: subtotal > 0 ? 100 : 0,
    shippingFee: fee,
  };
}

/** İndirim objesi — yalnızca sayısal alanlar */
export function sanitizeDiscountForApi(discount) {
  if (!discount || typeof discount !== 'object') {
    return {
      subtotal: 0,
      discountAmount: 0,
      grandTotal: 0,
      parts: [],
      couponCode: null,
    };
  }
  return {
    subtotal: toPaymentNumber(discount.subtotal, 0),
    discountAmount: toPaymentNumber(discount.discountAmount, 0),
    grandTotal: toPaymentNumber(discount.grandTotal, 0),
    tierLabel: discount.tierLabel || '',
    parts: Array.isArray(discount.parts)
      ? discount.parts.map((p) => ({
          type: p.type,
          label: p.label,
          amount: toPaymentNumber(p.amount, 0),
        }))
      : [],
    couponCode: discount.couponCode || null,
    highValueDiscountEarned: Boolean(discount.highValueDiscountEarned),
    highValueDiscountRemaining: toPaymentNumber(discount.highValueDiscountRemaining, 0),
  };
}

/**
 * Tek merkezden sepet + checkout toplamları.
 * @param {{ items: object[], promotions?: object, couponResult?: object, paymentMethod?: string }} input
 */
export function computeCheckoutTotals(input = {}) {
  const items = Array.isArray(input.items) ? input.items : [];
  const paymentMethod = input.paymentMethod || PAYMENT_PAYTR;
  const subtotal = getCartSubtotal(items);

  const discount = getCartDiscount(subtotal, paymentMethod, {
    promotions: input.promotions,
    couponResult: input.couponResult || null,
  });

  const shippingDisplay = getFreeShippingStatus(discount.subtotal);
  const shippingFee = normalizeShippingFee(shippingDisplay.shippingFee);
  const shippingPayload = buildShippingPayload({ ...shippingDisplay, shippingFee });
  const finalTotal = getOrderPayableTotal(discount.grandTotal);
  const minQtyCheck = validateCartMinQty(items);

  return {
    subtotal,
    discount,
    shipping: shippingDisplay,
    shippingFee,
    shippingPayload,
    finalTotal,
    orderTotal: finalTotal,
    minQtyCheck,
    itemCount: items.reduce((n, i) => n + (i.quantity || 1), 0),
  };
}

export function validatePaymentTotals(totals) {
  const errors = [];

  if (!totals || typeof totals !== 'object') {
    return { ok: false, errors: ['Checkout toplamları hesaplanamadı'] };
  }

  const { finalTotal, subtotal, discount, shippingFee } = totals;

  if (subtotal === undefined || subtotal === null) {
    errors.push('subtotal tanımsız');
  } else if (!Number.isFinite(toPaymentNumber(subtotal)) || Number.isNaN(subtotal)) {
    errors.push('subtotal geçersiz');
  }

  if (discount === undefined) {
    errors.push('discount tanımsız');
  }

  if (shippingFee !== undefined && !Number.isFinite(toPaymentNumber(shippingFee))) {
    errors.push('shippingFee geçersiz (metin olabilir)');
  }

  if (finalTotal === undefined || finalTotal === null) {
    errors.push('finalTotal tanımsız');
  } else if (!Number.isFinite(finalTotal) || Number.isNaN(finalTotal)) {
    errors.push('finalTotal geçersiz (NaN)');
  } else if (finalTotal <= 0) {
    errors.push('finalTotal sıfır veya negatif');
  }

  return { ok: errors.length === 0, errors };
}

/** PayTR token isteği — sunucu ile aynı sayısal alanlar */
export function buildPaytrPaymentPayload({
  settings = {},
  customer,
  items,
  checkoutTotals,
  couponCode,
  userIp,
}) {
  const totals = checkoutTotals || computeCheckoutTotals({ items });
  const validation = validatePaymentTotals(totals);
  if (!validation.ok) {
    throw new Error(validation.errors.join(' · '));
  }

  const orderItems = mapItemsForOrder(items);
  const discount = sanitizeDiscountForApi(totals.discount);

  return {
    siteName: settings.siteName || 'Nasyonel Toys',
    siteUrl: settings.siteUrl,
    siteLogoUrl: settings.logoUrl,
    pdfSettings: settings.pdfSettings,
    notifyEmail: settings.contactEmail,
    customer,
    items: orderItems,
    discount,
    shipping: totals.shippingPayload,
    orderTotal: totals.finalTotal,
    finalTotal: totals.finalTotal,
    couponCode: couponCode || discount.couponCode || undefined,
    userIp: userIp || undefined,
    _meta: {
      subtotal: totals.subtotal,
      shippingFee: totals.shippingFee,
      itemCount: totals.itemCount,
      minQtyOk: totals.minQtyCheck?.ok,
    },
  };
}
