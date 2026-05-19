import { Link } from 'react-router-dom';
import { Truck, TrendingUp, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '@/utils/whatsapp';
import {
  getFreeShippingStatus,
  FREE_SHIPPING_THRESHOLD_TL,
  STANDARD_SHIPPING_FEE_TL,
} from '@/utils/cartShipping';

function formatThreshold(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
}

export default function FreeShippingBanner({ subtotal, compact = false }) {
  const shipping = getFreeShippingStatus(subtotal);

  if (compact) {
    return (
      <Link
        to="/sepet"
        className="inline-flex items-center gap-1.5 cursor-pointer hover:text-accent-gold transition-colors"
        title={`${formatThreshold(FREE_SHIPPING_THRESHOLD_TL)} altı ${formatPrice(STANDARD_SHIPPING_FEE_TL)} kargo, üzeri bedava`}
      >
        <Truck className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          Altı {formatPrice(STANDARD_SHIPPING_FEE_TL)} kargo · {formatThreshold(FREE_SHIPPING_THRESHOLD_TL)} üzeri bedava
        </span>
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
            {shipping.eligible ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                Kargo bedava
              </>
            ) : (
              <>
                <Truck className="h-4 w-4 text-emerald-700 shrink-0" />
                {formatThreshold(FREE_SHIPPING_THRESHOLD_TL)} üzeri kargo bedava
              </>
            )}
          </p>

          {shipping.successMessage && (
            <p className="text-sm text-emerald-700 font-medium mt-1">{shipping.successMessage}</p>
          )}

          {shipping.upsellMessage && (
            <Link
              to="/kategoriler"
              className="mt-2 flex items-start gap-2 text-sm font-semibold text-emerald-900 bg-emerald-100/90 rounded-lg px-3 py-2 cursor-pointer hover:bg-emerald-200/80 transition-colors"
            >
              <TrendingUp className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{shipping.upsellMessage}</span>
            </Link>
          )}

          {!shipping.eligible && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>{formatPrice(shipping.subtotal)}</span>
                <span>{formatThreshold(shipping.threshold)} (kargo bedava)</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/80 overflow-hidden border border-emerald-200">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${shipping.progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
