import { useMemo, useState } from 'react';
import { MessageSquare, ThumbsUp } from 'lucide-react';
import Button from '@/components/ui/Button';
import ProductRatingStars from '@/components/product/ProductRatingStars';
import {
  getAllProductReviews,
  addCustomReview,
} from '@/utils/productReviews';

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
  const [refresh, setRefresh] = useState(0);
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { reviews, ratingAvg, reviewCount } = useMemo(() => {
    void refresh;
    return getAllProductReviews(product);
  }, [product, refresh]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addCustomReview(product.id, { author, rating, comment });
    setComment('');
    setSubmitted(true);
    setRefresh((n) => n + 1);
    setTimeout(() => setSubmitted(false), 4000);
  };

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

      <ul className="mt-6 space-y-4 max-h-[480px] overflow-y-auto pr-1">
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

      <form onSubmit={handleSubmit} className="mt-8 rounded-xl border border-amber-200 bg-amber-50/50 p-5 space-y-4">
        <h3 className="font-semibold text-brand-900">Siz de değerlendirin</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-brand-800">Adınız (isteğe bağlı)</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
              placeholder="Örn: Ayşe K."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-brand-800">Puanınız</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} yıldız
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-brand-800">Yorumunuz *</label>
          <textarea
            rows={3}
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
            placeholder="Ürün hakkındaki deneyiminizi paylaşın..."
          />
        </div>
        {submitted && (
          <p className="text-sm text-emerald-800">Teşekkürler! Değerlendirmeniz yayınlandı.</p>
        )}
        <Button type="submit" variant="primary" size="sm">
          Değerlendirmeyi gönder
        </Button>
      </form>
    </section>
  );
}
