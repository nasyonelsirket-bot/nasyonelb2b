import { useState } from 'react';
import { FileText, Eye } from 'lucide-react';
import Button from '@/components/ui/Button';
import ImageDropzone from '@/components/admin/ImageDropzone';
import { processImageFile } from '@/utils/imageUpload';
import { mergePdfSettings } from '@/data/pdfSettingsDefaults';
import { generateOrderPdf, downloadOrderPdf } from '@/utils/orderPdf';
import { getCartDiscount } from '@/utils/cartDiscount';
import { getFreeShippingStatus, getOrderPayableTotal } from '@/utils/cartShipping';

const SAMPLE_ITEMS = [
  { id: '1', name: 'Örnek Oyuncak Seti', sku: 'NT-001', price: 250, quantity: 10, image: '' },
  { id: '2', name: 'Plastik Blok Kutusu', sku: 'NT-002', price: 180, quantity: 15, image: '' },
];

export default function PdfSettingsAdmin({ store, setMsg }) {
  const [s, setS] = useState(() => mergePdfSettings(store.settings.pdfSettings));
  const [previewing, setPreviewing] = useState(false);

  const patch = (updates) => setS((prev) => mergePdfSettings({ ...prev, ...updates }));

  const patchLabel = (key, value) => {
    setS((prev) =>
      mergePdfSettings({
        ...prev,
        customerLabels: { ...prev.customerLabels, [key]: value },
      }),
    );
  };

  const save = () => {
    store.updateSettings({ pdfSettings: s });
    setMsg('PDF ayarları kaydedildi');
  };

  const preview = async () => {
    setPreviewing(true);
    try {
      const subtotal = SAMPLE_ITEMS.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const discount = getCartDiscount(subtotal);
      const shipping = getFreeShippingStatus(discount.subtotal);
      const orderTotal = getOrderPayableTotal(discount.grandTotal, shipping);
      const pdf = await generateOrderPdf({
        siteName: store.settings.siteName || 'Nasyonel Toys',
        siteLogoUrl: store.settings.logoUrl,
        pdfSettings: s,
        customer: {
          companyName: 'Örnek Bayi Ltd.',
          contactName: 'Ahmet Yılmaz',
          phone: '+90 555 000 00 00',
          address: 'Örnek Mah. Toptan Cad. No:1 İstanbul',
        },
        items: SAMPLE_ITEMS,
        discount,
        shipping,
        orderTotal,
      });
      await downloadOrderPdf(pdf);
      setMsg('Örnek PDF indirildi — tasarımı kontrol edin');
    } catch {
      setMsg('Önizleme oluşturulamadı', 'error');
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-card space-y-5">
      <div>
        <h2 className="font-bold text-brand-900 flex items-center gap-2">
          <FileText className="h-5 w-5" /> PDF Sipariş Formu Ayarları
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Logo, başlıklar ve hangi bölümlerin görüneceğini buradan ayarlayın. Örnek PDF ile test edin.
        </p>
      </div>

      <ImageDropzone
        label="PDF logosu (boş = site logosu)"
        hint="Şeffaf PNG önerilir · yaklaşık 480×120 px"
        value={s.logoUrl}
        onChange={(url) => patch({ logoUrl: url })}
        onFile={(file) =>
          processImageFile(file, {
            maxWidth: 560,
            maxHeight: 140,
            quality: 0.92,
            preserveTransparency: true,
          })
        }
        aspect="logo"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500">Üst başlık (boş = site adı)</label>
          <input
            value={s.headerTitle}
            onChange={(e) => patch({ headerTitle: e.target.value })}
            placeholder={store.settings.siteName}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Belge alt başlığı</label>
          <input
            value={s.docTitle}
            onChange={(e) => patch({ docTitle: e.target.value })}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Ana renk (hex)</label>
          <div className="mt-1 flex gap-2">
            <input
              type="color"
              value={s.primaryColor}
              onChange={(e) => patch({ primaryColor: e.target.value })}
              className="h-10 w-14 rounded border cursor-pointer"
            />
            <input
              value={s.primaryColor}
              onChange={(e) => patch({ primaryColor: e.target.value })}
              className="flex-1 rounded-lg border px-3 py-2 text-sm font-mono"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500">Logo genişlik (mm)</label>
            <input
              type="number"
              min="10"
              max="80"
              value={s.logoWidthMm}
              onChange={(e) => patch({ logoWidthMm: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Logo yükseklik (mm)</label>
            <input
              type="number"
              min="8"
              max="40"
              value={s.logoHeightMm}
              onChange={(e) => patch({ logoHeightMm: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <details className="rounded-lg border border-brand-100 bg-brand-50/40 p-3">
        <summary className="cursor-pointer text-sm font-medium text-brand-800">Müşteri alan etiketleri</summary>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(s.customerLabels).map(([key, label]) => (
            <div key={key}>
              <label className="text-xs text-gray-500">{key}</label>
              <input
                value={label}
                onChange={(e) => patchLabel(key, e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </details>

      <div>
        <label className="text-xs text-gray-500">Alt bilgi metni</label>
        <textarea
          rows={2}
          value={s.footerText}
          onChange={(e) => patch({ footerText: e.target.value })}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-gray-500">KDV notu</label>
        <input
          value={s.kdvText}
          onChange={(e) => patch({ kdvText: e.target.value })}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      <fieldset className="rounded-lg border border-brand-100 p-3">
        <legend className="text-sm font-medium text-brand-800 px-1">PDF&apos;te göster</legend>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
          {[
            ['showLogo', 'Logo'],
            ['showDate', 'Tarih'],
            ['showCustomer', 'Müşteri bilgileri'],
            ['showSkuColumn', 'Stok kodu sütunu'],
            ['showSummary', 'Özet (iskonto, kargo)'],
            ['showKdvNote', 'KDV notu'],
            ['showFooter', 'Alt metin'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(s[key])}
                onChange={(e) => patch({ [key]: e.target.checked })}
                className="rounded border-brand-300"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="primary" onClick={save}>
          PDF Ayarlarını Kaydet
        </Button>
        <Button variant="secondary" onClick={preview} disabled={previewing}>
          <Eye className="h-4 w-4" />
          {previewing ? 'Hazırlanıyor...' : 'Örnek PDF İndir'}
        </Button>
      </div>
    </div>
  );
}
