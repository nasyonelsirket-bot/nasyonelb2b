/**
 * Resend — sipariş onay e-postası (site logosu ile şablon)
 */

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTry(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
    Number(n) || 0,
  );
}

function absoluteLogoUrl(siteLogoUrl, siteUrl) {
  const logo = String(siteLogoUrl || '/nasyonel-logo.png?v=3').trim();
  if (logo.startsWith('http') || logo.startsWith('https')) return logo;
  if (logo.startsWith('data:')) return logo;
  const base = String(siteUrl || process.env.URL || '').replace(/\/$/, '');
  if (!base) return logo;
  return `${base}${logo.startsWith('/') ? logo : `/${logo}`}`;
}

function paymentLabel(method) {
  if (method === 'iban') return 'Havale / EFT (IBAN) — %10 indirim';
  if (method === 'cod') return 'Kapıda ödeme';
  return method || '-';
}

function buildItemsHtml(items) {
  return (items || [])
    .map(
      (i) =>
        `<tr>
          <td style="padding:10px 8px;border-bottom:1px solid #e8ecf4;color:#1a1a1a">${escapeHtml(i.name)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e8ecf4;text-align:center">${i.quantity}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e8ecf4;text-align:right;font-weight:600">${formatTry(i.price * i.quantity)}</td>
        </tr>`,
    )
    .join('');
}

function emailLayout({ siteName, logoUrl, title, bodyHtml, footerHtml }) {
  const logoBlock = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(siteName)}" width="200" style="max-width:200px;height:auto;display:block;margin:0 auto 16px" />`
    : `<h1 style="margin:0;font-size:22px;color:#0a1f4d;text-align:center">${escapeHtml(siteName)}</h1>`;

  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f7fc;font-family:Segoe UI,Roboto,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fc;padding:24px 12px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(10,31,77,0.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#061428 0%,#0a1f4d 100%);padding:28px 24px;text-align:center">
            ${logoBlock}
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px">
            <h2 style="margin:0 0 16px;font-size:20px;color:#0a1f4d">${escapeHtml(title)}</h2>
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:0 24px 24px;color:#6b7280;font-size:12px;line-height:1.5">
            ${footerHtml || `<p style="margin:0">Teşekkürler,<br><strong>${escapeHtml(siteName)}</strong></p>`}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendResendEmail({ to, subject, html, siteName = 'Nasyonel Toys' }) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const from = String(process.env.RESEND_FROM_EMAIL || '').trim();
  if (!apiKey || !to) {
    return { ok: false, skipped: true, reason: 'RESEND_API_KEY veya alıcı yok' };
  }
  if (!from || from.includes('resend.dev')) {
    return {
      ok: false,
      skipped: true,
      reason:
        'RESEND_FROM_EMAIL tanımlı değil veya test adresi (onboarding@resend.dev). Netlify\'da siparis@nasyoneltoys.com kullanın ve domain Verified olsun.',
    };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: from.includes('<') ? from : `${siteName} <${from}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      data.message ||
      (typeof data.error === 'string' ? data.error : data.error?.message) ||
      (Array.isArray(data.errors) ? data.errors.map((e) => e.message).join('; ') : null) ||
      `Resend HTTP ${res.status}`;
    return { ok: false, error: detail, status: res.status, from };
  }
  return { ok: true, id: data.id };
}

/** Sipariş sonrası kullanıcı mesajı */
function summarizeOrderEmailResults(results) {
  if (!results || typeof results !== 'object') {
    return { ok: false, summary: 'E-posta yanıtı alınamadı' };
  }
  if (results.error) {
    return { ok: false, summary: results.error };
  }

  const parts = [];
  const c = results.customer;
  const a = results.admin;

  if (c?.ok) parts.push('Müşteriye onay maili gönderildi');
  else if (c?.skipped) parts.push(`Müşteri maili: ${c.reason || 'gönderilmedi (API/ayar)'}`);
  else if (c?.error) parts.push(`Müşteri maili hata: ${c.error}`);

  if (a?.ok) parts.push('Mağaza bildirimi gönderildi');
  else if (a?.skipped && !process.env.ORDER_NOTIFY_EMAIL) {
    parts.push('Bildirim maili: ORDER_NOTIFY_EMAIL tanımlı değil');
  } else if (a?.error) parts.push(`Bildirim hata: ${a.error}`);
  else if (!a && !process.env.ORDER_NOTIFY_EMAIL) {
    parts.push('ORDER_NOTIFY_EMAIL eksik');
  }

  const ok = !!(c?.ok || a?.ok);
  return {
    ok,
    summary: parts.length ? parts.join(' · ') : ok ? 'E-posta gönderildi' : 'E-posta gönderilemedi',
  };
}

async function sendOrderEmails(order, { pdfUrl, siteUrl } = {}) {
  const results = { customer: null, admin: null };
  const customer = order.customer || {};
  const siteName = order.siteName || 'Nasyonel Toys';
  const orderNo = order.orderNumber || order.id || '-';
  const payment = order.paymentMethod || 'cod';
  const total = formatTry(order.orderTotal);
  const logo = absoluteLogoUrl(order.siteLogoUrl, siteUrl || order.siteUrl);
  const pdfLink = pdfUrl || order.pdfUrl || '';

  const itemsTable = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px;border-collapse:collapse">
      <thead>
        <tr style="background:#0a1f4d;color:#fff">
          <th style="padding:10px 8px;text-align:left">Ürün</th>
          <th style="padding:10px 8px">Adet</th>
          <th style="padding:10px 8px;text-align:right">Tutar</th>
        </tr>
      </thead>
      <tbody>${buildItemsHtml(order.items)}</tbody>
    </table>`;

  const customerBody = `
    <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6">
      Merhaba <strong>${escapeHtml(customer.name)}</strong>,
    </p>
    <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6">
      Siparişiniz başarıyla <strong>alındı</strong>. En kısa sürede sizinle iletişime geçeceğiz.
    </p>
    <table width="100%" style="background:#f8fafc;border-radius:12px;padding:12px;margin:16px 0;font-size:14px">
      <tr><td style="padding:4px 0"><strong>Sipariş no:</strong> ${escapeHtml(orderNo)}</td></tr>
      <tr><td style="padding:4px 0"><strong>Ödeme:</strong> ${escapeHtml(paymentLabel(payment))}</td></tr>
      <tr><td style="padding:4px 0"><strong>Toplam:</strong> ${total}</td></tr>
    </table>
    ${itemsTable}
    ${
      pdfLink
        ? `<p style="margin:16px 0"><a href="${escapeHtml(pdfLink)}" style="display:inline-block;background:#f5b800;color:#061428;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px">Sipariş PDF&apos;ini Görüntüle</a></p>`
        : ''
    }
    <p style="margin:12px 0 0;color:#6b7280;font-size:13px">
      Sorularınız için WhatsApp üzerinden bize yazabilirsiniz.
    </p>`;

  const customerHtml = emailLayout({
    siteName,
    logoUrl: logo,
    title: 'Siparişiniz Alındı',
    bodyHtml: customerBody,
  });

  if (customer.email) {
    results.customer = await sendResendEmail({
      to: customer.email.trim(),
      subject: `Siparişiniz alındı — ${orderNo}`,
      html: customerHtml,
      siteName,
    });
  }

  const notifyTo = String(process.env.ORDER_NOTIFY_EMAIL || order.notifyEmail || '').trim();
  if (notifyTo) {
    const ibanNote =
      payment === 'iban'
        ? `<p style="background:#fff8e1;border-left:4px solid #f5b800;padding:12px;margin:0 0 16px;font-size:14px"><strong>IBAN ödemesi</strong> — Bankadan kontrol edin.</p>`
        : `<p style="background:#e8f4fd;border-left:4px solid #0a1f4d;padding:12px;margin:0 0 16px;font-size:14px"><strong>Kapıda ödeme</strong> seçildi.</p>`;

    const adminBody = `
      ${ibanNote}
      <p><strong>${escapeHtml(customer.name)}</strong><br>
      ${escapeHtml(customer.phone)} · ${escapeHtml(customer.email || '')}</p>
      <p>${escapeHtml(customer.address || '')}<br>
      ${escapeHtml(customer.city || '')} / ${escapeHtml(customer.district || '')}</p>
      <p>Ödeme: ${escapeHtml(paymentLabel(payment))} · Toplam: <strong>${total}</strong></p>
      ${itemsTable}
      ${pdfLink ? `<p><a href="${escapeHtml(pdfLink)}">PDF sipariş formu</a></p>` : ''}`;

    const adminHtml = emailLayout({
      siteName,
      logoUrl: logo,
      title: `Yeni Sipariş — ${orderNo}`,
      bodyHtml: adminBody,
    });

    results.admin = await sendResendEmail({
      to: notifyTo,
      subject: `[Yeni Sipariş] ${orderNo} — ${customer.name || 'Müşteri'}`,
      html: adminHtml,
      siteName,
    });
  }

  const summary = summarizeOrderEmailResults(results);
  return { ...results, ...summary };
}

async function sendTestEmail(to, siteName = 'Nasyonel Toys') {
  const target = String(to || process.env.ORDER_NOTIFY_EMAIL || '').trim();
  if (!target) {
    return { ok: false, error: 'Alıcı e-posta adresi yok' };
  }
  const html = emailLayout({
    siteName,
    logoUrl: null,
    title: 'Test e-postası',
    bodyHtml:
      '<p style="color:#374151">Bu bir test mesajıdır. Resend ve Netlify ayarlarınız çalışıyor.</p>',
  });
  return sendResendEmail({
    to: target,
    subject: `${siteName} — E-posta testi`,
    html,
    siteName,
  });
}

module.exports = {
  sendOrderEmails,
  sendResendEmail,
  sendTestEmail,
  summarizeOrderEmailResults,
  emailLayout,
  absoluteLogoUrl,
};
