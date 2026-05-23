import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, ShoppingCart, User, MessageCircle } from 'lucide-react';
import CategoryMegaMenu from '@/components/layout/CategoryMegaMenu';
import MobileCategoryDrawer from '@/components/layout/MobileCategoryDrawer';
import TopAnnouncementBar from '@/components/layout/TopAnnouncementBar';
import HeaderTrustBar from '@/components/layout/HeaderTrustBar';
import HeaderSearch from '@/components/layout/HeaderSearch';
import { BrandLogoLink } from '@/components/brand/BrandLogo';
import { HEADER_LEGAL_LINKS } from '@/constants/siteLinks';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import { useMember } from '@/context/MemberContext';
import { formatPrice } from '@/utils/whatsapp';

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
  const { totalItems, totalPrice, cartAnimating } = useCart();
  const { isLoggedIn } = useMember();
  const [menuOpen, setMenuOpen] = useState(false);

  const waLink = whatsAppHref(settings.whatsappNumber);
  const siteName = settings.siteName || 'Nasyonel Toys';

  const navClass = ({ isActive }) =>
    `text-sm font-medium transition-colors pb-0.5 border-b-2 ${
      isActive
        ? 'text-brand-900 border-accent-gold'
        : 'text-gray-600 border-transparent hover:text-brand-800 hover:border-brand-200'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white border-b-[3px] border-accent-gold shadow-sm">
      <TopAnnouncementBar />
      <HeaderTrustBar />

      <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-8">
        {/* Ana satır — referans mockup düzeni */}
        <div className="flex min-h-[4.25rem] lg:min-h-[4.75rem] items-center gap-2 sm:gap-3 lg:gap-4 py-2 lg:py-2.5">
          <button
            type="button"
            className="lg:hidden flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-900 text-white shadow-md hover:bg-brand-800 transition-colors touch-manipulation"
            onClick={() => setMenuOpen(true)}
            aria-label="Kategori menüsü"
          >
            <Menu className="h-5 w-5" strokeWidth={2.5} />
          </button>

          <BrandLogoLink
            logoUrl={settings.logoUrl}
            siteName={siteName}
            className="shrink-0 min-w-0 lg:mr-1"
          />

          <div className="hidden md:flex flex-1 min-w-0 max-w-2xl mx-auto lg:mx-4">
            <HeaderSearch variant="pill" />
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0">
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium text-brand-800 hover:bg-brand-50 transition-colors"
                aria-label="WhatsApp destek hattı"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <span className="hidden xl:inline leading-tight">
                  WhatsApp
                  <br />
                  <span className="text-xs font-normal text-gray-500">Destek Hattı</span>
                </span>
              </a>
            )}

            {isLoggedIn ? (
              <Link
                to="/hesabim"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium text-brand-800 hover:bg-brand-50 max-w-[140px]"
              >
                <User className="h-5 w-5 shrink-0 text-brand-700" />
                <span className="hidden lg:inline truncate">Hesabım</span>
              </Link>
            ) : (
              <Link
                to="/giris"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium text-brand-800 hover:bg-brand-50"
              >
                <User className="h-5 w-5 shrink-0 text-brand-700" />
                <span className="hidden lg:inline whitespace-nowrap">Giriş / Üye Ol</span>
              </Link>
            )}

            <Link
              to="/sepet"
              className={`relative inline-flex items-center gap-2 rounded-full px-1 sm:px-2 py-1 hover:bg-brand-50 transition-colors ${cartAnimating ? 'animate-cart-bounce' : ''}`}
              aria-label={`Sepet${totalItems > 0 ? `, ${totalItems} ürün` : ''}`}
            >
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 text-white shadow-md">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-gold px-1 text-[10px] font-bold text-brand-950">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </span>
              <span className="hidden lg:flex flex-col leading-tight text-left">
                <span className="text-sm font-semibold text-brand-900">Sepetim</span>
                <span className="text-xs font-bold text-brand-700 tabular-nums">
                  {totalItems > 0 ? formatPrice(totalPrice) : formatPrice(0)}
                </span>
              </span>
            </Link>
          </div>
        </div>

        <div className="md:hidden pb-2">
          <HeaderSearch variant="pill" />
        </div>

        <nav className="hidden lg:flex items-center gap-5 pb-2 border-t border-brand-100/80 pt-2">
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

      <MobileCategoryDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
