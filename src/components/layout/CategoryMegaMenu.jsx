import { useMemo, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LayoutGrid, Tag } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { buildCategoryMegaMenu, splitIntoColumns } from '@/utils/categoryMegaMenu';
import { getCategoryStyle } from '@/utils/categoryStyle';

const HOVER_CLOSE_MS = 180;

export default function CategoryMegaMenu() {
  const { categories, products } = useStore();
  const [open, setOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const closeTimer = useRef(null);

  const groups = useMemo(
    () => buildCategoryMegaMenu(categories, products),
    [categories, products],
  );

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === activeGroupId) || groups[0] || null,
    [groups, activeGroupId],
  );

  const columns = useMemo(
    () => (activeGroup ? splitIntoColumns(activeGroup.categories, 4) : []),
    [activeGroup],
  );

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
    if (!activeGroupId && groups[0]) setActiveGroupId(groups[0].id);
  }, [clearCloseTimer, activeGroupId, groups]);

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

      {open && groups.length > 0 && (
        <div className="fixed left-0 right-0 top-[7.25rem] sm:top-[8.5rem] z-[60] px-3 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-2xl border border-brand-100 bg-white shadow-2xl overflow-hidden flex min-h-[300px] max-h-[min(65vh,480px)]">
            <aside className="w-[200px] shrink-0 border-r border-brand-100 bg-gray-50/90 py-2 overflow-y-auto">
              {groups.map((group, index) => {
                const active = activeGroup?.id === group.id;
                const style = getCategoryStyle(group.label, index);
                return (
                  <button
                    key={group.id}
                    type="button"
                    onMouseEnter={() => setActiveGroupId(group.id)}
                    className={`w-full text-left px-3 py-3 flex flex-col items-center gap-1 transition ${
                      active ? 'bg-white border-r-2 border-orange-500 shadow-sm' : 'hover:bg-white/80'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${style.bg} ${style.text}`}
                    >
                      {group.label.charAt(0)}
                    </span>
                    <span
                      className={`text-[11px] font-semibold text-center leading-tight ${
                        active ? 'text-orange-600' : 'text-brand-800'
                      }`}
                    >
                      {group.label}
                    </span>
                  </button>
                );
              })}
              <Link
                to="/#firsatlar"
                onMouseEnter={() => setActiveGroupId('deals')}
                className={`mx-2 mt-2 flex flex-col items-center gap-1 rounded-xl px-2 py-3 transition ${
                  activeGroupId === 'deals'
                    ? 'bg-orange-500 text-white'
                    : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                }`}
              >
                <Tag className="h-5 w-5" />
                <span className="text-[11px] font-bold">Fırsatlar</span>
              </Link>
            </aside>

            <div className="flex-1 p-5 overflow-y-auto">
              {activeGroupId === 'deals' ? (
                <div>
                  <h3 className="font-bold text-brand-900 text-lg">Flaş Fırsatlar</h3>
                  <p className="text-sm text-gray-600 mt-1 mb-4">En yüksek indirimli ürünler</p>
                  <Link
                    to="/#firsatlar"
                    className="inline-flex rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                  >
                    Fırsatlara git →
                  </Link>
                </div>
              ) : activeGroup ? (
                <>
                  <h3 className="font-bold text-brand-900 text-lg">{activeGroup.label}</h3>
                  <p className="text-sm text-gray-500 mt-0.5 mb-4">
                    {activeGroup.categories.length} kategori
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-1">
                    {columns.map((col, ci) => (
                      <ul key={ci} className="space-y-1 min-w-0">
                        {col.map((cat) => (
                          <li key={cat.id}>
                            <Link
                              to={`/kategoriler?cat=${encodeURIComponent(cat.name)}`}
                              className="text-sm text-gray-700 hover:text-orange-600 hover:underline line-clamp-2 leading-snug"
                              onClick={() => setOpen(false)}
                            >
                              {cat.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ))}
                  </div>
                  <Link
                    to={`/kategoriler?cat=${encodeURIComponent(activeGroup.categories[0]?.name || '')}`}
                    className="inline-block mt-5 text-sm font-semibold text-brand-700 hover:text-orange-600"
                    onClick={() => setOpen(false)}
                  >
                    Bu gruptaki ürünleri gör →
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
