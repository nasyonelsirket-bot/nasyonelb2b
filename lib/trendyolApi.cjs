const { randomUUID } = require('crypto');

const TRENDYOL_PRODUCT_BASE = 'https://apigw.trendyol.com/integration/product/sellers';
const TRENDYOL_ORDER_BASE = 'https://apigw.trendyol.com/integration/order/sellers';

/** İptal, iade, tedarik edilemedi — satış sayısına dahil edilmez */
const SKIP_STATUS_KEYWORDS = [
  'cancel',
  'iptal',
  'return',
  'iade',
  'refund',
  'unsupplied',
  'claim',
  'reject',
];

function isExcludedOrderStatus(status) {
  const s = String(status || '').trim().toLowerCase();
  if (!s) return false;
  return SKIP_STATUS_KEYWORDS.some((kw) => s.includes(kw));
}

const SKIP_PACKAGE_STATUS = new Set(['Cancelled', 'UnSupplied']);
const SKIP_LINE_STATUS = new Set(['Cancelled', 'UnSupplied', 'Returned']);

function buildHeaders(credentials, options = {}) {
  const supplierId = String(credentials.supplierId || '').trim();
  const apiKey = String(credentials.apiKey || '').trim();
  const apiSecret = String(credentials.apiSecret || '').trim();
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

  return {
    Authorization: `Basic ${auth}`,
    'User-Agent': `${supplierId} - SelfIntegration`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    storeFrontCode: options.storeFrontCode || credentials.storeFrontCode || 'TR',
    'x-agentname': options.agentName || 'NasyonelB2B',
    'x-correlationid': options.correlationId || randomUUID(),
    'x-clientip': options.clientIp || '127.0.0.1',
  };
}

function parseTrendyolError(status, text) {
  if (text.trim().startsWith('<')) {
    if (/cloudflare|cf-ray|you have been blocked/i.test(text)) {
      return 'Trendyol güvenlik duvarı isteği engelledi. Entegrasyon API kullanılıyor; deploy sonrası tekrar deneyin.';
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

function assertCredentials(credentials) {
  const supplierId = String(credentials.supplierId || '').trim();
  const apiKey = String(credentials.apiKey || '').trim();
  const apiSecret = String(credentials.apiSecret || '').trim();
  if (!supplierId || !apiKey || !apiSecret) {
    const err = new Error('Trendyol API bilgileri eksik');
    err.code = 'MISSING_CREDENTIALS';
    err.hint = 'Admin panelinden Supplier ID, API Key ve API Secret girin.';
    throw err;
  }
  return { supplierId, apiKey, apiSecret };
}

async function trendyolFetch(url, credentials, options = {}) {
  const { supplierId, apiKey, apiSecret } = assertCredentials(credentials);
  const response = await fetch(url, {
    headers: buildHeaders({ supplierId, apiKey, apiSecret }, options),
  });

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`Trendyol API hatası (${response.status}): ${parseTrendyolError(response.status, text)}`);
    err.status = response.status;
    err.details = text.length > 500 ? `${text.slice(0, 500)}…` : text;
    throw err;
  }

  return response.json();
}

module.exports = {
  TRENDYOL_PRODUCT_BASE,
  TRENDYOL_ORDER_BASE,
  SKIP_PACKAGE_STATUS,
  SKIP_LINE_STATUS,
  isExcludedOrderStatus,
  SKIP_STATUS_KEYWORDS,
  buildHeaders,
  parseTrendyolError,
  assertCredentials,
  trendyolFetch,
};
