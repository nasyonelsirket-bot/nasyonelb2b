import { useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { getCartSubtotal } from '@/utils/cartLinePricing';
import { getCartCrossSellProducts, getCartBestsellerSuggestions } from '@/utils/cartRecommendations';
import { HIGH_VALUE_DISCOUNT_THRESHOLD_TL } from '@/constants/commerceCopy';
import CartUpsellPanel from '@/components/cart/CartUpsellPanel';
import CartProductSuggestRow from '@/components/cart/CartProductSuggestRow';

/** Sepet öneri alanları — min. adet uyumlu + çapraz satış */
export default function CartRecommendations({ compact = false }) {
  const { items } = useCart();
  const { products } = useStore();
  const subtotal = getCartSubtotal(items);

  const crossSell = useMemo(
    () => getCartCrossSellProducts(items, products, compact ? 6 : 8),
    [items, products, compact],
  );

  const bestsellers = useMemo(
    () => getCartBestsellerSuggestions(items, products, compact ? 6 : 8),
    [items, products, compact],
  );

  const remainingHV = Math.max(0, HIGH_VALUE_DISCOUNT_THRESHOLD_TL - subtotal);

  if (!items.length) return null;

  return (
    <div className="checkout-recommendations space-y-4">
      <CartUpsellPanel compact={compact} />

      {remainingHV > 0 && (
        <p className="text-xs font-medium text-violet-900 bg-violet-50/90 border border-violet-100 rounded-xl px-3 py-2.5 leading-relaxed">
          Sepetinizi tamamlayın — {HIGH_VALUE_DISCOUNT_THRESHOLD_TL} TL üzeri alışverişte ekstra %5 indirim
          kazanın.
        </p>
      )}

      {crossSell.length > 0 && (
        <CartProductSuggestRow
          title="Bunları da ekleyebilirsiniz"
          subtitle="Sepetinizdeki ürünlerle uyumlu öneriler · minimum adet kuralları geçerlidir"
          products={crossSell}
          accent="brand"
        />
      )}

      {bestsellers.length > 0 && (
        <CartProductSuggestRow
          title="Çok satan ürünler"
          subtitle="Diğer müşterilerin en çok tercih ettiği oyuncaklar"
          products={bestsellers}
          accent="violet"
        />
      )}
    </div>
  );
}
