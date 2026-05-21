import { useEffect, useState } from 'react';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import { fetchMemberOrders, fetchMemberOrderDetail } from '@/services/memberApi';
import { formatPrice } from '@/utils/whatsapp';

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const list = await fetchMemberOrders();
        if (!cancelled) setOrders(list);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Siparişler yüklenemedi');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleDetail = async (id) => {
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
      return;
    }
    setOpenId(id);
    setDetailLoading(true);
    try {
      const d = await fetchMemberOrderDetail(id);
      setDetail(d);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <>
      <SEO title="Siparişlerim" path="/hesabim/siparislerim" />
      <div className="rounded-2xl border border-brand-100 bg-white shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-50 flex items-center gap-2">
          <Package className="h-5 w-5 text-brand-600" />
          <h2 className="font-display font-bold text-brand-900">Siparişlerim</h2>
        </div>

        {loading && <p className="p-6 text-sm text-gray-500">Yükleniyor...</p>}
        {error && <p className="p-6 text-sm text-red-700 bg-red-50">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <p className="p-8 text-center text-sm text-gray-500">
            Henüz bu hesapla eşleşen sipariş yok. Sipariş verirken kayıtlı e-postanızı kullanın.
          </p>
        )}

        <ul className="divide-y divide-brand-50">
          {orders.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => toggleDetail(o.id)}
                className="w-full text-left px-5 py-4 hover:bg-brand-50/50 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <p className="font-semibold text-brand-900">{o.orderNumber}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDate(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium rounded-full bg-brand-100 text-brand-800 px-2.5 py-1">
                    {o.statusLabel || o.status}
                  </span>
                  <span className="font-bold text-brand-800">{formatPrice(o.orderTotal)}</span>
                  {openId === o.id ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>

              {openId === o.id && (
                <div className="px-5 pb-4 bg-brand-50/30 text-sm space-y-2">
                  {detailLoading && <p className="text-gray-500">Detay yükleniyor...</p>}
                  {detail && detail.id === o.id && (
                    <>
                      <p>
                        <span className="text-gray-500">Ödeme:</span>{' '}
                        {detail.paymentMethod === 'iban' ? 'Havale/EFT' : 'Kapıda ödeme'}
                      </p>
                      <p>
                        <span className="text-gray-500">Ürün:</span> {detail.itemCount} kalem
                      </p>
                      {detail.trackingNumber && (
                        <p>
                          <span className="text-gray-500">Kargo:</span> {detail.shippingCarrier}{' '}
                          — <span className="font-mono font-semibold">{detail.trackingNumber}</span>
                        </p>
                      )}
                      {Array.isArray(detail.items) && detail.items.length > 0 && (
                        <ul className="mt-2 space-y-1 border-t border-brand-100 pt-2">
                          {detail.items.map((item, i) => (
                            <li key={i} className="flex justify-between gap-2 text-gray-700">
                              <span className="line-clamp-1">{item.name}</span>
                              <span className="shrink-0">×{item.quantity || 1}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
