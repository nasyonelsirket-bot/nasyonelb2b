import { TRUST_STRIP_LINE } from '@/constants/commerceCopy';

/** Ana sayfa üstü — kompakt güven metni */
export default function TrustBadges() {
  return (
    <section
      className="border-y border-brand-100 bg-gradient-to-r from-brand-50/60 to-white py-2.5 sm:py-3"
      aria-label="Güven ve teslimat"
    >
      <p className="text-center text-xs sm:text-sm font-medium text-brand-700 px-4 tracking-wide">
        {TRUST_STRIP_LINE}
      </p>
    </section>
  );
}
