import { useState, useEffect, useCallback } from 'react';
import { Package, RefreshCw, CheckCircle, Clock, Building2, Banknote } from 'lucide-react';
import Button from '@/components/ui/Button';
import { fetchOrders, updateOrderStatus } from '@/services/orderApi';
import { formatPrice } from '@/utils/whatsapp';

const STATUS_LABELS = {
  pending_iban_check: { label: 'IBAN bekleniyor', color: 'text-amber-700 bg-amber-50', icon: Building2 },
  iban_verified: { label: 'IBAN onaylandı', color: 'text-emerald-700 bg-emerald-50', icon: CheckCircle },
  pending_cod: { label: 'Kapıda ödeme', color: 'text-brand-700 bg-brand-50', icon: Banknote },
  shipped: { label: 'Kargoda', color: 'text-blue-700 bg-blue-50', icon: Package },
  completed: { label: 'Tamamlandı', color: 'text-gray-700 bg-gray-50', icon: CheckCircle },
  cancelled: { label: 'İptal', color: 'text-red-700 bg-red-50', icon: Clock },
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

export default function OrdersAdmin({ setMsg }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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

  const handleVerifyIban = async (id) => {
    try {
      await updateOrderStatus(id, 'iban_verified');
      setMsg('IBAN ödemesi onaylandı olarak işaretlendi');
      load();
    } catch (err) {
      setMsg(err.message, 'error');
    }
  };

  const filtered = orders.filter((o) => {
    if (filter === 'iban') return o.paymentMethod === 'iban';
    if (filter === 'cod') return o.paymentMethod === 'cod';
    if (filter === 'pending') return o.status?.includes('pending');
    return true;
  });

  return (
    <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold text-brand-900">Gelen Siparişler</h2>
        <Button variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      <p className="text-sm text-gray-600">
        IBAN ile ödeyen müşterileri bankadan kontrol edip &quot;IBAN onayla&quot; ile işaretleyin.
        E-posta bildirimleri için Netlify&apos;da <code className="text-xs bg-brand-50 px-1 rounded">RESEND_API_KEY</code> tanımlayın.
      </p>

      <div className="flex flex-wrap gap-2">
        {[
          ['all', 'Tümü'],
          ['pending', 'Bekleyen'],
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
          {filtered.map((o) => (
            <li key={o.id} className="py-4 first:pt-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
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
                </div>
                <div className="text-right space-y-2">
                  <p className="font-bold text-brand-700">{formatPrice(o.orderTotal)}</p>
                  <StatusBadge status={o.status} />
                  <p className="text-xs text-gray-500">
                    {o.paymentMethod === 'iban' ? 'Havale/EFT' : 'Kapıda ödeme'}
                  </p>
                </div>
              </div>
              {o.paymentMethod === 'iban' && o.status === 'pending_iban_check' && (
                <Button
                  type="button"
                  variant="primary"
                  className="mt-3 text-sm"
                  onClick={() => handleVerifyIban(o.id)}
                >
                  <CheckCircle className="h-4 w-4" />
                  IBAN ödemesini onayla
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
