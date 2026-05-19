import { useEffect, useMemo, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import GoogleSearchPreview from '@/components/seo/GoogleSearchPreview';
import {
  META_TITLE_MAX,
  META_DESCRIPTION_MAX,
  slugifyProductName,
  normalizeSlug,
  isSlugTaken,
  getProductMetaTitle,
  getProductMetaDescription,
  getProductCanonical,
  getProductPath,
} from '@/utils/productSeo';

function CharCounter({ value, max, label }) {
  const len = String(value || '').length;
  const over = len > max;
  return (
    <p className={`text-xs mt-1 ${over ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
      {len}/{max} {label}
      {over ? ` — ${max} karakter üstünde, Google’da kesilebilir` : ''}
    </p>
  );
}

export default function ProductSeoFields({
  form,
  setForm,
  products = [],
  excludeProductId = null,
  siteUrl = '',
  siteName = 'Nasyonel Toys',
  autoSlugFromName = true,
}) {
  const slugTouchedRef = useRef(Boolean(form?.slug?.trim()));

  useEffect(() => {
    if (!autoSlugFromName || slugTouchedRef.current) return;
    const name = String(form?.name || '').trim();
    if (!name) return;
    const next = slugifyProductName(name);
    if (next && next !== form.slug) {
      setForm((f) => ({ ...f, slug: next }));
    }
  }, [form?.name, autoSlugFromName, form?.slug, setForm]);

  const slugConflict = useMemo(() => {
    const slug = normalizeSlug(form?.slug);
    if (!slug) return null;
    const other = (products || []).find((p) => p.slug === slug && p.id !== excludeProductId);
    return other || null;
  }, [form?.slug, products, excludeProductId]);

  const previewTitle = getProductMetaTitle(
    { ...form, meta_title: form?.meta_title || '' },
    siteName,
  );
  const previewDescription = getProductMetaDescription(form, { tagline: '' });
  const previewPath = getProductPath({ slug: normalizeSlug(form?.slug) || 'urun-url', id: form?.id });
  const previewCanonical = getProductCanonical(
    { ...form, slug: normalizeSlug(form?.slug), canonical_url: form?.canonical_url },
    siteUrl,
  );

  const handleSlugChange = (e) => {
    slugTouchedRef.current = true;
    setForm({ ...form, slug: e.target.value });
  };

  const regenerateSlug = () => {
    const next = slugifyProductName(form?.name);
    slugTouchedRef.current = false;
    setForm({ ...form, slug: next });
  };

  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/30 p-4 sm:p-5 space-y-4">
      <div>
        <h4 className="font-semibold text-brand-900 text-sm">SEO Ayarları</h4>
        <p className="text-xs text-gray-500 mt-0.5">
          Google ve arama motorlarında ürününüzün nasıl görüneceğini yönetin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600">SEO URL (Slug)</label>
            <div className="mt-1 flex gap-2">
              <span className="hidden sm:flex items-center rounded-l-lg border border-r-0 border-brand-200 bg-brand-50 px-2 text-xs text-gray-500 shrink-0">
                /urun/
              </span>
              <input
                value={form.slug ?? ''}
                onChange={handleSlugChange}
                placeholder="ahsap-calisma-masasi"
                className="flex-1 rounded-lg sm:rounded-l-none border border-brand-200 px-3 py-2 text-sm font-mono"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={regenerateSlug}
                className="shrink-0 rounded-lg border border-brand-200 px-3 py-2 text-xs text-brand-700 hover:bg-white"
              >
                Üret
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Boş bırakılırsa ürün adından otomatik üretilir. Türkçe karakterler dönüştürülür.
            </p>
            {slugConflict && (
              <p className="text-xs text-amber-700 mt-2 flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                Bu URL başka üründe kullanılıyor: “{slugConflict.name}”. Kayıtta benzersiz yapılır.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Meta Title</label>
            <input
              value={form.meta_title ?? ''}
              onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
              placeholder={form.name ? `${form.name} | ${siteName}` : 'Google başlığı'}
              className="w-full mt-1 rounded-lg border border-brand-200 px-3 py-2 text-sm"
              maxLength={META_TITLE_MAX + 20}
            />
            <CharCounter value={form.meta_title} max={META_TITLE_MAX} label="karakter" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Meta Description</label>
            <textarea
              value={form.meta_description ?? ''}
              onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
              placeholder="Google arama sonucunda görünen açıklama"
              className="w-full mt-1 rounded-lg border border-brand-200 px-3 py-2 text-sm h-20 resize-y"
              maxLength={META_DESCRIPTION_MAX + 40}
            />
            <CharCounter value={form.meta_description} max={META_DESCRIPTION_MAX} label="karakter" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Canonical URL (isteğe bağlı)</label>
            <input
              value={form.canonical_url ?? ''}
              onChange={(e) => setForm({ ...form, canonical_url: e.target.value })}
              placeholder={`${siteUrl || 'https://nasyoneltoys.com'}${previewPath}`}
              className="w-full mt-1 rounded-lg border border-brand-200 px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              Boş bırakılırsa varsayılan ürün URL’si kullanılır.
            </p>
          </div>
        </div>

        <GoogleSearchPreview
          title={previewTitle}
          url={previewCanonical || `${siteUrl.replace(/\/$/, '')}${previewPath}`}
          description={previewDescription}
          siteUrl={siteUrl}
        />
      </div>
    </div>
  );
}
