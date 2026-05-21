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

  const emailNote = saved.email?.skipped
    ? ' (E-posta: Resend ayarlarını kontrol edin)'
    : saved.email?.customer?.ok
      ? ' Onay e-postası gönderildi.'
      : saved.email?.customer?.error
        ? ` (E-posta: ${saved.email.customer.error})`
        : '';

  return {
    mode: 'whatsapp',
    orderId: saved.id,
    orderNumber: saved.orderNumber,
    pdfUrl: saved.url,
    message: `Sipariş kaydedildi (${saved.orderNumber}). WhatsApp açıldı — PDF linkli mesajı gönderin.${emailNote}`,
  };
}
