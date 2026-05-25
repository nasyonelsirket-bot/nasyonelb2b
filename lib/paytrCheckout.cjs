/**
 * PayTR Direct API — https://dev.paytr.com/direkt-api/direkt-api-1-adim
 *
 * POST: https://www.paytr.com/odeme
 *
 * paytr_token (HMAC-SHA256 + base64), hash string sırası (official):
 *   merchant_id + user_ip + merchant_oid + email + payment_amount
 *   + payment_type + installment_count + currency + test_mode + non_3d + merchant_salt
 *
 * PAYTR_AMOUNT_MODE=kurus (varsayılan) | decimal — payment_amount hash+form
 * PAYTR_BASKET_MODE=decimal (varsayılan) | kurus — user_basket fiyat formatı
 * PAYTR_PAYMENT_TYPE_MODE=omit (varsayılan) | form_only | official
 * PAYTR_MINIMAL_PAYLOAD=1 (varsayılan) — lang/no_installment/max_installment yerine resmi client_lang
 */
const {
  getPaytrConfig,
  buildDirectUserBasket,
  formatPaytrPaymentAmount,
  createDirectPaytrTokenHash,
  buildDirectPaytrHashInput,
  sanitizePaytrFields,
  logPaytrPayload,
  resolvePaytrUserIp,
  resolvePaytrUserIpDetailed,
  siteBaseUrl,
} = require('./paytrHelpers.cjs');

const PAYTR_ODEME_URL = 'https://www.paytr.com/odeme';

function buildPaytrOdemeForm({
  config,
  base,
  orderId,
  merchantOid,
  email,
  orderTotal,
  items,
  customer,
  userIp,
  userIpDebug,
}) {
  const paymentAmount = formatPaytrPaymentAmount(orderTotal, config.amountMode);
  const userBasket = buildDirectUserBasket(items, orderTotal, config.basketMode);
  const paymentType = 'card';
  const installmentCount = '0';
  const non3d = '0';
  const currency = 'TL';
  const testMode = config.testMode === '1' ? '1' : '0';

  const hashDebug = buildDirectPaytrHashInput({
    merchantId: config.merchantId,
    merchantSalt: config.merchantSalt,
    userIp: String(userIp),
    merchantOid: String(merchantOid),
    email: String(email),
    paymentAmount,
    paymentType,
    paymentTypeMode: config.paymentTypeMode,
    installmentCount,
    currency,
    testMode,
    non3d,
  });

  const paytrToken = createDirectPaytrTokenHash({
    merchantId: config.merchantId,
    merchantKey: config.merchantKey,
    merchantSalt: config.merchantSalt,
    userIp: String(userIp),
    merchantOid: String(merchantOid),
    email: String(email),
    paymentAmount,
    paymentType,
    paymentTypeMode: config.paymentTypeMode,
    installmentCount,
    currency,
    testMode,
    non3d,
  });

  const customerName = String(customer?.name || '').trim();
  const userName = customerName.slice(0, 60);
  const userAddress = [customer?.address, customer?.district, customer?.city]
    .filter(Boolean)
    .join(', ')
    .slice(0, 400);
  const userPhone = String(customer?.phone || '').replace(/\D/g, '').slice(0, 20);

  const rawFields = {
    merchant_id: config.merchantId,
    paytr_token: paytrToken,
    user_ip: userIp,
    merchant_oid: merchantOid,
    email,
    payment_amount: paymentAmount,
    installment_count: installmentCount,
    currency,
    test_mode: testMode,
    non_3d: non3d,
    merchant_ok_url: `${base}/api/paytr/return-ok?oid=${orderId}`,
    merchant_fail_url: `${base}/api/paytr/return-fail?oid=${orderId}`,
    user_name: userName,
    user_address: userAddress || '-',
    user_phone: userPhone,
    user_basket: userBasket,
    debug_on: config.debugOn,
    non3d_test_failed: '0',
  };

  if (config.paymentTypeMode === 'official' || config.paymentTypeMode === 'form_only') {
    rawFields.payment_type = paymentType;
  }

  if (config.minimalPayload) {
    rawFields.client_lang = 'tr';
  } else {
    rawFields.lang = 'tr';
    rawFields.no_installment = '0';
    rawFields.max_installment = '0';
  }

  const fields = sanitizePaytrFields(rawFields);

  logPaytrPayload(`checkout:${orderId}`, fields, {
    hashDebug,
    config,
    generatedToken: paytrToken,
    userIpDebug: userIpDebug || { resolved: String(userIp) },
    amountDebug: {
      paymentAmountRaw: paymentAmount,
      userBasketRaw: userBasket,
      basketMode: config.basketMode,
    },
  });

  return fields;
}

function encodePaytrBody(fields) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sanitizePaytrFields(fields))) {
    params.append(key, value);
  }
  return params;
}

function parseCheckoutRequestBody(event) {
  let raw = event?.body || '';
  if (event?.isBase64Encoded && raw) {
    raw = Buffer.from(raw, 'base64').toString('utf8');
  }
  const contentType = String(event?.headers?.['content-type'] || event?.headers?.['Content-Type'] || '');
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(raw || '{}');
    } catch {
      return null;
    }
  }
  const data = {};
  for (const [key, value] of new URLSearchParams(raw).entries()) {
    data[key] = value;
  }
  return data;
}

function paytrErrorHtml(message) {
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>Ödeme hatası</title></head><body style="font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto"><h1>Ödeme başlatılamadı</h1><p>${String(message).replace(/</g, '&lt;')}</p><p><a href="/sepet">Sepete dön</a></p></body></html>`;
}

function buildBrowserRelayHtml(fields) {
  const payload = JSON.stringify(sanitizePaytrFields(fields)).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"><title>PayTR</title></head>
<body>
<p style="font-family:system-ui,sans-serif;text-align:center;margin-top:3rem">Güvenli ödeme sayfasına yönlendiriliyorsunuz…</p>
<script>
(function () {
  var fields = ${payload};
  var form = document.createElement('form');
  form.method = 'POST';
  form.action = ${JSON.stringify(PAYTR_ODEME_URL)};
  form.acceptCharset = 'UTF-8';
  Object.keys(fields).forEach(function (key) {
    var val = fields[key];
    if (val == null || val === '') return;
    var input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = String(val);
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
})();
</script>
</body></html>`;
}

module.exports = {
  PAYTR_ODEME_URL,
  buildPaytrOdemeForm,
  encodePaytrBody,
  parseCheckoutRequestBody,
  paytrErrorHtml,
  buildBrowserRelayHtml,
  getPaytrConfig,
  resolvePaytrUserIp,
  resolvePaytrUserIpDetailed,
  siteBaseUrl,
};
