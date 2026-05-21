import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap, Sparkles } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';
import {
  ABOUT_HERO,
  ABOUT_PARAGRAPHS,
  ABOUT_SLOGAN,
  ABOUT_STATS,
  ABOUT_HIGHLIGHTS,
  ABOUT_CATEGORIES_FOCUS,
  ABOUT_SEO_DESCRIPTION,
} from '@/data/aboutContent';

export default function AboutPage() {
  return (
    <>
      <SEO title="Hakkımızda" description={ABOUT_SEO_DESCRIPTION} path="/hakkimizda" />
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-brand-900 text-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:py-20 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold">
            <Sparkles className="h-4 w-4" />
            Markalya · Eğitici Oyuncaklar
          </p>
          <h1 className="mt-4 font-display text-3xl sm:text-5xl font-bold">{ABOUT_HERO.title}</h1>
          <p className="mt-4 text-base sm:text-lg text-orange-50/95 max-w-2xl mx-auto">{ABOUT_HERO.subtitle}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/#cok-satanlar">
              <Button type="button" variant="gold" size="lg">
                En Çok Satanlar
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/#markalya">
              <Button
                type="button"
                size="lg"
                className="bg-white/10 text-white border border-white/30 hover:bg-white/20"
              >
                <GraduationCap className="h-5 w-5" />
                Markalya Koleksiyonu
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 -mt-10 sm:-mt-14 relative z-10 mb-12">
          {ABOUT_HIGHLIGHTS.map(({ title, desc, icon }) => (
            <div
              key={title}
              className="rounded-2xl border border-brand-100 bg-white p-5 shadow-card hover:shadow-card-hover transition-shadow"
            >
              <span className="text-3xl">{icon}</span>
              <h3 className="mt-3 font-display font-bold text-brand-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6 text-gray-600 leading-relaxed text-base sm:text-lg">
          {ABOUT_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>

        <blockquote className="mt-10 rounded-2xl border-l-4 border-orange-500 bg-orange-50 px-6 py-5 text-brand-900 font-medium leading-relaxed">
          {ABOUT_SLOGAN}
        </blockquote>

        <div className="mt-12">
          <h2 className="font-display text-xl font-bold text-brand-900">Öne çıkan eğitici kategoriler</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {ABOUT_CATEGORIES_FOCUS.map((label) => (
              <span
                key={label}
                className="rounded-full bg-brand-50 border border-brand-200 px-4 py-2 text-sm font-medium text-brand-800"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {ABOUT_STATS.map(({ n, l }) => (
            <div key={l} className="rounded-2xl bg-brand-50 p-6 text-center border border-brand-100">
              <p className="font-display text-2xl sm:text-3xl font-bold text-brand-700">{n}</p>
              <p className="text-gray-600 mt-1 text-sm">{l}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-gradient-to-r from-brand-900 to-brand-800 p-6 sm:p-8 text-center text-white">
          <h2 className="font-display text-xl sm:text-2xl font-bold">Alışverişe başlayın</h2>
          <p className="mt-2 text-brand-100 text-sm sm:text-base">
            Markalya eğitici oyuncaklar ve en çok satan ürünler bir arada.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/">
              <Button type="button" variant="gold">
                Mağazaya dön
              </Button>
            </Link>
            <Link to="/kategoriler">
              <Button type="button" className="bg-white text-brand-900 hover:bg-brand-50">
                Kategoriler
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
