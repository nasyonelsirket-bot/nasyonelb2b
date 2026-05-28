import { HIGH_VALUE_DISCOUNT_THRESHOLD_TL, HIGH_VALUE_DISCOUNT_PERCENT } from '@/constants/commerceCopy';

export const DEFAULT_PROMOTIONS = {
  ibanDiscountPercent: 10,
  freeShippingThreshold: 0,
  standardShippingFee: 0,
  highValueDiscountThreshold: HIGH_VALUE_DISCOUNT_THRESHOLD_TL,
  highValueDiscountPercent: HIGH_VALUE_DISCOUNT_PERCENT,
  deliveryReward: {
    enabled: true,
    percent: 10,
    minSubtotal: 200,
    validDays: 60,
    codePrefix: 'TESLIM',
    label: '2. siparişe özel',
  },
  campaigns: [],
  coupons: [],
  bundleRules: [],
};

function normalizeFreeShippingThreshold() {
  return 0;
}

export function normalizePromotions(raw) {
  const p = raw && typeof raw === 'object' ? raw : {};
  return {
    ibanDiscountPercent: Number(p.ibanDiscountPercent) || 10,
    freeShippingThreshold: 0,
    standardShippingFee: 0,
    highValueDiscountThreshold:
      Number(p.highValueDiscountThreshold) || HIGH_VALUE_DISCOUNT_THRESHOLD_TL,
    highValueDiscountPercent:
      Number(p.highValueDiscountPercent) || HIGH_VALUE_DISCOUNT_PERCENT,
    deliveryReward: {
      ...DEFAULT_PROMOTIONS.deliveryReward,
      ...(p.deliveryReward || {}),
    },
    campaigns: Array.isArray(p.campaigns) ? p.campaigns : [],
    coupons: Array.isArray(p.coupons) ? p.coupons : [],
    bundleRules: Array.isArray(p.bundleRules) ? p.bundleRules : [],
  };
}

export function normalizeCode(code) {
  return String(code || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function findCoupon(coupons, code) {
  const c = normalizeCode(code);
  return (Array.isArray(coupons) ? coupons : []).find(
    (x) => normalizeCode(x.code) === c && x.active !== false,
  );
}

export function validateCouponLocal(coupons, code, email, subtotal) {
  const coupon = findCoupon(coupons, code);
  if (!coupon) return { ok: false, error: 'Geçersiz kupon kodu' };
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { ok: false, error: 'Kupon süresi dolmuş' };
  }
  const used = Number(coupon.usedCount) || 0;
  const max = Number(coupon.maxUses) || 0;
  if (max > 0 && used >= max) {
    return { ok: false, error: 'Kupon kullanım limiti dolmuş' };
  }
  const min = Number(coupon.minSubtotal) || 0;
  const amount = Math.max(0, Number(subtotal) || 0);
  if (min > 0 && amount < min) {
    return { ok: false, error: `Minimum sepet tutarı ${min} TL` };
  }
  const restricted = String(coupon.restrictedEmail || '').trim().toLowerCase();
  const customer = String(email || '').trim().toLowerCase();
  if (restricted && customer && restricted !== customer) {
    return { ok: false, error: 'Bu kupon size özel değil' };
  }
  if (restricted && !customer) {
    return { ok: false, error: 'Kupon için e-posta gerekli' };
  }

  let discountAmount = 0;
  const type = coupon.type || 'percent';
  const value = Number(coupon.value) || 0;
  if (type === 'fixed') {
    discountAmount = Math.min(amount, value);
  } else {
    discountAmount = Math.round(amount * (value / 100) * 100) / 100;
  }

  return {
    ok: true,
    coupon,
    discountAmount,
    label:
      type === 'fixed'
        ? `${value} TL kupon indirimi`
        : `%${value} kupon indirimi (${coupon.label || coupon.code})`,
  };
}

export function computeCartTotals({ subtotal, paymentMethod, couponResult, promotions }) {
  const promos = normalizePromotions(promotions);
  const amount = Math.max(0, Number(subtotal) || 0);
  let discountAmount = 0;
  const parts = [];

  const ibanRate = (Number(promos.ibanDiscountPercent) || 10) / 100;
  if (paymentMethod === 'iban' && ibanRate > 0) {
    const ibanOff = Math.round(amount * ibanRate * 100) / 100;
    discountAmount += ibanOff;
    parts.push({
      type: 'iban',
      amount: ibanOff,
      label: `%${promos.ibanDiscountPercent} Havale/EFT`,
    });
  }

  if (couponResult?.ok && couponResult.discountAmount > 0) {
    discountAmount += couponResult.discountAmount;
    parts.push({
      type: 'coupon',
      amount: couponResult.discountAmount,
      label: couponResult.label,
      code: couponResult.coupon?.code,
    });
  }

  const hvThreshold = Number(promos.highValueDiscountThreshold) || HIGH_VALUE_DISCOUNT_THRESHOLD_TL;
  const hvPercent = Number(promos.highValueDiscountPercent) || HIGH_VALUE_DISCOUNT_PERCENT;
  let highValueDiscountEarned = false;
  if (amount >= hvThreshold && hvPercent > 0) {
    const hvOff = Math.round(amount * (hvPercent / 100) * 100) / 100;
    if (hvOff > 0) {
      discountAmount += hvOff;
      highValueDiscountEarned = true;
      parts.push({
        type: 'high_value',
        amount: hvOff,
        label: `${hvThreshold} TL üzeri ekstra %${hvPercent} indirim`,
      });
    }
  }

  discountAmount = Math.min(discountAmount, amount);
  const grandTotal = Math.round((amount - discountAmount) * 100) / 100;

  return {
    subtotal: amount,
    paymentMethod,
    discountAmount,
    grandTotal,
    parts,
    couponCode: couponResult?.ok ? couponResult.coupon?.code : null,
    ratePercent: paymentMethod === 'iban' ? promos.ibanDiscountPercent : 0,
    tierLabel:
      paymentMethod === 'iban'
        ? `%${promos.ibanDiscountPercent} Havale/EFT indirimi`
        : couponResult?.ok
          ? couponResult.label
          : '',
    upsellMessage: null,
    highValueDiscountEarned,
    highValueDiscountThreshold: hvThreshold,
    highValueDiscountRemaining: highValueDiscountEarned
      ? 0
      : Math.max(0, hvThreshold - amount),
    highValueDiscountPercent: hvPercent,
    currentDiscountMessage: highValueDiscountEarned
      ? `${hvThreshold} TL üzeri alışverişe ekstra %${hvPercent} indirim kazandınız 🎉`
      : couponResult?.ok
        ? couponResult.label
        : null,
  };
}

export const CAMPAIGN_TYPES = [
  { id: 'payment_iban', label: 'Havale / EFT indirimi' },
  { id: 'bundle', label: 'Birlikte al / paket' },
  { id: 'bogo', label: 'X al Y öde' },
  { id: 'percent_cart', label: 'Sepet yüzde indirimi (bilgi)' },
];
