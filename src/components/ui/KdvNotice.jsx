export default function KdvNotice({ className = '' }) {
  return (
    <p className={`text-xs text-amber-800/90 ${className}`}>
      * Ürün fiyatlarımıza KDV dahil değildir.
    </p>
  );
}
