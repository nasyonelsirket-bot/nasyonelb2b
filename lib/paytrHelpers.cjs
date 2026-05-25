const crypto = require('crypto');

/** PayTR resmi Direct API Node örneği — dev.paytr.com/direkt-api/direkt-api-1-adim */
const PAYTR_ODEME_URL = 'https://www.paytr.com/odeme';
const OFFICIAL_PAYMENT_TYPE = 'card';

const OFFICIAL_DIRECT_API_REFERENCE = {
  hashFieldOrder: [
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
  ],
  /** Aktif test — payment_type/installment_count hash dışı */
  compactHashFieldOrder: [
    'merchant_id',
    'user_ip',
    'merchant_oid',
    'email',
    'payment_amount',
    'currency',
    'test_mode',
    'non_3d',
  ],
  hmacFormula:
    'crypto.createHmac("sha256", merchant_key).update(hashStr + merchant_salt).digest("base64")',
  hashFieldTypes: {
    merchant_id: 'string',
    user_ip: 'string (IPv4)',
    merchant_oid: 'string',
    email: 'string',
    payment_amount: 'string',
    payment_type: 'string ("card") — form+hash yalnız official modda',
    installment_count: 'string ("0") — form-only compact modda',
    currency: 'string ("TL")',
    test_mode: 'string ("0"|"1")',
    non_3d: 'string ("0"|"1")',
  },
  notInHash: [
    'payment_type',
    'installment_count',
    'lang',
    'no_installment',
    'max_installment',
    'client_lang',
    'user_basket',
  ],
  officialSamplePaymentAmount: '100.99',
  officialSampleBasket: '[["Örnek Ürün 1","50.00",1]]',
  officialPaymentType: OFFICIAL_PAYMENT_TYPE,
};

const DIRECT_API_HASH_FIELD_ORDER = OFFICIAL_DIRECT_API_REFERENCE.hashFieldOrder;

const INVISIBLE_CHAR_RE = /[\u200B-\u200D\uFEFF\u00A0\u2060\u180E]/g;

function sanitizePaytrCredential(value, fieldName) {
  let s = String(value ?? '').replace(INVISIBLE_CHAR_RE, '');
  s = s.trim();
  if (!s) {
    throw new Error(`PayTR ${fieldName} gerekli (boş veya yalnızca görünmez karakter)`);
  }
  return s;
}

function getPaytrConfig() {
  const merchantId = sanitizePaytrCredential(process.env.PAYTR_MERCHANT_ID, 'PAYTR_MERCHANT_ID');
  const merchantKey = sanitizePaytrCredential(process.env.PAYTR_MERCHANT_KEY, 'PAYTR_MERCHANT_KEY');
  const merchantSalt = sanitizePaytrCredential(process.env.PAYTR_MERCHANT_SALT, 'PAYTR_MERCHANT_SALT');

  const defaultTestMode = process.env.CONTEXT === 'production' ? '0' : '1';
  const testMode =
    String(process.env.PAYTR_TEST_MODE ?? defaultTestMode).trim() === '1' ? '1' : '0';
  const debugOn = String(process.env.PAYTR_DEBUG_ON ?? (testMode === '1' ? '1' : '0')).trim() === '1' ? '1' : '0';
  const amountModeRaw = String(process.env.PAYTR_AMOUNT_MODE || 'kurus').trim().toLowerCase();
  const amountMode = amountModeRaw === 'decimal' ? 'decimal' : 'kurus';
  const basketModeRaw = String(process.env.PAYTR_BASKET_MODE || 'decimal').trim().toLowerCase();
  const basketMode = basketModeRaw === 'kurus' ? 'kurus' : 'decimal';
  const hashMode = resolvePaytrHashMode();

  return {
    merchantId,
    merchantKey,
    merchantSalt,
    testMode,
    debugOn,
    amountMode,
    basketMode,
    hashMode,
    currency: sanitizePaytrCredential(process.env.PAYTR_CURRENCY || 'TL', 'PAYTR_CURRENCY'),
  };
}

/** compact (varsayılan) — payment_type/installment_count hash dışı | official — docs birebir */
function resolvePaytrHashMode(mode) {
  const raw = String(mode ?? process.env.PAYTR_HASH_MODE ?? 'compact').trim().toLowerCase();
  return raw === 'official' ? 'official' : 'compact';
}

function buildDirectPaytrHashFieldOrder(hashMode = 'compact') {
  return resolvePaytrHashMode(hashMode) === 'official'
    ? OFFICIAL_DIRECT_API_REFERENCE.hashFieldOrder
    : OFFICIAL_DIRECT_API_REFERENCE.compactHashFieldOrder;
}

function resolvePaytrAmountMode(mode) {
  const raw = String(mode ?? process.env.PAYTR_AMOUNT_MODE ?? 'kurus').trim().toLowerCase();
  return raw === 'decimal' ? 'decimal' : 'kurus';
}

function resolvePaytrBasketMode(mode) {
  const raw = String(mode ?? process.env.PAYTR_BASKET_MODE ?? 'decimal').trim().toLowerCase();
  return raw === 'kurus' ? 'kurus' : 'decimal';
}

function isIpv4(ip) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(String(ip || '').trim());
}

function isIpv6(ip) {
  return String(ip || '').includes(':');
}

function extractIpv4FromHeaderValue(value) {
  if (!value) return '';
  for (const segment of String(value).split(',')) {
    const ip = segment.trim();
    if (isIpv4(ip)) return ip;
  }
  return '';
}

/** Byte / unicode tanılama — hash input ve alan doğrulama */
function inspectPaytrString(label, value, options = {}) {
  const { mask = false, maxHexBytes = 128 } = options;
  const str = value == null ? '' : String(value);
  const buf = Buffer.from(str, 'utf8');
  const invisible = [];
  for (let i = 0; i < str.length; i += 1) {
    const code = str.charCodeAt(i);
    const ch = str[i];
    if (ch !== ' ' && ch !== '\t' && ch !== '\n' && ch !== '\r' && /\s/.test(ch)) {
      invisible.push(`U+${code.toString(16).padStart(4, '0')}`);
    } else if (code < 32 && ch !== '\t' && ch !== '\n' && ch !== '\r') {
      invisible.push(`U+${code.toString(16).padStart(4, '0')}`);
    } else if (INVISIBLE_CHAR_RE.test(ch)) {
      invisible.push(`U+${code.toString(16).padStart(4, '0')}`);
    }
  }

  return {
    label,
    value: mask ? `[masked len=${str.length}]` : str,
    charLength: str.length,
    byteLengthUtf8: buf.length,
    byteHexPreview: mask ? undefined : buf.subarray(0, Math.min(maxHexBytes, buf.length)).toString('hex'),
    byteHexTruncated: buf.length > maxHexBytes,
    hasLeadingTrailingSpace: str !== str.trim(),
    hasInternalWhitespace: /\s/.test(str.trim()) && label !== 'user_basket',
    invisibleCharCodes: [...new Set(invisible)],
    isAscii: [...str].every((c) => c.charCodeAt(0) < 128),
    jsonExact: label === 'user_basket' ? str : undefined,
  };
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

/** Direct API sepet — kuruş [["Ürün","12500","1"]] */
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

function formatDirectPaymentAmountDecimal(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error('PayTR payment_amount geçersiz');
  }
  return (Math.round(n * 100) / 100).toFixed(2);
}

function formatDirectPaymentAmountKurus(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error('PayTR payment_amount geçersiz');
  }
  return String(Math.round(n * 100));
}

function formatPaytrPaymentAmount(amount, amountMode = 'kurus') {
  return resolvePaytrAmountMode(amountMode) === 'kurus'
    ? formatDirectPaymentAmountKurus(amount)
    : formatDirectPaymentAmountDecimal(amount);
}

function formatDirectPaymentAmount(amount) {
  return formatDirectPaymentAmountKurus(amount);
}

function formatPaytrPaymentAmountKurus(amount) {
  return formatDirectPaymentAmountKurus(amount);
}

function paytrHashPart(value, fieldName) {
  if (value == null || value === '') {
    throw new Error(`PayTR hash için ${fieldName} gerekli`);
  }
  return String(value);
}

/** Resmi örnek: HMAC-SHA256(merchant_key, hashStr + merchant_salt) → base64 */
function createPaytrHmacToken(hashStr, merchantKey, merchantSalt) {
  const key = paytrHashPart(merchantKey, 'merchant_key');
  const salt = paytrHashPart(merchantSalt, 'merchant_salt');
  const message = String(hashStr) + String(salt);
  return crypto.createHmac('sha256', key).update(message, 'utf8').digest('base64');
}

function buildDirectPaytrHashInput({
  merchantId,
  merchantSalt,
  userIp,
  merchantOid,
  email,
  paymentAmount,
  paymentType,
  hashMode,
  installmentCount,
  currency,
  testMode,
  non3d,
}) {
  const mode = resolvePaytrHashMode(hashMode);
  const fieldOrder = buildDirectPaytrHashFieldOrder(mode);
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
  if (mode === 'official') {
    parts.payment_type = paytrHashPart(String(paymentType ?? OFFICIAL_PAYMENT_TYPE), 'payment_type');
    parts.installment_count = paytrHashPart(String(installmentCount), 'installment_count');
  }
  const hashStr = fieldOrder.map((key) => parts[key]).join('');
  const hashMessage = hashStr + paytrHashPart(String(merchantSalt), 'merchant_salt');
  return { parts, hashStr, hashMessage, fieldOrder, hashMode: mode };
}

function createDirectPaytrTokenHash(params) {
  const { hashStr } = buildDirectPaytrHashInput(params);
  return createPaytrHmacToken(hashStr, params.merchantKey, params.merchantSalt);
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

function escapeShellSingleQuoted(value) {
  return String(value).replace(/'/g, "'\\''");
}

function buildPaytrCurlCommand(fields, url = PAYTR_ODEME_URL) {
  const body = formatPaytrPostBody(fields);
  return `curl -sS -X POST '${url}' -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' --data-raw '${escapeShellSingleQuoted(body)}'`;
}

function analyzePaytrUrlEncoding(fields) {
  const safe = sanitizePaytrFields(fields);
  const encoded = formatPaytrPostBody(safe);
  const decoded = Object.fromEntries(new URLSearchParams(encoded));
  const watchKeys = [
    'paytr_token',
    'payment_amount',
    'user_basket',
    'merchant_oid',
    'email',
    'user_ip',
  ];
  const analysis = {};
  for (const key of watchKeys) {
    if (safe[key] == null) continue;
    const original = safe[key];
    const roundTrip = decoded[key];
    analysis[key] = {
      originalCharLength: original.length,
      originalByteLength: Buffer.from(original, 'utf8').length,
      encodedInBody: encoded.includes(`${key}=`),
      roundTripMatch: original === roundTrip,
      roundTripDecoded: key === 'paytr_token' ? roundTrip : roundTrip?.slice(0, 80),
    };
  }
  return { encodedBodyLength: encoded.length, fields: analysis };
}

function logPaytrOfficialByteDiff(context, hashDebug, formFields, config) {
  const hashPartTypes = {};
  for (const key of hashDebug.fieldOrder) {
    const val = hashDebug.parts[key];
    hashPartTypes[key] = {
      value: val,
      typeof: typeof val,
      isString: typeof val === 'string',
      charLength: val == null ? 0 : String(val).length,
      matchesOfficialType: val == null || typeof val === 'string',
    };
  }

  const formHashFieldParity = {
    payment_amount: {
      form: formFields.payment_amount,
      hash: hashDebug.parts.payment_amount,
      match: formFields.payment_amount === hashDebug.parts.payment_amount,
    },
    test_mode: {
      form: formFields.test_mode,
      hash: hashDebug.parts.test_mode,
      match: formFields.test_mode === hashDebug.parts.test_mode,
    },
    non_3d: {
      form: formFields.non_3d,
      hash: hashDebug.parts.non_3d,
      match: formFields.non_3d === hashDebug.parts.non_3d,
    },
    installment_count: {
      form: formFields.installment_count ?? '(missing)',
      hash: hashDebug.parts.installment_count ?? '(not in hash)',
      match:
        hashDebug.parts.installment_count == null ||
        formFields.installment_count === hashDebug.parts.installment_count,
    },
    currency: {
      form: formFields.currency,
      hash: hashDebug.parts.currency,
      match: formFields.currency === hashDebug.parts.currency,
    },
  };

  if (hashDebug.parts.payment_type != null) {
    formHashFieldParity.payment_type = {
      form: formFields.payment_type ?? '(missing)',
      hash: hashDebug.parts.payment_type,
      match: formFields.payment_type === hashDebug.parts.payment_type,
    };
  } else {
    formHashFieldParity.payment_type = {
      form: formFields.payment_type ?? '(missing)',
      hash: '(not in hash)',
      match: formFields.payment_type == null,
    };
  }

  const diff = {
    reference: OFFICIAL_DIRECT_API_REFERENCE.hmacFormula,
    hash_mode: config.hashMode,
    official_payment_type: OFFICIAL_PAYMENT_TYPE,
    hashFieldOrderMatch:
      JSON.stringify(hashDebug.fieldOrder) ===
      JSON.stringify(
        config.hashMode === 'official'
          ? OFFICIAL_DIRECT_API_REFERENCE.hashFieldOrder
          : OFFICIAL_DIRECT_API_REFERENCE.compactHashFieldOrder,
      ),
    hashFieldOrder: hashDebug.fieldOrder,
    hashPartTypes,
    hashFieldsNotInOfficialSample: OFFICIAL_DIRECT_API_REFERENCE.notInHash.filter(
      (f) => formFields[f] != null,
    ),
    formHashFieldParity,
    officialSampleVsOurs: {
      official_payment_amount: OFFICIAL_DIRECT_API_REFERENCE.officialSamplePaymentAmount,
      ours_payment_amount: formFields.payment_amount,
      official_basket_note: OFFICIAL_DIRECT_API_REFERENCE.officialSampleBasket,
      ours_user_basket: formFields.user_basket,
    },
    credentials: {
      merchant_id: config.merchantId,
      merchant_id_inspect: inspectPaytrString('merchant_id', config.merchantId),
      merchant_key_inspect: inspectPaytrString('merchant_key', config.merchantKey, { mask: true }),
      merchant_salt_inspect: inspectPaytrString('merchant_salt', config.merchantSalt, { mask: true }),
    },
    user_ip: formFields.user_ip,
    user_ip_inspect: inspectPaytrString('user_ip', formFields.user_ip),
    amount_mode: config.amountMode,
    basket_mode: config.basketMode,
    urlEncoding: analyzePaytrUrlEncoding(formFields),
  };

  console.log(`[paytr:${context}] official byte-level diff`, JSON.stringify(diff, null, 2));
}

function logPaytrHashBytes(context, hashDebug, config) {
  const hashStrInspect = inspectPaytrString('hashStr', hashDebug.hashStr);
  const hashMessageInspect = inspectPaytrString('hashMessage', hashDebug.hashMessage, {
    mask: config?.debugOn !== '1',
    maxHexBytes: config?.debugOn === '1' ? 512 : 64,
  });

  console.log(`[paytr:${context}] hash byte inspect hashStr`, JSON.stringify(hashStrInspect, null, 2));
  console.log(
    `[paytr:${context}] hash byte inspect hashMessage (hashStr+salt)`,
    JSON.stringify(hashMessageInspect, null, 2),
  );

  const partInspects = {};
  for (const key of hashDebug.fieldOrder) {
    partInspects[key] = inspectPaytrString(`hash.${key}`, hashDebug.parts[key]);
  }
  console.log(`[paytr:${context}] hash field byte inspects`, JSON.stringify(partInspects, null, 2));
}

function logPaytrPayload(context, fields, meta = {}) {
  const safe = sanitizePaytrFields(fields);
  if (safe.card_number) safe.card_number = `****${safe.card_number.slice(-4)}`;
  if (safe.cvv) safe.cvv = '***';

  if (meta.generatedToken) {
    console.log(`[paytr:${context}] generated paytr_token`, meta.generatedToken);
    console.log(
      `[paytr:${context}] generated paytr_token inspect`,
      JSON.stringify(inspectPaytrString('paytr_token', meta.generatedToken), null, 2),
    );
  }

  if (meta.amountDebug) {
    console.log(`[paytr:${context}] amount_mode`, meta.config?.amountMode ?? '(unknown)');
    console.log(`[paytr:${context}] basket_mode`, meta.config?.basketMode ?? meta.amountDebug.basketMode ?? '(unknown)');
    console.log(`[paytr:${context}] payment_amount raw`, meta.amountDebug.paymentAmountRaw);
    console.log(
      `[paytr:${context}] payment_amount hashed`,
      meta.hashDebug?.parts?.payment_amount ?? '(hash not built yet)',
    );
    console.log(`[paytr:${context}] user_basket raw exact`, meta.amountDebug.userBasketRaw);
    console.log(
      `[paytr:${context}] user_basket byte inspect`,
      JSON.stringify(inspectPaytrString('user_basket', meta.amountDebug.userBasketRaw), null, 2),
    );
  }

  if (meta.userIpDebug) {
    console.log(`[paytr:${context}] user_ip resolved`, meta.userIpDebug.resolved ?? '(empty)');
    console.log(`[paytr:${context}] user_ip debug`, JSON.stringify(meta.userIpDebug, null, 2));
  }

  if (meta.hashDebug) {
    logPaytrHashBytes(context, meta.hashDebug, meta.config);
    console.log(`[paytr:${context}] final hash string exact`, meta.hashDebug.hashMessage);
    console.log(`[paytr:${context}] hashStr without salt`, meta.hashDebug.hashStr);
    console.log(`[paytr:${context}] hash parts`, JSON.stringify(meta.hashDebug.parts, null, 2));
    if (meta.config) {
      logPaytrOfficialByteDiff(context, meta.hashDebug, safe, meta.config);
    }
  }

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

  const encodedBody = formatPaytrPostBody(safe);
  const curlBody = buildPaytrCurlCommand(safe);
  console.log(`[paytr:${context}] hash_mode`, meta.config?.hashMode ?? '(unknown)');
  console.log(`[paytr:${context}] final form body exact`, encodedBody);
  console.log(`[paytr:${context}] final curl body exact`, curlBody);
  console.log(
    `[paytr:${context}] url encoding analysis`,
    JSON.stringify(analyzePaytrUrlEncoding(safe), null, 2),
  );
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
  const skippedIpv6 = [];
  const candidates = [
    ['x-nf-client-connection-ip', headers['x-nf-client-connection-ip']],
    ['client-ip', headers['client-ip']],
    ['cf-connecting-ip', headers['cf-connecting-ip']],
    ['true-client-ip', headers['true-client-ip']],
    ['x-real-ip', headers['x-real-ip']],
    ['x-forwarded-for', headers['x-forwarded-for']],
  ];

  for (const [source, value] of candidates) {
    if (!value) continue;
    const ipv4 = extractIpv4FromHeaderValue(value);
    if (ipv4) {
      return { ip: ipv4, source, skippedIpv6 };
    }
    const first = String(value).split(',')[0].trim();
    if (isIpv6(first)) {
      skippedIpv6.push({ source, value: first });
    }
  }
  return { ip: '', source: '', skippedIpv6 };
}

function resolvePaytrUserIpDetailed(event, body = {}) {
  const headerResult = resolveClientIp(event);
  if (headerResult.ip) {
    return {
      ip: headerResult.ip,
      debug: {
        resolved: headerResult.ip,
        source: headerResult.source,
        skippedIpv6: headerResult.skippedIpv6,
        fromBody: false,
      },
    };
  }

  const fromBody = String(body.userIp || body.user_ip || '').trim();
  if (isIpv4(fromBody)) {
    return {
      ip: fromBody,
      debug: {
        resolved: fromBody,
        source: 'body',
        skippedIpv6: headerResult.skippedIpv6,
        fromBody: true,
      },
    };
  }

  if (isIpv6(fromBody)) {
    headerResult.skippedIpv6.push({ source: 'body', value: fromBody });
  }

  return {
    ip: '',
    debug: {
      resolved: '',
      source: '',
      skippedIpv6: headerResult.skippedIpv6,
      fromBody: Boolean(fromBody),
      bodyRejected: fromBody || undefined,
    },
  };
}

function resolvePaytrUserIp(event, body = {}) {
  return resolvePaytrUserIpDetailed(event, body).ip;
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
  PAYTR_ODEME_URL,
  OFFICIAL_DIRECT_API_REFERENCE,
  OFFICIAL_PAYMENT_TYPE,
  getPaytrConfig,
  sanitizePaytrCredential,
  resolvePaytrAmountMode,
  resolvePaytrBasketMode,
  resolvePaytrHashMode,
  buildDirectPaytrHashFieldOrder,
  inspectPaytrString,
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
  buildPaytrCurlCommand,
  analyzePaytrUrlEncoding,
  logPaytrPayload,
  verifyCallbackHash,
  resolveClientIp,
  resolvePaytrUserIp,
  resolvePaytrUserIpDetailed,
  siteBaseUrl,
  parseFormBody,
  parsePaytrCallbackBody,
  parseEventFormBody,
  paytrOkResponse,
};
