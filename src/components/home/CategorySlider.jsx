import { Link } from 'react-router-dom';
import { useStore } from '@/context/StoreContext';
import { getCategoryStyle } from '@/utils/categoryStyle';

export default function CategorySlider() {
  const { categories } = useStore();
  const list = Array.isArray(categories) ? categories : [];

  if (!list.length) return null;

  return (
    <section className="py-8 sm:py-10 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-bold text-brand-900 mb-2">Kategoriler</h2>
        <p className="text-sm text-gray-600 mb-6">İstediğiniz kategoriye tıklayın — hızlıca ürünlere ulaşın</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {list.map((cat, index) => {
            const style = getCategoryStyle(cat.name, index);
            const initial = String(cat.name || '?').charAt(0).toUpperCase();
            return (
              <Link
                key={cat.id}
                to={`/kategoriler?cat=${encodeURIComponent(cat.name)}`}
                className={`group flex flex-col items-center justify-center rounded-2xl border-2 ${style.border} ${style.bg} ${style.text} px-3 py-6 sm:py-8 shadow-md hover:scale-[1.03] hover:shadow-xl transition-all duration-200 min-h-[100px]`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl font-display font-bold mb-2">
                  {initial}
                </span>
                <span className="text-xs sm:text-sm font-bold text-center leading-tight line-clamp-2">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
