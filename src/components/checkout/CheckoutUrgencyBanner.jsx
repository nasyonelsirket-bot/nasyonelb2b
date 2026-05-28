import { Zap } from 'lucide-react';

/** Checkout üst bandı — hızlı kargo mesajı */
export default function CheckoutUrgencyBanner({ className = '' }) {
  return (
    <div
      className={`rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50/80 to-amber-50 px-4 py-3 flex items-start gap-3 ${className}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/30 text-amber-900">
        <Zap className="h-4 w-4" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-bold text-amber-950">Bugün sipariş ver, hızlı kargolansın</p>
        <p className="text-xs text-amber-900/80 mt-0.5 leading-relaxed">
          Stoktaki ürünler genellikle aynı gün hazırlanır. Güvenli online ödeme ile kapıda ödeme riski yok.
        </p>
      </div>
    </div>
  );
}
