import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, ChevronRight, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { getProductByIdOrSlug } from '../../services/productService.js';
import useToast from '../../hooks/useToast.js';
import useCart from '../../hooks/useCart.js';
import { extractApiError, formatCurrency, getDiscountPercent } from '../../utils/formatters.js';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import StarRating from '../../components/common/StarRating.jsx';
import { ErrorState, LoadingSpinner } from '../../components/common/StateBlocks.jsx';
import ProductCard from '../../components/products/ProductCard.jsx';
import ReviewSection from '../../components/products/ReviewSection.jsx';

export default function ProductDetailPage() {
  const { idOrSlug } = useParams();
  const toast = useToast();
  const { addToCart, openCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProductByIdOrSlug(idOrSlug);
      setProduct(data.product);
      setRelatedProducts(data.relatedProducts || []);
      setSelectedImage(data.product.images?.[0]?.imageUrl || data.product.primaryImage || '');
      setQuantity(1);
    } catch (err) {
      setError(extractApiError(err, 'Product not found.'));
    } finally {
      setLoading(false);
    }
  }, [idOrSlug]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <LoadingSpinner label="Loading product details..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState title="Product unavailable" message={error} onRetry={loadProduct} />
      </div>
    );
  }

  const discount = getDiscountPercent(product.price, product.compareAtPrice);
  const outOfStock = product.stockQuantity <= 0;
  const lowStock = !outOfStock && product.stockQuantity <= product.lowStockThreshold;

  const handleAddToCart = async () => {
    if (outOfStock || addingToCart) return;
    setAddingToCart(true);
    try {
      const ok = await addToCart(product, quantity);
      if (ok) {
        openCart();
      }
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
        <Link to="/" className="hover:text-brand-600">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/products" className="hover:text-brand-600">
          Shop
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to={`/products?category=${product.category.slug}`} className="hover:text-brand-600">
          {product.category.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-800">{product.name}</span>
      </nav>

      {/* Main Split Section */}
      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Image Gallery */}
        <div className="space-y-4 lg:col-span-6">
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-stone-100 text-stone-400">
                <ShoppingBag className="h-14 w-14" />
              </div>
            )}
          </div>

          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img) => {
                const isSelected = img.imageUrl === selectedImage;
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedImage(img.imageUrl)}
                    className={`h-20 w-24 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
                      isSelected ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.altText || product.name}
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="lg:col-span-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">{product.category.name}</Badge>
            <span className="text-xs font-mono text-slate-400">SKU: {product.sku}</span>
          </div>

          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <StarRating
              rating={product.averageRating}
              size="md"
              showValue={product.reviewCount > 0}
              count={product.reviewCount}
            />
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-3xl font-extrabold text-slate-900">
              {formatCurrency(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <>
                <span className="text-lg text-slate-400 line-through">
                  {formatCurrency(product.compareAtPrice)}
                </span>
                <Badge variant="success">Save {discount}%</Badge>
              </>
            )}
          </div>

          {/* Stock Indicator */}
          <div className="mt-4">
            {outOfStock ? (
              <Badge variant="danger">Currently Out of Stock</Badge>
            ) : lowStock ? (
              <Badge variant="warning">Low Stock — Only {product.stockQuantity} left</Badge>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <Check className="h-4 w-4" />
                In Stock ({product.stockQuantity} available)
              </span>
            )}
          </div>

          <p className="mt-6 text-sm leading-relaxed text-slate-600">{product.description}</p>

          {/* Quantity + Add to Cart */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="inline-flex h-12 items-center rounded-xl border border-stone-300 bg-white">
              <button
                type="button"
                disabled={outOfStock || quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="flex h-full w-10 cursor-pointer items-center justify-center text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-bold text-slate-900">{quantity}</span>
              <button
                type="button"
                disabled={outOfStock || quantity >= product.stockQuantity}
                onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                aria-label="Increase quantity"
                className="flex h-full w-10 cursor-pointer items-center justify-center text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button
              size="lg"
              disabled={outOfStock}
              loading={addingToCart}
              onClick={handleAddToCart}
              className="flex-1 sm:flex-none sm:min-w-52"
            >
              <ShoppingBag className="h-4 w-4" />
              {outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>

          {/* Fulfillment Guarantees */}
          <div className="mt-8 grid grid-cols-1 gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:grid-cols-2">
            <div className="flex items-center gap-2.5 text-xs text-slate-600">
              <Truck className="h-4 w-4 shrink-0 text-brand-600" />
              Free shipping on orders over $100
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-600">
              <ShieldCheck className="h-4 w-4 shrink-0 text-brand-600" />
              Cash on Delivery & Simulated Checkout
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <ReviewSection productId={product.id} onReviewChanged={loadProduct} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-stone-200 pt-12">
          <h2 className="font-display text-2xl font-bold text-slate-900">More in {product.category.name}</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
