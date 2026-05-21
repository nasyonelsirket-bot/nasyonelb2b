/**
 * Admin: kayıtlı sipariş listesi
 */
const { getOrderStore } = require('../../lib/orderBlobStore.cjs');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
  'Content-Type': 'application/json',
};

function allowedPasswords() {
  return [
    process.env.ADMIN_PASSWORD,
    process.env.CATALOG_ADMIN_PASSWORD,
    process.env.VITE_ADMIN_PASSWORD,
  ]
    .map((s) => String(s || '').trim())
    .filter(Boolean);
}

function verifyAdmin(headers) {
  const given = String(headers['x-admin-key'] || headers['X-Admin-Key'] || '').trim();
  if (!given) return false;
  return allowedPasswords().includes(given);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!verifyAdmin(event.headers)) {
    return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ error: 'Yetkisiz' }) };
  }

  try {
    const store = getOrderStore(event);
    let index = [];
    try {
      index = await store.get('order-index', { type: 'json' });
    } catch {
      index = [];
    }
    if (!Array.isArray(index)) index = [];

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ orders: index }),
    };
  } catch (err) {
    console.error('orders-list:', err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: err.message || 'Liste alınamadı' }),
    };
  }
};
