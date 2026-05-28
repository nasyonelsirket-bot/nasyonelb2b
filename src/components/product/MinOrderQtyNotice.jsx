import { Package } from 'lucide-react';
import { getMinOrderQtyForProduct } from '@/utils/minOrderQty';

/** Ürün sayfası / sepet — minimum sipariş adedi uyarısı */
export default function MinOrderQtyNotice({ product, className = '' }) {
  const { minQty, message } = getMinOrderQtyForProduct(product);
  if (!message || minQty <= 1) return null;

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-950 ${className}`}
      role="status"
    >
      <Package className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
