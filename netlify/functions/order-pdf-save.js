/**
 * Sipariş PDF'ini sunucuya yükler, paylaşılabilir link döner.
 */
const crypto = require('crypto');
const { getOrderStore } = require('../../lib/orderBlobStore.cjs');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const MAX_BYTES = 4 * 1024 * 1024;

function siteBaseUrl(event) {
  if (process.env.URL) return String(process.env.URL).replace(/\/$/, '');
  const host = event.headers['x-forwarded-host'] || event.headers.host || '';
  const proto = event.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`.replace(/\/$/, '');
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Geçersiz JSON' }) };
  }

  const pdfBase64 = String(body.pdfBase64 || '').trim();
  if (!pdfBase64) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'PDF verisi yok' }) };
  }

  let buffer;
  try {
    buffer = Buffer.from(pdfBase64, 'base64');
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'PDF kodlaması geçersiz' }) };
  }

  if (!buffer.length || buffer.length > MAX_BYTES) {
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({ error: 'PDF çok büyük veya boş' }),
    };
  }

  const id = crypto.randomBytes(10).toString('hex');
  const fileName = String(body.fileName || 'siparis.pdf').slice(0, 120);
  const customer = body.customer && typeof body.customer === 'object' ? body.customer : {};

  try {
    const store = getOrderStore(event);
    await Promise.all([
      store.set(`pdf-${id}`, buffer, {
        metadata: { contentType: 'application/pdf', fileName },
      }),
      store.setJSON(`meta-${id}`, {
        fileName,
        customer,
        createdAt: new Date().toISOString(),
      }),
    ]);

    const base = siteBaseUrl(event);
    const url = `${base}/api/order-pdf?id=${id}`;

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ ok: true, id, url }),
    };
  } catch (err) {
    console.error('order-pdf-save:', err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({
        error: err.message || 'PDF kaydedilemedi',
        hint: 'Netlify Blobs etkin olmalı (deploy sonrası deneyin).',
      }),
    };
  }
};
