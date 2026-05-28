const { getOrderStore } = require('../../lib/orderBlobStore.cjs');
const { paytrReturnHtmlBreakout, buildReturnLocation } = require('../../lib/paytrReturn.cjs');

exports.handler = async (event) => {
  const { oid } = buildReturnLocation(event, '/odeme/basarili');

  if (oid && /^[a-f0-9]{20}$/i.test(oid)) {
    try {
      const store = getOrderStore(event);
      const key = `order-${oid}`;
      const order = await store.get(key, { type: 'json' });
      if (
        order &&
        order.paymentStatus !== 'failed' &&
        order.payment_status !== 'failed' &&
        order.status !== 'cancelled'
      ) {
        const now = new Date().toISOString();
        await store.setJSON(key, {
          ...order,
          paytrClientReturnAt: order.paytrClientReturnAt || now,
          updatedAt: now,
        });
        console.log('[paytr-return-ok] client return marked', { order_id: oid });
      }
    } catch (err) {
      console.error('[paytr-return-ok] order mark error:', err?.message || err);
    }
  }

  return paytrReturnHtmlBreakout(event, '/odeme/basarili');
};
