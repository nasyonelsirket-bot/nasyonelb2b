import { FREE_SHIPPING_THRESHOLD_TL } from '@/utils/cartShipping';

export default function HomeTrustSection() {
  const threshold = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(FREE_SHIPPING_THRESHOLD_TL);

  return (
    <section className="bg-white border-y border-brand-100 py-3 sm:py-4" aria-label="Güven ve hizmet">
      <p className="text-center text-xs sm:text-sm text-brand-600 px-4">
        {threshold} ve üzeri siparişlerde kargo bedava · Güvenli kart ödemesi
      </p>
    </section>
  );
}
