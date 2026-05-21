import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';
import OrderTrackSection from '@/components/home/OrderTrackSection';

export default function LoginPage() {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('nt_member_email', email.trim());
    } catch {
      /* ignore */
    }
    navigate('/');
  };

  useEffect(() => {
    if (hash !== '#siparis-takip') return;
    const el = document.getElementById('siparis-takip');
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    }
  }, [hash]);

  return (
    <>
      <SEO title="Giriş Yap" path="/giris" />
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="font-display text-2xl font-bold text-brand-900">Giriş Yap</h1>
        <p className="mt-2 text-sm text-gray-600">Üye olmadan da alışveriş yapabilirsiniz.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-brand-800">E-posta</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-brand-800">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm"
            />
          </div>
          <Button type="submit" variant="primary" className="w-full">
            Giriş yap
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Hesabınız yok mu?{' '}
          <Link to="/kayit" className="font-semibold text-brand-700 hover:underline">
            Kayıt olun
          </Link>
        </p>

        <div className="mt-8 space-y-2">
          <p className="text-xs text-center text-gray-500">Hızlı kayıt (yakında aktif)</p>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              disabled
              className="rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-400 bg-gray-50"
            >
              Google ile devam et
            </button>
            <button
              type="button"
              disabled
              className="rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-400 bg-gray-50"
            >
              Facebook ile devam et
            </button>
            <button
              type="button"
              disabled
              className="rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-400 bg-gray-50"
            >
              Apple ile devam et
            </button>
          </div>
        </div>

        <div id="siparis-takip" className="mt-10 scroll-mt-28">
          <OrderTrackSection variant="auth" />
        </div>
      </div>
    </>
  );
}
