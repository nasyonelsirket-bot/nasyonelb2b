import { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Package,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Mail,
  User,
  Trash2,
  Search,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { fetchOrders, fetchOrderDetail, updateOrderStatus, deleteOrder } from '@/services/orderApi';
import { formatPrice } from '@/utils/whatsapp';
import { getStatusMeta } from '@/constants/orderStatus';
import { matchesCustomerNameSearch } from '@/utils/orderNumberSearch';
import PreparingBulkPrintBar from '@/components/admin/PreparingBulkPrintBar';

const FILTERS = [
  { id: 'preparing', label: 'Kargoya hazır' },
  { id: 'packed', label: 'Paket yapıldı' },
  { id: 'in_transit', label: 'Kargoda' },
  { id: 'delivered', label: 'Teslim edildi' },
  { id: 'cancelled', label: 'İptal' },
  { id: 'all', label: 'Tümü' },
];

const CARRIERS = ['Yurtiçi Kargo', 'Aras Kargo', 'MNG Kargo', 'PTT Kargo', 'Sürat Kargo', 'Diğer'];

function bucket(status) {
  if (status === 'packed') return 'packed';
  if (status === 'shipped') return 'in_transit';
  if (status === 'completed') return 'delivered';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'confirmed' || status === 'iban_verified' || status === 'kargoya_hazir') return 'preparing';
  return null;
}

export default function ShippingAdmin({ setMsg }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('preparing');
  const [customerQuery, setCustomerQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [printSelectedIds, setPrintSelectedIds] = useState(() => new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchOrders();
      setOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      setMsg(err.message || 'Siparişler yüklenemedi', 'error');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [setMsg]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (filter !== 'preparing') setPrintSelectedIds(new Set());
    if (filter !== 'packed') setCustomerQuery('');
  }, [filter]);

  const togglePrintSelected = (id) => {
    setPrintSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const shippable = orders.filter((o) =>
    ['kargoya_hazir', 'confirmed', 'iban_verified', 'packed', 'shipped', 'completed', 'cancelled'].includes(o.status),
  );

  const filtered = shippable.filter((o) => {
    const b = bucket(o.status);
    if (filter !== 'all' && b !== filter) return false;
    if (filter === 'packed' && customerQuery.trim()) {
      return matchesCustomerNameSearch(o, customerQuery);
    }
    return true;
  });

  const counts = {
    preparing: shippable.filter((o) => bucket(o.status) === 'preparing').length,
    packed: shippable.filter((o) => bucket(o.status) === 'packed').length,
    in_transit: shippable.filter((o) => bucket(o.status) === 'in_transit').length,
    delivered: shippable.filter((o) => bucket(o.status) === 'delivered').length,
    cancelled: shippable.filter((o) => o.status === 'cancelled').length,
  };

  const openDetail = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    setDetailLoading(true);
    try {
      setDetail(await fetchOrderDetail(id));
    } catch (err) {
      setMsg(err.message, 'error');
      setExpandedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleShip = async (order, carrier, tracking) => {
    setBusyId(order.id);
    try {
      const data = await updateOrderStatus(order.id, 'shipped', {
        shippingCarrier: carrier,
        trackingNumber: tracking,
      });
      const mailNote = data.shippedEmail?.summary;
      setMsg(['Kargoya verildi — müşteriye e-posta gönderildi', mailNote].filter(Boolean).join(' · '));
      setExpandedId(null);
      setDetail(null);
      load();
    } catch (err) {
      setMsg(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleComplete = async (order) => {
    if (
      !window.confirm(
        `${order.orderNumber} teslim edildi olarak işaretlensin mi? Müşteriye otomatik kupon oluşturulabilir.`,
      )
    ) {
      return;
    }
    setBusyId(order.id);
    try {
      const res = await updateOrderStatus(order.id, 'completed');
      const note = res.rewardCoupon ? ` · Kupon: ${res.rewardCoupon}` : '';
      setMsg(`Teslim edildi${note}`);
      setDetail(await fetchOrderDetail(order.id));
      load();
    } catch (err) {
      setMsg(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (order) => {
    const label = order.orderNumber || order.id;
    if (!window.confirm(`${label} siparişi kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`)) {
      return;
    }
    setBusyId(order.id);
    try {
      await deleteOrder(order.id);
      setMsg('Sipariş silindi');
      setExpandedId(null);
      setDetail(null);
      load();
    } catch (err) {
      setMsg(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-brand-900 flex items-center gap-2">
            <Truck className="h-5 w-5" /> Kargolar
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Etiket yazdır → <strong>Paket yapıldı</strong> → takip no gir → <strong>Kargoda</strong> (müşteriye
            mail gider).
          </p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-sm">
        <div className="rounded-lg bg-amber-50 p-3">
          <p className="font-bold text-amber-900">{counts.preparing}</p>
          <p className="text-xs text-amber-800">Kargoya hazır</p>
        </div>
        <div className="rounded-lg bg-violet-50 p-3">
          <p className="font-bold text-violet-900">{counts.packed}</p>
          <p className="text-xs text-violet-800">Paket yapıldı</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="font-bold text-blue-900">{counts.in_transit}</p>
          <p className="text-xs text-blue-800">Kargoda</p>
        </div>
        <div className="rounded-lg bg-gray-100 p-3">
          <p className="font-bold text-gray-900">{counts.delivered}</p>
          <p className="text-xs text-gray-700">Teslim</p>
        </div>
        <div className="rounded-lg bg-red-50 p-3">
          <p className="font-bold text-red-900">{counts.cancelled}</p>
          <p className="text-xs text-red-800">İptal</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              filter === id ? 'bg-brand-900 text-white' : 'bg-brand-50 text-brand-700'
            }`}
          >
            {label}
            {id !== 'all' && counts[id] != null ? ` (${counts[id]})` : ''}
          </button>
        ))}
      </div>

      {filter === 'preparing' && !loading && filtered.length > 0 && (
        <PreparingBulkPrintBar
          orders={filtered}
          selectedIds={printSelectedIds}
          onSelectedIdsChange={setPrintSelectedIds}
          setMsg={setMsg}
          onOrdersUpdated={load}
        />
      )}

      {filter === 'packed' && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 space-y-2">
          <p className="text-xs font-semibold text-violet-900 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" />
            Müşteri adına göre filtrele
          </p>
          <input
            type="search"
            value={customerQuery}
            onChange={(e) => setCustomerQuery(e.target.value)}
            placeholder="Ad soyad (kısmi yazın)"
            className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm"
            autoComplete="off"
          />
          <p className="text-[11px] text-violet-800">
            Takip numarasını girip <strong>Kargoya ver</strong> dediğinizde sipariş Kargoda sekmesine geçer ve
            müşteriye kargo maili gider.
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500 py-8 text-center">Yükleniyor...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">Bu filtrede sipariş yok.</p>
      ) : filter === 'packed' ? (
        <ul className="divide-y divide-brand-50 space-y-0">
          {filtered.map((o) => (
            <PackedShipRow
              key={o.id}
              order={o}
              busy={busyId === o.id}
              onShip={handleShip}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      ) : (
        <ul className="divide-y divide-brand-50">
          {filtered.map((o) => {
            const expanded = expandedId === o.id;
            const busy = busyId === o.id;
            return (
              <li key={o.id} className="py-4">
                <div className="flex items-start gap-2">
                  {filter === 'preparing' && (
                    <input
                      type="checkbox"
                      checked={printSelectedIds.has(o.id)}
                      onChange={() => togglePrintSelected(o.id)}
                      className="mt-2 h-4 w-4 shrink-0 rounded border-brand-300 text-brand-700 focus:ring-brand-500"
                      aria-label={`${o.orderNumber || o.id} seç`}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => openDetail(o.id)}
                    className="flex-1 min-w-0 text-left flex flex-wrap justify-between gap-2 hover:bg-brand-50/50 -mx-2 px-2 py-1 rounded-lg"
                  >
                    <div className="flex gap-2 min-w-0">
                      {expanded ? (
                        <ChevronUp className="h-5 w-5 shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 shrink-0" />
                      )}
                      <div>
                        <p className="font-bold">{o.orderNumber}</p>
                        <p className="text-sm text-gray-700">{o.customerName}</p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${getStatusMeta(o.status).color}`}
                    >
                      {getStatusMeta(o.status).shortLabel}
                    </span>
                  </button>
                </div>
                {expanded && (
                  <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/50 p-4 text-sm space-y-3">
                    {detailLoading && <p>Yükleniyor...</p>}
                    {detail && detail.id === o.id && (
                      <>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <p className="flex items-center gap-1">
                            <User className="h-4 w-4" /> {detail.customer?.name}
                          </p>
                          <p className="flex items-center gap-1">
                            <Phone className="h-4 w-4" /> {detail.customer?.phone}
                          </p>
                          <p className="flex items-center gap-1 sm:col-span-2">
                            <Mail className="h-4 w-4" /> {detail.customer?.email}
                          </p>
                          <p className="flex items-start gap-1 sm:col-span-2">
                            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                            {detail.customer?.address}
                          </p>
                        </div>
                        <p>
                          <strong>Toplam:</strong> {formatPrice(detail.orderTotal)}
                        </p>
                        {(detail.shippingCarrier || detail.trackingNumber) && (
                          <p className="text-blue-800">
                            <Package className="inline h-4 w-4" /> {detail.shippingCarrier} ·{' '}
                            {detail.trackingNumber}
                          </p>
                        )}
                        {detail.status === 'shipped' && (
                          <Button
                            type="button"
                            variant="primary"
                            disabled={busy}
                            onClick={() => handleComplete(detail)}
                          >
                            <CheckCircle className="h-4 w-4" />
                            Teslim edildi
                          </Button>
                        )}
                        {detail.status === 'shipped' && (
                          <ShipBlock order={detail} onShip={handleShip} busy={busy} label="Kargo güncelle" />
                        )}
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={busy}
                          onClick={() => handleDelete(detail)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Siparişi sil
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PackedShipRow({ order, busy, onShip, onDelete }) {
  const [carrier, setCarrier] = useState(CARRIERS[0]);
  const [tracking, setTracking] = useState('');

  return (
    <li className="py-4 rounded-xl border border-violet-100 bg-violet-50/30 px-3 sm:px-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold text-brand-900">{order.orderNumber || order.id}</p>
          <p className="text-sm font-medium text-gray-800 mt-0.5">{order.customerName || '—'}</p>
          {order.customerEmail && (
            <p className="text-xs text-gray-500 mt-0.5">{order.customerEmail}</p>
          )}
          <p className="text-sm font-semibold text-brand-700 mt-1">{formatPrice(order.orderTotal)}</p>
        </div>
        <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${getStatusMeta(order.status).color}`}>
          Paket yapıldı
        </span>
      </div>

      <ShipBlock
        order={order}
        onShip={onShip}
        busy={busy}
        label="Kargoya ver"
        carrier={carrier}
        tracking={tracking}
        onCarrierChange={setCarrier}
        onTrackingChange={setTracking}
      />

      <Button type="button" variant="danger" size="sm" disabled={busy} onClick={() => onDelete(order)}>
        <Trash2 className="h-4 w-4" />
        Sil
      </Button>
    </li>
  );
}

function ShipBlock({
  order,
  onShip,
  busy,
  label = 'Kargoya ver',
  carrier,
  tracking,
  onCarrierChange,
  onTrackingChange,
}) {
  const [localCarrier, setLocalCarrier] = useState(order.shippingCarrier || CARRIERS[0]);
  const [localTracking, setLocalTracking] = useState(order.trackingNumber || '');

  const c = carrier ?? localCarrier;
  const t = tracking ?? localTracking;
  const setC = onCarrierChange ?? setLocalCarrier;
  const setT = onTrackingChange ?? setLocalTracking;

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-3 space-y-2">
      <p className="font-medium text-sm">{label}</p>
      <div className="grid sm:grid-cols-2 gap-2">
        <select
          value={c}
          onChange={(e) => setC(e.target.value)}
          className="rounded-lg border px-2 py-2 text-sm w-full"
        >
          {CARRIERS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <input
          value={t}
          onChange={(e) => setT(e.target.value)}
          placeholder="Takip numarası"
          className="rounded-lg border px-2 py-2 text-sm w-full"
        />
      </div>
      <Button
        type="button"
        variant="primary"
        size="sm"
        disabled={busy || !String(t).trim()}
        onClick={() => onShip(order, c, String(t).trim())}
      >
        <Truck className="h-4 w-4" />
        {label}
      </Button>
    </div>
  );
}
