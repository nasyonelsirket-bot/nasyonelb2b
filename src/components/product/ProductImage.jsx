import { useMemo } from 'react';
import { PRODUCT_MEDIA_FRAME, PRODUCT_MEDIA_IMG, getDisplayImageUrl } from '@/utils/productImage';
import { buildImageSrcSet, IMAGE_SIZES } from '@/utils/imageOptimize';

export default function ProductImage({
  src,
  alt = '',
  variant = 'card',
  className = '',
  imgClassName = '',
  loading,
  fetchPriority,
}) {
  const imgLoading = loading ?? (variant === 'detail' ? 'eager' : 'lazy');
  const variantClass =
    variant === 'detail'
      ? 'product-media--detail'
      : variant === 'thumb'
        ? 'product-media--thumb'
        : variant === 'square'
          ? 'product-media--square'
          : 'product-media--card';

  const optimizedSrc = useMemo(
    () => (src ? getDisplayImageUrl(src, variant) : ''),
    [src, variant],
  );

  const srcSet = useMemo(
    () => (src && variant !== 'thumb' ? buildImageSrcSet(src, variant) : undefined),
    [src, variant],
  );

  const sizes = IMAGE_SIZES[variant] || IMAGE_SIZES.card;

  if (!optimizedSrc) {
    return (
      <div className={`${PRODUCT_MEDIA_FRAME} ${variantClass} ${className}`}>
        <span className="text-xs text-gray-400">Görsel yok</span>
      </div>
    );
  }

  return (
    <div className={`${PRODUCT_MEDIA_FRAME} ${variantClass} ${className}`}>
      <img
        src={optimizedSrc}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        loading={imgLoading}
        decoding="async"
        fetchPriority={fetchPriority}
        draggable={false}
        width={variant === 'detail' ? 560 : variant === 'thumb' ? 96 : 320}
        height={variant === 'detail' ? 700 : variant === 'thumb' ? 96 : 400}
        className={`${PRODUCT_MEDIA_IMG} ${imgClassName}`}
      />
    </div>
  );
}
