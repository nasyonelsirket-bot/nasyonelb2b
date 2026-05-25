/**
 * PayTR bildirim URL — ödeme sonucu (2. adım).
 * PayTR yalnızca düz metin "OK" yanıtını kabul eder.
 */
const { getOrderStore } = require('../../lib/orderBlobStore.cjs');
const { sendOrderEmails } = require('../../lib/orderEmail.cjs');
const { markCouponUsed } = require('../../lib/catalogPromotions.cjs');
const { deductOrderStock } = require('../../lib/orderStock.cjs');
const {
  getPaytrConfig,
  verifyCallbackHash,
  parseEventFormBody,
  paytrOkResponse,
  parseOrderIdFromMerchantOid,
} = require('../../lib/paytrHelpers.cjs');

function isCallbackFullyProcessed(order) {
  return (
    order.status === 'kargoya_hazir' &&
    (order.paymentStatus === 'success' || order.payment_status === 'success' || order.paid === true) &&
    Boolean(order.emailSentAt) &&
    Boolean(order.stockDeductedAt)
  );
}

async function updateOrderIndex(store, orderId, patch) {
  let index = [];
  try {
    index = await store.get('order-index', { type: 'json' });
  } catch {
    index = [];
  }
  if (!Array.isArray(index)) return;
  const next = index.map((row) => (row.id === orderId ? { ...row, ...patch } : row));
  await store.setJSON('order-index', next);
}

async function runSuccessSideEffects(event, store, key, order, orderId) {
  let current = { ...order };

  if (current.couponCode && !current.couponUsedAt) {
    try {
      await markCouponUsed(event, current.couponCode);
      current.couponUsedAt = new Date().toISOString();
    } catch (useErr) {
      console.error('[paytr-callback] coupon error:', useErr);
    }
  }

  if (!current.stockDeductedAt) {
    try {
      const stockResult = await deductOrderStock(event, current);
      if (stockResult.ok) {
        current.stockDeductedAt = new Date().toISOString();
      } else {
        console.error('[paytr-callback] stock error:', stockResult);
      }
    } catch (stockErr) {
      console.error('[paytr-callback] stock error:', stockErr);
    }
  }

  if (!current.emailSentAt) {
    try {
      const emailResult = await sendOrderEmails(current, {
        pdfUrl: current.pdfUrl,
        siteUrl: current.siteUrl,
      });
      current.emailResults = emailResult;
      if (emailResult.ok || emailResult.customer?.ok || emailResult.admin?.ok) {
        current.emailSentAt = new Date().toISOString();
      } else {
        console.error('[paytr-callback] email failed:', JSON.stringify(emailResult));
      }
    } catch (emailErr) {
      console.error('[paytr-callback] email error:', emailErr);
    }
  }

  await updateOrderIndex(store, orderId, {
    status: 'kargoya_hazir',
    paymentStatus: 'success',
    updatedAt: new Date().toISOString(),
  });

  await store.setJSON(key, current);
  return current;
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
    console.error('[paytr-callback] config error:', err.message);
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
    console.error('[paytr-callback] eksik alan', {
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
    console.error('[paytr-callback] hash uyuşmazlığı', merchantOid);
    return { statusCode: 400, body: 'PAYTR notification failed: bad hash' };
  }

  const orderId = parseOrderIdFromMerchantOid(merchantOid);
  if (!orderId) {
    console.error('[paytr-callback] geçersiz merchant_oid', merchantOid);
    return paytrOkResponse();
  }

  try {
    const store = getOrderStore(event);
    const key = `order-${orderId}`;
    const order = await store.get(key, { type: 'json' });

    if (!order) {
      console.error('[paytr-callback] sipariş yok', orderId, merchantOid);
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
      emailSentAt: order.emailSentAt || null,
      stockDeductedAt: order.stockDeductedAt || null,
    });

    if (status === 'success') {
      if (isCallbackFullyProcessed(order)) {
        console.log('[paytr-callback] already complete — skip', { order_id: orderId });
        return paytrOkResponse();
      }

      const now = new Date().toISOString();
      let updated = {
        ...order,
        status: 'kargoya_hazir',
        paymentStatus: 'success',
        payment_status: 'success',
        paid: true,
        paytrTotalAmount: totalAmount,
        paytrMerchantOid: merchantOid,
        paytrTransactionId: String(post.payment_id || post.paytr_payment_id || merchantOid).trim(),
        paytrCallbackAt: order.paytrCallbackAt || now,
        paidAt: order.paidAt || now,
        confirmedAt: order.confirmedAt || now,
        paytrCallbackRaw: {
          status: post.status,
          total_amount: post.total_amount,
          payment_type: post.payment_type || null,
          currency: post.currency || null,
          test_mode: post.test_mode || null,
        },
      };

      await store.setJSON(key, updated);

      console.log('[paytr-callback] order saved', {
        order_id: orderId,
        order_status_after: updated.status,
        payment_status: updated.paymentStatus,
        paytrTransactionId: updated.paytrTransactionId,
      });

      updated = await runSuccessSideEffects(event, store, key, updated, orderId);

      console.log('[paytr-callback] order status after', {
        order_id: orderId,
        merchant_oid: merchantOid,
        order_status_before: statusBefore,
        order_status_after: updated.status,
        payment_status: status,
        total_amount: totalAmount,
        hash_valid: valid,
        paid: updated.paid,
        emailSentAt: updated.emailSentAt || null,
        stockDeductedAt: updated.stockDeductedAt || null,
      });
    } else {
      const failed = {
        ...order,
        status: 'cancelled',
        paymentStatus: 'failed',
        payment_status: 'failed',
        paid: false,
        paytrCallbackAt: new Date().toISOString(),
        paytrMerchantOid: merchantOid,
        paytrRaw: {
          failed_reason_code: post.failed_reason_code || null,
          failed_reason_msg: post.failed_reason_msg || null,
        },
      };
      await store.setJSON(key, failed);

      await updateOrderIndex(store, orderId, {
        status: 'cancelled',
        paymentStatus: 'failed',
        updatedAt: new Date().toISOString(),
      });

      console.log('[paytr-callback] payment failed', {
        order_id: orderId,
        order_status_before: statusBefore,
        order_status_after: failed.status,
        payment_status: status,
      });
    }
  } catch (err) {
    console.error('[paytr-callback] store error:', err);
    return { statusCode: 500, body: '' };
  }

  return paytrOkResponse();
};
