import { useState, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye, Zap, Truck, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import ProductPriceDisplay from '@/components/product/ProductPriceDisplay';
import QuantityControls from '@/components/product/QuantityControls';
import ProductImage from '@/components/product/ProductImage';
import { useCart } from '@/context/CartContext';
import KdvNotice from '@/components/ui/KdvNotice';
import { getPrimaryImage } from '@/utils/productImage';
import { getDiscountPercent, hasProductDiscount } from '@/utils/productPricing';
import { getProductLink } from '@/utils/productSeo';
import { getProductImageAlt } from '@/utils/productSeoContent';
import ProductRatingStars from '@/components/product/ProductRatingStars';
import { getProductRatingSummary } from '@/utils/productReviews';
import { getProductCardBadges } from '@/utils/productCardBadges';
import { FREE_SHIPPING_SHORT } from '@/constants/commerceCopy';
import { getMinOrderQtyForProduct } from '@/utils/minOrderQty';

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const minOrder = getMinOrderQtyForProduct(product);
  const [qty, setQty] = useState(minOrder.minQty);
  const onSale = hasProductDiscount(product);
  const pct = getDiscountPercent(product);
  const { avg: ratingAvg, count: reviewCount } = getProductRatingSummary(product);
  const badges = getProductCardBadges(product, { isBestSeller: product.isBestSeller });

  const handleAdd = () => {
    addToCart(product, Math.max(1, qty));
  };

  const handleQuickBuy = () => {
    addToCart(product, Math.max(1, qty));
    navigate('/sepet');
  };

  return (
    <article className="@container product-card group relative flex w-full min-w-0 flex-col overflow-hidden rounded-lg border border-brand-100 bg-white shadow-sm transition-all duration-300 sm:rounded-2xl sm:border-0 sm:shadow-card sm:hover:-translate-y-1.5 sm:hover:shadow-card-hover">
      <Link to={getProductLink(product)} className="relative block min-w-0">
        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1 max-w-[45%]">
          {badges.map((b) => (
            <span
              key={b.key}
              className={`inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold shadow-md sm:text-[10px] ${b.style}`}
            >
              {b.label}
            </span>
          ))}
        </div>
        {onSale && (
          <span className="absolute right-2 top-2 z-10 rounded-md bg-red-700 px-2 py-0.5 text-[10px] font-bold text-white shadow-md sm:text-xs">
            %{pct}
          </span>
        )}
        <ProductImage
          src={getPrimaryImage(product)}
          alt={getProductImageAlt(product)}
          variant="card"
          className="rounded-t-lg sm:rounded-t-2xl"
          imgClassName="product-card-img"
        />
        <div className="absolute inset-0 hidden items-center justify-center bg-brand-900/40 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none sm:flex">
          <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-800 shadow-lg">
            <Eye className="h-4 w-4" /> İncele
          </span>
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-2 sm:p-4">
        <p className="hidden text-xs font-medium text-brand-500 line-clamp-1 sm:block">{product.category}</p>
        <Link to={getProductLink(product)} className="min-w-0">
          <h3 className="mt-0 font-display text-[11px] font-bold leading-snug text-brand-900 line-clamp-2 sm:mt-1 sm:text-sm sm:leading-normal group-hover:text-brand-600 transition-colors">
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

        <div className="mt-1.5 hidden sm:flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-500">
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <Truck className="h-3 w-3" aria-hidden />
            {FREE_SHIPPING_SHORT}
          </span>
          <span className="inline-flex items-center gap-1 text-brand-600">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            PayTR güvenli ödeme
          </span>
        </div>

        <div className="mt-2 hidden product-card-qty sm:block">
          <QuantityControls
            quantity={qty}
            onChange={setQty}
            onIncrement={(n) => setQty((q) => q + n)}
            onDecrement={(n) => setQty((q) => Math.max(1, q - n))}
            compact
          />
        </div>

        <div className="mt-1.5 sm:mt-3 grid grid-cols-1 gap-1.5 @[17rem]:grid-cols-2">
          <Button
            type="button"
            variant="yellow"
            className="w-full min-w-0 h-9 touch-manipulation gap-1 px-2 text-[11px] sm:min-h-[44px] sm:text-sm sm:px-3"
            onClick={handleAdd}
          >
            <ShoppingCart className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="truncate">Sepete Ekle</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full min-w-0 inline-flex h-9 sm:min-h-[44px] px-2 text-[11px] sm:text-xs gap-1 whitespace-nowrap"
            onClick={handleQuickBuy}
            aria-label={`Hızlı Al: ${product.name}`}
            title={`Hızlı Al: ${product.name}`}
          >
            <Zap className="h-3.5 w-3.5 shrink-0" />
            Hızlı Al
          </Button>
        </div>
      </div>
    </article>
  );
}

export default memo(ProductCard);
