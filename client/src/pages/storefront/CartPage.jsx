import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShieldCheck, ShoppingBag, Trash2, Truck } from 'lucide-react';
import useCart from '../../hooks/useCart.js';
import { formatCurrency } from '../../utils/formatters.js';
import Button from '../../components/common/Button.jsx';
import CartItemRow from '../../components/cart/CartItemRow.jsx';
import { EmptyState } from '../../components/common/StateBlocks.jsx';

export default function CartPage() {
  const { cart, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  const freeShippingThreshold = 100;
  const remainingForFree = Math.max(0, freeShippingThreshold - cart.subtotal);
  const freePct = Math.min(100, Math.round((cart.subtotal / freeShippingThreshold) * 100));

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          icon={ShoppingBag}
          title="Your shopping cart is empty"
          description="Looks like you haven't added anything to your cart yet. Explore our curated collections to find essentials for work, audio, and living."
          action={
            <Link
              to="/products"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Browse Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-stone-200 pb-6 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900">Shopping Cart</h1>
          <p className="mt-1 text-sm text-slate-500">
            {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear Cart
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Items List */}
        <div className="lg:col-span-8">
          {/* Free Shipping Banner */}
          <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50/70 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-brand-900">
              <Truck className="h-4 w-4 shrink-0 text-brand-600" />
              {remainingForFree > 0 ? (
                <span>
                  Add <strong className="font-bold">{formatCurrency(remainingForFree)}</strong> more to your order to unlock Free Standard Shipping!
                </span>
              ) : (
                <span className="font-bold text-emerald-800">
                  Congratulations! You unlocked Free Standard Shipping on this order.
                </span>
              )}
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-brand-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${freePct}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            {cart.items.map((item) => (
              <CartItemRow
                key={item.itemId || item.productId}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          <div className="mt-6">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-xs font-semibold text-brand-600 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary Panel */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900">Order Summary</h2>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(cart.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Shipping</span>
                <span className="font-semibold">
                  {cart.shippingFee === 0 ? (
                    <span className="text-emerald-700">FREE</span>
                  ) : (
                    formatCurrency(cart.shippingFee)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax (8%)</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(cart.taxAmount)}
                </span>
              </div>
              <div className="border-t border-stone-200 pt-3 flex justify-between text-base">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-display text-xl font-extrabold text-slate-900">
                  {formatCurrency(cart.totalAmount)}
                </span>
              </div>
            </div>

            <Button size="lg" onClick={() => navigate('/checkout')} className="w-full">
              Proceed to Checkout
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              Cash on Delivery & Simulated Demo Payment
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
