import { Truck, Shield, CreditCard } from 'lucide-react';
import { FREE_SHIPPING_SHORT } from '@/constants/commerceCopy';

const ITEMS = [
  { icon: Truck, label: 'Hızlı Kargo' },
  { icon: Shield, label: 'Güvenli Ödeme' },
  { icon: CreditCard, label: 'Kredi Kartı' },
  { icon: Truck, label: FREE_SHIPPING_SHORT },
];

export default function HeaderTrustBar() {
  return (
    <div className="hidden sm:block lg:hidden border-b border-brand-100 bg-brand-50/80">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 py-1.5 text-[11px] sm:text-xs text-brand-800">
          {ITEMS.map(({ icon: Icon, label }) => (
            <li key={label} className="inline-flex items-center gap-1.5 font-medium whitespace-nowrap">
              <Icon className="h-3.5 w-3.5 text-brand-600 shrink-0" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
