import { Link } from 'react-router-dom';
import { MAIN_CATEGORIES } from '@/data/mainCategories';

/** Kategori sayfaları — iç linkleme hub */
export default function CategoryInternalLinks({ currentSlug, className = '' }) {
  const others = MAIN_CATEGORIES.filter((c) => c.slug !== currentSlug);

  return (
    <section className={`rounded-2xl border border-brand-100 bg-brand-50/40 p-6 ${className}`}>
      <h2 className="font-display font-bold text-brand-900 mb-3">Diğer Oyuncak Kategorileri</h2>
      <p className="text-sm text-gray-600 mb-4">
        Eğitici oyuncak, zeka oyunları, peluş ve daha fazlasını keşfedin.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/kategoriler"
          className="rounded-full bg-white border border-brand-200 px-3 py-1.5 text-sm font-medium text-brand-800 hover:bg-brand-100"
        >
          Tüm Kategoriler
        </Link>
        <Link
          to="/blog"
          className="rounded-full bg-white border border-brand-200 px-3 py-1.5 text-sm font-medium text-brand-800 hover:bg-brand-100"
        >
          Oyuncak Rehberi (Blog)
        </Link>
        <Link
          to="/en-cok-satanlar"
          className="rounded-full bg-accent-gold/20 border border-accent-gold/40 px-3 py-1.5 text-sm font-semibold text-brand-900 hover:bg-accent-gold/30"
        >
          Çok Satanlar
        </Link>
        {others.map((c) => (
          <Link
            key={c.slug}
            to={`/${c.slug}`}
            className="rounded-full bg-white border border-brand-200 px-3 py-1.5 text-sm text-brand-800 hover:bg-brand-100"
          >
            {c.icon} {c.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
