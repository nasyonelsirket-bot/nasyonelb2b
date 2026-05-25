/**
 * Sipariş admin index + PayTR merchant_oid eşlemesi (Netlify Blobs).
 */
const { parseOrderIdFromMerchantOid } = require('./paytrHelpers.cjs');

const INDEX_KEY = 'order-index';
const MAX_INDEX_ROWS = 500;

function merchantOidKey(merchantOid) {
  return `paytr-oid-${String(merchantOid || '').trim()}`;
}

function buildIndexRow(order, orderId) {
  const id = String(orderId || order?.id || '').trim();
  const customer = order?.customer && typeof order.customer === 'object' ? order.customer : {};
  return {
    id,
    orderNumber: order?.orderNumber || null,
    createdAt: order?.createdAt || new Date().toISOString(),
    updatedAt: order?.updatedAt || order?.paidAt || order?.createdAt || new Date().toISOString(),
    customerName: String(customer.name || '').trim(),
    customerEmail: String(customer.email || '').trim(),
    orderTotal: order?.orderTotal ?? null,
    paymentMethod: order?.paymentMethod || '',
    status: order?.status || 'pending_payment',
    paymentStatus: order?.paymentStatus || order?.payment_status || 'pending',
    itemCount: Array.isArray(order?.items) ? order.items.length : 0,
    merchantOid: order?.paytrMerchantOid || order?.merchantOid || '',
  };
}

async function readOrderIndex(store) {
  try {
    const index = await store.get(INDEX_KEY, { type: 'json' });
    return Array.isArray(index) ? index : [];
  } catch (err) {
    console.error('[orderIndex] read failed:', err);
    return [];
  }
}

async function registerMerchantOidMapping(store, merchantOid, orderId) {
  const oid = String(merchantOid || '').trim();
  const id = String(orderId || '').trim();
  if (!oid || !id) return;
  try {
    await store.set(merchantOidKey(oid), id);
    console.log('[orderIndex] merchant_oid mapped', { merchant_oid: oid, order_id: id });
  } catch (err) {
    console.error('[orderIndex] merchant_oid map failed:', err, { merchant_oid: oid, order_id: id });
  }
}

async function upsertOrderIndexRow(store, order, orderId, logContext = 'upsert') {
  const row = buildIndexRow(order, orderId);
  if (!row.id) {
    console.error('[orderIndex] upsert skipped — order id yok', { logContext });
    return null;
  }

  const index = await readOrderIndex(store);
  const idx = index.findIndex((r) => r.id === row.id);
  if (idx >= 0) {
    index[idx] = { ...index[idx], ...row };
  } else {
    index.unshift(row);
  }

  await store.setJSON(INDEX_KEY, index.slice(0, MAX_INDEX_ROWS));
  console.log('[orderIndex] admin order sync', {
    logContext,
    order_id: row.id,
    order_status: row.status,
    payment_status: row.paymentStatus,
    index_size: Math.min(index.length, MAX_INDEX_ROWS),
  });
  return row;
}

async function resolveOrderByMerchantOid(store, merchantOid) {
  const oid = String(merchantOid || '').trim();
  if (!oid) return null;

  const parsedId = parseOrderIdFromMerchantOid(oid);
  if (parsedId) {
    try {
      const order = await store.get(`order-${parsedId}`, { type: 'json' });
      if (order) {
        console.log('[orderIndex] order found by parsed merchant_oid', {
          merchant_oid: oid,
          order_id: parsedId,
        });
        return { order, orderId: parsedId, key: `order-${parsedId}` };
      }
    } catch (err) {
      console.error('[orderIndex] load by parsed id failed:', err, { order_id: parsedId });
    }
  }

  try {
    const mappedId = await store.get(merchantOidKey(oid), { type: 'text' });
    const orderId = String(mappedId || '').trim();
    if (orderId) {
      const order = await store.get(`order-${orderId}`, { type: 'json' });
      if (order) {
        console.log('[orderIndex] order found by oid mapping', { merchant_oid: oid, order_id: orderId });
        return { order, orderId, key: `order-${orderId}` };
      }
    }
  } catch (err) {
    console.error('[orderIndex] oid mapping lookup failed:', err, { merchant_oid: oid });
  }

  console.error('[orderIndex] order NOT found for merchant_oid', { merchant_oid: oid, parsed_id: parsedId || null });
  return null;
}

async function rebuildOrderIndexFromBlobs(store) {
  const rows = [];
  try {
    for await (const entry of store.list({ prefix: 'order-' })) {
      const key = String(entry?.key || '');
      if (!key.startsWith('order-') || key === INDEX_KEY) continue;
      const orderId = key.slice('order-'.length);
      if (!orderId) continue;
      try {
        const order = await store.get(key, { type: 'json' });
        if (order && typeof order === 'object') {
          rows.push(buildIndexRow(order, orderId));
        }
      } catch (err) {
        console.error('[orderIndex] rebuild load failed:', key, err);
      }
    }
  } catch (err) {
    console.error('[orderIndex] rebuild list failed:', err);
    return [];
  }

  rows.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const next = rows.slice(0, MAX_INDEX_ROWS);
  if (next.length) {
    await store.setJSON(INDEX_KEY, next);
    console.log('[orderIndex] index rebuilt from blobs', { count: next.length });
  }
  return next;
}

async function loadOrderIndexForAdmin(store, { rebuildIfEmpty = true } = {}) {
  let index = await readOrderIndex(store);
  if (rebuildIfEmpty && index.length === 0) {
    index = await rebuildOrderIndexFromBlobs(store);
  }
  return index;
}

module.exports = {
  INDEX_KEY,
  buildIndexRow,
  registerMerchantOidMapping,
  upsertOrderIndexRow,
  resolveOrderByMerchantOid,
  rebuildOrderIndexFromBlobs,
  loadOrderIndexForAdmin,
  readOrderIndex,
};
