const crypto = require('crypto');

function getPaytrConfig() {
  const merchantId = String(process.env.PAYTR_MERCHANT_ID || '').trim();
  const merchantKey = String(process.env.PAYTR_MERCHANT_KEY || '').trim();
  const merchantSalt = String(process.env.PAYTR_MERCHANT_SALT || '').trim();
  if (!merchantId || !merchantKey || !merchantSalt) {
    throw new Error('PayTR API bilgileri eksik (PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY, PAYTR_MERCHANT_SALT)');
  }
  // Canlı Netlify deploy: varsayılan test_mode=0. Yerelde veya test için PAYTR_TEST_MODE=1 verin.
  const defaultTestMode = process.env.CONTEXT === 'production' ? '0' : '1';
  const testMode =
    String(process.env.PAYTR_TEST_MODE ?? defaultTestMode).trim() === '1' ? '1' : '0';
  const debugOn = String(process.env.PAYTR_DEBUG_ON ?? (testMode === '1' ? '1' : '0')).trim() === '1' ? '1' : '0';

  return {
    merchantId,
    merchantKey,
    merchantSalt,
    testMode,
    debugOn,
    currency: String(process.env.PAYTR_CURRENCY || 'TL').trim(),
  };
}

/** Direct API sepet — birim fiyatlar kuruş, JSON string */
function buildDirectUserBasketKurus(items, payableTotal) {
  const lines = (Array.isArray(items) ? items : []).map((item) => [
    String(item.name || 'Ürün').slice(0, 200),
    String(Math.round(Number(item.price || 0) * 100)),
    Number(item.quantity || 1),
  ]);

  if (payableTotal != null && Number.isFinite(Number(payableTotal))) {
    let sumKurus = lines.reduce(
      (acc, [, priceKurus, qty]) => acc + Number(priceKurus) * Number(qty),
      0,
    );
    const targetKurus = Math.round(Number(payableTotal) * 100);
    const diffKurus = targetKurus - sumKurus;
    if (diffKurus !== 0) {
      lines.push([diffKurus > 0 ? 'Kargo / ek' : 'İndirim', String(Math.abs(diffKurus)), 1]);
    }
  }

  return JSON.stringify(lines);
}

/** PayTR — tutar kuruş cinsinden tam sayı string (125 TL → "12500") */
function formatDirectPaymentAmount(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error('PayTR payment_amount geçersiz');
  }
  return String(Math.round(n * 100));
}

function formatPaytrPaymentAmountKurus(amount) {
  return formatDirectPaymentAmount(amount);
}

/** Hash string parçası — null/undefined/boş değerler hashe girmez */
function paytrHashPart(value, fieldName) {
  if (value == null || value === '') {
    throw new Error(`PayTR hash için ${fieldName} gerekli`);
  }
  return String(value);
}

function createPaytrHmacToken(hashStr, merchantKey, merchantSalt) {
  const message = hashStr + paytrHashPart(merchantSalt, 'merchant_salt');
  return crypto.createHmac('sha256', paytrHashPart(merchantKey, 'merchant_key')).update(message).digest('base64');
}

/** Direct API — https://dev.paytr.com/direkt-api/direkt-api-1-adim */
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
    paytrHashPart(merchantId, 'merchant_id') +
    paytrHashPart(userIp, 'user_ip') +
    paytrHashPart(merchantOid, 'merchant_oid') +
    paytrHashPart(email, 'email') +
    paytrHashPart(paymentAmount, 'payment_amount') +
    paytrHashPart(paymentType, 'payment_type') +
    paytrHashPart(installmentCount, 'installment_count') +
    paytrHashPart(currency, 'currency') +
    paytrHashPart(testMode, 'test_mode') +
    paytrHashPart(non3d, 'non_3d');
  return createPaytrHmacToken(hashStr, merchantKey, merchantSalt);
}

function sanitizePaytrFields(fields) {
  const out = {};
  for (const [key, value] of Object.entries(fields || {})) {
    if (value == null || value === '') continue;
    out[key] = String(value);
  }
  return out;
}

function formatPaytrPostBody(fields) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sanitizePaytrFields(fields))) {
    params.append(key, value);
  }
  return params.toString();
}

function logPaytrPayload(context, fields) {
  const safe = sanitizePaytrFields(fields);
  if (safe.card_number) safe.card_number = `****${safe.card_number.slice(-4)}`;
  if (safe.cvv) safe.cvv = '***';

  const keyFields = [
    'payment_amount',
    'payment_type',
    'installment_count',
    'no_installment',
    'max_installment',
    'currency',
    'lang',
    'paytr_token',
  ];
  const summary = {};
  for (const key of keyFields) {
    if (safe[key] != null) summary[key] = safe[key];
  }

  console.log(`[paytr:${context}] no_installment`, safe.no_installment ?? '(missing)');
  console.log(`[paytr:${context}] max_installment`, safe.max_installment ?? '(missing)');
  console.log(`[paytr:${context}] direct api key fields`, JSON.stringify(summary, null, 2));
  console.log(`[paytr:${context}] direct api full payload`, JSON.stringify(safe, null, 2));
  console.log(`[paytr:${context}] post body`, formatPaytrPostBody(safe));
}

function verifyCallbackHash({ merchantKey, merchantSalt, merchantOid, status, totalAmount, hash }) {
  const token = crypto
    .createHmac('sha256', merchantKey)
    .update(String(merchantOid) + merchantSalt + String(status) + String(totalAmount))
    .digest('base64');
  return token === hash;
}

function resolveClientIp(event) {
  const headers = event?.headers || {};
  const candidates = [
    headers['x-nf-client-connection-ip'],
    headers['client-ip'],
    headers['cf-connecting-ip'],
    headers['true-client-ip'],
    headers['x-real-ip'],
    headers['x-forwarded-for'],
  ];
  for (const value of candidates) {
    if (!value) continue;
    const ip = String(value).split(',')[0].trim();
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return ip;
  }
  return '';
}

function resolvePaytrUserIp(event, body = {}) {
  const fromHeaders = resolveClientIp(event);
  if (fromHeaders) return fromHeaders;
  const fromBody = String(body.userIp || body.user_ip || '').trim();
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(fromBody)) return fromBody;
  return '';
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

/** PayTR callback POST — hash alanı base64 (+,/=) içerir; + boşluğa çevrilmemeli. */
function parsePaytrCallbackBody(raw) {
  const data = {};
  if (!raw) return data;
  for (const segment of String(raw).split('&')) {
    if (!segment) continue;
    const eq = segment.indexOf('=');
    if (eq === -1) {
      data[decodeURIComponent(segment.replace(/\+/g, '%20'))] = '';
      continue;
    }
    const key = decodeURIComponent(segment.slice(0, eq).replace(/\+/g, '%20'));
    const rawValue = segment.slice(eq + 1);
    const value =
      key === 'hash'
        ? decodeURIComponent(rawValue.replace(/\+/g, '%2B'))
        : decodeURIComponent(rawValue.replace(/\+/g, '%20'));
    data[key] = value;
  }
  return data;
}

function parseEventFormBody(event) {
  const body = event?.body;
  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
    return body;
  }
  let raw = body || '';
  if (event?.isBase64Encoded && raw) {
    raw = Buffer.from(raw, 'base64').toString('utf8');
  }
  return parsePaytrCallbackBody(raw);
}

function paytrOkResponse() {
  return { statusCode: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: 'OK' };
}

module.exports = {
  getPaytrConfig,
  buildDirectUserBasketKurus,
  formatDirectPaymentAmount,
  formatPaytrPaymentAmountKurus,
  createPaytrHmacToken,
  paytrHashPart,
  createDirectPaytrTokenHash,
  sanitizePaytrFields,
  formatPaytrPostBody,
  logPaytrPayload,
  verifyCallbackHash,
  resolveClientIp,
  resolvePaytrUserIp,
  siteBaseUrl,
  parseFormBody,
  parsePaytrCallbackBody,
  parseEventFormBody,
  paytrOkResponse,
};
