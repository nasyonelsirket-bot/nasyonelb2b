import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Trash2, AlertTriangle, Sparkles, Tag, TrendingUp, Truck } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';
import KdvNotice from '@/components/ui/KdvNotice';
import QuantityControls from '@/components/product/QuantityControls';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { getMinOrderInfo, DEFAULT_MIN_LINE_VALUE_TL } from '@/utils/orderRules';
import { getCartDiscount, DISCOUNT_THRESHOLD_TL } from '@/utils/cartDiscount';
import { getFreeShippingStatus, getOrderPayableTotal } from '@/utils/cartShipping';
import { formatPrice } from '@/utils/whatsapp';
import { submitOrderViaWhatsApp } from '@/utils/orderPdf';

function formatThreshold(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
}

const EMPTY_CUSTOMER = {
  companyName: '',
  contactName: '',
  phone: '',
  address: '',
};

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
  const minLineValue = Number(settings.minOrderLineValue) || DEFAULT_MIN_LINE_VALUE_TL;

  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const discount = useMemo(() => getCartDiscount(totalPrice), [totalPrice]);
  const shipping = useMemo(() => getFreeShippingStatus(discount.subtotal), [discount.subtotal]);
  const orderTotal = useMemo(
    () => getOrderPayableTotal(discount.grandTotal, shipping),
    [discount.grandTotal, shipping],
  );

  const validateCustomer = () => {
    if (!customer.companyName.trim()) return 'Firma / bayi adı zorunludur.';
    if (!customer.address.trim()) return 'Teslimat adresi zorunludur.';
    if (!customer.phone.trim()) return 'İletişim telefonu zorunludur.';
    return null;
  };

  const handleSubmit = async () => {
    setFormError('');
    const err = validateCustomer();
    if (err) {
      setFormError(err);
      return;
    }
    if (!isCartValid) return;

    setSubmitting(true);
    try {
      const result = await submitOrderViaWhatsApp({
        phone: settings.whatsappNumber,
        siteName: settings.siteName || 'Nasyonel Toys',
        customer: {
          companyName: customer.companyName.trim(),
          contactName: customer.contactName.trim(),
          phone: customer.phone.trim(),
          address: customer.address.trim(),
        },
        items,
        discount,
        shipping,
        orderTotal,
      });
      if (!result.shared) {
        setFormError('PDF indirildi. WhatsApp açıldı — lütfen PDF dosyasını mesaja ekleyerek gönderin.');
      }
    } catch {
      setFormError('Sipariş gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
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
        <p className="text-sm text-brand-600 mt-1">
          Ürün başına min. {formatPrice(minLineValue)} · {formatThreshold(DISCOUNT_THRESHOLD_TL)} altı %5, üzeri %10 iskonto
        </p>
        <KdvNotice className="mt-2" />

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
            </div>
          </div>
        </div>

        {shipping.upsellMessage && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 flex items-start gap-3">
            <Truck className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-emerald-900">{shipping.upsellMessage}</p>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const minInfo = getMinOrderInfo(item, minLineValue);
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
                    <div className="mt-3 max-w-md">
                      <QuantityControls
                        quantity={item.quantity}
                        minOrder={minInfo.minQty}
                        minOrderHint={minInfo.label}
                        onChange={(q) => setQuantity(item.id, q)}
                        onIncrement={(n) => increment(item.id, n)}
                        onDecrement={(n) => decrement(item.id, n)}
                        showBulk
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
            <div className="rounded-2xl border border-brand-200 bg-white p-6 shadow-card space-y-3">
              <h2 className="font-display font-bold text-brand-900">Müşteri Bilgileri</h2>
              <p className="text-xs text-gray-500">Zorunlu alanları doldurmadan sipariş gönderilemez.</p>
              {[
                ['companyName', 'Firma / Bayi Adı *', 'text'],
                ['contactName', 'Yetkili Kişi', 'text'],
                ['phone', 'İletişim Telefonu *', 'tel'],
                ['address', 'Teslimat Adresi *', 'textarea'],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label className="text-xs font-medium text-brand-800">{label}</label>
                  {type === 'textarea' ? (
                    <textarea
                      rows={3}
                      value={customer[key]}
                      onChange={(e) => setCustomer({ ...customer, [key]: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                      required={label.includes('*')}
                    />
                  ) : (
                    <input
                      type={type}
                      value={customer[key]}
                      onChange={(e) => setCustomer({ ...customer, [key]: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                      required={label.includes('*')}
                    />
                  )}
                </div>
              ))}
            </div>

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
                  <dt>İskonto</dt>
                  <dd className="font-semibold">-{formatPrice(discount.discountAmount)}</dd>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <dt>Kargo</dt>
                  <dd className="font-semibold">
                    {shipping.eligible ? (
                      <span className="text-emerald-600">Bedava</span>
                    ) : (
                      formatPrice(shipping.shippingFee)
                    )}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-brand-200 pt-2 text-base">
                  <dt className="font-bold text-brand-900">Ödenecek tutar</dt>
                  <dd className="font-bold text-brand-700 text-xl">{formatPrice(orderTotal)}</dd>
                </div>
              </dl>

              <KdvNotice className="mt-3" />

              {minOrderViolations.length > 0 && (
                <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                    <AlertTriangle className="h-4 w-4" /> Minimum sipariş uyarısı
                  </p>
                  <ul className="mt-2 text-xs text-amber-700 space-y-1">
                    {minOrderViolations.map((v) => (
                      <li key={v.id}>
                        {v.name}: en az {formatPrice(v.requiredTotal)} ({v.minOrder} adet) — şu an{' '}
                        {formatPrice(v.lineTotal)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {formError && (
                <p className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <Button
                variant="whatsapp"
                size="lg"
                className="mt-6 w-full"
                onClick={handleSubmit}
                disabled={!isCartValid || submitting}
              >
                <MessageCircle className="h-5 w-5" />
                {submitting ? 'PDF hazırlanıyor...' : 'PDF Sipariş Formu ile WhatsApp Gönder'}
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Sipariş PDF olarak indirilir; WhatsApp&apos;ta dosyayı ekleyerek gönderin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
