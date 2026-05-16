import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Trash2, AlertTriangle, Sparkles, Tag, TrendingUp } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';
import QuantityControls from '@/components/product/QuantityControls';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { getMinOrderInfo } from '@/utils/orderRules';
import { getCartDiscount, DISCOUNT_THRESHOLD_TL } from '@/utils/cartDiscount';
import {
  getFreeShippingStatus,
  getOrderPayableTotal,
  FREE_SHIPPING_THRESHOLD_TL,
  STANDARD_SHIPPING_FEE_TL,
} from '@/utils/cartShipping';
import FreeShippingBanner from '@/components/cart/FreeShippingBanner';
import { formatPrice, openWhatsApp } from '@/utils/whatsapp';

function formatThreshold(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
}

const MARKETING = [
  `${formatThreshold(FREE_SHIPPING_THRESHOLD_TL)} altı ${formatPrice(STANDARD_SHIPPING_FEE_TL)} kargo · üzeri bedava`,
  `${formatThreshold(DISCOUNT_THRESHOLD_TL)} altı: %5 iskonto · üzeri: %10 iskonto`,
  'WhatsApp sipariş formunda iskonto ve kargo bilgisi yer alır.',
];

export default function CartPage() {
  const {
    items,
    totalPrice,
    minOrderViolations,
    isCartValid,
    removeFromCart,
    setQuantity,
    increment,
    decrement,
    clearCart,
  } = useCart();
  const { settings } = useStore();

  const discount = useMemo(() => getCartDiscount(totalPrice), [totalPrice]);
  const shipping = useMemo(() => getFreeShippingStatus(discount.subtotal), [discount.subtotal]);
  const orderTotal = useMemo(
    () => getOrderPayableTotal(discount.grandTotal, shipping),
    [discount.grandTotal, shipping],
  );

  const handleWhatsApp = () => {
    if (!isCartValid) return;
    openWhatsApp(settings.whatsappNumber, items, {
      siteName: settings.siteName || 'Nasyonel Toys',
      discount,
      shipping,
    });
  };

  if (!items.length) {
    return (
      <>
        <SEO title="Sepet" path="/sepet" />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <p className="text-xl text-gray-500">Sepetiniz boş</p>
          <Link to="/kategoriler">
            <Button variant="primary" className="mt-6">Ürünlere Göz At</Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Sepet" path="/sepet" noindex />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-brand-900">Sepetim</h1>
        <p className="text-sm text-brand-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1 cursor-default">
            🚚 Altı {formatPrice(STANDARD_SHIPPING_FEE_TL)} kargo · {formatThreshold(FREE_SHIPPING_THRESHOLD_TL)} üzeri bedava
          </span>
          <span>·</span>
          <span>{formatThreshold(DISCOUNT_THRESHOLD_TL)} altı %5, üzeri %10 iskonto</span>
        </p>

        <div className="mt-6 rounded-2xl border border-accent-gold/40 bg-gradient-to-r from-amber-50 to-brand-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-gold text-brand-950">
              <Tag className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-brand-900">{discount.currentDiscountMessage}</p>
              <p className="text-sm font-medium text-brand-700 mt-1">{discount.tierLabel}</p>
              {discount.upsellMessage && (
                <p className="mt-2 flex items-start gap-2 text-sm font-semibold text-amber-800 bg-amber-100/80 rounded-lg px-3 py-2">
                  <TrendingUp className="h-4 w-4 shrink-0 mt-0.5" />
                  {discount.upsellMessage}
                </p>
              )}
              {discount.tier === 'high' && (
                <p className="mt-2 text-sm text-emerald-700 font-medium">
                  {formatThreshold(DISCOUNT_THRESHOLD_TL)} barajını geçtiniz — %10 iskonto aktif!
                </p>
              )}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{formatPrice(discount.subtotal)}</span>
                  <span>{formatThreshold(DISCOUNT_THRESHOLD_TL)} (%10 için)</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/80 overflow-hidden border border-brand-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      discount.tier === 'high' ? 'bg-emerald-500' : 'bg-accent-gold'
                    }`}
                    style={{ width: `${discount.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <FreeShippingBanner subtotal={discount.subtotal} />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const minInfo = getMinOrderInfo(item);
              const lineTotal = item.price * item.quantity;
              return (
                <div key={item.id} className="flex gap-4 rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
                  <div className="product-media product-media--thumb rounded-lg border border-brand-100">
                    <img src={item.image} alt="" className="product-media-img p-1" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-brand-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                    <p className="text-brand-700 font-bold mt-1">{formatPrice(item.price)} / adet</p>
                    <p className="text-xs text-brand-600 mt-1">{minInfo.label}</p>
                    <p className="text-sm font-semibold text-brand-800 mt-1">Satır: {formatPrice(lineTotal)}</p>
                    <div className="mt-3 max-w-xs">
                      <QuantityControls
                        quantity={item.quantity}
                        minOrder={minInfo.minQty}
                        minOrderHint={minInfo.label}
                        onChange={(q) => setQuantity(item.id, q)}
                        onIncrement={(n) => increment(item.id, n)}
                        onDecrement={(n) => decrement(item.id, n)}
                        compact
                      />
                    </div>
                  </div>
                  <button type="button" onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 p-2">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
            <button type="button" onClick={clearCart} className="text-sm text-gray-500 hover:text-red-600">
              Sepeti Temizle
            </button>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6 shadow-card">
              <h2 className="font-display font-bold text-brand-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent-gold" /> Sipariş Özeti
              </h2>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <dt>Ara toplam</dt>
                  <dd className="font-medium text-brand-900">{formatPrice(discount.subtotal)}</dd>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <dt>{discount.tierLabel}</dt>
                  <dd className="font-semibold">-{formatPrice(discount.discountAmount)}</dd>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <dt className="flex items-center gap-1 cursor-default" title="5000 TL üzeri kargo bedava">
                    <span aria-hidden>🚚</span> Kargo
                  </dt>
                  <dd className="font-semibold">
                    {shipping.eligible ? (
                      <span className="text-emerald-600">Bedava</span>
                    ) : (
                      <span>{formatPrice(shipping.shippingFee)}</span>
                    )}
                  </dd>
                </div>
                {!shipping.eligible && shipping.upsellMessage && (
                  <p className="text-xs text-emerald-800 bg-emerald-50 rounded-lg px-2 py-1.5 cursor-pointer">
                    <Link to="/kategoriler" className="hover:underline">
                      {shipping.upsellMessage}
                    </Link>
                  </p>
                )}
                <div className="flex justify-between border-t border-brand-200 pt-2 text-base">
                  <dt className="font-bold text-brand-900">Ödenecek tutar</dt>
                  <dd className="font-bold text-brand-700 text-xl">{formatPrice(orderTotal)}</dd>
                </div>
              </dl>

              {!shipping.eligible && shipping.shippingFee > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Ürünler {formatPrice(discount.grandTotal)} + kargo {formatPrice(shipping.shippingFee)}
                </p>
              )}

              <p className="text-xs text-gray-500 mt-2">{items.length} ürün çeşidi</p>

              {minOrderViolations.length > 0 && (
                <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                    <AlertTriangle className="h-4 w-4" /> Minimum adet uyarısı
                  </p>
                  <ul className="mt-2 text-xs text-amber-700 space-y-1">
                    {minOrderViolations.map((v) => (
                      <li key={v.id}>
                        {v.name}: en az {v.minOrder} adet sipariş verilmeli (şu an {v.quantity} adet)
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button variant="whatsapp" size="lg" className="mt-6 w-full" onClick={handleWhatsApp} disabled={!isCartValid}>
                <MessageCircle className="h-5 w-5" />
                Sipariş Formunu WhatsApp ile Gönder
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Formda iskonto ve ödenecek tutar yer alır
              </p>
            </div>

            <div className="rounded-2xl bg-brand-900 text-white p-6 space-y-3">
              {MARKETING.map((text) => (
                <p key={text} className="text-sm text-brand-100 flex items-start gap-2">
                  <span className="text-accent-gold mt-0.5">✦</span> {text}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
