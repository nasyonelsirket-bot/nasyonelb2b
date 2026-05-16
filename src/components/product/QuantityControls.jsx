import { Minus, Plus } from 'lucide-react';

const QUICK_ADD = [1, 10, 50, 100];

export default function QuantityControls({
  quantity,
  minOrder = 1,
  minOrderHint,
  onChange,
  onIncrement,
  onDecrement,
  compact = false,
  showBulk = false,
}) {
  const handleChange = (val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    onChange(num);
  };

  const setToMin = () => onChange(minOrder);

  return (
    <div className={`space-y-2 ${compact ? '' : 'w-full'}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onDecrement(1)}
          disabled={quantity <= 0}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-200 bg-white text-brand-700 hover:bg-brand-50 disabled:opacity-40"
          aria-label="Azalt"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          min={minOrder}
          value={quantity}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => {
            if (quantity < minOrder && quantity > 0) onChange(minOrder);
          }}
          className="h-9 w-16 rounded-lg border border-brand-200 text-center text-sm font-semibold text-brand-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <button
          type="button"
          onClick={() => onIncrement(1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
          aria-label="Artır"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {(!compact || showBulk) && (
        <div className="flex flex-wrap gap-1.5">
          {QUICK_ADD.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onIncrement(n)}
              className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
            >
              +{n}
            </button>
          ))}
        </div>
      )}

      {quantity > 0 && quantity < minOrder && (
        <p className="text-xs text-amber-600 font-medium">
          {minOrderHint || `Minimum ${minOrder} adet`} —{' '}
          <button type="button" onClick={setToMin} className="underline">
            Minimuma getir
          </button>
        </p>
      )}
    </div>
  );
}
