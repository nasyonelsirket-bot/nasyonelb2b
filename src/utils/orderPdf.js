import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPrice } from '@/utils/whatsapp';
import { mergePdfSettings } from '@/data/pdfSettingsDefaults';
import { resolveLogoUrl } from '@/utils/resolveLogoUrl';

function safeName(text) {
  return String(text || 'siparis')
    .replace(/[^\w\sğüşıöçĞÜŞİÖÇ-]/gi, '')
    .trim()
    .slice(0, 40) || 'siparis';
}

function hexToRgb(hex) {
  const h = String(hex || '#0a1f4d').replace('#', '');
  if (h.length !== 6) return [10, 31, 77];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function loadImageForPdf(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        const format = dataUrl.includes('image/jpeg') ? 'JPEG' : 'PNG';
        resolve({ dataUrl, format, w: canvas.width, h: canvas.height });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function pdfImageFormat(dataUrl) {
  if (dataUrl?.includes('image/jpeg') || dataUrl?.includes('image/jpg')) return 'JPEG';
  return 'PNG';
}

export async function generateOrderPdf({
  siteName = 'Nasyonel Toys',
  siteLogoUrl,
  pdfSettings: rawPdfSettings,
  customer,
  items,
  discount,
  shipping,
  orderTotal,
}) {
  const cfg = mergePdfSettings(rawPdfSettings);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const primary = hexToRgb(cfg.primaryColor);
  const marginL = Number(cfg.marginLeftMm) || 14;
  const gap = Number(cfg.sectionGapMm) || 6;
  let y = Number(cfg.marginTopMm) || 14;
  const pageW = doc.internal.pageSize.getWidth();
  const contentW = pageW - marginL * 2;

  const displayTitle = (cfg.headerTitle || '').trim() || siteName;
  const logoSrc = resolveLogoUrl((cfg.logoUrl || '').trim() || siteLogoUrl);
  const logoImg = cfg.showLogo ? await loadImageForPdf(logoSrc) : null;

  if (logoImg) {
    const lw = Number(cfg.logoWidthMm) || 45;
    const lh = Number(cfg.logoHeightMm) || 18;
    doc.addImage(logoImg.dataUrl, pdfImageFormat(logoImg.dataUrl), marginL, y, lw, lh);
    y += lh + 2;
  }

  doc.setFontSize(Number(cfg.fontSizeTitle) || 17);
  doc.setTextColor(...primary);
  doc.text(displayTitle, marginL, y);
  y += gap + 2;

  if (cfg.docTitle?.trim()) {
    doc.setFontSize(Number(cfg.fontSizeSubtitle) || 11);
    doc.setTextColor(60, 60, 60);
    doc.text(cfg.docTitle.trim(), marginL, y);
    y += gap;
  }

  if (cfg.showDate) {
    doc.setFontSize(Number(cfg.fontSizeSmall) || 9);
    doc.text(`Tarih: ${new Date().toLocaleString('tr-TR')}`, marginL, y);
    y += gap + 2;
  }

  if (cfg.showCustomer) {
    doc.setFontSize(Number(cfg.fontSizeSubtitle) || 11);
    doc.setTextColor(...primary);
    doc.text('Müşteri Bilgileri', marginL, y);
    y += gap - 1;

    doc.setFontSize(Number(cfg.fontSizeBody) || 10);
    doc.setTextColor(40, 40, 40);
    const labels = cfg.customerLabels;
    const rows = [
      [labels.companyName, customer.companyName],
      [labels.contactName, customer.contactName || '-'],
      [labels.phone, customer.phone],
      [labels.address, customer.address],
    ];
    rows.forEach(([label, value]) => {
      const line = `${label}: ${value}`;
      const wrapped = doc.splitTextToSize(line, contentW);
      doc.text(wrapped, marginL, y);
      y += wrapped.length * 5;
    });
    y += 2;
  }

  if (items?.length) {
    const head = [
      'Ürün',
      ...(cfg.showSkuColumn ? ['Stok Kodu'] : []),
      'Birim Fiyat',
      'Adet',
      'Satır Toplam',
    ];
    const tableBody = items.map((item) => {
      const row = [item.name];
      if (cfg.showSkuColumn) row.push(item.sku || '-');
      row.push(formatPrice(item.price), String(item.quantity), formatPrice(item.price * item.quantity));
      return row;
    });

    autoTable(doc, {
      startY: y,
      head: [head],
      body: tableBody,
      styles: { fontSize: Number(cfg.fontSizeBody) || 10, cellPadding: 2 },
      headStyles: { fillColor: primary, textColor: 255 },
      margin: { left: marginL, right: marginL },
    });
    y = doc.lastAutoTable.finalY + gap + 2;
  }

  if (cfg.showSummary) {
    doc.setFontSize(Number(cfg.fontSizeSubtitle) || 11);
    doc.setTextColor(...primary);
    doc.text('Sipariş Özeti', marginL, y);
    y += gap + 1;

    doc.setFontSize(Number(cfg.fontSizeBody) || 10);
    doc.setTextColor(40, 40, 40);
    const summary = [
      `Ara toplam: ${formatPrice(discount.subtotal)}`,
      `İskonto: ${discount.tierLabel} (-${formatPrice(discount.discountAmount)})`,
      shipping.eligible ? 'Kargo: Bedava' : `Kargo: ${formatPrice(shipping.shippingFee)}`,
      `Ödenecek tutar: ${formatPrice(orderTotal)}`,
    ];
    summary.forEach((line) => {
      doc.text(line, marginL, y);
      y += 5;
    });
    y += 2;
  }

  if (cfg.showKdvNote && cfg.kdvText?.trim()) {
    doc.setFontSize(Number(cfg.fontSizeSmall) || 9);
    doc.setTextColor(120, 80, 0);
    doc.text(cfg.kdvText.trim(), marginL, y);
    y += 5;
  }

  if (cfg.showFooter && cfg.footerText?.trim()) {
    doc.setFontSize(Number(cfg.fontSizeSmall) || 9);
    doc.setTextColor(80, 80, 80);
    const wrapped = doc.splitTextToSize(cfg.footerText.trim(), contentW);
    doc.text(wrapped, marginL, y);
  }

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
  siteLogoUrl,
  pdfSettings,
  customer,
  items,
  discount,
  shipping,
  orderTotal,
}) {
  const pdf = await generateOrderPdf({
    siteName,
    siteLogoUrl,
    pdfSettings,
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
      /* fallback */
    }
  }

  openWhatsAppWithPdf(phone, customer, siteName);
  return { shared: false, downloaded: true };
}
