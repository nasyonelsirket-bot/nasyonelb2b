const { parsePaytrCallbackBody, parseOrderIdFromMerchantOid } = require('./paytrHelpers.cjs');

function parsePaytrReturnBody(event) {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'PUT') return {};
  let raw = event.body || '';
  if (event.isBase64Encoded && raw) {
    raw = Buffer.from(raw, 'base64').toString('utf8');
  }
  return parsePaytrCallbackBody(raw);
}

function resolveOrderId(event, postData = {}) {
  const qs = event.queryStringParameters || {};
  let oid = String(qs.oid || '').trim();

  const merchantOid = String(postData.merchant_oid || '').trim();
  if (!oid && merchantOid.startsWith('NT')) {
    oid = parseOrderIdFromMerchantOid(merchantOid);
  }

  return oid;
}

function resolveFailReason(postData = {}) {
  return String(
    postData.failed_reason_msg ||
      postData.fail_message ||
      postData.err_msg ||
      postData.reason ||
      '',
  ).trim();
}

function paytrReturnRedirect(event, spaPath, { includeFailReason = false } = {}) {
  const postData = parsePaytrReturnBody(event);
  const oid = resolveOrderId(event, postData);
  const params = new URLSearchParams();
  if (oid) params.set('oid', oid);

  if (includeFailReason) {
    const reason = resolveFailReason(postData);
    if (reason) params.set('reason', reason.slice(0, 240));
  }

  const query = params.toString();
  const location = query ? `${spaPath}?${query}` : spaPath;
  return {
    statusCode: 303,
    headers: { Location: location, 'Cache-Control': 'no-store' },
    body: '',
  };
}

module.exports = {
  paytrReturnRedirect,
  resolveOrderId,
  resolveFailReason,
  parsePaytrReturnBody,
};
