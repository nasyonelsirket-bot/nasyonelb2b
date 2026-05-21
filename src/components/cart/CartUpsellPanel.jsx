import { Gift, Plus, Sparkles, Truck } from 'lucide-react';
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
  const { bundle, similar, eligible } = getCartUpsellOffers(items, products, subtotal);

  if (!eligible || (!bundle && !similar)) return null;

  const addBundle = () => {
    bundle?.picked?.forEach(({ product, quantity, promo }) => {
      addUpsellToCart(product, quantity, promo);
    });
  };

  const addSimilar = () => {
    if (!similar?.product) return;
    addUpsellToCart(similar.product, similar.quantity, similar.promo);
  };

  if (compact && !bundle) return null;

  return (
    <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 via-white to-emerald-50/40 p-4 sm:p-5 space-y-4 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-brand-950">
          <Gift className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-display font-bold text-brand-900">Size Özel Ürün Önerileri</h3>
          <p className="text-sm text-brand-700 mt-1">
            Sepetinizdeki ürünlere benzer seçenekler —{' '}
            <strong>{formatPrice(FREE_SHIPPING_THRESHOLD_TL)}</strong> üzeri{' '}
            <span className="text-emerald-700 font-semibold">kargo bedava</span>
          </p>
        </div>
      </div>

      {bundle && (
        <div className="rounded-xl border border-emerald-200 bg-white/90 p-4 space-y-3">
          <p className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
            <Truck className="h-4 w-4" />
            {formatPrice(bundle.remaining)} eksik — {bundle.picked.length} ürün öneriyoruz (%5 indirim)
          </p>
          <ul className="space-y-2">
            {bundle.picked.map(({ product, promo }) => (
              <li
                key={product.id}
                className="flex gap-3 items-center rounded-lg border border-brand-100 p-2 bg-brand-50/30"
              >
                <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-brand-100">
                  <ProductImage src={product.image} alt="" variant="thumb" className="!w-full !h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-brand-500">{product.category}</p>
                  <p className="text-sm font-medium text-brand-900 line-clamp-2">{product.name}</p>
                  <p className="text-sm font-bold text-brand-700 mt-0.5">
                    {formatPrice(getEffectiveUnitPrice({ ...product, upsellPromo: promo }))}
                    <span className="text-xs font-normal text-gray-400 line-through ml-1">
                      {formatPrice(product.price)}
                    </span>
                    <span className="ml-1 text-[10px] font-bold text-red-600">%5</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-600">
            Önerilen paket: {formatPrice(bundle.bundleTotal)} → Tahmini sepet:{' '}
            <strong>{formatPrice(bundle.projectedSubtotal)}</strong>
            {bundle.reachesFreeShipping && (
              <span className="text-emerald-700 font-semibold"> (kargo bedava)</span>
            )}
          </p>
          <Button type="button" variant="primary" className="w-full" onClick={addBundle}>
            <Plus className="h-4 w-4" />
            Önerilen {bundle.picked.length} ürünü sepete ekle (%5 indirim)
          </Button>
        </div>
      )}

      {similar && (
        <div className="rounded-xl border border-violet-200 bg-white/90 p-4 space-y-3">
          <p className="text-sm font-semibold text-violet-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {similar.message}
          </p>
          <div className="flex gap-3 items-center">
            <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-brand-100">
              <ProductImage
                src={similar.product.image}
                alt=""
                variant="thumb"
                className="!w-full !h-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-brand-500">{similar.product.category}</p>
              <p className="text-sm font-medium text-brand-900">{similar.product.name}</p>
              <p className="text-base font-bold text-brand-700 mt-1">
                {formatPrice(similar.discountedPrice)}
                <span className="text-sm text-gray-400 line-through ml-2">
                  {formatPrice(similar.product.price)}
                </span>
                <span className="ml-1 text-xs font-bold text-red-600">%8</span>
              </p>
            </div>
          </div>
          <Button type="button" variant="secondary" className="w-full" onClick={addSimilar}>
            <Plus className="h-4 w-4" />
            Emsal ürünü ekle (%8 indirim)
          </Button>
        </div>
      )}
    </div>
  );
}
