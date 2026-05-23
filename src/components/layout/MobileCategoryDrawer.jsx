import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronDown } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import {
  getActiveMainCategories,
  getSubcategoriesForMain,
} from '@/data/mainCategories';
import { HEADER_LEGAL_LINKS } from '@/constants/siteLinks';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import useDialogA11y from '@/hooks/useDialogA11y';

/**
 * @param {{ open: boolean, onClose: () => void, returnFocusRef?: import('react').RefObject<HTMLElement|null> }} props
 */
export default function MobileCategoryDrawer({ open, onClose, returnFocusRef }) {
  const { products } = useStore();
  const [expanded, setExpanded] = useState(null);
  const panelRef = useRef(null);

  useBodyScrollLock(open);
  useDialogA11y({ open, onClose, containerRef: panelRef, returnFocusRef });

  const activeCategories = getActiveMainCategories(products);

  if (!open) return null;

  const toggle = (slug) => {
    setExpanded((prev) => (prev === slug ? null : slug));
  };

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-brand-950/50 backdrop-blur-[2px] lg:hidden"
        aria-label="Menüyü kapat"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        id="mobile-category-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-category-drawer-title"
        className="fixed inset-y-0 left-0 z-[61] w-[min(88vw,320px)] bg-white shadow-2xl flex flex-col lg:hidden animate-slide-in-left"
      >
        <div className="flex items-center justify-between border-b border-brand-100 px-4 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-500">Kategoriler</p>
            <h2 id="mobile-category-drawer-title" className="font-display font-bold text-brand-900">
              Alışverişe başla
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-700 hover:bg-brand-50 focus-ring"
            aria-label="Menüyü kapat"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-3" aria-label="Kategori listesi">
          <Link
            to="/kategoriler"
            onClick={onClose}
            className="mb-2 block rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-sm font-semibold text-brand-900 hover:bg-brand-100"
          >
            Tüm kategoriler
          </Link>
          {activeCategories.length === 0 ? (
            <p className="px-3 py-6 text-sm text-gray-500 text-center">
              Şu an listelenecek kategori bulunmuyor.
            </p>
          ) : (
            <ul className="space-y-1">
              {activeCategories.map((main) => {
                const subs = getSubcategoriesForMain(products, main);
                const isOpen = expanded === main.slug;
                const panelId = `mobile-cat-panel-${main.slug}`;
                return (
                  <li key={main.slug} className="rounded-xl border border-brand-50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggle(main.slug)}
                      className="flex w-full items-center gap-3 px-3 py-3.5 min-h-[44px] text-left hover:bg-brand-50/80 transition-colors focus-ring"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                    >
                      <span className="text-xl shrink-0" aria-hidden>
                        {main.icon}
                      </span>
                      <span className="flex-1 font-semibold text-brand-900 text-sm">{main.name}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-brand-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </button>
                    {isOpen && (
                      <ul id={panelId} className="border-t border-brand-50 bg-brand-50/40 pb-2 max-h-48 overflow-y-auto">
                        <li>
                          <Link
                            to={`/${main.slug}`}
                            onClick={onClose}
                            className="block px-4 py-2.5 text-sm font-medium text-brand-800 hover:text-accent-gold-dark"
                          >
                            Tüm {main.name}
                          </Link>
                        </li>
                        {subs.slice(0, 12).map((sub) => (
                          <li key={sub.name}>
                            <Link
                              to={`/${main.slug}?alt=${encodeURIComponent(sub.name)}`}
                              onClick={onClose}
                              className="flex items-center justify-between px-4 py-2 text-sm text-brand-700 hover:bg-white/80"
                            >
                              <span className="truncate pr-2">{sub.name}</span>
                              <span className="text-xs text-gray-400 shrink-0">{sub.count}</span>
                            </Link>
                          </li>
                        ))}
                        {subs.length > 12 && (
                          <li className="px-4 py-2">
                            <Link
                              to="/kategoriler"
                              onClick={onClose}
                              className="text-xs font-medium text-brand-600 hover:text-brand-900"
                            >
                              Tüm alt kategoriler →
                            </Link>
                          </li>
                        )}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        <div className="border-t border-brand-100 px-4 py-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-500">Yasal</p>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            {HEADER_LEGAL_LINKS.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  onClick={onClose}
                  className="text-brand-700 hover:text-brand-900 hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/iletisim" onClick={onClose} className="text-brand-700 hover:text-brand-900 hover:underline">
                İletişim
              </Link>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}
