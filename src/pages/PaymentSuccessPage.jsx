import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Home, Loader2, Sparkles } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';
import ConfettiBurst from '@/components/payment/ConfettiBurst';
import { useCart } from '@/context/CartContext';
import { fetchPaymentStatus } from '@/services/paytrApi';
import {
  clearPaymentSession,
  persistPurchaseAnalytics,
  readPurchaseAnalytics,
} from '@/utils/paytrPaymentSession';
import { trackPurchase } from '@/lib/analytics/ga4';
import { trackMetaPurchase } from '@/lib/analytics/meta';
import { hasMetaPurchaseTracked } from '@/lib/analytics/metaPurchase';
import { loadSavedCheckoutCustomer } from '@/utils/checkoutCustomer';

const REDIRECT_SECONDS = 5;
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 45;

function resolvePurchasePayload(orderId, status, cartItems) {
  const snapshot = readPurchaseAnalytics(orderId);
  const apiItems = Array.isArray(status?.items) ? status.items : [];
  const cart = Array.isArray(cartItems) ? cartItems : [];
  const items = apiItems.length ? apiItems : cart.length ? cart : snapshot?.items || [];

  const value =
    Number(status?.orderTotal) ||
    Number(snapshot?.value) ||
    items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);

  const userData =
    status?.customer ||
    loadSavedCheckoutCustomer() ||
    snapshot?.userData ||
    null;

  return { items, value, userData };
}

function firePurchaseEvents(orderId, status, cartItems) {
  if (!orderId || hasMetaPurchaseTracked(orderId)) {
    return true;
  }

  const { items, value, userData } = resolvePurchasePayload(orderId, status, cartItems);
  if (!value || value <= 0) return false;

  trackPurchase({
    transactionId: orderId,
    items,
    value,
  });

  trackMetaPurchase({
    transactionId: orderId,
    items,
    value,
    userData,
    pathname: '/odeme/basarili',
    eventSourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
  });

  return true;
}

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderId = params.get('oid');
  const { clearCart, items } = useCart();
  const tracked = useRef(false);
  const cartCleared = useRef(false);
  const redirectTimer = useRef(null);
  const redirected = useRef(false);
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);
  const [verifyState, setVerifyState] = useState('checking');
  const [verifyMessage, setVerifyMessage] = useState('Ödemeniz doğrulanıyor…');

  const goHome = useCallback(() => {
    if (redirected.current) return;
    redirected.current = true;
    if (redirectTimer.current) {
      clearInterval(redirectTimer.current);
      redirectTimer.current = null;
    }
    try {
      navigate('/', { replace: true });
    } catch {
      /* Router yoksa href devreye girer */
    }
    window.location.href = '/';
  }, [navigate]);

  useEffect(() => {
    if (!orderId) {
      setVerifyState('missing');
      setVerifyMessage('Sipariş referansı bulunamadı.');
      return undefined;
    }

    let cancelled = false;
    let attempts = 0;
    let timer = null;
    let finalized = false;

    const stopPolling = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const finalizeSuccess = (status) => {
      if (cancelled || cartCleared.current || finalized) return;
      finalized = true;
      stopPolling();
      cartCleared.current = true;
      clearPaymentSession(orderId);

      if (firePurchaseEvents(orderId, status, items)) {
        tracked.current = true;
      }
      clearCart();
      setVerifyState('confirmed');
      setVerifyMessage('Ödemeniz onaylandı.');
    };

    const poll = async () => {
      if (cancelled || finalized) return;
      attempts += 1;
      try {
        const status = await fetchPaymentStatus(orderId);
        if (cancelled || finalized) return;

        if (status.failed) {
          finalized = true;
          stopPolling();
          setVerifyState('failed');
          setVerifyMessage('Ödeme tamamlanamadı. Sepetinizden tekrar deneyebilirsiniz.');
          return;
        }

        if (status.paid || status.purchaseConfirmed) {
          finalizeSuccess(status);
          return;
        }

        if (attempts >= POLL_MAX_ATTEMPTS) {
          finalized = true;
          stopPolling();
          setVerifyState('pending');
          setVerifyMessage(
            'Ödemeniz işleniyor. Onay e-postası geldiğinde siparişiniz sistemde görünecektir.',
          );
          return;
        }

        setVerifyState('checking');
        setVerifyMessage('Ödemeniz doğrulanıyor…');
      } catch {
        if (cancelled || finalized) return;
        if (attempts >= POLL_MAX_ATTEMPTS) {
          finalized = true;
          stopPolling();
          setVerifyState('pending');
          setVerifyMessage('Ödeme durumu şu an doğrulanamadı. E-posta bildiriminizi kontrol edin.');
        }
      }
    };

    poll();
    timer = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [orderId, items, clearCart]);

  useEffect(() => {
    if (verifyState !== 'confirmed') return undefined;

    redirectTimer.current = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (redirectTimer.current) clearInterval(redirectTimer.current);
    };
  }, [verifyState]);

  useEffect(() => {
    if (verifyState === 'confirmed' && secondsLeft === 0) goHome();
  }, [verifyState, secondsLeft, goHome]);

  const showSuccessUi = verifyState === 'confirmed';
  const showPendingUi = verifyState === 'checking' || verifyState === 'pending';
  const showFailedUi = verifyState === 'failed' || verifyState === 'missing';

  return (
    <>
      <SEO title="Ödeme Başarılı" path="/odeme/basarili" noindex />
      {showSuccessUi ? <ConfettiBurst /> : null}

      <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="relative w-full max-w-md text-center">
          {showPendingUi && (
            <>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-100">
                <Loader2 className="h-10 w-10 animate-spin text-brand-700" />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900 tracking-tight">
                Ödeme Doğrulanıyor
              </h1>
              <p className="mt-3 text-sm sm:text-base text-brand-600 leading-relaxed px-2">{verifyMessage}</p>
            </>
          )}

          {showSuccessUi && (
            <>
              <div className="mx-auto mb-6 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-emerald-100 shadow-lg shadow-emerald-200/60 animate-[success-pop_0.55s_ease-out]">
                <CheckCircle2 className="h-11 w-11 sm:h-14 sm:w-14 text-emerald-600" strokeWidth={2.2} />
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-accent-gold/15 border border-accent-gold/30 px-3 py-1 text-xs font-semibold text-brand-800 mb-4">
                <Sparkles className="h-3.5 w-3.5 text-accent-gold" />
                Ödeme onaylandı
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900 tracking-tight">
                Ödemeniz Alındı
              </h1>
              <p className="mt-3 text-sm sm:text-base text-brand-600 leading-relaxed px-2">
                Teşekkür ederiz! Ödeme işleminiz tamamlandı. Onay e-postanız kısa süre içinde iletilecektir.
              </p>
            </>
          )}

          {showFailedUi && (
            <>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900 tracking-tight">
                Ödeme Doğrulanamadı
              </h1>
              <p className="mt-3 text-sm sm:text-base text-brand-600 leading-relaxed px-2">{verifyMessage}</p>
            </>
          )}

          {orderId && (
            <p className="mt-3 text-xs sm:text-sm text-gray-500 font-mono bg-gray-50 inline-block px-3 py-1 rounded-lg border border-gray-100">
              Sipariş ref: {orderId}
            </p>
          )}

          {showSuccessUi && (
            <p className="mt-5 text-sm text-brand-700 font-medium">
              {secondsLeft > 0 ? (
                <>
                  <span className="tabular-nums font-bold text-accent-gold">{secondsLeft}</span> saniye içinde ana
                  sayfaya yönlendirileceksiniz…
                </>
              ) : (
                'Ana sayfaya yönlendiriliyorsunuz…'
              )}
            </p>
          )}

          <div className="mt-8 px-2">
            <Button
              type="button"
              variant="gold"
              size="lg"
              onClick={goHome}
              className="w-full sm:w-auto min-w-[220px] hover:scale-[1.03] hover:shadow-xl hover:shadow-accent-gold/30 active:scale-[0.98] transition-all duration-200"
            >
              <Home className="h-5 w-5" />
              Ana Sayfaya Dön
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes success-pop {
          0% { transform: scale(0.6); opacity: 0; }
          70% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
