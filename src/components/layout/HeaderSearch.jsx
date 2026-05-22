import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function HeaderSearch({ className = '' }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (term) navigate(`/?q=${encodeURIComponent(term)}#urunler`);
    else navigate('/#urunler');
  };

  return (
    <form onSubmit={submit} className={`relative w-full ${className}`} role="search">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-400"
        aria-hidden
      />
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ürün, stok kodu veya kategori ara..."
        className="w-full rounded-xl border-2 border-brand-200 bg-white py-2.5 pl-11 pr-4 text-sm text-brand-900 shadow-sm transition-shadow placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200/80 sm:py-3 sm:text-base"
        aria-label="Ürün ara"
      />
    </form>
  );
}
