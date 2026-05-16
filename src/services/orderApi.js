const ORDER_PDF_SAVE = '/api/order-pdf/save';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('PDF okunamadı'));
    reader.readAsDataURL(blob);
  });
}

/** PDF'i sunucuya yükler, paylaşılabilir link döner */
export async function uploadOrderPdf(blob, fileName, customer) {
  const pdfBase64 = await blobToBase64(blob);
  const res = await fetch(ORDER_PDF_SAVE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pdfBase64,
      fileName,
      customer: {
        companyName: customer?.companyName || '',
        contactName: customer?.contactName || '',
        phone: customer?.phone || '',
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = [data.error, data.hint].filter(Boolean).join(' — ') || 'PDF yüklenemedi';
    throw new Error(msg);
  }
  if (!data?.url) throw new Error('Sipariş linki alınamadı');
  return data;
}
