/**
 * Trendyol API proxy - Netlify Serverless Function
 * CORS ve API anahtarlarını sunucu tarafında tutar.
 *
 * Gerekli Netlify env: TRENDYOL_SUPPLIER_ID, TRENDYOL_API_KEY, TRENDYOL_API_SECRET
 */

const TRENDYOL_BASE = 'https://api.trendyol.com/sapigw/suppliers';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const supplierId = process.env.TRENDYOL_SUPPLIER_ID;
  const apiKey = process.env.TRENDYOL_API_KEY;
  const apiSecret = process.env.TRENDYOL_API_SECRET;
  const priceDivisor = Number(process.env.TRENDYOL_PRICE_DIVISOR || 4);

  if (!supplierId || !apiKey || !apiSecret) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: 'Trendyol API credentials not configured',
        hint: 'Set TRENDYOL_SUPPLIER_ID, TRENDYOL_API_KEY, TRENDYOL_API_SECRET in Netlify env',
      }),
    };
  }

  try {
    const params = event.queryStringParameters || {};
    const page = params.page || '0';
    const size = params.size || '50';

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
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'Trendyol API error', details: text }),
      };
    }

    const data = await response.json();
    const products = (data.content || []).map((item) => {
      const listing = item.listings?.[0] || {};
      const salePrice = listing.salePrice || item.salePrice || 0;
      return {
        id: `ty-${item.productMainId || item.id}`,
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
      statusCode: 200,
      headers,
      body: JSON.stringify({
        products,
        totalPages: data.totalPages,
        totalElements: data.totalElements,
        priceDivisor,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
