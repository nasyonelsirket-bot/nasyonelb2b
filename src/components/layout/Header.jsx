import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, Package, MessageCircle, Users } from 'lucide-react';
import CategoryMegaMenu from '@/components/layout/CategoryMegaMenu';
import TopAnnouncementBar from '@/components/layout/TopAnnouncementBar';
import HeaderTrustBar from '@/components/layout/HeaderTrustBar';
import HeaderSearch from '@/components/layout/HeaderSearch';
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

const mobileNavClass =
  'block py-3 px-1 text-base font-medium border-b border-brand-50 text-gray-700 hover:text-brand-900';

function whatsAppHref(number) {
  const phone = String(number || '').replace(/\D/g, '');
  return phone ? `https://wa.me/${phone}` : null;
}

export default function Header() {
  const { settings } = useStore();
  const { totalItems, cartAnimating } = useCart();
  const { isLoggedIn, member } = useMember();
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const [mobileOpen, setMobileOpen] = useState(false);

  const logoSrc = resolveLogoUrl(settings.logoUrl);
  const waLink = whatsAppHref(settings.whatsappNumber);

  const navClass = ({ isActive }) =>
    `text-sm font-medium transition-colors pb-0.5 border-b-2 ${
      isActive
        ? 'text-brand-900 border-accent-gold'
        : 'text-gray-600 border-transparent hover:text-brand-800 hover:border-brand-200'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-brand-100 shadow-sm">
      <TopAnnouncementBar />
      <HeaderTrustBar />

      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 py-2 sm:py-2.5">
          <div className="flex min-h-[3.5rem] sm:min-h-[4.5rem] items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0 max-w-[46%] sm:max-w-none">
              <Link to="/" className="flex items-center shrink-0 min-w-0 py-0.5">
                <img src={logoSrc} alt={settings.siteName || 'Nasyonel'} className="site-logo" />
              </Link>
              <span className="hidden xl:inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-accent-gold/20 to-orange-100 border border-accent-gold/40 px-2.5 py-1 text-[11px] font-bold text-brand-900 whitespace-nowrap">
                <Users className="h-3.5 w-3.5 text-orange-600" />
                100.000+ Mutlu Müşteri
              </span>
            </div>

            <div className="hidden md:flex flex-1 max-w-xl mx-2 lg:mx-4">
              <HeaderSearch />
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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
                className={`relative flex items-center gap-1.5 rounded-full bg-brand-900 px-3 py-2 sm:px-4 text-sm font-semibold text-white hover:bg-brand-800 transition-all shadow-md ${cartAnimating ? 'animate-cart-bounce' : ''}`}
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="hidden sm:inline">Sepet</span>
                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-gold text-xs font-bold text-brand-950">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Link>

              <button
                type="button"
                className="lg:hidden p-2 text-brand-800"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menü"
              >
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
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
          </nav>
        </div>

        {mobileOpen && (
          <nav className="lg:hidden border-t border-brand-100 py-2 flex flex-col pb-4 max-h-[70vh] overflow-y-auto">
            <span className="inline-flex items-center gap-1.5 px-1 py-2 text-xs font-bold text-brand-800">
              <Users className="h-4 w-4 text-orange-500" />
              100.000+ Mutlu Müşteri
            </span>
            {!isHome && (
              <a href="/#urunler" className={mobileNavClass} onClick={() => setMobileOpen(false)}>
                Tüm Ürünler
              </a>
            )}
            <Link to="/kategoriler" className={mobileNavClass} onClick={() => setMobileOpen(false)}>
              Kategoriler
            </Link>
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${mobileNavClass} ${isActive ? 'text-brand-900' : ''}`
                }
                onClick={() => setMobileOpen(false)}
                end={item.end}
              >
                {item.label}
              </NavLink>
            ))}
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`${mobileNavClass} text-[#128C7E] font-semibold`}
                onClick={() => setMobileOpen(false)}
              >
                WhatsApp Destek
              </a>
            )}
            {isLoggedIn ? (
              <Link to="/hesabim" className={mobileNavClass} onClick={() => setMobileOpen(false)}>
                Hesabım {member?.name ? `(${member.name.split(' ')[0]})` : ''}
              </Link>
            ) : (
              <Link to="/giris" className={mobileNavClass} onClick={() => setMobileOpen(false)}>
                Giriş / Üye Ol
              </Link>
            )}
            <Link
              to="/siparis-takip"
              className={mobileNavClass}
              onClick={() => setMobileOpen(false)}
            >
              Sipariş Takip
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
