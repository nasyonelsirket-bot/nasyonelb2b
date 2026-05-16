import { useState, useMemo, startTransition } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import ImageDropzone from '@/components/admin/ImageDropzone';
import { processImageFile } from '@/utils/imageUpload';

const EMPTY_PRODUCT = {
  name: '',
  sku: '',
  category: '',
  price: 0,
  image: '',
  description: '',
  minOrder: 1,
};

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
      <div>
        <label className="text-xs text-gray-500">Fiyat (₺)</label>
        <input
          type="number"
          step="0.01"
          value={Number.isFinite(form.price) ? form.price : ''}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            setForm({ ...form, price: Number.isFinite(v) ? v : 0 });
          }}
          className="w-full mt-1 rounded-lg border border-brand-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-gray-500">Min. sipariş</label>
        <input
          type="number"
          min="1"
          value={form.minOrder ?? 1}
          onChange={(e) => setForm({ ...form, minOrder: parseInt(e.target.value, 10) || 1 })}
          className="w-full mt-1 rounded-lg border border-brand-200 px-3 py-2 text-sm"
        />
      </div>
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

export default function ProductsAdmin({ store, showMsg }) {
  const products = Array.isArray(store.products) ? store.products : [];
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
    setEditForm({ ...p });
    setShowAdd(false);
  };

  const saveEdit = (e) => {
    e.preventDefault();
    startTransition(() => store.updateProduct(editingId, editForm));
    setEditingId(null);
    showMsg('Ürün güncellendi');
  };

  const addProduct = (e) => {
    e.preventDefault();
    startTransition(() => store.addProduct({ ...addForm, id: `p-${Date.now()}` }));
    setAddForm(EMPTY_PRODUCT);
    setShowAdd(false);
    showMsg('Ürün eklendi');
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
          <div className="flex gap-2">
            <Button type="submit" variant="primary">Kaydet</Button>
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>İptal</Button>
          </div>
        </form>
      )}

      <div className="rounded-2xl bg-white shadow-card overflow-hidden">
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
                <th className="p-3">Min</th>
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

function ProductRow({
  p,
  editingId,
  editForm,
  setEditForm,
  selected,
  onToggleSelect,
  onStartEdit,
  onCloseEdit,
  onSaveEdit,
  onDelete,
}) {
  const isEditing = editingId === p.id;

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
            <img src={p.image} alt="" className="h-10 w-10 rounded object-cover bg-brand-50" />
          ) : (
            <div className="h-10 w-10 rounded bg-brand-100" />
          )}
        </td>
        <td className="p-3 font-medium">{p.name}</td>
        <td className="p-3 text-center text-gray-600">{p.sku}</td>
        <td className="p-3 text-center">{p.minOrder || 1}</td>
        <td className="p-3 text-center font-semibold text-brand-700">{p.price} ₺</td>
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
          <td colSpan={7} className="p-4">
            <form onSubmit={onSaveEdit} className="space-y-3 border border-brand-200 rounded-xl bg-white p-4">
              <h4 className="font-semibold text-brand-900 text-sm">Ürünü düzenle — {p.name}</h4>
              <ProductFormFields form={editForm} setForm={setEditForm} />
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

