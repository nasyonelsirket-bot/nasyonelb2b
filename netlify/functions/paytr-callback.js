/**
 * PayTR bildirim URL — ödeme sonucu (2. adım).
 */
const { getOrderStore } = require('../../lib/orderBlobStore.cjs');
const { sendOrderEmails } = require('../../lib/orderEmail.cjs');
const { markCouponUsed } = require('../../lib/catalogPromotions.cjs');
const { getPaytrConfig, verifyCallbackHash, parseFormBody } = require('../../lib/paytrHelpers.cjs');

exports.handler = async (event) => {
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

  const post = parseFormBody(event.body);
  const { merchant_oid: merchantOid, status, total_amount: totalAmount, hash } = post;

  if (!merchantOid || !status || !totalAmount || !hash) {
    console.error('paytr-callback: eksik alan', post);
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

  const orderId = String(merchantOid).replace(/^NT/, '');
  if (!orderId) {
    return { statusCode: 400, body: 'Geçersiz sipariş' };
  }

  try {
    const store = getOrderStore(event);
    const key = `order-${orderId}`;
    const order = await store.get(key, { type: 'json' });

    if (!order) {
      console.error('paytr-callback: sipariş yok', orderId);
      return { statusCode: 404, body: 'Sipariş bulunamadı' };
    }

    if (order.paymentStatus === 'success' || order.status === 'confirmed') {
      return { statusCode: 200, headers: { 'Content-Type': 'text/plain' }, body: 'OK' };
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
    console.error('paytr-callback store:', err);
    return { statusCode: 500, body: '' };
  }

  return { statusCode: 200, headers: { 'Content-Type': 'text/plain' }, body: 'OK' };
};
