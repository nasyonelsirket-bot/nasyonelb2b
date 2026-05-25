/**
 * İmzalı PayTR alanları + kart bilgisi — sunucuda birleştir, tarayıcıdan PayTR'ye POST et.
 * Alan değerleri JSON ile aktarılır (base64 + bozulmasın).
 */
const { getOrderStore } = require('../../lib/orderBlobStore.cjs');
const { getPaytrConfig, resolvePaytrUserIp, siteBaseUrl, sanitizePaytrFields, logPaytrPayload } = require('../../lib/paytrHelpers.cjs');
const { buildPaytrDirectForm } = require('../../lib/paytrForm.cjs');

const PAYTR_URL = 'https://www.paytr.com/odeme';

function parseRequestBody(event) {
  let raw = event.body || '';
  if (event.isBase64Encoded && raw) {
    raw = Buffer.from(raw, 'base64').toString('utf8');
  }
  const contentType = String(event.headers['content-type'] || event.headers['Content-Type'] || '');
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

function buildAutoSubmitHtml(fields) {
  const payload = JSON.stringify(fields).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PayTR yönlendirme</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #334155; }
    .box { text-align: center; padding: 2rem; }
  </style>
</head>
<body>
  <div class="box">
    <p>Güvenli ödeme sayfasına yönlendiriliyorsunuz…</p>
    <p style="font-size:0.875rem;color:#64748b">Lütfen bekleyin.</p>
  </div>
  <script>
    (function () {
      var fields = ${payload};
      var form = document.createElement('form');
      form.method = 'POST';
      form.action = ${JSON.stringify(PAYTR_URL)};
      form.acceptCharset = 'UTF-8';
      form.style.display = 'none';
      Object.keys(fields).forEach(function (key) {
        var value = fields[key];
        if (value == null || value === '') return;
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    })();
  </script>
</body>
</html>`;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const body = parseRequestBody(event);
  if (!body) {
    return { statusCode: 400, body: 'Geçersiz istek' };
  }

  const orderId = String(body.orderId || '').trim();
  if (!orderId) {
    return { statusCode: 400, body: 'Sipariş ID gerekli' };
  }

  const userIp = resolvePaytrUserIp(event, body);
  if (!userIp) {
    return { statusCode: 400, body: 'Müşteri IP adresi alınamadı' };
  }

  let config;
  try {
    config = getPaytrConfig();
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }

  try {
    const store = getOrderStore(event);
    const order = await store.get(`order-${orderId}`, { type: 'json' });
    if (!order) {
      return { statusCode: 404, body: 'Sipariş bulunamadı' };
    }
    if (order.status !== 'pending_payment') {
      return { statusCode: 400, body: 'Sipariş ödemeye uygun değil' };
    }

    const base = siteBaseUrl(event);
    const email = String(order.customer?.email || '').trim().slice(0, 100);
    const paytrFields = buildPaytrDirectForm({
      config,
      base,
      orderId: order.id,
      merchantOid: order.merchantOid,
      email,
      orderTotal: order.orderTotal,
      items: order.items,
      customer: order.customer,
      userIp,
    });

    const cardNumber = String(body.card_number || '').replace(/\D/g, '');
    const ccOwner = String(body.cc_owner || '').trim();
    const expiryMonth = String(body.expiry_month || '').replace(/\D/g, '').slice(0, 2);
    const expiryYear = String(body.expiry_year || '').replace(/\D/g, '').slice(0, 2);
    const cvv = String(body.cvv || '').replace(/\D/g, '').slice(0, 4);

    if (!ccOwner || cardNumber.length < 15 || !expiryMonth || !expiryYear || cvv.length < 3) {
      return { statusCode: 400, body: 'Kart bilgileri eksik veya geçersiz' };
    }

    const html = buildAutoSubmitHtml(
      sanitizePaytrFields({
        ...paytrFields,
        cc_owner: ccOwner,
        card_number: cardNumber,
        expiry_month: expiryMonth,
        expiry_year: expiryYear,
        cvv,
      }),
    );

    logPaytrPayload(`forward:${orderId}`, paytrFields, config);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
      body: html,
    };
  } catch (err) {
    console.error('paytr-forward:', err);
    return { statusCode: 500, body: err.message || 'Ödeme yönlendirmesi başarısız' };
  }
};
