const {
  buildDirectUserBasket,
  formatDirectPaymentAmount,
  formatDirectPaymentAmountDecimal,
  createDirectPaytrTokenHash,
} = require('./paytrHelpers.cjs');

/** PayTR odeme spp — token hash ondalık TL, form alanı kuruş tam sayı */
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
  const paymentAmountKurus = formatDirectPaymentAmount(orderTotal);
  const paymentAmountHash = formatDirectPaymentAmountDecimal(orderTotal);
  const userBasket = buildDirectUserBasket(items, orderTotal);
  const installmentCount = '0';
  const paymentType = 'card';
  const non3d = '0';

  const paytrToken = createDirectPaytrTokenHash({
    merchantId: config.merchantId,
    merchantKey: config.merchantKey,
    merchantSalt: config.merchantSalt,
    userIp,
    merchantOid,
    email,
    paymentAmount: paymentAmountHash,
    paymentType,
    installmentCount,
    currency: config.currency,
    testMode: config.testMode,
    non3d,
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
    payment_type: paymentType,
    payment_amount: paymentAmountKurus,
    installment_count: installmentCount,
    currency: config.currency,
    test_mode: config.testMode,
    non_3d: non3d,
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
