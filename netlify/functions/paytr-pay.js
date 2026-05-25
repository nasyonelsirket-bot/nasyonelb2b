/**
 * PayTR ödeme — imzalı alanları oluştur, tarayıcıdan PayTR /odeme'ye ilet.
 * Kart bilgisi sunucuda tutulmaz; yalnızca auto-submit HTML ile PayTR'ye gider.
 */
const { getOrderStore } = require('../../lib/orderBlobStore.cjs');
const {
  buildPaytrOdemeForm,
  parseCheckoutRequestBody,
  paytrErrorHtml,
  buildBrowserRelayHtml,
  getPaytrConfig,
  resolvePaytrUserIpDetailed,
  siteBaseUrl,
} = require('../../lib/paytrCheckout.cjs');
const { sanitizePaytrFields, logPaytrPayload } = require('../../lib/paytrHelpers.cjs');

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

  const body = parseCheckoutRequestBody(event);
  if (!body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: paytrErrorHtml('Geçersiz istek.'),
    };
  }

  const orderId = String(body.orderId || '').trim();
  if (!orderId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: paytrErrorHtml('Sipariş bulunamadı.'),
    };
  }

  const ipResult = resolvePaytrUserIpDetailed(event, body);
  const userIp = ipResult.ip;
  if (!userIp) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: paytrErrorHtml('IP adresi alınamadı. Sayfayı yenileyip tekrar deneyin.'),
    };
  }

  let config;
  try {
    config = getPaytrConfig();
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: paytrErrorHtml(err.message),
    };
  }

  try {
    const store = getOrderStore(event);
    const order = await store.get(`order-${orderId}`, { type: 'json' });
    if (!order) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: paytrErrorHtml('Sipariş bulunamadı.'),
      };
    }
    if (order.status !== 'pending_payment') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: paytrErrorHtml('Sipariş ödemeye uygun değil.'),
      };
    }

    const ccOwner = String(body.cc_owner || '').trim();
    const cardNumber = String(body.card_number || '').replace(/\D/g, '');
    const expiryMonth = String(body.expiry_month || '').replace(/\D/g, '').slice(0, 2);
    const expiryYear = String(body.expiry_year || '').replace(/\D/g, '').slice(0, 2);
    const cvv = String(body.cvv || '').replace(/\D/g, '').slice(0, 4);

    if (!ccOwner || cardNumber.length < 15 || !expiryMonth || !expiryYear || cvv.length < 3) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: paytrErrorHtml('Kart bilgileri eksik veya geçersiz.'),
      };
    }

    const base = siteBaseUrl(event);
    const email = String(order.customer?.email || '').trim().slice(0, 100);
    const paytrFields = buildPaytrOdemeForm({
      config,
      base,
      orderId: order.id,
      merchantOid: order.merchantOid,
      email,
      orderTotal: order.orderTotal,
      items: order.items,
      customer: order.customer,
      userIp,
      userIpDebug: ipResult.debug,
    });

    const allFields = sanitizePaytrFields({
      ...paytrFields,
      cc_owner: ccOwner,
      card_number: cardNumber,
      expiry_month: expiryMonth,
      expiry_year: expiryYear,
      cvv,
    });

    logPaytrPayload(`pay:${orderId}`, allFields, config);

    const html = buildBrowserRelayHtml(allFields);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
      body: html,
    };
  } catch (err) {
    console.error('paytr-pay:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: paytrErrorHtml(err.message || 'Ödeme başlatılamadı.'),
    };
  }
};
