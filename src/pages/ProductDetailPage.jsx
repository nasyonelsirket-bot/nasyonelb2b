import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import ProductSchema from '@/components/seo/ProductSchema';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import QuantityControls from '@/components/product/QuantityControls';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import { getMinOrderInfo } from '@/utils/orderRules';
import { formatPrice } from '@/utils/whatsapp';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { getProductById, settings } = useStore();
  const { addToCart } = useCart();
  const product = getProductById(id);
  const minLineValue = Number(settings.minOrderLineValue) || 2000;
  const minInfo = useMemo(
    () => (product ? getMinOrderInfo(product, minLineValue) : null),
    [product, minLineValue],
  );
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (minInfo) setQty(minInfo.minQty);
  }, [minInfo?.minQty, product?.id]);

  if (!product || !minInfo) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="text-gray-500">Ürün bulunamadı.</p>
        <Link to="/" className="mt-4 text-brand-600 hover:underline">Ana sayfaya dön</Link>
      </div>
    );
  }

  return (
    <>
      <SEO title={product.name} description={product.description} image={product.image} path={`/urun/${id}`} type="product" />
      <ProductSchema product={product} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/kategoriler" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" /> Kategorilere Dön
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-2xl bg-brand-50">
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
          </div>

          <div>
            <div className="flex gap-2 mb-3">
              <Badge variant="min">{minInfo.label}</Badge>
            </div>
            <p className="text-sm text-brand-500">{product.category}</p>
            <h1 className="font-display text-3xl font-bold text-brand-900 mt-1">{product.name}</h1>
            <p className="text-gray-500 mt-1">Stok Kodu: {product.sku}</p>
            <p className="font-display text-4xl font-bold text-brand-700 mt-6">{formatPrice(product.price)}</p>
            <p className="text-sm text-brand-600 mt-2">
              Bu üründen sepette en az {formatPrice(minLineValue)} tutarında sipariş verilmelidir.
            </p>
            <p className="mt-6 text-gray-600 leading-relaxed">{product.description}</p>

            <div className="mt-8 max-w-sm">
              <QuantityControls
                quantity={qty}
                minOrder={minInfo.minQty}
                minOrderHint={minInfo.label}
                onChange={setQty}
                onIncrement={(n) => setQty((q) => q + n)}
                onDecrement={(n) => setQty((q) => Math.max(minInfo.minQty, q - n))}
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              className="mt-6"
              onClick={() => addToCart(product, Math.max(qty, minInfo.minQty))}
            >
              <ShoppingCart className="h-5 w-5" />
              Sepete Ekle ({Math.max(qty, minInfo.minQty)} adet · {formatPrice(product.price * Math.max(qty, minInfo.minQty))})
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
