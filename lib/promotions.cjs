const crypto = require('crypto');

const DEFAULT_PROMOTIONS = {
  ibanDiscountPercent: 10,
  freeShippingThreshold: 500,
  standardShippingFee: 100,
  deliveryReward: {
    enabled: true,
    percent: 10,
    minSubtotal: 200,
    validDays: 60,
    codePrefix: 'TESLIM',
    label: '2. siparişe özel',
  },
  campaigns: [
    {
      id: 'camp-iban',
      type: 'payment_iban',
      title: 'Havale / EFT %10',
      description: 'Ödeme adımında havale seçeneği ile otomatik indirim.',
      active: true,
      percent: 10,
    },
    {
      id: 'camp-bundle',
      type: 'bundle',
      title: 'Birlikte al — kargo bedava',
      description: '500 TL üzeri ücretsiz kargo; sepette uyumlu ürün önerisi %5 indirimli.',
      active: true,
    },
    {
      id: 'camp-bogo',
      type: 'bogo',
      title: '2 al 1 öde (örnek)',
      description: 'Seçili ürünlerde 2 al 1 öde — kupon veya ürün kuralı ile tanımlayın.',
      active: false,
      buyQty: 2,
      payQty: 1,
    },
  ],
  coupons: [],
  bundleRules: [],
};

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeCode(code) {
  return String(code || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function normalizeFreeShippingThreshold(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 500;
  if (n === 750) return 500;
  return n;
}

function normalizePromotions(raw) {
  const p = raw && typeof raw === 'object' ? raw : {};
  return {
    ibanDiscountPercent: Number(p.ibanDiscountPercent) || 10,
    freeShippingThreshold: normalizeFreeShippingThreshold(p.freeShippingThreshold),
    standardShippingFee: Number(p.standardShippingFee) || 100,
    deliveryReward: {
      ...DEFAULT_PROMOTIONS.deliveryReward,
      ...(p.deliveryReward || {}),
    },
    campaigns: Array.isArray(p.campaigns) ? p.campaigns : DEFAULT_PROMOTIONS.campaigns,
    coupons: Array.isArray(p.coupons) ? p.coupons : [],
    bundleRules: Array.isArray(p.bundleRules) ? p.bundleRules : [],
  };
}

function findCoupon(coupons, code) {
  const c = normalizeCode(code);
  return (Array.isArray(coupons) ? coupons : []).find(
    (x) => normalizeCode(x.code) === c && x.active !== false,
  );
}

function isCouponExpired(coupon) {
  if (!coupon?.expiresAt) return false;
  return new Date(coupon.expiresAt).getTime() < Date.now();
}

function validateCoupon(coupons, code, email, subtotal) {
  const coupon = findCoupon(coupons, code);
  if (!coupon) {
    return { ok: false, error: 'Geçersiz kupon kodu' };
  }
  if (isCouponExpired(coupon)) {
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
  const restricted = normalizeEmail(coupon.restrictedEmail);
  const customer = normalizeEmail(email);
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

function computeCartTotals({ subtotal, paymentMethod, couponResult, promotions }) {
  const promos = normalizePromotions(promotions);
  const amount = Math.max(0, Number(subtotal) || 0);
  let discountAmount = 0;
  const parts = [];

  const ibanRate = (Number(promos.ibanDiscountPercent) || 10) / 100;
  if (paymentMethod === 'iban' && ibanRate > 0) {
    const ibanOff = Math.round(amount * ibanRate * 100) / 100;
    discountAmount += ibanOff;
    parts.push({ type: 'iban', amount: ibanOff, label: `%${promos.ibanDiscountPercent} Havale/EFT` });
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

  discountAmount = Math.min(discountAmount, amount);
  const grandTotal = Math.round((amount - discountAmount) * 100) / 100;

  return {
    subtotal: amount,
    paymentMethod,
    discountAmount,
    grandTotal,
    parts,
    couponCode: couponResult?.ok ? couponResult.coupon?.code : null,
  };
}

function makeRewardCode(prefix) {
  const p = String(prefix || 'TESLIM').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'TESLIM';
  return `${p}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function buildDeliveryRewardCoupon(promotions, customerEmail, sourceOrderNumber) {
  const promos = normalizePromotions(promotions);
  const cfg = promos.deliveryReward || {};
  if (!cfg.enabled) return null;

  const email = normalizeEmail(customerEmail);
  if (!email) return null;

  const validDays = Math.max(1, Number(cfg.validDays) || 60);
  const expires = new Date();
  expires.setDate(expires.getDate() + validDays);

  return {
    id: `cup-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    code: makeRewardCode(cfg.codePrefix),
    type: 'percent',
    value: Number(cfg.percent) || 10,
    minSubtotal: Number(cfg.minSubtotal) || 200,
    maxUses: 1,
    usedCount: 0,
    active: true,
    label: cfg.label || '2. siparişe özel',
    restrictedEmail: email,
    sourceOrderNumber: String(sourceOrderNumber || ''),
    trigger: 'after_delivery',
    createdAt: new Date().toISOString(),
    expiresAt: expires.toISOString(),
    notes: `${sourceOrderNumber} teslimi sonrası otomatik`,
  };
}

function incrementCouponUsage(coupons, code) {
  const c = normalizeCode(code);
  return (Array.isArray(coupons) ? coupons : []).map((cup) => {
    if (normalizeCode(cup.code) !== c) return cup;
    return { ...cup, usedCount: (Number(cup.usedCount) || 0) + 1 };
  });
}

module.exports = {
  DEFAULT_PROMOTIONS,
  normalizePromotions,
  normalizeCode,
  findCoupon,
  validateCoupon,
  computeCartTotals,
  buildDeliveryRewardCoupon,
  incrementCouponUsage,
};
