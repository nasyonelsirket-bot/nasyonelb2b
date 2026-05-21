import { useParams, Link } from 'react-router-dom';
import SEO from '@/components/seo/SEO';
import { LEGAL_PAGES } from '@/data/legalContent';

export default function LegalPage() {
  const { slug } = useParams();
  const page = LEGAL_PAGES[slug];

  if (!page) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-gray-500">Sayfa bulunamadı.</p>
        <Link to="/" className="mt-4 inline-block text-brand-600 hover:underline">
          Ana sayfa
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEO title={page.title} description={page.title} path={`/sozlesme/${slug}`} />
      <article className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900">{page.title}</h1>
        <p className="mt-2 text-sm text-gray-500">Son güncelleme: {new Date().getFullYear()}</p>
        <div className="mt-8 space-y-8">
          {page.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-semibold text-lg text-brand-800">{s.heading}</h2>
              <p className="mt-2 text-gray-700 leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>
        <Link to="/" className="mt-10 inline-block text-brand-600 font-medium hover:underline">
          ← Ana sayfaya dön
        </Link>
      </article>
    </>
  );
}
