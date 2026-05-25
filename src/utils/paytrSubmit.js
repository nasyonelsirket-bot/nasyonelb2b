/** İmzalı alanlar + kart bilgisini doğrudan PayTR /odeme adresine POST et. */
const PAYTR_ODEME_URL = 'https://www.paytr.com/odeme';

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
