const { parsePaytrCallbackBody } = require('./paytrHelpers.cjs');

function resolveOrderId(event) {
  const qs = event.queryStringParameters || {};
  let oid = String(qs.oid || '').trim();

  if (!oid && (event.httpMethod === 'POST' || event.httpMethod === 'PUT')) {
    let raw = event.body || '';
    if (event.isBase64Encoded && raw) {
      raw = Buffer.from(raw, 'base64').toString('utf8');
    }
    const data = parsePaytrCallbackBody(raw);
    const merchantOid = String(data.merchant_oid || '').trim();
    if (merchantOid.startsWith('NT')) {
      oid = merchantOid.slice(2);
    }
  }

  return oid;
}

function paytrReturnRedirect(event, spaPath) {
  const oid = resolveOrderId(event);
  const location = oid ? `${spaPath}?oid=${encodeURIComponent(oid)}` : spaPath;
  return {
    statusCode: 303,
    headers: { Location: location, 'Cache-Control': 'no-store' },
    body: '',
  };
}

module.exports = { paytrReturnRedirect, resolveOrderId };
