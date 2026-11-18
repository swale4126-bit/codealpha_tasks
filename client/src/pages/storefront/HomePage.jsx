import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { getCategories } from '../../services/categoryService.js';
import { getProducts } from '../../services/productService.js';
import { extractApiError } from '../../utils/formatters.js';
import ProductCard from '../../components/products/ProductCard.jsx';
import ProductSkeleton from '../../components/products/ProductSkeleton.jsx';
import { ErrorState } from '../../components/common/StateBlocks.jsx';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHomeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catList, prodResult] = await Promise.all([
        getCategories(),
        getProducts({ featured: true, limit: 6 }),
      ]);
      setCategories(catList);
      setFeaturedProducts(prodResult.products);
    } catch (err) {
      setError(extractApiError(err, 'Could not load storefront data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative overflow-hidden border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-20">
          <div className="lg:col-span-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              <Sparkles className="h-3.5 w-3.5" />
              Curated Everyday Essentials
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Thoughtful design for work, home, and daily life.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
              Discover precision audio, ergonomic workspace upgrades, minimalist home lighting, and
              durable travel gear—backed by real-time stock tracking and transparent fulfillment.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/products"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-600"
              >
                Explore Catalog
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/products?featured=true"
                className="inline-flex h-12 items-center rounded-xl border border-stone-300 bg-white px-6 text-sm font-semibold text-slate-800 transition-colors hover:bg-stone-50"
              >
                Featured Picks
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"
                  alt="KoraSound ANC Wireless Headphones"
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
              <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80"
                  alt="TactilePro Mechanical Keyboard"
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="border-b border-stone-200 bg-stone-50">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Free Shipping Over $100</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Fast tracked dispatch with live status updates from pending to delivered.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Transparent Demo Checkout</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Choose Cash on Delivery or Simulated Demo Payment with instant inventory verification.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Verified Shopper Reviews</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Real ratings and feedback across every department to help you shop confidently.
              </p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <ErrorState message={error} onRetry={fetchHomeData} />
        </div>
      ) : (
        <>
          {/* Shop by Category */}
          <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                  Shop by Department
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Explore all {categories.length || 6} curated collections.
                </p>
              </div>
              <Link
                to="/products"
                className="text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                View all &rarr;
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loading
                ? Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={i}
                      className="h-32 animate-pulse rounded-2xl border border-stone-200 bg-white"
                    />
                  ))
                : categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/products?category=${cat.slug}`}
                      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 transition-all hover:border-brand-500/40 hover:shadow-sm"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                        {cat.imageUrl && (
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-bold text-slate-900 group-hover:text-brand-600">
                          {cat.name}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {cat.description}
                        </p>
                        <p className="mt-2 text-xs font-semibold text-brand-600">
                          {cat.productCount} {cat.productCount === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                    </Link>
                  ))}
            </div>
          </section>

          {/* Featured Products */}
          <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                  Featured Products
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Top-rated bestsellers handpicked from our catalog.
                </p>
              </div>
              <Link
                to="/products"
                className="text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Browse full catalog &rarr;
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {loading
                ? Array.from({ length: 6 }, (_, i) => <ProductSkeleton key={i} />)
                : featuredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
