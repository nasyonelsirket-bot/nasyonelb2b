/**
 * Dinamik sitemap — statik sayfalar + katalog ürünleri
 */
const { getCatalogStore } = require('../../lib/catalogBlobStore.cjs');
const { getProductPath } = require('../../lib/productSeoPath.cjs');
const { CANONICAL_SITE_URL } = require('../../lib/canonicalSiteUrl.cjs');

const HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600, s-maxage=3600',
};

const STATIC_PAGES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/pelus-oyuncaklar', changefreq: 'weekly', priority: '0.85' },
  { path: '/egitici-oyuncaklar', changefreq: 'weekly', priority: '0.85' },
  { path: '/kutu-oyunlari', changefreq: 'weekly', priority: '0.85' },
  { path: '/zeka-oyuncaklari', changefreq: 'weekly', priority: '0.85' },
  { path: '/bebek-oyuncaklari', changefreq: 'weekly', priority: '0.85' },
  { path: '/yazlik-oyuncaklar', changefreq: 'weekly', priority: '0.85' },
  { path: '/en-cok-satanlar', changefreq: 'daily', priority: '0.9' },
  { path: '/kategoriler', changefreq: 'weekly', priority: '0.9' },
  { path: '/hakkimizda', changefreq: 'monthly', priority: '0.7' },
  { path: '/iletisim', changefreq: 'monthly', priority: '0.8' },
  { path: '/sss', changefreq: 'monthly', priority: '0.6' },
  { path: '/siparis-takip', changefreq: 'monthly', priority: '0.5' },
  { path: '/sozlesme/mesafeli-satis', changefreq: 'yearly', priority: '0.4' },
  { path: '/sozlesme/iade-iptal', changefreq: 'yearly', priority: '0.4' },
  { path: '/sozlesme/gizlilik', changefreq: 'yearly', priority: '0.4' },
  { path: '/sozlesme/kvkk', changefreq: 'yearly', priority: '0.4' },
  { path: '/sozlesme/teslimat-kargo', changefreq: 'yearly', priority: '0.4' },
  { path: '/sozlesme/on-bilgilendirme', changefreq: 'yearly', priority: '0.4' },
  { path: '/sozlesme/cerez', changefreq: 'yearly', priority: '0.4' },
];

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function urlEntry(path, changefreq, priority, lastmod) {
  const loc = `${CANONICAL_SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const mod = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : '';
  return `  <url>
    <loc>${escapeXml(loc)}</loc>${mod}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
    return { statusCode: 405, headers: HEADERS, body: 'Method not allowed' };
  }

  try {
    const store = getCatalogStore(event);
    const products = (await store.get('products', { type: 'json' })) || [];
    const updatedAt = (await store.get('updatedAt')) || new Date().toISOString().slice(0, 10);

    const staticEntries = STATIC_PAGES.map((p) =>
      urlEntry(p.path, p.changefreq, p.priority, p.path === '/' ? updatedAt : null),
    );

    const productEntries = (Array.isArray(products) ? products : [])
      .filter((p) => p && (p.id || p.slug) && p.name)
      .map((p) => urlEntry(getProductPath(p), 'weekly', '0.8', null));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries.join('\n')}
${productEntries.join('\n')}
</urlset>`;

    if (event.httpMethod === 'HEAD') {
      return { statusCode: 200, headers: HEADERS, body: '' };
    }

    return { statusCode: 200, headers: HEADERS, body: xml };
  } catch (err) {
    console.error('sitemap', err);
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${STATIC_PAGES.map((p) => urlEntry(p.path, p.changefreq, p.priority, null)).join('\n')}
</urlset>`;
    return { statusCode: 200, headers: HEADERS, body: fallback };
  }
};
