import { buildCategoriesFromProducts } from '@/utils/categories';

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

async function parseErrorResponse(response) {
  const text = await response.text();
  if (text.trim().startsWith('<')) {
    if (/cloudflare|you have been blocked/i.test(text)) {
      return 'Trendyol güvenlik duvarı engelledi. Deploy sonrası tekrar deneyin; API bilgilerinizi Trendyol panelinden kontrol edin.';
    }
    return 'API yanıt vermedi (sunucu HTML döndü). Netlify deploy ve /api/trendyol/sync yönlendirmesini kontrol edin.';
  }
  try {
    const data = JSON.parse(text);
    if (data.error) return data.error;
    if (data.hint) return data.hint;
    if (data.details && typeof data.details === 'string' && data.details.length < 200) {
      return data.details;
    }
    return data.message || text.slice(0, 300);
  } catch {
    return text.slice(0, 300) || `HTTP ${response.status}`;
  }
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
    const message = await parseErrorResponse(response);
    throw new Error(message);
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

  const categories = buildCategoriesFromProducts(allProducts);

  return { products: allProducts, categories };
}
