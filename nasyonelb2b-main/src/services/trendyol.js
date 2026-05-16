/**
 * Trendyol API entegrasyon servisi.
 * Production'da Netlify Function üzerinden çalışır.
 */

const API_PATH = '/api/trendyol/sync';

export async function fetchTrendyolProducts(page = 0, size = 50) {
  const isDev = import.meta.env.DEV;
  const base = isDev ? '' : '';
  const url = `${base}${API_PATH}?page=${page}&size=${size}`;

  const response = await fetch(url);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || err.hint || `Trendyol sync failed: ${response.status}`);
  }

  return response.json();
}

export async function syncAllTrendyolProducts(onProgress) {
  const allProducts = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const data = await fetchTrendyolProducts(page, 50);
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
