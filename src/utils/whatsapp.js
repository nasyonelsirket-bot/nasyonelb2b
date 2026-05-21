import { PAYMENT_IBAN } from '@/utils/cartDiscount';

export function formatPrice(price) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(price);
}

function paymentLabel(method) {
  if (method === PAYMENT_IBAN) return 'Havale / EFT (IBAN) — %10 indirim';
  return 'Kapıda ödeme';
}

/** WhatsApp — kısa mesaj + PDF linki (toptan akışı gibi) */
export function buildOrderSubmitWhatsAppMessage({
  siteName = 'Nasyonel Toys',
  customer = {},
  pdfUrl,
  orderTotal,
  orderNumber,
  itemCount = 0,
  paymentMethod = 'cod',
}) {
  return [
    'Merhaba,',
    '',
    `Web sitenizden (${siteName}) yapmış olduğum siparişim:`,
    '',
    orderNumber ? `Sipariş No: ${orderNumber}` : '',
    `Ad Soyad: ${customer.name?.trim() || '-'}`,
    `Tel: ${customer.phone?.trim() || '-'}`,
    customer.email ? `E-posta: ${customer.email.trim()}` : '',
    `Ödeme: ${paymentLabel(paymentMethod)}`,
    itemCount ? `Ürün: ${itemCount} kalem` : '',
    orderTotal != null ? `Tutar: ${formatPrice(orderTotal)}` : '',
    '',
    'Sipariş formu (PDF):',
    pdfUrl || '',
    '',
    'Onayınızı rica ederim. Teşekkürler.',
  ]
    .filter((line) => line !== undefined)
    .join('\n');
}

export function openWhatsAppWithMessage(phone, message) {
  const cleanPhone = String(phone).replace(/\D/g, '');
  if (!cleanPhone) throw new Error('WhatsApp numarası tanımlı değil');
  if (!pdfUrlInMessage(message)) {
    throw new Error('Sipariş PDF linki oluşturulamadı');
  }
  window.location.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

function pdfUrlInMessage(message) {
  return /https?:\/\//i.test(String(message || ''));
}
