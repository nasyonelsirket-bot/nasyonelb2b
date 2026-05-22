/**
 * Sipariş kaydı + e-posta bildirimi (Resend)
 */
const crypto = require('crypto');
const { getOrderStore } = require('../../lib/orderBlobStore.cjs');
const { sendOrderEmails } = require('../../lib/orderEmail.cjs');
const { allocateOrderNumber } = require('../../lib/orderNumber.cjs');
const { loadPromotions, markCouponUsed } = require('../../lib/catalogPromotions.cjs');
const { validateCoupon, computeCartTotals } = require('../../lib/promotions.cjs');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function siteBaseUrl(event) {
  if (process.env.URL) return String(process.env.URL).replace(/\/$/, '');
  const host = event.headers['x-forwarded-host'] || event.headers.host || '';
  const proto = event.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`.replace(/\/$/, '');
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Geçersiz JSON' }) };
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Sipariş boş' }) };
  }

  const customer = body.customer && typeof body.customer === 'object' ? body.customer : {};
  const customerName = String(customer.name || customer.companyName || '').trim();
  if (!customerName) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Ad soyad gerekli' }) };
  }
  if (!String(customer.phone || '').trim()) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Telefon gerekli' }) };
  }
  if (!String(customer.email || '').trim()) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'E-posta gerekli' }) };
  }
  if (!String(customer.address || '').trim()) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Adres gerekli' }) };
  }

  const id = crypto.randomBytes(10).toString('hex');
  const paymentMethod = body.paymentMethod === 'iban' ? 'iban' : 'cod';
  const status =
    paymentMethod === 'iban' ? 'pending_iban_check' : 'pending_cod';

  const itemsSubtotal = items.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
    0,
  );
  const clientSubtotal = Number(body.discount?.subtotal);
  const subtotal = clientSubtotal > 0 ? clientSubtotal : itemsSubtotal;

  let couponResult = null;
  const couponCode = String(body.couponCode || body.discount?.couponCode || '').trim();
  if (couponCode) {
    try {
      const promos = await loadPromotions(event);
      couponResult = validateCoupon(
        promos.coupons,
        couponCode,
        customer.email,
        subtotal,
      );
      if (!couponResult.ok) {
        return {
          statusCode: 400,
          headers: HEADERS,
          body: JSON.stringify({ error: couponResult.error }),
        };
      }
    } catch (promoErr) {
      console.error('coupon check:', promoErr);
      return {
        statusCode: 500,
        headers: HEADERS,
        body: JSON.stringify({ error: 'Kupon doğrulanamadı' }),
      };
    }
  }

  let promosForTotals = null;
  try {
    promosForTotals = await loadPromotions(event);
  } catch {
    promosForTotals = null;
  }
  const serverTotals = computeCartTotals({
    subtotal,
    paymentMethod,
    couponResult,
    promotions: promosForTotals,
  });

  const base = siteBaseUrl(event);
  const pdfUrl = `${base}/api/order-pdf?id=${id}`;

  const discount = {
    ...(body.discount && typeof body.discount === 'object' ? body.discount : {}),
    subtotal: serverTotals.subtotal,
    discountAmount: serverTotals.discountAmount,
    grandTotal: serverTotals.grandTotal,
    parts: serverTotals.parts,
    couponCode: serverTotals.couponCode,
  };

  const payload = {
    id,
    orderNumber: null,
    siteName: body.siteName || 'Nasyonel Toys',
    siteUrl: String(body.siteUrl || '').trim() || base,
    siteLogoUrl: body.siteLogoUrl || '',
    pdfUrl,
    pdfSettings: body.pdfSettings || null,
    customer: {
      name: customerName,
      phone: String(customer.phone || '').trim(),
      email: String(customer.email || '').trim(),
      address: String(customer.address || '').trim(),
      city: String(customer.city || '').trim(),
      district: String(customer.district || '').trim(),
    },
    items,
    discount,
    couponCode: serverTotals.couponCode || null,
    shipping: body.shipping || null,
    paymentMethod,
    orderTotal: body.orderTotal,
    ibanInfo: body.ibanInfo || null,
    notifyEmail: body.notifyEmail || process.env.ORDER_NOTIFY_EMAIL || '',
    status,
    createdAt: new Date().toISOString(),
  };

  try {
    const store = getOrderStore(event);
    const orderNumber = String(body.orderNumber || '').trim() || (await allocateOrderNumber(store));
    payload.orderNumber = orderNumber;

    await store.setJSON(`order-${id}`, payload);

    let index = [];
    try {
      index = await store.get('order-index', { type: 'json' });
    } catch {
      index = [];
    }
    if (!Array.isArray(index)) index = [];

    index.unshift({
      id,
      orderNumber,
      createdAt: payload.createdAt,
      customerName,
      customerEmail: payload.customer.email,
      orderTotal: payload.orderTotal,
      paymentMethod,
      status,
      itemCount: items.length,
    });
    await store.setJSON('order-index', index.slice(0, 500));

    if (serverTotals.couponCode) {
      try {
        await markCouponUsed(event, serverTotals.couponCode);
      } catch (useErr) {
        console.error('coupon used:', useErr);
      }
    }

    let emailResult = { skipped: true };
    try {
      emailResult = await sendOrderEmails(payload, { pdfUrl, siteUrl: payload.siteUrl });
    } catch (emailErr) {
      console.error('order email:', emailErr);
      emailResult = { error: emailErr.message };
    }

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        ok: true,
        id,
        orderNumber,
        url: pdfUrl,
        email: emailResult,
      }),
    };
  } catch (err) {
    console.error('order-pdf-save:', err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({
        error: err.message || 'Sipariş kaydedilemedi',
        hint: 'Netlify Blobs etkin olmalı.',
      }),
    };
  }
};
