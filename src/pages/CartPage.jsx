import { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Truck,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  MapPin,
  CreditCard,
  Ticket,
} from 'lucide-react';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';
import KdvNotice from '@/components/ui/KdvNotice';
import QuantityControls from '@/components/product/QuantityControls';
import FreeShippingBanner from '@/components/cart/FreeShippingBanner';
import CartUpsellPanel from '@/components/cart/CartUpsellPanel';
import CheckoutLegalConsent from '@/components/cart/CheckoutLegalConsent';
import MobileCheckoutStickyBar from '@/components/cart/MobileCheckoutStickyBar';
import { mapItemsForOrder, getUpsellSavings, getEffectiveUnitPrice } from '@/utils/cartLinePricing';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { useMember } from '@/context/MemberContext';
import {
  resolveCartCustomerPrefill,
  saveCheckoutCustomer,
  isCheckoutCustomerComplete,
  EMPTY_CHECKOUT_CUSTOMER,
} from '@/utils/checkoutCustomer';
import { getCartDiscount, PAYMENT_PAYTR } from '@/utils/cartDiscount';
import { getFreeShippingStatus, getOrderPayableTotal, FREE_SHIPPING_THRESHOLD_TL } from '@/utils/cartShipping';
import { normalizePromotions } from '@/utils/promotions';
import { getBundleFreeShippingOverride } from '@/utils/bundleRules';
import { validateCouponRemote } from '@/services/promotionApi';
import { fieldId } from '@/utils/formFieldId';
import { formatPrice } from '@/utils/whatsapp';
import { startPaytrPayment } from '@/services/paytrApi';
import {
  trackBeginCheckout,
  trackFormView,
  trackFormStart,
  trackFormSubmit,
} from '@/lib/analytics/ga4';

const STEPS = [
  { id: 1, label: 'Sepet', icon: ShoppingBag },
  { id: 2, label: 'Teslimat', icon: MapPin },
  { id: 3, label: 'Ödeme', icon: CreditCard },
];

export default function CartPage() {
  const navigate = useNavigate();
  const { items, totalPrice, removeFromCart, setQuantity, increment, decrement, clearCart } =
    useCart();
  const { settings } = useStore();
  const { profile, isLoggedIn } = useMember();

  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState(() => ({ ...EMPTY_CHECKOUT_CUSTOMER }));
  const [customerPrefillSource, setCustomerPrefillSource] = useState(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);

  const promos = useMemo(() => normalizePromotions(settings.promotions), [settings.promotions]);

  const discount = useMemo(
    () =>
      getCartDiscount(totalPrice, PAYMENT_PAYTR, {
        promotions: promos,
        couponResult: couponApplied,
      }),
    [totalPrice, promos, couponApplied],
  );
  const shipping = useMemo(() => {
    const threshold = promos.freeShippingThreshold || FREE_SHIPPING_THRESHOLD_TL;
    const base = getFreeShippingStatus(discount.subtotal, threshold);
    const bundleShip = getBundleFreeShippingOverride(items, promos.bundleRules, threshold);
    if (bundleShip?.eligible) {
      return {
        ...base,
        eligible: true,
        shippingFee: 0,
        successMessage: bundleShip.message,
        upsellMessage: null,
      };
    }
    return base;
  }, [discount.subtotal, promos.freeShippingThreshold, promos.bundleRules, items]);
  const orderTotal = useMemo(
    () => getOrderPayableTotal(discount.grandTotal, shipping),
    [discount.grandTotal, shipping],
  );

  const checkoutTracked = useRef(false);
  const formViewTracked = useRef(false);
  const formStartTracked = useRef(false);
  const customerPrefilled = useRef(false);

  const hasSavedCustomer = isCheckoutCustomerComplete(customer);

  useEffect(() => {
    const { customer: pre, source } = resolveCartCustomerPrefill({ profile, isLoggedIn });
    if (!isCheckoutCustomerComplete(pre)) return;
    if (source === 'member' || !customerPrefilled.current) {
      setCustomer(pre);
      setCustomerPrefillSource(source);
      customerPrefilled.current = true;
    }
  }, [profile, isLoggedIn]);

  useEffect(() => {
    if (hasSavedCustomer) saveCheckoutCustomer(customer);
  }, [customer, hasSavedCustomer]);

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

  const applyCoupon = async () => {
    setCouponError('');
    const code = couponInput.trim();
    if (!code) {
      setCouponError('Kupon kodu girin');
      return;
    }
    setCouponLoading(true);
    try {
      const result = await validateCouponRemote({
        code,
        email: customer.email.trim(),
        subtotal: totalPrice,
      });
      setCouponApplied({
        ok: true,
        coupon: { code: result.code },
        discountAmount: result.discountAmount,
        label: result.label,
      });
      setCouponInput(result.code);
    } catch (err) {
      setCouponApplied(null);
      setCouponError(err.message || 'Kupon geçersiz');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponInput('');
    setCouponError('');
  };

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
    if (step === 1 && hasSavedCustomer) {
      setStep(3);
      return;
    }
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
    if (!legalAccepted) {
      setFormError('Devam etmek için sözleşme onayını işaretleyin.');
      return;
    }
    const err = validateDelivery();
    if (err) {
      setFormError(err);
      setStep(2);
      trackFormSubmit(items, { success: false, errorMessage: err });
      return;
    }

    setSubmitting(true);
    try {
      const result = await startPaytrPayment({
        siteName: settings.siteName || 'Nasyonel Toys',
        siteUrl: settings.siteUrl || import.meta.env.VITE_SITE_URL || window.location.origin,
        siteLogoUrl: settings.logoUrl,
        pdfSettings: settings.pdfSettings,
        notifyEmail: settings.contactEmail,
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
        couponCode: discount.couponCode || undefined,
      });
      saveCheckoutCustomer(customer);
      trackFormSubmit(items, { success: true });
      navigate('/odeme', {
        state: {
          orderId: result.orderId,
          orderNumber: result.orderNumber,
          orderTotal,
        },
      });
    } catch (submitErr) {
      const msg = submitErr?.message || 'Ödeme başlatılamadı.';
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
      <div className="checkout-shell w-full">
        <div className="checkout-shell__main mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8 animate-fade-in">
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
                          <img src={item.image} alt={item.name || 'Ürün görseli'} className="product-media-img p-1" />
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
                {customerPrefillSource && hasSavedCustomer && (
                  <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    {customerPrefillSource === 'member'
                      ? 'Hesabınızdaki kayıtlı adres ve iletişim bilgileri kullanılıyor. Gerekirse düzenleyebilirsiniz.'
                      : 'Önceki siparişinizden kayıtlı bilgiler kullanılıyor. Gerekirse düzenleyebilirsiniz.'}
                  </p>
                )}
                <p className="text-xs text-gray-500">Tüm alanlar zorunludur.</p>
                {[
                  ['name', 'Ad Soyad *', 'text'],
                  ['phone', 'Telefon *', 'tel'],
                  ['email', 'E-posta *', 'email'],
                  ['city', 'İl *', 'text'],
                  ['district', 'İlçe *', 'text'],
                  ['address', 'Açık Adres *', 'textarea'],
                ].map(([key, label, type]) => {
                  const inputId = fieldId('checkout', key);
                  return (
                  <div key={key}>
                    <label htmlFor={inputId} className="text-xs font-medium text-brand-800">
                      {label}
                    </label>
                    {type === 'textarea' ? (
                      <textarea
                        id={inputId}
                        rows={3}
                        value={customer[key]}
                        onChange={(e) => setCustomer({ ...customer, [key]: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20"
                        required
                      />
                    ) : (
                      <input
                        id={inputId}
                        type={type}
                        value={customer[key]}
                        onChange={(e) => setCustomer({ ...customer, [key]: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20"
                        required
                        autoComplete={
                          key === 'email'
                            ? 'email'
                            : key === 'phone'
                              ? 'tel'
                              : key === 'name'
                                ? 'name'
                                : undefined
                        }
                      />
                    )}
                  </div>
                  );
                })}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-slide-up">
                <h2 className="font-display font-bold text-brand-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-accent-gold" /> Ödeme
                </h2>

                <div className="rounded-2xl border-2 border-brand-600 bg-gradient-to-br from-brand-50 via-orange-50/40 to-emerald-50/30 p-5 ring-2 ring-brand-200">
                  <div className="flex items-center gap-2 text-brand-900 font-bold">
                    <CreditCard className="h-5 w-5 text-accent-gold" />
                    Kredi / Banka Kartı
                  </div>
                  <p className="mt-2 text-sm text-brand-700">
                    PayTR güvenli ödeme altyapısı ile anında ödeme yapın.
                  </p>
                  <p className="mt-3 text-2xl font-bold text-brand-900">{formatPrice(orderTotal)}</p>
                </div>

                <CheckoutLegalConsent
                  accepted={legalAccepted}
                  onChange={setLegalAccepted}
                  error={!legalAccepted && formError.includes('sözleşme') ? formError : ''}
                />
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
              couponInput={couponInput}
              onCouponInput={setCouponInput}
              onApplyCoupon={applyCoupon}
              onRemoveCoupon={removeCoupon}
              couponApplied={couponApplied}
              couponError={couponError}
              couponLoading={couponLoading}
            />

            {formError && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-md:hidden">
                {formError}
              </p>
            )}
            <CheckoutActions
              step={step}
              setStep={setStep}
              goNext={goNext}
              handleSubmit={handleSubmit}
              submitting={submitting}
              className="hidden md:flex"
            />
          </div>
        </div>
        </div>

        <MobileCheckoutStickyBar
          label={step < 3 ? 'Devam Et' : 'Kredi Kartı ile Öde'}
          onClick={step < 3 ? goNext : handleSubmit}
          loading={submitting}
          loadingLabel="Ödeme hazırlanıyor…"
          error={formError}
          total={orderTotal}
          onBack={step > 1 ? () => setStep((s) => s - 1) : null}
          showPaymentIcon={step >= 3}
        />
      </div>
    </>
  );
}

function CheckoutActions({ step, setStep, goNext, handleSubmit, submitting, className = '' }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`.trim()}>
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
        <Button variant="gold" size="lg" onClick={handleSubmit} disabled={submitting} className="w-full">
          <CreditCard className="h-5 w-5" />
          {submitting ? 'Ödeme hazırlanıyor...' : 'Kredi Kartı ile Öde'}
        </Button>
      )}
    </div>
  );
}

function OrderSummary({
  items,
  discount,
  shipping,
  orderTotal,
  couponInput,
  onCouponInput,
  onApplyCoupon,
  onRemoveCoupon,
  couponApplied,
  couponError,
  couponLoading,
}) {
  const upsellSave = getUpsellSavings(items);
  const parts = Array.isArray(discount.parts) ? discount.parts : [];

  return (
    <div className="checkout-order-summary rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6 shadow-card sticky top-24">
      <h2 className="font-display font-bold text-brand-900 flex items-center gap-2">
        <Truck className="h-5 w-5 text-accent-gold" /> Sipariş Özeti
      </h2>

      <div className="mt-4 rounded-xl border border-brand-100 bg-white p-3 space-y-2">
        <p className="text-xs font-semibold text-brand-800 flex items-center gap-1">
          <Ticket className="h-3.5 w-3.5" /> Kupon kodu
        </p>
        {couponApplied ? (
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-emerald-800 font-mono font-bold">{couponApplied.coupon?.code}</span>
            <button type="button" onClick={onRemoveCoupon} className="text-xs text-red-600 hover:underline">
              Kaldır
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={couponInput}
              onChange={(e) => onCouponInput(e.target.value.toUpperCase())}
              placeholder="KUPON"
              className="flex-1 rounded-lg border border-brand-200 px-2 py-1.5 text-sm font-mono uppercase"
            />
            <Button type="button" variant="secondary" size="sm" onClick={onApplyCoupon} disabled={couponLoading}>
              {couponLoading ? '...' : 'Uygula'}
            </Button>
          </div>
        )}
        {couponError && <p className="text-xs text-red-600">{couponError}</p>}
        {couponApplied && (
          <p className="text-xs text-emerald-700">{couponApplied.label}</p>
        )}
      </div>

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
        {parts.length > 0
          ? parts.map((p) => (
              <div key={`${p.type}-${p.label}`} className="flex justify-between text-emerald-700">
                <dt className="pr-2">{p.label}</dt>
                <dd className="font-semibold shrink-0">-{formatPrice(p.amount)}</dd>
              </div>
            ))
          : discount.discountAmount > 0 && (
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
