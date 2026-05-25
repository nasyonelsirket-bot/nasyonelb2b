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
  parseOrderIdFromMerchantOid,
} = require('../../lib/paytrHelpers.cjs');

const PAID_ORDER_STATUSES = new Set(['kargoya_hazir', 'confirmed', 'iban_verified', 'packed', 'shipped', 'completed']);

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
      const next = index.map((row) =>
        row.id === orderId ? { ...row, status: 'kargoya_hazir', paymentStatus: 'success' } : row,
      );
      return getOrderStore(event).setJSON('order-index', next);
    })
    .catch((idxErr) => {
      console.error('paytr-callback index:', idxErr);
    });
}

function isOrderAlreadyPaid(order) {
  return (
    order.paymentStatus === 'success' ||
    order.payment_status === 'success' ||
    order.paid === true ||
    PAID_ORDER_STATUSES.has(order.status)
  );
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

  console.log('[paytr-callback] incoming', {
    merchant_oid: merchantOid || null,
    payment_status: status || null,
    total_amount: totalAmount ?? null,
    hasHash: Boolean(hash),
  });

  if (!merchantOid || !status || totalAmount == null || totalAmount === '' || !hash) {
    console.error('paytr-callback: eksik alan', {
      merchant_oid: merchantOid || null,
      payment_status: status || null,
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

  console.log('[paytr-callback] hash verification', {
    merchant_oid: merchantOid,
    payment_status: status,
    total_amount: totalAmount,
    hash_valid: valid,
  });

  if (!valid) {
    console.error('paytr-callback: hash uyuşmazlığı', merchantOid);
    return { statusCode: 400, body: 'PAYTR notification failed: bad hash' };
  }

  const orderId = parseOrderIdFromMerchantOid(merchantOid);
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

    const statusBefore = order.status;
    console.log('[paytr-callback] order status before', {
      order_id: orderId,
      merchant_oid: merchantOid,
      order_status_before: statusBefore,
      payment_status: status,
      total_amount: totalAmount,
      hash_valid: valid,
    });

    if (isOrderAlreadyPaid(order)) {
      console.log('[paytr-callback] order already paid — skip', {
        order_id: orderId,
        order_status_before: statusBefore,
        order_status_after: statusBefore,
      });
      return paytrOkResponse();
    }

    if (status === 'success') {
      const now = new Date().toISOString();
      const updated = {
        ...order,
        status: 'kargoya_hazir',
        paymentStatus: 'success',
        payment_status: 'success',
        paid: true,
        paytrTotalAmount: totalAmount,
        paytrCallbackAt: now,
        paidAt: now,
        confirmedAt: now,
      };
      await store.setJSON(key, updated);

      console.log('[paytr-callback] order status after', {
        order_id: orderId,
        merchant_oid: merchantOid,
        order_status_before: statusBefore,
        order_status_after: updated.status,
        payment_status: status,
        total_amount: totalAmount,
        hash_valid: valid,
        paid: updated.paid,
      });

      scheduleCallbackSideEffects(event, { order: updated, orderId, status, post });
    } else {
      const failed = {
        ...order,
        status: 'cancelled',
        paymentStatus: 'failed',
        payment_status: 'failed',
        paid: false,
        paytrCallbackAt: new Date().toISOString(),
        paytrRaw: {
          failed_reason_code: post.failed_reason_code || null,
          failed_reason_msg: post.failed_reason_msg || null,
        },
      };
      await store.setJSON(key, failed);

      console.log('[paytr-callback] order status after', {
        order_id: orderId,
        merchant_oid: merchantOid,
        order_status_before: statusBefore,
        order_status_after: failed.status,
        payment_status: status,
        total_amount: totalAmount,
        hash_valid: valid,
      });

      getOrderStore(event)
        .get('order-index', { type: 'json' })
        .then((index) => {
          if (!Array.isArray(index)) return;
          const next = index.map((row) =>
            row.id === orderId ? { ...row, status: 'cancelled', paymentStatus: 'failed' } : row,
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
