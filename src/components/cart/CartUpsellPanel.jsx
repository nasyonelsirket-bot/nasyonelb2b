import { Gift, Plus, Truck, Tag } from 'lucide-react';
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

  const line = bundle.picked[0];
  if (!line) return null;

  const { product, quantity, promo } = line;
  const discounted = getEffectiveUnitPrice({ ...product, upsellPromo: promo });
  const listPrice = Number(product.price) || 0;

  const addSuggested = () => {
    addUpsellToCart(product, quantity, promo);
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
            {bundle.reachesFreeShipping
              ? '750 TL\'yi tamamla — kargo bedava!'
              : 'Sepete uyumlu ürün önerisi'}
          </h3>
          <p className="text-xs text-brand-700 mt-0.5">
            <Truck className="inline h-3 w-3 text-emerald-600 mr-0.5" />
            {bundle.reachesFreeShipping ? (
              <>
                {formatPrice(bundle.remaining)} eksik ·{' '}
                <span className="font-semibold text-emerald-700">%5 indirimli</span> tek ürün
              </>
            ) : (
              <>En uyumlu ürün · %5 indirim</>
            )}
          </p>
        </div>
      </div>

      <div
        className={`flex gap-3 rounded-xl border border-brand-100 bg-white p-2.5 shadow-sm ${
          compact ? '' : 'sm:p-3'
        }`}
      >
        <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-brand-50">
          <ProductImage src={product.image} alt="" variant="thumb" className="!w-full !h-full" />
        </div>
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-orange-700 bg-orange-100 rounded px-1.5 py-0.5 w-fit mb-1">
            <Tag className="h-3 w-3" />
            %{bundle.discountPercent} indirim
          </span>
          <p className="text-sm font-medium text-brand-900 line-clamp-2 leading-snug">{product.name}</p>
          <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
            {listPrice > discounted && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(listPrice)}</span>
            )}
            <span className="text-base font-bold text-brand-800">{formatPrice(discounted)}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-600">
        Tahmini sepet:{' '}
        <strong className={bundle.reachesFreeShipping ? 'text-emerald-700' : 'text-brand-800'}>
          {formatPrice(bundle.projectedSubtotal)}
        </strong>
        {bundle.reachesFreeShipping ? (
          <span className="text-emerald-700 font-semibold"> · kargo bedava</span>
        ) : (
          <span>
            {' '}
            · {FREE_SHIPPING_THRESHOLD_TL} TL için{' '}
            {formatPrice(Math.max(0, FREE_SHIPPING_THRESHOLD_TL - bundle.projectedSubtotal))} daha gerekir
          </span>
        )}
      </p>

      <Button
        type="button"
        variant="primary"
        size={compact ? 'sm' : 'md'}
        className="w-full text-xs sm:text-sm"
        onClick={addSuggested}
      >
        <Plus className="h-4 w-4" />
        Sepete ekle (%{bundle.discountPercent} indirim)
      </Button>
    </div>
  );
}
