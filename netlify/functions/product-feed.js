/**
 * Google Merchant / reklam XML ürün feed'i
 */
const { getCatalogStore } = require('../../lib/catalogBlobStore.cjs');
const { getProductPath } = require('../../lib/productSeoPath.cjs');

const HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600',
};

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getSiteUrl(event) {
  const host = event.headers?.host || event.headers?.Host;
  if (host) return `https://${host}`;
  return process.env.URL || process.env.VITE_SITE_URL || 'https://www.nasyoneltoys.com';
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: HEADERS, body: 'Method not allowed' };
  }

  try {
    const store = getCatalogStore(event);
    const products = (await store.get('products', { type: 'json' })) || [];
    const settings = (await store.get('settings', { type: 'json' })) || {};
    const siteUrl = String(settings.siteUrl || getSiteUrl(event)).replace(/\/$/, '');
    const brand = settings.siteName || 'Nasyonel Toys';

    const items = (Array.isArray(products) ? products : [])
      .filter((p) => p && p.name && p.price != null)
      .map((p) => {
        const path = getProductPath(p);
        const link = `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
        const image = p.image || (Array.isArray(p.images) ? p.images[0] : '') || '';
        const absImage =
          image && /^https?:\/\//i.test(image)
            ? image
            : image
              ? `${siteUrl}${image.startsWith('/') ? image : `/${image}`}`
              : '';
        const stock = p.stock != null ? Number(p.stock) : 10;
        const availability = stock > 0 ? 'in_stock' : 'out_of_stock';
        return `
    <item>
      <g:id>${escapeXml(p.id || p.sku)}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${escapeXml(p.description || p.name)}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(absImage)}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${Number(p.price).toFixed(2)} TRY</g:price>
      <g:brand>${escapeXml(brand)}</g:brand>
      <g:condition>new</g:condition>
      <g:product_type>${escapeXml(p.category || 'Oyuncak')}</g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`;
      })
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(brand)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(settings.tagline || 'Online oyuncak mağazası')}</description>
    ${items}
  </channel>
</rss>`;

    return { statusCode: 200, headers: HEADERS, body: xml };
  } catch (err) {
    console.error('product-feed', err);
    return { statusCode: 500, headers: HEADERS, body: 'Feed error' };
  }
};
