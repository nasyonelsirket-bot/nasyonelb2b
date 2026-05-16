/**
 * Herkese açık katalog — admin panelinde yayınlanan ürünler buradan okunur.
 */
const { getStore } = require('@netlify/blobs');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
};

const EMPTY = { products: [], categories: [], banners: [], settings: null, updatedAt: null };

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const store = getStore({ name: 'b2b-catalog', consistency: 'eventual' });
    const [products, categories, banners, settings, updatedAt] = await Promise.all([
      store.get('products', { type: 'json' }),
      store.get('categories', { type: 'json' }),
      store.get('banners', { type: 'json' }),
      store.get('settings', { type: 'json' }),
      store.get('updatedAt'),
    ]);

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        products: Array.isArray(products) ? products : [],
        categories: Array.isArray(categories) ? categories : [],
        banners: Array.isArray(banners) ? banners : [],
        settings: settings && typeof settings === 'object' ? settings : null,
        updatedAt: updatedAt || null,
      }),
    };
  } catch (err) {
    console.error('catalog-get:', err);
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify(EMPTY) };
  }
};
