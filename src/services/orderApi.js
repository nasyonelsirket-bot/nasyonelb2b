const ORDER_SAVE = '/api/order-pdf/save';
const ORDERS_LIST = '/api/orders/list';
const ORDERS_GET = '/api/orders/get';
const ORDERS_UPDATE = '/api/orders/update';
const ORDERS_DELETE = '/api/orders/delete';
const ORDERS_TRACK = '/api/orders/track';

function adminHeaders() {
  const pass =
    typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem('b2b_admin_pass') || ''
      : '';
  return {
    'Content-Type': 'application/json',
    'X-Admin-Key': pass,
  };
}

/** Sipariş sunucuya kaydedilir; e-posta (Resend) tetiklenir */
export async function saveOrder(order) {
  const res = await fetch(ORDER_SAVE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = [data.error, data.hint].filter(Boolean).join(' — ') || 'Sipariş kaydedilemedi';
    throw new Error(msg);
  }
  return data;
}

export async function fetchOrders() {
  const res = await fetch(ORDERS_LIST, { headers: adminHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Siparişler yüklenemedi');
  return data.orders || [];
}

export async function fetchOrderDetail(id) {
  const res = await fetch(`${ORDERS_GET}?id=${encodeURIComponent(id)}`, {
    headers: adminHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Sipariş detayı alınamadı');
  return data.order;
}

export async function updateOrderStatus(id, status, extra = {}) {
  const res = await fetch(ORDERS_UPDATE, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ id, status, ...extra }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Güncellenemedi');
  return data;
}

export async function deleteOrder(id) {
  const res = await fetch(ORDERS_DELETE, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ id }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Sipariş silinemedi');
  return data;
}

export async function trackOrder(orderNumber, email) {
  const res = await fetch(ORDERS_TRACK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderNumber, email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Sipariş bulunamadı');
  return data.order;
}

/** @deprecated use saveOrder */
export async function uploadOrderForPdfLink(order) {
  return saveOrder(order);
}
