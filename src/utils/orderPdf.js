import { buildRetailOrderWhatsAppMessage, openWhatsAppWithMessage } from '@/utils/whatsapp';
import { saveOrder } from '@/services/orderApi';

function cleanWhatsAppPhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

/**
 * Sipariş kaydet → e-posta (Resend) → WhatsApp
 */
export async function submitOrderViaWhatsApp({
  phone,
  siteName,
  siteLogoUrl,
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
    siteLogoUrl,
    customer,
    items: items || [],
    discount,
    shipping,
    orderTotal,
    paymentMethod,
    ibanInfo,
    notifyEmail,
  });

  const message = buildRetailOrderWhatsAppMessage({
    siteName: siteName || 'Nasyonel Toys',
    customer,
    items: items || [],
    shipping,
    discount,
    orderTotal,
    paymentMethod,
    orderNumber: saved.orderNumber,
    ibanInfo,
  });

  openWhatsAppWithMessage(businessPhone, message);

  const emailNote = saved.email?.skipped
    ? ' (E-posta: Resend API anahtarı tanımlı değil)'
    : saved.email?.ok
      ? ' Onay e-postası gönderildi.'
      : '';

  return {
    mode: 'whatsapp',
    orderId: saved.id,
    orderNumber: saved.orderNumber,
    message: `Sipariş kaydedildi (${saved.orderNumber}). WhatsApp açıldı — mesajı gönderin.${emailNote}`,
  };
}
