import { useState } from 'react';
import { Lock, Package, FolderOpen, Image, Settings, Upload, RefreshCw, Trash2, Plus, LogOut } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';
import { useStore } from '@/context/StoreContext';
import { parseExcelFile } from '@/utils/excel';
import { syncAllTrendyolProducts } from '@/services/trendyol';

const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

const TABS = [
  { id: 'products', label: 'Ürünler', icon: Package },
  { id: 'categories', label: 'Kategoriler', icon: FolderOpen },
  { id: 'banners', label: 'Bannerlar', icon: Image },
  { id: 'settings', label: 'Ayarlar', icon: Settings },
  { id: 'excel', label: 'Excel', icon: Upload },
  { id: 'trendyol', label: 'Trendyol', icon: RefreshCw },
];

const EMPTY_PRODUCT = {
  name: '',
  sku: '',
  category: '',
  price: 0,
  image: '',
  description: '',
  isNew: false,
  isCampaign: false,
  minOrder: 1,
};

export default function AdminPage() {
  const store = useStore();
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('b2b_admin') === '1');
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState('products');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');
  const [tyLoading, setTyLoading] = useState(false);
  const [tyProgress, setTyProgress] = useState(null);

  const products = Array.isArray(store.products) ? store.products : [];

  const showMsg = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
  };

  const login = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASS) {
      sessionStorage.setItem('b2b_admin', '1');
      setAuthed(true);
    } else showMsg('Hatalı şifre', 'error');
  };

  const logout = () => {
    sessionStorage.removeItem('b2b_admin');
    setAuthed(false);
  };

  const saveProduct = (e) => {
    e.preventDefault();
    if (editing) {
      store.updateProduct(editing, form);
      showMsg('Ürün güncellendi');
    } else {
      store.addProduct({ ...form, id: `p-${Date.now()}` });
      showMsg('Ürün eklendi');
    }
    setEditing(null);
    setForm(EMPTY_PRODUCT);
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({ ...p });
    setTab('products');
  };

  const handleDeleteProduct = (id, name) => {
    if (!id) return;
    if (!window.confirm(`"${name || 'Bu ürün'}" silinsin mi?`)) return;
    store.deleteProduct(id);
    if (editing === id) {
      setEditing(null);
      setForm(EMPTY_PRODUCT);
    }
    showMsg('Ürün silindi');
  };

  const handleExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { products, categories } = await parseExcelFile(file);
      store.importProducts(products, categories);
      showMsg(`${products.length} ürün içe aktarıldı`);
    } catch (err) {
      showMsg(`Excel hatası: ${err.message}`, 'error');
    }
    e.target.value = '';
  };

  const handleTrendyol = async () => {
    const { trendyolSupplierId, trendyolApiKey, trendyolApiSecret } = store.settings;
    if (!trendyolSupplierId || !trendyolApiKey || !trendyolApiSecret) {
      showMsg('Önce Trendyol API bilgilerini kaydedin (Trendyol sekmesi)', 'error');
      setTab('trendyol');
      return;
    }
    setTyLoading(true);
    setMsg('');
    try {
      const { products: tyProducts, categories } = await syncAllTrendyolProducts(store.settings, setTyProgress);
      store.importProducts(tyProducts, categories);
      showMsg(`${tyProducts.length} Trendyol ürünü senkronize edildi`);
    } catch (err) {
      showMsg(`Trendyol: ${err.message}`, 'error');
    }
    setTyLoading(false);
  };

  if (!authed) {
    return (
      <>
        <SEO title="Admin" noindex />
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <form onSubmit={login} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-card border border-brand-100">
            <Lock className="h-10 w-10 text-brand-600 mx-auto" />
            <h1 className="text-center font-display text-xl font-bold mt-4">Admin Girişi</h1>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-6 w-full rounded-lg border border-brand-200 px-4 py-2.5"
              placeholder="Şifre"
            />
            {msg && <p className="text-red-600 text-sm mt-2">{msg}</p>}
            <Button type="submit" variant="primary" className="mt-4 w-full">Giriş</Button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Admin Panel" noindex />
      <div className="min-h-screen bg-gray-100">
        <div className="bg-brand-900 text-white px-4 py-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold">Admin Panel</h1>
          <button type="button" onClick={logout} className="flex items-center gap-2 text-sm hover:text-brand-200">
            <LogOut className="h-4 w-4" /> Çıkış
          </button>
        </div>

        {msg && (
          <div className={`text-center py-2 text-sm ${msgType === 'error' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>{msg}</div>
        )}

        <div className="flex flex-col lg:flex-row">
          <nav className="lg:w-56 bg-white border-r border-brand-100 p-4 flex lg:flex-col gap-2 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setTab(id); setMsg(''); setMsgType('success'); }}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap ${tab === id ? 'bg-brand-600 text-white' : 'text-brand-700 hover:bg-brand-50'}`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </nav>

          <main className="flex-1 p-6 max-w-5xl">
            {tab === 'products' && (
              <div className="space-y-8">
                <form onSubmit={saveProduct} className="rounded-2xl bg-white p-6 shadow-card space-y-4">
                  <h2 className="font-bold text-brand-900">{editing ? 'Ürün Düzenle' : 'Ürün Ekle'}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {['name', 'sku', 'category', 'image'].map((f) => (
                      <input
                        key={f}
                        placeholder={f}
                        value={form[f] || ''}
                        onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                        className="rounded-lg border border-brand-200 px-3 py-2 text-sm"
                        required={f === 'name' || f === 'sku'}
                      />
                    ))}
                    <input type="number" step="0.01" placeholder="Fiyat" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })} className="rounded-lg border border-brand-200 px-3 py-2 text-sm" />
                    <input type="number" min="1" placeholder="Min. Sipariş Adedi" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: parseInt(e.target.value, 10) || 1 })} className="rounded-lg border border-brand-200 px-3 py-2 text-sm" />
                  </div>
                  <textarea placeholder="Açıklama" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm h-20" />
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isNew} onChange={(e) => setForm({ ...form, isNew: e.target.checked })} /> Yeni</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isCampaign} onChange={(e) => setForm({ ...form, isCampaign: e.target.checked })} /> Kampanya</label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" variant="primary"><Plus className="h-4 w-4" /> Kaydet</Button>
                    {editing && <Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm(EMPTY_PRODUCT); }}>İptal</Button>}
                  </div>
                </form>

                <div className="rounded-2xl bg-white shadow-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-brand-50">
                      <tr>
                        <th className="p-3 text-left">Ürün</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Min</th>
                        <th className="p-3">Fiyat</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p, index) => (
                        <tr key={p.id || `row-${index}`} className="border-t border-brand-50">
                          <td className="p-3">{p.name}</td>
                          <td className="p-3 text-center">{p.sku}</td>
                          <td className="p-3 text-center">{p.minOrder || 1}</td>
                          <td className="p-3 text-center">{p.price} ₺</td>
                          <td className="p-3 flex gap-2 justify-end">
                            <button type="button" onClick={() => startEdit(p)} className="text-brand-600 text-xs">Düzenle</button>
                            <button type="button" onClick={() => handleDeleteProduct(p.id, p.name)} className="text-red-600" title="Sil"><Trash2 className="h-4 w-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'categories' && (
              <CategoryAdmin store={store} setMsg={setMsg} />
            )}

            {tab === 'banners' && (
              <BannerAdmin store={store} setMsg={setMsg} />
            )}

            {tab === 'settings' && (
              <SettingsAdmin store={store} setMsg={setMsg} />
            )}

            {tab === 'excel' && (
              <div className="rounded-2xl bg-white p-8 shadow-card">
                <h2 className="font-bold text-brand-900 mb-4">Excel Yükle</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Kolonlar: ürün adı, stok kodu, kategori, fiyat, görsel url, açıklama, minimum sipariş (opsiyonel)
                </p>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcel} className="block w-full text-sm" />
              </div>
            )}

            {tab === 'trendyol' && (
              <TrendyolAdmin
                store={store}
                setMsg={showMsg}
                tyLoading={tyLoading}
                tyProgress={tyProgress}
                onSync={handleTrendyol}
              />
            )}
          </main>
        </div>
      </div>
    </>
  );
}

function CategoryAdmin({ store, setMsg }) {
  const [name, setName] = useState('');
  const categories = Array.isArray(store.categories) ? store.categories : [];
  const add = () => {
    if (!name.trim()) return;
    store.addCategory({ name, slug: name.toLowerCase().replace(/\s+/g, '-'), icon: '📦' });
    setName('');
    setMsg('Kategori eklendi');
  };
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
      <h2 className="font-bold">Kategori Yönetimi</h2>
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kategori adı" className="flex-1 rounded-lg border px-3 py-2 text-sm" />
        <Button variant="primary" onClick={add}>Ekle</Button>
      </div>
      <ul className="space-y-2">
        {categories.map((c) => (
          <li key={c.id} className="flex justify-between items-center border-b py-2 text-sm">
            <span>{c.icon} {c.name}</span>
            <button type="button" onClick={() => store.deleteCategory(c.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BannerAdmin({ store, setMsg }) {
  const banners = Array.isArray(store.banners) ? store.banners : [];
  const [b, setB] = useState({ title: '', subtitle: '', image: '', link: '/', active: true });
  const add = () => {
    store.addBanner(b);
    setB({ title: '', subtitle: '', image: '', link: '/', active: true });
    setMsg('Banner eklendi');
  };
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
      <h2 className="font-bold">Banner Yönetimi</h2>
      <input placeholder="Başlık" value={b.title} onChange={(e) => setB({ ...b, title: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
      <input placeholder="Alt başlık" value={b.subtitle} onChange={(e) => setB({ ...b, subtitle: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
      <input placeholder="Görsel URL" value={b.image} onChange={(e) => setB({ ...b, image: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
      <Button variant="primary" onClick={add}>Banner Ekle</Button>
      <ul className="space-y-2 mt-4">
        {banners.map((banner) => (
          <li key={banner.id} className="flex justify-between text-sm border-b py-2">
            <span>{banner.title}</span>
            <button type="button" onClick={() => store.deleteBanner(banner.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrendyolAdmin({ store, setMsg, tyLoading, tyProgress, onSync }) {
  const [creds, setCreds] = useState({
    trendyolSupplierId: store.settings.trendyolSupplierId || '',
    trendyolApiKey: store.settings.trendyolApiKey || '',
    trendyolApiSecret: store.settings.trendyolApiSecret || '',
    trendyolPriceDivisor: store.settings.trendyolPriceDivisor || '4',
  });

  const saveCreds = () => {
    store.updateSettings(creds);
    setMsg('Trendyol API bilgileri kaydedildi');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <h2 className="font-bold text-brand-900">Trendyol API Ayarları</h2>
        <p className="text-sm text-gray-600">
          Trendyol Satıcı Paneli → Entegrasyonlar bölümünden API bilgilerinizi alın.
        </p>
        {[
          ['trendyolSupplierId', 'Satıcı ID (Supplier ID)', 'text'],
          ['trendyolApiKey', 'API Key', 'text'],
          ['trendyolApiSecret', 'API Secret', 'password'],
          ['trendyolPriceDivisor', 'Fiyat Bölücü (örn: 4 = fiyat/4)', 'number'],
        ].map(([key, label, type]) => (
          <div key={key}>
            <label className="text-xs text-gray-500">{label}</label>
            <input
              type={type}
              value={creds[key] || ''}
              onChange={(e) => setCreds({ ...creds, [key]: e.target.value })}
              className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm mt-1"
              placeholder={label}
            />
          </div>
        ))}
        <Button variant="primary" onClick={saveCreds}>API Bilgilerini Kaydet</Button>
      </div>

      <div className="rounded-2xl bg-white p-8 shadow-card">
        <h2 className="font-bold text-brand-900 mb-4">Aktif Ürünleri Çek</h2>
        <p className="text-sm text-gray-600 mb-4">
          Onaylı ve satışta olan ürünleriniz çekilir. Toptan fiyat = Trendyol fiyatı ÷ bölücü.
        </p>
        {tyProgress && (
          <p className="text-sm text-brand-600 mb-2">
            Sayfa {tyProgress.page}/{tyProgress.totalPages} — {tyProgress.count} ürün
          </p>
        )}
        <Button variant="primary" onClick={onSync} disabled={tyLoading}>
          <RefreshCw className={`h-4 w-4 ${tyLoading ? 'animate-spin' : ''}`} />
          {tyLoading ? 'Senkronize ediliyor...' : 'Trendyol Ürünlerini Çek'}
        </Button>
      </div>
    </div>
  );
}

function SettingsAdmin({ store, setMsg }) {
  const [s, setS] = useState({ ...store.settings });
  const save = () => {
    store.updateSettings(s);
    setMsg('Ayarlar kaydedildi');
  };
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
      <h2 className="font-bold">Site Ayarları</h2>
      {[
        ['whatsappNumber', 'WhatsApp Numarası'],
        ['logoUrl', 'Logo URL'],
        ['metaPixelId', 'Meta Pixel ID'],
        ['gaId', 'Google Analytics ID'],
        ['siteUrl', 'Site URL'],
        ['contactPhone', 'Telefon'],
        ['contactEmail', 'E-posta'],
      ].map(([key, label]) => (
        <div key={key}>
          <label className="text-xs text-gray-500">{label}</label>
          <input value={s[key] || ''} onChange={(e) => setS({ ...s, [key]: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm mt-1" />
        </div>
      ))}
      <Button variant="primary" onClick={save}>Kaydet</Button>
      <Button variant="danger" onClick={() => { if (confirm('Demo verilere dönülsün mü?')) store.resetToDemo(); setMsg('Demo veriler yüklendi'); }}>
        Demo Verilere Dön
      </Button>
    </div>
  );
}
