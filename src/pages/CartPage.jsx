import { useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  Trash2,
  Truck,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  MapPin,
  CreditCard,
  Building2,
  Banknote,
  Sparkles,
} from 'lucide-react';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';
import KdvNotice from '@/components/ui/KdvNotice';
import QuantityControls from '@/components/product/QuantityControls';
import FreeShippingBanner from '@/components/cart/FreeShippingBanner';
import CartUpsellPanel from '@/components/cart/CartUpsellPanel';
import { mapItemsForOrder, getUpsellSavings, getEffectiveUnitPrice } from '@/utils/cartLinePricing';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { getCartDiscount, PAYMENT_IBAN, PAYMENT_COD } from '@/utils/cartDiscount';
import { getFreeShippingStatus, getOrderPayableTotal } from '@/utils/cartShipping';
import { formatPrice } from '@/utils/whatsapp';
import { submitOrderViaWhatsApp } from '@/utils/orderPdf';
import {
  trackBeginCheckout,
  trackPurchase,
  trackFormView,
  trackFormStart,
  trackFormSubmit,
  trackGenerateLead,
} from '@/lib/analytics/ga4';

const STEPS = [
  { id: 1, label: 'Sepet', icon: ShoppingBag },
  { id: 2, label: 'Teslimat', icon: MapPin },
  { id: 3, label: 'Ödeme', icon: CreditCard },
];

const EMPTY_CUSTOMER = {
  name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  district: '',
};

export default function CartPage() {
  const { items, totalPrice, removeFromCart, setQuantity, increment, decrement, clearCart } =
    useCart();
  const { settings } = useStore();

  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_COD);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const discount = useMemo(
    () => getCartDiscount(totalPrice, paymentMethod),
    [totalPrice, paymentMethod],
  );
  const shipping = useMemo(() => getFreeShippingStatus(discount.subtotal), [discount.subtotal]);
  const orderTotal = useMemo(
    () => getOrderPayableTotal(discount.grandTotal, shipping),
    [discount.grandTotal, shipping],
  );

  const codDiscount = useMemo(() => getCartDiscount(totalPrice, PAYMENT_COD), [totalPrice]);
  const ibanDiscount = useMemo(() => getCartDiscount(totalPrice, PAYMENT_IBAN), [totalPrice]);
  const codTotal = useMemo(
    () => getOrderPayableTotal(codDiscount.grandTotal, shipping),
    [codDiscount.grandTotal, shipping],
  );
  const ibanTotal = useMemo(
    () => getOrderPayableTotal(ibanDiscount.grandTotal, shipping),
    [ibanDiscount.grandTotal, shipping],
  );

  const ibanInfo = useMemo(
    () => ({
      iban: settings.storeIban || '',
      accountName: settings.storeIbanName || settings.siteName || 'Nasyonel Toys',
      bankName: settings.storeBankName || '',
    }),
    [settings],
  );

  const checkoutTracked = useRef(false);
  const formViewTracked = useRef(false);
  const formStartTracked = useRef(false);

  useEffect(() => {
    if (!items.length || checkoutTracked.current) return;
    checkoutTracked.current = true;
    trackBeginCheckout(items);
  }, [items]);

  useEffect(() => {
    if (step !== 2 || formViewTracked.current || !items.length) return;
    formViewTracked.current = true;
    trackFormView(items);
  }, [step, items]);

  const handleFormStart = () => {
    if (formStartTracked.current || !items.length) return;
    formStartTracked.current = true;
    trackFormStart(items);
  };

  const validateDelivery = () => {
    if (!customer.name.trim()) return 'Ad soyad zorunludur.';
    if (!customer.phone.trim()) return 'Telefon zorunludur.';
    if (!customer.email.trim()) return 'E-posta zorunludur.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
      return 'Geçerli bir e-posta girin.';
    }
    if (!customer.address.trim()) return 'Adres zorunludur.';
    if (!customer.city.trim()) return 'İl zorunludur.';
    if (!customer.district.trim()) return 'İlçe zorunludur.';
    return null;
  };

  const goNext = () => {
    setFormError('');
    if (step === 2) {
      const err = validateDelivery();
      if (err) {
        setFormError(err);
        return;
      }
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const handleSubmit = async () => {
    setFormError('');
    setFormSuccess('');
    const err = validateDelivery();
    if (err) {
      setFormError(err);
      setStep(2);
      return;
    }
    if (paymentMethod === PAYMENT_IBAN && !ibanInfo.iban) {
      setFormError('IBAN bilgisi henüz tanımlanmamış. Lütfen kapıda ödeme seçin veya bizimle iletişime geçin.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitOrderViaWhatsApp({
        phone: settings.whatsappNumber,
        siteName: settings.siteName || 'Nasyonel Toys',
        siteUrl: settings.siteUrl || import.meta.env.VITE_SITE_URL || window.location.origin,
        siteLogoUrl: settings.logoUrl,
        pdfSettings: settings.pdfSettings,
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          email: customer.email.trim(),
          address: customer.address.trim(),
          city: customer.city.trim(),
          district: customer.district.trim(),
        },
        items: mapItemsForOrder(items),
        discount,
        shipping,
        orderTotal,
        paymentMethod,
        ibanInfo: paymentMethod === PAYMENT_IBAN ? ibanInfo : null,
        notifyEmail: settings.contactEmail,
      });
      setFormSuccess(result.message);
      trackFormSubmit(items, { success: true });
      trackPurchase({
        transactionId: result.orderNumber || result.orderId,
        items,
        value: orderTotal,
        shipping: shipping.shippingFee,
        coupon: paymentMethod,
      });
      trackGenerateLead({ transactionId: result.orderNumber, items, value: orderTotal });
    } catch (submitErr) {
      const msg = submitErr?.message || 'Sipariş gönderilemedi.';
      setFormError(msg);
      trackFormSubmit(items, { success: false, errorMessage: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (!items.length) {
    return (
      <>
        <SEO title="Sepetim" description="Alışveriş sepetiniz" path="/sepet" />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center animate-fade-in">
          <ShoppingBag className="h-16 w-16 mx-auto text-brand-300" />
          <p className="text-xl text-gray-500 mt-4">Sepetiniz boş</p>
          <Link to="/kategoriler">
            <Button variant="primary" className="mt-6">
              Alışverişe Başla
            </Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Sepetim"
        description="Nasyonel Toys online oyuncak mağazası — güvenli alışveriş ve hızlı teslimat"
        path="/sepet"
        noindex
      />
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8 animate-fade-in">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900">Ödeme</h1>

        <nav className="mt-6 flex items-center gap-2 sm:gap-4" aria-label="Ödeme adımları">
          {STEPS.map(({ id, label, icon: Icon }) => (
            <div key={id} className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                  step >= id
                    ? 'bg-brand-900 text-accent-gold shadow-md'
                    : 'bg-brand-100 text-brand-500'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={`text-xs sm:text-sm font-medium truncate ${
                  step >= id ? 'text-brand-900' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
              {id < 3 && <ChevronRight className="h-4 w-4 text-brand-200 shrink-0 hidden sm:block" />}
            </div>
          ))}
        </nav>

        <div className="mt-4">
          <FreeShippingBanner subtotal={discount.subtotal} />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {step === 1 && (
              <div className="space-y-4 animate-slide-up">
                {items.map((item) => {
                  const unit = getEffectiveUnitPrice(item);
                  const lineTotal = unit * item.quantity;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-card hover:shadow-card-hover transition-shadow"
                    >
                      <div className="flex gap-3 flex-1 min-w-0">
                        <div className="product-media product-media--thumb rounded-lg border shrink-0">
                          <img src={item.image} alt="" className="product-media-img p-1" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-brand-900">{item.name}</h3>
                          <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                          <p className="text-brand-700 font-bold mt-1">
                            {formatPrice(unit)} / adet
                            {item.upsellPromo && (
                              <span className="text-xs font-normal text-emerald-700 ml-1">
                                (paket özel fiyat)
                              </span>
                            )}
                          </p>
                          <p className="text-sm font-semibold text-brand-800">
                            {formatPrice(lineTotal)}
                          </p>
                          <div className="mt-3 max-w-md">
                            <QuantityControls
                              quantity={item.quantity}
                              onChange={(q) => setQuantity(item.id, q)}
                              onIncrement={(n) => increment(item.id, n)}
                              onDecrement={(n) => decrement(item.id, n)}
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="self-end text-red-500 hover:text-red-700 p-2"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-sm text-gray-500 hover:text-red-600"
                >
                  Sepeti Temizle
                </button>
              </div>
            )}

            {step === 2 && (
              <div
                className="rounded-2xl border border-brand-200 bg-white p-6 shadow-card space-y-4 animate-slide-up"
                onFocusCapture={handleFormStart}
              >
                <h2 className="font-display font-bold text-brand-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-accent-gold" /> Teslimat Bilgileri
                </h2>
                <p className="text-xs text-gray-500">Tüm alanlar zorunludur.</p>
                {[
                  ['name', 'Ad Soyad *', 'text'],
                  ['phone', 'Telefon *', 'tel'],
                  ['email', 'E-posta *', 'email'],
                  ['city', 'İl *', 'text'],
                  ['district', 'İlçe *', 'text'],
                  ['address', 'Açık Adres *', 'textarea'],
                ].map(([key, label, type]) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-brand-800">{label}</label>
                    {type === 'textarea' ? (
                      <textarea
                        rows={3}
                        value={customer[key]}
                        onChange={(e) => setCustomer({ ...customer, [key]: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20"
                        required
                      />
                    ) : (
                      <input
                        type={type}
                        value={customer[key]}
                        onChange={(e) => setCustomer({ ...customer, [key]: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20"
                        required
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-slide-up">
                <h2 className="font-display font-bold text-brand-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-accent-gold" /> Ödeme Yöntemi
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod(PAYMENT_IBAN)}
                    className={`text-left rounded-2xl border-2 p-5 transition-all hover:scale-[1.02] ${
                      paymentMethod === PAYMENT_IBAN
                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                        : 'border-brand-100 bg-white hover:border-brand-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-emerald-700 font-bold">
                      <Building2 className="h-5 w-5" />
                      Havale / EFT (IBAN)
                    </div>
                    <p className="mt-2 text-sm text-emerald-800 font-semibold">%10 indirim</p>
                    <p className="mt-2 text-2xl font-bold text-brand-900">{formatPrice(ibanTotal)}</p>
                    <p className="text-xs text-gray-500 line-through">{formatPrice(codTotal)}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod(PAYMENT_COD)}
                    className={`text-left rounded-2xl border-2 p-5 transition-all hover:scale-[1.02] ${
                      paymentMethod === PAYMENT_COD
                        ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200'
                        : 'border-brand-100 bg-white hover:border-brand-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-brand-800 font-bold">
                      <Banknote className="h-5 w-5" />
                      Kapıda Ödeme
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Normal fiyat</p>
                    <p className="mt-2 text-2xl font-bold text-brand-900">{formatPrice(codTotal)}</p>
                  </button>
                </div>

                {paymentMethod === PAYMENT_IBAN && ibanInfo.iban && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">
                    <p className="font-semibold text-emerald-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> Ödeme bilgileri
                    </p>
                    <dl className="mt-3 space-y-2 text-sm text-emerald-900">
                      <div>
                        <dt className="text-emerald-700">Alıcı</dt>
                        <dd className="font-medium">{ibanInfo.accountName}</dd>
                      </div>
                      <div>
                        <dt className="text-emerald-700">IBAN</dt>
                        <dd className="font-mono font-bold text-base select-all">{ibanInfo.iban}</dd>
                      </div>
                      {ibanInfo.bankName && (
                        <div>
                          <dt className="text-emerald-700">Banka</dt>
                          <dd>{ibanInfo.bankName}</dd>
                        </div>
                      )}
                    </dl>
                    <p className="mt-3 text-xs text-emerald-800">
                      Ödemeyi yaptıktan sonra WhatsApp mesajına dekont ekleyin. Siparişiniz IBAN kontrolünden
                      sonra onaylanır.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {step === 1 && !shipping.eligible && <CartUpsellPanel compact />}

            <OrderSummary
              items={items}
              discount={discount}
              shipping={shipping}
              orderTotal={orderTotal}
            />

            {formError && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}
            {formSuccess && (
              <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {formSuccess}
              </p>
            )}

            <div className="flex flex-col gap-2">
              {step > 1 && (
                <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Geri
                </Button>
              )}
              {step < 3 ? (
                <Button variant="primary" onClick={goNext}>
                  Devam Et <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="whatsapp" size="lg" onClick={handleSubmit} disabled={submitting}>
                  <MessageCircle className="h-5 w-5" />
                  {submitting ? 'Kaydediliyor...' : 'Siparişi WhatsApp ile Tamamla'}
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 text-center">
              Sipariş kaydedilir, e-posta gönderilir ve WhatsApp açılır.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function OrderSummary({ items, discount, shipping, orderTotal }) {
  const upsellSave = getUpsellSavings(items);

  return (
    <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6 shadow-card sticky top-24">
      <h2 className="font-display font-bold text-brand-900 flex items-center gap-2">
        <Truck className="h-5 w-5 text-accent-gold" /> Sipariş Özeti
      </h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <dt>Ara toplam</dt>
          <dd className="font-medium text-brand-900">{formatPrice(discount.subtotal)}</dd>
        </div>
        {upsellSave > 0 && (
          <p className="text-xs text-emerald-800 bg-emerald-50 rounded-lg px-2 py-1.5">
            Öneri ürün indirimi ile {formatPrice(upsellSave)} tasarruf (ara toplama dahil)
          </p>
        )}
        {discount.discountAmount > 0 && (
          <div className="flex justify-between text-emerald-700">
            <dt>{discount.tierLabel}</dt>
            <dd className="font-semibold">-{formatPrice(discount.discountAmount)}</dd>
          </div>
        )}
        <div className="flex justify-between text-brand-800">
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
          <dt className="font-bold text-brand-900">Toplam</dt>
          <dd className="font-bold text-brand-700 text-xl">{formatPrice(orderTotal)}</dd>
        </div>
      </dl>
      <KdvNotice className="mt-3" />
      {discount.upsellMessage && (
        <p className="mt-3 text-xs font-medium text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
          {discount.upsellMessage}
        </p>
      )}
    </div>
  );
}
