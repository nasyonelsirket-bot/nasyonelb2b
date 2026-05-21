import { useState, useMemo, useEffect } from 'react';
import { ChevronUp, ChevronDown, X, Search, Pin, LayoutGrid } from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  HOMEPAGE_SECTIONS,
  normalizeHomepageSlots,
} from '@/utils/homepagePlacements';

function productLabel(p) {
  if (!p) return '—';
  return `${p.name || 'İsimsiz'}${p.sku ? ` · ${p.sku}` : ''}`;
}

export default function HomepagePlacementAdmin({ store, showMsg }) {
  const products = store.products || [];
  const [localSlots, setLocalSlots] = useState(() =>
    normalizeHomepageSlots(store.settings?.homepageSlots),
  );
  const [activeSection, setActiveSection] = useState('bestsellers');
  const [query, setQuery] = useState('');

  useEffect(() => {
    setLocalSlots(normalizeHomepageSlots(store.settings?.homepageSlots));
  }, [store.settings?.homepageSlots]);

  const byId = useMemo(
    () => new Map(products.filter((p) => p?.id).map((p) => [p.id, p])),
    [products],
  );

  const sectionMeta = HOMEPAGE_SECTIONS.find((s) => s.id === activeSection);
  const pinnedIds = localSlots[activeSection] || [];

  const searchResults = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr');
    const pool = q
      ? products.filter(
          (p) =>
            String(p.name || '')
              .toLocaleLowerCase('tr')
              .includes(q) ||
            String(p.sku || '')
              .toLocaleLowerCase('tr')
              .includes(q) ||
            String(p.category || '')
              .toLocaleLowerCase('tr')
              .includes(q),
        )
      : products;
    return pool.slice(0, 50);
  }, [products, query]);

  const save = () => {
    store.updateSettings({
      ...store.settings,
      homepageSlots: localSlots,
    });
    showMsg('Yerleşim kaydedildi. Müşteriler görsün diye «Siteye Yayınla» yapın.');
  };

  const addProduct = (productId) => {
    if (!productId) return;
    setLocalSlots((prev) => {
      const ids = [...(prev[activeSection] || [])];
      if (ids.includes(productId)) return prev;
      if (sectionMeta && ids.length >= sectionMeta.limit) {
        showMsg(`Bu bölümde en fazla ${sectionMeta.limit} sabit ürün olabilir`, 'error');
        return prev;
      }
      return { ...prev, [activeSection]: [...ids, productId] };
    });
  };

  const removeProduct = (productId) => {
    setLocalSlots((prev) => ({
      ...prev,
      [activeSection]: (prev[activeSection] || []).filter((id) => id !== productId),
    }));
  };

  const moveProduct = (index, direction) => {
    setLocalSlots((prev) => {
      const ids = [...(prev[activeSection] || [])];
      const next = index + direction;
      if (next < 0 || next >= ids.length) return prev;
      [ids[index], ids[next]] = [ids[next], ids[index]];
      return { ...prev, [activeSection]: ids };
    });
  };

  const clearSection = () => {
    setLocalSlots((prev) => ({ ...prev, [activeSection]: [] }));
  };

  return (
    <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-card space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-900 text-accent-gold">
          <LayoutGrid className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-bold text-brand-900 text-lg">Ana Sayfa Yerleşimi</h2>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            Satmayan bir ürünü «En Çok Satanlar»a, eğitici bandına veya fırsatlara sabitleyebilirsiniz.
            Sabitlediğiniz ürünler listenin başında görünür; kalan yerler otomatik doldurulur.
            Trendyol sync bu ayarları silmez.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {HOMEPAGE_SECTIONS.map((s) => {
          const count = (localSlots[s.id] || []).length;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(s.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                activeSection === s.id
                  ? 'bg-brand-900 text-white border-brand-900'
                  : 'bg-white text-brand-800 border-brand-200 hover:bg-brand-50'
              }`}
            >
              {s.label}
              {count > 0 && (
                <span className="ml-1.5 opacity-80">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {sectionMeta && (
        <p className="text-xs text-gray-500 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
          {sectionMeta.hint}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-brand-900 flex items-center gap-2">
              <Pin className="h-4 w-4 text-accent-gold" />
              Sabitlenen ürünler ({pinnedIds.length}
              {sectionMeta ? ` / ${sectionMeta.limit}` : ''})
            </h3>
            {pinnedIds.length > 0 && (
              <button
                type="button"
                onClick={clearSection}
                className="text-xs text-red-600 hover:underline"
              >
                Tümünü kaldır
              </button>
            )}
          </div>

          {pinnedIds.length === 0 ? (
            <p className="text-sm text-gray-500 border border-dashed border-brand-200 rounded-xl p-4">
              Henüz sabit ürün yok. Sağdan arayıp ekleyin — örn. satmayan ürünü en çok satanlara
              koymak için.
            </p>
          ) : (
            <ul className="space-y-2">
              {pinnedIds.map((id, index) => {
                const p = byId.get(id);
                return (
                  <li
                    key={id}
                    className="flex items-center gap-2 rounded-xl border border-brand-100 bg-gray-50 p-2"
                  >
                    <span className="text-xs font-bold text-brand-500 w-5 text-center shrink-0">
                      {index + 1}
                    </span>
                    {p?.image ? (
                      <img
                        src={p.image}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover shrink-0 bg-white"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-brand-100 shrink-0" />
                    )}
                    <span className="flex-1 min-w-0 text-sm text-brand-900 truncate">
                      {productLabel(p)}
                      {!p && (
                        <span className="text-red-600 text-xs block">Ürün katalogda yok</span>
                      )}
                    </span>
                    <div className="flex shrink-0 gap-0.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveProduct(index, -1)}
                        className="p-1 rounded hover:bg-white disabled:opacity-30"
                        aria-label="Yukarı"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === pinnedIds.length - 1}
                        onClick={() => moveProduct(index, 1)}
                        className="p-1 rounded hover:bg-white disabled:opacity-30"
                        aria-label="Aşağı"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeProduct(id)}
                        className="p-1 rounded hover:bg-red-50 text-red-600"
                        aria-label="Kaldır"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-brand-900 mb-3">Ürün ekle</h3>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ürün adı, stok kodu veya kategori ara..."
              className="w-full rounded-lg border border-brand-200 pl-9 pr-3 py-2.5 text-sm"
            />
          </div>
          <ul className="max-h-[320px] overflow-y-auto space-y-1 border border-brand-100 rounded-xl p-2">
            {searchResults.length === 0 ? (
              <li className="text-sm text-gray-500 p-3 text-center">Ürün bulunamadı</li>
            ) : (
              searchResults.map((p) => {
                const pinned = pinnedIds.includes(p.id);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={pinned}
                      onClick={() => addProduct(p.id)}
                      className={`w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                        pinned
                          ? 'opacity-50 cursor-default bg-brand-50'
                          : 'hover:bg-brand-50'
                      }`}
                    >
                      {p.image ? (
                        <img
                          src={p.image}
                          alt=""
                          className="h-8 w-8 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-brand-100 shrink-0" />
                      )}
                      <span className="flex-1 min-w-0 truncate">{productLabel(p)}</span>
                      {pinned ? (
                        <span className="text-xs text-brand-600 shrink-0">Eklendi</span>
                      ) : (
                        <span className="text-xs text-accent-gold font-medium shrink-0">+ Sabitle</span>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-100">
        <Button type="button" variant="primary" onClick={save}>
          Yerleşimi kaydet
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setLocalSlots(normalizeHomepageSlots(store.settings?.homepageSlots))}
        >
          Geri al
        </Button>
      </div>
    </div>
  );
}
