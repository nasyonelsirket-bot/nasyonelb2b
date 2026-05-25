const crypto = require('crypto');

const OFFICIAL_PAYMENT_TYPE = 'card';

function paytrHashPart(value, fieldName, options = {}) {
  const { allowEmpty = false } = options;
  if (value == null || (value === '' && !allowEmpty)) {
    throw new Error(`PayTR hash için ${fieldName} gerekli`);
  }
  return String(value);
}

function createPaytrHmacToken(hashStr, merchantKey, merchantSalt) {
  const key = paytrHashPart(merchantKey, 'merchant_key');
  const salt = paytrHashPart(merchantSalt, 'merchant_salt');
  const message = String(hashStr) + String(salt);
  return crypto.createHmac('sha256', key).update(message, 'utf8').digest('base64');
}

/** payment_type: omit | empty | card × installment_count: hash içi / dışı */
const PAYTR_MATRIX_COMBOS = [
  { id: '01_pt-omit_inst-in', paymentTypeVariant: 'omit', installmentInHash: true },
  { id: '02_pt-omit_inst-out', paymentTypeVariant: 'omit', installmentInHash: false },
  { id: '03_pt-empty_inst-in', paymentTypeVariant: 'empty', installmentInHash: true },
  { id: '04_pt-empty_inst-out', paymentTypeVariant: 'empty', installmentInHash: false },
  { id: '05_pt-card_inst-in', paymentTypeVariant: 'card', installmentInHash: true },
  { id: '06_pt-card_inst-out', paymentTypeVariant: 'card', installmentInHash: false },
];

function resolvePaymentTypeVariant(explicit) {
  if (explicit === 'omit' || explicit === 'empty' || explicit === 'card') {
    return explicit;
  }
  const envVariant = String(process.env.PAYTR_PAYMENT_TYPE_VARIANT || '').trim().toLowerCase();
  if (envVariant === 'omit' || envVariant === 'empty' || envVariant === 'card') {
    return envVariant;
  }
  if (String(process.env.PAYTR_PAYMENT_TYPE || '').trim() === 'card') {
    return 'card';
  }
  if (process.env.PAYTR_PAYMENT_TYPE !== undefined) {
    return 'empty';
  }
  return 'empty';
}

function resolveInstallmentInHash(explicit, hashMode) {
  if (explicit === true || explicit === false) {
    return explicit;
  }
  const mode = String(hashMode ?? process.env.PAYTR_HASH_MODE ?? 'official').trim().toLowerCase();
  if (mode === 'compact') {
    return false;
  }
  const raw = String(process.env.PAYTR_INSTALLMENT_IN_HASH ?? '1').trim().toLowerCase();
  return !(raw === '0' || raw === 'false' || raw === 'no');
}

function buildMatrixHashFieldOrder({ paymentTypeVariant, installmentInHash }) {
  const order = [
    'merchant_id',
    'user_ip',
    'merchant_oid',
    'email',
    'payment_amount',
  ];
  if (paymentTypeVariant !== 'omit') {
    order.push('payment_type');
  }
  if (installmentInHash) {
    order.push('installment_count');
  }
  order.push('currency', 'test_mode', 'non_3d');
  return order;
}

function paymentTypeHashValue(paymentTypeVariant) {
  if (paymentTypeVariant === 'omit') return undefined;
  if (paymentTypeVariant === 'card') return OFFICIAL_PAYMENT_TYPE;
  return '';
}

function buildPaytrMatrixHashInput({
  merchantId,
  merchantKey,
  merchantSalt,
  userIp,
  merchantOid,
  email,
  paymentAmount,
  installmentCount = '0',
  currency = 'TL',
  testMode = '0',
  non3d = '0',
  paymentTypeVariant,
  installmentInHash,
  hashMode,
}) {
  const variant = resolvePaymentTypeVariant(paymentTypeVariant);
  const installmentInHashResolved = resolveInstallmentInHash(installmentInHash, hashMode);
  const fieldOrder = buildMatrixHashFieldOrder({
    paymentTypeVariant: variant,
    installmentInHash: installmentInHashResolved,
  });

  const parts = {
    merchant_id: paytrHashPart(String(merchantId), 'merchant_id'),
    user_ip: paytrHashPart(String(userIp), 'user_ip'),
    merchant_oid: paytrHashPart(String(merchantOid), 'merchant_oid'),
    email: paytrHashPart(String(email), 'email'),
    payment_amount: paytrHashPart(String(paymentAmount), 'payment_amount'),
    currency: paytrHashPart(String(currency), 'currency'),
    test_mode: paytrHashPart(String(testMode), 'test_mode'),
    non_3d: paytrHashPart(String(non3d), 'non_3d'),
  };

  if (variant !== 'omit') {
    parts.payment_type = paytrHashPart(paymentTypeHashValue(variant), 'payment_type', {
      allowEmpty: true,
    });
  }
  if (installmentInHashResolved) {
    parts.installment_count = paytrHashPart(String(installmentCount), 'installment_count');
  }

  const hashStr = fieldOrder.map((key) => parts[key]).join('');
  const hashMessage = hashStr + paytrHashPart(String(merchantSalt), 'merchant_salt');
  const paytrToken = createPaytrHmacToken(hashStr, merchantKey, merchantSalt);

  return {
    parts,
    hashStr,
    hashMessage,
    fieldOrder,
    paytrToken,
    paymentTypeVariant: variant,
    installmentInHash: installmentInHashResolved,
  };
}

function applyPaymentTypeToFormFields(fields, paymentTypeVariant) {
  const variant = resolvePaymentTypeVariant(paymentTypeVariant);
  const out = { ...fields };
  delete out.payment_type;
  if (variant === 'empty') {
    out.payment_type = '';
  } else if (variant === 'card') {
    out.payment_type = OFFICIAL_PAYMENT_TYPE;
  }
  return out;
}

function comboLabel(combo) {
  return `payment_type=${combo.paymentTypeVariant}, installment_in_hash=${combo.installmentInHash}`;
}

module.exports = {
  OFFICIAL_PAYMENT_TYPE,
  PAYTR_MATRIX_COMBOS,
  paytrHashPart,
  createPaytrHmacToken,
  resolvePaymentTypeVariant,
  resolveInstallmentInHash,
  buildMatrixHashFieldOrder,
  paymentTypeHashValue,
  buildPaytrMatrixHashInput,
  applyPaymentTypeToFormFields,
  comboLabel,
};
