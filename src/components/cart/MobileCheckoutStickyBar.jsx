import { ChevronLeft, ChevronRight, CreditCard, Loader2 } from 'lucide-react';
import { formatPrice } from '@/utils/whatsapp';

/**
 * Mobil checkout — Trendyol / Hepsiburada tarzı sabit alt CTA çubuğu.
 * Sepet ve ödeme sayfasında aynı tasarım sistemi.
 */
export default function MobileCheckoutStickyBar({
  label,
  onClick,
  loading = false,
  loadingLabel = 'İşleniyor…',
  disabled = false,
  error = '',
  total = null,
  totalLabel = 'Toplam',
  onBack = null,
  showPaymentIcon = false,
  hidden = false,
  className = '',
}) {
  const isDisabled = disabled || loading;

  if (hidden) return null;

  return (
    <div
      className={`mobile-checkout-sticky-bar md:hidden ${className}`.trim()}
      role="region"
      aria-label="Ödeme işlemi"
    >
      <div className="mobile-checkout-sticky-bar__inner">
        {error ? (
          <p className="mobile-checkout-sticky-bar__error" role="alert">
            {error}
          </p>
        ) : null}

        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="mobile-checkout-sticky-bar__back"
            aria-label="Önceki adıma dön"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
            Geri
          </button>
        ) : null}

        {total != null ? (
          <div className="mobile-checkout-sticky-bar__total-row">
            <span className="mobile-checkout-sticky-bar__total-label">{totalLabel}</span>
            <span className="mobile-checkout-sticky-bar__total-value">{formatPrice(total)}</span>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onClick}
          disabled={isDisabled}
          className="mobile-checkout-sticky-bar__cta"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
              <span>{loadingLabel}</span>
            </>
          ) : (
            <>
              {showPaymentIcon ? (
                <CreditCard className="h-5 w-5 shrink-0" aria-hidden />
              ) : null}
              <span className="mobile-checkout-sticky-bar__cta-label">{label}</span>
              {!showPaymentIcon ? (
                <ChevronRight className="h-5 w-5 shrink-0" aria-hidden />
              ) : null}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
