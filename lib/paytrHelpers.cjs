const crypto = require('crypto');

function getPaytrConfig() {
  const merchantId = process.env.PAYTR_MERCHANT_ID;
  const merchantKey = process.env.PAYTR_MERCHANT_KEY;
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT;
  if (!merchantId || !merchantKey || !merchantSalt) {
    throw new Error('PayTR API bilgileri eksik (PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY, PAYTR_MERCHANT_SALT)');
  }
  const testMode = String(process.env.PAYTR_TEST_MODE || '1') === '1' ? '1' : '0';
  const debugOn =
    testMode === '1'
      ? String(process.env.PAYTR_DEBUG_ON || '1') === '1'
        ? '1'
        : '0'
      : '0';

  return {
    merchantId: String(merchantId),
    merchantKey: String(merchantKey),
    merchantSalt: String(merchantSalt),
    testMode,
    debugOn,
    noInstallment: String(process.env.PAYTR_NO_INSTALLMENT || '0'),
    maxInstallment: String(process.env.PAYTR_MAX_INSTALLMENT || '0'),
    currency: process.env.PAYTR_CURRENCY || 'TL',
    timeoutLimit: String(process.env.PAYTR_TIMEOUT_LIMIT || '30'),
  };
}

function buildUserBasket(items) {
  const basket = items.map((item) => [
    String(item.name || 'Ürün').slice(0, 200),
    Number(item.price || 0).toFixed(2),
    Number(item.quantity || 1),
  ]);
  return Buffer.from(JSON.stringify(basket)).toString('base64');
}

/** Direct API sepet — JSON string */
function buildDirectUserBasket(items) {
  const basket = items.map((item) => [
    String(item.name || 'Ürün').slice(0, 200),
    Number(item.price || 0).toFixed(2),
    Number(item.quantity || 1),
  ]);
  return JSON.stringify(basket);
}

/** PayTR odeme spp — tutar kuruş cinsinden tam sayı (69.00 TL → "6900") */
function formatDirectPaymentAmount(amount) {
  const n = Math.round(Number(amount) * 100) / 100;
  return String(Math.round(n * 100));
}

function createDirectPaytrTokenHash({
  merchantId,
  merchantKey,
  merchantSalt,
  userIp,
  merchantOid,
  email,
  paymentAmount,
  paymentType,
  installmentCount,
  currency,
  testMode,
  non3d,
}) {
  const hashStr =
    merchantId +
    userIp +
    merchantOid +
    email +
    paymentAmount +
    paymentType +
    installmentCount +
    currency +
    testMode +
    non3d;
  return crypto.createHmac('sha256', merchantKey).update(hashStr + merchantSalt).digest('base64');
}

function createPaytrTokenHash({
  merchantId,
  merchantKey,
  merchantSalt,
  userIp,
  merchantOid,
  email,
  paymentAmount,
  userBasket,
  noInstallment,
  maxInstallment,
  currency,
  testMode,
}) {
  const hashStr =
    merchantId +
    userIp +
    merchantOid +
    email +
    paymentAmount +
    userBasket +
    noInstallment +
    maxInstallment +
    currency +
    testMode;
  return crypto.createHmac('sha256', merchantKey).update(hashStr + merchantSalt).digest('base64');
}

function verifyCallbackHash({ merchantKey, merchantSalt, merchantOid, status, totalAmount, hash }) {
  const token = crypto
    .createHmac('sha256', merchantKey)
    .update(String(merchantOid) + merchantSalt + String(status) + String(totalAmount))
    .digest('base64');
  return token === hash;
}

function resolveClientIp(event) {
  const forwarded =
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['client-ip'] ||
    event.headers['x-forwarded-for'] ||
    '';
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return '127.0.0.1';
}

function siteBaseUrl(event) {
  if (process.env.URL) return String(process.env.URL).replace(/\/$/, '');
  const siteUrl = process.env.VITE_SITE_URL || process.env.SITE_URL;
  if (siteUrl) return String(siteUrl).replace(/\/$/, '');
  const host = event.headers['x-forwarded-host'] || event.headers.host || '';
  const proto = event.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`.replace(/\/$/, '');
}

function parseFormBody(body) {
  const params = new URLSearchParams(body || '');
  const data = {};
  for (const [key, value] of params.entries()) {
    data[key] = value;
  }
  return data;
}

module.exports = {
  getPaytrConfig,
  buildUserBasket,
  buildDirectUserBasket,
  formatDirectPaymentAmount,
  createPaytrTokenHash,
  createDirectPaytrTokenHash,
  verifyCallbackHash,
  resolveClientIp,
  siteBaseUrl,
  parseFormBody,
};
