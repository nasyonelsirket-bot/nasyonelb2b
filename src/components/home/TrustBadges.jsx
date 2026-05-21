import { Shield, Truck, RotateCcw } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD_TL } from '@/utils/cartShipping';

export default function TrustBadges() {
  const threshold = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(FREE_SHIPPING_THRESHOLD_TL);

  return (
    <section className="border-y border-gray-100 bg-white py-8">
      <div className="mx-auto max-w-7xl px-4 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <Shield className="h-10 w-10 text-brand-600" />
          <p className="font-semibold text-brand-900 text-sm">256 Bit SSL ile güvende alışveriş</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Truck className="h-10 w-10 text-emerald-600" />
          <p className="font-semibold text-brand-900 text-sm">{threshold} ve üzeri siparişlerde kargo bedava</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <RotateCcw className="h-10 w-10 text-orange-500" />
          <p className="font-semibold text-brand-900 text-sm">14 iş günü içinde iade</p>
        </div>
      </div>
    </section>
  );
}
