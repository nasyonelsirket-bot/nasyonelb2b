/**
 * Müşteri sipariş takibi — sipariş no + e-posta
 */
const { getOrderStore } = require('../../lib/orderBlobStore.cjs');

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

  const orderNumber = String(body.orderNumber || '').trim().toUpperCase();
  const email = String(body.email || '').trim().toLowerCase();

  if (!orderNumber || !email) {
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Sipariş numarası ve e-posta zorunludur' }),
    };
  }

  try {
    const store = getOrderStore(event);
    let index = [];
    try {
      index = await store.get('order-index', { type: 'json' });
    } catch {
      index = [];
    }
    if (!Array.isArray(index)) index = [];

    const row = index.find(
      (r) =>
        String(r.orderNumber || '').toUpperCase() === orderNumber ||
        String(r.id || '').toUpperCase() === orderNumber,
    );

    if (!row) {
      return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: 'Sipariş bulunamadı' }) };
    }

    const order = await store.get(`order-${row.id}`, { type: 'json' });
    if (!order) {
      return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: 'Sipariş bulunamadı' }) };
    }

    const orderEmail = String(order.customer?.email || '').trim().toLowerCase();
    if (orderEmail !== email) {
      return {
        statusCode: 403,
        headers: HEADERS,
        body: JSON.stringify({ error: 'E-posta adresi siparişle eşleşmiyor' }),
      };
    }

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        ok: true,
        order: {
          orderNumber: order.orderNumber || order.id,
          status: order.status,
          createdAt: order.createdAt,
          orderTotal: order.orderTotal,
          paymentMethod: order.paymentMethod,
          shippingCarrier: order.shippingCarrier || null,
          trackingNumber: order.trackingNumber || null,
          shippedAt: order.shippedAt || null,
        },
      }),
    };
  } catch (err) {
    console.error('orders-track:', err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: err.message || 'Takip bilgisi alınamadı' }),
    };
  }
};
