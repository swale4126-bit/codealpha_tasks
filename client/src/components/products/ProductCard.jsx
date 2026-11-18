import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import StarRating from '../common/StarRating.jsx';
import { formatCurrency, getDiscountPercent } from '../../utils/formatters.js';

export default function ProductCard({ product, onQuickAdd }) {
  const discount = getDiscountPercent(product.price, product.compareAtPrice);
  const outOfStock = product.stockQuantity <= 0;
  const lowStock = !outOfStock && product.stockQuantity <= product.lowStockThreshold;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white transition-all hover:border-stone-300 hover:shadow-md">
      <Link
        to={`/products/${product.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-stone-100"
      >
        {product.primaryImage ? (
          <img
            src={product.primaryImage}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-400">
            <ShoppingBag className="h-10 w-10" />
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {discount > 0 && <Badge variant="brand">Save {discount}%</Badge>}
          {outOfStock && <Badge variant="danger">Out of Stock</Badge>}
          {lowStock && <Badge variant="warning">Only {product.stockQuantity} left</Badge>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link
          to={`/products?category=${product.category.slug}`}
          className="text-xs font-semibold uppercase tracking-wider text-brand-600 hover:underline"
        >
          {product.category.name}
        </Link>

        <Link to={`/products/${product.slug}`} className="mt-1.5">
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-slate-900 group-hover:text-brand-600">
            {product.name}
          </h3>
        </Link>

        {product.shortDescription && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
            {product.shortDescription}
          </p>
        )}

        <div className="mt-3">
          <StarRating
            rating={product.averageRating}
            showValue={product.reviewCount > 0}
            count={product.reviewCount}
          />
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold text-slate-900">
              {formatCurrency(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-slate-400 line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>

          {onQuickAdd ? (
            <button
              type="button"
              disabled={outOfStock}
              onClick={() => onQuickAdd(product)}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-brand-500 px-3 text-xs font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-slate-500"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Add
            </button>
          ) : (
            <Link
              to={`/products/${product.slug}`}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              View details &rarr;
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
