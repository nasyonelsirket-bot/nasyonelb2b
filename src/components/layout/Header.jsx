import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, ShoppingCart, Search } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import { resolveLogoUrl } from '@/utils/resolveLogoUrl';

const NAV = [
  { to: '/', label: 'Ana Sayfa', end: true },
  { to: '/kategoriler', label: 'Kategoriler', end: false },
  { to: '/hakkimizda', label: 'Hakkımızda', end: false },
  { to: '/iletisim', label: 'İletişim', end: false },
];

const mobileNavClass =
  'block py-3 px-1 text-base font-medium border-b border-brand-50 text-gray-700 hover:text-brand-900';

export default function Header() {
  const { settings } = useStore();
  const { totalItems, cartAnimating } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');

  const logoSrc = resolveLogoUrl(settings.logoUrl);

  const navClass = ({ isActive }) =>
    `text-sm font-medium transition-colors pb-0.5 border-b-2 ${
      isActive
        ? 'text-brand-900 border-accent-gold'
        : 'text-gray-600 border-transparent hover:text-brand-800 hover:border-brand-200'
    }`;

  const submitSearch = () => {
    if (!search.trim()) return;
    window.location.href = `/?q=${encodeURIComponent(search.trim())}`;
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-brand-100 shadow-sm">
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white text-center text-[11px] sm:text-xs py-1.5 sm:py-2 px-3 font-medium">
        <span className="font-bold">750 TL üzeri KARGO BEDAVA</span>
        {' · '}
        <span className="hidden sm:inline">Markalya eğitici oyuncaklar · </span>
        En çok satanlar ve fırsat ürünleri
      </div>

      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex min-h-[4.25rem] sm:min-h-[5.5rem] items-center justify-between gap-2 sm:gap-4 py-2">
          <Link to="/" className="flex items-center shrink-0 min-w-0 max-w-[52%] sm:max-w-[48%] md:max-w-none py-0.5">
            <img
              src={logoSrc}
              alt={settings.siteName || 'Nasyonel'}
              className="site-logo"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-7">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass} end={item.end}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex flex-1 max-w-md mx-2 lg:mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400" />
              <input
                type="search"
                placeholder="Ürün veya stok kodu ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitSearch();
                }}
                className="w-full rounded-full border border-brand-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/25"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Link
              to="/sepet"
              className={`relative flex items-center gap-1.5 rounded-full bg-brand-900 px-3 py-2 sm:px-4 sm:py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors shadow-md shadow-brand-900/20 ${cartAnimating ? 'animate-cart-bounce' : ''}`}
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

        <div className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400" />
            <input
              type="search"
              placeholder="Ürün veya stok kodu ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitSearch();
              }}
              className="w-full rounded-full border border-brand-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/25"
            />
          </div>
        </div>

        {mobileOpen && (
          <nav className="lg:hidden border-t border-brand-100 py-2 flex flex-col pb-4">
            <a
              href="/#urunler"
              className={mobileNavClass}
              onClick={() => setMobileOpen(false)}
            >
              Tüm Ürünler
            </a>
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${mobileNavClass} ${isActive ? 'text-brand-900 border-accent-gold' : ''}`
                }
                onClick={() => setMobileOpen(false)}
                end={item.end}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
