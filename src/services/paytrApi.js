/** Tarayıcının PayTR'ye gidecek gerçek dış IP'sini al (token doğrulaması için). */
async function fetchClientIp() {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
    if (!res.ok) return '';
    const data = await res.json();
    return typeof data.ip === 'string' ? data.ip.trim() : '';
  } catch {
    return '';
  }
}

/** PayTR iFrame API — sipariş hazırla, iframe token döndür */
export async function startPaytrPayment(payload) {
  const userIp = payload.userIp || (await fetchClientIp());
  const res = await fetch('/api/paytr/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, userIp }),
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
