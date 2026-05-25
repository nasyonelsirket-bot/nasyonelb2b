const {
  getPaytrConfig,
  buildPaytrUserBasketBase64,
  formatDirectPaymentAmount,
  createPaytrTokenHash,
} = require('./paytrHelpers.cjs');

function buildPaytrDirectForm({
  config,
  base,
  orderId,
  merchantOid,
  email,
  orderTotal,
  items,
  customer,
  userIp,
}) {
  const paymentAmount = formatDirectPaymentAmount(orderTotal);
  const userBasket = buildPaytrUserBasketBase64(items, orderTotal);
  const paytrToken = createPaytrTokenHash({
    merchantId: config.merchantId,
    merchantKey: config.merchantKey,
    merchantSalt: config.merchantSalt,
    userIp,
    merchantOid,
    email,
    paymentAmount,
    userBasket,
    noInstallment: config.noInstallment,
    maxInstallment: config.maxInstallment,
    currency: config.currency,
    testMode: config.testMode,
  });

  const customerName = String(customer?.name || '').trim();
  const userName = customerName.slice(0, 60);
  const userAddress = [customer?.address, customer?.district, customer?.city]
    .filter(Boolean)
    .join(', ')
    .slice(0, 400);
  const userPhone = String(customer?.phone || '').replace(/\D/g, '').slice(0, 20);

  return {
    merchant_id: config.merchantId,
    user_ip: userIp,
    merchant_oid: merchantOid,
    email,
    payment_type: 'card',
    payment_amount: paymentAmount,
    installment_count: '0',
    currency: config.currency,
    test_mode: config.testMode,
    non_3d: '0',
    no_installment: config.noInstallment,
    max_installment: config.maxInstallment,
    merchant_ok_url: `${base}/api/paytr/return-ok?oid=${orderId}`,
    merchant_fail_url: `${base}/api/paytr/return-fail?oid=${orderId}`,
    user_name: userName,
    user_address: userAddress || '-',
    user_phone: userPhone,
    user_basket: userBasket,
    debug_on: config.debugOn,
    lang: 'tr',
    client_lang: 'tr',
    timeout_limit: config.timeoutLimit,
    paytr_token: paytrToken,
    non3d_test_failed: '0',
  };
}

module.exports = { buildPaytrDirectForm };
