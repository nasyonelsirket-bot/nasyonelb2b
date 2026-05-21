import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, Flame } from 'lucide-react';
import Button from '@/components/ui/Button';
import ProductPriceDisplay from '@/components/product/ProductPriceDisplay';
import QuantityControls from '@/components/product/QuantityControls';
import ProductImage from '@/components/product/ProductImage';
import { useCart } from '@/context/CartContext';
import KdvNotice from '@/components/ui/KdvNotice';
import { getPrimaryImage } from '@/utils/productImage';
import { getDiscountPercent, hasProductDiscount } from '@/utils/productPricing';
import { getTrendyolUnitsSold } from '@/utils/productBestseller';
import { getProductLink } from '@/utils/productSeo';
import ProductRatingStars from '@/components/product/ProductRatingStars';
import { getProductRatingSummary } from '@/utils/productReviews';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const onSale = hasProductDiscount(product);
  const pct = getDiscountPercent(product);
  const unitsSold = getTrendyolUnitsSold(product);
  const { avg: ratingAvg, count: reviewCount } = getProductRatingSummary(product);

  const handleAdd = () => {
    addToCart(product, Math.max(1, qty));
  };

  return (
    <article className="product-card group relative flex min-w-0 flex-col overflow-hidden rounded-lg border border-brand-100 bg-white shadow-sm transition-all duration-300 sm:rounded-2xl sm:border-0 sm:shadow-card sm:hover:-translate-y-1.5 sm:hover:shadow-card-hover">
      <Link to={getProductLink(product)} className="relative block min-w-0">
        {product.isBestSeller && (
          <span className="absolute right-2 top-2 z-10 inline-flex flex-col items-end gap-0.5">
            <span className="inline-flex items-center gap-0.5 rounded-md bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-md sm:text-[10px]">
              <Flame className="h-3 w-3" />
              Çok Satan
            </span>
            {unitsSold > 0 && (
              <span className="rounded-md bg-brand-900/90 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                {unitsSold} satış
              </span>
            )}
          </span>
        )}
        {onSale && (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md animate-pulse-soft sm:text-xs">
            %{pct}
          </span>
        )}
        <ProductImage
          src={getPrimaryImage(product)}
          alt={product.name}
          variant="card"
          className="rounded-t-lg sm:rounded-t-2xl"
          imgClassName="product-card-img"
        />
        <div className="absolute inset-0 hidden items-center justify-center bg-brand-900/40 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none sm:flex">
          <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-800">
            <Eye className="h-4 w-4" /> İncele
          </span>
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-2 sm:p-4">
        <p className="hidden text-xs font-medium text-brand-500 line-clamp-1 sm:block">{product.category}</p>
        <Link to={getProductLink(product)} className="min-w-0">
          <h3 className="mt-0 font-display text-[11px] font-bold leading-snug text-brand-900 line-clamp-2 sm:mt-1 sm:text-sm sm:leading-normal hover:text-brand-600">
            {product.name}
          </h3>
        </Link>

        {ratingAvg > 0 && (
          <div className="mt-1 flex items-center gap-1 flex-wrap">
            <ProductRatingStars rating={ratingAvg} size="sm" />
            {reviewCount > 0 && (
              <span className="text-[10px] text-gray-500">({reviewCount})</span>
            )}
          </div>
        )}

        <div className="mt-1 sm:mt-2">
          <ProductPriceDisplay product={product} size="sm" />
        </div>
        <KdvNotice className="mt-0.5 hidden text-xs sm:block" />

        <div className="mt-2 hidden product-card-qty sm:block">
          <QuantityControls
            quantity={qty}
            onChange={setQty}
            onIncrement={(n) => setQty((q) => q + n)}
            onDecrement={(n) => setQty((q) => Math.max(1, q - n))}
            compact
          />
        </div>

        <Button
          type="button"
          variant="yellow"
          className="mt-1.5 h-8 w-full touch-manipulation gap-1 px-2 text-[10px] sm:mt-3 sm:min-h-[48px] sm:text-base sm:px-5"
          onClick={handleAdd}
        >
          <ShoppingCart className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
          <span className="truncate sm:hidden">Sepete Ekle</span>
          <span className="truncate hidden sm:inline">Sepete Ekle</span>
        </Button>
      </div>
    </article>
  );
}
