/**
 * Admin kataloğunu siteye yayınlar (Netlify Blobs).
 */
const { getStore } = require('@netlify/blobs');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
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

function verifyPassword(body, headers) {
  const given = String(
    body?.password || headers['x-admin-key'] || headers['X-Admin-Key'] || '',
  ).trim();

  if (!given) {
    return {
      ok: false,
      status: 401,
      error: 'Şifre gönderilmedi',
      hint: 'Admin panelinden çıkış yapıp tekrar giriş yapın, ardından Siteye Yayınla deyin.',
    };
  }

  const allowed = allowedPasswords();
  if (!allowed.length) {
    return {
      ok: false,
      status: 503,
      error: 'Sunucuda admin şifresi tanımlı değil',
      hint:
        'Netlify → Site configuration → Environment variables → ADMIN_PASSWORD ekleyin (admin giriş şifrenizle aynı). Scope: All veya Functions. Sonra Clear cache and deploy.',
    };
  }

  if (!allowed.includes(given)) {
    return {
      ok: false,
      status: 401,
      error: 'Yetkisiz',
      hint:
        'Girdiğiniz şifre sunucudaki ADMIN_PASSWORD ile eşleşmiyor. Netlify ortam değişkeninde ADMIN_PASSWORD, admin giriş şifrenizle birebir aynı olmalı.',
    };
  }

  return { ok: true };
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

  const auth = verifyPassword(body, event.headers);
  if (!auth.ok) {
    return {
      statusCode: auth.status,
      headers: HEADERS,
      body: JSON.stringify({ error: auth.error, hint: auth.hint }),
    };
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

    const tasks = [
      store.setJSON('products', products),
      store.setJSON('categories', categories),
      store.setJSON('banners', banners),
      store.set('updatedAt', updatedAt),
    ];
    if (settings) {
      tasks.push(store.setJSON('settings', settings));
    }

    await Promise.all(tasks);

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
      body: JSON.stringify({
        error: err.message || 'Kayıt başarısız',
        hint: 'Netlify Blobs etkin mi kontrol edin (Pro plan gerekebilir).',
      }),
    };
  }
};
