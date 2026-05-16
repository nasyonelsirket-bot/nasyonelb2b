export function formatPrice(price) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(price);
}

export function buildWhatsAppOrderUrl(phone, cartItems) {
  const cleanPhone = String(phone).replace(/\D/g, '');
  const lines = [
    '🛒 *B2B SİPARİŞ TALEBİ*',
    '─────────────────',
    '',
  ];

  let grandTotal = 0;

  cartItems.forEach((item, index) => {
    const lineTotal = item.price * item.quantity;
    grandTotal += lineTotal;
    lines.push(
      `*${index + 1}. ${item.name}*`,
      `Stok Kodu: ${item.sku}`,
      `Adet: ${item.quantity}`,
      `Birim Fiyat: ${formatPrice(item.price)}`,
      `Satır Toplam: ${formatPrice(lineTotal)}`,
      '',
    );
  });

  lines.push('─────────────────');
  lines.push(`*GENEL TOPLAM: ${formatPrice(grandTotal)}*`);
  lines.push('');
  lines.push('Sipariş detaylarını onaylamak için lütfen yanıtlayın.');
  lines.push('Teşekkürler! 🙏');

  const message = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${cleanPhone}?text=${message}`;
}

export function openWhatsApp(phone, cartItems) {
  const url = buildWhatsAppOrderUrl(phone, cartItems);
  window.open(url, '_blank', 'noopener,noreferrer');
}
