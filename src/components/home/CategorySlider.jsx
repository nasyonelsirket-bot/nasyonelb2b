import { Link } from 'react-router-dom';
import { useStore } from '@/context/StoreContext';

export default function CategorySlider() {
  const { categories } = useStore();
  const list = Array.isArray(categories) ? categories : [];

  if (!list.length) return null;

  return (
    <section className="py-8 sm:py-10 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-bold text-brand-900 mb-2">Kategoriler</h2>
        <p className="text-sm text-gray-600 mb-6">İstediğiniz kategoriye tıklayın — hızlıca ürünlere ulaşın</p>

        <div className="flex flex-wrap gap-2">
          {list.map((cat) => (
            <Link
              key={cat.id}
              to={`/kategoriler?cat=${encodeURIComponent(cat.name)}`}
              className="rounded-lg border border-brand-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-800 shadow-sm hover:border-brand-400 hover:text-orange-600 transition"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
