import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { HEADER_LEGAL_LINKS } from '@/constants/siteLinks';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';

const QUICK_LINKS = [
  { to: '/', label: 'Ana Sayfa' },
  { to: '/en-cok-satanlar', label: 'En Çok Satanlar' },
  { to: '/kategoriler?hepsi=1', label: 'Tüm Ürünler' },
  { to: '/hakkimizda', label: 'Hakkımızda' },
  { to: '/iletisim', label: 'İletişim' },
];

/**
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function MobileCategoryDrawer({ open, onClose }) {
  const { products, categories } = useStore();

  useBodyScrollLock(open);

  const activeCategoryList = useMemo(() => {
    const cats = Array.isArray(categories) ? categories : [];
    const counts = {};
    products.forEach((p) => {
      const key = p.category || 'Genel';
      counts[key] = (counts[key] || 0) + 1;
    });
    return cats.filter((c) => (counts[c.name] || 0) > 0);
  }, [categories, products]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-brand-950/50 backdrop-blur-[2px] lg:hidden"
        aria-label="Menüyü kapat"
        onClick={onClose}
      />
      <aside
        className="fixed inset-y-0 left-0 z-[61] w-[min(92vw,360px)] bg-brand-900 shadow-2xl flex flex-col lg:hidden animate-slide-in-left text-white"
        aria-label="Kategori menüsü"
      >
        <div className="flex items-center justify-between border-b border-brand-700/50 px-4 py-4">
          <div>
            <p className="font-display text-lg font-bold">Kategoriler</p>
            <p className="text-sm text-brand-200 mt-0.5">Ürünler kategorilere göre listelenir</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-brand-100 hover:bg-brand-800"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-300 mb-2">Hızlı erişim</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className="rounded-full px-3.5 py-1.5 text-sm font-medium bg-brand-800 text-white hover:bg-brand-700 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-300 mb-2">Kategoriler</p>
            {activeCategoryList.length === 0 ? (
              <p className="text-sm text-brand-200">Şu an listelenecek kategori bulunmuyor.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/kategoriler"
                  onClick={onClose}
                  className="rounded-full px-3.5 py-1.5 text-sm font-medium bg-accent-gold text-brand-950"
                >
                  Tümü
                </Link>
                {activeCategoryList.map((c) => (
                  <Link
                    key={c.id || c.name}
                    to={`/kategoriler?cat=${encodeURIComponent(c.name)}`}
                    onClick={onClose}
                    className="rounded-full px-3.5 py-1.5 text-sm font-medium bg-brand-800 text-white hover:bg-brand-700 transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="border-t border-brand-700/50 px-4 py-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-300">Yasal</p>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            {HEADER_LEGAL_LINKS.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  onClick={onClose}
                  className="text-brand-100 hover:text-white hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}
