/**
 * Sipariş PDF — sunucuda üretilir (iOS Safari uyumlu font gömme).
 */
const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const { applyPlugin } = require('jspdf-autotable');
const { mergePdfSettings } = require('./pdfSettingsDefaults.cjs');

applyPlugin(jsPDF);

const FONT_REGULAR = 'Roboto';
const FONT_BOLD = 'RobotoBold';

let fontDataCache = null;

function loadFontBase64() {
  if (fontDataCache) return fontDataCache;

  try {
    fontDataCache = require('./fontData.cjs');
    if (fontDataCache?.regular && fontDataCache?.bold) return fontDataCache;
  } catch {
    /* build öncesi veya yerel — dosyadan oku */
  }

  const dirs = [
    path.join(__dirname, 'fonts'),
    path.join(__dirname, 'lib', 'fonts'),
    path.join(process.cwd(), 'lib', 'fonts'),
  ];
  for (const dir of dirs) {
    const regularPath = path.join(dir, 'Roboto-Regular.ttf');
    const boldPath = path.join(dir, 'Roboto-Bold.ttf');
    if (fs.existsSync(regularPath) && fs.existsSync(boldPath)) {
      fontDataCache = {
        regular: fs.readFileSync(regularPath).toString('base64'),
        bold: fs.readFileSync(boldPath).toString('base64'),
      };
      return fontDataCache;
    }
  }

  throw new Error('PDF font dosyaları bulunamadı (fontData.cjs veya lib/fonts)');
}

function formatPrice(price) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(Number(price) || 0);
}

function hexToRgb(hex) {
  const h = String(hex || '#0a1f4d').replace('#', '');
  if (h.length !== 6) return [10, 31, 77];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function registerFonts(doc) {
  const { regular: regularB64, bold: boldB64 } = loadFontBase64();
  doc.addFileToVFS('Roboto-Regular.ttf', regularB64);
  doc.addFileToVFS('Roboto-Bold.ttf', boldB64);
  doc.addFont('Roboto-Regular.ttf', FONT_REGULAR, 'normal', undefined, 'Identity-H');
  doc.addFont('Roboto-Bold.ttf', FONT_BOLD, 'normal', undefined, 'Identity-H');
  doc.setFont(FONT_REGULAR, 'normal');
}

function setFont(doc, weight) {
  doc.setFont(weight === 'bold' ? FONT_BOLD : FONT_REGULAR, 'normal');
}

function tableFonts() {
  return {
    font: FONT_REGULAR,
    fontStyle: 'normal',
    overflow: 'linebreak',
    cellPadding: 2.5,
  };
}

/**
 * @param {object} order — sipariş verisi (müşteri, ürünler, ayarlar)
 * @returns {Buffer}
 */
function generateOrderPdfBuffer(order) {
  const siteName = order.siteName || 'Nasyonel Toys';
  const customer = order.customer || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const discount = order.discount || { subtotal: 0, discountAmount: 0, tierLabel: '', grandTotal: 0 };
  const shipping = order.shipping || { eligible: false, shippingFee: 0 };
  const orderTotal = order.orderTotal ?? discount.grandTotal ?? 0;
  const cfg = mergePdfSettings(order.pdfSettings);

  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    compress: false,
    putOnlyUsedFonts: true,
  });
  registerFonts(doc);

  const primary = hexToRgb(cfg.primaryColor);
  const lineH = 5.2;
  const marginL = Number(cfg.marginLeftMm) || 14;
  const gap = Number(cfg.sectionGapMm) || 6;
  let y = Number(cfg.marginTopMm) || 14;
  const pageW = doc.internal.pageSize.getWidth();
  const contentW = pageW - marginL * 2;

  const displayTitle = (cfg.headerTitle || '').trim() || siteName;

  setFont(doc, 'bold');
  doc.setFontSize(Number(cfg.fontSizeTitle) || 18);
  doc.setTextColor(...primary);
  doc.text(displayTitle, marginL, y);
  y += gap + 2;

  if (cfg.docTitle?.trim()) {
    setFont(doc, 'normal');
    doc.setFontSize(Number(cfg.fontSizeSubtitle) || 12);
    doc.setTextColor(60, 60, 60);
    doc.text(cfg.docTitle.trim(), marginL, y);
    y += gap;
  }

  if (cfg.showDate) {
    setFont(doc, 'normal');
    doc.setFontSize(Number(cfg.fontSizeSmall) || 10);
    doc.setTextColor(90, 90, 90);
    doc.text(`Tarih: ${new Date().toLocaleString('tr-TR')}`, marginL, y);
    y += gap + 2;
  }

  if (cfg.showCustomer) {
    setFont(doc, 'bold');
    doc.setFontSize(Number(cfg.fontSizeSubtitle) || 12);
    doc.setTextColor(...primary);
    doc.text('Müşteri Bilgileri', marginL, y);
    y += gap - 1;

    setFont(doc, 'normal');
    doc.setFontSize(Number(cfg.fontSizeBody) || 11);
    doc.setTextColor(40, 40, 40);
    const labels = cfg.customerLabels;
    [
      [labels.companyName, customer.companyName],
      [labels.contactName, customer.contactName || '-'],
      [labels.phone, customer.phone],
      [labels.address, customer.address],
    ].forEach(([label, value]) => {
      const wrapped = doc.splitTextToSize(`${label}: ${value || '-'}`, contentW);
      doc.text(wrapped, marginL, y);
      y += wrapped.length * lineH;
    });
    y += 2;
  }

  if (items.length) {
    const head = [
      'Ürün',
      ...(cfg.showSkuColumn ? ['Stok Kodu'] : []),
      'Birim Fiyat',
      'Adet',
      'Satır Toplam',
    ];
    const body = items.map((item) => {
      const row = [String(item.name || '-')];
      if (cfg.showSkuColumn) row.push(String(item.sku || '-'));
      row.push(
        formatPrice(item.price),
        String(item.quantity ?? 0),
        formatPrice((Number(item.price) || 0) * (Number(item.quantity) || 0)),
      );
      return row;
    });

    const colCount = head.length;
    const productW = contentW * 0.38;
    const otherW = (contentW - productW) / (colCount - 1);
    const columnStyles = { 0: { cellWidth: productW } };
    for (let i = 1; i < colCount; i += 1) columnStyles[i] = { cellWidth: otherW };

    doc.autoTable({
      startY: y,
      head: [head],
      body,
      columnStyles,
      styles: tableFonts(),
      headStyles: {
        ...tableFonts(),
        font: FONT_BOLD,
        fillColor: primary,
        textColor: 255,
      },
      bodyStyles: tableFonts(),
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: marginL, right: marginL },
      willDrawCell: (data) => {
        if (data.section === 'head') setFont(doc, 'bold');
        else setFont(doc, 'normal');
      },
    });
    y = doc.lastAutoTable.finalY + gap + 2;
  }

  if (cfg.showSummary) {
    setFont(doc, 'bold');
    doc.setFontSize(Number(cfg.fontSizeSubtitle) || 12);
    doc.setTextColor(...primary);
    doc.text('Sipariş Özeti', marginL, y);
    y += gap + 1;

    setFont(doc, 'normal');
    doc.setFontSize(Number(cfg.fontSizeBody) || 11);
    doc.setTextColor(40, 40, 40);
    const summary = [
      `Ara toplam: ${formatPrice(discount.subtotal)}`,
      `İskonto: ${discount.tierLabel || '-'} (-${formatPrice(discount.discountAmount)})`,
      shipping.eligible ? 'Kargo: Bedava' : `Kargo: ${formatPrice(shipping.shippingFee)}`,
      `Ödenecek tutar: ${formatPrice(orderTotal)}`,
    ];
    summary.forEach((line, i) => {
      setFont(doc, i === summary.length - 1 ? 'bold' : 'normal');
      doc.text(line, marginL, y);
      y += lineH;
    });
    y += 2;
  }

  if (cfg.showKdvNote && cfg.kdvText?.trim()) {
    setFont(doc, 'normal');
    doc.setFontSize(Number(cfg.fontSizeSmall) || 10);
    doc.setTextColor(120, 80, 0);
    doc.text(cfg.kdvText.trim(), marginL, y);
    y += lineH;
  }

  if (cfg.showFooter && cfg.footerText?.trim()) {
    setFont(doc, 'normal');
    doc.setFontSize(Number(cfg.fontSizeSmall) || 10);
    doc.setTextColor(80, 80, 80);
    doc.text(doc.splitTextToSize(cfg.footerText.trim(), contentW), marginL, y);
  }

  return Buffer.from(doc.output('arraybuffer'));
}

module.exports = { generateOrderPdfBuffer };
