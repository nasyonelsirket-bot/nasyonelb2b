import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, ChevronDown, Truck, ShieldCheck } from 'lucide-react';
import ProductSEO from '@/components/seo/ProductSEO';
import ProductSchema from '@/components/seo/ProductSchema';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
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
import { trackRecentlyViewed } from '@/utils/recentlyViewed';
import { FREE_SHIPPING_THRESHOLD_TL } from '@/utils/cartShipping';
import PaymentTrustStrip from '@/components/trust/PaymentTrustStrip';

function AccordionSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-brand-100 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold text-brand-900 hover:bg-brand-50/50"
      >
        {title}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-brand-50">{children}</div>}
    </div>
  );
}

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
    if (product) {
      trackViewItem(product);
      trackRecentlyViewed(product);
    }
  }, [product?.id]);

  useEffect(() => {
    if (!product?.slug || !idOrSlug) return;
    if (idOrSlug === product.slug) return;
    if (idOrSlug === product.id) {
      navigate(getProductPath(product), { replace: true });
    }
  }, [product, idOrSlug, navigate]);

  const handleAdd = useCallback(() => {
    if (!product) return;
    addToCart(product, Math.max(1, qty));
  }, [addToCart, product, qty]);

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
  const productPath = getProductPath(product);
  const inStock = product.stock == null || Number(product.stock) > 0;

  return (
    <>
      <ProductSEO product={product} />
      <ProductSchema product={product} />
      <BreadcrumbSchema
        items={[
          { name: 'Ana Sayfa', href: '/' },
          { name: product.category || 'Ürünler', href: '/kategoriler' },
          { name: product.name, href: productPath },
        ]}
      />

      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:pb-8">
        <Breadcrumbs
          variant="light"
          className="mb-4"
          items={[
            { label: 'Ana Sayfa', to: '/' },
            { label: product.category || 'Ürünler', to: '/kategoriler' },
            { label: product.name },
          ]}
        />

        <Link
          to="/kategoriler"
          className="inline-flex items-center gap-2 text-sm text-brand-600 hover:underline mb-4 lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" /> Geri
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:gap-10 lg:grid-cols-2">
          <div className="space-y-3 min-w-0">
            <ProductImage
              src={activeImage}
              alt={product.name}
              variant="detail"
              className="rounded-2xl border border-brand-100 shadow-card w-full"
              loading="eager"
            />
            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
                {gallery.map((url, i) => (
                  <button
                    key={`${url}-${i}`}
                    type="button"
                    onClick={() => setImageIndex(i)}
                    className={`shrink-0 snap-start rounded-lg border-2 overflow-hidden transition ${
                      i === imageIndex
                        ? 'border-accent-gold ring-2 ring-accent-gold/30'
                        : 'border-brand-100 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <ProductImage src={url} alt="" variant="thumb" className="!w-16 !h-16" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-w-0">
            {onSale && (
              <span className="inline-flex rounded-lg bg-red-600 px-3 py-1 text-sm font-bold text-white">
                %{getDiscountPercent(product)} İNDİRİM
              </span>
            )}
            <p className="text-sm text-brand-500 mt-2">{product.category}</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900 mt-1">{product.name}</h1>
            {ratingAvg > 0 && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <ProductRatingStars rating={ratingAvg} size="md" />
                <span className="text-sm text-gray-600">({reviewCount} değerlendirme)</span>
              </div>
            )}
            <p className="text-gray-500 mt-1 text-sm">Stok Kodu: {product.sku}</p>
            <p className={`mt-2 text-sm font-medium ${inStock ? 'text-emerald-700' : 'text-red-600'}`}>
              {inStock ? '● Stokta — hızlı kargo' : 'Stok tükendi'}
            </p>

            <div className="mt-4">
              <ProductPriceDisplay product={product} size="lg" />
            </div>
            <KdvNotice className="mt-2" />

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1">
                <Truck className="h-3.5 w-3.5 text-emerald-600" />
                {FREE_SHIPPING_THRESHOLD_TL} TL+ kargo bedava
              </span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
                PayTR güvenli ödeme
              </span>
            </div>

            <div className="mt-6 max-w-md lg:max-w-md">
              <QuantityControls
                quantity={qty}
                onChange={setQty}
                onIncrement={(n) => setQty((q) => q + n)}
                onDecrement={(n) => setQty((q) => Math.max(1, q - n))}
              />
            </div>

            <div className="mt-6 hidden max-w-md lg:block">
              <Button
                variant="yellow"
                size="lg"
                className="w-full"
                onClick={handleAdd}
                disabled={!inStock}
              >
                <ShoppingCart className="h-5 w-5" />
                Sepete Ekle ({Math.max(1, qty)} adet · {formatPrice(lineTotal)})
              </Button>
            </div>

            <div className="mt-8 space-y-3">
              <AccordionSection title="Ürün Açıklaması" defaultOpen>
                <p className="whitespace-pre-line">{product.description || 'Açıklama yakında eklenecek.'}</p>
              </AccordionSection>
              <AccordionSection title="Kargo & Teslimat">
                <p>
                  Stoktan hızlı hazırlık. {FREE_SHIPPING_THRESHOLD_TL} TL ve üzeri siparişlerde kargo bedava.
                  Teslimat süresi bölgeye göre 1–5 iş günü arasında değişebilir.
                </p>
              </AccordionSection>
              <AccordionSection title="Güvenli Ödeme">
                <PaymentTrustStrip compact />
              </AccordionSection>
            </div>
          </div>
        </div>

        <ProductReviewsSection product={product} />
      </div>

      {/* Mobil — sabit Sepete Ekle (alt menünün üstünde) */}
      <div
        className="lg:hidden fixed left-0 right-0 z-[47] border-t border-brand-100 bg-white/98 backdrop-blur-md px-3 pt-2 pb-2 shadow-[0_-4px_24px_rgba(10,31,77,0.1)]"
        style={{ bottom: 'calc(3.25rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <Button
          type="button"
          variant="yellow"
          size="lg"
          className="w-full min-h-[48px] rounded-full text-base font-bold shadow-lg"
          onClick={handleAdd}
          disabled={!inStock}
        >
          <ShoppingCart className="h-5 w-5 shrink-0" />
          {inStock ? `Sepete Ekle · ${formatPrice(lineTotal)}` : 'Stokta yok'}
        </Button>
      </div>
    </>
  );
}

