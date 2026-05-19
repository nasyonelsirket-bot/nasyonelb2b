import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import QuantityControls from '@/components/product/QuantityControls';
import ProductImage from '@/components/product/ProductImage';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import KdvNotice from '@/components/ui/KdvNotice';
import { getMinOrderInfo, DEFAULT_MIN_LINE_VALUE_TL } from '@/utils/orderRules';
import { getPrimaryImage } from '@/utils/productImage';
import { formatPrice } from '@/utils/whatsapp';

export default function ProductCard({ product }) {
  const { settings } = useStore();
  const { addToCart } = useCart();
  const minLineValue = Number(settings.minOrderLineValue) || DEFAULT_MIN_LINE_VALUE_TL;
  const minInfo = useMemo(() => getMinOrderInfo(product, minLineValue), [product, minLineValue]);
  const [qty, setQty] = useState(minInfo.minQty);

  useEffect(() => {
    setQty((q) => Math.max(q, minInfo.minQty));
  }, [minInfo.minQty, product.id]);

  const handleAdd = () => {
    addToCart(product, Math.max(qty, minInfo.minQty));
  };

  return (
    <article className="product-card group relative flex min-w-0 flex-col overflow-hidden rounded-lg border border-brand-100 bg-white shadow-sm transition-shadow sm:rounded-2xl sm:border-0 sm:shadow-card sm:hover:-translate-y-1 sm:hover:shadow-card-hover">
      <Link to={`/urun/${product.id}`} className="relative block min-w-0">
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
        <Link to={`/urun/${product.id}`} className="min-w-0">
          <h3 className="mt-0 font-display text-[11px] font-bold leading-snug text-brand-900 line-clamp-2 sm:mt-1 sm:text-sm sm:leading-normal hover:text-brand-600">
            {product.name}
          </h3>
        </Link>
        <p className="mt-0.5 hidden text-xs text-gray-500 sm:block">SKU: {product.sku}</p>

        <div className="mt-1 sm:mt-2">
          <Badge variant="min" className="!px-1.5 !py-0 text-[9px] sm:!px-2.5 sm:!py-0.5 sm:text-xs">
            {minInfo.label}
          </Badge>
        </div>

        <p className="mt-1 font-display text-sm font-bold text-brand-700 sm:mt-3 sm:text-xl">
          {formatPrice(product.price)}
        </p>
        <KdvNotice className="mt-0.5 hidden text-xs sm:block" />

        <div className="mt-2 hidden product-card-qty sm:block">
          <QuantityControls
            quantity={qty}
            minOrder={minInfo.minQty}
            minOrderHint={minInfo.label}
            onChange={setQty}
            onIncrement={(n) => setQty((q) => q + n)}
            onDecrement={(n) => setQty((q) => Math.max(minInfo.minQty, q - n))}
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
          <span className="truncate sm:hidden">Ekle</span>
          <span className="truncate hidden sm:inline">Sepete Ekle</span>
        </Button>
      </div>
    </article>
  );
}
