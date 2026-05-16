import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import QuantityControls from '@/components/product/QuantityControls';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { getMinOrderInfo } from '@/utils/orderRules';
import { formatPrice } from '@/utils/whatsapp';

export default function ProductCard({ product }) {
  const { settings } = useStore();
  const { addToCart } = useCart();
  const minLineValue = Number(settings.minOrderLineValue) || 2000;
  const minInfo = useMemo(
    () => getMinOrderInfo(product, minLineValue),
    [product, minLineValue],
  );
  const [qty, setQty] = useState(minInfo.minQty);

  const handleAdd = (e) => {
    e.preventDefault();
    addToCart(product, Math.max(qty, minInfo.minQty));
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      <Link to={`/urun/${product.id}`} className="relative aspect-square overflow-hidden bg-brand-50">
        <img
          src={product.image || 'https://via.placeholder.com/400x400?text=Urun'}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-brand-900/40 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-800">
            <Eye className="h-4 w-4" /> İncele
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium text-brand-500">{product.category}</p>
        <Link to={`/urun/${product.id}`}>
          <h3 className="mt-1 font-display text-sm font-bold text-brand-900 line-clamp-2 hover:text-brand-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="mt-0.5 text-xs text-gray-500">SKU: {product.sku}</p>

        <div className="mt-2">
          <Badge variant="min">{minInfo.label}</Badge>
        </div>

        <p className="mt-3 font-display text-xl font-bold text-brand-700">
          {formatPrice(product.price)}
        </p>

        <div className="mt-3">
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

        <Button type="button" variant="primary" className="mt-3 w-full" onClick={handleAdd}>
          <ShoppingCart className="h-4 w-4" />
          Sepete Ekle
        </Button>
      </div>
    </article>
  );
}
