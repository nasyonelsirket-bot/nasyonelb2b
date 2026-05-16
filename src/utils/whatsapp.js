import { resolveMinQuantity } from '@/utils/orderRules';
import { getCartOrderSummary } from '@/utils/cartShipping';

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

export function buildWhatsAppOrderUrl(phone, cartItems, options = {}) {
  const cleanPhone = String(phone).replace(/\D/g, '');
  const siteName = options.siteName || 'Nasyonel Toys';
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
  const summary =
    options.orderSummary ||
    getCartOrderSummary(subtotal);
  const { discount, shipping, totalAfterDiscount, orderTotal } = summary;

  const lines = [
    '╔══════════════════════════════════╗',
    `║  ${padLine(siteName.toUpperCase() + ' · SİPARİŞ FORMU', 32)}║`,
    '╚══════════════════════════════════╝',
    '',
    `📅 *Tarih:* ${dateStr}`,
    '',
    '━━━━━━━━ *MÜŞTERİ BİLGİLERİ* ━━━━━━━━',
    '🏢 *Firma / Bayi Adı:*',
    '→ ................................',
    '',
    '👤 *Yetkili Kişi:*',
    '→ ................................',
    '',
    '📞 *İletişim Telefonu:*',
    '→ ................................',
    '',
    '📍 *Teslimat Adresi:*',
    '→ ................................',
    '→ ................................',
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
    `💵 *Ara toplam:* ${formatPrice(discount.subtotal)}`,
    `🏷️ *İskonto:* ${discount.tierLabel} (-${formatPrice(discount.discountAmount)})`,
    `📊 *İskonto sonrası:* ${formatPrice(totalAfterDiscount)}`,
    `🚚 *Kargo:* ${shipping.eligible ? 'Bedava' : formatPrice(shipping.shippingFee)}`,
    `✅ *Ödenecek tutar:* *${formatPrice(orderTotal)}*`,
    '',
    '_Fiyatlarımıza KDV dahil değildir._',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '✅ *Sipariş onayı için lütfen yanıtlayın.*',
    'Teşekkürler — Nasyonel Toys 🧸',
  );

  const message = encodeURIComponent(lines.filter(Boolean).join('\n'));
  return `https://wa.me/${cleanPhone}?text=${message}`;
}

export function openWhatsApp(phone, cartItems, options = {}) {
  const url = buildWhatsAppOrderUrl(phone, cartItems, options);
  window.open(url, '_blank', 'noopener,noreferrer');
}
