const { getOrderStore } = require('./orderBlobStore.cjs');
const { normalizeEmail } = require('./members.cjs');

const STATUS_TR = {
  pending_payment: 'Ödeme bekliyor',
  pending_iban_check: 'Ödeme kontrolü',
  pending_cod: 'Onay bekliyor',
  iban_verified: 'Ödeme onaylandı',
  confirmed: 'Onaylandı',
  kargoya_hazir: 'Kargoya hazır',
  packed: 'Paket yapıldı',
  shipped: 'Kargoda',
  completed: 'Teslim edildi',
  cancelled: 'İptal / red',
};

function summarizeOrder(order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber || order.id,
    status: order.status,
    statusLabel: STATUS_TR[order.status] || order.status,
    createdAt: order.createdAt,
    orderTotal: order.orderTotal,
    paymentMethod: order.paymentMethod,
    itemCount: Array.isArray(order.items) ? order.items.length : 0,
    shippingCarrier: order.shippingCarrier || null,
    trackingNumber: order.trackingNumber || null,
  };
}

async function listOrdersForMemberEmail(event, email) {
  const norm = normalizeEmail(email);
  const store = getOrderStore(event);
  let index = [];
  try {
    index = await store.get('order-index', { type: 'json' });
  } catch {
    index = [];
  }
  if (!Array.isArray(index)) index = [];

  const rows = index
    .filter((r) => normalizeEmail(r.customerEmail) === norm)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  return rows.map((r) => ({
    id: r.id,
    orderNumber: r.orderNumber || r.id,
    status: r.status,
    statusLabel: STATUS_TR[r.status] || r.status,
    createdAt: r.createdAt,
    orderTotal: r.orderTotal,
    paymentMethod: r.paymentMethod,
    itemCount: r.itemCount || 0,
  }));
}

async function getOrderDetailForMember(event, orderId, email) {
  const norm = normalizeEmail(email);
  const store = getOrderStore(event);
  const order = await store.get(`order-${orderId}`, { type: 'json' });
  if (!order) return null;
  const orderEmail = normalizeEmail(order.customer?.email);
  if (orderEmail !== norm) return null;
  return {
    ...summarizeOrder(order),
    customer: order.customer,
    items: order.items,
    discount: order.discount,
    shipping: order.shipping,
    shippedAt: order.shippedAt || null,
  };
}

module.exports = {
  STATUS_TR,
  listOrdersForMemberEmail,
  getOrderDetailForMember,
};
