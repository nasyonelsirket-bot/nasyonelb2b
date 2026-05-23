import { Link, useLocation } from 'react-router-dom';
import {
  Flame,
  Percent,
  GraduationCap,
  LayoutGrid,
  ShoppingBag,
} from 'lucide-react';

const LINKS = [
  { href: '/en-cok-satanlar', label: 'Çok Satanlar', icon: Flame, style: 'hot' },
  { href: '/#firsatlar', label: 'Flaş Fırsatlar', icon: Percent, style: 'deal' },
  { href: '/egitici-oyuncaklar', label: 'Eğitici Oyuncaklar', icon: GraduationCap, style: 'edu' },
  { href: '/kategoriler', label: 'Kategoriler', icon: LayoutGrid, style: 'default' },
  { href: '/sepet', label: 'Sepetim', icon: ShoppingBag, style: 'cart' },
];

function linkClass(style, active) {
  if (active) {
    if (style === 'cart') return 'bg-brand-900 text-white shadow-md';
    return 'bg-orange-500 text-white shadow-md shadow-orange-500/30';
  }

  switch (style) {
    case 'hot':
      return 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100';
    case 'deal':
      return 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100';
    case 'edu':
      return 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100';
    case 'cart':
      return 'bg-brand-50 text-brand-900 border border-brand-200 hover:bg-brand-100';
    default:
      return 'bg-gray-50 text-gray-800 border border-gray-200 hover:bg-gray-100';
  }
}

export default function TrendyolSubNav() {
  const { pathname, hash } = useLocation();

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm" aria-label="Hızlı menü">
      <div className="mx-auto max-w-7xl px-2 sm:px-4">
        <div className="flex gap-2 overflow-x-auto py-2.5 scrollbar-hide snap-x snap-mandatory touch-pan-x">
          {LINKS.map(({ href, label, icon: Icon, style }) => {
            const isHome = pathname === '/';
            const active =
              (isHome && hash && href.endsWith(hash)) || (href === '/sepet' && pathname === '/sepet');

            return (
              <Link
                key={href}
                to={href}
                className={`inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full px-3.5 py-2 text-xs sm:text-sm font-bold transition-all touch-manipulation ${linkClass(style, active)}`}
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
