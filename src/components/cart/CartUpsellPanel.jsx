import { Gift, Plus, Truck } from 'lucide-react';
import Button from '@/components/ui/Button';
import ProductImage from '@/components/product/ProductImage';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { getCartUpsellOffers } from '@/utils/cartUpsell';
import { getCartSubtotal, getEffectiveUnitPrice } from '@/utils/cartLinePricing';
import { formatPrice } from '@/utils/whatsapp';
import { FREE_SHIPPING_THRESHOLD_TL } from '@/utils/cartShipping';

export default function CartUpsellPanel({ compact = false }) {
  const { items, addUpsellToCart } = useCart();
  const { products } = useStore();

  const subtotal = getCartSubtotal(items);
  const { bundle, eligible } = getCartUpsellOffers(items, products, subtotal);

  if (!eligible || !bundle) return null;

  const addBundle = () => {
    bundle.picked.forEach(({ product, quantity, promo }) => {
      addUpsellToCart(product, quantity, promo);
    });
  };

  return (
    <div
      className={`rounded-2xl border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50/40 to-emerald-50/50 animate-slide-up ${
        compact ? 'p-3 space-y-2' : 'p-4 space-y-3'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow">
          <Gift className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display font-bold text-brand-900 text-sm leading-tight">
            Birlikte al, kargo bedava!
          </h3>
          <p className="text-xs text-brand-700 mt-0.5">
            <Truck className="inline h-3 w-3 text-emerald-600 mr-0.5" />
            {formatPrice(bundle.remaining)} kaldı · paket indirimi
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 snap-x snap-mandatory">
        {bundle.picked.map(({ product, promo }) => (
          <div
            key={product.id}
            className="snap-start shrink-0 w-[108px] sm:w-[120px] rounded-lg border border-brand-100 bg-white p-1.5 shadow-sm"
          >
            <div className="aspect-square rounded-md overflow-hidden border border-brand-50">
              <ProductImage src={product.image} alt="" variant="thumb" className="!w-full !h-full" />
            </div>
            <p className="text-[10px] font-medium text-brand-900 line-clamp-2 mt-1 leading-tight">
              {product.name}
            </p>
            <p className="text-[11px] font-bold text-brand-700">
              {formatPrice(getEffectiveUnitPrice({ ...product, upsellPromo: promo }))}
            </p>
          </div>
        ))}
      </div>

      {bundle.reachesFreeShipping && (
        <p className="text-xs font-semibold text-emerald-700">Bu paketle ücretsiz kargo!</p>
      )}

      <Button
        type="button"
        variant="primary"
        size={compact ? 'sm' : 'md'}
        className="w-full text-xs sm:text-sm"
        onClick={addBundle}
      >
        <Plus className="h-4 w-4" />
        {bundle.picked.length} ürünü tek tıkla ekle
      </Button>
    </div>
  );
}
