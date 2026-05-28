import { Lock, ShieldCheck, Truck, RotateCcw, CreditCard, BadgeCheck } from 'lucide-react';
import { PAYTR_TRUST_LABEL } from '@/constants/companyInfo';
import CardBrandIcons from '@/components/checkout/CardBrandIcons';

const TRUST_ITEMS = [
  { icon: Lock, label: '256 Bit SSL Güvenli Ödeme', tone: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
  { icon: ShieldCheck, label: 'PayTR Güvencesi', tone: 'text-brand-800 bg-brand-50 border-brand-100' },
  { icon: CreditCard, label: 'Kapıda değil — güvenli online ödeme', tone: 'text-brand-800 bg-brand-50 border-brand-100' },
  { icon: Truck, label: 'Hızlı kargo', tone: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
  { icon: RotateCcw, label: 'İade desteği', tone: 'text-brand-800 bg-brand-50 border-brand-100' },
];

export default function CheckoutTrustPanel({ compact = false, className = '' }) {
  if (compact) {
    return (
      <div
        className={`rounded-xl border border-brand-100 bg-white/90 px-3 py-2.5 ${className}`}
        aria-label="Güvenli alışveriş"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-semibold text-brand-800">
          <span className="inline-flex items-center gap-1">
            <Lock className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
            256 Bit SSL
          </span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-600" aria-hidden />
            PayTR
          </span>
          <span className="inline-flex items-center gap-1">
            <Truck className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
            Hızlı kargo
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-brand-100 bg-gradient-to-br from-white to-brand-50/40 p-4 sm:p-5 shadow-sm ${className}`}
      aria-label="Güvenli ödeme ve teslimat"
    >
      <div className="flex items-center gap-2 mb-3">
        <BadgeCheck className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden />
        <p className="text-sm font-bold text-brand-900">Güvenli alışveriş garantisi</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {TRUST_ITEMS.map(({ icon: Icon, label, tone }) => (
          <div
            key={label}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium leading-snug ${tone}`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-[11px] text-gray-500">{PAYTR_TRUST_LABEL}</p>

      <div className="mt-3 pt-3 border-t border-brand-100">
        <CardBrandIcons />
      </div>
    </div>
  );
}
