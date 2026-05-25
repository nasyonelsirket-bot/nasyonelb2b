#!/usr/bin/env node
/**
 * PayTR hash matrix — 6 kombinasyonu sırayla POST eder, debug txt + özet üretir.
 *
 * Gerekli env (.env veya shell):
 *   PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY, PAYTR_MERCHANT_SALT
 *   PAYTR_TEST_USER_IP — gerçek IPv4 (PayTR zorunlu)
 *
 * Opsiyonel:
 *   PAYTR_TEST_MODE=1, PAYTR_AMOUNT_MODE=kurus, PAYTR_DEBUG_DIR=...
 *
 * Çalıştır: npm run paytr:matrix
 */
const fs = require('fs');
const path = require('path');

const { getPaytrConfig, analyzePaytrAmount, buildDirectUserBasket, PAYTR_ODEME_URL } =
  require('../lib/paytrHelpers.cjs');
const {
  PAYTR_MATRIX_COMBOS,
  buildPaytrMatrixHashInput,
  applyPaymentTypeToFormFields,
  comboLabel,
} = require('../lib/paytrHashMatrix.cjs');
const { writePaytrDebugTxtFiles, resolvePaytrDebugDir } = require('../lib/paytrDebugFiles.cjs');

const TEST_CARD = {
  cc_owner: 'PAYTR TEST',
  card_number: '9792030394440796',
  expiry_month: '12',
  expiry_year: '99',
  cvv: '000',
};

function loadDotEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

function formatPostBody(fields) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    if (value == null) continue;
    params.append(key, String(value));
  }
  return params.toString();
}

function escapeShellSingleQuoted(value) {
  return String(value).replace(/'/g, "'\\''");
}

function buildCurlCommand(body, url = PAYTR_ODEME_URL) {
  return `curl -sS -X POST '${url}' -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' --data-raw '${escapeShellSingleQuoted(body)}'`;
}

function extractPaytrError(html) {
  const text = String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const patterns = [
    /paytr_token[^.]{0,80}/i,
    /Zorunlu alan[^.]{0,120}/i,
    /geçersiz[^.]{0,120}/i,
    /hata[^.]{0,120}/i,
    /integer olmalıdır[^.]{0,80}/i,
    /eksik[^.]{0,120}/i,
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[0].trim();
  }

  if (/3d/i.test(html) && /form/i.test(html)) {
    return '(3DS redirect / form — token kabul edilmiş olabilir)';
  }

  return text.slice(0, 240) || '(boş yanıt)';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSampleCheckout(config, merchantOid, userIp) {
  // TL cinsinden — 125 TL → payment_amount "12500", basket [["Test","125.00","1"]]
  const orderTotalTl = Number(process.env.PAYTR_TEST_AMOUNT_TL || process.env.PAYTR_TEST_AMOUNT || '125');
  const items = [{ name: 'Test', price: orderTotalTl, quantity: 1 }];
  const amountAnalysis = analyzePaytrAmount(orderTotalTl, config.amountMode);
  const userBasket = buildDirectUserBasket(items, amountAnalysis.parsedTlAmount, 'decimal');
  const base = String(process.env.URL || process.env.VITE_SITE_URL || 'https://nasyoneltoys.com').replace(
    /\/$/,
    '',
  );

  return {
    orderTotal: amountAnalysis.parsedTlAmount,
    paymentAmount: amountAnalysis.paymentAmountSent,
    userBasket,
    amountAnalysis,
    email: process.env.PAYTR_TEST_EMAIL || 'test@paytr.com',
    merchantOid,
    userIp,
    base,
  };
}

async function runCombo(combo, config, sample, runId) {
  const hashResult = buildPaytrMatrixHashInput({
    merchantId: config.merchantId,
    merchantKey: config.merchantKey,
    merchantSalt: config.merchantSalt,
    userIp: sample.userIp,
    merchantOid: sample.merchantOid,
    email: sample.email,
    paymentAmount: sample.paymentAmount,
    installmentCount: '0',
    currency: config.currency,
    testMode: config.testMode,
    non3d: '0',
    paymentTypeVariant: combo.paymentTypeVariant,
    installmentInHash: combo.installmentInHash,
    hashMode: 'official',
  });

  let formFields = {
    merchant_id: config.merchantId,
    paytr_token: hashResult.paytrToken,
    user_ip: sample.userIp,
    merchant_oid: sample.merchantOid,
    email: sample.email,
    payment_amount: sample.paymentAmount,
    installment_count: '0',
    no_installment: '0',
    max_installment: '0',
    lang: 'tr',
    currency: config.currency,
    test_mode: config.testMode,
    non_3d: '0',
    merchant_ok_url: `${sample.base}/api/paytr/return-ok?oid=matrix`,
    merchant_fail_url: `${sample.base}/api/paytr/return-fail?oid=matrix`,
    user_name: 'Matrix Test',
    user_address: 'Test Adres',
    user_phone: '5555555555',
    user_basket: sample.userBasket,
    debug_on: config.debugOn,
    non3d_test_failed: '0',
    ...TEST_CARD,
  };

  formFields = applyPaymentTypeToFormFields(formFields, combo.paymentTypeVariant);

  const formBody = formatPostBody(formFields);
  const curlCommand = buildCurlCommand(formBody);

  const debugWrite = writePaytrDebugTxtFiles({
    slug: `${runId}_${combo.id}`,
    hashMessage: hashResult.hashMessage,
    token: hashResult.paytrToken,
    formBody,
    curlCommand,
    extra: {
      combo: combo.id,
      label: comboLabel(combo),
      fieldOrder: hashResult.fieldOrder,
      paymentTypeVariant: hashResult.paymentTypeVariant,
      installmentInHash: hashResult.installmentInHash,
    },
  });

  const response = await fetch(PAYTR_ODEME_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: formBody,
    redirect: 'manual',
  });

  const html = await response.text();
  const paytrError = extractPaytrError(html);

  const resultPath = debugWrite.files.curl.replace(/-curl\.txt$/, '-result.txt');
  fs.writeFileSync(
    resultPath,
    `HTTP ${response.status}\n${paytrError}\n`,
    'utf8',
  );
  debugWrite.files.result = resultPath;

  return {
    comboId: combo.id,
    label: comboLabel(combo),
    fieldOrder: hashResult.fieldOrder,
    hashMessage: hashResult.hashMessage,
    paytrToken: hashResult.paytrToken,
    httpStatus: response.status,
    paytrError,
    debugFiles: debugWrite.files,
    formBodyLength: formBody.length,
  };
}

async function main() {
  loadDotEnv();

  const userIp = String(process.env.PAYTR_TEST_USER_IP || '').trim();
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(userIp)) {
    console.error('PAYTR_TEST_USER_IP gerekli — gerçek IPv4 (https://whatismyip.com/)');
    process.exit(1);
  }

  let config;
  try {
    config = getPaytrConfig();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const results = [];
  const errorGroups = new Map();

  console.log(`PayTR matrix test — ${PAYTR_MATRIX_COMBOS.length} kombinasyon`);
  console.log(`Debug dir: ${resolvePaytrDebugDir()}`);
  console.log(`User IP: ${userIp}`);
  const samplePreview = buildSampleCheckout(config, 'preview', userIp);
  console.log(`Test amount TL: ${samplePreview.orderTotal}`);
  console.log(`payment_amount: ${samplePreview.paymentAmount}`);
  console.log(`user_basket: ${samplePreview.userBasket}`);
  console.log(
    `amount probe: ${JSON.stringify(samplePreview.amountAnalysis.doubleConversionProbe)}\n`,
  );

  for (let i = 0; i < PAYTR_MATRIX_COMBOS.length; i += 1) {
    const combo = PAYTR_MATRIX_COMBOS[i];
    const merchantOid = `MX${runId.replace(/\D/g, '').slice(-10)}${String(i + 1).padStart(2, '0')}`;
    const sample = buildSampleCheckout(config, merchantOid, userIp);

    console.log(`[${combo.id}] ${comboLabel(combo)}`);

    try {
      const result = await runCombo(combo, config, sample, runId);
      results.push(result);

      const groupKey = result.paytrError;
      if (!errorGroups.has(groupKey)) {
        errorGroups.set(groupKey, []);
      }
      errorGroups.get(groupKey).push(combo.id);

      console.log(`  HTTP ${result.httpStatus}`);
      console.log(`  PAYTR: ${result.paytrError}`);
      console.log(`  token: ${result.paytrToken}`);
      console.log(`  hash: ${result.hashMessage.slice(0, 80)}...`);
      console.log(`  curl: ${result.debugFiles.curl}\n`);
    } catch (err) {
      const fail = {
        comboId: combo.id,
        label: comboLabel(combo),
        error: err.message,
      };
      results.push(fail);
      console.error(`  HATA: ${err.message}\n`);
    }

    if (i < PAYTR_MATRIX_COMBOS.length - 1) {
      await sleep(Number(process.env.PAYTR_MATRIX_DELAY_MS || 1500));
    }
  }

  const summary = {
    runId,
    testedAt: new Date().toISOString(),
    userIp,
    combinations: results,
    errorGroups: Object.fromEntries(
      [...errorGroups.entries()].map(([error, comboIds]) => ({ error, comboIds })),
    ),
    distinctErrors: errorGroups.size,
  };

  const summaryPath = path.join(resolvePaytrDebugDir(), `${runId}_matrix-summary.json`);
  fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  console.log('--- Özet ---');
  console.log(`Farklı PAYTR hata sayısı: ${errorGroups.size}`);
  for (const [error, comboIds] of errorGroups.entries()) {
    console.log(`\n[${comboIds.join(', ')}]`);
    console.log(`  ${error}`);
  }
  console.log(`\nÖzet dosyası: ${summaryPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
