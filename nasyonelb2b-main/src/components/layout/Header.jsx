import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, ShoppingCart, Search } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';

const NAV = [
  { to: '/', label: 'Ana Sayfa' },
  { to: '/kategoriler', label: 'Kategoriler' },
  { to: '/yeni-urunler', label: 'Yeni Ürünler' },
  { to: '/kampanyalar', label: 'Kampanyalar' },
  { to: '/hakkimizda', label: 'Hakkımızda' },
  { to: '/iletisim', label: 'İletişim' },
];

export default function Header() {
  const { settings } = useStore();
  const { totalItems, cartAnimating } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');

  const navClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-brand-600' : 'text-gray-600 hover:text-brand-600'}`;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-brand-100 shadow-sm">
      <div className="bg-brand-900 text-white text-center text-xs py-1.5 px-4">
        B2B Toptan Sipariş — WhatsApp ile hızlı sipariş | Minimum sipariş ürün bazlı uygulanır
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img
              src={settings.logoUrl || '/logo.svg'}
              alt={settings.siteName}
              className="h-10 w-auto"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass} end={item.to === '/'}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                className="w-full rounded-full border border-brand-200 bg-brand-50/50 py-2 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <Link
            to="/sepet"
            className={`relative flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors ${cartAnimating ? 'animate-cart-bounce' : ''}`}
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
            className="lg:hidden p-2 text-brand-700"
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
