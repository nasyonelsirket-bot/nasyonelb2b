import { Link } from 'react-router-dom';
import { Gift, Plus, Tag, ExternalLink, Package, Sparkles } from 'lucide-react';
import { getProductPath } from '@/utils/productSeo';
import Button from '@/components/ui/Button';
import ProductImage from '@/components/product/ProductImage';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { normalizePromotions } from '@/utils/promotions';
import { getCartUpsellOffers } from '@/utils/cartUpsell';
import { getCartSubtotal, getEffectiveUnitPrice } from '@/utils/cartLinePricing';
import { formatPrice } from '@/utils/whatsapp';
import { HIGH_VALUE_DISCOUNT_THRESHOLD_TL } from '@/constants/commerceCopy';

function UpsellCard({ bundle, onAdd, compact }) {
  if (!bundle?.picked?.[0]) return null;

  const line = bundle.picked[0];
  const { product, quantity, promo } = line;
  const discounted = promo
    ? getEffectiveUnitPrice({ ...product, upsellPromo: promo })
    : Number(product.price) || 0;
  const listPrice = Number(product.price) || 0;
  const productUrl = getProductPath(product);

  return (
    <div className="space-y-2">
      <Link
        to={productUrl}
        className={`flex gap-3 rounded-xl border border-brand-100 bg-white p-2.5 shadow-sm hover:border-brand-300 hover:shadow-md transition-all group ${
          compact ? '' : 'sm:p-3'
        }`}
      >
        <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-brand-50">
          <ProductImage src={product.image} alt="" variant="thumb" className="!w-full !h-full" />
        </div>
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          {bundle.discountPercent > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-orange-700 bg-orange-100 rounded px-1.5 py-0.5 w-fit mb-1">
              <Tag className="h-3 w-3" />
              %{bundle.discountPercent} indirim
            </span>
          )}
          <p className="text-sm font-medium text-brand-900 line-clamp-2 leading-snug group-hover:text-brand-700">
            {product.name}
          </p>
          <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
            {listPrice > discounted && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(listPrice)}</span>
            )}
            <span className="text-base font-bold text-brand-800">{formatPrice(discounted)}</span>
            {quantity > 1 && (
              <span className="text-xs text-gray-500">× {quantity} adet</span>
            )}
          </div>
        </div>
      </Link>

      <Button
        type="button"
        variant="primary"
        size={compact ? 'sm' : 'md'}
        className="w-full text-xs sm:text-sm"
        onClick={(e) => onAdd(e, line)}
      >
        <Plus className="h-4 w-4" />
        Sepete ekle ({quantity} adet)
      </Button>
    </div>
  );
}

function UpsellBlock({ icon: Icon, tone, headline, subline, bundle, onAdd, compact }) {
  if (!bundle) return null;

  return (
    <div
      className={`rounded-2xl border-2 border-dashed animate-slide-up ${tone} ${
        compact ? 'p-3 space-y-2' : 'p-4 space-y-3'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display font-bold text-brand-900 text-sm leading-tight">{headline}</h3>
          <p className="text-xs text-brand-700 mt-0.5">{subline}</p>
        </div>
      </div>
      <UpsellCard bundle={bundle} onAdd={onAdd} compact={compact} />
    </div>
  );
}

export default function CartUpsellPanel({ compact = false }) {
  const { items, addUpsellToCart, addToCart } = useCart();
  const { products, settings } = useStore();
  const promos = normalizePromotions(settings?.promotions);

  const subtotal = getCartSubtotal(items);
  const offers = getCartUpsellOffers(items, products, subtotal, promos);

  const handleAdd = (e, line) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const { product, quantity, promo } = line;
    if (promo) {
      addUpsellToCart(product, quantity, { promo, upsellDiscountPercent: 5 });
    } else {
      addToCart(product, quantity);
    }
  };

  if (!items.length) return null;

  const blocks = [];

  if (offers.minQty) {
    blocks.push(
      <UpsellBlock
        key="min-qty"
        icon={Package}
        tone="border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50/40 to-white"
        headline={offers.minQty.headline}
        subline={offers.minQty.message}
        bundle={offers.minQty}
        onAdd={handleAdd}
        compact={compact}
      />,
    );
  }

  if (offers.highValue && subtotal < HIGH_VALUE_DISCOUNT_THRESHOLD_TL) {
    blocks.push(
      <UpsellBlock
        key="high-value"
        icon={Sparkles}
        tone="border-violet-300 bg-gradient-to-br from-violet-50 via-purple-50/40 to-white"
        headline={offers.highValue.headline}
        subline={offers.highValue.message}
        bundle={offers.highValue}
        onAdd={handleAdd}
        compact={compact}
      />,
    );
  }

  if (offers.bundle && offers.eligible) {
    const b = offers.bundle;
    blocks.push(
      <UpsellBlock
        key="admin-bundle"
        icon={Gift}
        tone="border-emerald-300 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white"
        headline={b.ruleTitle || 'Birlikte al önerisi'}
        subline={b.message || 'Sepete özel öneri'}
        bundle={b}
        onAdd={handleAdd}
        compact={compact}
      />,
    );
  }

  if (!blocks.length) return null;

  return <div className="space-y-3">{blocks}</div>;
}
