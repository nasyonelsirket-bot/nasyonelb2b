import { Link } from 'react-router-dom';
import { Package, MapPin, User, Truck } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import { useMember } from '@/context/MemberContext';
export default function AccountOverviewPage() {
  const { profile, loading } = useMember();
  const orderHint = 'Siparişlerinizi görüntüleyin ve kargo takibini takip edin';
  const addressCount = profile?.addresses?.length || 0;

  const cards = [
    {
      to: '/hesabim/siparislerim',
      icon: Package,
      title: 'Siparişlerim',
      desc: orderHint,
      badge: null,
    },
    {
      to: '/hesabim/adreslerim',
      icon: MapPin,
      title: 'Adreslerim',
      desc: 'Teslimat adreslerinizi kaydedin ve düzenleyin',
      badge: addressCount ? `${addressCount} adres` : 'Adres ekle',
    },
    {
      to: '/hesabim/profilim',
      icon: User,
      title: 'Profilim',
      desc: 'Ad, telefon ve hesap bilgileriniz',
      badge: null,
    },
  ];

  return (
    <>
      <SEO title="Hesabım" path="/hesabim" />
      <div className="space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 sm:p-6 shadow-card">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-brand-900">Hoş geldiniz</h2>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                750 TL üzeri siparişlerde kargo bedava. Siparişlerinizi bu panelden takip
                edebilir, adres ve profil bilgilerinizi güncelleyebilirsiniz.
              </p>
            </div>
          </div>
        </div>

        {loading && !profile ? (
          <p className="text-sm text-gray-500">Yükleniyor...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards.map(({ to, icon: Icon, title, desc, badge }) => (
              <Link
                key={to}
                to={to}
                className="rounded-2xl border border-brand-100 bg-white p-5 shadow-card hover:border-brand-300 hover:shadow-md transition-all group"
              >
                <Icon className="h-8 w-8 text-accent-gold mb-3" />
                <h3 className="font-semibold text-brand-900 group-hover:text-brand-700">{title}</h3>
                <p className="text-sm text-gray-600 mt-1">{desc}</p>
                {badge && (
                  <span className="inline-block mt-3 text-xs font-medium text-brand-700 bg-brand-50 rounded-full px-2.5 py-1">
                    {badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}

      </div>
    </>
  );
}
