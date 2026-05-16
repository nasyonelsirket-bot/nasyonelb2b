const TRENDYOL_BASE = 'https://api.trendyol.com/sapigw/suppliers';

function pickImages(item) {
  const urls = [];
  const add = (u) => {
    if (u && typeof u === 'string' && u.startsWith('http')) urls.push(u);
  };

  if (Array.isArray(item.images)) {
    item.images.forEach((img) => add(typeof img === 'string' ? img : img?.url));
  }
  add(item.imageUrl);
  add(item.productMainImage);
  if (Array.isArray(item.media)) {
    item.media.forEach((m) => add(m?.url || m?.mediaUrl));
  }
  return [...new Set(urls)];
}

function pickStockCode(item, listing) {
  return (
    item.stockCode ||
    listing?.stockCode ||
    item.barcode ||
    listing?.barcode ||
    (item.id != null ? String(item.id) : '')
  );
}

function pickSalePrice(item, listing) {
  return (
    listing?.salePrice ??
    listing?.price ??
    item.salePrice ??
    item.listPrice ??
    item.price ??
    0
  );
}

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
    err.hint = 'Admin panelinden Supplier ID, API Key ve API Secret girin.';
    throw err;
  }

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  const url = `${TRENDYOL_BASE}/${supplierId}/products?approved=true&page=${page}&size=${size}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      'User-Agent': `${supplierId} - SelfIntegration`,
      'Content-Type': 'application/json',
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
    const images = pickImages(item);
    const salePrice = pickSalePrice(item, listing);
    const stockCode = pickStockCode(item, listing);
    const uniqueKey = item.id ?? item.productMainId ?? item.barcode ?? `${page}-${index}`;

    return {
      id: `ty-${uniqueKey}`,
      name: item.title || item.productName || 'Ürün',
      sku: stockCode,
      category: item.categoryName || item.pimCategoryName || item.brand || 'Genel',
      price: Math.round((Number(salePrice) / priceDivisor) * 100) / 100,
      image: images[0] || '',
      images,
      description: item.description || item.productDescription || '',
      stock: listing.quantity ?? item.quantity ?? null,
      barcode: item.barcode || listing.barcode || '',
      isNew: false,
      isCampaign: Number(listing.discountedPrice) > 0,
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
