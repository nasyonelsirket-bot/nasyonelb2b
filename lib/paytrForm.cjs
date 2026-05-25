const { createPaytrIframeCheckout, buildIframeGetTokenPayload } = require('./paytrIframe.cjs');

module.exports = {
  buildPaytrIframeCheckout: createPaytrIframeCheckout,
  buildIframeGetTokenPayload,
};
