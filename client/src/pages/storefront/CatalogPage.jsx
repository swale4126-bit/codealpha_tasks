import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce.js';
import { getCategories } from '../../services/categoryService.js';
import { getProducts } from '../../services/productService.js';
import { extractApiError } from '../../utils/formatters.js';
import Button from '../../components/common/Button.jsx';
import ProductCard from '../../components/products/ProductCard.jsx';
import ProductSkeleton from '../../components/products/ProductSkeleton.jsx';
import { EmptyState, ErrorState } from '../../components/common/StateBlocks.jsx';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 9, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const initialSearch = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchInput, 350);

  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const minRating = searchParams.get('minRating') || '';
  const inStock = searchParams.get('inStock') === 'true';
  const featured = searchParams.get('featured') === 'true';
  const sort = searchParams.get('sort') || 'newest';
  const page = Math.max(Number(searchParams.get('page')) || 1, 1);

  useEffect(() => {
    setSearchInput(searchParams.get('search') || '');
  }, [searchParams]);

  const updateParam = useCallback(
    (updates, resetPage = true) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === '' || value === false || value === null || value === undefined) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });
      if (resetPage) {
        next.delete('page');
      }
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  // Sync debounced search input into URL query string
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (debouncedSearch !== urlSearch) {
      updateParam({ search: debouncedSearch });
    }
  }, [debouncedSearch, searchParams, updateParam]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getProducts({
        search: searchParams.get('search') || undefined,
        category: category || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        minRating: minRating || undefined,
        inStock: inStock ? 'true' : undefined,
        featured: featured ? 'true' : undefined,
        sort,
        page,
        limit: 9,
      });
      setProducts(result.products);
      setMeta(result.meta);
    } catch (err) {
      setError(extractApiError(err, 'Failed to load catalog products.'));
    } finally {
      setLoading(false);
    }
  }, [searchParams, category, minPrice, maxPrice, minRating, inStock, featured, sort, page]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const hasActiveFilters = Boolean(
    searchParams.get('search') || category || minPrice || maxPrice || minRating || inStock || featured
  );

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header Row */}
      <div className="flex flex-col gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
            {category
              ? categories.find((c) => c.slug === category)?.name || 'Category Catalog'
              : featured
                ? 'Featured Products'
                : 'Shop Catalog'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading
              ? 'Loading products...'
              : `Showing ${products.length} of ${meta.total} available ${meta.total === 1 ? 'product' : 'products'}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className="lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>

          <div className="flex items-center gap-2">
            <label htmlFor="catalog-sort" className="text-xs font-semibold text-slate-600">
              Sort by
            </label>
            <select
              id="catalog-sort"
              value={sort}
              onChange={(e) => updateParam({ sort: e.target.value })}
              className="h-9 rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-slate-800 focus:border-brand-500 focus:outline-none"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Sidebar Filters */}
        <aside
          className={`space-y-6 lg:col-span-3 ${mobileFiltersOpen ? 'block' : 'hidden lg:block'}`}
        >
          <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Filter Products</h2>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="cursor-pointer text-xs font-semibold text-brand-600 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Search */}
            <div>
              <label htmlFor="filter-search" className="block text-xs font-semibold text-slate-700">
                Keyword or SKU
              </label>
              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="filter-search"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search catalog..."
                  className="h-10 w-full rounded-xl border border-stone-300 pr-8 pl-9 text-sm focus:border-brand-500 focus:outline-none"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Categories */}
            <div>
              <p className="text-xs font-semibold text-slate-700">Department</p>
              <div className="mt-2 space-y-1">
                <button
                  type="button"
                  onClick={() => updateParam({ category: '' })}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm ${
                    !category
                      ? 'bg-brand-50 font-semibold text-brand-700'
                      : 'text-slate-600 hover:bg-stone-100'
                  }`}
                >
                  <span>All Departments</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => updateParam({ category: cat.slug })}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm ${
                      category === cat.slug
                        ? 'bg-brand-50 font-semibold text-brand-700'
                        : 'text-slate-600 hover:bg-stone-100'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="text-xs text-slate-400">{cat.productCount}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <p className="text-xs font-semibold text-slate-700">Price Range (USD)</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="Min $"
                  value={minPrice}
                  onChange={(e) => updateParam({ minPrice: e.target.value })}
                  className="h-9 w-full rounded-xl border border-stone-300 px-3 text-sm focus:border-brand-500 focus:outline-none"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Max $"
                  value={maxPrice}
                  onChange={(e) => updateParam({ maxPrice: e.target.value })}
                  className="h-9 w-full rounded-xl border border-stone-300 px-3 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Minimum Rating */}
            <div>
              <label htmlFor="filter-rating" className="block text-xs font-semibold text-slate-700">
                Minimum Rating
              </label>
              <select
                id="filter-rating"
                value={minRating}
                onChange={(e) => updateParam({ minRating: e.target.value })}
                className="mt-1.5 h-9 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="">Any rating</option>
                <option value="4">4+ stars</option>
                <option value="4.5">4.5+ stars</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="space-y-2.5 border-t border-stone-100 pt-4">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => updateParam({ inStock: e.target.checked })}
                  className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                />
                In stock only
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => updateParam({ featured: e.target.checked })}
                  className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                />
                Featured picks only
              </label>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-9">
          {error ? (
            <ErrorState message={error} onRetry={fetchCatalog} />
          ) : loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="No products match your filters"
              description="Try widening your price range, clearing the keyword search, or exploring another department."
              action={
                <Button variant="outline" onClick={clearAllFilters}>
                  Reset Filters
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <nav
                  aria-label="Catalog pagination"
                  className="mt-10 flex items-center justify-between border-t border-stone-200 pt-6"
                >
                  <p className="text-xs font-medium text-slate-500">
                    Page {meta.page} of {meta.totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.page <= 1}
                      onClick={() => updateParam({ page: meta.page - 1 }, false)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.page >= meta.totalPages}
                      onClick={() => updateParam({ page: meta.page + 1 }, false)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
