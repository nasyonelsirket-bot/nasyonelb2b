/**
 * PayTR iFrame API — https://dev.paytr.com/iframe-api/iframe-api-1-adim
 *
 * POST https://www.paytr.com/odeme/api/get-token
 * Hash: merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket
 *       + no_installment + max_installment + currency + test_mode + merchant_salt
 */
const crypto = require('crypto');
const { analyzePaytrAmount } = require('./paytrHelpers.cjs');
const { shouldWritePaytrDebugFiles, writePaytrDebugTxtFiles } = require('./paytrDebugFiles.cjs');

const PAYTR_IFRAME_GET_TOKEN_URL = 'https://www.paytr.com/odeme/api/get-token';
const PAYTR_IFRAME_SECURE_BASE = 'https://www.paytr.com/odeme/guvenli';

const IFRAME_HASH_FIELD_ORDER = [
  'merchant_id',
  'user_ip',
  'merchant_oid',
  'email',
  'payment_amount',
  'user_basket',
  'no_installment',
  'max_installment',
  'currency',
  'test_mode',
];

function hashPart(value, fieldName) {
  if (value == null || value === '') {
    throw new Error(`PayTR iFrame hash için ${fieldName} gerekli`);
  }
  return String(value);
}

/**
 * Resmi iFrame sepet formatı — [["Ürün","750.00","1"]]
 * Fiyat: ondalık string (2 hane), adet: string.
 */
function buildIframeUserBasketJson(items, orderTotalTl) {
  const lines = (Array.isArray(items) ? items : []).map((item) => {
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const unitPrice = (Math.round(Number(item.price || 0) * 100) / 100).toFixed(2);
    return [String(item.name || 'Ürün').slice(0, 200), unitPrice, String(qty)];
  });

  if (orderTotalTl != null && Number.isFinite(Number(orderTotalTl))) {
    let sum = lines.reduce((acc, [, price, qty]) => acc + Number(price) * Number(qty), 0);
    sum = Math.round(sum * 100) / 100;
    const target = Math.round(Number(orderTotalTl) * 100) / 100;
    const diff = Math.round((target - sum) * 100) / 100;
    if (Math.abs(diff) >= 0.01) {
      lines.push([diff > 0 ? 'Kargo / ek' : 'İndirim', Math.abs(diff).toFixed(2), '1']);
    }
  }

  return JSON.stringify(lines);
}

/** iFrame API — sepet base64(JSON) */
function buildIframeUserBasket(items, orderTotalTl) {
  const json = buildIframeUserBasketJson(items, orderTotalTl);
  return Buffer.from(json, 'utf8').toString('base64');
}

function buildIframeHashInput({
  merchantId,
  merchantSalt,
  userIp,
  merchantOid,
  email,
  paymentAmount,
  userBasketB64,
  noInstallment,
  maxInstallment,
  currency,
  testMode,
}) {
  const parts = {
    merchant_id: hashPart(merchantId, 'merchant_id'),
    user_ip: hashPart(userIp, 'user_ip'),
    merchant_oid: hashPart(merchantOid, 'merchant_oid'),
    email: hashPart(email, 'email'),
    payment_amount: hashPart(paymentAmount, 'payment_amount'),
    user_basket: hashPart(userBasketB64, 'user_basket'),
    no_installment: hashPart(noInstallment, 'no_installment'),
    max_installment: hashPart(maxInstallment, 'max_installment'),
    currency: hashPart(currency, 'currency'),
    test_mode: hashPart(testMode, 'test_mode'),
  };
  const hashStr = IFRAME_HASH_FIELD_ORDER.map((key) => parts[key]).join('');
  const hashMessage = hashStr + hashPart(merchantSalt, 'merchant_salt');
  return { parts, hashStr, hashMessage, fieldOrder: IFRAME_HASH_FIELD_ORDER };
}

function createIframePaytrToken(hashStr, merchantKey, merchantSalt) {
  const message = String(hashStr) + String(merchantSalt);
  return crypto.createHmac('sha256', merchantKey).update(message, 'utf8').digest('base64');
}

function buildIframeGetTokenPayload({
  config,
  base,
  orderId,
  merchantOid,
  email,
  orderTotal,
  items,
  customer,
  userIp,
}) {
  const amountAnalysis = analyzePaytrAmount(orderTotal, 'kurus');
  const paymentAmount = String(amountAnalysis.parsedKurusAmount);
  const userBasketB64 = buildIframeUserBasket(items, amountAnalysis.parsedTlAmount);
  const noInstallment = String(config.noInstallment ?? '0');
  const maxInstallment = String(config.maxInstallment ?? '0');
  const currency = String(config.currency || 'TL');
  const testMode = config.testMode === '1' ? '1' : '0';

  const hashDebug = buildIframeHashInput({
    merchantId: config.merchantId,
    merchantSalt: config.merchantSalt,
    userIp: String(userIp),
    merchantOid: String(merchantOid),
    email: String(email),
    paymentAmount,
    userBasketB64,
    noInstallment,
    maxInstallment,
    currency,
    testMode,
  });

  const paytrToken = createIframePaytrToken(hashDebug.hashStr, config.merchantKey, config.merchantSalt);

  const customerName = String(customer?.name || '').trim();
  const userName = customerName.slice(0, 60);
  const userAddress = [customer?.address, customer?.district, customer?.city]
    .filter(Boolean)
    .join(', ')
    .slice(0, 400);
  const userPhone = String(customer?.phone || '').replace(/\D/g, '').slice(0, 20);

  const body = {
    merchant_id: config.merchantId,
    user_ip: String(userIp),
    merchant_oid: String(merchantOid),
    email: String(email),
    payment_amount: paymentAmount,
    paytr_token: paytrToken,
    user_basket: userBasketB64,
    debug_on: config.debugOn,
    no_installment: noInstallment,
    max_installment: maxInstallment,
    user_name: userName,
    user_address: userAddress || '-',
    user_phone: userPhone,
    merchant_ok_url: `${base}/api/paytr/return-ok?oid=${orderId}`,
    merchant_fail_url: `${base}/api/paytr/return-fail?oid=${orderId}`,
    timeout_limit: String(config.timeoutLimit ?? '30'),
    currency,
    test_mode: testMode,
    lang: String(config.iframeLang ?? 'tr'),
  };

  return {
    body,
    hashDebug,
    paytrToken,
    paymentAmount,
    userBasketB64,
    userBasketJson: buildIframeUserBasketJson(items, amountAnalysis.parsedTlAmount),
    amountAnalysis,
  };
}

function formatIframePostBody(body) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(body)) {
    if (value == null || value === '') continue;
    params.append(key, String(value));
  }
  return params.toString();
}

function logIframeTokenFlow(context, payload, meta = {}) {
  const { body, hashDebug, paytrToken, amountAnalysis } = payload;
  const postBody = formatIframePostBody(body);

  console.log(`[paytr:${context}] iframe mode get-token`);
  console.log(`[paytr:${context}] user_ip exact`, body.user_ip);
  console.log(`[paytr:${context}] merchant_oid exact`, body.merchant_oid);
  console.log(`[paytr:${context}] user_basket raw exact`, payload.userBasketJson);
  console.log(`[paytr:${context}] user_basket base64 exact`, body.user_basket);
  console.log(`[paytr:${context}] final hash string exact`, hashDebug.hashMessage);
  console.log(`[paytr:${context}] hash string (without salt)`, hashDebug.hashStr);
  console.log(
    `[paytr:${context}] hash segment payment_amount exact`,
    hashDebug.parts.payment_amount,
  );
  console.log(`[paytr:${context}] parsed TL amount`, amountAnalysis.parsedTlAmount);
  console.log(`[paytr:${context}] parsed kurus amount`, amountAnalysis.parsedKurusAmount);
  console.log(`[paytr:${context}] payment_amount sent`, body.payment_amount);
  console.log(
    `[paytr:${context}] double conversion probe`,
    JSON.stringify(amountAnalysis.doubleConversionProbe, null, 2),
  );
  console.log(`[paytr:${context}] iframe paytr_token (hash)`, paytrToken);
  console.log(`[paytr:${context}] iframe token request body`, postBody);

  if (meta.userIpDebug) {
    console.log(`[paytr:${context}] user_ip debug`, JSON.stringify(meta.userIpDebug, null, 2));
  }

  if (shouldWritePaytrDebugFiles()) {
    try {
      writePaytrDebugTxtFiles({
        slug: String(context).replace(/[^a-zA-Z0-9:_-]/g, '_'),
        hashMessage: hashDebug.hashMessage,
        token: paytrToken,
        formBody: postBody,
        curlCommand: `curl -sS -X POST '${PAYTR_IFRAME_GET_TOKEN_URL}' -H 'Content-Type: application/x-www-form-urlencoded' --data-raw '${postBody.replace(/'/g, "'\\''")}'`,
        extra: { mode: 'iframe', hashFieldOrder: hashDebug.fieldOrder },
      });
    } catch (err) {
      console.error(`[paytr:${context}] debug txt write failed`, err.message);
    }
  }

  return postBody;
}

async function requestPaytrIframeToken(payload, context = 'iframe') {
  const postBody = logIframeTokenFlow(context, payload, payload.meta || {});

  const response = await fetch(PAYTR_IFRAME_GET_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: postBody,
  });

  const rawText = await response.text();
  let json = {};
  try {
    json = JSON.parse(rawText);
  } catch {
    json = { status: 'failed', reason: rawText.slice(0, 200) || 'Geçersiz JSON yanıt' };
  }

  console.log(`[paytr:${context}] iframe token response HTTP status`, response.status);
  console.log(`[paytr:${context}] iframe token response FULL RAW`, rawText);

  if (json.status === 'failed') {
    console.error(`[paytr:${context}] PayTR status=failed reason`, json.reason || json.err_msg || rawText);
  }

  if (json.status !== 'success' || !json.token) {
    const reason = json.reason || json.err_msg || rawText.slice(0, 500) || 'PayTR iFrame token alınamadı';
    const err = new Error(reason);
    err.paytr = json;
    err.paytrRaw = rawText;
    err.httpStatus = response.status;
    err.paytrStatus = json.status || 'unknown';
    throw err;
  }

  const iframeToken = String(json.token);
  const iframeUrl = `${PAYTR_IFRAME_SECURE_BASE}/${iframeToken}`;
  console.log(`[paytr:${context}] iframe token success`, iframeToken);
  console.log(`[paytr:${context}] iframe url`, iframeUrl);

  return {
    iframeToken,
    iframeUrl,
    paytrResponse: json,
  };
}

async function createPaytrIframeCheckout(params) {
  const payload = buildIframeGetTokenPayload(params);
  payload.meta = { userIpDebug: params.userIpDebug };
  const tokenResult = await requestPaytrIframeToken(payload, params.context || `iframe:${params.orderId}`);
  return {
    ...tokenResult,
    paymentAmount: payload.paymentAmount,
    hashDebug: payload.hashDebug,
    amountAnalysis: payload.amountAnalysis,
  };
}

module.exports = {
  PAYTR_IFRAME_GET_TOKEN_URL,
  PAYTR_IFRAME_SECURE_BASE,
  IFRAME_HASH_FIELD_ORDER,
  buildIframeUserBasketJson,
  buildIframeUserBasket,
  buildIframeHashInput,
  createIframePaytrToken,
  buildIframeGetTokenPayload,
  formatIframePostBody,
  logIframeTokenFlow,
  requestPaytrIframeToken,
  createPaytrIframeCheckout,
};
