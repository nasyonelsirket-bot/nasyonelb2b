import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronDown } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import {
  getActiveMainCategories,
  getSubcategoriesForMain,
} from '@/data/mainCategories';
import { HEADER_LEGAL_LINKS } from '@/constants/siteLinks';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';

/**
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function MobileCategoryDrawer({ open, onClose }) {
  const { products } = useStore();
  const [expanded, setExpanded] = useState(null);

  useBodyScrollLock(open);

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
        className="fixed inset-y-0 left-0 z-[61] w-[min(88vw,320px)] bg-white shadow-2xl flex flex-col lg:hidden animate-slide-in-left"
        aria-label="Kategori menüsü"
      >
        <div className="flex items-center justify-between border-b border-brand-100 px-4 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-500">Kategoriler</p>
            <p className="font-display font-bold text-brand-900">Alışverişe başla</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-brand-700 hover:bg-brand-50"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          {activeCategories.length === 0 ? (
            <p className="px-3 py-6 text-sm text-gray-500 text-center">
              Şu an listelenecek kategori bulunmuyor.
            </p>
          ) : (
            <ul className="space-y-1">
              {activeCategories.map((main) => {
                const subs = getSubcategoriesForMain(products, main);
                const isOpen = expanded === main.slug;
                return (
                  <li key={main.slug} className="rounded-xl border border-brand-50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggle(main.slug)}
                      className="flex w-full items-center gap-3 px-3 py-3.5 text-left hover:bg-brand-50/80 transition-colors"
                    >
                      <span className="text-xl shrink-0" aria-hidden>
                        {main.icon}
                      </span>
                      <span className="flex-1 font-semibold text-brand-900 text-sm">{main.name}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-brand-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <ul className="border-t border-brand-50 bg-brand-50/40 pb-2">
                        <li>
                          <Link
                            to={`/${main.slug}`}
                            onClick={onClose}
                            className="block px-4 py-2.5 text-sm font-medium text-brand-800 hover:text-accent-gold-dark"
                          >
                            Tüm {main.name}
                          </Link>
                        </li>
                        {subs.map((sub) => (
                          <li key={sub.name}>
                            <Link
                              to={`/${main.slug}?alt=${encodeURIComponent(sub.name)}`}
                              onClick={onClose}
                              className="flex items-center justify-between px-4 py-2 text-sm text-brand-700 hover:bg-white/80"
                            >
                              <span>{sub.name}</span>
                              <span className="text-xs text-gray-400">{sub.count}</span>
                            </Link>
                          </li>
                        ))}
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
