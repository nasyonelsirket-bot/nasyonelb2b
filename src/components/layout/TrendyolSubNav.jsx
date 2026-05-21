import { Link, useLocation } from 'react-router-dom';
import {
  Flame,
  Percent,
  GraduationCap,
  Sparkles,
  LayoutGrid,
  ShoppingBag,
} from 'lucide-react';

const LINKS = [
  { href: '/#cok-satanlar', label: 'Çok Satanlar', icon: Flame, accent: true },
  { href: '/#firsatlar', label: 'Flaş Fırsatlar', icon: Percent },
  { href: '/#egitici', label: 'Eğitici Oyuncaklar', icon: GraduationCap },
  { href: '/#markalya', label: 'Markalya', icon: Sparkles },
  { href: '/kategoriler', label: 'Kategoriler', icon: LayoutGrid },
  { href: '/sepet', label: 'Sepetim', icon: ShoppingBag },
];

export default function TrendyolSubNav() {
  const { pathname, hash } = useLocation();

  return (
    <nav
      className="border-b border-gray-200 bg-white shadow-sm"
      aria-label="Hızlı menü"
    >
      <div className="mx-auto max-w-7xl px-2 sm:px-4">
        <div className="flex gap-2 overflow-x-auto py-2.5 scrollbar-hide snap-x snap-mandatory touch-pan-x">
          {LINKS.map(({ href, label, icon: Icon, accent }) => {
            const isHome = pathname === '/';
            const active = isHome && hash && href.endsWith(hash);
            const isSepet = href === '/sepet' && pathname === '/sepet';

            return (
              <Link
                key={href}
                to={href}
                className={`inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full px-3.5 py-2 text-xs sm:text-sm font-bold transition-colors touch-manipulation ${
                  active || isSepet
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                    : accent
                      ? 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                      : 'bg-gray-50 text-gray-800 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
