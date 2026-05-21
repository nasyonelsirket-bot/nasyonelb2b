import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Truck,
  Percent,
  Zap,
  ArrowRight,
  Gift,
  CreditCard,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/whatsapp';
import { FREE_SHIPPING_THRESHOLD_TL } from '@/utils/cartShipping';

export default function HomeShopCTA({ onOpenCart }) {
  const { totalItems, totalPrice } = useCart();
  const hasItems = totalItems > 0;

  const thresholdLabel = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(FREE_SHIPPING_THRESHOLD_TL);

  return (
    <section className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6 animate-fade-in">
      <div className="rounded-2xl border-2 border-accent-gold/40 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-5 sm:p-8 shadow-xl shadow-brand-950/25 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent-gold/20 blur-2xl" />
        <div className="absolute -left-4 bottom-0 h-24 w-24 rounded-full bg-emerald-500/15 blur-xl" />

        <div className="relative z-10">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-accent-gold/20 px-3 py-1 text-xs font-bold text-accent-gold uppercase tracking-wide">
            <Zap className="h-3.5 w-3.5" />
            Hızlı sipariş
          </p>
          <h2 className="mt-3 font-display text-xl sm:text-3xl font-bold text-white">
            Sepetinizi görün, hemen tamamlayın
          </h2>
          <p className="mt-2 text-sm sm:text-base text-brand-100/90 max-w-2xl">
            {thresholdLabel} üzeri <strong className="text-emerald-300">kargo bedava</strong> · Havale ile{' '}
            <strong className="text-accent-gold">%10 ek indirim</strong> · WhatsApp ile onay
          </p>

          <div className="mt-5 flex flex-col sm:flex-row flex-wrap gap-3">
            <Button
              type="button"
              variant="gold"
              size="lg"
              className="w-full sm:w-auto min-h-[52px] text-base shadow-lg"
              onClick={onOpenCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {hasItems ? `Sepetimi gör (${totalItems})` : 'Sepetimi aç'}
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Link to="/sepet" className="w-full sm:w-auto">
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full min-h-[52px] text-base bg-white text-brand-900 hover:bg-brand-50 border-0"
              >
                <CreditCard className="h-5 w-5" />
                {hasItems ? `${formatPrice(totalPrice)} — Ödemeye geç` : 'Ödeme sayfasına git'}
              </Button>
            </Link>

            <a href="/#urunler" className="w-full sm:w-auto">
              <Button type="button" variant="outline" size="lg" className="w-full min-h-[52px] border-white/40 text-white hover:bg-white/10">
                <Gift className="h-5 w-5" />
                Fırsat ürünleri
              </Button>
            </a>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {[
              { icon: Percent, label: '%50\'ye varan indirim', sub: 'Kampanya fiyatları' },
              { icon: Truck, label: '750 TL kargo bedava', sub: 'Altı 100 TL kargo' },
              { icon: CreditCard, label: 'IBAN %10 indirim', sub: 'Havale / EFT' },
              { icon: Zap, label: 'WhatsApp sipariş', sub: 'Hızlı onay' },
            ].map(({ icon: Icon, label, sub }) => (
              <button
                key={label}
                type="button"
                onClick={onOpenCart}
                className="text-left rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-3 transition-colors touch-manipulation"
              >
                <Icon className="h-5 w-5 text-accent-gold mb-1.5" />
                <p className="text-xs sm:text-sm font-bold text-white leading-tight">{label}</p>
                <p className="text-[10px] sm:text-xs text-brand-200 mt-0.5">{sub}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
