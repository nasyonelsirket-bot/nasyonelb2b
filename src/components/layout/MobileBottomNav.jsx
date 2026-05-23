import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useMember } from '@/context/MemberContext';

export default function MobileBottomNav() {
  const { totalItems } = useCart();
  const { isLoggedIn } = useMember();
  const { pathname } = useLocation();

  const itemClass = ({ isActive }) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-semibold transition-colors min-h-[48px] ${
      isActive ? 'text-brand-900' : 'text-gray-500'
    }`;

  const iconWrap = (active) =>
    `flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
      active ? 'bg-brand-100 text-brand-900' : 'text-gray-600'
    }`;

  if (pathname.startsWith('/admin') || pathname.startsWith('/odeme')) return null;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[48] border-t border-brand-200 bg-white/95 backdrop-blur-md shadow-[0_-2px_16px_rgba(10,31,77,0.06)] pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobil menü"
    >
      <div className="flex items-stretch max-w-lg mx-auto">
        <NavLink to="/" className={itemClass} end>
          {({ isActive }) => (
            <>
              <span className={iconWrap(isActive)}>
                <Home className="h-5 w-5" />
              </span>
              Ana Sayfa
            </>
          )}
        </NavLink>
        <NavLink to="/kategoriler" className={itemClass}>
          {({ isActive }) => (
            <>
              <span className={iconWrap(isActive)}>
                <LayoutGrid className="h-5 w-5" />
              </span>
              Kategoriler
            </>
          )}
        </NavLink>
        <NavLink to="/sepet" className={itemClass}>
          {({ isActive }) => (
            <>
              <span className={`relative ${iconWrap(isActive)}`}>
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent-gold px-0.5 text-[9px] font-bold text-brand-950">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </span>
              Sepet
            </>
          )}
        </NavLink>
        <NavLink to={isLoggedIn ? '/hesabim' : '/giris'} className={itemClass}>
          {({ isActive }) => (
            <>
              <span className={iconWrap(isActive)}>
                <User className="h-5 w-5" />
              </span>
              Hesabım
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
}
