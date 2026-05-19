<<<<<<< HEAD
import { useState, useEffect, useCallback, startTransition } from 'react';
import { Lock, Package, FolderOpen, Image, Settings, Upload, RefreshCw, Trash2, LogOut, FileText, CloudUpload } from 'lucide-react';
import { getAdminPasswordForPublish, askPublishPassword } from '@/services/catalogApi';
import PdfSettingsAdmin from '@/components/admin/PdfSettingsAdmin';
import { bannerSpecText, logoSpecText } from '@/constants/mediaSpecs';
import Button from '@/components/ui/Button';
import AdminToast from '@/components/admin/AdminToast';
import ProductsAdmin from '@/components/admin/ProductsAdmin';
import ImageDropzone from '@/components/admin/ImageDropzone';
import EmojiPicker from '@/components/admin/EmojiPicker';
import { suggestEmojiForName } from '@/data/categoryEmojis';
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
  { id: 'pdf', label: 'PDF', icon: FileText },
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
      sessionStorage.setItem('b2b_admin_pass', password);
      setAuthed(true);
    } else showMsg('Hatalı şifre', 'error');
  };

  const logout = () => {
    sessionStorage.removeItem('b2b_admin');
    sessionStorage.removeItem('b2b_admin_pass');
    setAuthed(false);
  };

  const handlePublishCatalog = async () => {
    const pass = askPublishPassword();
    if (!pass) {
      showMsg('Yayınlama iptal edildi', 'error');
      return;
    }
    try {
      sessionStorage.setItem('b2b_admin_pass', pass);
      const result = await store.publishCatalog(pass);
      showMsg(`${result.productCount} ürün siteye yayınlandı — müşteriler artık görebilir`);
    } catch (err) {
      showMsg(err.message || 'Yayınlama başarısız', 'error');
    }
  };

  const handleExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { products, categories } = await parseExcelFile(file);
      store.importProducts(products, categories);
      const pass = getAdminPasswordForPublish();
      if (pass && products.length) {
        try {
          await store.publishCatalog(pass);
          showMsg(`${products.length} ürün içe aktarıldı ve siteye yayınlandı`);
        } catch {
          showMsg(`${products.length} ürün içe aktarıldı — yayın için Siteye Yayınla`);
        }
      } else {
        showMsg(`${products.length} ürün içe aktarıldı`);
      }
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
      store.importTrendyolProducts(tyProducts);
      const pass = askPublishPassword();
      if (pass) {
        sessionStorage.setItem('b2b_admin_pass', pass);
        try {
          const pub = await store.publishCatalog(pass);
          showMsg(
            `${tyProducts.length} ürün çekildi ve siteye yayınlandı (${pub.productCount} ürün canlı)`,
          );
        } catch (pubErr) {
          showMsg(
            `${tyProducts.length} ürün çekildi ancak yayınlanamadı: ${pubErr.message}. Ayarlar → Siteye Yayınla deneyin.`,
            'error',
          );
        }
      } else {
        showMsg(
          `${tyProducts.length} ürün çekildi — siteye yayınlamak için Ayarlar → Siteye Yayınla`,
        );
      }
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
        <div className="bg-brand-900 text-white px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold">Admin Panel</h1>
            <p className="text-xs text-brand-200 mt-0.5">
              {store.catalogSource === 'server'
                ? `Canlı katalog: ${store.products?.length || 0} ürün${store.catalogUpdatedAt ? ` · ${new Date(store.catalogUpdatedAt).toLocaleString('tr-TR')}` : ''}`
                : `Sadece bu cihazda: ${store.products?.length || 0} ürün — müşteriler göremez, yayınlayın`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="gold"
              size="sm"
              onClick={handlePublishCatalog}
              disabled={store.publishing || !store.products?.length}
            >
              <CloudUpload className="h-4 w-4" />
              {store.publishing ? 'Yayınlanıyor...' : 'Siteye Yayınla'}
            </Button>
            <button type="button" onClick={logout} className="flex items-center gap-2 text-sm hover:text-brand-200 px-2 py-1">
              <LogOut className="h-4 w-4" /> Çıkış
            </button>
          </div>
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

          <main className="flex-1 p-4 sm:p-6 max-w-5xl w-full min-w-0">
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

            {tab === 'pdf' && (
              <PdfSettingsAdmin store={store} setMsg={showMsg} />
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
  const [icon, setIcon] = useState('📦');
  const [editingId, setEditingId] = useState(null);
  const [editIcon, setEditIcon] = useState('📦');
  const [selected, setSelected] = useState(() => new Set());
  const categories = Array.isArray(store.categories) ? store.categories : [];

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === categories.length) setSelected(new Set());
    else setSelected(new Set(categories.map((c) => c.id).filter(Boolean)));
  };

  const handleBulkDelete = () => {
    const ids = [...selected];
    if (!ids.length) return;
    if (!window.confirm(`${ids.length} kategori silinsin mi? Bu kategorideki ürünler silinmez.`)) return;
    startTransition(() => {
      store.deleteCategories(ids);
      if (editingId && ids.includes(editingId)) setEditingId(null);
    });
    setSelected(new Set());
    setMsg(`${ids.length} kategori silindi`);
  };

  const slugify = (text) =>
    text
      .toLocaleLowerCase('tr')
      .replace(/[^a-z0-9ğüşıöç]+/gi, '-')
      .replace(/(^-|-$)/g, '');

  const add = () => {
    if (!name.trim()) return;
    const chosenIcon = icon || suggestEmojiForName(name);
    startTransition(() => {
      store.addCategory({ name: name.trim(), slug: slugify(name), icon: chosenIcon });
    });
    setName('');
    setIcon('📦');
    setMsg('Kategori eklendi');
  };

  const startEditIcon = (c) => {
    setEditingId(c.id);
    setEditIcon(c.icon || '📦');
  };

  const saveEditIcon = (id) => {
    startTransition(() => {
      store.updateCategory(id, { icon: editIcon });
    });
    setEditingId(null);
    setMsg('Kategori emojisi güncellendi');
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold">Kategori Yönetimi</h2>
        <div className="flex flex-wrap gap-2">
          {selected.size > 0 && (
            <Button type="button" variant="danger" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4" />
              Seçilenleri Sil ({selected.size})
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              startTransition(() => store.refreshAllCategoryEmojis());
              setMsg('Tüm kategori emojileri güncellendi');
            }}
          >
            Emojileri otomatik güncelle
          </Button>
        </div>
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Kategori adı"
        className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
      />
      <EmojiPicker value={icon} onChange={setIcon} categoryName={name} autoSuggest />
      <Button variant="primary" onClick={add} className="w-full sm:w-auto">
        Kategori Ekle
      </Button>

      {categories.length > 0 && (
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.size === categories.length}
            onChange={toggleSelectAll}
          />
          Tümünü seç ({categories.length} kategori)
        </label>
      )}

      <ul className="space-y-3 pt-2 border-t border-brand-100">
        {categories.map((c) => (
          <li key={c.id} className="border-b border-brand-50 pb-3 last:border-0">
            <div className="flex justify-between items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                onChange={() => toggleSelect(c.id)}
                className="shrink-0"
              />
              <button
                type="button"
                onClick={() => (editingId === c.id ? setEditingId(null) : startEditIcon(c))}
                className="flex flex-1 items-center gap-2 text-left hover:text-brand-600 min-w-0"
                title="Emojiyi değiştir"
              >
                <span className="text-xl shrink-0">{c.icon || '📦'}</span>
                <span className="font-medium truncate">{c.name}</span>
              </button>
              <button type="button" onClick={() => store.deleteCategory(c.id)} className="text-red-600 shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {editingId === c.id && (
              <div className="mt-3 p-3 rounded-xl bg-brand-50/50 border border-brand-100 space-y-2">
                <EmojiPicker value={editIcon} onChange={setEditIcon} categoryName={c.name} />
                <div className="flex gap-2">
                  <Button type="button" variant="primary" onClick={() => saveEditIcon(c.id)}>
                    Kaydet
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                    İptal
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BannerAdmin({ store, setMsg }) {
  const banners = Array.isArray(store.banners) ? store.banners : [];
  const [b, setB] = useState({ title: '', subtitle: '', image: '', link: '', active: true });
  const add = () => {
    if (!b.image?.trim()) {
      setMsg('Banner için görsel yükleyin');
      return;
    }
    startTransition(() =>
      store.addBanner({
        ...b,
        title: b.title.trim(),
        subtitle: b.subtitle.trim(),
        link: b.link.trim(),
      }),
    );
    setB({ title: '', subtitle: '', image: '', link: '', active: true });
    setMsg('Banner eklendi');
  };
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
      <h2 className="font-bold">Banner Yönetimi</h2>
      <p className="text-sm text-gray-500">
        Sadece görsel yükleyerek başlıksız banner ekleyebilirsiniz. Başlık ve alt başlık isteğe bağlıdır.
      </p>
      <ImageDropzone
        label="Banner görseli (zorunlu)"
        hint={`Zorunlu ölçü: ${bannerSpecText()} — kırpılmaz, tam görünür`}
        value={b.image}
        onChange={(url) => setB({ ...b, image: url })}
        onFile={(file) => processImageFile(file, { maxWidth: 1920, maxHeight: 800, quality: 0.9 })}
        aspect="video"
      />
      <details className="rounded-lg border border-brand-100 bg-brand-50/50 p-3">
        <summary className="cursor-pointer text-sm font-medium text-brand-800">İsteğe bağlı: başlık ve link</summary>
        <div className="mt-3 space-y-2">
          <input placeholder="Başlık (boş bırakılabilir)" value={b.title} onChange={(e) => setB({ ...b, title: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          <input placeholder="Alt başlık" value={b.subtitle} onChange={(e) => setB({ ...b, subtitle: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          <input placeholder="Tıklanınca gidilecek link (örn: /kategoriler)" value={b.link} onChange={(e) => setB({ ...b, link: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
      </details>
      <Button variant="primary" onClick={add} disabled={!b.image?.trim()}>
        Banner Ekle
      </Button>
      <ul className="space-y-3 mt-4">
        {banners.map((banner) => (
          <li key={banner.id} className="flex gap-3 items-center border-b border-brand-50 py-3">
            {banner.image && (
              <img src={banner.image} alt="" className="h-14 w-28 rounded object-contain bg-brand-950 shrink-0" />
            )}
            <span className="flex-1 text-sm font-medium truncate">
              {banner.title?.trim() || 'Başlıksız banner'}
              {banner.link ? ` · ${banner.link}` : ''}
            </span>
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
          Onaylı ürünler en büyük görsel URL’si ile çekilir (boyut küçültülmez). Toptan fiyat = Trendyol fiyatı ÷ bölücü.
          Mevcut ürünler için görselleri güncellemek üzere yeniden senkronize edin.
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
        hint={`${logoSpecText()} — şeffaf PNG, beyaz kutu/çerçeve eklemeyin`}
        value={s.logoUrl}
        onChange={(url) => setS({ ...s, logoUrl: url })}
        onFile={(file) =>
          processImageFile(file, {
            maxWidth: 560,
            maxHeight: 140,
            quality: 0.92,
            addBrandBackground: false,
            preserveTransparency: true,
          })
        }
        aspect="logo"
      />
      <div>
        <label className="text-xs text-gray-500">Ürün başına minimum sipariş tutarı (₺)</label>
        <input
          type="number"
          min="1"
          step="100"
          value={s.minOrderLineValue ?? 2000}
          onChange={(e) => setS({ ...s, minOrderLineValue: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-sm mt-1"
        />
        <p className="text-xs text-gray-400 mt-1">Örn: 100 ₺ ürün → min. 20 adet (2.000 ₺)</p>
      </div>
      {[
        ['whatsappNumber', 'WhatsApp Numarası'],
        ['metaPixelId', 'Meta Pixel ID'],
        ['gaId', 'Google Analytics ID'],
        ['siteUrl', 'Site URL'],
        ['contactPhone', 'Telefon'],
        ['contactEmail', 'E-posta'],
        ['contactAddress', 'Adres'],
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
=======
import { useState, useEffect, useCallback, startTransition } from 'react';
import { Lock, Package, FolderOpen, Image, Settings, Upload, RefreshCw, Trash2, LogOut, FileText, CloudUpload } from 'lucide-react';
import { getAdminPasswordForPublish, askPublishPassword } from '@/services/catalogApi';
import PdfSettingsAdmin from '@/components/admin/PdfSettingsAdmin';
import { bannerSpecText, logoSpecText } from '@/constants/mediaSpecs';
import Button from '@/components/ui/Button';
import AdminToast from '@/components/admin/AdminToast';
import ProductsAdmin from '@/components/admin/ProductsAdmin';
import ImageDropzone from '@/components/admin/ImageDropzone';
import EmojiPicker from '@/components/admin/EmojiPicker';
import { suggestEmojiForName } from '@/data/categoryEmojis';
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
  { id: 'pdf', label: 'PDF', icon: FileText },
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
      sessionStorage.setItem('b2b_admin_pass', password);
      setAuthed(true);
    } else showMsg('Hatalı şifre', 'error');
  };

  const logout = () => {
    sessionStorage.removeItem('b2b_admin');
    sessionStorage.removeItem('b2b_admin_pass');
    setAuthed(false);
  };

  const handlePublishCatalog = async () => {
    const pass = askPublishPassword();
    if (!pass) {
      showMsg('Yayınlama iptal edildi', 'error');
      return;
    }
    try {
      sessionStorage.setItem('b2b_admin_pass', pass);
      const result = await store.publishCatalog(pass);
      showMsg(`${result.productCount} ürün siteye yayınlandı — müşteriler artık görebilir`);
    } catch (err) {
      showMsg(err.message || 'Yayınlama başarısız', 'error');
    }
  };

  const handleExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { products, categories } = await parseExcelFile(file);
      store.importProducts(products, categories);
      const pass = getAdminPasswordForPublish();
      if (pass && products.length) {
        try {
          await store.publishCatalog(pass);
          showMsg(`${products.length} ürün içe aktarıldı ve siteye yayınlandı`);
        } catch {
          showMsg(`${products.length} ürün içe aktarıldı — yayın için Siteye Yayınla`);
        }
      } else {
        showMsg(`${products.length} ürün içe aktarıldı`);
      }
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
      store.importTrendyolProducts(tyProducts);
      const pass = askPublishPassword();
      if (pass) {
        sessionStorage.setItem('b2b_admin_pass', pass);
        try {
          const pub = await store.publishCatalog(pass);
          showMsg(
            `${tyProducts.length} ürün çekildi ve siteye yayınlandı (${pub.productCount} ürün canlı)`,
          );
        } catch (pubErr) {
          showMsg(
            `${tyProducts.length} ürün çekildi ancak yayınlanamadı: ${pubErr.message}. Ayarlar → Siteye Yayınla deneyin.`,
            'error',
          );
        }
      } else {
        showMsg(
          `${tyProducts.length} ürün çekildi — siteye yayınlamak için Ayarlar → Siteye Yayınla`,
        );
      }
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
        <div className="bg-brand-900 text-white px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold">Admin Panel</h1>
            <p className="text-xs text-brand-200 mt-0.5">
              {store.catalogSource === 'server'
                ? `Canlı katalog: ${store.products?.length || 0} ürün${store.catalogUpdatedAt ? ` · ${new Date(store.catalogUpdatedAt).toLocaleString('tr-TR')}` : ''}`
                : `Sadece bu cihazda: ${store.products?.length || 0} ürün — müşteriler göremez, yayınlayın`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="gold"
              size="sm"
              onClick={handlePublishCatalog}
              disabled={store.publishing || !store.products?.length}
            >
              <CloudUpload className="h-4 w-4" />
              {store.publishing ? 'Yayınlanıyor...' : 'Siteye Yayınla'}
            </Button>
            <button type="button" onClick={logout} className="flex items-center gap-2 text-sm hover:text-brand-200 px-2 py-1">
              <LogOut className="h-4 w-4" /> Çıkış
            </button>
          </div>
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

          <main className="flex-1 p-4 sm:p-6 max-w-5xl w-full min-w-0">
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

            {tab === 'pdf' && (
              <PdfSettingsAdmin store={store} setMsg={showMsg} />
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
  const [icon, setIcon] = useState('📦');
  const [editingId, setEditingId] = useState(null);
  const [editIcon, setEditIcon] = useState('📦');
  const [selected, setSelected] = useState(() => new Set());
  const categories = Array.isArray(store.categories) ? store.categories : [];

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === categories.length) setSelected(new Set());
    else setSelected(new Set(categories.map((c) => c.id).filter(Boolean)));
  };

  const handleBulkDelete = () => {
    const ids = [...selected];
    if (!ids.length) return;
    if (!window.confirm(`${ids.length} kategori silinsin mi? Bu kategorideki ürünler silinmez.`)) return;
    startTransition(() => {
      store.deleteCategories(ids);
      if (editingId && ids.includes(editingId)) setEditingId(null);
    });
    setSelected(new Set());
    setMsg(`${ids.length} kategori silindi`);
  };

  const slugify = (text) =>
    text
      .toLocaleLowerCase('tr')
      .replace(/[^a-z0-9ğüşıöç]+/gi, '-')
      .replace(/(^-|-$)/g, '');

  const add = () => {
    if (!name.trim()) return;
    const chosenIcon = icon || suggestEmojiForName(name);
    startTransition(() => {
      store.addCategory({ name: name.trim(), slug: slugify(name), icon: chosenIcon });
    });
    setName('');
    setIcon('📦');
    setMsg('Kategori eklendi');
  };

  const startEditIcon = (c) => {
    setEditingId(c.id);
    setEditIcon(c.icon || '📦');
  };

  const saveEditIcon = (id) => {
    startTransition(() => {
      store.updateCategory(id, { icon: editIcon });
    });
    setEditingId(null);
    setMsg('Kategori emojisi güncellendi');
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold">Kategori Yönetimi</h2>
        <div className="flex flex-wrap gap-2">
          {selected.size > 0 && (
            <Button type="button" variant="danger" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4" />
              Seçilenleri Sil ({selected.size})
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              startTransition(() => store.refreshAllCategoryEmojis());
              setMsg('Tüm kategori emojileri güncellendi');
            }}
          >
            Emojileri otomatik güncelle
          </Button>
        </div>
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Kategori adı"
        className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
      />
      <EmojiPicker value={icon} onChange={setIcon} categoryName={name} autoSuggest />
      <Button variant="primary" onClick={add} className="w-full sm:w-auto">
        Kategori Ekle
      </Button>

      {categories.length > 0 && (
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.size === categories.length}
            onChange={toggleSelectAll}
          />
          Tümünü seç ({categories.length} kategori)
        </label>
      )}

      <ul className="space-y-3 pt-2 border-t border-brand-100">
        {categories.map((c) => (
          <li key={c.id} className="border-b border-brand-50 pb-3 last:border-0">
            <div className="flex justify-between items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                onChange={() => toggleSelect(c.id)}
                className="shrink-0"
              />
              <button
                type="button"
                onClick={() => (editingId === c.id ? setEditingId(null) : startEditIcon(c))}
                className="flex flex-1 items-center gap-2 text-left hover:text-brand-600 min-w-0"
                title="Emojiyi değiştir"
              >
                <span className="text-xl shrink-0">{c.icon || '📦'}</span>
                <span className="font-medium truncate">{c.name}</span>
              </button>
              <button type="button" onClick={() => store.deleteCategory(c.id)} className="text-red-600 shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {editingId === c.id && (
              <div className="mt-3 p-3 rounded-xl bg-brand-50/50 border border-brand-100 space-y-2">
                <EmojiPicker value={editIcon} onChange={setEditIcon} categoryName={c.name} />
                <div className="flex gap-2">
                  <Button type="button" variant="primary" onClick={() => saveEditIcon(c.id)}>
                    Kaydet
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                    İptal
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BannerAdmin({ store, setMsg }) {
  const banners = Array.isArray(store.banners) ? store.banners : [];
  const [b, setB] = useState({ title: '', subtitle: '', image: '', link: '', active: true });
  const add = () => {
    if (!b.image?.trim()) {
      setMsg('Banner için görsel yükleyin');
      return;
    }
    startTransition(() =>
      store.addBanner({
        ...b,
        title: b.title.trim(),
        subtitle: b.subtitle.trim(),
        link: b.link.trim(),
      }),
    );
    setB({ title: '', subtitle: '', image: '', link: '', active: true });
    setMsg('Banner eklendi');
  };
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
      <h2 className="font-bold">Banner Yönetimi</h2>
      <p className="text-sm text-gray-500">
        Sadece görsel yükleyerek başlıksız banner ekleyebilirsiniz. Başlık ve alt başlık isteğe bağlıdır.
      </p>
      <ImageDropzone
        label="Banner görseli (zorunlu)"
        hint={`Zorunlu ölçü: ${bannerSpecText()} — kırpılmaz, tam görünür`}
        value={b.image}
        onChange={(url) => setB({ ...b, image: url })}
        onFile={(file) => processImageFile(file, { maxWidth: 1920, maxHeight: 800, quality: 0.9 })}
        aspect="video"
      />
      <details className="rounded-lg border border-brand-100 bg-brand-50/50 p-3">
        <summary className="cursor-pointer text-sm font-medium text-brand-800">İsteğe bağlı: başlık ve link</summary>
        <div className="mt-3 space-y-2">
          <input placeholder="Başlık (boş bırakılabilir)" value={b.title} onChange={(e) => setB({ ...b, title: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          <input placeholder="Alt başlık" value={b.subtitle} onChange={(e) => setB({ ...b, subtitle: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          <input placeholder="Tıklanınca gidilecek link (örn: /kategoriler)" value={b.link} onChange={(e) => setB({ ...b, link: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
      </details>
      <Button variant="primary" onClick={add} disabled={!b.image?.trim()}>
        Banner Ekle
      </Button>
      <ul className="space-y-3 mt-4">
        {banners.map((banner) => (
          <li key={banner.id} className="flex gap-3 items-center border-b border-brand-50 py-3">
            {banner.image && (
              <img src={banner.image} alt="" className="h-14 w-28 rounded object-contain bg-brand-950 shrink-0" />
            )}
            <span className="flex-1 text-sm font-medium truncate">
              {banner.title?.trim() || 'Başlıksız banner'}
              {banner.link ? ` · ${banner.link}` : ''}
            </span>
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
          Onaylı ürünler en büyük görsel URL’si ile çekilir (boyut küçültülmez). Toptan fiyat = Trendyol fiyatı ÷ bölücü.
          Mevcut ürünler için görselleri güncellemek üzere yeniden senkronize edin.
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
        hint={`${logoSpecText()} — şeffaf PNG, beyaz kutu/çerçeve eklemeyin`}
        value={s.logoUrl}
        onChange={(url) => setS({ ...s, logoUrl: url })}
        onFile={(file) =>
          processImageFile(file, {
            maxWidth: 560,
            maxHeight: 140,
            quality: 0.92,
            addBrandBackground: false,
            preserveTransparency: true,
          })
        }
        aspect="logo"
      />
      <div>
        <label className="text-xs text-gray-500">Ürün başına minimum sipariş tutarı (₺)</label>
        <input
          type="number"
          min="1"
          step="100"
          value={s.minOrderLineValue ?? 2000}
          onChange={(e) => setS({ ...s, minOrderLineValue: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-sm mt-1"
        />
        <p className="text-xs text-gray-400 mt-1">Örn: 100 ₺ ürün → min. 20 adet (2.000 ₺)</p>
      </div>
      {[
        ['whatsappNumber', 'WhatsApp Numarası'],
        ['metaPixelId', 'Meta Pixel ID'],
        ['gaId', 'Google Analytics ID'],
        ['siteUrl', 'Site URL'],
        ['contactPhone', 'Telefon'],
        ['contactEmail', 'E-posta'],
        ['contactAddress', 'Adres'],
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
>>>>>>> 4d1702da50b32d1e25ef371646e044a4b268a938
