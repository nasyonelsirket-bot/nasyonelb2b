import { Lock, Shield, CreditCard, Headphones } from 'lucide-react';
import { PAYTR_TRUST_LABEL } from '@/constants/companyInfo';

const CARD_BRANDS = ['Visa', 'Mastercard', 'Troy'];

/**
 * @param {{ compact?: boolean, className?: string }} props
 */
export default function PaymentTrustStrip({ compact = false, className = '' }) {
  if (compact) {
    return (
      <div
        className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-brand-600 ${className}`}
      >
        <span className="inline-flex items-center gap-1">
          <Lock className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
          256 Bit SSL
        </span>
        <span className="inline-flex items-center gap-1">
          <Shield className="h-3.5 w-3.5 text-brand-600" aria-hidden />
          3D Secure
        </span>
        <span className="inline-flex items-center gap-1 font-medium text-brand-800">
          {PAYTR_TRUST_LABEL}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50/80 to-white p-4 sm:p-5 ${className}`}
      aria-label="Güvenli ödeme bilgileri"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <TrustItem icon={Shield} title="SSL Güvenli Ödeme" desc="256 bit şifreleme" />
        <TrustItem icon={Lock} title="3D Secure" desc="Kart doğrulama" />
        <TrustItem icon={CreditCard} title="Kredi / Banka Kartı" desc={PAYTR_TRUST_LABEL} />
        <TrustItem icon={Headphones} title="Müşteri Destek" desc="7/24 WhatsApp & e-posta" />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-brand-100 pt-3">
        {CARD_BRANDS.map((brand) => (
          <span
            key={brand}
            className="rounded-md border border-brand-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-700"
          >
            {brand}
          </span>
        ))}
      </div>
    </div>
  );
}

function TrustItem({ icon: Icon, title, desc }) {
  return (
    <div className="flex flex-col items-center text-center gap-1.5 px-1">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm text-brand-700">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="text-[11px] sm:text-xs font-bold text-brand-900 leading-tight">{title}</span>
      <span className="text-[10px] text-gray-500 leading-snug">{desc}</span>
    </div>
  );
}
