import { buildOrderSubmitWhatsAppMessage, openWhatsAppWithMessage } from '@/utils/whatsapp';
import { saveOrder } from '@/services/orderApi';
import { resolveLogoUrl } from '@/utils/resolveLogoUrl';

function cleanWhatsAppPhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

/**
 * Sipariş kaydet → müşteriye e-posta → WhatsApp (PDF linki ile)
 */
export async function submitOrderViaWhatsApp({
  phone,
  siteName,
  siteUrl,
  siteLogoUrl,
  pdfSettings,
  customer,
  items,
  discount,
  shipping,
  orderTotal,
  paymentMethod,
  ibanInfo,
  notifyEmail,
  couponCode,
}) {
  const businessPhone = cleanWhatsAppPhone(phone);
  if (!businessPhone) {
    throw new Error('WhatsApp numarası ayarlarda tanımlı değil');
  }

  const saved = await saveOrder({
    siteName: siteName || 'Nasyonel Toys',
    siteUrl: siteUrl || '',
    siteLogoUrl: resolveLogoUrl(siteLogoUrl),
    pdfSettings,
    customer,
    items: items || [],
    discount,
    shipping,
    orderTotal,
    paymentMethod,
    ibanInfo,
    notifyEmail,
    couponCode: couponCode || discount?.couponCode || null,
  });

  if (!saved?.url) {
    throw new Error('Sipariş PDF linki oluşturulamadı. Lütfen tekrar deneyin.');
  }

  const message = buildOrderSubmitWhatsAppMessage({
    siteName: siteName || 'Nasyonel Toys',
    customer,
    pdfUrl: saved.url,
    orderTotal,
    orderNumber: saved.orderNumber,
    itemCount: items?.length || 0,
    paymentMethod,
  });

  openWhatsAppWithMessage(businessPhone, message);

  let emailNote = '';
  const em = saved.email;
  if (em?.summary) {
    emailNote = em.ok ? ` ${em.summary}.` : ` E-posta: ${em.summary}.`;
  } else if (em?.error) {
    emailNote = ` E-posta hatası: ${em.error}.`;
  } else if (em?.customer?.ok) {
    emailNote = ' Müşteriye onay maili gönderildi.';
  } else if (em?.customer?.error) {
    emailNote = ` Müşteri maili: ${em.customer.error}.`;
  } else if (em?.admin?.error) {
    emailNote = ` Bildirim maili: ${em.admin.error}.`;
  } else if (em?.customer?.skipped || em?.admin?.skipped) {
    emailNote = ' E-posta gönderilmedi — Netlify RESEND ayarlarını kontrol edin.';
  }

  return {
    mode: 'whatsapp',
    orderId: saved.id,
    orderNumber: saved.orderNumber,
    pdfUrl: saved.url,
    email: em,
    message: `Sipariş kaydedildi (${saved.orderNumber}). WhatsApp açıldı — PDF linkli mesajı gönderin.${emailNote}`,
  };
}
