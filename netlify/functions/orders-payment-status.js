/**
 * Müşteri ödeme durumu — PayTR return sayfası callback doğrulaması için.
 */
const { getOrderStore } = require('../../lib/orderBlobStore.cjs');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

const PAID_STATUSES = new Set([
  'paid',
  'kargoya_hazir',
  'confirmed',
  'iban_verified',
  'packed',
  'shipped',
  'completed',
]);

function isOrderPaid(order) {
  if (!order || typeof order !== 'object') return false;
  if (order.paid === true) return true;
  if (order.paymentStatus === 'success' || order.payment_status === 'success') return true;
  if (PAID_STATUSES.has(String(order.status || '').trim())) return true;
  return false;
}

function isOrderFailed(order) {
  if (!order || typeof order !== 'object') return false;
  return (
    order.paymentStatus === 'failed' ||
    order.payment_status === 'failed' ||
    order.status === 'cancelled'
  );
}

function canConfirmPurchase(order) {
  if (!order || isOrderFailed(order)) return false;
  if (isOrderPaid(order)) return true;
  return Boolean(order.paytrClientReturnAt);
}

function mapAnalyticsItems(items = []) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    id: item.id ?? item.sku ?? item.productId ?? null,
    sku: item.sku ?? null,
    name: item.name ?? 'Ürün',
    price: Number(item.price) || 0,
    quantity: Math.max(1, Number(item.quantity) || 1),
    image: item.image ?? null,
  }));
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const id = String(event.queryStringParameters?.id || event.queryStringParameters?.oid || '').trim();
  if (!id || !/^[a-f0-9]{20}$/i.test(id)) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Geçersiz sipariş id' }) };
  }

  try {
    const store = getOrderStore(event);
    const order = await store.get(`order-${id}`, { type: 'json' });
    if (!order) {
      return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: 'Sipariş bulunamadı' }) };
    }

    const paid = isOrderPaid(order);
    const failed = isOrderFailed(order);
    const purchaseConfirmed = canConfirmPurchase(order);

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        ok: true,
        orderId: id,
        orderNumber: order.orderNumber || id,
        status: order.status,
        paymentStatus: order.paymentStatus || order.payment_status || null,
        paid,
        failed,
        purchaseConfirmed,
        orderTotal: Number(order.orderTotal) || 0,
        items: mapAnalyticsItems(order.items),
        customer: order.customer
          ? {
              name: order.customer.name || '',
              email: order.customer.email || '',
              phone: order.customer.phone || '',
              city: order.customer.city || '',
              district: order.customer.district || '',
            }
          : null,
        callbackReceived: Boolean(order.paytrCallbackAt),
        clientReturnAt: order.paytrClientReturnAt || null,
      }),
    };
  } catch (err) {
    console.error('[orders-payment-status]', err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: err.message || 'Durum alınamadı' }),
    };
  }
};
