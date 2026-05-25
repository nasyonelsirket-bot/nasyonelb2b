/** Ödeme isteğini sunucu üzerinden PayTR auto-submit HTML'ine yönlendir. */
export function forwardPaytrPayment(orderId, card) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/api/paytr/forward';
  form.acceptCharset = 'UTF-8';
  form.style.display = 'none';

  const fields = {
    orderId,
    cc_owner: card.cc_owner.trim(),
    card_number: card.card_number.replace(/\D/g, ''),
    expiry_month: card.expiry_month,
    expiry_year: card.expiry_year,
    cvv: card.cvv,
  };

  for (const [name, value] of Object.entries(fields)) {
    if (!value) continue;
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.setAttribute('value', String(value));
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}
