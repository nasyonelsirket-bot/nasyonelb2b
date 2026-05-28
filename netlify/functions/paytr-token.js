/**
 * PayTR iFrame API — sipariş kaydı (ödeme token'ı /odeme sayfasında alınır).
 */
const crypto = require('crypto');
const { getOrderStore } = require('../../lib/orderBlobStore.cjs');
const { allocateOrderNumber } = require('../../lib/orderNumber.cjs');
const { loadPromotions } = require('../../lib/catalogPromotions.cjs');
const { validateCoupon, computeCartTotals } = require('../../lib/promotions.cjs');
const { cancelSupersededPendingOrders } = require('../../lib/orderPending.cjs');
const { registerMerchantOidMapping, upsertOrderIndexRow } = require('../../lib/orderIndex.cjs');
const {
  getPaytrConfig,
  analyzePaytrAmount,
  resolvePaytrUserIpDetailedAsync,
  mintPaytrMerchantOid,
  siteBaseUrl,
} = require('../../lib/paytrHelpers.cjs');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

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

  const minQtyResult = validateOrderItemsMinQty(items);
  if (!minQtyResult.ok) {
    const first = minQtyResult.violations[0];
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({
        error: first
          ? `"${first.name}" için minimum ${first.minQty} adet gerekli`
          : 'Minimum sipariş adedi kuralları sağlanmıyor',
      }),
    };
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

  let config;
  try {
    config = getPaytrConfig();
  } catch (err) {
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: err.message }) };
  }

  const id = crypto.randomBytes(10).toString('hex');
  const merchantOid = mintPaytrMerchantOid(id);
  const paymentMethod = 'paytr';
  const status = 'pending_payment';

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
      couponResult = validateCoupon(promos.coupons, couponCode, customer.email, subtotal);
      if (!couponResult.ok) {
        return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: couponResult.error }) };
      }
    } catch (promoErr) {
      console.error('paytr-token coupon:', promoErr);
      return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'Kupon doğrulanamadı' }) };
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

  const payableShipping = 0;
  const orderTotal = Math.round((serverTotals.grandTotal + payableShipping) * 100) / 100;

  if (!Number.isFinite(orderTotal) || orderTotal <= 0) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Geçersiz tutar' }) };
  }

  const base = siteBaseUrl(event);
  const pdfUrl = `${base}/api/order-pdf?id=${id}`;
  const email = String(customer.email).trim().slice(0, 100);
  const ipResult = await resolvePaytrUserIpDetailedAsync(event, body);
  const userIp = ipResult.ip;
  if (!userIp) {
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Ödeme için müşteri IP adresi alınamadı. Sayfayı yenileyip tekrar deneyin.' }),
    };
  }

  const amountAnalysis = analyzePaytrAmount(orderTotal, 'kurus');
  const paymentAmount = String(amountAnalysis.parsedKurusAmount);

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
    orderId: id,
    orderNumber: null,
    siteName: body.siteName || 'Nasyonel Toys',
    siteUrl: String(body.siteUrl || '').trim() || base,
    siteLogoUrl: body.siteLogoUrl || '',
    pdfUrl,
    pdfSettings: body.pdfSettings || null,
    customer: {
      name: customerName,
      phone: String(customer.phone || '').trim(),
      email,
      address: String(customer.address || '').trim(),
      city: String(customer.city || '').trim(),
      district: String(customer.district || '').trim(),
    },
    items,
    discount,
    couponCode: serverTotals.couponCode || null,
    shipping: body.shipping || null,
    paymentMethod,
    orderTotal,
    notifyEmail: body.notifyEmail || process.env.ORDER_NOTIFY_EMAIL || '',
    status,
    orderStatus: status,
    paymentStatus: 'pending',
    payment_status: 'pending',
    paid: false,
    merchantOid,
    paytrMerchantOid: merchantOid,
    paymentAmount,
    paytrMode: 'iframe',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const store = getOrderStore(event);
    const orderNumber = String(body.orderNumber || '').trim() || (await allocateOrderNumber(store));
    payload.orderNumber = orderNumber;

    console.log('[paytr-token] order created', {
      order_id: id,
      merchant_oid: merchantOid,
      orderTotal,
      paymentAmount,
      status,
    });

    await store.setJSON(`order-${id}`, payload);
    console.log('[paytr-token] order saved', { order_id: id, blob_key: `order-${id}` });

    await registerMerchantOidMapping(store, merchantOid, id);

    try {
      await cancelSupersededPendingOrders(store, { customerEmail: email, excludeId: id });
    } catch (dedupErr) {
      console.error('[paytr-token] dedup error:', dedupErr);
    }

    await upsertOrderIndexRow(store, payload, id, 'paytr-token-create');

    console.log('[paytr-token] admin order sync complete', {
      order_id: id,
      orderNumber,
      merchantOid,
      userIp,
      testMode: config.testMode,
    });

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        ok: true,
        mode: 'iframe',
        orderId: id,
        orderNumber,
        merchantOid,
        orderTotal,
      }),
    };
  } catch (err) {
    console.error('[paytr-token] error:', err?.stack || err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: err.message || 'Ödeme başlatılamadı' }),
    };
  }
};
