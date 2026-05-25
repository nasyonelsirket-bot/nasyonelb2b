/** İmzalı alanlar + kart bilgisini doğrudan PayTR /odeme adresine POST et. */
const PAYTR_ODEME_URL = 'https://www.paytr.com/odeme';

function sanitizeForLog(fields) {
  const out = {};
  for (const [key, value] of Object.entries(fields || {})) {
    if (value == null || value === '') continue;
    out[key] = String(value);
  }
  if (out.card_number) out.card_number = `****${out.card_number.slice(-4)}`;
  if (out.cvv) out.cvv = '***';
  return out;
}

function formatPostBody(fields) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    if (value == null || value === '') continue;
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

function analyzeUrlEncoding(fields) {
  const safe = sanitizeForLog(fields);
  const encoded = formatPostBody(safe);
  const decoded = Object.fromEntries(new URLSearchParams(encoded));
  const watchKeys = ['paytr_token', 'payment_amount', 'user_basket', 'merchant_oid', 'email', 'user_ip'];
  const analysis = {};
  for (const key of watchKeys) {
    if (safe[key] == null) continue;
    const original = safe[key];
    const roundTrip = decoded[key];
    analysis[key] = {
      originalCharLength: original.length,
      originalByteLength: new TextEncoder().encode(original).length,
      roundTripMatch: original === roundTrip,
    };
  }
  return { encodedBodyLength: encoded.length, fields: analysis };
}

export function submitPaytrPayment(formFields, card) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = PAYTR_ODEME_URL;
  form.acceptCharset = 'UTF-8';
  form.style.display = 'none';

  const fields = {
    ...formFields,
    cc_owner: card.cc_owner.trim(),
    card_number: card.card_number.replace(/\D/g, ''),
    expiry_month: card.expiry_month,
    expiry_year: card.expiry_year,
    cvv: card.cvv,
  };

  const safe = sanitizeForLog(fields);

  const finalBody = formatPostBody(fields);
  const curlBody = buildCurlCommand(finalBody);
  console.log('[paytr:browser] generated paytr_token', safe.paytr_token ?? '(missing)');
  console.log('[paytr:browser] final form body exact', finalBody);
  console.log('[paytr:browser] final curl body exact', curlBody);
  console.log('[paytr:browser] url encoding analysis', JSON.stringify(analyzeUrlEncoding(fields), null, 2));

  for (const [name, value] of Object.entries(fields)) {
    if (value == null || value === '') continue;
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.setAttribute('value', String(value));
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}
