/**
 * PayTR Direct API — sipariş kaydı + ödeme formu alanları.
 */
const crypto = require('crypto');
const { getOrderStore } = require('../../lib/orderBlobStore.cjs');
const { allocateOrderNumber } = require('../../lib/orderNumber.cjs');
const { loadPromotions } = require('../../lib/catalogPromotions.cjs');
const { validateCoupon, computeCartTotals } = require('../../lib/promotions.cjs');
const { cancelSupersededPendingOrders } = require('../../lib/orderPending.cjs');
const {
  getPaytrConfig,
  buildDirectUserBasket,
  formatDirectPaymentAmount,
  createDirectPaytrTokenHash,
  resolveClientIp,
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
  const merchantOid = `NT${id}`;
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

  const shippingFee = Number(body.shipping?.shippingFee) || 0;
  const shippingEligible = body.shipping?.eligible === true;
  const payableShipping = shippingEligible ? 0 : shippingFee;
  const orderTotal = Math.round((serverTotals.grandTotal + payableShipping) * 100) / 100;

  if (!Number.isFinite(orderTotal) || orderTotal <= 0) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Geçersiz tutar' }) };
  }

  const base = siteBaseUrl(event);
  const pdfUrl = `${base}/api/order-pdf?id=${id}`;
  const email = String(customer.email).trim().slice(0, 100);
  const paymentAmount = formatDirectPaymentAmount(orderTotal);
  const userBasket = buildDirectUserBasket(items);
  const userIp = resolveClientIp(event);
  const installmentCount = '0';
  const paymentType = 'card';
  const non3d = '0';

  const paytrToken = createDirectPaytrTokenHash({
    merchantId: config.merchantId,
    merchantKey: config.merchantKey,
    merchantSalt: config.merchantSalt,
    userIp,
    merchantOid,
    email,
    paymentAmount,
    paymentType,
    installmentCount,
    currency: config.currency,
    testMode: config.testMode,
    non3d,
  });

  const userName = customerName.slice(0, 60);
  const userAddress = [customer.address, customer.district, customer.city]
    .filter(Boolean)
    .join(', ')
    .slice(0, 400);
  const userPhone = String(customer.phone || '').replace(/\D/g, '').slice(0, 20);

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
    merchantOid,
    paymentAmount,
    createdAt: new Date().toISOString(),
  };

  try {
    const store = getOrderStore(event);
    const orderNumber = String(body.orderNumber || '').trim() || (await allocateOrderNumber(store));
    payload.orderNumber = orderNumber;

    await store.setJSON(`order-${id}`, payload);

    try {
      await cancelSupersededPendingOrders(store, { customerEmail: email, excludeId: id });
    } catch (dedupErr) {
      console.error('paytr-token dedup:', dedupErr);
    }

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
      customerEmail: email,
      orderTotal,
      paymentMethod,
      status,
      itemCount: items.length,
    });
    await store.setJSON('order-index', index.slice(0, 500));

    const form = {
      merchant_id: config.merchantId,
      user_ip: userIp,
      merchant_oid: merchantOid,
      email,
      payment_type: paymentType,
      payment_amount: paymentAmount,
      installment_count: installmentCount,
      currency: config.currency,
      test_mode: config.testMode,
      non_3d: non3d,
      no_installment: config.noInstallment,
      max_installment: config.maxInstallment,
      merchant_ok_url: `${base}/odeme/basarili?oid=${id}`,
      merchant_fail_url: `${base}/odeme/hata?oid=${id}`,
      user_name: userName,
      user_address: userAddress || '-',
      user_phone: userPhone,
      user_basket: userBasket,
      debug_on: config.debugOn,
      lang: 'tr',
      client_lang: 'tr',
      timeout_limit: config.timeoutLimit,
      paytr_token: paytrToken,
      non3d_test_failed: '0',
    };

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        ok: true,
        mode: 'direct',
        orderId: id,
        orderNumber,
        merchantOid,
        orderTotal,
        form,
      }),
    };
  } catch (err) {
    console.error('paytr-token:', err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: err.message || 'Ödeme başlatılamadı' }),
    };
  }
};
