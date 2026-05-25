/**
 * Bekleyen sipariş için PayTR formunu güncel müşteri IP'si ile yeniden imzalar.
 */
const { getOrderStore } = require('../../lib/orderBlobStore.cjs');
const { getPaytrConfig, resolvePaytrUserIp, siteBaseUrl, logPaytrPayload } = require('../../lib/paytrHelpers.cjs');
const { buildPaytrDirectForm } = require('../../lib/paytrForm.cjs');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Geçersiz JSON' }) };
  }

  const orderId = String(body.orderId || '').trim();
  if (!orderId) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Sipariş ID gerekli' }) };
  }

  const userIp = resolvePaytrUserIp(event, body);
  if (!userIp) {
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Müşteri IP adresi alınamadı' }),
    };
  }

  let config;
  try {
    config = getPaytrConfig();
  } catch (err) {
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: err.message }) };
  }

  try {
    const store = getOrderStore(event);
    const order = await store.get(`order-${orderId}`, { type: 'json' });
    if (!order) {
      return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: 'Sipariş bulunamadı' }) };
    }
    if (order.status !== 'pending_payment') {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Sipariş ödemeye uygun değil' }) };
    }

    const base = siteBaseUrl(event);
    const email = String(order.customer?.email || '').trim().slice(0, 100);
    const form = buildPaytrDirectForm({
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

    logPaytrPayload(`resign:${order.id}`, form, config);

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        ok: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderTotal: order.orderTotal,
        userIp,
        form,
      }),
    };
  } catch (err) {
    console.error('paytr-resign:', err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: err.message || 'Ödeme formu yenilenemedi' }),
    };
  }
};
