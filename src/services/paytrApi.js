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

function pickPaytrError(data, fallback) {
  if (!data || typeof data !== 'object') return fallback;
  return data.reason || data.paytr?.reason || data.error || fallback;
}

/** PayTR iFrame API — sipariş hazırla, ödeme sayfasında iframe token al */
export async function startPaytrPayment(payload) {
  const userIp = payload.userIp || (await fetchClientIpv4());
  const res = await fetch('/api/paytr/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, userIp: userIp || undefined }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(pickPaytrError(data, 'Ödeme başlatılamadı'));
  }
  if (!data?.orderId) {
    throw new Error(pickPaytrError(data, 'Sipariş oluşturulamadı'));
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
    throw new Error(pickPaytrError(data, 'PayTR ödeme ekranı açılamadı'));
  }
  if (!data?.iframeUrl || !data?.iframeToken) {
    throw new Error(pickPaytrError(data, 'PayTR iFrame yanıtı eksik (token yok)'));
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
