/** PayTR iFrame API — sipariş hazırla, ödeme sayfasında iframe token al */
export async function startPaytrPayment(payload) {
  const res = await fetch('/api/paytr/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = [data.error, data.paytr?.reason].filter(Boolean).join(' — ') || 'Ödeme başlatılamadı';
    throw new Error(msg);
  }
  if (!data?.orderId) {
    throw new Error('PayTR yanıtı geçersiz');
  }
  return data;
}

/** Ödeme sayfasında güncel IP ile iFrame token alır */
export async function fetchPaytrIframeToken(orderId) {
  const res = await fetch('/api/paytr/resign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = [data.error, data.paytr?.reason].filter(Boolean).join(' — ') || 'PayTR ödeme ekranı açılamadı';
    throw new Error(msg);
  }
  if (!data?.iframeUrl || !data?.iframeToken) {
    throw new Error('PayTR iFrame yanıtı geçersiz');
  }
  return data;
}
