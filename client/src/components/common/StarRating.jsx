import { Star } from 'lucide-react';

export default function StarRating({
  rating = 0,
  max = 5,
  size = 'sm',
  interactive = false,
  onChange,
  showValue = false,
  count,
}) {
  const iconSize = size === 'lg' ? 'h-5 w-5' : size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  const rounded = Math.round(Number(rating || 0) * 2) / 2;

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center gap-0.5" aria-label={`Rated ${rating} out of ${max} stars`}>
        {Array.from({ length: max }, (_, idx) => {
          const starVal = idx + 1;
          const filled = starVal <= Math.round(rounded);

          if (interactive) {
            return (
              <button
                key={starVal}
                type="button"
                onClick={() => onChange?.(starVal)}
                aria-label={`Select ${starVal} star${starVal > 1 ? 's' : ''}`}
                className="cursor-pointer rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <Star
                  className={`${iconSize} ${filled ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
                />
              </button>
            );
          }

          return (
            <Star
              key={starVal}
              className={`${iconSize} ${filled ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
            />
          );
        })}
      </div>
      {showValue && Number(rating) > 0 && (
        <span className="text-xs font-semibold text-slate-700">{Number(rating).toFixed(1)}</span>
      )}
      {count !== undefined && <span className="text-xs text-slate-500">({count})</span>}
    </div>
  );
}
