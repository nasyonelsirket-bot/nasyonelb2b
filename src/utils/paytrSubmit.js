/** PayTR /odeme — kart bilgileri doğrudan PayTR'ye POST (merchant sunucusuna değil). */
export function submitPaytrForm(postUrl, fields) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = postUrl;
  form.acceptCharset = 'UTF-8';
  form.enctype = 'application/x-www-form-urlencoded';
  form.style.display = 'none';

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
