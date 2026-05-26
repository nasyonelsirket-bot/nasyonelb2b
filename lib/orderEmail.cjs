/**
 * Resend — sipariş onay ve kargo bildirim e-postaları
 */

const { getCarrierTrackingUrl } = require('./carrierTracking.cjs');
const { resolveCanonicalSiteUrl } = require('./canonicalSiteUrl.cjs');

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
  const base = resolveCanonicalSiteUrl(siteUrl, process.env.SITE_URL, process.env.URL);
  if (!base) return logo;
  return `${base}${logo.startsWith('/') ? logo : `/${logo}`}`;
}

function paymentLabel(method) {
  if (method === 'iban') return 'Havale / EFT (IBAN) — %10 indirim';
  if (method === 'cod') return 'Kapıda ödeme';
  if (method === 'paytr') return 'Kredi / banka kartı (PayTR)';
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

async function sendResendEmail({ to, subject, html, siteName = 'Nasyonel Toys' }, attempt = 1) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const from = String(process.env.RESEND_FROM_EMAIL || '').trim();
  if (!apiKey || !to) {
    const reason = 'RESEND_API_KEY veya alıcı yok';
    console.error('[orderEmail] skipped:', reason, { to: to || null, attempt });
    return { ok: false, skipped: true, reason };
  }
  if (!from || from.includes('resend.dev')) {
    const reason =
      'RESEND_FROM_EMAIL tanımlı değil veya test adresi (onboarding@resend.dev). Netlify\'da siparis@nasyoneltoys.com kullanın ve domain Verified olsun.';
    console.error('[orderEmail] skipped:', reason, { attempt });
    return {
      ok: false,
      skipped: true,
      reason,
    };
  }

  try {
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
      console.error('[orderEmail] Resend API error:', {
        attempt,
        status: res.status,
        to,
        subject,
        detail,
      });
      return { ok: false, error: detail, status: res.status, from };
    }
    return { ok: true, id: data.id };
  } catch (err) {
    console.error('[orderEmail] Resend fetch error:', { attempt, to, subject, message: err.message });
    return { ok: false, error: err.message || 'Resend isteği başarısız' };
  }
}

async function sendResendEmailWithRetry(opts, maxAttempts = 3) {
  let last = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    last = await sendResendEmail(opts, attempt);
    if (last.ok || last.skipped) return last;
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 800));
    }
  }
  return last;
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
    results.customer = await sendResendEmailWithRetry({
      to: customer.email.trim(),
      subject: `Siparişiniz alındı — ${orderNo}`,
      html: customerHtml,
      siteName,
    });
    if (!results.customer?.ok && !results.customer?.skipped) {
      console.error('[orderEmail] müşteri maili başarısız:', results.customer);
    }
  } else {
    console.error('[orderEmail] müşteri e-postası yok — onay maili gönderilmedi', { orderNo });
  }

  const notifyTo = String(process.env.ORDER_NOTIFY_EMAIL || order.notifyEmail || '').trim();
  if (notifyTo) {
    const adminNote =
      payment === 'iban'
        ? `<p style="background:#fff8e1;border-left:4px solid #f5b800;padding:12px;margin:0 0 16px;font-size:14px"><strong>IBAN ödemesi</strong> — Bankadan kontrol edin.</p>`
        : payment === 'paytr'
          ? `<p style="background:#ecfdf5;border-left:4px solid #059669;padding:12px;margin:0 0 16px;font-size:14px"><strong>PayTR kart ödemesi</strong> — Ödeme onaylandı.</p>`
          : `<p style="background:#e8f4fd;border-left:4px solid #0a1f4d;padding:12px;margin:0 0 16px;font-size:14px"><strong>Kapıda ödeme</strong> seçildi.</p>`;

    const adminBody = `
      ${adminNote}
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

    results.admin = await sendResendEmailWithRetry({
      to: notifyTo,
      subject: `[Yeni Sipariş] ${orderNo} — ${customer.name || 'Müşteri'}`,
      html: adminHtml,
      siteName,
    });
    if (!results.admin?.ok && !results.admin?.skipped) {
      console.error('[orderEmail] admin maili başarısız:', results.admin);
    }
  } else {
    console.error('[orderEmail] ORDER_NOTIFY_EMAIL tanımlı değil — admin bildirimi gönderilmedi', {
      orderNo,
    });
  }

  const summary = summarizeOrderEmailResults(results);
  return { ...results, ...summary };
}

/** Kargoya verildi / takip güncellendi — müşteriye bildirim */
async function sendShippedEmail(order, { siteUrl, isUpdate = false } = {}) {
  const customer = order.customer || {};
  const email = String(customer.email || '').trim();
  if (!email) {
    return { ok: false, skipped: true, summary: 'Müşteri e-postası yok — mail gönderilmedi' };
  }

  const siteName = order.siteName || 'Nasyonel Toys';
  const orderNo = order.orderNumber || order.id || '-';
  const carrier = String(order.shippingCarrier || '').trim();
  const tracking = String(order.trackingNumber || '').trim();
  const trackUrl = getCarrierTrackingUrl(carrier, tracking);
  const base = resolveCanonicalSiteUrl(siteUrl, order.siteUrl, process.env.SITE_URL, process.env.URL);
  const orderTrackUrl = `${base}/siparis-takip`;
  const logo = absoluteLogoUrl(order.siteLogoUrl, base);

  const title = isUpdate ? 'Kargo Bilgileriniz Güncellendi' : 'Siparişiniz Kargoya Verildi';
  const intro = isUpdate
    ? 'Siparişinizin <strong>kargo bilgileri güncellendi</strong>. Aşağıdan takip edebilirsiniz.'
    : 'Siparişiniz <strong>kargoya verildi</strong>. Kısa süre içinde elinize ulaşacaktır.';

  const infoRows = [
    `<tr><td style="padding:4px 0"><strong>Sipariş no:</strong> ${escapeHtml(orderNo)}</td></tr>`,
    carrier
      ? `<tr><td style="padding:4px 0"><strong>Kargo firması:</strong> ${escapeHtml(carrier)}</td></tr>`
      : '',
    tracking
      ? `<tr><td style="padding:4px 0"><strong>Takip no:</strong> ${escapeHtml(tracking)}</td></tr>`
      : `<tr><td style="padding:4px 0;color:#6b7280">Takip numarası kısa süre içinde güncellenecektir.</td></tr>`,
  ].join('');

  const buttons = [
    trackUrl
      ? `<a href="${escapeHtml(trackUrl)}" style="display:inline-block;background:#0a1f4d;color:#fff;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;margin-right:8px">Kargo takip et</a>`
      : '',
    `<a href="${escapeHtml(orderTrackUrl)}" style="display:inline-block;background:#f5b800;color:#061428;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px">Sipariş takip</a>`,
  ]
    .filter(Boolean)
    .join(' ');

  const bodyHtml = `
    <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6">
      Merhaba <strong>${escapeHtml(customer.name)}</strong>,
    </p>
    <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6">
      ${intro}
    </p>
    <table width="100%" style="background:#f8fafc;border-radius:12px;padding:12px;margin:16px 0;font-size:14px">
      ${infoRows}
    </table>
    <p style="margin:16px 0">${buttons}</p>
    <p style="margin:12px 0 0;color:#6b7280;font-size:13px">
      Sorularınız için WhatsApp üzerinden bize yazabilirsiniz.
    </p>`;

  const html = emailLayout({
    siteName,
    logoUrl: logo,
    title,
    bodyHtml,
  });

  const subject = isUpdate
    ? `Kargo bilgileri güncellendi — ${orderNo}`
    : `Siparişiniz kargoda — ${orderNo}`;

  const result = await sendResendEmailWithRetry({
    to: email,
    subject,
    html,
    siteName,
  });

  if (result.ok) {
    return {
      ok: true,
      customer: result,
      summary: isUpdate
        ? 'Müşteriye kargo güncelleme maili gönderildi'
        : 'Müşteriye kargo bildirim maili gönderildi',
    };
  }
  if (result.skipped) {
    console.error('[orderEmail] kargo maili atlandı:', result.reason || 'bilinmiyor', { orderNo });
    return { ok: false, skipped: true, customer: result, summary: result.reason || 'Kargo maili gönderilmedi' };
  }
  console.error('[orderEmail] kargo maili başarısız:', result.error || 'bilinmiyor', { orderNo });
  return {
    ok: false,
    customer: result,
    summary: `Kargo maili hata: ${result.error || 'bilinmiyor'}`,
  };
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
  return sendResendEmailWithRetry({
    to: target,
    subject: `${siteName} — E-posta testi`,
    html,
    siteName,
  });
}

module.exports = {
  sendOrderEmails,
  sendShippedEmail,
  sendResendEmail,
  sendResendEmailWithRetry,
  sendTestEmail,
  summarizeOrderEmailResults,
  emailLayout,
  absoluteLogoUrl,
};
