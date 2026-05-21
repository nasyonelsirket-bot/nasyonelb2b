import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ShoppingBag, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import ProductImage from '@/components/product/ProductImage';
import { useCart } from '@/context/CartContext';
import { getPrimaryImage } from '@/utils/productImage';
import { formatPrice } from '@/utils/whatsapp';
import { getEffectiveUnitPrice } from '@/utils/cartLinePricing';

const AUTO_HIDE_MS = 4500;

export default function CartAddedToast() {
  const { addedToast, dismissAddedToast, totalItems } = useCart();

  useEffect(() => {
    if (!addedToast) return undefined;
    const t = setTimeout(dismissAddedToast, AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [addedToast, dismissAddedToast]);

  if (!addedToast?.product) return null;

  const { product, quantity } = addedToast;
  const unit = getEffectiveUnitPrice(product);
  const lineTotal = unit * (quantity || 1);

  return (
    <div
      className="fixed top-20 right-3 left-3 sm:left-auto sm:right-4 z-[90] max-w-sm sm:max-w-md animate-slide-up pointer-events-none"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="pointer-events-auto rounded-2xl border-2 border-emerald-300 bg-white shadow-2xl shadow-emerald-500/20 overflow-hidden">
        <div className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <p className="font-bold text-sm flex-1">Ürün sepete eklendi</p>
          <button
            type="button"
            onClick={dismissAddedToast}
            className="p-1 rounded-lg hover:bg-white/20"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-3 p-3">
          <div className="h-16 w-16 shrink-0 rounded-lg border border-brand-100 overflow-hidden">
            <ProductImage src={getPrimaryImage(product)} alt="" variant="thumb" className="!h-full !w-full" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-brand-900 line-clamp-2 leading-snug">{product.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {quantity > 1 ? `${quantity} adet · ` : ''}
              {formatPrice(lineTotal)}
            </p>
            <p className="text-xs text-emerald-700 font-medium mt-1">Sepette {totalItems} ürün</p>
          </div>
        </div>
        <div className="flex gap-2 px-3 pb-3">
          <Button type="button" variant="secondary" size="sm" className="flex-1" onClick={dismissAddedToast}>
            Alışverişe devam
          </Button>
          <Link to="/sepet" className="flex-1" onClick={dismissAddedToast}>
            <Button type="button" variant="primary" size="sm" className="w-full">
              <ShoppingBag className="h-4 w-4" />
              Sepete git
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
