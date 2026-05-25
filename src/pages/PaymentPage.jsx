import { useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { CreditCard, ArrowLeft, Loader2 } from 'lucide-react';
import SEO from '@/components/seo/SEO';

export default function PaymentPage() {
  const location = useLocation();
  const iframeToken = location.state?.iframeToken;

  useEffect(() => {
    if (iframeToken) {
      window.location.replace(`https://www.paytr.com/odeme/guvenli/${iframeToken}`);
    }
  }, [iframeToken]);

  if (!iframeToken) {
    return <Navigate to="/sepet" replace />;
  }

  return (
    <>
      <SEO title="Güvenli Ödeme" path="/odeme" noindex />
      <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4 py-16 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-600" aria-hidden />
        <h1 className="mt-6 font-display text-xl font-bold text-brand-900 flex items-center justify-center gap-2">
          <CreditCard className="h-5 w-5" />
          PayTR güvenli ödeme sayfasına yönlendiriliyorsunuz
        </h1>
        <p className="mt-3 text-sm text-brand-600 max-w-md">
          Birkaç saniye içinde otomatik yönlendirilmezseniz aşağıdaki bağlantıyı kullanın.
        </p>
        <a
          href={`https://www.paytr.com/odeme/guvenli/${iframeToken}`}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 underline"
        >
          Ödeme sayfasına git
        </a>
        <Link
          to="/sepet"
          className="mt-8 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Sepete dön
        </Link>
      </div>
    </>
  );
}
