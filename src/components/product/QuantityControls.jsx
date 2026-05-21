import { Minus, Plus } from 'lucide-react';

export default function QuantityControls({
  quantity,
  onChange,
  onIncrement,
  onDecrement,
  compact = false,
}) {
  const handleChange = (val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    onChange(num);
  };

  return (
    <div className={`space-y-2 ${compact ? '' : 'w-full'}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onDecrement(1)}
          disabled={quantity <= 1}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-200 bg-white text-brand-700 hover:bg-brand-50 disabled:opacity-40"
          aria-label="Azalt"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => {
            if (quantity < 1 && quantity > 0) onChange(1);
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
    </div>
  );
}
