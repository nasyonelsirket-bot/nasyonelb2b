import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { CreditCard, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import MobileCheckoutStickyBar from '@/components/cart/MobileCheckoutStickyBar';
import { formatPrice } from '@/utils/whatsapp';
import { PAYTR_TRUST_LABEL } from '@/constants/companyInfo';
import { fetchPaytrIframeToken } from '@/services/paytrApi';
import {
  ensurePaytrIframeSession,
  readPaymentSession,
  resolvePaymentNavState,
} from '@/utils/paytrPaymentSession';
import {
  attachPaytrIframeDebugListeners,
  logPaytrIframeEvent,
  redactPaytrIframeUrl,
} from '@/utils/paytrIframeDebug';

const IFRAME_RESIZER_SRC = 'https://www.paytr.com/js/iframeResizer.min.js';
const resizerStartedByOrder = new Set();

function loadIframeResizerScript() {
  return new Promise((resolve, reject) => {
    if (typeof window.iFrameResize === 'function') {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${IFRAME_RESIZER_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('PayTR iframe script yüklenemedi')), {
        once: true,
      });
      return;
    }
    const script = document.createElement('script');
    script.src = IFRAME_RESIZER_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('PayTR iframe script yüklenemedi'));
    document.body.appendChild(script);
  });
}

export default function PaymentPage() {
  const location = useLocation();
  const paymentNav = useMemo(() => resolvePaymentNavState(location.state), [location.state]);
  const orderId = paymentNav?.orderId;
  const orderNumber = paymentNav?.orderNumber;
  const orderTotal = paymentNav?.orderTotal;

  const cachedSession = orderId ? readPaymentSession(orderId) : null;
  const [loading, setLoading] = useState(!cachedSession?.iframeUrl);
  const [formError, setFormError] = useState('');
  const [iframeUrl, setIframeUrl] = useState(cachedSession?.iframeUrl || '');
  const iframeRef = useRef(null);
  const tokenRequestedRef = useRef(Boolean(cachedSession?.iframeUrl));

  const paymentFormActive = Boolean(iframeUrl);

  useEffect(() => {
    return attachPaytrIframeDebugListeners();
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (paymentFormActive) {
      html.classList.add('checkout-cta-hidden');
    } else {
      html.classList.remove('checkout-cta-hidden');
    }
    return () => html.classList.remove('checkout-cta-hidden');
  }, [paymentFormActive]);

  useEffect(() => {
    if (!orderId || tokenRequestedRef.current) return undefined;

    tokenRequestedRef.current = true;
    let cancelled = false;

    const existing = readPaymentSession(orderId);
    if (existing?.iframeUrl) {
      setIframeUrl(existing.iframeUrl);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setFormError('');

    ensurePaytrIframeSession(orderId, () => fetchPaytrIframeToken(orderId))
      .then((data) => {
        if (cancelled) return;
        setIframeUrl(data.iframeUrl);
      })
      .catch((err) => {
        if (!cancelled) {
          tokenRequestedRef.current = false;
          setFormError(err?.message || 'PayTR ödeme ekranı açılamadı.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    if (!iframeUrl || !orderId || resizerStartedByOrder.has(orderId)) return undefined;

    let cancelled = false;

    (async () => {
      try {
        await loadIframeResizerScript();
        if (cancelled || !iframeRef.current) return;
        if (typeof window.iFrameResize === 'function' && !resizerStartedByOrder.has(orderId)) {
          window.iFrameResize(
            {
              checkOrigin: false,
              heightCalculationMethod: 'lowestElement',
              warningTimeout: 10000,
            },
            '#paytriframe',
          );
          resizerStartedByOrder.add(orderId);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('PayTR iframeResizer:', err);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [iframeUrl, orderId]);

  if (!orderId) {
    return <Navigate to="/sepet" replace />;
  }

  const showStickyCta = !paymentFormActive;

  return (
    <>
      <SEO title="Güvenli Ödeme" path="/odeme" noindex />
      <div
        className={`checkout-shell md:min-h-[calc(100vh-8rem)] bg-gradient-to-br from-brand-50 via-orange-50/40 to-emerald-50/30 py-6 sm:py-10 ${paymentFormActive ? 'checkout-shell--iframe-active' : ''}`}
      >
        <div className="checkout-shell__main md:pb-0 mx-auto max-w-2xl px-4 w-full">
          <Link
            to="/sepet"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-900 mb-5"
          >
            <ArrowLeft className="h-4 w-4" /> Sepete dön
          </Link>

          <div className="rounded-3xl border border-white/80 bg-white/90 backdrop-blur-sm shadow-xl overflow-hidden">
            <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-accent-gold px-5 py-5 text-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-accent-gold" />
                  Güvenli Ödeme
                </h1>
                {orderTotal != null && (
                  <p className="text-2xl font-bold text-accent-gold tabular-nums">{formatPrice(orderTotal)}</p>
                )}
              </div>
              {(orderNumber || orderId) && (
                <p className="mt-1 text-xs text-brand-200">Sipariş: {orderNumber || orderId}</p>
              )}
              <div className="mt-3 rounded-xl bg-white/10 border border-white/20 px-3 py-2 flex items-center gap-2 text-xs text-brand-100">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" />
                <span>{PAYTR_TRUST_LABEL} · Kart bilgileriniz PayTR güvenli ödeme ekranında girilir</span>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {formError && (
                <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {formError}
                </p>
              )}

              {loading && !iframeUrl && (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-brand-700">
                  <Loader2 className="h-10 w-10 animate-spin text-accent-gold" />
                  <p className="text-sm font-medium">PayTR ödeme ekranı hazırlanıyor…</p>
                </div>
              )}

              {iframeUrl ? (
                <div className="rounded-2xl border border-brand-100 bg-white overflow-hidden shadow-inner">
                  <iframe
                    ref={iframeRef}
                    id="paytriframe"
                    title="PayTR Güvenli Ödeme"
                    src={iframeUrl}
                    frameBorder="0"
                    scrolling="no"
                    className="w-full min-h-[480px] max-md:min-h-[420px] border-0"
                    allow="payment *; fullscreen"
                    referrerPolicy="strict-origin-when-cross-origin"
                    onLoad={(event) => {
                      logPaytrIframeEvent('load', {
                        src: redactPaytrIframeUrl(event.currentTarget.src),
                      });
                    }}
                    onError={() => {
                      logPaytrIframeEvent('error', {
                        message: 'PayTR iframe yüklenemedi — CSP/X-Frame-Options kontrol edin',
                      });
                    }}
                  />
                </div>
              ) : null}

              <p className="text-center text-[11px] text-gray-500 pt-4">
                Ödeme sonucu sipariş sistemimize otomatik bildirilir. Başarılı ödeme sonrası onay e-postası gönderilir.
              </p>
            </div>
          </div>
        </div>

        {showStickyCta ? (
          <MobileCheckoutStickyBar
            label="Kredi Kartı ile Öde"
            onClick={() => {}}
            loading={loading}
            loadingLabel="Ödeme ekranı hazırlanıyor…"
            disabled={!iframeUrl && !loading}
            error={formError}
            total={orderTotal ?? null}
            showPaymentIcon
          />
        ) : null}
      </div>
    </>
  );
}
