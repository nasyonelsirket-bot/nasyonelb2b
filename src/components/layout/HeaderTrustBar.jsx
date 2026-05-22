import { Truck, Shield, CreditCard, Package } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD_TL } from '@/utils/cartShipping';

const ITEMS = [
  { icon: Truck, label: 'Aynı Gün Kargo' },
  { icon: Shield, label: 'Güvenli Ödeme' },
  { icon: CreditCard, label: 'Kapıda Ödeme' },
  {
    icon: Package,
    label: `${FREE_SHIPPING_THRESHOLD_TL} TL Üzeri Kargo Bedava`,
  },
];

export default function HeaderTrustBar() {
  return (
    <div className="hidden sm:block border-b border-brand-100 bg-brand-50/80">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 py-1.5 text-[11px] sm:text-xs text-brand-800">
          {ITEMS.map(({ icon: Icon, label }) => (
            <li key={label} className="inline-flex items-center gap-1.5 font-medium">
              <Icon className="h-3.5 w-3.5 text-brand-600 shrink-0" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
