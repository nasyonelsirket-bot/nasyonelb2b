import { useEffect, useRef } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { CreditCard, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import { formatPrice } from '@/utils/whatsapp';
import { PAYTR_TRUST_LABEL } from '@/constants/companyInfo';

function PaytrIframe({ token }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const mountResize = () => {
      if (typeof window.iFrameResize === 'function' && iframeRef.current) {
        window.iFrameResize({}, iframeRef.current);
      }
    };

    const scriptId = 'paytr-iframe-resizer';
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.paytr.com/js/iframeResizer.min.js';
      script.async = true;
      script.onload = mountResize;
      document.body.appendChild(script);
    } else {
      mountResize();
    }
  }, [token]);

  return (
    <iframe
      ref={iframeRef}
      title="PayTR güvenli ödeme"
      src={`https://www.paytr.com/odeme/guvenli/${token}`}
      id="paytriframe"
      frameBorder="0"
      scrolling="no"
      className="w-full min-h-[520px] rounded-xl border border-gray-200 bg-white"
    />
  );
}

export default function PaymentPage() {
  const location = useLocation();
  const iframeToken = location.state?.iframeToken;
  const orderId = location.state?.orderId;
  const orderNumber = location.state?.orderNumber;
  const orderTotal = location.state?.orderTotal;

  if (!iframeToken) {
    return <Navigate to="/sepet" replace />;
  }

  return (
    <>
      <SEO title="Güvenli Ödeme" path="/odeme" noindex />
      <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-brand-50 via-orange-50/40 to-emerald-50/30 py-6 sm:py-10">
        <div className="mx-auto max-w-lg px-4">
          <Link
            to="/sepet"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-900 mb-5"
          >
            <ArrowLeft className="h-4 w-4" /> Sepete dön
          </Link>

          <div className="rounded-3xl border border-white/80 bg-white/90 backdrop-blur-sm shadow-xl overflow-hidden">
            <div className="relative bg-gradient-to-br from-brand-900 via-brand-800 to-accent-gold px-5 py-6 text-white overflow-hidden">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-accent-gold" />
                  <span className="text-sm font-semibold text-brand-100">Güvenli ödeme</span>
                </div>
                <h1 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-accent-gold" />
                  Kart ile Öde
                </h1>
                {orderTotal != null && (
                  <p className="mt-2 text-2xl font-bold text-accent-gold tabular-nums">{formatPrice(orderTotal)}</p>
                )}
                {(orderNumber || orderId) && (
                  <p className="mt-1 text-xs text-brand-200">Sipariş: {orderNumber || orderId}</p>
                )}
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 px-3 py-2.5 flex items-center gap-2 text-xs text-emerald-800">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{PAYTR_TRUST_LABEL} · 256 Bit SSL · 3D Secure</span>
              </div>

              <PaytrIframe token={iframeToken} />

              <p className="text-center text-[11px] text-gray-500">
                Kart bilgileriniz PayTR güvenli ödeme ekranında işlenir; sitemizde saklanmaz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
