import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, ShoppingCart, Search } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';

const NAV = [
  { to: '/', label: 'Ana Sayfa' },
  { to: '/kategoriler', label: 'Kategoriler' },
  { to: '/hakkimizda', label: 'Hakkımızda' },
  { to: '/iletisim', label: 'İletişim' },
];

const DEFAULT_LOGO = '/nasyonel-logo.png?v=3';

function resolveLogoUrl(url) {
  if (!url || url.startsWith('data:')) return DEFAULT_LOGO;
  return url;
}

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

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-brand-100 shadow-sm">
      <div className="bg-brand-950 text-brand-100 text-center text-xs py-2 px-4">
        <span className="text-accent-gold font-semibold">Nasyonel Toys</span>
        {' '}— WhatsApp sipariş formu | Ürün başına min. 2.000 ₺
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[4.75rem] sm:min-h-[5rem] items-center justify-between gap-4 py-2">
          <Link to="/" className="flex items-center shrink-0 min-w-0 max-w-[45%] sm:max-w-none py-0.5">
            <img
              src={logoSrc}
              alt={settings.siteName || 'Nasyonel'}
              className="site-logo max-h-14 sm:max-h-[4.25rem] w-auto"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-7">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass} end={item.to === '/'}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400" />
              <input
                type="search"
                placeholder="Ürün veya stok kodu ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && search.trim()) {
                    window.location.href = `/?q=${encodeURIComponent(search.trim())}`;
                  }
                }}
                className="w-full rounded-full border border-brand-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/25"
              />
            </div>
          </div>

          <Link
            to="/sepet"
            className={`relative flex items-center gap-2 rounded-full bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors shadow-md shadow-brand-900/20 ${cartAnimating ? 'animate-cart-bounce' : ''}`}
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

        {mobileOpen && (
          <nav className="lg:hidden border-t border-brand-100 py-4 flex flex-col gap-3">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navClass}
                onClick={() => setMobileOpen(false)}
                end={item.to === '/'}
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
