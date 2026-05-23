const { normalizeEmail } = require('./members.cjs');

/** Ödeme tamamlanmamış — admin "Bekleyen" sekmesi */
const UNPAID_ORDER_STATUSES = ['pending_payment', 'pending_iban_check', 'pending_cod'];

function isUnpaidOrderStatus(status) {
  return UNPAID_ORDER_STATUSES.includes(status);
}

function isPaymentStageWaiting(status) {
  return status === 'pending_payment';
}

function canAdminApprovePending(status) {
  return status === 'pending_iban_check' || status === 'pending_cod';
}

/**
 * Müşteri yeni sipariş verdiğinde eski bekleyen siparişleri kapatır.
 */
async function cancelSupersededPendingOrders(store, { customerEmail, excludeId }) {
  const norm = normalizeEmail(customerEmail);
  if (!norm || !excludeId) return 0;

  let index = [];
  try {
    index = await store.get('order-index', { type: 'json' });
  } catch {
    return 0;
  }
  if (!Array.isArray(index)) return 0;

  const toCancel = index.filter(
    (row) =>
      row.id !== excludeId &&
      normalizeEmail(row.customerEmail) === norm &&
      UNPAID_ORDER_STATUSES.includes(row.status),
  );

  if (!toCancel.length) return 0;

  const cancelledIds = new Set(toCancel.map((row) => row.id));
  const now = new Date().toISOString();

  for (const row of toCancel) {
    try {
      const order = await store.get(`order-${row.id}`, { type: 'json' });
      if (order && UNPAID_ORDER_STATUSES.includes(order.status)) {
        await store.setJSON(`order-${row.id}`, {
          ...order,
          status: 'cancelled',
          cancelReason: 'Yeni sipariş verildi',
          cancelNote: 'Müşteri yeni bir sipariş oluşturduğu için bekleyen sipariş kapatıldı.',
          supersededAt: now,
          supersededBy: excludeId,
        });
      }
    } catch (err) {
      console.error('cancelSupersededPendingOrders:', row.id, err);
    }
  }

  const nextIndex = index.map((row) =>
    cancelledIds.has(row.id) ? { ...row, status: 'cancelled' } : row,
  );
  await store.setJSON('order-index', nextIndex.slice(0, 500));

  return toCancel.length;
}

module.exports = {
  UNPAID_ORDER_STATUSES,
  isUnpaidOrderStatus,
  isPaymentStageWaiting,
  canAdminApprovePending,
  cancelSupersededPendingOrders,
};
