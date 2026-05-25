const { paytrReturnRedirect } = require('../../lib/paytrReturn.cjs');

exports.handler = async (event) => paytrReturnRedirect(event, '/odeme/hata', { includeFailReason: true });
