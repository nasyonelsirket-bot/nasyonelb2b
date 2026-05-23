import { FREE_SHIPPING_THRESHOLD_TL } from '@/utils/cartShipping';

/** Ana sayfa üstü — kompakt güven metni */
export default function TrustBadges() {
  const threshold = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(FREE_SHIPPING_THRESHOLD_TL);

  return (
    <section
      className="border-y border-brand-100 bg-white py-3 sm:py-4"
      aria-label="Kargo ve ödeme bilgisi"
    >
      <p className="text-center text-xs sm:text-sm text-brand-600 px-4">
        {threshold} ve üzeri siparişlerde kargo bedava · Güvenli kart ödemesi
      </p>
    </section>
  );
}
