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

function buildReturnLocation(event, spaPath, { includeFailReason = false } = {}) {
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
  return { location, oid, postData };
}

function paytrReturnRedirect(event, spaPath, options = {}) {
  const { location } = buildReturnLocation(event, spaPath, options);
  return {
    statusCode: 303,
    headers: { Location: location, 'Cache-Control': 'no-store' },
    body: '',
  };
}

/** PayTR iFrame içinden ana pencereye çıkış — teşekkür sayfası + Purchase pixel için gerekli */
function paytrReturnHtmlBreakout(event, spaPath, options = {}) {
  const { location } = buildReturnLocation(event, spaPath, options);
  const safeUrl = JSON.stringify(location);
  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="0;url=${location.replace(/"/g, '&quot;')}" />
  <title>Ödeme tamamlandı — yönlendiriliyorsunuz</title>
  <style>body{font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;background:#f8fafc;color:#0a1f4d}</style>
</head>
<body>
  <p>Ödeme tamamlandı, yönlendiriliyorsunuz…</p>
  <script>
    (function () {
      var url = ${safeUrl};
      try {
        if (window.top && window.top !== window.self) {
          window.top.location.replace(url);
          return;
        }
      } catch (e) {}
      window.location.replace(url);
    })();
  </script>
</body>
</html>`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
    body: html,
  };
}

module.exports = {
  paytrReturnRedirect,
  paytrReturnHtmlBreakout,
  buildReturnLocation,
  resolveOrderId,
  resolveFailReason,
  parsePaytrReturnBody,
};
