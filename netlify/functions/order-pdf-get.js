/**
 * Kayıtlı sipariş PDF'ini döner (WhatsApp linki).
 */
const { getOrderStore } = require('../../lib/orderBlobStore.cjs');

const HEADERS_PDF = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'private, max-age=604800',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS_PDF, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: { 'Content-Type': 'text/plain' }, body: 'Method not allowed' };
  }

  const id = String(event.queryStringParameters?.id || '').trim();
  if (!id || !/^[a-f0-9]{16,24}$/i.test(id)) {
    return { statusCode: 400, headers: { 'Content-Type': 'text/plain' }, body: 'Geçersiz sipariş linki' };
  }

  try {
    const store = getOrderStore(event);
    const [pdf, meta] = await Promise.all([
      store.get(`pdf-${id}`),
      store.get(`meta-${id}`, { type: 'json' }).catch(() => null),
    ]);

    if (!pdf) {
      return { statusCode: 404, headers: { 'Content-Type': 'text/plain' }, body: 'Sipariş bulunamadı' };
    }

    const buffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
    const fileName = meta?.fileName || 'siparis.pdf';

    return {
      statusCode: 200,
      headers: {
        ...HEADERS_PDF,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName.replace(/"/g, '')}"`,
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error('order-pdf-get:', err);
    return { statusCode: 500, headers: { 'Content-Type': 'text/plain' }, body: 'PDF yüklenemedi' };
  }
};
