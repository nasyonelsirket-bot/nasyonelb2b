const {
  TRENDYOL_ORDER_BASE,
  SKIP_PACKAGE_STATUS,
  SKIP_LINE_STATUS,
  assertCredentials,
  trendyolFetch,
} = require('./trendyolApi.cjs');

const DAY_MS = 24 * 60 * 60 * 1000;
const CHUNK_MS = 14 * DAY_MS;

function addCount(map, key, qty) {
  const k = String(key || '').trim();
  if (!k) return;
  map[k] = (map[k] || 0) + qty;
}

function aggregatePackages(packages, maps) {
  const { byBarcode, byStockCode, byContentId } = maps;
  let lineCount = 0;

  (Array.isArray(packages) ? packages : []).forEach((pkg) => {
    const pkgStatus = pkg.shipmentPackageStatus || pkg.status || '';
    if (SKIP_PACKAGE_STATUS.has(pkgStatus)) return;

    (Array.isArray(pkg.lines) ? pkg.lines : []).forEach((line) => {
      const lineStatus = line.orderLineItemStatusName || '';
      if (SKIP_LINE_STATUS.has(lineStatus)) return;

      const qty = Math.max(0, Number(line.quantity) || 0);
      if (qty <= 0) return;

      lineCount += qty;
      addCount(byBarcode, line.barcode, qty);
      addCount(byStockCode, line.stockCode, qty);
      addCount(byContentId, line.contentId, qty);
    });
  });

  return lineCount;
}

async function fetchOrdersPage(credentials, query) {
  const { supplierId } = assertCredentials(credentials);
  const params = new URLSearchParams({
    page: String(query.page ?? 0),
    size: String(query.size ?? 200),
    orderByField: 'PackageLastModifiedDate',
    orderByDirection: 'DESC',
    startDate: String(query.startDate),
    endDate: String(query.endDate),
  });

  const url = `${TRENDYOL_ORDER_BASE}/${supplierId}/orders?${params}`;
  return trendyolFetch(url, credentials, {
    clientIp: query.clientIp,
    storeFrontCode: query.storeFrontCode,
  });
}

/**
 * Son N gün Trendyol siparişlerinden barkod/stok kodu bazlı satış adedi
 */
async function fetchTrendyolSalesAggregates(credentials, options = {}) {
  const days = Math.min(30, Math.max(7, Number(options.days) || 30));
  const end = Date.now();
  const start = end - days * DAY_MS;

  const maps = {
    byBarcode: {},
    byStockCode: {},
    byContentId: {},
  };

  let packagesScanned = 0;
  let pagesFetched = 0;

  for (let chunkStart = start; chunkStart < end; chunkStart += CHUNK_MS) {
    const chunkEnd = Math.min(chunkStart + CHUNK_MS - 1, end);
    let page = 0;
    let totalPages = 1;

    while (page < totalPages) {
      const data = await fetchOrdersPage(credentials, {
        startDate: chunkStart,
        endDate: chunkEnd,
        page,
        size: options.pageSize || 200,
        clientIp: options.clientIp,
        storeFrontCode: options.storeFrontCode,
      });

      const content = data.content || [];
      packagesScanned += content.length;
      aggregatePackages(content, maps);
      pagesFetched += 1;

      totalPages = data.totalPages ?? 1;
      page += 1;
      if (!content.length) break;
    }
  }

  const totalUnits = Object.values(maps.byBarcode).reduce((s, n) => s + n, 0);

  return {
    ...maps,
    periodDays: days,
    packagesScanned,
    pagesFetched,
    totalUnitsSold: totalUnits,
    syncedAt: new Date().toISOString(),
  };
}

function resolveUnitsSold(product, salesMaps) {
  if (!product || !salesMaps) return 0;

  const barcode = String(product.barcode || '').trim();
  const sku = String(product.sku || '').trim();
  const contentId = String(product.trendyolContentId || '').trim();

  const fromBarcode = barcode ? salesMaps.byBarcode?.[barcode] : 0;
  const fromSku = sku ? salesMaps.byStockCode?.[sku] : 0;
  const fromContent = contentId ? salesMaps.byContentId?.[contentId] : 0;

  return Math.max(fromBarcode || 0, fromSku || 0, fromContent || 0);
}

function applySalesToProducts(products, salesMaps) {
  return (Array.isArray(products) ? products : []).map((p) => {
    const units = resolveUnitsSold(p, salesMaps);
    return {
      ...p,
      trendyolUnitsSold: units,
      trendyolSalesScore: units,
      trendyolSalesSource: units > 0 ? 'orders-api' : p.trendyolSalesSource || 'none',
    };
  });
}

module.exports = {
  fetchTrendyolSalesAggregates,
  applySalesToProducts,
  resolveUnitsSold,
};
