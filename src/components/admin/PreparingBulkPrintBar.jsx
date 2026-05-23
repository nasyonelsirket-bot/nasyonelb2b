import { useState } from 'react';
import { Printer, CheckSquare, Square } from 'lucide-react';
import Button from '@/components/ui/Button';
import { fetchOrderDetail, markOrdersPacked } from '@/services/orderApi';
import { printShippingLabels } from '@/components/admin/ShippingLabelPrint';

/**
 * Kargoya hazır sekmesinde toplu etiket yazdırma.
 */
export default function PreparingBulkPrintBar({
  orders,
  selectedIds,
  onSelectedIdsChange,
  setMsg,
  onOrdersUpdated,
}) {
  const [busy, setBusy] = useState(false);

  const ids = orders.map((o) => o.id).filter(Boolean);
  const selectedCount = ids.filter((id) => selectedIds.has(id)).length;
  const allSelected = ids.length > 0 && selectedCount === ids.length;

  const toggleAll = () => {
    if (allSelected) {
      onSelectedIdsChange(new Set());
      return;
    }
    onSelectedIdsChange(new Set(ids));
  };

  const printByIds = async (targetIds) => {
    if (!targetIds.length) {
      setMsg('Yazdırılacak sipariş seçin', 'error');
      return;
    }
    setBusy(true);
    try {
      const details = await Promise.all(targetIds.map((id) => fetchOrderDetail(id)));
      const count = printShippingLabels(details.filter(Boolean));
      if (!count) {
        setMsg('Yazdırma penceresi açılamadı — tarayıcı engelliyor olabilir', 'error');
        return;
      }
      await markOrdersPacked(targetIds);
      onSelectedIdsChange(new Set());
      onOrdersUpdated?.();
      setMsg(`${count} etiket yazdırıldı — siparişler Paket yapıldı sekmesine taşındı`);
    } catch (err) {
      setMsg(err.message || 'Etiketler hazırlanamadı', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!orders.length) {
    return (
      <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/30 px-4 py-3 text-sm text-gray-500">
        Kargoya hazır sipariş yok — etiket yazdırmak için önce ödemesi tamamlanmış sipariş bekleyin.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-emerald-900">
          Toplu etiket yazdır · {orders.length} sipariş
        </p>
        <button
          type="button"
          onClick={toggleAll}
          disabled={busy}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 hover:text-emerald-950 disabled:opacity-50"
        >
          {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          {allSelected ? 'Seçimi kaldır' : 'Tümünü seç'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={busy}
          onClick={() => printByIds(ids)}
        >
          <Printer className="h-4 w-4" />
          Tümünü yazdır ({orders.length})
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy || selectedCount === 0}
          onClick={() => printByIds(ids.filter((id) => selectedIds.has(id)))}
        >
          <Printer className="h-4 w-4" />
          Seçilenleri yazdır ({selectedCount})
        </Button>
      </div>

      <p className="text-[11px] text-emerald-800/90">
        Her sipariş ayrı 10×10 cm sayfa olarak yazdırılır. Yazdırınca otomatik{' '}
        <strong>Paket yapıldı</strong> sekmesine geçer.
      </p>
    </div>
  );
}
