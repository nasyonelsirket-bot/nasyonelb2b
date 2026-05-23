import { Link, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';

export default function PaymentFailPage() {
  const [params] = useSearchParams();
  const orderId = params.get('oid');

  return (
    <>
      <SEO title="Ödeme Başarısız" path="/odeme/hata" noindex />
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <XCircle className="mx-auto h-16 w-16 text-red-500" />
        <h1 className="mt-6 font-display text-2xl font-bold text-brand-900">Ödeme Tamamlanamadı</h1>
        <p className="mt-3 text-brand-600">
          Ödeme işlemi iptal edildi veya bir hata oluştu. Lütfen tekrar deneyin.
        </p>
        {orderId && (
          <p className="mt-2 text-sm text-gray-500">Referans: {orderId}</p>
        )}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/sepet">
            <Button variant="primary">Sepete Dön</Button>
          </Link>
          <Link to="/iletisim">
            <Button variant="secondary">İletişime Geç</Button>
          </Link>
        </div>
      </div>
    </>
  );
}
