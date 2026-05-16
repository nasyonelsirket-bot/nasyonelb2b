import { PRODUCT_MEDIA_FRAME, PRODUCT_MEDIA_IMG } from '@/utils/productImage';

export default function ProductImage({
  src,
  alt = '',
  variant = 'card',
  className = '',
  imgClassName = '',
}) {
  const variantClass =
    variant === 'detail'
      ? 'product-media--detail'
      : variant === 'thumb'
        ? 'product-media--thumb'
        : variant === 'square'
          ? 'product-media--square'
          : 'product-media--card';

  if (!src) {
    return (
      <div className={`${PRODUCT_MEDIA_FRAME} ${variantClass} ${className}`}>
        <span className="text-xs text-gray-400">Görsel yok</span>
      </div>
    );
  }

  return (
    <div className={`${PRODUCT_MEDIA_FRAME} ${variantClass} ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        className={`${PRODUCT_MEDIA_IMG} ${imgClassName}`}
      />
    </div>
  );
}
