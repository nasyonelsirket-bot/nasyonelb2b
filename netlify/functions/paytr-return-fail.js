const { paytrReturnRedirect } = require('../../lib/paytrReturn.cjs');

exports.handler = async (event) =>
  paytrReturnRedirect(event, '/odeme/basarisiz', { includeFailReason: true });
