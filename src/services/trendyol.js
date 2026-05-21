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
    priceDivisor: Number(settings.trendyolPriceDivisor) || 2,
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

/** Tek seferde: tüm ürünler + Trendyol Sipariş API satış adetleri */
export async function syncAllTrendyolProducts(settings, onProgress) {
  const credentials = getCredentials(settings);
  const url = `${API_PATH}?mode=full&size=50`;

  onProgress?.({ phase: 'sync', message: 'Ürünler ve sipariş satışları çekiliyor...' });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...credentials, fullSync: true }),
  });

  if (!response.ok) {
    const message = await parseErrorResponse(response);
    throw new Error(message);
  }

  const data = await response.json();
  const products = data.products || [];

  onProgress?.({
    phase: 'done',
    count: products.length,
    sales: data.sales,
  });

  const categories = buildCategoriesFromProducts(products);

  return { products, categories, sales: data.sales };
}
