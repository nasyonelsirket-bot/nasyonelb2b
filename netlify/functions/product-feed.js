/**
 * Google Merchant Center XML ürün feed'i (RSS 2.0 + g namespace)
 */
const { getCatalogStore } = require('../../lib/catalogBlobStore.cjs');
const { getProductPath } = require('../../lib/productSeoPath.cjs');

const HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600, s-maxage=3600',
  'Access-Control-Allow-Origin': '*',
};

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(str) {
  return String(str || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSiteUrl(event, settings) {
  const fromSettings = String(settings?.siteUrl || process.env.VITE_SITE_URL || '').trim();
  if (fromSettings) return fromSettings.replace(/\/$/, '');
  const host = event.headers?.host || event.headers?.Host;
  if (host) return `https://${host}`.replace(/\/$/, '');
  return (process.env.URL || 'https://nasyoneltoys.com').replace(/\/$/, '');
}

function resolveImageUrl(product, siteUrl) {
  const image = product.image || (Array.isArray(product.images) ? product.images[0] : '') || '';
  if (!image) return '';
  if (/^https?:\/\//i.test(image)) return image;
  return `${siteUrl}${image.startsWith('/') ? image : `/${image}`}`;
}

function buildDescription(product, brand) {
  const raw =
    product.meta_description ||
    product.description ||
    `${product.name} — ${product.category || 'Oyuncak'} | ${brand}`;
  const text = stripHtml(raw).slice(0, 5000);
  return text || product.name;
}

function buildFeedItem(product, { siteUrl, brand }) {
  const id = String(product.id || product.sku || '').trim();
  const title = String(product.name || '').trim();
  const price = Number(product.price);
  if (!id || !title || !Number.isFinite(price) || price <= 0) return null;

  const path = getProductPath(product);
  const link = `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const imageLink = resolveImageUrl(product, siteUrl);
  if (!imageLink) return null;

  const stock = product.stock != null ? Number(product.stock) : 10;
  const availability = stock > 0 ? 'in_stock' : 'out_of_stock';

  return `
    <item>
      <g:id>${escapeXml(id)}</g:id>
      <g:title>${escapeXml(title.slice(0, 150))}</g:title>
      <g:description>${escapeXml(buildDescription(product, brand))}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${price.toFixed(2)} TRY</g:price>
      <g:brand>${escapeXml(brand)}</g:brand>
      <g:condition>new</g:condition>
      <g:product_type>${escapeXml(product.category || 'Oyuncak')}</g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
    return { statusCode: 405, headers: HEADERS, body: 'Method not allowed' };
  }

  try {
    const store = getCatalogStore(event);
    const products = (await store.get('products', { type: 'json' })) || [];
    const settings = (await store.get('settings', { type: 'json' })) || {};
    const siteUrl = getSiteUrl(event, settings);
    const brand = settings.siteName || 'Nasyonel Toys';

    const items = (Array.isArray(products) ? products : [])
      .map((p) => buildFeedItem(p, { siteUrl, brand }))
      .filter(Boolean)
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(brand)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(settings.tagline || 'Nasyonel Toys online oyuncak mağazası')}</description>
    ${items}
  </channel>
</rss>`;

    if (event.httpMethod === 'HEAD') {
      return { statusCode: 200, headers: HEADERS, body: '' };
    }

    return { statusCode: 200, headers: HEADERS, body: xml };
  } catch (err) {
    console.error('product-feed', err);
    return { statusCode: 500, headers: HEADERS, body: 'Feed error' };
  }
};
