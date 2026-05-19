/**
 * Kayıtlı siparişten PDF üretir (iOS uyumlu sunucu tarafı font).
 */
const { getOrderStore } = require('../../lib/orderBlobStore.cjs');
const { generateOrderPdfBuffer } = require('../../lib/orderPdfServer.cjs');

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
    const order = await store.get(`order-${id}`, { type: 'json' });

    if (!order || !order.items?.length) {
      return { statusCode: 404, headers: { 'Content-Type': 'text/plain' }, body: 'Sipariş bulunamadı' };
    }

    const buffer = generateOrderPdfBuffer(order);
    const fileName = String(order.fileName || 'siparis.pdf').replace(/"/g, '');

    return {
      statusCode: 200,
      headers: {
        ...HEADERS_PDF,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error('order-pdf-get:', err?.message || err, err?.stack);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: 'PDF oluşturulamadı',
    };
  }
};
