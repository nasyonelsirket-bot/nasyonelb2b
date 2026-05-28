import { validatePaymentTotals } from '@/utils/cartCheckoutTotals';

/** Tarayıcıdan dış IPv4 al (PayTR yalnızca IPv4 kabul eder) */
export async function fetchClientIpv4() {
  try {
    const res = await fetch('https://api.ipify.org?format=json', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return '';
    const data = await res.json();
    const ip = String(data?.ip || '').trim();
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(ip) ? ip : '';
  } catch {
    return '';
  }
}

function pickPaytrError(data, fallback, status) {
  if (!data || typeof data !== 'object') {
    return status ? `${fallback} (HTTP ${status})` : fallback;
  }
  const base = data.reason || data.paytr?.reason || data.error || fallback;
  if (data.detail && typeof data.detail === 'string' && !base.includes(data.detail)) {
    return `${base} — ${data.detail}`;
  }
  return status && !String(base).includes(String(status)) ? `${base} (HTTP ${status})` : base;
}

function assertPaymentPayload(payload) {
  const finalTotal = payload?.finalTotal ?? payload?.orderTotal;
  const check = validatePaymentTotals({
    finalTotal,
    subtotal: payload?.discount?.subtotal ?? payload?._meta?.subtotal,
    discount: payload?.discount,
    shippingFee: payload?.shipping?.shippingFee ?? payload?._meta?.shippingFee,
  });
  if (!check.ok) {
    throw new Error(check.errors.join(' · '));
  }
  if (!Array.isArray(payload?.items) || !payload.items.length) {
    throw new Error('Sepet boş — ödeme başlatılamadı');
  }
}

/** PayTR iFrame API — sipariş hazırla, ödeme sayfasında iframe token al */
export async function startPaytrPayment(payload) {
  assertPaymentPayload(payload);

  const userIp = payload.userIp || (await fetchClientIpv4());
  const body = { ...payload, userIp: userIp || undefined };
  delete body._meta;

  if (import.meta.env.DEV || typeof console !== 'undefined') {
    console.log('[PayTR] payment request payload', {
      orderTotal: body.orderTotal,
      finalTotal: body.finalTotal,
      subtotal: body.discount?.subtotal,
      grandTotal: body.discount?.grandTotal,
      discountAmount: body.discount?.discountAmount,
      shippingFee: body.shipping?.shippingFee,
      itemCount: body.items?.length,
      items: body.items?.map((it) => ({
        id: it.id,
        sku: it.sku,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
      })),
      couponCode: body.couponCode,
      customerEmail: body.customer?.email,
    });
  }

  const res = await fetch('/api/paytr/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(pickPaytrError(data, 'Ödeme başlatılamadı', res.status));
  }
  if (!data?.orderId) {
    throw new Error(pickPaytrError(data, 'Sipariş oluşturulamadı', res.status));
  }
  return data;
}

/** Ödeme sayfasında güncel IP ile iFrame token alır */
export async function fetchPaytrIframeToken(orderId) {
  const userIp = await fetchClientIpv4();
  const res = await fetch('/api/paytr/resign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, userIp: userIp || undefined }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(pickPaytrError(data, 'PayTR ödeme ekranı açılamadı', res.status));
  }
  if (!data?.iframeUrl || !data?.iframeToken) {
    throw new Error(pickPaytrError(data, 'PayTR iFrame yanıtı eksik (token yok)', res.status));
  }
  return data;
}

/** PayTR callback sonrası ödeme durumunu doğrular (success sayfası için). */
export async function fetchPaymentStatus(orderId) {
  const res = await fetch(`/api/orders/payment-status?id=${encodeURIComponent(orderId)}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Ödeme durumu alınamadı');
  }
  return data;
}
