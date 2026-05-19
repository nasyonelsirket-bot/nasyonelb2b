const ORDER_PDF_SAVE = '/api/order-pdf/save';

/** Sipariş verisini sunucuya kaydeder, PDF linki döner (PDF sunucuda üretilir) */
export async function uploadOrderForPdfLink(order) {
  const res = await fetch(ORDER_PDF_SAVE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = [data.error, data.hint].filter(Boolean).join(' — ') || 'Sipariş kaydedilemedi';
    throw new Error(msg);
  }
  if (!data?.url) throw new Error('Sipariş linki alınamadı');
  return data;
}
