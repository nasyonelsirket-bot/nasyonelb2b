/**
 * Bekleyen sipariş için PayTR iFrame token alır (get-token).
 */
const { getOrderStore } = require('../../lib/orderBlobStore.cjs');
const {
  getPaytrConfig,
  resolvePaytrUserIpDetailedAsync,
  mintPaytrMerchantOid,
  siteBaseUrl,
} = require('../../lib/paytrHelpers.cjs');
const { buildPaytrIframeCheckout } = require('../../lib/paytrForm.cjs');
const { registerMerchantOidMapping, upsertOrderIndexRow } = require('../../lib/orderIndex.cjs');

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

  const ipResult = await resolvePaytrUserIpDetailedAsync(event, body);
  const userIp = ipResult.ip;
  if (!userIp) {
    console.error('paytr-resign: user_ip alınamadı', JSON.stringify(ipResult.debug, null, 2));
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({
        error: 'Müşteri IP adresi alınamadı (IPv4 gerekli)',
        reason: 'Müşteri IP adresi alınamadı (IPv4 gerekli)',
      }),
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

    const merchantOid =
      String(order.paytrMerchantOid || order.merchantOid || '').trim().startsWith('NT') &&
      order.status === 'pending_payment'
        ? String(order.paytrMerchantOid || order.merchantOid).trim()
        : mintPaytrMerchantOid(order.id);

    const oidChanged = merchantOid !== (order.paytrMerchantOid || order.merchantOid);
    const updatedOrder = {
      ...order,
      merchantOid,
      paytrMerchantOid: merchantOid,
      ...(oidChanged ? { paytrMerchantOidAt: new Date().toISOString() } : {}),
      updatedAt: new Date().toISOString(),
    };
    if (oidChanged || updatedOrder.paytrMerchantOid !== order.paytrMerchantOid) {
      await store.setJSON(`order-${orderId}`, updatedOrder);
      await registerMerchantOidMapping(store, merchantOid, orderId);
      await upsertOrderIndexRow(store, updatedOrder, orderId, 'paytr-resign');
    }

    const activeOrder = updatedOrder;

    console.log('[paytr-resign] order saved', {
      order_id: orderId,
      merchant_oid: merchantOid,
      user_ip: userIp,
      oid_reused: !oidChanged,
    });

    const base = siteBaseUrl(event);
    const email = String(activeOrder.customer?.email || '').trim().slice(0, 100);

    const checkout = await buildPaytrIframeCheckout({
      config,
      base,
      orderId: activeOrder.id,
      merchantOid,
      email,
      orderTotal: activeOrder.orderTotal,
      items: activeOrder.items,
      customer: activeOrder.customer,
      userIp,
      userIpDebug: ipResult.debug,
      context: `resign:${order.id}`,
    });

    console.log(`[paytr-resign:${orderId}] PayTR FULL RAW response`, JSON.stringify(checkout.paytrResponse));

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        ok: true,
        mode: 'iframe',
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderTotal: order.orderTotal,
        merchantOid,
        userIp,
        iframeToken: checkout.iframeToken,
        iframeUrl: checkout.iframeUrl,
      }),
    };
  } catch (err) {
    console.error(`[paytr-resign:${orderId}] PayTR FULL RAW response`, err.paytrRaw || '(yok)');
    console.error(`[paytr-resign:${orderId}] PayTR parsed response`, JSON.stringify(err.paytr || null));
    console.error(`[paytr-resign:${orderId}] error`, err.message);

    const reason = err.paytr?.reason || err.message || 'PayTR iFrame token alınamadı';
    const statusCode =
      err.paytrStatus === 'failed' ? 422 : err.httpStatus >= 400 && err.httpStatus < 600 ? err.httpStatus : 500;

    return {
      statusCode,
      headers: HEADERS,
      body: JSON.stringify({
        error: reason,
        reason,
        paytrStatus: err.paytrStatus || err.paytr?.status || null,
        paytr: err.paytr || null,
        paytrRaw: err.paytrRaw || null,
      }),
    };
  }
};
