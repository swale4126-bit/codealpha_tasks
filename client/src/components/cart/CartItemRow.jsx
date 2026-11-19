import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters.js';

export default function CartItemRow({ item, onUpdateQuantity, onRemove, compact = false }) {
  return (
    <div className={`flex items-center gap-3.5 ${compact ? 'py-3' : 'py-4 border-b border-stone-200'}`}>
      <Link
        to={`/products/${item.slug}`}
        className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
      >
        {item.primaryImage ? (
          <img
            src={item.primaryImage}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-400">
            <ShoppingBag className="h-6 w-6" />
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          to={`/products/${item.slug}`}
          className="line-clamp-1 text-sm font-bold text-slate-900 hover:text-brand-600"
        >
          {item.name}
        </Link>
        <p className="mt-0.5 text-xs text-slate-500">{formatCurrency(item.price)} each</p>

        <div className="mt-2 flex items-center gap-3">
          {/* Quantity Controls */}
          <div className="inline-flex h-8 items-center rounded-lg border border-stone-200 bg-white">
            <button
              type="button"
              disabled={item.quantity <= 1}
              onClick={() => onUpdateQuantity(item, item.quantity - 1)}
              aria-label="Decrease quantity"
              className="flex h-full w-7 cursor-pointer items-center justify-center text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-7 text-center text-xs font-bold text-slate-900">{item.quantity}</span>
            <button
              type="button"
              disabled={item.stockQuantity && item.quantity >= item.stockQuantity}
              onClick={() => onUpdateQuantity(item, item.quantity + 1)}
              aria-label="Increase quantity"
              className="flex h-full w-7 cursor-pointer items-center justify-center text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item)}
            aria-label="Remove item from cart"
            className="cursor-pointer text-slate-400 transition-colors hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="text-right">
        <span className="font-display text-sm font-bold text-slate-900">
          {formatCurrency(item.lineTotal || item.price * item.quantity)}
        </span>
      </div>
    </div>
  );
}
