/**
 * Admin kataloğunu siteye yayınlar (Netlify Blobs).
 */
const { getCatalogStore } = require('../../lib/catalogBlobStore.cjs');
const { sanitizeProductsSeo } = require('../../lib/productSeo.cjs');
const { resolveCanonicalSiteUrl } = require('../../lib/canonicalSiteUrl.cjs');
const { DEFAULT_META_DESCRIPTION } = require('../../lib/siteSeo.cjs');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function normalizeRetailTagline(tagline) {
  const t = String(tagline || '').toLowerCase();
  if (
    !t ||
    t.includes('toptan') ||
    t.includes('b2b') ||
    t.includes('bayi') ||
    t.includes('toywholesale') ||
    t.includes('toplu sipari')
  ) {
    return DEFAULT_META_DESCRIPTION;
  }
  return String(tagline || '').trim() || DEFAULT_META_DESCRIPTION;
}

function buildTimePassword() {
  try {
    return String(require('../../lib/catalogAuth.cjs').ADMIN_PASSWORD || '').trim();
  } catch {
    return '';
  }
}

function allowedPasswords() {
  return [
    process.env.ADMIN_PASSWORD,
    process.env.CATALOG_ADMIN_PASSWORD,
    process.env.VITE_ADMIN_PASSWORD,
    buildTimePassword(),
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
        'Netlify → Environment variables → VITE_ADMIN_PASSWORD (admin giriş şifreniz) tanımlı olsun, Scope: Builds veya All. Sonra Clear cache and deploy.',
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

  const products = sanitizeProductsSeo(Array.isArray(body.products) ? body.products : []);
  const categories = Array.isArray(body.categories) ? body.categories : [];
  const banners = Array.isArray(body.banners) ? body.banners : [];
  const rawSettings = body.settings && typeof body.settings === 'object' ? body.settings : null;
  const settings = rawSettings
    ? {
        ...rawSettings,
        siteUrl: resolveCanonicalSiteUrl(rawSettings.siteUrl),
        tagline: normalizeRetailTagline(rawSettings.tagline),
      }
    : null;

  if (!products.length) {
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Yayınlanacak ürün yok' }),
    };
  }

  try {
    const store = getCatalogStore(event);
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
        hint:
          'Netlify üzerinde yeniden deploy edin. Hata sürerse Site configuration → Environment variables → NETLIFY_SITE_ID ve NETLIFY_AUTH_TOKEN (Personal Access Token, Blobs izni) ekleyin.',
      }),
    };
  }
};
