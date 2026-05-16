/**
 * Trendyol API proxy - Netlify Serverless Function
 * Kimlik bilgileri: Netlify env veya POST body (admin panelinden)
 */

const { syncTrendyolProducts } = require('../../lib/trendyolSync.cjs');

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

  try {
    let bodyCreds = {};
    if (event.body) {
      try {
        bodyCreds = JSON.parse(event.body);
      } catch {
        bodyCreds = {};
      }
    }

    const params = event.queryStringParameters || {};
    const credentials = {
      supplierId: bodyCreds.supplierId || process.env.TRENDYOL_SUPPLIER_ID,
      apiKey: bodyCreds.apiKey || process.env.TRENDYOL_API_KEY,
      apiSecret: bodyCreds.apiSecret || process.env.TRENDYOL_API_SECRET,
      priceDivisor: bodyCreds.priceDivisor ?? process.env.TRENDYOL_PRICE_DIVISOR ?? 4,
    };

    const result = await syncTrendyolProducts(credentials, {
      page: params.page || '0',
      size: params.size || '50',
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (err) {
    if (err.code === 'MISSING_CREDENTIALS') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: err.message, hint: err.hint }),
      };
    }
    return {
      statusCode: err.status || 500,
      headers,
      body: JSON.stringify({
        error: err.message || 'Trendyol sync failed',
        details: err.details,
      }),
    };
  }
};
