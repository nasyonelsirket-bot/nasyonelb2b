import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function HeaderSearch({ className = '', variant = 'default' }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (term) navigate(`/?q=${encodeURIComponent(term)}#urunler`);
    else navigate('/#urunler');
  };

  const isPill = variant === 'pill';

  return (
    <form onSubmit={submit} className={`relative w-full ${className}`} role="search">
      {!isPill && (
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-400"
          aria-hidden
        />
      )}
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ürün, stok kodu veya kategori ara..."
        className={
          isPill
            ? 'w-full rounded-full border border-brand-200 bg-white py-2.5 pl-5 pr-14 text-sm text-brand-900 shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200/80 lg:py-3 lg:text-[15px]'
            : 'w-full rounded-xl border-2 border-brand-200 bg-white py-2.5 pl-11 pr-4 text-sm text-brand-900 shadow-sm transition-shadow placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200/80 sm:py-3 sm:text-base'
        }
        aria-label="Ürün ara"
      />
      <button
        type="submit"
        className={
          isPill
            ? 'absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-brand-900 text-white shadow-md hover:bg-brand-800 transition-colors lg:h-10 lg:w-10'
            : 'sr-only'
        }
        aria-label="Ara"
      >
        <Search className="h-4 w-4 lg:h-[18px] lg:w-[18px]" />
      </button>
    </form>
  );
}
