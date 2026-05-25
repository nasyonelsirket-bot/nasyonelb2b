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
  const amountModeRaw = String(process.env.PAYTR_AMOUNT_MODE || 'kurus').trim().toLowerCase();
  const amountMode = amountModeRaw === 'decimal' ? 'decimal' : 'kurus';
  const basketModeRaw = String(process.env.PAYTR_BASKET_MODE || 'decimal').trim().toLowerCase();
  const basketMode = basketModeRaw === 'kurus' ? 'kurus' : 'decimal';

  return {
    merchantId,
    merchantKey,
    merchantSalt,
    testMode,
    debugOn,
    amountMode,
    basketMode,
    currency: String(process.env.PAYTR_CURRENCY || 'TL').trim(),
  };
}

function resolvePaytrAmountMode(mode) {
  const raw = String(mode ?? process.env.PAYTR_AMOUNT_MODE ?? 'kurus').trim().toLowerCase();
  return raw === 'decimal' ? 'decimal' : 'kurus';
}

function resolvePaytrBasketMode(mode) {
  const raw = String(mode ?? process.env.PAYTR_BASKET_MODE ?? 'decimal').trim().toLowerCase();
  return raw === 'kurus' ? 'kurus' : 'decimal';
}

/** Direct API sepet — decimal [["Ürün","125.00","1"]] */
function buildDirectUserBasketDecimal(items, payableTotal) {
  const lines = (Array.isArray(items) ? items : []).map((item) => [
    String(item.name || 'Ürün').slice(0, 200),
    (Math.round(Number(item.price || 0) * 100) / 100).toFixed(2),
    String(Number(item.quantity || 1)),
  ]);

  if (payableTotal != null && Number.isFinite(Number(payableTotal))) {
    let sum = lines.reduce((acc, [, price, qty]) => acc + Number(price) * Number(qty), 0);
    sum = Math.round(sum * 100) / 100;
    const target = Math.round(Number(payableTotal) * 100) / 100;
    const diff = Math.round((target - sum) * 100) / 100;
    if (Math.abs(diff) >= 0.01) {
      lines.push([diff > 0 ? 'Kargo / ek' : 'İndirim', Math.abs(diff).toFixed(2), '1']);
    }
  }

  return JSON.stringify(lines);
}

/** Direct API sepet — [["Ürün","12500","1"]] fiyat/adet string kuruş */
function buildDirectUserBasketKurus(items, payableTotal) {
  const lines = (Array.isArray(items) ? items : []).map((item) => [
    String(item.name || 'Ürün').slice(0, 200),
    String(Math.round(Number(item.price || 0) * 100)),
    String(Number(item.quantity || 1)),
  ]);

  if (payableTotal != null && Number.isFinite(Number(payableTotal))) {
    let sumKurus = lines.reduce(
      (acc, [, priceKurus, qty]) => acc + Number(priceKurus) * Number(qty),
      0,
    );
    const targetKurus = Math.round(Number(payableTotal) * 100);
    const diffKurus = targetKurus - sumKurus;
    if (diffKurus !== 0) {
      lines.push([diffKurus > 0 ? 'Kargo / ek' : 'İndirim', String(Math.abs(diffKurus)), '1']);
    }
  }

  return JSON.stringify(lines);
}

function buildDirectUserBasket(items, payableTotal, basketMode = 'decimal') {
  return resolvePaytrBasketMode(basketMode) === 'kurus'
    ? buildDirectUserBasketKurus(items, payableTotal)
    : buildDirectUserBasketDecimal(items, payableTotal);
}

/** PayTR Direct API — ondalık TL (125 TL → "125.00"), resmi örnek formatı */
function formatDirectPaymentAmountDecimal(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error('PayTR payment_amount geçersiz');
  }
  return (Math.round(n * 100) / 100).toFixed(2);
}

/** PayTR — tutar kuruş cinsinden tam sayı string (125 TL → "12500") */
function formatDirectPaymentAmountKurus(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error('PayTR payment_amount geçersiz');
  }
  return String(Math.round(n * 100));
}

/** PAYTR_AMOUNT_MODE=kurus|decimal — hash ve formda aynı format (varsayılan: kurus) */
function formatPaytrPaymentAmount(amount, amountMode = 'kurus') {
  return resolvePaytrAmountMode(amountMode) === 'kurus'
    ? formatDirectPaymentAmountKurus(amount)
    : formatDirectPaymentAmountDecimal(amount);
}

/** @deprecated formatPaytrPaymentAmount kullanın */
function formatDirectPaymentAmount(amount) {
  return formatDirectPaymentAmountKurus(amount);
}

function formatPaytrPaymentAmountKurus(amount) {
  return formatDirectPaymentAmountKurus(amount);
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

const DIRECT_API_HASH_FIELD_ORDER = [
  'merchant_id',
  'user_ip',
  'merchant_oid',
  'email',
  'payment_amount',
  'payment_type',
  'installment_count',
  'currency',
  'test_mode',
  'non_3d',
];

/** Direct API hash string — https://dev.paytr.com/direkt-api/direkt-api-1-adim */
function buildDirectPaytrHashInput({
  merchantId,
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
  const parts = {
    merchant_id: paytrHashPart(merchantId, 'merchant_id'),
    user_ip: paytrHashPart(userIp, 'user_ip'),
    merchant_oid: paytrHashPart(merchantOid, 'merchant_oid'),
    email: paytrHashPart(email, 'email'),
    payment_amount: paytrHashPart(paymentAmount, 'payment_amount'),
    payment_type: paytrHashPart(paymentType, 'payment_type'),
    installment_count: paytrHashPart(installmentCount, 'installment_count'),
    currency: paytrHashPart(currency, 'currency'),
    test_mode: paytrHashPart(testMode, 'test_mode'),
    non_3d: paytrHashPart(non3d, 'non_3d'),
  };
  const hashStr = DIRECT_API_HASH_FIELD_ORDER.map((key) => parts[key]).join('');
  const hashMessage = hashStr + paytrHashPart(merchantSalt, 'merchant_salt');
  return { parts, hashStr, hashMessage, fieldOrder: DIRECT_API_HASH_FIELD_ORDER };
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
  const { hashStr } = buildDirectPaytrHashInput({
    merchantId,
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
  });
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

function logPaytrOfficialDiff(context, hashDebug, formFields, config) {
  const hashOnlyFields = new Set(DIRECT_API_HASH_FIELD_ORDER);
  const formNotInHash = ['lang', 'no_installment', 'max_installment'];
  const officialFormFields = [
    'merchant_id',
    'paytr_token',
    'user_ip',
    'merchant_oid',
    'email',
    'payment_type',
    'payment_amount',
    'installment_count',
    'currency',
    'client_lang',
    'test_mode',
    'non_3d',
    'merchant_ok_url',
    'merchant_fail_url',
    'user_name',
    'user_address',
    'user_phone',
    'user_basket',
    'debug_on',
    'non3d_test_failed',
  ];

  const diff = {
    hashFieldOrderMatchesOfficial: hashDebug.fieldOrder.join(' + ') + ' + merchant_salt',
    hashExcludesFormOnlyFields: formNotInHash,
    hashPartsUsed: hashDebug.parts,
    credentials: {
      merchant_id: config.merchantId,
      merchant_id_length: config.merchantId.length,
      merchant_key_length: config.merchantKey.length,
      merchant_salt_length: config.merchantSalt.length,
      credentials_trimmed: true,
    },
    test_mode_form: formFields.test_mode,
    test_mode_config: config.testMode,
    paytr_test_mode_env: process.env.PAYTR_TEST_MODE ?? '(unset, uses default)',
    currency_hash: hashDebug.parts.currency,
    currency_form: formFields.currency,
    currency_match: hashDebug.parts.currency === formFields.currency,
    payment_amount_form: formFields.payment_amount,
    user_basket_form: formFields.user_basket,
    amount_mode: config.amountMode,
    basket_mode: config.basketMode,
    officialDirectApiNotes: {
      payment_amount:
        config.amountMode === 'kurus'
          ? 'odeme spp kuruş integer (ör. "12500") — hash ve form aynı'
          : 'Resmi PHP örneği ondalık format (ör. "125.00")',
      user_basket:
        config.basketMode === 'kurus'
          ? 'Sepet fiyatları kuruş string (ör. "12500")'
          : 'Sepet fiyatları ondalık string (ör. "125.00") — payment_amount kuruş olabilir',
      client_lang: 'Resmi Direct API client_lang kullanır; odeme spp lang zorunlu',
    },
    formVsOfficialDirectApi: {
      officialFieldsPresent: officialFormFields.filter((f) => formFields[f] != null),
      officialFieldsMissing: officialFormFields.filter((f) => formFields[f] == null && f !== 'client_lang'),
      odemeSppExtraFields: formNotInHash.filter((f) => formFields[f] != null),
      hashFieldsOnly: [...hashOnlyFields],
    },
  };

  console.log(`[paytr:${context}] official direct api diff`, JSON.stringify(diff, null, 2));
}

function logPaytrPayload(context, fields, meta = {}) {
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

  if (meta.amountDebug) {
    console.log(`[paytr:${context}] amount_mode`, meta.config?.amountMode ?? '(unknown)');
    console.log(`[paytr:${context}] basket_mode`, meta.config?.basketMode ?? meta.amountDebug.basketMode ?? '(unknown)');
    console.log(`[paytr:${context}] payment_amount raw`, meta.amountDebug.paymentAmountRaw);
    console.log(
      `[paytr:${context}] payment_amount hashed`,
      meta.hashDebug?.parts?.payment_amount ?? '(hash not built yet)',
    );
    console.log(`[paytr:${context}] user_basket raw`, meta.amountDebug.userBasketRaw);
  }

  if (meta.hashDebug) {
    console.log(`[paytr:${context}] hash input string (hashStr + merchant_salt)`, meta.hashDebug.hashMessage);
    console.log(`[paytr:${context}] hashStr without salt`, meta.hashDebug.hashStr);
    console.log(`[paytr:${context}] hash parts`, JSON.stringify(meta.hashDebug.parts, null, 2));
    if (meta.config) {
      logPaytrOfficialDiff(context, meta.hashDebug, safe, meta.config);
    }
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
  resolvePaytrAmountMode,
  resolvePaytrBasketMode,
  buildDirectUserBasketDecimal,
  buildDirectUserBasketKurus,
  buildDirectUserBasket,
  formatDirectPaymentAmountDecimal,
  formatDirectPaymentAmountKurus,
  formatDirectPaymentAmount,
  formatPaytrPaymentAmount,
  formatPaytrPaymentAmountKurus,
  createPaytrHmacToken,
  paytrHashPart,
  buildDirectPaytrHashInput,
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
