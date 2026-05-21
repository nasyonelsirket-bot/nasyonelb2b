const { loadPromotions } = require('../../lib/catalogPromotions.cjs');
const { validateCoupon } = require('../../lib/promotions.cjs');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Geçersiz JSON' }) };
  }

  const code = String(body.code || '').trim();
  const email = String(body.email || '').trim();
  const subtotal = Number(body.subtotal) || 0;

  if (!code) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Kupon kodu gerekli' }) };
  }

  try {
    const promos = await loadPromotions(event);
    const result = validateCoupon(promos.coupons, code, email, subtotal);
    if (!result.ok) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify(result) };
    }
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        ok: true,
        code: result.coupon.code,
        discountAmount: result.discountAmount,
        label: result.label,
        type: result.coupon.type,
        value: result.coupon.value,
      }),
    };
  } catch (err) {
    console.error('coupon-validate:', err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: err.message || 'Doğrulanamadı' }),
    };
  }
};
