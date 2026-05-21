import { Star } from 'lucide-react';

export default function ProductRatingStars({ rating = 0, size = 'sm', showValue = true }) {
  const avg = Math.min(5, Math.max(0, Number(rating) || 0));
  const full = Math.floor(avg);
  const half = avg - full >= 0.35;
  const icon =
    size === 'lg' ? 'h-5 w-5' : size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${avg} üzerinden 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = i < full || (i === full && half);
        return (
          <Star
            key={i}
            className={`${icon} ${filled ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
          />
        );
      })}
      {showValue && avg > 0 && (
        <span className="ml-1 text-xs font-semibold text-brand-800 tabular-nums">
          {avg.toFixed(1)}
        </span>
      )}
    </span>
  );
}
