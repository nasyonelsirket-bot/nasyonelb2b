import { useState, useMemo, useEffect } from 'react';
import {
  ChevronUp,
  ChevronDown,
  X,
  Search,
  Pin,
  LayoutGrid,
  GripVertical,
  Eye,
  EyeOff,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  HOMEPAGE_SECTIONS,
  normalizeHomepageLayout,
  layoutToHomepageSlots,
  layoutToHomepageLayoutPayload,
} from '@/utils/homepagePlacements';

function productLabel(p) {
  if (!p) return '—';
  return `${p.name || 'İsimsiz'}${p.sku ? ` · ${p.sku}` : ''}`;
}

function sectionLabel(id) {
  return HOMEPAGE_SECTIONS.find((s) => s.id === id)?.label || id;
}

export default function HomepagePlacementAdmin({ store, showMsg }) {
  const products = store.products || [];
  const [localLayout, setLocalLayout] = useState(() =>
    normalizeHomepageLayout(store.settings),
  );
  const [activeSection, setActiveSection] = useState('bestsellers');
  const [query, setQuery] = useState('');

  useEffect(() => {
    setLocalLayout(normalizeHomepageLayout(store.settings));
  }, [store.settings]);

  const byId = useMemo(
    () => new Map(products.filter((p) => p?.id).map((p) => [p.id, p])),
    [products],
  );

  const sectionMeta = HOMEPAGE_SECTIONS.find((s) => s.id === activeSection);
  const isStrip = sectionMeta?.type === 'strip';
  const activeCfg = localLayout.sections[activeSection];
  const pinnedIds = isStrip ? activeCfg?.productIds || [] : [];

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

  const patchSection = (sectionId, patch) => {
    setLocalLayout((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionId]: { ...prev.sections[sectionId], ...patch },
      },
    }));
  };

  const moveSectionInOrder = (index, direction) => {
    setLocalLayout((prev) => {
      const order = [...prev.order];
      const next = index + direction;
      if (next < 0 || next >= order.length) return prev;
      [order[index], order[next]] = [order[next], order[index]];
      return { ...prev, order };
    });
  };

  const save = () => {
    const payload = layoutToHomepageLayoutPayload(localLayout);
    store.updateSettings({
      ...store.settings,
      homepageLayout: payload,
      homepageSlots: layoutToHomepageSlots({ sections: payload.sections }),
    });
    showMsg('Ana sayfa düzeni kaydedildi. Müşteriler görsün diye «Siteye Yayınla» yapın.');
  };

  const addProduct = (productId) => {
    if (!productId || !isStrip) return;
    const limit = activeCfg?.limit || 24;
    setLocalLayout((prev) => {
      const ids = [...(prev.sections[activeSection]?.productIds || [])];
      if (ids.includes(productId)) return prev;
      if (ids.length >= limit) {
        showMsg(`Bu bölümde en fazla ${limit} ürün seçebilirsiniz`, 'error');
        return prev;
      }
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [activeSection]: {
            ...prev.sections[activeSection],
            productIds: [...ids, productId],
          },
        },
      };
    });
  };

  const removeProduct = (productId) => {
    if (!isStrip) return;
    setLocalLayout((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [activeSection]: {
          ...prev.sections[activeSection],
          productIds: (prev.sections[activeSection]?.productIds || []).filter((id) => id !== productId),
        },
      },
    }));
  };

  const moveProduct = (index, direction) => {
    if (!isStrip) return;
    setLocalLayout((prev) => {
      const ids = [...(prev.sections[activeSection]?.productIds || [])];
      const next = index + direction;
      if (next < 0 || next >= ids.length) return prev;
      [ids[index], ids[next]] = [ids[next], ids[index]];
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [activeSection]: { ...prev.sections[activeSection], productIds: ids },
        },
      };
    });
  };

  const clearProducts = () => {
    if (!isStrip) return;
    patchSection(activeSection, { productIds: [] });
  };

  return (
    <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-card space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-900 text-accent-gold">
          <LayoutGrid className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-bold text-brand-900 text-lg">Ana Sayfa Düzeni</h2>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            Bölüm sırasını, başlık ve alt yazıları, hangi ürünlerin hangi sırada görüneceğini buradan
            yönetin. «Sadece seçtiğim ürünler» açıksa liste yalnızca sizin seçtiklerinizden oluşur;
            kapalıysa seçtikleriniz önce gelir, kalan yerler otomatik dolar.
          </p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-brand-900 mb-2 text-sm">Sayfadaki bölüm sırası</h3>
        <ul className="space-y-2">
          {localLayout.order.map((sectionId, index) => {
            const cfg = localLayout.sections[sectionId];
            return (
              <li
                key={sectionId}
                className="flex items-center gap-2 rounded-xl border border-brand-100 bg-gray-50 px-3 py-2"
              >
                <GripVertical className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="flex-1 text-sm font-medium text-brand-900">
                  {index + 1}. {sectionLabel(sectionId)}
                  {cfg?.enabled === false && (
                    <span className="ml-2 text-xs text-gray-500">(gizli)</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => patchSection(sectionId, { enabled: cfg?.enabled === false })}
                  className="p-1.5 rounded-lg hover:bg-white text-brand-700"
                  title={cfg?.enabled === false ? 'Göster' : 'Gizle'}
                >
                  {cfg?.enabled === false ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveSectionInOrder(index, -1)}
                  className="p-1 rounded hover:bg-white disabled:opacity-30"
                  aria-label="Yukarı"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={index === localLayout.order.length - 1}
                  onClick={() => moveSectionInOrder(index, 1)}
                  className="p-1 rounded hover:bg-white disabled:opacity-30"
                  aria-label="Aşağı"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        {HOMEPAGE_SECTIONS.map((s) => {
          const cfg = localLayout.sections[s.id];
          const count = s.type === 'strip' ? (cfg?.productIds || []).length : 0;
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
              {count > 0 && <span className="ml-1.5 opacity-80">({count})</span>}
            </button>
          );
        })}
      </div>

      {sectionMeta && (
        <p className="text-xs text-gray-500 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
          {sectionMeta.hint}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-brand-100 p-4 bg-brand-50/50">
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-brand-800">Başlık</span>
          <input
            type="text"
            value={activeCfg?.title || ''}
            onChange={(e) => patchSection(activeSection, { title: e.target.value })}
            className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-brand-800">Alt yazı</span>
          <input
            type="text"
            value={activeCfg?.subtitle || ''}
            onChange={(e) => patchSection(activeSection, { subtitle: e.target.value })}
            placeholder={
              activeSection === 'bestsellers'
                ? 'Boş bırakırsanız satış verisine göre otomatik metin'
                : activeSection === 'allProducts'
                  ? 'Boş bırakırsanız ürün sayısı gösterilir'
                  : 'Kısa açıklama'
            }
            className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
          />
        </label>
        {isStrip && (
          <>
            <label className="block">
              <span className="text-xs font-semibold text-brand-800">Rozet (isteğe bağlı)</span>
              <input
                type="text"
                value={activeCfg?.badge || ''}
                onChange={(e) => patchSection(activeSection, { badge: e.target.value })}
                placeholder="Örn. Popüler"
                className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-brand-800">Maks. ürün</span>
              <input
                type="number"
                min={1}
                max={48}
                value={activeCfg?.limit || 12}
                onChange={(e) =>
                  patchSection(activeSection, {
                    limit: Math.min(48, Math.max(1, Number(e.target.value) || 12)),
                  })
                }
                className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-brand-800">«Tümünü gör» linki</span>
              <input
                type="text"
                value={activeCfg?.seeAllHref || ''}
                onChange={(e) => patchSection(activeSection, { seeAllHref: e.target.value })}
                className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 sm:col-span-2 cursor-pointer">
              <input
                type="checkbox"
                checked={activeCfg?.autoFill === false}
                onChange={(e) => patchSection(activeSection, { autoFill: !e.target.checked })}
                className="rounded border-brand-300"
              />
              <span className="text-sm text-brand-900">
                Sadece seçtiğim ürünler (otomatik doldurma kapalı)
              </span>
            </label>
          </>
        )}
        {activeSection === 'allProducts' && (
          <label className="flex items-center gap-2 sm:col-span-2 cursor-pointer">
            <input
              type="checkbox"
              checked={activeCfg?.showSort !== false}
              onChange={(e) => patchSection(activeSection, { showSort: e.target.checked })}
              className="rounded border-brand-300"
            />
            <span className="text-sm text-brand-900">Sıralama menüsünü göster</span>
          </label>
        )}
      </div>

      {isStrip && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-brand-900 flex items-center gap-2">
                <Pin className="h-4 w-4 text-accent-gold" />
                Seçilen ürünler ({pinnedIds.length}
                {activeCfg?.limit ? ` / ${activeCfg.limit}` : ''})
              </h3>
              {pinnedIds.length > 0 && (
                <button
                  type="button"
                  onClick={clearProducts}
                  className="text-xs text-red-600 hover:underline"
                >
                  Tümünü kaldır
                </button>
              )}
            </div>

            {pinnedIds.length === 0 ? (
              <p className="text-sm text-gray-500 border border-dashed border-brand-200 rounded-xl p-4">
                Henüz ürün seçilmedi. Sağdan arayıp ekleyin. Otomatik doldurma açıksa katalog
                kurallarıyla tamamlanır.
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
                          <span className="text-xs text-accent-gold font-medium shrink-0">+ Ekle</span>
                        )}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-100">
        <Button type="button" variant="primary" onClick={save}>
          Düzeni kaydet
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setLocalLayout(normalizeHomepageLayout(store.settings))}
        >
          Geri al
        </Button>
      </div>
    </div>
  );
}
