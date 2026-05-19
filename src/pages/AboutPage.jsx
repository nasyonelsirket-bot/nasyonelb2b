import SEO from '@/components/seo/SEO';
import { ABOUT_PARAGRAPHS, ABOUT_SLOGAN, ABOUT_STATS, ABOUT_SEO_DESCRIPTION } from '@/data/aboutContent';

export default function AboutPage() {
  return (
    <>
      <SEO title="Hakkımızda" description={ABOUT_SEO_DESCRIPTION} path="/hakkimizda" />
      <div className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold text-brand-900">Hakkımızda</h1>
        <p className="mt-3 text-brand-600 font-medium">Nasyonel Grup · Nasyonel Toys</p>

        <div className="mt-10 space-y-6 text-gray-600 leading-relaxed text-base sm:text-lg">
          {ABOUT_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>

        <blockquote className="mt-10 rounded-2xl border-l-4 border-brand-600 bg-brand-50 px-6 py-5 text-brand-900 font-medium leading-relaxed">
          {ABOUT_SLOGAN}
        </blockquote>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {ABOUT_STATS.map(({ n, l }) => (
            <div key={l} className="rounded-2xl bg-brand-50 p-6 text-center">
              <p className="font-display text-3xl font-bold text-brand-700">{n}</p>
              <p className="text-gray-600 mt-1">{l}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {['Nasyonel Toys', 'Elysane', 'Nasyonel Home'].map((brand) => (
            <span
              key={brand}
              className="rounded-full bg-white border border-brand-200 px-4 py-1.5 text-sm font-medium text-brand-800"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
