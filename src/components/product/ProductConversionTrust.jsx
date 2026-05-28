import { Clock, Truck, ShieldCheck, RotateCcw, Star } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD_TL } from '@/utils/cartShipping';

/** Ürün sayfası dönüşüm — kargo, güven, hızlı sipariş (mevcut temaya uyumlu) */
export default function ProductConversionTrust({ className = '' }) {
  const items = [
    { icon: Clock, label: 'Bugün sipariş — hızlı hazırlık', tone: 'text-amber-800 bg-amber-50 border-amber-200' },
    { icon: Truck, label: `${FREE_SHIPPING_THRESHOLD_TL} TL+ kargo bedava`, tone: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
    { icon: ShieldCheck, label: 'PayTR güvenli ödeme', tone: 'text-brand-800 bg-brand-50 border-brand-100' },
    { icon: RotateCcw, label: '14 iş günü iade', tone: 'text-brand-800 bg-brand-50 border-brand-100' },
    { icon: Star, label: 'Gerçek müşteri yorumları', tone: 'text-brand-800 bg-brand-50 border-brand-100' },
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${className}`}>
      {items.map(({ icon: Icon, label, tone }) => (
        <div
          key={label}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${tone}`}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
