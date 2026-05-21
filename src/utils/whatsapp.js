import { getCartDiscount, PAYMENT_IBAN } from '@/utils/cartDiscount';
import { getFreeShippingStatus, getOrderPayableTotal } from '@/utils/cartShipping';

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

/** Perakende sipariş — WhatsApp mesajında tüm detaylar */
export function buildRetailOrderWhatsAppMessage({
  siteName = 'Nasyonel Toys',
  customer = {},
  items = [],
  shipping,
  discount,
  orderTotal,
  orderNumber,
  paymentMethod = 'cod',
  ibanInfo,
}) {
  const dateStr = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const lines = [
    `Merhaba, ${siteName} web sitesinden sipariş vermek istiyorum.`,
    '',
    orderNumber ? `Sipariş No: *${orderNumber}*` : '',
    `📅 Tarih: ${dateStr}`,
    '',
    '👤 *Teslimat Bilgileri*',
    `Ad Soyad: ${customer.name?.trim() || '-'}`,
    `Telefon: ${customer.phone?.trim() || '-'}`,
    `E-posta: ${customer.email?.trim() || '-'}`,
    `Adres: ${customer.address?.trim() || '-'}`,
    customer.city ? `İl: ${customer.city.trim()}` : '',
    customer.district ? `İlçe: ${customer.district.trim()}` : '',
    '',
    `💳 *Ödeme:* ${paymentLabel(paymentMethod)}`,
    '',
    '🛒 *Ürünler*',
    '',
  ].filter(Boolean);

  items.forEach((item, index) => {
    const lineTotal = item.price * item.quantity;
    lines.push(
      `${index + 1}. ${item.name}`,
      `   ${item.quantity} adet × ${formatPrice(item.price)} = ${formatPrice(lineTotal)}`,
      item.sku ? `   SKU: ${item.sku}` : '',
      '',
    );
  });

  lines.push(`Ara toplam: ${formatPrice(subtotal)}`);
  if (discount?.discountAmount > 0) {
    lines.push(`İndirim (${discount.tierLabel}): -${formatPrice(discount.discountAmount)}`);
  }
  lines.push(
    shipping?.eligible ? 'Kargo: Bedava' : `Kargo: ${formatPrice(shipping?.shippingFee || 0)}`,
    `*Ödenecek tutar: ${formatPrice(orderTotal)}*`,
    '',
  );

  if (paymentMethod === PAYMENT_IBAN && ibanInfo?.iban) {
    lines.push(
      '🏦 *IBAN Bilgileri*',
      `Alıcı: ${ibanInfo.accountName || '-'}`,
      `IBAN: ${ibanInfo.iban}`,
      ibanInfo.bankName ? `Banka: ${ibanInfo.bankName}` : '',
      'Ödemeyi yaptıktan sonra dekontu bu sohbete ileteceğim.',
      '',
    );
  }

  lines.push('Siparişimi onaylamanızı rica ederim. Teşekkürler.');

  return lines.filter(Boolean).join('\n');
}

export function openWhatsAppWithMessage(phone, message) {
  const cleanPhone = String(phone).replace(/\D/g, '');
  if (!cleanPhone) throw new Error('WhatsApp numarası tanımlı değil');
  window.location.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(phone, cartItems, options = {}) {
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = getCartDiscount(subtotal, options.paymentMethod);
  const shipping = options.shipping || getFreeShippingStatus(discount.subtotal);
  const orderTotal =
    options.orderTotal ?? getOrderPayableTotal(discount.grandTotal, shipping);
  const message = buildRetailOrderWhatsAppMessage({
    siteName: options.siteName,
    customer: options.customer,
    items: cartItems,
    shipping,
    discount,
    orderTotal,
    paymentMethod: options.paymentMethod,
    orderNumber: options.orderNumber,
    ibanInfo: options.ibanInfo,
  });
  openWhatsAppWithMessage(phone, message);
}

export function buildOrderSubmitWhatsAppMessage(opts) {
  return buildRetailOrderWhatsAppMessage(opts);
}
