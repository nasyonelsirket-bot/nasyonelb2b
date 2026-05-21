import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingBag, Trash2, ArrowRight, Truck } from 'lucide-react';
import Button from '@/components/ui/Button';
import QuantityControls from '@/components/product/QuantityControls';
import ProductImage from '@/components/product/ProductImage';
import { useCart } from '@/context/CartContext';
import { getCartSubtotal, getEffectiveUnitPrice } from '@/utils/cartLinePricing';
import { getFreeShippingStatus } from '@/utils/cartShipping';
import { formatPrice } from '@/utils/whatsapp';

export default function HomeCartDrawer({ open, onClose }) {
  const { items, totalItems, totalPrice, removeFromCart, setQuantity, increment, decrement } =
    useCart();

  const subtotal = getCartSubtotal(items);
  const shipping = getFreeShippingStatus(subtotal);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label="Sepet önizleme">
      <button
        type="button"
        className="absolute inset-0 bg-brand-950/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Kapat"
      />

      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-slide-up">
        <header className="flex items-center justify-between border-b border-brand-100 px-4 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-accent-gold" />
            <div>
              <h2 className="font-display text-lg font-bold text-brand-900">Sepetiniz</h2>
              <p className="text-xs text-gray-500">{totalItems} ürün</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-brand-600 hover:bg-brand-50"
            aria-label="Sepeti kapat"
          >
            <X className="h-6 w-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {!items.length ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-14 w-14 mx-auto text-brand-200" />
              <p className="mt-4 text-gray-600">Sepetiniz boş</p>
              <Button variant="primary" className="mt-4" onClick={onClose}>
                Ürünlere göz at
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => {
                const unit = getEffectiveUnitPrice(item);
                return (
                  <li
                    key={item.id}
                    className="flex gap-3 rounded-xl border border-brand-100 bg-brand-50/40 p-3"
                  >
                    <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-brand-100 bg-white">
                      <ProductImage src={item.image} alt="" variant="thumb" className="!w-full !h-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-brand-900 line-clamp-2">{item.name}</p>
                      <p className="text-sm font-bold text-brand-700 mt-0.5">
                        {formatPrice(unit)} × {item.quantity}
                      </p>
                      <div className="mt-2 max-w-[200px]">
                        <QuantityControls
                          quantity={item.quantity}
                          onChange={(q) => setQuantity(item.id, q)}
                          onIncrement={(n) => increment(item.id, n)}
                          onDecrement={(n) => decrement(item.id, n)}
                          compact
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="self-start p-1 text-red-500 hover:text-red-700"
                      aria-label="Kaldır"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-brand-100 bg-gradient-to-t from-brand-50 to-white p-4 space-y-3 safe-area-pb">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3">
              <p className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                <Truck className="h-4 w-4" />
                {shipping.eligible
                  ? 'Kargo bedava!'
                  : `${formatPrice(shipping.remaining)} daha — kargo bedava`}
              </p>
              {!shipping.eligible && (
                <div className="mt-2 h-2 rounded-full bg-white overflow-hidden border border-emerald-200">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${shipping.progressPercent}%` }}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between text-base font-bold text-brand-900">
              <span>Ara toplam</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Alışverişe devam
              </Button>
              <Link to="/sepet" onClick={onClose} className="block">
                <Button type="button" variant="gold" className="w-full">
                  Ödemeye geç
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <Link
              to="/sepet"
              onClick={onClose}
              className="block text-center text-sm font-semibold text-brand-700 hover:text-brand-900"
            >
              Tam sepet sayfasını aç →
            </Link>
          </footer>
        )}
      </aside>
    </div>
  );
}
