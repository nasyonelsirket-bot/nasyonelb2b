import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, ShoppingCart, User, Package, MessageCircle, Users } from 'lucide-react';
import CategoryMegaMenu from '@/components/layout/CategoryMegaMenu';
import MobileCategoryDrawer from '@/components/layout/MobileCategoryDrawer';
import TopAnnouncementBar from '@/components/layout/TopAnnouncementBar';
import HeaderTrustBar from '@/components/layout/HeaderTrustBar';
import HeaderSearch from '@/components/layout/HeaderSearch';
import { HEADER_LEGAL_LINKS } from '@/constants/siteLinks';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import { useMember } from '@/context/MemberContext';
import { resolveLogoUrl } from '@/utils/resolveLogoUrl';

const NAV = [
  { to: '/', label: 'Ana Sayfa', end: true },
  { to: '/en-cok-satanlar', label: 'En Çok Satanlar', end: false },
  { to: '/hakkimizda', label: 'Hakkımızda', end: false },
  { to: '/iletisim', label: 'İletişim', end: false },
];

function whatsAppHref(number) {
  const phone = String(number || '').replace(/\D/g, '');
  return phone ? `https://wa.me/${phone}` : null;
}

export default function Header() {
  const { settings } = useStore();
  const { totalItems, cartAnimating } = useCart();
  const { isLoggedIn } = useMember();
  const [menuOpen, setMenuOpen] = useState(false);

  const logoSrc = resolveLogoUrl(settings.logoUrl);
  const waLink = whatsAppHref(settings.whatsappNumber);

  const navClass = ({ isActive }) =>
    `text-sm font-medium transition-colors pb-0.5 border-b-2 ${
      isActive
        ? 'text-brand-900 border-accent-gold'
        : 'text-gray-600 border-transparent hover:text-brand-800 hover:border-brand-200'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-brand-100 shadow-sm">
      <TopAnnouncementBar />
      <HeaderTrustBar />

      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 py-2 sm:py-2.5">
          <div className="grid grid-cols-[auto_1fr_auto] lg:flex lg:min-h-[4.5rem] items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="lg:hidden p-2 -ml-1 text-brand-800 rounded-lg hover:bg-brand-50 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setMenuOpen(true)}
              aria-label="Kategori menüsü"
            >
              <Menu className="h-6 w-6" />
            </button>

            <Link
              to="/"
              className="flex items-center justify-center lg:justify-start shrink-0 min-w-0 py-0.5 mx-auto lg:mx-0 lg:max-w-none max-w-[180px] sm:max-w-[220px]"
            >
              <img src={logoSrc} alt={settings.siteName || 'Nasyonel'} className="site-logo max-h-12 sm:max-h-14" />
            </Link>

            <div className="hidden lg:flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
              <span className="hidden xl:inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-accent-gold/20 to-orange-100 border border-accent-gold/40 px-2.5 py-1 text-[11px] font-bold text-brand-900 whitespace-nowrap">
                <Users className="h-3.5 w-3.5 text-orange-600" />
                100.000+ Mutlu Müşteri
              </span>
            </div>

            <div className="hidden md:flex flex-1 max-w-xl mx-2 lg:mx-4">
              <HeaderSearch />
            </div>

            <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0 col-start-3 lg:col-auto">
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center justify-center rounded-full bg-[#25D366] p-2.5 text-white hover:bg-[#20bd5a] shadow-md transition-transform hover:scale-105"
                  aria-label="WhatsApp ile yazın"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              )}
              <Link
                to="/siparis-takip"
                className="hidden lg:inline-flex items-center gap-1 rounded-full border border-brand-200 px-3 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50"
              >
                <Package className="h-4 w-4" />
                Sipariş Takip
              </Link>
              {isLoggedIn ? (
                <Link
                  to="/hesabim"
                  className="hidden lg:inline-flex items-center gap-1 rounded-full border border-brand-200 px-3 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50 max-w-[140px]"
                >
                  <User className="h-4 w-4 shrink-0" />
                  <span className="truncate">Hesabım</span>
                </Link>
              ) : (
                <Link
                  to="/giris"
                  className="hidden lg:inline-flex items-center gap-1 rounded-full border border-brand-200 px-3 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50"
                >
                  <User className="h-4 w-4" />
                  Giriş / Üye Ol
                </Link>
              )}

              <Link
                to="/sepet"
                className={`relative flex items-center justify-center rounded-full bg-brand-900 p-2.5 sm:px-4 sm:py-2 sm:gap-1.5 text-sm font-semibold text-white hover:bg-brand-800 transition-all shadow-md min-h-[44px] min-w-[44px] sm:min-w-0 ${cartAnimating ? 'animate-cart-bounce' : ''}`}
                aria-label={`Sepet${totalItems > 0 ? `, ${totalItems} ürün` : ''}`}
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="hidden sm:inline">Sepet</span>
                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-gold text-xs font-bold text-brand-950">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>

          <div className="md:hidden pb-1">
            <HeaderSearch />
          </div>

          <nav className="hidden lg:flex items-center gap-5 pb-1 border-t border-brand-50 pt-2">
            <CategoryMegaMenu />
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass} end={item.end}>
                {item.label}
              </NavLink>
            ))}
            <span className="ml-auto hidden xl:flex items-center gap-3 text-[11px] text-gray-500">
              {HEADER_LEGAL_LINKS.slice(0, 3).map((link) => (
                <Link key={link.path} to={link.path} className="hover:text-brand-800 hover:underline whitespace-nowrap">
                  {link.label}
                </Link>
              ))}
              <Link to="/iletisim" className="hover:text-brand-800 hover:underline whitespace-nowrap">
                İletişim
              </Link>
            </span>
          </nav>
        </div>
      </div>

      <MobileCategoryDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
