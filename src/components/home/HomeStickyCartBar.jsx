import { useLocation } from 'react-router-dom';
import { ShoppingCart, ChevronUp, CreditCard, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/whatsapp';
import { getFreeShippingStatus } from '@/utils/cartShipping';
import { getCartSubtotal } from '@/utils/cartLinePricing';

export default function HomeStickyCartBar({ onOpenCart }) {
  const { pathname } = useLocation();
  const { items, totalItems, totalPrice, cartAnimating } = useCart();

  if (pathname !== '/') return null;

  const subtotal = getCartSubtotal(items);
  const shipping = getFreeShippingStatus(subtotal);
  const hasItems = totalItems > 0;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[55] border-t border-brand-200 bg-white/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(15,23,42,0.12)] pb-[max(0.5rem,env(safe-area-inset-bottom))] pr-[5.5rem] sm:pr-28 lg:pr-32 animate-slide-up"
      role="region"
      aria-label="Hızlı sepet"
    >
      <div className="mx-auto max-w-7xl px-3 py-2.5 sm:py-3 flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onOpenCart}
          className={`flex items-center gap-2 min-w-0 flex-1 sm:flex-none rounded-xl border-2 border-brand-200 bg-brand-50 px-3 py-2 hover:border-accent-gold transition-colors ${cartAnimating ? 'animate-cart-bounce' : ''}`}
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-900 text-white">
            <ShoppingCart className="h-5 w-5" />
            {hasItems && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent-gold px-1 text-[10px] font-bold text-brand-950">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </span>
          <span className="text-left min-w-0">
            <span className="block text-xs text-gray-500">Sepetiniz</span>
            <span className="block text-sm sm:text-base font-bold text-brand-900 truncate">
              {hasItems ? formatPrice(totalPrice) : 'Henüz ürün yok'}
            </span>
          </span>
          <ChevronUp className="h-5 w-5 text-brand-500 shrink-0 ml-auto sm:ml-2" aria-hidden />
        </button>

        {hasItems ? (
          <>
            {!shipping.eligible && (
              <p className="hidden md:block text-xs text-emerald-800 font-medium flex-1 min-w-0 truncate">
                <Sparkles className="inline h-3.5 w-3.5 mr-1 text-accent-gold" />
                {formatPrice(shipping.remaining)} daha → kargo bedava
              </p>
            )}
            <Button type="button" variant="secondary" size="sm" className="shrink-0" onClick={onOpenCart}>
              Sepeti gör
            </Button>
            <a href="/sepet" className="shrink-0">
              <Button type="button" variant="gold" size="sm" className="whitespace-nowrap">
                <CreditCard className="h-4 w-4" />
                Öde
              </Button>
            </a>
          </>
        ) : (
          <>
            <a href="/#urunler" className="flex-1 sm:flex-none min-w-[120px]">
              <Button type="button" variant="yellow" size="sm" className="w-full animate-pulse-soft">
                Ürünleri keşfet
              </Button>
            </a>
            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onOpenCart}>
              Sepet
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
