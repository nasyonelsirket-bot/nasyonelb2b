import { Link } from 'react-router-dom';
import SEO from '@/components/seo/SEO';
import OrderTrackSection from '@/components/home/OrderTrackSection';
import { useMember } from '@/context/MemberContext';

export default function OrderTrackPage() {
  const { isLoggedIn } = useMember();

  return (
    <>
      <SEO
        title="Sipariş Takip"
        description="Sipariş numaranız ve e-posta ile kargo durumunu sorgulayın."
        path="/siparis-takip"
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <OrderTrackSection variant="page" />
        {isLoggedIn ? (
          <p className="mt-6 text-center text-sm text-gray-500">
            Tüm siparişleriniz için{' '}
            <Link to="/hesabim/siparislerim" className="font-medium text-brand-700 hover:underline">
              Siparişlerim
            </Link>{' '}
            bölümüne gidebilirsiniz.
          </p>
        ) : (
          <p className="mt-6 text-center text-sm text-gray-500">
            Üye misiniz?{' '}
            <Link to="/giris" className="font-medium text-brand-700 hover:underline">
              Giriş yapın
            </Link>{' '}
            — siparişlerinizi panelden takip edin.
          </p>
        )}
      </div>
    </>
  );
}
