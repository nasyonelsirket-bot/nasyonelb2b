import { useEffect, useRef } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { CreditCard, ArrowLeft } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import { formatPrice } from '@/utils/whatsapp';

const IFRAME_RESIZER_SRC = 'https://www.paytr.com/js/iframeResizer.min.js';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function PaymentPage() {
  const location = useLocation();
  const token = location.state?.token;
  const orderId = location.state?.orderId;
  const orderNumber = location.state?.orderNumber;
  const orderTotal = location.state?.orderTotal;
  const resized = useRef(false);

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;
    loadScript(IFRAME_RESIZER_SRC)
      .then(() => {
        if (cancelled || resized.current) return;
        if (typeof window.iFrameResize === 'function') {
          window.iFrameResize({}, '#paytriframe');
          resized.current = true;
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return <Navigate to="/sepet" replace />;
  }

  return (
    <>
      <SEO title="Ödeme" path="/odeme" noindex />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link to="/sepet" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 mb-6">
          <ArrowLeft className="h-4 w-4" /> Sepete dön
        </Link>

        <div className="rounded-2xl border border-brand-200 bg-white p-6 shadow-card">
          <h1 className="font-display text-2xl font-bold text-brand-900 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-accent-gold" />
            Güvenli Ödeme
          </h1>
          <p className="mt-2 text-sm text-brand-600">
            Kredi veya banka kartınızla PayTR güvenli ödeme altyapısı üzerinden ödeme yapın.
            {orderTotal != null && (
              <span className="block mt-1 font-semibold text-brand-900">
                Tutar: {formatPrice(orderTotal)}
              </span>
            )}
          </p>
          {(orderNumber || orderId) && (
            <p className="mt-1 text-xs text-gray-400">
              Sipariş: {orderNumber || orderId}
            </p>
          )}

          <div className="mt-6 min-h-[520px]">
            <iframe
              src={`https://www.paytr.com/odeme/guvenli/${token}`}
              id="paytriframe"
              title="PayTR Ödeme"
              frameBorder="0"
              scrolling="no"
              style={{ width: '100%', minHeight: '520px' }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
