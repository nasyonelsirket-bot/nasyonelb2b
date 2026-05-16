/**
 * Sipariş verisini kaydeder, PDF linki döner (PDF sunucuda üretilir).
 */
const crypto = require('crypto');
const { getOrderStore } = require('../../lib/orderBlobStore.cjs');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

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

  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Sipariş boş' }) };
  }

  const customer = body.customer && typeof body.customer === 'object' ? body.customer : {};
  if (!String(customer.companyName || '').trim()) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Firma adı gerekli' }) };
  }

  const id = crypto.randomBytes(10).toString('hex');
  const payload = {
    siteName: body.siteName || 'Nasyonel Toys',
    siteLogoUrl: body.siteLogoUrl || '',
    pdfSettings: body.pdfSettings || null,
    customer,
    items,
    discount: body.discount || null,
    shipping: body.shipping || null,
    orderTotal: body.orderTotal,
    fileName: String(body.fileName || 'siparis.pdf').slice(0, 120),
    createdAt: new Date().toISOString(),
  };

  try {
    const store = getOrderStore(event);
    await store.setJSON(`order-${id}`, payload);

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
        error: err.message || 'Sipariş kaydedilemedi',
        hint: 'Netlify Blobs etkin olmalı.',
      }),
    };
  }
};
