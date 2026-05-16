import { Link } from 'react-router-dom';
import { useStore } from '@/context/StoreContext';

export default function CategorySlider() {
  const { categories } = useStore();

  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-bold text-brand-900 mb-6">Kategoriler</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/kategoriler?cat=${encodeURIComponent(cat.name)}`}
              className="flex shrink-0 flex-col items-center gap-2 rounded-2xl border border-brand-100 bg-white px-6 py-5 shadow-card transition-all hover:border-brand-400 hover:shadow-card-hover min-w-[120px]"
            >
              <span className="text-3xl">{cat.icon || '📦'}</span>
              <span className="text-sm font-semibold text-brand-800 text-center">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
