import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  RefreshCw,
  CheckCircle,
  Clock,
  Building2,
  Banknote,
  XCircle,
  ChevronDown,
  ChevronUp,
  User,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { fetchOrders, fetchOrderDetail, updateOrderStatus } from '@/services/orderApi';
import { ORDER_CANCEL_PRESETS } from '@/data/orderCancelReasons';
import { formatPrice } from '@/utils/whatsapp';

const STATUS_LABELS = {
  pending_iban_check: { label: 'IBAN bekleniyor', color: 'text-amber-700 bg-amber-50', icon: Building2 },
  pending_cod: { label: 'Onay bekliyor', color: 'text-orange-700 bg-orange-50', icon: Clock },
  iban_verified: { label: 'IBAN onaylandı', color: 'text-emerald-700 bg-emerald-50', icon: CheckCircle },
  confirmed: { label: 'Onaylandı', color: 'text-emerald-700 bg-emerald-50', icon: CheckCircle },
  shipped: { label: 'Kargoda', color: 'text-blue-700 bg-blue-50', icon: Package },
  completed: { label: 'Tamamlandı', color: 'text-gray-700 bg-gray-50', icon: CheckCircle },
  cancelled: { label: 'Reddedildi / İptal', color: 'text-red-700 bg-red-50', icon: XCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_LABELS[status] || { label: status, color: 'text-gray-600 bg-gray-100', icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}

function isPending(status) {
  return status === 'pending_cod' || status === 'pending_iban_check';
}

function OrderDetailPanel({ order, onApprove, onReject, busy }) {
  const c = order.customer || {};
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 p-4 space-y-4 text-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-bold text-brand-900 flex items-center gap-2">
            <User className="h-4 w-4" /> Müşteri
          </h4>
          <dl className="space-y-1 text-gray-700">
            <div>
              <dt className="text-xs text-gray-500">Ad soyad</dt>
              <dd className="font-medium">{c.name || '—'}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-brand-500" />
              <a href={`tel:${c.phone}`} className="hover:text-brand-700">
                {c.phone || '—'}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-brand-500" />
              <a href={`mailto:${c.email}`} className="hover:text-brand-700 break-all">
                {c.email || '—'}
              </a>
            </div>
          </dl>
        </div>
        <div className="space-y-2">
          <h4 className="font-bold text-brand-900 flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Teslimat
          </h4>
          <dl className="space-y-1 text-gray-700">
            <div>
              <dt className="text-xs text-gray-500">İl / İlçe</dt>
              <dd>
                {c.city || '—'}
                {c.district ? ` / ${c.district}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Açık adres</dt>
              <dd className="font-medium whitespace-pre-wrap">{c.address || '—'}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div>
        <h4 className="font-bold text-brand-900 mb-2">Ürünler ({items.length})</h4>
        <ul className="divide-y divide-brand-100 rounded-lg border border-brand-100 bg-white overflow-hidden">
          {items.map((item, i) => (
            <li key={item.id || i} className="px-3 py-2 flex justify-between gap-2">
              <span className="text-gray-800">
                {item.name}{' '}
                <span className="text-gray-500">× {item.quantity || 1}</span>
              </span>
              <span className="font-semibold text-brand-800 shrink-0">
                {formatPrice((item.price || 0) * (item.quantity || 1))}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-4 text-sm border-t border-brand-100 pt-3">
        <div>
          <span className="text-gray-500">Ödeme: </span>
          <strong>{order.paymentMethod === 'iban' ? 'Havale / EFT' : 'Kapıda ödeme'}</strong>
        </div>
        <div>
          <span className="text-gray-500">Toplam: </span>
          <strong className="text-brand-800">{formatPrice(order.orderTotal)}</strong>
        </div>
        {order.pdfUrl && (
          <a
            href={order.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-brand-600 hover:underline"
          >
            PDF <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {order.cancelReason && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-red-800 text-xs">
          <strong>İptal nedeni:</strong> {order.cancelReason}
          {order.cancelNote ? ` — ${order.cancelNote}` : ''}
        </div>
      )}

      {isPending(order.status) && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-100">
          <Button type="button" variant="primary" disabled={busy} onClick={onApprove}>
            <CheckCircle className="h-4 w-4" />
            Onayla
          </Button>
          <Button type="button" variant="danger" disabled={busy} onClick={onReject}>
            <XCircle className="h-4 w-4" />
            Reddet
          </Button>
        </div>
      )}
    </div>
  );
}

function RejectModal({ open, onClose, onConfirm, busy }) {
  const [presetId, setPresetId] = useState(ORDER_CANCEL_PRESETS[0].id);
  const [note, setNote] = useState('');

  if (!open) return null;

  const preset = ORDER_CANCEL_PRESETS.find((p) => p.id === presetId);
  const reasonLabel = preset?.label || '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6">
        <h3 className="font-bold text-lg text-brand-900">Siparişi reddet</h3>
        <p className="text-sm text-gray-600 mt-1">Hazır neden seçin veya ek not yazın.</p>

        <div className="mt-4 space-y-2">
          {ORDER_CANCEL_PRESETS.map((p) => (
            <label
              key={p.id}
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition ${
                presetId === p.id ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="cancelReason"
                checked={presetId === p.id}
                onChange={() => setPresetId(p.id)}
                className="mt-1"
              />
              <span className="text-sm font-medium text-gray-800">{p.label}</span>
            </label>
          ))}
        </div>

        <label className="block mt-4">
          <span className="text-xs font-medium text-gray-600">Ek not (isteğe bağlı)</span>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Örn: Müşteri telefonda pahalı geldiğini söyledi..."
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </label>

        <div className="mt-5 flex flex-wrap gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Vazgeç
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={busy}
            onClick={() => onConfirm(reasonLabel, note.trim())}
          >
            Reddet ve kaydet
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersAdmin({ setMsg }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

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

  const openDetail = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      const order = await fetchOrderDetail(id);
      setDetail(order);
    } catch (err) {
      setMsg(err.message, 'error');
      setExpandedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async (order) => {
    setBusyId(order.id);
    try {
      const status =
        order.paymentMethod === 'iban' && order.status === 'pending_iban_check'
          ? 'iban_verified'
          : 'confirmed';
      await updateOrderStatus(order.id, status);
      setMsg('Sipariş onaylandı');
      setExpandedId(null);
      setDetail(null);
      load();
    } catch (err) {
      setMsg(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectConfirm = async (cancelReason, cancelNote) => {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id);
    try {
      await updateOrderStatus(rejectTarget.id, 'cancelled', { cancelReason, cancelNote });
      setMsg('Sipariş reddedildi');
      setRejectTarget(null);
      setExpandedId(null);
      setDetail(null);
      load();
    } catch (err) {
      setMsg(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = orders.filter((o) => {
    if (filter === 'iban') return o.paymentMethod === 'iban';
    if (filter === 'cod') return o.paymentMethod === 'cod';
    if (filter === 'pending') return isPending(o.status);
    if (filter === 'approved') return o.status === 'confirmed' || o.status === 'iban_verified';
    if (filter === 'cancelled') return o.status === 'cancelled';
    return true;
  });

  return (
    <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-card space-y-4">
      <RejectModal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
        busy={Boolean(busyId)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold text-brand-900">Gelen Siparişler</h2>
        <Button variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      <p className="text-sm text-gray-600">
        Siparişe tıklayın — müşteri ve adres bilgilerini görün, <strong>Onayla</strong> veya{' '}
        <strong>Reddet</strong> seçin. IBAN ödemelerinde önce bankadan kontrol edin.
      </p>

      <div className="flex flex-wrap gap-2">
        {[
          ['all', 'Tümü'],
          ['pending', 'Bekleyen'],
          ['approved', 'Onaylanan'],
          ['cancelled', 'Reddedilen'],
          ['iban', 'IBAN'],
          ['cod', 'Kapıda'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === id ? 'bg-brand-900 text-white' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 py-8 text-center">Yükleniyor...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">Henüz sipariş yok veya filtre boş.</p>
      ) : (
        <ul className="divide-y divide-brand-50">
          {filtered.map((o) => {
            const expanded = expandedId === o.id;
            return (
              <li key={o.id} className="py-4 first:pt-0">
                <button
                  type="button"
                  onClick={() => openDetail(o.id)}
                  className="w-full text-left flex flex-wrap items-start justify-between gap-2 hover:bg-brand-50/50 -mx-2 px-2 py-1 rounded-lg transition"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    {expanded ? (
                      <ChevronUp className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-brand-900">{o.orderNumber || o.id}</p>
                      <p className="text-sm text-gray-700 mt-0.5">
                        {o.customerName}
                        {o.customerEmail ? ` · ${o.customerEmail}` : ''}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {o.createdAt ? new Date(o.createdAt).toLocaleString('tr-TR') : ''}
                        {o.itemCount ? ` · ${o.itemCount} ürün` : ''}
                      </p>
                      {o.cancelReason && (
                        <p className="text-xs text-red-600 mt-1">Red: {o.cancelReason}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-2 shrink-0">
                    <p className="font-bold text-brand-700">{formatPrice(o.orderTotal)}</p>
                    <StatusBadge status={o.status} />
                    <p className="text-xs text-gray-500">
                      {o.paymentMethod === 'iban' ? 'Havale/EFT' : 'Kapıda ödeme'}
                    </p>
                  </div>
                </button>

                {expanded && (
                  <>
                    {detailLoading && <p className="text-sm text-gray-500 mt-2">Detay yükleniyor...</p>}
                    {detail && detail.id === o.id && (
                      <OrderDetailPanel
                        order={detail}
                        busy={busyId === o.id}
                        onApprove={() => handleApprove(detail)}
                        onReject={() => setRejectTarget(detail)}
                      />
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
