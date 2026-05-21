import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { LogOut, ShoppingBag } from 'lucide-react';
import { useMember } from '@/context/MemberContext';
import { ACCOUNT_NAV } from '@/constants/accountNav';

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-brand-900 text-white shadow-sm'
      : 'text-brand-800 hover:bg-brand-50'
  }`;

export default function AccountLayout() {
  const navigate = useNavigate();
  const { profile, logout } = useMember();
  const name = profile?.name || 'Üye';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="bg-gray-50 min-h-[60vh]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <p className="text-sm text-brand-600 font-medium">Müşteri paneli</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900 mt-1">
            Merhaba, {name.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-600 mt-1">{profile?.email}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 lg:gap-8">
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-2">
            <nav className="rounded-2xl border border-brand-100 bg-white p-2 shadow-card space-y-1">
              {ACCOUNT_NAV.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={linkClass}>
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </nav>
            <Link
              to="/"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-brand-700 border border-brand-100 bg-white hover:bg-brand-50"
            >
              <ShoppingBag className="h-5 w-5" />
              Alışverişe devam
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-700 border border-red-100 bg-white hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Çıkış yap
            </button>
          </aside>

          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
