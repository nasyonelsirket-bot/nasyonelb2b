import { formatPrice } from '@/utils/whatsapp';
import { getCompareAtPrice, getDiscountPercent, hasProductDiscount } from '@/utils/productPricing';

export default function ProductPriceDisplay({
  product,
  size = 'md',
  showBadge = true,
  className = '',
}) {
  const price = Number(product?.price) || 0;
  const compare = getCompareAtPrice(product);
  const pct = getDiscountPercent(product);
  const onSale = hasProductDiscount(product);

  const priceCls =
    size === 'lg'
      ? 'text-4xl'
      : size === 'sm'
        ? 'text-sm'
        : 'text-xl sm:text-2xl';

  return (
    <div className={`flex flex-wrap items-baseline gap-2 ${className}`}>
      <span className={`font-display font-bold text-brand-700 ${priceCls}`}>
        {formatPrice(price)}
      </span>
      {onSale && (
        <>
          <span className="text-sm text-gray-600 line-through decoration-red-500/90">
            {formatPrice(compare)}
          </span>
          {showBadge && (
            <span className="inline-flex items-center rounded-md bg-red-700 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-white">
              %{pct} İNDİRİM
            </span>
          )}
        </>
      )}
    </div>
  );
}
