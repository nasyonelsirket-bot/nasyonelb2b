const { randomUUID } = require('crypto');
const { sortImagesLargestFirst } = require('./trendyolImages.cjs');
const { extractTrendyolSalesScore } = require('./trendyolSales.cjs');

/** Resmi entegrasyon gateway (sapigw Cloudflare ile engellenir) */
const TRENDYOL_BASE = 'https://apigw.trendyol.com/integration/product/sellers';

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
  add(item.productImageUrl);
  if (Array.isArray(item.media)) {
    item.media.forEach((m) => add(m?.url || m?.mediaUrl));
  }
  if (Array.isArray(item.productImages)) {
    item.productImages.forEach((img) => add(typeof img === 'string' ? img : img?.url));
  }
  return sortImagesLargestFirst(urls);
}

function pickStockCode(item) {
  return (
    item.stockCode ||
    item.barcode ||
    (item.id != null ? String(item.id) : '')
  );
}

function pickSalePrice(item) {
  return item.salePrice ?? item.listPrice ?? item.price ?? 0;
}

function buildHeaders(credentials, options = {}) {
  const { supplierId, apiKey, apiSecret } = credentials;
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  return {
    Authorization: `Basic ${auth}`,
    'User-Agent': `${supplierId} - SelfIntegration`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-agentname': options.agentName || 'NasyonelB2B',
    'x-correlationid': options.correlationId || randomUUID(),
    'x-clientip': options.clientIp || '127.0.0.1',
  };
}

function parseTrendyolError(status, text) {
  if (text.trim().startsWith('<')) {
    if (/cloudflare|cf-ray|you have been blocked/i.test(text)) {
      return 'Trendyol güvenlik duvarı isteği engelledi. Entegrasyon API kullanılıyor; deploy sonrası tekrar deneyin. Devam ederse Trendyol Satıcı Destek ile entegrasyon bilgilerinizi kontrol edin.';
    }
    return `Trendyol geçersiz yanıt döndü (HTTP ${status}).`;
  }
  try {
    const parsed = JSON.parse(text);
    return parsed.message || parsed.errors?.[0]?.message || text.slice(0, 300);
  } catch {
    return text.slice(0, 300) || `HTTP ${status}`;
  }
}

async function syncTrendyolProducts(credentials, query = {}) {
  const supplierId = String(credentials.supplierId || '').trim();
  const apiKey = String(credentials.apiKey || '').trim();
  const apiSecret = String(credentials.apiSecret || '').trim();
  const priceDivisor = Number(credentials.priceDivisor ?? query.priceDivisor ?? 2);
  const page = String(query.page ?? '0');
  const size = String(query.size ?? '50');
  const onSale = query.onSale !== 'false';

  if (!supplierId || !apiKey || !apiSecret) {
    const err = new Error('Trendyol API bilgileri eksik');
    err.code = 'MISSING_CREDENTIALS';
    err.hint = 'Admin panelinden Supplier ID, API Key ve API Secret girin.';
    throw err;
  }

  const params = new URLSearchParams({
    approved: 'true',
    page,
    size,
  });
  if (onSale) params.set('onSale', 'true');

  const url = `${TRENDYOL_BASE}/${supplierId}/products?${params}`;

  const response = await fetch(url, {
    headers: buildHeaders(
      { supplierId, apiKey, apiSecret },
      {
        clientIp: query.clientIp,
        correlationId: query.correlationId,
        agentName: query.agentName,
      },
    ),
  });

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`Trendyol API hatası (${response.status}): ${parseTrendyolError(response.status, text)}`);
    err.status = response.status;
    err.details = text.length > 500 ? `${text.slice(0, 500)}…` : text;
    throw err;
  }

  const data = await response.json();
  const products = (data.content || []).map((item, index) => {
    const images = pickImages(item);
    const salePrice = pickSalePrice(item);
    const stockCode = pickStockCode(item);
    const uniqueKey = item.id ?? item.productMainId ?? item.barcode ?? `${page}-${index}`;

    const compareAtPrice = Math.round(Number(salePrice) * 100) / 100;
    const price = Math.round((compareAtPrice / priceDivisor) * 100) / 100;

    const trendyolSalesScore = extractTrendyolSalesScore(item);

    return {
      id: `ty-${uniqueKey}`,
      name: item.title || item.productName || 'Ürün',
      sku: stockCode,
      category: item.categoryName || item.pimCategoryName || item.brand || 'Genel',
      compareAtPrice,
      price,
      image: images[0] || '',
      images,
      description: item.description || item.productDescription || '',
      stock: item.quantity ?? null,
      barcode: item.barcode || '',
      brand: item.brand || item.brandName || '',
      isNew: false,
      isCampaign: true,
      minOrder: 1,
      source: 'trendyol',
      trendyolSalesScore,
      trendyolProductId: item.id ?? item.productMainId ?? null,
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
