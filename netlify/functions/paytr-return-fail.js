const { paytrReturnHtmlBreakout } = require('../../lib/paytrReturn.cjs');

exports.handler = async (event) =>
  paytrReturnHtmlBreakout(event, '/odeme/basarisiz', { includeFailReason: true });
