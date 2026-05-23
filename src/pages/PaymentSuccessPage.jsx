import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import { trackPurchase } from '@/lib/analytics/ga4';

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const orderId = params.get('oid');
  const { clearCart, items } = useCart();
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current && orderId && items?.length) {
      trackPurchase({
        transactionId: orderId,
        items,
        value: items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0),
      });
      tracked.current = true;
    }
    clearCart();
  }, [orderId, items, clearCart]);

  return (
    <>
      <SEO title="Ödeme Başarılı" path="/odeme/basarili" noindex />
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="mt-6 font-display text-2xl font-bold text-brand-900">Ödemeniz Alındı</h1>
        <p className="mt-3 text-brand-600">
          Ödeme işleminiz tamamlandı. Onay e-postanız kısa süre içinde iletilecektir.
        </p>
        {orderId && (
          <p className="mt-2 text-sm text-gray-500">Referans: {orderId}</p>
        )}
        <Link to="/" className="inline-block mt-8">
          <Button variant="primary">Ana Sayfaya Dön</Button>
        </Link>
      </div>
    </>
  );
}
