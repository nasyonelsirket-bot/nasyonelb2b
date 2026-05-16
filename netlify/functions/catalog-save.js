/**
 * Admin kataloğunu siteye yayınlar (Netlify Blobs).
 */
const { getStore } = require('@netlify/blobs');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function checkPassword(body, headers) {
  const expected =
    process.env.ADMIN_PASSWORD ||
    process.env.CATALOG_ADMIN_PASSWORD ||
    process.env.VITE_ADMIN_PASSWORD;
  if (!expected) return false;
  const given = body?.password || headers['x-admin-key'] || headers['X-Admin-Key'];
  return given === expected;
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

  if (!checkPassword(body, event.headers)) {
    return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ error: 'Yetkisiz' }) };
  }

  const products = Array.isArray(body.products) ? body.products : [];
  const categories = Array.isArray(body.categories) ? body.categories : [];
  const banners = Array.isArray(body.banners) ? body.banners : [];
  const settings = body.settings && typeof body.settings === 'object' ? body.settings : null;

  if (!products.length) {
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Yayınlanacak ürün yok' }),
    };
  }

  try {
    const store = getStore({ name: 'b2b-catalog', consistency: 'strong' });
    const updatedAt = new Date().toISOString();

    await Promise.all([
      store.setJSON('products', products),
      store.setJSON('categories', categories),
      store.setJSON('banners', banners),
      settings ? store.setJSON('settings', settings) : store.delete('settings'),
      store.set('updatedAt', updatedAt),
    ]);

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        ok: true,
        productCount: products.length,
        categoryCount: categories.length,
        updatedAt,
      }),
    };
  } catch (err) {
    console.error('catalog-save:', err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: err.message || 'Kayıt başarısız' }),
    };
  }
};
