import { resolveMinQuantity } from '@/utils/orderRules';
import { getCartDiscount } from '@/utils/cartDiscount';
import { getFreeShippingStatus, getOrderPayableTotal, STANDARD_SHIPPING_FEE_TL } from '@/utils/cartShipping';

export function formatPrice(price) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(price);
}

function padLine(text, width = 28) {
  const s = String(text || '');
  if (s.length >= width) return s.slice(0, width);
  return s + ' '.repeat(width - s.length);
}

export function buildWhatsAppOrderMessage(cartItems, options = {}) {
  const siteName = options.siteName || 'Nasyonel Toys';
  const customer = options.customer || {};
  const dateStr = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let subtotal = 0;
  cartItems.forEach((item) => {
    subtotal += item.price * item.quantity;
  });
  const discount = options.discount || getCartDiscount(subtotal);
  const shipping = options.shipping || getFreeShippingStatus(discount.subtotal);
  const orderTotal =
    options.orderTotal ?? getOrderPayableTotal(discount.grandTotal, shipping);

  const lines = [
    '╔══════════════════════════════════╗',
    `║  ${padLine(siteName.toUpperCase() + ' · SİPARİŞ FORMU', 32)}║`,
    '╚══════════════════════════════════╝',
    '',
    `📅 *Tarih:* ${dateStr}`,
    '',
    '━━━━━━━━ *MÜŞTERİ BİLGİLERİ* ━━━━━━━━',
    '🏢 *Firma / Bayi Adı:*',
    `→ ${customer.companyName?.trim() || '................................'}`,
    '',
    '👤 *Yetkili Kişi:*',
    `→ ${customer.contactName?.trim() || '................................'}`,
    '',
    '📞 *İletişim Telefonu:*',
    `→ ${customer.phone?.trim() || '................................'}`,
    '',
    '📍 *Teslimat Adresi:*',
    `→ ${customer.address?.trim() || '................................'}`,
    '',
    '━━━━━━━━ *SİPARİŞ KALEMLERİ* ━━━━━━━━',
    '',
  ];

  cartItems.forEach((item, index) => {
    const lineTotal = item.price * item.quantity;
    const minQty = resolveMinQuantity(item);

    lines.push(
      `*▸ KALEM ${index + 1}*`,
      '┌────────────────────────────',
      `│ *Ürün:* ${item.name}`,
      `│ *Stok Kodu:* ${item.sku}`,
      item.category ? `│ *Kategori:* ${item.category}` : null,
      `│ *Birim Fiyat:* ${formatPrice(item.price)}`,
      `│ *Adet:* ${item.quantity}`,
      `│ *Satır Toplam:* ${formatPrice(lineTotal)}`,
      minQty > 1 ? `│ _Min. sipariş: ${minQty} adet_` : null,
      '└────────────────────────────',
      '',
    );
  });

  lines.push(
    '━━━━━━━━ *SİPARİŞ ÖZETİ* ━━━━━━━━━',
    `📦 *Ürün çeşidi:* ${cartItems.length}`,
    `💵 *Ara Toplam:* ${formatPrice(discount.subtotal)}`,
    `🏷️ *İskonto:* ${discount.tierLabel} (-${formatPrice(discount.discountAmount)})`,
    discount.upsellMessage ? `💡 _${discount.upsellMessage}_` : null,
    `🚚 *Kargo:* ${shipping.eligible ? '*Bedava* ✓' : formatPrice(shipping.shippingFee)}`,
    `✅ *ÖDENECEK TUTAR:* *${formatPrice(orderTotal)}*`,
    '',
    '━━━━━━━━ *KARGO* ━━━━━━━━━━━━━━━━━',
    `• ${formatPrice(shipping.threshold)} altı: *${formatPrice(STANDARD_SHIPPING_FEE_TL)} kargo*`,
    `• ${formatPrice(shipping.threshold)} ve üzeri: *kargo bedava*`,
    shipping.eligible
      ? '• Bu siparişe *kargo bedava* uygulandı ✓'
      : `• Bu siparişe ${formatPrice(shipping.shippingFee)} kargo eklendi (${formatPrice(shipping.remaining)} daha eklenirse bedava)`,
    '',
    '━━━━━━━━ *İSKONTO KOŞULLARI* ━━━━━━━━',
    `• ${formatPrice(discount.threshold)} altı sepet: *%5 iskonto*`,
    `• ${formatPrice(discount.threshold)} ve üzeri sepet: *%10 iskonto*`,
    discount.tier === 'high'
      ? '• Bu siparişe *%10* uygulandı ✓'
      : `• Bu siparişe *%5* uygulandı (${formatPrice(discount.remainingToHigh)} daha eklenirse %10)`,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '✅ *Sipariş onayı için lütfen yanıtlayın.*',
    'Teşekkürler — Nasyonel Toys 🧸',
  );

  return lines.filter(Boolean).join('\n');
}

export function buildWhatsAppOrderUrl(phone, cartItems, options = {}) {
  const cleanPhone = String(phone).replace(/\D/g, '');
  const message = encodeURIComponent(buildWhatsAppOrderMessage(cartItems, options));
  return `https://wa.me/${cleanPhone}?text=${message}`;
}

/** PDF linkli kısa sipariş mesajı — WhatsApp karakter sınırına uygun */
export function buildOrderSubmitWhatsAppMessage({
  siteName = 'Nasyonel Toys',
  customer = {},
  pdfUrl,
  orderTotal,
  itemCount = 0,
}) {
  return [
    'Merhaba,',
    '',
    `Web sitenizden (${siteName}) yapmış olduğum siparişim:`,
    '',
    `Firma: ${customer.companyName || '-'}`,
    customer.contactName ? `Yetkili: ${customer.contactName}` : '',
    `Tel: ${customer.phone || '-'}`,
    itemCount ? `Ürün: ${itemCount} kalem` : '',
    orderTotal != null ? `Tutar: ${formatPrice(orderTotal)}` : '',
    '',
    'Sipariş formu (PDF):',
    pdfUrl,
    '',
    'Onayınızı rica ederim. Teşekkürler.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function openWhatsAppWithMessage(phone, message) {
  const cleanPhone = String(phone).replace(/\D/g, '');
  if (!cleanPhone) throw new Error('WhatsApp numarası tanımlı değil');
  window.location.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppToBusiness(phone, cartItems, options = {}) {
  const url = buildWhatsAppOrderUrl(phone, cartItems, options);
  window.location.href = url;
}

export function openWhatsApp(phone, cartItems, options = {}) {
  const url = buildWhatsAppOrderUrl(phone, cartItems, options);
  window.open(url, '_blank', 'noopener,noreferrer');
}
