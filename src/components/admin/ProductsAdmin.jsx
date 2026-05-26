import { useState, useMemo, useEffect, useRef, startTransition } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import ImageDropzone from '@/components/admin/ImageDropzone';
import ProductSeoFields from '@/components/admin/ProductSeoFields';
import { processImageFile } from '@/utils/imageUpload';
import { validateProductSeoForm } from '@/utils/productSeo';
import { getSiteUrl } from '@/utils/canonicalSiteUrl';
import {
  getCompareAtPrice,
  getDiscountPercent,
  normalizeProductPrices,
  validateProductPricing,
} from '@/utils/productPricing';
import { formatPrice } from '@/utils/whatsapp';

const EMPTY_PRODUCT = {
  name: '',
  sku: '',
  category: '',
  price: 0,
  compareAtPrice: '',
  image: '',
  description: '',
  slug: '',
  meta_title: '',
  meta_description: '',
  canonical_url: '',
};

function ProductPricingFields({ form, setForm }) {
  const salePrice = Number(form.price) || 0;
  const listInput = Number(form.compareAtPrice);
  const hasListInput = Number.isFinite(listInput) && listInput > 0;
  const previewProduct = hasListInput ? { ...form, compareAtPrice: listInput } : form;
  const listPrice = getCompareAtPrice(previewProduct);
  const showDiscount = salePrice > 0 && listPrice > salePrice;
  const pct = showDiscount ? getDiscountPercent(previewProduct) : 0;

  return (
    <div className="sm:col-span-2 rounded-xl border border-brand-100 bg-brand-50/40 p-3 space-y-3">
      <p className="text-xs font-semibold text-brand-800">Fiyatlandırma</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">Liste fiyatı (₺) — kaçtan</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.compareAtPrice === '' || form.compareAtPrice == null ? '' : form.compareAtPrice}
            onChange={(e) => {
              const raw = e.target.value;
              if (!raw.trim()) {
                setForm({ ...form, compareAtPrice: '' });
                return;
              }
              const v = parseFloat(raw.replace(',', '.'));
              setForm({ ...form, compareAtPrice: Number.isFinite(v) ? v : '' });
            }}
            placeholder="Örn. 379.90"
            className="w-full mt-1 rounded-lg border border-brand-200 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-[10px] text-gray-500">Üstü çizili eski fiyat. Boş bırakılırsa satış fiyatının 2 katı kullanılır.</p>
        </div>
        <div>
          <label className="text-xs text-gray-500">Satış fiyatı (₺) — kaça</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={Number.isFinite(form.price) && form.price !== 0 ? form.price : form.price === 0 ? 0 : ''}
            onChange={(e) => {
              const v = parseFloat(e.target.value.replace(',', '.'));
              setForm({ ...form, price: Number.isFinite(v) ? v : 0 });
            }}
            className="w-full mt-1 rounded-lg border border-brand-200 px-3 py-2 text-sm"
            required
          />
        </div>
      </div>
      {salePrice > 0 && (
        <p className="text-xs text-brand-800">
          {showDiscount ? (
            <>
              Önizleme:{' '}
              <span className="line-through text-gray-500">{formatPrice(listPrice)}</span>
              {' → '}
              <span className="font-bold text-brand-700">{formatPrice(salePrice)}</span>
              {pct >= 5 && (
                <span className="ml-1.5 inline-flex rounded bg-red-700 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  %{pct} indirim
                </span>
              )}
            </>
          ) : hasListInput ? (
            <span className="text-amber-800">
              Liste fiyatı satış fiyatından büyük olmalı — aksi halde indirim rozeti görünmez.
            </span>
          ) : (
            <>
              Önizleme:{' '}
              <span className="line-through text-gray-500">{formatPrice(listPrice)}</span>
              {' → '}
              <span className="font-bold text-brand-700">{formatPrice(salePrice)}</span>
              <span className="text-gray-500 ml-1">(otomatik %50 indirim görünümü)</span>
            </>
          )}
        </p>
      )}
    </div>
  );
}

function ProductFormFields({ form, setForm }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="text-xs text-gray-500">Ürün adı</label>
        <input
          value={form.name || ''}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full mt-1 rounded-lg border border-brand-200 px-3 py-2 text-sm"
          required
        />
      </div>
      <div>
        <label className="text-xs text-gray-500">Stok kodu</label>
        <input
          value={form.sku || ''}
          onChange={(e) => setForm({ ...form, sku: e.target.value })}
          className="w-full mt-1 rounded-lg border border-brand-200 px-3 py-2 text-sm"
          required
        />
      </div>
      <div>
        <label className="text-xs text-gray-500">Kategori</label>
        <input
          value={form.category || ''}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full mt-1 rounded-lg border border-brand-200 px-3 py-2 text-sm"
        />
      </div>
      <ProductPricingFields form={form} setForm={setForm} />
      <div className="sm:col-span-2">
        <ImageDropzone
          label="Ürün görseli"
          value={form.image}
          onChange={(url) => setForm({ ...form, image: url })}
          onFile={(file) => processImageFile(file, { maxWidth: 800, maxHeight: 800 })}
          aspect="square"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs text-gray-500">Açıklama</label>
        <textarea
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full mt-1 rounded-lg border border-brand-200 px-3 py-2 text-sm h-16"
        />
      </div>
    </div>
  );
}

function normalizeSearch(value) {
  return String(value || '').trim().toLocaleLowerCase('tr');
}

function productToForm(product) {
  const compare = Number(product?.compareAtPrice);
  return {
    ...product,
    compareAtPrice: Number.isFinite(compare) && compare > 0 ? compare : '',
  };
}

function validateProductForm(form, products, excludeId) {
  const pricing = validateProductPricing(form);
  if (!pricing.ok) {
    return { ok: false, errors: pricing.errors, warnings: pricing.warnings };
  }
  const seo = validateProductSeoForm(form, products, excludeId);
  return {
    ok: seo.ok,
    errors: seo.errors,
    warnings: [...pricing.warnings, ...seo.warnings],
  };
}

export default function ProductsAdmin({ store, showMsg }) {
  const products = Array.isArray(store.products) ? store.products : [];
  const siteUrl = getSiteUrl(store.settings);
  const siteName = store.settings?.siteName || 'Nasyonel Toys';
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_PRODUCT);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_PRODUCT);
  const [selected, setSelected] = useState(() => new Set());
  const [searchName, setSearchName] = useState('');
  const [searchSku, setSearchSku] = useState('');

  const filteredProducts = useMemo(() => {
    const nameQ = normalizeSearch(searchName);
    const skuQ = normalizeSearch(searchSku);
    if (!nameQ && !skuQ) return products;

    return products.filter((p) => {
      const name = normalizeSearch(p.name);
      const sku = normalizeSearch(p.sku);
      if (nameQ && !name.includes(nameQ)) return false;
      if (skuQ && !sku.includes(skuQ)) return false;
      return true;
    });
  }, [products, searchName, searchSku]);

  const hasActiveSearch = Boolean(searchName.trim() || searchSku.trim());

  const clearSearch = () => {
    setSearchName('');
    setSearchSku('');
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredProducts.map((p) => p.id).filter(Boolean);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
    if (allVisibleSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const handleBulkDelete = () => {
    const ids = [...selected];
    if (!ids.length) return;
    if (!window.confirm(`${ids.length} ürün silinsin mi?`)) return;
    startTransition(() => {
      store.deleteProducts(ids);
      if (editingId && ids.includes(editingId)) {
        setEditingId(null);
        setEditForm(EMPTY_PRODUCT);
      }
    });
    setSelected(new Set());
    showMsg(`${ids.length} ürün silindi`);
  };

  const handleDeleteOne = (id, name) => {
    if (!id) return;
    if (!window.confirm(`"${name || 'Bu ürün'}" silinsin mi?`)) return;
    startTransition(() => {
      store.deleteProduct(id);
      if (editingId === id) {
        setEditingId(null);
        setEditForm(EMPTY_PRODUCT);
      }
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    });
    showMsg('Ürün silindi');
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm(productToForm(p));
    setShowAdd(false);
  };

  const saveEdit = (e) => {
    e.preventDefault();
    const { errors, warnings, ok } = validateProductForm(editForm, products, editingId);
    if (!ok) {
      showMsg(errors[0], 'error');
      return;
    }
    const payload = normalizeProductPrices(editForm);
    startTransition(() => store.updateProduct(editingId, payload));
    setEditingId(null);
    showMsg(
      warnings.length
        ? `Ürün güncellendi. ${warnings[0]}`
        : 'Ürün güncellendi',
    );
  };

  const addProduct = (e) => {
    e.preventDefault();
    const { errors, warnings, ok } = validateProductForm(addForm, products, null);
    if (!ok) {
      showMsg(errors[0], 'error');
      return;
    }
    const payload = normalizeProductPrices(addForm);
    startTransition(() => store.addProduct({ ...payload, id: `p-${Date.now()}` }));
    setAddForm(EMPTY_PRODUCT);
    setShowAdd(false);
    showMsg(
      warnings.length
        ? `Ürün eklendi. ${warnings[0]}`
        : 'Ürün eklendi',
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="primary" onClick={() => setShowAdd((v) => !v)}>
          <Plus className="h-4 w-4" />
          Yeni Ürün
          {showAdd ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {selected.size > 0 && (
          <Button type="button" variant="danger" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4" />
            Seçilenleri Sil ({selected.size})
          </Button>
        )}
        <span className="text-sm text-gray-500 ml-auto">
          {hasActiveSearch
            ? `${filteredProducts.length} / ${products.length} ürün`
            : `${products.length} ürün`}
        </span>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-card border border-brand-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Ürün adı ile ara"
              className="w-full rounded-lg border border-brand-200 pl-9 pr-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={searchSku}
              onChange={(e) => setSearchSku(e.target.value)}
              placeholder="Stok kodu ile ara"
              className="w-full rounded-lg border border-brand-200 pl-9 pr-3 py-2.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
          {hasActiveSearch && (
            <button
              type="button"
              onClick={clearSearch}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-brand-200 px-4 py-2.5 text-sm text-brand-700 hover:bg-brand-50 whitespace-nowrap"
            >
              <X className="h-4 w-4" />
              Temizle
            </button>
          )}
        </div>
      </div>

      {showAdd && (
        <form onSubmit={addProduct} className="rounded-2xl bg-white p-5 shadow-card border border-brand-100 space-y-3">
          <h3 className="font-semibold text-brand-900 text-sm">Yeni ürün ekle</h3>
          <ProductFormFields form={addForm} setForm={setAddForm} />
          <ProductSeoFields
            form={addForm}
            setForm={setAddForm}
            products={products}
            siteUrl={siteUrl}
            siteName={siteName}
          />
          <div className="flex gap-2">
            <Button type="submit" variant="primary">Kaydet</Button>
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>İptal</Button>
          </div>
        </form>
      )}

      <div
        className={`rounded-2xl bg-white shadow-card ${editingId ? 'overflow-visible' : 'overflow-hidden'}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50">
              <tr>
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredProducts.length > 0 &&
                      filteredProducts.every((p) => selected.has(p.id))
                    }
                    onChange={toggleSelectAll}
                    aria-label="Görünenleri seç"
                  />
                </th>
                <th className="p-3 text-left w-14">Görsel</th>
                <th className="p-3 text-left">Ürün</th>
                <th className="p-3">Stok kodu</th>
                <th className="p-3">Fiyat</th>
                <th className="p-3 w-28"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p, index) => (
                <ProductRow
                  key={p.id || `row-${index}`}
                  p={p}
                  editingId={editingId}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  selected={selected}
                  products={products}
                  siteUrl={siteUrl}
                  siteName={siteName}
                  onToggleSelect={toggleSelect}
                  onStartEdit={startEdit}
                  onCloseEdit={() => setEditingId(null)}
                  onSaveEdit={saveEdit}
                  onDelete={handleDeleteOne}
                />
              ))}
            </tbody>
          </table>
        </div>
        {!products.length && (
          <p className="text-center text-gray-500 py-8 text-sm">Henüz ürün yok. Yeni ürün ekleyin veya Trendyol’dan çekin.</p>
        )}
        {products.length > 0 && !filteredProducts.length && (
          <p className="text-center text-gray-500 py-8 text-sm">
            Arama kriterlerine uygun ürün bulunamadı.
            <button type="button" onClick={clearSearch} className="block mx-auto mt-2 text-brand-600 text-xs font-medium hover:underline">
              Aramayı temizle
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

function ProductTablePrice({ product }) {
  const sale = Number(product?.price) || 0;
  const compare = getCompareAtPrice(product);
  if (sale <= 0) {
    return <span className="text-amber-700 text-xs font-medium">Fiyat yok</span>;
  }
  if (compare > sale) {
    return (
      <div className="text-xs leading-snug">
        <span className="text-gray-500 line-through block">{formatPrice(compare)}</span>
        <span className="font-semibold text-brand-700">{formatPrice(sale)}</span>
      </div>
    );
  }
  return <span className="font-semibold text-brand-700">{formatPrice(sale)}</span>;
}

function ProductRow({
  p,
  editingId,
  editForm,
  setEditForm,
  selected,
  products,
  siteUrl,
  siteName,
  onToggleSelect,
  onStartEdit,
  onCloseEdit,
  onSaveEdit,
  onDelete,
}) {
  const isEditing = editingId === p.id;
  const seoSectionRef = useRef(null);

  useEffect(() => {
    if (!isEditing) return;
    const t = setTimeout(() => {
      seoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
    return () => clearTimeout(t);
  }, [isEditing]);

  return (
    <>
      <tr className={`border-t border-brand-50 ${isEditing ? 'bg-brand-50/50' : ''}`}>
        <td className="p-3">
          <input
            type="checkbox"
            checked={selected.has(p.id)}
            onChange={() => onToggleSelect(p.id)}
          />
        </td>
        <td className="p-3">
          {p.image ? (
            <div className="product-media product-media--thumb !w-10 !h-10 rounded border border-brand-100">
              {p.image ? (
                <img src={p.image} alt="" className="product-media-img p-0.5" />
              ) : (
                <span className="text-[10px] text-gray-400">—</span>
              )}
            </div>
          ) : (
            <div className="h-10 w-10 rounded bg-brand-100" />
          )}
        </td>
        <td className="p-3 font-medium">{p.name}</td>
        <td className="p-3 text-center text-gray-600">{p.sku}</td>
        <td className="p-3 text-center">
          <ProductTablePrice product={p} />
        </td>
        <td className="p-3">
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => (isEditing ? onCloseEdit() : onStartEdit(p))}
              className="text-brand-600 text-xs font-medium"
            >
              {isEditing ? 'Kapat' : 'Düzenle'}
            </button>
            <button type="button" onClick={() => onDelete(p.id, p.name)} className="text-red-600" title="Sil">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
      {isEditing && (
        <tr className="bg-brand-50/30">
          <td colSpan={7} className="p-4 overflow-visible">
            <form onSubmit={onSaveEdit} className="space-y-4 border border-brand-200 rounded-xl bg-white p-4 sm:p-5">
              <h4 className="font-semibold text-brand-900 text-sm">Ürünü düzenle — {p.name}</h4>
              <ProductFormFields form={editForm} setForm={setEditForm} />
              <div
                ref={seoSectionRef}
                id="product-seo-settings"
                className="scroll-mt-4 border-t border-brand-100 pt-4"
              >
                <ProductSeoFields
                  form={editForm}
                  setForm={setEditForm}
                  products={products}
                  excludeProductId={p.id}
                  siteUrl={siteUrl}
                  siteName={siteName}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary">Güncelle</Button>
                <Button type="button" variant="secondary" onClick={onCloseEdit}>İptal</Button>
              </div>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}

