/** İmzalı alanlar + kart bilgisini doğrudan PayTR /odeme adresine POST et. */
const PAYTR_ODEME_URL = 'https://www.paytr.com/odeme';

const LOG_KEYS = [
  'payment_amount',
  'payment_type',
  'installment_count',
  'no_installment',
  'currency',
  'lang',
  'paytr_token',
];

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
    params.append(key, value);
  }
  return params.toString();
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
  const summary = {};
  for (const key of LOG_KEYS) {
    if (safe[key] != null) summary[key] = safe[key];
  }

  console.log('[paytr:browser] no_installment', safe.no_installment ?? '(missing)');
  console.log('[paytr:browser] direct api key fields', summary);
  console.log('[paytr:browser] direct api full payload', safe);
  console.log('[paytr:browser] post body', formatPostBody(safe));

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
