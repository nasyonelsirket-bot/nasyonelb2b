/** İmzalı alanlar + kart bilgisini doğrudan PayTR /odeme adresine POST et. */
const PAYTR_ODEME_URL = 'https://www.paytr.com/odeme';

const LOG_KEYS = [
  'payment_amount',
  'payment_type',
  'installment_count',
  'no_installment',
  'max_installment',
  'currency',
  'lang',
  'paytr_token',
  'user_ip',
  'test_mode',
  'non_3d',
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

function inspectString(label, value, options = {}) {
  const { mask = false, maxHexBytes = 128 } = options;
  const str = value == null ? '' : String(value);
  const bytes = new TextEncoder().encode(str);
  const invisible = [];
  for (let i = 0; i < str.length; i += 1) {
    const code = str.charCodeAt(i);
    const ch = str[i];
    if (ch !== ' ' && ch !== '\t' && ch !== '\n' && ch !== '\r' && /\s/.test(ch)) {
      invisible.push(`U+${code.toString(16).padStart(4, '0')}`);
    } else if (code < 32 && ch !== '\t' && ch !== '\n' && ch !== '\r') {
      invisible.push(`U+${code.toString(16).padStart(4, '0')}`);
    }
  }
  const hexPreview = mask
    ? undefined
    : Array.from(bytes.slice(0, maxHexBytes))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
  return {
    label,
    value: mask ? `[masked len=${str.length}]` : str,
    charLength: str.length,
    byteLengthUtf8: bytes.length,
    byteHexPreview: hexPreview,
    hasLeadingTrailingSpace: str !== str.trim(),
    invisibleCharCodes: [...new Set(invisible)],
    isAscii: [...str].every((c) => c.charCodeAt(0) < 128),
  };
}

function formatPostBody(fields) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    params.append(key, value);
  }
  return params.toString();
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
  const summary = {};
  for (const key of LOG_KEYS) {
    if (safe[key] != null) summary[key] = safe[key];
  }

  const generatedToken = safe.paytr_token;
  if (generatedToken) {
    console.log('[paytr:browser] generated paytr_token (pre-submit)', generatedToken);
    console.log(
      '[paytr:browser] generated paytr_token inspect',
      JSON.stringify(inspectString('paytr_token', generatedToken), null, 2),
    );
  }

  console.log('[paytr:browser] user_ip', safe.user_ip ?? '(missing)');
  console.log('[paytr:browser] user_basket exact', safe.user_basket ?? '(missing)');
  console.log(
    '[paytr:browser] user_basket byte inspect',
    JSON.stringify(inspectString('user_basket', safe.user_basket), null, 2),
  );
  console.log('[paytr:browser] no_installment', safe.no_installment ?? '(missing)');
  console.log('[paytr:browser] max_installment', safe.max_installment ?? '(missing)');
  console.log('[paytr:browser] direct api key fields', summary);
  console.log('[paytr:browser] direct api full payload', safe);

  const postBody = formatPostBody(safe);
  console.log('[paytr:browser] post body', postBody);
  console.log('[paytr:browser] url encoding analysis', JSON.stringify(analyzeUrlEncoding(safe), null, 2));

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
