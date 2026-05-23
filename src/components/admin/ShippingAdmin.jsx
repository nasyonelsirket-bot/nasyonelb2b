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
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { fetchOrders, fetchOrderDetail, updateOrderStatus, deleteOrder } from '@/services/orderApi';
import { formatPrice } from '@/utils/whatsapp';
import { getStatusMeta } from '@/constants/orderStatus';

const FILTERS = [
  { id: 'preparing', label: 'Kargoya hazır' },
  { id: 'in_transit', label: 'Yolda' },
  { id: 'delivered', label: 'Teslim edildi' },
  { id: 'cancelled', label: 'İptal' },
  { id: 'all', label: 'Tümü' },
];

function bucket(status) {
  if (status === 'shipped') return 'in_transit';
  if (status === 'completed') return 'delivered';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'confirmed' || status === 'iban_verified') return 'preparing';
  return null;
}

export default function ShippingAdmin({ setMsg }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('in_transit');
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

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

  const shippable = orders.filter((o) =>
    ['confirmed', 'iban_verified', 'shipped', 'completed'].includes(o.status),
  );

  const filtered = shippable.filter((o) => {
    const b = bucket(o.status);
    if (filter === 'all') return true;
    return b === filter;
  });

  const counts = {
    preparing: shippable.filter((o) => bucket(o.status) === 'preparing').length,
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
      setMsg(['Kargoya verildi', mailNote].filter(Boolean).join(' · '));
      setDetail(await fetchOrderDetail(order.id));
      load();
    } catch (err) {
      setMsg(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleComplete = async (order) => {
    if (!window.confirm(`${order.orderNumber} teslim edildi olarak işaretlensin mi? Müşteriye otomatik kupon oluşturulabilir.`)) {
      return;
    }
    setBusyId(order.id);
    try {
      const res = await updateOrderStatus(order.id, 'completed');
      const note = res.rewardCoupon
        ? ` · Kupon: ${res.rewardCoupon}`
        : '';
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
    if (
      !window.confirm(
        `${label} siparişi kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`,
      )
    ) {
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
            Onaylanan siparişleri hazırlık, yolda ve teslim olarak takip edin.
          </p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-sm">
        <div className="rounded-lg bg-amber-50 p-3">
          <p className="font-bold text-amber-900">{counts.preparing}</p>
          <p className="text-xs text-amber-800">Hazırlanıyor</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="font-bold text-blue-900">{counts.in_transit}</p>
          <p className="text-xs text-blue-800">Yolda</p>
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

      {loading ? (
        <p className="text-sm text-gray-500 py-8 text-center">Yükleniyor...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">Bu filtrede sipariş yok.</p>
      ) : (
        <ul className="divide-y divide-brand-50">
          {filtered.map((o) => {
            const expanded = expandedId === o.id;
            const busy = busyId === o.id;
            return (
              <li key={o.id} className="py-4">
                <button
                  type="button"
                  onClick={() => openDetail(o.id)}
                  className="w-full text-left flex flex-wrap justify-between gap-2 hover:bg-brand-50/50 -mx-2 px-2 py-1 rounded-lg"
                >
                  <div className="flex gap-2 min-w-0">
                    {expanded ? <ChevronUp className="h-5 w-5 shrink-0" /> : <ChevronDown className="h-5 w-5 shrink-0" />}
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
                            <Package className="inline h-4 w-4" /> {detail.shippingCarrier} · {detail.trackingNumber}
                          </p>
                        )}
                        {detail.rewardCouponCode && (
                          <p className="text-emerald-800 text-xs">
                            Verilen kupon: <code>{detail.rewardCouponCode}</code>
                          </p>
                        )}
                        {['confirmed', 'iban_verified'].includes(detail.status) && (
                          <ShipBlock order={detail} onShip={handleShip} busy={busy} />
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

const CARRIERS = ['Yurtiçi Kargo', 'Aras Kargo', 'MNG Kargo', 'PTT Kargo', 'Sürat Kargo', 'Diğer'];

function ShipBlock({ order, onShip, busy, label = 'Kargoya ver' }) {
  const [carrier, setCarrier] = useState(order.shippingCarrier || CARRIERS[0]);
  const [tracking, setTracking] = useState(order.trackingNumber || '');

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-3 space-y-2">
      <p className="font-medium text-sm">{label}</p>
      <div className="grid sm:grid-cols-2 gap-2">
        <select
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          className="rounded-lg border px-2 py-2 text-sm w-full"
        >
          {CARRIERS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="Takip numarası"
          className="rounded-lg border px-2 py-2 text-sm w-full"
        />
      </div>
      <Button
        type="button"
        variant="primary"
        size="sm"
        disabled={busy || !tracking.trim()}
        onClick={() => onShip(order, carrier, tracking.trim())}
      >
        <Truck className="h-4 w-4" />
        {label}
      </Button>
    </div>
  );
}
