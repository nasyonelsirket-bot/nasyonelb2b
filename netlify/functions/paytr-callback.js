/**
 * PayTR bildirim URL — ödeme sonucu (2. adım).
 * PayTR yalnızca düz metin "OK" yanıtını kabul eder.
 */
const { getOrderStore } = require('../../lib/orderBlobStore.cjs');
const { sendOrderEmails } = require('../../lib/orderEmail.cjs');
const { markCouponUsed } = require('../../lib/catalogPromotions.cjs');
const {
  getPaytrConfig,
  verifyCallbackHash,
  parseEventFormBody,
  paytrOkResponse,
} = require('../../lib/paytrHelpers.cjs');

function scheduleCallbackSideEffects(event, { order, orderId, status, post }) {
  if (status !== 'success') return;

  if (order.couponCode) {
    markCouponUsed(event, order.couponCode).catch((useErr) => {
      console.error('paytr-callback coupon:', useErr);
    });
  }

  sendOrderEmails(order, {
    pdfUrl: order.pdfUrl,
    siteUrl: order.siteUrl,
  }).catch((emailErr) => {
    console.error('paytr-callback email:', emailErr);
  });

  getOrderStore(event)
    .get('order-index', { type: 'json' })
    .then((index) => {
      if (!Array.isArray(index)) return;
      const next = index.map((row) => (row.id === orderId ? { ...row, status: 'confirmed' } : row));
      return getOrderStore(event).setJSON('order-index', next);
    })
    .catch((idxErr) => {
      console.error('paytr-callback index:', idxErr);
    });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'GET' || event.httpMethod === 'HEAD') {
    return paytrOkResponse();
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: '' };
  }

  let config;
  try {
    config = getPaytrConfig();
  } catch (err) {
    console.error('paytr-callback config:', err.message);
    return { statusCode: 500, body: '' };
  }

  const post = parseEventFormBody(event);
  const merchantOid = String(post.merchant_oid || '').trim();
  const status = String(post.status || '').trim();
  const totalAmount = post.total_amount;
  const hash = String(post.hash || '').trim();

  if (!merchantOid || !status || totalAmount == null || totalAmount === '' || !hash) {
    console.error('paytr-callback: eksik alan', {
      merchant_oid: merchantOid || null,
      status: status || null,
      total_amount: totalAmount ?? null,
      hasHash: Boolean(hash),
      isBase64Encoded: Boolean(event.isBase64Encoded),
    });
    return { statusCode: 400, body: 'Eksik alan' };
  }

  const valid = verifyCallbackHash({
    merchantKey: config.merchantKey,
    merchantSalt: config.merchantSalt,
    merchantOid,
    status,
    totalAmount,
    hash,
  });

  if (!valid) {
    console.error('paytr-callback: hash uyuşmazlığı', merchantOid);
    return { statusCode: 400, body: 'PAYTR notification failed: bad hash' };
  }

  const orderId = String(merchantOid).replace(/^NT/i, '');
  if (!orderId) {
    console.error('paytr-callback: geçersiz merchant_oid', merchantOid);
    return paytrOkResponse();
  }

  try {
    const store = getOrderStore(event);
    const key = `order-${orderId}`;
    const order = await store.get(key, { type: 'json' });

    if (!order) {
      console.error('paytr-callback: sipariş yok', orderId, merchantOid);
      return paytrOkResponse();
    }

    if (order.paymentStatus === 'success' || order.status === 'confirmed') {
      return paytrOkResponse();
    }

    if (status === 'success') {
      const updated = {
        ...order,
        status: 'confirmed',
        paymentStatus: 'success',
        paytrTotalAmount: totalAmount,
        paytrCallbackAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
      };
      await store.setJSON(key, updated);
      scheduleCallbackSideEffects(event, { order: updated, orderId, status, post });
    } else {
      await store.setJSON(key, {
        ...order,
        status: 'cancelled',
        paymentStatus: 'failed',
        paytrCallbackAt: new Date().toISOString(),
        paytrRaw: {
          failed_reason_code: post.failed_reason_code || null,
          failed_reason_msg: post.failed_reason_msg || null,
        },
      });

      getOrderStore(event)
        .get('order-index', { type: 'json' })
        .then((index) => {
          if (!Array.isArray(index)) return;
          const next = index.map((row) =>
            row.id === orderId ? { ...row, status: 'cancelled' } : row,
          );
          return getOrderStore(event).setJSON('order-index', next);
        })
        .catch((idxErr) => {
          console.error('paytr-callback failed index:', idxErr);
        });
    }
  } catch (err) {
    console.error('paytr-callback store:', err);
  }

  return paytrOkResponse();
};
