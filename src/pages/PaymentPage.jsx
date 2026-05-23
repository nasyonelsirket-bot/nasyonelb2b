import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { CreditCard, ArrowLeft, Lock } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';
import PaymentTrustStrip from '@/components/trust/PaymentTrustStrip';
import { formatPrice } from '@/utils/whatsapp';
import { PAYTR_TRUST_LABEL } from '@/constants/companyInfo';

const PAYTR_POST_URL = 'https://www.paytr.com/odeme';

export default function PaymentPage() {
  const location = useLocation();
  const form = location.state?.form;
  const orderId = location.state?.orderId;
  const orderNumber = location.state?.orderNumber;
  const orderTotal = location.state?.orderTotal;

  const [card, setCard] = useState({
    cc_owner: '',
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
  });

  if (!form) {
    return <Navigate to="/sepet" replace />;
  }

  const handleChange = (key, value) => {
    setCard((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <SEO title="Güvenli Ödeme" path="/odeme" noindex />
      <div className="mx-auto max-w-lg px-4 py-8">
        <Link to="/sepet" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 mb-6">
          <ArrowLeft className="h-4 w-4" /> Sepete dön
        </Link>

        <PaymentTrustStrip className="mb-6" />

        <div className="rounded-2xl border border-brand-200 bg-white p-6 shadow-card">
          <h1 className="font-display text-2xl font-bold text-brand-900 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-accent-gold" />
            Kart ile Öde
          </h1>
          <p className="mt-2 text-sm text-brand-600">
            {orderTotal != null && (
              <span className="font-semibold text-brand-900">Tutar: {formatPrice(orderTotal)}</span>
            )}
            {(orderNumber || orderId) && (
              <span className="block text-xs text-gray-400 mt-1">Sipariş: {orderNumber || orderId}</span>
            )}
          </p>
          <p className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            {PAYTR_TRUST_LABEL} · 256 Bit SSL · 3D Secure
          </p>

          <form action={PAYTR_POST_URL} method="POST" className="mt-6 space-y-4" autoComplete="off">
            {Object.entries(form).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={String(value ?? '')} readOnly />
            ))}

            <div>
              <label className="text-xs font-medium text-brand-800">Kart üzerindeki isim</label>
              <input
                type="text"
                name="cc_owner"
                value={card.cc_owner}
                onChange={(e) => handleChange('cc_owner', e.target.value)}
                placeholder="Ad Soyad"
                className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-brand-800">Kart numarası</label>
              <input
                type="text"
                name="card_number"
                inputMode="numeric"
                value={card.card_number}
                onChange={(e) => handleChange('card_number', e.target.value.replace(/\D/g, '').slice(0, 16))}
                placeholder="0000 0000 0000 0000"
                className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm font-mono tracking-wider focus:ring-2 focus:ring-brand-500/20"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-brand-800">Ay</label>
                <input
                  type="text"
                  name="expiry_month"
                  inputMode="numeric"
                  value={card.expiry_month}
                  onChange={(e) => handleChange('expiry_month', e.target.value.replace(/\D/g, '').slice(0, 2))}
                  placeholder="AA"
                  className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-brand-800">Yıl</label>
                <input
                  type="text"
                  name="expiry_year"
                  inputMode="numeric"
                  value={card.expiry_year}
                  onChange={(e) => handleChange('expiry_year', e.target.value.replace(/\D/g, '').slice(0, 2))}
                  placeholder="YY"
                  className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-brand-800">CVV</label>
                <input
                  type="password"
                  name="cvv"
                  inputMode="numeric"
                  value={card.cvv}
                  onChange={(e) => handleChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="•••"
                  className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20"
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="gold" size="lg" className="w-full mt-2">
              <Lock className="h-5 w-5" />
              Güvenli Ödeme Yap
            </Button>
          </form>

          <PaymentTrustStrip compact className="mt-4" />
        </div>
      </div>
    </>
  );
}
