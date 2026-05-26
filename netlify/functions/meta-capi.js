/**
 * Meta Conversion API relay — tarayıcı event'lerini sunucudan Meta'ya iletir (dedup + EMQ)
 */
const { buildServerEvent, sendMetaEvents } = require('../../lib/metaCapi.cjs');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function clientIp(event) {
  const forwarded = event.headers['x-forwarded-for'] || event.headers['X-Forwarded-For'] || '';
  const first = String(forwarded).split(',')[0].trim();
  return first || event.headers['client-ip'] || '';
}

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

  try {
    const serverEvent = buildServerEvent(body, {
      clientIp: clientIp(event),
      userAgent: event.headers['user-agent'] || event.headers['User-Agent'] || '',
    });

    const result = await sendMetaEvents([serverEvent]);

    if (result.skipped) {
      return {
        statusCode: 202,
        headers: HEADERS,
        body: JSON.stringify({ ok: true, skipped: true, reason: result.reason }),
      };
    }

    if (!result.ok) {
      console.error('meta-capi:', result.error, result.details);
      return {
        statusCode: 502,
        headers: HEADERS,
        body: JSON.stringify({ ok: false, error: result.error }),
      };
    }

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        ok: true,
        events_received: result.events_received,
        test_mode: result.test_mode,
      }),
    };
  } catch (err) {
    console.error('meta-capi:', err);
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({ error: err.message || 'Event işlenemedi' }),
    };
  }
};
