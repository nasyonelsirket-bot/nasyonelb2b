import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Home, Sparkles } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';
import ConfettiBurst from '@/components/payment/ConfettiBurst';
import { useCart } from '@/context/CartContext';
import { trackPurchase } from '@/lib/analytics/ga4';

const REDIRECT_SECONDS = 5;

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
    if (cartCleared.current) return;
    cartCleared.current = true;
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

  useEffect(() => {
    redirectTimer.current = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (redirectTimer.current) clearInterval(redirectTimer.current);
    };
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) goHome();
  }, [secondsLeft, goHome]);

  return (
    <>
      <SEO title="Ödeme Başarılı" path="/odeme/basarili" noindex />
      <ConfettiBurst />

      <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="relative w-full max-w-md text-center">
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

          {orderId && (
            <p className="mt-3 text-xs sm:text-sm text-gray-500 font-mono bg-gray-50 inline-block px-3 py-1 rounded-lg border border-gray-100">
              Sipariş ref: {orderId}
            </p>
          )}

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
