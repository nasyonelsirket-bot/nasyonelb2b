const TRENDYOL_BASE = 'https://api.trendyol.com/sapigw/suppliers';

async function syncTrendyolProducts(credentials, query = {}) {
  const supplierId = credentials.supplierId;
  const apiKey = credentials.apiKey;
  const apiSecret = credentials.apiSecret;
  const priceDivisor = Number(credentials.priceDivisor ?? query.priceDivisor ?? 4);
  const page = String(query.page ?? '0');
  const size = String(query.size ?? '50');

  if (!supplierId || !apiKey || !apiSecret) {
    const err = new Error('Trendyol API bilgileri eksik');
    err.code = 'MISSING_CREDENTIALS';
    err.hint = 'Admin panelinden Supplier ID, API Key ve API Secret girin veya Netlify ortam değişkenlerini ayarlayın.';
    throw err;
  }

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  const url = `${TRENDYOL_BASE}/${supplierId}/products?approved=true&page=${page}&size=${size}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      'User-Agent': `${supplierId} - SelfIntegration`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    let detailMsg = text;
    try {
      const parsed = JSON.parse(text);
      detailMsg = parsed.message || parsed.errors?.[0]?.message || text;
    } catch {
      /* plain text */
    }
    const err = new Error(`Trendyol API hatası (${response.status}): ${detailMsg}`);
    err.status = response.status;
    err.details = text;
    throw err;
  }

  const data = await response.json();
  const products = (data.content || []).map((item, index) => {
    const listing = item.listings?.[0] || {};
    const salePrice = listing.salePrice ?? item.salePrice ?? 0;
    const uniqueKey = item.id ?? item.barcode ?? `${page}-${index}`;
    return {
      id: `ty-${uniqueKey}`,
      name: item.title || item.productName || 'Ürün',
      sku: item.stockCode || item.barcode || String(item.id),
      category: item.categoryName || item.pimCategoryName || 'Genel',
      price: Math.round((salePrice / priceDivisor) * 100) / 100,
      image: item.images?.[0]?.url || item.imageUrl || '',
      description: item.description || '',
      isNew: false,
      isCampaign: listing.discountedPrice > 0,
      minOrder: 1,
      source: 'trendyol',
    };
  });

  return {
    products,
    totalPages: data.totalPages ?? 1,
    totalElements: data.totalElements ?? products.length,
    priceDivisor,
  };
}

module.exports = { syncTrendyolProducts };
