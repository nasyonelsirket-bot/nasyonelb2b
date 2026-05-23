import { useParams, Link, NavLink } from 'react-router-dom';
import { FileText, Shield, Truck, RotateCcw } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import { FREE_SHIPPING_THRESHOLD_TL } from '@/utils/cartShipping';
import LegalPageSchema from '@/components/seo/LegalPageSchema';
import { LEGAL_PAGES } from '@/data/legalContent';
import { LEGAL_ROUTES } from '@/constants/siteLinks';

function SectionBody({ section }) {
  return (
    <>
      {section.paragraphs?.map((p) => (
        <p key={p.slice(0, 48)} className="mt-3 text-gray-700 leading-relaxed">
          {p}
        </p>
      ))}
      {section.body && (
        <p className="mt-3 text-gray-700 leading-relaxed">{section.body}</p>
      )}
      {section.bullets?.length > 0 && (
        <ul className="mt-3 space-y-2 list-disc list-inside text-gray-700 leading-relaxed marker:text-brand-600">
          {section.bullets.map((item) => (
            <li key={item.slice(0, 48)}>{item}</li>
          ))}
        </ul>
      )}
    </>
  );
}

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

  const updatedYear = new Date().getFullYear();
  const pagePath = `/sozlesme/${slug}`;
  const metaDescription = page.seoDescription || page.intro?.slice(0, 160) || page.title;

  return (
    <>
      <SEO
        title={page.seoTitle || page.title}
        metaTitle={page.seoTitle || undefined}
        description={metaDescription}
        path={pagePath}
      />
      <LegalPageSchema
        title={page.seoTitle || page.title}
        description={metaDescription}
        path={pagePath}
        slug={slug}
      />
      <div className="bg-gray-50 min-h-[60vh]">
        <div className="bg-gradient-to-br from-brand-900 to-brand-800 text-white">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent-gold">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold">{page.title}</h1>
                {page.intro && (
                  <p className="mt-3 text-brand-100 text-sm sm:text-base leading-relaxed max-w-3xl">
                    {page.intro}
                  </p>
                )}
              </div>
            </div>
            {page.highlights?.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2 sm:gap-3">
                {page.highlights.map((h) => (
                  <li
                    key={h}
                    className="rounded-full bg-white/10 border border-white/20 px-3 py-1.5 text-xs sm:text-sm text-brand-50"
                  >
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 lg:gap-10">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <nav className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-600 mb-3">
                  Sözleşmeler
                </p>
                <ul className="space-y-1">
                  {LEGAL_ROUTES.map((r) => (
                    <li key={r.path}>
                      <NavLink
                        to={r.path}
                        className={({ isActive }) =>
                          `block rounded-lg px-3 py-2 text-sm transition-colors ${
                            isActive
                              ? 'bg-brand-900 text-white font-medium'
                              : 'text-gray-700 hover:bg-brand-50 hover:text-brand-900'
                          }`
                        }
                      >
                        {r.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="mt-4 rounded-2xl border border-brand-100 bg-white p-4 text-sm text-gray-600 space-y-3 hidden sm:block">
                <p className="font-semibold text-brand-900 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent-gold" />
                  Güvenli alışveriş
                </p>
                <p className="flex items-start gap-2">
                  <Truck className="h-4 w-4 shrink-0 text-accent-gold mt-0.5" />
                  {FREE_SHIPPING_THRESHOLD_TL} TL üzeri ücretsiz kargo
                </p>
                <p className="flex items-start gap-2">
                  <RotateCcw className="h-4 w-4 shrink-0 text-accent-gold mt-0.5" />
                  14 iş günü iade hakkı
                </p>
              </div>
            </aside>

            <article className="min-w-0">
              <p className="text-xs text-gray-500 mb-6">Son güncelleme: {updatedYear}</p>
              <div className="space-y-6">
                {page.sections.map((s, i) => (
                  <section
                    key={s.heading}
                    className="rounded-2xl border border-brand-100 bg-white p-5 sm:p-7 shadow-card"
                  >
                    <h2 className="font-display font-semibold text-lg text-brand-900 flex items-baseline gap-2">
                      <span className="text-accent-gold text-sm font-bold">{i + 1}.</span>
                      {s.heading.replace(/^\d+\.\s*/, '')}
                    </h2>
                    <SectionBody section={s} />
                  </section>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/"
                  className="inline-flex items-center text-brand-700 font-medium hover:underline"
                >
                  ← Ana sayfaya dön
                </Link>
                <Link
                  to="/iletisim"
                  className="inline-flex items-center text-gray-600 hover:text-brand-800 hover:underline"
                >
                  İletişim
                </Link>
              </div>
            </article>
          </div>
        </div>
      </div>
    </>
  );
}
