import { Link } from 'react-router-dom';
import { Truck, CheckCircle2 } from 'lucide-react';
import { FREE_SHIPPING_LABEL, FREE_SHIPPING_SUBLABEL } from '@/constants/commerceCopy';

export default function FreeShippingBanner({ subtotal, compact = false }) {
  const amount = Math.max(0, Number(subtotal) || 0);
  const active = amount > 0;

  if (compact) {
    return (
      <Link
        to="/sepet"
        className="inline-flex items-center gap-1.5 cursor-pointer hover:text-accent-gold transition-colors"
        title={FREE_SHIPPING_SUBLABEL}
      >
        <Truck className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>{FREE_SHIPPING_LABEL}</span>
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
          <Truck className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-brand-900 flex items-center gap-2 flex-wrap">
            {active ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                {FREE_SHIPPING_LABEL}
              </>
            ) : (
              <>
                <Truck className="h-4 w-4 text-emerald-700 shrink-0" />
                {FREE_SHIPPING_LABEL}
              </>
            )}
          </p>
          {active && (
            <p className="text-sm text-emerald-700 font-medium mt-1">{FREE_SHIPPING_SUBLABEL}</p>
          )}
        </div>
      </div>
    </div>
  );
}
