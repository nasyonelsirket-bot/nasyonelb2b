const crypto = require('crypto');
const { resolveCanonicalSiteUrl } = require('./canonicalSiteUrl.cjs');
const {
  buildPaytrMatrixHashInput,
  resolvePaymentTypeVariant,
  resolveInstallmentInHash,
  applyPaymentTypeToFormFields,
} = require('./paytrHashMatrix.cjs');
const { shouldWritePaytrDebugFiles, writePaytrDebugTxtFiles } = require('./paytrDebugFiles.cjs');

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
  notInHash: ['lang', 'no_installment', 'max_installment', 'client_lang', 'user_basket'],
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
  const paymentTypeVariant = resolvePaymentTypeVariant();
  const installmentInHash = resolveInstallmentInHash(undefined, hashMode);

  const noInstallment = String(process.env.PAYTR_NO_INSTALLMENT ?? '0').trim() === '1' ? '1' : '0';
  const maxInstallment = String(process.env.PAYTR_MAX_INSTALLMENT ?? '0').trim();
  const timeoutLimit = String(process.env.PAYTR_TIMEOUT_LIMIT ?? '30').trim();
  const iframeLang = String(process.env.PAYTR_LANG ?? 'tr').trim() || 'tr';

  return {
    merchantId,
    merchantKey,
    merchantSalt,
    testMode,
    debugOn,
    amountMode,
    basketMode,
    hashMode,
    paymentTypeVariant,
    installmentInHash,
    currency: sanitizePaytrCredential(process.env.PAYTR_CURRENCY || 'TL', 'PAYTR_CURRENCY'),
    noInstallment,
    maxInstallment,
    timeoutLimit,
    iframeLang,
  };
}

/** official (varsayılan) — docs hash sırası | compact — kısaltılmış hash */
function resolvePaytrHashMode(mode) {
  const raw = String(mode ?? process.env.PAYTR_HASH_MODE ?? 'official').trim().toLowerCase();
  return raw === 'compact' ? 'compact' : 'official';
}

/** @deprecated resolvePaymentTypeVariant kullanın */
function resolvePaytrPaymentTypeHash(hashMode) {
  const variant = resolvePaymentTypeVariant();
  if (variant === 'card') return 'card';
  if (variant === 'omit') return undefined;
  return '';
}

function buildDirectPaytrHashFieldOrder(hashMode = 'official', variants = {}) {
  const { buildMatrixHashFieldOrder } = require('./paytrHashMatrix.cjs');
  if (resolvePaytrHashMode(hashMode) === 'compact') {
    return buildMatrixHashFieldOrder({ paymentTypeVariant: 'omit', installmentInHash: false });
  }
  return buildMatrixHashFieldOrder({
    paymentTypeVariant: variants.paymentTypeVariant ?? resolvePaymentTypeVariant(),
    installmentInHash: variants.installmentInHash ?? resolveInstallmentInHash(undefined, hashMode),
  });
}

function resolvePaytrAmountMode(mode) {
  const raw = String(mode ?? process.env.PAYTR_AMOUNT_MODE ?? 'kurus').trim().toLowerCase();
  return raw === 'decimal' ? 'decimal' : 'kurus';
}

function resolvePaytrBasketMode(mode) {
  const raw = String(mode ?? process.env.PAYTR_BASKET_MODE ?? 'decimal').trim().toLowerCase();
  return raw === 'kurus' ? 'kurus' : 'decimal';
}

const PAYTR_ORDER_ID_HEX_LEN = 20;

function isIpv4(ip) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(String(ip || '').trim());
}

function isIpv6(ip) {
  return String(ip || '').includes(':');
}

/** ::ffff:192.168.1.1 gibi mapped IPv6 → IPv4 */
function extractIpv4FromMapped(value) {
  const ip = String(value || '').trim();
  if (isIpv4(ip)) return ip;
  const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped && isIpv4(mapped[1])) return mapped[1];
  return '';
}

function extractIpv4FromHeaderValue(value) {
  if (!value) return '';
  for (const segment of String(value).split(',')) {
    const ipv4 = extractIpv4FromMapped(segment.trim());
    if (ipv4) return ipv4;
  }
  return '';
}

/** Her get-token isteğinde benzersiz merchant_oid (PayTR zorunlu) */
function mintPaytrMerchantOid(orderId) {
  const id = String(orderId || '')
    .replace(/[^a-f0-9]/gi, '')
    .slice(0, PAYTR_ORDER_ID_HEX_LEN);
  const suffix = crypto.randomBytes(4).toString('hex');
  return `NT${id}${suffix}`.slice(0, 64);
}

/** Callback merchant_oid → dahili order id (20 hex) */
function parseOrderIdFromMerchantOid(merchantOid) {
  const stripped = String(merchantOid || '').replace(/^NT/i, '');
  return stripped.slice(0, PAYTR_ORDER_ID_HEX_LEN);
}

async function fetchPublicIpv4() {
  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return '';
    const data = await response.json();
    const ip = String(data?.ip || '').trim();
    return isIpv4(ip) ? ip : '';
  } catch {
    return '';
  }
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
  return analyzePaytrAmount(amount, 'decimal').paymentAmountDecimal;
}

function formatDirectPaymentAmountKurus(amount) {
  return analyzePaytrAmount(amount, 'kurus').paymentAmountKurus;
}

/** PAYTR_AMOUNT_INPUT=tl (varsayılan) | kurus — ham girdi birimi */
function resolvePaytrAmountInputUnit(explicit) {
  const raw = String(explicit ?? process.env.PAYTR_AMOUNT_INPUT ?? 'tl').trim().toLowerCase();
  return raw === 'kurus' ? 'kurus' : 'tl';
}

/**
 * orderTotal → TL + kuruş normalize. Tek *100 (TL→kuruş); çift çarpım probe loglanır.
 * 125 TL → parsedKurusAmount 12500, paymentAmountSent "12500"
 */
function analyzePaytrAmount(amount, amountMode = 'kurus') {
  const rawInput = amount;
  const str = String(amount ?? '').trim().replace(',', '.');
  const n = Number(str);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error('PayTR payment_amount geçersiz');
  }

  const inputUnit = resolvePaytrAmountInputUnit();
  const hasFraction = str.includes('.');

  let parsedTl;
  let inputInterpretation;

  if (inputUnit === 'kurus' && !hasFraction) {
    parsedTl = Math.round(n) / 100;
    inputInterpretation = 'kurus_integer';
  } else if (hasFraction) {
    parsedTl = Math.round(n * 100) / 100;
    inputInterpretation = 'tl_decimal';
  } else {
    parsedTl = Math.round(n * 100) / 100;
    inputInterpretation = 'tl_integer';
  }

  parsedTl = Math.round(parsedTl * 100) / 100;
  const parsedKurus = Math.round(parsedTl * 100);
  const paymentAmountKurus = String(parsedKurus);
  const paymentAmountDecimal = parsedTl.toFixed(2);
  const mode = resolvePaytrAmountMode(amountMode);
  const paymentAmountSent = mode === 'kurus' ? paymentAmountKurus : paymentAmountDecimal;

  const multiplyOnce = Math.round(n * 100);
  const multiplyTwice = Math.round(multiplyOnce * 100);

  const doubleConversionProbe = {
    raw_number: n,
    input_unit: inputUnit,
    input_interpretation: inputInterpretation,
    multiply_100_once_on_raw: multiplyOnce,
    multiply_100_twice_on_raw: multiplyTwice,
    correct_kurus_from_normalized_tl: parsedKurus,
    wrong_if_raw_already_kurus: String(multiplyOnce),
    payment_amount_sent: paymentAmountSent,
    suspected_double_x100:
      inputUnit === 'tl' &&
      !hasFraction &&
      multiplyOnce !== parsedKurus &&
      multiplyTwice === Math.round(Number(paymentAmountSent) * 100),
    looks_like_125000_bug:
      multiplyOnce === 125000 && parsedKurus === 12500,
    hash_should_be_exact: paymentAmountKurus,
  };

  return {
    rawInput,
    inputInterpretation,
    inputUnit,
    parsedTlAmount: parsedTl,
    parsedKurusAmount: parsedKurus,
    paymentAmountKurus,
    paymentAmountDecimal,
    paymentAmountSent,
    paymentAmountRaw: paymentAmountSent,
    doubleConversionProbe,
  };
}

function formatPaytrPaymentAmount(amount, amountMode = 'kurus') {
  return analyzePaytrAmount(amount, amountMode).paymentAmountSent;
}

function formatDirectPaymentAmount(amount) {
  return formatDirectPaymentAmountKurus(amount);
}

function formatPaytrPaymentAmountKurus(amount) {
  return formatDirectPaymentAmountKurus(amount);
}

function paytrHashPart(value, fieldName, options = {}) {
  const { allowEmpty = false } = options;
  if (value == null || (value === '' && !allowEmpty)) {
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
  merchantKey,
  merchantSalt,
  userIp,
  merchantOid,
  email,
  paymentAmount,
  paymentType,
  paymentTypeVariant,
  hashMode,
  installmentCount,
  installmentInHash,
  currency,
  testMode,
  non3d,
}) {
  const mode = resolvePaytrHashMode(hashMode);
  const variant =
    paymentTypeVariant ??
    (paymentType === 'card' ? 'card' : paymentType === '' ? 'empty' : resolvePaymentTypeVariant());

  const matrixResult = buildPaytrMatrixHashInput({
    merchantId,
    merchantKey,
    merchantSalt,
    userIp,
    merchantOid,
    email,
    paymentAmount,
    installmentCount,
    currency,
    testMode,
    non3d,
    paymentTypeVariant: mode === 'compact' ? 'omit' : variant,
    installmentInHash: mode === 'compact' ? false : installmentInHash,
    hashMode: mode,
  });

  return {
    parts: matrixResult.parts,
    hashStr: matrixResult.hashStr,
    hashMessage: matrixResult.hashMessage,
    fieldOrder: matrixResult.fieldOrder,
    hashMode: mode,
    paytrToken: matrixResult.paytrToken,
    paymentTypeVariant: matrixResult.paymentTypeVariant,
    installmentInHash: matrixResult.installmentInHash,
  };
}

function createDirectPaytrTokenHash(params) {
  const result = buildDirectPaytrHashInput(params);
  return result.paytrToken;
}

function sanitizePaytrFields(fields, options = {}) {
  const { keepEmptyKeys = ['payment_type'] } = options;
  const out = {};
  for (const [key, value] of Object.entries(fields || {})) {
    if (value == null) continue;
    if (value === '' && !keepEmptyKeys.includes(key)) continue;
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

  if (hashDebug.parts.payment_type != null || hashDebug.hashMode === 'official') {
    formHashFieldParity.payment_type = {
      form: formFields.payment_type ?? '(missing)',
      hash: hashDebug.parts.payment_type ?? '',
      match:
        (formFields.payment_type ?? '') === (hashDebug.parts.payment_type ?? ''),
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
  console.log(
    `[paytr:${context}] hash segment payment_amount exact`,
    hashDebug.parts.payment_amount ?? '(missing)',
  );
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
    console.log(`[paytr:${context}] order_total raw`, meta.amountDebug.rawInput ?? meta.amountDebug.orderTotalRaw ?? '(unknown)');
    console.log(`[paytr:${context}] parsed TL amount`, meta.amountDebug.parsedTlAmount ?? '(unknown)');
    console.log(`[paytr:${context}] parsed kurus amount`, meta.amountDebug.parsedKurusAmount ?? '(unknown)');
    console.log(`[paytr:${context}] payment_amount sent`, meta.amountDebug.paymentAmountSent ?? meta.amountDebug.paymentAmountRaw ?? '(unknown)');
    console.log(
      `[paytr:${context}] hash segment payment_amount exact`,
      meta.hashDebug?.parts?.payment_amount ?? '(hash not built yet)',
    );
    console.log(
      `[paytr:${context}] double conversion probe`,
      JSON.stringify(meta.amountDebug.doubleConversionProbe ?? {}, null, 2),
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
    console.log(
      `[paytr:${context}] payment_type hash exact`,
      JSON.stringify(meta.hashDebug.parts.payment_type ?? ''),
    );
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
  console.log(
    `[paytr:${context}] payment_type_variant`,
    meta.config?.paymentTypeVariant ?? meta.hashDebug?.paymentTypeVariant ?? '(unknown)',
  );
  console.log(
    `[paytr:${context}] installment_in_hash`,
    String(meta.config?.installmentInHash ?? meta.hashDebug?.installmentInHash ?? '(unknown)'),
  );
  console.log(`[paytr:${context}] final form body exact`, encodedBody);
  console.log(`[paytr:${context}] final curl body exact`, curlBody);
  console.log(
    `[paytr:${context}] url encoding analysis`,
    JSON.stringify(analyzePaytrUrlEncoding(safe), null, 2),
  );

  if (shouldWritePaytrDebugFiles() && meta.generatedToken && meta.hashDebug?.hashMessage) {
    try {
      const written = writePaytrDebugTxtFiles({
        slug: String(context).replace(/[^a-zA-Z0-9:_-]/g, '_'),
        hashMessage: meta.hashDebug.hashMessage,
        token: meta.generatedToken,
        formBody: encodedBody,
        curlCommand: curlBody,
        extra: {
          context,
          hash_mode: meta.config?.hashMode,
          payment_type_variant: meta.config?.paymentTypeVariant,
          installment_in_hash: meta.config?.installmentInHash,
          field_order: meta.hashDebug.fieldOrder,
        },
      });
      console.log(`[paytr:${context}] debug txt written`, written.dir, written.base);
    } catch (err) {
      console.error(`[paytr:${context}] debug txt write failed`, err.message);
    }
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
  const mapped = extractIpv4FromMapped(first);
    if (mapped) {
      return { ip: mapped, source: `${source}:mapped`, skippedIpv6 };
    }
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

  const fromBodyRaw = String(body.userIp || body.user_ip || '').trim();
  const fromBody = extractIpv4FromMapped(fromBodyRaw) || (isIpv4(fromBodyRaw) ? fromBodyRaw : '');
  if (fromBody) {
    return {
      ip: fromBody,
      debug: {
        resolved: fromBody,
        source: 'body',
        skippedIpv6: headerResult.skippedIpv6,
        fromBody: true,
        bodyRaw: fromBodyRaw !== fromBody ? fromBodyRaw : undefined,
      },
    };
  }

  if (isIpv6(fromBodyRaw)) {
    headerResult.skippedIpv6.push({ source: 'body', value: fromBodyRaw });
  }

  return {
    ip: '',
    debug: {
      resolved: '',
      source: '',
      skippedIpv6: headerResult.skippedIpv6,
      fromBody: Boolean(fromBodyRaw),
      bodyRejected: fromBodyRaw || undefined,
    },
  };
}

/** IPv6-only ortamda api.ipify.org ile IPv4 fallback */
async function resolvePaytrUserIpDetailedAsync(event, body = {}) {
  const sync = resolvePaytrUserIpDetailed(event, body);
  if (sync.ip) return sync;

  const publicIp = await fetchPublicIpv4();
  if (publicIp) {
    return {
      ip: publicIp,
      debug: {
        ...sync.debug,
        resolved: publicIp,
        source: 'api.ipify.org',
        fromBody: false,
        ipv4Fallback: true,
      },
    };
  }

  return sync;
}

function resolvePaytrUserIp(event, body = {}) {
  return resolvePaytrUserIpDetailed(event, body).ip;
}

function siteBaseUrl(event) {
  const host = event?.headers?.['x-forwarded-host'] || event?.headers?.host || '';
  const proto = event?.headers?.['x-forwarded-proto'] || 'https';
  const fromRequest = host ? `${proto}://${host}` : '';
  return resolveCanonicalSiteUrl(
    process.env.SITE_URL,
    process.env.VITE_SITE_URL,
    process.env.URL,
    fromRequest,
  );
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
  resolvePaytrAmountInputUnit,
  analyzePaytrAmount,
  resolvePaytrBasketMode,
  resolvePaytrHashMode,
  resolvePaytrPaymentTypeHash,
  resolvePaymentTypeVariant,
  resolveInstallmentInHash,
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
  applyPaymentTypeToFormFields,
  verifyCallbackHash,
  resolveClientIp,
  resolvePaytrUserIp,
  resolvePaytrUserIpDetailed,
  resolvePaytrUserIpDetailedAsync,
  fetchPublicIpv4,
  mintPaytrMerchantOid,
  parseOrderIdFromMerchantOid,
  PAYTR_ORDER_ID_HEX_LEN,
  siteBaseUrl,
  parseFormBody,
  parsePaytrCallbackBody,
  parseEventFormBody,
  paytrOkResponse,
};
