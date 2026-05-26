/**
 * Admin: sipariş durumu güncelle (onay / red / IBAN)
 */
const { getOrderStore } = require('../../lib/orderBlobStore.cjs');
const { loadPromotions, appendCouponAndSave } = require('../../lib/catalogPromotions.cjs');
const { buildDeliveryRewardCoupon } = require('../../lib/promotions.cjs');
const { sendShippedEmail } = require('../../lib/orderEmail.cjs');
const { upsertOrderIndexRow } = require('../../lib/orderIndex.cjs');
const { resolveCanonicalSiteUrl } = require('../../lib/canonicalSiteUrl.cjs');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
  'Content-Type': 'application/json',
};

function allowedPasswords() {
  return [
    process.env.ADMIN_PASSWORD,
    process.env.CATALOG_ADMIN_PASSWORD,
    process.env.VITE_ADMIN_PASSWORD,
  ]
    .map((s) => String(s || '').trim())
    .filter(Boolean);
}

function verifyAdmin(headers) {
  const given = String(headers['x-admin-key'] || headers['X-Admin-Key'] || '').trim();
  if (!given) return false;
  return allowedPasswords().includes(given);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!verifyAdmin(event.headers)) {
    return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ error: 'Yetkisiz' }) };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Geçersiz JSON' }) };
  }

  const id = String(body.id || '').trim();
  const status = String(body.status || '').trim();
  if (!id || !status) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'id ve status gerekli' }) };
  }

  try {
    const store = getOrderStore(event);
    const key = `order-${id}`;
    const order = await store.get(key, { type: 'json' });
    if (!order) {
      return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: 'Sipariş bulunamadı' }) };
    }

    const now = new Date().toISOString();
    const prevStatus = order.status;
    const prevCarrier = String(order.shippingCarrier || '').trim();
    const prevTracking = String(order.trackingNumber || '').trim();
    order.status = status;
    order.orderStatus = status;
    order.updatedAt = now;

    if (status === 'cancelled') {
      order.cancelReason = String(body.cancelReason || '').trim();
      order.cancelNote = String(body.cancelNote || '').trim();
      order.cancelledAt = now;
    } else if (status === 'confirmed' || status === 'iban_verified' || status === 'kargoya_hazir') {
      order.confirmedAt = now;
      if (body.cancelReason) order.cancelReason = '';
      if (body.cancelNote) order.cancelNote = '';
    } else if (status === 'packed') {
      order.packedAt = now;
      if (body.labelPrintedAt !== false) order.labelPrintedAt = now;
    } else if (status === 'shipped') {
      order.shippedAt = now;
      order.shippingCarrier = String(body.shippingCarrier || order.shippingCarrier || '').trim();
      order.trackingNumber = String(body.trackingNumber || order.trackingNumber || '').trim();
    } else if (status === 'completed') {
      order.completedAt = now;
    }

    if (body.shippingCarrier != null) {
      order.shippingCarrier = String(body.shippingCarrier).trim();
    }
    if (body.trackingNumber != null) {
      order.trackingNumber = String(body.trackingNumber).trim();
    }

    await store.setJSON(key, order);
    await upsertOrderIndexRow(store, order, id, 'orders-update');

    let shippedEmail = null;
    if (status === 'shipped') {
      const newCarrier = String(order.shippingCarrier || '').trim();
      const newTracking = String(order.trackingNumber || '').trim();
      const shouldNotify =
        prevStatus !== 'shipped' ||
        newCarrier !== prevCarrier ||
        newTracking !== prevTracking;
      if (shouldNotify) {
        try {
          const siteUrl = resolveCanonicalSiteUrl(order.siteUrl, process.env.SITE_URL, process.env.URL);
          shippedEmail = await sendShippedEmail(order, {
            siteUrl,
            isUpdate: prevStatus === 'shipped',
          });
        } catch (mailErr) {
          console.error('shipped-email:', mailErr);
          shippedEmail = { ok: false, summary: mailErr.message || 'Kargo maili gönderilemedi' };
        }
      }
    }

    let rewardCoupon = null;
    if (status === 'completed') {
      try {
        const promos = await loadPromotions(event);
        const draft = buildDeliveryRewardCoupon(
          promos,
          order.customer?.email,
          order.orderNumber || order.id,
        );
        if (draft) {
          rewardCoupon = await appendCouponAndSave(event, draft);
          if (rewardCoupon?.code) {
            order.rewardCouponCode = rewardCoupon.code;
            await store.setJSON(key, order);
          }
        }
      } catch (rewardErr) {
        console.error('delivery-reward:', rewardErr);
      }
    }

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        ok: true,
        order,
        rewardCoupon: rewardCoupon?.code || null,
        shippedEmail,
      }),
    };
  } catch (err) {
    console.error('[orders-update] error:', err?.stack || err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: err.message || 'Güncellenemedi' }),
    };
  }
};
