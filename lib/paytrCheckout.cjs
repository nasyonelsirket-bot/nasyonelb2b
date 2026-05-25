/**
 * PayTR odeme spp — https://www.paytr.com/odeme (kart POST + özel UI)
 *
 * Token (iframe hash):
 *   merchant_id + user_ip + merchant_oid + email + payment_amount
 *   + user_basket + no_installment + max_installment + currency + test_mode + salt
 *
 * payment_amount: kuruş tam sayı ("6900"). user_basket: base64 JSON.
 * Forma Direct API kart alanları da eklenir (payment_type, non_3d, installment_count).
 */
const {
  getPaytrConfig,
  buildPaytrUserBasketBase64,
  formatPaytrPaymentAmountKurus,
  createPaytrTokenHash,
  resolvePaytrUserIp,
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
}) {
  const paymentAmount = formatPaytrPaymentAmountKurus(orderTotal);
  const userBasket = buildPaytrUserBasketBase64(items, orderTotal);
  const installmentCount = '0';
  const paymentType = 'card';
  const non3d = '0';

  const paytrToken = createPaytrTokenHash({
    merchantId: config.merchantId,
    merchantKey: config.merchantKey,
    merchantSalt: config.merchantSalt,
    userIp,
    merchantOid,
    email,
    paymentAmount,
    userBasket,
    noInstallment: config.noInstallment,
    maxInstallment: config.maxInstallment,
    currency: config.currency,
    testMode: config.testMode,
  });

  const customerName = String(customer?.name || '').trim();
  const userName = customerName.slice(0, 60);
  const userAddress = [customer?.address, customer?.district, customer?.city]
    .filter(Boolean)
    .join(', ')
    .slice(0, 400);
  const userPhone = String(customer?.phone || '').replace(/\D/g, '').slice(0, 20);

  return {
    merchant_id: config.merchantId,
    user_ip: userIp,
    merchant_oid: merchantOid,
    email,
    payment_type: paymentType,
    payment_amount: paymentAmount,
    installment_count: installmentCount,
    currency: config.currency,
    test_mode: config.testMode,
    non_3d: non3d,
    no_installment: config.noInstallment,
    max_installment: config.maxInstallment,
    merchant_ok_url: `${base}/api/paytr/return-ok?oid=${orderId}`,
    merchant_fail_url: `${base}/api/paytr/return-fail?oid=${orderId}`,
    user_name: userName,
    user_address: userAddress || '-',
    user_phone: userPhone,
    user_basket: userBasket,
    debug_on: config.debugOn,
    lang: 'tr',
    client_lang: 'tr',
    timeout_limit: config.timeoutLimit,
    paytr_token: paytrToken,
    non3d_test_failed: '0',
  };
}

function encodePaytrBody(fields) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    if (value == null || value === '') continue;
    params.append(key, String(value));
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
  const payload = JSON.stringify(fields).replace(/</g, '\\u003c');
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
  siteBaseUrl,
};
