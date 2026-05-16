import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPrice } from '@/utils/whatsapp';

function safeName(text) {
  return String(text || 'siparis')
    .replace(/[^\w\sğüşıöçĞÜŞİÖÇ-]/gi, '')
    .trim()
    .slice(0, 40) || 'siparis';
}

export function generateOrderPdf({
  siteName = 'Nasyonel Toys',
  customer,
  items,
  discount,
  shipping,
  orderTotal,
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const dateStr = new Date().toLocaleString('tr-TR');
  let y = 18;

  doc.setFontSize(18);
  doc.setTextColor(10, 31, 77);
  doc.text(siteName, 14, y);
  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text('Sipariş Formu', 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.text(`Tarih: ${dateStr}`, 14, y);
  y += 10;

  doc.setFontSize(11);
  doc.setTextColor(10, 31, 77);
  doc.text('Müşteri Bilgileri', 14, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  const lines = [
    `Firma / Bayi: ${customer.companyName}`,
    `Yetkili: ${customer.contactName || '-'}`,
    `Telefon: ${customer.phone}`,
    `Adres: ${customer.address}`,
  ];
  lines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, 182);
    doc.text(wrapped, 14, y);
    y += wrapped.length * 5;
  });
  y += 4;

  doc.setFontSize(11);
  doc.setTextColor(10, 31, 77);
  doc.text('Sipariş', 14, y);
  y += 2;

  const tableBody = items.map((item) => [
    item.name,
    item.sku || '-',
    formatPrice(item.price),
    String(item.quantity),
    formatPrice(item.price * item.quantity),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Ürün', 'Stok Kodu', 'Birim Fiyat', 'Adet', 'Satır Toplam']],
    body: tableBody,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [10, 31, 77], textColor: 255 },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(11);
  doc.setTextColor(10, 31, 77);
  doc.text('Sipariş Özeti', 14, y);
  y += 7;

  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  const summary = [
    `Ara toplam: ${formatPrice(discount.subtotal)}`,
    `İskonto: ${discount.tierLabel} (-${formatPrice(discount.discountAmount)})`,
    shipping.eligible
      ? 'Kargo: Bedava'
      : `Kargo: ${formatPrice(shipping.shippingFee)}`,
    `Ödenecek tutar: ${formatPrice(orderTotal)}`,
  ];
  summary.forEach((line) => {
    doc.text(line, 14, y);
    y += 6;
  });

  y += 4;
  doc.setFontSize(9);
  doc.setTextColor(120, 80, 0);
  doc.text('* Tüm fiyatlara KDV dahil değildir.', 14, y);
  y += 5;
  doc.setTextColor(80, 80, 80);
  doc.text('Sipariş onayı için lütfen yanıtlayınız. Teşekkürler.', 14, y);

  const fileName = `Siparis-${safeName(customer.companyName)}-${Date.now()}.pdf`;
  return { doc, fileName, blob: doc.output('blob') };
}

export async function downloadOrderPdf(pdfResult) {
  const url = URL.createObjectURL(pdfResult.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = pdfResult.fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function openWhatsAppWithPdf(phone, customer, siteName) {
  const clean = String(phone).replace(/\D/g, '');
  const text = encodeURIComponent(
    `Merhaba,\n\n${customer.companyName} adına sipariş formu (PDF) gönderiyorum.\n\n${siteName} — Sipariş onayınızı rica ederim.`,
  );
  window.open(`https://wa.me/${clean}?text=${text}`, '_blank', 'noopener,noreferrer');
}

export async function submitOrderViaWhatsApp({
  phone,
  siteName,
  customer,
  items,
  discount,
  shipping,
  orderTotal,
}) {
  const pdf = generateOrderPdf({
    siteName,
    customer,
    items,
    discount,
    shipping,
    orderTotal,
  });

  await downloadOrderPdf(pdf);

  if (navigator.canShare?.({ files: [new File([pdf.blob], pdf.fileName, { type: 'application/pdf' })] })) {
    try {
      const file = new File([pdf.blob], pdf.fileName, { type: 'application/pdf' });
      await navigator.share({
        title: `${siteName} Sipariş`,
        text: `${customer.companyName} sipariş formu`,
        files: [file],
      });
      return { shared: true };
    } catch {
      /* fallback to download + wa */
    }
  }

  openWhatsAppWithPdf(phone, customer, siteName);
  return { shared: false, downloaded: true };
}
