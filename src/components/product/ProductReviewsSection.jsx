import { useMemo } from 'react';
import { MessageSquare, ThumbsUp } from 'lucide-react';
import ProductRatingStars from '@/components/product/ProductRatingStars';
import { getAllProductReviews } from '@/utils/productReviews';

function formatReviewDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function ProductReviewsSection({ product }) {
  const { reviews, ratingAvg, reviewCount } = useMemo(
    () => getAllProductReviews(product),
    [product],
  );

  return (
    <section className="mt-12 rounded-2xl border border-brand-100 bg-white p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-100 pb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-brand-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-accent-gold" />
            Müşteri Değerlendirmeleri
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {reviewCount} değerlendirme — güvenilir alışveriş için okuyun
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ProductRatingStars rating={ratingAvg} size="lg" />
          <span className="text-sm font-medium text-gray-500">/ 5</span>
        </div>
      </div>

      {reviewCount > reviews.length && (
        <p className="mt-4 text-xs text-gray-500">
          Son {reviews.length} yorum gösteriliyor · toplam {reviewCount} değerlendirme
        </p>
      )}

      <ul className="mt-4 space-y-4 max-h-[480px] overflow-y-auto pr-1">
        {reviews.map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-brand-50 bg-brand-50/30 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-brand-900 text-sm">{r.author}</p>
                <p className="text-xs text-gray-500">{formatReviewDate(r.date)}</p>
              </div>
              <ProductRatingStars rating={r.rating} size="sm" showValue={false} />
            </div>
            <p className="mt-2 text-sm text-gray-700 leading-relaxed">{r.comment}</p>
            {r.verified && (
              <p className="mt-2 text-xs text-emerald-700 flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" /> Onaylı alıcı
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
