import { TRUST_STRIP_LINE } from '@/constants/commerceCopy';

export default function HomeTrustSection() {
  return (
    <section
      className="bg-gradient-to-r from-brand-50/80 via-white to-brand-50/80 border-y border-brand-100/80 py-2.5 sm:py-3"
      aria-label="Güven ve teslimat"
    >
      <p className="text-center text-xs sm:text-sm font-medium text-brand-700 px-4 tracking-wide">
        {TRUST_STRIP_LINE}
      </p>
    </section>
  );
}
