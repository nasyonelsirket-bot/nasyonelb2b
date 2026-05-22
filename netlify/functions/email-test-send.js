/**
 * Admin: Resend test e-postası — gerçek API hatasını döner
 */
const { sendTestEmail } = require('../../lib/orderEmail.cjs');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
  'Content-Type': 'application/json',
};

function allowedPasswords() {
  return [
    process.env.ADMIN_PASSWORD,
    process.env.CATALOG_ADMIN_PASSWORD,
    process.env.VITE_ADMIN_PASSWORD,
  ]
    .map((s) => String(s || '').trim())
    .filter(Boolean);
}

function verifyAdmin(headers) {
  const given = String(headers['x-admin-key'] || headers['X-Admin-Key'] || '').trim();
  if (!given) return false;
  return allowedPasswords().includes(given);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'POST only' }) };
  }
  if (!verifyAdmin(event.headers)) {
    return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ error: 'Yetkisiz' }) };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Geçersiz JSON' }) };
  }

  const apiKeySet = !!String(process.env.RESEND_API_KEY || '').trim();
  const fromEmail = String(process.env.RESEND_FROM_EMAIL || '').trim();

  if (!apiKeySet) {
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        ok: false,
        error: 'RESEND_API_KEY Netlify ortam değişkeninde yok. Ekleyip Clear cache and deploy yapın.',
      }),
    };
  }
  if (!fromEmail) {
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        ok: false,
        error: 'RESEND_FROM_EMAIL tanımlı değil (ör. siparis@nasyoneltoys.com)',
      }),
    };
  }

  try {
    const result = await sendTestEmail(body.to, body.siteName || 'Nasyonel Toys');
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        ...result,
        fromEmail,
        to: body.to || process.env.ORDER_NOTIFY_EMAIL,
        hint: result.ok
          ? 'Gelen kutusu ve spam klasörünü kontrol edin.'
          : 'Resend → Domains bölümünde nasyoneltoys.com Verified olmalı. FROM adresi bu domainden olmalı.',
      }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ ok: false, error: err.message || 'Gönderilemedi' }),
    };
  }
};
