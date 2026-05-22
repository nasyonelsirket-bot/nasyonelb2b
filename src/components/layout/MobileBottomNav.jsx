import { NavLink, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingCart, User, MessageCircle } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import { useMember } from '@/context/MemberContext';

function cleanWhatsAppPhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

export default function MobileBottomNav() {
  const { settings } = useStore();
  const { totalItems } = useCart();
  const { isLoggedIn } = useMember();
  const { pathname } = useLocation();
  const wa = cleanWhatsAppPhone(settings.whatsappNumber);

  const itemClass = ({ isActive }) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors min-h-[52px] ${
      isActive ? 'text-brand-900' : 'text-gray-500'
    }`;

  const iconWrap = (active) =>
    `flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
      active ? 'bg-brand-100 text-brand-900' : 'text-gray-600'
    }`;

  if (pathname.startsWith('/admin')) return null;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[48] border-t border-brand-200 bg-white/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(10,31,77,0.08)] pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobil menü"
    >
      <div className="flex items-stretch">
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
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent-gold px-0.5 text-[9px] font-bold text-brand-950">
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
        {wa ? (
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold text-[#128C7E] min-h-[52px]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#25D366]/15 text-[#25D366]">
              <MessageCircle className="h-5 w-5" />
            </span>
            WhatsApp
          </a>
        ) : null}
      </div>
    </nav>
  );
}
