import SEO from '@/components/seo/SEO';
import { useStore } from '@/context/StoreContext';

export default function AboutPage() {
  const { settings } = useStore();

  return (
    <>
      <SEO title="Hakkımızda" description={settings.aboutText} path="/hakkimizda" />
      <div className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold text-brand-900">Hakkımızda</h1>
        <p className="mt-8 text-lg text-gray-600 leading-relaxed">{settings.aboutText}</p>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { n: '500+', l: 'Ürün Çeşidi' },
            { n: '15+', l: 'Yıl Tecrübe' },
            { n: '1000+', l: 'Bayi Müşteri' },
          ].map(({ n, l }) => (
            <div key={l} className="rounded-2xl bg-brand-50 p-6 text-center">
              <p className="font-display text-3xl font-bold text-brand-700">{n}</p>
              <p className="text-gray-600 mt-1">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
