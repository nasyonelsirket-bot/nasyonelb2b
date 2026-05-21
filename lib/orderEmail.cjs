/**
 * Resend API — sipariş bildirim e-postaları
 * Env: RESEND_API_KEY, RESEND_FROM_EMAIL, ORDER_NOTIFY_EMAIL
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

async function sendResendEmail({ to, subject, html }) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const from = String(process.env.RESEND_FROM_EMAIL || 'siparis@nasyoneltoys.com').trim();
  if (!apiKey || !to) {
    return { ok: false, skipped: true, reason: 'RESEND_API_KEY veya alıcı yok' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: from.includes('<') ? from : `Nasyonel Toys <${from}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.message || `Resend HTTP ${res.status}` };
  }
  return { ok: true, id: data.id };
}

function buildItemsHtml(items) {
  return (items || [])
    .map(
      (i) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(i.name)}</td>` +
        `<td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>` +
        `<td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatTry(i.price * i.quantity)}</td></tr>`,
    )
    .join('');
}

function paymentLabel(method) {
  if (method === 'iban') return 'Havale / EFT (IBAN) — %10 indirim';
  if (method === 'cod') return 'Kapıda ödeme';
  return method || '-';
}

async function sendOrderEmails(order) {
  const results = { customer: null, admin: null };
  const customer = order.customer || {};
  const siteName = order.siteName || 'Nasyonel Toys';
  const orderNo = order.orderNumber || order.id || '-';
  const payment = order.paymentMethod || 'cod';
  const total = formatTry(order.orderTotal);

  const itemsTable = `
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#0a1f4d;color:#fff">
        <th style="padding:8px;text-align:left">Ürün</th>
        <th style="padding:8px">Adet</th>
        <th style="padding:8px;text-align:right">Tutar</th>
      </tr></thead>
      <tbody>${buildItemsHtml(order.items)}</tbody>
    </table>`;

  const customerHtml = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#0a1f4d">${escapeHtml(siteName)}</h2>
      <p>Merhaba <strong>${escapeHtml(customer.name)}</strong>,</p>
      <p>Siparişiniz alındı. Sipariş no: <strong>${escapeHtml(orderNo)}</strong></p>
      <p>Ödeme: ${escapeHtml(paymentLabel(payment))}</p>
      <p>Toplam: <strong>${total}</strong></p>
      ${itemsTable}
      <p style="margin-top:16px;color:#666;font-size:13px">Sorularınız için WhatsApp üzerinden bize ulaşabilirsiniz.</p>
    </div>`;

  if (customer.email) {
    results.customer = await sendResendEmail({
      to: customer.email.trim(),
      subject: `Siparişiniz alındı — ${orderNo}`,
      html: customerHtml,
    });
  }

  const notifyTo =
    String(process.env.ORDER_NOTIFY_EMAIL || order.notifyEmail || '').trim() ||
    String(customer.notifyFallback || '').trim();

  const adminTarget = notifyTo || process.env.ADMIN_ORDER_EMAIL;
  if (adminTarget) {
    const ibanNote =
      payment === 'iban'
        ? `<p style="background:#fff3cd;padding:12px;border-radius:8px"><strong>IBAN ödemesi:</strong> Müşteri havale/EFT ile ödediğini belirtti. Banka hesabınızdan kontrol edin.</p>`
        : `<p style="background:#e8f4fd;padding:12px;border-radius:8px"><strong>Kapıda ödeme</strong> seçildi.</p>`;

    const adminHtml = `
      <div style="font-family:sans-serif;max-width:600px">
        <h2>Yeni sipariş — ${escapeHtml(orderNo)}</h2>
        ${ibanNote}
        <p><strong>${escapeHtml(customer.name)}</strong> · ${escapeHtml(customer.phone)}</p>
        <p>${escapeHtml(customer.email || '')}</p>
        <p>${escapeHtml(customer.address || '')}</p>
        <p>İl/İlçe: ${escapeHtml(customer.city || '')} / ${escapeHtml(customer.district || '')}</p>
        <p>Ödeme: ${escapeHtml(paymentLabel(payment))} · Toplam: <strong>${total}</strong></p>
        ${itemsTable}
      </div>`;

    results.admin = await sendResendEmail({
      to: adminTarget,
      subject: `[Yeni Sipariş] ${orderNo} — ${customer.name || 'Müşteri'}`,
      html: adminHtml,
    });
  }

  return results;
}

module.exports = { sendOrderEmails, sendResendEmail };
