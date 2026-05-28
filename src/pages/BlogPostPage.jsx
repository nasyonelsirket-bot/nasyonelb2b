import { Link, useParams } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import ArticleSchema from '@/components/seo/ArticleSchema';
import { getBlogPostBySlug } from '@/data/blogPosts';

function renderBlock(block, index) {
  if (block.type === 'h2') {
    return (
      <h2 key={index} className="font-display text-xl font-bold text-brand-900 mt-8 mb-3">
        {block.text}
      </h2>
    );
  }
  if (block.type === 'ul') {
    return (
      <ul key={index} className="list-disc pl-5 space-y-2 text-gray-600 my-4">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  return (
    <p key={index} className="text-gray-600 leading-relaxed my-4">
      {block.text}
    </p>
  );
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-gray-500">Yazı bulunamadı.</p>
        <Link to="/blog" className="mt-4 text-brand-600 hover:underline inline-block">
          Bloga dön
        </Link>
      </div>
    );
  }

  const path = `/blog/${post.slug}`;

  return (
    <>
      <SEO
        title={post.title}
        metaTitle={`${post.title} | Nasyonel Toys Blog`}
        description={post.description}
        path={path}
        type="article"
      />
      <ArticleSchema post={post} />
      <BreadcrumbSchema
        items={[
          { name: 'Ana Sayfa', href: '/' },
          { name: 'Blog', href: '/blog' },
          { name: post.title, href: path },
        ]}
      />

      <article className="mx-auto max-w-3xl px-4 py-10 sm:py-14 animate-fade-in">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm text-brand-600 hover:underline mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Tüm yazılar
        </Link>

        <header className="mb-8">
          <span className="text-xs font-semibold text-accent-gold uppercase">{post.category}</span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900 mt-2">
            {post.title}
          </h1>
          <p className="mt-3 text-gray-600 leading-relaxed">{post.description}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(post.publishedAt).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.readMinutes} dakika okuma
            </span>
          </div>
        </header>

        <div className="prose prose-sm max-w-none">{post.blocks.map(renderBlock)}</div>

        {post.relatedCategorySlug && (
          <div className="mt-10 rounded-2xl border border-brand-100 bg-brand-50/50 p-6">
            <h2 className="font-display font-bold text-brand-900">İlgili ürünleri inceleyin</h2>
            <p className="text-sm text-gray-600 mt-2">
              Bu rehberle uyumlu oyuncakları kategorimizde bulabilirsiniz.
            </p>
            <Link
              to={`/${post.relatedCategorySlug}`}
              className="mt-4 inline-flex rounded-full bg-brand-900 text-white px-4 py-2 text-sm font-semibold hover:bg-brand-800"
            >
              Kategoriye git →
            </Link>
          </div>
        )}
      </article>
    </>
  );
}
