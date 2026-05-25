/** PayTR iFrame API — sipariş hazırla, iframe token döndür */
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
  if (!data?.iframeToken || !data?.orderId) {
    throw new Error('PayTR yanıtı geçersiz');
  }
  return data;
}
