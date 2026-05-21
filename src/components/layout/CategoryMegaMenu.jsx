import { useMemo, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LayoutGrid } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { buildFlatCategoryList, splitIntoColumns } from '@/utils/categoryMegaMenu';

const HOVER_CLOSE_MS = 180;

export default function CategoryMegaMenu() {
  const { categories, products } = useStore();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);

  const flatCategories = useMemo(
    () => buildFlatCategoryList(categories, products),
    [categories, products],
  );

  const columns = useMemo(() => splitIntoColumns(flatCategories, 4), [flatCategories]);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_MS);
  }, [clearCloseTimer]);

  const handleEnter = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  return (
    <div
      className="relative hidden lg:block"
      onMouseEnter={handleEnter}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-colors pb-0.5 border-b-2 ${
          open
            ? 'text-brand-900 border-accent-gold'
            : 'text-gray-700 border-transparent hover:text-brand-900 hover:border-brand-200'
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <LayoutGrid className="h-4 w-4" />
        Kategoriler
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && flatCategories.length > 0 && (
        <div className="fixed left-0 right-0 top-[7.25rem] sm:top-[8.5rem] z-[60] px-3 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-2xl border border-brand-100 bg-white shadow-2xl overflow-hidden max-h-[min(65vh,480px)]">
            <div className="flex items-center justify-between gap-4 border-b border-brand-100 bg-gray-50/80 px-5 py-3">
              <div>
                <h3 className="font-bold text-brand-900 text-lg">Tüm kategoriler</h3>
                <p className="text-sm text-gray-500">{flatCategories.length} kategori</p>
              </div>
              <Link
                to="/kategoriler"
                className="shrink-0 text-sm font-semibold text-brand-700 hover:text-orange-600"
                onClick={() => setOpen(false)}
              >
                Kategoriler sayfası →
              </Link>
            </div>

            <div className="p-5 overflow-y-auto max-h-[min(55vh,420px)]">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-8 gap-y-1">
                {columns.map((col, ci) => (
                  <ul key={ci} className="space-y-1 min-w-0">
                    {col.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          to={`/kategoriler?cat=${encodeURIComponent(cat.name)}`}
                          className="group flex items-baseline justify-between gap-2 text-sm text-gray-700 hover:text-orange-600 py-0.5"
                          onClick={() => setOpen(false)}
                        >
                          <span className="hover:underline line-clamp-2 leading-snug">{cat.name}</span>
                          {cat.productCount > 0 && (
                            <span className="text-[10px] text-gray-400 shrink-0 tabular-nums">
                              {cat.productCount}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
