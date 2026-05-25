import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { CreditCard, ArrowLeft, Lock, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';
import CardScanButton from '@/components/payment/CardScanButton';
import { formatPrice } from '@/utils/whatsapp';
import { PAYTR_TRUST_LABEL } from '@/constants/companyInfo';
import { submitPaytrPayment } from '@/utils/paytrSubmit';

const CARD_BRANDS = ['VISA', 'MASTERCARD', 'TROY'];

function formatCardNumber(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export default function PaymentPage() {
  const location = useLocation();
  const orderId = location.state?.orderId;
  const orderNumber = location.state?.orderNumber;
  const orderTotal = location.state?.orderTotal;

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [card, setCard] = useState({
    cc_owner: '',
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
  });

  if (!orderId) {
    return <Navigate to="/sepet" replace />;
  }

  const handleChange = (key, value) => {
    setCard((prev) => ({ ...prev, [key]: value }));
  };

  const handleScan = (parsed) => {
    setCard((prev) => ({
      ...prev,
      cc_owner: parsed.cc_owner || prev.cc_owner,
      card_number: parsed.card_number || prev.card_number,
      expiry_month: parsed.expiry_month || prev.expiry_month,
      expiry_year: parsed.expiry_year || prev.expiry_year,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      submitPaytrPayment(orderId, card);
    } catch (err) {
      setFormError(err?.message || 'Ödeme gönderilemedi.');
      setSubmitting(false);
    }
  };

  const displayNumber = formatCardNumber(card.card_number) || '•••• •••• •••• ••••';

  return (
    <>
      <SEO title="Güvenli Ödeme" path="/odeme" noindex />
      <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-brand-50 via-orange-50/40 to-emerald-50/30 py-6 sm:py-10">
        <div className="mx-auto max-w-lg px-4">
          <Link
            to="/sepet"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-900 mb-5"
          >
            <ArrowLeft className="h-4 w-4" /> Sepete dön
          </Link>

          <div className="rounded-3xl border border-white/80 bg-white/90 backdrop-blur-sm shadow-xl overflow-hidden">
            <div className="relative bg-gradient-to-br from-brand-900 via-brand-800 to-accent-gold px-5 py-6 text-white overflow-hidden">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden />
              <div className="absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-accent-gold/20 blur-xl" aria-hidden />
              <div className="relative">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent-gold" />
                    <span className="text-sm font-semibold text-brand-100">Güvenli ödeme</span>
                  </div>
                  <div className="flex gap-1.5">
                    {CARD_BRANDS.map((brand) => (
                      <span
                        key={brand}
                        className="rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-bold tracking-wide"
                      >
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm shadow-inner">
                  <p className="text-xs uppercase tracking-[0.2em] text-brand-200 mb-3">Kart önizleme</p>
                  <p className="font-mono text-lg sm:text-xl tracking-[0.15em] mb-4">{displayNumber}</p>
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase text-brand-200">Kart sahibi</p>
                      <p className="text-sm font-semibold truncate">
                        {card.cc_owner.trim() || 'AD SOYAD'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] uppercase text-brand-200">SKT</p>
                      <p className="text-sm font-semibold font-mono">
                        {(card.expiry_month || 'AA').padStart(2, '0')}/
                        {(card.expiry_year || 'YY').padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <h1 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
                    <CreditCard className="h-6 w-6 text-accent-gold" />
                    Kart ile Öde
                  </h1>
                  {orderTotal != null && (
                    <p className="text-2xl font-bold text-accent-gold tabular-nums">{formatPrice(orderTotal)}</p>
                  )}
                </div>
                {(orderNumber || orderId) && (
                  <p className="mt-1 text-xs text-brand-200">Sipariş: {orderNumber || orderId}</p>
                )}
              </div>
            </div>

            <form
              className="p-5 sm:p-6 space-y-4"
              autoComplete="off"
              onSubmit={handleSubmit}
            >
              {formError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {formError}
                </p>
              )}

              <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 px-3 py-2.5 flex items-center gap-2 text-xs text-emerald-800">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{PAYTR_TRUST_LABEL} · 256 Bit SSL · 3D Secure</span>
              </div>

              <CardScanButton onScan={handleScan} />

              <div>
                <label className="text-xs font-semibold text-brand-800">Kart üzerindeki isim</label>
                <input
                  type="text"
                  autoComplete="cc-name"
                  value={card.cc_owner}
                  onChange={(e) => handleChange('cc_owner', e.target.value.toUpperCase())}
                  placeholder="AD SOYAD"
                  className="mt-1.5 w-full rounded-xl border-2 border-brand-100 bg-brand-50/50 px-4 py-3 text-sm font-medium uppercase tracking-wide focus:border-accent-gold focus:bg-white focus:ring-4 focus:ring-accent-gold/20 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-800">Kart numarası</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={formatCardNumber(card.card_number)}
                  onChange={(e) => handleChange('card_number', e.target.value.replace(/\D/g, '').slice(0, 16))}
                  placeholder="0000 0000 0000 0000"
                  className="mt-1.5 w-full rounded-xl border-2 border-brand-100 bg-gradient-to-r from-brand-50 to-orange-50/60 px-4 py-3 text-sm font-mono tracking-[0.12em] focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-200 outline-none transition-all"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-brand-800">Ay</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp-month"
                    value={card.expiry_month}
                    onChange={(e) => handleChange('expiry_month', e.target.value.replace(/\D/g, '').slice(0, 2))}
                    placeholder="AA"
                    className="mt-1.5 w-full rounded-xl border-2 border-brand-100 bg-brand-50/50 px-3 py-3 text-sm text-center font-mono focus:border-accent-gold focus:bg-white focus:ring-4 focus:ring-accent-gold/20 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-800">Yıl</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp-year"
                    value={card.expiry_year}
                    onChange={(e) => handleChange('expiry_year', e.target.value.replace(/\D/g, '').slice(0, 2))}
                    placeholder="YY"
                    className="mt-1.5 w-full rounded-xl border-2 border-brand-100 bg-brand-50/50 px-3 py-3 text-sm text-center font-mono focus:border-accent-gold focus:bg-white focus:ring-4 focus:ring-accent-gold/20 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-800">CVV</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={card.cvv}
                    onChange={(e) => handleChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="•••"
                    className="mt-1.5 w-full rounded-xl border-2 border-brand-100 bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-3 text-sm text-center font-mono focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-200 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="gold"
                size="lg"
                disabled={submitting}
                className="w-full mt-2 shadow-lg shadow-accent-gold/30 hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-70"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
                {submitting ? 'PayTR\'ye yönlendiriliyor…' : 'Güvenli Ödeme Yap'}
              </Button>

              <p className="text-center text-[11px] text-gray-500 pt-1">
                Kart bilgileriniz doğrudan PayTR&apos;ye iletilir; sitemizde saklanmaz. 3D Secure doğrulaması sonrası ödeme tamamlanır.
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
