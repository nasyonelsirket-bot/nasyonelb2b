import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('nt_member_email', email.trim());
      localStorage.setItem('nt_member_name', name.trim());
    } catch {
      /* ignore */
    }
    navigate('/');
  };

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
          <Button type="submit" variant="primary" className="w-full">
            Hesap oluştur
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
