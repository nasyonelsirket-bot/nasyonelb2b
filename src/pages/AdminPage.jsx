import { useState, useEffect, useCallback, startTransition } from 'react';
import { Lock, Package, FolderOpen, Image, Settings, Upload, RefreshCw, Trash2, LogOut } from 'lucide-react';
import Button from '@/components/ui/Button';
import AdminToast from '@/components/admin/AdminToast';
import ProductsAdmin from '@/components/admin/ProductsAdmin';
import ImageDropzone from '@/components/admin/ImageDropzone';
import { processImageFile } from '@/utils/imageUpload';
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

export default function AdminPage() {
  const store = useStore();
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('b2b_admin') === '1');
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState('products');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');
  const [tyLoading, setTyLoading] = useState(false);
  const [tyProgress, setTyProgress] = useState(null);

  const showMsg = useCallback((text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
  }, []);

  const clearMsg = useCallback(() => setMsg(''), []);

  useEffect(() => {
    document.title = authed ? 'Admin Panel' : 'Admin Girişi';
  }, [authed]);

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
      <AdminToast message={msg} type={msgType} onClose={clearMsg} />
      <div className="min-h-screen bg-gray-100">
        <div className="bg-brand-900 text-white px-4 py-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold">Admin Panel</h1>
          <button type="button" onClick={logout} className="flex items-center gap-2 text-sm hover:text-brand-200">
            <LogOut className="h-4 w-4" /> Çıkış
          </button>
        </div>

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
              <ProductsAdmin store={store} showMsg={showMsg} />
            )}

            {tab === 'categories' && (
              <CategoryAdmin store={store} setMsg={showMsg} />
            )}

            {tab === 'banners' && (
              <BannerAdmin store={store} setMsg={showMsg} />
            )}

            {tab === 'settings' && (
              <SettingsAdmin store={store} setMsg={showMsg} />
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
    if (!b.title.trim()) return;
    startTransition(() => store.addBanner(b));
    setB({ title: '', subtitle: '', image: '', link: '/', active: true });
    setMsg('Banner eklendi');
  };
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
      <h2 className="font-bold">Banner Yönetimi</h2>
      <input placeholder="Başlık" value={b.title} onChange={(e) => setB({ ...b, title: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
      <input placeholder="Alt başlık" value={b.subtitle} onChange={(e) => setB({ ...b, subtitle: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
      <input placeholder="Link (örn: /kampanyalar)" value={b.link} onChange={(e) => setB({ ...b, link: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
      <ImageDropzone
        label="Banner görseli"
        hint="Görseli sürükle-bırak veya tıkla"
        value={b.image}
        onChange={(url) => setB({ ...b, image: url })}
        onFile={(file) => processImageFile(file, { maxWidth: 1400, maxHeight: 600, quality: 0.85 })}
        aspect="video"
      />
      <Button variant="primary" onClick={add}>Banner Ekle</Button>
      <ul className="space-y-3 mt-4">
        {banners.map((banner) => (
          <li key={banner.id} className="flex gap-3 items-center border-b border-brand-50 py-3">
            {banner.image && (
              <img src={banner.image} alt="" className="h-14 w-24 rounded object-cover shrink-0" />
            )}
            <span className="flex-1 text-sm font-medium">{banner.title}</span>
            <button type="button" onClick={() => store.deleteBanner(banner.id)} className="text-red-600 shrink-0">
              <Trash2 className="h-4 w-4" />
            </button>
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
    startTransition(() => {
      store.updateSettings(creds);
    });
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
          Onaylı ürünler görsel, stok kodu ve satış fiyatı ile çekilir. Toptan fiyat = Trendyol fiyatı ÷ bölücü.
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
    startTransition(() => {
      store.updateSettings(s);
    });
    setMsg('Ayarlar kaydedildi');
  };
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
      <h2 className="font-bold">Site Ayarları</h2>
      <ImageDropzone
        label="Site logosu"
        hint="Logoyu sürükle-bırak — marka temasına uygun arka plan uygulanır"
        value={s.logoUrl}
        onChange={(url) => setS({ ...s, logoUrl: url })}
        onFile={(file) =>
          processImageFile(file, { maxWidth: 400, maxHeight: 160, quality: 0.9, addBrandBackground: true })
        }
        aspect="logo"
      />
      {[
        ['whatsappNumber', 'WhatsApp Numarası'],
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
