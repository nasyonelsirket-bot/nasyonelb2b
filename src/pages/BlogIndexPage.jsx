import { Link } from 'react-router-dom';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { BLOG_POSTS } from '@/data/blogPosts';

export default function BlogIndexPage() {
  const sorted = [...BLOG_POSTS].sort(
    (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt),
  );

  return (
    <>
      <SEO
        title="Oyuncak Rehberi & Blog"
        metaTitle="Oyuncak Rehberi | Eğitici Oyuncak Blog — Nasyonel Toys"
        description="Eğitici oyuncak, montessori, çocuk gelişimi ve oyuncak seçimi hakkında uzman rehber yazıları. Nasyonel Toys blog."
        path="/blog"
      />
      <BreadcrumbSchema
        items={[
          { name: 'Ana Sayfa', href: '/' },
          { name: 'Blog', href: '/blog' },
        ]}
      />

      <div className="bg-brand-900 text-white py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Oyuncak Rehberi</h1>
          <p className="mt-3 text-brand-100 max-w-2xl text-sm sm:text-base leading-relaxed">
            Eğitici oyuncak, montessori, çocuk gelişimi ve doğru oyuncak seçimi hakkında SEO uyumlu
            rehber yazıları.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((post) => (
            <article
              key={post.slug}
              className="group flex flex-col rounded-2xl border border-brand-100 bg-white shadow-card hover:shadow-card-hover transition-shadow overflow-hidden"
            >
              <div className="p-5 flex flex-col flex-1">
                <span className="text-xs font-semibold text-accent-gold uppercase tracking-wide">
                  {post.category}
                </span>
                <h2 className="mt-2 font-display text-lg font-bold text-brand-900 group-hover:text-brand-700">
                  <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="mt-2 text-sm text-gray-600 line-clamp-3 flex-1">{post.description}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(post.publishedAt).toLocaleDateString('tr-TR')}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readMinutes} dk okuma
                  </span>
                </div>
                <Link
                  to={`/blog/${post.slug}`}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
                >
                  Devamını oku <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
