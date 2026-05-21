import { useState } from 'react';
import { Package, Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import { trackOrder } from '@/services/orderApi';

const STATUS_TR = {
  pending_iban_check: 'Ödeme kontrolü bekleniyor',
  pending_cod: 'Onay bekleniyor',
  iban_verified: 'Ödeme onaylandı — hazırlanıyor',
  confirmed: 'Sipariş onaylandı',
  shipped: 'Kargoya verildi',
  completed: 'Teslim edildi',
  cancelled: 'İptal / red',
};

export default function OrderTrackSection() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!orderNumber.trim() || !email.trim()) {
      setError('Sipariş numarası ve e-posta zorunludur.');
      return;
    }
    setLoading(true);
    try {
      const order = await trackOrder(orderNumber.trim(), email.trim());
      setResult(order);
    } catch (err) {
      setError(err.message || 'Sipariş bulunamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-3 sm:px-4 py-6">
      <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 sm:p-8 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-900 text-accent-gold">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-brand-900">Sipariş Takip</h2>
            <p className="text-sm text-gray-600">Sipariş numarası ve e-posta ile sorgulayın</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
          <div>
            <label className="text-xs font-medium text-brand-800">Sipariş numarası *</label>
            <input
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="NT-XXXXXXX"
              className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-brand-800">E-posta *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="siparişteki e-posta"
              className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" variant="primary" disabled={loading}>
              <Search className="h-4 w-4" />
              {loading ? 'Sorgulanıyor...' : 'Siparişi sorgula'}
            </Button>
          </div>
        </form>

        {error && <p className="mt-3 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        {result && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm space-y-2">
            <p>
              <strong>Sipariş:</strong> {result.orderNumber}
            </p>
            <p>
              <strong>Durum:</strong> {STATUS_TR[result.status] || result.status}
            </p>
            {result.shippingCarrier && result.trackingNumber && (
              <p>
                <strong>Kargo:</strong> {result.shippingCarrier} — Takip no:{' '}
                <span className="font-mono font-semibold">{result.trackingNumber}</span>
              </p>
            )}
            {result.status === 'shipped' && !result.trackingNumber && (
              <p className="text-gray-600">Kargoya verildi; takip numarası kısa süre içinde güncellenecektir.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
