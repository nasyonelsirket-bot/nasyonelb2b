import { useState, useMemo } from 'react';
import { Plus, Trash2, Search, Link2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { normalizeBundleRules } from '@/utils/bundleRules';

function newRuleId() {
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function productLabel(p) {
  if (!p) return '—';
  return `${p.name || 'İsimsiz'}${p.sku ? ` · ${p.sku}` : ''} — ${p.price ?? 0} TL`;
}

function ProductPicker({ label, value, onChange, products, query, onQueryChange }) {
  const selected = products.find((p) => p.id === value);
  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr');
    const pool = q
      ? products.filter(
          (p) =>
            String(p.name || '')
              .toLocaleLowerCase('tr')
              .includes(q) ||
            String(p.sku || '')
              .toLocaleLowerCase('tr')
              .includes(q),
        )
      : products;
    return pool.slice(0, 40);
  }, [products, query]);

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      {selected && (
        <p className="text-sm font-medium text-brand-900 bg-brand-50 rounded-lg px-3 py-2">
          {productLabel(selected)}
        </p>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Ürün adı veya stok kodu ara..."
          className="w-full rounded-lg border border-brand-200 pl-9 pr-3 py-2 text-sm"
        />
      </div>
      {query.trim() && (
        <ul className="max-h-40 overflow-y-auto rounded-lg border border-brand-100 divide-y divide-brand-50">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(p.id);
                  onQueryChange('');
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-brand-50 ${
                  value === p.id ? 'bg-brand-100 font-semibold' : ''
                }`}
              >
                {productLabel(p)}
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-3 py-2 text-xs text-gray-500">Sonuç yok</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default function BundleRulesAdmin({ store, promos, saveLocal, showMsg }) {
  const products = store.products || [];
  const rules = normalizeBundleRules(promos.bundleRules);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const [form, setForm] = useState({
    title: '',
    triggerProductId: '',
    offerProductId: '',
    discountType: 'percent',
    discountPercent: 10,
    offerPrice: '',
    grantFreeShipping: true,
    active: true,
  });
  const [qTrigger, setQTrigger] = useState('');
  const [qOffer, setQOffer] = useState('');

  const addRule = () => {
    if (!form.triggerProductId || !form.offerProductId) {
      showMsg('Tetikleyici ve önerilen ürün seçin', 'error');
      return;
    }
    if (form.triggerProductId === form.offerProductId) {
      showMsg('İki ürün farklı olmalı', 'error');
      return;
    }
    const next = {
      ...promos,
      bundleRules: [
        ...rules,
        {
          id: newRuleId(),
          active: form.active,
          title: form.title.trim() || 'Birlikte al',
          triggerProductId: form.triggerProductId,
          offerProductId: form.offerProductId,
          discountType: form.discountType,
          discountPercent: Number(form.discountPercent) || 0,
          offerPrice: Number(form.offerPrice) || 0,
          grantFreeShipping: form.grantFreeShipping,
        },
      ],
    };
    saveLocal(next);
    setForm({
      title: '',
      triggerProductId: '',
      offerProductId: '',
      discountType: 'percent',
      discountPercent: 10,
      offerPrice: '',
      grantFreeShipping: true,
      active: true,
    });
    setQTrigger('');
    setQOffer('');
    showMsg('Birlikte al kuralı eklendi — Siteye Yayınla ile canlıya alın');
  };

  const removeRule = (id) => {
    saveLocal({
      ...promos,
      bundleRules: rules.filter((r) => r.id !== id),
    });
    showMsg('Kural silindi');
  };

  const toggleActive = (id) => {
    saveLocal({
      ...promos,
      bundleRules: rules.map((r) => (r.id === id ? { ...r, active: !r.active } : r)),
    });
  };

  return (
    <div className="rounded-2xl bg-amber-50/80 border border-amber-200 p-6 shadow-card space-y-4">
      <h3 className="font-bold text-brand-900 flex items-center gap-2">
        <Link2 className="h-5 w-5 text-amber-700" />
        Birlikte al kampanyaları ({rules.length})
      </h3>
      <p className="text-sm text-gray-600">
        Örnek: <strong>A ürünü</strong> sepetteyken müşteriye <strong>X ürününü</strong> özel fiyatla önerin.
        İkisini birlikte alınca kargo bedava olabilir.
      </p>

      <ul className="space-y-3">
        {rules.map((r) => {
          const trigger = byId.get(r.triggerProductId);
          const offer = byId.get(r.offerProductId);
          return (
            <li
              key={r.id}
              className="rounded-xl bg-white border border-amber-100 p-4 flex flex-wrap justify-between gap-3"
            >
              <div className="text-sm min-w-0 flex-1">
                <p className="font-bold text-brand-900">
                  {r.title || 'Birlikte al'}
                  {!r.active && (
                    <span className="ml-2 text-xs font-normal text-amber-700">(pasif)</span>
                  )}
                </p>
                <p className="text-gray-700 mt-1">
                  <span className="text-gray-500">Sepette:</span> {trigger?.name || r.triggerProductId}
                </p>
                <p className="text-gray-700">
                  <span className="text-gray-500">Öneri:</span> {offer?.name || r.offerProductId}
                </p>
                <p className="text-xs text-emerald-800 mt-1">
                  {r.discountType === 'fixed'
                    ? `Sepet fiyatı: ${r.offerPrice} TL`
                    : `%${r.discountPercent} indirim`}
                  {r.grantFreeShipping ? ' · Kargo bedava (ikisi sepette)' : ''}
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleActive(r.id)}
                  className="text-xs text-brand-600 hover:underline"
                >
                  {r.active ? 'Pasifleştir' : 'Aktifleştir'}
                </button>
                <button type="button" onClick={() => removeRule(r.id)} className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-amber-200 pt-4 space-y-3">
        <p className="text-sm font-medium text-brand-900">Yeni birlikte al kuralı</p>
        <input
          placeholder="Kampanya adı (örn: Araba + Figür seti)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ProductPicker
            label="A — Tetikleyici ürün (sepete eklenince öneri çıkar)"
            value={form.triggerProductId}
            onChange={(id) => setForm({ ...form, triggerProductId: id })}
            products={products}
            query={qTrigger}
            onQueryChange={setQTrigger}
          />
          <ProductPicker
            label="X — Önerilen ürün (indirimli sepete eklenecek)"
            value={form.offerProductId}
            onChange={(id) => setForm({ ...form, offerProductId: id })}
            products={products}
            query={qOffer}
            onQueryChange={setQOffer}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-xs text-gray-500">İndirim türü</span>
            <select
              value={form.discountType}
              onChange={(e) => setForm({ ...form, discountType: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="percent">Yüzde indirim</option>
              <option value="fixed">Sabit sepet fiyatı (TL)</option>
            </select>
          </label>
          {form.discountType === 'percent' ? (
            <label className="block text-sm">
              <span className="text-xs text-gray-500">İndirim %</span>
              <input
                type="number"
                min={0}
                max={100}
                value={form.discountPercent}
                onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
          ) : (
            <label className="block text-sm">
              <span className="text-xs text-gray-500">Sepette görünecek fiyat (TL)</span>
              <input
                type="number"
                min={0}
                value={form.offerPrice}
                onChange={(e) => setForm({ ...form, offerPrice: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Örn: 199"
              />
            </label>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.grantFreeShipping}
            onChange={(e) => setForm({ ...form, grantFreeShipping: e.target.checked })}
          />
          İki ürün de sepetteyken <strong>kargo bedava</strong>
        </label>
        <Button type="button" variant="primary" onClick={addRule}>
          <Plus className="h-4 w-4" /> Kural ekle
        </Button>
      </div>
    </div>
  );
}
