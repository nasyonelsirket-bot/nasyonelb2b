import { useLocation } from 'react-router-dom';
import { ShoppingCart, CreditCard } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/whatsapp';

/** Ana sayfada kompakt sepet hatırlatıcı — mobilde daha az yer kaplar */
export default function HomeStickyCartBar({ onOpenCart }) {
  const { pathname } = useLocation();
  const { totalItems, totalPrice, cartAnimating } = useCart();

  if (pathname !== '/' || totalItems === 0) return null;

  return (
    <div
      className="fixed bottom-[calc(3rem+env(safe-area-inset-bottom))] lg:bottom-0 left-0 right-0 z-[44] border-t border-brand-200/80 bg-white/90 backdrop-blur-sm shadow-[0_-4px_16px_rgba(15,23,42,0.08)] animate-slide-up"
      role="region"
      aria-label="Sepet özeti"
    >
      <div className="mx-auto max-w-7xl px-3 py-1.5 flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenCart}
          className={`flex items-center gap-2 min-w-0 flex-1 text-left ${cartAnimating ? 'animate-cart-bounce' : ''}`}
        >
          <ShoppingCart className="h-4 w-4 text-brand-700 shrink-0" />
          <span className="text-sm font-bold text-brand-900 truncate">{formatPrice(totalPrice)}</span>
          <span className="text-xs text-gray-500">({totalItems})</span>
        </button>
        <a href="/sepet" className="shrink-0">
          <Button type="button" variant="gold" size="sm" className="h-9 px-3 text-xs">
            <CreditCard className="h-3.5 w-3.5" />
            Öde
          </Button>
        </a>
      </div>
    </div>
  );
}
