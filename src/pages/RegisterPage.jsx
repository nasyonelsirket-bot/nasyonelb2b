import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';
import { registerMember } from '@/services/memberApi';
import { useMember } from '@/context/MemberContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { hash, state } = useLocation();
  const { setSession, isLoggedIn } = useMember();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => String(state?.email || '').trim());
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (state?.email) setEmail(String(state.email).trim());
  }, [state?.email]);

  useEffect(() => {
    if (isLoggedIn) navigate('/hesabim', { replace: true });
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const member = await registerMember({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setSession(member);
      navigate('/hesabim', { replace: true });
    } catch (err) {
      setError(err.message || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hash === '#siparis-takip') {
      navigate('/siparis-takip', { replace: true });
    }
  }, [hash, navigate]);

  return (
    <>
      <SEO title="Kayıt Ol" path="/kayit" />
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="font-display text-2xl font-bold text-brand-900">Üye Ol</h1>
        <p className="mt-2 text-sm text-gray-600">
          Üyelik zorunlu değil — dilediğiniz zaman üye olmadan sipariş verebilirsiniz.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-brand-800">Ad Soyad</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm"
            />
          </div>
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
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm"
            />
          </div>
          {error && (
            <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          {state?.email && (
            <p className="text-xs text-brand-700 bg-brand-50 rounded-lg px-3 py-2">
              Giriş sayfasından yönlendirildiniz — bilgilerinizi tamamlayıp kayıt olun.
            </p>
          )}
          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Hesap oluştur'}
          </Button>
        </form>

        <p className="mt-4 text-xs text-gray-500">
          Kayıt olarak{' '}
          <Link to="/sozlesme/kvkk" className="text-brand-600 hover:underline">
            KVKK metnini
          </Link>{' '}
          okuduğunuzu kabul edersiniz.
        </p>

        <p className="mt-6 text-center text-sm text-gray-600">
          Zaten üye misiniz?{' '}
          <Link to="/giris" className="font-semibold text-brand-700 hover:underline">
            Giriş yapın
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-gray-600">
          <Link to="/siparis-takip" className="font-semibold text-brand-700 hover:underline">
            Sipariş takip
          </Link>
        </p>

        <div className="mt-8 space-y-2">
          <p className="text-xs text-center text-gray-500">veya (yakında)</p>
          <div className="grid grid-cols-1 gap-2">
            {['Google', 'Facebook', 'Apple'].map((p) => (
              <button
                key={p}
                type="button"
                disabled
                className="rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-400 bg-gray-50"
              >
                {p} ile kayıt ol
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
