import { Shield, Truck, RotateCcw, Lock, Headphones, MapPin } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD_TL } from '@/utils/cartShipping';
import { PAYTR_TRUST_LABEL } from '@/constants/companyInfo';

const BADGES = [
  { icon: Shield, label: 'SSL Güvenli Ödeme', sub: '256 bit şifreleme' },
  { icon: Lock, label: 'PayTR Altyapısı', sub: PAYTR_TRUST_LABEL },
  { icon: Truck, label: 'Hızlı Kargo', sub: 'Stoktan aynı gün çıkış' },
  { icon: MapPin, label: 'Türkiye Geneli', sub: '81 ile gönderim' },
  { icon: Headphones, label: 'Müşteri Destek', sub: 'WhatsApp & e-posta' },
  { icon: RotateCcw, label: '14 Gün İade', sub: 'Kolay iade süreci' },
];

export default function TrustBadges() {
  const threshold = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(FREE_SHIPPING_THRESHOLD_TL);

  return (
    <section className="border-y border-brand-100 bg-white py-6 sm:py-8" aria-label="Güven rozetleri">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {BADGES.map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex flex-col items-center text-center rounded-xl border border-brand-50 bg-brand-50/40 px-2 py-3 sm:py-4 transition-shadow hover:shadow-card"
            >
              <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-brand-600 mb-1.5" aria-hidden />
              <p className="font-semibold text-brand-900 text-[11px] sm:text-xs leading-tight">{label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{sub}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-brand-600">
          {threshold} ve üzeri siparişlerde kargo bedava · Güvenli kart ödemesi
        </p>
      </div>
    </section>
  );
}
