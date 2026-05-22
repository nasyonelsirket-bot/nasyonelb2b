import { Printer, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/utils/whatsapp';

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

function buildLabelPrintHtml(order) {
  const c = order.customer || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const isCod = order.paymentMethod !== 'iban';
  const orderNo = escapeHtml(order.orderNumber || order.id || '—');

  const productsHtml = items.length
    ? items
        .map(
          (item, i) =>
            `<li><span class="num">${i + 1}</span><span class="pname">${escapeHtml(item.name || 'Ürün')}</span></li>`,
        )
        .join('')
    : '<li><span class="pname">Ürün yok</span></li>';

  const codHtml = isCod
    ? `<div class="cod"><strong>Kapıda ödeme</strong><span>Tahsil edilecek: ${escapeHtml(formatPrice(order.orderTotal))}</span></div>`
    : '';

  return `<div class="sheet">
  <div class="head"><p class="brand">nasyonel toys.com</p></div>
  <div class="section-title">Alıcı bilgileri</div>
  <dl class="body">
    <div class="row"><dt>Sipariş No</dt><dd>${orderNo}</dd></div>
    <div class="row"><dt>Ad-Soyad</dt><dd>${escapeHtml(c.name || '—')}</dd></div>
    <div class="row"><dt>Telefon</dt><dd>${escapeHtml(c.phone || '—')}</dd></div>
    <div class="row addr"><dt>Adres</dt><dd>${escapeHtml(formatAddress(c))}</dd></div>
    ${codHtml}
  </dl>
  <div class="section-title">Ürün bilgileri</div>
  <ul class="products">${productsHtml}</ul>
</div>`;
}

const PRINT_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; padding: 8mm; color: #000; }
  .sheet { max-width: 100mm; border: 2px solid #000; }
  .head { border-bottom: 2px solid #000; padding: 8px 12px; text-align: center; }
  .brand { font-size: 20px; font-weight: 900; letter-spacing: -0.02em; }
  .section-title { background: #eee; border-bottom: 1px solid #000; padding: 4px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
  .body { padding: 10px 12px; font-size: 11px; line-height: 1.35; }
  .row { display: grid; grid-template-columns: 78px 1fr; gap: 4px; margin-bottom: 6px; }
  .row dt { font-weight: 600; }
  .row dd { font-weight: 700; }
  .addr dd { font-weight: 600; white-space: pre-wrap; font-size: 12px; }
  .cod { margin-top: 8px; border: 2px solid #000; background: #fff8e1; padding: 8px; text-align: center; }
  .cod strong { display: block; font-size: 12px; text-transform: uppercase; }
  .cod span { display: block; font-size: 16px; font-weight: 900; margin-top: 4px; }
  .products { list-style: none; }
  .products li { display: flex; gap: 8px; padding: 8px 12px; border-top: 1px solid #ccc; align-items: flex-start; }
  .num { width: 22px; height: 22px; border: 2px solid #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
  .pname { font-weight: 600; font-size: 12px; }
  @media print { body { padding: 0; } }
`;

function LabelPreview({ order }) {
  const c = order.customer || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const isCod = order.paymentMethod !== 'iban';
  const orderNo = order.orderNumber || order.id || '—';

  return (
    <div className="mx-auto bg-white text-black font-sans text-[11px] leading-snug border-2 border-black w-full max-w-[420px]">
      <div className="border-b-2 border-black px-3 py-2 text-center">
        <p className="text-[22px] font-black tracking-tight lowercase">nasyonel toys.com</p>
      </div>

      <div className="border-b-2 border-black">
        <div className="bg-gray-100 border-b border-black px-2 py-1 font-bold text-xs uppercase">
          Alıcı bilgileri
        </div>
        <div className="px-3 py-2 space-y-1.5">
          <div className="grid grid-cols-[88px_1fr] gap-1">
            <span className="font-semibold">Sipariş No</span>
            <span className="font-bold">{orderNo}</span>
          </div>
          <div className="grid grid-cols-[88px_1fr] gap-1">
            <span className="font-semibold">Ad-Soyad</span>
            <span className="font-bold text-sm">{c.name || '—'}</span>
          </div>
          <div className="grid grid-cols-[88px_1fr] gap-1">
            <span className="font-semibold">Telefon</span>
            <span className="font-bold text-sm">{c.phone || '—'}</span>
          </div>
          <div className="grid grid-cols-[88px_1fr] gap-1 items-start">
            <span className="font-semibold">Adres</span>
            <span className="whitespace-pre-wrap font-medium text-sm">{formatAddress(c)}</span>
          </div>
          {isCod && (
            <div className="mt-2 rounded border-2 border-black bg-amber-50 px-2 py-2 text-center">
              <p className="font-black text-sm uppercase tracking-wide">Kapıda ödeme</p>
              <p className="text-lg font-black mt-0.5">Tahsil edilecek: {formatPrice(order.orderTotal)}</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="bg-gray-100 border-b border-black px-2 py-1 font-bold text-xs uppercase">
          Ürün bilgileri
        </div>
        <ul className="divide-y divide-black/20">
          {items.length === 0 ? (
            <li className="px-3 py-2 text-gray-500">Ürün yok</li>
          ) : (
            items.map((item, i) => (
              <li key={item.id || i} className="px-3 py-2 flex gap-2 items-start">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black text-xs font-bold">
                  {i + 1}
                </span>
                <span className="font-semibold text-sm flex-1">{item.name || 'Ürün'}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

export default function ShippingLabelPrint({ order, open, onClose }) {
  const handlePrint = () => {
    const labelHtml = buildLabelPrintHtml(order);
    const doc = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>Kargo etiketi — ${escapeHtml(order.orderNumber || order.id || '')}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>${labelHtml}</body>
</html>`;

    const win = window.open('', '_blank', 'width=480,height=720');
    if (!win) return;
    win.document.write(doc);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 300);
  };

  if (!open || !order) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-4 py-3">
          <h3 className="font-bold text-brand-900">Kargo şablonu</h3>
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
            Kargo firması ve barkod yok. Kapıda ödemede tahsil tutarı gösterilir.
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
