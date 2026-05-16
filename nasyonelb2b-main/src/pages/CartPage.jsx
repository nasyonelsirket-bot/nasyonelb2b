import { Link } from 'react-router-dom';
import { MessageCircle, Trash2, AlertTriangle, Sparkles } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import Button from '@/components/ui/Button';
import QuantityControls from '@/components/product/QuantityControls';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { formatPrice, openWhatsApp } from '@/utils/whatsapp';

const MARKETING = [
  'Size özel iskonto için siparişinizi WhatsApp üzerinden gönderin.',
  'Toplu siparişlerde ek indirim uygulanabilir.',
  'Bayi temsilcimiz sizinle iletişime geçecektir.',
];

export default function CartPage() {
  const { items, totalPrice, minOrderViolations, isCartValid, removeFromCart, setQuantity, increment, decrement, clearCart } = useCart();
  const { settings } = useStore();

  const handleWhatsApp = () => {
    if (!isCartValid) return;
    openWhatsApp(settings.whatsappNumber, items);
  };

  if (!items.length) {
    return (
      <>
        <SEO title="Sepet" path="/sepet" />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <p className="text-xl text-gray-500">Sepetiniz boş</p>
          <Link to="/kategoriler">
            <Button variant="primary" className="mt-6">Ürünlere Göz At</Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Sepet" path="/sepet" noindex />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-brand-900">Sepetim</h1>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 rounded-2xl border border-brand-100 bg-white p-4 shadow-card">
                <img src={item.image} alt="" className="h-24 w-24 rounded-lg object-cover" />
                <div className="flex-1">
                  <h3 className="font-semibold text-brand-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                  <p className="text-brand-700 font-bold mt-1">{formatPrice(item.price)}</p>
                  {(item.minOrder || 1) > 1 && (
                    <p className="text-xs text-brand-600 mt-1">Min. sipariş: {item.minOrder} adet</p>
                  )}
                  <div className="mt-3 max-w-xs">
                    <QuantityControls
                      quantity={item.quantity}
                      minOrder={item.minOrder || 1}
                      onChange={(q) => setQuantity(item.id, q)}
                      onIncrement={(n) => increment(item.id, n)}
                      onDecrement={(n) => decrement(item.id, n)}
                      compact
                    />
                  </div>
                </div>
                <button type="button" onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 p-2">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={clearCart} className="text-sm text-gray-500 hover:text-red-600">
              Sepeti Temizle
            </button>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6 shadow-card">
              <h2 className="font-display font-bold text-brand-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent-gold" /> Sipariş Özeti
              </h2>
              <p className="mt-4 text-3xl font-bold text-brand-700">{formatPrice(totalPrice)}</p>
              <p className="text-sm text-gray-500 mt-1">{items.length} ürün çeşidi</p>

              {minOrderViolations.length > 0 && (
                <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                    <AlertTriangle className="h-4 w-4" /> Minimum sipariş uyarısı
                  </p>
                  <ul className="mt-2 text-xs text-amber-700 space-y-1">
                    {minOrderViolations.map((v) => (
                      <li key={v.id}>
                        {v.name}: min {v.minOrder} adet (şu an {v.quantity})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                variant="whatsapp"
                size="lg"
                className="mt-6 w-full"
                onClick={handleWhatsApp}
                disabled={!isCartValid}
              >
                <MessageCircle className="h-5 w-5" />
                Siparişi WhatsApp ile Gönder
              </Button>
            </div>

            <div className="rounded-2xl bg-brand-900 text-white p-6 space-y-3">
              {MARKETING.map((text) => (
                <p key={text} className="text-sm text-brand-100 flex items-start gap-2">
                  <span className="text-accent-gold mt-0.5">✦</span> {text}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
