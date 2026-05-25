/**
 * PayTR Direct API — https://dev.paytr.com/direkt-api/direkt-api-1-adim
 *
 * POST: https://www.paytr.com/odeme
 *
 * compact hash (varsayılan):
 *   merchant_id + user_ip + merchant_oid + email + payment_amount
 *   + currency + test_mode + non_3d + merchant_salt
 *
 * Form-only (hash dışı): payment_type, installment_count, lang, no_installment, max_installment
 *
 * PAYTR_AMOUNT_MODE=kurus (varsayılan) | decimal
 * PAYTR_BASKET_MODE=decimal (varsayılan) | kurus
 * PAYTR_HASH_MODE=compact (varsayılan) | official
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
  const installmentCount = '0';
  const non3d = '0';
  const currency = 'TL';
  const testMode = config.testMode === '1' ? '1' : '0';

  const hashParams = {
    merchantId: config.merchantId,
    merchantSalt: config.merchantSalt,
    userIp: String(userIp),
    merchantOid: String(merchantOid),
    email: String(email),
    paymentAmount,
    hashMode: config.hashMode,
    installmentCount,
    currency,
    testMode,
    non3d,
  };

  if (config.hashMode === 'official') {
    hashParams.paymentType = 'card';
  }

  const hashDebug = buildDirectPaytrHashInput(hashParams);

  const paytrToken = createDirectPaytrTokenHash({
    ...hashParams,
    merchantKey: config.merchantKey,
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
    no_installment: '0',
    max_installment: '0',
    lang: 'tr',
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

  if (config.hashMode === 'official') {
    rawFields.payment_type = 'card';
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
