/** PayTR Direct API — sipariş hazırla, imzalı form alanları döndür */
async function fetchClientIp() {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    const ip = String(data?.ip || '').trim();
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(ip) ? ip : undefined;
  } catch {
    return undefined;
  }
}

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
  if (!data?.form || !data?.orderId) {
    throw new Error('PayTR yanıtı geçersiz');
  }
  return data;
}
