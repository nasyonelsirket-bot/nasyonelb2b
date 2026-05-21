const { sortImagesLargestFirst } = require('./trendyolImages.cjs');
const { extractTrendyolSalesScore } = require('./trendyolSales.cjs');
const { TRENDYOL_PRODUCT_BASE, assertCredentials, trendyolFetch } = require('./trendyolApi.cjs');
const { fetchTrendyolSalesAggregates, applySalesToProducts } = require('./trendyolOrders.cjs');

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
  return item.stockCode || item.barcode || (item.id != null ? String(item.id) : '');
}

function pickSalePrice(item) {
  const variant = Array.isArray(item.variants) ? item.variants.find((v) => v.onSale !== false) || item.variants[0] : null;
  if (variant?.price) {
    return variant.price.salePrice ?? variant.price.listPrice ?? 0;
  }
  return item.salePrice ?? item.listPrice ?? item.price ?? 0;
}

function mapProductItem(item, index, page, priceDivisor) {
  const images = pickImages(item);
  const salePrice = pickSalePrice(item);
  const stockCode = pickStockCode(item);
  const uniqueKey = item.id ?? item.productMainId ?? item.contentId ?? item.barcode ?? `${page}-${index}`;
  const variant = Array.isArray(item.variants) ? item.variants[0] : null;

  const compareAtPrice = Math.round(Number(salePrice) * 100) / 100;
  const price = Math.round((compareAtPrice / priceDivisor) * 100) / 100;

  return {
    id: `ty-${uniqueKey}`,
    name: item.title || item.productName || 'Ürün',
    sku: stockCode,
    category: item.categoryName || item.pimCategoryName || item.category?.name || item.brand || 'Genel',
    compareAtPrice,
    price,
    image: images[0] || '',
    images,
    description: item.description || item.productDescription || '',
    stock: item.quantity ?? variant?.stock?.quantity ?? null,
    barcode: item.barcode || variant?.barcode || '',
    brand: item.brand?.name || item.brand || item.brandName || '',
    isNew: false,
    isCampaign: true,
    minOrder: 1,
    source: 'trendyol',
    trendyolSalesScore: 0,
    trendyolUnitsSold: 0,
    trendyolSalesSource: 'pending-orders',
    trendyolProductId: item.id ?? item.productMainId ?? null,
    trendyolContentId: item.contentId ?? variant?.contentId ?? null,
  };
}

async function syncTrendyolProducts(credentials, query = {}) {
  const { supplierId } = assertCredentials(credentials);
  const priceDivisor = Number(credentials.priceDivisor ?? query.priceDivisor ?? 2);
  const page = String(query.page ?? '0');
  const size = String(query.size ?? '50');
  const onSale = query.onSale !== 'false';

  const params = new URLSearchParams({
    approved: 'true',
    page,
    size,
  });
  if (onSale) params.set('onSale', 'true');

  const url = `${TRENDYOL_PRODUCT_BASE}/${supplierId}/products?${params}`;
  const data = await trendyolFetch(url, credentials, {
    clientIp: query.clientIp,
    storeFrontCode: query.storeFrontCode,
  });

  const products = (data.content || []).map((item, index) =>
    mapProductItem(item, index, page, priceDivisor),
  );

  return {
    products,
    totalPages: data.totalPages ?? 1,
    totalElements: data.totalElements ?? products.length,
    priceDivisor,
  };
}

/** Tüm ürün sayfaları + sipariş API satış adetleri (en çok satanlar) */
async function syncTrendyolCatalogWithSales(credentials, query = {}) {
  const priceDivisor = Number(credentials.priceDivisor ?? query.priceDivisor ?? 2);
  const pageSize = Number(query.size) || 50;

  let page = 0;
  let totalPages = 1;
  const allProducts = [];

  while (page < totalPages) {
    const batch = await syncTrendyolProducts(credentials, {
      ...query,
      page: String(page),
      size: String(pageSize),
    });
    allProducts.push(...(batch.products || []));
    totalPages = batch.totalPages ?? 1;
    page += 1;
    if (!batch.products?.length) break;
  }

  let salesMaps = null;
  let salesError = null;

  try {
    salesMaps = await fetchTrendyolSalesAggregates(credentials, {
      days: query.salesDays || 30,
      clientIp: query.clientIp,
      storeFrontCode: query.storeFrontCode,
    });
  } catch (err) {
    salesError = err.message || 'Sipariş verisi alınamadı';
    salesMaps = { byBarcode: {}, byStockCode: {}, byContentId: {} };
  }

  const products = applySalesToProducts(allProducts, salesMaps);

  const withSales = products.filter((p) => Number(p.trendyolUnitsSold) > 0);

  return {
    products,
    totalPages,
    totalElements: products.length,
    priceDivisor,
    sales: {
      periodDays: salesMaps.periodDays,
      packagesScanned: salesMaps.packagesScanned,
      totalUnitsSold: salesMaps.totalUnitsSold,
      productsWithSales: withSales.length,
      syncedAt: salesMaps.syncedAt,
      error: salesError,
    },
  };
}

module.exports = {
  syncTrendyolProducts,
  syncTrendyolCatalogWithSales,
};
