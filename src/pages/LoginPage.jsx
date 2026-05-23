import { useState, useEffect, useId } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';
import { loginMember } from '@/services/memberApi';
import { useMember } from '@/context/MemberContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { state, hash } = useLocation();
  const { setSession, isLoggedIn } = useMember();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notMember, setNotMember] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotMember(false);
    setLoading(true);
    try {
      const member = await loginMember({ email: email.trim(), password });
      setSession(member);
      const dest = state?.from && String(state.from).startsWith('/hesabim') ? state.from : '/hesabim';
      navigate(dest, { replace: true });
    } catch (err) {
      if (err.code === 'NOT_REGISTERED') {
        setNotMember(true);
        setError('');
      } else {
        setNotMember(false);
        setError(err.message || 'Giriş yapılamadı');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) navigate('/hesabim', { replace: true });
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (hash === '#siparis-takip') {
      navigate('/siparis-takip', { replace: true });
    }
  }, [hash, navigate]);

  const emailId = useId();
  const passwordId = useId();

  return (
    <>
      <SEO title="Giriş Yap" path="/giris" />
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="font-display text-2xl font-bold text-brand-900">Giriş Yap</h1>
        <p className="mt-2 text-sm text-gray-600">Üye olmadan da alışveriş yapabilirsiniz.</p>

        {notMember && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="font-semibold text-amber-900">Bu e-posta ile kayıtlı üyemiz yok</p>
            <p className="mt-1 text-amber-800 leading-relaxed">
              Girdiğiniz bilgilerle eşleşen bir üyelik bulunamadı. Alışverişe devam etmek için hemen
              ücretsiz kayıt olabilirsiniz — üye olmadan da sipariş verebilirsiniz.
            </p>
            <Link
              to="/kayit"
              state={{ email: email.trim() }}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
            >
              <UserPlus className="h-4 w-4" />
              Hemen kayıt ol
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor={emailId} className="text-xs font-medium text-brand-800">
              E-posta
            </label>
            <input
              id={emailId}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setNotMember(false);
              }}
              className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor={passwordId} className="text-xs font-medium text-brand-800">
              Şifre
            </label>
            <input
              id={passwordId}
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm"
            />
          </div>
          {error && (
            <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? 'Kontrol ediliyor...' : 'Giriş yap'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Hesabınız yok mu?{' '}
          <Link to="/kayit" className="font-semibold text-brand-700 hover:underline">
            Kayıt olun
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-gray-600">
          <Link to="/siparis-takip" className="font-semibold text-brand-700 hover:underline">
            Sipariş takip
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

      </div>
    </>
  );
}
