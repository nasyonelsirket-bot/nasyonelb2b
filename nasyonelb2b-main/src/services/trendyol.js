/**
 * Trendyol API entegrasyon servisi.
 * Production'da Netlify Function üzerinden çalışır.
 */

const API_PATH = '/api/trendyol/sync';

function getCredentials(settings = {}) {
  return {
    supplierId: settings.trendyolSupplierId?.trim() || '',
    apiKey: settings.trendyolApiKey?.trim() || '',
    apiSecret: settings.trendyolApiSecret?.trim() || '',
    priceDivisor: Number(settings.trendyolPriceDivisor) || 4,
  };
}

export async function fetchTrendyolProducts(page = 0, size = 50, settings) {
  const credentials = getCredentials(settings);
  const url = `${API_PATH}?page=${page}&size=${size}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || err.hint || `Trendyol senkronizasyonu başarısız: ${response.status}`);
  }

  return response.json();
}

export async function syncAllTrendyolProducts(settings, onProgress) {
  const allProducts = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const data = await fetchTrendyolProducts(page, 50, settings);
    allProducts.push(...(data.products || []));
    totalPages = data.totalPages ?? 1;
    onProgress?.({
      page: page + 1,
      totalPages,
      count: allProducts.length,
    });
    page += 1;
    if (!data.products?.length) break;
  }

  const categories = [...new Set(allProducts.map((p) => p.category))].map(
    (name, i) => ({
      id: `cat-ty-${i}`,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9ğüşıöç]+/gi, '-')
        .replace(/(^-|-$)/g, ''),
      icon: '🛒',
    }),
  );

  return { products: allProducts, categories };
}
