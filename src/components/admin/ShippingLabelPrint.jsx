import { Printer, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  FREE_SHIPPING_THRESHOLD_TL,
  STANDARD_SHIPPING_FEE_TL,
} from '@/utils/cartShipping';

const LABEL_MM = 100;

function formatAddress(customer) {
  const parts = [
    customer?.address,
    [customer?.district, customer?.city].filter(Boolean).join(' / '),
  ].filter(Boolean);
  return parts.join('\n') || '—';
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function orderSubtotal(order) {
  const fromDiscount = Number(order.discount?.subtotal);
  if (fromDiscount > 0) return fromDiscount;
  const items = Array.isArray(order.items) ? order.items : [];
  return items.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
    0,
  );
}

/** 10×10 cm kargo etiketi — kargo ücreti: 500 TL üzeri peşin, altı alıcı 100 TL */
export function getLabelShippingPayment(order) {
  const shipping = order.shipping;
  if (shipping && typeof shipping.eligible === 'boolean') {
    return shipping.eligible
      ? { mode: 'prepaid', text: 'Peşin ödeme' }
      : { mode: 'recipient', text: `Ücret alıcı ${STANDARD_SHIPPING_FEE_TL} TL` };
  }

  const subtotal = orderSubtotal(order);
  const eligible = subtotal >= FREE_SHIPPING_THRESHOLD_TL;
  return eligible
    ? { mode: 'prepaid', text: 'Peşin ödeme' }
    : { mode: 'recipient', text: `Ücret alıcı ${STANDARD_SHIPPING_FEE_TL} TL` };
}

function summarizeProducts(items) {
  if (!items.length) return 'Ürün yok';
  if (items.length === 1) {
    const name = String(items[0].name || 'Ürün');
    return name.length > 42 ? `${name.slice(0, 40)}…` : name;
  }
  const first = String(items[0].name || 'Ürün');
  const short = first.length > 28 ? `${first.slice(0, 26)}…` : first;
  return `${short} +${items.length - 1} ürün`;
}

function buildLabelPrintHtml(order) {
  const c = order.customer || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const orderNo = escapeHtml(order.orderNumber || order.id || '—');
  const payment = getLabelShippingPayment(order);
  const paymentClass = payment.mode === 'prepaid' ? 'payment prepaid' : 'payment recipient';
  const productsLine = escapeHtml(summarizeProducts(items));

  return `<div class="sheet">
  <div class="head">
    <p class="brand">nasyonel toys</p>
    <p class="order-no">${orderNo}</p>
  </div>
  <div class="block">
    <p class="label">Alıcı</p>
    <p class="name">${escapeHtml(c.name || '—')}</p>
    <p class="phone">${escapeHtml(c.phone || '—')}</p>
    <p class="addr">${escapeHtml(formatAddress(c))}</p>
  </div>
  <div class="${paymentClass}">${escapeHtml(payment.text)}</div>
  <div class="products">
    <span class="label">Ürün</span>
    <span class="value">${productsLine}</span>
  </div>
  <div class="barcode-zone">10×10 cm barkod alanı</div>
</div>`;
}

const PRINT_STYLES = `
  @page { size: ${LABEL_MM}mm ${LABEL_MM}mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${LABEL_MM}mm; height: ${LABEL_MM}mm; overflow: hidden; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet {
    width: ${LABEL_MM}mm;
    height: ${LABEL_MM}mm;
    border: 1px solid #000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .head {
    border-bottom: 1px solid #000;
    padding: 2mm 2.5mm 1.5mm;
    text-align: center;
    line-height: 1.15;
  }
  .brand {
    font-size: 9pt;
    font-weight: 900;
    letter-spacing: -0.02em;
    text-transform: lowercase;
  }
  .order-no {
    font-size: 8pt;
    font-weight: 800;
    margin-top: 0.5mm;
  }
  .block {
    padding: 2mm 2.5mm;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  .block .label,
  .products .label {
    font-size: 6pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #333;
    margin-bottom: 0.8mm;
  }
  .block .name {
    font-size: 9.5pt;
    font-weight: 800;
    line-height: 1.15;
    margin-bottom: 0.8mm;
  }
  .block .phone {
    font-size: 8pt;
    font-weight: 700;
    margin-bottom: 1mm;
  }
  .block .addr {
    font-size: 7.5pt;
    font-weight: 600;
    line-height: 1.25;
    white-space: pre-wrap;
    max-height: 22mm;
    overflow: hidden;
  }
  .payment {
    border-top: 2px solid #000;
    border-bottom: 2px solid #000;
    padding: 2mm 2.5mm;
    text-align: center;
    font-size: 11pt;
    font-weight: 900;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    line-height: 1.1;
  }
  .payment.prepaid { background: #e8f5e9; }
  .payment.recipient { background: #fff8e1; }
  .products {
    display: flex;
    gap: 2mm;
    align-items: flex-start;
    padding: 1.5mm 2.5mm;
    border-bottom: 1px dashed #666;
    min-height: 0;
  }
  .products .value {
    flex: 1;
    font-size: 7pt;
    font-weight: 600;
    line-height: 1.2;
  }
  .barcode-zone {
    height: 26mm;
    min-height: 26mm;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 6.5pt;
    font-weight: 600;
    color: #555;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }
  @media print {
    html, body { margin: 0; padding: 0; }
  }
  body.bulk-print {
    width: auto;
    height: auto;
    overflow: visible;
  }
  body.bulk-print .sheet {
    page-break-after: always;
    break-after: page;
  }
  body.bulk-print .sheet:last-child {
    page-break-after: auto;
    break-after: auto;
  }
`;

export function buildBulkLabelsHtml(orders) {
  const list = (Array.isArray(orders) ? orders : []).filter(Boolean);
  return list.map((order) => buildLabelPrintHtml(order)).join('\n');
}

/** Tek veya çoklu 10×10 cm etiket yazdırır */
export function printShippingLabels(orders) {
  const list = (Array.isArray(orders) ? orders : []).filter(Boolean);
  if (!list.length) return 0;

  const bulk = list.length > 1;
  const labelHtml = buildBulkLabelsHtml(list);
  const title =
    list.length === 1
      ? `Kargo etiketi — ${list[0].orderNumber || list[0].id || ''}`
      : `Kargo etiketleri (${list.length})`;

  const doc = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body class="${bulk ? 'bulk-print' : ''}">${labelHtml}</body>
</html>`;

  const win = window.open('', '_blank', bulk ? 'width=480,height=640' : 'width=420,height=420');
  if (!win) return 0;
  win.document.write(doc);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, bulk ? 500 : 300);

  return list.length;
}

function LabelPreview({ order }) {
  const c = order.customer || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const orderNo = order.orderNumber || order.id || '—';
  const payment = getLabelShippingPayment(order);

  return (
    <div
      className="mx-auto bg-white text-black font-sans border border-black overflow-hidden flex flex-col"
      style={{ width: `${LABEL_MM}mm`, height: `${LABEL_MM}mm`, maxWidth: '100%' }}
    >
      <div className="border-b border-black px-2 py-1.5 text-center shrink-0">
        <p className="text-[11px] font-black lowercase leading-tight">nasyonel toys</p>
        <p className="text-[10px] font-extrabold mt-0.5">{orderNo}</p>
      </div>

      <div className="px-2 py-1.5 flex-1 min-h-0 overflow-hidden">
        <p className="text-[8px] font-bold uppercase tracking-wide text-gray-600">Alıcı</p>
        <p className="text-[11px] font-extrabold leading-tight mt-0.5">{c.name || '—'}</p>
        <p className="text-[10px] font-bold mt-0.5">{c.phone || '—'}</p>
        <p className="text-[9px] font-semibold leading-snug mt-1 whitespace-pre-wrap line-clamp-4">
          {formatAddress(c)}
        </p>
      </div>

      <div
        className={`border-y-2 border-black px-2 py-1.5 text-center shrink-0 ${
          payment.mode === 'prepaid' ? 'bg-emerald-50' : 'bg-amber-50'
        }`}
      >
        <p className="text-sm font-black uppercase tracking-wide">{payment.text}</p>
      </div>

      <div className="px-2 py-1 flex gap-2 items-start border-b border-dashed border-gray-500 shrink-0">
        <span className="text-[8px] font-bold uppercase text-gray-600 shrink-0">Ürün</span>
        <span className="text-[9px] font-semibold leading-snug">{summarizeProducts(items)}</span>
      </div>

      <div className="h-[26mm] flex items-center justify-center text-[9px] font-semibold text-gray-500 uppercase tracking-wide shrink-0">
        10×10 cm barkod alanı
      </div>
    </div>
  );
}

export default function ShippingLabelPrint({ order, open, onClose, onPrinted }) {
  const handlePrint = async () => {
    printShippingLabels([order]);
    try {
      await onPrinted?.(order);
    } catch {
      /* parent handles errors */
    }
  };

  if (!open || !order) return null;

  const payment = getLabelShippingPayment(order);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-4 py-3">
          <h3 className="font-bold text-brand-900">Kargo etiketi (10×10 cm)</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-xs text-gray-600">
            Etiket <strong>10×10 cm</strong> barkod boyutuna göre ayarlanmıştır.{' '}
            {FREE_SHIPPING_THRESHOLD_TL} TL ve üzeri siparişlerde{' '}
            <strong>Peşin ödeme</strong>, altında{' '}
            <strong>Ücret alıcı {STANDARD_SHIPPING_FEE_TL} TL</strong> yazılır. Bu sipariş:{' '}
            <strong>{payment.text}</strong>
          </p>

          <LabelPreview order={order} />

          <div className="flex flex-wrap gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Kapat
            </Button>
            <Button type="button" variant="primary" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Yazdır
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
