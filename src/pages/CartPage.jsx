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
import CartRecommendations from '@/components/cart/CartRecommendations';
import CheckoutLegalConsent from '@/components/cart/CheckoutLegalConsent';
import MobileCheckoutStickyBar from '@/components/cart/MobileCheckoutStickyBar';
import CheckoutTrustPanel from '@/components/checkout/CheckoutTrustPanel';
import CheckoutUrgencyBanner from '@/components/checkout/CheckoutUrgencyBanner';
import CheckoutWhatsAppSupport from '@/components/checkout/CheckoutWhatsAppSupport';
import CardBrandIcons from '@/components/checkout/CardBrandIcons';
import PaymentTrustStrip from '@/components/trust/PaymentTrustStrip';
import { mapItemsForOrder, getUpsellSavings, getEffectiveUnitPrice, getCartSubtotal } from '@/utils/cartLinePricing';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { getSiteUrl } from '@/utils/canonicalSiteUrl';
import { useMember } from '@/context/MemberContext';
import {
  resolveCartCustomerPrefill,
  saveCheckoutCustomer,
  isCheckoutCustomerComplete,
  loadSavedCheckoutCustomer,
  EMPTY_CHECKOUT_CUSTOMER,
} from '@/utils/checkoutCustomer';
import { getMinOrderQtyForProduct } from '@/utils/minOrderQty';
import { useCheckoutTotals } from '@/hooks/useCheckoutTotals';
import { buildPaytrPaymentPayload } from '@/utils/cartCheckoutTotals';
import {
  HIGH_VALUE_DISCOUNT_THRESHOLD_TL,
  HIGH_VALUE_DISCOUNT_LABEL,
  FREE_SHIPPING_LABEL,
  FREE_SHIPPING_SUBLABEL,
} from '@/constants/commerceCopy';
import { normalizePromotions } from '@/utils/promotions';
import { validateCouponRemote } from '@/services/promotionApi';
import { fieldId } from '@/utils/formFieldId';
import { formatPrice } from '@/utils/whatsapp';
import { startPaytrPayment } from '@/services/paytrApi';
import { persistPurchaseAnalytics } from '@/utils/paytrPaymentSession';
import {
  trackBeginCheckout,
  trackFormView,
  trackFormStart,
  trackFormSubmit,
} from '@/lib/analytics/ga4';
import { trackMetaInitiateCheckout } from '@/lib/analytics/meta';

const STEPS = [
  { id: 1, label: 'Sepet', icon: ShoppingBag },
  { id: 2, label: 'Teslimat', icon: MapPin },
  { id: 3, label: 'Ödeme', icon: CreditCard },
];

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeFromCart, setQuantity, increment, decrement, clearCart } = useCart();
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

  const checkoutTotals = useCheckoutTotals({
    items,
    promotions: promos,
    couponResult: couponApplied,
  });
  const { discount, shipping, finalTotal: orderTotal, minQtyCheck } = checkoutTotals;

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
    const userData = loadSavedCheckoutCustomer() || customer;
    trackBeginCheckout(items);
    trackMetaInitiateCheckout(items, { userData });
  }, [items, customer]);

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
        subtotal: getCartSubtotal(items),
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
    if (!minQtyCheck.ok) {
      setFormError(minQtyCheck.summary || 'Minimum sipariş adedi kuralları sağlanmıyor.');
      return;
    }
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
    if (!minQtyCheck.ok) {
      setFormError(minQtyCheck.summary || 'Minimum sipariş adedi kuralları sağlanmıyor.');
      setStep(1);
      return;
    }
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
      const paymentPayload = buildPaytrPaymentPayload({
        settings: {
          siteName: settings.siteName || 'Nasyonel Toys',
          siteUrl: getSiteUrl(settings),
          siteLogoUrl: settings.logoUrl,
          pdfSettings: settings.pdfSettings,
          contactEmail: settings.contactEmail,
        },
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          email: customer.email.trim(),
          address: customer.address.trim(),
          city: customer.city.trim(),
          district: customer.district.trim(),
        },
        items,
        checkoutTotals,
        couponCode: discount.couponCode || undefined,
      });

      const result = await startPaytrPayment(paymentPayload);
      saveCheckoutCustomer(customer);
      trackFormSubmit(items, { success: true });
      persistPurchaseAnalytics(result.orderId, {
        items: mapItemsForOrder(items),
        value: orderTotal,
        orderNumber: result.orderNumber,
        userData: customer,
      });
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
      <div className="checkout-shell w-full bg-gradient-to-b from-brand-50/40 via-white to-white">
        <div className="checkout-shell__main mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8 animate-fade-in">
        <CheckoutUrgencyBanner className="mb-5" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900">Güvenli Ödeme</h1>
            <p className="mt-1 text-sm text-brand-600">256 Bit SSL · PayTR güvencesi · Hızlı kargo</p>
          </div>
          <CheckoutTrustPanel compact className="sm:max-w-xs shrink-0" />
        </div>

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

        <div className="mt-4 space-y-3">
          <FreeShippingBanner subtotal={discount.subtotal} />
          {!minQtyCheck.ok && (
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              {minQtyCheck.summary}
            </p>
          )}
          {discount.highValueDiscountEarned && (
            <p className="text-sm text-violet-900 bg-violet-50 border border-violet-200 rounded-xl px-3 py-2.5 font-medium">
              {HIGH_VALUE_DISCOUNT_LABEL}
            </p>
          )}
          {!discount.highValueDiscountEarned && discount.highValueDiscountRemaining > 0 && (
            <p className="text-sm text-brand-800 bg-brand-50 border border-brand-100 rounded-xl px-3 py-2.5">
              {formatPrice(discount.highValueDiscountRemaining)} daha ekleyin — {HIGH_VALUE_DISCOUNT_THRESHOLD_TL} TL üzeri ekstra %5 indirim
            </p>
          )}
        </div>

        <div className="mt-8 checkout-grid grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="checkout-summary-column order-1 lg:order-2 lg:col-span-1 space-y-4">
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

            <CheckoutTrustPanel className="hidden lg:block" />

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

          <div className="checkout-form-column order-2 lg:order-1 lg:col-span-2 space-y-4">
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
                          <h3 className="font-semibold text-brand-900 line-clamp-2">{item.name}</h3>
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
                              minQty={getMinOrderQtyForProduct(item).minQty}
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
                <CartRecommendations />
              </div>
            )}

            {step === 2 && (
              <div
                className="rounded-2xl border border-brand-200 bg-white p-5 sm:p-6 shadow-card space-y-4 animate-slide-up"
                onFocusCapture={handleFormStart}
              >
                <h2 className="font-display font-bold text-brand-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-accent-gold" /> Teslimat adresi
                </h2>
                {customerPrefillSource && hasSavedCustomer && (
                  <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    {customerPrefillSource === 'member'
                      ? 'Kayıtlı adresiniz yüklendi — isterseniz düzenleyin.'
                      : 'Son sipariş bilgileriniz yüklendi — isterseniz düzenleyin.'}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {DELIVERY_FIELDS.map(({ key, label, type, autoComplete, half }) => {
                    const inputId = fieldId('checkout', key);
                    const fieldWrapClass = half ? 'sm:col-span-1' : 'sm:col-span-2';
                    return (
                      <div key={key} className={fieldWrapClass}>
                        <label htmlFor={inputId} className="text-xs font-medium text-brand-800">
                          {label}
                        </label>
                        {type === 'textarea' ? (
                          <textarea
                            id={inputId}
                            rows={3}
                            value={customer[key]}
                            onChange={(e) => setCustomer({ ...customer, [key]: e.target.value })}
                            placeholder="Mahalle, sokak, bina no, daire"
                            className="mt-1 w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20"
                            required
                          />
                        ) : (
                          <input
                            id={inputId}
                            type={type}
                            value={customer[key]}
                            onChange={(e) => setCustomer({ ...customer, [key]: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20"
                            required
                            autoComplete={autoComplete}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-slide-up">
                <h2 className="font-display font-bold text-brand-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-accent-gold" /> Kart ile güvenli ödeme
                </h2>

                <div className="rounded-2xl border-2 border-brand-600 bg-gradient-to-br from-brand-50 via-orange-50/40 to-emerald-50/30 p-5 ring-2 ring-brand-200">
                  <div className="flex items-center gap-2 text-brand-900 font-bold">
                    <CreditCard className="h-5 w-5 text-accent-gold" />
                    Kredi / Banka Kartı
                  </div>
                  <p className="mt-2 text-sm text-brand-700 leading-relaxed">
                    Kapıda ödeme yok — kart bilgileriniz yalnızca PayTR güvenli ekranında girilir.
                  </p>
                  <p className="mt-3 text-2xl font-bold text-brand-900">{formatPrice(orderTotal)}</p>
                  <div className="mt-4">
                    <CardBrandIcons size="sm" />
                  </div>
                </div>

                <PaymentTrustStrip />

                <CheckoutLegalConsent
                  accepted={legalAccepted}
                  onChange={setLegalAccepted}
                  error={!legalAccepted && formError.includes('sözleşme') ? formError : ''}
                />
              </div>
            )}

            <CheckoutTrustPanel className="lg:hidden" />
            <CheckoutWhatsAppSupport />
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
          trustHint={step >= 3 ? '256 Bit SSL · PayTR Güvencesi' : 'Hızlı kargo · İade desteği'}
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

function CouponFields({
  couponApplied,
  couponInput,
  onCouponInput,
  onApplyCoupon,
  onRemoveCoupon,
  couponError,
  couponLoading,
}) {
  if (couponApplied) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-emerald-900 font-mono font-bold tracking-wide">
            {couponApplied.coupon?.code}
          </span>
          <button
            type="button"
            onClick={onRemoveCoupon}
            className="text-xs font-semibold text-red-600 hover:text-red-700"
          >
            Kaldır
          </button>
        </div>
        <p className="text-xs text-emerald-800 leading-relaxed">{couponApplied.label}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={couponInput}
          onChange={(e) => onCouponInput(e.target.value.toUpperCase())}
          placeholder="Kupon kodu"
          className="flex-1 min-w-0 rounded-xl border border-brand-200 bg-brand-50/40 px-3 py-2.5 text-sm font-mono uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:font-sans focus:ring-2 focus:ring-brand-500/15 focus:border-brand-300"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onApplyCoupon}
          disabled={couponLoading}
          className="shrink-0 px-4"
        >
          {couponLoading ? '...' : 'Uygula'}
        </Button>
      </div>
      {couponError && <p className="text-xs font-medium text-red-600">{couponError}</p>}
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
  const itemCount = items.reduce((n, i) => n + (i.quantity || 1), 0);

  return (
    <div className="checkout-order-summary rounded-2xl border border-brand-200/90 bg-gradient-to-br from-brand-50 via-white to-white p-5 sm:p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-brand-900 flex items-center gap-2">
          <Truck className="h-5 w-5 text-accent-gold shrink-0" aria-hidden />
          Sipariş Özeti
        </h2>
        <span className="text-xs font-semibold text-brand-700 bg-white border border-brand-100 rounded-full px-2.5 py-1 shrink-0 tabular-nums">
          {itemCount} ürün
        </span>
      </div>

      {shipping.eligible && (
        <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-teal-50/60 px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
            <Truck className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-emerald-900 leading-tight">{FREE_SHIPPING_LABEL}</p>
            <p className="text-[11px] sm:text-xs text-emerald-800/90 mt-0.5 leading-snug">
              {FREE_SHIPPING_SUBLABEL}
            </p>
          </div>
        </div>
      )}

      <p className="mt-4 text-xl font-extrabold text-brand-900 tabular-nums tracking-tight md:hidden">
        {formatPrice(orderTotal)}
      </p>

      <details className="checkout-coupon-mobile mt-4 rounded-xl border border-brand-100 bg-white md:hidden">
        <summary className="cursor-pointer list-none px-3.5 py-3 text-sm font-semibold text-brand-800 flex items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-1.5">
            <Ticket className="h-4 w-4 text-brand-600 shrink-0" aria-hidden />
            Kupon kodunuz var mı?
          </span>
          <span className="text-brand-400 text-xs font-bold" aria-hidden>
            ▾
          </span>
        </summary>
        <div className="px-3.5 pb-3.5 pt-0 border-t border-brand-50">
          <CouponFields
            couponApplied={couponApplied}
            couponInput={couponInput}
            onCouponInput={onCouponInput}
            onApplyCoupon={onApplyCoupon}
            onRemoveCoupon={onRemoveCoupon}
            couponError={couponError}
            couponLoading={couponLoading}
          />
        </div>
      </details>

      <div className="checkout-coupon-desktop mt-5 hidden md:block rounded-xl border border-brand-100 bg-white p-4">
        <p className="text-sm font-semibold text-brand-900 flex items-center gap-1.5 mb-3">
          <Ticket className="h-4 w-4 text-brand-600 shrink-0" aria-hidden />
          Kupon kodu
        </p>
        <CouponFields
          couponApplied={couponApplied}
          couponInput={couponInput}
          onCouponInput={onCouponInput}
          onApplyCoupon={onApplyCoupon}
          onRemoveCoupon={onRemoveCoupon}
          couponError={couponError}
          couponLoading={couponLoading}
        />
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between gap-3 text-brand-600">
          <dt className="font-medium">Ara toplam</dt>
          <dd className="font-semibold text-brand-900 tabular-nums">{formatPrice(discount.subtotal)}</dd>
        </div>
        {upsellSave > 0 && (
          <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 leading-relaxed">
            Öneri ürün indirimi ile {formatPrice(upsellSave)} tasarruf (ara toplama dahil)
          </p>
        )}
        {parts.length > 0
          ? parts.map((p) => (
              <div key={`${p.type}-${p.label}`} className="flex justify-between gap-3 text-emerald-700">
                <dt className="pr-2 font-medium leading-snug">{p.label}</dt>
                <dd className="font-bold shrink-0 tabular-nums">-{formatPrice(p.amount)}</dd>
              </div>
            ))
          : discount.discountAmount > 0 && (
              <div className="flex justify-between gap-3 text-emerald-700">
                <dt className="font-medium">{discount.tierLabel}</dt>
                <dd className="font-bold tabular-nums">-{formatPrice(discount.discountAmount)}</dd>
              </div>
            )}
        <div className="flex justify-between gap-3 items-center text-brand-800 pt-0.5">
          <dt className="font-medium">Kargo</dt>
          <dd>
            {shipping.eligible ? (
              <span className="inline-flex items-center rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                {FREE_SHIPPING_LABEL}
              </span>
            ) : (
              <span className="font-bold tabular-nums">{formatPrice(shipping.shippingFee)}</span>
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-brand-200 pt-3 mt-1">
          <dt className="text-base font-bold text-brand-900">Toplam</dt>
          <dd className="text-xl font-extrabold text-brand-800 tabular-nums tracking-tight">
            {formatPrice(orderTotal)}
          </dd>
        </div>
      </dl>
      <KdvNotice className="mt-4 text-xs" />
      {discount.upsellMessage && (
        <p className="mt-3 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 leading-relaxed">
          {discount.upsellMessage}
        </p>
      )}
    </div>
  );
}
