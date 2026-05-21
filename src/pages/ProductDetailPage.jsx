import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import ProductSEO from '@/components/seo/ProductSEO';
import ProductSchema from '@/components/seo/ProductSchema';
import Button from '@/components/ui/Button';
import QuantityControls from '@/components/product/QuantityControls';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import KdvNotice from '@/components/ui/KdvNotice';
import ProductPriceDisplay from '@/components/product/ProductPriceDisplay';
import { formatPrice } from '@/utils/whatsapp';
import { getDiscountPercent, hasProductDiscount } from '@/utils/productPricing';
import { getProductImages } from '@/utils/productImage';
import ProductImage from '@/components/product/ProductImage';
import { trackViewItem } from '@/lib/analytics/ga4';
import { getProductPath } from '@/utils/productSeo';
import ProductRatingStars from '@/components/product/ProductRatingStars';
import ProductReviewsSection from '@/components/product/ProductReviewsSection';
import { getProductRatingSummary } from '@/utils/productReviews';

export default function ProductDetailPage() {
  const { id: idOrSlug } = useParams();
  const navigate = useNavigate();
  const { getProductByIdOrSlug } = useStore();
  const { addToCart } = useCart();
  const product = getProductByIdOrSlug(idOrSlug);
  const [qty, setQty] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const gallery = useMemo(() => getProductImages(product), [product]);
  const activeImage = gallery[imageIndex] || gallery[0];

  useEffect(() => {
    setImageIndex(0);
  }, [product?.id]);

  useEffect(() => {
    if (product) trackViewItem(product);
  }, [product?.id]);

  useEffect(() => {
    if (!product?.slug || !idOrSlug) return;
    if (idOrSlug === product.slug) return;
    if (idOrSlug === product.id) {
      navigate(getProductPath(product), { replace: true });
    }
  }, [product, idOrSlug, navigate]);

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="text-gray-500">Ürün bulunamadı.</p>
        <Link to="/" className="mt-4 text-brand-600 hover:underline">
          Ana sayfaya dön
        </Link>
      </div>
    );
  }

  const lineTotal = product.price * Math.max(1, qty);
  const onSale = hasProductDiscount(product);
  const { avg: ratingAvg, count: reviewCount } = getProductRatingSummary(product);

  return (
    <>
      <ProductSEO product={product} />
      <ProductSchema product={product} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
        <Link
          to="/kategoriler"
          className="inline-flex items-center gap-2 text-sm text-brand-600 hover:underline mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Kategorilere Dön
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="space-y-3">
            <ProductImage
              src={activeImage}
              alt={product.name}
              variant="detail"
              className="rounded-2xl border border-brand-100 shadow-card w-full"
            />
            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {gallery.map((url, i) => (
                  <button
                    key={`${url}-${i}`}
                    type="button"
                    onClick={() => setImageIndex(i)}
                    className={`shrink-0 rounded-lg border-2 overflow-hidden transition ${
                      i === imageIndex
                        ? 'border-accent-gold ring-2 ring-accent-gold/30'
                        : 'border-brand-100 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <ProductImage src={url} alt="" variant="thumb" className="!w-16 !h-16" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {onSale && (
              <span className="inline-flex rounded-lg bg-red-600 px-3 py-1 text-sm font-bold text-white animate-pulse-soft">
                %{getDiscountPercent(product)} İNDİRİM
              </span>
            )}
            <p className="text-sm text-brand-500 mt-2">{product.category}</p>
            <h1 className="font-display text-3xl font-bold text-brand-900 mt-1">{product.name}</h1>
            {ratingAvg > 0 && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <ProductRatingStars rating={ratingAvg} size="md" />
                <span className="text-sm text-gray-600">
                  {reviewCount} müşteri değerlendirmesi
                </span>
              </div>
            )}
            <p className="text-gray-500 mt-1">Stok Kodu: {product.sku}</p>
            <div className="mt-6">
              <ProductPriceDisplay product={product} size="lg" />
            </div>
            <KdvNotice className="mt-2" />
            <p className="mt-6 text-gray-600 leading-relaxed">{product.description}</p>

            <div className="mt-8 max-w-md">
              <QuantityControls
                quantity={qty}
                onChange={setQty}
                onIncrement={(n) => setQty((q) => q + n)}
                onDecrement={(n) => setQty((q) => Math.max(1, q - n))}
              />
            </div>

            <Button
              variant="yellow"
              size="lg"
              className="mt-6"
              onClick={() => addToCart(product, Math.max(1, qty))}
            >
              <ShoppingCart className="h-5 w-5" />
              Sepete Ekle ({Math.max(1, qty)} adet · {formatPrice(lineTotal)})
            </Button>
          </div>
        </div>

        <ProductReviewsSection product={product} />
      </div>
    </>
  );
}
