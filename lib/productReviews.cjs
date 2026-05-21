const { REVIEWS_VERSION, generateProductReviews } = require('./productReviewGenerator.cjs');

function extractTrendyolRating(item) {
  const r =
    item?.rating?.averageRating ??
    item?.averageRating ??
    item?.ratingScore ??
    item?.productRating?.averageRating;
  const count =
    item?.rating?.totalCount ??
    item?.rating?.count ??
    item?.reviewCount ??
    item?.ratingCount ??
    item?.productRating?.count;
  const avg = Number(r);
  const cnt = Number(count);
  if (avg > 0 && avg <= 5) return { avg: Math.round(avg * 10) / 10, count: cnt > 0 ? cnt : 0 };
  return null;
}

function enrichProductReviews(product) {
  if (!product || typeof product !== 'object') return product;

  const hasCurrentReviews =
    product.reviewsVersion === REVIEWS_VERSION &&
    Array.isArray(product.reviews) &&
    product.reviews.length >= 8;

  if (hasCurrentReviews) {
    const avg =
      product.ratingAvg ??
      product.reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / product.reviews.length;
    return {
      ...product,
      ratingAvg: Math.round(avg * 10) / 10,
      reviewCount: product.reviewCount ?? product.reviews.length,
    };
  }

  const data = generateProductReviews(product);
  return { ...product, ...data };
}

module.exports = { extractTrendyolRating, generateProductReviews, enrichProductReviews };
