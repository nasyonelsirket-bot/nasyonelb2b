import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Truck,
  Percent,
  Zap,
  ArrowRight,
  Gift,
  CreditCard,
  MessageCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/whatsapp';
import { FREE_SHIPPING_THRESHOLD_TL } from '@/utils/cartShipping';

const PERKS = [
  {
    icon: Percent,
    label: "%50'ye varan indirim",
    sub: 'Kampanya fiyatları',
    cardClass:
      'bg-gradient-to-br from-red-500/25 to-orange-500/20 border-red-400/40 hover:from-red-500/35',
    iconClass: 'text-orange-300',
  },
  {
    icon: Truck,
    label: `${FREE_SHIPPING_THRESHOLD_TL} TL kargo bedava`,
    sub: 'Altı 100 TL kargo',
    cardClass:
      'bg-gradient-to-br from-emerald-500/25 to-teal-500/20 border-emerald-400/40 hover:from-emerald-500/35',
    iconClass: 'text-emerald-300',
  },
  {
    icon: CreditCard,
    label: 'Güvenli ödeme',
    sub: 'PayTR · kredi kartı',
    cardClass:
      'bg-gradient-to-br from-sky-500/25 to-blue-600/20 border-sky-400/40 hover:from-sky-500/35',
    iconClass: 'text-sky-300',
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp sipariş',
    sub: 'Hızlı onay',
    cardClass:
      'bg-gradient-to-br from-[#25D366]/30 to-emerald-600/20 border-[#25D366]/50 hover:from-[#25D366]/40',
    iconClass: 'text-[#7dffb8]',
  },
];

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
      <div className="rounded-2xl border-2 border-orange-400/50 bg-gradient-to-br from-brand-950 via-[#0f2847] to-brand-800 p-5 sm:p-8 shadow-xl shadow-orange-900/20 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/25 blur-3xl" />
        <div className="absolute -left-6 bottom-0 h-32 w-32 rounded-full bg-emerald-500/25 blur-2xl" />
        <div className="absolute right-1/4 top-1/2 h-24 w-24 rounded-full bg-accent-gold/15 blur-2xl" />

        <div className="relative z-10">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500/30 to-amber-500/30 border border-orange-400/50 px-3 py-1 text-xs font-bold text-amber-200 uppercase tracking-wide">
            <Zap className="h-3.5 w-3.5 text-yellow-300" />
            Hızlı sipariş
          </p>
          <h2 className="mt-3 font-display text-xl sm:text-3xl font-bold text-white drop-shadow-sm">
            Sepetinizi görün, hemen tamamlayın
          </h2>
          <p className="mt-2 text-sm sm:text-base text-brand-100/95 max-w-2xl">
            {thresholdLabel} üzeri <strong className="text-emerald-300">kargo bedava</strong> ·{' '}
            <strong className="text-sky-300">güvenli kart ödemesi</strong> ·{' '}
            <strong className="text-[#7dffb8]">hızlı sipariş</strong>
          </p>

          <div className="mt-5 flex flex-col sm:flex-row flex-wrap gap-3">
            <Button
              type="button"
              variant="gold"
              size="lg"
              className="w-full sm:w-auto min-h-[52px] text-base shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/40"
              onClick={onOpenCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {hasItems ? `Sepetimi gör (${totalItems})` : 'Sepetimi aç'}
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Link to="/sepet" className="w-full sm:w-auto">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-semibold min-h-[52px] bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/40 hover:from-emerald-400 hover:to-teal-500 ring-2 ring-emerald-400/50 transition-all duration-200"
              >
                <CreditCard className="h-5 w-5" />
                {hasItems ? `${formatPrice(totalPrice)} — Ödemeye geç` : 'Ödemeye geç'}
              </button>
            </Link>

            <a href="/#urunler" className="w-full sm:w-auto">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-semibold min-h-[52px] bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/35 hover:from-orange-400 hover:to-amber-400 ring-2 ring-orange-400/40 transition-all duration-200"
              >
                <Gift className="h-5 w-5" />
                Fırsat ürünleri
              </button>
            </a>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {PERKS.map(({ icon: Icon, label, sub, cardClass, iconClass }) => (
              <button
                key={label}
                type="button"
                onClick={onOpenCart}
                className={`text-left rounded-xl border px-3 py-3 transition-all duration-200 touch-manipulation ${cardClass}`}
              >
                <Icon className={`h-5 w-5 mb-1.5 ${iconClass}`} />
                <p className="text-xs sm:text-sm font-bold text-white leading-tight">{label}</p>
                <p className="text-[10px] sm:text-xs text-brand-100/80 mt-0.5">{sub}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
