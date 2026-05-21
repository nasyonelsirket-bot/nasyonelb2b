import { Flame, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function HomeUrgencyStrip({ onOpenCart }) {
  const { totalItems } = useCart();

  return (
    <div className="bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-white">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 py-2 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-center text-xs sm:text-sm font-semibold">
        <Flame className="h-4 w-4 shrink-0 animate-pulse-soft" aria-hidden />
        <span>Stoklar tükenmeden sipariş verin — aynı gün WhatsApp onayı</span>
        <button
          type="button"
          onClick={onOpenCart}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/95 text-red-700 px-3 py-1.5 text-xs sm:text-sm font-bold shadow-md hover:bg-white transition-colors touch-manipulation"
        >
          <ShoppingCart className="h-4 w-4" />
          {totalItems > 0 ? `Sepet (${totalItems})` : 'Sepeti aç'}
        </button>
      </div>
    </div>
  );
}
