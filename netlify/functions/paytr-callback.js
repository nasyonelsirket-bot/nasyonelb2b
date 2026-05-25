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
  const merchantOid = post.merchant_oid;
  const status = post.status;
  const totalAmount = post.total_amount;
  const hash = post.hash;

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

      if (order.couponCode) {
        try {
          await markCouponUsed(event, order.couponCode);
        } catch (useErr) {
          console.error('paytr-callback coupon:', useErr);
        }
      }

      try {
        const index = await store.get('order-index', { type: 'json' });
        if (Array.isArray(index)) {
          const next = index.map((row) =>
            row.id === orderId ? { ...row, status: 'confirmed' } : row,
          );
          await store.setJSON('order-index', next);
        }
      } catch (idxErr) {
        console.error('paytr-callback index:', idxErr);
      }

      try {
        await sendOrderEmails(updated, {
          pdfUrl: updated.pdfUrl,
          siteUrl: updated.siteUrl,
        });
      } catch (emailErr) {
        console.error('paytr-callback email:', emailErr);
      }
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

      try {
        const index = await store.get('order-index', { type: 'json' });
        if (Array.isArray(index)) {
          const next = index.map((row) =>
            row.id === orderId ? { ...row, status: 'cancelled' } : row,
          );
          await store.setJSON('order-index', next);
        }
      } catch (idxErr) {
        console.error('paytr-callback failed index:', idxErr);
      }
    }
  } catch (err) {
    // Hash doğrulandı — PayTR'ye OK dön; işlem tekrar bildirim göndermesin.
    console.error('paytr-callback store:', err);
  }

  return paytrOkResponse();
};
