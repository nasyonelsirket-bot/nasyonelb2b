const crypto = require('crypto');

function getPaytrConfig() {
  const merchantId = String(process.env.PAYTR_MERCHANT_ID || '').trim();
  const merchantKey = String(process.env.PAYTR_MERCHANT_KEY || '').trim();
  const merchantSalt = String(process.env.PAYTR_MERCHANT_SALT || '').trim();
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
    merchantId,
    merchantKey,
    merchantSalt,
    testMode,
    debugOn,
    noInstallment: String(process.env.PAYTR_NO_INSTALLMENT || '0').trim(),
    maxInstallment: String(process.env.PAYTR_MAX_INSTALLMENT || '0').trim(),
    currency: String(process.env.PAYTR_CURRENCY || 'TL').trim(),
    timeoutLimit: String(process.env.PAYTR_TIMEOUT_LIMIT || '30').trim(),
  };
}

/** PayTR sepet — ödenecek tutarla hizalı (kupon/kargo farkı satır olarak eklenir) */
function buildPaytrUserBasketBase64(items, payableTotal) {
  const lines = (Array.isArray(items) ? items : []).map((item) => [
    String(item.name || 'Ürün').slice(0, 200),
    Number(item.price || 0).toFixed(2),
    Number(item.quantity || 1),
  ]);

  let sum = lines.reduce((acc, [, price, qty]) => acc + Number(price) * Number(qty), 0);
  sum = Math.round(sum * 100) / 100;
  const target = Math.round(Number(payableTotal) * 100) / 100;
  const diff = Math.round((target - sum) * 100) / 100;

  if (Math.abs(diff) >= 0.01) {
    lines.push([diff > 0 ? 'Kargo / ek' : 'İndirim', diff.toFixed(2), 1]);
  }

  return Buffer.from(JSON.stringify(lines)).toString('base64');
}

/** @deprecated Direct API JSON sepet */
function buildDirectUserBasket(items) {
  const basket = items.map((item) => [
    String(item.name || 'Ürün').slice(0, 200),
    Number(item.price || 0).toFixed(2),
    Number(item.quantity || 1),
  ]);
  return JSON.stringify(basket);
}

/** PayTR — tutar kuruş cinsinden tam sayı (69.00 TL → "6900") */
function formatPaytrPaymentAmountKurus(amount) {
  const n = Math.round(Number(amount) * 100) / 100;
  return String(Math.round(n * 100));
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

async function requestPaytrIframeToken(fields) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    if (value != null && value !== '') body.append(key, String(value));
  }

  const res = await fetch('https://www.paytr.com/odeme/api/get-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { status: 'failed', reason: text.slice(0, 300) || 'PayTR yanıtı okunamadı' };
  }
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
  // PayTR token'ı müşterinin gerçek IP'si ile imzalanmalı — Netlify istek başlıkları ipify'dan daha güvenilir.
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
  let raw = event?.body || '';
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
  buildPaytrUserBasketBase64,
  buildDirectUserBasket,
  formatPaytrPaymentAmountKurus,
  createPaytrTokenHash,
  createDirectPaytrTokenHash,
  requestPaytrIframeToken,
  verifyCallbackHash,
  resolveClientIp,
  resolvePaytrUserIp,
  siteBaseUrl,
  parseFormBody,
  parseEventFormBody,
  paytrOkResponse,
};
