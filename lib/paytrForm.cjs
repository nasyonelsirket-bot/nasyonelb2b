/** Geriye dönük uyumluluk — paytrCheckout kullanır. */
const { buildPaytrOdemeForm } = require('./paytrCheckout.cjs');

function buildPaytrDirectForm(params) {
  return buildPaytrOdemeForm(params);
}

module.exports = { buildPaytrDirectForm, buildPaytrOdemeForm };
