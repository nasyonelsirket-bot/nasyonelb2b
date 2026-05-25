/**
 * PayTR bildirim URL — ödeme sonucu (2. adım).
 * PayTR yalnızca düz metin "OK" yanıtını kabul eder.
 */
const { getOrderStore } = require('../../lib/orderBlobStore.cjs');
const { sendOrderEmails } = require('../../lib/orderEmail.cjs');
const { markCouponUsed } = require('../../lib/catalogPromotions.cjs');
const { deductOrderStock } = require('../../lib/orderStock.cjs');
const {
  upsertOrderIndexRow,
  resolveOrderByMerchantOid,
  registerMerchantOidMapping,
} = require('../../lib/orderIndex.cjs');
const {
  getPaytrConfig,
  verifyCallbackHash,
  parseEventFormBody,
  paytrOkResponse,
} = require('../../lib/paytrHelpers.cjs');

function isPaymentFinalized(order) {
  return (
    (order.status === 'kargoya_hazir' || order.status === 'paid') &&
    (order.paymentStatus === 'success' || order.payment_status === 'success' || order.paid === true)
  );
}

function needsCallbackSideEffects(order) {
  return !order.emailSentAt || !order.stockDeductedAt;
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

  current.updatedAt = new Date().toISOString();
  await store.setJSON(key, current);
  await upsertOrderIndexRow(store, current, orderId, 'callback-side-effects');
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

  console.log('[paytr-callback] callback received', {
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

  console.log('[paytr-callback] callback verified', {
    merchant_oid: merchantOid,
    payment_status: status,
    total_amount: totalAmount,
    hash_valid: valid,
  });

  if (!valid) {
    console.error('[paytr-callback] hash uyuşmazlığı', merchantOid);
    return { statusCode: 400, body: 'PAYTR notification failed: bad hash' };
  }

  try {
    const store = getOrderStore(event);
    const resolved = await resolveOrderByMerchantOid(store, merchantOid);

    if (!resolved) {
      console.error('[paytr-callback] sipariş bulunamadı', { merchant_oid: merchantOid });
      return paytrOkResponse();
    }

    const { order, orderId, key } = resolved;
    const statusBefore = order.status;

    console.log('[paytr-callback] order loaded', {
      order_id: orderId,
      merchant_oid: merchantOid,
      order_status_before: statusBefore,
      payment_status_incoming: status,
    });

    if (status === 'success') {
      if (isPaymentFinalized(order) && !needsCallbackSideEffects(order)) {
        console.log('[paytr-callback] already complete — skip', { order_id: orderId });
        return paytrOkResponse();
      }

      const now = new Date().toISOString();
      const transactionId = String(
        post.payment_id || post.paytr_payment_id || post.transaction_id || merchantOid,
      ).trim();

      if (!isPaymentFinalized(order)) {
        const paidStep = {
          ...order,
          status: 'paid',
          paymentStatus: 'paid',
          payment_status: 'paid',
          paid: true,
          paytrTotalAmount: totalAmount,
          paytrMerchantOid: merchantOid,
          paytrTransactionId: transactionId,
          paytrCallbackAt: order.paytrCallbackAt || now,
          paidAt: order.paidAt || now,
          updatedAt: now,
          paytrCallbackRaw: {
            status: post.status,
            total_amount: post.total_amount,
            payment_type: post.payment_type || null,
            currency: post.currency || null,
            test_mode: post.test_mode || null,
          },
        };
        await store.setJSON(key, paidStep);
        await registerMerchantOidMapping(store, merchantOid, orderId);
        await upsertOrderIndexRow(store, paidStep, orderId, 'callback-paid');
        console.log('[paytr-callback] order updated → paid', {
          order_id: orderId,
          transaction_id: transactionId,
        });
        order.status = paidStep.status;
        order.paymentStatus = paidStep.paymentStatus;
      }

      let updated = {
        ...order,
        status: 'kargoya_hazir',
        orderStatus: 'kargoya_hazir',
        paymentStatus: 'success',
        payment_status: 'success',
        paid: true,
        paytrTotalAmount: totalAmount,
        paytrMerchantOid: merchantOid,
        paytrTransactionId: transactionId,
        paytrCallbackAt: order.paytrCallbackAt || now,
        paidAt: order.paidAt || now,
        confirmedAt: order.confirmedAt || now,
        updatedAt: now,
      };

      await store.setJSON(key, updated);
      await registerMerchantOidMapping(store, merchantOid, orderId);
      await upsertOrderIndexRow(store, updated, orderId, 'callback-kargoya_hazir');

      console.log('[paytr-callback] order updated → kargoya_hazir', {
        order_id: orderId,
        order_status_after: updated.status,
        payment_status: updated.paymentStatus,
        transaction_id: transactionId,
      });

      updated = await runSuccessSideEffects(event, store, key, updated, orderId);

      console.log('[paytr-callback] order finalized', {
        order_id: orderId,
        merchant_oid: merchantOid,
        order_status_before: statusBefore,
        order_status_after: updated.status,
        emailSentAt: updated.emailSentAt || null,
        stockDeductedAt: updated.stockDeductedAt || null,
      });
    } else {
      const failed = {
        ...order,
        status: 'cancelled',
        orderStatus: 'cancelled',
        paymentStatus: 'failed',
        payment_status: 'failed',
        paid: false,
        paytrCallbackAt: new Date().toISOString(),
        paytrMerchantOid: merchantOid,
        updatedAt: new Date().toISOString(),
        paytrRaw: {
          failed_reason_code: post.failed_reason_code || null,
          failed_reason_msg: post.failed_reason_msg || null,
        },
      };
      await store.setJSON(key, failed);
      await upsertOrderIndexRow(store, failed, orderId, 'callback-failed');

      console.log('[paytr-callback] payment failed', {
        order_id: orderId,
        order_status_before: statusBefore,
        order_status_after: failed.status,
      });
    }
  } catch (err) {
    console.error('[paytr-callback] store error:', err?.stack || err);
    return { statusCode: 500, body: '' };
  }

  return paytrOkResponse();
};
